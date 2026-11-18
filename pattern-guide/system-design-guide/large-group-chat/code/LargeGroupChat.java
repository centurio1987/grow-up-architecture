import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.TreeMap;

enum Kind { FORWARD, ROOM, RELAY, OPEN, RESUME, READ_DONE, STOP }
enum Mode { GUIDE, ALL_WATCHING, DIRECT, RELAY_ORDER, NO_JITTER, PUBSUB_ONLY }
record Ev(long at, long seq, Kind kind, int a, long b) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;
    void schedule(long at, Kind kind, int a, long b) { queue.add(new Ev(at, seq++, kind, a, b)); }
    Ev next() { return queue.poll(); }
}

final class RoomLog {
    private final ArrayList<Long> writtenAt = new ArrayList<>();
    void append(long at) { writtenAt.add(at); }
    long lastWritten(long now) {
        int i = writtenAt.size();
        while (i > 0 && writtenAt.get(i - 1) > now) i--;
        return i;
    }
}

final class Catchup {
    long upto, newest;
    boolean recovering;
}

public final class LargeGroupChat {
    static final int ONLINE = 1_000_000, SIZE = 15_000, RELAYS = 67, PER_MS = 100, MAXLEN = 100_000;
    static final int PASSIVE = 0, WATCHING = 1, AWAY_WATCHING = 2;
    static final String[] LABEL = {"guide", "all-watching", "direct", "relay-order", "no-jitter", "pubsub-only"};
    static final long APP_NET = 50, DC_NET = 1, GAP = 50, JITTER = 5_000;

    final Mode mode;
    final int every;
    final int[] relayOf = new int[ONLINE], last = new int[ONLINE], watchers = new int[RELAYS], members = new int[RELAYS];
    final byte[] state = new byte[ONLINE];
    final boolean[] catching = new boolean[ONLINE], down = new boolean[RELAYS];
    final long[] relayBusy = new long[RELAYS];
    final ArrayList<ArrayList<Integer>> joiners = new ArrayList<>();
    final HashMap<Integer, Catchup> catchups = new HashMap<>();
    final HashMap<Integer, String> names = new HashMap<>();
    final HashMap<Integer, StringBuilder> seen = new HashMap<>();
    final ArrayList<Long> sentAt = new ArrayList<>(), messageOfSeq = new ArrayList<>();
    final ArrayList<Integer> senderOf = new ArrayList<>();
    final TreeMap<Long, Integer> resumesPerSecond = new TreeMap<>(), readsPerSecond = new TreeMap<>();
    final VirtualClock clock = new VirtualClock();
    final RoomLog log = new RoomLog();
    boolean trace;
    final int follow;
    long seed = 2026, seq, roomBusy, since, delayFirst, delayMax;
    long roomSends, relaySends, skipped, dropped, filled, trimmed, logReads, resumes, lost, gapSessions, recoveredMax;

    LargeGroupChat(Mode mode, int follow, String name) {
        this.mode = mode;
        this.follow = follow;
        names.put(follow, name);
        every = mode == Mode.ALL_WATCHING ? 1 : 10;
        for (int r = 0; r < RELAYS; r++) joiners.add(new ArrayList<>());
        for (int s = 0; s < ONLINE; s++) {
            relayOf[s] = s / SIZE;
            state[s] = (byte) (s % every == 0 ? WATCHING : PASSIVE);
            members[relayOf[s]]++;
            if (state[s] == WATCHING) watchers[relayOf[s]]++;
        }
    }

    String name(int s) { return names.getOrDefault(s, "U" + s); }
    long cost(long n) { return (n + PER_MS - 1) / PER_MS; }
    void say(long at, String what) { System.out.println("t=" + at + "ms " + what); }
    void bump(TreeMap<Long, Integer> per, long now) { per.merge(now / 1_000, 1, Integer::sum); }
    int peak(TreeMap<Long, Integer> per) { return per.values().stream().max(Integer::compare).orElse(0); }

    int below(int n) {
        seed = seed * 48_271 % 2_147_483_647;
        return (int) (seed % n);
    }

    void post(long at, int sender) {
        if (trace) say(at, name(sender) + " app: sends a message on its WebSocket");
        senderOf.add(sender);
        sentAt.add(at);
        clock.schedule(at + APP_NET, Kind.FORWARD, relayOf[sender], senderOf.size() - 1);
    }

    void traffic(int count) {
        for (int k = 0; k < count; k++) post(k * GAP, SIZE + 10 * below((ONLINE - SIZE) / 10));
    }

    void forward(long now, int r, long k) {
        if (mode == Mode.RELAY_ORDER) {
            for (int o = 0; o < RELAYS; o++) clock.schedule(o == r ? now : now + DC_NET, Kind.RELAY, o, k);
            return;
        }
        if (trace) say(now, "relay " + (r + 1) + ": passes " + name(senderOf.get((int) k)) + "'s message to the room process");
        clock.schedule(now + DC_NET, Kind.ROOM, 0, k);
    }

    void room(long now, long k) {
        long start = Math.max(now, roomBusy);
        seq++;
        messageOfSeq.add(k);
        if (mode == Mode.DIRECT) {
            roomBusy = start + cost(ONLINE);
            roomSends += ONLINE;
            arrived(k, roomBusy + DC_NET + APP_NET);
            return;
        }
        log.append(start + DC_NET);
        roomBusy = start + 2 * DC_NET + cost(RELAYS);
        roomSends += RELAYS;
        if (trace) say(start, "room: gives it seq=" + seq + " and appends it to the room log");
        if (trace) say(start + 2 * DC_NET, "room: the log has seq=" + seq + ", sends seq=" + seq + " to " + RELAYS + " relays");
        for (int r = 0; r < RELAYS; r++) clock.schedule(roomBusy + DC_NET, Kind.RELAY, r, seq);
    }

    void arrived(long k, long at) {
        long d = at - sentAt.get((int) k);
        if (k == 0) delayFirst = Math.max(delayFirst, d);
        delayMax = Math.max(delayMax, d);
    }

    void relay(long now, int r, long x) {
        if (down[r]) return;
        relayBusy[r] = Math.max(now, relayBusy[r]) + cost(watchers[r]);
        relaySends += watchers[r];
        skipped += members[r] - watchers[r];
        long k = mode == Mode.RELAY_ORDER ? x : messageOfSeq.get((int) x - 1);
        long at = relayBusy[r] + APP_NET;
        if (watchers[r] > 0) arrived(k, at);
        if (trace && r == 1) say(now, "relay 2: seq=" + x + " to " + watchers[r] + " watching sessions, " + (members[r] - watchers[r]) + " not watching are skipped, done at " + relayBusy[r] + "ms");
        for (int s = r * SIZE; s < Math.min(r * SIZE + SIZE, ONLINE); s += every) if (relayOf[s] == r && state[s] == WATCHING) receive(s, x, k, at);
        for (int s : joiners.get(r)) if (relayOf[s] == r && state[s] == WATCHING) receive(s, x, k, at);
    }

    void receive(int s, long x, long k, long at) {
        if (seen.containsKey(s)) seen.get(s).append(' ').append(name(senderOf.get((int) k)));
        if (mode == Mode.RELAY_ORDER) return;
        if (x == last[s] + 1 && !catching[s]) {
            last[s] = (int) x;
            if (trace && s == follow) say(at, name(s) + " app: got " + name(senderOf.get((int) k)) + "'s message seq=" + x + ", last=" + last[s]);
        } else if (mode == Mode.PUBSUB_ONLY && x > last[s]) {
            lost += x - last[s] - 1;
            gapSessions++;
            last[s] = (int) x;
        } else {
            dropped++;
            if (!catching[s] && x > last[s] + 1) catchUp(at - APP_NET, s);
            if (catching[s]) catchups.get(s).newest = Math.max(catchups.get(s).newest, x);
        }
    }

    void catchUp(long now, int s) {
        catching[s] = true;
        read(now, s, catchups.computeIfAbsent(s, i -> new Catchup()));
    }

    void read(long now, int s, Catchup c) {
        long first = Math.max(1, log.lastWritten(now + DC_NET) - MAXLEN + 1);
        trimmed += Math.max(0, first - last[s] - 1);
        last[s] = (int) Math.max(last[s], first - 1);
        c.upto = log.lastWritten(now + DC_NET);
        logReads++;
        bump(readsPerSecond, now);
        clock.schedule(now + 2 * DC_NET, Kind.READ_DONE, s, 0);
    }

    void readDone(long now, int s) {
        Catchup c = catchups.get(s);
        if (s == follow) say(now, "relay " + (relayOf[s] + 1) + ": " + name(s) + " gets seq " + (last[s] + 1) + ".." + c.upto + " from the room log");
        filled += Math.max(0, c.upto - last[s]);
        last[s] = (int) Math.max(last[s], c.upto);
        if (c.newest > last[s]) {
            read(now, s, c);
            return;
        }
        catchups.remove(s);
        catching[s] = false;
        if (c.recovering) recoveredMax = Math.max(recoveredMax, now + APP_NET - since);
        if (s == follow) say(now + APP_NET, name(s) + " app: last=" + last[s] + ", caught up " + (now + APP_NET - since) + "ms after " + (c.recovering ? "relay 1 stopped" : "opening the room"));
    }

    void open(long now, int s) {
        say(now, name(s) + " app: opens the room it was not watching, last=" + last[s]);
        since = now;
        members[relayOf[s]]--;
        state[s] = AWAY_WATCHING;
        clock.schedule(now + APP_NET, Kind.RESUME, s, 0);
    }

    void resume(long now, int s) {
        int r = relayOf[s];
        boolean watch = state[s] == AWAY_WATCHING;
        state[s] = (byte) (watch ? WATCHING : PASSIVE);
        members[r]++;
        resumes++;
        bump(resumesPerSecond, now);
        if (!watch) return;
        watchers[r]++;
        joiners.get(r).add(s);
        if (mode == Mode.PUBSUB_ONLY) return;
        if (s == follow) say(now, "relay " + (r + 1) + ": " + name(s) + " is watching, reads the room log after seq " + last[s]);
        catchUp(now, s);
    }

    void stop(long now, int r) {
        down[r] = true;
        since = now;
        for (int s = r * SIZE; s < Math.min(r * SIZE + SIZE, ONLINE); s++) {
            boolean watch = state[s] == WATCHING;
            long wait = mode == Mode.NO_JITTER ? 0 : below((int) JITTER);
            state[s] = (byte) (watch ? AWAY_WATCHING : PASSIVE);
            relayOf[s] = (r + 1 + s % (RELAYS - 1)) % RELAYS;
            if (s == follow) say(now, "relay " + (r + 1) + ": stops, " + members[r] + " connections close, " + name(s) + " had last=" + last[s] + " and waits " + wait + "ms to reconnect");
            if (watch && mode != Mode.PUBSUB_ONLY) catchups.computeIfAbsent(s, i -> new Catchup()).recovering = true;
            clock.schedule(now + wait + APP_NET, Kind.RESUME, s, 0);
        }
    }

    LargeGroupChat run() {
        for (Ev e = clock.next(); e != null; e = clock.next()) {
            switch (e.kind()) {
                case FORWARD -> forward(e.at(), e.a(), e.b());
                case ROOM -> room(e.at(), e.b());
                case RELAY -> relay(e.at(), e.a(), e.b());
                case OPEN -> open(e.at(), e.a());
                case RESUME -> resume(e.at(), e.a());
                case READ_DONE -> readDone(e.at(), e.a());
                case STOP -> stop(e.at(), e.a());
            }
        }
        return this;
    }

    String flow() {
        long behind = 0, passiveGot = 0;
        for (int s = 0; s < ONLINE; s++) if (state[s] == WATCHING && last[s] < seq) behind++;
        for (int s = 0; s < ONLINE; s++) if (state[s] == PASSIVE && last[s] > 0) passiveGot++;
        return "messages=" + seq + " room-sends=" + roomSends + " relay-sends=" + relaySends + " skipped=" + skipped + " delay-first=" + delayFirst
                + "ms delay-max=" + delayMax + "ms" + (mode == Mode.DIRECT ? "" : " watching-behind=" + behind + " not-watching-got=" + passiveGot);
    }

    String recovery() {
        if (mode == Mode.PUBSUB_ONLY) return "reconnected=" + resumes + " log-reads=0 lost=" + lost + " sessions-with-gap=" + gapSessions;
        return "reconnected=" + resumes + " log-reads=" + logReads + " filled-from-log=" + filled + " live-dropped=" + dropped + " trimmed=" + trimmed
                + " gaps-left=" + catchups.size() + " recovered-max=" + recoveredMax + "ms reconnects-per-second-max=" + peak(resumesPerSecond)
                + " log-reads-per-second-max=" + peak(readsPerSecond);
    }

    public static void main(String[] args) {
        System.out.println("-- scenario 1: A sends one message to a room with 1000000 online on 67 relays, 1 in 10 watching it --");
        LargeGroupChat one = new LargeGroupChat(Mode.GUIDE, 15_010, "V");
        one.trace = true;
        one.names.put(0, "A");
        one.post(0, 0);
        System.out.println("one message: " + one.run().flow());
        System.out.println("-- scenario 2: 20 messages per second for 5s, P opens the room at 2500ms --");
        for (Mode m : new Mode[] {Mode.GUIDE, Mode.ALL_WATCHING, Mode.DIRECT}) {
            LargeGroupChat c = new LargeGroupChat(m, m == Mode.GUIDE ? 15_011 : -1, "P");
            c.traffic(100);
            if (m == Mode.GUIDE) c.clock.schedule(2_500, Kind.OPEN, 15_011, 0);
            System.out.println(LABEL[m.ordinal()] + ": " + c.run().flow());
        }
        System.out.println("two senders press at the same ms, X on relay 1 and Y on relay 2:");
        for (Mode m : new Mode[] {Mode.GUIDE, Mode.RELAY_ORDER}) {
            LargeGroupChat c = new LargeGroupChat(m, 10, "V1");
            c.names.putAll(Map.of(0, "X", 15_000, "Y", 15_010, "V2"));
            c.seen.putAll(Map.of(10, new StringBuilder(), 15_010, new StringBuilder()));
            c.post(0, 0);
            c.post(0, 15_000);
            c.run();
            System.out.println(LABEL[m.ordinal()] + ": V1 sees" + c.seen.get(10) + ", V2 sees" + c.seen.get(15_010));
        }
        System.out.println("-- scenario 3: relay 1 stops at 2000ms while 20 messages per second go on, its 15000 sessions reconnect --");
        for (Mode m : new Mode[] {Mode.GUIDE, Mode.NO_JITTER, Mode.PUBSUB_ONLY}) {
            LargeGroupChat c = new LargeGroupChat(m, m == Mode.GUIDE ? 0 : -1, "R");
            c.traffic(200);
            c.clock.schedule(2_000, Kind.STOP, 0, 0);
            System.out.println(LABEL[m.ordinal()] + ": " + c.run().recovery());
        }
    }
}

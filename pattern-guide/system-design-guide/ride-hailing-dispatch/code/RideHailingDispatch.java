import java.util.*;

enum Mode { GUIDE, LOCK }
enum Kind { UPDATE, ASK, LOOK, OFFER, REPLY, TIMEOUT, DOWN, FAILOVER }
record Ev(long at, long seq, Kind kind, int a, int b) {}
record Ask(long at, String who, String key, int x, int y) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;
    void schedule(long at, Kind kind, int a, int b) { queue.add(new Ev(at, seq++, kind, a, b)); }
    Ev next() { return queue.poll(); }
}

final class Req {
    final int id;
    final Ask ask;
    long endAt, near = -1;
    final ArrayList<Integer> tried = new ArrayList<>(), drivers = new ArrayList<>();
    List<Integer> cands = List.of();
    Req(int id, Ask ask) {
        this.id = id;
        this.ask = ask;
    }
    long received() { return ask.at(); }
    boolean loud() { return ask.who() != null && !ask.who().equals("seoyun"); }
}

public final class RideHailingDispatch {
    static final int IDLE = 0, OFFERED = 1, ON_TRIP = 2, NODES = 3, POINTS = 8;
    static final int SIDE = 8_000, CELL = 1_000, RADIUS = 1_000, RING = (RADIUS + CELL - 1) / CELL;
    static final long EVERY = 5_000, STALE = 30_000, ACCEPT = 15_000, MATCH = 60_000, LAST_OFFER = MATCH - ACCEPT, AGAIN = 5_000;
    static final long FAILOVER_AT = 101_050, LOST = 1_000, DOWN_AT = 230_000, UNTIL = 260_000;
    static final String[] NAME = {"d01", "d02", "s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10",
            "s11", "s12", "o01", "d20", "d21", "d22", "d23", "d24"};
    static final long[][] DRIVER = { // x, y, answers this many ms after an offer comes (-1 never), the app sends until
            {3900, 2950, 3000, UNTIL}, {2950, 2500, 3000, UNTIL}, {5650, 5500, 2000, UNTIL}, {5300, 5650, 2250, UNTIL},
            {5500, 5180, 2500, UNTIL}, {5880, 5800, 2750, UNTIL}, {4900, 5450, 2000, UNTIL}, {5450, 6100, 2250, UNTIL},
            {6150, 5350, 2500, UNTIL}, {5100, 4950, 2750, UNTIL}, {4800, 6000, 2000, UNTIL}, {6200, 6000, 2250, UNTIL},
            {6250, 4900, 2500, UNTIL}, {4750, 4850, 2750, UNTIL}, {1800, 6200, 2000, UNTIL}, {6700, 1600, 16_000, UNTIL},
            {6200, 1100, 3000, UNTIL}, {6450, 1450, 3000, 170_000}, {2700, 800, 2000, UNTIL}, {2100, 200, 2000, UNTIL}};

    final Mode mode;
    final VirtualClock clock = new VirtualClock();
    final ArrayList<Ask> asks = new ArrayList<>();
    final ArrayList<Req> reqs = new ArrayList<>();
    final HashMap<String, Integer> keys = new HashMap<>();
    final HashMap<Integer, long[]> locks = new HashMap<>();
    final List<TreeMap<Integer, TreeMap<Integer, Long>>> nodes = List.of(new TreeMap<>(), new TreeMap<>(), new TreeMap<>());
    final int n = DRIVER.length;
    final int[] state = new int[n], req = new int[n], screen = new int[n], rides = new int[n];
    final long[] until = new long[n], reads = new long[NODES], writes = new long[NODES];
    final TreeSet<Integer> twice = new TreeSet<>();
    int stopped = -1;
    final List<ArrayList<String>> notes = List.of(
            new ArrayList<>(List.of("-- scenario 1: minji asks for a ride at 60000ms, nothing else is going on --")),
            new ArrayList<>(List.of("-- scenario 2: a concert ends, 20 requests from the stadium in 1800ms, 12 free drivers around it --")),
            new ArrayList<>(List.of("-- scenario 3: d20 does not answer, d22's app went quiet, index node 1 stops, junho's app sends one request twice --")));

    RideHailingDispatch(Mode mode) {
        this.mode = mode;
        Arrays.fill(req, -1);
        Arrays.fill(screen, -1);
        asks.add(new Ask(60_000, "minji", "k-minji", 3400, 2500));
        for (int i = 0; i < 20; i++) asks.add(new Ask(100_000 + 100L * Math.max(0, i - 1), null, "k-s" + i, 5500, 5500));
        asks.add(new Ask(101_900, "seoyun", "k-seoyun", 1500, 6500));
        asks.add(new Ask(205_000, "dana", "k-dana", 6500, 1500));
        asks.add(new Ask(231_000, "junho", "k-junho", 2500, 500));
        asks.add(new Ask(231_500, "junho", "k-junho", 2500, 500));
        for (int d = 0; d < n; d++) clock.schedule(250L * d, Kind.UPDATE, d, 0);
        for (int i = 0; i < asks.size(); i++) clock.schedule(asks.get(i).at(), Kind.ASK, i, 0);
        clock.schedule(FAILOVER_AT, Kind.FAILOVER, 0, 0);
        clock.schedule(DOWN_AT, Kind.DOWN, 1, 0);
    }

    static long hash(long v) {
        long h = ((v ^ (v >>> 16)) * 0x85ebca6bL) & 0xffffffffL;
        h = ((h ^ (h >>> 13)) * 0xc2b2ae35L) & 0xffffffffL;
        return h ^ (h >>> 16);
    }

    int owner(int cell, int skip) {
        long best = Long.MAX_VALUE;
        int node = -1;
        for (int k = 0; k < NODES * POINTS; k++) {
            long gap = (hash(10_000 + k / POINTS * 100 + k % POINTS) - hash(cell)) & 0xffffffffL;
            if (k / POINTS == skip || k / POINTS == stopped || gap >= best) continue;
            best = gap;
            node = k / POINTS;
        }
        return node;
    }

    static boolean rush(long t) { return t >= 100_000 && t < 150_000; }
    long dist2(Req q, int d) { return (DRIVER[d][0] - q.ask.x()) * (DRIVER[d][0] - q.ask.x()) + (DRIVER[d][1] - q.ask.y()) * (DRIVER[d][1] - q.ask.y()); }
    String away(Req q, int d) { return NAME[d] + " " + (long) Math.sqrt(dist2(q, d)) + "m in cell " + DRIVER[d][0] / CELL + ":" + DRIVER[d][1] / CELL; }
    void note(long t, String what) { notes.get(t < 100_000 ? 0 : t < 200_000 ? 1 : 2).add("t=" + t + "ms " + what); }

    boolean free(int d, long t) {
        long[] l = locks.get(d);
        if (mode == Mode.LOCK) return state[d] != ON_TRIP && (l == null || l[1] <= t);
        return state[d] == IDLE || state[d] == OFFERED && until[d] <= t;
    }

    void handle(Ev e) {
        long t = e.at();
        switch (e.kind()) {
            case UPDATE -> update(e.a(), t);
            case ASK -> ask(asks.get(e.a()), t);
            case LOOK -> look(reqs.get(e.a()), t);
            case OFFER -> offer(reqs.get(e.a()), t);
            case REPLY -> reply(e.a(), reqs.get(e.b()), t);
            case TIMEOUT -> timeout(reqs.get(e.a()), e.b(), t);
            case DOWN -> down(e.a(), t);
            case FAILOVER -> locks.values().removeIf(l -> mode == Mode.LOCK && l[2] >= t - LOST);
        }
    }

    void update(int d, long t) {
        int cell = (int) (DRIVER[d][0] / CELL * 100 + DRIVER[d][1] / CELL), node = owner(cell, -1);
        nodes.get(node).computeIfAbsent(cell, k -> new TreeMap<>()).put(d, t);
        if (rush(t) && d >= 2 && d < 14) writes[node]++;
        if (t + EVERY < DRIVER[d][3]) clock.schedule(t + EVERY, Kind.UPDATE, d, 0);
    }

    void ask(Ask a, long t) {
        Integer seen = keys.get(a.key());
        if (seen != null) note(t, a.who() + ": the app sends key " + a.key() + " again, the request record returns r" + seen + ", no second request");
        if (seen != null) return;
        Req q = new Req(reqs.size(), a);
        reqs.add(q);
        keys.put(a.key(), q.id);
        look(q, t);
    }

    void look(Req q, long t) {
        ArrayList<Integer> found = new ArrayList<>();
        String quiet = "";
        for (int i = q.ask.x() / CELL - RING; i <= q.ask.x() / CELL + RING; i++) {
            for (int j = q.ask.y() / CELL - RING; j <= q.ask.y() / CELL + RING; j++) {
                if (i < 0 || j < 0 || i >= SIDE / CELL || j >= SIDE / CELL) continue;
                int node = owner(i * 100 + j, -1);
                if (rush(t) && q.ask.who() == null) reads[node]++;
                for (var e : nodes.get(node).getOrDefault(i * 100 + j, new TreeMap<>()).entrySet()) {
                    if (t - e.getValue() <= STALE) found.add(e.getKey());
                    else quiet += "; " + away(q, e.getKey()) + " is left out, its last location is " + (t - e.getValue()) + "ms old";
                }
            }
        }
        found.removeIf(d -> q.tried.contains(d) || !free(d, t));
        found.sort(Comparator.comparingLong((Integer d) -> dist2(q, d)).thenComparingInt(d -> d));
        q.cands = found;
        boolean again = found.isEmpty() && t + AGAIN - q.received() <= LAST_OFFER;
        String head = t == q.received() ? "request r" + q.id + " is recorded in cell " + q.ask.x() / CELL + ":" + q.ask.y() / CELL + ", " : "";
        String list = String.join(", ", found.stream().map(d -> away(q, d)).toList());
        if (q.loud()) note(t, q.ask.who() + ": " + head + "free drivers in the cells around: " + found.size() + (found.isEmpty() ? "" : " (" + list + ")") + quiet + (again ? ", looks again at " + (t + AGAIN) + "ms" : ""));
        if (!found.isEmpty()) clock.schedule(t, Kind.OFFER, q.id, 0);
        else if (again) clock.schedule(t + AGAIN, Kind.LOOK, q.id, 0);
        else fail(q, t);
    }

    int hold(int d, int r, long t) {
        long[] l = locks.get(d);
        if (mode == Mode.LOCK && l != null && l[1] > t) return 0;
        if (mode == Mode.LOCK) locks.put(d, new long[] {r, t + ACCEPT, t});
        if (mode == Mode.LOCK) return 1;
        if (state[d] != IDLE && !(state[d] == OFFERED && until[d] <= t)) return 0;
        state[d] = OFFERED;
        req[d] = r;
        until[d] = t + ACCEPT;
        return 1;
    }

    int accept(int d, int r, long t) {
        if (mode == Mode.GUIDE && !(state[d] == OFFERED && req[d] == r && until[d] > t)) return 0;
        state[d] = ON_TRIP;
        req[d] = r;
        return 1;
    }

    int withdraw(int d, int r) {
        if (mode == Mode.LOCK) locks.remove(d, locks.get(d) != null && locks.get(d)[0] == r ? locks.get(d) : null);
        if (mode == Mode.LOCK || state[d] != OFFERED || req[d] != r) return 0;
        state[d] = IDLE;
        req[d] = -1;
        return 1;
    }

    void offer(Req q, long t) {
        String raced = "";
        for (int d : q.cands) {
            int changed = hold(d, q.id, t);
            if (changed == 0) raced = "r" + req[d] + " and r" + q.id + " both read " + NAME[d] + " as free, r" + req[d] + "'s write changed 1 row, r" + q.id + "'s write changed 0 rows, ";
            if (changed == 0) continue;
            if (screen[d] >= 0 && d >= 2 && d < 14) twice.add(d);
            screen[d] = q.id;
            q.tried.add(d);
            if (DRIVER[d][2] >= 0 && t < DRIVER[d][3]) clock.schedule(t + DRIVER[d][2], Kind.REPLY, d, q.id);
            clock.schedule(t + ACCEPT, Kind.TIMEOUT, q.id, d);
            if (q.loud() || !raced.isEmpty()) note(t, "dispatch: " + raced + "offers r" + q.id + " to " + NAME[d] + ", the write changed 1 row (free -> offered until " + (t + ACCEPT) + "ms)");
            return;
        }
        look(q, t);
    }

    void reply(int d, Req q, long t) {
        if (screen[d] == q.id) screen[d] = -1;
        int changed = accept(d, q.id, t);
        if (changed == 0 && q.loud()) note(t, NAME[d] + ": accepts r" + q.id + " late, the write changed 0 rows (" + NAME[d] + " is no longer offered r" + q.id + "), no ride");
        if (changed == 0) return;
        q.drivers.add(d);
        rides[d]++;
        if (q.drivers.size() == 1) q.endAt = t;
        if (q.loud()) note(t, NAME[d] + ": accepts r" + q.id + ", the write changed 1 row (offered -> on a trip), assigned " + (t - q.received()) + "ms after the request was received");
    }

    void timeout(Req q, int d, long t) {
        if (screen[d] == q.id) screen[d] = -1;
        if (!q.drivers.isEmpty()) return;
        int changed = withdraw(d, q.id);
        if (q.loud()) note(t, "dispatch: " + NAME[d] + " did not answer in " + ACCEPT + "ms, withdrawing the offer of r" + q.id + " changed " + changed + " row (offered -> free)");
        if (t - q.received() > LAST_OFFER) fail(q, t);
        else look(q, t);
    }

    void fail(Req q, long t) {
        q.endAt = t;
        q.near = 0;
        for (int d = 0; d < n; d++) if (t < DRIVER[d][3] && free(d, t) && dist2(q, d) <= (long) RADIUS * RADIUS) q.near++;
        if (q.loud()) note(t, q.ask.who() + ": told no driver " + (t - q.received()) + "ms after the request was received");
    }

    void down(int node, long t) {
        int[] to = new int[NODES];
        for (int c = 0; c < SIDE / CELL * 100; c++) if (c % 100 < SIDE / CELL && owner(c, -1) == node) to[owner(c, node)]++;
        stopped = node;
        nodes.get(node).clear();
        int moved = to[0] + to[1] + to[2];
        note(t, "index node " + node + ": stops and loses what it held, its " + moved + " cells move on the ring (" + to[0] + " to node 0, " + to[2] + " to node 2), the other " + (SIDE / CELL * (SIDE / CELL) - moved) + " cells stay");
    }

    String rushLine() {
        int asked = 0, assigned = 0, told = 0, two = 0;
        long worst = 0, toldAt = 0, near = 0;
        for (Req q : reqs) {
            if (q.ask.who() != null) continue;
            asked++;
            if (!q.drivers.isEmpty()) assigned++;
            if (!q.drivers.isEmpty()) worst = Math.max(worst, q.endAt - q.received());
            if (q.near < 0) continue;
            told++;
            toldAt = Math.max(toldAt, q.endAt - q.received());
            near = Math.max(near, q.near);
        }
        for (int d = 2; d < 14; d++) two += rides[d] >= 2 ? 1 : 0;
        String lost = mode == Mode.LOCK ? " (the lock store fails over at " + FAILOVER_AT + "ms and loses the locks taken in the last " + LOST + "ms)" : "";
        String fails = told == 0 ? "" : " " + toldAt + "ms after it was received with " + near + " free drivers within " + RADIUS + "m";
        return (mode == Mode.GUIDE ? "guide" : "lock") + lost + ": " + asked + " asked at the stadium, " + assigned + " assigned at most " + worst + "ms after the request was received, "
                + told + " told no driver" + fails + ", " + twice.size() + " drivers had two offers at once, " + two + " drivers went to two riders";
    }

    Req who(String name) { return reqs.stream().filter(q -> name.equals(q.ask.who())).findFirst().orElseThrow(); }

    static RideHailingDispatch run(Mode mode) {
        RideHailingDispatch s = new RideHailingDispatch(mode);
        for (Ev e = s.clock.next(); e != null && e.at() <= UNTIL; e = s.clock.next()) s.handle(e);
        return s;
    }

    public static void main(String[] args) {
        RideHailingDispatch g = run(Mode.GUIDE), l = run(Mode.LOCK);
        Req seoyun = g.who("seoyun"), dana = l.who("dana");
        g.notes.get(1).add(g.rushLine());
        g.notes.get(1).add("index: each search reads " + (2 * RING + 1) * (2 * RING + 1) + " cells, in the rush the stadium searches read node 0 · 1 · 2 "
                + g.reads[0] + " · " + g.reads[1] + " · " + g.reads[2] + " times and the stadium drivers wrote " + g.writes[0] + " · " + g.writes[1] + " · " + g.writes[2] + " locations to them");
        g.notes.get(1).add(l.rushLine());
        g.notes.get(1).add("seoyun: r" + seoyun.id + " far from the stadium during the rush, assigned to " + NAME[seoyun.drivers.get(0)] + " " + (seoyun.endAt - seoyun.received()) + "ms after the request was received");
        g.notes.get(2).add("lock: dana's r" + dana.id + " gets " + dana.drivers.size() + " drivers (" + String.join(", ", dana.drivers.stream().map(d -> NAME[d]).toList()) + "), d20's late accept is written too");
        g.notes.forEach(lines -> lines.forEach(System.out::println));
    }
}

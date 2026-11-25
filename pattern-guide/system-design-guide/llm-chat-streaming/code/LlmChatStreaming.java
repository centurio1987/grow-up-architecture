import java.util.*;

enum Mode { GUIDE, ONE_QUEUE }
enum Kind { ASK, ENQ, STEP, CHECK, DROP, RECONNECT, RESTART, HANG, RECOVER, STOP }
record Ev(long at, long seq, Kind kind, int a) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;
    void schedule(long at, Kind kind, int a) { queue.add(new Ev(at, seq++, kind, a)); }
    Ev next() { return queue.poll(); }
}

final class Conn {
    int gateway, last;
    boolean open = true;
    String end = "no end";
    final ArrayList<Integer> got = new ArrayList<>();
    Conn(int gateway) { this.gateway = gateway; }
    void receive(int seq) {
        got.add(seq);
        last = seq;
    }
}

final class Run {
    final int id, tier;
    final String who;
    final long received;
    int state, worker = -1, made, seq;
    long takenAt, lastAt, firstAt, endAt;
    boolean trial;
    Conn conn;
    Run(int id, String who, int tier, long received) {
        this.id = id;
        this.who = who;
        this.tier = tier;
        this.received = received;
    }
}

public final class LlmChatStreaming {
    static final int PAID = 0, FREE = 1, QUEUED = 0, RUNNING = 1, DONE = 2, FAILED = 3, CANCELED = 4, REFUSED = 5;
    static final int CLOSED = 0, OPEN = 1, HALF_OPEN = 2;
    static final int WORKERS = 2, SLOTS = 48, TOKENS = 290, CHUNK = 5, FREE_EVERY = 4, FAILS_TO_OPEN = 3;
    static final int[] LIMIT = {12, 32}, RETRY_AFTER = {1, 8};
    static final long STEP = 20, PREFILL = 220, STORE_RT = 2, TIMEOUT = 3_000, CHECK_EVERY = 1_000;
    static final long OPEN_FOR = 30_000, RETRY = 1_000, UNTIL = 280_000;
    static final String[] STATE = {"queued", "running", "finished", "failed", "stopped", "refused"};
    static final String[] EVENT = {"", "", "done", "error", "stopped", ""};
    static final String[] TIER = {"paid", "free"};

    final Mode mode;
    final VirtualClock clock = new VirtualClock();
    final ArrayList<Run> runs = new ArrayList<>();
    final List<ArrayDeque<Integer>> lanes = List.of(new ArrayDeque<>(), new ArrayDeque<>());
    final List<ArrayList<Run>> slots = List.of(new ArrayList<>(), new ArrayList<>());
    final List<ArrayList<String>> notes = List.of(
            new ArrayList<>(List.of("-- scenario 1: minsu asks one question while nothing else is running --")),
            new ArrayList<>(List.of("-- scenario 2: 20 questions a second for 60 seconds (every 5th paid), the gpus fit 16 runs a second --")),
            new ArrayList<>(List.of("-- scenario 3: jisu's connection drops, gateway 1 restarts, gpu worker 1 stops making tokens, yuna presses stop --")));
    final HashMap<Integer, Integer> kept = new HashMap<>();
    final boolean[] hung = new boolean[WORKERS];
    final int[] breaker = new int[WORKERS], fails = new int[WORKERS], longest = new int[2];
    final long[] openedAt = new long[WORKERS];
    int takes;

    LlmChatStreaming(Mode mode) {
        this.mode = mode;
        ask(1_000, "minsu", FREE);
        for (int i = 0; i < 1_200; i++) ask(20_000 + 50L * i, null, i % 5 == 0 ? PAID : FREE);
        int jisu = ask(200_000, "jisu", PAID);
        ask(210_000, "sora", FREE);
        for (int i = 0; i < 3; i++) ask(228_000 + 40L * i, i == 0 ? "doyun" : null, i == 2 ? PAID : FREE);
        ask(235_000, "dora", PAID);
        int yuna = ask(270_000, "yuna", FREE);
        clock.schedule(204_250, Kind.DROP, jisu);
        clock.schedule(209_250, Kind.RECONNECT, jisu);
        clock.schedule(213_000, Kind.RESTART, 1);
        clock.schedule(230_000, Kind.HANG, 1);
        clock.schedule(250_000, Kind.RECOVER, 1);
        clock.schedule(273_220, Kind.STOP, yuna);
        clock.schedule(273_720, Kind.STOP, yuna);
        for (int w = 0; w < WORKERS; w++) clock.schedule(10L * w, Kind.STEP, w);
        clock.schedule(CHECK_EVERY, Kind.CHECK, 0);
    }

    int ask(long at, String who, int tier) {
        runs.add(new Run(runs.size(), who, tier, at));
        clock.schedule(at, Kind.ASK, runs.size() - 1);
        return runs.size() - 1;
    }

    static boolean basic(Run r) { return r.received < 20_000; }
    int lane(Run r) { return mode == Mode.ONE_QUEUE ? PAID : r.tier; }
    void note(long t, String what) { notes.get(t < 20_000 ? 0 : t < 200_000 ? 1 : 2).add("t=" + t + "ms " + what); }

    void handle(Ev e) {
        long t = e.at();
        switch (e.kind()) {
            case ASK -> request(runs.get(e.a()), t);
            case ENQ -> enqueue(runs.get(e.a()), t);
            case STEP -> step(e.a(), t);
            case CHECK -> check(t);
            case DROP, RECONNECT -> link(runs.get(e.a()), e.kind() == Kind.RECONNECT, t);
            case RESTART -> restart(e.a(), t);
            case HANG, RECOVER -> hang(e.a(), e.kind() == Kind.HANG, t);
            case STOP -> stop(runs.get(e.a()), t);
        }
    }

    void request(Run r, long t) {
        if (mode == Mode.GUIDE && lanes.get(lane(r)).size() >= LIMIT[lane(r)]) r.state = REFUSED;
        else clock.schedule(t + STORE_RT, Kind.ENQ, r.id);
    }

    void enqueue(Run r, long t) {
        lanes.get(lane(r)).add(r.id);
        longest[lane(r)] = Math.max(longest[lane(r)], lanes.get(lane(r)).size());
        if (r.who == null) return;
        r.conn = new Conn(r.who.equals("sora") ? 1 : 0);
        if (basic(r)) note(r.received, r.who + " (" + TIER[r.tier] + "): the question is written to the conversation store, run " + r.id + " is queued at " + t + "ms and the run id goes back");
    }

    Run take(int w, long t) {
        int pick = lanes.get(PAID).isEmpty() || takes % FREE_EVERY == FREE_EVERY - 1 && !lanes.get(FREE).isEmpty() ? FREE : PAID;
        boolean trial = breaker[w] == OPEN && t - openedAt[w] >= OPEN_FOR;
        if (lanes.get(pick).isEmpty() || breaker[w] != CLOSED && !trial) return null;
        takes++;
        Run r = runs.get(lanes.get(pick).poll());
        r.state = RUNNING;
        r.worker = w;
        r.takenAt = r.lastAt = t;
        r.trial = trial;
        if (trial) breaker[w] = HALF_OPEN;
        if (trial) note(t, "queue: gpu worker " + w + " is half-open, " + r.who + "'s run is its test run");
        return r;
    }

    void step(int w, long t) {
        for (Iterator<Run> it = slots.get(w).iterator(); it.hasNext(); ) {
            Run r = it.next();
            if (r.state != RUNNING) {
                it.remove();
                if (r.state == CANCELED) note(t, "gpu worker " + w + ": drops " + r.who + "'s stopped run, the slot is free " + (t - r.endAt) + "ms after the stop and " + (TOKENS - r.made) + " tokens are not made");
                continue;
            }
            if (hung[w] || t < r.takenAt + PREFILL) continue;
            r.made++;
            if (r.made % CHUNK == 0 || r.made == TOKENS) write(r, t);
            if (r.made < TOKENS) continue;
            end(r, t, DONE);
            it.remove();
        }
        for (Run r; slots.get(w).size() < SLOTS && (r = take(w, t)) != null; ) slots.get(w).add(r);
        if (t + STEP <= UNTIL) clock.schedule(t + STEP, Kind.STEP, w);
    }

    void write(Run r, long t) {
        r.seq++;
        r.lastAt = t;
        if (r.seq == 1) r.firstAt = t;
        if (r.conn != null && r.conn.open) r.conn.receive(r.seq);
        if (r.seq == 1 && basic(r)) note(r.takenAt, "gpu worker " + r.worker + ": takes run " + r.id + ", prefill until " + (r.takenAt + PREFILL) + "ms, id 1 is written to the token record at " + t + "ms and the gateway sends it to " + r.who + " over sse");
    }

    void end(Run r, long t, int state) {
        r.state = state;
        r.endAt = t;
        kept.put(r.id, r.seq);
        if (r.conn != null && r.conn.open) r.conn.end = EVENT[state];
        if (state == DONE && basic(r)) note(t, "gpu worker " + r.worker + ": writes id " + r.seq + ", the answer goes to the conversation store and the stream ends " + (t - r.received) + "ms after the question was received");
    }

    void check(long t) {
        for (int w = 0; w < WORKERS; w++) {
            int failed = 0;
            String named = "", opened = "";
            for (Run r : slots.get(w)) {
                if (r.state != RUNNING) continue;
                boolean ok = t - r.lastAt < TIMEOUT;
                if (ok && (r.seq == 0 || r.firstAt <= t - CHECK_EVERY)) continue;
                if (!ok) failed++;
                if (!ok) end(r, t, FAILED);
                if (!ok && r.who != null) named = " (" + r.who + " after id " + r.seq + ")";
                if (breaker[w] == OPEN || breaker[w] == HALF_OPEN && !r.trial) continue;
                if (ok) fails[w] = 0;
                if (ok && breaker[w] == HALF_OPEN) note(t, "queue: the test run on gpu worker " + w + " wrote id 1, its breaker closes");
                if (ok) breaker[w] = CLOSED;
                if (ok || breaker[w] == CLOSED && ++fails[w] < FAILS_TO_OPEN) continue;
                breaker[w] = OPEN;
                openedAt[w] = t;
                fails[w] = 0;
                opened = ", gpu worker " + w + "'s breaker opens until " + (t + OPEN_FOR) + "ms";
            }
            if (failed > 0) note(t, "queue: " + failed + " runs on gpu worker " + w + " wrote nothing for " + TIMEOUT + "ms or more, they fail with an error event" + named + opened);
        }
        if (t + CHECK_EVERY <= UNTIL) clock.schedule(t + CHECK_EVERY, Kind.CHECK, 0);
    }

    void hang(int w, boolean stops, long t) {
        hung[w] = stops;
        if (stops) note(t, "gpu worker " + w + ": stops making tokens with " + slots.get(w).size() + " runs on it, it still asks the queue for runs");
    }

    void link(Run r, boolean up, long t) {
        Conn c = r.conn;
        int id = c.last, from = id;
        c.open = up;
        if (!up) note(t, r.who + ": the connection drops after id " + id + ", the run goes on");
        if (!up) return;
        c.gateway = 0;
        for (int s = from + 1; s <= r.seq; s++) c.receive(s);
        if (r.state >= DONE) c.end = EVENT[r.state];
        String rest = r.state >= DONE ? ", the run finished at " + r.endAt + "ms" : ", the rest follow as they are written";
        note(t, r.who + ": reconnects to gateway 0 with Last-Event-ID " + id + ", " + (r.seq - id) + " ids were written while away and " + (r.seq - from) + " come at once" + rest);
    }

    void restart(int g, long t) {
        for (Run r : runs) {
            if (r.conn == null || !r.conn.open || r.conn.gateway != g) continue;
            r.conn.open = false;
            clock.schedule(t + RETRY, Kind.RECONNECT, r.id);
            note(t, "gateway " + g + ": restarts, " + r.who + "'s connection closes after id " + r.conn.last + ", the browser reconnects after retry " + RETRY + "ms");
        }
    }

    void stop(Run r, long t) {
        if (r.state >= DONE) note(t, r.who + ": presses stop again, the api answers " + STATE[r.state] + " after id " + r.seq + " and changes nothing");
        if (r.state >= DONE) return;
        if (r.state == QUEUED) lanes.get(lane(r)).remove((Integer) r.id);
        end(r, t, CANCELED);
        note(t, r.who + ": presses stop after id " + r.seq + ", the queue marks the run stopped in the token record and the api answers stopped after id " + r.seq);
    }

    String userLine(Run r) {
        List<Integer> got = r.conn.got;
        int once = new TreeSet<>(got).size(), inOrder = 0;
        while (inOrder < got.size() && got.get(inOrder) == inOrder + 1) inOrder++;
        String more = inOrder < got.size() ? " and " + (got.size() - inOrder) + " more" : "";
        return r.who + ": run " + r.id + " on gpu worker " + r.worker + ", first id " + (r.firstAt - r.received) + "ms after the question was received, got ids 1-" + inOrder + " in order" + more + " then the " + r.conn.end + " event (missing " + (r.seq - once) + ", twice " + (got.size() - once) + "), the conversation store keeps the " + STATE[r.state] + " answer with " + kept.get(r.id) + " ids";
    }

    String loadLine(String label) {
        String line = label + ":";
        for (int tier = 0; tier < 2; tier++) {
            long asked = 0, refused = 0, worst = 0;
            for (Run r : runs) {
                if (r.tier != tier || r.received < 20_000 || r.received >= 80_000) continue;
                asked++;
                if (r.state == REFUSED) refused++;
                else worst = Math.max(worst, r.firstAt - r.received);
            }
            line += " " + TIER[tier] + " " + asked + " asked, " + (asked - refused) + " answered with the first id at most " + worst + "ms after the question was received, " + refused + " refused" + (refused > 0 ? " with 429 and Retry-After " + RETRY_AFTER[tier] : "") + ";";
        }
        return line + (mode == Mode.GUIDE ? " the paid lane held at most " + longest[PAID] + " and the free lane " + longest[FREE] : " the one queue held at most " + longest[PAID]);
    }

    static LlmChatStreaming run(Mode mode) {
        LlmChatStreaming s = new LlmChatStreaming(mode);
        for (Ev e = s.clock.next(); e != null && e.at() <= UNTIL; e = s.clock.next()) s.handle(e);
        return s;
    }

    public static void main(String[] args) {
        LlmChatStreaming g = run(Mode.GUIDE);
        g.notes.get(1).add(g.loadLine("guide"));
        g.notes.get(1).add(run(Mode.ONE_QUEUE).loadLine("one-queue"));
        for (Run r : g.runs) if (r.who != null) g.notes.get(basic(r) ? 0 : 2).add(g.userLine(r));
        g.notes.forEach(lines -> lines.forEach(System.out::println));
    }
}

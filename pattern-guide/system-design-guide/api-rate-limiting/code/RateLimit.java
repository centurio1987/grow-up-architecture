import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.TreeMap;
import java.util.stream.IntStream;
import java.util.stream.LongStream;

enum Kind { ARRIVE, REDIS, REPLY, TIMEOUT, STOP, RESTART }

enum Algo { FIXED, SLIDING, TWO_STEP }

enum Mode { OPEN, CLOSED, LOCAL }

record Ev(long at, long seq, Kind kind, int arg) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;

    void schedule(long at, Kind kind, int arg) { queue.add(new Ev(at, seq++, kind, arg)); }

    Ev next() { return queue.poll(); }
}

final class Redis {
    static final long CMD_US = 10;
    final TreeMap<String, Long> data = new TreeMap<>();
    long busyUntil = 0, calls = 0;
    boolean up = true, scriptLoaded = true;

    long run(long now) {
        busyUntil = Math.max(now, busyUntil) + CMD_US;
        calls++;
        return busyUntil;
    }

    long get(String key) { return data.getOrDefault(key, 0L); }

    long incr(String key) { return data.merge(key, 1L, Long::sum); }

    long[] read(int key, long now) {
        long w = now / RateLimit.WINDOW_US;
        return new long[] {0, get(key + ":" + (w - 1)), get(key + ":" + w)};
    }

    long[] lua(int key, long now, long limit, boolean fixed) {
        long[] r = read(key, now);
        if (fixed) r[1] = 0;
        if (!RateLimit.fits(r[1], r[2], now % RateLimit.WINDOW_US, limit)) return r;
        return new long[] {1, r[1], incr(key + ":" + now / RateLimit.WINDOW_US)};
    }
}

public final class RateLimit {
    static final long WINDOW_US = 60_000_000, NET_US = 250, TIMEOUT_US = 5_000, LIMIT = 600, CAP = 10, NEVER = Long.MAX_VALUE / 4;
    static final int SERVERS = 4;
    static final String[] ALGO = {"fixed-window", "sliding-lua", "two-step"}, MODE = {"open", "closed", "local"};

    final Algo algo;
    final Mode mode;
    final int trace;
    final long[] at;
    final int[] key, step, state;
    final long[][] res;
    final VirtualClock clock = new VirtualClock();
    final Redis redis = new Redis();
    final long[][] blocked = new long[SERVERS][5];
    final TreeMap<String, long[]> buckets = new TreeMap<>();
    final long[] sent = new long[5], allowed = new long[5];
    long local429 = 0, noscript = 0, fallbacks = 0, maxJudge = 0;

    RateLimit(Algo algo, Mode mode, int trace, long[] codes) {
        this.algo = algo;
        this.mode = mode;
        this.trace = trace;
        at = Arrays.stream(codes).map(c -> c / 8).toArray();
        key = Arrays.stream(codes).mapToInt(c -> (int) (c % 8)).toArray();
        step = new int[at.length];
        state = new int[at.length];
        res = new long[at.length][];
    }

    static long[] arrivals(long[]... streams) {
        return Arrays.stream(streams)
                .flatMapToLong(s -> LongStream.range(0, s[3]).map(j -> (s[1] + j / s[4] * s[2]) * 8 + s[0])).sorted().toArray();
    }

    static boolean fits(long prev, long cur, long e, long limit) {
        return prev * (WINDOW_US - e) + (cur + 1) * WINDOW_US <= limit * WINDOW_US;
    }

    static long waitUs(long prev, long cur, long e) {
        long first = prev == 0 ? WINDOW_US : WINDOW_US - (LIMIT - cur - 1) * WINDOW_US / prev;
        if (cur + 1 <= LIMIT && first < WINDOW_US) return first - e;
        long next = cur == 0 ? 0 : Math.max(0, WINDOW_US - (LIMIT - 1) * WINDOW_US / cur);
        return WINDOW_US - e + next;
    }

    static String dec3(long v) { return v / 1000 + "." + String.format("%03d", v % 1000); }

    static String ms(long us) { return dec3(us) + "ms"; }

    void note(int i, long now, String what) {
        boolean picked = trace == 1 && (i == 0 || i == 599 || i == 600 || i == 604) || trace == 2 && i < 0;
        if (picked) System.out.println("t=" + ms(now) + (i < 0 ? "" : " K" + key[i] + " #" + (i + 1)) + " " + what);
    }

    void finish(int i, long now, boolean allow, String what) {
        state[i] = allow ? 2 : 1;
        if (allow) allowed[key[i]]++;
        maxJudge = Math.max(maxJudge, now - at[i]);
        note(i, now, what);
    }

    void arrive(int i, long now) {
        if (i + 1 < at.length) clock.schedule(at[i + 1], Kind.ARRIVE, i + 1);
        int s = i % SERVERS;
        sent[key[i]]++;
        if (blocked[s][key[i]] > now) {
            local429++;
            finish(i, now, false, "api-" + (s + 1) + ": 429 from local block, no redis call");
            return;
        }
        note(i, now, "lb -> api-" + (s + 1) + ", EVALSHA sent");
        clock.schedule(now + NET_US, Kind.REDIS, i);
        clock.schedule(now + TIMEOUT_US, Kind.TIMEOUT, i);
    }

    void atRedis(int i, long now) {
        if (!redis.up) return;
        long end = redis.run(now);
        if (step[i] == 2) redis.scriptLoaded = true;
        if (algo != Algo.TWO_STEP && !redis.scriptLoaded) res[i] = new long[] {-1, 0, 0};
        else if (step[i] == 1) res[i] = new long[] {1, res[i][1], redis.incr(key[i] + ":" + at[i] / WINDOW_US)};
        else if (algo == Algo.TWO_STEP) res[i] = redis.read(key[i], at[i]);
        else res[i] = redis.lua(key[i], at[i], LIMIT, algo == Algo.FIXED);
        String verdict = res[i][0] == 1 ? "allow" : "reject";
        if (res[i][0] >= 0) note(i, end, "redis lua -> " + verdict + " prev=" + res[i][1] + " cur=" + res[i][2]);
        clock.schedule(end + NET_US, Kind.REPLY, i);
    }

    void reply(int i, long now) {
        if (state[i] != 0) return;
        long[] r = res[i];
        int s = i % SERVERS;
        long e = at[i] % WINDOW_US;
        if (r[0] == -1 && ++noscript == 1) note(-1, now, "api-" + (s + 1) + ": EVALSHA -> NOSCRIPT, resend the script with EVAL");
        if (r[0] == -1 || algo == Algo.TWO_STEP && step[i] == 0 && fits(r[1], r[2], e, LIMIT)) {
            step[i] = r[0] == -1 ? 2 : 1;
            clock.schedule(now + NET_US, Kind.REDIS, i);
            return;
        }
        if (r[0] == 1) {
            long left = Math.max(0, ((LIMIT - r[2]) * WINDOW_US - r[1] * (WINDOW_US - e)) / WINDOW_US);
            finish(i, now, true, "api-" + (s + 1) + ": 200 remaining=" + left + ", forward to backend");
            return;
        }
        long wait = algo == Algo.FIXED ? WINDOW_US - e : waitUs(r[1], r[2], e);
        blocked[s][key[i]] = at[i] + wait;
        String retry = "429 retry-after=" + (wait + 999_999) / 1_000_000 + "s";
        finish(i, now, false, "api-" + (s + 1) + ": " + retry + ", block K" + key[i] + " here until " + ms(at[i] + wait));
    }

    boolean take(int s, int k, long now) {
        long[] b = buckets.computeIfAbsent(s + ":" + k, x -> new long[] {CAP * WINDOW_US, now});
        b[0] = Math.min(CAP * WINDOW_US, b[0] + (now - b[1]) * LIMIT / SERVERS);
        b[1] = now;
        if (b[0] < WINDOW_US) return false;
        b[0] -= WINDOW_US;
        return true;
    }

    void handle(Ev ev) {
        long now = ev.at();
        int i = ev.arg();
        switch (ev.kind()) {
            case ARRIVE -> arrive(i, now);
            case REDIS -> atRedis(i, now);
            case REPLY -> reply(i, now);
            case TIMEOUT -> {
                if (state[i] != 0) return;
                fallbacks++;
                finish(i, now, mode == Mode.OPEN || mode == Mode.LOCAL && take(i % SERVERS, key[i], now), "fallback");
            }
            case STOP -> {
                redis.up = false;
                note(-1, now, "redis stops responding");
            }
            case RESTART -> {
                redis.up = true;
                redis.data.clear();
                redis.scriptLoaded = false;
                note(-1, now, "redis restarts with no counters and an empty script cache");
            }
        }
    }

    RateLimit run(long stopAt, long restartAt) {
        clock.schedule(at[0], Kind.ARRIVE, 0);
        clock.schedule(stopAt, Kind.STOP, 0);
        clock.schedule(restartAt, Kind.RESTART, 0);
        for (Ev ev = clock.next(); ev != null; ev = clock.next()) handle(ev);
        return this;
    }

    long count(int k, long from, long until) {
        return IntStream.range(0, at.length).filter(i -> state[i] == 2 && key[i] == k && at[i] >= from && at[i] < until).count();
    }

    String calls() { return "redis-calls=" + redis.calls + " api-local-429=" + local429 + " max-judge=" + ms(maxJudge); }

    void exact() {
        ArrayDeque<Long> log = new ArrayDeque<>();
        long[] wrong = new long[2];
        for (int i = 0; i < at.length; i++) {
            while (!log.isEmpty() && log.peekFirst() <= at[i] - WINDOW_US) log.pollFirst();
            boolean fit = log.size() + 1 <= LIMIT;
            if (fit) log.addLast(at[i]);
            if ((state[i] == 2) != fit) wrong[fit ? 1 : 0]++;
        }
        long sum = wrong[0] + wrong[1];
        System.out.println("exact-log: allowed=" + (allowed[2] - wrong[0] + wrong[1]) + "; sliding-lua differs on " + sum + " of "
                + at.length + " (wrongly allowed " + wrong[0] + ", wrongly rejected " + wrong[1] + ") = " + dec3(sum * 100_000 / at.length) + "%");
    }

    static void candidates() {
        String[] names = {"per-region-full", "split-in-three", "central-redis"};
        for (int c = 0; c < 3; c++) {
            Redis[] regions = {new Redis(), new Redis(), new Redis()};
            long[] got = new long[5];
            long limit = c == 1 ? LIMIT / 3 : LIMIT;
            for (long t = 0; t < WINDOW_US; t += 100_000) {
                got[1] += regions[0].lua(1, t, limit, false)[0];
                for (int r = 0; r < 3; r++) got[4] += regions[c == 2 ? 0 : r].lua(4, t, limit, false)[0];
            }
            long cross = c == 2 ? 2 * WINDOW_US / 100_000 : 0;
            System.out.println(names[c] + ": K1 allowed=" + got[1] + "/600 K4 allowed=" + got[4] + "/1800 cross-region-calls=" + cross);
        }
    }

    public static void main(String[] args) {
        System.out.println("-- formula: cloudflare example, prev=42 cur=18 at 15s of a 60s window --");
        System.out.println("estimate=" + dec3(42 * (WINDOW_US - 15_000_000) * 1000 / WINDOW_US + 18 * 1000));
        System.out.println("-- scenario 1: K1 sends one request every 80ms to region A --");
        RateLimit one = new RateLimit(Algo.SLIDING, Mode.LOCAL, 1, arrivals(new long[] {1, 0, 80_000, 750, 1})).run(NEVER, NEVER);
        System.out.println("K1: sent=" + one.sent[1] + " allowed=" + one.allowed[1] + " rejected=" + (one.sent[1] - one.allowed[1]) + " " + one.calls());
        System.out.println("-- scenario 2: K2 sends 4 at a time, 600 in 59s-60s and 600 in 60s-61s --");
        long[] burst = arrivals(new long[] {2, 59_000_000, 6_666, 600, 4}, new long[] {2, 60_000_000, 6_666, 600, 4});
        for (Algo a : Algo.values()) {
            RateLimit r = new RateLimit(a, Mode.LOCAL, 0, burst).run(NEVER, NEVER);
            System.out.println(ALGO[a.ordinal()] + ": allowed=" + r.allowed[2] + " window0=" + r.count(2, 0, WINDOW_US)
                    + " window1=" + r.count(2, WINDOW_US, 2 * WINDOW_US) + " " + r.calls());
            if (a == Algo.SLIDING) r.exact();
        }
        System.out.println("-- candidates: K1 sends 600 to region A, K4 sends 1800 across regions A B C, in one minute --");
        candidates();
        System.out.println("-- scenario 3: region A redis stops at 15s and restarts empty at 35s, K3 floods from 16s --");
        long[] flood = arrivals(new long[] {1, 0, 125_000, 480, 1}, new long[] {3, 16_000_000, 10_000, 4_400, 1});
        for (Mode m : Mode.values()) {
            RateLimit r = new RateLimit(Algo.SLIDING, m, m == Mode.LOCAL ? 2 : 0, flood).run(15_000_000, 35_000_000);
            System.out.println(MODE[m.ordinal()] + ": K1 allowed=" + r.allowed[1] + "/" + r.sent[1] + " K3 allowed=" + r.allowed[3] + "/" + r.sent[3]
                    + " K3-during-outage=" + r.count(3, 15_000_000, 35_000_000) + " fallbacks=" + r.fallbacks + " " + r.calls());
            if (m == Mode.LOCAL) System.out.println("local: redis counts K3 at " + r.redis.get("3:0") + " for window 0, K3 actually got " + r.allowed[3]);
        }
    }
}

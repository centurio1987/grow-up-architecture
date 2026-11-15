import java.util.ArrayDeque;
import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.TreeMap;
import java.util.TreeSet;

final class Rng {
    private int x;

    Rng(int seed) {
        x = seed;
    }

    int below(int n) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return (int) (Integer.toUnsignedLong(x) % n);
    }
}

enum Kind { ARRIVE, REDIS, REPLY, WORK, REPLICATE, STOP, PROMOTE }

record Ev(long at, long seq, Kind kind, int arg) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;

    void schedule(long at, Kind kind, int arg) {
        queue.add(new Ev(at, seq++, kind, arg));
    }

    Ev nextBefore(long limit) {
        Ev e = queue.peek();
        return e == null || e.at() >= limit ? null : queue.poll();
    }
}

final class Redis {
    static final long CMD_US = 5;
    long count = 0, busyUntil = 0, commands = 0, replicaCount = 0;
    TreeSet<Integer> users = new TreeSet<>(), replicaUsers = new TreeSet<>();
    boolean up = true;

    long run(long now) {
        busyUntil = Math.max(now, busyUntil) + CMD_US;
        commands++;
        return busyUntil;
    }

    long sadd(int user) { return users.add(user) ? 1 : 0; }

    long incr() { return ++count; }

    void replicate() {
        replicaCount = count;
        replicaUsers = new TreeSet<>(users);
    }

    void promote() {
        count = replicaCount;
        users = replicaUsers;
        up = true;
    }
}

final class CouponDb {
    final TreeMap<Long, Integer> bySeq = new TreeMap<>();
    final TreeSet<Integer> users = new TreeSet<>();

    boolean insert(int user, long seq) {
        if (users.contains(user) || bySeq.containsKey(seq)) return false;
        users.add(user);
        bySeq.put(seq, user);
        return true;
    }
}

record Arrivals(long[] at, int[] user, int users) {}

public final class CouponIssue {
    static final long NET_US = 250, WORK_US = 10_000, LAG_US = 5_000, FAILOVER_US = 1_000_000;
    static final int LIMIT = 1_000, WORK_BATCH = 5;

    final boolean atomic, recount, trace;
    final long[] at, reply, seq;
    final int[] user, step, wins;
    final VirtualClock clock = new VirtualClock();
    final Redis redis = new Redis();
    final ArrayDeque<Integer> queue = new ArrayDeque<>();
    final CouponDb db = new CouponDb();
    final boolean[] soldOut = new boolean[2];
    boolean paused;
    long stopCount, success, gone, already, retry, local, rejected, maxWait, lastRow;

    CouponIssue(boolean atomic, boolean recount, boolean trace, Arrivals a) {
        this.atomic = atomic;
        this.recount = recount;
        this.trace = trace;
        at = a.at();
        user = a.user();
        reply = new long[at.length];
        seq = new long[at.length];
        step = new int[at.length];
        wins = new int[a.users() + 1];
    }

    static String ms(long us) { return us / 1000 + "." + String.format("%03d", us % 1000) + "ms"; }

    void note(long now, int i, String what) {
        if (trace && user[i] == 1) System.out.println("t=" + ms(now) + " req=" + i + " user=1 " + what);
    }

    void finish(int i, long now, String what) {
        maxWait = Math.max(maxWait, now - at[i]);
        note(now, i, what);
    }

    void send(int i, long now, int next) {
        step[i] = next;
        clock.schedule(now + NET_US, Kind.REDIS, i);
    }

    void handle(Ev ev) {
        long now = ev.at();
        int i = ev.arg();
        switch (ev.kind()) {
            case ARRIVE -> {
                if (i + 1 < at.length) clock.schedule(at[i + 1], Kind.ARRIVE, i + 1);
                note(now, i, "presses, api-" + (i % 2 + 1));
                if (paused) retry++;
                else if (soldOut[i % 2]) {
                    gone++;
                    local++;
                } else send(i, now, 0);
            }
            case REDIS -> {
                reply[i] = -1;
                long done = now;
                if (redis.up && !paused) {
                    done = redis.run(now);
                    if (!atomic) done = redis.run(now);
                    int u = user[i];
                    if (step[i] == 1 && !atomic) redis.sadd(u);
                    if (step[i] == 0) reply[i] = atomic ? redis.sadd(u) : redis.users.contains(u) ? -2 : redis.count;
                    else if (step[i] == 1) reply[i] = redis.incr();
                    else redis.users.remove(u);
                    if (step[i] < 2) note(done, i, "redis " + (step[i] == 0 ? "SADD" : "INCR") + " -> " + reply[i]);
                }
                if (step[i] != 2) clock.schedule(done + NET_US, Kind.REPLY, i);
            }
            case REPLY -> {
                long r = reply[i];
                if (r == -1) {
                    retry++;
                    finish(i, now, "api: retry later");
                } else if (step[i] == 0 && (atomic ? r == 0 : r == -2)) {
                    already++;
                    finish(i, now, "api: already issued");
                } else if (step[i] == 0 && (atomic || r < LIMIT)) send(i, now, 1);
                else if (step[i] == 1 && (r <= LIMIT || !atomic)) {
                    seq[i] = r;
                    queue.add(i);
                    wins[user[i]]++;
                    success++;
                    finish(i, now, "api: enqueue seq=" + r + ", answer success");
                } else {
                    soldOut[i % 2] = true;
                    gone++;
                    finish(i, now, "api: sold out");
                    if (atomic) send(i, now, 2);
                }
            }
            case WORK -> {
                for (int k = 0; k < WORK_BATCH && !queue.isEmpty(); k++) {
                    int j = queue.poll();
                    boolean ok = db.insert(user[j], seq[j]);
                    if (ok) lastRow = now;
                    else rejected++;
                    note(now, j, "worker INSERT seq=" + seq[j] + (ok ? " -> 1 row" : " -> 0 rows"));
                }
                if (paused && queue.isEmpty()) {
                    redis.count = db.bySeq.isEmpty() ? 0 : db.bySeq.lastKey();
                    redis.users = new TreeSet<>(db.users);
                    paused = false;
                    System.out.println("t=" + ms(now) + " queue empty, rebuild from db: count=" + redis.count + ", resume");
                }
                clock.schedule(now + WORK_US, Kind.WORK, 0);
            }
            case REPLICATE -> redis.replicate();
            case STOP -> {
                redis.up = false;
                stopCount = redis.count;
                System.out.println("t=" + ms(now) + " redis primary stops, count=" + redis.count);
            }
            case PROMOTE -> {
                redis.promote();
                paused = recount;
                System.out.println("t=" + ms(now) + " replica promoted, count=" + redis.count
                        + " (lost " + (stopCount - redis.count) + " INCR)" + (recount ? ", pause" : ""));
            }
        }
    }

    CouponIssue run(long until, long stopAt) {
        clock.schedule(0, Kind.ARRIVE, 0);
        clock.schedule(0, Kind.WORK, 0);
        clock.schedule(stopAt - LAG_US, Kind.REPLICATE, 0);
        clock.schedule(stopAt, Kind.STOP, 0);
        clock.schedule(stopAt + FAILOVER_US, Kind.PROMOTE, 0);
        for (Ev ev = clock.nextBefore(until); ev != null; ev = clock.nextBefore(until)) handle(ev);
        return this;
    }

    void report(String name) {
        long doubles = 0;
        for (int w : wins) if (w > 1) doubles++;
        System.out.println(name + ": requests=" + at.length + " success=" + success + " over=" + Math.max(0, success - LIMIT)
                + " double=" + doubles + " already=" + already + " sold-out=" + gone + " retry=" + retry);
        System.out.println(name + ": redis-commands=" + redis.commands + " api-local-sold-out=" + local + " max-wait="
                + ms(maxWait) + " db-rows=" + db.bySeq.size() + " db-rejected=" + rejected + " last-row=" + ms(lastRow));
    }

    static Arrivals arrivals(Rng rng, int n, int maxGap) {
        long[] at = new long[n];
        int[] user = new int[n];
        int users = 0;
        for (int i = 0; i < n; i++) {
            boolean again = i == 1 || (i > 1 && rng.below(10) == 0);
            user[i] = again ? user[i - 1] : ++users;
            at[i] = i == 0 ? 0 : at[i - 1] + rng.below(maxGap + 1);
        }
        return new Arrivals(at, user, users);
    }

    public static void main(String[] args) {
        Rng rng = new Rng(2026);
        Arrivals burst = arrivals(rng, 30_000, 6);
        Arrivals steady = arrivals(rng, 9_000, 600);
        long never = 20_000_000;
        System.out.println("-- scenario 1: user 1 presses twice at 0ms --");
        CouponIssue first = new CouponIssue(true, false, true, burst).run(2_100_000, never);
        System.out.println("-- scenario 2: " + burst.at().length + " requests in " + ms(burst.at()[29_999]) + " for " + LIMIT + " coupons --");
        first.report("atomic");
        new CouponIssue(false, false, false, burst).run(10_000_000, never).report("check-then-act");
        System.out.println("-- scenario 3: redis primary stops at 300ms, " + steady.at().length + " requests --");
        new CouponIssue(true, false, false, steady).run(4_000_000, 300_000).report("as-is");
        new CouponIssue(true, true, false, steady).run(4_000_000, 300_000).report("recount");
    }
}

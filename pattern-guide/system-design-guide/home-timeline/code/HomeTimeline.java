import java.util.*;
import java.util.stream.IntStream;

enum Kind { TICK, POST, READ, CRASH, RETRY }
enum Mode { GUIDE, FAN_OUT_ALL, LIST }
record Ev(long at, long seq, Kind kind, int a, int b) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;
    void schedule(long at, Kind kind, int a, int b) { queue.add(new Ev(at, seq++, kind, a, b)); }
    Ev next() { return queue.poll(); }
}

public final class HomeTimeline {
    static final int USERS = 200_000, STAR = 0, STAR_FOLLOWERS = 100_000, FOLLOWS = 200, STRIDE = 997, HISTORY = 60;
    static final int ALICE = 49_999, BOB = 50_000, DAVE = 50_997, CAROL = 51_994;
    static final int BIG = 2_000, KEEP = 800, PAGE = 20, CAP = 1, LISTS_PER_MS = 20, BACKGROUND = 6, MAX_POSTS = 4_000;
    static final long DAY = 86_400_000L, ACTIVE = 30 * DAY, NET = 50, CACHE_RT = 1, STORE_RT = 2;
    static final long RETRY_AFTER = 1_000, VISIBLE = 5_000, CRASH_AT = 120_030, UNTIL = 240_000;
    static final int[][] NAMED = {{70_000, ALICE, 0}, {90_500, STAR, 1}, {91_000, ALICE, 1}, {120_000, ALICE, 2}};
    static final int[][] READS = {{75_000, BOB, 0}, {90_000, BOB, 10}, {96_000, BOB, 11}, {97_000, BOB, 12}, {125_000, CAROL, 20}, {126_000, DAVE, 20}, {127_000, BOB, 20}};
    static final List<Long> NONE = List.of();

    final Mode mode;
    final VirtualClock clock = new VirtualClock();
    final long[] lastSeen = new long[USERS];
    final boolean[] built = new boolean[USERS];
    final HashMap<Integer, List<Long>> timeline = new HashMap<>(), byAuthor = new HashMap<>();
    final long[] id = new long[MAX_POSTS], at = new long[MAX_POSTS], done = new long[MAX_POSTS], toBob = new long[MAX_POSTS];
    final int[] author = new int[MAX_POSTS], scene = new int[MAX_POSTS];
    final ArrayDeque<Integer> jobs = new ArrayDeque<>();
    final ArrayList<ArrayList<String>> notes = new ArrayList<>();
    long[] first = new long[0];
    long seed = 2_026, lastMs = -1, seqInMs, slowest;
    int posts, cur = -1, next, again, lostNode = -1, missed, repeats, jobsDone;
    boolean broken;

    HomeTimeline(Mode mode) {
        this.mode = mode;
        for (int u = 0; u < USERS; u++) {
            lastSeen[u] = u % 2 == 0 ? 0 : -40 * DAY;
            built[u] = u % 2 == 0;
        }
        for (int i = 0; i < 4; i++) notes.add(new ArrayList<>());
        for (int i = 0; i < HISTORY; i++) clock.schedule(500 + 1_000L * i, Kind.POST, followee(BOB, i), -1);
        for (int[] p : NAMED) clock.schedule(p[0], Kind.POST, p[1], p[2]);
        for (int i = 1; i < 4; i++) clock.schedule(91_000 + 1_000L * i, Kind.POST, followee(BOB, i), -1);
        for (int[] r : READS) clock.schedule(r[0], Kind.READ, r[1], r[2]);
        if (mode != Mode.FAN_OUT_ALL) clock.schedule(CRASH_AT, Kind.CRASH, 0, 0);
        clock.schedule(0, Kind.TICK, 0, 0);
    }

    static int follower(int a, int j) { return a == STAR ? j + 1 : (int) ((a + 1 + (long) j * STRIDE) % USERS); }
    static int followee(int u, int j) { return (int) Math.floorMod(u - 1 - (long) j * STRIDE, (long) USERS); }
    static int followerCount(int a) { return a == STAR ? STAR_FOLLOWERS : FOLLOWS; }
    static boolean followsStar(int u) { return u >= 1 && u <= STAR_FOLLOWERS; }
    static int node(int u) { return (int) ((u * 2_654_435_761L % 4_294_967_296L) >>> 30); }
    static String who(int u) { return u == ALICE ? "alice" : u == BOB ? "bob" : u == CAROL ? "carol" : u == DAVE ? "dave" : u == STAR ? "star" : "user " + u; }
    boolean active(int u, long t) { return t - lastSeen[u] <= ACTIVE; }
    boolean big(int a) { return followerCount(a) > BIG && mode != Mode.FAN_OUT_ALL; }
    int size(int u) { return timeline.getOrDefault(u, NONE).size(); }
    int authorOf(long x) { return author[IntStream.range(0, posts).filter(p -> id[p] == x).findFirst().orElseThrow()]; }
    int last(int a) { return IntStream.range(0, posts).filter(p -> author[p] == a).max().orElse(0); }
    void note(int s, long t, String what) { notes.get(s).add((t < 0 ? "" : "t=" + t + "ms ") + what); }

    long below(int n) {
        seed = seed * 48_271 % 2_147_483_647;
        return seed % n;
    }

    static HomeTimeline run(Mode mode) {
        HomeTimeline s = new HomeTimeline(mode);
        for (Ev e = s.clock.next(); e != null; e = s.clock.next()) s.handle(e);
        return s;
    }

    void handle(Ev e) {
        long t = e.at();
        switch (e.kind()) {
            case TICK -> tick(t);
            case POST -> post(t, e.a(), e.b());
            case READ -> read(t, e.a(), e.b() / 10, e.b() % 10);
            case CRASH -> crash(t);
            case RETRY -> jobs.add(e.a());
        }
    }

    void tick(long t) {
        if (below(1_000) < BACKGROUND) post(t, 1 + (int) below(USERS - 1), -1);
        work(t);
        if (t < UNTIL) clock.schedule(t + 1, Kind.TICK, 0, 0);
    }

    void post(long t, int a, int s) {
        if (t != lastMs) seqInMs = 0;
        lastMs = t;
        int p = posts++;
        id[p] = t << 22 | 1L << 12 | seqInMs++;
        at[p] = t;
        author[p] = a;
        scene[p] = s;
        done[p] = -1;
        toBob[p] = -1;
        byAuthor.computeIfAbsent(a, k -> new ArrayList<>()).add(id[p]);
        jobs.add(p);
        String why = big(a) ? " is above " + BIG + ", the worker will skip it and followers read it from star's own list" : " is not above " + BIG + ", the worker will fan it out";
        if (s >= 0) note(s, t, who(a) + ": posts id=" + id[p] + ", " + followerCount(a) + " followers" + why);
    }

    void work(long t) {
        int budget = CAP;
        while (cur >= 0 || !jobs.isEmpty()) {
            if (cur < 0) {
                cur = jobs.poll();
                next = 0;
            }
            if (next == followerCount(author[cur]) || big(author[cur])) {
                finish(t);
                continue;
            }
            int u = follower(author[cur], next);
            if (!active(u, t)) {
                next++;
                continue;
            }
            if (budget-- == 0) return;
            if (!write(t, u)) return;
            next++;
        }
    }

    boolean write(long t, int u) {
        if (broken && node(u) == lostNode) {
            broken = false;
            note(2, t, "fan-out: writing id=" + id[cur] + " to user " + u + " on node " + lostNode + " fails, the job goes back to the queue at " + (t + RETRY_AFTER) + "ms to start again from its first follower");
            clock.schedule(t + RETRY_AFTER, Kind.RETRY, cur, 0);
            cur = -1;
            return false;
        }
        List<Long> tl = timeline.computeIfAbsent(u, k -> new ArrayList<>());
        int k = 0;
        while (k < tl.size() && tl.get(k) > id[cur]) k++;
        boolean dup = k < tl.size() && tl.get(k) == id[cur];
        if (!dup || mode == Mode.LIST) tl.add(k, id[cur]);
        if (tl.size() > KEEP) tl.remove(tl.size() - 1);
        if (dup) again++;
        if (u == BOB && toBob[cur] < 0) toBob[cur] = t;
        return true;
    }

    void finish(long t) {
        int a = author[cur];
        done[cur] = t;
        jobsDone++;
        slowest = Math.max(slowest, t - at[cur]);
        int skipped = (int) IntStream.range(0, followerCount(a)).filter(j -> !active(follower(a, j), t)).count();
        String reach = " is in the timelines of " + (followerCount(a) - skipped) + " followers seen in the last 30 days";
        if (scene[cur] == 0) note(0, t, "fan-out: id=" + id[cur] + reach + " (bob's at " + toBob[cur] + "ms), " + skipped + " others skipped (dave last seen 40 days ago)");
        if (scene[cur] == 2) note(2, t, "fan-out: id=" + id[cur] + reach + ", the retry wrote it again to " + again + " that already had it and each kept one copy");
        cur = -1;
    }

    void crash(long t) {
        lostNode = node(CAROL);
        int gone = 0;
        for (int u = 0; u < USERS; u++) {
            if (node(u) != lostNode) continue;
            if (built[u]) gone++;
            built[u] = false;
            timeline.remove(u);
        }
        broken = true;
        note(2, t, "cache node " + lostNode + ": stops, its " + gone + " built timelines are gone, an empty node takes its place");
    }

    void read(long t, int u, int s, int what) {
        if (mode == Mode.FAN_OUT_ALL) return;
        long wait = NET + CACHE_RT + (followsStar(u) ? STORE_RT : 0) + STORE_RT + NET;
        String how = "";
        if (!built[u] || !active(u, t)) {
            long[] asIs = page(u, Long.MAX_VALUE, 0, 0);
            if (size(u) > 0) note(s, t, "no-marker: " + who(u) + "'s page 1 from the timeline as it is (ids=" + size(u) + ") = " + asIs.length + " posts, missing=" + missing(t, asIs, truth(u, Long.MAX_VALUE, 0)));
            how = (size(u) == 0 ? "no timeline, last seen 40 days ago" : built[u] ? "last seen over 30 days ago" : "no built mark") + ", rebuilt from " + FOLLOWS + " author lists to ids=";
            rebuild(u);
            how += size(u) + ", then ";
            wait += STORE_RT + FOLLOWS / LISTS_PER_MS + CACHE_RT;
        }
        lastSeen[u] = t;
        long max = what == 1 ? first[first.length - 1] : Long.MAX_VALUE, since = what == 2 ? first[0] : 0;
        long[] got = page(u, max, since, 0);
        List<Long> all = truth(u, max, since);
        int miss = missing(t, got, all), rep = repeated(got, what == 1 ? first : new long[0]);
        missed += miss;
        repeats += rep;
        String[] asked = {"page 1", "page 2 by max_id=" + max, "newer by since_id=" + since};
        long fromStar = Arrays.stream(got).filter(x -> authorOf(x) == STAR).count(), p2 = id[last(ALICE)];
        String line = who(u) + ": " + how + asked[what] + " = " + got.length + " posts, newest id=" + got[0] + " by " + who(authorOf(got[0])) + ", oldest id=" + got[got.length - 1] + ", from star's list " + fromStar;
        if (s == 2) line += ", alice's id=" + p2 + " x" + Arrays.stream(got).filter(x -> x == p2).count();
        note(s, t, line + ", answered " + wait + "ms later, repeated=" + rep + " missing=" + miss);
        if (what == 0 && s == 1) note(s, -1, "read-all: " + (Arrays.equals(got, top(all)) ? "the same" : "other") + " page 1 from " + (FOLLOWS + 1) + " author lists instead of 1 timeline and 1 list");
        if (what == 1) note(s, -1, "offset: page 2 by offset=" + PAGE + " = " + page(u, Long.MAX_VALUE, 0, PAGE).length + " posts, repeated=" + repeated(page(u, Long.MAX_VALUE, 0, PAGE), first));
        if (s == 2 && u == BOB) note(3, t, "list: bob's page 1 has alice's id=" + p2 + " x" + Arrays.stream(got).filter(x -> x == p2).count() + ", repeated=" + rep);
        if (what == 0) first = got;
    }

    void rebuild(int u) {
        ArrayList<Long> all = new ArrayList<>(timeline.getOrDefault(u, NONE));
        for (int j = 0; j < FOLLOWS; j++) all.addAll(byAuthor.getOrDefault(followee(u, j), NONE));
        all.sort(Comparator.reverseOrder());
        ArrayList<Long> tl = new ArrayList<>();
        for (long x : all) if (tl.isEmpty() || tl.get(tl.size() - 1) != x) tl.add(x);
        while (tl.size() > KEEP) tl.remove(tl.size() - 1);
        timeline.put(u, tl);
        built[u] = true;
    }

    long[] page(int u, long max, long since, int skip) {
        ArrayList<Long> c = new ArrayList<>();
        for (long x : timeline.getOrDefault(u, NONE)) if (x < max && x > since) c.add(x);
        if (followsStar(u) && mode != Mode.FAN_OUT_ALL) for (long x : byAuthor.getOrDefault(STAR, NONE)) if (x < max && x > since) c.add(x);
        c.sort(Comparator.reverseOrder());
        return c.stream().skip(skip).limit(PAGE).mapToLong(Long::longValue).toArray();
    }

    List<Long> truth(int u, long max, long since) {
        ArrayList<Long> c = new ArrayList<>();
        for (int j = 0; j <= FOLLOWS; j++) {
            if (j == FOLLOWS && !followsStar(u)) break;
            for (long x : byAuthor.getOrDefault(j < FOLLOWS ? followee(u, j) : STAR, NONE)) if (x < max && x > since) c.add(x);
        }
        c.sort(Comparator.reverseOrder());
        return c;
    }

    static long[] top(List<Long> all) { return all.stream().limit(PAGE).mapToLong(Long::longValue).toArray(); }

    static int missing(long t, long[] got, List<Long> all) {
        HashSet<Long> in = new HashSet<>();
        for (long g : got) in.add(g);
        int m = 0;
        for (long x : top(all)) if ((x >> 22) <= t - VISIBLE && !in.contains(x)) m++;
        return m;
    }

    static int repeated(long[] got, long[] before) {
        HashSet<Long> seen = new HashSet<>();
        for (long b : before) seen.add(b);
        int r = 0;
        for (long x : got) if (!seen.add(x)) r++;
        return r;
    }

    String fanOutAll() {
        int star = last(STAR), q = IntStream.range(0, posts).filter(p -> author[p] == ALICE && scene[p] == 1).findFirst().orElse(0);
        long late = IntStream.range(0, posts).filter(p -> done[p] >= 0 && done[p] - at[p] > VISIBLE).count();
        return "fan-out-all: star's post was in all " + STAR_FOLLOWERS / 2 + " active followers' timelines " + (done[star] - at[star]) + "ms after it was written (bob's after " + (toBob[star] - at[star])
                + "ms), alice's post written at " + at[q] + "ms was in bob's after " + (toBob[q] - at[q]) + "ms, " + late + " of " + jobsDone + " posts took over " + VISIBLE + "ms";
    }

    public static void main(String[] args) {
        HomeTimeline g = run(Mode.GUIDE), f = run(Mode.FAN_OUT_ALL), l = run(Mode.LIST);
        String[] head = {
            "-- scenario 1: alice posts once, bob opens his home timeline 5000ms later --",
            "-- scenario 2: star (100000 followers) posts between bob's page 1 and page 2, 4 more posts come in --",
            "-- scenario 3: cache node " + node(CAROL) + " stops while alice's post at 120000ms fans out, then carol on that node and dave (away 40 days) read --"};
        for (int s = 0; s < 3; s++) {
            System.out.println(head[s]);
            g.notes.get(s).forEach(System.out::println);
            if (s == 1) System.out.println(f.fanOutAll());
        }
        l.notes.get(3).forEach(System.out::println);
        System.out.println("guide: " + g.jobsDone + " fan-out jobs done, the slowest was in all active followers' timelines " + g.slowest + "ms after it was written, reads missing=" + g.missed + " repeated=" + g.repeats);
    }
}

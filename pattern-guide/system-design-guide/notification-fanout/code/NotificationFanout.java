import java.util.*;
import java.util.function.Predicate;

enum Mode { GUIDE, ONE_QUEUE, NO_SHARE }
enum Kind { TICK, REQ, ENQ, WRITE, READY, RESEND, CRASH, VISIBLE }
record Ev(long at, long seq, Kind kind, int a) {}
record Req(long at, String service, int user, int count, int ch, int prio, String key, boolean lostReply) {}
record Notice(int id, int user, int ch, int prio, String key, long received) {}
record Batch(int worker, long takenAt, ArrayList<int[]> items) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;
    void schedule(long at, Kind kind, int a) { queue.add(new Ev(at, seq++, kind, a)); }
    Ev next() { return queue.poll(); }
}

enum Circuit { CLOSED, OPEN, HALF_OPEN }

final class Breaker {
    static final int WINDOW = 10, MIN_CALLS = 5, FAIL_PERCENT = 50, TRIALS = 3;
    static final long OPEN_FOR = 10_000;
    final ArrayDeque<Boolean> recent = new ArrayDeque<>();
    Circuit state = Circuit.CLOSED;
    int allowed, judged, failed;
    long openedAt;

    boolean allow(long t) {
        if (state == Circuit.OPEN && t - openedAt >= OPEN_FOR) state = Circuit.HALF_OPEN;
        if (state == Circuit.HALF_OPEN && allowed < TRIALS) return ++allowed > 0;
        return state == Circuit.CLOSED;
    }

    String record(boolean ok, long t) {
        if (state == Circuit.OPEN) return null;
        if (state == Circuit.HALF_OPEN) {
            judged++;
            failed += ok ? 0 : 1;
            if (judged < TRIALS) return null;
            if (failed * 100 >= FAIL_PERCENT * TRIALS) return open(t, "half-open, " + failed + " of " + TRIALS + " test calls failed, the breaker opens again");
            state = Circuit.CLOSED;
            return "half-open, " + TRIALS + " test calls passed, the breaker closes and sms go to A again";
        }
        recent.add(ok);
        if (recent.size() > WINDOW) recent.poll();
        long bad = recent.stream().filter(b -> !b).count();
        if (recent.size() < MIN_CALLS || bad * 100 < FAIL_PERCENT * recent.size()) return null;
        return open(t, bad + " of the last " + recent.size() + " calls failed, the breaker opens and sms go to B");
    }

    String open(long t, String why) {
        state = Circuit.OPEN;
        openedAt = t;
        allowed = judged = failed = 0;
        recent.clear();
        return why;
    }
}

public final class NotificationFanout {
    static final int PUSH = 0, SMS = 1, URGENT = 0, NORMAL = 1, CAMPAIGN = 2, FCM = 0, SMS_A = 1, SMS_B = 2;
    static final int HANDED = 1, TOKEN_REMOVED = 2, FAILURE_QUEUE = 3, SENDING = 4, MAX = 11_000;
    static final int MINSU = 1, SORA = 3, JISU = 4, DORA = 8, YUNA = 10, FANS = 10_000, OTP_USERS = 20_000;
    static final int PER_TICK = 5, QUOTA = 100, SHARE = 20, MAX_ATTEMPTS = 5;
    static final long STEP = 50, RT = 20, WRITE_AFTER = 25, STORE_RT = 2, VISIBILITY = 12_000;
    static final long[] REGION_DOWN = {30_000, 50_000}, A_DOWN = {220_000, 240_000};
    static final long[] BACKOFF = {10_000, 1_000};
    static final long CRASH_AT = 300_022, UNTIL = 330_000;
    static final String[] STATE = {"waiting", "handed over", "token removed", "failure queue", "sending"};
    static final String[] VENDOR = {"fcm", "sms A", "sms B"};
    static final String[] PRIO = {"urgent", "normal", "campaign"};

    final Mode mode;
    final VirtualClock clock = new VirtualClock();
    final ArrayList<Req> reqs = new ArrayList<>();
    final ArrayList<Notice> notices = new ArrayList<>();
    final HashMap<String, Integer> keys = new HashMap<>();
    final ArrayList<Batch> batches = new ArrayList<>();
    final ArrayList<ArrayList<String>> notes = new ArrayList<>(List.of(new ArrayList<>(), new ArrayList<>(), new ArrayList<>()));
    final Breaker[] breakers = {new Breaker(), new Breaker()};
    final boolean[] dead = new boolean[2];
    final int[] attempts = new int[MAX], deliveries = new int[MAX], state = new int[MAX], shown = new int[MAX];
    final long[] handed = new long[MAX];
    final ArrayList<ArrayDeque<Integer>> fresh = new ArrayList<>(), ready = new ArrayList<>();
    long seed = 2_026, window = -1, fcmWindow = -1, first429 = -1, last429 = -1;
    int used, retryUsed, fcmCount, got429, new429, maxRetryShare, maybeTwice;
    final int[] sentTo = new int[3];

    NotificationFanout(Mode mode) {
        this.mode = mode;
        Arrays.fill(handed, -1);
        for (int i = 0; i < 6; i++) fresh.add(new ArrayDeque<>());
        for (int i = 0; i < 6; i++) ready.add(new ArrayDeque<>());
        reqs.add(new Req(1_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-1", false));
        reqs.add(new Req(10_000, "marketing", 1_000, FANS, PUSH, CAMPAIGN, "sale", false));
        reqs.add(new Req(11_000, "login", SORA, 1, PUSH, URGENT, "approve-sora-1", false));
        reqs.add(new Req(11_000, "order", SORA, 1, PUSH, NORMAL, "order-sora-1", false));
        reqs.add(new Req(35_000, "login", YUNA, 1, PUSH, URGENT, "approve-yuna-1", false));
        for (int i = 0; i <= 800; i++) reqs.add(new Req(200_000 + 100L * i, "login", OTP_USERS + i, 1, SMS, URGENT, "otp-" + i, false));
        reqs.add(new Req(250_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-2", true));
        reqs.add(new Req(251_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-2", false));
        reqs.add(new Req(260_000, "order", DORA, 1, PUSH, NORMAL, "order-dora-1", false));
        reqs.add(new Req(299_990, "order", JISU, 1, PUSH, NORMAL, "order-jisu-5521", false));
        reqs.add(new Req(299_990, "order", JISU, 1, SMS, NORMAL, "order-jisu-5521-sms", false));
        for (int i = 0; i < reqs.size(); i++) clock.schedule(reqs.get(i).at(), Kind.REQ, i);
        clock.schedule(CRASH_AT, Kind.CRASH, 0);
        clock.schedule(0, Kind.TICK, 0);
    }

    static String who(int u) { return u == MINSU ? "minsu" : u == SORA ? "sora" : u == JISU ? "jisu" : u == DORA ? "dora" : u == YUNA ? "yuna" : "user " + u; }
    static String kind(Notice n) { return PRIO[n.prio()] + (n.ch() == PUSH ? " push" : " sms"); }
    ArrayDeque<Integer> lane(ArrayList<ArrayDeque<Integer>> q, int id) { return q.get(notices.get(id).ch() * 3 + (mode == Mode.ONE_QUEUE ? 0 : notices.get(id).prio())); }
    void note(long t, String what) { notes.get(t < 10_000 ? 0 : t < 200_000 ? 1 : 2).add("t=" + t + "ms " + what); }
    long count(Predicate<Notice> p) { return notices.stream().filter(p).count(); }
    long slowest(Predicate<Notice> p) { return notices.stream().filter(p).mapToLong(n -> handed[n.id()] - n.received()).max().orElse(-1); }
    Notice named(int user, int ch, int prio) { return notices.stream().filter(n -> n.user() == user && n.ch() == ch && n.prio() == prio).findFirst().orElseThrow(); }

    long below(long n) {
        seed = seed * 48_271 % 2_147_483_647;
        return seed % n;
    }

    static NotificationFanout run(Mode mode) {
        NotificationFanout s = new NotificationFanout(mode);
        for (Ev e = s.clock.next(); e != null && e.at() <= UNTIL; e = s.clock.next()) s.handle(e);
        return s;
    }

    void handle(Ev e) {
        long t = e.at();
        switch (e.kind()) {
            case TICK -> tick(t);
            case REQ -> request(reqs.get(e.a()), t);
            case ENQ -> lane(fresh, e.a()).add(e.a());
            case WRITE -> write(batches.get(e.a()));
            case READY -> lane(ready, e.a()).add(e.a());
            case RESEND -> settle(notices.get(e.a()), send(notices.get(e.a()), t, FCM), FCM, t + RT);
            case CRASH -> crash(t);
            default -> lane(fresh, e.a()).addFirst(e.a());
        }
    }

    void request(Req r, long t) {
        if (keys.containsKey(r.key())) {
            int old = keys.get(r.key());
            note(t, r.service() + ": sends key=" + r.key() + " again, the api answers with n=" + old + " (" + STATE[state[old]] + ") and adds nothing, notifications for that key " + count(n -> n.key().equals(r.key())));
            return;
        }
        for (int u = r.user(); u < r.user() + r.count(); u++) {
            keys.put(r.count() > 1 ? r.key() + "-" + u : r.key(), notices.size());
            clock.schedule(t + STORE_RT, Kind.ENQ, notices.size());
            notices.add(new Notice(notices.size(), u, r.ch(), r.prio(), r.count() > 1 ? r.key() + "-" + u : r.key(), t));
        }
        Notice n = notices.get(notices.size() - 1);
        String what = r.count() > 1 ? "a campaign for " + r.count() + " users is stored" : kind(n) + " for " + who(n.user()) + " key=" + r.key() + " is stored as n=" + n.id();
        if (r.user() < OTP_USERS) note(t, r.service() + ": " + what + " and queued at " + (t + STORE_RT) + "ms, " + (r.lostReply() ? "the reply is lost" : "the reply goes back"));
    }

    void tick(long t) {
        if (t + STEP <= UNTIL) clock.schedule(t + STEP, Kind.TICK, 0);
        int w = (int) (t / STEP % 2);
        if (dead[w]) return;
        if (t / 1_000 != window) {
            window = t / 1_000;
            used = 0;
            retryUsed = 0;
        }
        Batch b = new Batch(w, t, new ArrayList<>());
        for (int k = 0; k < PER_TICK && used < QUOTA; k++) {
            Integer id = take(PUSH);
            if (id == null) break;
            used++;
            b.items().add(new int[] {id, FCM, send(notices.get(id), t, FCM)});
        }
        if (fresh.get(0).size() + fresh.get(1).size() + fresh.get(2).size() > 0) maxRetryShare = Math.max(maxRetryShare, retryUsed);
        for (int k = 0; k < PER_TICK; k++) {
            Integer id = take(SMS);
            if (id == null) break;
            int v = breakers[0].allow(t) ? SMS_A : breakers[1].allow(t) ? SMS_B : SMS_A;
            b.items().add(new int[] {id, v, send(notices.get(id), t, v)});
        }
        if (b.items().isEmpty()) return;
        batches.add(b);
        clock.schedule(t + WRITE_AFTER, Kind.WRITE, batches.size() - 1);
    }

    Integer take(int ch) {
        for (int pass = 0; pass < 2; pass++) {
            for (int c = ch * 3; c < ch * 3 + 3; c++) {
                if (!ready.get(c).isEmpty() && (pass == 1 || ch == SMS || retryUsed < SHARE)) {
                    retryUsed += ch == PUSH ? 1 : 0;
                    return ready.get(c).poll();
                }
                if (pass == 0 && !fresh.get(c).isEmpty()) return fresh.get(c).poll();
            }
        }
        return null;
    }

    int send(Notice n, long t, int v) {
        maybeTwice += state[n.id()] == SENDING ? 1 : 0;
        state[n.id()] = SENDING;
        if (v == FCM && t / 1_000 != fcmWindow) fcmCount = 0;
        if (v == FCM) fcmWindow = t / 1_000;
        fcmCount += v == FCM ? 1 : 0;
        boolean down = v == FCM && t >= REGION_DOWN[0] && t < REGION_DOWN[1] && n.user() % 5 < 3 || v == SMS_A && t >= A_DOWN[0] && t < A_DOWN[1];
        int code = v == FCM && fcmCount > QUOTA ? 429 : v == FCM && n.user() == DORA ? 404 : down ? 500 : 200;
        if (code == 429 && first429 < 0) first429 = t;
        if (code == 429) last429 = t;
        got429 += code == 429 ? 1 : 0;
        new429 += code == 429 && attempts[n.id()] == 0 ? 1 : 0;
        sentTo[v]++;
        deliveries[n.id()] += code == 200 ? 1 : 0;
        if (code == 200 && (n.ch() == SMS || deliveries[n.id()] == 1)) shown[n.id()]++;
        if (code == 200 && handed[n.id()] < 0) handed[n.id()] = t + RT;
        return code;
    }

    void write(Batch b) {
        if (dead[b.worker()]) return;
        for (int[] it : b.items()) {
            Notice n = notices.get(it[0]);
            settle(n, it[2], it[1], b.takenAt() + RT);
            if (n.user() == MINSU && n.received() < 10_000) note(b.takenAt(), "worker " + b.worker() + ": takes n=" + n.id() + " first from the urgent sms queue, " + VENDOR[it[1]] + " answers " + it[2] + " at " + (b.takenAt() + RT) + "ms, recorded at " + (b.takenAt() + WRITE_AFTER) + "ms, handed over " + (handed[n.id()] - n.received()) + "ms after it was received");
        }
    }

    void settle(Notice n, int code, int v, long at) {
        String change = v == FCM ? null : breakers[v - 1].record(code == 200, at);
        if (change != null) note(at, VENDOR[v] + ": " + change);
        if (code == 404) note(at, "fcm: 404 UNREGISTERED for " + who(n.user()) + "'s push n=" + n.id() + ", the token is removed and the push is not retried");
        state[n.id()] = code == 200 ? HANDED : code == 404 ? TOKEN_REMOVED : 0;
        if (code == 200 || code == 404) return;
        attempts[n.id()]++;
        if (attempts[n.id()] >= MAX_ATTEMPTS) state[n.id()] = FAILURE_QUEUE;
        if (attempts[n.id()] >= MAX_ATTEMPTS) return;
        long d = BACKOFF[n.ch()] << (attempts[n.id()] - 1);
        clock.schedule(at + d + below(d), mode == Mode.NO_SHARE && n.ch() == PUSH ? Kind.RESEND : Kind.READY, n.id());
    }

    void crash(long t) {
        dead[0] = true;
        for (Batch b : batches) {
            if (b.worker() != 0 || b.takenAt() + WRITE_AFTER <= t) continue;
            StringBuilder what = new StringBuilder();
            for (int[] it : b.items()) clock.schedule(b.takenAt() + VISIBILITY, Kind.VISIBLE, it[0]);
            for (int[] it : b.items()) what.append(what.length() == 0 ? "" : " and ").append(kind(notices.get(it[0]))).append(" n=").append(it[0]).append(" to ").append(VENDOR[it[1]]);
            note(t, "worker 0: stops after the vendors answered 200 at " + (b.takenAt() + RT) + "ms for " + what + ", before recording at " + (b.takenAt() + WRITE_AFTER) + "ms");
            note(b.takenAt() + VISIBILITY, "queue: the same " + b.items().size() + " become visible again " + VISIBILITY + "ms after worker 0 took them, worker 1 sends them again");
        }
    }

    String pushLine(String label) {
        long urgent = handed[named(SORA, PUSH, URGENT).id()] - 11_000, normal = handed[named(SORA, PUSH, NORMAL).id()] - 11_000;
        return label + ": sora's urgent push was handed over " + urgent + "ms after it was received, her normal push after " + normal + "ms, the last of the " + FANS + " campaign pushes after " + slowest(n -> n.prio() == CAMPAIGN) + "ms";
    }

    String regionLine(String label) {
        long firstTry = count(n -> n.ch() == PUSH && attempts[n.id()] == 0 && handed[n.id()] >= REGION_DOWN[0] && handed[n.id()] < REGION_DOWN[1]);
        String share = mode == Mode.NO_SHARE ? "retries skip the quota check" : "retries took at most " + maxRetryShare + " of the " + QUOTA + " tokens a second while new pushes waited";
        String when = got429 == 0 ? "" : " from " + first429 + "ms to " + last429 + "ms";
        Notice yuna = named(YUNA, PUSH, URGENT);
        return label + ": fcm region down " + REGION_DOWN[0] + "-" + REGION_DOWN[1] + "ms, " + share + ", 429 from fcm " + got429 + when + " (" + new429 + " on a first try), yuna's urgent push in the failed region after " + (handed[yuna.id()] - yuna.received()) + "ms and " + attempts[yuna.id()] + " failures, pushes through on a first try in that time " + firstTry + ", the last campaign push after " + slowest(n -> n.prio() == CAMPAIGN) + "ms, failure queue " + count(n -> state[n.id()] == FAILURE_QUEUE);
    }

    void report() {
        Predicate<Notice> otp = n -> n.user() >= OTP_USERS;
        notes.get(2).add("sms: " + count(otp) + " urgent from 200000ms to 280000ms, sent to A " + sentTo[SMS_A] + " times and to B " + sentTo[SMS_B] + " times, " + count(n -> otp.test(n) && attempts[n.id()] > 0) + " failed at A and went out later, the slowest was handed over " + slowest(otp) + "ms after it was received");
        Notice p = named(JISU, PUSH, NORMAL), s = named(JISU, SMS, NORMAL);
        notes.get(2).add("jisu's device: push n=" + p.id() + " arrived " + deliveries[p.id()] + " times, on screen " + shown[p.id()] + " (the same tag replaces it), sms n=" + s.id() + " arrived " + deliveries[s.id()] + " times, on screen " + shown[s.id()]);
        notes.get(2).add("guide: " + notices.size() + " notifications, handed over " + count(n -> state[n.id()] == HANDED) + ", token removed " + count(n -> state[n.id()] == TOKEN_REMOVED) + ", failure queue " + count(n -> state[n.id()] == FAILURE_QUEUE) + ", still waiting " + count(n -> state[n.id()] == 0) + ", arrived twice on devices " + count(n -> deliveries[n.id()] > 1) + ", flagged by the platform as maybe sent twice " + maybeTwice);
    }

    static final String[] HEADS = {"-- scenario 1: login asks for one urgent sms while nothing else is running --", "-- scenario 2: a campaign for 10000 users comes first, urgent and normal pushes 1000ms later, an fcm region fails --", "-- scenario 3: sms A fails 220000-240000ms, a reply is lost, a token is gone, worker 0 stops before recording --"};

    public static void main(String[] args) {
        NotificationFanout g = run(Mode.GUIDE), one = run(Mode.ONE_QUEUE), none = run(Mode.NO_SHARE);
        g.report();
        g.notes.get(1).addAll(List.of(g.pushLine("guide"), one.pushLine("one-queue"), g.regionLine("guide"), none.regionLine("no-share")));
        for (int i = 0; i < 3; i++) {
            System.out.println(HEADS[i]);
            g.notes.get(i).forEach(System.out::println);
        }
    }
}

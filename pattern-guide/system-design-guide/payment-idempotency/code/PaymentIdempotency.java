import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;
import java.util.TreeMap;
import java.util.TreeSet;

enum Kind { BEGIN, PG, COMMIT, REPLY, RELAY, CONFIRM, RECONCILE }

enum Mode { KEYED, NO_KEY, LOCK, TIMEOUT_FAILS, NEW_PG_KEY, NO_CUTOFF }

enum St { PROCESSING, UNKNOWN, SUCCEEDED, FAILED }

record Ev(long at, long seq, Kind kind, int arg) {}
record Reply(int code, String body) {}
record Pay(int key, int order, int amount, long started) {}
record Idem(long fp, int pay) {}
record Call(int pay, int req) {}

record Req(int key, int order, int amount, int tries, boolean retries, boolean lose) {
    String body() { return "order=O" + order + "&amount=" + amount; }
}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;

    void schedule(long at, Kind kind, int arg) { queue.add(new Ev(at, seq++, kind, arg)); }

    Ev next() { return queue.poll(); }
}

public final class PaymentIdempotency {
    static final long APP_NET = 50, DB_NET = 1, PG_NET = 150, PG_TIMEOUT = 10_000, LOCK_TTL = 3_000;
    static final long RELAY_EVERY = 1_000, CONFIRM_EVERY = 60_000, CONFIRM_FOR = 3_600_000;
    static final long PG_KEEP = 10_800_000, RECONCILE_AT = 100_800_000, DOWN_FROM = 100_250, DOWN_TO = DOWN_FROM + 14_400_000;
    static final long[] BACKOFF = {1_000, 2_000, 4_000};
    static final String[] NAMES = {"processing", "unknown", "succeeded", "failed"};

    final Mode mode;
    final boolean loud;
    final int traced;
    final VirtualClock clock = new VirtualClock();
    final List<Req> reqs = new ArrayList<>();
    final List<Reply> replies = new ArrayList<>();
    final List<Pay> pays = new ArrayList<>();
    final List<St> states = new ArrayList<>();
    final List<Call> calls = new ArrayList<>();
    final List<Integer> outbox = new ArrayList<>(), pgLog = new ArrayList<>();
    final TreeSet<Integer> waiting = new TreeSet<>(), lost = new TreeSet<>(List.of(3, 4, 5));
    final TreeMap<Integer, Idem> idem = new TreeMap<>();
    final TreeMap<Integer, Reply> saved = new TreeMap<>();
    final TreeMap<Integer, Long> locks = new TreeMap<>();
    final TreeMap<Long, Long> pgSeen = new TreeMap<>();
    long dbTx;
    int nextKey, relayed, conflicts, replayed, busy, asks, anomalies;

    PaymentIdempotency(Mode mode, boolean loud, int traced) {
        this.mode = mode;
        this.loud = loud;
        this.traced = traced;
    }

    static long fingerprint(String body) {
        long h = 0;
        for (char ch : body.toCharArray()) h = (h * 31 + ch) % 1_000_000_007L;
        return h;
    }

    void say(long at, int r, String what) {
        if (reqs.get(r).key() == traced) System.out.println("t=" + at + "ms K" + traced + " req=" + r + " " + what);
    }

    void note(long at, int p, String what) { if (loud) System.out.println("t=" + at + "ms K" + pays.get(p).key() + " " + what); }

    void send(long at, int key, int order, int amount, int tries, boolean retries, boolean lose) {
        nextKey = Math.max(nextKey, key + 1);
        reqs.add(new Req(key, order, amount, tries, retries, lose));
        replies.add(null);
        clock.schedule(at + APP_NET + DB_NET, Kind.BEGIN, reqs.size() - 1);
    }

    Reply reply(int p) {
        St st = states.get(p);
        int code = st == St.SUCCEEDED ? 201 : st == St.FAILED ? 402 : 202;
        return new Reply(code, "{\"payment\":\"P" + pays.get(p).key() + "\",\"status\":\"" + NAMES[st.ordinal()] + "\"}");
    }

    void call(long now, int p, int r) {
        calls.add(new Call(p, r));
        waiting.add(calls.size() - 1);
        clock.schedule(now + DB_NET + PG_NET, Kind.PG, calls.size() - 1);
        clock.schedule(now + DB_NET + PG_TIMEOUT + DB_NET, Kind.COMMIT, -calls.size());
    }

    void answer(long now, int r, Reply reply) {
        replies.set(r, reply);
        clock.schedule(now + DB_NET + APP_NET, Kind.REPLY, r);
    }

    void settle(long now, int p, St st) {
        states.set(p, st);
        if (st != St.UNKNOWN && idem.containsKey(pays.get(p).key())) saved.put(pays.get(p).key(), reply(p));
        if (st != St.SUCCEEDED) return;
        outbox.add(p);
        clock.schedule((now / RELAY_EVERY + 1) * RELAY_EVERY, Kind.RELAY, 0);
    }

    void begin(long now, int r, Req q) {
        dbTx++;
        if (loud) say(now - DB_NET, r, "lb -> api-" + (r % 2 + 1) + " POST /payments " + q.body());
        Idem row = idem.get(q.key());
        long f = fingerprint(q.body());
        if (mode == Mode.LOCK && locks.getOrDefault(q.key(), 0L) > now) {
            busy++;
            answer(now, r, new Reply(409, "{\"error\":\"locked\"}"));
        } else if (mode == Mode.LOCK || row == null) {
            pays.add(new Pay(q.key(), q.order(), q.amount(), now));
            states.add(St.PROCESSING);
            if (mode == Mode.LOCK) locks.put(q.key(), now + LOCK_TTL);
            else idem.put(q.key(), new Idem(f, pays.size() - 1));
            say(now, r, "db: INSERT idempotency row + payment P" + q.key() + " (processing), commit");
            say(now + DB_NET, r, "api -> pg approve, idempotency key P" + q.key());
            call(now, pays.size() - 1, r);
        } else if (row.fp() != f) {
            System.out.println("t=" + now + "ms K" + q.key() + " req=" + r + " db: same key, fingerprint " + f + " != " + row.fp() + " -> 422");
            answer(now, r, new Reply(422, "{\"error\":\"different request body\"}"));
        } else if (saved.containsKey(q.key())) {
            replayed++;
            say(now, r, "db: duplicate key, response saved -> replay it with Idempotent-Replayed: true");
            answer(now, r, saved.get(q.key()));
        } else if (states.get(row.pay()) == St.PROCESSING) {
            conflicts++;
            say(now, r, "db: duplicate key, payment P" + q.key() + " processing -> 409");
            answer(now, r, new Reply(409, "{\"error\":\"in progress\"}"));
        } else {
            say(now, r, "db: duplicate key, payment P" + q.key() + " unknown -> ask pg again with key P" + q.key());
            call(now, row.pay(), r);
        }
    }

    void pg(long now, int id) {
        Call c = calls.get(id);
        Pay p = pays.get(c.pay());
        if (now >= DOWN_FROM && now < DOWN_TO) {
            if (c.req() >= 0) note(now, c.pay(), "pg: down, approve request for P" + p.key() + " never arrives");
            return;
        }
        long key = mode == Mode.NEW_PG_KEY ? 1_000_000L + id : c.pay();
        Long seen = pgSeen.get(key);
        boolean fresh = seen == null || now - seen >= PG_KEEP;
        if (fresh) {
            pgSeen.put(key, now);
            pgLog.add(c.pay());
        }
        boolean drop = lost.remove(p.order());
        String what = fresh ? "pg: approve P" + p.key() + " amount=" + p.amount() : "pg: key P" + p.key() + " seen, replay its approval";
        long n = pgLog.stream().filter(x -> x == c.pay()).count();
        note(now, c.pay(), what + " (approvals of P" + p.key() + ": " + n + ")" + (drop ? ", response lost" : ""));
        if (!drop) clock.schedule(now + PG_NET + DB_NET, Kind.COMMIT, id + 1);
    }

    void commit(long now, int id, boolean ok) {
        if (!waiting.remove(id)) return;
        dbTx++;
        Call c = calls.get(id);
        St st = states.get(c.pay());
        St next = ok ? St.SUCCEEDED : mode == Mode.TIMEOUT_FAILS ? St.FAILED : St.UNKNOWN;
        if (st == St.PROCESSING || (st == St.UNKNOWN && next != St.UNKNOWN)) {
            settle(now, c.pay(), next);
            String why = ok ? ", save response 201 + outbox row, commit" : " after pg read timeout, commit";
            note(now, c.pay(), "db: payment P" + pays.get(c.pay()).key() + " " + NAMES[next.ordinal()] + why + (c.req() < 0 ? " (confirm job)" : ""));
        }
        if (c.req() >= 0) answer(now, c.req(), reply(c.pay()));
    }

    void receive(long now, int r, Req q, Reply a) {
        say(now, r, q.lose() ? "app: connection dropped, response lost" : "app: " + a.code() + " " + a.body());
        boolean again = q.lose() || a.code() == 409 || (a.code() == 202 && q.retries());
        boolean anew = !q.lose() && a.code() == 402 && q.retries();
        int key = anew || mode == Mode.NO_KEY ? nextKey : q.key();
        if (again || anew) send(now + BACKOFF[Math.min(q.tries(), 2)], key, q.order(), q.amount(), q.tries() + 1, q.retries() && !anew, false);
    }

    void relay(long now) {
        for (; relayed < outbox.size(); relayed++) {
            Pay p = pays.get(outbox.get(relayed));
            note(now, outbox.get(relayed), "relay: outbox P" + p.key() + " -> order service, O" + p.order() + " paid");
        }
    }

    void confirm(long now) {
        for (int p = 0; p < pays.size(); p++) {
            boolean young = now - pays.get(p).started() < CONFIRM_FOR || mode == Mode.NO_CUTOFF;
            if (states.get(p) == St.UNKNOWN && young) {
                asks++;
                call(now, p, -1);
            }
        }
        if (now + CONFIRM_EVERY < RECONCILE_AT) clock.schedule(now + CONFIRM_EVERY, Kind.CONFIRM, 0);
    }

    void reconcile(long now) {
        int[] got = new int[pays.size()];
        for (int p : pgLog) got[p]++;
        int matched = 0, succeeded = 0, failed = 0;
        for (int p = 0; p < pays.size(); p++) {
            St st = states.get(p);
            if (st == St.UNKNOWN && got[p] < 2) {
                settle(now, p, got[p] == 1 ? St.SUCCEEDED : St.FAILED);
                succeeded += got[p];
                failed += 1 - got[p];
            } else if ((st == St.SUCCEEDED ? 1 : 0) == got[p]) matched++;
            else anomalies++;
        }
        if (loud) System.out.println("t=" + now + "ms reconcile with pg records: matched=" + matched + " unknown->succeeded=" + succeeded
                + " unknown->failed=" + failed + " anomalies=" + anomalies + " (confirm job asked pg again " + asks + " times before)");
    }

    String stats() {
        TreeMap<Integer, Integer> charged = new TreeMap<>();
        for (int p : pgLog) charged.merge(pays.get(p).order(), 1, Integer::sum);
        long twice = charged.values().stream().filter(n -> n > 1).count();
        long succeeded = states.stream().filter(s -> s == St.SUCCEEDED).count();
        return "requests=" + reqs.size() + " pg-approvals=" + pgLog.size() + " orders-charged-twice=" + twice
                + " payments-succeeded=" + succeeded + " order-notices=" + relayed;
    }

    PaymentIdempotency run() {
        for (Ev ev = clock.next(); ev != null; ev = clock.next()) {
            long now = ev.at();
            int a = ev.arg();
            switch (ev.kind()) {
                case BEGIN -> begin(now, a, reqs.get(a));
                case PG -> pg(now, a);
                case COMMIT -> commit(now, a > 0 ? a - 1 : -a - 1, a > 0);
                case REPLY -> receive(now, a, reqs.get(a), replies.get(a));
                case RELAY -> relay(now);
                case CONFIRM -> confirm(now);
                case RECONCILE -> reconcile(now);
            }
        }
        return this;
    }

    public static void main(String[] args) {
        System.out.println("-- scenario 1: K1 pays 30000 for O1, one request and no failure --");
        PaymentIdempotency one = new PaymentIdempotency(Mode.KEYED, true, 1);
        one.send(0, 1, 1, 30_000, 0, true, false);
        System.out.println("one payment: " + one.run().stats());
        System.out.println("-- scenario 2: 580 attempts in the peak second, every 10th pressed twice 30ms apart, K104 resent with another amount --");
        for (Mode m : new Mode[] {Mode.KEYED, Mode.LOCK}) {
            PaymentIdempotency s = new PaymentIdempotency(m, false, m == Mode.KEYED ? 109 : 0);
            for (int i = 0; i < 580; i++) s.send(i * 1000L / 580, 100 + i, 100 + i, 20_000, 0, true, false);
            for (int i = 9; i < 580; i += 10) s.send(i * 1000L / 580 + 30, 100 + i, 100 + i, 20_000, 0, true, false);
            s.send(4 * 1000L / 580 + 30, 104, 104, 21_000, 0, true, false);
            s.run();
            String extra = m == Mode.KEYED ? " 409=" + s.conflicts + " replayed=" + s.replayed : " lock-busy=" + s.busy;
            System.out.println((m == Mode.KEYED ? "idempotency-table: " : "redis-lock-3s: ") + s.stats() + " db-tx=" + s.dbTx + extra);
        }
        System.out.println("-- scenario 3: first the response to K2 is lost on its way to the app --");
        PaymentIdempotency lostReply = new PaymentIdempotency(Mode.KEYED, true, 2);
        lostReply.send(0, 2, 2, 30_000, 0, true, true);
        System.out.println("with-key: " + lostReply.run().stats());
        PaymentIdempotency bare = new PaymentIdempotency(Mode.NO_KEY, false, 0);
        bare.send(0, 2, 2, 30_000, 0, true, true);
        System.out.println("no-key: " + bare.run().stats());
        System.out.println("-- then pg loses the approval responses for P3 P4 P5 and stops answering from 100250ms for 4 hours --");
        for (Mode m : new Mode[] {Mode.KEYED, Mode.TIMEOUT_FAILS, Mode.NEW_PG_KEY, Mode.NO_CUTOFF}) {
            PaymentIdempotency s = new PaymentIdempotency(m, m == Mode.KEYED, m == Mode.KEYED ? 3 : 0);
            s.send(0, 3, 3, 50_000, 0, true, false);
            s.send(1_000, 4, 4, 40_000, 0, false, false);
            s.send(100_000, 5, 5, 70_000, 0, false, false);
            s.send(110_000, 6, 6, 15_000, 0, false, false);
            s.clock.schedule(CONFIRM_EVERY, Kind.CONFIRM, 0);
            s.clock.schedule(RECONCILE_AT, Kind.RECONCILE, 0);
            String name = m == Mode.KEYED ? "this guide" : m == Mode.TIMEOUT_FAILS ? "timeout-as-failure" : m == Mode.NEW_PG_KEY ? "new-pg-key-per-retry" : "no-confirm-cutoff";
            System.out.println(name + ": " + s.run().stats() + " anomalies=" + s.anomalies);
        }
    }
}

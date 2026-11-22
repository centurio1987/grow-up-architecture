import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.stream.IntStream;

enum Kind { TICK, APP, ARRIVE, RETRY, RELEASE, CHECKPOINT, STOP, RESTART }
enum Mode { GUIDE, BY_AD, NO_DEDUP, PROCESSING_TIME, NO_TRANSACTION, AT_LEAST_ONCE }
record Ev(long at, long seq, Kind kind, int a, int b) {}
record Rec(int id, int ad, long time, long writtenAt) {}
record Out(int cell, int value, boolean late) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;
    void schedule(long at, Kind kind, int a, int b) { queue.add(new Ev(at, seq++, kind, a, b)); }
    Ev next() { return queue.poll(); }
}

public final class AdClickAggregation {
    static final int PARTS = 8, ADS = 1_002, MINUTES = 16, CELLS = MINUTES * ADS, CAP = 2, HOT = 7, NEW_AD = 1_001;
    static final int POS = 0, MAXT = PARTS, FIRE = 2 * PARTS, COUNT = FIRE + 1, PART = COUNT + 1, SIZE = PART + PARTS * CELLS;
    static final long MINUTE = 60_000, BOUND = 5_000, LATENESS = 600_000, EVERY = 10_000, DOWN = 30_000, APP_NET = 50;
    static final long PEAK_FROM = 120_000, PEAK_TO = 180_000, B_AT = 300_000, C_AT = 842_000, STOP_AT = 847_000;

    final Mode mode;
    final boolean dedup, transaction, overwrite;
    final long lateness;
    final VirtualClock clock = new VirtualClock();
    final ArrayList<ArrayList<Rec>> parts = new ArrayList<>(), held = new ArrayList<>();
    final ArrayList<Out> open = new ArrayList<>();
    final ArrayList<ArrayList<String>> notes = new ArrayList<>();
    final int[] seenAt = new int[1_500_000], table = new int[CELLS], truth = new int[CELLS], lateTable = new int[ADS], lateTruth = new int[ADS];
    final int[] peakWrites = new int[PARTS], barrier = new int[PARTS];
    final long[] visibleAt = new long[MINUTES];
    int[] job = new int[SIZE], saved = job.clone();
    long seed = 2_026, dropped, resent, replayed, beforeB;
    int lastId, follow, hotPartials, hotFirst;
    boolean running = true, pending;

    AdClickAggregation(Mode mode) {
        this.mode = mode;
        dedup = mode != Mode.NO_DEDUP && mode != Mode.AT_LEAST_ONCE;
        transaction = mode != Mode.NO_TRANSACTION && mode != Mode.AT_LEAST_ONCE;
        overwrite = mode != Mode.AT_LEAST_ONCE;
        lateness = mode == Mode.AT_LEAST_ONCE ? 0 : LATENESS;
        for (int k = 0; k < PARTS; k++) parts.add(new ArrayList<>());
        for (int i = 0; i < 3; i++) notes.add(new ArrayList<>());
        for (int i = 0; i < 2; i++) held.add(new ArrayList<>());
        clock.schedule(30_000, Kind.APP, 0, 0);
        clock.schedule(30_000 + APP_NET, Kind.ARRIVE, 0, 0);
        clock.schedule(B_AT, Kind.RELEASE, 0, 0);
        clock.schedule(C_AT, Kind.RELEASE, 1, 0);
        clock.schedule(STOP_AT, Kind.STOP, 0, 0);
        clock.schedule(STOP_AT + DOWN, Kind.RESTART, 0, 0);
        clock.schedule(EVERY, Kind.CHECKPOINT, 0, 0);
        clock.schedule(0, Kind.TICK, 0, 0);
    }

    static int cell(long time, int ad) { return (int) (time / MINUTE) * ADS + ad; }
    static int partition(long key) { return (int) ((key * 2_654_435_761L) % 4_294_967_296L >>> 29); }
    static int part(int k, int c) { return PART + k * CELLS + c; }
    int total(int c) { return IntStream.range(0, PARTS).map(k -> job[part(k, c)]).sum(); }
    long watermark(int k, long now) { return mode == Mode.PROCESSING_TIME ? now : job[MAXT + k] - BOUND; }
    void note(int s, long at, String what) { if (mode == Mode.GUIDE) notes.get(s).add("t=" + at + "ms " + what); }

    long below(int n) {
        seed = seed * 48_271 % 2_147_483_647;
        return seed % n;
    }

    static AdClickAggregation run(Mode mode, long until) {
        AdClickAggregation s = new AdClickAggregation(mode);
        for (Ev e = s.clock.next(); e != null && e.at() <= until; e = s.clock.next()) s.handle(e);
        return s;
    }

    void handle(Ev e) {
        long t = e.at();
        switch (e.kind()) {
            case TICK -> tick(t);
            case APP -> note(0, t, "A app: clicks ad " + NEW_AD + " and sends the signed impression id that came with the ad");
            case ARRIVE -> arrive(t);
            case RETRY -> write(e.a(), e.b(), t, t);
            case RELEASE -> release(t, e.a());
            case CHECKPOINT -> trigger();
            case STOP -> stop(t);
            case RESTART -> restart(t);
        }
    }

    void tick(long t) {
        boolean peak = t >= PEAK_FROM && t < PEAK_TO;
        for (int i = 0; i < (peak ? 10 : 1); i++) generate(t, peak);
        if (running) {
            for (int k = 0; k < PARTS; k++) read(k, t);
            emit(t);
            if (pending && reached()) commit(t);
        }
        clock.schedule(t + 1, Kind.TICK, 0, 0);
    }

    void generate(long t, boolean peak) {
        int id = ++lastId;
        int ad = peak && below(10) < 3 ? HOT : 1 + (int) below(1_000);
        if (t >= PEAK_FROM && t < PEAK_FROM + 5_000 && (id % 10 == 1 || id % 10 == 2)) {
            held.get(id % 10 - 1).add(new Rec(id, ad, t, 0));
            return;
        }
        truth[cell(t, ad)]++;
        write(id, ad, t, t);
        if (peak && id % 100 == 0) clock.schedule(t + 1_000, Kind.RETRY, id, ad);
    }

    void write(int id, int ad, long time, long now) {
        int k = partition(mode == Mode.BY_AD ? ad : id);
        parts.get(k).add(new Rec(id, ad, time, now));
        if (now >= PEAK_FROM && now < PEAK_TO) peakWrites[k]++;
    }

    void arrive(long t) {
        follow = ++lastId;
        truth[cell(t, NEW_AD)]++;
        write(follow, NEW_AD, t, t);
        note(0, t, "ad server: signature ok, click id=" + follow + ", click time=" + t + ", writes it to partition " + partition(follow));
    }

    void release(long t, int which) {
        if (which == 0) beforeB = sum(table, 2);
        for (Rec r : held.get(which)) {
            if (t - (r.time() / MINUTE + 1) * MINUTE > LATENESS) lateTruth[r.ad()]++;
            else truth[cell(r.time(), r.ad())]++;
            write(r.id(), r.ad(), r.time(), t);
        }
        note(1, t, "ad server " + (which == 0 ? "b" : "c") + ": writes " + held.get(which).size() + " clicks held since minute 2, " + (t - PEAK_TO) + "ms after it ended");
    }

    void read(int k, long t) {
        ArrayList<Rec> p = parts.get(k);
        int limit = pending ? barrier[k] : p.size();
        for (int n = 0; n < CAP && job[POS + k] < limit && p.get(job[POS + k]).writtenAt() < t; n++) process(k, job[POS + k]++, t);
    }

    void process(int k, int at, long t) {
        Rec r = parts.get(k).get(at);
        if (dedup && seenAt[r.id()] != 0) {
            dropped++;
            return;
        }
        job[COUNT]++;
        if (dedup) seenAt[r.id()] = job[COUNT];
        long time = mode == Mode.PROCESSING_TIME ? t : r.time();
        int w = (int) (time / MINUTE);
        long wm = watermark(k, t);
        job[MAXT + k] = (int) Math.max(job[MAXT + k], time);
        if (k == partition(follow) && wm < MINUTE && watermark(k, t) >= MINUTE) note(0, t, "task " + k + ": watermark " + watermark(k, t) + " passed the end of minute 0, its partials for minute 0 are ready");
        if (wm >= (w + 1) * MINUTE + lateness) {
            if (lateness > 0) output(t, r.ad(), 1, true);
            return;
        }
        int c = cell(time, r.ad());
        job[part(k, c)]++;
        if (r.id() == follow) note(0, t, "task " + k + ": click id=" + r.id() + " is new, partial (ad " + r.ad() + ", minute " + w + ")=" + job[part(k, c)]);
        if (w >= job[FIRE]) return;
        resent++;
        output(t, c, total(c), false);
    }

    void emit(long t) {
        long low = IntStream.range(0, PARTS).mapToLong(k -> watermark(k, t)).min().getAsLong();
        while (job[FIRE] < MINUTES && (job[FIRE] + 1) * MINUTE <= low) fire(t, job[FIRE]++);
    }

    void fire(long t, int w) {
        int rows = 0;
        for (int c = w * ADS; c < (w + 1) * ADS; c++) {
            int sum = total(c);
            if (c == cell(PEAK_FROM, HOT)) hotPartials = (int) IntStream.range(0, PARTS).filter(k -> job[part(k, cell(PEAK_FROM, HOT))] > 0).count();
            if (c == cell(PEAK_FROM, HOT)) hotFirst = sum;
            if (sum == 0) continue;
            output(t, c, sum, false);
            rows++;
        }
        if (w == 0) note(0, t, "sum: every task passed minute 0, (ad " + NEW_AD + ", minute 0)=" + total(cell(0, NEW_AD)) + " goes into the open transaction");
        if (w == 13) note(2, t, "sum: minute 13 fires, " + rows + " results go into the open transaction");
    }

    void output(long t, int c, int value, boolean late) {
        if (transaction) open.add(new Out(c, value, late));
        else apply(t + 1, new Out(c, value, late));
    }

    void apply(long at, Out o) {
        if (o.late()) lateTable[o.cell()] += o.value();
        else table[o.cell()] = overwrite ? o.value() : table[o.cell()] + o.value();
        int w = o.cell() / ADS;
        if (o.late()) return;
        if (o.cell() == cell(0, NEW_AD)) note(0, at, "result table: (ad " + NEW_AD + ", minute 0)=" + o.value() + " is visible, " + (at - MINUTE) + "ms after minute 0 ended");
        if (visibleAt[w] != 0) return;
        visibleAt[w] = at;
        if (w == 13) note(2, at, "result table: minute 13 is visible, " + after(13) + "ms after it ended and " + (at - STOP_AT - DOWN) + "ms after the restart");
    }

    void trigger() {
        for (int k = 0; k < PARTS; k++) barrier[k] = parts.get(k).size();
        pending = running;
    }

    boolean reached() { return IntStream.range(0, PARTS).allMatch(k -> job[POS + k] >= barrier[k]); }

    void commit(long t) {
        pending = false;
        saved = job.clone();
        int s = t == 70_000 ? 0 : t == 840_000 || t > STOP_AT && t < STOP_AT + DOWN + EVERY ? 2 : -1;
        if (s >= 0) note(s, t, "checkpoint: all " + PARTS + " tasks reached the barrier, state and offsets saved, " + open.size() + " outputs committed");
        if (t > B_AT && t < B_AT + EVERY) note(1, t + 1, "result table: minute 2 with b's clicks is visible, " + (t + 1 - B_AT) + "ms after b wrote them");
        for (Out o : open) apply(t + 1, o);
        open.clear();
        clock.schedule((t / EVERY + 1) * EVERY, Kind.CHECKPOINT, 0, 0);
    }

    void stop(long t) {
        running = false;
        pending = false;
        note(2, t, "job: stops, " + open.size() + " outputs in the open transaction (" + open.stream().filter(Out::late).count() + " separate counts) are never committed");
        open.clear();
    }

    void restart(long t) {
        for (int k = 0; k < PARTS; k++) replayed += job[POS + k] - saved[POS + k];
        for (int id = 0; id < seenAt.length; id++) if (seenAt[id] > saved[COUNT]) seenAt[id] = 0;
        job = saved.clone();
        running = true;
        clock.schedule((t / EVERY + 1) * EVERY, Kind.CHECKPOINT, 0, 0);
        note(2, t, "job: restarts from the checkpoint at 840000ms, reads " + replayed + " records again from the saved offsets");
    }

    String check() {
        long over = IntStream.range(0, CELLS).filter(c -> visibleAt[c / ADS] != 0).map(c -> Math.max(0, table[c] - truth[c])).sum();
        long under = IntStream.range(0, CELLS).filter(c -> visibleAt[c / ADS] != 0).map(c -> Math.max(0, truth[c] - table[c])).sum();
        return "over=" + over + " under=" + under + " counted-separately=" + sum(lateTable, 0) + " of " + sum(lateTruth, 0);
    }

    static long sum(int[] a, int w) { return Arrays.stream(a, w * ADS, (w + 1) * ADS).asLongStream().sum(); }
    String minute(int w) { return "minute-" + w + "=" + sum(table, w) + " of " + sum(truth, w); }
    long after(int w) { return visibleAt[w] - (w + 1) * MINUTE; }
    int busiest() { return Arrays.stream(peakWrites).max().getAsInt() / 60; }

    public static void main(String[] args) {
        AdClickAggregation g = run(Mode.GUIDE, 910_010);
        AdClickAggregation byAd = run(Mode.BY_AD, 300_000);
        AdClickAggregation noDedup = run(Mode.NO_DEDUP, 260_000);
        AdClickAggregation proc = run(Mode.PROCESSING_TIME, 910_010);
        AdClickAggregation noTx = run(Mode.NO_TRANSACTION, 910_010);
        AdClickAggregation alo = run(Mode.AT_LEAST_ONCE, 910_010);
        long worst = IntStream.range(0, MINUTES).filter(w -> w != 13 && g.visibleAt[w] != 0).mapToLong(g::after).max().getAsLong();
        System.out.println("-- scenario 1: A clicks ad 1001 at 30000ms while 1000 clicks per second flow into 8 partitions --");
        g.notes.get(0).forEach(System.out::println);
        System.out.println("-- scenario 2: 10000 clicks per second in minute 2, 30% on ad 7, 1% sent twice, ad servers b and c hold 5s of clicks --");
        System.out.println("guide: held-by-b-and-c=" + (g.held.get(0).size() + g.held.get(1).size()) + " dropped-duplicates=" + g.dropped + " busiest-partition-per-second=" + g.busiest() + " ad-7=" + g.hotFirst + " from " + g.hotPartials + " partials minute-2-visible-after=" + g.after(2) + "ms");
        System.out.println("by-ad: busiest-partition-per-second=" + byAd.busiest() + " minute-2-visible-after=" + byAd.after(2) + "ms minute-3-visible-after=" + byAd.after(3) + "ms");
        System.out.println("no-dedup: " + noDedup.check());
        System.out.println(g.notes.get(1).get(0));
        System.out.println("guide: minute-2 " + g.beforeB + " -> " + sum(g.table, 2) + " results-sent-again=" + g.resent);
        System.out.println(g.notes.get(1).get(1));
        System.out.println("processing-time: " + proc.minute(2) + " " + proc.minute(5));
        System.out.println(g.notes.get(1).get(2));
        System.out.println("guide: " + g.minute(2) + " " + g.check());
        System.out.println("-- scenario 3: the job stops at 847000ms, 7000ms after the checkpoint at 840000ms, and restarts 30000ms later --");
        g.notes.get(2).forEach(System.out::println);
        System.out.println("guide: replayed=" + g.replayed + " minute-13-visible-after=" + g.after(13) + "ms " + g.check());
        System.out.println("no-transaction: minute-13-visible-after=" + noTx.after(13) + "ms " + noTx.check());
        System.out.println("at-least-once: " + alo.minute(2) + " " + alo.minute(13) + " " + alo.check());
        System.out.println("all minutes: guide visible-after-max=" + worst + "ms except minute 13, " + g.check());
    }
}

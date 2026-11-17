import java.util.Arrays;
import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.TreeMap;

enum Kind { REFRESH, ADMIT, MAP, HOLD, WRITE, PAY, CONFIRM }

enum Mode { GUIDE, FOR_UPDATE, SPLIT, OPTIMISTIC, INSERT_ONLY, NO_UNIQUE }

record Ev(long at, long seq, Kind kind, int arg) {}

final class VirtualClock {
    private final PriorityQueue<Ev> queue =
            new PriorityQueue<>(Comparator.comparingLong(Ev::at).thenComparingLong(Ev::seq));
    private long seq = 0;

    void schedule(long at, Kind kind, int arg) { queue.add(new Ev(at, seq++, kind, arg)); }

    Ev next() { return queue.poll(); }
}

final class Seat {
    int status, holder, no, sales, shown;
    long until, lock;
}

final class User {
    int want, no, read;
    long entry = TicketSeatHold.ENTRY, first = -1;
}

public final class TicketSeatHold {
    static final long APP_NET = 50, DB_NET = 1, PICK = 20_000, ENTRY = 280_000, PAY_RTT = 2_000;
    static final long HOLD_TTL = 600_000, TICK = 1_000, SPAN = 60_000, PRICE = 110_000;
    static final int RATE = 10, WINDOW = 100, FREE = 0, HELD = 1, SOLD = 2;
    static final String[] SHOWN = {"free", "held", "sold"};

    final Mode mode;
    final boolean room;
    final int tracedUser;
    final Seat[] seat;
    final User[] user;
    final VirtualClock clock = new VirtualClock();
    final TreeMap<Long, Integer> perSecond = new TreeMap<>();
    final StringBuilder soldTo = new StringBuilder();
    String[] names;
    long seed = 2026, downFrom = -1, downTo = -1, mapAt, lastSale, waitMax, soldOutAt;
    int tracedSeat, admitted, choosing, inside, insideMax, mapFree, mapSold;
    int tries, statements, ok, refused, twice, conflicts, refunds;

    TicketSeatHold(Mode mode, int seats, int people, boolean room, int tracedUser, int tracedSeat) {
        this.mode = mode;
        this.room = room;
        this.tracedUser = tracedUser;
        this.tracedSeat = tracedSeat;
        seat = new Seat[seats];
        user = new User[people];
        Arrays.setAll(seat, i -> new Seat());
        Arrays.setAll(user, i -> new User());
        if (room) clock.schedule(0, Kind.REFRESH, 0);
        if (room) clock.schedule(0, Kind.ADMIT, 0);
    }

    String name(int u) { return names != null ? names[u] : "U" + (u + 1); }
    long arrive(int u) { return u * SPAN / user.length; }
    boolean busy() { return inside > 0 || (room && soldOutAt == 0 && admitted < user.length); }
    void count(long now) { perSecond.merge(now / TICK, 1, Integer::sum); }

    void trace(long at, int u, int s, String what) {
        if (u == tracedUser || (s >= 0 && s == tracedSeat)) System.out.println("t=" + at + "ms " + name(u) + " " + what);
    }

    int below(int n) {
        seed = seed * 48_271 % 2_147_483_647;
        return (int) (seed % n);
    }

    int shown(Seat x, long now) { return x.status == SOLD ? SOLD : x.status == HELD && x.until > now ? HELD : FREE; }
    boolean free(Seat x, long now) { return mode == Mode.FOR_UPDATE ? x.status != SOLD && x.lock < now : shown(x, now) == FREE; }
    String state(Seat x, long now) { return shown(x, now) == SOLD ? "sold" : "held by " + name(x.holder) + " until " + x.until + "ms"; }
    long approval(long payAt) { return (payAt >= downFrom && payAt < downTo ? downTo : payAt) + PAY_RTT; }

    void refresh(long now) {
        mapAt = now;
        mapFree = 0;
        mapSold = 0;
        for (int s = 0; s < seat.length; s++) {
            int was = seat[s].shown;
            seat[s].shown = shown(seat[s], now);
            if (seat[s].shown == FREE) mapFree++;
            if (seat[s].shown == SOLD) mapSold++;
            if (s == tracedSeat && seat[s].shown != was) System.out.println("t=" + now + "ms map: seat " + (s + 1) + " shows " + SHOWN[seat[s].shown]);
        }
        if (busy()) clock.schedule(now + TICK, Kind.REFRESH, 0);
    }

    void admit(long now) {
        if (mapSold == seat.length && soldOutAt == 0) soldOutAt = now;
        for (int n = 0; soldOutAt == 0 && admitted < user.length && arrive(admitted) <= now && n < RATE && choosing < mapFree; n++) {
            int u = admitted++;
            choosing++;
            inside++;
            insideMax = Math.max(insideMax, inside);
            trace(now, u, -1, "room: arrived at " + arrive(u) + "ms, admitted with a token");
            clock.schedule(now + APP_NET, Kind.MAP, u);
        }
        if (busy()) clock.schedule(now + TICK, Kind.ADMIT, 0);
    }

    void openMap(long now, int u) {
        count(now);
        if (mapFree == 0) {
            choosing--;
            inside--;
            trace(now, u, -1, "api: no free seat on the map, leaves");
            return;
        }
        int r = below(Math.min(mapFree, WINDOW));
        int s = -1;
        for (int seen = -1; seen < r; ) if (seat[++s].shown == FREE) seen++;
        user[u].want = s;
        if (u == tracedUser) tracedSeat = s;
        trace(now, u, s, "api: seat map refreshed at " + mapAt + "ms, free=" + mapFree + ", picks seat " + (s + 1));
        clock.schedule(now + APP_NET + PICK + APP_NET + DB_NET, Kind.HOLD, u);
    }

    void hold(long now, int u) {
        User p = user[u];
        Seat x = seat[p.want];
        if (p.first < 0) {
            p.first = now;
            tries++;
            statements++;
            count(now);
        }
        boolean twoStep = mode == Mode.SPLIT || mode == Mode.OPTIMISTIC;
        if (mode == Mode.FOR_UPDATE && x.status != SOLD && x.lock >= now) {
            trace(now, u, p.want, "db: SELECT seat " + (p.want + 1) + " FOR UPDATE -> waits for " + name(x.holder) + "'s lock until " + x.lock + "ms");
            clock.schedule(x.lock, Kind.HOLD, u);
        } else if (!free(x, now)) {
            refuse(now, u, "db: " + (twoStep ? "SELECT" : "UPDATE") + " seat " + (p.want + 1) + " -> " + (twoStep ? "" : "0 rows, ") + state(x, now));
        } else if (twoStep) {
            p.read = x.no;
            trace(now, u, p.want, "db: SELECT seat " + (p.want + 1) + " -> free, hold_no=" + x.no);
            clock.schedule(now + 2 * DB_NET, Kind.WRITE, u);
        } else grant(now, u);
    }

    void write(long now, int u) {
        User p = user[u];
        statements++;
        if (mode == Mode.OPTIMISTIC && seat[p.want].no != p.read) {
            conflicts++;
            refuse(now, u, "db: UPDATE seat " + (p.want + 1) + " WHERE hold_no=" + p.read + " -> 0 rows, version changed");
        } else grant(now, u);
    }

    void grant(long now, int u) {
        User p = user[u];
        Seat x = seat[p.want];
        boolean other = x.status == HELD && x.until > now;
        String before = other ? ", but " + name(x.holder) + " was told held too" : "";
        if (other) twice++;
        if (mode != Mode.FOR_UPDATE) x.status = HELD;
        x.holder = u;
        x.no++;
        x.until = now + HOLD_TTL;
        p.no = x.no;
        ok++;
        choosing--;
        waitMax = Math.max(waitMax, now - p.first);
        p.first = -1;
        long payAt = now + DB_NET + APP_NET + p.entry + APP_NET;
        if (mode == Mode.FOR_UPDATE) x.lock = approval(payAt) + DB_NET;
        String how = mode == Mode.FOR_UPDATE ? "FOR UPDATE -> locked until " + x.lock + "ms" : "-> 1 row, hold_no=" + x.no + " until=" + x.until + "ms";
        trace(now, u, p.want, "db: " + (mode == Mode.FOR_UPDATE ? "SELECT" : "UPDATE") + " seat " + (p.want + 1) + " " + how + before);
        clock.schedule(payAt, Kind.PAY, u);
    }

    void refuse(long now, int u, String what) {
        User p = user[u];
        refused++;
        waitMax = Math.max(waitMax, now - p.first);
        p.first = -1;
        trace(now, u, p.want, what);
        if (room) clock.schedule(now + DB_NET + APP_NET + APP_NET, Kind.MAP, u);
    }

    void pay(long now, int u) {
        count(now);
        boolean down = now >= downFrom && now < downTo;
        trace(now, u, user[u].want, "api: pay " + PRICE + " won -> payment service" + (down ? ", which is down until " + downTo + "ms" : ""));
        clock.schedule(approval(now) + DB_NET, Kind.CONFIRM, u);
    }

    void confirm(long now, int u) {
        User p = user[u];
        Seat x = seat[p.want];
        count(now);
        inside--;
        boolean rowCheck = mode != Mode.INSERT_ONLY && mode != Mode.NO_UNIQUE;
        boolean mine = mode == Mode.FOR_UPDATE || (x.status == HELD && x.no == p.no && x.until > now);
        String update = "confirm UPDATE seat " + (p.want + 1) + " hold_no=" + p.no + " -> ";
        if (rowCheck && !mine) refund(now, u, update + "0 rows (seat hold_no=" + x.no + "), rollback, no INSERT");
        else if (mode != Mode.NO_UNIQUE && x.sales > 0) refund(now, u, "INSERT sale seat " + (p.want + 1) + " -> 23505 unique_violation, rollback");
        else {
            if (rowCheck) x.status = SOLD;
            x.sales++;
            lastSale = now;
            soldTo.append(' ').append(name(u));
            result(now, u, "db: payment approved, " + (rowCheck ? update + "1 row, INSERT sale" : "INSERT sale seat " + (p.want + 1)) + " -> 1 row, commit");
            if (u == tracedUser) System.out.println("t=" + (now + DB_NET + APP_NET) + "ms " + name(u) + " app: ticket for seat " + (p.want + 1));
        }
    }

    void refund(long now, int u, String what) {
        refunds++;
        result(now, u, "db: payment approved, " + what + ", refund " + PRICE + " won");
    }

    void result(long at, int u, String what) {
        if (names != null && tracedSeat < 0) System.out.println("t=" + at + "ms " + name(u) + " " + what);
        else trace(at, u, user[u].want, what);
    }

    TicketSeatHold run() {
        for (Ev ev = clock.next(); ev != null; ev = clock.next()) {
            switch (ev.kind()) {
                case REFRESH -> refresh(ev.at());
                case ADMIT -> admit(ev.at());
                case MAP -> openMap(ev.at(), ev.arg());
                case HOLD -> hold(ev.at(), ev.arg());
                case WRITE -> write(ev.at(), ev.arg());
                case PAY -> pay(ev.at(), ev.arg());
                case CONFIRM -> confirm(ev.at(), ev.arg());
            }
        }
        return this;
    }

    String stats() {
        int sold = Arrays.stream(seat).mapToInt(x -> x.sales).sum();
        long twiceSold = Arrays.stream(seat).filter(x -> x.sales > 1).count();
        return "tries=" + tries + " hold-statements=" + statements + " held=" + ok + " refused=" + refused + " told-held-twice=" + twice
                + " refunds=" + refunds + " sales=" + sold + " double-sold=" + twiceSold + " hold-reply-max=" + (waitMax + 2 * (APP_NET + DB_NET)) + "ms";
    }

    String roomStats() {
        return "admitted=" + admitted + " last-admitted-arrived=" + arrive(admitted - 1) + "ms on-booking-path-max=" + insideMax
                + " booking-requests-per-second-max=" + perSecond.values().stream().max(Integer::compare).get() + " last-sale=" + lastSale + "ms sold-out-notice=" + soldOutAt + "ms in-line=" + (user.length - admitted);
    }

    static int arrivalsPeak(int people) {
        TreeMap<Long, Integer> per = new TreeMap<>();
        for (long u = 0; u < people; u++) per.merge(u * SPAN / people / TICK, 1, Integer::sum);
        return per.values().stream().max(Integer::compare).get();
    }

    public static void main(String[] args) {
        System.out.println("-- scenario 1: U1 is first in line and buys one of 500 seats, no load and no failure --");
        TicketSeatHold one = new TicketSeatHold(Mode.GUIDE, 500, 1, true, 0, -1).run();
        System.out.println("one booking: " + one.stats());
        System.out.println("-- scenario 2: 20000 people arrive within 60s for 500 seats, the room admits up to 10 per second --");
        Mode[] modes = {Mode.GUIDE, Mode.FOR_UPDATE, Mode.SPLIT, Mode.OPTIMISTIC};
        String[] labels = {"guide", "for-update", "split-select-update", "optimistic-version"};
        for (int i = 0; i < modes.length; i++) {
            TicketSeatHold s = new TicketSeatHold(modes[i], 500, 20_000, true, -1, i % 2 == 0 ? 22 : -1).run();
            System.out.println(labels[i] + ": " + s.stats() + (modes[i] == Mode.OPTIMISTIC ? " version-conflicts=" + s.conflicts : ""));
            if (i < 2) System.out.println(labels[i] + " room: " + s.roomStats());
        }
        System.out.println("no room: every arrival opens the seat map at once, booking-requests-per-second-max=" + arrivalsPeak(20_000) + " on-booking-path-max=20000");
        System.out.println("-- scenario 3: A holds the last seat, the payment service stops 594000~606000ms while A pays, B presses every 60s from 300000ms --");
        Mode[] late = {Mode.GUIDE, Mode.INSERT_ONLY, Mode.NO_UNIQUE};
        String[] lateLabels = {"guide", "insert-only", "insert-only-no-unique"};
        for (int i = 0; i < late.length; i++) {
            TicketSeatHold s = new TicketSeatHold(late[i], 1, 2, false, -1, i == 0 ? 0 : -1);
            s.names = new String[] {"A", "B"};
            s.downFrom = 594_000;
            s.downTo = 606_000;
            s.user[0].entry = 594_899;
            s.clock.schedule(0, Kind.HOLD, 0);
            for (long t = 300_000; t <= 600_000; t += 60_000) s.clock.schedule(t, Kind.HOLD, 1);
            System.out.println(lateLabels[i] + ": " + s.run().stats() + " seat 1 sold to" + s.soldTo);
        }
    }
}

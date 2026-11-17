enum Kind { REFRESH, ADMIT, MAP, HOLD, WRITE, PAY, CONFIRM }

enum Mode { GUIDE, FOR_UPDATE, SPLIT, OPTIMISTIC, INSERT_ONLY, NO_UNIQUE }

interface Ev { at: number; seq: number; kind: Kind; arg: number }

const APP_NET = 50, DB_NET = 1, PICK = 20_000, ENTRY = 280_000, PAY_RTT = 2_000;
const HOLD_TTL = 600_000, TICK = 1_000, SPAN = 60_000, PRICE = 110_000;
const RATE = 10, WINDOW = 100, FREE = 0, HELD = 1, SOLD = 2;
const SHOWN = ["free", "held", "sold"];

class VirtualClock {
  private queue: Ev[] = [];
  private seq = 0;

  schedule(at: number, kind: Kind, arg: number): void {
    let i = this.queue.length;
    while (i > 0 && this.queue[i - 1]!.at > at) i--;
    this.queue.splice(i, 0, { at, seq: this.seq++, kind, arg });
  }

  next(): Ev | undefined { return this.queue.shift(); }
}

interface Seat { status: number; holder: number; no: number; sales: number; shown: number; until: number; lock: number }
interface User { want: number; no: number; read: number; entry: number; first: number }

class TicketSeatHold {
  readonly seat: Seat[];
  readonly user: User[];
  readonly clock = new VirtualClock();
  readonly perSecond = new Map<number, number>();
  soldTo = "";
  names: string[] | null = null;
  seed = 2026;
  downFrom = -1;
  downTo = -1;
  mapAt = 0;
  lastSale = 0;
  waitMax = 0;
  soldOutAt = 0;
  admitted = 0;
  choosing = 0;
  inside = 0;
  insideMax = 0;
  mapFree = 0;
  mapSold = 0;
  tries = 0;
  statements = 0;
  ok = 0;
  refused = 0;
  twice = 0;
  conflicts = 0;
  refunds = 0;

  constructor(readonly mode: Mode, seats: number, people: number, readonly room: boolean, readonly tracedUser: number, public tracedSeat: number) {
    this.seat = Array.from({ length: seats }, () => ({ status: 0, holder: 0, no: 0, sales: 0, shown: 0, until: 0, lock: 0 }));
    this.user = Array.from({ length: people }, () => ({ want: 0, no: 0, read: 0, entry: ENTRY, first: -1 }));
    if (room) this.clock.schedule(0, Kind.REFRESH, 0);
    if (room) this.clock.schedule(0, Kind.ADMIT, 0);
  }

  name(u: number): string { return this.names !== null ? this.names[u]! : "U" + (u + 1); }
  arrive(u: number): number { return Math.floor(u * SPAN / this.user.length); }
  busy(): boolean { return this.inside > 0 || (this.room && this.soldOutAt === 0 && this.admitted < this.user.length); }
  count(now: number): void { this.perSecond.set(Math.floor(now / TICK), (this.perSecond.get(Math.floor(now / TICK)) ?? 0) + 1); }

  below(n: number): number {
    this.seed = this.seed * 48_271 % 2_147_483_647;
    return this.seed % n;
  }

  shown(x: Seat, now: number): number { return x.status === SOLD ? SOLD : x.status === HELD && x.until > now ? HELD : FREE; }
  free(x: Seat, now: number): boolean { return this.mode === Mode.FOR_UPDATE ? x.status !== SOLD && x.lock < now : this.shown(x, now) === FREE; }
  state(x: Seat, now: number): string { return this.shown(x, now) === SOLD ? "sold" : "held by " + this.name(x.holder) + " until " + x.until + "ms"; }
  approval(payAt: number): number { return (payAt >= this.downFrom && payAt < this.downTo ? this.downTo : payAt) + PAY_RTT; }

  trace(at: number, u: number, s: number, what: string): void {
    if (u === this.tracedUser || (s >= 0 && s === this.tracedSeat)) console.log("t=" + at + "ms " + this.name(u) + " " + what);
  }

  refresh(now: number): void {
    this.mapAt = now;
    this.mapFree = 0;
    this.mapSold = 0;
    for (let s = 0; s < this.seat.length; s++) {
      const x = this.seat[s]!;
      const was = x.shown;
      x.shown = this.shown(x, now);
      if (x.shown === FREE) this.mapFree++;
      if (x.shown === SOLD) this.mapSold++;
      if (s === this.tracedSeat && x.shown !== was) console.log("t=" + now + "ms map: seat " + (s + 1) + " shows " + SHOWN[x.shown]);
    }
    if (this.busy()) this.clock.schedule(now + TICK, Kind.REFRESH, 0);
  }

  admit(now: number): void {
    if (this.mapSold === this.seat.length && this.soldOutAt === 0) this.soldOutAt = now;
    for (let n = 0; this.soldOutAt === 0 && this.admitted < this.user.length && this.arrive(this.admitted) <= now && n < RATE && this.choosing < this.mapFree; n++) {
      const u = this.admitted++;
      this.choosing++;
      this.inside++;
      this.insideMax = Math.max(this.insideMax, this.inside);
      this.trace(now, u, -1, "room: arrived at " + this.arrive(u) + "ms, admitted with a token");
      this.clock.schedule(now + APP_NET, Kind.MAP, u);
    }
    if (this.busy()) this.clock.schedule(now + TICK, Kind.ADMIT, 0);
  }

  openMap(now: number, u: number): void {
    this.count(now);
    if (this.mapFree === 0) {
      this.choosing--;
      this.inside--;
      this.trace(now, u, -1, "api: no free seat on the map, leaves");
      return;
    }
    const r = this.below(Math.min(this.mapFree, WINDOW));
    let s = -1;
    for (let seen = -1; seen < r; ) if (this.seat[++s]!.shown === FREE) seen++;
    this.user[u]!.want = s;
    if (u === this.tracedUser) this.tracedSeat = s;
    this.trace(now, u, s, "api: seat map refreshed at " + this.mapAt + "ms, free=" + this.mapFree + ", picks seat " + (s + 1));
    this.clock.schedule(now + APP_NET + PICK + APP_NET + DB_NET, Kind.HOLD, u);
  }

  hold(now: number, u: number): void {
    const p = this.user[u]!;
    const x = this.seat[p.want]!;
    if (p.first < 0) {
      p.first = now;
      this.tries++;
      this.statements++;
      this.count(now);
    }
    const twoStep = this.mode === Mode.SPLIT || this.mode === Mode.OPTIMISTIC;
    if (this.mode === Mode.FOR_UPDATE && x.status !== SOLD && x.lock >= now) {
      this.trace(now, u, p.want, "db: SELECT seat " + (p.want + 1) + " FOR UPDATE -> waits for " + this.name(x.holder) + "'s lock until " + x.lock + "ms");
      this.clock.schedule(x.lock, Kind.HOLD, u);
    } else if (!this.free(x, now)) {
      this.refuse(now, u, "db: " + (twoStep ? "SELECT" : "UPDATE") + " seat " + (p.want + 1) + " -> " + (twoStep ? "" : "0 rows, ") + this.state(x, now));
    } else if (twoStep) {
      p.read = x.no;
      this.trace(now, u, p.want, "db: SELECT seat " + (p.want + 1) + " -> free, hold_no=" + x.no);
      this.clock.schedule(now + 2 * DB_NET, Kind.WRITE, u);
    } else this.grant(now, u);
  }

  write(now: number, u: number): void {
    const p = this.user[u]!;
    this.statements++;
    if (this.mode === Mode.OPTIMISTIC && this.seat[p.want]!.no !== p.read) {
      this.conflicts++;
      this.refuse(now, u, "db: UPDATE seat " + (p.want + 1) + " WHERE hold_no=" + p.read + " -> 0 rows, version changed");
    } else this.grant(now, u);
  }

  grant(now: number, u: number): void {
    const p = this.user[u]!;
    const x = this.seat[p.want]!;
    const other = x.status === HELD && x.until > now;
    const before = other ? ", but " + this.name(x.holder) + " was told held too" : "";
    if (other) this.twice++;
    if (this.mode !== Mode.FOR_UPDATE) x.status = HELD;
    x.holder = u;
    x.no++;
    x.until = now + HOLD_TTL;
    p.no = x.no;
    this.ok++;
    this.choosing--;
    this.waitMax = Math.max(this.waitMax, now - p.first);
    p.first = -1;
    const payAt = now + DB_NET + APP_NET + p.entry + APP_NET;
    if (this.mode === Mode.FOR_UPDATE) x.lock = this.approval(payAt) + DB_NET;
    const how = this.mode === Mode.FOR_UPDATE ? "FOR UPDATE -> locked until " + x.lock + "ms" : "-> 1 row, hold_no=" + x.no + " until=" + x.until + "ms";
    this.trace(now, u, p.want, "db: " + (this.mode === Mode.FOR_UPDATE ? "SELECT" : "UPDATE") + " seat " + (p.want + 1) + " " + how + before);
    this.clock.schedule(payAt, Kind.PAY, u);
  }

  refuse(now: number, u: number, what: string): void {
    const p = this.user[u]!;
    this.refused++;
    this.waitMax = Math.max(this.waitMax, now - p.first);
    p.first = -1;
    this.trace(now, u, p.want, what);
    if (this.room) this.clock.schedule(now + DB_NET + APP_NET + APP_NET, Kind.MAP, u);
  }

  pay(now: number, u: number): void {
    this.count(now);
    const down = now >= this.downFrom && now < this.downTo;
    this.trace(now, u, this.user[u]!.want, "api: pay " + PRICE + " won -> payment service" + (down ? ", which is down until " + this.downTo + "ms" : ""));
    this.clock.schedule(this.approval(now) + DB_NET, Kind.CONFIRM, u);
  }

  confirm(now: number, u: number): void {
    const p = this.user[u]!;
    const x = this.seat[p.want]!;
    this.count(now);
    this.inside--;
    const rowCheck = this.mode !== Mode.INSERT_ONLY && this.mode !== Mode.NO_UNIQUE;
    const mine = this.mode === Mode.FOR_UPDATE || (x.status === HELD && x.no === p.no && x.until > now);
    const update = "confirm UPDATE seat " + (p.want + 1) + " hold_no=" + p.no + " -> ";
    if (rowCheck && !mine) this.refund(now, u, update + "0 rows (seat hold_no=" + x.no + "), rollback, no INSERT");
    else if (this.mode !== Mode.NO_UNIQUE && x.sales > 0) this.refund(now, u, "INSERT sale seat " + (p.want + 1) + " -> 23505 unique_violation, rollback");
    else {
      if (rowCheck) x.status = SOLD;
      x.sales++;
      this.lastSale = now;
      this.soldTo += " " + this.name(u);
      this.result(now, u, "db: payment approved, " + (rowCheck ? update + "1 row, INSERT sale" : "INSERT sale seat " + (p.want + 1)) + " -> 1 row, commit");
      if (u === this.tracedUser) console.log("t=" + (now + DB_NET + APP_NET) + "ms " + this.name(u) + " app: ticket for seat " + (p.want + 1));
    }
  }

  refund(now: number, u: number, what: string): void {
    this.refunds++;
    this.result(now, u, "db: payment approved, " + what + ", refund " + PRICE + " won");
  }

  result(at: number, u: number, what: string): void {
    if (this.names !== null && this.tracedSeat < 0) console.log("t=" + at + "ms " + this.name(u) + " " + what);
    else this.trace(at, u, this.user[u]!.want, what);
  }

  run(): this {
    for (let ev = this.clock.next(); ev !== undefined; ev = this.clock.next()) {
      switch (ev.kind) {
        case Kind.REFRESH: this.refresh(ev.at);
          break;
        case Kind.ADMIT: this.admit(ev.at);
          break;
        case Kind.MAP: this.openMap(ev.at, ev.arg);
          break;
        case Kind.HOLD: this.hold(ev.at, ev.arg);
          break;
        case Kind.WRITE: this.write(ev.at, ev.arg);
          break;
        case Kind.PAY: this.pay(ev.at, ev.arg);
          break;
        case Kind.CONFIRM: this.confirm(ev.at, ev.arg);
          break;
      }
    }
    return this;
  }

  stats(): string {
    const sold = this.seat.reduce((n, x) => n + x.sales, 0);
    const twiceSold = this.seat.filter((x) => x.sales > 1).length;
    return "tries=" + this.tries + " hold-statements=" + this.statements + " held=" + this.ok + " refused=" + this.refused + " told-held-twice=" + this.twice
      + " refunds=" + this.refunds + " sales=" + sold + " double-sold=" + twiceSold + " hold-reply-max=" + (this.waitMax + 2 * (APP_NET + DB_NET)) + "ms";
  }

  roomStats(): string {
    return "admitted=" + this.admitted + " last-admitted-arrived=" + this.arrive(this.admitted - 1) + "ms on-booking-path-max=" + this.insideMax
      + " booking-requests-per-second-max=" + Math.max(...this.perSecond.values()) + " last-sale=" + this.lastSale + "ms sold-out-notice=" + this.soldOutAt + "ms in-line=" + (this.user.length - this.admitted);
  }

  static arrivalsPeak(people: number): number {
    const per = new Map<number, number>();
    for (let u = 0; u < people; u++) per.set(Math.floor(Math.floor(u * SPAN / people) / TICK), (per.get(Math.floor(Math.floor(u * SPAN / people) / TICK)) ?? 0) + 1);
    return Math.max(...per.values());
  }
}

console.log("-- scenario 1: U1 is first in line and buys one of 500 seats, no load and no failure --");
const one = new TicketSeatHold(Mode.GUIDE, 500, 1, true, 0, -1).run();
console.log("one booking: " + one.stats());
console.log("-- scenario 2: 20000 people arrive within 60s for 500 seats, the room admits up to 10 per second --");
const modes = [Mode.GUIDE, Mode.FOR_UPDATE, Mode.SPLIT, Mode.OPTIMISTIC];
const labels = ["guide", "for-update", "split-select-update", "optimistic-version"];
for (let i = 0; i < modes.length; i++) {
  const s = new TicketSeatHold(modes[i]!, 500, 20_000, true, -1, i % 2 === 0 ? 22 : -1).run();
  console.log(labels[i] + ": " + s.stats() + (modes[i] === Mode.OPTIMISTIC ? " version-conflicts=" + s.conflicts : ""));
  if (i < 2) console.log(labels[i] + " room: " + s.roomStats());
}
console.log("no room: every arrival opens the seat map at once, booking-requests-per-second-max=" + TicketSeatHold.arrivalsPeak(20_000) + " on-booking-path-max=20000");
console.log("-- scenario 3: A holds the last seat, the payment service stops 594000~606000ms while A pays, B presses every 60s from 300000ms --");
const late = [Mode.GUIDE, Mode.INSERT_ONLY, Mode.NO_UNIQUE];
const lateLabels = ["guide", "insert-only", "insert-only-no-unique"];
for (let i = 0; i < late.length; i++) {
  const s = new TicketSeatHold(late[i]!, 1, 2, false, -1, i === 0 ? 0 : -1);
  s.names = ["A", "B"];
  s.downFrom = 594_000;
  s.downTo = 606_000;
  s.user[0]!.entry = 594_899;
  s.clock.schedule(0, Kind.HOLD, 0);
  for (let t = 300_000; t <= 600_000; t += 60_000) s.clock.schedule(t, Kind.HOLD, 1);
  console.log(lateLabels[i] + ": " + s.run().stats() + " seat 1 sold to" + s.soldTo);
}

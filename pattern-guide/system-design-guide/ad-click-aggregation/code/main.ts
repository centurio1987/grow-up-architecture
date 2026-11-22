enum Kind { TICK, APP, ARRIVE, RETRY, RELEASE, CHECKPOINT, STOP, RESTART }
enum Mode { GUIDE, BY_AD, NO_DEDUP, PROCESSING_TIME, NO_TRANSACTION, AT_LEAST_ONCE }
interface Ev { at: number; seq: number; kind: Kind; a: number; b: number }
interface Rec { id: number; ad: number; time: number; writtenAt: number }
interface Out { cell: number; value: number; late: boolean }

class VirtualClock {
  private queue: Ev[] = [];
  private seq = 0;
  schedule(at: number, kind: Kind, a: number, b: number): void {
    let i = this.queue.length;
    while (i > 0 && this.queue[i - 1]!.at > at) i--;
    this.queue.splice(i, 0, { at, seq: this.seq++, kind, a, b });
  }
  next(): Ev | undefined { return this.queue.shift(); }
}

const PARTS = 8, ADS = 1_002, MINUTES = 16, CELLS = MINUTES * ADS, CAP = 2, HOT = 7, NEW_AD = 1_001;
const POS = 0, MAXT = PARTS, FIRE = 2 * PARTS, COUNT = FIRE + 1, PART = COUNT + 1, SIZE = PART + PARTS * CELLS;
const MINUTE = 60_000, BOUND = 5_000, LATENESS = 600_000, EVERY = 10_000, DOWN = 30_000, APP_NET = 50;
const PEAK_FROM = 120_000, PEAK_TO = 180_000, B_AT = 300_000, C_AT = 842_000, STOP_AT = 847_000;
const KEYS = [...Array(PARTS).keys()];

function cell(time: number, ad: number): number { return Math.floor(time / MINUTE) * ADS + ad; }
function partition(key: number): number { return Math.floor(((key * 2_654_435_761) % 4_294_967_296) / 536_870_912); }
function part(k: number, c: number): number { return PART + k * CELLS + c; }
function sum(a: Int32Array, w: number): number { return a.subarray(w * ADS, (w + 1) * ADS).reduce((x, y) => x + y, 0); }

class AdClickAggregation {
  readonly clock = new VirtualClock();
  readonly parts: Rec[][] = KEYS.map(() => []);
  readonly held: Rec[][] = [[], []];
  open: Out[] = [];
  readonly notes: string[][] = [[], [], []];
  readonly seenAt = new Int32Array(1_500_000);
  readonly table = new Int32Array(CELLS);
  readonly truth = new Int32Array(CELLS);
  readonly lateTable = new Int32Array(ADS);
  readonly lateTruth = new Int32Array(ADS);
  readonly peakWrites = new Int32Array(PARTS);
  readonly barrier = new Int32Array(PARTS);
  readonly visibleAt = new Array<number>(MINUTES).fill(0);
  job = new Int32Array(SIZE);
  saved = this.job.slice();
  readonly n = { seed: 2_026, dropped: 0, resent: 0, replayed: 0, beforeB: 0, lastId: 0, follow: 0, hotPartials: 0, hotFirst: 0 };
  running = true;
  pending = false;

  constructor(readonly mode: Mode) {
    this.clock.schedule(30_000, Kind.APP, 0, 0);
    this.clock.schedule(30_000 + APP_NET, Kind.ARRIVE, 0, 0);
    this.clock.schedule(B_AT, Kind.RELEASE, 0, 0);
    this.clock.schedule(C_AT, Kind.RELEASE, 1, 0);
    this.clock.schedule(STOP_AT, Kind.STOP, 0, 0);
    this.clock.schedule(STOP_AT + DOWN, Kind.RESTART, 0, 0);
    this.clock.schedule(EVERY, Kind.CHECKPOINT, 0, 0);
    this.clock.schedule(0, Kind.TICK, 0, 0);
  }

  get dedup(): boolean { return this.mode !== Mode.NO_DEDUP && this.mode !== Mode.AT_LEAST_ONCE; }
  get transaction(): boolean { return this.mode !== Mode.NO_TRANSACTION && this.mode !== Mode.AT_LEAST_ONCE; }
  get overwrite(): boolean { return this.mode !== Mode.AT_LEAST_ONCE; }
  get lateness(): number { return this.mode === Mode.AT_LEAST_ONCE ? 0 : LATENESS; }
  total(c: number): number { return KEYS.reduce((s, k) => s + this.job[part(k, c)]!, 0); }
  watermark(k: number, now: number): number { return this.mode === Mode.PROCESSING_TIME ? now : this.job[MAXT + k]! - BOUND; }
  note(s: number, at: number, what: string): void { if (this.mode === Mode.GUIDE) this.notes[s]!.push("t=" + at + "ms " + what); }

  below(n: number): number {
    this.n.seed = (this.n.seed * 48_271) % 2_147_483_647;
    return this.n.seed % n;
  }

  static run(mode: Mode, until: number): AdClickAggregation {
    const s = new AdClickAggregation(mode);
    for (let e = s.clock.next(); e !== undefined && e.at <= until; e = s.clock.next()) s.handle(e);
    return s;
  }

  handle(e: Ev): void {
    const t = e.at;
    switch (e.kind) {
      case Kind.TICK: return this.tick(t);
      case Kind.APP: return this.note(0, t, "A app: clicks ad " + NEW_AD + " and sends the signed impression id that came with the ad");
      case Kind.ARRIVE: return this.arrive(t);
      case Kind.RETRY: return this.write(e.a, e.b, t, t);
      case Kind.RELEASE: return this.release(t, e.a);
      case Kind.CHECKPOINT: return this.trigger();
      case Kind.STOP: return this.stop(t);
      case Kind.RESTART: return this.restart(t);
    }
  }

  tick(t: number): void {
    const peak = t >= PEAK_FROM && t < PEAK_TO;
    for (let i = 0; i < (peak ? 10 : 1); i++) this.generate(t, peak);
    if (this.running) {
      for (let k = 0; k < PARTS; k++) this.read(k, t);
      this.emit(t);
      if (this.pending && this.reached()) this.commit(t);
    }
    this.clock.schedule(t + 1, Kind.TICK, 0, 0);
  }

  generate(t: number, peak: boolean): void {
    const id = ++this.n.lastId;
    const ad = peak && this.below(10) < 3 ? HOT : 1 + this.below(1_000);
    if (t >= PEAK_FROM && t < PEAK_FROM + 5_000 && (id % 10 === 1 || id % 10 === 2)) {
      this.held[(id % 10) - 1]!.push({ id, ad, time: t, writtenAt: 0 });
      return;
    }
    this.truth[cell(t, ad)]!++;
    this.write(id, ad, t, t);
    if (peak && id % 100 === 0) this.clock.schedule(t + 1_000, Kind.RETRY, id, ad);
  }

  write(id: number, ad: number, time: number, now: number): void {
    const k = partition(this.mode === Mode.BY_AD ? ad : id);
    this.parts[k]!.push({ id, ad, time, writtenAt: now });
    if (now >= PEAK_FROM && now < PEAK_TO) this.peakWrites[k]!++;
  }

  arrive(t: number): void {
    this.n.follow = ++this.n.lastId;
    this.truth[cell(t, NEW_AD)]!++;
    this.write(this.n.follow, NEW_AD, t, t);
    this.note(0, t, "ad server: signature ok, click id=" + this.n.follow + ", click time=" + t + ", writes it to partition " + partition(this.n.follow));
  }

  release(t: number, which: number): void {
    if (which === 0) this.n.beforeB = sum(this.table, 2);
    for (const r of this.held[which]!) {
      if (t - (Math.floor(r.time / MINUTE) + 1) * MINUTE > LATENESS) this.lateTruth[r.ad]!++;
      else this.truth[cell(r.time, r.ad)]!++;
      this.write(r.id, r.ad, r.time, t);
    }
    this.note(1, t, "ad server " + (which === 0 ? "b" : "c") + ": writes " + this.held[which]!.length + " clicks held since minute 2, " + (t - PEAK_TO) + "ms after it ended");
  }

  read(k: number, t: number): void {
    const p = this.parts[k]!;
    const limit = this.pending ? this.barrier[k]! : p.length;
    for (let n = 0; n < CAP && this.job[POS + k]! < limit && p[this.job[POS + k]!]!.writtenAt < t; n++) this.process(k, this.job[POS + k]!++, t);
  }

  process(k: number, at: number, t: number): void {
    const r = this.parts[k]![at]!;
    if (this.dedup && this.seenAt[r.id] !== 0) {
      this.n.dropped++;
      return;
    }
    this.job[COUNT]!++;
    if (this.dedup) this.seenAt[r.id] = this.job[COUNT]!;
    const time = this.mode === Mode.PROCESSING_TIME ? t : r.time;
    const w = Math.floor(time / MINUTE);
    const wm = this.watermark(k, t);
    this.job[MAXT + k] = Math.max(this.job[MAXT + k]!, time);
    if (k === partition(this.n.follow) && wm < MINUTE && this.watermark(k, t) >= MINUTE) this.note(0, t, "task " + k + ": watermark " + this.watermark(k, t) + " passed the end of minute 0, its partials for minute 0 are ready");
    if (wm >= (w + 1) * MINUTE + this.lateness) {
      if (this.lateness > 0) this.output(t, r.ad, 1, true);
      return;
    }
    const c = cell(time, r.ad);
    this.job[part(k, c)]!++;
    if (r.id === this.n.follow) this.note(0, t, "task " + k + ": click id=" + r.id + " is new, partial (ad " + r.ad + ", minute " + w + ")=" + this.job[part(k, c)]);
    if (w >= this.job[FIRE]!) return;
    this.n.resent++;
    this.output(t, c, this.total(c), false);
  }

  emit(t: number): void {
    const low = Math.min(...KEYS.map((k) => this.watermark(k, t)));
    while (this.job[FIRE]! < MINUTES && (this.job[FIRE]! + 1) * MINUTE <= low) this.fire(t, this.job[FIRE]!++);
  }

  fire(t: number, w: number): void {
    let rows = 0;
    const hot = cell(PEAK_FROM, HOT);
    for (let c = w * ADS; c < (w + 1) * ADS; c++) {
      const sum = this.total(c);
      if (c === hot) this.n.hotPartials = KEYS.filter((k) => this.job[part(k, hot)]! > 0).length;
      if (c === hot) this.n.hotFirst = sum;
      if (sum === 0) continue;
      this.output(t, c, sum, false);
      rows++;
    }
    if (w === 0) this.note(0, t, "sum: every task passed minute 0, (ad " + NEW_AD + ", minute 0)=" + this.total(cell(0, NEW_AD)) + " goes into the open transaction");
    if (w === 13) this.note(2, t, "sum: minute 13 fires, " + rows + " results go into the open transaction");
  }

  output(t: number, c: number, value: number, late: boolean): void {
    if (this.transaction) this.open.push({ cell: c, value, late });
    else this.apply(t + 1, { cell: c, value, late });
  }

  apply(at: number, o: Out): void {
    if (o.late) this.lateTable[o.cell]! += o.value;
    else this.table[o.cell] = this.overwrite ? o.value : this.table[o.cell]! + o.value;
    const w = Math.floor(o.cell / ADS);
    if (o.late) return;
    if (o.cell === cell(0, NEW_AD)) this.note(0, at, "result table: (ad " + NEW_AD + ", minute 0)=" + o.value + " is visible, " + (at - MINUTE) + "ms after minute 0 ended");
    if (this.visibleAt[w] !== 0) return;
    this.visibleAt[w] = at;
    if (w === 13) this.note(2, at, "result table: minute 13 is visible, " + this.after(13) + "ms after it ended and " + (at - STOP_AT - DOWN) + "ms after the restart");
  }

  trigger(): void {
    for (let k = 0; k < PARTS; k++) this.barrier[k] = this.parts[k]!.length;
    this.pending = this.running;
  }

  reached(): boolean { return KEYS.every((k) => this.job[POS + k]! >= this.barrier[k]!); }

  commit(t: number): void {
    this.pending = false;
    this.saved = this.job.slice();
    const s = t === 70_000 ? 0 : t === 840_000 || (t > STOP_AT && t < STOP_AT + DOWN + EVERY) ? 2 : -1;
    if (s >= 0) this.note(s, t, "checkpoint: all " + PARTS + " tasks reached the barrier, state and offsets saved, " + this.open.length + " outputs committed");
    if (t > B_AT && t < B_AT + EVERY) this.note(1, t + 1, "result table: minute 2 with b's clicks is visible, " + (t + 1 - B_AT) + "ms after b wrote them");
    for (const o of this.open) this.apply(t + 1, o);
    this.open = [];
    this.clock.schedule((Math.floor(t / EVERY) + 1) * EVERY, Kind.CHECKPOINT, 0, 0);
  }

  stop(t: number): void {
    this.running = false;
    this.pending = false;
    this.note(2, t, "job: stops, " + this.open.length + " outputs in the open transaction (" + this.open.filter((o) => o.late).length + " separate counts) are never committed");
    this.open = [];
  }

  restart(t: number): void {
    for (let k = 0; k < PARTS; k++) this.n.replayed += this.job[POS + k]! - this.saved[POS + k]!;
    for (let id = 0; id < this.seenAt.length; id++) if (this.seenAt[id]! > this.saved[COUNT]!) this.seenAt[id] = 0;
    this.job = this.saved.slice();
    this.running = true;
    this.clock.schedule((Math.floor(t / EVERY) + 1) * EVERY, Kind.CHECKPOINT, 0, 0);
    this.note(2, t, "job: restarts from the checkpoint at 840000ms, reads " + this.n.replayed + " records again from the saved offsets");
  }

  check(): string {
    const cells = [...Array(CELLS).keys()].filter((c) => this.visibleAt[Math.floor(c / ADS)] !== 0);
    const over = cells.reduce((s, c) => s + Math.max(0, this.table[c]! - this.truth[c]!), 0);
    const under = cells.reduce((s, c) => s + Math.max(0, this.truth[c]! - this.table[c]!), 0);
    return "over=" + over + " under=" + under + " counted-separately=" + sum(this.lateTable, 0) + " of " + sum(this.lateTruth, 0);
  }

  minute(w: number): string { return "minute-" + w + "=" + sum(this.table, w) + " of " + sum(this.truth, w); }
  after(w: number): number { return this.visibleAt[w]! - (w + 1) * MINUTE; }
  busiest(): number { return Math.floor(Math.max(...this.peakWrites) / 60); }
}

const g = AdClickAggregation.run(Mode.GUIDE, 910_010);
const byAd = AdClickAggregation.run(Mode.BY_AD, 300_000);
const noDedup = AdClickAggregation.run(Mode.NO_DEDUP, 260_000);
const proc = AdClickAggregation.run(Mode.PROCESSING_TIME, 910_010);
const noTx = AdClickAggregation.run(Mode.NO_TRANSACTION, 910_010);
const alo = AdClickAggregation.run(Mode.AT_LEAST_ONCE, 910_010);
const worst = Math.max(...[...Array(MINUTES).keys()].filter((w) => w !== 13 && g.visibleAt[w] !== 0).map((w) => g.after(w)));
console.log("-- scenario 1: A clicks ad 1001 at 30000ms while 1000 clicks per second flow into 8 partitions --");
g.notes[0]!.forEach((line) => console.log(line));
console.log("-- scenario 2: 10000 clicks per second in minute 2, 30% on ad 7, 1% sent twice, ad servers b and c hold 5s of clicks --");
console.log("guide: held-by-b-and-c=" + (g.held[0]!.length + g.held[1]!.length) + " dropped-duplicates=" + g.n.dropped + " busiest-partition-per-second=" + g.busiest() + " ad-7=" + g.n.hotFirst + " from " + g.n.hotPartials + " partials minute-2-visible-after=" + g.after(2) + "ms");
console.log("by-ad: busiest-partition-per-second=" + byAd.busiest() + " minute-2-visible-after=" + byAd.after(2) + "ms minute-3-visible-after=" + byAd.after(3) + "ms");
console.log("no-dedup: " + noDedup.check());
console.log(g.notes[1]![0]);
console.log("guide: minute-2 " + g.n.beforeB + " -> " + sum(g.table, 2) + " results-sent-again=" + g.n.resent);
console.log(g.notes[1]![1]);
console.log("processing-time: " + proc.minute(2) + " " + proc.minute(5));
console.log(g.notes[1]![2]);
console.log("guide: " + g.minute(2) + " " + g.check());
console.log("-- scenario 3: the job stops at 847000ms, 7000ms after the checkpoint at 840000ms, and restarts 30000ms later --");
g.notes[2]!.forEach((line) => console.log(line));
console.log("guide: replayed=" + g.n.replayed + " minute-13-visible-after=" + g.after(13) + "ms " + g.check());
console.log("no-transaction: minute-13-visible-after=" + noTx.after(13) + "ms " + noTx.check());
console.log("at-least-once: " + alo.minute(2) + " " + alo.minute(13) + " " + alo.check());
console.log("all minutes: guide visible-after-max=" + worst + "ms except minute 13, " + g.check());

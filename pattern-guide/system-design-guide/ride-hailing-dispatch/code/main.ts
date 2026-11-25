enum Mode { GUIDE, LOCK }
enum Kind { UPDATE, ASK, LOOK, OFFER, REPLY, TIMEOUT, DOWN, FAILOVER }
interface Ev { at: number; seq: number; kind: Kind; a: number; b: number }
interface Ask { at: number; who: string | null; key: string; x: number; y: number }

class VirtualClock {
  private queue: Ev[] = [];
  private seq = 0;
  schedule(at: number, kind: Kind, a: number, b: number): void {
    const e = { at, seq: this.seq++, kind, a, b };
    let lo = 0, hi = this.queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.queue[mid]!.at > at) lo = mid + 1;
      else hi = mid;
    }
    this.queue.splice(lo, 0, e);
  }
  next(): Ev | undefined { return this.queue.pop(); }
}

class Req {
  endAt = 0;
  near = -1;
  readonly tried: number[] = [];
  readonly drivers: number[] = [];
  cands: number[] = [];
  constructor(readonly id: number, readonly ask: Ask) {}
  received(): number { return this.ask.at; }
  loud(): boolean { return this.ask.who !== null && this.ask.who !== "seoyun"; }
}

const IDLE = 0, OFFERED = 1, ON_TRIP = 2, NODES = 3, POINTS = 8;
const SIDE = 8_000, CELL = 1_000, RADIUS = 1_000, RING = Math.floor((RADIUS + CELL - 1) / CELL);
const EVERY = 5_000, STALE = 30_000, ACCEPT = 15_000, MATCH = 60_000, LAST_OFFER = MATCH - ACCEPT, AGAIN = 5_000;
const FAILOVER_AT = 101_050, LOST = 1_000, DOWN_AT = 230_000, UNTIL = 260_000;
const NAME = ["d01", "d02", "s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10",
  "s11", "s12", "o01", "d20", "d21", "d22", "d23", "d24"];
const DRIVER = [ // x, y, answers this many ms after an offer comes (-1 never), the app sends until
  [3900, 2950, 3000, UNTIL], [2950, 2500, 3000, UNTIL], [5650, 5500, 2000, UNTIL], [5300, 5650, 2250, UNTIL],
  [5500, 5180, 2500, UNTIL], [5880, 5800, 2750, UNTIL], [4900, 5450, 2000, UNTIL], [5450, 6100, 2250, UNTIL],
  [6150, 5350, 2500, UNTIL], [5100, 4950, 2750, UNTIL], [4800, 6000, 2000, UNTIL], [6200, 6000, 2250, UNTIL],
  [6250, 4900, 2500, UNTIL], [4750, 4850, 2750, UNTIL], [1800, 6200, 2000, UNTIL], [6700, 1600, 16_000, UNTIL],
  [6200, 1100, 3000, UNTIL], [6450, 1450, 3000, 170_000], [2700, 800, 2000, UNTIL], [2100, 200, 2000, UNTIL]];

class RideHailingDispatch {
  readonly clock = new VirtualClock();
  readonly asks: Ask[] = [];
  readonly reqs: Req[] = [];
  readonly keys = new Map<string, number>();
  readonly locks = new Map<number, number[]>();
  readonly nodes: Map<number, Map<number, number>>[] = [new Map(), new Map(), new Map()];
  readonly n = DRIVER.length;
  readonly state: number[] = new Array(this.n).fill(IDLE);
  readonly req: number[] = new Array(this.n).fill(-1);
  readonly screen: number[] = new Array(this.n).fill(-1);
  readonly rides: number[] = new Array(this.n).fill(0);
  readonly until: number[] = new Array(this.n).fill(0);
  readonly reads: number[] = new Array(NODES).fill(0);
  readonly writes: number[] = new Array(NODES).fill(0);
  readonly twice = new Set<number>();
  stopped = -1;
  readonly notes: string[][] = [
    ["-- scenario 1: minji asks for a ride at 60000ms, nothing else is going on --"],
    ["-- scenario 2: a concert ends, 20 requests from the stadium in 1800ms, 12 free drivers around it --"],
    ["-- scenario 3: d20 does not answer, d22's app went quiet, index node 1 stops, junho's app sends one request twice --"]];

  constructor(readonly mode: Mode) {
    this.asks.push({ at: 60_000, who: "minji", key: "k-minji", x: 3400, y: 2500 });
    for (let i = 0; i < 20; i++) this.asks.push({ at: 100_000 + 100 * Math.max(0, i - 1), who: null, key: `k-s${i}`, x: 5500, y: 5500 });
    this.asks.push({ at: 101_900, who: "seoyun", key: "k-seoyun", x: 1500, y: 6500 });
    this.asks.push({ at: 205_000, who: "dana", key: "k-dana", x: 6500, y: 1500 });
    this.asks.push({ at: 231_000, who: "junho", key: "k-junho", x: 2500, y: 500 });
    this.asks.push({ at: 231_500, who: "junho", key: "k-junho", x: 2500, y: 500 });
    for (let d = 0; d < this.n; d++) this.clock.schedule(250 * d, Kind.UPDATE, d, 0);
    for (let i = 0; i < this.asks.length; i++) this.clock.schedule(this.asks[i]!.at, Kind.ASK, i, 0);
    this.clock.schedule(FAILOVER_AT, Kind.FAILOVER, 0, 0);
    this.clock.schedule(DOWN_AT, Kind.DOWN, 1, 0);
  }

  static hash(v: number): number {
    let h = Math.imul(v ^ (v >>> 16), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }

  owner(cell: number, skip: number): number {
    let best = Number.MAX_SAFE_INTEGER, node = -1;
    for (let k = 0; k < NODES * POINTS; k++) {
      const gap = (RideHailingDispatch.hash(10_000 + Math.floor(k / POINTS) * 100 + k % POINTS) - RideHailingDispatch.hash(cell)) >>> 0;
      if (Math.floor(k / POINTS) === skip || Math.floor(k / POINTS) === this.stopped || gap >= best) continue;
      best = gap;
      node = Math.floor(k / POINTS);
    }
    return node;
  }

  static rush(t: number): boolean { return t >= 100_000 && t < 150_000; }
  dist2(q: Req, d: number): number { return (DRIVER[d]![0]! - q.ask.x) ** 2 + (DRIVER[d]![1]! - q.ask.y) ** 2; }
  away(q: Req, d: number): string { return `${NAME[d]} ${Math.floor(Math.sqrt(this.dist2(q, d)))}m in cell ${Math.floor(DRIVER[d]![0]! / CELL)}:${Math.floor(DRIVER[d]![1]! / CELL)}`; }
  note(t: number, what: string): void { this.notes[t < 100_000 ? 0 : t < 200_000 ? 1 : 2]!.push(`t=${t}ms ${what}`); }

  free(d: number, t: number): boolean {
    const l = this.locks.get(d);
    if (this.mode === Mode.LOCK) return this.state[d] !== ON_TRIP && (l === undefined || l[1]! <= t);
    return this.state[d] === IDLE || this.state[d] === OFFERED && this.until[d]! <= t;
  }

  handle(e: Ev): void {
    const t = e.at;
    switch (e.kind) {
      case Kind.UPDATE: return this.update(e.a, t);
      case Kind.ASK: return this.ask(this.asks[e.a]!, t);
      case Kind.LOOK: return this.look(this.reqs[e.a]!, t);
      case Kind.OFFER: return this.offer(this.reqs[e.a]!, t);
      case Kind.REPLY: return this.reply(e.a, this.reqs[e.b]!, t);
      case Kind.TIMEOUT: return this.timeout(this.reqs[e.a]!, e.b, t);
      case Kind.DOWN: return this.down(e.a, t);
      case Kind.FAILOVER: for (const [d, l] of [...this.locks]) if (this.mode === Mode.LOCK && l[2]! >= t - LOST) this.locks.delete(d);
    }
  }

  update(d: number, t: number): void {
    const cell = Math.floor(DRIVER[d]![0]! / CELL) * 100 + Math.floor(DRIVER[d]![1]! / CELL), node = this.owner(cell, -1);
    if (!this.nodes[node]!.has(cell)) this.nodes[node]!.set(cell, new Map());
    this.nodes[node]!.get(cell)!.set(d, t);
    if (RideHailingDispatch.rush(t) && d >= 2 && d < 14) this.writes[node]!++;
    if (t + EVERY < DRIVER[d]![3]!) this.clock.schedule(t + EVERY, Kind.UPDATE, d, 0);
  }

  ask(a: Ask, t: number): void {
    const seen = this.keys.get(a.key);
    if (seen !== undefined) this.note(t, `${a.who}: the app sends key ${a.key} again, the request record returns r${seen}, no second request`);
    if (seen !== undefined) return;
    const q = new Req(this.reqs.length, a);
    this.reqs.push(q);
    this.keys.set(a.key, q.id);
    this.look(q, t);
  }

  look(q: Req, t: number): void {
    let found: number[] = [], quiet = "";
    const cx = Math.floor(q.ask.x / CELL), cy = Math.floor(q.ask.y / CELL);
    for (let i = cx - RING; i <= cx + RING; i++) {
      for (let j = cy - RING; j <= cy + RING; j++) {
        if (i < 0 || j < 0 || i >= SIDE / CELL || j >= SIDE / CELL) continue;
        const node = this.owner(i * 100 + j, -1);
        if (RideHailingDispatch.rush(t) && q.ask.who === null) this.reads[node]!++;
        for (const [d, at] of [...(this.nodes[node]!.get(i * 100 + j) ?? new Map<number, number>())].sort((x, y) => x[0] - y[0])) {
          if (t - at <= STALE) found.push(d);
          else quiet += `; ${this.away(q, d)} is left out, its last location is ${t - at}ms old`;
        }
      }
    }
    found = found.filter((d) => !q.tried.includes(d) && this.free(d, t));
    found.sort((x, y) => this.dist2(q, x) - this.dist2(q, y) || x - y);
    q.cands = found;
    const again = found.length === 0 && t + AGAIN - q.received() <= LAST_OFFER;
    const head = t === q.received() ? `request r${q.id} is recorded in cell ${cx}:${cy}, ` : "";
    const list = found.map((d) => this.away(q, d)).join(", ");
    if (q.loud()) this.note(t, `${q.ask.who}: ${head}free drivers in the cells around: ${found.length}${found.length === 0 ? "" : ` (${list})`}${quiet}${again ? `, looks again at ${t + AGAIN}ms` : ""}`);
    if (found.length > 0) this.clock.schedule(t, Kind.OFFER, q.id, 0);
    else if (again) this.clock.schedule(t + AGAIN, Kind.LOOK, q.id, 0);
    else this.fail(q, t);
  }

  hold(d: number, r: number, t: number): number {
    const l = this.locks.get(d);
    if (this.mode === Mode.LOCK && l !== undefined && l[1]! > t) return 0;
    if (this.mode === Mode.LOCK) this.locks.set(d, [r, t + ACCEPT, t]);
    if (this.mode === Mode.LOCK) return 1;
    if (this.state[d] !== IDLE && !(this.state[d] === OFFERED && this.until[d]! <= t)) return 0;
    this.state[d] = OFFERED;
    this.req[d] = r;
    this.until[d] = t + ACCEPT;
    return 1;
  }

  accept(d: number, r: number, t: number): number {
    if (this.mode === Mode.GUIDE && !(this.state[d] === OFFERED && this.req[d] === r && this.until[d]! > t)) return 0;
    this.state[d] = ON_TRIP;
    this.req[d] = r;
    return 1;
  }

  withdraw(d: number, r: number): number {
    if (this.mode === Mode.LOCK && this.locks.get(d)?.[0] === r) this.locks.delete(d);
    if (this.mode === Mode.LOCK || this.state[d] !== OFFERED || this.req[d] !== r) return 0;
    this.state[d] = IDLE;
    this.req[d] = -1;
    return 1;
  }

  offer(q: Req, t: number): void {
    let raced = "";
    for (const d of q.cands) {
      const changed = this.hold(d, q.id, t);
      if (changed === 0) raced = `r${this.req[d]} and r${q.id} both read ${NAME[d]} as free, r${this.req[d]}'s write changed 1 row, r${q.id}'s write changed 0 rows, `;
      if (changed === 0) continue;
      if (this.screen[d]! >= 0 && d >= 2 && d < 14) this.twice.add(d);
      this.screen[d] = q.id;
      q.tried.push(d);
      if (DRIVER[d]![2]! >= 0 && t < DRIVER[d]![3]!) this.clock.schedule(t + DRIVER[d]![2]!, Kind.REPLY, d, q.id);
      this.clock.schedule(t + ACCEPT, Kind.TIMEOUT, q.id, d);
      if (q.loud() || raced !== "") this.note(t, `dispatch: ${raced}offers r${q.id} to ${NAME[d]}, the write changed 1 row (free -> offered until ${t + ACCEPT}ms)`);
      return;
    }
    this.look(q, t);
  }

  reply(d: number, q: Req, t: number): void {
    if (this.screen[d] === q.id) this.screen[d] = -1;
    const changed = this.accept(d, q.id, t);
    if (changed === 0 && q.loud()) this.note(t, `${NAME[d]}: accepts r${q.id} late, the write changed 0 rows (${NAME[d]} is no longer offered r${q.id}), no ride`);
    if (changed === 0) return;
    q.drivers.push(d);
    this.rides[d]!++;
    if (q.drivers.length === 1) q.endAt = t;
    if (q.loud()) this.note(t, `${NAME[d]}: accepts r${q.id}, the write changed 1 row (offered -> on a trip), assigned ${t - q.received()}ms after the request was received`);
  }

  timeout(q: Req, d: number, t: number): void {
    if (this.screen[d] === q.id) this.screen[d] = -1;
    if (q.drivers.length > 0) return;
    const changed = this.withdraw(d, q.id);
    if (q.loud()) this.note(t, `dispatch: ${NAME[d]} did not answer in ${ACCEPT}ms, withdrawing the offer of r${q.id} changed ${changed} row (offered -> free)`);
    if (t - q.received() > LAST_OFFER) this.fail(q, t);
    else this.look(q, t);
  }

  fail(q: Req, t: number): void {
    q.endAt = t;
    q.near = 0;
    for (let d = 0; d < this.n; d++) if (t < DRIVER[d]![3]! && this.free(d, t) && this.dist2(q, d) <= RADIUS * RADIUS) q.near++;
    if (q.loud()) this.note(t, `${q.ask.who}: told no driver ${t - q.received()}ms after the request was received`);
  }

  down(node: number, t: number): void {
    const to = new Array(NODES).fill(0);
    for (let c = 0; c < SIDE / CELL * 100; c++) if (c % 100 < SIDE / CELL && this.owner(c, -1) === node) to[this.owner(c, node)]++;
    this.stopped = node;
    this.nodes[node]!.clear();
    const moved = to[0] + to[1] + to[2];
    this.note(t, `index node ${node}: stops and loses what it held, its ${moved} cells move on the ring (${to[0]} to node 0, ${to[2]} to node 2), the other ${(SIDE / CELL) * (SIDE / CELL) - moved} cells stay`);
  }

  rushLine(): string {
    let asked = 0, assigned = 0, told = 0, near = 0, two = 0, worst = 0, toldAt = 0;
    for (const q of this.reqs) {
      if (q.ask.who !== null) continue;
      asked++;
      if (q.drivers.length > 0) assigned++;
      if (q.drivers.length > 0) worst = Math.max(worst, q.endAt - q.received());
      if (q.near < 0) continue;
      told++;
      toldAt = Math.max(toldAt, q.endAt - q.received());
      near = Math.max(near, q.near);
    }
    for (let d = 2; d < 14; d++) two += this.rides[d]! >= 2 ? 1 : 0;
    const lost = this.mode === Mode.LOCK ? ` (the lock store fails over at ${FAILOVER_AT}ms and loses the locks taken in the last ${LOST}ms)` : "";
    const fails = told === 0 ? "" : ` ${toldAt}ms after it was received with ${near} free drivers within ${RADIUS}m`;
    return `${this.mode === Mode.GUIDE ? "guide" : "lock"}${lost}: ${asked} asked at the stadium, ${assigned} assigned at most ${worst}ms after the request was received, `
      + `${told} told no driver${fails}, ${this.twice.size} drivers had two offers at once, ${two} drivers went to two riders`;
  }

  who(name: string): Req { return this.reqs.find((q) => q.ask.who === name)!; }

  static run(mode: Mode): RideHailingDispatch {
    const s = new RideHailingDispatch(mode);
    for (let e = s.clock.next(); e !== undefined && e.at <= UNTIL; e = s.clock.next()) s.handle(e);
    return s;
  }
}

const g = RideHailingDispatch.run(Mode.GUIDE), l = RideHailingDispatch.run(Mode.LOCK);
const seoyun = g.who("seoyun"), dana = l.who("dana");
g.notes[1]!.push(g.rushLine());
g.notes[1]!.push(`index: each search reads ${(2 * RING + 1) * (2 * RING + 1)} cells, in the rush the stadium searches read node 0 · 1 · 2 `
  + `${g.reads[0]} · ${g.reads[1]} · ${g.reads[2]} times and the stadium drivers wrote ${g.writes[0]} · ${g.writes[1]} · ${g.writes[2]} locations to them`);
g.notes[1]!.push(l.rushLine());
g.notes[1]!.push(`seoyun: r${seoyun.id} far from the stadium during the rush, assigned to ${NAME[seoyun.drivers[0]!]} ${seoyun.endAt - seoyun.received()}ms after the request was received`);
g.notes[2]!.push(`lock: dana's r${dana.id} gets ${dana.drivers.length} drivers (${dana.drivers.map((d) => NAME[d]).join(", ")}), d20's late accept is written too`);
for (const line of g.notes.flat()) console.log(line);

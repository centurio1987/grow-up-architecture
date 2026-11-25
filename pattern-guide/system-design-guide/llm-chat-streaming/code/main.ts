enum Mode { GUIDE, ONE_QUEUE }
enum Kind { ASK, ENQ, STEP, CHECK, DROP, RECONNECT, RESTART, HANG, RECOVER, STOP }
interface Ev { at: number; seq: number; kind: Kind; a: number }

class VirtualClock {
  private queue: Ev[] = [];
  private seq = 0;
  schedule(at: number, kind: Kind, a: number): void {
    const e = { at, seq: this.seq++, kind, a };
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

class Conn {
  constructor(public gateway: number, public last = 0, public open = true, public end = "no end", readonly got: number[] = []) {}
  receive(seq: number): void {
    this.got.push(seq);
    this.last = seq;
  }
}

class Run {
  state = 0;
  worker = -1;
  made = 0;
  seq = 0;
  takenAt = 0;
  lastAt = 0;
  firstAt = 0;
  endAt = 0;
  trial = false;
  conn: Conn | null = null;
  constructor(readonly id: number, readonly who: string | null, readonly tier: number, readonly received: number) {}
}

const PAID = 0, FREE = 1, QUEUED = 0, RUNNING = 1, DONE = 2, FAILED = 3, CANCELED = 4, REFUSED = 5;
const CLOSED = 0, OPEN = 1, HALF_OPEN = 2;
const WORKERS = 2, SLOTS = 48, TOKENS = 290, CHUNK = 5, FREE_EVERY = 4, FAILS_TO_OPEN = 3;
const LIMIT = [12, 32], RETRY_AFTER = [1, 8];
const STEP = 20, PREFILL = 220, STORE_RT = 2, TIMEOUT = 3_000, CHECK_EVERY = 1_000;
const OPEN_FOR = 30_000, RETRY = 1_000, UNTIL = 280_000;
const STATE = ["queued", "running", "finished", "failed", "stopped", "refused"];
const EVENT = ["", "", "done", "error", "stopped", ""];
const TIER = ["paid", "free"];

class LlmChatStreaming {
  clock = new VirtualClock();
  runs: Run[] = [];
  lanes: number[][] = [[], []];
  slots: Run[][] = [[], []];
  notes: string[][] = [
    ["-- scenario 1: minsu asks one question while nothing else is running --"],
    ["-- scenario 2: 20 questions a second for 60 seconds (every 5th paid), the gpus fit 16 runs a second --"],
    ["-- scenario 3: jisu's connection drops, gateway 1 restarts, gpu worker 1 stops making tokens, yuna presses stop --"]];
  kept = new Map<number, number>();
  hung = [false, false];
  breaker = [CLOSED, CLOSED];
  fails = [0, 0];
  longest = [0, 0];
  openedAt = [0, 0];
  takes = 0;

  constructor(readonly mode: Mode) {
    this.ask(1_000, "minsu", FREE);
    for (let i = 0; i < 1_200; i++) this.ask(20_000 + 50 * i, null, i % 5 === 0 ? PAID : FREE);
    const jisu = this.ask(200_000, "jisu", PAID);
    this.ask(210_000, "sora", FREE);
    for (let i = 0; i < 3; i++) this.ask(228_000 + 40 * i, i === 0 ? "doyun" : null, i === 2 ? PAID : FREE);
    this.ask(235_000, "dora", PAID);
    const yuna = this.ask(270_000, "yuna", FREE);
    this.clock.schedule(204_250, Kind.DROP, jisu);
    this.clock.schedule(209_250, Kind.RECONNECT, jisu);
    this.clock.schedule(213_000, Kind.RESTART, 1);
    this.clock.schedule(230_000, Kind.HANG, 1);
    this.clock.schedule(250_000, Kind.RECOVER, 1);
    this.clock.schedule(273_220, Kind.STOP, yuna);
    this.clock.schedule(273_720, Kind.STOP, yuna);
    for (let w = 0; w < WORKERS; w++) this.clock.schedule(10 * w, Kind.STEP, w);
    this.clock.schedule(CHECK_EVERY, Kind.CHECK, 0);
  }

  ask(at: number, who: string | null, tier: number): number {
    this.runs.push(new Run(this.runs.length, who, tier, at));
    this.clock.schedule(at, Kind.ASK, this.runs.length - 1);
    return this.runs.length - 1;
  }

  static basic(r: Run): boolean { return r.received < 20_000; }
  lane(r: Run): number { return this.mode === Mode.ONE_QUEUE ? PAID : r.tier; }
  note(t: number, what: string): void { this.notes[t < 20_000 ? 0 : t < 200_000 ? 1 : 2]!.push(`t=${t}ms ${what}`); }

  handle(e: Ev): void {
    const t = e.at;
    switch (e.kind) {
      case Kind.ASK: return this.request(this.runs[e.a]!, t);
      case Kind.ENQ: return this.enqueue(this.runs[e.a]!, t);
      case Kind.STEP: return this.step(e.a, t);
      case Kind.CHECK: return this.check(t);
      case Kind.DROP: case Kind.RECONNECT: return this.link(this.runs[e.a]!, e.kind === Kind.RECONNECT, t);
      case Kind.RESTART: return this.restart(e.a, t);
      case Kind.HANG: case Kind.RECOVER: return this.hang(e.a, e.kind === Kind.HANG, t);
      case Kind.STOP: return this.stop(this.runs[e.a]!, t);
    }
  }

  request(r: Run, t: number): void {
    if (this.mode === Mode.GUIDE && this.lanes[this.lane(r)]!.length >= LIMIT[this.lane(r)]!) r.state = REFUSED;
    else this.clock.schedule(t + STORE_RT, Kind.ENQ, r.id);
  }

  enqueue(r: Run, t: number): void {
    this.lanes[this.lane(r)]!.push(r.id);
    this.longest[this.lane(r)] = Math.max(this.longest[this.lane(r)]!, this.lanes[this.lane(r)]!.length);
    if (r.who === null) return;
    r.conn = new Conn(r.who === "sora" ? 1 : 0);
    if (LlmChatStreaming.basic(r)) this.note(r.received, `${r.who} (${TIER[r.tier]}): the question is written to the conversation store, run ${r.id} is queued at ${t}ms and the run id goes back`);
  }

  take(w: number, t: number): Run | null {
    const pick = this.lanes[PAID]!.length === 0 || (this.takes % FREE_EVERY === FREE_EVERY - 1 && this.lanes[FREE]!.length > 0) ? FREE : PAID;
    const trial = this.breaker[w] === OPEN && t - this.openedAt[w]! >= OPEN_FOR;
    if (this.lanes[pick]!.length === 0 || (this.breaker[w] !== CLOSED && !trial)) return null;
    this.takes++;
    const r = this.runs[this.lanes[pick]!.shift()!]!;
    r.state = RUNNING;
    r.worker = w;
    r.takenAt = r.lastAt = t;
    r.trial = trial;
    if (trial) this.breaker[w] = HALF_OPEN;
    if (trial) this.note(t, `queue: gpu worker ${w} is half-open, ${r.who}'s run is its test run`);
    return r;
  }

  step(w: number, t: number): void {
    const keep: Run[] = [];
    for (const r of this.slots[w]!) {
      if (r.state !== RUNNING) {
        if (r.state === CANCELED) this.note(t, `gpu worker ${w}: drops ${r.who}'s stopped run, the slot is free ${t - r.endAt}ms after the stop and ${TOKENS - r.made} tokens are not made`);
        continue;
      }
      keep.push(r);
      if (this.hung[w] || t < r.takenAt + PREFILL) continue;
      r.made++;
      if (r.made % CHUNK === 0 || r.made === TOKENS) this.write(r, t);
      if (r.made < TOKENS) continue;
      this.end(r, t, DONE);
      keep.pop();
    }
    this.slots[w] = keep;
    for (let r: Run | null; keep.length < SLOTS && (r = this.take(w, t)) !== null; ) keep.push(r);
    if (t + STEP <= UNTIL) this.clock.schedule(t + STEP, Kind.STEP, w);
  }

  write(r: Run, t: number): void {
    r.seq++;
    r.lastAt = t;
    if (r.seq === 1) r.firstAt = t;
    if (r.conn !== null && r.conn.open) r.conn.receive(r.seq);
    if (r.seq === 1 && LlmChatStreaming.basic(r)) this.note(r.takenAt, `gpu worker ${r.worker}: takes run ${r.id}, prefill until ${r.takenAt + PREFILL}ms, id 1 is written to the token record at ${t}ms and the gateway sends it to ${r.who} over sse`);
  }

  end(r: Run, t: number, state: number): void {
    r.state = state;
    r.endAt = t;
    this.kept.set(r.id, r.seq);
    if (r.conn !== null && r.conn.open) r.conn.end = EVENT[state]!;
    if (state === DONE && LlmChatStreaming.basic(r)) this.note(t, `gpu worker ${r.worker}: writes id ${r.seq}, the answer goes to the conversation store and the stream ends ${t - r.received}ms after the question was received`);
  }

  check(t: number): void {
    for (let w = 0; w < WORKERS; w++) {
      let failed = 0;
      let named = "", opened = "";
      for (const r of this.slots[w]!) {
        if (r.state !== RUNNING) continue;
        const ok = t - r.lastAt < TIMEOUT;
        if (ok && (r.seq === 0 || r.firstAt <= t - CHECK_EVERY)) continue;
        if (!ok) failed++;
        if (!ok) this.end(r, t, FAILED);
        if (!ok && r.who !== null) named = ` (${r.who} after id ${r.seq})`;
        if (this.breaker[w] === OPEN || (this.breaker[w] === HALF_OPEN && !r.trial)) continue;
        if (ok) this.fails[w] = 0;
        if (ok && this.breaker[w] === HALF_OPEN) this.note(t, `queue: the test run on gpu worker ${w} wrote id 1, its breaker closes`);
        if (ok) this.breaker[w] = CLOSED;
        if (ok || (this.breaker[w] === CLOSED && ++this.fails[w]! < FAILS_TO_OPEN)) continue;
        this.breaker[w] = OPEN;
        this.openedAt[w] = t;
        this.fails[w] = 0;
        opened = `, gpu worker ${w}'s breaker opens until ${t + OPEN_FOR}ms`;
      }
      if (failed > 0) this.note(t, `queue: ${failed} runs on gpu worker ${w} wrote nothing for ${TIMEOUT}ms or more, they fail with an error event${named}${opened}`);
    }
    if (t + CHECK_EVERY <= UNTIL) this.clock.schedule(t + CHECK_EVERY, Kind.CHECK, 0);
  }

  hang(w: number, stops: boolean, t: number): void {
    this.hung[w] = stops;
    if (stops) this.note(t, `gpu worker ${w}: stops making tokens with ${this.slots[w]!.length} runs on it, it still asks the queue for runs`);
  }

  link(r: Run, up: boolean, t: number): void {
    const c = r.conn!;
    const id = c.last, from = id;
    c.open = up;
    if (!up) this.note(t, `${r.who}: the connection drops after id ${id}, the run goes on`);
    if (!up) return;
    c.gateway = 0;
    for (let s = from + 1; s <= r.seq; s++) c.receive(s);
    if (r.state >= DONE) c.end = EVENT[r.state]!;
    const rest = r.state >= DONE ? `, the run finished at ${r.endAt}ms` : ", the rest follow as they are written";
    this.note(t, `${r.who}: reconnects to gateway 0 with Last-Event-ID ${id}, ${r.seq - id} ids were written while away and ${r.seq - from} come at once${rest}`);
  }

  restart(g: number, t: number): void {
    for (const r of this.runs) {
      if (r.conn === null || !r.conn.open || r.conn.gateway !== g) continue;
      r.conn.open = false;
      this.clock.schedule(t + RETRY, Kind.RECONNECT, r.id);
      this.note(t, `gateway ${g}: restarts, ${r.who}'s connection closes after id ${r.conn.last}, the browser reconnects after retry ${RETRY}ms`);
    }
  }

  stop(r: Run, t: number): void {
    if (r.state >= DONE) this.note(t, `${r.who}: presses stop again, the api answers ${STATE[r.state]} after id ${r.seq} and changes nothing`);
    if (r.state >= DONE) return;
    if (r.state === QUEUED) this.lanes[this.lane(r)] = this.lanes[this.lane(r)]!.filter((x) => x !== r.id);
    this.end(r, t, CANCELED);
    this.note(t, `${r.who}: presses stop after id ${r.seq}, the queue marks the run stopped in the token record and the api answers stopped after id ${r.seq}`);
  }

  userLine(r: Run): string {
    const got = r.conn!.got;
    let once = new Set(got).size, inOrder = 0;
    while (inOrder < got.length && got[inOrder] === inOrder + 1) inOrder++;
    const more = inOrder < got.length ? ` and ${got.length - inOrder} more` : "";
    return `${r.who}: run ${r.id} on gpu worker ${r.worker}, first id ${r.firstAt - r.received}ms after the question was received, got ids 1-${inOrder} in order${more} then the ${r.conn!.end} event (missing ${r.seq - once}, twice ${got.length - once}), the conversation store keeps the ${STATE[r.state]} answer with ${this.kept.get(r.id)} ids`;
  }

  loadLine(label: string): string {
    let line = `${label}:`;
    for (let tier = 0; tier < 2; tier++) {
      let asked = 0, refused = 0, worst = 0;
      for (const r of this.runs) {
        if (r.tier !== tier || r.received < 20_000 || r.received >= 80_000) continue;
        asked++;
        if (r.state === REFUSED) refused++;
        else worst = Math.max(worst, r.firstAt - r.received);
      }
      line += ` ${TIER[tier]} ${asked} asked, ${asked - refused} answered with the first id at most ${worst}ms after the question was received, ${refused} refused${refused > 0 ? ` with 429 and Retry-After ${RETRY_AFTER[tier]}` : ""};`;
    }
    return line + (this.mode === Mode.GUIDE ? ` the paid lane held at most ${this.longest[PAID]} and the free lane ${this.longest[FREE]}` : ` the one queue held at most ${this.longest[PAID]}`);
  }

  static run(mode: Mode): LlmChatStreaming {
    const s = new LlmChatStreaming(mode);
    for (let e = s.clock.next(); e !== undefined && e.at <= UNTIL; e = s.clock.next()) s.handle(e);
    return s;
  }
}

const g = LlmChatStreaming.run(Mode.GUIDE);
g.notes[1]!.push(g.loadLine("guide"));
g.notes[1]!.push(LlmChatStreaming.run(Mode.ONE_QUEUE).loadLine("one-queue"));
for (const r of g.runs) if (r.who !== null) g.notes[LlmChatStreaming.basic(r) ? 0 : 2]!.push(g.userLine(r));
for (const line of g.notes.flat()) console.log(line);

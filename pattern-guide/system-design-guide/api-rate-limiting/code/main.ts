enum Kind { ARRIVE, REDIS, REPLY, TIMEOUT, STOP, RESTART }

enum Algo { FIXED, SLIDING, TWO_STEP }

enum Mode { OPEN, CLOSED, LOCAL }

interface Ev { at: number; seq: number; kind: Kind; arg: number }

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

const WINDOW_US = 60_000_000, NET_US = 250, TIMEOUT_US = 5_000, LIMIT = 600, CAP = 10, NEVER = 2 ** 50, SERVERS = 4;
const ALGO = ["fixed-window", "sliding-lua", "two-step"], MODE = ["open", "closed", "local"];

const fits = (prev: number, cur: number, e: number, limit: number): boolean =>
  prev * (WINDOW_US - e) + (cur + 1) * WINDOW_US <= limit * WINDOW_US;

class Redis {
  static readonly CMD_US = 10;
  readonly data = new Map<string, number>();
  busyUntil = 0;
  calls = 0;
  up = true;
  scriptLoaded = true;

  run(now: number): number {
    this.busyUntil = Math.max(now, this.busyUntil) + Redis.CMD_US;
    this.calls++;
    return this.busyUntil;
  }

  get(key: string): number { return this.data.get(key) ?? 0; }

  incr(key: string): number { return this.data.set(key, this.get(key) + 1).get(key)!; }

  read(key: number, now: number): number[] {
    const w = Math.floor(now / WINDOW_US);
    return [0, this.get(`${key}:${w - 1}`), this.get(`${key}:${w}`)];
  }

  lua(key: number, now: number, limit: number, fixed: boolean): number[] {
    const r = this.read(key, now);
    if (fixed) r[1] = 0;
    if (!fits(r[1]!, r[2]!, now % WINDOW_US, limit)) return r;
    return [1, r[1]!, this.incr(`${key}:${Math.floor(now / WINDOW_US)}`)];
  }
}

const div = (a: number, b: number): number => Math.floor(a / b);

function arrivals(...streams: number[][]): number[] {
  return streams.flatMap(([k, start, gap, n, batch]) => Array.from({ length: n! }, (_, j) => (start! + div(j, batch!) * gap!) * 8 + k!))
    .sort((a, b) => a - b);
}

function waitUs(prev: number, cur: number, e: number): number {
  const first = prev === 0 ? WINDOW_US : WINDOW_US - div((LIMIT - cur - 1) * WINDOW_US, prev);
  if (cur + 1 <= LIMIT && first < WINDOW_US) return first - e;
  const next = cur === 0 ? 0 : Math.max(0, WINDOW_US - div((LIMIT - 1) * WINDOW_US, cur));
  return WINDOW_US - e + next;
}

const dec3 = (v: number): string => `${div(v, 1000)}.${String(v % 1000).padStart(3, "0")}`;

const ms = (us: number): string => `${dec3(us)}ms`;

class RateLimit {
  readonly at: number[];
  readonly key: number[];
  readonly step: number[] = [];
  readonly state: number[] = [];
  readonly res: number[][] = [];
  clock = new VirtualClock();
  redis = new Redis();
  blocked = Array.from({ length: SERVERS }, () => [0, 0, 0, 0, 0]);
  buckets = new Map<string, number[]>();
  sent = [0, 0, 0, 0, 0];
  allowed = [0, 0, 0, 0, 0];
  n = { local429: 0, noscript: 0, fallbacks: 0, maxJudge: 0 };

  constructor(readonly algo: Algo, readonly mode: Mode, readonly trace: number, codes: number[]) {
    this.at = codes.map((c) => div(c, 8));
    this.key = codes.map((c) => c % 8);
  }

  note(i: number, now: number, what: string): void {
    const picked = (this.trace === 1 && [0, 599, 600, 604].includes(i)) || (this.trace === 2 && i < 0);
    if (picked) console.log(`t=${ms(now)}${i < 0 ? "" : ` K${this.key[i]} #${i + 1}`} ${what}`);
  }

  finish(i: number, now: number, allow: boolean, what: string): void {
    this.state[i] = allow ? 2 : 1;
    if (allow) this.allowed[this.key[i]!]!++;
    this.n.maxJudge = Math.max(this.n.maxJudge, now - this.at[i]!);
    this.note(i, now, what);
  }

  arrive(i: number, now: number): void {
    if (i + 1 < this.at.length) this.clock.schedule(this.at[i + 1]!, Kind.ARRIVE, i + 1);
    const s = i % SERVERS;
    const k = this.key[i]!;
    this.sent[k]!++;
    if (this.blocked[s]![k]! > now) {
      this.n.local429++;
      this.finish(i, now, false, `api-${s + 1}: 429 from local block, no redis call`);
      return;
    }
    this.note(i, now, `lb -> api-${s + 1}, EVALSHA sent`);
    this.clock.schedule(now + NET_US, Kind.REDIS, i);
    this.clock.schedule(now + TIMEOUT_US, Kind.TIMEOUT, i);
  }

  atRedis(i: number, now: number): void {
    const redis = this.redis;
    if (!redis.up) return;
    const end = redis.run(now);
    const k = this.key[i]!;
    if (this.step[i] === 2) redis.scriptLoaded = true;
    if (this.algo !== Algo.TWO_STEP && !redis.scriptLoaded) this.res[i] = [-1, 0, 0];
    else if (this.step[i] === 1) this.res[i] = [1, this.res[i]![1]!, redis.incr(`${k}:${div(this.at[i]!, WINDOW_US)}`)];
    else if (this.algo === Algo.TWO_STEP) this.res[i] = redis.read(k, this.at[i]!);
    else this.res[i] = redis.lua(k, this.at[i]!, LIMIT, this.algo === Algo.FIXED);
    const r = this.res[i]!;
    const verdict = r[0] === 1 ? "allow" : "reject";
    if (r[0]! >= 0) this.note(i, end, `redis lua -> ${verdict} prev=${r[1]} cur=${r[2]}`);
    this.clock.schedule(end + NET_US, Kind.REPLY, i);
  }

  reply(i: number, now: number): void {
    if (this.state[i]) return;
    const r = this.res[i]!;
    const s = i % SERVERS;
    const k = this.key[i]!;
    const e = this.at[i]! % WINDOW_US;
    if (r[0] === -1 && ++this.n.noscript === 1) this.note(-1, now, `api-${s + 1}: EVALSHA -> NOSCRIPT, resend the script with EVAL`);
    if (r[0] === -1 || (this.algo === Algo.TWO_STEP && !this.step[i] && fits(r[1]!, r[2]!, e, LIMIT))) {
      this.step[i] = r[0] === -1 ? 2 : 1;
      this.clock.schedule(now + NET_US, Kind.REDIS, i);
      return;
    }
    if (r[0] === 1) {
      const left = Math.max(0, Math.trunc(((LIMIT - r[2]!) * WINDOW_US - r[1]! * (WINDOW_US - e)) / WINDOW_US));
      this.finish(i, now, true, `api-${s + 1}: 200 remaining=${left}, forward to backend`);
      return;
    }
    const wait = this.algo === Algo.FIXED ? WINDOW_US - e : waitUs(r[1]!, r[2]!, e);
    this.blocked[s]![k] = this.at[i]! + wait;
    const retry = `429 retry-after=${div(wait + 999_999, 1_000_000)}s`;
    this.finish(i, now, false, `api-${s + 1}: ${retry}, block K${k} here until ${ms(this.at[i]! + wait)}`);
  }

  take(s: number, k: number, now: number): boolean {
    const b = this.buckets.get(`${s}:${k}`) ?? [CAP * WINDOW_US, now];
    this.buckets.set(`${s}:${k}`, b);
    b[0] = Math.min(CAP * WINDOW_US, b[0]! + ((now - b[1]!) * LIMIT) / SERVERS);
    b[1] = now;
    if (b[0] < WINDOW_US) return false;
    b[0] -= WINDOW_US;
    return true;
  }

  handle(ev: Ev): void {
    const now = ev.at;
    const i = ev.arg;
    switch (ev.kind) {
      case Kind.ARRIVE:
        return this.arrive(i, now);
      case Kind.REDIS:
        return this.atRedis(i, now);
      case Kind.REPLY:
        return this.reply(i, now);
      case Kind.TIMEOUT:
        if (this.state[i]) return;
        this.n.fallbacks++;
        return this.finish(i, now, this.mode === Mode.OPEN || (this.mode === Mode.LOCAL && this.take(i % SERVERS, this.key[i]!, now)), "fallback");
      case Kind.STOP:
        this.redis.up = false;
        return this.note(-1, now, "redis stops responding");
      case Kind.RESTART:
        this.redis.up = true;
        this.redis.data.clear();
        this.redis.scriptLoaded = false;
        return this.note(-1, now, "redis restarts with no counters and an empty script cache");
    }
  }

  run(stopAt: number, restartAt: number): this {
    this.clock.schedule(this.at[0]!, Kind.ARRIVE, 0);
    this.clock.schedule(stopAt, Kind.STOP, 0);
    this.clock.schedule(restartAt, Kind.RESTART, 0);
    for (let ev = this.clock.next(); ev !== undefined; ev = this.clock.next()) this.handle(ev);
    return this;
  }

  count(k: number, from: number, until: number): number {
    return this.at.filter((t, i) => this.state[i] === 2 && this.key[i] === k && t >= from && t < until).length;
  }

  calls(): string { return `redis-calls=${this.redis.calls} api-local-429=${this.n.local429} max-judge=${ms(this.n.maxJudge)}`; }

  exact(): void {
    const log: number[] = [];
    const wrong = [0, 0];
    for (let i = 0; i < this.at.length; i++) {
      while (log.length > 0 && log[0]! <= this.at[i]! - WINDOW_US) log.shift();
      const fit = log.length + 1 <= LIMIT;
      if (fit) log.push(this.at[i]!);
      if ((this.state[i] === 2) !== fit) wrong[fit ? 1 : 0]!++;
    }
    const sum = wrong[0]! + wrong[1]!;
    console.log(`exact-log: allowed=${this.allowed[2]! - wrong[0]! + wrong[1]!}; sliding-lua differs on ${sum} of ${this.at.length}`
      + ` (wrongly allowed ${wrong[0]}, wrongly rejected ${wrong[1]}) = ${dec3(div(sum * 100_000, this.at.length))}%`);
  }
}

function candidates(): void {
  const names = ["per-region-full", "split-in-three", "central-redis"];
  for (let c = 0; c < 3; c++) {
    const regions = [new Redis(), new Redis(), new Redis()];
    const got = [0, 0, 0, 0, 0];
    const limit = c === 1 ? LIMIT / 3 : LIMIT;
    for (let t = 0; t < WINDOW_US; t += 100_000) {
      got[1]! += regions[0]!.lua(1, t, limit, false)[0]!;
      for (let r = 0; r < 3; r++) got[4]! += regions[c === 2 ? 0 : r]!.lua(4, t, limit, false)[0]!;
    }
    const cross = c === 2 ? div(2 * WINDOW_US, 100_000) : 0;
    console.log(`${names[c]}: K1 allowed=${got[1]}/600 K4 allowed=${got[4]}/1800 cross-region-calls=${cross}`);
  }
}

console.log("-- formula: cloudflare example, prev=42 cur=18 at 15s of a 60s window --");
console.log(`estimate=${dec3(div(42 * (WINDOW_US - 15_000_000) * 1000, WINDOW_US) + 18 * 1000)}`);
console.log("-- scenario 1: K1 sends one request every 80ms to region A --");
const one = new RateLimit(Algo.SLIDING, Mode.LOCAL, 1, arrivals([1, 0, 80_000, 750, 1])).run(NEVER, NEVER);
console.log(`K1: sent=${one.sent[1]} allowed=${one.allowed[1]} rejected=${one.sent[1]! - one.allowed[1]!} ${one.calls()}`);
console.log("-- scenario 2: K2 sends 4 at a time, 600 in 59s-60s and 600 in 60s-61s --");
const burst = arrivals([2, 59_000_000, 6_666, 600, 4], [2, 60_000_000, 6_666, 600, 4]);
for (const a of [Algo.FIXED, Algo.SLIDING, Algo.TWO_STEP]) {
  const r = new RateLimit(a, Mode.LOCAL, 0, burst).run(NEVER, NEVER);
  console.log(`${ALGO[a]}: allowed=${r.allowed[2]} window0=${r.count(2, 0, WINDOW_US)} window1=${r.count(2, WINDOW_US, 2 * WINDOW_US)} ${r.calls()}`);
  if (a === Algo.SLIDING) r.exact();
}
console.log("-- candidates: K1 sends 600 to region A, K4 sends 1800 across regions A B C, in one minute --");
candidates();
console.log("-- scenario 3: region A redis stops at 15s and restarts empty at 35s, K3 floods from 16s --");
const flood = arrivals([1, 0, 125_000, 480, 1], [3, 16_000_000, 10_000, 4_400, 1]);
for (const m of [Mode.OPEN, Mode.CLOSED, Mode.LOCAL]) {
  const r = new RateLimit(Algo.SLIDING, m, m === Mode.LOCAL ? 2 : 0, flood).run(15_000_000, 35_000_000);
  console.log(`${MODE[m]}: K1 allowed=${r.allowed[1]}/${r.sent[1]} K3 allowed=${r.allowed[3]}/${r.sent[3]}`
    + ` K3-during-outage=${r.count(3, 15_000_000, 35_000_000)} fallbacks=${r.n.fallbacks} ${r.calls()}`);
  if (m === Mode.LOCAL) console.log(`local: redis counts K3 at ${r.redis.get("3:0")} for window 0, K3 actually got ${r.allowed[3]}`);
}

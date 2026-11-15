class Rng {
  private x: number;

  constructor(seed: number) {
    this.x = seed >>> 0;
  }

  below(n: number): number {
    this.x = (this.x ^ (this.x << 13)) >>> 0;
    this.x = (this.x ^ (this.x >>> 17)) >>> 0;
    this.x = (this.x ^ (this.x << 5)) >>> 0;
    return this.x % n;
  }
}

enum Kind { ARRIVE, REDIS, REPLY, WORK, REPLICATE, STOP, PROMOTE }

interface Ev { at: number; seq: number; kind: Kind; arg: number }

class VirtualClock {
  private queue: Ev[] = [];
  private seq = 0;

  schedule(at: number, kind: Kind, arg: number): void {
    let i = this.queue.length;
    while (i > 0 && this.queue[i - 1]!.at > at) i--;
    this.queue.splice(i, 0, { at, seq: this.seq++, kind, arg });
  }

  nextBefore(limit: number): Ev | undefined {
    const e = this.queue[0];
    return e === undefined || e.at >= limit ? undefined : this.queue.shift();
  }
}

const CMD_US = 5;

class Redis {
  count = 0;
  busyUntil = 0;
  commands = 0;
  users = new Set<number>();
  replica = { count: 0, users: new Set<number>() };
  up = true;

  run(now: number): number {
    this.busyUntil = Math.max(now, this.busyUntil) + CMD_US;
    this.commands++;
    return this.busyUntil;
  }

  sadd(user: number): number {
    const before = this.users.size;
    return this.users.add(user).size - before;
  }

  incr(): number { return ++this.count; }

  replicate(): void {
    this.replica = { count: this.count, users: new Set(this.users) };
  }

  promote(): void {
    this.count = this.replica.count;
    this.users = this.replica.users;
    this.up = true;
  }
}

class CouponDb {
  readonly bySeq = new Map<number, number>();
  readonly users = new Set<number>();

  insert(user: number, seq: number): boolean {
    if (this.users.has(user) || this.bySeq.has(seq)) return false;
    this.users.add(user);
    this.bySeq.set(seq, user);
    return true;
  }
}

interface Arrivals { at: number[]; user: number[]; users: number }

const NET_US = 250, WORK_US = 10_000, LAG_US = 5_000, FAILOVER_US = 1_000_000;
const LIMIT = 1_000, WORK_BATCH = 5;

const ms = (us: number): string => `${Math.floor(us / 1000)}.${String(us % 1000).padStart(3, "0")}ms`;

class CouponIssue {
  readonly reply: number[];
  readonly seq: number[];
  readonly step: number[];
  readonly wins: number[];
  clock = new VirtualClock();
  redis = new Redis();
  queue: number[] = [];
  db = new CouponDb();
  soldOut = [false, false];
  paused = false;
  n = { stopCount: 0, success: 0, gone: 0, already: 0, retry: 0, local: 0, rejected: 0, maxWait: 0, lastRow: 0 };

  constructor(readonly atomic: boolean, readonly recount: boolean, readonly trace: boolean, readonly a: Arrivals) {
    this.reply = new Array<number>(a.at.length).fill(0);
    this.seq = new Array<number>(a.at.length).fill(0);
    this.step = new Array<number>(a.at.length).fill(0);
    this.wins = new Array<number>(a.users + 1).fill(0);
  }

  note(now: number, i: number, what: string): void {
    if (this.trace && this.a.user[i] === 1) console.log(`t=${ms(now)} req=${i} user=1 ${what}`);
  }

  finish(i: number, now: number, what: string): void {
    this.n.maxWait = Math.max(this.n.maxWait, now - this.a.at[i]!);
    this.note(now, i, what);
  }

  send(i: number, now: number, next: number): void {
    this.step[i] = next;
    this.clock.schedule(now + NET_US, Kind.REDIS, i);
  }

  handle(ev: Ev): void {
    const now = ev.at;
    const i = ev.arg;
    const n = this.n;
    const redis = this.redis;
    switch (ev.kind) {
      case Kind.ARRIVE:
        if (i + 1 < this.a.at.length) this.clock.schedule(this.a.at[i + 1]!, Kind.ARRIVE, i + 1);
        this.note(now, i, `presses, api-${(i % 2) + 1}`);
        if (this.paused) n.retry++;
        else if (this.soldOut[i % 2]) { n.gone++; n.local++; }
        else this.send(i, now, 0);
        break;
      case Kind.REDIS: {
        this.reply[i] = -1;
        let done = now;
        const step = this.step[i];
        if (redis.up && !this.paused) {
          done = redis.run(now);
          if (!this.atomic) done = redis.run(now);
          const u = this.a.user[i]!;
          if (step === 1 && !this.atomic) redis.sadd(u);
          if (step === 0) this.reply[i] = this.atomic ? redis.sadd(u) : redis.users.has(u) ? -2 : redis.count;
          else if (step === 1) this.reply[i] = redis.incr();
          else redis.users.delete(u);
          if (step! < 2) this.note(done, i, `redis ${step === 0 ? "SADD" : "INCR"} -> ${this.reply[i]}`);
        }
        if (step !== 2) this.clock.schedule(done + NET_US, Kind.REPLY, i);
        break;
      }
      case Kind.REPLY: {
        const r = this.reply[i]!;
        const step = this.step[i];
        if (r === -1) {
          n.retry++;
          this.finish(i, now, "api: retry later");
        } else if (step === 0 && (this.atomic ? r === 0 : r === -2)) {
          n.already++;
          this.finish(i, now, "api: already issued");
        } else if (step === 0 && (this.atomic || r < LIMIT)) this.send(i, now, 1);
        else if (step === 1 && (r <= LIMIT || !this.atomic)) {
          this.seq[i] = r;
          this.queue.push(i);
          this.wins[this.a.user[i]!]!++;
          n.success++;
          this.finish(i, now, `api: enqueue seq=${r}, answer success`);
        } else {
          this.soldOut[i % 2] = true;
          n.gone++;
          this.finish(i, now, "api: sold out");
          if (this.atomic) this.send(i, now, 2);
        }
        break;
      }
      case Kind.WORK:
        for (let k = 0; k < WORK_BATCH && this.queue.length > 0; k++) {
          const j = this.queue.shift()!;
          const ok = this.db.insert(this.a.user[j]!, this.seq[j]!);
          if (ok) n.lastRow = now; else n.rejected++;
          this.note(now, j, `worker INSERT seq=${this.seq[j]}${ok ? " -> 1 row" : " -> 0 rows"}`);
        }
        if (this.paused && this.queue.length === 0) {
          redis.count = Math.max(0, ...this.db.bySeq.keys());
          redis.users = new Set(this.db.users);
          this.paused = false;
          console.log(`t=${ms(now)} queue empty, rebuild from db: count=${redis.count}, resume`);
        }
        this.clock.schedule(now + WORK_US, Kind.WORK, 0);
        break;
      case Kind.REPLICATE: redis.replicate(); break;
      case Kind.STOP:
        redis.up = false;
        n.stopCount = redis.count;
        console.log(`t=${ms(now)} redis primary stops, count=${redis.count}`);
        break;
      case Kind.PROMOTE:
        redis.promote();
        this.paused = this.recount;
        console.log(`t=${ms(now)} replica promoted, count=${redis.count}`
          + ` (lost ${n.stopCount - redis.count} INCR)${this.recount ? ", pause" : ""}`);
        break;
    }
  }

  run(until: number, stopAt: number): this {
    this.clock.schedule(0, Kind.ARRIVE, 0);
    this.clock.schedule(0, Kind.WORK, 0);
    this.clock.schedule(stopAt - LAG_US, Kind.REPLICATE, 0);
    this.clock.schedule(stopAt, Kind.STOP, 0);
    this.clock.schedule(stopAt + FAILOVER_US, Kind.PROMOTE, 0);
    for (let ev = this.clock.nextBefore(until); ev !== undefined; ev = this.clock.nextBefore(until)) this.handle(ev);
    return this;
  }

  report(name: string): void {
    const n = this.n;
    const doubles = this.wins.filter((w) => w > 1).length;
    console.log(`${name}: requests=${this.a.at.length} success=${n.success} over=${Math.max(0, n.success - LIMIT)}`
      + ` double=${doubles} already=${n.already} sold-out=${n.gone} retry=${n.retry}`);
    console.log(`${name}: redis-commands=${this.redis.commands} api-local-sold-out=${n.local} max-wait=`
      + `${ms(n.maxWait)} db-rows=${this.db.bySeq.size} db-rejected=${n.rejected} last-row=${ms(n.lastRow)}`);
  }
}

function arrivals(rng: Rng, count: number, maxGap: number): Arrivals {
  const at: number[] = [];
  const user: number[] = [];
  let users = 0;
  for (let i = 0; i < count; i++) {
    const again = i === 1 || (i > 1 && rng.below(10) === 0);
    user.push(again ? user[i - 1]! : ++users);
    at.push(i === 0 ? 0 : at[i - 1]! + rng.below(maxGap + 1));
  }
  return { at, user, users };
}

const rng = new Rng(2026);
const burst = arrivals(rng, 30_000, 6);
const steady = arrivals(rng, 9_000, 600);
const never = 20_000_000;
console.log("-- scenario 1: user 1 presses twice at 0ms --");
const first = new CouponIssue(true, false, true, burst).run(2_100_000, never);
console.log(`-- scenario 2: ${burst.at.length} requests in ${ms(burst.at[29_999]!)} for ${LIMIT} coupons --`);
first.report("atomic");
new CouponIssue(false, false, false, burst).run(10_000_000, never).report("check-then-act");
console.log(`-- scenario 3: redis primary stops at 300ms, ${steady.at.length} requests --`);
new CouponIssue(true, false, false, steady).run(4_000_000, 300_000).report("as-is");
new CouponIssue(true, true, false, steady).run(4_000_000, 300_000).report("recount");

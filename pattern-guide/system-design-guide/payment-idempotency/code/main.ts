enum Kind { BEGIN, PG, COMMIT, REPLY, RELAY, CONFIRM, RECONCILE }

enum Mode { KEYED, NO_KEY, LOCK, TIMEOUT_FAILS, NEW_PG_KEY, NO_CUTOFF }

enum St { PROCESSING, UNKNOWN, SUCCEEDED, FAILED }

interface Ev { at: number; seq: number; kind: Kind; arg: number }
interface Reply { code: number; body: string }
interface Pay { key: number; order: number; amount: number; started: number }
interface Idem { fp: number; pay: number }
interface Call { pay: number; req: number }
interface Req { key: number; order: number; amount: number; body: string; tries: number; retries: boolean; lose: boolean }

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

const APP_NET = 50, DB_NET = 1, PG_NET = 150, PG_TIMEOUT = 10_000, LOCK_TTL = 3_000;
const RELAY_EVERY = 1_000, CONFIRM_EVERY = 60_000, CONFIRM_FOR = 3_600_000;
const PG_KEEP = 10_800_000, RECONCILE_AT = 100_800_000, DOWN_FROM = 100_250, DOWN_TO = DOWN_FROM + 14_400_000;
const BACKOFF = [1_000, 2_000, 4_000];
const NAMES = ["processing", "unknown", "succeeded", "failed"];

class PaymentIdempotency {
  readonly clock = new VirtualClock();
  readonly reqs: Req[] = [];
  readonly replies: (Reply | undefined)[] = [];
  readonly pays: Pay[] = [];
  readonly states: St[] = [];
  readonly calls: Call[] = [];
  readonly outbox: number[] = [];
  readonly pgLog: number[] = [];
  readonly waiting = new Set<number>();
  readonly lost = new Set<number>([3, 4, 5]);
  readonly idem = new Map<number, Idem>();
  readonly saved = new Map<number, Reply>();
  readonly locks = new Map<number, number>();
  readonly pgSeen = new Map<number, number>();
  dbTx = 0;
  nextKey = 0;
  relayed = 0;
  conflicts = 0;
  replayed = 0;
  busy = 0;
  asks = 0;
  anomalies = 0;

  constructor(readonly mode: Mode, readonly loud: boolean, readonly traced: number) {}

  static fingerprint(body: string): number {
    let h = 0;
    for (let i = 0; i < body.length; i++) h = (h * 31 + body.charCodeAt(i)) % 1_000_000_007;
    return h;
  }

  say(at: number, r: number, what: string): void {
    if (this.reqs[r]!.key === this.traced) console.log(`t=${at}ms K${this.traced} req=${r} ${what}`);
  }

  note(at: number, p: number, what: string): void { if (this.loud) console.log(`t=${at}ms K${this.pays[p]!.key} ${what}`); }

  send(at: number, key: number, order: number, amount: number, tries: number, retries: boolean, lose: boolean): void {
    this.nextKey = Math.max(this.nextKey, key + 1);
    this.reqs.push({ key, order, amount, body: `order=O${order}&amount=${amount}`, tries, retries, lose });
    this.replies.push(undefined);
    this.clock.schedule(at + APP_NET + DB_NET, Kind.BEGIN, this.reqs.length - 1);
  }

  reply(p: number): Reply {
    const st = this.states[p]!;
    const code = st === St.SUCCEEDED ? 201 : st === St.FAILED ? 402 : 202;
    return { code, body: `{"payment":"P${this.pays[p]!.key}","status":"${NAMES[st]}"}` };
  }

  call(now: number, p: number, r: number): void {
    this.calls.push({ pay: p, req: r });
    this.waiting.add(this.calls.length - 1);
    this.clock.schedule(now + DB_NET + PG_NET, Kind.PG, this.calls.length - 1);
    this.clock.schedule(now + DB_NET + PG_TIMEOUT + DB_NET, Kind.COMMIT, -this.calls.length);
  }

  answer(now: number, r: number, reply: Reply): void {
    this.replies[r] = reply;
    this.clock.schedule(now + DB_NET + APP_NET, Kind.REPLY, r);
  }

  settle(now: number, p: number, st: St): void {
    this.states[p] = st;
    if (st !== St.UNKNOWN && this.idem.has(this.pays[p]!.key)) this.saved.set(this.pays[p]!.key, this.reply(p));
    if (st !== St.SUCCEEDED) return;
    this.outbox.push(p);
    this.clock.schedule((Math.floor(now / RELAY_EVERY) + 1) * RELAY_EVERY, Kind.RELAY, 0);
  }

  begin(now: number, r: number, q: Req): void {
    this.dbTx++;
    if (this.loud) this.say(now - DB_NET, r, `lb -> api-${(r % 2) + 1} POST /payments ${q.body}`);
    const row = this.idem.get(q.key);
    const f = PaymentIdempotency.fingerprint(q.body);
    if (this.mode === Mode.LOCK && (this.locks.get(q.key) ?? 0) > now) {
      this.busy++;
      this.answer(now, r, { code: 409, body: `{"error":"locked"}` });
    } else if (this.mode === Mode.LOCK || row === undefined) {
      this.pays.push({ key: q.key, order: q.order, amount: q.amount, started: now });
      this.states.push(St.PROCESSING);
      if (this.mode === Mode.LOCK) this.locks.set(q.key, now + LOCK_TTL);
      else this.idem.set(q.key, { fp: f, pay: this.pays.length - 1 });
      this.say(now, r, `db: INSERT idempotency row + payment P${q.key} (processing), commit`);
      this.say(now + DB_NET, r, `api -> pg approve, idempotency key P${q.key}`);
      this.call(now, this.pays.length - 1, r);
    } else if (row.fp !== f) {
      console.log(`t=${now}ms K${q.key} req=${r} db: same key, fingerprint ${f} != ${row.fp} -> 422`);
      this.answer(now, r, { code: 422, body: `{"error":"different request body"}` });
    } else if (this.saved.has(q.key)) {
      this.replayed++;
      this.say(now, r, "db: duplicate key, response saved -> replay it with Idempotent-Replayed: true");
      this.answer(now, r, this.saved.get(q.key)!);
    } else if (this.states[row.pay] === St.PROCESSING) {
      this.conflicts++;
      this.say(now, r, `db: duplicate key, payment P${q.key} processing -> 409`);
      this.answer(now, r, { code: 409, body: `{"error":"in progress"}` });
    } else {
      this.say(now, r, `db: duplicate key, payment P${q.key} unknown -> ask pg again with key P${q.key}`);
      this.call(now, row.pay, r);
    }
  }

  pg(now: number, id: number): void {
    const c = this.calls[id]!;
    const p = this.pays[c.pay]!;
    if (now >= DOWN_FROM && now < DOWN_TO) {
      if (c.req >= 0) this.note(now, c.pay, `pg: down, approve request for P${p.key} never arrives`);
      return;
    }
    const key = this.mode === Mode.NEW_PG_KEY ? 1_000_000 + id : c.pay;
    const seen = this.pgSeen.get(key);
    const fresh = seen === undefined || now - seen >= PG_KEEP;
    if (fresh) {
      this.pgSeen.set(key, now);
      this.pgLog.push(c.pay);
    }
    const drop = this.lost.delete(p.order);
    const what = fresh ? `pg: approve P${p.key} amount=${p.amount}` : `pg: key P${p.key} seen, replay its approval`;
    const n = this.pgLog.filter((x) => x === c.pay).length;
    this.note(now, c.pay, `${what} (approvals of P${p.key}: ${n})${drop ? ", response lost" : ""}`);
    if (!drop) this.clock.schedule(now + PG_NET + DB_NET, Kind.COMMIT, id + 1);
  }

  commit(now: number, id: number, ok: boolean): void {
    if (!this.waiting.delete(id)) return;
    this.dbTx++;
    const c = this.calls[id]!;
    const st = this.states[c.pay]!;
    const next = ok ? St.SUCCEEDED : this.mode === Mode.TIMEOUT_FAILS ? St.FAILED : St.UNKNOWN;
    if (st === St.PROCESSING || (st === St.UNKNOWN && next !== St.UNKNOWN)) {
      this.settle(now, c.pay, next);
      const why = ok ? ", save response 201 + outbox row, commit" : " after pg read timeout, commit";
      this.note(now, c.pay, `db: payment P${this.pays[c.pay]!.key} ${NAMES[next]}${why}${c.req < 0 ? " (confirm job)" : ""}`);
    }
    if (c.req >= 0) this.answer(now, c.req, this.reply(c.pay));
  }

  receive(now: number, r: number, q: Req, a: Reply): void {
    this.say(now, r, q.lose ? "app: connection dropped, response lost" : `app: ${a.code} ${a.body}`);
    const again = q.lose || a.code === 409 || (a.code === 202 && q.retries);
    const anew = !q.lose && a.code === 402 && q.retries;
    const key = anew || this.mode === Mode.NO_KEY ? this.nextKey : q.key;
    if (again || anew) this.send(now + BACKOFF[Math.min(q.tries, 2)]!, key, q.order, q.amount, q.tries + 1, q.retries && !anew, false);
  }

  relay(now: number): void {
    for (; this.relayed < this.outbox.length; this.relayed++) {
      const p = this.pays[this.outbox[this.relayed]!]!;
      this.note(now, this.outbox[this.relayed]!, `relay: outbox P${p.key} -> order service, O${p.order} paid`);
    }
  }

  confirm(now: number): void {
    for (let p = 0; p < this.pays.length; p++) {
      const young = now - this.pays[p]!.started < CONFIRM_FOR || this.mode === Mode.NO_CUTOFF;
      if (this.states[p] === St.UNKNOWN && young) {
        this.asks++;
        this.call(now, p, -1);
      }
    }
    if (now + CONFIRM_EVERY < RECONCILE_AT) this.clock.schedule(now + CONFIRM_EVERY, Kind.CONFIRM, 0);
  }

  reconcile(now: number): void {
    const got: number[] = new Array<number>(this.pays.length).fill(0);
    for (const p of this.pgLog) got[p]!++;
    let matched = 0, succeeded = 0, failed = 0;
    for (let p = 0; p < this.pays.length; p++) {
      const st = this.states[p]!;
      if (st === St.UNKNOWN && got[p]! < 2) {
        this.settle(now, p, got[p] === 1 ? St.SUCCEEDED : St.FAILED);
        succeeded += got[p]!;
        failed += 1 - got[p]!;
      } else if ((st === St.SUCCEEDED ? 1 : 0) === got[p]) matched++;
      else this.anomalies++;
    }
    if (this.loud) console.log(`t=${now}ms reconcile with pg records: matched=${matched} unknown->succeeded=${succeeded}`
      + ` unknown->failed=${failed} anomalies=${this.anomalies} (confirm job asked pg again ${this.asks} times before)`);
  }

  stats(): string {
    const charged = new Map<number, number>();
    for (const p of this.pgLog) charged.set(this.pays[p]!.order, (charged.get(this.pays[p]!.order) ?? 0) + 1);
    const twice = [...charged.values()].filter((n) => n > 1).length;
    const succeeded = this.states.filter((s) => s === St.SUCCEEDED).length;
    return `requests=${this.reqs.length} pg-approvals=${this.pgLog.length} orders-charged-twice=${twice}`
      + ` payments-succeeded=${succeeded} order-notices=${this.relayed}`;
  }

  run(): this {
    for (let ev = this.clock.next(); ev !== undefined; ev = this.clock.next()) {
      const now = ev.at;
      const a = ev.arg;
      switch (ev.kind) {
        case Kind.BEGIN: this.begin(now, a, this.reqs[a]!);
          break;
        case Kind.PG: this.pg(now, a);
          break;
        case Kind.COMMIT: this.commit(now, a > 0 ? a - 1 : -a - 1, a > 0);
          break;
        case Kind.REPLY: this.receive(now, a, this.reqs[a]!, this.replies[a]!);
          break;
        case Kind.RELAY: this.relay(now);
          break;
        case Kind.CONFIRM: this.confirm(now);
          break;
        case Kind.RECONCILE: this.reconcile(now);
          break;
      }
    }
    return this;
  }
}

console.log("-- scenario 1: K1 pays 30000 for O1, one request and no failure --");
const one = new PaymentIdempotency(Mode.KEYED, true, 1);
one.send(0, 1, 1, 30_000, 0, true, false);
console.log(`one payment: ${one.run().stats()}`);
console.log("-- scenario 2: 580 attempts in the peak second, every 10th pressed twice 30ms apart, K104 resent with another amount --");
for (const m of [Mode.KEYED, Mode.LOCK]) {
  const s = new PaymentIdempotency(m, false, m === Mode.KEYED ? 109 : 0);
  for (let i = 0; i < 580; i++) s.send(Math.floor((i * 1000) / 580), 100 + i, 100 + i, 20_000, 0, true, false);
  for (let i = 9; i < 580; i += 10) s.send(Math.floor((i * 1000) / 580) + 30, 100 + i, 100 + i, 20_000, 0, true, false);
  s.send(Math.floor((4 * 1000) / 580) + 30, 104, 104, 21_000, 0, true, false);
  s.run();
  const extra = m === Mode.KEYED ? ` 409=${s.conflicts} replayed=${s.replayed}` : ` lock-busy=${s.busy}`;
  console.log(`${m === Mode.KEYED ? "idempotency-table" : "redis-lock-3s"}: ${s.stats()} db-tx=${s.dbTx}${extra}`);
}
console.log("-- scenario 3: first the response to K2 is lost on its way to the app --");
const lostReply = new PaymentIdempotency(Mode.KEYED, true, 2);
lostReply.send(0, 2, 2, 30_000, 0, true, true);
console.log(`with-key: ${lostReply.run().stats()}`);
const bare = new PaymentIdempotency(Mode.NO_KEY, false, 0);
bare.send(0, 2, 2, 30_000, 0, true, true);
console.log(`no-key: ${bare.run().stats()}`);
console.log("-- then pg loses the approval responses for P3 P4 P5 and stops answering from 100250ms for 4 hours --");
for (const m of [Mode.KEYED, Mode.TIMEOUT_FAILS, Mode.NEW_PG_KEY, Mode.NO_CUTOFF]) {
  const s = new PaymentIdempotency(m, m === Mode.KEYED, m === Mode.KEYED ? 3 : 0);
  s.send(0, 3, 3, 50_000, 0, true, false);
  s.send(1_000, 4, 4, 40_000, 0, false, false);
  s.send(100_000, 5, 5, 70_000, 0, false, false);
  s.send(110_000, 6, 6, 15_000, 0, false, false);
  s.clock.schedule(CONFIRM_EVERY, Kind.CONFIRM, 0);
  s.clock.schedule(RECONCILE_AT, Kind.RECONCILE, 0);
  const name = m === Mode.KEYED ? "this guide" : m === Mode.TIMEOUT_FAILS ? "timeout-as-failure" : m === Mode.NEW_PG_KEY ? "new-pg-key-per-retry" : "no-confirm-cutoff";
  console.log(`${name}: ${s.run().stats()} anomalies=${s.anomalies}`);
}

enum Mode { GUIDE, ONE_QUEUE, NO_SHARE }
enum Kind { TICK, REQ, ENQ, WRITE, READY, RESEND, CRASH, VISIBLE }
interface Ev { at: number; seq: number; kind: Kind; a: number }
interface Req { at: number; service: string; user: number; count: number; ch: number; prio: number; key: string; lostReply: boolean }
interface Notice { id: number; user: number; ch: number; prio: number; key: string; received: number }
interface Batch { worker: number; takenAt: number; items: number[][] }

class VirtualClock {
  private queue: Ev[] = [];
  private seq = 0;
  schedule(at: number, kind: Kind, a: number): void {
    const e = { at, seq: this.seq++, kind, a };
    let lo = 0;
    let hi = this.queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const m = this.queue[mid]!;
      if (m.at > at || (m.at === at && m.seq > e.seq)) lo = mid + 1;
      else hi = mid;
    }
    this.queue.splice(lo, 0, e);
  }
  next(): Ev | undefined { return this.queue.pop(); }
}

enum Circuit { CLOSED, OPEN, HALF_OPEN }
const WINDOW = 10, MIN_CALLS = 5, FAIL_PERCENT = 50, TRIALS = 3, OPEN_FOR = 10_000;

class Breaker {
  recent: boolean[] = [];
  state = Circuit.CLOSED;
  allowed = 0;
  judged = 0;
  failed = 0;
  openedAt = 0;

  allow(t: number): boolean {
    if (this.state === Circuit.OPEN && t - this.openedAt >= OPEN_FOR) this.state = Circuit.HALF_OPEN;
    if (this.state === Circuit.HALF_OPEN && this.allowed < TRIALS) return ++this.allowed > 0;
    return this.state === Circuit.CLOSED;
  }

  record(ok: boolean, t: number): string | null {
    if (this.state === Circuit.OPEN) return null;
    if (this.state === Circuit.HALF_OPEN) {
      this.judged++;
      this.failed += ok ? 0 : 1;
      if (this.judged < TRIALS) return null;
      if (this.failed * 100 >= FAIL_PERCENT * TRIALS) return this.open(t, "half-open, " + this.failed + " of " + TRIALS + " test calls failed, the breaker opens again");
      this.state = Circuit.CLOSED;
      return "half-open, " + TRIALS + " test calls passed, the breaker closes and sms go to A again";
    }
    this.recent.push(ok);
    if (this.recent.length > WINDOW) this.recent.shift();
    const bad = this.recent.filter((b) => !b).length;
    if (this.recent.length < MIN_CALLS || bad * 100 < FAIL_PERCENT * this.recent.length) return null;
    return this.open(t, bad + " of the last " + this.recent.length + " calls failed, the breaker opens and sms go to B");
  }

  open(t: number, why: string): string {
    this.state = Circuit.OPEN;
    this.openedAt = t;
    this.allowed = this.judged = this.failed = 0;
    this.recent = [];
    return why;
  }
}

const PUSH = 0, SMS = 1, URGENT = 0, NORMAL = 1, CAMPAIGN = 2, FCM = 0, SMS_A = 1, SMS_B = 2;
const HANDED = 1, TOKEN_REMOVED = 2, FAILURE_QUEUE = 3, SENDING = 4, MAX = 11_000;
const MINSU = 1, SORA = 3, JISU = 4, DORA = 8, YUNA = 10, FANS = 10_000, OTP_USERS = 20_000;
const PER_TICK = 5, QUOTA = 100, SHARE = 20, MAX_ATTEMPTS = 5;
const STEP = 50, RT = 20, WRITE_AFTER = 25, STORE_RT = 2, VISIBILITY = 12_000;
const REGION_DOWN = [30_000, 50_000] as const, A_DOWN = [220_000, 240_000] as const, BACKOFF = [10_000, 1_000] as const;
const CRASH_AT = 300_022, UNTIL = 330_000;
const STATE = ["waiting", "handed over", "token removed", "failure queue", "sending"];
const VENDOR = ["fcm", "sms A", "sms B"];
const PRIO = ["urgent", "normal", "campaign"];

function who(u: number): string { return u === MINSU ? "minsu" : u === SORA ? "sora" : u === JISU ? "jisu" : u === DORA ? "dora" : u === YUNA ? "yuna" : "user " + u; }
function kind(n: Notice): string { return PRIO[n.prio] + (n.ch === PUSH ? " push" : " sms"); }
function req(at: number, service: string, user: number, count: number, ch: number, prio: number, key: string, lostReply: boolean): Req { return { at, service, user, count, ch, prio, key, lostReply }; }

class NotificationFanout {
  readonly clock = new VirtualClock();
  readonly reqs: Req[] = [];
  readonly notices: Notice[] = [];
  readonly keys = new Map<string, number>();
  readonly batches: Batch[] = [];
  readonly notes: string[][] = [[], [], []];
  readonly breakers = [new Breaker(), new Breaker()];
  readonly dead = [false, false];
  readonly attempts = new Array<number>(MAX).fill(0);
  readonly deliveries = new Array<number>(MAX).fill(0);
  readonly shown = new Array<number>(MAX).fill(0);
  readonly state = new Array<number>(MAX).fill(0);
  readonly handed = new Array<number>(MAX).fill(-1);
  readonly fresh: number[][] = [[], [], [], [], [], []];
  readonly ready: number[][] = [[], [], [], [], [], []];
  readonly sentTo = [0, 0, 0];
  seed = 2_026;
  window = -1;
  fcmWindow = -1;
  first429 = -1;
  last429 = -1;
  used = 0;
  retryUsed = 0;
  fcmCount = 0;
  got429 = 0;
  new429 = 0;
  maxRetryShare = 0;
  maybeTwice = 0;

  constructor(readonly mode: Mode) {
    this.reqs.push(req(1_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-1", false));
    this.reqs.push(req(10_000, "marketing", 1_000, FANS, PUSH, CAMPAIGN, "sale", false));
    this.reqs.push(req(11_000, "login", SORA, 1, PUSH, URGENT, "approve-sora-1", false));
    this.reqs.push(req(11_000, "order", SORA, 1, PUSH, NORMAL, "order-sora-1", false));
    this.reqs.push(req(35_000, "login", YUNA, 1, PUSH, URGENT, "approve-yuna-1", false));
    for (let i = 0; i <= 800; i++) this.reqs.push(req(200_000 + 100 * i, "login", OTP_USERS + i, 1, SMS, URGENT, "otp-" + i, false));
    this.reqs.push(req(250_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-2", true));
    this.reqs.push(req(251_000, "login", MINSU, 1, SMS, URGENT, "login-minsu-2", false));
    this.reqs.push(req(260_000, "order", DORA, 1, PUSH, NORMAL, "order-dora-1", false));
    this.reqs.push(req(299_990, "order", JISU, 1, PUSH, NORMAL, "order-jisu-5521", false));
    this.reqs.push(req(299_990, "order", JISU, 1, SMS, NORMAL, "order-jisu-5521-sms", false));
    this.reqs.forEach((r, i) => this.clock.schedule(r.at, Kind.REQ, i));
    this.clock.schedule(CRASH_AT, Kind.CRASH, 0);
    this.clock.schedule(0, Kind.TICK, 0);
  }

  lane(q: number[][], id: number): number[] { return q[this.notices[id]!.ch * 3 + (this.mode === Mode.ONE_QUEUE ? 0 : this.notices[id]!.prio)]!; }
  note(t: number, what: string): void { this.notes[t < 10_000 ? 0 : t < 200_000 ? 1 : 2]!.push("t=" + t + "ms " + what); }
  count(p: (n: Notice) => boolean): number { return this.notices.filter(p).length; }
  slowest(p: (n: Notice) => boolean): number { return this.notices.filter(p).reduce((m, n) => Math.max(m, this.handed[n.id]! - n.received), -1); }
  named(user: number, ch: number, prio: number): Notice { return this.notices.find((n) => n.user === user && n.ch === ch && n.prio === prio)!; }

  below(n: number): number {
    this.seed = (this.seed * 48_271) % 2_147_483_647;
    return this.seed % n;
  }

  static run(mode: Mode): NotificationFanout {
    const s = new NotificationFanout(mode);
    for (let e = s.clock.next(); e !== undefined && e.at <= UNTIL; e = s.clock.next()) s.handle(e);
    return s;
  }

  handle(e: Ev): void {
    const t = e.at;
    switch (e.kind) {
      case Kind.TICK: return this.tick(t);
      case Kind.REQ: return this.request(this.reqs[e.a]!, t);
      case Kind.ENQ: return void this.lane(this.fresh, e.a).push(e.a);
      case Kind.WRITE: return this.write(this.batches[e.a]!);
      case Kind.READY: return void this.lane(this.ready, e.a).push(e.a);
      case Kind.RESEND: return this.settle(this.notices[e.a]!, this.send(this.notices[e.a]!, t, FCM), FCM, t + RT);
      case Kind.CRASH: return this.crash(t);
      default: return void this.lane(this.fresh, e.a).unshift(e.a);
    }
  }

  request(r: Req, t: number): void {
    const old = this.keys.get(r.key);
    if (old !== undefined) {
      this.note(t, r.service + ": sends key=" + r.key + " again, the api answers with n=" + old + " (" + STATE[this.state[old]!] + ") and adds nothing, notifications for that key " + this.count((n) => n.key === r.key));
      return;
    }
    for (let u = r.user; u < r.user + r.count; u++) {
      this.keys.set(r.count > 1 ? r.key + "-" + u : r.key, this.notices.length);
      this.clock.schedule(t + STORE_RT, Kind.ENQ, this.notices.length);
      this.notices.push({ id: this.notices.length, user: u, ch: r.ch, prio: r.prio, key: r.count > 1 ? r.key + "-" + u : r.key, received: t });
    }
    const n = this.notices[this.notices.length - 1]!;
    const what = r.count > 1 ? "a campaign for " + r.count + " users is stored" : kind(n) + " for " + who(n.user) + " key=" + r.key + " is stored as n=" + n.id;
    if (r.user < OTP_USERS) this.note(t, r.service + ": " + what + " and queued at " + (t + STORE_RT) + "ms, " + (r.lostReply ? "the reply is lost" : "the reply goes back"));
  }

  tick(t: number): void {
    if (t + STEP <= UNTIL) this.clock.schedule(t + STEP, Kind.TICK, 0);
    const w = Math.floor(t / STEP) % 2;
    if (this.dead[w]) return;
    if (Math.floor(t / 1_000) !== this.window) [this.window, this.used, this.retryUsed] = [Math.floor(t / 1_000), 0, 0];
    const b: Batch = { worker: w, takenAt: t, items: [] };
    for (let k = 0; k < PER_TICK && this.used < QUOTA; k++) {
      const id = this.take(PUSH);
      if (id === undefined) break;
      this.used++;
      b.items.push([id, FCM, this.send(this.notices[id]!, t, FCM)]);
    }
    if (this.fresh[0]!.length + this.fresh[1]!.length + this.fresh[2]!.length > 0) this.maxRetryShare = Math.max(this.maxRetryShare, this.retryUsed);
    for (let k = 0; k < PER_TICK; k++) {
      const id = this.take(SMS);
      if (id === undefined) break;
      const v = this.breakers[0]!.allow(t) ? SMS_A : this.breakers[1]!.allow(t) ? SMS_B : SMS_A;
      b.items.push([id, v, this.send(this.notices[id]!, t, v)]);
    }
    if (b.items.length === 0) return;
    this.batches.push(b);
    this.clock.schedule(t + WRITE_AFTER, Kind.WRITE, this.batches.length - 1);
  }

  take(ch: number): number | undefined {
    for (let pass = 0; pass < 2; pass++) {
      for (let c = ch * 3; c < ch * 3 + 3; c++) {
        if (this.ready[c]!.length > 0 && (pass === 1 || ch === SMS || this.retryUsed < SHARE)) {
          this.retryUsed += ch === PUSH ? 1 : 0;
          return this.ready[c]!.shift();
        }
        if (pass === 0 && this.fresh[c]!.length > 0) return this.fresh[c]!.shift();
      }
    }
    return undefined;
  }

  send(n: Notice, t: number, v: number): number {
    this.maybeTwice += this.state[n.id] === SENDING ? 1 : 0;
    this.state[n.id] = SENDING;
    if (v === FCM) this.fcmCount = Math.floor(t / 1_000) === this.fcmWindow ? this.fcmCount + 1 : 1;
    if (v === FCM) this.fcmWindow = Math.floor(t / 1_000);
    const down = (v === FCM && t >= REGION_DOWN[0] && t < REGION_DOWN[1] && n.user % 5 < 3) || (v === SMS_A && t >= A_DOWN[0] && t < A_DOWN[1]);
    const code = v === FCM && this.fcmCount > QUOTA ? 429 : v === FCM && n.user === DORA ? 404 : down ? 500 : 200;
    if (code === 429 && this.first429 < 0) this.first429 = t;
    if (code === 429) this.last429 = t;
    this.got429 += code === 429 ? 1 : 0;
    this.new429 += code === 429 && this.attempts[n.id] === 0 ? 1 : 0;
    this.sentTo[v]!++;
    this.deliveries[n.id]! += code === 200 ? 1 : 0;
    if (code === 200 && (n.ch === SMS || this.deliveries[n.id] === 1)) this.shown[n.id]!++;
    if (code === 200 && this.handed[n.id]! < 0) this.handed[n.id] = t + RT;
    return code;
  }

  write(b: Batch): void {
    if (this.dead[b.worker]) return;
    for (const [id, v, code] of b.items) {
      const n = this.notices[id!]!;
      this.settle(n, code!, v!, b.takenAt + RT);
      if (n.user === MINSU && n.received < 10_000) this.note(b.takenAt, "worker " + b.worker + ": takes n=" + n.id + " first from the urgent sms queue, " + VENDOR[v!] + " answers " + code + " at " + (b.takenAt + RT) + "ms, recorded at " + (b.takenAt + WRITE_AFTER) + "ms, handed over " + (this.handed[n.id]! - n.received) + "ms after it was received");
    }
  }

  settle(n: Notice, code: number, v: number, at: number): void {
    const change = v === FCM ? null : this.breakers[v - 1]!.record(code === 200, at);
    if (change !== null) this.note(at, VENDOR[v] + ": " + change);
    if (code === 404) this.note(at, "fcm: 404 UNREGISTERED for " + who(n.user) + "'s push n=" + n.id + ", the token is removed and the push is not retried");
    this.state[n.id] = code === 200 ? HANDED : code === 404 ? TOKEN_REMOVED : 0;
    if (code === 200 || code === 404) return;
    this.attempts[n.id]!++;
    if (this.attempts[n.id]! >= MAX_ATTEMPTS) this.state[n.id] = FAILURE_QUEUE;
    if (this.attempts[n.id]! >= MAX_ATTEMPTS) return;
    const d = BACKOFF[n.ch === PUSH ? 0 : 1] << (this.attempts[n.id]! - 1);
    this.clock.schedule(at + d + this.below(d), this.mode === Mode.NO_SHARE && n.ch === PUSH ? Kind.RESEND : Kind.READY, n.id);
  }

  crash(t: number): void {
    this.dead[0] = true;
    for (const b of this.batches) {
      if (b.worker !== 0 || b.takenAt + WRITE_AFTER <= t) continue;
      for (const it of b.items) this.clock.schedule(b.takenAt + VISIBILITY, Kind.VISIBLE, it[0]!);
      const what = b.items.map((it) => kind(this.notices[it[0]!]!) + " n=" + it[0] + " to " + VENDOR[it[1]!]).join(" and ");
      this.note(t, "worker 0: stops after the vendors answered 200 at " + (b.takenAt + RT) + "ms for " + what + ", before recording at " + (b.takenAt + WRITE_AFTER) + "ms");
      this.note(b.takenAt + VISIBILITY, "queue: the same " + b.items.length + " become visible again " + VISIBILITY + "ms after worker 0 took them, worker 1 sends them again");
    }
  }

  pushLine(label: string): string {
    const urgent = this.handed[this.named(SORA, PUSH, URGENT).id]! - 11_000, normal = this.handed[this.named(SORA, PUSH, NORMAL).id]! - 11_000;
    return label + ": sora's urgent push was handed over " + urgent + "ms after it was received, her normal push after " + normal + "ms, the last of the " + FANS + " campaign pushes after " + this.slowest((n) => n.prio === CAMPAIGN) + "ms";
  }

  regionLine(label: string): string {
    const firstTry = this.count((n) => n.ch === PUSH && this.attempts[n.id] === 0 && this.handed[n.id]! >= REGION_DOWN[0] && this.handed[n.id]! < REGION_DOWN[1]);
    const share = this.mode === Mode.NO_SHARE ? "retries skip the quota check" : "retries took at most " + this.maxRetryShare + " of the " + QUOTA + " tokens a second while new pushes waited";
    const when = this.got429 === 0 ? "" : " from " + this.first429 + "ms to " + this.last429 + "ms";
    const yuna = this.named(YUNA, PUSH, URGENT);
    return label + ": fcm region down " + REGION_DOWN[0] + "-" + REGION_DOWN[1] + "ms, " + share + ", 429 from fcm " + this.got429 + when + " (" + this.new429 + " on a first try), yuna's urgent push in the failed region after " + (this.handed[yuna.id]! - yuna.received) + "ms and " + this.attempts[yuna.id] + " failures, pushes through on a first try in that time " + firstTry + ", the last campaign push after " + this.slowest((n) => n.prio === CAMPAIGN) + "ms, failure queue " + this.count((n) => this.state[n.id] === FAILURE_QUEUE);
  }

  report(): void {
    const otp = (n: Notice): boolean => n.user >= OTP_USERS;
    this.notes[2]!.push("sms: " + this.count(otp) + " urgent from 200000ms to 280000ms, sent to A " + this.sentTo[SMS_A] + " times and to B " + this.sentTo[SMS_B] + " times, " + this.count((n) => otp(n) && this.attempts[n.id]! > 0) + " failed at A and went out later, the slowest was handed over " + this.slowest(otp) + "ms after it was received");
    const p = this.named(JISU, PUSH, NORMAL), s = this.named(JISU, SMS, NORMAL);
    this.notes[2]!.push("jisu's device: push n=" + p.id + " arrived " + this.deliveries[p.id] + " times, on screen " + this.shown[p.id] + " (the same tag replaces it), sms n=" + s.id + " arrived " + this.deliveries[s.id] + " times, on screen " + this.shown[s.id]);
    this.notes[2]!.push("guide: " + this.notices.length + " notifications, handed over " + this.count((n) => this.state[n.id] === HANDED) + ", token removed " + this.count((n) => this.state[n.id] === TOKEN_REMOVED) + ", failure queue " + this.count((n) => this.state[n.id] === FAILURE_QUEUE) + ", still waiting " + this.count((n) => this.state[n.id] === 0) + ", arrived twice on devices " + this.count((n) => this.deliveries[n.id]! > 1) + ", flagged by the platform as maybe sent twice " + this.maybeTwice);
  }
}

const HEADS = ["-- scenario 1: login asks for one urgent sms while nothing else is running --", "-- scenario 2: a campaign for 10000 users comes first, urgent and normal pushes 1000ms later, an fcm region fails --", "-- scenario 3: sms A fails 220000-240000ms, a reply is lost, a token is gone, worker 0 stops before recording --"];

const g = NotificationFanout.run(Mode.GUIDE), one = NotificationFanout.run(Mode.ONE_QUEUE), none = NotificationFanout.run(Mode.NO_SHARE);
g.report();
g.notes[1]!.push(g.pushLine("guide"), one.pushLine("one-queue"), g.regionLine("guide"), none.regionLine("no-share"));
HEADS.forEach((head, i) => {
  console.log(head);
  g.notes[i]!.forEach((line) => console.log(line));
});

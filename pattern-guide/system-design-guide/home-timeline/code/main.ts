enum Kind { TICK, POST, READ, CRASH, RETRY }
enum Mode { GUIDE, FAN_OUT_ALL, LIST }
interface Ev { at: number; seq: number; kind: Kind; a: number; b: number }

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

const USERS = 200_000, STAR = 0, STAR_FOLLOWERS = 100_000, FOLLOWS = 200, STRIDE = 997, HISTORY = 60;
const ALICE = 49_999, BOB = 50_000, DAVE = 50_997, CAROL = 51_994;
const BIG = 2_000, KEEP = 800, PAGE = 20, CAP = 1, LISTS_PER_MS = 20, BACKGROUND = 6;
const DAY = 86_400_000, ACTIVE = 30 * DAY, NET = 50, CACHE_RT = 1, STORE_RT = 2;
const RETRY_AFTER = 1_000, VISIBLE = 5_000, CRASH_AT = 120_030, UNTIL = 240_000;
const NAMED = [[70_000, ALICE, 0], [90_500, STAR, 1], [91_000, ALICE, 1], [120_000, ALICE, 2]] as const;
const READS = [[75_000, BOB, 0], [90_000, BOB, 10], [96_000, BOB, 11], [97_000, BOB, 12], [125_000, CAROL, 20], [126_000, DAVE, 20], [127_000, BOB, 20]] as const;
const MAX_ID = (1n << 63n) - 1n;
const NONE: bigint[] = [];

function follower(a: number, j: number): number { return a === STAR ? j + 1 : (a + 1 + j * STRIDE) % USERS; }
function followee(u: number, j: number): number { return (((u - 1 - j * STRIDE) % USERS) + USERS) % USERS; }
function followerCount(a: number): number { return a === STAR ? STAR_FOLLOWERS : FOLLOWS; }
function followsStar(u: number): boolean { return u >= 1 && u <= STAR_FOLLOWERS; }
function node(u: number): number { return ((u * 2_654_435_761) % 4_294_967_296) >>> 30; }
function who(u: number): string { return u === ALICE ? "alice" : u === BOB ? "bob" : u === CAROL ? "carol" : u === DAVE ? "dave" : u === STAR ? "star" : "user " + u; }
function desc(c: bigint[]): bigint[] { return c.sort((x, y) => (x < y ? 1 : x > y ? -1 : 0)); }
function top(all: bigint[]): bigint[] { return all.slice(0, PAGE); }
function count(got: bigint[], keep: (x: bigint) => boolean): number { return got.filter(keep).length; }

function missing(t: number, got: bigint[], all: bigint[]): number {
  const inPage = new Set(got);
  let m = 0;
  for (const x of top(all)) if ((x >> 22n) <= BigInt(t - VISIBLE) && !inPage.has(x)) m++;
  return m;
}

function repeated(got: bigint[], before: bigint[]): number {
  const seen = new Set(before);
  let r = 0;
  for (const x of got) {
    if (seen.has(x)) r++;
    seen.add(x);
  }
  return r;
}

class HomeTimeline {
  readonly clock = new VirtualClock();
  readonly lastSeen: number[] = [];
  readonly built: boolean[] = [];
  readonly timeline = new Map<number, bigint[]>();
  readonly byAuthor = new Map<number, bigint[]>();
  readonly id: bigint[] = [];
  readonly at: number[] = [];
  readonly done: number[] = [];
  readonly toBob: number[] = [];
  readonly author: number[] = [];
  readonly scene: number[] = [];
  readonly jobs: number[] = [];
  readonly notes: string[][] = [[], [], [], []];
  first: bigint[] = [];
  readonly n = { seed: 2_026, lastMs: -1, seqInMs: 0, slowest: 0, cur: -1, next: 0, again: 0, lostNode: -1, missed: 0, repeats: 0, jobsDone: 0 };
  broken = false;

  constructor(readonly mode: Mode) {
    for (let u = 0; u < USERS; u++) {
      this.lastSeen.push(u % 2 === 0 ? 0 : -40 * DAY);
      this.built.push(u % 2 === 0);
    }
    for (let i = 0; i < HISTORY; i++) this.clock.schedule(500 + 1_000 * i, Kind.POST, followee(BOB, i), -1);
    for (const [at, a, s] of NAMED) this.clock.schedule(at, Kind.POST, a, s);
    for (let i = 1; i < 4; i++) this.clock.schedule(91_000 + 1_000 * i, Kind.POST, followee(BOB, i), -1);
    for (const [at, u, what] of READS) this.clock.schedule(at, Kind.READ, u, what);
    if (mode !== Mode.FAN_OUT_ALL) this.clock.schedule(CRASH_AT, Kind.CRASH, 0, 0);
    this.clock.schedule(0, Kind.TICK, 0, 0);
  }

  active(u: number, t: number): boolean { return t - this.lastSeen[u]! <= ACTIVE; }
  big(a: number): boolean { return followerCount(a) > BIG && this.mode !== Mode.FAN_OUT_ALL; }
  size(u: number): number { return (this.timeline.get(u) ?? NONE).length; }
  list(a: number): bigint[] { return this.byAuthor.get(a) ?? NONE; }
  authorOf(x: bigint): number { return this.author[this.id.indexOf(x)]!; }
  last(a: number): number { return Math.max(0, this.author.lastIndexOf(a)); }
  note(s: number, t: number, what: string): void { this.notes[s]!.push((t < 0 ? "" : "t=" + t + "ms ") + what); }

  below(n: number): number {
    this.n.seed = (this.n.seed * 48_271) % 2_147_483_647;
    return this.n.seed % n;
  }

  static run(mode: Mode): HomeTimeline {
    const s = new HomeTimeline(mode);
    for (let e = s.clock.next(); e !== undefined; e = s.clock.next()) s.handle(e);
    return s;
  }

  handle(e: Ev): void {
    const t = e.at;
    if (e.kind === Kind.TICK) this.tick(t);
    else if (e.kind === Kind.POST) this.post(t, e.a, e.b);
    else if (e.kind === Kind.READ) this.read(t, e.a, Math.floor(e.b / 10), e.b % 10);
    else if (e.kind === Kind.CRASH) this.crash(t);
    else this.jobs.push(e.a);
  }

  tick(t: number): void {
    if (this.below(1_000) < BACKGROUND) this.post(t, 1 + this.below(USERS - 1), -1);
    this.work(t);
    if (t < UNTIL) this.clock.schedule(t + 1, Kind.TICK, 0, 0);
  }

  post(t: number, a: number, s: number): void {
    if (t !== this.n.lastMs) this.n.seqInMs = 0;
    this.n.lastMs = t;
    const p = this.id.length;
    this.id.push((BigInt(t) << 22n) | (1n << 12n) | BigInt(this.n.seqInMs++));
    this.at.push(t);
    this.author.push(a);
    this.scene.push(s);
    this.done.push(-1);
    this.toBob.push(-1);
    if (!this.byAuthor.has(a)) this.byAuthor.set(a, []);
    this.byAuthor.get(a)!.push(this.id[p]!);
    this.jobs.push(p);
    const why = this.big(a) ? " is above " + BIG + ", the worker will skip it and followers read it from star's own list" : " is not above " + BIG + ", the worker will fan it out";
    if (s >= 0) this.note(s, t, who(a) + ": posts id=" + this.id[p] + ", " + followerCount(a) + " followers" + why);
  }

  work(t: number): void {
    let budget = CAP;
    while (this.n.cur >= 0 || this.jobs.length > 0) {
      if (this.n.cur < 0) {
        this.n.cur = this.jobs.shift()!;
        this.n.next = 0;
      }
      if (this.n.next === followerCount(this.author[this.n.cur]!) || this.big(this.author[this.n.cur]!)) {
        this.finish(t);
        continue;
      }
      const u = follower(this.author[this.n.cur]!, this.n.next);
      if (!this.active(u, t)) {
        this.n.next++;
        continue;
      }
      if (budget-- === 0) return;
      if (!this.write(t, u)) return;
      this.n.next++;
    }
  }

  write(t: number, u: number): boolean {
    const p = this.n.cur;
    if (this.broken && node(u) === this.n.lostNode) {
      this.broken = false;
      this.note(2, t, "fan-out: writing id=" + this.id[p] + " to user " + u + " on node " + this.n.lostNode + " fails, the job goes back to the queue at " + (t + RETRY_AFTER) + "ms to start again from its first follower");
      this.clock.schedule(t + RETRY_AFTER, Kind.RETRY, p, 0);
      this.n.cur = -1;
      return false;
    }
    if (!this.timeline.has(u)) this.timeline.set(u, []);
    const tl = this.timeline.get(u)!;
    let k = 0;
    while (k < tl.length && tl[k]! > this.id[p]!) k++;
    const dup = k < tl.length && tl[k] === this.id[p];
    if (!dup || this.mode === Mode.LIST) tl.splice(k, 0, this.id[p]!);
    if (tl.length > KEEP) tl.pop();
    if (dup) this.n.again++;
    if (u === BOB && this.toBob[p]! < 0) this.toBob[p] = t;
    return true;
  }

  finish(t: number): void {
    const p = this.n.cur;
    const a = this.author[p]!;
    this.done[p] = t;
    this.n.jobsDone++;
    this.n.slowest = Math.max(this.n.slowest, t - this.at[p]!);
    const skipped = [...Array(followerCount(a)).keys()].filter((j) => !this.active(follower(a, j), t)).length;
    const reach = " is in the timelines of " + (followerCount(a) - skipped) + " followers seen in the last 30 days";
    if (this.scene[p] === 0) this.note(0, t, "fan-out: id=" + this.id[p] + reach + " (bob's at " + this.toBob[p] + "ms), " + skipped + " others skipped (dave last seen 40 days ago)");
    if (this.scene[p] === 2) this.note(2, t, "fan-out: id=" + this.id[p] + reach + ", the retry wrote it again to " + this.n.again + " that already had it and each kept one copy");
    this.n.cur = -1;
  }

  crash(t: number): void {
    this.n.lostNode = node(CAROL);
    let gone = 0;
    for (let u = 0; u < USERS; u++) {
      if (node(u) !== this.n.lostNode) continue;
      if (this.built[u]) gone++;
      this.built[u] = false;
      this.timeline.delete(u);
    }
    this.broken = true;
    this.note(2, t, "cache node " + this.n.lostNode + ": stops, its " + gone + " built timelines are gone, an empty node takes its place");
  }

  read(t: number, u: number, s: number, what: number): void {
    if (this.mode === Mode.FAN_OUT_ALL) return;
    let wait = NET + CACHE_RT + (followsStar(u) ? STORE_RT : 0) + STORE_RT + NET;
    let how = "";
    if (!this.built[u] || !this.active(u, t)) {
      const asIs = this.page(u, MAX_ID, 0n, 0);
      if (this.size(u) > 0) this.note(s, t, "no-marker: " + who(u) + "'s page 1 from the timeline as it is (ids=" + this.size(u) + ") = " + asIs.length + " posts, missing=" + missing(t, asIs, this.truth(u, MAX_ID, 0n)));
      how = (this.size(u) === 0 ? "no timeline, last seen 40 days ago" : this.built[u] ? "last seen over 30 days ago" : "no built mark") + ", rebuilt from " + FOLLOWS + " author lists to ids=";
      this.rebuild(u);
      how += this.size(u) + ", then ";
      wait += STORE_RT + FOLLOWS / LISTS_PER_MS + CACHE_RT;
    }
    this.lastSeen[u] = t;
    const max = what === 1 ? this.first[this.first.length - 1]! : MAX_ID, since = what === 2 ? this.first[0]! : 0n;
    const got = this.page(u, max, since, 0);
    const all = this.truth(u, max, since);
    const miss = missing(t, got, all), rep = repeated(got, what === 1 ? this.first : []);
    this.n.missed += miss;
    this.n.repeats += rep;
    const asked = ["page 1", "page 2 by max_id=" + max, "newer by since_id=" + since];
    const fromStar = count(got, (x) => this.authorOf(x) === STAR), p2 = this.id[this.last(ALICE)]!;
    let line = who(u) + ": " + how + asked[what] + " = " + got.length + " posts, newest id=" + got[0] + " by " + who(this.authorOf(got[0]!)) + ", oldest id=" + got[got.length - 1] + ", from star's list " + fromStar;
    if (s === 2) line += ", alice's id=" + p2 + " x" + count(got, (x) => x === p2);
    this.note(s, t, line + ", answered " + wait + "ms later, repeated=" + rep + " missing=" + miss);
    if (what === 0 && s === 1) this.note(s, -1, "read-all: " + (top(all).join() === got.join() ? "the same" : "other") + " page 1 from " + (FOLLOWS + 1) + " author lists instead of 1 timeline and 1 list");
    if (what === 1) this.note(s, -1, "offset: page 2 by offset=" + PAGE + " = " + this.page(u, MAX_ID, 0n, PAGE).length + " posts, repeated=" + repeated(this.page(u, MAX_ID, 0n, PAGE), this.first));
    if (s === 2 && u === BOB) this.note(3, t, "list: bob's page 1 has alice's id=" + p2 + " x" + count(got, (x) => x === p2) + ", repeated=" + rep);
    if (what === 0) this.first = got;
  }

  rebuild(u: number): void {
    const all = [...(this.timeline.get(u) ?? NONE)];
    for (let j = 0; j < FOLLOWS; j++) all.push(...this.list(followee(u, j)));
    desc(all);
    const tl: bigint[] = [];
    for (const x of all) if (tl.length === 0 || tl[tl.length - 1] !== x) tl.push(x);
    while (tl.length > KEEP) tl.pop();
    this.timeline.set(u, tl);
    this.built[u] = true;
  }

  page(u: number, max: bigint, since: bigint, skip: number): bigint[] {
    const c: bigint[] = [];
    for (const x of this.timeline.get(u) ?? NONE) if (x < max && x > since) c.push(x);
    if (followsStar(u) && this.mode !== Mode.FAN_OUT_ALL) for (const x of this.list(STAR)) if (x < max && x > since) c.push(x);
    return desc(c).slice(skip, skip + PAGE);
  }

  truth(u: number, max: bigint, since: bigint): bigint[] {
    const c: bigint[] = [];
    for (let j = 0; j <= FOLLOWS; j++) {
      if (j === FOLLOWS && !followsStar(u)) break;
      for (const x of this.list(j < FOLLOWS ? followee(u, j) : STAR)) if (x < max && x > since) c.push(x);
    }
    return desc(c);
  }

  fanOutAll(): string {
    const star = this.last(STAR), q = Math.max(0, this.id.findIndex((_, p) => this.author[p] === ALICE && this.scene[p] === 1));
    const late = this.done.filter((d, p) => d >= 0 && d - this.at[p]! > VISIBLE).length;
    return "fan-out-all: star's post was in all " + STAR_FOLLOWERS / 2 + " active followers' timelines " + (this.done[star]! - this.at[star]!) + "ms after it was written (bob's after " + (this.toBob[star]! - this.at[star]!)
      + "ms), alice's post written at " + this.at[q] + "ms was in bob's after " + (this.toBob[q]! - this.at[q]!) + "ms, " + late + " of " + this.n.jobsDone + " posts took over " + VISIBLE + "ms";
  }
}

const g = HomeTimeline.run(Mode.GUIDE), f = HomeTimeline.run(Mode.FAN_OUT_ALL), l = HomeTimeline.run(Mode.LIST);
const head = [
  "-- scenario 1: alice posts once, bob opens his home timeline 5000ms later --",
  "-- scenario 2: star (100000 followers) posts between bob's page 1 and page 2, 4 more posts come in --",
  "-- scenario 3: cache node " + node(CAROL) + " stops while alice's post at 120000ms fans out, then carol on that node and dave (away 40 days) read --",
];
for (let s = 0; s < 3; s++) {
  console.log(head[s]);
  for (const line of g.notes[s]!) console.log(line);
  if (s === 1) console.log(f.fanOutAll());
}
for (const line of l.notes[3]!) console.log(line);
console.log("guide: " + g.n.jobsDone + " fan-out jobs done, the slowest was in all active followers' timelines " + g.n.slowest + "ms after it was written, reads missing=" + g.n.missed + " repeated=" + g.n.repeats);

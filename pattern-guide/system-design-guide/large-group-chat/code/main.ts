enum Kind { FORWARD, ROOM, RELAY, OPEN, RESUME, READ_DONE, STOP }
enum Mode { GUIDE, ALL_WATCHING, DIRECT, RELAY_ORDER, NO_JITTER, PUBSUB_ONLY }
interface Ev { at: number; seq: number; kind: Kind; a: number; b: number }

const ONLINE = 1_000_000, SIZE = 15_000, RELAYS = 67, PER_MS = 100, MAXLEN = 100_000;
const PASSIVE = 0, WATCHING = 1, AWAY_WATCHING = 2;
const LABEL = ["guide", "all-watching", "direct", "relay-order", "no-jitter", "pubsub-only"];
const APP_NET = 50, DC_NET = 1, GAP = 50, JITTER = 5_000;

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

class RoomLog {
  private writtenAt: number[] = [];
  append(at: number): void { this.writtenAt.push(at); }
  lastWritten(now: number): number {
    let i = this.writtenAt.length;
    while (i > 0 && this.writtenAt[i - 1]! > now) i--;
    return i;
  }
}

interface Catchup { upto: number; newest: number; recovering: boolean }

class LargeGroupChat {
  readonly every: number;
  readonly relayOf = new Int32Array(ONLINE);
  readonly last = new Int32Array(ONLINE);
  readonly watchers = new Int32Array(RELAYS);
  readonly members = new Int32Array(RELAYS);
  readonly state = new Uint8Array(ONLINE);
  readonly catching = new Uint8Array(ONLINE);
  readonly down = new Uint8Array(RELAYS);
  readonly relayBusy = new Array<number>(RELAYS).fill(0);
  readonly joiners: number[][] = Array.from({ length: RELAYS }, () => []);
  readonly catchups = new Map<number, Catchup>();
  readonly names = new Map<number, string>();
  readonly seen = new Map<number, string>();
  readonly sentAt: number[] = [];
  readonly messageOfSeq: number[] = [];
  readonly senderOf: number[] = [];
  readonly resumesPerSecond = new Map<number, number>();
  readonly readsPerSecond = new Map<number, number>();
  readonly clock = new VirtualClock();
  readonly log = new RoomLog();
  trace = false;
  seed = 2026;
  seq = 0;
  roomBusy = 0;
  since = 0;
  delayFirst = 0;
  delayMax = 0;
  readonly n = { roomSends: 0, relaySends: 0, skipped: 0, dropped: 0, filled: 0, trimmed: 0, logReads: 0, resumes: 0, lost: 0, gapSessions: 0, recoveredMax: 0 };

  constructor(readonly mode: Mode, readonly follow: number, name: string) {
    this.names.set(follow, name);
    this.every = mode === Mode.ALL_WATCHING ? 1 : 10;
    for (let s = 0; s < ONLINE; s++) {
      this.relayOf[s] = Math.floor(s / SIZE);
      this.state[s] = s % this.every === 0 ? WATCHING : PASSIVE;
      this.members[this.relayOf[s]!]!++;
      if (this.state[s] === WATCHING) this.watchers[this.relayOf[s]!]!++;
    }
  }

  name(s: number): string { return this.names.get(s) ?? "U" + s; }
  cost(n: number): number { return Math.floor((n + PER_MS - 1) / PER_MS); }
  say(at: number, what: string): void { console.log("t=" + at + "ms " + what); }
  bump(per: Map<number, number>, now: number): void { per.set(Math.floor(now / 1_000), (per.get(Math.floor(now / 1_000)) ?? 0) + 1); }
  peak(per: Map<number, number>): number { return Math.max(0, ...per.values()); }

  below(n: number): number {
    this.seed = this.seed * 48_271 % 2_147_483_647;
    return this.seed % n;
  }

  post(at: number, sender: number): void {
    if (this.trace) this.say(at, this.name(sender) + " app: sends a message on its WebSocket");
    this.senderOf.push(sender);
    this.sentAt.push(at);
    this.clock.schedule(at + APP_NET, Kind.FORWARD, this.relayOf[sender]!, this.senderOf.length - 1);
  }

  traffic(count: number): void {
    for (let k = 0; k < count; k++) this.post(k * GAP, SIZE + 10 * this.below(Math.floor((ONLINE - SIZE) / 10)));
  }

  forward(now: number, r: number, k: number): void {
    if (this.mode === Mode.RELAY_ORDER) {
      for (let o = 0; o < RELAYS; o++) this.clock.schedule(o === r ? now : now + DC_NET, Kind.RELAY, o, k);
      return;
    }
    if (this.trace) this.say(now, "relay " + (r + 1) + ": passes " + this.name(this.senderOf[k]!) + "'s message to the room process");
    this.clock.schedule(now + DC_NET, Kind.ROOM, 0, k);
  }

  room(now: number, k: number): void {
    const start = Math.max(now, this.roomBusy);
    this.seq++;
    this.messageOfSeq.push(k);
    if (this.mode === Mode.DIRECT) {
      this.roomBusy = start + this.cost(ONLINE);
      this.n.roomSends += ONLINE;
      this.arrived(k, this.roomBusy + DC_NET + APP_NET);
      return;
    }
    this.log.append(start + DC_NET);
    this.roomBusy = start + 2 * DC_NET + this.cost(RELAYS);
    this.n.roomSends += RELAYS;
    if (this.trace) this.say(start, "room: gives it seq=" + this.seq + " and appends it to the room log");
    if (this.trace) this.say(start + 2 * DC_NET, "room: the log has seq=" + this.seq + ", sends seq=" + this.seq + " to " + RELAYS + " relays");
    for (let r = 0; r < RELAYS; r++) this.clock.schedule(this.roomBusy + DC_NET, Kind.RELAY, r, this.seq);
  }

  arrived(k: number, at: number): void {
    const d = at - this.sentAt[k]!;
    if (k === 0) this.delayFirst = Math.max(this.delayFirst, d);
    this.delayMax = Math.max(this.delayMax, d);
  }

  relay(now: number, r: number, x: number): void {
    if (this.down[r]) return;
    const w = this.watchers[r]!;
    this.relayBusy[r] = Math.max(now, this.relayBusy[r]!) + this.cost(w);
    this.n.relaySends += w;
    this.n.skipped += this.members[r]! - w;
    const k = this.mode === Mode.RELAY_ORDER ? x : this.messageOfSeq[x - 1]!;
    const at = this.relayBusy[r]! + APP_NET;
    if (w > 0) this.arrived(k, at);
    if (this.trace && r === 1) this.say(now, "relay 2: seq=" + x + " to " + w + " watching sessions, " + (this.members[r]! - w) + " not watching are skipped, done at " + this.relayBusy[r] + "ms");
    for (let s = r * SIZE; s < Math.min(r * SIZE + SIZE, ONLINE); s += this.every) if (this.relayOf[s] === r && this.state[s] === WATCHING) this.receive(s, x, k, at);
    for (const s of this.joiners[r]!) if (this.relayOf[s] === r && this.state[s] === WATCHING) this.receive(s, x, k, at);
  }

  receive(s: number, x: number, k: number, at: number): void {
    if (this.seen.has(s)) this.seen.set(s, this.seen.get(s) + " " + this.name(this.senderOf[k]!));
    if (this.mode === Mode.RELAY_ORDER) return;
    if (x === this.last[s]! + 1 && !this.catching[s]) {
      this.last[s] = x;
      if (this.trace && s === this.follow) this.say(at, this.name(s) + " app: got " + this.name(this.senderOf[k]!) + "'s message seq=" + x + ", last=" + this.last[s]);
    } else if (this.mode === Mode.PUBSUB_ONLY && x > this.last[s]!) {
      this.n.lost += x - this.last[s]! - 1;
      this.n.gapSessions++;
      this.last[s] = x;
    } else {
      this.n.dropped++;
      if (!this.catching[s] && x > this.last[s]! + 1) this.catchUp(at - APP_NET, s);
      if (this.catching[s]) this.catchups.get(s)!.newest = Math.max(this.catchups.get(s)!.newest, x);
    }
  }

  catchUp(now: number, s: number): void {
    this.catching[s] = 1;
    if (!this.catchups.has(s)) this.catchups.set(s, { upto: 0, newest: 0, recovering: false });
    this.read(now, s, this.catchups.get(s)!);
  }

  read(now: number, s: number, c: Catchup): void {
    const first = Math.max(1, this.log.lastWritten(now + DC_NET) - MAXLEN + 1);
    this.n.trimmed += Math.max(0, first - this.last[s]! - 1);
    this.last[s] = Math.max(this.last[s]!, first - 1);
    c.upto = this.log.lastWritten(now + DC_NET);
    this.n.logReads++;
    this.bump(this.readsPerSecond, now);
    this.clock.schedule(now + 2 * DC_NET, Kind.READ_DONE, s, 0);
  }

  readDone(now: number, s: number): void {
    const c = this.catchups.get(s)!;
    if (s === this.follow) this.say(now, "relay " + (this.relayOf[s]! + 1) + ": " + this.name(s) + " gets seq " + (this.last[s]! + 1) + ".." + c.upto + " from the room log");
    this.n.filled += Math.max(0, c.upto - this.last[s]!);
    this.last[s] = Math.max(this.last[s]!, c.upto);
    if (c.newest > this.last[s]!) {
      this.read(now, s, c);
      return;
    }
    this.catchups.delete(s);
    this.catching[s] = 0;
    if (c.recovering) this.n.recoveredMax = Math.max(this.n.recoveredMax, now + APP_NET - this.since);
    if (s === this.follow) this.say(now + APP_NET, this.name(s) + " app: last=" + this.last[s] + ", caught up " + (now + APP_NET - this.since) + "ms after " + (c.recovering ? "relay 1 stopped" : "opening the room"));
  }

  open(now: number, s: number): void {
    this.say(now, this.name(s) + " app: opens the room it was not watching, last=" + this.last[s]);
    this.since = now;
    this.members[this.relayOf[s]!]!--;
    this.state[s] = AWAY_WATCHING;
    this.clock.schedule(now + APP_NET, Kind.RESUME, s, 0);
  }

  resume(now: number, s: number): void {
    const r = this.relayOf[s]!;
    const watch = this.state[s] === AWAY_WATCHING;
    this.state[s] = watch ? WATCHING : PASSIVE;
    this.members[r]!++;
    this.n.resumes++;
    this.bump(this.resumesPerSecond, now);
    if (!watch) return;
    this.watchers[r]!++;
    this.joiners[r]!.push(s);
    if (this.mode === Mode.PUBSUB_ONLY) return;
    if (s === this.follow) this.say(now, "relay " + (r + 1) + ": " + this.name(s) + " is watching, reads the room log after seq " + this.last[s]);
    this.catchUp(now, s);
  }

  stop(now: number, r: number): void {
    this.down[r] = 1;
    this.since = now;
    for (let s = r * SIZE; s < Math.min(r * SIZE + SIZE, ONLINE); s++) {
      const watch = this.state[s] === WATCHING;
      const wait = this.mode === Mode.NO_JITTER ? 0 : this.below(JITTER);
      this.state[s] = watch ? AWAY_WATCHING : PASSIVE;
      this.relayOf[s] = (r + 1 + s % (RELAYS - 1)) % RELAYS;
      if (s === this.follow) this.say(now, "relay " + (r + 1) + ": stops, " + this.members[r] + " connections close, " + this.name(s) + " had last=" + this.last[s] + " and waits " + wait + "ms to reconnect");
      if (watch && this.mode !== Mode.PUBSUB_ONLY) this.catchups.set(s, { upto: 0, newest: 0, recovering: true });
      this.clock.schedule(now + wait + APP_NET, Kind.RESUME, s, 0);
    }
  }

  run(): this {
    for (let e = this.clock.next(); e !== undefined; e = this.clock.next()) {
      if (e.kind === Kind.FORWARD) this.forward(e.at, e.a, e.b);
      else if (e.kind === Kind.ROOM) this.room(e.at, e.b);
      else if (e.kind === Kind.RELAY) this.relay(e.at, e.a, e.b);
      else if (e.kind === Kind.OPEN) this.open(e.at, e.a);
      else if (e.kind === Kind.RESUME) this.resume(e.at, e.a);
      else if (e.kind === Kind.READ_DONE) this.readDone(e.at, e.a);
      else this.stop(e.at, e.a);
    }
    return this;
  }

  flow(): string {
    let behind = 0, passiveGot = 0;
    for (let s = 0; s < ONLINE; s++) if (this.state[s] === WATCHING && this.last[s]! < this.seq) behind++;
    for (let s = 0; s < ONLINE; s++) if (this.state[s] === PASSIVE && this.last[s]! > 0) passiveGot++;
    return "messages=" + this.seq + " room-sends=" + this.n.roomSends + " relay-sends=" + this.n.relaySends + " skipped=" + this.n.skipped + " delay-first=" + this.delayFirst
      + "ms delay-max=" + this.delayMax + "ms" + (this.mode === Mode.DIRECT ? "" : " watching-behind=" + behind + " not-watching-got=" + passiveGot);
  }

  recovery(): string {
    if (this.mode === Mode.PUBSUB_ONLY) return "reconnected=" + this.n.resumes + " log-reads=0 lost=" + this.n.lost + " sessions-with-gap=" + this.n.gapSessions;
    return "reconnected=" + this.n.resumes + " log-reads=" + this.n.logReads + " filled-from-log=" + this.n.filled + " live-dropped=" + this.n.dropped + " trimmed=" + this.n.trimmed
      + " gaps-left=" + this.catchups.size + " recovered-max=" + this.n.recoveredMax + "ms reconnects-per-second-max=" + this.peak(this.resumesPerSecond)
      + " log-reads-per-second-max=" + this.peak(this.readsPerSecond);
  }
}

console.log("-- scenario 1: A sends one message to a room with 1000000 online on 67 relays, 1 in 10 watching it --");
const one = new LargeGroupChat(Mode.GUIDE, 15_010, "V");
one.trace = true;
one.names.set(0, "A");
one.post(0, 0);
console.log("one message: " + one.run().flow());
console.log("-- scenario 2: 20 messages per second for 5s, P opens the room at 2500ms --");
for (const m of [Mode.GUIDE, Mode.ALL_WATCHING, Mode.DIRECT]) {
  const c = new LargeGroupChat(m, m === Mode.GUIDE ? 15_011 : -1, "P");
  c.traffic(100);
  if (m === Mode.GUIDE) c.clock.schedule(2_500, Kind.OPEN, 15_011, 0);
  console.log(LABEL[m] + ": " + c.run().flow());
}
console.log("two senders press at the same ms, X on relay 1 and Y on relay 2:");
for (const m of [Mode.GUIDE, Mode.RELAY_ORDER]) {
  const c = new LargeGroupChat(m, 10, "V1");
  for (const [s, n] of [[0, "X"], [15_000, "Y"], [15_010, "V2"]] as const) c.names.set(s, n);
  for (const s of [10, 15_010]) c.seen.set(s, "");
  c.post(0, 0);
  c.post(0, 15_000);
  c.run();
  console.log(LABEL[m] + ": V1 sees" + c.seen.get(10) + ", V2 sees" + c.seen.get(15_010));
}
console.log("-- scenario 3: relay 1 stops at 2000ms while 20 messages per second go on, its 15000 sessions reconnect --");
for (const m of [Mode.GUIDE, Mode.NO_JITTER, Mode.PUBSUB_ONLY]) {
  const c = new LargeGroupChat(m, m === Mode.GUIDE ? 0 : -1, "R");
  c.traffic(200);
  c.clock.schedule(2_000, Kind.STOP, 0, 0);
  console.log(LABEL[m] + ": " + c.run().recovery());
}

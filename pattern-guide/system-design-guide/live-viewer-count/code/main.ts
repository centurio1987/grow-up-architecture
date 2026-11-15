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

enum Kind { JOIN, BEAT, CLOSE, PAUSE, REPORT, TICK, STOP, RECONNECT }

interface Ev {
  at: number;
  seq: number;
  kind: Kind;
  arg: number;
}

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

const TTL_MS = 45_000;
const STALE_MS = 3_000;
const NEVER = -1e15;

class EdgeServer {
  readonly lastSignal = new Map<number, number>();
  alive = true;
  shown = 0;

  constructor(readonly name: string) {}

  open(conn: number): void {
    this.lastSignal.set(conn, NEVER);
  }

  signal(conn: number, now: number): void {
    if (this.lastSignal.has(conn)) this.lastSignal.set(conn, now);
  }

  close(conn: number): void {
    this.lastSignal.delete(conn);
  }

  activeCount(now: number): number {
    return [...this.lastSignal.values()].filter((t) => now - t <= TTL_MS).length;
  }

  push(total: number): number {
    this.shown = total;
    return this.lastSignal.size;
  }

  stop(): number[] {
    this.alive = false;
    const dropped = [...this.lastSignal.keys()].sort((p, q) => p - q);
    this.lastSignal.clear();
    return dropped;
  }
}

class Aggregator {
  readonly count: number[];
  private reportedAt: number[];

  constructor(edges: number) {
    this.count = new Array<number>(edges).fill(0);
    this.reportedAt = new Array<number>(edges).fill(NEVER);
  }

  report(edge: number, n: number, now: number): void {
    this.count[edge] = n;
    this.reportedAt[edge] = now;
  }

  fresh(edge: number, now: number): boolean {
    return now - this.reportedAt[edge]! <= STALE_MS;
  }

  total(now: number): number {
    let sum = 0;
    for (let e = 0; e < this.count.length; e++) if (this.fresh(e, now)) sum += this.count[e]!;
    return sum;
  }
}

class PubSub {
  publish(total: number, subscribers: EdgeServer[]): number {
    let writes = 0;
    for (const edge of subscribers) if (edge.alive) writes += edge.push(total);
    return writes;
  }
}

const HEARTBEAT_MS = 20_000;
const RETRY_MAX_MS = 8_000;
const VIEWERS = 4_201;

const t = (ms: number): string => `${Math.floor(ms / 1000)}.${Math.floor((ms % 1000) / 100)}s`;

class LiveViewerCount {
  clock = new VirtualClock();
  rng = new Rng(2026);
  edges = [new EdgeServer("a"), new EdgeServer("b"), new EdgeServer("c")];
  aggregator = new Aggregator(this.edges.length);
  pubsub = new PubSub();
  edgeOf = new Array<number>(VIEWERS + 1).fill(-1);
  retryOf = new Array<number>(VIEWERS + 1).fill(0);
  playing = new Array<boolean>(VIEWERS + 1).fill(false);
  mode = 0;
  nextEdge = 0;
  actual = 0;
  load = { joins: 0, reports: 0, publishes: 0, sseWrites: 0, naive: 0 };
  last = { total: 0, actual: 0, reconnect: 0 };

  edgeFor(conn: number): EdgeServer {
    return this.edges[this.edgeOf[conn]!]!;
  }

  connect(conn: number, now: number): void {
    while (!this.edges[this.nextEdge]!.alive) this.nextEdge = (this.nextEdge + 1) % this.edges.length;
    this.edgeOf[conn] = this.nextEdge;
    this.nextEdge = (this.nextEdge + 1) % this.edges.length;
    const edge = this.edgeFor(conn);
    edge.open(conn);
    this.retryOf[conn] = this.rng.below(RETRY_MAX_MS);
    if (this.playing[conn]) edge.signal(conn, now);
  }

  handle(ev: Ev): void {
    const now = ev.at;
    const x = ev.arg;
    switch (ev.kind) {
      case Kind.JOIN:
        for (const edge of this.edges) if (edge.alive) this.load.naive += edge.lastSignal.size;
        this.load.joins++;
        this.actual++;
        this.playing[x] = true;
        this.connect(x, now);
        this.clock.schedule(now + HEARTBEAT_MS, Kind.BEAT, x);
        if (this.mode === 1) console.log(`t=${t(now)} join conn=${x} edge=${this.edgeFor(x).name}`);
        break;
      case Kind.BEAT:
        if (!this.playing[x]) return;
        if (this.edgeOf[x]! >= 0) this.edgeFor(x).signal(x, now);
        this.clock.schedule(now + HEARTBEAT_MS, Kind.BEAT, x);
        break;
      case Kind.CLOSE:
        this.playing[x] = false;
        this.actual--;
        this.edgeFor(x).close(x);
        console.log(`t=${t(now)} close conn=${x} edge=${this.edgeFor(x).name}`);
        break;
      case Kind.PAUSE: {
        const edge = this.edgeFor(x);
        this.playing[x] = false;
        this.actual--;
        console.log(`t=${t(now)} pause conn=${x} edge=${edge.name} last-signal=${t(edge.lastSignal.get(x)!)}`);
        break;
      }
      case Kind.REPORT: {
        const edge = this.edges[x]!;
        if (!edge.alive) return;
        this.aggregator.report(x, edge.activeCount(now), now);
        this.load.reports++;
        this.clock.schedule(now + 1_000, Kind.REPORT, x);
        break;
      }
      case Kind.TICK: {
        const total = this.aggregator.total(now);
        this.load.publishes++;
        this.load.sseWrites += this.pubsub.publish(total, this.edges);
        if (now >= 0 && (total !== this.last.total || this.actual !== this.last.actual)) this.print(now, total);
        this.load = { joins: 0, reports: 0, publishes: 0, sseWrites: 0, naive: 0 };
        this.clock.schedule(now + 1_000, Kind.TICK, 0);
        break;
      }
      case Kind.STOP: {
        const edge = this.edges[x]!;
        const dropped = edge.stop();
        for (const conn of dropped) {
          this.edgeOf[conn] = -1;
          this.clock.schedule(now + this.retryOf[conn]!, Kind.RECONNECT, conn);
        }
        console.log(`t=${t(now)} stop edge=${edge.name} dropped=${dropped.length} screens-frozen-at=${edge.shown}`);
        break;
      }
      case Kind.RECONNECT:
        this.connect(x, now);
        this.last.reconnect = now;
        break;
    }
  }

  print(now: number, total: number): void {
    let line = `t=${t(now)} total=${total} actual=${this.actual}`;
    const l = this.load;
    if (this.mode === 2) {
      line += ` joins=${l.joins} reports=${l.reports} publishes=${l.publishes} sse-writes=${l.sseWrites} naive=${l.naive}`;
    }
    for (let e = 0; this.mode === 3 && e < this.edges.length; e++) {
      line += ` ${this.edges[e]!.name}=${this.aggregator.fresh(e, now) ? this.aggregator.count[e] : "-"}`;
    }
    console.log(line);
    this.last.total = total;
    this.last.actual = this.actual;
  }

  runUntil(limit: number): void {
    for (let ev = this.clock.nextBefore(limit); ev !== undefined; ev = this.clock.nextBefore(limit)) this.handle(ev);
  }
}

const sim = new LiveViewerCount();
for (let id = 1; id <= 1_200; id++) sim.clock.schedule(-20_000 + (id - 1) * 16, Kind.JOIN, id);
sim.clock.schedule(2_300, Kind.JOIN, 1_201);
sim.clock.schedule(10_200, Kind.CLOSE, 1_201);
sim.clock.schedule(12_500, Kind.PAUSE, 751);
for (let id = 1_202; id <= VIEWERS; id++) sim.clock.schedule(60_000 + sim.rng.below(5_000), Kind.JOIN, id);
sim.clock.schedule(80_000, Kind.STOP, 2);
for (let e = 0; e < sim.edges.length; e++) sim.clock.schedule(-20_000, Kind.REPORT, e);
sim.clock.schedule(-19_500, Kind.TICK, 0);

sim.runUntil(0);
const titles = ["one join, one close, one pause", "3000 joins in 5 seconds", "edge c stops"];
const ends = [60_000, 80_000, 95_000];
for (sim.mode = 1; sim.mode <= 3; sim.mode++) {
  console.log(`-- scenario ${sim.mode}: ${titles[sim.mode - 1]} --`);
  sim.runUntil(ends[sim.mode - 1]!);
}
console.log(`last-reconnect=${t(sim.last.reconnect)}`);

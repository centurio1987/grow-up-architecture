// SY-01 실시간 공동 편집 — 집필 전 확인용 시험 코드(카드 KAN-002.3 S2).
// 중앙 서버 OT(운영 변환): 서버가 순서를 정하고, 늦게 온 편집을 앞선 편집 뒤로 옮긴다.
// 시간은 가상 시계이고 사건은 (시각, 등록 순서)로만 정렬하므로 실행할 때마다 출력이 같다.

type Op =
  | { kind: "ins"; pos: number; ch: string; site: string }
  | { kind: "del"; pos: number; site: string }
  | { kind: "noop"; site: string };

function applyOp(doc: string, op: Op): string {
  if (op.kind === "ins") return doc.slice(0, op.pos) + op.ch + doc.slice(op.pos);
  if (op.kind === "del") return doc.slice(0, op.pos) + doc.slice(op.pos + 1);
  return doc;
}

// a 를, 이미 적용된 b 뒤로 옮긴다. 같은 자리 삽입은 site 가 작은 쪽이 왼쪽에 놓인다.
function transform(a: Op, b: Op): Op {
  if (a.kind === "noop" || b.kind === "noop") return a;
  if (a.kind === "ins") {
    if (b.kind === "ins") {
      const shift = b.pos < a.pos || (b.pos === a.pos && b.site < a.site);
      return shift ? { ...a, pos: a.pos + 1 } : a;
    }
    return b.pos < a.pos ? { ...a, pos: a.pos - 1 } : a;
  }
  if (b.kind === "ins") return b.pos <= a.pos ? { ...a, pos: a.pos + 1 } : a;
  if (b.pos < a.pos) return { ...a, pos: a.pos - 1 };
  if (b.pos === a.pos) return { kind: "noop", site: a.site };
  return a;
}

class Sim {
  t = 0;
  private seq = 0;
  private queue: { t: number; seq: number; run: () => void }[] = [];
  at(t: number, run: () => void): void {
    this.queue.push({ t, seq: this.seq++, run });
  }
  runAll(): void {
    while (this.queue.length > 0) {
      this.queue.sort((x, y) => x.t - y.t || x.seq - y.seq);
      const e = this.queue.shift()!;
      this.t = e.t;
      e.run();
    }
  }
}

// 한 방향 연결. 끊긴 동안 보낸 것은 다시 이어진 뒤에 차례대로 도착한다.
class Link {
  private last = 0;
  constructor(private delay: number, private offFrom: number, private offTo: number) {}
  arrival(sent: number): number {
    const start = sent >= this.offFrom && sent < this.offTo ? this.offTo : sent;
    this.last = Math.max(this.last, start + this.delay);
    return this.last;
  }
}

class Server {
  history: Op[] = [];
  clients: Client[] = [];
  constructor(private sim: Sim, private ot: boolean, private init: string) {}
  receive(from: Client, base: number, op: Op): void {
    let o = op;
    if (this.ot) for (const h of this.history.slice(base)) o = transform(o, h);
    this.history.push(o);
    for (const c of this.clients) {
      const at = c.down.arrival(this.sim.t);
      if (c === from) this.sim.at(at, () => c.ack());
      else this.sim.at(at, () => c.remote(o));
    }
  }
  doc(): string {
    return this.history.reduce(applyOp, this.init);
  }
}

class Client {
  doc: string;
  private rev = 0;
  private inflight: Op | null = null;
  private buffer: Op[] = [];
  up: Link;
  down: Link;
  constructor(public site: string, private sim: Sim, private server: Server, private ot: boolean,
              delay: number, init: string, off: [number, number]) {
    this.doc = init;
    this.up = new Link(delay, off[0], off[1]);
    this.down = new Link(delay, off[0], off[1]);
  }
  type(pos: number, ch: string): void {
    this.edit({ kind: "ins", pos: Math.min(pos, this.doc.length), ch, site: this.site });
  }
  erase(pos: number): void {
    if (this.doc.length > 0) this.edit({ kind: "del", pos: Math.min(pos, this.doc.length - 1), site: this.site });
  }
  private edit(op: Op): void {
    this.doc = applyOp(this.doc, op);
    if (this.inflight) this.buffer.push(op);
    else this.send(op);
  }
  private send(op: Op): void {
    this.inflight = op;
    const base = this.rev;
    this.sim.at(this.up.arrival(this.sim.t), () => this.server.receive(this, base, op));
  }
  ack(): void {
    this.rev++;
    this.inflight = null;
    const next = this.buffer.shift();
    if (next) this.send(next);
  }
  remote(op: Op): void {
    let incoming = op;
    if (this.ot) {
      const mine = this.inflight ? [this.inflight, ...this.buffer] : [...this.buffer];
      for (let i = 0; i < mine.length; i++) {
        const m = mine[i]!;
        mine[i] = transform(m, incoming);
        incoming = transform(incoming, m);
      }
      if (this.inflight) {
        this.inflight = mine[0]!;
        this.buffer = mine.slice(1);
      } else {
        this.buffer = mine;
      }
    }
    this.doc = applyOp(this.doc, incoming);
    this.rev++;
  }
}

type Spec = { site: string; delay: number; off?: [number, number] };

function world(ot: boolean, init: string, specs: Spec[]): { sim: Sim; server: Server; cs: Client[] } {
  const sim = new Sim();
  const server = new Server(sim, ot, init);
  const cs = specs.map((s) => new Client(s.site, sim, server, ot, s.delay, init, s.off ?? [-1, -1]));
  server.clients = cs;
  return { sim, server, cs };
}

function report(server: Server, cs: Client[]): void {
  const docs = cs.map((c) => `${c.site}="${c.doc}"`).join(" ");
  const kinds = new Set([server.doc(), ...cs.map((c) => c.doc)]).size;
  console.log(`  서버="${server.doc()}" ${docs} · 서로 다른 문서 ${kinds}개`);
}

// 시나리오 1 — 기본: A 가 쓰고 B 가 이어 쓴다.
function scenario1(): void {
  console.log("[1] 기본 흐름 — A 가 Hi 를 치고, B 가 받은 뒤 ! 를 붙인다");
  const { sim, server, cs } = world(true, "", [{ site: "A", delay: 40 }, { site: "B", delay: 60 }]);
  const [a, b] = cs as [Client, Client];
  sim.at(0, () => a.type(0, "H"));
  sim.at(10, () => a.type(1, "i"));
  sim.at(300, () => console.log(`  t=300ms B 화면="${b.doc}"`));
  sim.at(300, () => b.type(2, "!"));
  sim.runAll();
  report(server, cs);
}

// 결정적 의사난수(선형 합동). 시나리오 2 의 편집 위치를 고른다.
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s;
  };
}

// 시나리오 2 — 부하: 다섯 명이 같은 문장을 동시에 고친다. 변환 없이 적용하면 문서가 갈라진다.
function scenario2(ot: boolean): void {
  const { sim, server, cs } = world(ot, "hello world", [30, 45, 60, 75, 90].map((d, i) => ({ site: "ABCDE"[i]!, delay: d })));
  const rnd = lcg(7);
  for (let k = 0; k < 40; k++) {
    const c = cs[k % cs.length]!;
    const t = Math.floor(k / cs.length) * 20;
    const r = rnd() >> 16;
    sim.at(t, () => (r % 3 === 0 ? c.erase(r % 11) : c.type(r % 12, "xyz"[r % 3]!)));
  }
  sim.runAll();
  console.log(`[2] 동시 편집 40건 · ${ot ? "OT 변환" : "변환 없이 그대로 적용"}`);
  report(server, cs);
}

// 시나리오 3 — 장애: C 가 1.5초 동안 끊긴 채 편집하고, 다시 이어지면 밀린 편집이 합쳐진다.
function scenario3(): void {
  console.log("[3] 연결 끊김 — C 가 t=100~1600ms 동안 끊긴 채 세 번 고친다");
  const specs: Spec[] = [{ site: "A", delay: 40 }, { site: "B", delay: 50 }, { site: "C", delay: 70, off: [100, 1600] }];
  const { sim, server, cs } = world(true, "draft", specs);
  const [a, b, c] = cs as [Client, Client, Client];
  sim.at(200, () => a.type(0, ">"));
  sim.at(400, () => b.erase(5));
  sim.at(500, () => c.type(5, "!"));
  sim.at(700, () => c.type(0, "#"));
  sim.at(900, () => c.erase(1));
  sim.at(1000, () => console.log(`  t=1000ms C 화면="${c.doc}" · 서버="${server.doc()}"`));
  sim.runAll();
  report(server, cs);
}

scenario1();
scenario2(false);
scenario2(true);
scenario3();

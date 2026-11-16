// MD-01 동영상 업로드와 인코딩 — 집필 전 확인용 시험 코드(카드 KAN-002.3 S2).
// 분할 업로드와 이어 올리기, 인코딩 작업 그래프(DAG)의 배치, 작업 점유 만료를 사건 순서로 재현한다.
// 인코딩 자체는 하지 않는다. 걸리는 시간만 아래 가정값으로 둔다.

const CHUNK_MB = 8;
const CHUNK_SEC = 2; // 조각 하나를 올리는 데 드는 시간(가정)
const SEGMENT_SEC = 60; // 원본을 자르는 단위
const LEASE_SEC = 300; // 워커가 작업을 잡고 있을 수 있는 시간. 가장 긴 작업(120초)보다 길게 둔다
const RENDS = [{ name: "480p", cost: 0.5 }, { name: "720p", cost: 1.0 }, { name: "1080p", cost: 2.0 }]; // 원본 1초당 워커 초(가정)

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

// 업로드 서버는 받은 조각 번호만 기억한다. 끊긴 클라이언트가 물으면 빠진 번호를 돌려준다.
class UploadServer {
  private got = new Map<number, Set<number>>();
  put(video: number, idx: number): void {
    if (!this.got.has(video)) this.got.set(video, new Set());
    this.got.get(video)!.add(idx);
  }
  missing(video: number, total: number): number[] {
    const have = this.got.get(video) ?? new Set<number>();
    return [...Array(total).keys()].filter((i) => !have.has(i));
  }
}

// 조각을 하나씩 차례로 올린다. lostAt 번째 조각은 연결이 끊겨 사라지고, 10초 뒤 다시 이어 올린다.
function upload(sim: Sim, srv: UploadServer, video: number, sizeMb: number, lostAt: number, resume: boolean,
                done: (sent: number) => void): void {
  const total = Math.ceil(sizeMb / CHUNK_MB);
  let sent = 0;
  let lost = false;
  const sendList = (list: number[]): void => {
    const idx = list[0];
    if (idx === undefined) return done(sent);
    sent++;
    sim.at(sim.t + CHUNK_SEC, () => {
      if (idx === lostAt && !lost) {
        lost = true;
        const retry = resume ? () => srv.missing(video, total) : () => [...Array(total).keys()];
        return sim.at(sim.t + 10, () => sendList(retry()));
      }
      srv.put(video, idx);
      sendList(list.slice(1));
    });
  };
  sendList([...Array(total).keys()]);
}

type Task = { job: number; seg: number; rend: number; pkg: boolean; dur: number; order: number };

// 인코딩 농장. 준비된 작업을 놀고 있는 워커에 주고, 점유가 만료되면 다른 워커에 다시 준다.
class Farm {
  private ready: Task[] = [];
  private idle: number[];
  private doneKeys = new Set<string>();
  private order = 0;
  reports = 0;
  writes = 0;
  stall: { worker: number; from: number; extra: number } | null = null;
  onDone: (t: Task) => void = () => {};
  constructor(private sim: Sim, workers: number, private priority: boolean) {
    this.idle = [...Array(workers).keys()];
  }
  submit(tasks: Omit<Task, "order">[]): void {
    for (const t of tasks) this.ready.push({ ...t, order: this.order++ });
    this.dispatch();
  }
  private key(t: Task): string {
    return `${t.job}/${t.pkg ? "pkg" : t.seg}/${t.rend}`;
  }
  private rank(t: Task): number[] {
    return this.priority ? [t.rend, t.job, t.pkg ? 0 : 1, t.seg] : [t.order];
  }
  private dispatch(): void {
    while (this.idle.length > 0 && this.ready.length > 0) {
      this.ready.sort((a, b) => {
        const ra = this.rank(a);
        const rb = this.rank(b);
        const i = ra.findIndex((v, k) => v !== rb[k]);
        return i < 0 ? 0 : ra[i]! - rb[i]!;
      });
      const task = this.ready.shift()!;
      const worker = this.idle.shift()!;
      const start = this.sim.t;
      const s = this.stall;
      const slow = s !== null && s.worker === worker && start >= s.from;
      if (slow) this.stall = null;
      this.sim.at(start + task.dur + (slow ? s!.extra : 0), () => this.finish(task, worker));
      this.sim.at(start + LEASE_SEC, () => {
        if (!this.doneKeys.has(this.key(task))) this.submit([task]);
      });
    }
  }
  private finish(task: Task, worker: number): void {
    this.reports++;
    if (!this.doneKeys.has(this.key(task))) {
      this.doneKeys.add(this.key(task));
      this.writes++;
      this.onDone(task);
    }
    this.idle.push(worker);
    this.dispatch();
  }
}

type Job = { id: number; arrived: number; uploaded: number; playable: number; complete: number; left: number[]; pkgs: number };

// 업로드가 끝나면 작업 그래프를 만든다. 구간 × 화질마다 인코딩, 화질마다 그 구간을 다 모은 뒤 패키징.
function startJob(farm: Farm, job: Job, durationSec: number): void {
  const segs = Math.ceil(durationSec / SEGMENT_SEC);
  job.left = RENDS.map(() => segs);
  const tasks: Omit<Task, "order">[] = [];
  for (let s = 0; s < segs; s++) {
    RENDS.forEach((r, ri) => tasks.push({ job: job.id, seg: s, rend: ri, pkg: false, dur: SEGMENT_SEC * r.cost }));
  }
  farm.submit(tasks);
}

function wire(sim: Sim, farm: Farm, jobs: Job[]): void {
  farm.onDone = (t) => {
    const job = jobs[t.job]!;
    if (t.pkg) {
      if (t.rend === 0) job.playable = sim.t;
      if (++job.pkgs === RENDS.length) job.complete = sim.t;
      return;
    }
    if (--job.left[t.rend]! === 0) farm.submit([{ job: t.job, seg: 0, rend: t.rend, pkg: true, dur: 2 }]);
  };
}

function runMany(count: number, workers: number, priority: boolean): Job[] {
  const sim = new Sim();
  const srv = new UploadServer();
  const farm = new Farm(sim, workers, priority);
  const jobs: Job[] = [...Array(count).keys()].map((i) => ({ id: i, arrived: i * 10, uploaded: 0, playable: 0, complete: 0, left: [], pkgs: 0 }));
  wire(sim, farm, jobs);
  for (const job of jobs) {
    sim.at(job.arrived, () => upload(sim, srv, job.id, 400, -1, true, () => {
      job.uploaded = sim.t;
      startJob(farm, job, 600);
    }));
  }
  sim.runAll();
  return jobs;
}

function scenario1(): void {
  console.log("[1] 기본 흐름 — 10분 · 400MB 영상 하나, 워커 6대, 480p 먼저");
  const [j] = runMany(1, 6, true) as [Job];
  console.log(`  업로드 끝 t=${j.uploaded}s · 480p 재생 가능 t=${j.playable}s · 세 화질 모두 t=${j.complete}s`);
}

function scenario2(): void {
  console.log("[2] 부하 — 영상 8편이 10초 간격으로 올라오고, 워커는 6대");
  for (const priority of [false, true]) {
    const jobs = runMany(8, 6, priority);
    const wait = jobs.map((j) => j.playable - j.uploaded);
    const avg = wait.reduce((a, b) => a + b, 0) / wait.length;
    const last = Math.max(...jobs.map((j) => j.complete));
    console.log(`  ${priority ? "480p 먼저   " : "들어온 차례"} · 업로드 뒤 재생 가능까지 평균 ${avg.toFixed(1)}s · 최대 ${Math.max(...wait)}s · 마지막 완료 t=${last}s`);
  }
}

function scenario3(): void {
  console.log("[3] 장애 — 21번째 조각에서 연결이 끊기고, 워커 2번이 t=150s 에 잡은 작업에서 600초 멈춘다");
  for (const resume of [false, true]) {
    const sim = new Sim();
    upload(sim, new UploadServer(), 0, 400, 20, resume, (sent) => {
      console.log(`  ${resume ? "빠진 조각만 다시" : "처음부터 다시  "} · 보낸 조각 ${sent}개(전체 50개) · 업로드 끝 t=${sim.t}s`);
    });
    sim.runAll();
  }
  const sim = new Sim();
  const farm = new Farm(sim, 6, true);
  farm.stall = { worker: 2, from: 150, extra: 600 };
  const job: Job = { id: 0, arrived: 0, uploaded: 0, playable: 0, complete: 0, left: [], pkgs: 0 };
  wire(sim, farm, [job]);
  sim.at(100, () => startJob(farm, job, 600));
  sim.runAll();
  console.log(`  점유 만료 ${LEASE_SEC}s 뒤 다른 워커가 이어받음 · 완료 보고 ${farm.reports}번 · 저장 ${farm.writes}번(작업 33개) · 세 화질 모두 t=${job.complete}s`);
}

scenario1();
scenario2();
scenario3();

// AI-02 문서 검색 증강 생성(RAG) — 집필 전 확인용 시험 코드(카드 KAN-002.3 S2).
// 하이브리드 검색(키워드 + 벡터) · 순위 합치기 · 권한 필터 · 재순위 · 조각에 제목 붙이기를 결정적 대역으로 재현한다.
// 임베딩 모델 대신 낱말을 개념 번호로 바꾸는 표를 쓰고, 재순위 모델 대신 개념 겹침 비율을 쓴다.

type Chunk = { doc: string; idx: number; title: string; acl: string; text: string };

const DOCS = [
  { id: "D1", title: "API 키 관리", acl: "eng", body: ["API 키는 90일마다 교체한다.", "교체한 키는 배포 전에 시험 환경에서 확인한다."] },
  { id: "D2", title: "보안 사고 대응", acl: "security", body: ["사고를 알게 되면 30분 안에 보안팀에 알린다.", "접속 기록은 1년 동안 보관한다."] },
  { id: "D3", title: "연차 규정", acl: "all", body: ["입사 첫해 연차는 15일이다.", "남은 연차는 다음 해로 넘어가지 않는다."] },
  { id: "D4", title: "회의록 관리", acl: "all", body: ["회의록은 1년 동안 보관한다."] },
  { id: "D5", title: "관리자 계정", acl: "security", body: ["관리자 비밀번호는 30일마다 교체한다.", "비밀번호 교체 주기는 보안팀이 정한다."] },
];

// 임베딩 대역: 낱말 안에 이 글자가 있으면 그 개념으로 센다. 실제 모델이 아는 「뜻이 같은 말」을 흉내 낸다.
const CONCEPTS: [string, string][] = [
  ["키", "secret"], ["비밀", "secret"], ["교체", "rotate"], ["갱신", "rotate"], ["마다", "period"], ["주기", "period"],
  ["간격", "period"], ["얼마", "period"], ["보관", "retain"], ["기록", "log"], ["보안", "security"], ["사고", "incident"],
  ["연차", "leave"], ["회의록", "minutes"],
];

const words = (s: string): string[] => s.split(/[^0-9A-Za-z가-힣]+/).filter((w) => w.length > 0);
const bigrams = (s: string): string[] => words(s).flatMap((w) => (w.length < 2 ? [w] : [...Array(w.length - 1).keys()].map((i) => w.slice(i, i + 2))));

function concepts(s: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const w of words(s)) {
    for (const [k, c] of CONCEPTS) if (w.includes(k)) m.set(c, (m.get(c) ?? 0) + 1);
  }
  return m;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [k, v] of a) dot += v * (b.get(k) ?? 0);
  const norm = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((x, v) => x + v * v, 0));
  return dot === 0 ? 0 : dot / (norm(a) * norm(b));
}

// 키워드 검색: 두 글자 조각(바이그램) 단위의 BM25 를 줄인 꼴.
function keywordScores(q: string, cs: Chunk[]): number[] {
  const docsWith = (g: string) => cs.filter((c) => bigrams(c.text).includes(g)).length;
  return cs.map((c) => {
    const gs = bigrams(c.text);
    return [...new Set(bigrams(q))].reduce((sum, g) => {
      const tf = gs.filter((x) => x === g).length;
      const n = docsWith(g);
      return tf === 0 ? sum : sum + Math.log(1 + (cs.length - n + 0.5) / (n + 0.5)) * (tf / (tf + 1.2));
    }, 0);
  });
}

// 순위 합치기(RRF): 두 목록에서의 순위만으로 점수를 매긴다. 점수 척도가 달라도 섞을 수 있다.
function ranked(scores: number[]): number[] {
  return scores.map((s, i) => ({ s, i })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.i);
}

type Opts = { title: boolean; filter: "pre" | "post"; vector: boolean; k: number };

function search(groups: string[], q: string, o: Opts): string {
  const allowed = (c: Chunk) => c.acl === "all" || groups.includes(c.acl);
  let cs: Chunk[] = DOCS.flatMap((d) => d.body.map((s, idx) => ({ doc: d.id, idx, title: d.title, acl: d.acl, text: o.title ? `${d.title}: ${s}` : s })));
  if (o.filter === "pre") cs = cs.filter(allowed);
  const lists = [ranked(keywordScores(q, cs))];
  if (o.vector) lists.push(ranked(cs.map((c) => cosine(concepts(q), concepts(c.text)))));
  const fused = new Map<number, number>();
  for (const list of lists) list.forEach((ci, r) => fused.set(ci, (fused.get(ci) ?? 0) + 1 / (60 + r + 1)));
  let cand = [...fused.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, o.k).map(([ci]) => cs[ci]!);
  if (o.filter === "post") cand = cand.filter(allowed);
  const qc = concepts(q);
  const rerank = (c: Chunk) => [...qc.keys()].filter((k) => concepts(c.text).has(k)).length / Math.max(1, qc.size);
  const top = cand.map((c) => ({ c, s: rerank(c) })).filter((x) => x.s >= 0.5).sort((a, b) => b.s - a.s).slice(0, 2);
  return top.length === 0 ? "근거 없음" : top.map((x) => `${x.c.doc}#${x.c.idx}(${x.s.toFixed(2)})`).join(" ");
}

const BASE: Opts = { title: true, filter: "pre", vector: true, k: 3 };

function scenario1(): void {
  console.log("[1] 기본 흐름 — 같은 질문도 볼 수 있는 문서에 따라 근거가 다르다");
  const q1 = "비밀 키 교체 주기는?";
  console.log(`  eng 팀 「${q1}」 → ${search(["eng"], q1, BASE)}`);
  console.log(`  security 팀 「${q1}」 → ${search(["security"], q1, BASE)}`);
  console.log(`  eng 팀 · 상위 ${BASE.k}개를 먼저 뽑고 권한으로 거름 → ${search(["eng"], q1, { ...BASE, filter: "post" })}`);
  const q2 = "보안 사고 기록은 얼마나 보관하나";
  console.log(`  security 팀 「${q2}」 · 조각에 제목 안 붙임 → ${search(["security"], q2, { ...BASE, title: false })}`);
  console.log(`  security 팀 「${q2}」 · 조각에 제목 붙임   → ${search(["security"], q2, BASE)}`);
}

// 재순위 서버 하나가 들어온 차례로 처리한다. 후보 하나를 보는 데 2ms(가정).
function scenario2(): void {
  console.log("[2] 부하 — 질문이 10ms 마다 하나씩 2초 동안 200건, 재순위 서버 1대");
  for (const k of [20, 4]) {
    let free = 0;
    const lat: number[] = [];
    for (let i = 0; i < 200; i++) {
      const arrive = i * 10;
      const start = Math.max(arrive, free);
      free = start + k * 2;
      lat.push(free - arrive);
    }
    lat.sort((a, b) => a - b);
    const pct = (p: number) => lat[Math.min(lat.length - 1, Math.floor(lat.length * p))]!;
    console.log(`  재순위 후보 ${String(k).padStart(2)}개 · 응답 지연 중앙값 ${pct(0.5)}ms · 95% ${pct(0.95)}ms · 최대 ${lat[lat.length - 1]}ms`);
  }
  console.log(`  후보 4개로 줄였을 때 eng 팀 「비밀 키 교체 주기는?」 → ${search(["eng"], "비밀 키 교체 주기는?", { ...BASE, k: 4 })}`);
}

function scenario3(): void {
  console.log("[3] 장애 — 벡터 색인이 내려가 키워드 검색만 남는다");
  for (const q of ["API 키 교체", "비밀값 갱신 간격"]) {
    const both = search(["eng"], q, BASE);
    const kwOnly = search(["eng"], q, { ...BASE, vector: false });
    console.log(`  eng 팀 「${q}」 · 둘 다 → ${both} · 키워드만 → ${kwOnly}`);
  }
}

scenario1();
scenario2();
scenario3();

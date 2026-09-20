#!/usr/bin/env bun
/**
 * 도식 lint — **선언한 관계 구조가 그림에 실제로 있는지**를 검사한다.
 *
 * 왜 있나: chrono-v2 이미지 파이프라인을 `ProcessSteps`(직선 5단)로 그렸다가 되돌렸다.
 * 캐시 히트면 CloudFront 에서 곧장 반환되는데 직선 체인은 "항상 다섯 단계를 다 지난다"로
 * 읽힌다. 사실과 다른 그림은 없는 것보다 나쁘다. 원인은 **항목 개수로 패턴을 고른 것**이었다
 * (5개니까 ProcessSteps). 골라야 할 기준은 관계의 구조다.
 *
 *   // @relation branch      ← 조건에 따라 경로가 갈린다
 *   // @relation linear      ← 한 방향으로만 흐른다
 *   // @relation cycle       ← 되돌아온다
 *   // @relation layered     ← 층위/포함 관계
 *   // @relation matrix      ← 두 축의 교차
 *   // @relation compare     ← 두 상태의 대조
 *   // @relation quantity    ← 수치의 크기 비교
 *   // @relation relate      ← 요소 사이의 대응·배선 (대조가 아니다)
 *
 * **왜 재작성했나(2026-08-14).** 이전 판은 `branch`·`cycle`·`matrix` 세 선언에 대해 컴포넌트 4종
 * blocklist 만 봤다. 그래서 ① 18종 중 11종(`compare`·`layered`·`linear`)은 검사를 아예 안 받았고,
 * ② 검사 대상 5종도 카탈로그 템플릿이 아니라 `Canvas`+프리미티브로 직접 저작해 blocklist 에
 * 걸릴 일이 없었다. 그런데 통과 문구는 "관계 구조 선언과 시각화 모델이 일치한다"였다 —
 * 실효 검사는 `@relation` 유무와 리터럴 hex 둘뿐인데 문구가 그보다 크게 말했다.
 *
 * 지금은 다섯 가지를 본다. 통과 문구도 **검사한 것만** 말한다.
 *
 *   A 선언       — `@relation` 이 있고 닫힌 어휘 안인가
 *   B 금지 모델  — 그 관계를 표현할 수 없는 컴포넌트를 쓰지 않았는가 (7종 전부)
 *   C 구조 신호  — 프리미티브로 직접 그렸어도 그 구조가 그림에 나타나는가
 *   D 축 정렬    — 상류가 축 정렬 엣지를 제대로 그리는가 + 옛 우회가 남아 있지 않은가
 *   E 역할 규약  — 노드에 `RoleBox` 를 쓰거나, 면제 근거를 적었는가
 *   F 상류 대조  — 관계↔구조 축 매핑이 `vizTypeRegistry` 와 맞는가
 *   G 유형 조회  — 선언한 `@viz-type` 이 실재하고, 그 유형이 `@relation` 축을 갖는가
 *
 * **검사 범위가 둘로 갈린다(2026-09-01, KAN-026-QM5VAW).** 예전에는 `_` 로 시작하는 파일을 통째로
 * 건너뛰었다 — `_frame.tsx` 가 `@relation` 을 가질 수 없으니 A축에서 죽기 때문이다. 그런데 그림의
 * 실물이 `_domain-model.tsx` 같은 패턴 모듈로 들어가면서 **리터럴 hex 와 손그림 화살촉이 그 안에서
 * 검사를 안 받게 됐다**(실측: 둘 다 넣고 돌려도 통과했다). 그래서 판정을 성질로 가른다.
 *
 *   파일 안에서 완결되는 판정(hex · D-2 · D-3) → `diagrams/**\/*.tsx` **전부**
 *   도식 전용 판정(A · B · C · E · G)           → `_` 로 시작하지 않는 파일만
 *
 * B 는 A 가 낸 `relation` 에 의존하므로 자동으로 도식 전용이다.
 *
 *   bun run scripts/lint-diagrams.ts
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { orthogonalPath } from '@centurio1987/bbangto-ui-visualization';
import {
  VIZ_STRUCTURAL_TRAITS,
  vizTypeRegistry,
  type VizStructuralTrait,
  type VizTypeRegistryEntry,
} from '@centurio1987/bbangto-ui-visualization/type-meta';

const ROOT = new URL('..', import.meta.url).pathname;
// 이 레포는 가이드 한 편이 폴더 하나다 — 도식은 pattern-guide/<계열>/<패턴>/diagrams/ 에 산다.
const DIR = join(ROOT, 'pattern-guide');

const RELATIONS = ['branch', 'linear', 'cycle', 'layered', 'matrix', 'compare', 'quantity', 'relate'] as const;
type Relation = (typeof RELATIONS)[number];

/**
 * ── 우리 어휘 ↔ 상류 구조 축 ─────────────────────────
 *
 * **이 파일에 남은 유일한 사본이 이 여덟 줄이다.** 컴포넌트 이름은 한 개도 적지 않는다 —
 * 권장·금지 목록은 아래에서 `vizTypeRegistry`의 `structuralTraits`로 **파생**한다.
 *
 * 왜 바꿨나: 예전에는 7종 × 권장·금지에 컴포넌트 이름 60여 개를 손으로 옮겨 적었고, 어떤 기계도
 * 그 사본과 정본을 대조하지 않았다(`docs/viz-retrospective.md` §4). 상류 0.3.0이 `structuralTraits`
 * 8종을 신설하면서(`docs/viz-upstream-issues.md` I5) 파생이 가능해졌고, 전환 시점에 재 보니
 * **사본 7종이 전부 어긋나 있었다** — 권장으로 적어 둔 이름 10개가 그 축을 갖고 있지 않았다
 * (`DMNDiagram`·`DataFlowDiagram`이 `branch`, `KanbanBoard`·`Honeycomb`·`BentoGrid`가 `matrix` 등).
 *
 * **`relate` 는 2026-08-16 에 여덟째로 늘렸다.** 상류 축 여덟 중 `relational` 하나만 어느 어휘에도
 * 대응하지 않은 채 남아 있었는데, 그 빈자리가 `compare` 로 흘러들고 있었다 — `docs/viz-plan.md`
 * §9 재판정표를 전수 대조하니 `compare` 8건 중 셋(`chrono-v1/ChronoDomainCoreDiagram` ·
 * `lgsp/ExcelToDataFrameMapping` · `lync-domain/DomainFirstTradeoff`)이 **대조가 아니라 대응**이었다.
 * 대응은 "A가 B에 해당한다"이고 대조는 "A와 B가 다르다"라 논지가 다르다. 어휘에 자리가 없으면
 * 가장 가까운 칸으로 흘러간다 — 개수로 패턴을 고르던 것과 같은 실패다.
 */
const TRAIT: Record<Relation, VizStructuralTrait> = {
  branch: 'branching',
  linear: 'sequential',
  cycle: 'cyclic',
  layered: 'nested',
  matrix: 'cross-axis',
  compare: 'paired',
  quantity: 'quantitative',
  relate: 'relational',
};

const entries = vizTypeRegistry as readonly VizTypeRegistryEntry[];
const traitsOf = (name: string): Set<VizStructuralTrait> => {
  const out = new Set<VizStructuralTrait>();
  for (const e of entries) if (e.exportNames.includes(name)) for (const t of e.meta?.structuralTraits ?? []) out.add(t);
  return out;
};
const inRegistry = (name: string) => entries.some((e) => e.exportNames.includes(name));
const withTrait = (t: VizStructuralTrait) =>
  [...new Set(entries.filter((e) => e.meta?.structuralTraits?.includes(t)).flatMap((e) => e.exportNames))];

/**
 * 기계 축이 담지 못하는 사람 판단만 여기 적는다 — **이유가 없으면 적지 않는다.**
 * 상류는 "구조가 판별축이 아닌 유형은 빈 배열"을 규칙으로 삼으므로, 프리미티브를 조합해
 * 그 구조를 *그릴 수 있는* 유형은 축을 갖지 않을 수 있다. 그 간극만 여기서 메운다.
 */
const EXTRA: Partial<Record<Relation, { name: string; why: string }[]>> = {
  cycle: [
    { name: 'Flowchart', why: '역방향 간선으로 순환을 그릴 수 있다 — 상류는 유형 자체의 축으로는 세지 않는다' },
    { name: 'NetworkGraph', why: '간선 방향이 자유라 되돌아오는 경로를 담는다' },
    { name: 'ChordDiagram', why: '양방향 관계를 호로 잇는다' },
  ],
};

/** 권장 = 레지스트리 파생 + 사유가 적힌 사람 판단. */
const recommendedFor = (r: Relation) => [...withTrait(TRAIT[r]), ...(EXTRA[r] ?? []).map((e) => e.name)];

/**
 * 금지 = **구조 축을 선언해 놓고 그 축이 없는** 유형. 레지스트리에서 파생하므로 목록이 늙지 않는다.
 * 축이 빈 유형(프리미티브 성격)은 대상이 아니다 — 구조를 주장하지 않으므로 왜곡도 하지 않는다.
 *
 * 차트를 도식 안에 **부속으로** 넣는 것은 정당하다. 그때는 파일 상단에
 * `// @model-exempt <Component> — <이유>` 로 근거를 남기면 통과한다. 이유 없는 면제는 없다.
 */
function forbiddenFor(r: Relation, name: string): boolean {
  const t = traitsOf(name);
  return t.size > 0 && !t.has(TRAIT[r]);
}

/**
 * `signals` 는 **프리미티브 직접 저작**을 위한 것이다. 이 저장소 도식 18종 중 17종이
 * 카탈로그 템플릿을 쓰지 않고 `Canvas`+`Node`/`Edge`/`RoleBox`/`Panel` 로 직접 그린다.
 * 템플릿 이름만 보는 검사는 그 17종에 대해 아무 일도 하지 않으므로, "그 구조가 그림에
 * 나타나는 최소 흔적"을 함께 본다. 하한선이지 정밀 판정이 아니다 —
 * **틀린 그림을 다 잡지는 못하고, 선언만 하고 그리지 않은 것을 잡는다.**
 */
const SIGNALS: Record<Relation, { label: string; re: RegExp }[]> = {
  branch: [
    // 역할은 JSX 속성(`role="decision"`)으로도, 데이터 배열(`role: 'decision'`)로도 온다 — 둘 다 본다.
    { label: 'decision 역할 노드', re: /role[=:]\s*\{?['"]decision/ },
    { label: '엣지', re: /<Edge[\s/]/ },
  ],
  linear: [{ label: '순서 표시(엣지·스텝)', re: /<(Edge|StepConnector|ProcessSteps|Step)[\s/]/ }],
  cycle: [
    { label: '순환 모델', re: /<Cycle[\s/]/ },
    { label: '되돌아오는 경로(waypoints)', re: /waypoints=/ },
  ],
  layered: [
    { label: '경계', re: /<(Frame|Boundary)[\s/]|fill="none"\s+stroke=/ },
    { label: 'container 역할 노드', re: /role[=:]\s*\{?['"]container/ },
    // 패턴을 쓰면 `<Frame` 이 도식 파일에 안 남는다 — 경계는 spec 필드로 선언된다.
    { label: '경계 선언(groups:)', re: /groups:\s*\[/ },
  ],
  matrix: [
    { label: '격자 셀', re: /<Cell[\s/]/ },
    // 두 축의 교차는 축마다 한 번씩, 즉 반복이 겹쳐야 나온다. 한 겹뿐이면 교차가 아니라 대응이다.
    { label: '2중 이상 반복', re: /\.map\([\s\S]*?\.map\(/ },
  ],
  compare: [{ label: '대조 패널', re: /<(Panel|Comparison|VsDivider)[\s/]/ }],
  // 대응은 **이어져 있어야** 보인다. 두 편을 나란히 놓기만 하면 그것은 대조로 읽힌다 —
  // 무엇이 무엇에 걸리는지 선이 말해 주지 않으면 `compare` 와 구별되지 않는다.
  relate: [
    { label: '대응선(Edge)', re: /<Edge[\s/]/ },
    // 같은 이유로 관계도 spec 필드로 온다. C 는 `viaTemplate || hit.length` 의 OR 라
    // 신호를 더하는 것은 느슨해지기만 하고 기존 판정을 죽이지 않는다.
    { label: '관계 선언(relations:)', re: /relations:\s*\[/ },
  ],
  quantity: [
    {
      label: '수치 모델',
      re: /<(BarChart|StackedBarChart|LineChart|AreaChart|PieChart|Histogram|Boxplot|DotPlot|Statistics|RadialGauge|Treemap|WaterfallChart|ProportionBlock|StatNumber|StatCard)[\s/]/,
    },
  ],
};

const used = (src: string, name: string) => new RegExp(`<${name}[\\s/>]`).test(src);

/** 파일이 실제로 쓴 레지스트리 유형들. 프리미티브·우리 컴포넌트는 여기 걸리지 않는다. */
function registryComponentsUsed(body: string): string[] {
  const names = new Set<string>();
  for (const m of body.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)) if (inRegistry(m[1])) names.add(m[1]);
  return [...names];
}

/** `// @model-exempt <Component> — <이유>` 로 면제된 것들. 이유가 비면 면제로 치지 않는다. */
function modelExempt(src: string): Set<string> {
  const out = new Set<string>();
  for (const m of src.matchAll(/@model-exempt\s+([A-Za-z0-9]+)\s*[—-]\s*(\S.*)$/gm)) out.add(m[1]);
  return out;
}

/**
 * 상류 계약 — **축 정렬 엣지가 길이 0 종단을 만들지 않는가.**
 *
 * 0.2.0 의 `orthogonalPath` 는 `from.x === to.x` 이면 마지막 세그먼트를 길이 0 으로 만들었고,
 * `orient="auto"` 마커가 방향을 잃어 화살촉이 90° 틀어졌다(`docs/viz-upstream-issues.md` P1).
 * 0.3.0 이 축 정렬을 `straightPath` 로 위임해 고쳤으므로 이 저장소의 우회
 * (세로 엣지 19곳의 `routing="straight"`)는 걷어냈다.
 *
 * 걷어낸 우회는 **상류가 되돌아가면 조용히 되살아난다** — 다운그레이드도, 재회귀도 여기서 죽는다.
 * 순수 함수를 그대로 불러 실측하므로 브라우저도 렌더도 필요 없다.
 */
function upstreamAxisContract(): string[] {
  const bad: string[] = [];
  const cases: [string, { x: number; y: number }, { x: number; y: number }][] = [
    ['세로(from.x === to.x)', { x: 100, y: 40 }, { x: 100, y: 160 }],
    ['가로(from.y === to.y)', { x: 40, y: 100 }, { x: 160, y: 100 }],
  ];
  for (const [label, from, to] of cases) {
    const d = orthogonalPath(from, to);
    const pts = [...d.matchAll(/[MLQC]([^MLQCZ]*)/g)]
      .map((m) => (m[1].trim().match(/-?\d*\.?\d+/g) ?? []).map(Number))
      .filter((n) => n.length >= 2)
      .map((n) => [n[n.length - 2], n[n.length - 1]] as const);
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    if (!last || !prev || Math.hypot(last[0] - prev[0], last[1] - prev[1]) < 0.5) {
      bad.push(`${label} → d="${d}"`);
    }
  }
  return bad;
}

/**
 * 걷어낸 우회의 잔재를 잡는다 — 축 정렬 엣지의 `routing="straight"` 명시.
 *
 * 상류가 고친 뒤로는 축 정렬에서 `orthogonal` 과 `straight` 가 **같은 `d`** 를 낸다. 남겨 두면
 * 다음 저작자가 "세로 엣지에는 routing 을 붙여야 한다"는 없는 규칙을 복제한다.
 * 좌표가 상수가 아니라 식이므로 **표현식 문자열이 같은지**로 축 정렬을 판정한다 —
 * `x: c.x + c.w / 2` 대 `x: c.x + c.w / 2` 처럼 같은 식이면 같은 x 다.
 * `waypoints` 가 있으면 `buildPath` 가 직교 경로를 타지 않으므로 대상이 아니다.
 */
function axisAlignedWithRedundantRouting(src: string): string[] {
  const bad: string[] = [];
  for (const m of src.matchAll(/<Edge\b[\s\S]*?\/>/g)) {
    const tag = m[0];
    if (!/routing="straight"/.test(tag) || /waypoints=/.test(tag)) continue;
    const norm = (s: string) => s.replace(/\s+/g, '');
    const axis = (key: 'x' | 'y') => {
      const from = tag.match(new RegExp(`from=\\{\\{[^}]*?\\b${key}:\\s*([^,}]+)`));
      const to = tag.match(new RegExp(`to=\\{\\{[^}]*?\\b${key}:\\s*([^,}]+)`));
      return from && to && norm(from[1]) === norm(to[1]);
    };
    if (axis('x') || axis('y')) bad.push(tag.replace(/\s+/g, ' ').slice(0, 110));
  }
  return bad;
}

/**
 * 손그림 화살촉 — **맨 SVG 삼각형으로 그린 방향 표식**을 잡는다.
 *
 * 왜 있나: KAN-020 이 화살촉 결함을 고치고 게이트를 둘 세웠는데(lint D · render-core 기하 가드),
 * 둘 다 `Edge` 로 그린 것만 본다 — lint 는 `<Edge` 를 훑고 가드는 `path[data-bbangto-viz-edge]`
 * 를 센다. 그런데 도식 6종이 연결선을 `<line>` + 삼각형 `<path>` 로 직접 그리고 있었다.
 * **검사받는다고 적힌 범위가 실제보다 넓었다.** 화살촉은 방향을 주장하는 표식이므로 규약이
 * 정한 마커로만 그린다 — 방향이 없어도 되는 구조선은 `markerEnd="none"` 이 있다.
 *
 * 판정은 형태로 한다: 꼭짓점 셋(`M` + `L` 둘)을 `Z` 로 닫은 path 가 화살촉이다.
 * 구획선·눈금 같은 열린 선은 걸리지 않는다.
 */
function handDrawnArrowheads(src: string): string[] {
  const bad: string[] = [];
  for (const m of src.matchAll(/<path\b[\s\S]*?\/>/g)) {
    const tag = m[0];
    const d = tag.match(/\bd=\{`([^`]*)`\}/) ?? tag.match(/\bd="([^"]*)"/);
    if (!d) continue;
    const verts = (d[1].match(/[ML]/g) ?? []).length;
    if (verts === 3 && /Z\s*$/.test(d[1].trim())) bad.push(tag.replace(/\s+/g, ' ').slice(0, 110));
  }
  return bad;
}

/**
 * G 유형 조회 — **선언한 `@viz-type` 이 카탈로그에 실재하고, `@relation` 축을 갖는가.**
 *
 * 왜 있나: `.claude/rules/40-develop.md` §3.4 는 도식을 그리기 전에 `selectVizTypes` 로 카탈로그에
 * **물어보라**고 명령한다("목록을 뒤지지 말고 물어본다"). 그런데 그 조회 결과를 적을 자리가 없어서
 * **건너뛰어도 아무도 몰랐다** — KAN-026 의 플랜 세 판이 연달아 그렇게 흘렀다. `@relation` 이
 * *무엇을 주장하는가*라면 `@viz-type` 은 *카탈로그에 물어본 결과*다.
 *
 * **선언이 없으면 넘어간다.** 기존 18종에 `@viz-type` 이 0건이라 소급하면 전부 죽는다 — 소급은
 * 별도 카드로 분기한다. 선언한 파일만 이 축을 받는다.
 *
 * **`structuralTraits` 가 빈 유형은 축 판정에서 뺀다.** B축이 `forbiddenFor` 에서 `t.size > 0 &&` 로
 * 같은 예외를 두고 있다 — 한 파일에서 한 축은 봐주고 다른 축은 죽이면 규약이 아니라 우연이 된다.
 * 상류 규칙이 "구조가 판별축이 아닌 유형은 빈 배열"이므로 그 유형은 구조를 주장하지 않는다.
 *
 * **판정은 「전부」가 아니라 「적어도 하나」다.** 한 그림이 유형 둘을 겹쳐 쓰는 것이 정상이기
 * 때문이다 — 도메인 모델 둘을 나란히 놓고 대조하는 그림은 **VT-602 Comparison**(`paired`)이 틀이고
 * **VT-101 UML Class Diagram**(`nested`·`relational`)이 내용물이다. 전부를 요구하면 그 정상 조합이
 * 죽고, 저작자는 축이 맞는 하나만 적게 된다 — 그러면 선언이 사실보다 좁아진다.
 * 하나도 축을 안 가지면 그때가 진짜 어긋남이다(예: `@relation compare` 에 VT-101 하나만).
 */
function vizTypeAxis(src: string, relation: Relation): { declared: string[]; problems: string[] } {
  const declared = [...src.matchAll(/@viz-type\s+(VT-\d+)/g)].map((m) => m[1]);
  const problems: string[] = [];
  const withTraits: { id: string; name: string; traits: string[] }[] = [];
  for (const id of declared) {
    const e = entries.find((x) => x.id === id);
    if (!e) {
      problems.push(`@viz-type ${id} 는 vizTypeRegistry 에 없는 id 다(등록 ${entries.length}종).`);
      continue;
    }
    const traits = e.meta?.structuralTraits ?? [];
    if (traits.length) withTraits.push({ id, name: e.name, traits: [...traits] });
  }
  if (withTraits.length && !withTraits.some((e) => e.traits.includes(TRAIT[relation]))) {
    problems.push(
      `선언한 유형 중 '${TRAIT[relation]}' 축을 가진 것이 하나도 없다 — @relation ${relation} 과 어긋난다.\n` +
        withTraits.map((e) => `      ${e.id}(${e.name}) 의 축: ${e.traits.join(' · ')}`).join('\n'),
    );
  }
  return { declared, problems };
}

/**
 * 상류 대조 — 이 파일에 남은 **사람이 적은 것**이 정본과 어긋나지 않는가.
 *
 * 컴포넌트 목록은 파생이라 늙지 않지만, 관계↔축 매핑 일곱 줄과 `EXTRA` 는 사람이 적었다.
 * 그 둘만 여기서 대조한다 — 대조가 있으면 드리프트가 조용히 지나가지 못한다
 * (`docs/viz-retrospective.md` §4 의 처방).
 */
function upstreamMappingDrift(): string[] {
  const bad: string[] = [];
  for (const r of RELATIONS) {
    const t = TRAIT[r];
    if (!(VIZ_STRUCTURAL_TRAITS as readonly string[]).includes(t)) {
      bad.push(`@relation ${r} → '${t}' 는 상류 구조 축이 아니다. 허용: ${VIZ_STRUCTURAL_TRAITS.join(' | ')}`);
      continue;
    }
    if (!withTrait(t).length) bad.push(`@relation ${r} → '${t}' 를 가진 유형이 레지스트리에 하나도 없다`);
    for (const e of EXTRA[r] ?? []) {
      if (!inRegistry(e.name)) bad.push(`@relation ${r} EXTRA '${e.name}' 는 레지스트리에 없는 이름이다`);
      else if (traitsOf(e.name).has(t)) bad.push(`@relation ${r} EXTRA '${e.name}' 는 이미 '${t}' 를 갖는다 — 파생이 덮으므로 지워라`);
    }
  }
  return bad;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/** `diagrams/**` 의 모든 `.tsx`. 파일 안에서 완결되는 판정(hex·D-2·D-3)이 여기 전부에 걸린다. */
const allFiles = (await walk(DIR)).sort();
/** 그중 도식 — `_` 로 시작하지 않는 것. A·B·C·E·G 는 여기만 받는다. */
const files = allFiles.filter((f) => !f.split('/').pop()!.startsWith('_'));
const modules = allFiles.filter((f) => !files.includes(f));
const problems: string[] = [];
const stat = { 선언: 0, 금지모델: 0, 구조신호: 0, 축정렬엣지: 0, 역할규약: 0, 유형선언: 0 };

// ── F 상류 대조 (사람이 적은 것만 — 패키지 단위로 한 번) ──
const mappingDrift = upstreamMappingDrift();
if (mappingDrift.length) {
  problems.push(
    `.claude/rules/40-develop.md §3.4 ↔ vizTypeRegistry\n` +
      `    관계↔구조 축 매핑이 정본과 어긋난다.\n` +
      mappingDrift.map((t) => `      ${t}`).join('\n'),
  );
}

// ── D-1 상류 계약 (파일 단위가 아니라 패키지 단위로 한 번) ──
const contractBroken = upstreamAxisContract();
if (contractBroken.length) {
  problems.push(
    `@centurio1987/bbangto-ui-visualization\n` +
      `    축 정렬 엣지가 길이 0 종단을 만든다 — 화살촉이 90° 틀어진다(docs/viz-upstream-issues.md P1).\n` +
      `    0.3.0 에서 고쳐진 결함이다. 패키지가 내려갔거나 회귀했다.\n` +
      contractBroken.map((t) => `      ${t}`).join('\n'),
  );
}

/**
 * **파일 안에서 완결되는 판정** — D-2 · D-3 · 리터럴 hex.
 *
 * 셋 다 `@relation` 을 안 보고 그 파일 안의 코드만 본다. 그래서 도식이든 패턴 모듈이든 똑같이
 * 걸려야 한다 — 그림의 실물이 `_domain-model.tsx` 로 들어가면서 이 셋이 통째로 새던 자리다.
 */
function fileCompleteProblems(rel: string, body: string): { problems: string[]; clean: boolean } {
  const out: string[] = [];

  // ── D-2 걷어낸 우회의 잔재 ────────────────────────
  const axis = axisAlignedWithRedundantRouting(body);
  if (axis.length) {
    out.push(
      `${rel}\n    축 정렬 엣지 ${axis.length}건에 routing="straight" 가 남아 있다 — 상류 0.3.0 이 P1 을\n` +
        `    고쳐 기본 orthogonal 과 같은 d 를 낸다(docs/viz-upstream-issues.md P1). 명시를 지워라.\n` +
        axis.map((t) => `      ${t}`).join('\n'),
    );
  }

  // ── D-3 손그림 화살촉 ─────────────────────────────
  const hand = handDrawnArrowheads(body);
  if (hand.length) {
    out.push(
      `${rel}\n    화살촉 ${hand.length}건을 맨 SVG 삼각형으로 그렸다 — 방향을 주장하는 표식인데\n` +
        `    두 게이트가 다 비켜 간다. lint D 는 <Edge 만 훑고, render-core 의 기하 가드는\n` +
        `    path[data-bbangto-viz-edge] 만 센다. Edge 로 그려라(화살촉이 필요 없으면 markerEnd="none").\n` +
        hand.map((t) => `      ${t}`).join('\n'),
    );
  }

  // ── 색은 토큰에서만 ───────────────────────────────
  const hex = body.match(/(['"`])#[0-9A-Fa-f]{6}\1/g);
  if (hex) out.push(`${rel}\n    리터럴 hex ${hex.join(', ')} — 색은 #style-guide 토큰에서만 온다.`);

  return { problems: out, clean: !axis.length && !hand.length };
}

/** 주석 안의 컴포넌트 이름(설명·판정 근거)이 사용으로 잡히지 않게 본문만 본다. */
const bodyOf = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

// ── 패턴 모듈 — 파일 완결 판정만 받는다 ──────────────
for (const file of modules) {
  const { problems: p } = fileCompleteProblems(relative(ROOT, file), bodyOf(await readFile(file, 'utf-8')));
  problems.push(...p);
}

for (const file of files) {
  const src = await readFile(file, 'utf-8');
  const rel = relative(ROOT, file);
  const body = bodyOf(src);

  const fc = fileCompleteProblems(rel, body);
  problems.push(...fc.problems);
  if (fc.clean) stat.축정렬엣지++;

  // ── A 선언 ────────────────────────────────────────
  const m = src.match(/@relation\s+(\w+)/);
  if (!m) {
    problems.push(`${rel}\n    @relation 선언이 없다. 위 목록에서 관계 구조를 골라 상단 주석에 적어라.`);
    continue;
  }
  const relation = m[1] as Relation;
  if (!RELATIONS.includes(relation)) {
    problems.push(`${rel}\n    @relation ${relation} 은 없는 값이다. 허용: ${RELATIONS.join(' | ')}`);
    continue;
  }
  stat.선언++;
  const recommended = recommendedFor(relation);
  const signals = SIGNALS[relation];

  // ── B 금지 모델 ───────────────────────────────────
  // 목록이 아니라 레지스트리에서 판정한다 — 사본이 없으므로 늙지 않는다.
  const exemptModels = modelExempt(src);
  const banned = registryComponentsUsed(body).filter((c) => forbiddenFor(relation, c) && !exemptModels.has(c));
  if (banned.length) {
    problems.push(
      `${rel}\n    @relation ${relation} 인데 ${banned.join(', ')} 를 썼다 — 이 유형들은 구조 축을 선언해\n` +
        `    두고 '${TRAIT[relation]}' 를 갖고 있지 않다(레지스트리 실측). 그 관계가 그림에서 접힌다.\n` +
        `    이 관계에 맞는 것: ${recommended.slice(0, 6).join(', ')} …\n` +
        `    부속으로 넣은 것이라면 파일 상단에 '// @model-exempt ${banned[0]} — <이유>' 로 근거를 남겨라.`,
    );
  } else stat.금지모델++;

  // ── C 구조 신호 ───────────────────────────────────
  const viaTemplate = recommended.some((c) => used(body, c));
  const hit = signals.filter((s) => s.re.test(body)).map((s) => s.label);
  if (viaTemplate || hit.length) stat.구조신호++;
  else {
    problems.push(
      `${rel}\n    @relation ${relation} 인데 그 구조의 흔적이 그림에 없다 —` +
        ` 권장 컴포넌트도, ${signals.map((s) => s.label).join(' / ')} 도 쓰이지 않았다.\n` +
        `    선언을 바꾸거나(그림이 맞다면) 그림을 고쳐라(선언이 맞다면).`,
    );
  }

  // ── E 역할 규약 ───────────────────────────────────
  const exempt = /역할 규약: \*\*면제/.test(src);
  const bareNode = /<(Rz)?Node[\s/]/.test(body);
  const roleBox = /<RoleBox[\s/]/.test(body);
  if (bareNode && !roleBox && !exempt) {
    problems.push(
      `${rel}\n    노드를 맨몸 Node 로 그리고 역할을 인코딩하지 않았다 — RoleBox 를 쓰거나,\n` +
        `    면제라면 상단에 "역할 규약: **면제 ①/②/③**" 과 근거를 적어라(diagrams/_frame.tsx §역할 규약).`,
    );
  } else if (bareNode && roleBox) {
    problems.push(
      `${rel}\n    RoleBox 와 맨몸 Node 가 섞여 있다 — 같은 그림 안에서 어떤 칸은 역할을 말하고\n` +
        `    어떤 칸은 말하지 않으면 형태가 신호가 아니라 잡음이 된다.`,
    );
  } else stat.역할규약++;

  // ── G 유형 조회 ───────────────────────────────────
  const vt = vizTypeAxis(src, relation);
  if (vt.problems.length) {
    problems.push(
      `${rel}\n` + vt.problems.map((t) => `    ${t}`).join('\n') +
        `\n    유형은 selectVizTypes 로 물어보고 그 결과를 적는다(.claude/rules/40-develop.md §3.4).`,
    );
  } else if (vt.declared.length) stat.유형선언++;
}

const n = files.length;
console.log(`도식 ${n}개 + 패턴 모듈 ${modules.length}개 검사`);
if (problems.length) {
  console.error(`\n위반 ${problems.length}건\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  process.exit(1);
}
console.log(
  `  A 선언 ${stat.선언}/${n} · B 금지 모델 ${stat.금지모델}/${n} · C 구조 신호 ${stat.구조신호}/${n} · ` +
    `D 엣지 ${stat.축정렬엣지}/${n}(상류 계약 통과 · 손그림 화살촉 0건) · E 역할 규약 ${stat.역할규약}/${n} · ` +
    `F 상류 대조 통과 · G 유형 조회 ${stat.유형선언}/${n} 선언 · 리터럴 hex 0건(${allFiles.length}개 전부)`,
);
console.log('  검사하지 않는 것: 레이아웃 겹침 · 색 대비 · 화살촉 실측');
console.log('    → render-viz.ts 페인트·기하 가드, RoleBox 의 콘텐츠 박스 넘침 가드,');
console.log('      scripts/audit-rolebox.ts(칸 여백 균일성), design/style-guide/audit.test.ts 가 맡는다.');

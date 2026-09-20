/**
 * `resume-cream-ink-viz-01` — 이 프로젝트의 **시각화** style guide.
 *
 * `resume.ui.ts`와 같은 `tokens.ts`에서 파생하므로 도식과 본문이 하나의 시각 언어로 읽힌다.
 * bbangto-ui의 headless viz 컴포넌트(templates 65종 · patterns 23종)가 이 foundation을
 * CSS 변수로 받아 실제 paint를 얻는다.
 *
 * 색은 전부 `tokens.ts`에서 온다 — 이 파일에 리터럴 hex를 쓰지 마라.
 */

import {
  ClassBox,
  EdgeLabel,
  EntityTable,
  Node,
  Tag,
  hasNonAsciiScript,
  vvar,
  type ClassBoxProps,
  type EntityAttribute,
  type EdgeLabelProps,
  type EntityTableProps,
  type NodeProps,
  type TagProps,
  type VisualizationStyleGuide,
  type VizWrapperComponents,
} from '@centurio1987/bbangto-ui-visualization';
import { makeVizColorway, makeVizShowcase } from '@centurio1987/bbangto-ui-visualization-style-guide-catalog';
import type { VisualizationFoundation, VizFoundationPreset, VizNodeSemanticStyle } from '@centurio1987/bbangto-ui-tokens';
import { textWidth } from './text-metrics';
import * as T from './tokens';

/** 하드 오프셋 섀도의 이동량(px). UI의 `HARD(4)`와 같은 값이다. */
const SHADOW_OFFSET = 4;

/** 노드 시맨틱 하나를 만든다. 키라인·라벨은 언제나 순잉크다. */
const node = (fill: string, glyph: string, dashed = false): VizNodeSemanticStyle => ({
  fill,
  keyline: T.INK,
  keylineWidth: T.BORDER_W,
  tagColor: T.INK,
  ...(dashed ? { dashed: true } : {}),
  glyph,
});

/* ── foundation (print = 정본) ────────────────────────── */

const foundations: VisualizationFoundation = {
  name: 'resume-cream-ink-viz-01',
  canvas: { bg: T.CANVAS, grid: T.KHAKI_LINE, gridUnit: 8 },
  // p1..p4 = 의미 어휘(problem/solution/warn/info 순), p5..p8 = 구조 어휘.
  palette: {
    p1: T.PINK,
    p2: T.SAGE,
    p3: T.YELLOW,
    p4: T.BLUE,
    p5: T.SURFACE,
    p6: T.SURFACE_DEEP,
    p7: T.KHAKI_LINE,
    p8: T.INK,
  },
  shape: { fill: T.SURFACE, stroke: T.INK, strokeWidth: T.BORDER_W },
  node: {
    person: node(T.YELLOW, 'user'), //          사람/이해관계자 — 가장 눈에 띄는 액센트
    external: node(T.SURFACE_DEEP, 'arrowOut', true), // 소유 밖 — 색이 아니라 대시로 인코딩
    container: node(T.BLUE, 'stackedRect'), //  배포 단위/서비스 = 구조(info)
    database: node(T.SAGE, 'cylinder'), //      영속 저장 = 안정(solution)
    queue: node(T.PINK, 'bars'), //             비동기 버퍼 = 부하 발생 지점(problem)
    decision: node(T.KHAKI_LINE, 'diamond'), // 분기점 = 중립. 5번째 액센트 대신 라인색 승격
    process: node(T.SURFACE, 'process'), //     기본 실행 단위 = 카드 표면 재사용
  },
  // 직교 라우팅 + 코너 반경 0 — 지면의 하드코너 조형을 도식에서도 유지한다.
  edge: {
    stroke: T.INK,
    width: T.BORDER_W,
    dashPattern: '',
    cornerRadius: 0,
    marker: { size: 8, arrow: T.INK, diamond: T.INK, circle: T.INK, cross: T.INK },
  },
  c4: {
    l1: { borderWidth: 2, bgTint: 'rgba(28,27,23,0.07)', labelColor: T.INK },
    l2: { borderWidth: 2, bgTint: 'rgba(28,27,23,0.04)', labelColor: T.INK },
    l3: { borderWidth: 1.5, bgTint: 'transparent', labelColor: T.INK },
  },
  boundary: { stroke: T.INK, width: T.BORDER_W, dashPattern: '6 4', radius: 0, labelColor: T.INK },
  typography: {
    titleFont: T.FONT_SANS,
    monoFont: T.FONT_MONO,
    titleWeight: 700,
    sizes: { title: '13px', label: '12px', tag: '11px', mono: '11.5px' },
  },
  iconStyle: 'line',
  spacing: { nodePad: 12, laneGap: 24 },
  // 인쇄 산출물이 목적지다 — 정지가 기본이고, 애니메이션은 애초에 캡처되지 않는다.
  motion: { duration: '0ms', easing: 'linear' },
};

/**
 * 흑백 복사·팩스 대비 안전 변형. 액센트를 명도 차이와 대시로 환원한다.
 * `makeVizColorway`가 조형 토큰 복사를 강제하므로 형태는 print와 동일하다.
 */
const monoFoundations: VisualizationFoundation = makeVizColorway(foundations, {
  name: 'resume-cream-ink-viz-01-mono',
  canvas: { bg: T.MONO.paper, grid: T.MONO.grid },
  ink: T.INK,
  shape: { fill: T.MONO.paper },
  nodeFills: {
    person: T.MONO.paper,
    external: T.MONO.tint,
    container: T.MONO.paper,
    database: T.MONO.tint,
    queue: T.MONO.paper,
    decision: T.MONO.tint,
    process: T.MONO.paper,
  },
  palette: { p1: T.INK, p2: T.INK_MUTED, p3: T.INK_SUBTLE, p4: T.MONO.p4 },
});

/* ── 확장 CSS 변수 ────────────────────────────────────── */

const EXT: Record<string, string> = {
  '--bbangto-viz-ext-shadow-ink': T.INK,
  '--bbangto-viz-ext-problem': T.SEMANTIC.problem.surface,
  '--bbangto-viz-ext-problem-ink': T.SEMANTIC.problem.ink,
  '--bbangto-viz-ext-solution': T.SEMANTIC.solution.surface,
  '--bbangto-viz-ext-solution-ink': T.SEMANTIC.solution.ink,
  '--bbangto-viz-ext-warn': T.SEMANTIC.warn.surface,
  '--bbangto-viz-ext-warn-ink': T.SEMANTIC.warn.ink,
  '--bbangto-viz-ext-info': T.SEMANTIC.info.surface,
  '--bbangto-viz-ext-info-ink': T.SEMANTIC.info.ink,
};

const MONO_EXT: Record<string, string> = { ...EXT, '--bbangto-viz-ext-shadow-ink': T.MONO.shadow };

const foundationPresets: readonly VizFoundationPreset[] = [
  { key: 'print', label: 'Cream × Ink', foundations, extendedFoundations: EXT },
  { key: 'mono', label: 'Mono (copy-safe)', foundations: monoFoundations, extendedFoundations: MONO_EXT },
];

/* ── wrapperComponents — 프로젝트 시그니처 ────────────── */

/**
 * 본 도형 뒤에 잉크 실루엣을 +4/+4 오프셋(블러 0)으로 깐다.
 * 실루엣은 순수 장식이라 `aria-hidden`이고, `id`를 비워 중복 id를 만들지 않는다.
 * 라벨은 실루엣 위가 아니라 본 도형 다음에 그려져 절대 덮이지 않는다.
 */
function ResumeNode({ children, ...rest }: NodeProps) {
  return (
    <>
      <g data-rz-hard-shadow="" aria-hidden="true" transform={`translate(${SHADOW_OFFSET}, ${SHADOW_OFFSET})`}>
        <Node {...rest} id={undefined} fill={vvar('ext', 'shadowInk')} stroke="none" strokeWidth={0} />
      </g>
      <Node {...rest}>{children}</Node>
    </>
  );
}
ResumeNode.displayName = 'ResumeCreamNode';

/** 타입 태그를 mono 대문자로 — 본문 Tag와 같은 문법이라 도식·본문이 한 벌로 읽힌다. */
function ResumeTag({ label, ...rest }: TagProps) {
  return <Tag {...rest} label={label.toUpperCase()} fontFamily={T.FONT_MONO} />;
}
ResumeTag.displayName = 'ResumeCreamTag';

/** 흐름선 라벨에 크림 칩 배경을 깔아 하드 섀도 위에서도 또렷하게 읽히게 한다. */
function ResumeEdgeLabel(props: EdgeLabelProps) {
  return <EdgeLabel bgFill={vvar('canvas', 'bg')} padding={5} {...props} />;
}
ResumeEdgeLabel.displayName = 'ResumeCreamEdgeLabel';

/* ── UML 모델 칸 — 상류 프리미티브에 프로젝트 시그니처를 얹는다 ─────────────────
 *
 * `ClassBox`·`EntityTable` 은 도메인 모델 도식의 칸이다(`diagrams/_frame.tsx` 역할 규약
 * **면제 ④ 모델형**). 상류 템플릿 `ClassDiagram`·`ERDiagram` 을 쓰지 않는 이유는 그것들이
 * 이 wrapper resolver 를 **우회해** 프리미티브를 직접 부르기 때문이다(`dist/index.js:4220`·`:4379`,
 * `docs/viz-upstream-issues.md`). 그래서 도식은 프리미티브를 직접 쓰고 여기를 지난다.
 */

/** 상류 `ClassBox` 의 칸 상수(`dist/index.js:3129-3131`). 높이를 정확값으로 주려면 여기서도 안다. */
const CLASS_HEADER_H = 28;
const CLASS_ROW_H = 16;
const CLASS_PAD = 6;

/** 상류 `EntityTable` 의 칸 상수(`dist/index.js:3312-3314`). */
const ENTITY_HEADER_H = 28;
const ENTITY_ROW_H = 22;
const ENTITY_PAD_X = 8;
/** 속성 이름이 시작하는 x 오프셋 — 키 칸이 있을 때(`:3399`). */
const ENTITY_KEY_W = 36;
/** 좌정렬 이름과 우정렬 타입 사이에 반드시 남겨야 하는 통로. 상류에는 이 개념이 없어 겹친다. */
const ENTITY_COL_GAP = 8;

/**
 * 상류 `resolveLabelFont`(`:103-107`)와 **같은 자리에서** 갈라야 폭 계산과 실제 서체가 어긋나지 않는다.
 * 라틴이면 mono, 아니면 sans 다.
 */
const isMonoLabel = (s: string) => !hasNonAsciiScript(s);

/**
 * `ClassBox` 세 칸의 높이 — 상류 식(`:3151-3154`)의 재현이다.
 *
 * `height` 를 주면 상류가 실제로 쓸 값을, 안 주면 **그 내용이 요구하는 최소 높이**를 낸다.
 * `nameH` 를 `height` 에서 역산하는 것이 상류 구현이라, `height` 가 모자라면 바깥 rect 만 짧아지고
 * 구분선이 칸 밖으로 나간다 — 그래서 패턴이 높이를 정확값으로 줘야 하고 이 함수가 그 값을 낸다.
 */
export function classBoxMetrics(attributes: readonly string[], methods: readonly string[], height?: number) {
  const attrH = Math.max(CLASS_HEADER_H, attributes.length * CLASS_ROW_H + CLASS_PAD * 2);
  const methodH = Math.max(CLASS_HEADER_H, methods.length * CLASS_ROW_H + CLASS_PAD * 2);
  const nameH = Math.max(CLASS_HEADER_H, (height ?? 0) - attrH - methodH);
  return { nameH, attrH, methodH, height: nameH + attrH + methodH };
}

/** `EntityTable` 의 전체 높이 — 상류 `totalH`(`:3333`). 이 컴포넌트는 `height` 를 받지 않는다. */
export const entityTableHeight = (rows: number) => ENTITY_HEADER_H + rows * ENTITY_ROW_H;

/** 폭 가드가 쓰는 「이 줄이 요구하는 최소 폭」. `what` 은 에러 메시지가 지목할 대상이다. */
export interface WidthNeed {
  need: number;
  what: string;
}

function widest(needs: WidthNeed[]): WidthNeed {
  return needs.reduce((a, b) => (b.need > a.need ? b : a), { need: 0, what: '(빈 칸)' });
}

/**
 * `ClassBox` 가 이 내용을 담으려면 필요한 **최소 폭**과 그것을 요구한 줄.
 *
 * 가드와 배치가 **같은 함수**를 봐야 한다 — 갈라지면 패턴이 계산한 폭이 wrapper 가드에 걸려
 * 렌더가 죽거나, 반대로 가드가 통과시킨 폭에서 글자가 keyline 을 뚫는다.
 */
export function classBoxMinWidth(c: {
  name: string;
  stereotype?: string;
  attributes?: readonly string[];
  methods?: readonly string[];
}): WidthNeed {
  return widest([
    // 이름·스테레오타입은 가운데 정렬이라 양쪽에 PAD 씩, 속성·메서드는 x+PAD 좌정렬이다.
    { need: textWidth(c.name, 13, false) + CLASS_PAD * 2, what: `이름 "${c.name}"` },
    ...(c.stereotype
      ? [
          {
            need: textWidth(`«${c.stereotype}»`, 9, isMonoLabel(c.stereotype)) + CLASS_PAD * 2,
            what: `스테레오타입 "${c.stereotype}"`,
          },
        ]
      : []),
    ...[...(c.attributes ?? []), ...(c.methods ?? [])].map((t) => ({
      need: textWidth(t, 10, isMonoLabel(t)) + CLASS_PAD * 2,
      what: `"${t}"`,
    })),
  ]);
}

/** `EntityTable` 최소 폭 — 좌정렬 이름과 우정렬 타입이 겹치지 않을 조건이다. */
export function entityTableMinWidth(t: { name: string; attributes?: readonly EntityAttribute[] }): WidthNeed {
  return widest([
    { need: textWidth(t.name, 13, false) + ENTITY_PAD_X * 2, what: `이름 "${t.name}"` },
    ...(t.attributes ?? []).map((a) => ({
      need:
        (a.key ? ENTITY_KEY_W : ENTITY_PAD_X) +
        textWidth(a.name, 10, isMonoLabel(a.name)) +
        ENTITY_COL_GAP +
        textWidth(a.type, 10, isMonoLabel(a.type)) +
        ENTITY_PAD_X,
      what: `행 "${a.name}: ${a.type}"`,
    })),
  ]);
}

/**
 * 도메인 모델 칸 — 상류 `ClassBox` + 하드 오프셋 섀도 + 폭·높이 가드 + 빈 칸 덮기.
 *
 * 셋을 진다.
 *
 * 1. **하드 오프셋 섀도** — `ResumeNode` 와 같은 +4/+4 잉크 실루엣. 다만 `ResumeNode` 처럼
 *    `{...rest}` 를 그대로 넘길 수 없다. `Node` 는 라벨이 `children` 으로 오지만 `ClassBox` 의
 *    글자는 **props** 로 오고 글자 색이 `vvar("edge","stroke")` 하드코딩(`:3150`)이라
 *    `stroke="none"` 으로도 못 끈다 — 그대로 넘기면 글자가 +4/+4 에 한 벌 더 찍힌다.
 *    그래서 **글자만 비운 props** 를 따로 만든다. 배열은 **개수를 유지하고 문자열만 비운다**
 *    (칸 높이가 개수에서 나오므로 비우면 실루엣이 쪼그라든다).
 * 2. **폭·높이 넘침 가드** — 상류에는 폭 계산도 클리핑도 없어서 긴 라벨이 keyline 을 그냥 뚫는다.
 *    `RoleBox`(`diagrams/_frame.tsx`)와 같은 방식으로 **넘치면 throw** 하고 필요한 최소값을
 *    메시지에 담는다. 조용한 잘림은 이 저장소가 이미 크게 겪은 결함이다(P2).
 * 3. **빈 칸을 덮지 않는다 — 실측으로 뒤집힌 판정이다(2026-09-01, KAN-026-QM5VAW S2).**
 *    상류는 `attributes: []`·`methods: []` 여도 28px 칸을 남기고 구분선을 조건 없이 그린다
 *    (`:3151-3152`·`:3218`·`:3226`). 계획은 그 두 칸을 `children` 슬롯의 사각형으로 덮어
 *    **이름만 있는 한 칸짜리 상자**를 만드는 것이었는데, 덮어도 **상자가 줄지 않는다** —
 *    `nameH = height − attrH − methodH`(`:3153`)라 이름 칸은 아무리 해도 전체 높이를 못 갖고,
 *    바깥 rect 와 keyline 은 `height` 그대로다. 그래서 덮으면 「이름이 위쪽에 몰린 큰 빈 상자」가
 *    되고, 이는 안 덮은 **표준 UML 3분할 칸**(멤버 미명시)보다 나쁘게 읽힌다.
 *    바깥 keyline 까지 캔버스 색으로 지우고 아래 keyline 을 다시 그리는 길은 +4/+4 실루엣이
 *    `height` 만큼 남아 상자 아래로 잉크가 삐져나오므로 쓸 수 없다.
 *    **그래서 3분할을 그대로 둔다.** 멤버가 있다는 것이 원천에 있고 이름만 없을 때는 도식이
 *    UML 생략 표기(`…`)를 칸에 적는다 — 비우는 것보다 사실에 가깝다.
 *    상류 원고(`docs/viz-upstream-issues.md`)의 「칸 억제 옵션이 없다」는 그대로 남는다 —
 *    UML 은 칸 억제를 허용하는데 이 API 에는 그 경로가 없다.
 */
function ResumeClassBox({ children, ...rest }: ClassBoxProps) {
  const { width, height, name, stereotype, attributes = [], methods = [] } = rest;
  const m = classBoxMetrics(attributes, methods, height);

  // 높이 가드 — 상류가 nameH 를 역산하므로(`:3153`) height 가 모자라면 세 칸의 합이 height 를
  // 넘고 구분선이 바깥 rect 밖으로 나간다. 정확값을 요구하는 편이 조용히 깨지는 것보다 낫다.
  if (m.height !== height) {
    throw new Error(
      `ResumeClassBox 높이 부족: name="${name}" height=${height} — 속성 ${attributes.length}개 · ` +
        `메서드 ${methods.length}개면 최소 ${m.height}px 다(nameH ${CLASS_HEADER_H} + attr ${m.attrH} + method ${m.methodH}). ` +
        `classBoxMetrics(attributes, methods).height 를 그대로 넘겨라.`,
    );
  }

  const worst = classBoxMinWidth({ name, stereotype, attributes, methods });
  if (worst.need > width) {
    throw new Error(
      `ResumeClassBox 가로 넘침: name="${name}" width=${width} — ${worst.what} 가 ` +
        `${Math.ceil(worst.need)}px 를 요구한다. width 를 ${Math.ceil(worst.need)} 이상으로 키우거나 글을 줄여라.`,
    );
  }

  const blank = (a: readonly string[]) => a.map(() => '');

  return (
    <>
      <g data-rz-hard-shadow="" aria-hidden="true" transform={`translate(${SHADOW_OFFSET}, ${SHADOW_OFFSET})`}>
        <ClassBox
          {...rest}
          id={undefined}
          name=""
          stereotype={undefined}
          attributes={blank(attributes)}
          methods={blank(methods)}
          fill={vvar('ext', 'shadowInk')}
          stroke="none"
          strokeWidth={0}
        />
      </g>
      <ClassBox {...rest}>{children}</ClassBox>
    </>
  );
}
ResumeClassBox.displayName = 'ResumeCreamClassBox';

/**
 * 영속성 관점의 표 칸 — 상류 `EntityTable` + 섀도 + 겹침 가드.
 *
 * `ClassBox` 와 갈리는 자리는 하나다. `EntityTable` 은 **타입이 붙은 속성**을 좌우로 나눠
 * 그리므로(이름 좌정렬 `:3396` · 타입 우정렬 `:3409`) DB 스키마처럼 **속성이 논지일 때** 쓴다.
 * 대신 스테레오타입 자리가 없어 Aggregate Root 표기를 못 한다 — 도메인 모델 본체는 `ClassBox` 다.
 *
 * 상류에 폭 계산이 없어 이름과 타입이 **말없이 겹친다.** 여기서 통로(`ENTITY_COL_GAP`)를 요구한다.
 */
function ResumeEntityTable({ children, ...rest }: EntityTableProps) {
  const { width, name, attributes = [] } = rest;

  const worst = entityTableMinWidth({ name, attributes });
  if (worst.need > width) {
    throw new Error(
      `ResumeEntityTable 가로 넘침: name="${name}" width=${width} — ${worst.what} 가 ` +
        `${Math.ceil(worst.need)}px 를 요구한다(좌정렬 이름과 우정렬 타입이 겹친다). ` +
        `width 를 ${Math.ceil(worst.need)} 이상으로 키워라.`,
    );
  }

  const shadowInk = vvar('ext', 'shadowInk');
  return (
    <>
      <g data-rz-hard-shadow="" aria-hidden="true" transform={`translate(${SHADOW_OFFSET}, ${SHADOW_OFFSET})`}>
        <EntityTable
          {...rest}
          id={undefined}
          name=""
          attributes={attributes.map(() => ({ name: '', type: '' }))}
          fill={shadowInk}
          headerFill={shadowInk}
          stroke="none"
          strokeWidth={0}
        />
      </g>
      <EntityTable {...rest}>{children}</EntityTable>
    </>
  );
}
ResumeEntityTable.displayName = 'ResumeCreamEntityTable';

const wrapperComponents: VizWrapperComponents = {
  Node: ResumeNode,
  Tag: ResumeTag,
  EdgeLabel: ResumeEdgeLabel,
  ClassBox: ResumeClassBox,
  EntityTable: ResumeEntityTable,
};

const Showcase = makeVizShowcase({ displayName: 'ResumeCreamInkVizShowcase', wrappers: wrapperComponents });

/* ── VisualizationStyleGuide ──────────────────────────── */

export const resumeVizStyleGuide: VisualizationStyleGuide = {
  name: 'resume-cream-ink-viz-01',
  description:
    'Diagram paint mirroring the resume house style — cream canvas, 2px pure-ink keylines, radius 0, ' +
    'hard +4/+4 ink offset shadows, IBM Plex, four pastel accents bound 1:1 to problem/solution/warn/info.',
  foundations,
  extendedFoundations: EXT,
  foundationPresets,
  defaultFoundationKey: 'print',
  wrapperComponents,
  patterns: { ResumeCreamInkVizShowcase: Showcase },

  guidelines: {
    color: {
      summary:
        '노드 kind fill은 구조 어휘, palette p1~p4와 Tag tone·Boundary는 의미 어휘다. ' +
        '한 도식에서 둘을 동시에 쓰면 노드를 process/external 중립으로 낮추고 의미는 Tag로만 표현한다.',
      dos: ['의미(problem/solution/warn/info)는 p1~p4 또는 Tag tone으로', '노드 라벨은 항상 잉크', '색과 형태(glyph)·라벨을 병기'],
      donts: [
        '같은 도식에서 노드 fill과 Tag가 서로 다른 의미로 같은 색을 쓰는 것 금지',
        '5번째 액센트 도입 금지',
        '딥톤을 채움으로 쓰는 것 금지 — 잉크 라벨 대비가 무너진다',
      ],
    },
    surface: {
      summary: '크림 캔버스 + 8px 그리드 + 2px 잉크 키라인 + 하드 오프셋 섀도(+4/+4). 엣지는 직교이고 코너 반경은 0이다.',
      dos: ['경계는 대시(6 4) 잉크 프레임', '엣지는 직교 라우팅'],
      donts: ['둥근 코너·블러 섀도·그라디언트 금지'],
    },
    accessibility: {
      summary: '모든 node.tagColor가 잉크이고 채움 대비 worst-case가 AAA를 넘는다. mono preset은 흑백 복사 폴백이다.',
      dos: ['채움 위 라벨은 잉크 고정', '흑백 출력 가능성이 있으면 mono preset으로 한 번 더 뽑아 확인'],
      donts: ['어두운 채움을 재감사 없이 도입하지 말 것'],
      verifiedBy: ['design/style-guide/audit.ts — 대비 행렬 M1·M6'],
    },
  },

  visualMotif: {
    summary:
      '이력서 하우스 스타일의 도식판 — 크림 캔버스, 2px 순잉크 키라인, radius 0, 본 도형 뒤 +4/+4 하드 잉크 섀도. ' +
      '액센트 4색이 의미에 고정 배정된다.',
    components: {
      Node: {
        description:
          'ResumeNode가 본 도형 뒤에 잉크 실루엣을 +4/+4로 깔고(블러 0, aria-hidden) 그 위에 2px 키라인 도형을 그린다.',
        specs: ['keyline 2px #1C1B17', 'hard shadow +4/+4 (--bbangto-viz-ext-shadow-ink)', 'radius 0'],
      },
      Tag: {
        description: '타입 태그는 IBM Plex Mono 대문자다 — 본문 Tag와 동일 문법이라 도식과 문서가 하나로 읽힌다.',
        specs: ['mono 11px 대문자', '잉크 라벨'],
      },
      EdgeLabel: {
        description: '흐름선 라벨은 크림 칩 배경 위 잉크 텍스트다.',
        specs: ['bgFill = canvas.bg', 'padding 5px'],
      },
      ClassBox: {
        description:
          'ResumeClassBox가 UML 모델 칸에 같은 +4/+4 잉크 실루엣을 깔고, 폭·높이 넘침을 throw로 막는다. ' +
          '멤버가 없는 칸은 표준 UML대로 빈 3분할로 두고, 멤버가 있으나 이름을 모르면 도식이 생략 표기(…)를 적는다.',
        specs: [
          'keyline 2px #1C1B17',
          'hard shadow +4/+4 — 글자를 비운 실루엣 props (글자가 props로 와 두 번 찍힌다)',
          'height = nameH + attrH + methodH 정확값 (classBoxMetrics)',
          '빈 속성·메서드 칸은 표준 UML 3분할 그대로 둔다 — 덮어도 상자가 안 줄어 더 나쁘게 읽힌다',
        ],
      },
      EntityTable: {
        description:
          'ResumeEntityTable은 속성이 논지일 때(영속성 관점) 쓰는 표 칸이다. 같은 하드 섀도를 얹고, ' +
          '좌정렬 이름과 우정렬 타입이 말없이 겹치는 것을 통로 요구로 막는다.',
        specs: ['keyline 1.5px #1C1B17', 'hard shadow +4/+4 (header까지 실루엣)', '이름↔타입 최소 통로 8px'],
      },
    },
    example: Showcase,
  },

  meta: {
    displayName: 'Resume_Cream_Ink_Viz_01',
    family: 'viz-neobrutalist',
    summary: '크림 캔버스 + 2px 순잉크 키라인 + 하드 오프셋 섀도의 인쇄 우선 도식 — 이력서 문서 스타일과 1:1 정합.',
    tags: ['light', 'raw', 'sharp', 'high-contrast', 'pastel', 'static'],
    mood: { formality: 4, energy: 3, warmth: 4, density: 3, ornament: 2 },
    characteristics: {
      cornerRadius: 'sharp',
      borderWeight: 'bold',
      shadow: 'hard',
      density: 'balanced',
      motion: 'still',
      colorScheme: 'light',
      contrast: 'high',
    },
    domains: ['portfolio', 'editorial', 'docs'],
    useWhen: [
      '이력서·포트폴리오 PDF/PPT에 들어갈 아키텍처·프로세스·비교 도식에 쓴다.',
      '흑백 복사 가능성이 있어 mono colorway 폴백이 필요할 때 쓴다.',
    ],
    avoidWhen: ['다크 배경 슬라이드에는 쓰지 마라.', '데이터 밀도가 극단적으로 높은 대시보드에는 쓰지 마라.'],
    accessibility: { contrastIntent: 'aaa', colorblindConsidered: true, motionHeavy: false, darkFirst: false },
  },
};

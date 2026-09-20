/**
 * 도식 공용 chrome — 표제·콜아웃·패널을 한 벌로 둔다.
 *
 * 전부 **SVG 안**에서 그린다. HTML 로 표제를 얹으면 캡처 시 HTML 텍스트는 고정 px 이고
 * SVG 만 스케일돼 같은 그림 안에서 배율이 어긋난다.
 *
 * 색·타이포는 `#style-guide` 토큰에서만 온다 — 이 파일에도 도식에도 리터럴 hex 를 쓰지 않는다.
 */

import {
  Boundary,
  Node,
  contentBox,
  hasNonAsciiScript,
  useVizFoundation,
  useVizWrapperComponent,
  type BBox,
  type BoundaryLabelPlacement,
  type NodeProps,
  type NodeShape,
} from '@centurio1987/bbangto-ui-visualization';
import type { ReactNode } from 'react';
import * as T from '../style-guide/tokens';
import { textWidth } from '../style-guide/text-metrics';

/** 표제가 차지하는 세로 공간. 도식은 이 아래부터 그린다. */
export const HEADER_H = 78;
/** 좌우 기본 여백. */
export const GUTTER = 24;

export function useInk() {
  return useVizFoundation().node.process.tagColor;
}

/** 도식 표제 — mono 대문자 eyebrow + sans bold 제목. */
export function DiagramHeader({ eyebrow, title, x = GUTTER }: { eyebrow: string; title: string; x?: number }) {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <g>
      <text x={x} y={26} fontFamily={f.typography.monoFont} fontSize={11} letterSpacing="1.4" fill={ink} opacity={0.7}>
        {eyebrow.toUpperCase()}
      </text>
      <text x={x} y={58} fontFamily={f.typography.titleFont} fontSize={21} fontWeight={700} fill={ink}>
        {title}
      </text>
    </g>
  );
}

/** 의미색 4종 — 도식이 tokens 를 직접 뒤지지 않도록 여기서 이름으로 준다. */
export const TONE = {
  problem: T.SEMANTIC.problem.surface,
  solution: T.SEMANTIC.solution.surface,
  warn: T.SEMANTIC.warn.surface,
  info: T.SEMANTIC.info.surface,
  neutral: T.SURFACE,
  sunken: T.SURFACE_DEEP,
} as const;

export type Tone = keyof typeof TONE;

/**
 * 강조 박스 — "핵심 판단" 같은 한 마디를 담는다.
 * 채움 위 텍스트는 언제나 잉크다(대비 행렬 M1).
 *
 * `lines` 는 **줄바꿈되지 않는다.** 한글 12.5px 기준 폭 912 에서 한 줄이 약 70자를 넘으면
 * 오른쪽으로 삐져나간다 — 넘칠 것 같으면 호출자가 줄을 나눈다.
 */
export function Callout({
  x,
  y,
  width,
  label,
  lines,
  tone = 'warn',
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  lines: readonly string[];
  tone?: Tone;
}) {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  const h = 34 + lines.length * 20;
  return (
    <g>
      {/* 하드 오프셋 섀도는 wrapper Node 가 아니라 여기서 직접 — 콜아웃은 노드가 아니다. */}
      <rect x={x + 4} y={y + 4} width={width} height={h} fill={ink} />
      <rect x={x} y={y} width={width} height={h} fill={TONE[tone]} stroke={ink} strokeWidth={T.BORDER_W} />
      {/* 자간·대문자·mono 는 라틴에서만 쓴다 — IBM Plex Mono 에 한글 글리프가 없어
          한글을 걸면 그 줄만 폴백 서체로 떨어지고 공백이 mono 폭으로 벌어진다. */}
      <text
        x={x + 16}
        y={y + 22}
        fontFamily={isLatin(label) ? f.typography.monoFont : f.typography.titleFont}
        fontSize={10.5}
        letterSpacing={isLatin(label) ? '1' : '0'}
        fontWeight={700}
        fill={ink}
      >
        {isLatin(label) ? label.toUpperCase() : label}
      </text>
      {lines.map((l, i) => (
        <text key={i} x={x + 16} y={y + 44 + i * 20} fontFamily={f.typography.titleFont} fontSize={12.5} fill={ink}>
          {l}
        </text>
      ))}
    </g>
  );
}

/**
 * 각진 경계 — 이 프로젝트의 Boundary 는 언제나 radius 0 이다.
 *
 * 라벨은 프레임 선 **밖 위**에 놓는다(`labelPlacement="outside"`). 기본값 `on-line` 은 글자 가운데를
 * 프레임 선이 지나가 취소선처럼 읽힌다 — 이 저장소는 그래서 경계 이름을 손으로 `<text>` 로 그렸고,
 * 패키지 0.3.0 이 placement 를 열어 주면서 그 우회를 걷어냈다(`docs/viz-upstream-issues.md` P3).
 *
 * 서체는 넘기지 않는다. 상류 `resolveLabelFont` 가 라벨의 스크립트를 보고 mono·sans 를 고르므로
 * 한글 라벨이 mono 폴백으로 떨어지지 않는다(같은 문서 P4). 자간·대문자만 여기서 라틴에 한정한다.
 */
export function Frame({
  dashed,
  children,
  label,
  labelPlacement = 'outside',
  ...rest
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  labelPlacement?: BoundaryLabelPlacement;
  dashed?: boolean;
  children?: ReactNode;
}) {
  const f = useVizFoundation();
  return (
    <g>
      <Boundary
        {...rest}
        label={label}
        labelPlacement={labelPlacement}
        labelFontSize={10.5}
        labelColor={T.INK_MUTED}
        letterSpacing={isLatin(label ?? '') ? '0.8' : '0'}
        radius={0}
        stroke={f.boundary.stroke}
        strokeWidth={f.boundary.width}
        dashPattern={dashed ? '6 4' : ''}
      />
      {children}
    </g>
  );
}

/**
 * 라틴만 자간·대문자를 받는다. 한글에 걸면 글자가 흩어져 읽기 나빠진다.
 *
 * 판정은 상류 `hasNonAsciiScript` 에 위임한다 — 우리가 쓰던 `/^[\x20-\x7E]*$/` 는 `·`·`×`·`—`
 * 처럼 **mono 에 멀쩡히 있는** 글자까지 비라틴으로 몰아 sans 로 내렸다(`docs/viz-upstream-issues.md` P4).
 */
export const isLatin = (s: string) => !hasNonAsciiScript(s);

/* ── 역할 규약 ─────────────────────────────────────────
 *
 * `docs/viz-plan.md` §2 — 역할을 **형태와 색 둘 다**로 인코딩한다. 색만으로는 흑백 출력에서
 * 역할이 사라지고, `mono` preset 이 액센트를 명도로 환원하는 순간 저장소와 판단이 같은 회색이 된다.
 *
 * **적용 대상 판정** — 규약은 "역할이 다른 것들이 한 그림에 있을 때 그 차이를 형태로 남긴다"는
 * 목적을 가진다. 그러므로 판정은 도식의 종류가 아니라 **그 도식이 무엇을 칸으로 그리는가**로 한다.
 *
 *   적용: 칸이 **시스템의 구성 요소**일 때 — 저장소·판단·컨테이너·외부·사람·큐·실행 단위.
 *         `RoleBox` 를 쓴다. 맨몸 `Node` 로 그리고 채움만 다르게 두는 것은 미적용이다.
 *   면제: 칸이 구성 요소가 **아닐** 때. 넷뿐이고, 면제면 그 근거를 컴포넌트 상단에 적는다.
 *     ① 절차형 — 칸이 전부 같은 역할(단계)이고 순서만 다르다. 인코딩할 역할 차이가 없다.
 *     ② 격자형 — 칸이 두 축의 **교차값**이다. 칸은 노드가 아니라 셀이다(`Cell`).
 *     ③ 서술형 패널 — 칸이 상태·성질·대가를 담는 **글의 그릇**이다(`Panel`). 실행 단위로
 *        오독되면 안 되므로 오히려 `RoleBox` 를 쓰지 않는 것이 규약이다.
 *     ④ 모델형 — 칸이 **모델 요소**(클래스·엔티티)다. 실행 단위가 아니고, UML 이 이미 자기
 *        표기(3분할 칸 · `«스테레오타입»`)를 갖고 있어 우리 역할 어휘를 덧씌우면 두 표기가
 *        겹쳐 읽힌다. `ResumeClassBox`(= 상류 `ClassBox` + 프로젝트 섀도·가드)를 쓴다.
 *        **딸린 결과를 분명히 한다** — E축은 면제 번호를 읽지 않고 맨몸 `<Node>` 가 없으면
 *        분기 자체가 안 돈다. 모델형 도식은 ④를 근거로 통과하는 것이 아니라 **E축 검사를 받지
 *        않는다.** 같은 이유로 `RoleBox` 를 안 써 `audit-rolebox` 도 판정을 건너뛴다. 기계 쪽
 *        보증은 `scripts/lint-diagrams.ts` 의 `@viz-type` 축과 `scripts/domain-model.test.ts`
 *        의 SSR 단언이 맡는다(KAN-026-QM5VAW).
 *
 *   database  cylinder            SAGE          영속 저장소 · 집합을 보관하는 자리
 *   decision  diamond             KHAKI_LINE    조건에 따라 갈리는 판단 지점
 *   container rect + 이중 키라인  BLUE          배포 단위 · 서비스 · 모듈
 *   process   rect                SURFACE       기본 실행 단위
 *   external  rect + 대시         SURFACE_DEEP  소유 밖 · 우리가 만들지 않은 것
 *   person    rect + 인물 글리프  YELLOW        사람 · 이해관계자
 *   queue     rect + 막대 글리프  PINK          비동기 버퍼
 *
 * `DatabaseNode`·`DecisionNode` 같은 kind 전용 컴포넌트를 쓰지 않는다 — 내부에서 맨몸 `Node` 를
 * 부르므로 이 프로젝트의 시그니처(하드 오프셋 섀도)가 붙지 않는다. wrapper 를 거친 `Node` 에
 * `shape` 를 넘기면 형태와 섀도를 둘 다 얻는다.
 */
export type Role = 'database' | 'decision' | 'container' | 'process' | 'external' | 'person' | 'queue';

const SHAPE: Record<Role, 'rect' | 'cylinder' | 'diamond'> = {
  database: 'cylinder',
  decision: 'diamond',
  container: 'rect',
  process: 'rect',
  external: 'rect',
  person: 'rect',
  queue: 'rect',
};

/** 사람 글리프 — 머리 + 어깨. 노드 오른쪽 위 모서리에 얹는다. */
function PersonGlyph({ x, y, ink }: { x: number; y: number; ink: string }) {
  return (
    <g>
      <circle cx={x} cy={y - 4} r={4} fill="none" stroke={ink} strokeWidth={1.6} />
      <path d={`M ${x - 7} ${y + 8} a 7 7 0 0 1 14 0`} fill="none" stroke={ink} strokeWidth={1.6} />
    </g>
  );
}

/** 큐 글리프 — 쌓인 막대. 버퍼에 대기가 있다는 표시다. */
function QueueGlyph({ x, y, ink }: { x: number; y: number; ink: string }) {
  return (
    <g>
      {[0, 5, 10].map((dx) => (
        <rect key={dx} x={x - 12 + dx} y={y - 6} width={3} height={13} fill={ink} opacity={0.75} />
      ))}
    </g>
  );
}

/* ── 글줄 배치 상수 ──────────────────────────────────────
 *
 * 글은 **상류 `contentBox` 안에만** 놓고, 그 박스 안에서 상하 여백을 남긴 채 세로 가운데로 건다.
 * 형태(각진 박스·원통·마름모)가 달라도 여백이 같아지는 것이 이 배치의 요점이다 — 예전에는
 * `y + cap + 18` 처럼 형태별 오프셋을 손으로 잡아, 원통에서는 tag 가 콘텐츠 박스 윗변을 넘고
 * 각진 박스에서는 아래가 헐거웠다.
 *
 * 여백은 둘로 나뉜다. **`PAD` 는 하한**이고 — 이보다 좁으면 가드가 렌더를 죽인다 —
 * **`BOX_PAD` 는 기준**이다. `h` 를 주지 않으면 `roleBoxHeight` 가 `BOX_PAD` 로 높이를 잡으므로
 * 한 도식 안의 모든 칸이 같은 여백을 갖는다. 손으로 `h` 를 주는 것은 격자를 맞춰야 할 때뿐이고,
 * 그때도 하한은 가드가 지킨다.
 */
const PAD = 6;
/** 글 높이를 자동으로 잡을 때 쓰는 기준 여백. 칸끼리 여백을 같게 만드는 값이다. */
export const BOX_PAD = 10;
/** 글줄 왼쪽 들여쓰기 — 콘텐츠 박스 왼쪽 기준. */
const INSET = 14;
/** IBM Plex 근사 — 기준선 위/아래로 잉크가 차지하는 비율. 브라우저 밖에서는 실측할 수 없다. */
const ASCENT = 0.75;
const DESCENT = 0.25;

/** 그 높이에서 형태가 실제로 갖는 반폭. 마름모만 위아래로 좁아진다. */
function halfWidthAt(shape: NodeShape, bx: BBox, yy: number): number {
  if (shape !== 'diamond') return bx.width / 2;
  const half = bx.height / 2;
  return (bx.width / 2) * Math.max(0, 1 - Math.abs(yy - (bx.y + half)) / half);
}

interface Row {
  text: string;
  size: number;
  mono: boolean;
  /** 다음 줄 기준선까지의 거리. 마지막 줄은 0. */
  gap: number;
}

/** 줄 하나하나의 서체·크기·간격. 간격은 형태와 무관하게 일정하다. */
function rowsOf(tag: string | undefined, name: string, note: string | undefined): Row[] {
  return [
    tag ? { text: isLatin(tag) ? tag.toUpperCase() : tag, size: 9.5, mono: isLatin(tag), gap: 16 } : null,
    { text: name, size: 12.5, mono: isLatin(name), gap: note ? 17 : 0 },
    note ? { text: note, size: 10.5, mono: false, gap: 0 } : null,
  ].filter((r): r is Row => r !== null);
}

/** 잉크가 실제로 차지하는 세로 범위 — 첫 줄의 어센더부터 마지막 줄의 디센더까지. */
const blockHeightOf = (rows: Row[]) =>
  rows[0].size * ASCENT + rows.reduce((s, r) => s + r.gap, 0) + rows[rows.length - 1].size * DESCENT;

/**
 * 콘텐츠 박스 안쪽 높이가 `need` 이상이 되는 최소 h.
 * 원통 뚜껑은 h 에 딸려 커지므로 닫힌 식 대신 올려가며 찾는다. 폭과는 무관하다
 * (각진 박스는 h, 원통은 h − 3ry, 마름모는 h/2 라 셋 다 h 만의 함수다).
 */
function minHeightFor(shape: NodeShape, need: number, from = 1): number {
  for (let hh = Math.ceil(from); hh < from + 600; hh += 1) {
    if (contentBox(shape, { x: 0, y: 0, width: 100, height: hh }).height >= need) return hh;
  }
  return Math.ceil(from);
}

/**
 * 이 내용이 **같은 여백으로** 들어가는 칸 높이.
 *
 * 격자를 손으로 맞출 때 이 값을 쓰면 칸마다 h 를 눈대중으로 고르지 않아도 된다 —
 * 한 도식 안에서 줄 수가 달라도 안쪽 여백이 `pad` 로 같아진다.
 */
export function roleBoxHeight(role: Role, content: { tag?: string; name: string; note?: string }, pad = BOX_PAD): number {
  const rows = rowsOf(content.tag, content.name, content.note);
  return minHeightFor(SHAPE[role], blockHeightOf(rows) + pad * 2);
}

/**
 * 역할이 붙은 노드 한 칸.
 *
 * `tag` 는 라틴 대문자 눈썹, `name` 은 식별자(라틴이면 mono), `note` 는 한글 설명(sans)이다.
 * IBM Plex Mono 에 한글 글리프가 없으므로 한글은 반드시 sans 쪽으로 내린다.
 *
 * 형태가 먹는 높이·폭은 **상류 `contentBox` 가 계산한다.** 예전에는 뚜껑 높이
 * `clamp(h×0.15, 4, 12)` 를 이 파일에 복제하고 "database 는 h ≥ 82" 같은 치수를 주석으로 적어
 * 두었는데, 패키지가 값을 바꾸면 복제본은 조용히 어긋났다(`docs/viz-upstream-issues.md` P2).
 *
 * 지금은 세로·가로 둘 다 가드가 있고 **넘치면 렌더가 죽는다.** 조용한 잘림이 이 결함의 본체였다.
 * 예외 메시지에는 필요한 최소 `h` 가 함께 나오므로 호출자가 바로 고칠 수 있다.
 *
 * **`h` 는 웬만하면 주지 않는다.** 생략하면 `roleBoxHeight` 가 `BOX_PAD` 여백으로 높이를 잡아
 * 줄 수가 다른 칸들끼리도 안쪽 여백이 같아진다. 손으로 주는 것은 격자 높이를 맞춰야 할 때뿐이다.
 */
export function RoleBox({
  x,
  y,
  w,
  h,
  role,
  tag,
  name,
  note,
  fill,
}: {
  x: number;
  y: number;
  w: number;
  /** 생략하면 내용에서 계산한다(`roleBoxHeight`). 격자를 맞출 때만 손으로 준다. */
  h?: number;
  role: Role;
  tag?: string;
  name: string;
  note?: string;
  /** 규약 밖으로 나가야 할 때만. 기본은 foundation 의 kind 채움이다. */
  fill?: string;
}) {
  const f = useVizFoundation();
  const RzNode = useVizWrapperComponent<NodeProps>('Node', Node);
  const ink = f.node.process.tagColor;
  const shape = SHAPE[role];
  const centered = shape === 'diamond';

  const rows = rowsOf(tag, name, note);
  const blockH = blockHeightOf(rows);
  const height = h ?? minHeightFor(shape, blockH + BOX_PAD * 2);
  const bbox = { x, y, width: w, height };

  const box = contentBox(shape, bbox);
  const avail = box.height - PAD * 2;
  if (blockH > avail) {
    throw new Error(
      `RoleBox 세로 넘침: role=${role} h=${height} — ${rows.length}줄(${blockH.toFixed(1)}px)이 ` +
        `콘텐츠 박스의 여유 ${avail.toFixed(1)}px 를 넘는다(name="${name}"). ` +
        `h ≥ ${minHeightFor(shape, blockH + PAD * 2)} 로 키우거나(같은 여백이면 ` +
        `${minHeightFor(shape, blockH + BOX_PAD * 2)}) 줄을 줄여라.`,
    );
  }

  // 콘텐츠 박스 안에서 세로 가운데 — 위아래 여백이 저절로 같아진다.
  const first = box.y + PAD + (avail - blockH) / 2 + rows[0].size * ASCENT;
  const baselines = rows.map((_, i) => first + rows.slice(0, i).reduce((s, r) => s + r.gap, 0));

  const tx = centered ? x + w / 2 : box.x + INSET;
  const anchor = centered ? 'middle' : 'start';

  // 가로도 본다. 마름모는 기준선 높이마다 폭이 달라지므로 그 줄의 실제 폭으로 재판정한다.
  rows.forEach((r, i) => {
    const tw = textWidth(r.text, r.size, r.mono);
    const room = centered
      ? halfWidthAt(shape, bbox, baselines[i]) * 2 - PAD * 2
      : box.width - INSET - PAD;
    if (tw > room) {
      throw new Error(
        `RoleBox 가로 넘침: role=${role} w=${w} — "${r.text}" 가 ${tw.toFixed(0)}px 인데 ` +
          `그 줄에 남은 폭은 ${room.toFixed(0)}px 다. w 를 키우거나 글을 줄여라.`,
      );
    }
  });

  return (
    // data-rz-pad 는 감사용이다 — 칸의 실제 안쪽 여백(px). `scripts/audit-rolebox.ts` 가 이걸 읽어
    // 도식 전체의 여백이 BOX_PAD 로 고른지 본다. 손으로 h 를 준 칸만 값이 달라진다.
    <g data-rz-pad={((avail - blockH) / 2 + PAD).toFixed(1)} data-rz-role={role}>
      <RzNode
        x={x}
        y={y}
        width={w}
        height={height}
        shape={shape}
        fill={fill ?? f.node[role].fill}
        // 소유 밖은 색이 아니라 대시로 인코딩한다 — style guide 계약.
        strokeDasharray={role === 'external' ? '6 4' : undefined}
      />
      {/* 컨테이너는 이중 키라인 — 배포 단위라는 것을 형태로도 말한다. */}
      {role === 'container' && (
        <rect x={x + 5} y={y + 5} width={w - 10} height={height - 10} fill="none" stroke={ink} strokeWidth={1} opacity={0.55} />
      )}
      {role === 'person' && <PersonGlyph x={x + w - 18} y={y + 18} ink={ink} />}
      {role === 'queue' && <QueueGlyph x={x + w - 8} y={y + 16} ink={ink} />}

      {rows.map((r, i) => (
        <text
          key={i}
          x={tx}
          y={baselines[i]}
          textAnchor={anchor}
          fontFamily={r.mono ? f.typography.monoFont : f.typography.titleFont}
          fontSize={r.size}
          // tag 만 눈썹 조판(자간·흐림)을 받는다. name 은 굵게, note 는 맨몸이다.
          letterSpacing={i === 0 && tag && r.mono ? '0.9' : '0'}
          fontWeight={r.size === 12.5 ? 700 : 400}
          opacity={i === 0 && tag ? 0.72 : 1}
          fill={ink}
        >
          {r.text}
        </text>
      ))}
    </g>
  );
}

/**
 * 코드 패널 — 논지가 코드에 있으면 **요약한 의사코드가 아니라 원문**을 싣는다.
 * 본문은 ASCII 로만 쓴다. IBM Plex Mono 에 한글 글리프가 없어 주석에 한글을 넣으면 그 줄만
 * 시스템 폰트로 떨어져 같은 블록 안에서 서체가 갈린다.
 */
export function CodePanel({
  x,
  y,
  width,
  title,
  note,
  lines,
  fontSize = 10.5,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  note?: string;
  lines: readonly string[];
  fontSize?: number;
}) {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  const first = note ? 62 : 44;
  const lh = fontSize + 4.5;
  const h = first + (lines.length - 1) * lh + 16;
  return (
    <g>
      <rect x={x + 4} y={y + 4} width={width} height={h} fill={ink} />
      <rect x={x} y={y} width={width} height={h} fill={TONE.sunken} stroke={ink} strokeWidth={T.BORDER_W} />
      <text x={x + 16} y={y + 24} fontFamily={f.typography.titleFont} fontSize={12.5} fontWeight={700} fill={ink}>
        {title}
      </text>
      {note && (
        <text x={x + 16} y={y + 42} fontFamily={f.typography.titleFont} fontSize={10.5} fill={T.INK_MUTED}>
          {note}
        </text>
      )}
      {lines.map((l, i) => (
        <text
          key={i}
          x={x + 16}
          y={y + first + i * lh}
          fontFamily={f.typography.monoFont}
          fontSize={fontSize}
          fill={ink}
          xmlSpace="preserve"
        >
          {l}
        </text>
      ))}
    </g>
  );
}

/** CodePanel 의 높이를 미리 알아야 레이아웃을 잡을 수 있다. */
export const codePanelHeight = (n: number, note = true, fontSize = 10.5) =>
  (note ? 62 : 44) + (n - 1) * (fontSize + 4.5) + 16;

/**
 * 제목 붙은 패널 — 대조·격자의 한 칸. 하드 오프셋 섀도가 이 motif 의 시그니처다.
 *
 * **색 어휘 충돌 금지**: 노드 채움이 구조 어휘(BLUE=container·SAGE=database…)를 쓰는 도식에서는
 * 패널 tone 을 노드가 쓰지 않는 것으로만 고른다. 파랑 패널은 컨테이너로, 연두 패널은 저장소로
 * 오독된다.
 */
export function Panel({
  x,
  y,
  width,
  height,
  tone = 'neutral',
  label,
  title,
  lines = [],
  lineGap = 18,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  tone?: Tone;
  label?: string;
  title?: string;
  lines?: readonly string[];
  lineGap?: number;
  children?: ReactNode;
}) {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  let cursor = y + (label ? 24 : 6);
  return (
    <g>
      <rect x={x + 4} y={y + 4} width={width} height={height} fill={ink} />
      <rect x={x} y={y} width={width} height={height} fill={TONE[tone]} stroke={ink} strokeWidth={T.BORDER_W} />
      {label && (
        <text
          x={x + 16}
          y={cursor}
          fontFamily={isLatin(label) ? f.typography.monoFont : f.typography.titleFont}
          fontSize={10.5}
          fontWeight={700}
          letterSpacing={isLatin(label) ? '1' : '0'}
          fill={ink}
        >
          {isLatin(label) ? label.toUpperCase() : label}
        </text>
      )}
      {title && (
        <text
          x={x + 16}
          y={(cursor += label ? 24 : 22)}
          fontFamily={f.typography.titleFont}
          fontSize={13.5}
          fontWeight={700}
          fill={ink}
        >
          {title}
        </text>
      )}
      {lines.map((l, i) => (
        <text
          key={i}
          x={x + 16}
          y={(cursor += i === 0 ? (title ? 24 : 20) : lineGap)}
          fontFamily={f.typography.titleFont}
          fontSize={11.5}
          fill={ink}
        >
          {l}
        </text>
      ))}
      {children}
    </g>
  );
}

/** 격자 한 칸 — 두 축의 교차를 그릴 때 쓴다. 채움이 없으면 교차가 없다는 뜻이다. */
export function Cell({
  x,
  y,
  width,
  height,
  filled,
  label,
  tone = 'warn',
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  filled?: boolean;
  label?: string;
  tone?: Tone;
}) {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={filled ? TONE[tone] : TONE.neutral}
        stroke={ink}
        strokeWidth={filled ? T.BORDER_W : 1}
        opacity={filled ? 1 : 0.5}
      />
      {label && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 4}
          textAnchor="middle"
          fontFamily={f.typography.monoFont}
          fontSize={10.5}
          fontWeight={700}
          fill={ink}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** 노드 안에 넣는 라벨 한 줄. */
export function Label({
  x,
  y,
  children,
  bold,
  size = 12,
  dim,
}: {
  x: number;
  y: number;
  children: string;
  bold?: boolean;
  size?: number;
  dim?: boolean;
}) {
  const f = useVizFoundation();
  return (
    <text
      x={x}
      y={y}
      fontFamily={f.typography.titleFont}
      fontSize={size}
      fontWeight={bold ? 700 : 400}
      fill={dim ? T.INK_MUTED : f.node.process.tagColor}
    >
      {children}
    </text>
  );
}

/**
 * 도메인 모델 도식 패턴 — spec 하나로 UML 클래스 다이어그램을 그린다.
 *
 * **층이 셋이고 이 파일은 가운데 얇은 어댑터다.**
 *
 *   ① 유형 결정   selectVizTypes → VT-101 UML Class Diagram   [상류 레지스트리]
 *   ② 배치        tidyTreeLayout · nearestAnchors             [상류 순수 함수]
 *      ↕  이 파일 — spec 타입 + 어댑터
 *   ③ 렌더        ClassBox · Frame · Edge · EdgeLabel          [상류 프리미티브, wrapper resolver 경유]
 *
 * 배치 알고리즘도 칸 렌더도 마커 선택도 우리 것이 아니다. 여기서 하는 일은 **상류가 비워 둔
 * 자리를 메우는 것**뿐이고, 예외마다 근거를 한 줄로 단다.
 *
 * **상류 템플릿 `ClassDiagram` 을 쓰지 않는 근거 셋**(전부 실측, `docs/viz-upstream-issues.md`):
 *   ① `ClassDiagram`(`dist/index.js:4220`)이 `ClassBox` 를 **직접** 불러 wrapper resolver 를
 *      우회한다 → 프로젝트 시그니처(하드 오프셋 섀도)가 조용히 안 붙는다.
 *   ② 선언된 스펙 필드가 렌더에 도달하지 않는다 — `ClassSpec.stereotype` 미전달(`:4221-4232`),
 *      관계 라벨 미렌더(`:4235-4249`). 도메인 모델에서 Aggregate Root 표기와 카디널리티가
 *      통째로 사라진다. (같은 패키지 `SysMLBlockDiagram:5456` 은 `stereotype` 을 넘긴다.)
 *   ③ 자기 `Canvas` 를 소유해(`:4210`) 중첩 캔버스가 되고 registry·좌표계가 갈린다.
 *
 * **엣지는 `{x,y}` 점으로 잇는다 — id 문자열을 쓰지 않는다.** `Canvas` 의 registry 는 `data` prop
 * 으로만 채워지는데(`:1467`) 이 패턴은 `<g>` 안에 살아 부모 캔버스의 `data` 를 설정할 수 없다.
 * 현행 도식 18종도 전부 `{x,y}` 이고 `data=` 사용은 0건이다.
 *
 * 역할 규약은 **면제 ④ 모델형**이다(`diagrams/_frame.tsx`) — 칸이 실행 단위가 아니라 모델 요소이고
 * UML 이 자기 표기를 갖는다. 그래서 `RoleBox` 를 쓰지 않고, E축·`audit-rolebox` 는 이 도식을
 * 보지 않는다. 기계 쪽 보증은 `scripts/lint-diagrams.ts` 의 `@viz-type` 축과
 * `scripts/domain-model.test.ts` 의 SSR 단언이 맡는다.
 */

import {
  Edge,
  getAnchor,
  nearestAnchors,
  tidyTreeLayout,
  useVizWrapperComponent,
  type BBox,
  type ClassBoxProps,
  type EdgeLabelProps,
  type MarkerVariant,
  type AnchorSide,
  type Point,
  type TreeNodeInput,
} from '@centurio1987/bbangto-ui-visualization';
import type { ComponentType, ReactNode } from 'react';
import { classBoxMetrics, classBoxMinWidth } from '../style-guide/resume.viz';
import { Frame } from './frame';

/* ── spec ──────────────────────────────────────────────── */

/** 모델 요소 하나. 속성·메서드는 **원천이 이름을 댈 때만** 채운다(없으면 지어내지 않는다). */
export interface DomainEntity {
  id: string;
  name: string;
  /** `«Aggregate Root»` 처럼 칸 위에 작게 붙는 표기. */
  stereotype?: string;
  attributes?: string[];
  methods?: string[];
  /** 폭을 손으로 고정할 때만. 안 주면 글자 폭에서 계산한다. */
  width?: number;
}

/**
 * 관계 6종 — 상류 `edgeConfig`(`dist/index.js:4171`)의 어휘 그대로다.
 * 우리가 새 어휘를 만들지 않는다.
 */
export type DomainRelationKind =
  | 'composition'
  | 'aggregation'
  | 'association'
  | 'inheritance'
  | 'realization'
  | 'dependency';

export interface DomainRelation {
  from: string;
  to: string;
  kind: DomainRelationKind;
  /** 양 끝 카디널리티 텍스트(`1` · `N` 등). **원천이 못 대면 생략한다.** */
  fromCard?: string;
  toCard?: string;
  /**
   * 관계 종류가 계층을 함의하지 않는데(연관·의존) **논지가 층위일 때** 어느 쪽이 위인지 지정한다.
   *
   * 필요한 이유: Knowledge Level 패턴에서 운영 모델은 타입 모델을 **연관**으로 참조한다 —
   * 포함도 상속도 아니라 `hierarchyEdge` 가 계층으로 안 세고, 그러면 두 수준이 한 행에 나란히
   * 놓여 「층위」가 「대조」로 읽힌다. 관계의 UML 의미를 왜곡해 억지로 포함으로 그리는 대신
   * **어느 쪽이 위인가만 따로 말한다.** 배치 알고리즘은 그대로 상류 것이다.
   */
  above?: 'from' | 'to';
}

/** Aggregate 경계 — 이 모델들을 대시 프레임으로 감싼다. */
export interface DomainGroup {
  id: string;
  label: string;
  members: string[];
}

export interface DomainModelSpec {
  entities: DomainEntity[];
  relations: DomainRelation[];
  groups?: DomainGroup[];
}

/* ── 상류가 비워 둔 자리 ───────────────────────────────── */

/**
 * 관계 → 마커·선 모양.
 *
 * **상류 `edgeConfig`(`dist/index.js:4171-4187`)를 그대로 옮긴 것이다.** 이 함수는 패키지에서
 * `export` 되지 않아(`dist/index.d.ts` 에 0건) 부를 수가 없다 — 판정을 우리가 다시 하는 것이
 * 아니라 **부를 수 없어서 옮겨 적었다.** 값이 갈리지 않도록 상류 `switch` 의 순서·값을 그대로 둔다.
 * 노출 요청은 `docs/viz-upstream-issues.md` 에 원고로 낸다.
 */
export function relationEdgeProps(kind: DomainRelationKind): {
  markerStart?: MarkerVariant;
  markerEnd?: MarkerVariant;
  strokeDasharray?: string;
} {
  switch (kind) {
    case 'inheritance':
      return { markerEnd: 'triangleOpen' };
    case 'realization':
      return { markerEnd: 'triangleOpen', strokeDasharray: '6 3' };
    case 'composition':
      return { markerStart: 'diamond' };
    case 'aggregation':
      return { markerStart: 'diamondOpen' };
    case 'dependency':
      return { markerEnd: 'arrowOpen', strokeDasharray: '5 3' };
    case 'association':
    default:
      return { markerEnd: 'arrow' };
  }
}

/**
 * 관계가 **계층**을 뜻하는가, 그렇다면 누가 위인가.
 *
 * 포함(composition·aggregation)은 전체가 위, 상속(inheritance·realization)은 상위 타입이 위다.
 * 연관·의존은 계층이 아니므로 트리 간선이 되지 않고 **선으로만** 남는다.
 */
function hierarchyEdge(r: DomainRelation): { parent: string; child: string } | null {
  if (r.above) return r.above === 'from' ? { parent: r.from, child: r.to } : { parent: r.to, child: r.from };
  switch (r.kind) {
    case 'composition':
    case 'aggregation':
      return { parent: r.from, child: r.to };
    case 'inheritance':
    case 'realization':
      return { parent: r.to, child: r.from };
    default:
      return null;
  }
}

/** 가상 루트의 id — 다중 루트를 하나로 묶을 때만 쓰고 출력에서 뺀다. */
const VIRTUAL_ROOT = '__domain_model_virtual_root__';

/**
 * 계층 간선에서 **스패닝 트리**를 정제한다.
 *
 * 상류 `tidyTreeLayout`(`dist/index.js:719`)이 못 하는 둘을 여기서 막는다.
 *   ① **순환 방어가 없다** — 방문 Set 이 없어서 A→B→A 면 무한 재귀로 스택이 터진다
 *      (바로 아래 `wbsNumbering:753` 은 `seen` Set 을 갖는다. 같은 파일 안에서 갈린다).
 *   ② **단일 루트만 받는다** — `visit(root, 0, null)` 하나뿐이다.
 * 트리 간선이 되지 못한 관계는 버리지 않는다. 배치에만 안 쓰이고 선으로는 그대로 그려진다.
 */
export function spanningTree(spec: DomainModelSpec): { root: TreeNodeInput; virtual: boolean } {
  const ids = spec.entities.map((e) => e.id);
  const known = new Set(ids);
  for (const r of spec.relations) {
    for (const end of [r.from, r.to]) {
      if (!known.has(end)) throw new Error(`_domain-model: 관계가 모르는 모델을 가리킨다 — "${end}"`);
    }
  }

  const childrenOf = new Map<string, string[]>(ids.map((id) => [id, []]));
  const parentOf = new Map<string, string>();
  for (const r of spec.relations) {
    const h = hierarchyEdge(r);
    if (!h) continue;
    // 이미 부모가 있으면 트리 간선으로 채택하지 않는다 — 첫 선언이 이긴다(결정적).
    if (parentOf.has(h.child) || h.parent === h.child) continue;
    parentOf.set(h.child, h.parent);
    childrenOf.get(h.parent)!.push(h.child);
  }

  // 순환 정제 — 조상을 거슬러 올라가다 자기를 만나면 그 간선을 끊는다.
  for (const id of ids) {
    const seen = new Set<string>([id]);
    let cur = parentOf.get(id);
    while (cur) {
      if (seen.has(cur)) {
        const kids = childrenOf.get(parentOf.get(cur)!) ?? [];
        const i = kids.indexOf(cur);
        if (i >= 0) kids.splice(i, 1);
        parentOf.delete(cur);
        break;
      }
      seen.add(cur);
      cur = parentOf.get(cur);
    }
  }

  const build = (id: string): TreeNodeInput => ({ id, children: childrenOf.get(id)!.map(build) });
  const roots = ids.filter((id) => !parentOf.has(id));
  if (roots.length === 1) return { root: build(roots[0]), virtual: false };
  return { root: { id: VIRTUAL_ROOT, children: roots.map(build) }, virtual: true };
}

/* ── 배치 ──────────────────────────────────────────────── */

/** 시작점 마커(다이아)가 칸에 안 덮이도록 띄우는 거리. 마커 크기 8 의 절반이다. */
const MARKER_CLEARANCE = 5;

/** 형제 칸 사이 최소 통로. */
const COL_GAP = 56;
/** 행 사이 통로 — 카디널리티 라벨이 앉을 자리다. */
const ROW_GAP = 72;

export interface DomainBox {
  id: string;
  entity: DomainEntity;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DomainLayout {
  boxes: DomainBox[];
  byId: Map<string, DomainBox>;
  /** 배치가 실제로 차지한 폭·높이(원점 기준). */
  width: number;
  height: number;
}

/**
 * spec → 좌표.
 *
 * **트리의 모양은 상류가 정한다.** `tidyTreeLayout` 이 낸 `depth` 와 리프의 좌우 **순서**를
 * 그대로 쓰고, 우리가 바꾸는 것은 **간격 하나**다 — 상류는 리프를 균등 간격에 놓는데(`:744`)
 * 그 식은 칸의 폭·높이를 모르므로, 폭이 제각각인 `ClassBox` 를 그 중심에 놓으면 형제가 겹친다.
 * (`scripts/lint-diagrams.ts` 가 "레이아웃 겹침은 검사하지 않는다"고 적어 둔 사각지대다.)
 *
 * 그래서 리프는 실제 폭 + `COL_GAP` 으로 다시 깔고, 내부 노드는 **상류가 쓰는 규칙 그대로**
 * 자식들 중심의 min/max 중점에 둔다(`:735`). 규칙을 새로 만드는 것이 아니라 크기를 아는 좌표계에서
 * 같은 규칙을 다시 적용하는 것이다. 세로도 같은 이유로 행마다 `max(칸 높이) + ROW_GAP` 을 쌓는다.
 */
export function layoutDomainModel(spec: DomainModelSpec, origin = { x: 0, y: 0 }): DomainLayout {
  const { root, virtual } = spanningTree(spec);
  // width·height 는 정규화 용도로만 쓴다 — 우리가 쓰는 것은 depth 와 x 의 **순서**다.
  const placed = tidyTreeLayout(root, { width: 1, height: 1 });

  const entityById = new Map(spec.entities.map((e) => [e.id, e]));
  const size = (e: DomainEntity) => ({
    width: e.width ?? Math.ceil(classBoxMinWidth(e).need) + COL_GAP / 2,
    height: classBoxMetrics(e.attributes ?? [], e.methods ?? []).height,
  });

  const nodes = placed
    .filter((n) => n.id !== VIRTUAL_ROOT)
    .map((n) => ({ ...n, depth: virtual ? n.depth - 1 : n.depth }));
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.parentId && n.parentId !== VIRTUAL_ROOT) {
      if (!childrenOf.has(n.parentId)) childrenOf.set(n.parentId, []);
      childrenOf.get(n.parentId)!.push(n.id);
    }
  }
  // 자식 순서도 상류 x 를 따른다 — 우리가 다시 정렬 기준을 만들지 않는다.
  const xOf = new Map(placed.map((n) => [n.id, n.x]));
  for (const kids of childrenOf.values()) kids.sort((a, b) => xOf.get(a)! - xOf.get(b)!);

  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  const rowTop: number[] = [];
  let cursorY = origin.y;
  for (let d = 0; d <= maxDepth; d++) {
    rowTop[d] = cursorY;
    const h = Math.max(...nodes.filter((n) => n.depth === d).map((n) => size(entityById.get(n.id)!).height), 0);
    cursorY += h + ROW_GAP;
  }

  // 리프를 왼쪽부터 실제 폭으로 깐다. 순서는 상류 x 순이다.
  const leaves = nodes.filter((n) => !childrenOf.has(n.id)).sort((a, b) => xOf.get(a.id)! - xOf.get(b.id)!);
  const centerX = new Map<string, number>();
  let cursorX = origin.x;
  for (const leaf of leaves) {
    const w = size(entityById.get(leaf.id)!).width;
    centerX.set(leaf.id, cursorX + w / 2);
    cursorX += w + COL_GAP;
  }
  // 내부 노드는 자식 중심의 min/max 중점 — 상류 `:735` 와 같은 규칙이다. 깊은 쪽부터 올라간다.
  for (const n of [...nodes].sort((a, b) => b.depth - a.depth)) {
    if (centerX.has(n.id)) continue;
    const kids = childrenOf.get(n.id)!.map((id) => centerX.get(id)!);
    centerX.set(n.id, (Math.min(...kids) + Math.max(...kids)) / 2);
  }

  const boxes: DomainBox[] = nodes.map((n) => {
    const e = entityById.get(n.id)!;
    const { width, height } = size(e);
    return { id: n.id, entity: e, depth: n.depth, x: centerX.get(n.id)! - width / 2, y: rowTop[n.depth], width, height };
  });
  boxes.sort((a, b) => a.depth - b.depth || a.x - b.x);

  const minX = Math.min(...boxes.map((b) => b.x));
  const shift = origin.x - minX;
  for (const b of boxes) b.x += shift;

  return {
    boxes,
    byId: new Map(boxes.map((b) => [b.id, b])),
    width: Math.max(...boxes.map((b) => b.x + b.width)) - origin.x,
    height: cursorY - ROW_GAP - origin.y,
  };
}

/* ── 렌더 ──────────────────────────────────────────────── */

/**
 * 엣지가 붙을 변과 그 위의 자리를 정한다.
 *
 * 상류가 주는 것 둘을 그대로 쓰되(`getAnchor` 로 좌표를, `nearestAnchors` 로 같은 행일 때의 변 선택을)
 * **트리 방향과 앵커 분산 두 가지만** 우리가 얹는다. 근거가 각각 하나씩이다.
 *
 * ① **트리에서는 위아래가 정해져 있다.** `nearestAnchors` 는 중심 간 `|dx| ≥ |dy|` 로 변을 고르는
 *    범용 휴리스틱이라, 부모가 위에 있어도 자식이 옆으로 멀면 좌우 변을 고른다 — 그러면 선이
 *    옆으로 나갔다 꺾여 내려와 계층이 흐려진다(실측). 깊이가 다르면 아래→위로 고정한다.
 * ② **한 변에 여러 엣지가 붙으면 겹친다.** `getAnchor` 는 변의 **중점** 하나만 준다. 부모가 자식
 *    셋을 가지면 세 선이 같은 점에서 나가고 카디널리티 라벨 셋이 한자리에 포개진다(실측).
 *    그래서 같은 변을 쓰는 엣지들을 그 변에 고르게 편다 — 좌표만 옮기고 변 선택은 그대로다.
 */
function anchorSides(a: DomainBox, b: DomainBox): { fromSide: AnchorSide; toSide: AnchorSide } {
  if (a.depth < b.depth) return { fromSide: 'bottom', toSide: 'top' };
  if (a.depth > b.depth) return { fromSide: 'top', toSide: 'bottom' };
  const { fromPt } = nearestAnchors(a, b);
  return fromPt.x < a.x ? { fromSide: 'left', toSide: 'right' } : fromPt.x > a.x + a.width ? { fromSide: 'right', toSide: 'left' } : fromPt.y < a.y ? { fromSide: 'top', toSide: 'bottom' } : { fromSide: 'bottom', toSide: 'top' };
}

/** 변 위에서 `i` 번째(총 `n` 개) 자리. 변에 수직인 좌표는 상류 `getAnchor` 가 준 값을 그대로 둔다. */
function spread(box: DomainBox, side: AnchorSide, i: number, n: number): Point {
  const pt = getAnchor(box, side);
  const t = (i + 1) / (n + 1);
  return side === 'top' || side === 'bottom'
    ? { x: box.x + box.width * t, y: pt.y }
    : { x: pt.x, y: box.y + box.height * t };
}

/**
 * 앵커를 변 바깥으로 `d` 만큼 민다.
 *
 * `markerStart`(포함·집합의 다이아)가 붙는 쪽에만 쓴다. 칸은 엣지보다 **나중에** 그려지므로
 * 시작점에 정확히 놓인 마커는 칸에 덮여 사라진다(실측 — 다이아가 안 보였다). `markerEnd` 는
 * 상류가 refX 로 끝점 앞에 세워 줘서 이 문제가 없다.
 */
function pushOut(pt: Point, side: AnchorSide, d: number): Point {
  return side === 'top'
    ? { x: pt.x, y: pt.y - d }
    : side === 'bottom'
      ? { x: pt.x, y: pt.y + d }
      : side === 'left'
        ? { x: pt.x - d, y: pt.y }
        : { x: pt.x + d, y: pt.y };
}

/** 카디널리티 라벨을 앵커에서 선을 따라 미는 거리. 칸 모서리에 붙으면 안 읽힌다. */
const CARD_INSET = 20;
/** 선과 라벨 사이 여백 — 라벨이 선 위에 앉지 않게 한 뼘 띄운다. */
const CARD_OFFSET = 11;

/**
 * 카디널리티 라벨 자리 — 앵커에서 **선을 따라** 밀고, 선과 겹치지 않게 옆으로 한 뼘 띈다.
 *
 * 어느 변에 붙은 앵커인지는 상류 규칙을 다시 계산하지 않고 **점 자체에서** 읽는다 —
 * 좌·우 변의 앵커만 y 가 칸의 세로 범위 **안**에 든다(`getAnchor`, `dist/index.js:239`).
 * 이 헬퍼가 상류에 없다: `Edge.label` 은 받아 놓고 버려지고(`:1790`) 양 끝 카디널리티 예가 0건이다.
 */
function cardinalityAt(box: BBox, pt: Point, other: Point): Point {
  const onSide = pt.y > box.y && pt.y < box.y + box.height;
  return onSide
    ? { x: pt.x + Math.sign(other.x - pt.x) * CARD_INSET, y: pt.y - CARD_OFFSET }
    : { x: pt.x + CARD_OFFSET, y: pt.y + Math.sign(other.y - pt.y) * CARD_INSET };
}

export interface DomainModelProps {
  spec: DomainModelSpec;
  origin?: { x: number; y: number };
  /** Aggregate 경계와 칸 사이 여백. */
  groupPad?: number;
  children?: ReactNode;
}

/**
 * spec 하나를 UML 클래스 다이어그램으로 그린다.
 *
 * 칸은 wrapper resolver 를 거쳐 `ResumeClassBox` 로 나가고(하드 오프셋 섀도·폭 가드가 거기 붙는다),
 * 엣지는 `nearestAnchors` 가 낸 두 점을 그대로 받는다.
 */
export function DomainModel({ spec, origin = { x: 0, y: 0 }, groupPad = 22, children }: DomainModelProps) {
  const Box = useVizWrapperComponent('ClassBox', null as unknown as ComponentType<ClassBoxProps>);
  const Label = useVizWrapperComponent('EdgeLabel', null as unknown as ComponentType<EdgeLabelProps>);
  const layout = layoutDomainModel(spec, origin);

  // 변마다 몇 개가 붙는지 먼저 세고(선언 순서 = 자리 순서, 결정적) 그 다음에 편다.
  const sided = spec.relations.map((r) => {
    const a = layout.byId.get(r.from);
    const b = layout.byId.get(r.to);
    if (!a || !b) throw new Error(`_domain-model: 관계가 모르는 모델을 가리킨다 — "${r.from}" → "${r.to}"`);
    return { r, a, b, ...anchorSides(a, b) };
  });
  const slots = new Map<string, number>();
  for (const e of sided) {
    slots.set(`${e.a.id}:${e.fromSide}`, (slots.get(`${e.a.id}:${e.fromSide}`) ?? 0) + 1);
    slots.set(`${e.b.id}:${e.toSide}`, (slots.get(`${e.b.id}:${e.toSide}`) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  const take = (key: string) => {
    const i = seen.get(key) ?? 0;
    seen.set(key, i + 1);
    return i;
  };
  const wired = sided.map((e) => {
    const fk = `${e.a.id}:${e.fromSide}`;
    const tk = `${e.b.id}:${e.toSide}`;
    const raw = spread(e.a, e.fromSide, take(fk), slots.get(fk)!);
    return {
      ...e,
      fromPt: relationEdgeProps(e.r.kind).markerStart ? pushOut(raw, e.fromSide, MARKER_CLEARANCE) : raw,
      toPt: spread(e.b, e.toSide, take(tk), slots.get(tk)!),
    };
  });

  return (
    <g data-rz-domain-model="">
      {(spec.groups ?? []).map((g) => {
        const members = g.members.map((id) => layout.byId.get(id)).filter((b): b is DomainBox => !!b);
        if (!members.length) throw new Error(`_domain-model: 경계 "${g.id}" 가 아무 모델도 안 감싼다`);
        const x = Math.min(...members.map((b) => b.x)) - groupPad;
        const y = Math.min(...members.map((b) => b.y)) - groupPad;
        const w = Math.max(...members.map((b) => b.x + b.width)) + groupPad - x;
        const h = Math.max(...members.map((b) => b.y + b.height)) + groupPad - y;
        return <Frame key={g.id} x={x} y={y} width={w} height={h} label={g.label} dashed />;
      })}

      {wired.map(({ r, a, b, fromPt, toPt }, i) => {
        // 계층 엣지는 **세로로 먼저** 나간다. 상류 `orthogonalPath` 는 언제나 가로 먼저라
        // (`dist/index.js:281`) 위아래 변에서 나가는 선이 칸의 밑변을 따라 옆으로 흐르고,
        // 그 위에 놓인 다이아·삼각형 마커가 칸 테두리에 묻힌다(실측). `waypoints` 로 꺾는다 —
        // 상류 `buildPath`(`:313`)가 waypoints 를 그대로 폴리라인으로 잇는다.
        const waypoints =
          a.depth === b.depth
            ? undefined
            : [
                { x: fromPt.x, y: (fromPt.y + toPt.y) / 2 },
                { x: toPt.x, y: (fromPt.y + toPt.y) / 2 },
              ];
        const cfg = relationEdgeProps(r.kind);
        // 포함·집합은 **전체 쪽 다이아가 표기의 전부**다. 상류 `edgeConfig` 는 그 둘에
        // `markerEnd` 를 안 주고, `Edge` 의 기본값 `arrow` 가 그대로 붙어 부분 쪽에 화살촉이
        // 생긴다(실측 — 상류 `ClassDiagram` 도 같은 그림이 나온다). UML 이 아니므로 여기서 끈다.
        const markerEnd = cfg.markerEnd ?? (cfg.markerStart ? 'none' : 'arrow');
        const fromCardAt = cardinalityAt(a, fromPt, toPt);
        const toCardAt = cardinalityAt(b, toPt, fromPt);
        return (
          <g key={`${r.from}-${r.to}-${i}`}>
            <Edge from={fromPt} to={toPt} routing="orthogonal" waypoints={waypoints} {...cfg} markerEnd={markerEnd} />
            {r.fromCard && <Label x={fromCardAt.x} y={fromCardAt.y} label={r.fromCard} fontSize={10} />}
            {r.toCard && <Label x={toCardAt.x} y={toCardAt.y} label={r.toCard} fontSize={10} />}
          </g>
        );
      })}

      {layout.boxes.map((b) => (
        <Box
          key={b.id}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          name={b.entity.name}
          stereotype={b.entity.stereotype}
          attributes={b.entity.attributes ?? []}
          methods={b.entity.methods ?? []}
        />
      ))}
      {children}
    </g>
  );
}

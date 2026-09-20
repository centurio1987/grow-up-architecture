/**
 * 대비 감사 게이트 — 조합별로 기준을 나눠 검사한다.
 *
 * `auditContrast`(catalog)는 본문 텍스트 쌍(foreground.base on background.base) 하나만 본다.
 * 이 프로젝트는 채움 위 라벨·크림 위 딥톤·구분선까지 색을 쓰므로, 조합마다 필요한 기준이 다르다.
 * 전부 AAA로 묶으면 구분선이 과도하게 진해지고, 전부 AA로 낮추면 노드 라벨이 흐려진다.
 *
 * 기준 근거:
 *   - 본문급 텍스트(노드 라벨·강조 텍스트) → WCAG AAA 7.0
 *   - 보조 텍스트(INK_MUTED) → WCAG AA 4.5
 *   - 구조를 지는 키라인·경계 → WCAG 1.4.11 Non-text Contrast 3.0
 *   - 딥톤 on 액센트 채움 → **금지**를 회귀로 고정(오용 방지)
 *
 * ## 실측이 바꾼 것 (게이트를 낮춘 게 아니라 역할을 정정한 것)
 *
 * 최초 설계는 전 조합 AAA를 가정했으나 실측에서 둘이 갈렸다. 둘 다 **기존 템플릿에서 그대로
 * 가져온 값**이라 이 style guide가 만든 결함이 아니고, 템플릿을 손대지 않기로 했으므로(D1)
 * 색을 바꾸는 대신 **역할을 좁혀** 고정한다.
 *
 *   - `INK_MUTED` #6E6A5E on 크림 = 4.84 → AAA 미달, AA 충족. 보조 텍스트로만 쓴다.
 *     따라서 이 시스템의 정직한 선언은 `contrastIntent: 'aa'`다. 'aaa'는 과대주장이 된다.
 *   - `INK_SUBTLE` #9A9483 = 2.71 · `KHAKI_LINE` #E0D6B8 = 1.41 → 텍스트로도 구조선으로도
 *     못 쓴다. WCAG가 면제하는 용도(disabled 상태, 순수 장식 구분선)로 **역할을 못박고**
 *     EXEMPT 목록에 올려 실측값을 계속 보고한다. 구조는 언제나 2px 순잉크가 진다(M4).
 *     이 둘이 텍스트나 구조로 새는 것은 M7이 구조적으로 막는다.
 */

import { contrastRatio } from '@centurio1987/bbangto-ui-tokens';
import { resumeVizStyleGuide } from './resume.viz';
import * as T from './tokens';

export interface MatrixViolation {
  /** 행렬 id — M1~M6. */
  readonly rule: string;
  readonly pair: string;
  readonly required: number;
  /** 측정 불가(파싱 실패)면 null — 통과가 아니라 위반으로 취급한다. */
  readonly measured: number | null;
  readonly reason: 'below-threshold' | 'unmeasurable' | 'must-fail-but-passed';
}

interface Row {
  readonly rule: string;
  readonly pair: string;
  readonly fg: string;
  readonly bg: string;
  readonly required: number;
  /** true면 "기준을 넘으면 안 된다"는 금지 규칙이다(M5). */
  readonly mustFail?: boolean;
}

const ACCENT_FILLS: ReadonlyArray<readonly [string, string]> = [
  ['yellow', T.YELLOW],
  ['sage', T.SAGE],
  ['pink', T.PINK],
  ['blue', T.BLUE],
  ['khaki', T.KHAKI_LINE],
  ['surface-deep', T.SURFACE_DEEP],
  ['surface', T.SURFACE],
];

const DEEP_PAIRS: ReadonlyArray<readonly [string, string, string]> = [
  ['yellow', T.YELLOW_DEEP, T.YELLOW],
  ['sage', T.SAGE_DEEP, T.SAGE],
  ['pink', T.PINK_DEEP, T.PINK],
  ['blue', T.BLUE_DEEP, T.BLUE],
];

/** mono preset(M6)에서 실제로 쓰이는 채움 — resume.viz.tsx의 nodeFills와 같아야 한다. */
const MONO_FILLS: ReadonlyArray<readonly [string, string]> = [
  ['mono-white', '#FFFFFF'],
  ['mono-tint', '#F0EEE8'],
];

function buildMatrix(): Row[] {
  const rows: Row[] = [];

  // M1 — 잉크 라벨 on 액센트/표면 채움. 도식 노드 라벨이라 본문급이 필요하다.
  for (const [name, fill] of ACCENT_FILLS) {
    rows.push({ rule: 'M1', pair: `ink on ${name}`, fg: T.INK, bg: fill, required: 7 });
  }

  // M2 — 딥톤 on 크림. 크림 위 강조 텍스트.
  for (const [name, deep] of DEEP_PAIRS) {
    rows.push({ rule: 'M2', pair: `${name}-deep on canvas`, fg: deep, bg: T.CANVAS, required: 7 });
  }

  // M3 — 보조 텍스트는 AA. (subtle은 텍스트가 아니다 → EXEMPT)
  for (const [bgName, bg] of [
    ['canvas', T.CANVAS],
    ['surface', T.SURFACE],
    ['surface-deep', T.SURFACE_DEEP],
  ] as const) {
    rows.push({ rule: 'M3', pair: `ink-muted on ${bgName}`, fg: T.INK_MUTED, bg, required: 4.5 });
  }

  // M4 — 구조를 지는 키라인. 이 motif에서 구조는 언제나 2px 순잉크다.
  rows.push({ rule: 'M4', pair: 'ink keyline on canvas', fg: T.INK, bg: T.CANVAS, required: 3 });
  rows.push({ rule: 'M4', pair: 'ink keyline on surface', fg: T.INK, bg: T.SURFACE, required: 3 });
  rows.push({ rule: 'M4', pair: 'ink keyline on surface-deep', fg: T.INK, bg: T.SURFACE_DEEP, required: 3 });

  // M5 — 딥톤을 같은 계열 채움 위에 얹는 것은 금지다. "AAA에 못 미친다"를 회귀로 고정한다.
  for (const [name, deep, fill] of DEEP_PAIRS) {
    rows.push({ rule: 'M5', pair: `${name}-deep on ${name}-fill (금지)`, fg: deep, bg: fill, required: 7, mustFail: true });
  }

  // M6 — mono colorway 재실행.
  for (const [name, fill] of MONO_FILLS) {
    rows.push({ rule: 'M6', pair: `ink on ${name}`, fg: T.INK, bg: fill, required: 7 });
  }
  rows.push({ rule: 'M6', pair: 'ink-muted on mono-white', fg: T.INK_MUTED, bg: '#FFFFFF', required: 4.5 });
  rows.push({ rule: 'M6', pair: 'ink keyline on mono-white', fg: T.INK, bg: '#FFFFFF', required: 3 });

  return rows;
}

export const CONTRAST_MATRIX: readonly Row[] = buildMatrix();

/**
 * WCAG 면제 용도로 **역할을 못박은** 저대비 토큰. 게이트하지 않고 실측만 계속 보고한다.
 * 게이트에서 빼는 근거는 "낮아도 봐준다"가 아니라 "텍스트도 구조선도 아니다"이며,
 * 그 전제가 깨지지 않는지는 M7이 구조적으로 검사한다.
 */
export const EXEMPT: ReadonlyArray<{ token: string; on: string; role: string; fg: string; bg: string }> = [
  { token: 'INK_SUBTLE', on: 'canvas', role: 'disabled 상태 전경 — WCAG 1.4.3 면제', fg: T.INK_SUBTLE, bg: T.CANVAS },
  { token: 'INK_SUBTLE', on: 'surface', role: 'disabled 상태 전경 — WCAG 1.4.3 면제', fg: T.INK_SUBTLE, bg: T.SURFACE },
  { token: 'KHAKI_LINE', on: 'canvas', role: '순수 장식 구분선 — 구조는 2px 잉크가 진다', fg: T.KHAKI_LINE, bg: T.CANVAS },
  { token: 'KHAKI_LINE', on: 'surface', role: '순수 장식 구분선 — 구조는 2px 잉크가 진다', fg: T.KHAKI_LINE, bg: T.SURFACE },
];

/** 위반 목록. 빈 배열이면 통과다. */
export function auditResumeStyleGuides(): MatrixViolation[] {
  const out: MatrixViolation[] = [];
  for (const row of CONTRAST_MATRIX) {
    const measured = contrastRatio(row.fg, row.bg);
    if (measured === null) {
      out.push({ rule: row.rule, pair: row.pair, required: row.required, measured: null, reason: 'unmeasurable' });
      continue;
    }
    if (row.mustFail) {
      if (measured >= row.required) {
        out.push({ rule: row.rule, pair: row.pair, required: row.required, measured, reason: 'must-fail-but-passed' });
      }
      continue;
    }
    if (measured < row.required) {
      out.push({ rule: row.rule, pair: row.pair, required: row.required, measured, reason: 'below-threshold' });
    }
  }
  return out;
}

/**
 * M7 — 구조 검사. EXEMPT 토큰이 텍스트·구조선으로 새지 않는지를 **값이 아니라 구조로** 막는다.
 * viz foundation의 모든 텍스트/키라인 색이 순잉크인지 실제 객체에서 확인한다.
 */
export function auditVizStructure(): MatrixViolation[] {
  const out: MatrixViolation[] = [];
  const f = resumeVizStyleGuide.foundations;
  const fail = (pair: string, reason: MatrixViolation['reason'] = 'below-threshold') =>
    out.push({ rule: 'M7', pair, required: 0, measured: null, reason });

  for (const [kind, n] of Object.entries(f.node)) {
    if (n.keyline !== T.INK) fail(`node.${kind}.keyline이 순잉크가 아니다 (${n.keyline})`);
    if (n.tagColor !== T.INK) fail(`node.${kind}.tagColor가 순잉크가 아니다 (${n.tagColor})`);
  }
  if (f.shape.stroke !== T.INK) fail(`shape.stroke가 순잉크가 아니다 (${f.shape.stroke})`);
  if (f.edge.stroke !== T.INK) fail(`edge.stroke가 순잉크가 아니다 (${f.edge.stroke})`);
  if (f.boundary.stroke !== T.INK) fail(`boundary.stroke가 순잉크가 아니다 (${f.boundary.stroke})`);
  if (f.boundary.labelColor !== T.INK) fail(`boundary.labelColor가 순잉크가 아니다 (${f.boundary.labelColor})`);
  for (const lv of ['l1', 'l2', 'l3'] as const) {
    if (f.c4[lv].labelColor !== T.INK) fail(`c4.${lv}.labelColor가 순잉크가 아니다 (${f.c4[lv].labelColor})`);
  }

  // 폰트 정체성 — Provider가 Pretendard·JetBrains Mono를 @import로 로드해도 적용되면 안 된다.
  for (const [k, v] of [
    ['titleFont', f.typography.titleFont],
    ['monoFont', f.typography.monoFont],
  ] as const) {
    if (!v.includes('IBM Plex')) fail(`typography.${k}에 IBM Plex가 없다 (${v})`);
    if (/Pretendard|JetBrains/.test(v)) fail(`typography.${k}에 타 폰트가 섞였다 (${v})`);
  }

  // 액센트는 4색이다 — p1~p4가 서로 다르고 전부 tokens의 액센트여야 한다.
  const accents = new Set([T.PINK, T.SAGE, T.YELLOW, T.BLUE]);
  for (const k of ['p1', 'p2', 'p3', 'p4'] as const) {
    if (!accents.has(f.palette[k] as never)) fail(`palette.${k}가 정본 액센트 4색 밖이다 (${f.palette[k]})`);
  }

  return out;
}

/** 사람이 읽는 실측 표 — `bun run design/style-guide/audit.cli.ts`가 쓴다. */
export function formatMatrix(): string {
  const lines = ['| rule | pair | required | measured | verdict |', '|---|---|---|---|---|'];
  for (const row of CONTRAST_MATRIX) {
    const m = contrastRatio(row.fg, row.bg);
    const ok = m === null ? false : row.mustFail ? m < row.required : m >= row.required;
    const req = row.mustFail ? `< ${row.required}` : `≥ ${row.required}`;
    lines.push(`| ${row.rule} | ${row.pair} | ${req} | ${m === null ? '측정 불가' : m.toFixed(2)} | ${ok ? 'PASS' : 'FAIL'} |`);
  }
  return lines.join('\n');
}

/**
 * 이력서 SSOT 프로젝트의 원시 시각 상수 — **리터럴 hex는 이 파일에만 존재한다.**
 *
 * 출처: `templates/{이력서,경력기술서,포트폴리오-PDF,자기소개서}.template.html` 4벌에서
 * 값이 일치하게 실측된 것들이다. 이 프로젝트가 실제로 인쇄하는 유일한 시각 언어이므로
 * style guide(UI·viz)는 전부 여기서 파생한다.
 *
 * 여기 없는 색을 style guide나 도식에 직접 쓰지 마라 — 그 순간 SSOT가 깨진다.
 */

/* ── 잉크 ─────────────────────────────────────────────── */
/** 본문 잉크. 4벌 템플릿 공통(경력기술서에서만 258회). */
export const INK = '#1C1B17';
/** 보조 텍스트. */
export const INK_MUTED = '#6E6A5E';
/** 흐린 잉크 — 캡션 전용. */
export const INK_SUBTLE = '#9A9483';

/* ── 지면 ─────────────────────────────────────────────── */
/** 크림 배경(정본). 순백을 쓰면 이 프로젝트의 정체성이 사라진다. */
export const CANVAS = '#FAF2DD';
/** 카드 표면(off-white). */
export const SURFACE = '#FFFCF2';
/**
 * 눌린 표면 — 원 motif에 없던 신규 파생(크림과 카키 사이).
 * 최초 `#F1EAD3`은 INK_MUTED 대비가 4.49로 AA에 0.01 모자랐다. 템플릿 값이 아니라
 * 이 파일이 소유한 토큰이므로 한 단계 밝혀 4.58로 올렸다(감사 M3).
 */
export const SURFACE_DEEP = '#F3ECD7';
/** 카키 구분선. */
export const KHAKI_LINE = '#E0D6B8';
/**
 * 순백. 크림 축 **밖**이라 지면으로는 쓰지 않는다 — screen preset의 최상단 표면과
 * mono colorway의 종이색 두 군데뿐이다.
 */
export const WHITE = '#FFFFFF';

/* ── 액센트 4색 + 딥톤 짝 (정본) ─────────────────────── */
/** 채움은 액센트, 그 위 텍스트는 항상 INK. 딥톤은 **크림 위 텍스트 전용**이다. */
export const YELLOW = '#E9C766';
export const YELLOW_DEEP = '#5A4A13';
export const SAGE = '#C2D3B4';
export const SAGE_DEEP = '#2C4A3A';
export const PINK = '#ECC3C8';
export const PINK_DEEP = '#5A3A40';
export const BLUE = '#BBCCE0';
export const BLUE_DEEP = '#27465A';

/* ── 파생톤 12종 ──────────────────────────────────────── */
// 규칙(OKLCH, H 불변):
//   hover  = L × 0.93
//   active = L × 0.86
//   subtle = L + (1 − L) × 0.60,  C × 0.45
// 값은 `bun run design/style-guide/derive.ts --write`가 아래 블록에 리터럴로 굽는다.
// 규칙은 derive.ts에, 값은 여기에 — 그래서 SSOT도 안 깨지고 드리프트도 안 생긴다.
// `derive.ts --check`(audit.test.ts가 호출)가 재계산값과 이 블록의 일치를 강제한다.
// 손으로 고치지 마라.
// <derived:begin>
export const YELLOW_HOVER = '#D6B452';
export const YELLOW_ACTIVE = '#C3A13E';
export const YELLOW_SUBTLE = '#F8E9C1';
export const SAGE_HOVER = '#AFC0A1';
export const SAGE_ACTIVE = '#9DAD8F';
export const SAGE_SUBTLE = '#E6EEDF';
export const PINK_HOVER = '#D8B0B5';
export const PINK_ACTIVE = '#C59DA2';
export const PINK_SUBTLE = '#F9E6E8';
export const BLUE_HOVER = '#A9B9CD';
export const BLUE_ACTIVE = '#96A7BA';
export const BLUE_SUBTLE = '#E3EBF4';
// <derived:end>

/* ── 웜 중립 램프 ─────────────────────────────────────── */
/**
 * `BbangtoFoundation.palette.neutral`용 0~100 램프. 회색 축이 아니라 **크림/잉크 축**이다
 * — 회색을 섞으면 크림 지면 위에서 탁해진다. 양 끝과 마디는 위 정본 토큰을 그대로 쓰고,
 * 사이 값만 보간했다.
 */
export const NEUTRAL_RAMP = {
  0: '#000000',
  5: '#0E0D0B',
  10: INK,
  20: '#2C2A23',
  30: '#413E34',
  40: '#55513F',
  50: INK_MUTED,
  60: '#877F6C',
  70: INK_SUBTLE,
  80: '#C4BC9F',
  90: KHAKI_LINE,
  95: SURFACE_DEEP,
  99: CANVAS,
  100: SURFACE,
} as const;

/* ── mono colorway ────────────────────────────────────── */
/** 흑백 복사·팩스 대비 안전 변형 전용 색. 크림 축 밖이라 따로 둔다. */
export const MONO = {
  /** 지면·기본 채움. */
  paper: WHITE,
  /** 구분되는 채움(external·database·decision). */
  tint: '#F0EEE8',
  /** 그리드. */
  grid: '#E6E3DA',
  /** 하드 섀도 — 흑백에서는 순흑이 또렷하다. */
  shadow: '#000000',
  /** palette p4 — 잉크 4단계 중 가장 옅은 단. */
  p4: '#C9C4B4',
} as const;

/* ── 타이포 ───────────────────────────────────────────── */
export const FONT_SANS = "'IBM Plex Sans KR','IBM Plex Sans',system-ui,-apple-system,sans-serif";
export const FONT_MONO = "'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

/* ── 조형 ─────────────────────────────────────────────── */
/** 2px 순잉크 키라인. */
export const BORDER_W = 2;
/** 블러 0의 하드 오프셋 섀도 — 이 motif의 시그니처. */
export const HARD = (n: number): string => `${n}px ${n}px 0 ${INK}`;

/* ── 의미색 계약 ──────────────────────────────────────── */
/**
 * 원 motif에 problem/solution/warn/info 체계가 없어 신규 정의한 것.
 * 액센트 4색을 의미에 **1:1 고정 배정**하며, 장식용 자유 배색을 금지한다.
 * `surface`는 채움, `ink`는 크림 위 강조 텍스트다 — 딥톤을 채움 위에 얹으면 대비가 무너진다.
 */
export const SEMANTIC = {
  problem: { surface: PINK, ink: PINK_DEEP },
  solution: { surface: SAGE, ink: SAGE_DEEP },
  warn: { surface: YELLOW, ink: YELLOW_DEEP },
  info: { surface: BLUE, ink: BLUE_DEEP },
} as const;

/** 파생톤 생성 대상 — derive.ts와 audit.ts가 공유하는 목록. */
export const ACCENT_BASES = {
  YELLOW,
  SAGE,
  PINK,
  BLUE,
} as const;

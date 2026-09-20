/**
 * `resume-cream-ink-01` — 이 프로젝트의 UI style guide.
 *
 * bbangto-ui의 `StyleGuide` 인터페이스로 이 저장소가 **이미 인쇄하고 있는** visual motif를
 * 선언한 것이다: 크림 지면 + 순잉크 2px 키라인 + radius 0 + 블러 없는 오프셋 섀도 +
 * IBM Plex + 의미에 1:1 고정 배정된 파스텔 액센트 4색.
 *
 * 색은 전부 `tokens.ts`에서 온다 — 이 파일에 리터럴 hex를 쓰지 마라.
 */

import type { StyleGuide } from '@centurio1987/bbangto-ui-core';
import { makeColorway, makeFoundations, makeMotifWrappers, makeSemantic } from '@centurio1987/bbangto-ui-style-guide-catalog';
import type { BbangtoFoundation, FoundationPreset, SemanticColors } from '@centurio1987/bbangto-ui-tokens';
import * as T from './tokens';

/* ── semantic ─────────────────────────────────────────── */

/**
 * 상태색(error/success/warning)을 파스텔 채움 + 잉크 라벨로 **전면 대체**한다.
 * 빌더 기본값은 강채도 + 흰 글씨라 크림 지면과 충돌한다.
 */
const semantic: SemanticColors = makeSemantic({
  bg: T.CANVAS,
  bgElevated: T.SURFACE,
  bgSunken: T.SURFACE_DEEP,
  overlay: 'rgba(28,27,23,0.55)',

  fg: T.INK,
  fgMuted: T.INK_MUTED,
  fgSubtle: T.INK_SUBTLE,
  fgInverse: T.CANVAS,

  // 보더는 순잉크가 기본이다 — 이 motif에서 테두리는 장식이 아니라 구조다.
  border: T.INK,
  borderMuted: T.KHAKI_LINE,
  borderStrong: T.INK,
  focus: T.YELLOW,

  primaryBase: T.YELLOW,
  primaryHover: T.YELLOW_HOVER,
  primaryActive: T.YELLOW_ACTIVE,
  primarySubtle: T.YELLOW_SUBTLE,
  primaryFg: T.INK,

  accent: T.SAGE,
  accent2: T.PINK,
  accent3: T.BLUE,

  error: { base: T.PINK, hover: T.PINK_HOVER, active: T.PINK_ACTIVE, subtle: T.PINK_SUBTLE, foreground: T.INK },
  success: { base: T.SAGE, hover: T.SAGE_HOVER, active: T.SAGE_ACTIVE, subtle: T.SAGE_SUBTLE, foreground: T.INK },
  warning: { base: T.YELLOW, hover: T.YELLOW_HOVER, active: T.YELLOW_ACTIVE, subtle: T.YELLOW_SUBTLE, foreground: T.INK },
  disabled: { background: T.SURFACE_DEEP, foreground: T.INK_SUBTLE, border: T.KHAKI_LINE },

  // 8종 카테고리를 액센트 4색으로 접는다 — 5번째 색을 만들지 않기 위해서다.
  category: {
    planning: T.BLUE,
    architecture: T.SAGE,
    strategy: T.YELLOW,
    tech: T.BLUE,
    design: T.PINK,
    research: T.BLUE,
    quality: T.SAGE,
    leadership: T.YELLOW,
  },
});

/* ── foundation ───────────────────────────────────────── */

const neutral = T.NEUTRAL_RAMP;

export const resumeFoundation: BbangtoFoundation = makeFoundations({
  name: 'resume-cream-ink-01',
  description: '크림 지면 + 순잉크 하드코너 네오브루탈리즘. IBM Plex, radius 0, 블러 없는 오프셋 섀도.',
  semantic,
  fontSans: T.FONT_SANS,
  fontMono: T.FONT_MONO,
  // 각진 모서리가 이 motif의 정체성이라 none~xl은 전부 0이다.
  // **`full`만 예외**다 — T1.3 실렌더 검증에서 `full: 0px`이 Spinner를 사각형으로,
  // Avatar를 네모로, Switch를 각진 막대로 만들었다. 원형을 전제한 컴포넌트는 0으로 덮으면
  // 형태 자체가 의미를 잃는다(회전하는 사각형은 로딩으로 읽히지 않는다).
  // 조형 일관성보다 컴포넌트가 제 역할을 하는 게 우선이다.
  radius: { none: '0px', sm: '0px', md: '0px', lg: '0px', xl: '0px', full: '9999px' },
  shadow: { none: 'none', sm: T.HARD(2), md: T.HARD(4), lg: T.HARD(5), xl: T.HARD(8) },
  // 템플릿 실측 빈도에서 뽑은 스케일(52/30/18/13/12.5/11px).
  typeScale: {
    display: { fontSize: '52px', lineHeight: '1.02', letterSpacing: '6px', fontWeight: 700 },
    h1: { fontSize: '30px', lineHeight: '1.15', letterSpacing: '2px', fontWeight: 700 },
    h2: { fontSize: '18px', lineHeight: '1.30', letterSpacing: '1px', fontWeight: 700 },
    h3: { fontSize: '13px', lineHeight: '1.40', letterSpacing: '0.08em', fontWeight: 700 },
    body: { fontSize: '12.5px', lineHeight: '1.65', letterSpacing: '0', fontWeight: 400 },
    meta: { fontSize: '11px', lineHeight: '1.40', letterSpacing: '0.06em', fontWeight: 500 },
  },
  neutral,
});

/**
 * 스크린 열람용 — 지면을 한 단계 밝혀 백라이트 눈부심을 줄인다.
 * `makeColorway`가 비색상 토큰(타이포·radius·shadow) 복사를 강제하므로 조형은 불변이다.
 */
const screenFoundation: BbangtoFoundation = makeColorway(resumeFoundation, {
  name: 'resume-cream-ink-01-screen',
  description: '스크린 열람용 — 표면을 지면으로 올린 밝은 변형. 잉크·조형은 불변.',
  semantic: {
    ...semantic,
    background: { base: T.SURFACE, elevated: T.WHITE, sunken: T.CANVAS, overlay: 'rgba(28,27,23,0.55)' },
  },
  neutral,
});

/* ── 확장 CSS 변수 ────────────────────────────────────── */

/** `SemanticColors`에 `info` 슬롯이 없어 의미색 4종을 여기서 완결한다. */
const EXT: Record<string, string> = {
  '--bbangto-ext-semantic-problem': T.SEMANTIC.problem.surface,
  '--bbangto-ext-semantic-problem-ink': T.SEMANTIC.problem.ink,
  '--bbangto-ext-semantic-solution': T.SEMANTIC.solution.surface,
  '--bbangto-ext-semantic-solution-ink': T.SEMANTIC.solution.ink,
  '--bbangto-ext-semantic-warn': T.SEMANTIC.warn.surface,
  '--bbangto-ext-semantic-warn-ink': T.SEMANTIC.warn.ink,
  '--bbangto-ext-semantic-info': T.SEMANTIC.info.surface,
  '--bbangto-ext-semantic-info-ink': T.SEMANTIC.info.ink,
  '--bbangto-ext-keyline': `${T.BORDER_W}px solid ${T.INK}`,
  '--bbangto-ext-shadow-ink': T.INK,
  '--bbangto-ext-rule': T.KHAKI_LINE,
};

const foundationPresets: readonly FoundationPreset[] = [
  { key: 'print', label: 'Print (Cream)', foundations: resumeFoundation, extendedFoundations: EXT },
  { key: 'screen', label: 'Screen (Paper)', foundations: screenFoundation, extendedFoundations: EXT },
];

/* ── wrapperComponents ────────────────────────────────── */

const wrapperComponents = makeMotifWrappers({
  styleId: 'resume-cream-ink-01',
  displayPrefix: 'ResumeCream',
  cardClass: 'rz-card',
  buttonClass: 'rz-button',
  css: `
    .rz-card {
      background: var(--bbangto-semantic-background-elevated);
      border: var(--bbangto-ext-keyline);
      box-shadow: var(--bbangto-shadow-md);
      border-radius: 0;
    }
    .rz-button {
      background: var(--bbangto-semantic-primary-base);
      color: var(--bbangto-semantic-primary-foreground);
      border: var(--bbangto-ext-keyline);
      box-shadow: var(--bbangto-shadow-sm);
      border-radius: 0;
      font-family: var(--bbangto-typography-font-family-mono);
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .rz-button:hover { background: var(--bbangto-semantic-primary-hover); }
    /* 눌림은 색이 아니라 물리로 표현한다 — 섀도를 없애고 그만큼 이동시킨다. */
    .rz-button:active { background: var(--bbangto-semantic-primary-active); box-shadow: none; transform: translate(2px, 2px); }
  `,
  tag: {
    defaultTone: 'neutral',
    baseStyle: {
      fontFamily: T.FONT_MONO,
      fontSize: '11px',
      letterSpacing: '.06em',
      textTransform: 'uppercase',
      padding: '2px 7px',
      borderRadius: 0,
      border: `${T.BORDER_W}px solid ${T.INK}`,
      color: T.INK,
    },
    tones: {
      neutral: { background: T.SURFACE },
      problem: { background: T.SEMANTIC.problem.surface },
      solution: { background: T.SEMANTIC.solution.surface },
      warn: { background: T.SEMANTIC.warn.surface },
      info: { background: T.SEMANTIC.info.surface },
    },
  },
});

/* ── StyleGuide ───────────────────────────────────────── */

export const resumeStyleGuide: StyleGuide = {
  name: 'resume-cream-ink-01',
  description:
    'Resume SSOT house style — cream ground (#FAF2DD) with pure-ink (#1C1B17) 2px keylines, zero radius, ' +
    'hard non-blurred offset shadows, IBM Plex Sans KR/Mono, four pastel accents each paired with a deep ink tone.',
  foundations: resumeFoundation,
  extendedFoundations: EXT,
  foundationPresets,
  defaultFoundationKey: 'print',
  wrapperComponents,

  guidelines: {
    surface: {
      summary: '크림 지면 위 표면 카드 + 2px 순잉크 키라인 + 블러 없는 오프셋 섀도. 모서리는 항상 직각이다.',
      dos: [
        '카드는 표면(#FFFCF2) + 2px 잉크 보더 + 하드 섀도(4px)',
        '구분선은 카키(#E0D6B8)',
        '섀도는 잉크 단색 오프셋 — 블러 0',
      ],
      donts: [
        'radius none~xl은 전부 0 — 카드·버튼·태그·입력에 둥근 모서리 금지',
        '블러·그라디언트 섀도 금지',
        '순백(#FFFFFF) 지면 금지 — 크림 정체성을 잃는다',
      ],
      exception: [
        'radius.full(9999px)만 예외다. Spinner·Avatar·Switch처럼 **원형이 곧 의미**인 컴포넌트에만 쓰고,',
        '카드·버튼·태그를 둥글게 만드는 데 전용하지 마라. (T1.3 실렌더 검증에서 결정)',
        '부작용 하나: core의 Badge도 radius.full을 써서 pill로 나온다. 분류 표시에는 Badge 대신',
        '이 style guide의 Tag 래퍼(각진 mono 대문자)를 쓴다.',
      ],
    },
    color: {
      summary:
        '지면·잉크는 고정이다. 액센트 4색은 의미(problem/solution/warn/info)에 1:1 고정 배정하며 장식용 자유 배색을 금지한다.',
      dos: ['액센트는 채움으로만, 그 위 텍스트는 잉크로', '딥톤 짝은 크림 위 강조 텍스트로만', '색과 라벨을 항상 병기'],
      donts: ['액센트 채움 위에 딥톤 텍스트 금지(6.3:1로 AAA 미달)', '의미 배정 밖 액센트 사용 금지', '5번째 액센트 도입 금지'],
    },
    typography: {
      summary: 'IBM Plex Sans KR 본문 / IBM Plex Mono 라벨·수치. display는 52px w700에 자간 6px의 넓은 헤드라인이다.',
      dos: ['라벨·태그·수치는 mono + 대문자 + 자간', '본문 12.5px / 1.65'],
      donts: ['Pretendard·JetBrains Mono 등 타 폰트 유입 금지'],
      requiredFonts: ['IBM Plex Sans KR', 'IBM Plex Mono'],
    },
    accessibility: {
      summary:
        '본문 쌍(잉크 on 크림)은 15.44:1로 AAA다. 다만 등급이 층으로 갈리니 역할을 지켜야 한다 — ' +
        '액센트 채움 위 잉크 라벨은 worst-case 10.53:1로 AAA, 보조 텍스트(INK_MUTED)는 4.84:1로 AA까지다.',
      dos: ['채움 위 텍스트는 항상 잉크', '딥톤은 크림 위에서만', 'INK_MUTED는 보조 텍스트까지만 — 본문에 쓰지 말 것'],
      donts: [
        '딥톤을 액센트 채움 위에 얹지 말 것(5.3~6.3:1)',
        'INK_SUBTLE(2.71:1)을 텍스트로 쓰지 말 것 — disabled 상태 전용이다',
        'KHAKI_LINE(1.41:1)에 구조를 맡기지 말 것 — 구조는 2px 순잉크가 진다',
      ],
      verifiedBy: ['design/style-guide/audit.ts — 대비 행렬 M1~M6 + 구조 검사 M7'],
    },
  },

  visualMotif: {
    summary:
      '크림 지면 · 순잉크 2px 키라인 · radius 0 · 블러 없는 오프셋 섀도의 문서형 네오브루탈리즘. ' +
      '액센트 4색은 의미에 고정 배정되고 언제나 잉크 라벨로 읽힌다.',
    components: {
      Card: {
        description:
          '표면 카드. 2px 잉크 보더 + 4px 하드 오프셋 섀도로 지면에서 물리적으로 들려 있다.',
        specs: ['border 2px solid #1C1B17', 'box-shadow 4px 4px 0 #1C1B17', 'border-radius 0', 'background #FFFCF2'],
      },
      Button: {
        description:
          '옐로 채움 + 잉크 보더 + 2px 하드 섀도. active에서 섀도를 없애고 오프셋만큼 이동시켜 눌림을 표현한다.',
        specs: ['background #E9C766', 'box-shadow 2px 2px 0', 'active: translate(2px,2px) + shadow none', 'mono 대문자'],
      },
      Tag: {
        description: '분류 태그. mono 대문자 + 액센트 채움 + 잉크 보더/라벨이며 tone이 의미색 계약을 그대로 노출한다.',
        specs: ['IBM Plex Mono 11px', 'letter-spacing .06em', 'tones: neutral | problem | solution | warn | info'],
      },
    },
  },

  meta: {
    displayName: 'Resume_Cream_Ink_01',
    family: 'structural-raw',
    summary: '크림 지면 + 순잉크 하드코너 네오브루탈리즘 — 인쇄 우선 이력서/포트폴리오 문서 전용 하우스 스타일.',
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
      'A4 인쇄·PDF 산출물에서 조형 개성과 가독성을 동시에 요구할 때 쓴다.',
      '이력서·경력기술서·포트폴리오처럼 정보 밀도가 높고 흑백 복사 가능성이 있는 문서에 쓴다.',
    ],
    avoidWhen: ['다크 UI·모션 중심 웹앱에는 쓰지 마라.', '순백 지면이 규격인 기업 제출 양식에는 쓰지 마라.'],
    accessibility: { contrastIntent: 'aaa', colorblindConsidered: true, motionHeavy: false, darkFirst: false },
  },
};

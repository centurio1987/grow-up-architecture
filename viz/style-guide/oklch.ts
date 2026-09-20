/**
 * OKLCH 색 연산 + 파생톤 규칙 — **순수 함수만** 둔다(브라우저 번들 안전).
 *
 * 파일 IO와 CLI는 `derive.ts`가 맡는다. 이 분리가 필요한 이유: `index.ts`가 재export하는
 * 모듈에 `node:fs`가 섞이면 브라우저 타깃 번들이 통째로 깨진다 — 렌더 엔진이 이 style guide를
 * 브라우저로 번들하므로 그건 곧 파이프라인 정지다.
 *
 * 색 공간은 OKLCH(Björn Ottosson). sRGB의 HSL로 밝기를 옮기면 색상별로 체감 밝기가
 * 들쭉날쭉해지는데, OKLCH는 지각적으로 균일해 파스텔 4색에 같은 규칙을 걸 수 있다.
 */

import { ACCENT_BASES } from './tokens';

/* ── OKLCH 변환 ───────────────────────────────────────── */

interface RGB {
  r: number;
  g: number;
  b: number;
} // 0..1 gamma-encoded sRGB
interface LCH {
  L: number;
  C: number;
  h: number;
} // L 0..1, C 0..~0.4, h deg

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  if (h.length !== 6) throw new Error(`6자리 hex만 지원한다: ${hex}`);
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to2 = (n: number) =>
    Math.round(clamp01(n) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

export function rgbToOklch(rgb: RGB): LCH {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    L,
    C: Math.hypot(a, bb),
    h: (Math.atan2(bb, a) * 180) / Math.PI,
  };
}

export function oklchToRgb({ L, C, h }: LCH): RGB {
  const rad = (h * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    r: clamp01(linearToSrgb(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_)),
    g: clamp01(linearToSrgb(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_)),
    b: clamp01(linearToSrgb(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_)),
  };
}

/* ── 파생 규칙 ────────────────────────────────────────── */

export type ToneKind = 'hover' | 'active' | 'subtle';

/**
 * 액센트 base에서 상태 파생톤 하나를 만든다. 색상(H)은 불변이다.
 *
 * `subtle`을 "L을 절대량 더하기"로 두면 파스텔(L≈0.85)이 곧바로 흰색으로 클램프되므로,
 * 흰색까지 남은 거리의 60%만 이동하고 채도를 45%로 낮춰 "옅은 틴트"를 만든다.
 */
export function deriveTone(baseHex: string, kind: ToneKind): string {
  const lch = rgbToOklch(hexToRgb(baseHex));
  const next: LCH =
    kind === 'hover'
      ? { ...lch, L: lch.L * 0.93 }
      : kind === 'active'
        ? { ...lch, L: lch.L * 0.86 }
        : { ...lch, L: lch.L + (1 - lch.L) * 0.6, C: lch.C * 0.45 };
  return rgbToHex(oklchToRgb(next));
}

const KINDS: readonly ToneKind[] = ['hover', 'active', 'subtle'];

/** 12종 전부를 `{ YELLOW_HOVER: '#…', … }` 형태로 계산한다. */
export function deriveAll(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, base] of Object.entries(ACCENT_BASES)) {
    for (const kind of KINDS) out[`${name}_${kind.toUpperCase()}`] = deriveTone(base, kind);
  }
  return out;
}


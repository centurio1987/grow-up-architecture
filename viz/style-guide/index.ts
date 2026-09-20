/**
 * 이 프로젝트의 style guide 공개 표면.
 *
 * 소비자: `diagrams/*.tsx`(도식 저작) · `scripts/render-viz.ts`(렌더 엔진) ·
 * `design/style-guide/preview.tsx`(STYLE_GUIDE 문서) · `make-image`(구조형 이미지).
 */

export * as T from './tokens';
export { resumeFoundation, resumeStyleGuide } from './resume.ui';
export { resumeVizStyleGuide } from './resume.viz';
// 색 연산은 `oklch.ts`(순수 함수)에서만 내보낸다. `derive.ts`는 node:fs를 쓰므로 제외한다.
export { deriveAll, deriveTone, hexToRgb, oklchToRgb, rgbToHex, rgbToOklch } from './oklch';
export { CONTRAST_MATRIX, auditResumeStyleGuides, type MatrixViolation } from './audit';

#!/usr/bin/env bun
/**
 * 대비 감사 결과를 사람이 읽는 표로 찍는다.
 *
 *   bun run design/style-guide/audit.cli.ts
 *
 * `audit.ts`와 분리한 이유: `import.meta.main` 가드가 있으면 iife 번들에서 경고가 나고
 * 죽은 코드가 딸려 들어간다. 렌더 파이프라인이 preview.tsx → audit.ts를 브라우저로 번들하므로
 * 감사 모듈은 순수하게 유지한다.
 */

import { contrastRatio } from '@centurio1987/bbangto-ui-tokens';
import { auditResumeStyleGuides, auditVizStructure, EXEMPT, formatMatrix } from './audit';

console.log(formatMatrix());

console.log('\n### EXEMPT — 게이트 대상 아님(역할로 면제), 실측만 보고');
console.log('| token | on | measured | role |');
console.log('|---|---|---|---|');
for (const e of EXEMPT) {
  const m = contrastRatio(e.fg, e.bg);
  console.log(`| ${e.token} | ${e.on} | ${m === null ? 'n/a' : m.toFixed(2)} | ${e.role} |`);
}

const violations = [...auditResumeStyleGuides(), ...auditVizStructure()];
console.log(`\n위반 ${violations.length}건`);
if (violations.length) {
  for (const v of violations) console.error(`  [${v.rule}] ${v.pair} — ${v.reason} (측정 ${v.measured ?? 'n/a'})`);
  process.exit(1);
}

#!/usr/bin/env bun
/**
 * 칸 여백 감사 — 도식 전체의 `RoleBox` 안쪽 여백이 고른지 본다.
 *
 * 왜 있나: 칸 높이를 손으로 고르면 줄 수가 다른 칸끼리 여백이 제각각이 된다. 한 그림 안에서
 * 어떤 칸은 2.6px, 어떤 칸은 9.8px 이면 정렬이 흐트러져 보이고, 그것이 실제로 지적을 받았다
 * (`docs/viz-plan.md` §10). `_frame.tsx` 의 `roleBoxHeight` 가 기준 여백 `BOX_PAD` 로 높이를
 * 계산하므로 **`h` 를 넘기지 않은 칸은 전부 같은 값**이 나온다.
 *
 * 브라우저를 띄우지 않는다 — 여백은 기하이지 페인트가 아니라 정적 렌더로 충분하다.
 * `RoleBox` 가 `<g data-rz-pad>` 로 실제 값을 내보내고 여기서 그걸 센다.
 *
 *   bun run scripts/audit-rolebox.ts [--tolerance 0.5]
 *
 * 종료 코드: 0 전부 기준 여백 · 1 벗어난 칸이 있다(목록 출력)
 */

import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { VisualizationStyleGuideProvider } from '@centurio1987/bbangto-ui-visualization';
import { resumeVizStyleGuide } from '../viz/style-guide/resume.viz';
import { BOX_PAD } from '../viz/frame/frame';

const ROOT = new URL('..', import.meta.url).pathname;
// 이 레포는 가이드 한 편이 폴더 하나다 — 도식은 pattern-guide/<계열>/<패턴>/diagrams/ 에 산다.
const DIR = join(ROOT, 'pattern-guide');

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
};
const TOLERANCE = parseFloat(arg('tolerance', '0.5'));
/** 기준 여백 — `_frame.tsx` 의 `BOX_PAD` 하나가 정본이다. */
const BASE = BOX_PAD;

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.tsx') && !e.name.startsWith('_')) out.push(p);
  }
  return out;
}

const files = (await walk(DIR)).sort();
const off: string[] = [];
const rows: { file: string; n: number; lo: number; hi: number }[] = [];
let total = 0;
const seen = new Map<string, number>();

for (const file of files) {
  const mod = await import(file);
  const Diagram = mod.default;
  if (typeof Diagram !== 'function') continue;

  let html: string;
  try {
    html = renderToStaticMarkup(
      createElement(
        VisualizationStyleGuideProvider as any,
        { styleGuide: resumeVizStyleGuide, foundationKey: 'print' },
        createElement(Diagram),
      ),
    );
  } catch (e) {
    console.error(`[렌더 실패] ${relative(ROOT, file)}\n  ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  const pads = [...html.matchAll(/data-rz-pad="([\d.]+)"[^>]*data-rz-role="(\w+)"/g)].map((m) => ({
    pad: parseFloat(m[1]),
    role: m[2],
  }));
  total += pads.length;
  for (const p of pads) seen.set(p.pad.toFixed(1), (seen.get(p.pad.toFixed(1)) ?? 0) + 1);

  // 판정은 "기준값과 같은가"가 아니라 **한 도식 안에서 고른가**로 한다.
  // 격자를 맞추려고 칸을 통째로 키우는 것은 정당하다 — 흐트러져 보이는 것은 칸마다 다를 때다.
  if (pads.length) {
    const lo = Math.min(...pads.map((p) => p.pad));
    const hi = Math.max(...pads.map((p) => p.pad));
    rows.push({ file: relative(ROOT, file), n: pads.length, lo, hi });
    if (hi - lo > TOLERANCE) {
      const uniq = [...new Set(pads.map((p) => p.pad.toFixed(1)))].sort((a, b) => +a - +b);
      off.push(
        `${relative(ROOT, file)}  칸 ${pads.length}개 · 여백 편차 ${(hi - lo).toFixed(1)}px\n` +
          `    나온 값: ${uniq.join(' · ')}px`,
      );
    }
  }
}

console.log(`RoleBox ${total}칸 검사 · 기준 여백 ${BASE}px · 허용 편차 ${TOLERANCE}px`);
for (const r of rows) {
  const mark = r.hi - r.lo > TOLERANCE ? '✗' : '·';
  console.log(`  ${mark} ${r.file.padEnd(56)} 칸 ${String(r.n).padStart(2)} · ${r.lo.toFixed(1)}~${r.hi.toFixed(1)}px`);
}
if (off.length) {
  console.error(`\n기준을 벗어난 칸이 있는 도식 ${off.length}종\n`);
  for (const o of off) console.error(`  ${o}\n`);
  console.error('  h 를 넘기지 않으면 roleBoxHeight 가 기준 여백으로 높이를 잡는다.');
  console.error('  격자 때문에 칸을 키워야 하면 그 도식의 칸 전부에 같은 여백을 준다(roleBoxHeight 의 pad 인자).');
  process.exit(1);
}
console.log('  도식마다 여백이 고르다.');

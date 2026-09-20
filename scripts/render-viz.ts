#!/usr/bin/env bun
/**
 * 도식 렌더 엔진 — `diagrams/{project}/*.tsx` 컴포넌트 하나를 PNG로 캡처한다.
 *
 *   bun run scripts/render-viz.ts --module diagrams/lync/Foo.tsx [--name default] \
 *     [--preset print|mono] [--out assets/images/lync/foo.png] [--width 900] [--data-uri]
 *
 * 이 저장소의 **모든** 도식·구조형 이미지가 이 한 경로로 나온다(구 make-image·react-mdx-diagram 폐지).
 * 렌더 방식·페인트 문제의 배경은 `render-core.ts` 헤더 참고.
 *
 * 종료 코드
 *   0  성공
 *   1  인자·모듈 오류
 *   3  playwright 미설치
 *   5  페인트/폰트 가드 실패 — 무채색이거나 IBM Plex가 아닌 폰트가 섞였다
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import {
  assertEdgeMarkersOriented,
  assertNoFontPollution,
  bundleToIife,
  EXIT_PAINT,
  inspectEdgeGeometry,
  inspectPage,
  REPO_ROOT,
  withRenderedPage,
} from './render-core';

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (v && !v.startsWith('--')) return v;
  if (fallback !== undefined) return fallback;
  console.error(`--${name} 이 필요하다`);
  process.exit(1);
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const modulePath = resolve(arg('module'));
const exportName = arg('name', 'default');
const preset = arg('preset', 'print');
const width = parseInt(arg('width', '900'), 10);

// 기본 출력: assets/images/<project>/<Component>.png — diagrams/ 트리를 그대로 미러한다.
const rel = relative(join(REPO_ROOT, 'diagrams'), modulePath);
const defaultOut = join(REPO_ROOT, 'assets', 'images', dirname(rel), `${basename(modulePath).replace(/\.tsx?$/, '')}.png`);
const out = resolve(arg('out', defaultOut));

if (!['print', 'mono'].includes(preset)) {
  console.error(`--preset 은 print 또는 mono 다 (받은 값: ${preset})`);
  process.exit(1);
}

const imp = exportName === 'default' ? `Diagram` : `{ ${exportName} as Diagram }`;
const entry = `
import { createRoot } from 'react-dom/client';
import { VisualizationStyleGuideProvider } from '@centurio1987/bbangto-ui-visualization';
import { resumeVizStyleGuide } from ${JSON.stringify(join(REPO_ROOT, 'viz/style-guide/resume.viz.tsx'))};
import ${imp} from ${JSON.stringify(modulePath)};

createRoot(document.getElementById('root')).render(
  <VisualizationStyleGuideProvider styleGuide={resumeVizStyleGuide} foundationKey=${JSON.stringify(preset)}>
    <div data-rz-capture>
      <Diagram />
    </div>
  </VisualizationStyleGuideProvider>,
);
requestAnimationFrame(() =>
  requestAnimationFrame(() => document.documentElement.setAttribute('data-rz-mounted', '1')),
);
`;

console.log(`[1/3] 번들 — ${relative(REPO_ROOT, modulePath)}#${exportName} (${preset})`);
const js = await bundleToIife(entry);

console.log('[2/3] 렌더…');
await mkdir(dirname(out), { recursive: true });

await withRenderedPage(
  {
    js,
    waitFor: 'html[data-rz-mounted] [data-rz-capture]',
    viewport: { width: width + 64, height: 900 },
    deviceScaleFactor: 2,
    // 고정 폭을 준다. inline-block + svg{width:100%}는 shrink-to-fit 순환이 걸려
    // 도식이 제멋대로 작아진다(실측으로 확인).
    css: `body{background:transparent}
          [data-rz-capture]{display:block;width:${width}px;padding:16px}
          [data-rz-capture] svg{display:block;width:100%;height:auto}`,
  },
  async (page) => {
    const info = await inspectPage(page, '[data-rz-capture]');
    assertNoFontPollution(info);

    // 페인트 가드 — 계약 CSS가 안 붙으면 도형이 무채색으로 나온다. 그걸 조용히 통과시키지 않는다.
    const paint = await page.evaluate(() => {
      const shapes = [...document.querySelectorAll('[data-viz-part="shape"], svg path, svg rect, svg circle')];
      const fills = new Set<string>();
      for (const s of shapes) {
        const f = getComputedStyle(s).fill;
        if (f && f !== 'none') fills.add(f);
      }
      return { shapeCount: shapes.length, fills: [...fills], hasContractSheet: !!document.getElementById('bbangto-viz-contract') };
    });

    if (paint.shapeCount === 0) {
      console.error('[페인트] SVG 도형이 하나도 없다 — 컴포넌트가 실제로 그리지 않았다.');
      process.exit(EXIT_PAINT);
    }
    // 채움이 검정 하나뿐이면 계약 CSS 미적용을 의심한다(headless 기본값이 무채색이다).
    const onlyBlack = paint.fills.length > 0 && paint.fills.every((f) => /rgb\(0,\s*0,\s*0\)/.test(f));
    if (onlyBlack) {
      console.error(`[페인트] 도형 채움이 순흑뿐이다 — 계약 CSS 미적용 의심. contract sheet=${paint.hasContractSheet}`);
      process.exit(EXIT_PAINT);
    }
    // 기하 가드 — 종단 세그먼트가 길이 0인 엣지는 화살촉이 엉뚱한 방향으로 그려진다.
    // 캡처 **전에** 죽인다. 틀린 PNG가 산출물에 남으면 다음 공정이 그걸 정본으로 삼는다.
    const defects = await inspectEdgeGeometry(page);
    assertEdgeMarkersOriented(defects, relative(REPO_ROOT, modulePath));

    console.log(`      도형 ${paint.shapeCount}개 · 채움 ${paint.fills.length}종 · 폰트 ${info.fonts.length}종`);

    const el = await page.$('[data-rz-capture]');
    await el.screenshot({ path: out, omitBackground: preset === 'print' ? false : true });

    if (flag('data-uri')) {
      const buf = await Bun.file(out).arrayBuffer();
      const uri = `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
      const uriPath = out.replace(/\.png$/, '.datauri.txt');
      await writeFile(uriPath, uri);
      console.log(`      data-uri → ${relative(REPO_ROOT, uriPath)} (${(uri.length / 1024).toFixed(0)}KB)`);
    }
  },
);

console.log(`[3/3] 완료 → ${relative(REPO_ROOT, out)}`);

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
 *   6  잘림 가드 실패 — 도식 내용이 캡처 상자 밖으로 나가 PNG 에서 잘린다
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
const EXIT_CLIP = 6;

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
    // 폭 자동 맞춤 — 컴포넌트가 선언한 캔버스 폭(viewBox 또는 width)이 캡처 폭보다 크면 캡처 폭을 그만큼 넓힌다.
    // `--width` 를 사람이 기억해야 하는 구조는 네 편 중 세 편에서 오른쪽이 잘린 채 통과했다(2026-09-21). 기본값은 하한일 뿐이다.
    const intrinsic = await page.evaluate(() => {
      const svg = document.querySelector('[data-rz-capture] svg') as SVGSVGElement | null;
      if (!svg) return 0;
      const vb = svg.viewBox?.baseVal;
      return vb && vb.width > 0 ? vb.width : svg.width?.baseVal?.value || 0;
    });
    const contentWidth = await page.evaluate(() => (document.querySelector('[data-rz-capture]') as HTMLElement).clientWidth - 32);
    if (intrinsic > contentWidth + 0.5) {
      const w = Math.ceil(intrinsic) + (width - contentWidth); // 패딩·박스 모델 차이를 실측값으로 보정
      await page.setViewportSize({ width: w + 64, height: 900 });
      await page.addStyleTag({ content: `[data-rz-capture]{width:${w}px}` });
      await page.waitForTimeout(50);
      console.log(`      캔버스 폭 ${intrinsic}px > 캡처 내용 폭 ${contentWidth}px — 캡처 폭을 ${w}px 로 넓힘(자동)`);
    }

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

    // 잘림 가드 — 캡처 상자 밖으로 나간 도형·글자는 PNG 에서 소리 없이 잘린다. 참고 문서 4편 중 3편이
    // 오른쪽·아래쪽이 뜯긴 채 lint 를 통과했다(2026-09-21 실측). SVG 자식의 화면 좌표 합집합이 캡처 상자를
    // 넘으면 캡처 **전에** 죽인다 — 캔버스 폭을 줄이거나 `--width` 를 주거나 높이를 다시 재라는 뜻이다.
    const overflow = await page.evaluate(() => {
      const cap = document.querySelector('[data-rz-capture]') as HTMLElement;
      const box = cap.getBoundingClientRect();
      // 그려지지 않는 것은 뺀다 — defs·clipPath·mask·marker·symbol 안, display:none·visibility:hidden·opacity 0.
      const skipAncestor = 'defs, clipPath, mask, marker, symbol, pattern, title, desc';
      const parts = [...cap.querySelectorAll('svg *')].filter((n) => {
        if (n.closest(skipAncestor)) return false;
        if (n instanceof SVGSVGElement) return false;
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
        return true;
      });
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      const eps = 0.5;
      const offenders: string[] = [];
      for (const p of parts) {
        const rc = (p as Element).getBoundingClientRect();
        if (rc.width === 0 && rc.height === 0) continue;
        l = Math.min(l, rc.left); t = Math.min(t, rc.top); r = Math.max(r, rc.right); b = Math.max(b, rc.bottom);
        if (rc.left < box.left - eps || rc.top < box.top - eps || rc.right > box.right + eps || rc.bottom > box.bottom + eps) {
          const e = p as Element;
          const txt = (e.textContent || '').trim().slice(0, 30);
          offenders.push(`<${e.tagName}${e.id ? '#' + e.id : ''}${e.getAttribute('data-viz-part') ? ' part=' + e.getAttribute('data-viz-part') : ''}> ` +
            `${Math.round(rc.left)}..${Math.round(rc.right)}×${Math.round(rc.top)}..${Math.round(rc.bottom)}${txt ? ' "' + txt + '"' : ''}`);
        }
      }
      return {
        box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
        content: { left: l, top: t, right: r, bottom: b },
        clipped: l < box.left - eps || t < box.top - eps || r > box.right + eps || b > box.bottom + eps,
        offenders: offenders.slice(0, 6),
      };
    });
    if (overflow.clipped) {
      const f = (n: number) => Math.round(n);
      console.error(
        `[잘림] 도식 내용이 캡처 상자를 벗어난다 — 내용 ${f(overflow.content.left)}..${f(overflow.content.right)} × ` +
          `${f(overflow.content.top)}..${f(overflow.content.bottom)} / 상자 ${f(overflow.box.left)}..${f(overflow.box.right)} × ` +
          `${f(overflow.box.top)}..${f(overflow.box.bottom)} (CSS px). 캔버스 폭·높이를 내용에 맞추거나 --width 를 키운다.\n` +
          overflow.offenders.map((o) => `        넘친 요소: ${o}`).join('\n'),
      );
      process.exit(EXIT_CLIP);
    }

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

/**
 * 렌더 코어 — React를 **진짜 브라우저에서 mount** 해 캡처하는 공용 엔진.
 *
 * 왜 정적 렌더(`renderToStaticMarkup`)가 아닌가: bbangto viz의 실제 paint(fill/stroke)를
 * 공급하는 계약 스타일시트가 `useInsertionEffect`로 주입되는데 그 상수가 export되지 않는다.
 * 정적 마크업을 그대로 캡처하면 도식이 무채색으로 나온다. 게다가 주입 스타일시트가
 * 계약·모션·reduced-motion·모티프 4종이라 복제는 드리프트를 4벌 떠안는 길이다.
 * 브라우저에서 mount하면 이 문제 계열 전체가 사라지고 레이아웃 실측·폰트 로딩도 공짜로 얻는다.
 *
 * 번들은 **IIFE + 인라인**이다. `<script type="module">`은 `file://`·`about:blank` 출처에서
 * CORS로 모듈 fetch가 막히므로 ESM 번들은 첫 실행부터 실패한다. IIFE로 구우면 외부 fetch가
 * 아예 없어져 `page.setContent()`만으로 끝난다. 폰트도 data URI로 인라인해 같은 이유를 없앤다.
 *
 * 번들러는 `bundleToIife()` 한 함수 뒤에 격리했다 — Bun.build가 막히면 esbuild로 떨어진다.
 */

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..');
const FONT_DIR = join(REPO_ROOT, 'assets', 'fonts');

/** 폰트 정체성 오염 감지용 — 이 이름들이 실제 렌더에 쓰이면 실패다. */
export const FOREIGN_FONTS = /Pretendard|JetBrains/i;

/** 페인트·폰트 가드 실패 종료 코드. 무채색 PNG가 조용히 산출물에 들어가는 것을 막는다. */
export const EXIT_PAINT = 5;

/** 기하 가드 실패 종료 코드 — 마커가 방향을 잃은 엣지가 있다. */
export const EXIT_GEOMETRY = 6;

/** `assets/fonts/fonts.css`의 woff2 참조를 data URI로 치환해 자급 CSS로 만든다. */
export async function inlineFontCss(): Promise<string> {
  const css = await readFile(join(FONT_DIR, 'fonts.css'), 'utf-8');
  const files = [...css.matchAll(/url\('\.\/([^']+)'\)/g)].map((m) => m[1]);
  let out = css;
  for (const f of new Set(files)) {
    const b64 = (await readFile(join(FONT_DIR, f))).toString('base64');
    out = out.replaceAll(`url('./${f}')`, `url('data:font/woff2;base64,${b64}')`);
  }
  return out;
}

/**
 * 엔트리 소스를 브라우저용 IIFE 한 덩어리로 굽는다.
 * Bun.build가 실패하면 esbuild로 폴백한다 — 파이프라인이 Bun 하나에 묶이지 않게.
 */
export async function bundleToIife(entrySource: string, ext: '.tsx' | '.ts' = '.tsx'): Promise<string> {
  // 임시 엔트리는 **repo 안**에 쓴다. /tmp에 두면 상위에 node_modules가 없어
  // `react-dom/client` 같은 bare specifier가 해석되지 않는다.
  const workRoot = join(REPO_ROOT, '.work');
  await mkdir(workRoot, { recursive: true });
  const dir = await mkdtemp(join(workRoot, 'bundle-'));
  const entry = join(dir, `entry${ext}`);
  await writeFile(entry, entrySource);
  try {
    const built = await Bun.build({
      entrypoints: [entry],
      target: 'browser',
      format: 'iife',
      minify: false,
      define: { 'process.env.NODE_ENV': '"production"' },
    });
    if (built.success && built.outputs[0]) return await built.outputs[0].text();
    const why = built.logs.map(String).join('\n');
    console.warn(`[bundle] Bun.build 실패 → esbuild 폴백\n${why}`);
  } catch (e) {
    console.warn(`[bundle] Bun.build 예외 → esbuild 폴백: ${e instanceof Error ? e.message : e}`);
  }

  const outFile = join(dir, 'out.js');
  const proc = Bun.spawnSync([
    'bunx', 'esbuild', entry,
    '--bundle', '--format=iife', '--target=chrome120',
    '--define:process.env.NODE_ENV="production"',
    `--outfile=${outFile}`,
  ], { cwd: REPO_ROOT });
  if (proc.exitCode !== 0) {
    throw new Error(`번들 실패(Bun.build·esbuild 둘 다):\n${new TextDecoder().decode(proc.stderr)}`);
  }
  const js = await readFile(outFile, 'utf-8');
  await rm(dir, { recursive: true, force: true });
  return js;
}

export interface PageResult {
  /** 렌더에 실제로 쓰인 font-family 문자열들. */
  fonts: string[];
  /** 캡처 대상 엘리먼트의 배경색(rgb 문자열). */
  bg: string;
}

interface RenderOpts {
  /** 번들된 IIFE. `#root`에 mount하고 `document.documentElement`에 `data-rz-mounted`를 세워야 한다. */
  js: string;
  /** `<head>`에 추가로 넣을 CSS. */
  css?: string;
  /** mount 완료를 판정할 셀렉터(기본 `#root > *`). */
  waitFor?: string;
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
}

/**
 * 브라우저를 띄워 mount까지 끝낸 페이지를 콜백에 넘긴다.
 * 외부 폰트 CDN은 전부 차단한다 — 오프라인 결정성 + 폰트 오염 방지.
 */
export async function withRenderedPage<T>(opts: RenderOpts, fn: (page: any) => Promise<T>): Promise<T> {
  let chromium: any;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('[설치 필요] bun add -d playwright && bunx playwright install chromium');
    process.exit(3);
  }

  const fontCss = await inlineFontCss();
  // 인라인 스크립트 안의 `</script>`·`<!--`는 HTML 파서가 스크립트 끝으로 읽어 문서를 깨뜨린다.
  // 2.5MB 번들에는 이런 시퀀스가 문자열 리터럴로 얼마든지 들어 있다.
  const safeJs = opts.js.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
  const html = `<!doctype html><html><head><meta charset="utf-8">
<style>${fontCss}</style>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{font-family:'IBM Plex Sans KR',system-ui,sans-serif}
  ${opts.css ?? ''}
</style>
</head><body><div id="root"></div><script>${safeJs}</script></body></html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: opts.deviceScaleFactor ?? 2 });
    if (opts.viewport) await page.setViewportSize(opts.viewport);

    // 외부 폰트는 통째로 막는다. bbangto Provider의 @import가 여기서 무력화된다.
    await page.route('**/fonts.googleapis.com/**', (r: any) => r.abort());
    await page.route('**/fonts.gstatic.com/**', (r: any) => r.abort());
    await page.route('**/cdn.jsdelivr.net/**', (r: any) => r.abort());

    const errors: string[] = [];
    page.on('pageerror', (e: Error) => errors.push(e.message));
    page.on('console', (m: any) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });

    await page.setContent(html, { waitUntil: 'load' });
    try {
      // state:'attached' — 기본값 'visible'로 두면 Provider가 #root 첫 자식으로 주입하는
      // <style>(비가시)에 걸려 mount를 놓친다.
      await page.waitForSelector(opts.waitFor ?? '#root > *', { timeout: 15_000, state: 'attached' });
    } catch {
      const dom = await page.evaluate(() => ({
        rootChildren: document.getElementById('root')?.children.length ?? -1,
        htmlLen: document.getElementById('root')?.innerHTML.length ?? -1,
        mounted: document.documentElement.hasAttribute('data-rz-mounted'),
        scripts: document.scripts.length,
      }));
      throw new Error(
        `mount 실패 (waitFor: ${opts.waitFor ?? '#root > *'})\n` +
          `  DOM: ${JSON.stringify(dom)}\n  오류:\n${errors.join('\n') || '  (없음)'}`,
      );
    }
    await page.evaluate(() => (document as any).fonts.ready);
    if (errors.length) console.warn(`[page] 렌더 중 오류 ${errors.length}건:\n${errors.join('\n')}`);

    return await fn(page);
  } finally {
    await browser.close();
  }
}

/**
 * 렌더된 페이지에서 실제 폰트·배경을 읽어 오염/무채색을 판정할 재료를 모은다.
 * `selector`를 주지 않으면 `#root`의 첫 **가시** 자식을 잡는다 — Provider가 주입한
 * `<style>`을 캡처 대상으로 오인하지 않기 위해서다.
 */
export async function inspectPage(page: any, selector?: string): Promise<PageResult> {
  return page.evaluate((sel: string | undefined) => {
    const fonts = new Set<string>();
    for (const el of document.querySelectorAll('*')) {
      const ff = getComputedStyle(el).fontFamily;
      // 실제로 텍스트를 그리는 엘리먼트만 센다 — style/script의 상속값은 의미가 없다.
      if (ff && el.textContent?.trim() && !['STYLE', 'SCRIPT'].includes(el.tagName)) fonts.add(ff);
    }
    const target = sel
      ? document.querySelector(sel)
      : [...(document.getElementById('root')?.children ?? [])].find((c) => !['STYLE', 'SCRIPT'].includes(c.tagName));
    return { fonts: [...fonts], bg: target ? getComputedStyle(target).backgroundColor : '' };
  }, selector);
}

/** 한 엣지의 기하 결함 — 어느 끝에서 마커가 방향을 잃었는지. */
export interface EdgeDefect {
  /** 엣지 id(없으면 순번). */
  id: string;
  /** 방향을 잃은 쪽. */
  end: 'start' | 'end';
  d: string;
}

/**
 * 마커 방향 가드 — **종단 세그먼트 길이 0** 을 잡는다.
 *
 * 왜 있나: 0.2.0 의 `orthogonalPath` 는 축 정렬(`from.x === to.x`)에서
 * `M f L mx,fy L mx,ty L tx,ty` 를 만드는데 `mx === to.x` 라 마지막 `L` 이 길이 0 이 됐다.
 * `orient="auto"` 마커는 그 세그먼트의 방향을 쓰므로 방향이 정의되지 않고, Chromium 은
 * 0°(오른쪽)로 그린다 — 세로로 내려가는 화살표의 화살촉만 옆을 봤다.
 * PNG 에서는 육안으로만 보이던 결함이라 눈에 의존하지 않도록 여기서 기계로 막는다.
 *
 * 0.3.0 이 그 결함을 고쳤어도(`docs/viz-upstream-issues.md` P1) 이 가드는 남는다 —
 * 결함의 **증상**을 보므로 상류 회귀든 `waypoints` 중복 좌표든 원인을 가리지 않고 잡는다.
 * 실제 DOM 의 `d` 를 읽으므로 `waypoints` 로 그린 경로도 같은 기준으로 검사된다.
 */
export async function inspectEdgeGeometry(page: any): Promise<EdgeDefect[]> {
  return page.evaluate(() => {
    // M·L·Q·C 각 명령의 **끝점**만 뽑는다(Q·C 는 제어점을 버리고 마지막 좌표쌍).
    const endpoints = (d: string): [number, number][] => {
      const out: [number, number][] = [];
      for (const m of d.matchAll(/([MLQCmlqc])([^MLQCZmlqcz]*)/g)) {
        const n = (m[2].trim().match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
        if (n.length >= 2) out.push([n[n.length - 2], n[n.length - 1]]);
      }
      return out;
    };
    const same = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5;

    const defects: { id: string; end: 'start' | 'end'; d: string }[] = [];
    const edges = [...document.querySelectorAll('path[data-bbangto-viz-edge]')];
    edges.forEach((el, i) => {
      const d = el.getAttribute('d') ?? '';
      const pts = endpoints(d);
      if (pts.length < 2) return;
      const id = el.getAttribute('data-bbangto-viz-edge-id') || `#${i}`;
      // 마커가 붙은 쪽만 문제다 — 마커 없는 선은 방향을 그리지 않는다.
      if (el.getAttribute('marker-end') && same(pts[pts.length - 1], pts[pts.length - 2])) {
        defects.push({ id, end: 'end', d });
      }
      if (el.getAttribute('marker-start') && same(pts[0], pts[1])) {
        defects.push({ id, end: 'start', d });
      }
    });
    return defects;
  });
}

export interface EdgeOverlap {
  id: string;
  /** 엣지가 밑을 지나는 상자의 글자(앞부분). */
  box: string;
  /** 겹친 구간이 전체 길이에서 차지하는 비율(0~1). */
  ratio: number;
  d: string;
}

/**
 * 겹침 가드 — **엣지가 자기 양끝이 아닌 상자 밑을 지나는 것**을 잡는다.
 *
 * 왜 있나: Strategy 구조 도식에서 `Client ⇢ ConcreteStrategy` 의존 엣지가 Strategy 상자의 왼쪽 변으로
 * 들어가 상자에 가려졌다가 아래 변에서 화살촉을 달고 나왔다. 독자 눈에는 `Client ⇢ Strategy` 와
 * `Strategy ⇢ ConcreteStrategy` 두 엣지로 읽혀, 본문이 "ConcreteStrategy 를 아는 쪽은 Client 뿐" 이라고
 * 가리킨 것의 정반대가 됐다(2026-09-21 채점이 눈으로 잡음). `lint-diagrams` 는 스스로 "레이아웃 겹침은
 * 검사하지 않는다" 고 적고 있어 기계가 비운 자리였다.
 *
 * 판정: 엣지 경로를 길이로 표본해 화면 좌표로 옮기고, **양끝에 닿은 상자를 뺀** 상자의 사각형 안에
 * 표본이 들어가면 결함이다. 상자 테두리를 스치는 것은 여백(2px)으로 눈감고, 표본 하나만 걸리는 것도
 * 세지 않는다(모서리 접점) — 연속 구간이 전체의 2% 를 넘을 때만 잡는다.
 */
export async function inspectEdgeOverlaps(page: any): Promise<EdgeOverlap[]> {
  return page.evaluate(() => {
    const PAD = 2;          // 테두리를 스치는 것은 겹침이 아니다
    const MIN_RATIO = 0.02; // 모서리 접점 한두 표본은 세지 않는다
    // 같은 상자가 겹쳐 선언된 경우(바깥 테두리 + 안쪽 판)가 있어 사각형이 거의 같으면 하나로 본다.
    const boxes: { r: DOMRect; text: string }[] = [];
    for (const b of document.querySelectorAll('[data-bbangto-viz-class-box]')) {
      const r = b.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const text = (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24);
      const dup = boxes.find((x) => Math.abs(x.r.left - r.left) < 3 && Math.abs(x.r.top - r.top) < 3 &&
                                    Math.abs(x.r.width - r.width) < 3 && Math.abs(x.r.height - r.height) < 3);
      if (dup) { if (!dup.text && text) dup.text = text; continue; }
      boxes.push({ r, text });
    }
    const out: { id: string; box: string; ratio: number; d: string }[] = [];
    const edges = [...document.querySelectorAll('path[data-bbangto-viz-edge]')] as SVGPathElement[];
    edges.forEach((el, i) => {
      const len = el.getTotalLength();
      if (!len) return;
      const ctm = el.getScreenCTM();
      if (!ctm) return;
      const N = Math.max(40, Math.min(400, Math.round(len)));
      const pts: { x: number; y: number }[] = [];
      for (let k = 0; k <= N; k++) {
        const p = el.getPointAtLength((len * k) / N);
        pts.push({ x: p.x * ctm.a + p.y * ctm.c + ctm.e, y: p.x * ctm.b + p.y * ctm.d + ctm.f });
      }
      const inside = (b: { r: DOMRect }, p: { x: number; y: number }) =>
        p.x > b.r.left + PAD && p.x < b.r.right - PAD && p.y > b.r.top + PAD && p.y < b.r.bottom - PAD;
      // 양끝이 닿은 상자는 자기 것이다 — 시작·끝 표본을 담는 상자를 뺀다.
      const own = new Set(boxes.filter((b) =>
        [pts[0], pts[pts.length - 1]].some((p) =>
          p.x > b.r.left - 6 && p.x < b.r.right + 6 && p.y > b.r.top - 6 && p.y < b.r.bottom + 6)));
      const id = el.getAttribute('data-bbangto-viz-edge-id') || `#${i}`;
      // 엣지 하나당 한 줄만 낸다 — 그림자·테두리가 상자마다 두 겹이라 그대로 내면 같은 결함이 두 번 찍힌다.
      let worst: { box: string; ratio: number } | null = null;
      for (const b of boxes) {
        if (own.has(b)) continue;
        const ratio = pts.filter((p) => inside(b, p)).length / (N + 1);
        if (ratio <= MIN_RATIO) continue;
        if (!worst || ratio > worst.ratio || (ratio === worst.ratio && !worst.box && b.text)) {
          worst = { box: b.text, ratio };
        }
      }
      if (worst) out.push({ id, box: worst.box, ratio: worst.ratio, d: el.getAttribute('d') || '' });
    });
    return out;
  });
}

/** 남의 상자 밑을 지나는 엣지가 있으면 EXIT_GEOMETRY로 죽는다. */
export function assertNoEdgeOverlaps(overlaps: EdgeOverlap[], label = ''): void {
  if (!overlaps.length) return;
  console.error(
    `[겹침] 엣지가 자기 양끝이 아닌 상자 밑을 지난다 ${overlaps.length}건${label ? ` (${label})` : ''}.\n` +
      `       가려진 엣지는 독자에게 다른 관계로 읽힌다 — 경유점(waypoints)으로 상자를 우회시키거나 배치를 바꿔라.`,
  );
  for (const o of overlaps) {
    console.error(`  ${o.id} 가 "${o.box}" 밑을 지남 (경로의 ${(o.ratio * 100).toFixed(0)}%)\n    d="${o.d}"`);
  }
  process.exit(EXIT_GEOMETRY);
}

/** 마커가 방향을 잃은 엣지가 있으면 EXIT_GEOMETRY로 죽는다. */
export function assertEdgeMarkersOriented(defects: EdgeDefect[], label = ''): void {
  if (!defects.length) return;
  console.error(
    `[기하] 종단 세그먼트 길이 0 — 마커가 방향을 잃은 엣지 ${defects.length}건${label ? ` (${label})` : ''}.\n` +
      `       상류 0.3.0 은 축 정렬을 직선으로 위임해 이 결함을 고쳤다. 패키지 버전과\n` +
      `       waypoints 의 중복 좌표를 먼저 의심해라(bun run scripts/lint-diagrams.ts 가 상류 계약을 실측한다).`,
  );
  for (const d of defects) console.error(`  ${d.id} · ${d.end}\n    d="${d.d}"`);
  process.exit(EXIT_GEOMETRY);
}

/** 폰트 오염이면 EXIT_PAINT로 죽는다. */
export function assertNoFontPollution(result: PageResult): void {
  const bad = result.fonts.filter((f) => FOREIGN_FONTS.test(f));
  if (bad.length) {
    console.error(`[폰트 오염] IBM Plex가 아닌 폰트가 적용됐다:\n  ${bad.join('\n  ')}`);
    process.exit(EXIT_PAINT);
  }
  if (!result.fonts.some((f) => /IBM Plex/.test(f))) {
    console.error(`[폰트 누락] IBM Plex가 어디에도 적용되지 않았다. 실제 적용된 것: ${result.fonts.join(' | ')}`);
    process.exit(EXIT_PAINT);
  }
}

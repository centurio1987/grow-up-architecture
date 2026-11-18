// visual.html 을 데스크톱·휴대폰 폭, 밝은·어두운 주제로 열어 콘솔 오류, 가로 넘침, 도면 수를 재고 화면을 찍습니다.
//   node tools/check_visual.mjs [도면id ...]     (docs/schema-contract-guide 에서)
// 도면 id(c07 등)를 주면 그 도면으로 스크롤해 한 장씩 더 찍습니다.
// Playwright 는 publish-report 스킬에 설치된 것을 씁니다. 다른 컴퓨터에서는 경로를 바꾸세요.
import { chromium } from '/Users/centurio/.claude/skills/publish-report/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const url = 'file://' + resolve('visual.html');
const out = 'verification/visual';
mkdirSync(out, { recursive: true });
const targets = process.argv.slice(2);
const runs = [
  { name: 'desktop-light', width: 1440, height: 1000, scheme: 'light' },
  { name: 'desktop-dark', width: 1440, height: 1000, scheme: 'dark' },
  { name: 'mobile-light', width: 390, height: 844, scheme: 'light' },
];
const browser = await chromium.launch();
const report = {};
for (const r of runs) {
  const page = await browser.newPage({ viewport: { width: r.width, height: r.height }, colorScheme: r.scheme });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (q) => { if (!q.url().startsWith('file:') && !q.url().startsWith('data:')) errors.push('바깥 요청: ' + q.url()); });
  await page.goto(url);
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const wide = [];
    for (const el of document.querySelectorAll('main *')) {
      const b = el.getBoundingClientRect();
      if (b.right > document.documentElement.clientWidth + 1 && !el.closest('.fig, .tbl-wrap, .topbar-in, .ledger, pre')) wide.push((el.className || el.tagName) + ' ' + Math.round(b.right));
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      sheets: document.querySelectorAll('section.sheet').length,
      empty: [...document.querySelectorAll('section.sheet')].filter((s) => !s.querySelector('.body').children.length).map((s) => s.id),
      svgs: document.querySelectorAll('section.sheet svg').length,
      wide: wide.slice(0, 12),
      height: document.documentElement.scrollHeight,
    };
  });
  report[r.name] = { ...m, overflowX: m.scrollWidth > m.clientWidth, errors };
  await page.screenshot({ path: `${out}/${r.name}-top.png` });
  for (const id of targets) {
    const ok = await page.evaluate((i) => { const e = document.getElementById(i); if (!e) return false; e.scrollIntoView({ behavior: 'instant' }); window.scrollBy({ top: -10, behavior: 'instant' }); return true; }, id);
    if (ok) { await page.waitForTimeout(150); await page.screenshot({ path: `${out}/${r.name}-${id}.png` }); }
  }
  await page.close();
}
await browser.close();
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

// index.html 을 데스크톱·휴대폰 폭으로 열어 화면을 찍고, 가로 넘침과 제목 수를 잽니다.
//   node tools/screenshot.mjs            (프로젝트의 docs/schema-contract-guide 에서)
// Playwright 는 publish-report 스킬에 설치된 것을 씁니다. 다른 컴퓨터에서는 경로를 바꾸세요.
import { chromium } from '/Users/centurio/.claude/skills/publish-report/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = 'file://' + resolve('index.html');
const shots = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];
const targets = process.argv.slice(2);   // 찍을 제목 글자(있으면 그 제목으로 스크롤)
const browser = await chromium.launch();
const report = {};
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
  await page.goto(html);
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    h1: document.querySelectorAll('h1').length,
    h2: document.querySelectorAll('h2').length,
    tables: document.querySelectorAll('table').length,
    pre: document.querySelectorAll('pre').length,
  }));
  report[s.name] = { ...m, overflowX: m.scrollWidth > m.clientWidth };
  await page.screenshot({ path: `verification/${s.name}-top.png` });
  for (const [i, t] of targets.entries()) {
    const h = page.locator('h2, h3', { hasText: t }).first();
    if (await h.count()) {
      await h.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -60));
      await page.screenshot({ path: `verification/${s.name}-${i + 1}.png` });
    }
  }
  await page.close();
}
await browser.close();
writeFileSync('verification/screens.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

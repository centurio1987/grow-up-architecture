// visual.html 을 데스크톱·휴대폰 폭, 밝은·어두운 주제로 열어 콘솔 오류, 가로 넘침, 도면 수, 배치 어긋남을 재고 화면을 찍습니다.
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
// 배치 검사: 그림 안 글자가 그림 밖·상자 밖으로 나가거나 서로 겹치는지, HTML 글자가 제 칸 밖으로 넘치는지
function auditLayout() {
  const issues = [];
  const sheetOf = (el) => (el.closest('section.sheet') || {}).id || '?';
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const visible = (el) => { const st = getComputedStyle(el); return st.display !== 'none' && st.visibility !== 'hidden' && +st.opacity > 0.3 && !el.closest('[hidden]'); };
  for (const svg of document.querySelectorAll('section.sheet svg')) {
    if (!visible(svg) || !svg.getBoundingClientRect().width) continue;
    const vb = svg.viewBox.baseVal;
    const texts = [...svg.querySelectorAll('text')].filter((t) => visible(t) && t.textContent.trim());
    const boxes = texts.map((t) => ({ t, b: t.getBBox() }));
    for (const { t, b } of boxes) {
      if (b.x < vb.x - 1 || b.y < vb.y - 1 || b.x + b.width > vb.x + vb.width + 1 || b.y + b.height > vb.y + vb.height + 1)
        issues.push({ sheet: sheetOf(svg), kind: '그림 밖으로 나간 글자', text: t.textContent.slice(0, 40) });
      const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      const rects = [...t.parentNode.querySelectorAll(':scope > rect')].filter(visible).map((r) => r.getBBox()).filter((r) => cx > r.x && cx < r.x + r.width && cy > r.y && cy < r.y + r.height && r.width > 8 && r.height > 8);
      if (rects.length) {
        const r = rects.sort((a, c) => a.width * a.height - c.width * c.height)[0];
        if (b.x < r.x - 2 || b.x + b.width > r.x + r.width + 2) issues.push({ sheet: sheetOf(svg), kind: '상자 밖으로 나간 글자', text: t.textContent.slice(0, 40), over: Math.round(Math.max(r.x - b.x, b.x + b.width - r.x - r.width)) });
      }
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].b, c = boxes[j].b;
      const area = inter(a, c);
      if (area > 6 && area > 0.08 * Math.min(a.width * a.height, c.width * c.height))
        issues.push({ sheet: sheetOf(svg), kind: '겹친 글자', text: boxes[i].t.textContent.slice(0, 24) + ' / ' + boxes[j].t.textContent.slice(0, 24) });
    }
  }
  const skip = '.fig, .tbl-wrap, .ledger, .topbar-in, pre, .board, .paper-form, svg, .memo';
  for (const el of document.querySelectorAll('section.sheet .body *')) {
    if (el.closest(skip) || !visible(el)) continue;
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && getComputedStyle(el).overflowX === 'visible')
      issues.push({ sheet: sheetOf(el), kind: '칸 밖으로 넘친 내용', text: (el.className || el.tagName) + ' ' + el.textContent.trim().slice(0, 30), over: el.scrollWidth - el.clientWidth });
  }
  return issues;
}

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
  // 처음 화면에 더해, 도면마다 고르기 버튼·단계 버튼을 하나씩 눌러 바뀐 상태도 봅니다.
  const layout = await page.evaluate(async (src) => {
    const audit = new Function('return (' + src + ')')();
    const seen = new Set(), all = [];
    const keep = (list, state) => list.forEach((i) => { const k = i.sheet + i.kind + i.text; if (!seen.has(k)) { seen.add(k); all.push(state ? { ...i, state } : i); } });
    keep(audit());
    const btns = [...document.querySelectorAll('section.sheet .controls[role=group] button, section.sheet .stepper button, section.sheet .controls button[aria-pressed]')];
    for (const b of btns) {
      if (!b.isConnected) continue;
      b.click();
      await new Promise((r) => setTimeout(r, 0));
      keep(audit(), b.textContent.trim().slice(0, 30));
    }
    return all;
  }, auditLayout.toString());
  report[r.name] = { ...m, overflowX: m.scrollWidth > m.clientWidth, errors, layout: { count: layout.length, items: layout.slice(0, 60) } };
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

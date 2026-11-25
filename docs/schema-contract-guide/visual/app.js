/* 도해판 동작. 내용은 data.js(전역 D)에 있고, 여기서는 그리고 반응만 합니다. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var FULL = 'index.html';

  // ---------- 작은 도구 ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    add(e, kids);
    return e;
  }
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    add(e, kids);
    return e;
  }
  function add(e, kids) {
    if (kids == null) return;
    if (!Array.isArray(kids)) kids = [kids];
    kids.forEach(function (c) {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
  }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // `코드` 와 **굵게** 만 받는 아주 작은 글 변환
  function md(t) {
    // 원고 글에 섞어 쓴 몇 가지 태그(<b> <br> <i> <span class>)만 되살립니다.
    return esc(t).replace(/&lt;(\/?)(b|br|i|span)((?: class=&quot;[\w -]+&quot;)?)\s*\/?&gt;/g, function (m, sl, tg, cls) { return '<' + sl + tg + cls.replace(/&quot;/g, '"') + '>'; })
      .replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\[([^\]]+)\]\((#[A-Za-z0-9-]+)\)/g, '<a href="$2">$1</a>');
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem('scg-visual:' + key) || 'null');
      localStorage.setItem('scg-visual:' + key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  var LAYER = { ext: '외부 스키마', con: '개념 스키마', int: '내부 스키마', ctr: '계약', none: '어디에도 아님', multi: '둘 이상' };
  function tag(layer, text) { return h('span', { class: 'tag L-' + layer }, text || LAYER[layer]); }
  function ev(level) { return h('span', { class: 'ev ' + level, title: '근거 수준' }, [h('i'), level]); }
  function col(c) { return h('span', { class: 'col ' + c.toUpperCase() }, c.toUpperCase()); }
  function readLink(anchor, label) {
    return h('a', { class: 'readlink', href: FULL + '#' + anchor }, (label || '본문에서 읽기') + ' →');
  }
  function arrowDefs(svg, id, cls) {
    var defs = svg.querySelector('defs') || svg.insertBefore(s('defs'), svg.firstChild);
    defs.appendChild(s('marker', { id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
      s('path', { d: 'M0,0 L10,5 L0,10 z', class: cls || 'arrowhead' })));
  }
  // 그림 안 글을 한 줄 max 글자 안팎으로 나눕니다. 나눌 자리는 ' → ' ' + ' ' · ' ', ' 그리고 빈칸 순으로 고릅니다.
  function wrapLines(text, max) {
    var out = [], rest = text;
    while (rest.length > max) {
      var cut = -1, seps = [' → ', ' + ', ' · ', ', ', ' '];
      for (var i = 0; i < seps.length && cut < 0; i++) { var k = rest.lastIndexOf(seps[i], max); if (k > max * 0.4) cut = k + (seps[i] === ', ' ? 1 : 0); }
      if (cut < 0) cut = max;
      out.push(rest.slice(0, cut).trim()); rest = rest.slice(cut).trim();
    }
    out.push(rest);
    return out;
  }
  function svgText(x, y, str, cls, anchor) {
    return s('text', { x: x, y: y, class: cls || null, 'text-anchor': anchor || 'start' }, str);
  }
  // 여러 줄 글: lines 배열을 lh 간격으로
  function svgLines(x, y, lines, cls, anchor, lh) {
    var t = s('text', { x: x, y: y, class: cls || null, 'text-anchor': anchor || 'start' });
    lines.forEach(function (ln, i) { t.appendChild(s('tspan', { x: x, dy: i ? (lh || 16) : 0 }, ln)); });
    return t;
  }

  function P(text, cls) { return h('p', { class: cls || null, html: md(text) }); }
  function H4(text) { return h('h4', { html: md(text) }); }
  function svgBox(w, hgt, label, cls) {
    return s('svg', { viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': label, class: cls || null });
  }
  function fig(node, caption, tagText) {
    return h('figure', null, [h('div', { class: 'fig' }, node), caption ? h('figcaption', { html: (tagText ? '<b>' + esc(tagText) + '</b>' : '') + md(caption) }) : null]);
  }
  // 표: head 는 머리 칸 배열, rows 는 칸 배열의 배열(칸은 글자 또는 요소)
  function table(head, rows, opts) {
    opts = opts || {};
    var tb = h('tbody');
    rows.forEach(function (r, i) {
      var tr = h('tr', { class: (opts.rowClass && opts.rowClass(r, i)) || null });
      r.forEach(function (c, j) {
        var td = h('td', { class: (opts.num && opts.num.indexOf(j) >= 0) ? 'num' : null });
        if (c && c.nodeType) td.appendChild(c); else td.innerHTML = md(c == null ? '' : String(c));
        tr.appendChild(td);
      });
      if (opts.onRow) { tr.classList.add('click'); tr.tabIndex = 0; tr.addEventListener('click', function () { opts.onRow(r, i, tr); }); tr.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onRow(r, i, tr); } }); }
      tb.appendChild(tr);
    });
    var t = h('table', null, [h('thead', null, h('tr', null, head.map(function (x, j) { return h('th', { class: (opts.num && opts.num.indexOf(j) >= 0) ? 'num' : null, html: md(x) }); }))), tb]);
    return h('div', { class: 'tbl-wrap' + (opts.cls ? ' ' + opts.cls : '') }, t);
  }
  // 버튼 묶음. items: [{label, key, cls}], onPick(key, idx)
  function seg(items, onPick, opts) {
    opts = opts || {};
    var box = h('div', { class: 'controls' + (items.length > 5 ? ' many' : ''), role: 'group', 'aria-label': opts.label || opts.lbl || null });
    if (opts.lbl) box.appendChild(h('span', { class: 'lbl' }, opts.lbl));
    var btns = items.map(function (it, i) {
      var b = h('button', { type: 'button', class: 'btn' + (it.cls ? ' ' + it.cls : ''), 'aria-pressed': 'false', html: it.html || null }, it.html ? null : it.label);
      b.addEventListener('click', function () { pick(i); });
      box.appendChild(b);
      return b;
    });
    function pick(i) {
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', i === j ? 'true' : 'false'); });
      onPick(items[i].key != null ? items[i].key : i, i);
    }
    box.pick = pick;
    if (opts.start != null) setTimeout(function () { pick(opts.start); }, 0);
    return box;
  }
  /* 원문 ↔ 원장 잇기. seed: [[id, 글]], rows: [[id, 칸, 글, [원문 id...], 근거]]
     원문 줄을 누르면 그 줄에서 나온 원장 줄이, 원장 줄을 누르면 그 줄의 원문이 함께 켜집니다. */
  function linked(seed, rows, opts) {
    opts = opts || {};
    var left = h('div', { class: 'memo', role: 'list', 'aria-label': opts.seedLabel || '원문' });
    var right = h('div', { class: 'ledger', role: 'list', 'aria-label': '추출 원장' });
    var segs = {}, lrows = {};
    seed.forEach(function (sd) {
      var line = h('div', { role: 'listitem' }, [
        h('span', { class: 'mono', style: 'color:var(--ink-3);margin-right:8px;font-size:12px' }, sd[0]),
        h('span', { class: 'seg L-none', tabindex: 0, 'data-id': sd[0], html: md(sd[1]) })
      ]);
      var sp = line.lastChild;
      sp.style.setProperty('--c', 'var(--ink-2)'); sp.style.setProperty('--t', 'var(--sunken)');
      sp.addEventListener('click', function () { light('seed', sd[0]); });
      sp.addEventListener('keydown', function (e) { if (e.key === 'Enter') light('seed', sd[0]); });
      segs[sd[0]] = sp;
      left.appendChild(line);
    });
    rows.forEach(function (r) {
      var row = h('div', { class: 'lrow', role: 'listitem', tabindex: 0 }, [
        h('span', { class: 'id' }, r[0]), col(r[1]), h('span', { html: md(r[2]) }),
        h('span', { class: 'meta' }, [r[4] ? ev(r[4]) : null, h('span', { class: 'loc' }, (r[3] || []).join('·'))])
      ]);
      row.addEventListener('click', function () { light('row', r[0]); });
      row.addEventListener('keydown', function (e) { if (e.key === 'Enter') light('row', r[0]); });
      lrows[r[0]] = { el: row, src: r[3] || [] };
      right.appendChild(row);
    });
    function light(kind, id) {
      Object.keys(segs).forEach(function (k) { segs[k].classList.remove('on'); });
      Object.keys(lrows).forEach(function (k) { lrows[k].el.classList.remove('on'); });
      var first = null;
      if (kind === 'seed') {
        segs[id].classList.add('on');
        Object.keys(lrows).forEach(function (k) { if (lrows[k].src.indexOf(id) >= 0) { lrows[k].el.classList.add('on'); first = first || lrows[k].el; } });
        if (first && right.scrollTo) right.scrollTo({ top: first.offsetTop - right.offsetTop - 8, behavior: 'smooth' });
      } else {
        lrows[id].el.classList.add('on');
        lrows[id].src.forEach(function (sid) { if (segs[sid]) segs[sid].classList.add('on'); });
      }
      if (opts.onLight) opts.onLight(kind, id);
    }
    var grid = h('div', { class: 'two' }, [h('div', null, [h('div', { class: 'eyebrow', style: 'margin-bottom:6px' }, opts.seedTitle || '원문'), left]), h('div', null, [h('div', { class: 'eyebrow', style: 'margin-bottom:6px' }, '추출 원장 ' + rows.length + '줄' + (rows.length > 9 ? ' · 목록 안에서 스크롤' : '') + ' · 누르면 출처가 켜집니다'), right])]);
    grid.light = light;
    return grid;
  }
  function note(text, cls) { return h('div', { class: 'panel ' + (cls || ''), html: md(text) }); }
  // 이어서 appendChild 하는 코드를 그대로 두고 접기 안으로 보낼 때: var _b = body; body = foldInto(_b, '제목'); … body = _b;
  function foldInto(parent, title, hint) { var d = more(title, [], hint); parent.appendChild(d); return d.querySelector('.in'); }
  // 참고 표와 긴 설명을 접어 둡니다. nodes 는 요소 배열
  function more(title, nodes, hint) {
    return h('details', { class: 'more' }, [h('summary', null, [h('span', null, '자세히 · ' + title), hint ? h('span', { class: 'n' }, hint) : null]), h('div', { class: 'in' }, nodes)]);
  }

  // 장마다 그리는 함수. sec-*.js 가 여기에 들어가 RENDER 에 자기를 더합니다.
  var RENDER = [];
  function sheet(id) { return document.getElementById(id); }
  function section(id) { var e = document.getElementById(id); return e ? e.querySelector('.body') : null; }

  /*@SECTIONS*/

  // ---------- 목록 · 주제 ----------
  function initNav() {
    var links = $$('.rail a[href^="#"], .topbar-in a[href^="#"]');
    var targets = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); var t = document.getElementById(id); if (t) targets[id] = t; });
    var ids = Object.keys(targets);
    var current = null, queued = false;
    function update() {
      queued = false;
      var best = ids[0];
      for (var i = 0; i < ids.length; i++) { if (targets[ids[i]].getBoundingClientRect().top < 160) best = ids[i]; }
      if (best === current) return;
      current = best;
      links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + best); });
      var on = $('.topbar-in a.on');
      if (on) on.parentNode.scrollLeft = on.offsetLeft - 16;
      var ron = $('.rail a.on');
      if (ron) { var rail = $('.rail'); var top = ron.offsetTop; if (top < rail.scrollTop + 60 || top > rail.scrollTop + rail.clientHeight - 60) rail.scrollTop = top - rail.clientHeight / 2; }
    }
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
  function initTheme() {
    var root = document.documentElement;
    var saved = store('theme');
    if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
    $$('.theme-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dark = root.getAttribute('data-theme') === 'dark' ||
          (!root.getAttribute('data-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        var next = dark ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        store('theme', next);
      });
    });
  }

  function boot() {
    initTheme();
    RENDER.forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error(fn.name, e); }
    });
    initNav();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

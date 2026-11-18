  /* ===== 제5부 실습 · 부록 ===== */

  // ---------- 문제 지도 ----------
  RENDER.push(function renderPractice() {
    var body = section('practice'); if (!body) return;
    var kind = 'all', lvl = 'all', short = false;
    var holder = h('div');
    var LV = { '하': '한 층만', '중': '두세 층', '상': '네 층 전부와 검증' };
    function draw() {
      var rows = D.problems.filter(function (p) { return (kind === 'all' || p[7] === kind) && (lvl === 'all' || p[4] === lvl) && (!short || D.problemShort.indexOf(p[0]) >= 0); });
      clear(holder);
      holder.appendChild(table(['문제', '도메인', '씨앗 형식', '중심 층', '난이도', '연결 장'], rows.map(function (p) {
        var bars = h('span', { title: LV[p[4]], style: 'display:inline-flex;gap:2px;align-items:center' }, ['하', '중', '상'].map(function (x, i) { return h('i', { style: 'display:inline-block;width:8px;height:12px;border-radius:1px;background:' + (i <= ['하', '중', '상'].indexOf(p[4]) ? 'var(--ink-2)' : 'var(--rule)') }); }).concat([h('span', { class: 'small', style: 'margin-left:6px' }, p[4])]));
        return [h('a', { href: FULL + '#' + p[6], class: 'mono' }, p[0]), p[1], p[2], p[3], bars, p[5]];
      })));
      holder.appendChild(P(rows.length + '문제' + (short ? ' · 시간이 부족하면 이 다섯 문제만 풀어도 방법을 대부분 거칩니다.' : ''), 'small muted'));
    }
    add(body, [
      seg([{ label: '전체', key: 'all' }, { label: '형식이 있는 씨앗(P02~P09)', key: 'formal' }, { label: '거친 자료(P10~P14)', key: 'rough' }, { label: '여러 형식·종합(P01, P15)', key: 'mixed' }], function (k) { kind = k; draw(); }, { lbl: '자료', start: 0 }),
      seg([{ label: '모든 난이도', key: 'all' }, { label: '하 · 한 층만', key: '하' }, { label: '중 · 두세 층', key: '중' }, { label: '상 · 네 층 전부와 검증', key: '상' }], function (k) { lvl = k; draw(); }, { lbl: '난이도', start: 0 }),
      h('div', { class: 'controls' }, [(function () { var b = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false' }, '시간이 부족하면 — 다섯 문제만'); b.addEventListener('click', function () { short = !short; b.setAttribute('aria-pressed', short ? 'true' : 'false'); draw(); }); return b; })()]),
      holder
    ]);
    body.appendChild(H4('권하는 풀이 순서'));
    body.appendChild(h('ol', { style: 'list-style:none;padding:0;margin:0;display:grid;gap:4px' }, D.problemOrder.map(function (o, i) { return h('li', { style: 'display:grid;grid-template-columns:28px 110px minmax(0,1fr);gap:8px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--rule)' }, [h('span', { class: 'mono small', style: 'color:var(--ink-3)' }, String(i + 1)), h('b', { class: 'mono' }, o[0]), h('span', { class: 'small' }, o[1])]); })));
    body.appendChild(H4('과제 여섯 종류와 채점'));
    body.appendChild(table(['과제', '내는 것', '표기를 보여 준 장'], D.tasks));
    body.appendChild(P('필수 항목 하나에 2점, 권장 항목 하나에 1점입니다. 과제별로 필수를 모두 채웠을 때만 통과예요. 풀이와 똑같아야 맞는 것은 아닙니다. 지어내 채운 답보다 q로 남기고 "누구에게 무엇을 물을지" 적은 답을 더 높게 칩니다. 원고의 말로는 "풀이와 같은지보다, 다른 곳마다 근거를 댈 수 있는지를 봅니다." 「틈」은 실습 도메인에 일부러 넣지 않았습니다.', 'small'));
  });

  // ---------- 용어집 ----------
  RENDER.push(function renderGlossary() {
    var body = section('glossary'); if (!body) return;
    var q = '', grp = '전체', mine = false;
    var input = h('input', { id: 'glossary-q', class: 'search', type: 'search', placeholder: '낱말이나 원어로 찾기 (예: 사상, view, 계약)', 'aria-label': '용어 찾기' });
    var count = h('span', { class: 'small muted', 'aria-live': 'polite' });
    var list = h('div', { class: 'panel', style: 'padding:0;box-shadow:none' });
    var groups = ['전체'].concat(D.glossary.reduce(function (a, g) { if (a.indexOf(g[5]) < 0) a.push(g[5]); return a; }, []));
    function draw() {
      var ql = q.toLowerCase();
      var rows = D.glossary.filter(function (g) { return (grp === '전체' || g[5] === grp) && (!mine || g[3].indexOf('이 가이드') >= 0) && (!ql || (g[0] + ' ' + g[1] + ' ' + g[2]).toLowerCase().indexOf(ql) >= 0); });
      clear(list);
      rows.forEach(function (g) {
        var own = g[3].indexOf('이 가이드') >= 0;
        list.appendChild(h('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;padding:10px 14px;border-bottom:1px solid var(--rule)' }, [
          h('div', null, [h('b', null, g[0]), g[2] && g[2] !== '—' ? h('span', { class: 'mono small muted', style: 'margin-left:8px' }, g[2]) : null]),
          h('span', { class: 'pill' + (own ? ' warn' : '') }, own ? '이 가이드가 만든 말' : g[4]),
          h('div', { class: 'small', style: 'grid-column:1/-1' }, g[1]),
          h('div', { class: 'small muted', style: 'grid-column:1/-1' }, '출처 · ' + g[3] + (own ? ' · 처음 나오는 장 ' + g[4] : ''))
        ]));
      });
      if (!rows.length) list.appendChild(P('맞는 낱말이 없습니다. 다른 낱말이나 원어로 찾아보세요.', 'small muted'));
      count.textContent = rows.length + ' / ' + D.glossary.length + '개';
    }
    input.addEventListener('input', function () { q = input.value.trim(); draw(); });
    var mineBtn = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false' }, '이 가이드가 만든 말만');
    mineBtn.addEventListener('click', function () { mine = !mine; mineBtn.setAttribute('aria-pressed', mine ? 'true' : 'false'); draw(); });
    add(body, [h('div', { class: 'controls' }, [input, mineBtn, count]), seg(groups.map(function (g) { return { label: g, key: g }; }), function (k) { grp = k; draw(); }, { lbl: '묶음', start: 0 }), list]);
    body.appendChild(P('원전에서 온 말과 이 가이드가 교육용으로 만든 말을 섞지 않도록 나눴습니다. 2차 자료로만 확인한 출처에는 "(2차)"가 붙어 있습니다.', 'small muted'));
  });

  // ---------- 설계 검사표 ----------
  RENDER.push(function renderChecklist() {
    var body = section('checklist'); if (!body) return;
    var saved = store('check') || {};
    var prog = h('p', { class: 'small', 'aria-live': 'polite' });
    var all = [];
    function box(id, text, where) {
      var cb = h('input', { type: 'checkbox', id: 'ck-' + id });
      cb.checked = !!saved[id];
      cb.addEventListener('change', function () { saved[id] = cb.checked; store('check', saved); upd(); });
      all.push(cb);
      return h('label', { for: 'ck-' + id, style: 'display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start;padding:8px 12px;border-bottom:1px solid var(--rule);cursor:pointer' }, [cb, h('span', null, [h('span', { html: md(text) }), h('span', { class: 'small muted', style: 'display:block' }, '어디서 확인 · ' + where)])]);
    }
    function upd() { var n = all.filter(function (c) { return c.checked; }).length; prog.textContent = n + ' / ' + all.length + '개 확인함 · 표시는 이 브라우저에만 남습니다.'; }
    body.appendChild(H4('맞물림 여덟 질문 (13장)'));
    body.appendChild(h('div', { class: 'panel', style: 'padding:0;box-shadow:none' }, D.checkEight.map(function (c, i) { return box('e' + i, (i + 1) + '. ' + c[0], c[1]); })));
    body.appendChild(P('8번의 마지막 구절("그 규칙 때문에")은 실습 P15를 만들며 실제로 겪은 일에서 왔습니다. 엉뚱한 제약에 걸려 거부된 시험은 그 규칙을 시험하지 않은 것과 같아요. 답이 "예"인데 그 근거를 가리킬 수 없다면 아직 "예"가 아닙니다.', 'small muted'));
    body.appendChild(H4('단계별 점검'));
    D.checkStages.forEach(function (st, si) {
      add(body, [h('details', { class: 'fold' }, [h('summary', null, [st.stage, h('span', { class: 'small muted', style: 'font-weight:400' }, ' · ' + st.ch + ' · ' + st.items.length + '개')]), h('div', { style: 'padding:0' }, st.items.map(function (it, i) { return box('s' + si + '-' + i, it[0], it[1]); }))])]);
    });
    var reset = h('button', { type: 'button', class: 'btn' }, '표시 모두 지우기');
    reset.addEventListener('click', function () { saved = {}; store('check', saved); all.forEach(function (c) { c.checked = false; }); upd(); });
    add(body, [h('div', { class: 'controls' }, [reset]), prog]);
    upd();
  });

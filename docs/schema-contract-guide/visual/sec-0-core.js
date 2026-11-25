  /* ===== 도면 틀 · 서론 ===== */
  RENDER.push(function buildSheets() {
    var root = $('#sheets'), rail = $('#railnav'), top = $('#topnav');
    D.toc.forEach(function (part) {
      root.appendChild(h('div', { class: 'part-head', id: part.id }, [
        h('span', { class: 'eyebrow' }, part.part), h('h2', null, part.q)
      ]));
      rail.appendChild(h('div', { class: 'part' }, part.part));
      var ol = h('ol');
      part.sheets.forEach(function (sh) {
        var num = /^\d+$/.test(sh.n) && sh.id.charAt(0) === 'c' ? sh.n + '장' : (sh.n === '0' ? '서론' : sh.n === 'P' ? '실습' : '부록 ' + sh.n);
        var sec = h('section', { class: 'sheet', id: sh.id, 'aria-labelledby': sh.id + '-h' }, [
          h('div', { class: 'sheet-head' }, [
            h('h3', { id: sh.id + '-h' }, [h('span', { class: 'num' }, num), sh.title]),
            readLink(sh.anchor)
          ]),
          D.goals[sh.id] ? h('p', { class: 'goal', html: '<b>할 수 있게 되는 것</b> · ' + md(D.goals[sh.id]) }) : null,
          D.keys[sh.id] ? h('p', { class: 'key' }, [h('span', { class: 'k' }, '핵심'), D.keys[sh.id]]) : null,
          h('div', { class: 'body' })
        ]);
        root.appendChild(sec);
        ol.appendChild(h('li', null, h('a', { href: '#' + sh.id }, [h('span', { class: 'n' }, /^\d+$/.test(sh.n) && sh.id.charAt(0) === 'c' ? sh.n : '·'), h('span', null, sh.title)])));
        var chip = /^\d+$/.test(sh.n) && sh.id.charAt(0) === 'c' ? sh.n + '장' : { map: '지도', paths: '경로', sort: '분류', practice: '실습', glossary: '용어집', checklist: '검사표' }[sh.id];
        top.appendChild(h('a', { href: '#' + sh.id }, chip));
      });
      rail.appendChild(ol);
    });
  });

  // ---------- 한 장 지도 ----------
  RENDER.push(function renderMap() {
    var body = section('map'); if (!body) return;
    var picker, W = 680, H = 500;
    var svg = svgBox(W, H, '네 산출물의 지도: 위에 이용자마다 외부 스키마 셋, 가운데 개념 스키마, 아래 내부 스키마, 다른 팀으로 나가는 외부 스키마에 계약이 걸린다');
    arrowDefs(svg, 'mapArrow');
    var info = h('div', { class: 'panel c side', 'aria-live': 'polite' });
    var groups = {};
    function hot(key, layer, kids) {
      var g = s('g', { class: 'hot L-' + layer, tabindex: 0, role: 'button', 'aria-label': kids.label }, kids.nodes);
      g.addEventListener('click', function () { picker.pick(['ext', 'con', 'int', 'ctr', 'ec', 'ci'].indexOf(key)); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.pick(['ext', 'con', 'int', 'ctr', 'ec', 'ci'].indexOf(key)); } });
      (groups[key] = groups[key] || []).push(g);
      svg.appendChild(g);
      return g;
    }
    // 팀 경계
    svg.appendChild(s('line', { x1: 452, y1: 6, x2: 452, y2: 168, class: 'ln ln-dash' }));
    svg.appendChild(svgText(446, 18, '← 같은 조직 · 다른 팀 →', 't-sm t-sub', 'middle'));
    // 이용자
    [['회원(앱)', 105], ['안내 데스크', 320], ['회계 시스템(다른 팀)', 572]].forEach(function (u) { svg.appendChild(svgText(u[1], 38, u[0], 't-sm t-mut', 'middle')); });
    // 계약 띠
    hot('ctr', 'ctr', { label: '계약', nodes: [
      s('rect', { x: 468, y: 44, width: 206, height: 122, rx: 4, class: 'box-c', style: 'fill:transparent;stroke-dasharray:6 4' }),
      svgText(571, 158, '계약 · 바꾸지 않겠다는 약속', 't-sm t-b t-c', 'middle')
    ] });
    // 외부 스키마 셋
    [['V1', '내 예약', 15], ['V2', '오늘 일정표', 230], ['E1', '예약 확정 이벤트', 482]].forEach(function (v) {
      hot('ext', 'ext', { label: '외부 스키마 ' + v[0] + ' ' + v[1], nodes: [
        s('rect', { x: v[2], y: 52, width: 180, height: 82, rx: 4, class: 'box-c' }),
        svgText(v[2] + 12, 74, '외부 스키마', 't-sm t-c t-b'),
        svgText(v[2] + 12, 98, v[0] + ' ' + v[1], 't-b'),
        svgText(v[2] + 12, 120, v[0] === 'E1' ? '경계 너머에서 읽음' : '각자 보는 모양', 't-sm t-mut')
      ] });
    });
    // 외부-개념 사상
    var ecNodes = [];
    [[105, 136], [320, 136], [571, 168]].forEach(function (p) {
      ecNodes.push(s('path', { d: 'M' + p[0] + ',' + p[1] + ' C' + p[0] + ',200 340,196 340,232', class: 'ln-c', 'marker-end': 'url(#mapArrow)' }));
    });
    ecNodes.push(s('rect', { x: 14, y: 184, width: 196, height: 26, rx: 13, class: 'fill-paper', style: 'stroke:var(--rule-2)' }));
    ecNodes.push(svgText(112, 202, '외부-개념 사상 · 파생 규칙', 't-sm t-b', 'middle'));
    hot('ec', 'ext', { label: '외부-개념 사상', nodes: ecNodes });
    // 개념 스키마
    hot('con', 'con', { label: '개념 스키마', nodes: [
      s('rect', { x: 150, y: 236, width: 380, height: 96, rx: 4, class: 'box-c' }),
      svgText(168, 262, '개념 스키마', 't-sm t-c t-b'),
      svgText(168, 288, '무엇이 참인가', 't-b'),
      svgText(168, 312, '회원 · 회의실 · 예약 · 확정 예약은 겹치지 않음', 't-sm t-mut')
    ] });
    // 개념-내부 사상
    hot('ci', 'int', { label: '개념-내부 사상', nodes: [
      s('line', { x1: 340, y1: 334, x2: 340, y2: 384, class: 'ln-c', 'marker-end': 'url(#mapArrow)' }),
      s('rect', { x: 356, y: 346, width: 196, height: 26, rx: 13, class: 'fill-paper', style: 'stroke:var(--rule-2)' }),
      svgText(454, 364, '개념-내부 사상 · 저장 방법', 't-sm t-b', 'middle')
    ] });
    // 내부 스키마
    hot('int', 'int', { label: '내부 스키마', nodes: [
      s('rect', { x: 150, y: 388, width: 380, height: 96, rx: 4, class: 'box-c' }),
      svgText(168, 414, '내부 스키마', 't-sm t-c t-b'),
      svgText(168, 440, '어떤 구조로 저장하고 어떻게 찾는가', 't-b'),
      svgText(168, 464, 'booking · EXCLUDE 겹침 금지 · IX1', 't-sm t-mut t-mono')
    ] });
    function show(key) {
      Object.keys(groups).forEach(function (k) { groups[k].forEach(function (g) { g.classList.toggle('on', k === key); }); });
      var L = D.layers[key], M = D.mappings[key];
      clear(info);
      var layer = L ? key : (key === 'ec' ? 'ext' : 'int');
      info.className = 'panel c side L-' + layer + ' fade-in';
      if (L) {
        add(info, [h('div', { class: 'eyebrow' }, L.short), h('h5', null, L.name + ' — ' + L.q), P(L.def), P('**「틈」에서** · ' + L.tum), P(L.example, 'muted small'),
          h('p', { class: 'small' }, [h('a', { href: '#' + L.ch }, (L.ch === 'c02' ? '2장' : L.ch === 'c03' ? '3장' : L.ch === 'c04' ? '4장' : '5장') + ' 도면으로 →')])]);
      } else {
        add(info, [h('div', { class: 'eyebrow' }, '사상'), h('h5', null, M.name + ' — ' + M.sub), P(M.def),
          P('계약은 사상이 아닙니다. 외부 스키마가 경계를 넘을 때 그 경계에 붙는 약속이에요(6장).', 'muted small'),
          h('p', { class: 'small' }, [h('a', { href: '#' + M.ch }, (M.ch === 'c03' ? '3장' : '4장') + ' 도면으로 →')])]);
      }
    }
    picker = seg([{ label: '외부 스키마', key: 'ext', cls: 'c L-ext' }, { label: '개념 스키마', key: 'con', cls: 'c L-con' }, { label: '내부 스키마', key: 'int', cls: 'c L-int' }, { label: '계약', key: 'ctr', cls: 'c L-ctr' }, { label: '외부-개념 사상', key: 'ec' }, { label: '개념-내부 사상', key: 'ci' }], show, { lbl: '골라 보기', start: 1 });
    add(body, [picker, h('div', { class: 'two wide-left' }, [fig(svg, '그림 안의 상자와 띠를 눌러도 됩니다. 세 층을 잇는 화살표가 **사상**(한 층의 표현을 다른 층 표현으로 옮기는 규칙)이고, 오른쪽 위의 **계약**은 원래 세 층 구조에 없던 것을 이 가이드가 넷째 산출물로 넣은 것입니다.', '그림 0-1'), info])]);
    body.appendChild(P('세 층 구조는 1970년대 ANSI/X3/SPARC 연구 그룹의 보고서에서 나왔습니다. 그때의 이용자는 대개 같은 DBMS 안의 응용 프로그램이었지만, 지금은 외부 스키마가 HTTP API·이벤트·데이터 파일의 모양으로 조직 밖까지 나갑니다. 밖으로 나간 외부 스키마는 제공하는 쪽 혼자서 못 바꾸므로, 무엇을 언제까지 지키고 바꿀 때 어떤 절차를 거치는지 적은 약속이 따로 필요합니다.', 'prose muted'));
  });

  // ---------- 읽는 경로 ----------
  RENDER.push(function renderPaths() {
    var body = section('paths'); if (!body) return;
    var groups = [
      ['제1부 이론', ['1', '2', '3', '4', '5', '6']],
      ['제2부 설계 방법', ['7', '8', '9', '10', '11', '12', '13']],
      ['제3부 형식이 있는 씨앗', ['14', '15', '16', '17', '18', '19', '20']],
      ['제4부 거친 자료', ['21', '22', '23', '24', '25', '26']],
      ['제5부 실습', D.problems.map(function (p) { return p[0]; })]
    ];
    var titles = {};
    D.toc.forEach(function (pt) { pt.sheets.forEach(function (sh) { if (sh.id.charAt(0) === 'c') titles[sh.n] = sh.title; }); });
    D.problems.forEach(function (p) { titles[p[0]] = p[1] + ' · ' + p[2]; });
    var chips = {};
    var strip = h('div', { class: 'strip', role: 'list' });
    groups.forEach(function (g) {
      strip.appendChild(h('div', { class: 'grp' }, g[0]));
      g[1].forEach(function (k) {
        var a = h('a', { class: 'ch', role: 'listitem', href: k.charAt(0) === 'P' ? '#practice' : '#c' + (k.length < 2 ? '0' : '') + k }, [h('span', { class: 'n' }, k.charAt(0) === 'P' ? k : k + '장'), titles[k] || '']);
        chips[k] = a; strip.appendChild(a);
      });
    });
    var say = h('p', { class: 'small muted', 'aria-live': 'polite' });
    function pick(i) {
      var p = D.paths[i], seen = {};
      Object.keys(chips).forEach(function (k) { var c = chips[k]; c.classList.remove('in'); c.classList.add('out'); c.style.borderStyle = ''; var o = c.querySelector('.ord'); if (o) o.remove(); });
      p.steps.forEach(function (stepItems, si) {
        stepItems.forEach(function (raw) {
          var opt = raw.slice(-1) === '?', k = opt ? raw.slice(0, -1) : raw;
          var c = chips[k]; if (!c || seen[k]) return; seen[k] = 1;
          c.classList.add('in'); c.classList.remove('out');
          if (opt) c.style.borderStyle = 'dashed';
          c.appendChild(h('span', { class: 'ord', 'aria-label': (si + 1) + '번째' }, String(si + 1)));
        });
      });
      say.innerHTML = '번호는 읽는 차례입니다. 같은 번호끼리는 함께 읽고, <b>점선</b>은 자기 자료 형식에 맞는 것만 골라 읽는 장입니다.';
    }
    add(body, [seg(D.paths.map(function (p, i) { return { label: p.label, key: i }; }), pick, { lbl: '지금 상황', start: 0 }), strip, say]);
  });

  // ---------- 분류 놀이 ----------
  RENDER.push(function renderSort() {
    var body = section('sort'); if (!body) return;
    var CH = [['con', '개념'], ['ext', '외부'], ['int', '내부'], ['ctr', '계약'], ['multi', '둘 이상'], ['none', '어디에도 아님']];
    var deckKey = 'p01', idx = 0, answers = {};
    var card = h('div', { class: 'quiz-card' });
    var dots = h('div', { class: 'dots', role: 'group', 'aria-label': '문장 고르기' });
    var score = h('span', { class: 'pill' });
    var flow = h('div', { class: 'panel', style: 'box-shadow:none' });
    function layerName(k) { return { con: '개념 스키마', ext: '외부 스키마', int: '내부 스키마', ctr: '계약', multi: '둘 이상', none: '어디에도 아님' }[k]; }
    function partsLabel(p) { return p.split(' · ').map(function (k) { return layerName(k); }).join(' + '); }
    function drawFlow(ans) {
      clear(flow);
      flow.appendChild(h('div', { class: 'eyebrow', style: 'margin-bottom:8px' }, '네 질문을 차례로 (P01 실마리)'));
      D.fourQuestions.forEach(function (q) {
        var hit = ans && (ans.a === q[2] || (ans.parts && ans.parts.indexOf(q[2]) >= 0));
        flow.appendChild(h('div', { class: 'L-' + q[2], style: 'display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:8px;align-items:start;padding:6px 8px;border-radius:3px;margin-bottom:3px;' + (hit ? 'background:var(--t);box-shadow:inset 3px 0 0 var(--c)' : 'opacity:' + (ans ? '.55' : '1')) }, [
          h('span', { class: 'mono', style: 'color:var(--c)' }, q[0]), h('span', { class: 'small' }, q[1]), h('span', { class: 'tag L-' + q[2] }, '→ ' + layerName(q[2]).replace(' 스키마', ''))
        ]));
      });
      flow.appendChild(P('넷 모두 "아니오"라면 그 문장은 산출물을 만드는 **입력**이거나 산출물을 **표시하는 방식**일 수 있어요.', 'small muted'));
    }
    function render() {
      var deck = D.quiz[deckKey], it = deck.items[idx], got = answers[deckKey + idx];
      clear(card);
      card.appendChild(h('div', { class: 'eyebrow' }, deck.title + ' · ' + (idx + 1) + ' / ' + deck.items.length));
      card.appendChild(h('div', { class: 'quiz-q' }, [it.d ? h('span', { class: 'dom' }, '[' + it.d + ']') : null, h('span', { html: md(it.t) })]));
      var ch = h('div', { class: 'choices', role: 'group', 'aria-label': '답 고르기' });
      CH.forEach(function (c) {
        var b = h('button', { type: 'button', class: 'btn' }, c[1]);
        if (got) {
          var right = c[0] === it.a || (it.ok && it.ok.indexOf(c[0]) >= 0);
          if (c[0] === got && right) b.classList.add('right');
          else if (c[0] === got) b.classList.add('wrong');
          else if (c[0] === it.a) b.classList.add('right');
        }
        b.addEventListener('click', function () { answers[deckKey + idx] = c[0]; render(); });
        ch.appendChild(b);
      });
      card.appendChild(ch);
      if (got) {
        var ok = got === it.a || (it.ok && it.ok.indexOf(got) >= 0);
        var v = h('div', { class: 'verdict fade-in' }, [
          h('p', null, [h('span', { class: 'pill ' + (ok ? 'ok' : 'bad') }, ok ? '맞음' : '다름'), ' 풀이의 답: ', h('b', null, layerName(it.a)), it.parts ? ' (' + partsLabel(it.parts) + ')' : '']),
          P(it.why), it.p ? P('걸리는 원칙 · ' + it.p, 'small muted') : null,
          it.ok ? P('다른 답이 가능한 곳: ' + it.ok.map(layerName).join(', ') + '도 근거를 대면 맞습니다.', 'small muted') : null
        ]);
        card.appendChild(v);
      }
      var nav = h('div', { class: 'controls', style: 'margin-top:12px' }, [
        h('button', { type: 'button', class: 'btn', onclick: function () { idx = Math.max(0, idx - 1); render(); }, disabled: idx === 0 }, '← 앞 문장'),
        h('button', { type: 'button', class: 'btn primary', onclick: function () { idx = Math.min(deck.items.length - 1, idx + 1); render(); }, disabled: idx === deck.items.length - 1 }, '다음 문장 →'),
        h('button', { type: 'button', class: 'btn', onclick: function () { deck.items.forEach(function (_, i) { delete answers[deckKey + i]; }); idx = 0; render(); } }, '다시 풀기')
      ]);
      card.appendChild(nav);
      clear(dots);
      var nRight = 0, nDone = 0;
      deck.items.forEach(function (x, i) {
        var g = answers[deckKey + i], cls = i === idx ? 'cur' : '';
        if (g) { nDone++; var r = g === x.a || (x.ok && x.ok.indexOf(g) >= 0); if (r) nRight++; cls += r ? ' r' : ' w'; }
        dots.appendChild(h('button', { type: 'button', class: cls, 'aria-label': (i + 1) + '번 문장', onclick: function () { idx = i; render(); } }, String(i + 1)));
      });
      score.textContent = nDone + '개 풀음 · ' + nRight + '개 풀이와 같음' + (deckKey === 'p01' ? ' (통과 기준: 15개 가운데 12개 이상)' : '');
      drawFlow(got ? it : null);
    }
    var deckSeg = seg([{ label: 'P01 문장 열다섯', key: 'p01' }, { label: '6장 문장 여덟', key: 'ch6' }, { label: '서론의 네 문장', key: 'intro' }], function (k) { deckKey = k; idx = 0; render(); }, { lbl: '문제 묶음', start: 0 });
    add(body, [deckSeg, h('div', { class: 'two' }, [h('div', null, [card, dots, h('p', { class: 'small', style: 'margin-top:8px' }, score)]), flow])]);
  });

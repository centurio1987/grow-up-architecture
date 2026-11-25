  /* ===== 제3부 형식이 있는 씨앗 (14~20장) ===== */
  function colChips(str) { return h('span', { style: 'display:inline-flex;gap:3px' }, str.split('').map(function (c) { return col(c); })); }
  function problemLink(p) { return h('p', { class: 'small' }, ['이어지는 실습 · ', h('a', { href: '#practice' }, p)]); }

  // ---------- 14장 ----------
  RENDER.push(function renderC14() {
    var body = section('c14'); if (!body) return;
    body.appendChild(H4('형식마다 주로 채우는 칸 — 줄을 누르면 잘 주는 것과 빼먹는 것'));
    var C6 = ['T', 'F', 'V', 'C', 'R', 'Q'];
    var det = h('div', { 'aria-live': 'polite' });
    var tbl = table(['형식'].concat(C6).concat(['장']), D.seedMap.map(function (r) {
      return [h('b', null, r.fmt)].concat(C6.map(function (c) { return r.cols.indexOf(c) >= 0 ? col(c) : h('span', { class: 'muted', 'aria-label': '없음' }, '·'); })).concat([h('a', { href: '#c' + r.ch }, r.ch + '장')]);
    }), { cls: 'heat', onRow: function (r, i, tr) {
      $$('tbody tr', tbl).forEach(function (x) { x.classList.remove('hl'); }); tr.classList.add('hl');
      var m = D.seedMap[i]; clear(det);
      add(det, [h('div', { class: 'three' }, [note('<b>잘 주는 것</b><br>' + String(m.gives), 'c S-ok'), note('<b>빼먹기 쉬운 것</b><br>' + String(m.misses) + '<br><span class="muted">→ q로 남겨 다시 묻습니다</span>', 'c S-warn'), note('<b>권하는 전략</b><br>' + String(m.strategy) + '<br><span class="muted">7장 전략 표와 맞춤</span>')])]);
    } });
    add(body, [tbl, det]);
    setTimeout(function () { var r = $$('tbody tr', tbl)[3]; if (r) r.click(); }, 0);
    body.appendChild(P('**빈도**를 잘 주는 형식은 없습니다. 담당자에게 직접 묻거나 관찰 자료에서 셉니다. 원고의 원칙은 이렇습니다. "형식이 주는 칸은 받아 적고, 형식이 주지 않는 칸은 물어서 채웁니다."', 'small'));

    body.appendChild(H4('같은 규칙(겹침 금지), 여섯 형식'));
    var rh = h('div', { 'aria-live': 'polite' });
    add(body, [seg(D.sameRule.map(function (r, i) { return { label: r.fmt, key: i }; }), function (i) {
      var r = D.sameRule[i]; clear(rh);
      add(rh, [h('pre', { class: 'memo mono', style: 'font-size:13px;white-space:pre-wrap;margin:0' }, r.text), P('**이 형식이 주는 것** · ' + r.gives, 'small')]);
    }, { start: 0 }), rh]);
    body.appendChild(P('어느 한 형식만으로는 규칙의 모든 면을 얻지 못합니다. Gherkin의 메시지와 EARS의 409는 충돌이 아니라 서로 다른 층의 이야기예요. 메시지는 외부 스키마나 표시의 일이고, 409는 API 계약(실패표)의 일입니다.', 'small muted'));

    var _b = body; body = foldInto(_b, '출발 근거 수준과 여러 형식을 옮기는 순서');
    body.appendChild(table(['씨앗', '출발 근거 수준', '확인으로 올리는 길'], D.seedStart.map(function (r) { return [r[0], h('span', { class: 'ev ' + (r[1].indexOf('확인') === 0 ? '확인' : '진술') }, [h('i'), r[1]]), r[2]]; })));
    body.appendChild(H4('여러 형식이 섞여 들어왔을 때 옮기는 순서'));
    body.appendChild(h('ol', { style: 'list-style:none;padding:0;margin:0;display:grid;gap:6px' }, D.seedOrder.map(function (o, i) { return h('li', { class: 'panel', style: 'box-shadow:none;padding:10px 14px;display:grid;grid-template-columns:28px minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:center' }, [h('span', { class: 'mono', style: 'color:var(--ink-3)' }, String(i + 1)), h('div', null, [h('b', null, o[0]), o[1] ? h('div', { class: 'small muted' }, o[1]) : null]), h('div', { class: 'small', html: md('→ ' + o[2]) })]); })));
    body.appendChild(P('원장은 형식마다 **따로** 적습니다. 처음부터 섞어 적으면 같은 개념을 두 형식이 다른 이름으로 부를 때 그 차이가 기록되지 않아요. 출처 칸에는 형식 이름을 함께 적습니다(예: `콘셉트 3쪽`, `양식 A 칸 7`).', 'small muted'));
    body = _b;
  });

  // ---------- 15장 ----------
  RENDER.push(function renderC15() {
    var body = section('c15'); if (!body) return;
    var F = D.formats.c15;
    body.appendChild(H4('서사 시나리오 여섯 줄 → 원장 열 줄'));
    body.appendChild(linked(F.seed, F.ledger.map(function (r) { return [r[0], r[1], r[2], r[3], r[1] === 'Q' ? null : '진술']; }), { seedTitle: '서사 시나리오 (11월 17일)' }));
    body.appendChild(note('**새로 나온 연산** `O3 연장하기(예약번호, 새 끝 시각)` · pre 예약이 확정, 새 끝 > 지금 끝, 새 끝 - 시작 ≤ 240분 · post 예약의 끝 시각이 새 끝으로 바뀜(q1 답이 "바꾼다"일 때) · inv R3 바뀐 구간으로 다시 검사 · 실패 inv1 충돌 → 409 slot_taken<br>' + String(F.note), 'c L-ctr'));
    var _b = body; body = foldInto(_b, '옮기는 규칙과 이야기 형식이 빼먹기 쉬운 것');
    body.appendChild(H4('옮기는 규칙'));
    body.appendChild(table(['씨앗의 요소', '원장 칸', '메모'], F.rules.map(function (r) { return [r[0], colChips(r[1]), r[2]]; })));
    body.appendChild(P('C와 F는 시제로 가릅니다. 이미 일어난 일("예약을 마쳤다")은 F, 이야기가 보여 주는 행동("예약 버튼을 누른다")은 C입니다. 도메인 스토리(Hofer·Schwentner 2021)에는 "만약"이나 "또는"이 없습니다. 대안 흐름은 **스토리를 하나 더 그려 달라고** 요청해서 얻고, 두 스토리의 차이가 곧 규칙이 됩니다.', 'small'));
    body.appendChild(H4('이야기 형식이 빼먹기 쉬운 것'));
    body.appendChild(table(['빠지기 쉬운 것', '찾는 질문', '「틈」에서'], F.misses));
    body = _b;
    body.appendChild(problemLink(F.problem + ' 작은 도서관 상호대차'));
  });

  // ---------- 16장 ----------
  RENDER.push(function renderC16() {
    var body = section('c16'); if (!body) return;
    var F = D.formats.c16;
    body.appendChild(H4('유스케이스 UC-1 「회의실을 예약한다」의 칸이 계약 O1로'));
    var ucBody = h('div', { 'aria-live': 'polite' });
    var rows = F.uc.map(function (u) { return [h('b', null, u[0]), u[1], h('span', { class: 'tag L-ctr', style: 'white-space:normal' }, u[2])]; });
    add(body, [table(['UC-1의 칸', '적힌 내용', '→ 계약 O1'], rows), ucBody]);
    body.appendChild(note(F.ucOnly + ' 사전조건 "로그인했다"는 담화 세계의 규칙이 아니라 경계의 **보안 조건**이라 O1의 pre로 옮기지 않고, OpenAPI `security`와 401 줄로 따로 적습니다.', 'c L-ctr'));
    var _b = body; body = foldInto(_b, '데이터 정밀도 세 단계 · 사용자 스토리 · 빼먹기 쉬운 것');
    body.appendChild(H4('데이터 정밀도 세 단계 — 유스케이스에는 별칭만'));
    var pr = svgBox(680, 180, '데이터 정밀도는 별칭, 필드, 형식의 세 단계로 구체화된다', 'minw-560');
    F.precision.forEach(function (p, i) {
      var x = 10 + i * 224, y = 96 - i * 40, g = s('g', { class: i === 0 ? 'L-none' : i === 1 ? 'L-ext' : 'L-ctr' });
      g.appendChild(s('rect', { x: x, y: y, width: 214, height: 180 - y - 6, rx: 3, class: i === 0 ? 'box-s' : 'box-c' }));
      g.appendChild(svgText(x + 10, y + 20, p[0], 't-sm t-b'));
      var pl = wrapLines(p[1], 18);
      g.appendChild(svgLines(x + 10, y + 40, pl, 't-sm t-mono', 'start', 15));
      g.appendChild(svgText(x + 10, y + 44 + pl.length * 15, '← ' + p[2], 't-sm t-mut'));
      pr.appendChild(g);
    });
    body.appendChild(fig(pr, '`시작: 날짜-시각, 30분 경계, 오프셋 필수`(3단계)는 JSON Schema와 계약의 구조·의미 겹에 들어갑니다. 필드 목록이 없는 것은 유스케이스가 원래 **행위**를 적는 형식이라서이고, 필드는 q로 남겨 따로 묻습니다(Cockburn 2000 초안).', '그림 16-1'));
    body.appendChild(H4('사용자 스토리를 옮길 때'));
    body.appendChild(table(['스토리의 부분', '원장 칸', '메모'], F.story.map(function (r) { return [r[0], colChips(r[1]), r[2]]; })));
    body.appendChild(P('스토리는 일의 단위로 나뉘었을 뿐 데이터는 겹칩니다(INVEST의 I). 그래서 스토리 묶음을 옮긴 뒤에는 10장의 뷰 통합이 거의 늘 필요합니다. 예: S1 "취소한 예약은 보이지 않는다"와 9장 V1(지난 예약도 최근순으로 보임)이 같은 외부 스키마인지 스토리는 답하지 않아 q8로 남깁니다.', 'small muted'));
    body.appendChild(table(['빠지기 쉬운 것', '유스케이스에서', '사용자 스토리에서', '채우는 질문'], [['데이터 필드', '별칭만 있음(원래 그런 형식)', '거의 없음', '"예약 정보에는 무엇이 들어가나요?"'], ['화면이 막아 주던 조건', '주 흐름에서 빠짐', '인수 조건에서 빠짐', '"화면을 안 거치고 요청이 오면?"'], ['사이의 공유 데이터', '각자 따로 적음', '각자 따로 적음', '"이 둘이 다루는 예약은 같은 것인가요?"'], ['빈도', '없음', '없음', '"하루에 몇 번인가요?"'], ['동시성', '확장에 드물게', '거의 없음', '"두 사람이 동시에 하면?"']]));
    body = _b;
    body.appendChild(problemLink(F.problem));
  });

  // ---------- 17장 ----------
  RENDER.push(function renderC17() {
    var body = section('c17'); if (!body) return;
    var F = D.formats.c17;
    body.appendChild(H4('Examples 표는 곧 인구입니다 — 경계값을 더해 규칙의 빈틈 찾기'));
    body.appendChild(h('pre', { class: 'memo mono', style: 'font-size:12.5px;white-space:pre-wrap;margin:0 0 10px' }, 'Rule: 시작 1시간 전보다 늦게 취소하면 사용으로 셈한다\n  Background: Given 회원 M31 은 일반 등급이다\n  Scenario Outline: 취소 시각에 따라 사용 시간이 달라진다\n    Given M31 의 확정 예약이 R1 에 <시작> 부터 60분 있다\n    When M31 이 <취소 시각> 에 그 예약을 취소한다\n    Then 예약은 취소 상태가 된다\n    And 그 예약은 사용 시간에 <셈>'));
    var op = '>', extra = false;
    var th = h('div', { 'aria-live': 'polite' });
    function draw() {
      var rows = F.examples.map(function (e) { return { e: e, kind: 'given' }; });
      if (extra) rows = rows.concat(F.extra.map(function (e) { return { e: e, kind: 'extra' }; }));
      var diff = false;
      var out = rows.map(function (r) {
        var m = r.e.min, counts;
        if (m > 0) counts = null; else counts = op === '>' ? m > -60 : m >= -60;
        var res = counts == null ? h('span', { class: 'pill warn' }, '규칙 밖') : h('span', { class: 'pill ' + (counts ? 'bad' : 'ok') }, counts ? '들어간다' : '들어가지 않는다');
        var exp = r.kind === 'given' ? r.e.given : '?';
        if (r.kind === 'given' && counts != null && ((counts ? '들어간다' : '들어가지 않는다') !== exp)) diff = true;
        return ['10:00', r.e.cancel, r.kind === 'given' ? exp : h('span', { class: 'muted' }, '? ' + r.e.ask), res, r.e.q || ''];
      });
      clear(th);
      add(th, [table(['시작', '취소 시각', '표의 셈', 'D1로 계산', '남는 질문'], out, { rowClass: function (r, i) { return i >= 3 ? 'hl' : null; } }),
        P(op === '>' ? 'D1을 `취소 시각 > 시작 - 1시간`("까지"를 포함으로 읽음)으로 두었습니다. 처음 세 줄은 표와 같습니다.' : 'D1을 `≥`로 바꿔도 처음 세 줄의 결과는 그대로입니다. **처음 세 줄로는 `>`와 `≥`를 가르지 못합니다.** 정확히 1시간 전(09:00) 줄을 더해야 갈립니다.', 'small'),
        extra ? note('`q9 정확히 시작 1시간 전(예: 10:00 예약을 09:00에) 취소하면 무료인가?` "까지"를 포함으로 읽으면 무료 → D1은 `>`(8장·13장의 식). 사용으로 센다는 답이 오면 D1과 13장 질의를 `≥`로 바꿉니다. 10:10 줄은 규칙이 다루지 않던 경우라 R4(상태 전이)의 문제로 q에 둡니다.', 'c L-con') : null,
        diff ? P('표와 다릅니다.', 'small') : null]);
    }
    add(body, [seg([{ label: 'D1: 취소 > 시작 - 1시간', key: '>' }, { label: 'D1: 취소 ≥ 시작 - 1시간', key: '>=' }], function (k) { op = k === '>' ? '>' : '>='; draw(); }, { lbl: '식', start: 0 }),
      h('div', { class: 'controls' }, [(function () { var b = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false' }, '경계값·반례 줄 더하기'); b.addEventListener('click', function () { extra = !extra; b.setAttribute('aria-pressed', extra ? 'true' : 'false'); draw(); }); return b; })()]), th]);
    body.appendChild(P('원고의 한 줄: "예시 표에 줄을 하나 더할 때마다 담당자에게 질문 하나가 생깁니다." 자동 실행되는 시험이 있다고 계약이 완성된 것은 아닙니다. 예와 예 사이의 값(09:00)은 시험되지 않으니까요.', 'small muted'));
    var _b = body; body = foldInto(_b, 'Gherkin을 원장으로 옮기는 규칙');
    body.appendChild(table(['Gherkin', '원장 칸', '산출물에서'], F.rules.map(function (r) { return [h('code', null, r[0]), colChips(r[1]), r[2]]; })));
    body = _b;
    body.appendChild(problemLink(F.problem + ' 온라인 서점 쿠폰'));
  });

  // ---------- 18장 ----------
  RENDER.push(function renderC18() {
    var body = section('c18'); if (!body) return;
    var F = D.formats.c18;
    var kindOf = { evt: 0, cmd: 1, actor: 2, pol: 3, rm: 4, agg: 5, ext: 6, hot: 7 };
    var info = h('div', { class: 'panel side', 'aria-live': 'polite' });
    var board = h('div', { class: 'board', role: 'list', 'aria-label': '「틈」 이벤트 스토밍 보드' });
    function show(k, el) {
      $$('.stk', board).forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-k') === k); });
      var st = F.stickies[kindOf[k]];
      clear(info);
      add(info, [h('div', { class: 'eyebrow' }, '스티커 종류'), h('h5', null, st.kind), h('p', null, ['원장 칸 · ', colChips(st.cols)]), P('산출물 · ' + st.dest), el ? P('이 스티커 · "' + el.textContent.replace(st.kind, '').trim() + '"', 'small muted') : null]);
    }
    F.board.forEach(function (row) {
      board.appendChild(h('div', { class: 'board-row', role: 'listitem' }, row.map(function (c) {
        var b = h('button', { type: 'button', class: 'stk ' + c[0], 'data-k': c[0] }, [h('span', null, [h('span', { class: 'k' }, F.stickies[kindOf[c[0]]].kind), c[1]])]);
        b.addEventListener('click', function () { show(c[0], b); });
        return b;
      })));
    });
    add(body, [H4('「틈」 보드 — 스티커를 누르면 원장 칸과 산출물'), h('div', { class: 'two wide-left' }, [board, info])]);
    show('pol');
    body.appendChild(note(F.colorNote + ' 범례를 확인하지 못했다면 글로 판단합니다. "~하면 ~한다" 꼴이면 정책, 시스템 이름이면 외부로 옮기고, q에 범례 확인을 남깁니다.', 'c L-con'));
    body.appendChild(P('이벤트는 과거형이라 이벤트 하나에서 원장 줄이 둘 나옵니다. 상태가 바뀌었다는 사실(F)과 이벤트 계약 후보예요. 다른 팀이 받아야 하면 계약이 되고, 같은 시스템 안의 일이면 계약 없이 끝납니다. 기준은 **경계를 넘는지**입니다.', 'small'));
    var _b = body; body = foldInto(_b, '집합체가 정하는 범위와 보드가 빼먹기 쉬운 것');
    body.appendChild(h('div', { class: 'two' }, F.aggregate.map(function (a, i) { return note('<b>' + String(a[0]) + '</b><br>' + String(a[1]), 'c L-none'); })));
    body.appendChild(P('둘 다 가능하고, 고른 것을 보장 위치표에 적습니다. 핫스팟 "동시에 같은 시간을 누르면?"은 계약 O1의 행위 겹(동시성)과 보장 위치표의 R3 줄을 보고 닫습니다. 정책 r11(시작 15분 뒤 입실 표시가 없으면 노쇼)은 DB 제약이 값이 바뀔 때만 검사해 시각이 지나는 것을 지킬 수 없으므로 주기 작업이 맡습니다.', 'small muted'));
    body.appendChild(table(['빠지기 쉬운 것', '이유', '채우는 질문'], [['속성', '스티커에는 이벤트 이름만 씀', '"이 이벤트가 일어났을 때 무엇을 알아야 하나요?" (페이로드)'], ['식별', '이름은 있지만 무엇으로 부르는지 없음', '"어떤 예약이 취소되었는지 무엇으로 알죠?"'], ['빈도와 규모', '보드는 흐름만 보여 줌', '"이 명령은 하루에 몇 번?"'], ['실패 흐름', '일이 잘 풀리는 흐름 위주', '명령마다 "거절되면 어떤 이벤트가?"'], ['시간에 따른 규칙', '정책에 시각이 있어도 기준이 없음', '"15분은 예약 시작 기준인가요, 입실 예정 기준인가요?"']]));
    body = _b;
    body.appendChild(problemLink(F.problem + ' 온라인 강의 수강 신청'));
  });

  // ---------- 19장 ----------
  RENDER.push(function renderC19() {
    var body = section('c19'); if (!body) return;
    var F = D.formats.c19;
    body.appendChild(H4('EARS 패턴마다 가는 곳'));
    var eh = h('div', { 'aria-live': 'polite' });
    add(body, [seg(F.ears.map(function (e, i) { return { label: e.p + (e.kw !== '(없음)' && e.kw !== '조합' ? ' · ' + e.kw : ''), key: i }; }), function (i) {
      var e = F.ears[i]; clear(eh);
      add(eh, [h('div', { class: 'two' }, [
        h('div', { class: 'panel c L-con' }, [h('div', { class: 'eyebrow' }, '틀'), h('h5', { class: 'mono', style: 'font-weight:500' }, e.tpl), h('p', null, ['원장 칸 · ', colChips(e.cols)]), P('산출물 · ' + e.dest)]),
        e.req ? h('div', { class: 'panel' }, [h('div', { class: 'eyebrow' }, '「틈」 ' + e.req), P(e.text), P('→ ' + e.out, 'small mono')]) : h('div', { class: 'panel' }, P('여러 패턴의 조합입니다. 예: "~인 동안, ~하면, 시스템은 ~해야 한다" → 상태 조건이 붙은 사후조건.', 'small'))
      ])]);
    }, { start: 3 }), eh]);
    body.appendChild(P('If-then 문장은 실패표의 "어긴 조건"과 "돌려주는 것"을 이미 채워서 줍니다. 상태 변화와 다시 시도 칸만 물어서 채우면 됩니다. ' + F.whenWhile + ' 둘을 섞어 읽으면 규칙의 종류가 바뀝니다.', 'small'));
    body.appendChild(note('**Where 절을 거꾸로 읽으면 나오는 제약** REQ-08에서 `F14 회의실 은 화상 장비 를 가진다`, `F15 예약 은 화상 장비 사용 여부 를 가진다`(둘 다 필수 아님), 그리고 문장에 직접 적혀 있지 않은 `R14 F15를 가진 예약의 회의실은 F14를 가진다`(집합 비교: 부분집합)가 나옵니다. 계약 O1에서는 `videoConference` 선택 필드가 됩니다.', 'c L-con'));
    var _b = body; body = foldInto(_b, 'should 문장과 좋은 요구의 아홉 특성');
    body.appendChild(note(F.should, ''));
    body.appendChild(H4('좋은 요구의 아홉 특성(29148, 2차 자료) → 이 가이드의 점검'));
    body.appendChild(table(['특성', '요지', '이어지는 점검'], [['Appropriate', '추상화 수준이 알맞고 구현 세부가 없음', '개념화 원칙(2장)'], ['Complete', '이해에 필요한 정보가 다 있음', '원장의 q가 남아 있지 않은가'], ['Conforming', '승인된 틀을 따름', 'EARS 패턴을 따르는가'], ['Correct', '필요를 바르게 나타냄', '근거 수준이 확인인가'], ['Feasible', '제약 안에서 실현 가능', '보장 위치표에 자리가 있는가'], ['Necessary', '빼면 결함이 생기는 것', '적절성(10장)'], ['Singular', '한 가지만 말함', '원장 한 줄에 하나("그리고" 검사)'], ['Unambiguous', '해석이 하나뿐', '용어(T 칸)'], ['Verifiable', '증명하거나 잴 수 있음', '반례 시험, 품질 겹의 측정 방법']]));
    body = _b;
    body.appendChild(problemLink(F.problem + ' 스마트 온실 경보'));
  });

  // ---------- 20장 ----------
  RENDER.push(function renderC20() {
    var body = section('c20'); if (!body) return;
    var F = D.formats.c20;
    body.appendChild(H4('종이 신청서의 칸마다 출처 가르기'));
    var byK = {}; F.fields.forEach(function (f) { byK[f.k] = f; });
    var info = h('div', { class: 'panel side', 'aria-live': 'polite' });
    var BADGE = ['직접', '옮김', '계산', '인쇄', '담당'];
    function fld(k, text) { return '<span class="fld" tabindex="0" data-k="' + k + '"><sup class="ob">' + BADGE[byK[k].o] + '</sup>' + esc(text) + '</span>'; }
    var form = h('div', { class: 'paper-form', role: 'group', 'aria-label': '회의실 이용 신청서', html: [
      '<b>회의실 이용 신청서</b>' + ' '.repeat(20) + fld('no', 'No. 2026-0412'),
      '신청일  ' + fld('date', '2026 년 11 월 10 일'),
      '회원번호 ' + fld('member', '[ M07 ]  이름 [ 김하나 ]') + '  등급 ' + fld('grade', '(V)일반 ( )상주'),
      '회의실  ' + fld('room', '(V)R1 6인  ( )R2 4인  ( )R3'),
      '이용 일시  ' + fld('when', '11 월 17 일  10:00 ~ 11:30') + '  ※ 30분 단위로 적으세요',
      '참석자  ' + fld('guests', '1. 이수민  2. 정다은  3. ________'),
      '화상 장비  ' + fld('video', '( )사용  (V)미사용'),
      '<div class="rule"></div><span class="muted">― 데스크 기입 ―</span>',
      '접수 ' + fld('recv', '[ 이지원 (서명) ]') + '  입실 확인 ' + fld('checkin', '[ 10:02 ]') + '  이용 시간 ' + fld('mins', '[ 90 ] 분')
    ].join('<br>') });
    function pick(k) {
      $$('.fld', form).forEach(function (e) { e.classList.toggle('on', e.getAttribute('data-k') === k); });
      var f = byK[k], o = F.origins[f.o];
      clear(info);
      add(info, [h('div', { class: 'eyebrow' }, '칸'), h('h5', null, f.label), h('p', null, [h('span', { class: 'tag' }, BADGE[f.o] + ' · ' + o[0]), ' ', o[1]]), h('p', null, ['원장 · ', h('code', null, f.led), ' · 칸 ', colChips(o[2])]), P(f.memo, 'small'), P('개념 스키마에서 · ' + o[3], 'small muted')]);
    }
    form.addEventListener('click', function (e) { var t = e.target.closest('.fld'); if (t) pick(t.getAttribute('data-k')); });
    form.addEventListener('keydown', function (e) { var t = e.target.closest && e.target.closest('.fld'); if (t && e.key === 'Enter') pick(t.getAttribute('data-k')); });
    var legend = h('div', { class: 'legend small' }, F.origins.map(function (o, i) { return h('span', null, [h('sup', { class: 'ob' }, BADGE[i]), o[0]]); }));
    add(body, [legend, h('div', { class: 'two wide-left' }, [form, info])]);
    pick('grade');
    body.appendChild(P('**옮겨 적음**이 가장 놓치기 쉽습니다. 등급은 회원의 사실이지 신청서의 사실이 아니에요. 놓치면 4장의 갱신 이상이 생깁니다. 다만 그 시점의 등급을 기록하려는 칸일 수도 있으니 담당자에게 묻습니다(9장의 시점 질문). 반복 영역(참석자 세 칸)은 1:N이고, 세 칸이 규칙인지 종이가 좁아서인지는 q15로 묻습니다. 계산 칸(이용 시간)은 저장하지 않고 파생으로 둡니다.', 'small'));
    var _b = body; body = foldInto(_b, '산출물 조각과 화면·보고서를 읽는 규칙');
    body.appendChild(table(['구분', '내용'], F.out));
    body.appendChild(P('화면 시안에서는 버튼 하나가 대개 연산 하나(C)이고, 버튼이 비활성으로 그려진 조건은 그 연산의 사전조건(R)입니다. 보고서는 대개 외부 스키마 하나이고, 머리글의 날짜·합계 행·각주를 특히 봅니다. 각주 한 줄은 r 한 줄이 됩니다.', 'small muted'));
    body = _b;
    body.appendChild(problemLink(F.problem + ' 동네 학원'));
  });

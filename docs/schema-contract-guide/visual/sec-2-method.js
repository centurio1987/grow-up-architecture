  /* ===== 제2부 설계 방법 (7~13장) ===== */
  function steps(list, opts) {
    // 가로로 이어진 단계 띠. list: [[제목, 설명]]
    opts = opts || {};
    return h('ol', { class: 'stepline', style: 'list-style:none;padding:0;margin:8px 0 16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(' + (opts.min || 150) + 'px,1fr));gap:6px' }, list.map(function (x, i) {
      return h('li', { class: 'panel', style: 'box-shadow:none;padding:10px 12px' }, [h('div', { class: 'mono small', style: 'color:var(--ink-3)' }, String(i + 1)), h('div', { style: 'font-weight:600;font-size:14.5px' }, x[0]), x[1] ? h('div', { class: 'small muted', html: md(x[1]) }) : null]);
    }));
  }

  // ---------- 7장 ----------
  RENDER.push(function renderC07() {
    var body = section('c07'); if (!body) return;
    body.appendChild(H4('「틈」 콘셉트 메모를 원장 열여덟 줄로'));
    body.appendChild(P('운영 매니저가 쓴 메모 일곱 줄입니다. 메모 줄을 누르면 그 줄에서 나온 원장 줄이, 원장 줄을 누르면 출처가 켜집니다. 근거 수준은 모두 **진술**입니다. 매니저가 말했지만 아직 책임자 승인을 받지 않았으니까요.', 'prose small'));
    body.appendChild(linked(D.memo, D.ledger7, { seedTitle: '콘셉트 메모(운영 매니저)' }));
    body.appendChild(P('t2는 씨앗 자체의 오류를 그대로 적고 해석을 붙인 줄입니다. 원장은 씨앗을 고쳐 쓰는 곳이 아니라 **옮겨 적는 곳**이에요. q5는 메모에 아예 없는 정보(빈도)를 묻습니다.', 'small muted'));

    // 여섯 칸 → 산출물
    body.appendChild(H4('여섯 칸은 각각 뒤의 산출물 하나로 이어지도록 골랐습니다'));
    var svg = svgBox(680, 300, '원장의 여섯 칸이 각각 어떤 산출물로 이어지는지 보여 준다', 'minw-560');
    arrowDefs(svg, 'c7a', 'arrowhead');
    var targets = { glos: [450, 14, '용어집 · 모든 산출물의 이름', 'none'], con: [450, 62, '개념 스키마 · 사실 유형(F) · 제약(R)', 'con'], ext: [450, 110, '외부 스키마 (V)', 'ext'], ctr: [450, 158, '계약 · 연산(C) · 조건(R)', 'ctr'], int: [450, 206, '내부 스키마 · 작업 부하(C의 빈도)', 'int'], q: [450, 254, '가정 목록 · 다음 인터뷰 (Q)', 'none'] };
    var edges = { T: [['glos', '']], F: [['con', '사실 유형']], V: [['ext', '']], C: [['ctr', '연산 계약'], ['int', '빈도 → 작업 부하']], R: [['con', '제약'], ['ctr', '계약의 조건']], Q: [['q', '']] };
    var colY = { T: 14, F: 62, V: 110, C: 158, R: 206, Q: 254 };
    var eg = {}, tg = {};
    Object.keys(targets).forEach(function (k) {
      var t = targets[k], g = s('g', { class: 'L-' + t[3] });
      g.appendChild(s('rect', { x: t[0], y: t[1], width: 224, height: 36, rx: 3, class: t[3] === 'none' ? 'box-s' : 'box-c' }));
      g.appendChild(svgText(t[0] + 12, t[1] + 23, t[2], 't-sm t-b'));
      tg[k] = g; svg.appendChild(g);
    });
    var info = h('div', { class: 'panel side', 'aria-live': 'polite' });
    D.cols6.forEach(function (c) {
      var y = colY[c[0]], g = s('g', { class: 'hot', tabindex: 0, role: 'button', 'aria-label': c[0] + ' ' + c[1] });
      g.appendChild(s('rect', { x: 10, y: y, width: 190, height: 36, rx: 3, class: 'box' }));
      g.appendChild(svgText(24, y + 23, c[0], 't-mono t-b'));
      g.appendChild(svgText(48, y + 23, c[1], 't-b'));
      svg.appendChild(g);
      eg[c[0]] = [];
      edges[c[0]].forEach(function (e) {
        var t = targets[e[0]], p = s('g', { class: 'L-' + (t[3] === 'none' ? 'none' : t[3]) });
        p.appendChild(s('path', { d: 'M200,' + (y + 18) + ' C320,' + (y + 18) + ' 330,' + (t[1] + 18) + ' 446,' + (t[1] + 18), class: 'ln-c', 'marker-end': 'url(#c7a)', style: 'stroke:var(--c)' }));
        eg[c[0]].push(p); svg.appendChild(p);
      });
      function pick() {
        Object.keys(eg).forEach(function (k) { eg[k].forEach(function (p) { p.classList.toggle('dim', k !== c[0]); }); });
        clear(info); add(info, [h('h5', null, [col(c[0]), ' ', c[1]]), P('적는 것 · ' + c[2], 'small'), P('문장 꼴 · ' + c[3], 'small mono'), P('이어지는 산출물 · **' + c[4] + '**', 'small')]);
      }
      g.addEventListener('click', pick); g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
      if (c[0] === 'R') setTimeout(pick, 0);
    });
    add(body, [h('div', { class: 'two wide-left' }, [fig(svg, '칸을 눌러 보세요. 원장 줄마다 **출처**(쪽·줄, 시트·칸, 날짜·발화자)와 **근거 수준**을 반드시 붙입니다.', '그림 7-1'), info])]);

    // 근거 수준
    body.appendChild(H4('근거 수준은 올라갑니다'));
    var ladder = svgBox(680, 232, '관찰에서 진술로, 진술에서 확인으로 올라가고, 수준마다 규칙을 다루는 방법이 다르다', 'minw-560');
    arrowDefs(ladder, 'c7b');
    [['확인', '책임자가 규칙으로 승인', '"운영 책임자가 R3을 업무 규칙으로 승인 (2026-11-10 회의록)"', 'DB 제약이나 계약의 사전조건으로 강하게 지킴', 2],
     ['진술', '누군가 그렇다고 말했다', '"매니저: 겹치게는 못 잡아요"', '응용에서 경고로 시작하고, 확인을 받으면 올림. Q에 "확인 필요"', 1],
     ['관찰', '자료에서 보였다', '"예약 기록 2천 건에서 같은 회의실 겹침이 한 번도 없었다"', '규칙으로 쓰지 않음. 감시 질의로 반례가 생기는지 지켜봄', 0]].forEach(function (l, k) {
      var y = 6 + k * 76, x = 130;
      ladder.appendChild(s('rect', { x: x, y: y, width: 540, height: 66, rx: 4, class: 'box', style: 'stroke-width:' + (1 + l[4] * .6) }));
      ladder.appendChild(s('circle', { cx: x + 18, cy: y + 19, r: 6, style: 'stroke:var(--ink-2);stroke-width:1.5;fill:' + (l[4] === 2 ? 'var(--ink-2)' : l[4] === 1 ? 'url(#halfFill)' : 'transparent') }));
      ladder.appendChild(svgText(x + 32, y + 24, l[0] + ' · ' + l[1], 't-sm t-b'));
      ladder.appendChild(svgText(x + 14, y + 42, l[2], 't-sm t-mut'));
      ladder.appendChild(svgText(x + 14, y + 59, '→ ' + l[3], 't-sm'));
    });
    [[158, 92, '담당자에게', '물어 진술을 얻음'], [82, 16, '책임자에게', '가서 확인을 얻음']].forEach(function (a) {
      ladder.appendChild(s('line', { x1: 118, y1: a[0] + 30, x2: 118, y2: a[1] + 40, class: 'ln', 'marker-end': 'url(#c7b)' }));
      ladder.appendChild(svgLines(108, a[0] + 2, [a[2], a[3]], 't-sm t-sub', 'end', 15));
    });
    var dfs = ladder.querySelector('defs');
    var lg = s('linearGradient', { id: 'halfFill' }, [s('stop', { offset: '50%', style: 'stop-color:var(--ink-2)' }), s('stop', { offset: '50%', style: 'stop-color:transparent' })]);
    dfs.appendChild(lg);
    body.appendChild(fig(ladder, '진술만 있는 규칙을 DB 제약으로 걸었는데 업무에 예외가 있으면 그 예외를 기록할 길이 막힙니다. 관찰만으로는 규칙이 있다는 증거가 되지 않습니다(21장).', '그림 7-2'));

    // 전략
    var _b = body; body = foldInto(_b, '씨앗에 맞는 설계 전략 고르기');
    var sh = h('div');
    function drawStrat(i) {
      var ss = D.seedStrategy[i];
      clear(sh);
      sh.appendChild(table(['전략', '출발점', '진행', '「틈」에서'], D.strategies, { rowClass: function (r) { return ss[1].indexOf(r[0]) >= 0 ? 'hl' : null; } }));
      sh.appendChild(P('**' + ss[0] + '** → ' + ss[1].join(' 또는 ') + ' · ' + ss[2] + '. 이 가이드의 권고이고, 한 프로젝트에서 여러 전략을 섞는 것이 보통입니다.', 'small'));
    }
    add(body, [seg(D.seedStrategy.map(function (x, i) { return { label: x[0], key: i }; }), drawStrat, { lbl: '받은 씨앗', start: 0 }), sh]);
    body = _b;

    // 설계의 흐름
    body.appendChild(H4('설계의 흐름 — 폭포가 아닙니다'));
    var fl = svgBox(680, 300, '씨앗 읽기부터 검증까지 여덟 단계가 이어지고, 새 질문이 생기면 원장으로 돌아간다', 'minw-560');
    arrowDefs(fl, 'c7c');
    var links = { '7장': '#c07', '8장': '#c08', '9장': '#c09', '10장': '#c10', '11장': '#c11', '12장': '#c12', '13장': '#c13', '14~26장': '#c14' };
    D.flow7.forEach(function (f, i) {
      var colI = i % 4, row = Math.floor(i / 4), x = 10 + colI * 168, y = 30 + row * 150;
      var a = s('a', { href: links[f[2]] || '#c07' });
      a.appendChild(s('rect', { x: x, y: y, width: 150, height: 84, rx: 4, class: 'box' }));
      a.appendChild(svgText(x + 10, y + 20, (i + 1) + '. ' + f[0], 't-sm t-b'));
      if (f[1]) a.appendChild(svgLines(x + 10, y + 42, wrapLines(f[1], 17), 't-sm t-mut', 'start', 15));
      a.appendChild(svgText(x + 140, y + 76, f[2], 't-sm t-sub', 'end'));
      fl.appendChild(a);
      if (colI < 3) fl.appendChild(s('line', { x1: x + 150, y1: y + 42, x2: x + 166, y2: y + 42, class: 'ln', 'marker-end': 'url(#c7c)' }));
      else if (row === 0) fl.appendChild(s('path', { d: 'M' + (x + 75) + ',' + (y + 86) + ' C' + (x + 75) + ',150 85,140 85,176', class: 'ln', 'marker-end': 'url(#c7c)' }));
    });
    fl.appendChild(s('path', { d: 'M589,266 C589,296 250,296 250,120', class: 'ln ln-dash', 'marker-end': 'url(#c7c)', style: 'stroke:var(--warn)' }));
    fl.appendChild(svgText(420, 292, '새 질문(Q)이 생기면 2로 돌아감', 't-sm', 'middle'));
    body.appendChild(fig(fl, '외부 스키마를 그리다 "지난달 등급"이 필요하다는 걸 알면 원장에 Q를 적고 3으로 돌아갑니다. 검증에서 추적표에 빈칸이 나오면 원장으로 돌아갑니다. 상자를 누르면 그 장의 도면으로 갑니다.', '그림 7-3'));

    var _b = body; body = foldInto(_b, '원장에서 흔한 실수');
    body.appendChild(table(['실수', '예', '고치는 법'], [['칸을 섞음', '"일정표는 표 모양으로 회의실 열이 왼쪽"을 F에 적음', '보이는 모양은 V. F에는 사실만'], ['출처를 안 적음', '규칙만 있고 어디서 왔는지 모름', '쪽·줄·칸·발화자를 반드시 적음'], ['질문을 추측으로 채움', 'q1을 묻지 않고 "올림이겠지"로 R 칸에 적음', '추측은 R이 아니라 Q. 답을 받으면 R로 옮기고 근거 수준을 적음'], ['사실을 일반화해서 적음', 'F에 "회원은 회의실을 예약한다"만 적음', '구체적인 예로 적고(8장), 일반화는 사실 유형에서'], ['한 줄에 둘을 적음', '"30분 단위이고 최대 4시간"', '쪼갤 수 있으면 쪼갬(나중에 따로 바뀔 수 있음)']]));
    body = _b;
  });

  // ---------- 8장 ----------
  RENDER.push(function renderC08() {
    var body = section('c08'); if (!body) return;
    var left = h('div', { 'aria-live': 'polite' });
    var schemaBox = h('div', { class: 'memo mono', style: 'font-size:12.5px;line-height:1.75' });
    var stepBtns = h('div', { class: 'stepper', role: 'group', 'aria-label': 'CSDP 단계' });
    var cur = 1;
    function mini(head, rows) { return table(head, rows); }
    var visuals = {
      1: function () {
        return h('div', null, [
          P('**[사례 1] 오늘 일정표 (2026-11-17 출력)**', 'small'),
          mini(['회의실', '정원', '시작', '끝', '예약자', '회원번호', '등급'], [['R1', '6', '10:00', '11:30', '김하나', 'M07', '일반'], ['R1', '6', '11:30', '12:00', '박도윤', 'M12', '상주'], ['R2', '4', '14:00', '16:00', '김하나', 'M07', '일반']]),
          h('div', { class: 'three', style: 'margin-top:10px' }, [
            note('**첫 행을 기본 사실로**<br>e1 회의실 R1 의 정원은 6명<br>e2 회원 M07 의 이름은 "김하나"<br>e3 회원 M07 은 등급 "일반"<br>e4 M07 이 R1 을 10:00~11:30 예약 ← 확정'),
            note('**"그리고" 검사로 쪼개기**<br>e4a M07 이 R1 을 10:00~11:30 에 예약했다<br>e4b **[그 예약]** 은 확정 상태다<br><span class="muted">← "그 예약"을 무엇으로 부르나?</span>', 'c L-con'),
            note('**예약번호를 얻은 뒤**<br>e4a′ B101 은 M07 이 한 것이다<br>e4b′ B101 은 R1 을 잡는다<br>e4c′ B101 은 10:00 에 시작해 11:30 에 끝난다<br>e4d′ B101 은 확정 상태다')
          ])
        ]);
      },
      2: function () {
        return h('div', { class: 'two', style: 'grid-template-columns:repeat(2,minmax(0,1fr))' }, [
          mini(['F1 회원', '이름'], [['M07', '김하나'], ['M12', '박도윤']]), mini(['F3 회의실', '정원'], [['R1', '6'], ['R2', '4']]),
          mini(['F4 예약', '회원'], [['B101', 'M07'], ['B102', 'M12'], ['B103', 'M07']]), mini(['F6 예약', '시작', '끝'], [['B101', '11-17 10:00', '11:30'], ['B102', '11-17 11:30', '12:00'], ['B103', '11-17 14:00', '16:00']])
        ]);
      },
      3: function () {
        return h('div', null, [
          h('div', { class: 'two' }, [note('**Before**<br>[개체] 일반 회원<br>[개체] 상주 회원'), note('**After**<br>[개체] 회원<br>[사실] F2 회원 은 등급 에 속한다 · 등급 {일반, 상주}', 'c L-con')]),
          note('D2 초과 분 = max(0, 사용 분 - 무료 분)<br>D3 초과 요금 = 올림(초과 분 / 30) × 3,000원 <span class="muted">← 올림인지 q1에서 확인 필요</span><br><b>검산(M07)</b> 사용 210 - 무료 120 = 90분 → 3 × 3,000 = 9,000원 (사례 2와 같음)'),
          P('90분은 30으로 나누어떨어져 올림이든 내림이든 9,000원입니다. 계산이 사례와 맞는다고 규칙이 확정되는 것은 아니에요.', 'small muted')
        ]);
      },
      4: function () {
        return h('div', null, [
          P('사례 2를 행 단위로 읽으면 3항 사실 `x1 회원 M07 은 등급 "일반"으로 월 무료 120분을 받는다`가 나옵니다. 무료 분은 회원이 아니라 **등급**에 따라 정해지므로 쪼갭니다.', 'small'),
          h('div', { class: 'three' }, [
            mini(['x1 회원', '등급', '무료 분'], [['M07', '일반', '120'], ['M12', '상주', '600'], ['M31', '일반', h('b', { style: 'color:var(--bad)' }, '120 ← 또 적음')]]),
            mini(['F2 회원', '등급'], [['M07', '일반'], ['M12', '상주'], ['M31', '일반']]),
            mini(['F8 등급', '무료 분'], [['일반', '120'], ['상주', '600']])
          ]),
          P('Halpin: 기본 사실로 이루어진 유형이라면 그 안의 모든 함수 종속이 유일성 제약에서 나와야 합니다. 쪼개지 않으면 4장의 갱신 이상과 같은 꼴이 됩니다.', 'small muted')
        ]);
      },
      5: function () {
        return h('div', null, [
          table(['역할', '필수인가', '근거'], [['F4~F7의 예약 쪽', '필수', '모든 예약은 회원·회의실·시각·상태를 가짐'], ['F1·F2의 회원 쪽', '필수', ''], ['F3 회의실 쪽', h('b', null, '필수 아님'), '"창고를 개조한 방은 정원이 정해져 있지 않다" → V2의 정원 열은 비어 있을 수 있음']]),
          note('논리 파생 D1 · 사용 분에 들어가는가: 이용완료·노쇼 예약 + (취소 시각 > 시작 - 1시간)인 취소 예약', 'c L-con')
        ]);
      },
      6: function () {
        return h('div', null, [
          note('<b>값 제약</b><br>등급 {일반, 상주} · 상태 {확정, 취소, 이용완료, 노쇼}<br>정원 1 이상 20 이하 <span class="muted">← 담당자 확인 필요</span> · 시각 30분 경계 (:00, :30)'),
          table(['', '취소 시각을 가진 예약', '상태가 취소인 예약', '결과'], [['예', '{B105}', '{B105}', h('span', { class: 'pill ok' }, '같음')], ['반례', '{B105, B110}', '{B105}', h('span', { class: 'pill bad' }, '위반 · B110은 확정인데 취소 시각이 있음')]]),
          P('R6 같음 제약 · F9를 가진 예약 = 상태가 취소인 예약. "취소된 예약"은 소속이 바뀌는 하위 유형이라 두지 않습니다.', 'small muted')
        ]);
      },
      7: function () {
        return h('div', null, [
          P('`R3 확정 상태인 두 예약이 같은 회의실을 잡으면 [시작, 끝) 구간이 겹치지 않는다`를 **반례 인구**로 매니저에게 보여 줍니다.', 'small'),
          table(['반례', '인구', '매니저의 답', '결과'], [['1', 'B101 R1 10:00-11:30 확정 / B201 R1 11:00-12:00 확정', '"안 돼요."', 'R3 확인'], ['2', 'B101 R1 10:00-11:30 **취소** / B201 R1 10:00-11:00 확정', '"돼요. 취소된 건 없는 거죠."', 'R3은 확정 예약끼리만'], ['3', 'B101 R1 10:00-11:30 확정 / B202 **R2** 10:00-11:30 확정, 둘 다 M07', '"음... 한 사람이 방 둘을 동시에? 생각 안 해 봤네요."', h('span', { class: 'pill warn' }, 'q7 새로 생김')]]),
          note('<b>마지막 점검</b> R5를 계산하려면 취소한 시각이 필요 → 2장의 스키마에 "예약 은 취소 시각 을 가진다"가 없음 → <b>F9를 더함</b>. 4장 DDL에는 `cancelled_at`이 있었습니다. 내부 스키마는 알고 개념 스키마만 몰랐던 것이에요. 100% 원칙에 어긋나는 상태입니다.', 'c L-con')
        ]);
      }
    };
    function go(k) {
      cur = k;
      $$('button', stepBtns).forEach(function (b, i) { b.classList.toggle('on', i + 1 === k); b.classList.toggle('done', i + 1 < k); });
      clear(left);
      add(left, [h('div', { class: 'eyebrow' }, 'CSDP ' + k + '단계'), h('h5', { style: 'font-size:16px;margin:4px 0 8px' }, D.csdp[k - 1][0]), P(D.csdp[k - 1][1], 'small'), visuals[k]()]);
      clear(schemaBox);
      schemaBox.appendChild(h('div', { class: 'eyebrow', style: 'margin-bottom:6px;font-family:var(--sans)' }, '8장 결과 스키마 · 이 단계에서 더하거나 바꾼 줄'));
      D.schema8.forEach(function (ln) {
        var st = ln[2], now = st === k, later = st > k;
        schemaBox.appendChild(h('div', { style: 'display:grid;grid-template-columns:3.4em minmax(0,1fr) 3.6em;gap:6px;align-items:baseline;padding:2px 6px;border-radius:2px;' + (now ? 'background:var(--con-t);box-shadow:inset 3px 0 0 var(--con)' : '') + (later ? 'opacity:.3' : '') }, [h('span', { style: 'color:var(--ink-3)' }, '[' + ln[0] + ']'), h('span', null, ln[1]), st ? h('span', { class: 'tag', style: 'justify-self:end' }, st + '단계') : h('span')]));
      });
    }
    var short8 = ['기본 사실', '사실 유형·인구', '개체 합치기·산술 파생', '유일성·항 수', '필수 역할·논리 파생', '값·집합 비교·하위 유형', '그 밖의 제약·마지막 점검'];
    D.csdp.forEach(function (c, i) { stepBtns.appendChild(h('button', { type: 'button', onclick: function () { go(i + 1); } }, [h('span', { class: 'k' }, String(i + 1)), short8[i]])); });
    add(body, [stepBtns, h('div', { class: 'two' }, [left, schemaBox]), h('div', { class: 'controls' }, [h('button', { type: 'button', class: 'btn', onclick: function () { go(Math.max(1, cur - 1)); } }, '← 앞 단계'), h('button', { type: 'button', class: 'btn primary', onclick: function () { go(Math.min(7, cur + 1)); } }, '다음 단계 →')])]);
    go(1);
    body.appendChild(P('출처: Halpin, 「Object-Role Modeling: an overview」의 일곱 단계. Halpin은 1단계가 절차 전체에서 가장 중요하다고 강조합니다. 단계 표시는 원고가 그 단계에서 더하거나 바꿨다고 밝힌 줄에만 붙였고, 표시가 없는 R2·R4·R5는 2장 판에서 옮긴 것입니다.', 'small muted'));
  });

  // ---------- 9장 ----------
  RENDER.push(function renderC09() {
    var body = section('c09'); if (!body) return;
    var _b = body; body = foldInto(_b, '외부 스키마 설계 일곱 단계와 이용자 목록');
    body.appendChild(steps([['이용자 목록', '역할 × 목적'], ['보기 요구 모으기', '원장의 V 칸'], ['질의 목록', '조건 · 순서 · 묶음 · 빈도'], ['다섯 항목 쓰기', ''], ['열마다 ← 달기', ''], ['갱신 의미 정하기', '읽기 전용 / 쓰기 받음 / 명령으로 분리'], ['가림과 시점', '']], { min: 120 }));
    body.appendChild(table(['이용자', '목적', '원장 줄', '외부 스키마'], [['회원', '내 예약을 확인·관리', 'v3(새로 추가)', tag('ext', 'V1 내 예약')], ['회원', '빈 시간을 찾아 예약', 'v4(새로 추가)', tag('ext', 'V4 회의실 현황')], ['안내 데스크', '손님을 방으로 안내', 'v1', tag('ext', 'V2 오늘 일정표')], ['청구 담당자', '월말 청구', '(원장에 없음 → 추가)', tag('ext', 'V3 월 청구 명세')], ['회계 시스템', '청구 처리', 'v2', tag('ctr', 'E1 예약 확정 이벤트')]]));
    body.appendChild(P('콘셉트 메모가 회원 앱 화면을 말하지 않아 회원 쪽 보기 요구가 원장에 빠져 있었습니다. 이용자 목록은 원장의 빈칸을 찾는 도구이기도 합니다.', 'small muted'));
    body = _b;

    body.appendChild(H4('갱신 의미 결정표 — 이 꼴의 외부 스키마로 쓰기를 받아도 될까'));
    var uh = h('div', { 'aria-live': 'polite' });
    add(body, [seg(D.updateTable.map(function (u, i) { return { label: u[0], key: i }; }), function (i) {
      var u = D.updateTable[i]; clear(uh);
      add(uh, [h('div', { class: 'panel c ' + (u[2] === 'ok' ? 'S-ok' : 'S-bad') }, [h('p', null, [h('span', { class: 'pill ' + u[2] }, u[2] === 'ok' ? '받을 수 있음' : '받지 않음'), ' ', h('b', null, u[0])]), P('쓰기를 받으면 · ' + u[1]), P('권고 · ' + u[3])])]);
    }, { start: 0 }), uh]);
    body.appendChild(P('기본 권고는 외부 스키마를 읽기 전용으로 두고, 변경은 원장 C 칸에서 나온 **명령**(O1 예약하기, O2 취소하기)으로 받는 것입니다. 꼴마다 실제로 무슨 일이 생기는지는 [3장의 V1·V4·V5 시연](#c03)에서 볼 수 있어요.', 'small'));

    var _b = body; body = foldInto(_b, 'V1 내 예약 — 열마다 ←, 그리고 "지금 시각"');
    body.appendChild(h('div', { class: 'memo mono', style: 'font-size:12.5px;line-height:1.8', html: md('[외부] V1 내 예약 · 이용자: 회원 본인') + '<br>' + ['행 · 그 회원의 예약 하나', '열 · 예약번호 ← 예약(참조) · 회의실 ← F5 · 시작 ← F6 · 끝 ← F6 · 상태 ← F7', '<span style="background:var(--warn-t)">· 취소 가능 여부 ← F7 + F6 + 지금 시각</span> (확정이고 시작 전이면 가능)', '<span style="background:var(--warn-t)">· 무료로 취소 가능 여부 ← F6 + 지금 시각</span> (시작 1시간 전까지면 가능, R5)', '고르기 · F4 = 접속한 회원', '순서 · 다가오는 것은 시작순, 지난 것은 최근순', '가림 · 없음 (본인 예약만 보이므로)', '갱신 · 직접 쓰기 없음. 취소는 명령 "취소하기"(O2)로'].map(esc).join('<br>').replace(/&lt;span style=&quot;background:var\(--warn-t\)&quot;&gt;/g, '<span style="background:var(--warn-t)">').replace(/&lt;\/span&gt;/g, '</span>') }));
    body.appendChild(P('지금 시각은 개념 사실이 아니라 질의할 때 주어지는 값이라 그 의존을 화살표에 적어 둡니다. 화살표를 달 곳이 없는 열(예: "이 예약에 메모 남기기")은 빼거나, 원장에 f를 더해 개념 스키마로 돌아갑니다. 외부 스키마 혼자 새 사실을 만들어 내지는 않아요.', 'small muted'));
    body = _b;

    // 시점 문제
    body.appendChild(H4('시점 문제 — 11월 청구서에서 M07의 무료 분은?'));
    var opts9 = [['가', '월말 기준 등급', function () { return 600; }], ['나', '월초 기준 등급', function () { return 120; }], ['다', '날수로 나눔', function () { return Math.round(120 * 14 / 30 + 600 * 16 / 30); }]];
    var th = h('div', { 'aria-live': 'polite' });
    function drawT(i) {
      var o = opts9[i], free = o[2](), used = 330, over = Math.max(0, used - free), fee = Math.ceil(over / 30) * 3000;
      var svg = svgBox(680, 150, 'M07의 11월 등급 이력과 고른 규칙에 따른 무료 분', 'minw-560');
      var X = function (d) { return 30 + (d - 1) * (620 / 30); };
      svg.appendChild(s('rect', { x: X(1), y: 20, width: X(15) - X(1), height: 34, class: 'box-c L-ext', style: 'opacity:' + (i === 1 || i === 2 ? 1 : .35) }));
      svg.appendChild(svgText((X(1) + X(15)) / 2, 42, '일반 (무료 120분) 11-01 ~ 11-14', 't-sm t-b', 'middle'));
      svg.appendChild(s('rect', { x: X(15), y: 20, width: X(31) - X(15), height: 34, class: 'box-c L-con', style: 'opacity:' + (i === 0 || i === 2 ? 1 : .35) }));
      svg.appendChild(svgText((X(15) + X(31)) / 2, 42, '상주 (무료 600분) 11-15 ~', 't-sm t-b', 'middle'));
      for (var d = 1; d <= 31; d += 5) svg.appendChild(svgText(X(d), 72, '11-' + String(d).padStart(2, '0'), 't-sm t-sub', 'middle'));
      if (i === 0) svg.appendChild(s('line', { x1: X(31) - 2, y1: 12, x2: X(31) - 2, y2: 62, class: 'ln-c L-ctr', style: 'stroke:var(--focus);stroke-width:3' }));
      if (i === 1) svg.appendChild(s('line', { x1: X(1) + 2, y1: 12, x2: X(1) + 2, y2: 62, class: 'ln-c', style: 'stroke:var(--focus);stroke-width:3' }));
      var bx = function (v) { return 30 + v * (620 / 660); };
      svg.appendChild(s('rect', { x: 30, y: 92, width: bx(used) - 30, height: 18, style: 'fill:var(--ink-2)' }));
      svg.appendChild(svgText(bx(used) + 6, 106, '사용 330분', 't-sm'));
      svg.appendChild(s('rect', { x: 30, y: 116, width: bx(free) - 30, height: 18, class: 'fill-c L-int' }));
      svg.appendChild(svgText(bx(free) + 6, 130, '무료 ' + free + '분', 't-sm t-b'));
      clear(th);
      add(th, [fig(svg), P('(' + o[0] + ') ' + o[1] + ' → 무료 **' + free + '분**' + (i === 2 ? ' (120 × 14/30 + 600 × 16/30 = 56 + 320)' : '') + ' · 13장 인구(사용 330분)로 계산하면 초과 ' + over + '분, 초과 요금 **' + fee.toLocaleString('ko-KR') + '원**.'), P('어느 것이 맞는지는 담화 세계의 규칙이라 원장 q4의 답으로 정해집니다. 어느 답이든 등급이 바뀐 **날짜**가 필요한데 F2는 지금의 등급만 적어요. 그래서 `F2′ 회원 은 [시작일, 종료일) 동안 등급 에 속했다`, `R8 한 회원의 등급 기간은 겹치지 않는다`, `D4 어느 날의 등급 = 그 날을 포함하는 기간의 등급`이 생깁니다.', 'small muted')]);
    }
    add(body, [seg(opts9.map(function (o, i) { return { label: '(' + o[0] + ') ' + o[1], key: i }; }), drawT, { lbl: '규칙', start: 0 }), th]);
    var _b = body; body = foldInto(_b, '시점 질문 넷');
    body.appendChild(table(['시점 질문', '「틈」의 예'], [['이 값은 지금 값인가, 그때 값인가?', '청구서의 등급은 청구 대상 월의 값인가'], ['과거를 다시 조회하면 같은 답이 나와야 하는가?', '10월 청구서를 12월에 다시 뽑으면 같아야 하는가 → "예"라면 V3는 발행된 문서'], ['언제까지의 변경이 반영되어야 하는가?', '월말 23:59 취소가 그달 청구에 들어가는가'], ['외부 스키마를 받아 간 쪽이 그 값을 보관하는가?', '회계 시스템은 이벤트를 받아 자기 DB에 저장하는가']]));
    body = _b;
  });

  // ---------- 10장 ----------
  RENDER.push(function renderC10() {
    var body = section('c10'); if (!body) return;
    body.appendChild(H4('세 관점의 부분 스키마와 충돌'));
    var colsEl = {};
    var cards = h('div', { class: 'three' }, Object.keys(D.views10).map(function (k) {
      var v = D.views10[k];
      return h('div', { class: 'panel', style: 'box-shadow:none' }, [h('div', { class: 'eyebrow' }, v.name)].concat(v.items.map(function (it) {
        var e = h('div', { style: 'padding:6px 8px;border:1px solid var(--rule);border-radius:3px;margin-top:6px;transition:background .2s' }, [h('b', null, it[1]), h('div', { class: 'small muted' }, it[2])]);
        colsEl[it[0]] = e; return e;
      })));
    }));
    var res = h('div', { 'aria-live': 'polite', style: 'margin-top:10px' });
    var conflictList = h('div', { class: 'controls' });
    D.conflicts10.forEach(function (c, i) {
      var b = h('button', { type: 'button', class: 'btn' }, [h('span', { class: 'k' }, c[0]), c[1]]);
      b.addEventListener('click', function () {
        $$('button', conflictList).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true');
        Object.keys(colsEl).forEach(function (k) { var on = c[2].indexOf(k) >= 0; colsEl[k].style.background = on ? 'var(--warn-t)' : ''; colsEl[k].style.borderColor = on ? 'var(--warn)' : ''; });
        clear(res); add(res, [note('<b>' + String(c[0]) + '</b> · ' + String(c[1]) + '<br>해소 → ' + String(c[3]), 'c L-none')]);
      });
      conflictList.appendChild(b);
      if (i === 4) setTimeout(function () { b.click(); }, 0);
    });
    add(body, [conflictList, cards, res]);
    body.appendChild(P('동음이의어는 같은 이름끼리 비교해 찾을 수 있지만, 이음동의어는 바깥 정보가 있어야 찾습니다. 충돌을 고치기 전에 기록이 먼저입니다. 남기지 않으면 "왜 이메일이 키가 아니냐"에 답할 수 없어요.', 'small muted'));
    var _b = body; body = foldInto(_b, '통합의 네 단계');
    body.appendChild(steps([['사전 통합', '무엇을, 어떤 순서로 합칠지. 이진(사다리꼴·균형) / n항'], ['비교', '개념끼리 대응과 충돌, 스키마 사이의 관계'], ['맞추기', '충돌을 풀어 합칠 수 있게 고침'], ['병합과 재구성', '겹쳐서 중간 스키마를 만들고 품질 기준에 맞게 다시 짬']]));
    body = _b;
    var _b = body; body = foldInto(_b, '병합 결과와 품질 점검');
    body.appendChild(h('div', { class: 'memo mono', style: 'font-size:12.5px;line-height:1.8', html: [
      '[개체] 회원(회원번호) — 이름 · 이메일 · 상태{활동, 탈퇴}   <span class="muted">← A 회원 + C 고객</span>',
      '[개체] 등급(등급 이름) — 월 무료 분 · 초과 단가(30분당)   <span class="muted">← A 등급 + C 요금제</span>',
      "[사실] F2' 회원 은 [시작일, 종료일) 동안 등급 에 속했다   <span class=\"muted\">← 종속 충돌 해소</span>",
      '[개체] 회의실(회의실 코드) — 정원(선택)   <span class="muted">← A 회의실 + B 방 + C 공간</span>',
      '[개체] 예약(예약번호) — 회원 · 회의실 · 시작 · 끝 · 상태 · 취소 시각(선택)   <span class="muted">← A 예약 + B 예약</span>',
      '[사실] F11 예약 은 손님 이름 을 가진다 (여럿, 선택)   <span class="muted">← B에서 옴</span>',
      '[파생] D1 사용 분 (월, 회원)   <span class="muted">← C 사용 내역은 저장하지 않고 파생으로</span>'
    ].join('<br>') }));
    body.appendChild(P('통합은 합집합이 아닙니다. 모든 관점을 합쳐야 하는 것도 아니에요. C는 다른 팀의 맥락이라 합치지 않고 계약 E1에 적을 수도 있습니다. 그때 산출물은 "스키마 하나와 계약 하나"입니다.', 'small'));
    body.appendChild(H4('품질 점검'));
    body.appendChild(table(['점검', '질문', '「틈」에서 확인'], [['완전성', '원장의 모든 f·r이 스키마 어딘가에 있는가? 모든 v의 열에 화살표를 달 수 있는가?', "손님 이름(F11), 등급 이력(F2') 반영"], ['적절성', '스키마에 원장 어디에도 근거가 없는 요소가 있는가?', '회의실 층 정보: 근거 없음 → 뺌'], ['정확성', '각 요소가 표기법의 정의대로 쓰였고, 요구를 바르게 옮겼는가?', '노쇼를 상태로 둔 것은 q2 답 전까지 잠정'], ['최소성', '다른 요소에서 계산되는 것을 따로 두지 않았는가?', '사용 내역을 D1로 바꿈'], ['이해 용이성', '담당자가 이 스키마를 읽고 자기 업무를 알아보는가?', '용어집의 이름(회의실, 예약 시간) 그대로 씀']]));
    body = _b;
  });

  // ---------- 11장 ----------
  RENDER.push(function renderC11() {
    var body = section('c11'); if (!body) return;
    var _b = body; body = foldInto(_b, '계약 설계 일곱 단계와 경계 목록');
    body.appendChild(steps([['경계 목록', '동기 호출 / 비동기 이벤트 / 데이터 파일'], ['연산 목록', 'C 칸 → O, 상태 변화 알림 → E'], ['행위 겹', '조건, 실패표, 멱등성, 순서, 동시성'], ['구조·의미 겹', '단위·시간대·코드표·구간의 뜻'], ['품질 겹', '지연, 가용성, 신선도, 보존'], ['진화 겹', '호환 기준, 공지와 폐기, 버전'], ['시험', '소비자 주도 계약 시험, 제공자 검증']], { min: 120 }));
    body.appendChild(table(['경계', '방식', '계약', '원장 줄'], [['회원 앱 → 예약 API', '동기 HTTP', 'O1 예약하기, O2 취소하기, V1·V4 조회', 'c1, c2, v3, v4'], ['데스크 → 예약 API', '동기 HTTP', 'V2 조회', 'v1'], ['예약 시스템 → 회계 시스템', '비동기 이벤트', 'E1 예약 확정, E2 예약 취소, E3 이용 확정(이용완료·노쇼)', 'v2, q3']]));
    body.appendChild(P('E2와 E3은 q3의 답("사용 분 계산에 필요하니 취소와 노쇼도 보내 달라", 가정)에서 생겼습니다. 미결 질문 하나가 계약 둘이 되는 일은 흔해요.', 'small muted'));
    body = _b;

    body.appendChild(H4('O1 예약하기 `POST /bookings` — 실패표'));
    add(body, [
      h('div', { class: 'memo mono L-ctr', style: 'font-size:12.5px;line-height:1.8;border-top:3px solid var(--ctr)', html: [
        '<b>O1 예약하기</b>   POST /bookings', '입력  memberId, roomCode, startAt, endAt, 머리글 Idempotency-Key',
        'pre1  회원이 존재하고 활동 상태 (업무)', 'pre2  30분 경계, 끝 > 시작, 4시간 이하 (형식)', 'pre3  시작이 지금보다 뒤 (업무)',
        'post1 성공: 확정 예약 하나가 생기고 예약번호를 돌려줌', 'post2 성공: E1 이 같은 트랜잭션 결과에 따라 정확히 한 번 발행 예약됨', 'inv1  확정 예약끼리 같은 회의실이면 구간이 겹치지 않음 (R3)'
      ].join('<br>') }),
      table(['실패', '응답', '상태 변화', '다시 시도'], D.o1fail)
    ]);
    body.appendChild(P('상태 코드만으로는 부족합니다. 같은 409라도 "다른 시간으로 다시 하면 된다"와 "다시 해도 소용없다"는 소비자가 할 일이 다릅니다. 503에 "상태 변화 없음이 보장됨"을 약속하려면 기록 트랜잭션이 끝나기 전에만 503을 내야 합니다.', 'small muted'));

    // 멱등 재시도 시퀀스
    body.appendChild(H4('응답이 끊겼을 때 — 멱등 키로 다시 묻기'));
    var seq = [['app', 'api', 'POST (key=K1)'], ['api', 'db', '확정 기록 → 커밋됨'], ['api', 'app', '201 B101 … 응답 중 끊김', 'cut'], ['app', 'api', 'POST (key=K1) 다시'], ['api', 'db', 'K1 의 첫 결과 찾음'], ['api', 'app', '201 B101 (같은 답)']];
    var lanes = { app: 110, api: 340, db: 570 };
    var sh = h('div'), sstep = 1;
    function drawSeq(n) {
      sstep = n;
      var svg = svgBox(680, 330, '회원 앱과 예약 API와 DB 사이에서 응답이 끊긴 뒤 같은 멱등 키로 다시 보내 같은 답을 받는 순서', 'minw-560');
      arrowDefs(svg, 'c11a');
      [['app', '회원 앱'], ['api', '예약 API'], ['db', 'DB']].forEach(function (l) {
        svg.appendChild(s('rect', { x: lanes[l[0]] - 60, y: 6, width: 120, height: 30, rx: 3, class: 'box' }));
        svg.appendChild(svgText(lanes[l[0]], 26, l[1], 't-sm t-b', 'middle'));
        svg.appendChild(s('line', { x1: lanes[l[0]], y1: 36, x2: lanes[l[0]], y2: 322, class: 'ln ln-dash', style: 'stroke:var(--rule-2)' }));
      });
      seq.forEach(function (m, i) {
        var y = 64 + i * 44, x1 = lanes[m[0]], x2 = lanes[m[1]], show = i < n, now = i === n - 1;
        var g = s('g', { style: 'opacity:' + (show ? 1 : .12) });
        var endX = m[3] === 'cut' ? (x1 + x2) / 2 : x2 + (x2 > x1 ? -4 : 4);
        g.appendChild(s('line', { x1: x1, y1: y, x2: endX, y2: y, class: 'ln', style: now ? 'stroke:var(--focus);stroke-width:2' : null, 'marker-end': m[3] === 'cut' ? null : 'url(#c11a)' }));
        if (m[3] === 'cut') { g.appendChild(s('line', { x1: endX - 6, y1: y - 6, x2: endX + 6, y2: y + 6, style: 'stroke:var(--bad);stroke-width:2.5' })); g.appendChild(s('line', { x1: endX - 6, y1: y + 6, x2: endX + 6, y2: y - 6, style: 'stroke:var(--bad);stroke-width:2.5' })); }
        g.appendChild(svgText((x1 + x2) / 2, y - 8, m[2], 't-sm' + (now ? ' t-b' : ''), 'middle'));
        svg.appendChild(g);
      });
      clear(sh); sh.appendChild(fig(svg));
    }
    add(body, [h('div', { class: 'controls' }, [h('button', { type: 'button', class: 'btn', onclick: function () { drawSeq(Math.max(1, sstep - 1)); } }, '← 한 걸음 뒤로'), h('button', { type: 'button', class: 'btn primary', onclick: function () { drawSeq(sstep >= seq.length ? 1 : sstep + 1); } }, '한 걸음 앞으로 →')]), sh]);
    drawSeq(3);
    body.appendChild(P('기록은 끝났는데 응답 중에 끊기면 소비자는 결과를 모릅니다. 그래서 같은 키로 다시 보내고 제공자는 첫 결과를 돌려줍니다. 멱등 키가 있어야 "모르는 결과"를 안전하게 다시 물을 수 있어요. POST의 멱등성은 HTTP 메서드가 정해 주지 않으니 계약이 정합니다(RFC 9110).', 'small'));
    body.appendChild(note('<b>동시성 약속</b> 같은 구간을 겹치게 요청한 둘 가운데 먼저 커밋된 하나가 성공하고, 나머지는 409를 받는다. 어느 쪽이 먼저인지는 보장하지 않는다. — 순서를 보장하지 않는다는 것까지 적어야 소비자가 엉뚱한 기대를 하지 않습니다.', 'c L-ctr'));

    // E1 과 outbox
    body.appendChild(H4('E1 예약 확정 — "커밋되었을 때, 그리고 그때만"을 지키는 장치'));
    var ob = svgBox(680, 200, '예약과 같은 트랜잭션에서 outbox 행을 쓰고 발행 과정이 채널로 보내며 회계는 eventId로 중복을 거른다', 'minw-560');
    arrowDefs(ob, 'c11b');
    ob.appendChild(s('rect', { x: 10, y: 40, width: 260, height: 120, rx: 6, style: 'fill:transparent;stroke:var(--int);stroke-dasharray:6 4' }));
    ob.appendChild(svgText(20, 58, '한 트랜잭션', 't-sm t-b', 'start'));
    [[30, 70, 'booking 행 (확정)'], [30, 112, 'outbox 행 (보낼 E1)']].forEach(function (b) { var g = s('g', { class: 'L-int' }); g.appendChild(s('rect', { x: b[0], y: b[1], width: 220, height: 32, rx: 3, class: 'box-c' })); g.appendChild(svgText(b[0] + 110, b[1] + 21, b[2], 't-sm t-b', 'middle')); ob.appendChild(g); });
    [[300, 96, '발행 과정', 'none'], [440, 96, '채널 tum.booking.confirmed', 'ctr'], [440, 150, '회계 시스템 · eventId로 중복 제거', 'ext']].forEach(function (b) { var g = s('g', { class: 'L-' + b[3] }); g.appendChild(s('rect', { x: b[0], y: b[1], width: b[0] === 300 ? 110 : 230, height: 32, rx: 3, class: b[3] === 'none' ? 'box' : 'box-c' })); g.appendChild(svgText(b[0] + (b[0] === 300 ? 55 : 115), b[1] + 21, b[2], 't-sm t-b', 'middle')); ob.appendChild(g); });
    ob.appendChild(s('line', { x1: 250, y1: 128, x2: 298, y2: 114, class: 'ln', 'marker-end': 'url(#c11b)' }));
    ob.appendChild(s('line', { x1: 410, y1: 112, x2: 438, y2: 112, class: 'ln', 'marker-end': 'url(#c11b)' }));
    ob.appendChild(s('line', { x1: 555, y1: 128, x2: 555, y2: 148, class: 'ln', 'marker-end': 'url(#c11b)' }));
    ob.appendChild(svgText(355, 84, '안 보낸 행을 읽음', 't-sm t-mut', 'middle'));
    ob.appendChild(svgText(560, 86, '적어도 한 번 · 같은 예약끼리는 순서대로', 't-sm t-mut', 'middle'));
    ob.appendChild(svgText(140, 24, '커밋 뒤 발행 실패 → 회계는 예약을 모름', 't-sm', 'middle'));
    ob.appendChild(svgText(140, 188, '발행 먼저 → 커밋 실패 → 없는 예약이 청구됨', 't-sm', 'middle'));
    body.appendChild(fig(ob, '예약과 같은 트랜잭션에서 "보낼 이벤트" 행을 기록하고 별도 과정이 그 행을 읽어 발행합니다. 다시 보내면 중복이 생기므로 전달은 **적어도 한 번**이 되고, 소비자는 eventId로 거릅니다. 같은 eventId를 두 번 받은 것은 계약 위반이 아니에요. 한 번도 오지 않았다면 post2 위반입니다.', '그림 11-1'));

    var _b = body; body = foldInto(_b, '의미 겹 (O1 · E1)');
    body.appendChild(table(['항목', 'O1·E1에서'], [['시각', 'ISO 8601, 오프셋 필수(`+09:00`). `Z`로 보내도 같은 순간으로 해석'], ['구간', '`[startAt, endAt)` — 끝 불포함'], ['단위', '분 단위 길이는 정수 분. 금액은 원, 정수'], ['코드표', '`roomCode`는 회의실 코드표(R1, R2, R3)의 값. 코드표는 별도 조회 API로 제공'], ['식별', '`memberId`는 회원번호. 이메일로 회원을 찾지 않음(10장의 맞추기 결정)']]));
    body = _b;

    body.appendChild(H4('진화 겹 — 이 변경은 어떻게 분류될까'));
    var eh = h('div', { 'aria-live': 'polite' });
    add(body, [seg(D.evolution11.map(function (e, i) { return { html: md(e[0]), key: i }; }), function (i) { var e = D.evolution11[i]; clear(eh); add(eh, [h('p', null, [h('span', { class: 'pill ' + e[1] }, e[2]), ' ', h('span', { html: md(e[3]) })])]); }, { start: 2 }), eh]);
    body.appendChild(P('열거값 추가가 까다로운 것은 소비자가 `switch`로 빠짐없이 나눠 처리하고 있었다면 모르는 값에서 실패하기 때문입니다. "모르는 상태 값은 확정이 아닌 것으로 다룬다" 같은 규칙을 **처음부터** 적어 둡니다. 호환성은 변경할 때가 아니라 첫 계약을 쓸 때 준비합니다.', 'small muted'));
    var _b = body; body = foldInto(_b, '비호환 변경 절차와 품질 겹');
    body.appendChild(steps([['공지', '변경 내용, 이유, 새 주 버전, 일정 (90일 전, 가정)'], ['병행', '옛 버전과 새 버전을 함께. 이벤트라면 두 채널로'], ['사용 측정', '옛 버전을 누가 아직 쓰는지 (소비자 계약, 호출 기록)'], ['제거', '남은 소비자가 없거나 공지한 날이 되면']]));
    body.appendChild(H4('품질 겹 (값은 가정)'));
    body.appendChild(table(['항목', '약속', '측정'], [['O1 지연', '요청의 95%가 0.5초 이내', 'API 게이트웨이 기록, 월 단위'], ['O1 가용성', '월 99.5%', '5분 간격 상태 확인'], ['E1 신선도', '확정 후 1분 이내 발행', '커밋 시각과 발행 시각의 차'], ['E1 보존', '채널에 7일 보관', '브로커 설정']]));
    body = _b;
    body.appendChild(P('회계 시스템의 소비자 계약에는 `roomCode`가 없습니다. 회계는 회의실을 쓰지 않으니까요. 회의실별 단가가 생기는 순간 `roomCode`가 소비자 계약에 들어가고, 예약 시스템은 그 필드를 지울 수 없게 됩니다. 소비자 계약은 지금 누가 무엇에 기대는지를 보여 줍니다.', 'small'));
  });

  // ---------- 12장 ----------
  RENDER.push(function renderC12() {
    var body = section('c12'); if (!body) return;
    var _b = body; body = foldInto(_b, '사실 유형을 표로 묶기 (Halpin의 규칙)');
    var g = svgBox(680, 300, '단순 키 사실 유형은 개체마다 한 표로 묶고 복합 키 사실 유형은 따로 표를 만든다', 'minw-560');
    arrowDefs(g, 'c12a');
    var grp = [['회원', 'F1 이름, 이메일, 상태', 'member'], ['회의실', 'F3 정원', 'room'], ['등급', 'F8 무료 분, 초과 단가', 'grade'], ['예약', 'F4 회원, F5 회의실, F6 시작·끝, F7 상태, F9 취소 시각', 'booking'], ["복합 키", "F2' 회원·기간 → 등급", 'member_grade_period'], ['복합 키', 'F11 예약 → 손님 이름(여럿)', 'booking_guest']];
    grp.forEach(function (r, i) {
      var y = 10 + i * 48;
      var a = s('g', { class: 'L-con' }); a.appendChild(s('rect', { x: 10, y: y, width: 360, height: 38, rx: 3, class: 'box-c' })); a.appendChild(svgText(20, y + 16, r[0] === '복합 키' ? '복합 키 사실' : r[0] + '에 붙은 단순 키 사실', 't-sm t-c t-b')); a.appendChild(svgText(20, y + 32, r[1], 't-sm')); g.appendChild(a);
      g.appendChild(s('line', { x1: 372, y1: y + 19, x2: 478, y2: y + 19, class: 'ln', 'marker-end': 'url(#c12a)' }));
      var b = s('g', { class: 'L-int' }); b.appendChild(s('rect', { x: 482, y: y, width: 190, height: 38, rx: 3, class: 'box-c' })); b.appendChild(svgText(577, y + 24, r[2], 't-mono t-b', 'middle')); g.appendChild(b);
    });
    body.appendChild(fig(g, '기본 사실이면 묶은 결과에 중복이 생기지 않습니다. `outbox`·`idempotency`는 개념 스키마에 없는 표입니다. 담화 세계의 사실이 아니라 계약을 지키는 장치라, 보장 위치표에서 어느 계약 조항을 지키는지로 정당화합니다.', '그림 12-1'));
    body = _b;

    body.appendChild(H4('작업 부하 표와 결정 — 모든 인덱스는 어떤 줄에 기댑니다'));
    var dh = h('div', { 'aria-live': 'polite' });
    var wt = table(['번호', '무엇', '빈도(가정)', '조건·순서', '결정'], D.workload12.map(function (w) { return [h('b', { class: 'mono' }, w[0]), w[1], w[2], w[3], h('span', null, w[4].length ? w[4].map(function (d) { return tag('int', d); }) : '없음')]; }), { onRow: function (r, i, tr) {
      $$('tbody tr', wt).forEach(function (x) { x.classList.remove('hl'); }); tr.classList.add('hl');
      var w = D.workload12[i]; clear(dh);
      if (!w[4].length) dh.appendChild(note('**' + w[0] + '** 월 1회라 인덱스를 따로 두지 않습니다. 회원 이름을 예약 표에 넣자는 비정규화 후보도 있었지만, 잇는 비용이 작아 하지 않습니다.'));
      w[4].forEach(function (d) { var x = D.decisions12[d]; dh.appendChild(note('<b>[결정] ' + d + '</b> ' + String(x[0]) + '<br><span class="muted">근거</span> ' + String(w[0]) + ': ' + String(x[1]) + '<br><span class="muted">비용·재검토</span> ' + String(x[2]), 'c L-int')); });
    } });
    add(body, [wt, dh]);
    setTimeout(function () { var r = $$('tbody tr', wt)[5]; if (r) r.click(); }, 0);
    body.appendChild(P('결정 기록의 "재검토"를 비워 두면 그 결정은 영원히 남습니다. 발행된 청구서는 비정규화가 아니라 새 사실로 다룹니다(`billing_statement`: "이 청구서에 이렇게 적혀 나갔다").', 'small muted'));

    var _b = body; body = foldInto(_b, '하위 유형을 옮기는 네 방법 — 그리고 쓰지 않은 이유');
    body.appendChild(table(['방법', '표', '쓸 수 있는 경우(슬라이드)', '「틈」에서'], [['8A 상위·하위 각각', '`member`, `resident_member(member_id, seat_no)`', '어떤 하위 유형에도', '가능'], ['8B 하위만', '`regular_member`, `resident_member`', '모든 상위 객체가 하위 중 하나에 속할 때', '가능하지만 회원 목록 조회가 둘을 합쳐야 함'], ['8C 한 표 + 유형 속성', '`member(..., kind, seat_no)`', '배타적 하위 유형', '가능. seat_no는 상주일 때만 값'], ['8D 한 표 + 불 플래그 여럿', '`member(..., is_resident, ...)`', '겹치는 하위 유형', '하위 유형이 하나라 의미 없음']]));
    body.appendChild(note('<b>결정</b> 하위 유형으로 옮기지 않습니다. 등급에 이력이 생겨 소속이 날짜에 따라 다르기 때문이에요. 대신 `seat_assignment(member_id, seat_no, valid_from, valid_to)`를 두고 "지정석은 그 기간에 상주 등급인 회원만 가진다"를 보장 위치표에 올립니다. 하위 유형 사상은 소속이 바뀌지 않을 때 가장 잘 맞습니다.', 'c L-int'));
    body = _b;

    body.appendChild(H4('보장 위치표 (완성본) — 규칙마다 지키는 자리'));
    var places = ['DB', '서비스', '질의', '발행 과정'];
    body.appendChild(table(['항목'].concat(places).concat(['방법']), D.guarantee12.map(function (gg) { return [gg[0]].concat(places.map(function (p) { return gg[1].indexOf(p) >= 0 ? h('span', { class: 'L-int', style: 'display:inline-block;width:14px;height:14px;border-radius:50%;background:var(--c)', 'aria-label': '지킴' }) : h('span', { class: 'muted' }, '·'); })).concat([gg[2]]); }), { cls: 'heat' }));
    body.appendChild(P('DB 제약으로 걸기 어려운 규칙을 응용에 맡길 때는 감시 질의를 함께 둡니다. `PRIMARY KEY (member_id, valid_from)`만으로는 11월 1일~20일과 11월 15일~30일처럼 시작일이 다른 겹침을 막지 못해, R8의 배제 제약이 짝으로 필요합니다. (DDL은 PostgreSQL 문법, 원고 환경에서 실행하지 못함)', 'small muted'));
  });

  // ---------- 13장 ----------
  RENDER.push(function renderC13() {
    var body = section('c13'); if (!body) return;
    body.appendChild(H4('추적표 — 원장 한 줄이 네 산출물의 어디에 나타나는가'));
    var heads = ['원장', '개념', '외부', '계약', '내부', '보장'];
    var layerOf = [null, 'con', 'ext', 'ctr', 'int', 'int'];
    var tb = h('tbody');
    D.trace13.forEach(function (r) {
      tb.appendChild(h('tr', null, r.map(function (c, j) {
        if (j === 0) return h('td', null, h('b', { class: 'mono', style: 'font-size:12.5px' }, c));
        var wait = c.charAt(0) === '!', assume = c.charAt(0) === '~', empty = c === '—';
        var txt = wait || assume ? c.slice(1) : c;
        return h('td', { class: layerOf[j] ? 'L-' + layerOf[j] : null, style: empty ? 'color:var(--ink-3);background:repeating-linear-gradient(45deg,transparent 0 6px,var(--sunken) 6px 8px)' : wait ? 'background:var(--warn-t);color:var(--warn);font-weight:700' : assume ? 'outline:1.5px dashed var(--warn);outline-offset:-4px' : 'background:var(--t)' }, h('span', { html: md(txt) }));
      })));
    });
    body.appendChild(h('div', { class: 'tbl-wrap' }, h('table', { style: 'font-size:13px' }, [h('thead', null, h('tr', null, heads.map(function (x) { return h('th', null, x); }))), tb])));
    body.appendChild(h('div', { class: 'legend small' }, [h('span', null, [h('i', { class: 'sw', style: 'background:repeating-linear-gradient(45deg,transparent 0 3px,var(--rule-2) 3px 4px)' }), '빈칸: 해당 없음이거나 설계가 빠뜨림']), h('span', null, [h('i', { class: 'sw', style: 'background:var(--warn-t);outline:1px solid var(--warn)' }), '답 대기']), h('span', null, [h('i', { class: 'sw', style: 'outline:1.5px dashed var(--warn)' }), '가정'])]));
    body.appendChild(P('빈칸은 두 뜻입니다. 정말 해당이 없거나(v1은 계약이 없는 내부 이용자), 설계가 빠뜨렸거나입니다. 빠뜨렸다면 원장으로 돌아갑니다. 갱신하지 않은 추적표는 오히려 틀린 안심을 줍니다.', 'small muted'));

    // 인구 왕복
    body.appendChild(H4('인구 왕복 — 기대값을 먼저 손으로 내고, 실행 결과와 비교합니다'));
    var P13 = D.pop13;
    function mins(t) { var a = t.split(':'); return +a[0] * 60 + +a[1]; }
    var gradeRule = 'end';
    var rt = h('div', { 'aria-live': 'polite' });
    function v2() {
      var rows = P13.bookings.filter(function (b) { return b[3] === '11-17'; }).sort(function (a, b) { return a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : mins(a[4]) - mins(b[4]); });
      return h('div', null, [P('11월 17일 아침, 모든 예약이 확정일 때 V2(오늘 일정표)를 꺼냅니다. 기대: 그날 시작하는 확정 예약 셋, 회의실·시작순.', 'small'), table(['회의실', '시작', '끝', '예약자', '정원'], rows.map(function (b) { return [b[2], b[4], b[5], P13.members[b[1]], P13.rooms[b[2]] == null ? '' : String(P13.rooms[b[2]])]; })), P('**결과가 기대와 같습니다** (SQLite 3.53.0, `verification/tum-roundtrip-result.json`).', 'small')]);
    }
    function v3() {
      var per = {};
      Object.keys(P13.members).forEach(function (m) { per[m] = { parts: [], used: 0 }; });
      P13.bookings.forEach(function (b) {
        var len = mins(b[5]) - mins(b[4]), kind = null;
        if (b[6] === 'used') kind = '이용완료';
        else if (b[6] === 'no_show') kind = '노쇼';
        else if (b[6] === 'cancelled') {
          var cd = b[7].split(' '), cmin = (cd[0] === b[3] ? 0 : -1440) + mins(cd[1]);
          if (cmin > mins(b[4]) - 60) kind = '늦은 취소';
          else { per[b[1]].parts.push([b[0], len, '무료 취소(셈하지 않음)']); return; }
        }
        per[b[1]].parts.push([b[0], len, kind]); per[b[1]].used += len;
      });
      var grade = { M07: gradeRule === 'end' ? '상주' : gradeRule === 'start' ? '일반' : '날수', M12: '상주', M31: '일반' };
      var rows = Object.keys(per).map(function (m) {
        var free = grade[m] === '날수' ? Math.round(120 * 14 / 30 + 600 * 16 / 30) : P13.grades[grade[m]];
        var over = Math.max(0, per[m].used - free), fee = Math.ceil(over / 30) * 3000;
        return { m: m, name: P13.members[m], grade: grade[m], used: per[m].used, free: free, over: over, fee: fee, parts: per[m].parts };
      });
      var svg = svgBox(680, 206, '회원별 사용 분 구성과 무료 분', 'minw-560');
      var X = function (v) { return 110 + v * (540 / 660); };
      var colorOf = { '이용완료': 'var(--ink)', '노쇼': 'var(--ink-2)', '늦은 취소': 'var(--rule-2)' };
      rows.forEach(function (r, i) {
        var y = 14 + i * 58, x = X(0);
        svg.appendChild(svgText(10, y + 18, r.name + ' ' + r.m, 't-sm t-b'));
        r.parts.forEach(function (p) {
          if (p[2].indexOf('무료') === 0) return;
          var w = X(p[1]) - X(0);
          svg.appendChild(s('rect', { x: x, y: y + 4, width: w - 1, height: 22, style: 'fill:' + colorOf[p[2]] }));
          if (w >= 40) svg.appendChild(s('text', { x: x + w / 2, y: y + 19, 'text-anchor': 'middle', class: 't-sm t-mono', style: 'fill:' + (p[2] === '늦은 취소' ? 'var(--ink)' : 'var(--paper)') }, p[0]));
          x += w;
        });
        svg.appendChild(s('line', { x1: X(r.free), y1: y, x2: X(r.free), y2: y + 34, style: 'stroke:var(--focus);stroke-width:2;stroke-dasharray:3 2' }));
        svg.appendChild(svgText(X(r.free) + 4, y + 44, '무료 ' + r.free, 't-sm t-sub'));
      });
      [['이용완료', 'var(--ink)'], ['노쇼', 'var(--ink-2)'], ['늦은 취소', 'var(--rule-2)']].forEach(function (l, i) { svg.appendChild(s('rect', { x: 110 + i * 110, y: 186, width: 10, height: 10, style: 'fill:' + l[1] })); svg.appendChild(svgText(124 + i * 110, 195, l[0], 't-sm')); });
      return h('div', null, [
        seg([{ label: '월말 기준 (가정)', key: 'end' }, { label: '월초 기준', key: 'start' }, { label: '날수로 나눔', key: 'days' }], function (k) { if (k !== gradeRule) { gradeRule = k; clear(rt); rt.appendChild(v3()); } }, { lbl: 'q4 · M07 등급 규칙', start: ['end', 'start', 'days'].indexOf(gradeRule) }),
        fig(svg, '막대 칸 하나가 예약 하나입니다. B105는 다음 날 13:00 시작 예약을 전날 20:00에 취소해 무료 취소라 빠졌고, B104는 시작 30분 전 취소라 늦은 취소로 들어갔습니다.'),
        table(['이름', '등급', '사용 분', '무료 분', '초과 분', '초과 요금'], rows.map(function (r) { return [r.name, r.grade === '날수' ? '일반→상주(날수)' : r.grade, String(r.used), String(r.free), String(r.over), r.fee.toLocaleString('ko-KR')]; }), { num: [2, 3, 4, 5] }),
        P(gradeRule === 'end' ? '**가정(월말 기준)의 결과는 실행 결과와 같습니다**: 김하나 330·600·0·0, 박도윤 30·600·0·0, 이서준 180·120·60·6,000.' : gradeRule === 'start' ? '월초 기준이 답이면 김하나의 11월 청구가 **0원에서 21,000원**으로 바뀝니다(330 - 120 = 210분, 30분 단위 7번). 이 숫자를 가정 옆에 적어 두면 답을 서둘러 받아야 할 이유가 보입니다.' : '날수로 나누면 무료 376분이라 초과가 없습니다. 이 경우는 원고가 계산하지 않았고 이 판에서 같은 식으로 셈한 값입니다.', 'small')
      ]);
    }
    add(body, [seg([{ label: '왕복 1 · 11월 17일 일정표(V2)', key: 'v2' }, { label: '왕복 2 · 11월 청구 명세(V3)', key: 'v3' }], function (k) { clear(rt); rt.appendChild(k === 'v2' ? v2() : v3()); }, { start: 1 }), rt]);
    body.appendChild(P('인구 왕복이 통과했다고 설계가 옳은 것은 아닙니다. "이 인구에 대해서는 사상이 맞다"까지만 보여 줍니다(21장의 "자료는 반증만 할 수 있다"와 같은 이야기).', 'small muted'));

    // 반례 시험
    body.appendChild(H4('반례 시험 10건 — 지키는 자리가 그 규칙 때문에 거부하는가'));
    var db0 = function () {
      return {
        members: { M07: { name: '김하나', active: true }, M12: { name: '박도윤', active: true }, M31: { name: '이서준', active: true } },
        periods: [['M07', '일반', 1, 15], ['M07', '상주', 15, null], ['M12', '상주', 1, null], ['M31', '일반', 1, null]],
        bookings: [{ id: 'B101', room: 'R1', a: 600, b: 690, st: 'used' }, { id: 'X1', room: 'R1', a: 600, b: 690, st: 'confirmed' }, { id: 'X2', room: 'R1', a: 690, b: 720, st: 'confirmed' }]
      };
    };
    function insertBooking(d, nb) {
      if (!d.members[nb.mem]) return ['거부', '외래 키'];
      if (nb.a % 30 || nb.b % 30) return ['거부', '30분 경계 CHECK'];
      if (nb.b - nb.a > 240) return ['거부', '길이 CHECK'];
      if ((nb.st === 'cancelled') !== !!nb.cancelledAt) return ['거부', 'R6 CHECK'];
      if (nb.st === 'confirmed') for (var i = 0; i < d.bookings.length; i++) { var b = d.bookings[i]; if (b.st === 'confirmed' && b.room === nb.room && b.a < nb.b && nb.a < b.b) return ['거부', 'R3 트리거']; }
      return ['받아들임', ''];
    }
    var tests = [
      ['R1 10:00-11:30 확정이 있을 때 R1 11:00-12:00 확정', '거부', function (d) { return insertBooking(d, { mem: 'M12', room: 'R1', a: 660, b: 720, st: 'confirmed' }); }],
      ['R1 11:30-12:00 확정이 있을 때 R1 12:00-12:30 확정', '받아들임', function (d) { return insertBooking(d, { mem: 'M12', room: 'R1', a: 720, b: 750, st: 'confirmed' }); }],
      ['확정 예약과 겹치는 시간의 취소된 예약', '받아들임', function (d) { return insertBooking(d, { mem: 'M31', room: 'R1', a: 630, b: 690, st: 'cancelled', cancelledAt: 1 }); }],
      ['10:15 시작', '거부', function (d) { return insertBooking(d, { mem: 'M31', room: 'R2', a: 615, b: 660, st: 'confirmed' }); }],
      ['4시간 30분 예약', '거부', function (d) { return insertBooking(d, { mem: 'M31', room: 'R2', a: 540, b: 810, st: 'confirmed' }); }],
      ['취소 시각 없는 취소 상태', '거부', function (d) { return insertBooking(d, { mem: 'M31', room: 'R2', a: 540, b: 600, st: 'cancelled' }); }],
      ['M07에게 11-20부터 시작하는 일반 등급 기간 추가', '거부', function (d) { var a = 20, b = null; for (var i = 0; i < d.periods.length; i++) { var p = d.periods[i]; if (p[0] === 'M07' && (p[3] == null || a < p[3]) && (b == null || p[2] < b)) return ['거부', 'R8 트리거']; } return ['받아들임', '']; }],
      ['이름 없는 활동 회원', '거부', function () { return ['거부', 'R9 CHECK']; }],
      ['이용완료된 B101을 확정으로 되돌림', '거부', function (d) { return d.bookings[0].st !== 'confirmed' ? ['거부', 'R4 트리거'] : ['받아들임', '']; }],
      ['없는 회원 M99의 예약', '거부', function (d) { return insertBooking(d, { mem: 'M99', room: 'R3', a: 600, b: 660, st: 'confirmed' }); }]
    ];
    var tl = h('div', { class: 'panel', style: 'padding:0;box-shadow:none' });
    var sum = h('p', { class: 'small', 'aria-live': 'polite' });
    tests.forEach(function (t, i) {
      var out = h('span', { class: 'pill' }, '실행 전');
      t.out = out;
      tl.appendChild(h('div', { class: 'result-row' }, [h('span', { class: 'id' }, String(i + 1)), h('span', { class: 'small' }, [t[0], h('span', { class: 'muted' }, ' · 기대 ' + t[1])]), out]));
    });
    var runBtn = h('button', { type: 'button', class: 'btn primary' }, '10건 실행하기');
    runBtn.addEventListener('click', function () {
      var nRej = 0, nAcc = 0, nOk = 0;
      tests.forEach(function (t, i) {
        setTimeout(function () {
          var r = t[2](db0()), ok = r[0] === t[1];
          if (r[0] === '거부') nRej++; else nAcc++; if (ok) nOk++;
          t.out.className = 'pill ' + (ok ? 'ok' : 'bad');
          t.out.textContent = r[0] + (r[1] ? ' (' + r[1] + ')' : '') + (ok ? '' : ' · 기대와 다름');
          if (i === tests.length - 1) sum.innerHTML = md('거부 ' + nRej + '건, 받아들임 ' + nAcc + '건, 기대와 같음 ' + nOk + '/10. 원고의 SQLite 실행 결과와 같습니다. 이 판의 계산은 규칙을 그대로 옮긴 작은 모형이고, 정본은 `verification/tum_roundtrip.py`입니다.');
        }, i * 90);
      });
    });
    add(body, [h('div', { class: 'controls' }, runBtn), tl, sum]);
    body.appendChild(note('<b>둘째 줄이 중요한 까닭</b> 끝 시각과 다음 시작이 같은 예약은 받아들여져야 합니다. 이 한 사례로 겹침 조건 `b.시작 < 새.끝 AND 새.시작 < b.끝`이 `[시작, 끝)`을 제대로 옮겼는지 확인됩니다. 거부만 시험하면 너무 엄격한 규칙을 놓칩니다.<br><b>찾은 빈칸</b> SQLite 판의 R3 트리거는 `INSERT`에만 걸려 있어 `UPDATE`로 시작·끝을 바꾸면 겹침을 검사하지 않습니다. PostgreSQL 배제 제약은 `UPDATE`에도 걸려 이 문제가 없습니다. 같은 개념 규칙이라도 내부 스키마 판마다 보장 범위가 다를 수 있습니다.', 'c L-int'));
    var _b = body; body = foldInto(_b, '무엇을 실행했고 무엇을 실행하지 않았나');
    body.appendChild(table(['검사', '실행 여부', '근거'], [['추적표(정적)', '손으로 함', '이 장의 표'], ['인구 왕복 V2·V3', h('span', { class: 'pill ok' }, '실행함 (SQLite 3.53.0)'), '`verification/tum-roundtrip-result.json`'], ['반례 시험 10건', h('span', { class: 'pill ok' }, '실행함 (SQLite 3.53.0)'), '같은 파일'], ['PostgreSQL DDL', h('span', { class: 'pill bad' }, '실행 안 함'), '이 환경에 PostgreSQL 없음'], ['계약 시험', h('span', { class: 'pill bad' }, '실행 안 함'), 'HTTP 서버·브로커 없음']]));
    body.appendChild(P('맞물림 여덟 질문은 [부록 D 설계 검사표](#checklist)에서 하나씩 표시하며 점검할 수 있습니다. q1(올림 여부)을 시험할 인구는 **만들 수 없습니다**. 예약 길이·무료 분이 모두 30의 배수라 초과도 늘 30의 배수이기 때문이에요. 인구를 만들어 보려다 그 인구가 불가능하다는 것을 아는 것도 검증의 결과입니다.', 'small'));
    body = _b;
  });

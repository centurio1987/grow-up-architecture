  /* ===== 제4부 거친 자료 (21~26장) ===== */

  // ---------- 21장 ----------
  RENDER.push(function renderC21() {
    var body = section('c21'); if (!body) return;
    body.appendChild(h('blockquote', { class: 'motto', style: 'margin:0 0 18px' }, '자료는 규칙을 반증할 수는 있어도 증명하지는 못합니다.'));
    body.appendChild(H4('같은 자료와 맞는 세계는 여럿입니다'));
    var counter = false;
    var wh = h('div', { 'aria-live': 'polite' });
    function drawWorlds() {
      var maxObs = counter ? 270 : 210;
      var svg = svgBox(680, 210, '예약 2,000건의 가장 긴 예약과 세 가지 규칙 후보 세계', 'minw-560');
      var X = function (m) { return 150 + m * (500 / 300); };
      for (var m = 0; m <= 300; m += 60) { svg.appendChild(s('line', { x1: X(m), y1: 14, x2: X(m), y2: 176, style: 'stroke:var(--rule);stroke-width:1' })); svg.appendChild(svgText(X(m), 196, (m / 60) + '시간', 't-sm t-sub', 'middle')); }
      svg.appendChild(s('rect', { x: X(0), y: 18, width: X(210) - X(0), height: 26, style: 'fill:var(--ink-2)' }));
      svg.appendChild(svgText(10, 36, '자료 D 2,000건', 't-sm t-b'));
      svg.appendChild(svgText(X(210) + 6, 36, '가장 긴 예약 3시간 30분', 't-sm'));
      if (counter) { svg.appendChild(s('rect', { x: X(210), y: 18, width: X(270) - X(210), height: 26, style: 'fill:var(--bad)' })); svg.appendChild(svgText(X(270) + 6, 36, '+ 4시간 30분 한 건', 't-sm t-b', 'start')); }
      [['세계 A', '규칙 4시간 이하', 240], ['세계 B', '규칙 3시간 30분 이하', 210], ['세계 C', '길이 규칙이 아예 없음', null]].forEach(function (w, i) {
        var y = 64 + i * 38, lim = w[2], ok = lim == null || maxObs <= lim;
        svg.appendChild(svgText(10, y + 18, w[0] + ' · ' + w[1], 't-sm' + (ok ? '' : ' t-sub')));
        svg.appendChild(s('rect', { x: X(0), y: y + 4, width: (lim == null ? X(300) : X(lim)) - X(0), height: 20, rx: 2, style: 'fill:' + (ok ? 'var(--ok-t)' : 'var(--bad-t)') + ';stroke:' + (ok ? 'var(--ok)' : 'var(--bad)') + (lim == null ? ';stroke-dasharray:5 4' : '') }));
        svg.appendChild(s('text', { x: (lim == null ? X(300) : X(lim)) - 6, y: y + 19, 'text-anchor': 'end', class: 't-sm t-b', style: 'fill:' + (ok ? 'var(--ok)' : 'var(--bad)') }, ok ? 'D와 맞음' : '반증됨'));
      });
      clear(wh); wh.appendChild(fig(svg, counter ? '반례 **하나**로 결론이 납니다(경우 1). 세계 A와 B는 거짓이 되었어요. 다만 그 한 행이 기록 오류라면 거짓이 아닐 수 있으니 사람에게 물어야 합니다.' : '모든 행이 4시간 이하여도(경우 2) "D의 예약은 규칙을 지켰다"까지만 참입니다. 앞으로의 예약은 D에 없으므로 세 세계 가운데 어느 것인지 자료로는 가를 수 없어요.', '그림 21-1'));
    }
    var cb = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false' }, '4시간 30분 예약 한 건 더하기');
    cb.addEventListener('click', function () { counter = !counter; cb.setAttribute('aria-pressed', counter ? 'true' : 'false'); drawWorlds(); });
    add(body, [h('div', { class: 'controls' }, cb), wh]);
    drawWorlds();
    body.appendChild(P('가르는 것은 사람의 진술과 책임자의 확인입니다. 그래서 거친 자료에서 나온 규칙 후보는 원장에 **관찰**로 적고, 규칙으로 쓰지 않은 채 진술과 확인을 구합니다. 자료가 많아도 관찰이 진술이 되지는 않아요. 근거 수준을 올리는 것은 자료의 양이 아니라 사람의 말입니다(Abedjan·Golab·Naumann 2015: 프로파일링 결과는 주어진 인스턴스에 관한 것).', 'prose small'));

    body.appendChild(H4('28행에서 "반례 없음"이 154개 — P12 택배 배송 기록'));
    body.appendChild(h('div', { class: 'three' }, [['28행 · 13열 · 송장 7개', '자료의 크기'], ['154개', '왼쪽 두 열 이하의 최소 함수 종속(한 열짜리는 21개)'], ['11개', '세 열 이하의 최소 유일 열 조합(한 열짜리는 `상태시각` 하나)']].map(function (x) { return h('div', { class: 'panel', style: 'box-shadow:none' }, [h('div', { style: 'font-size:22px;font-weight:700;letter-spacing:-.02em' }, x[0]), P(x[1], 'small muted')]); })));
    body.appendChild(P('업무 규칙으로 쓸 만한 것은 `송장번호 → 접수일`처럼 송장 하나에 딸린 값 몇 개와 `우편번호 → 시도` 정도이고, 나머지는 대부분 **우연**입니다. 값의 종류가 적을수록 우연히 맞아떨어질 기회가 많아지니까요. 후보를 줄이는 질문은 셋입니다: 왼쪽 값이 거의 다 다른가? 개념 스키마에 같은 뜻이 있는가? 담당자가 반례를 떠올리는가?', 'small'));

    body.appendChild(H4('프로파일 결과의 세 갈래와 어긋난 행의 세 종류'));
    body.appendChild(h('div', { class: 'two' }, [
      table(['반례', '할 일', '원장'], [['없음', '후보로 적고 진술을 구함. 감시 질의로 지켜봄', 'r(관찰) + q'], ['몇 개', '어긋난 행을 사람에게 보여 줌', 'q(행 번호와 함께)'], ['많음', '기각. 다른 꼴(조건부 규칙)이 있는지 봄', '기각 기록']]),
      table(['종류', 'P12의 예', '설계에 주는 것'], [['오류', '`기사코드 → 기사이름`이 D01 한 행에서 "김민 준"', '규칙을 제약으로 올리고 옛 행은 정제'], ['예외', '`송장번호 → 기사코드`가 6012-0002에서 어긋남(실패 뒤 다음 날 다른 기사)', '규칙의 꼴을 바꿈'], ['관행', '`기사코드 → 시도`가 반례 없이 성립', '규칙으로 올리지 않음. 반례를 지어서 물음']])
    ]));
    body.appendChild(P('오류와 예외를 가르는 것은 자료가 아니라 담당자의 말입니다. 관행은 반례가 없어서 자료로는 규칙과 구별되지 않으므로 반례를 지어서 묻습니다("D01 기사님이 경기 지역 송장을 배송할 수도 있나요?").', 'small muted'));

    body.appendChild(H4('결정은 세 갈래 가운데 하나로 기록합니다'));
    body.appendChild(h('div', { class: 'three' }, [
      ['제약으로 올림', '규칙이 확인되었고 예외가 없음', '개념 스키마의 R, 보장 위치표의 DB 제약', '기사 이름은 기사 목록에만 두고 상태 이벤트에는 기사코드만', 'L-int'],
      ['정제 규칙', '규칙은 맞는데 옛 자료가 어김', '옮겨 넣을 때 고치는 규칙 + 새 자료의 입력 검사', '"김민 준" → 기사 목록의 "김민준"', 'L-ext'],
      ['모델에서 허용', '예외가 업무상 정상이거나, 아직 모름', '선택 칸(NULL 허용), "확인 대기" 표시, 여러 값 허용', '목록에 없는 기사코드 D09는 지우지 않고 "확인 대기"로 보관', 'L-ctr']
    ].map(function (b) { return h('div', { class: 'panel c ' + b[4] }, [h('h5', null, b[0]), P('조건 · ' + b[1], 'small'), P('→ ' + b[2], 'small'), P('예 · ' + b[3], 'small muted')]); })));
    body.appendChild(P('셋째 갈래가 중요합니다. 모르는 것을 지우거나 그럴듯한 값으로 채우지 않고, **모른다는 사실을 모델에 남깁니다**. 정제는 자료를 고치는 일이지 규칙을 정하는 일이 아니에요. 제약 없이 한 번 정제하면 다음 달에 또 오타가 생깁니다.', 'small'));
    body.appendChild(table(['', '스키마 수준', '인스턴스 수준'], [[h('b', null, '한 곳'), '예약 표에 겹침을 막는 제약이 없음', '같은 회의실에 겹친 예약 두 건이 실제로 들어 있음'], [h('b', null, '여러 곳'), '앱은 회원번호, 회계는 이메일로 회원을 식별(10장 키 충돌)', '같은 회원의 이름이 앱과 회계에서 다르게 적힘']]));
    body.appendChild(P('Rahm·Do(2000)의 두 기준을 「틈」으로 채운 표입니다(원고는 초록과 검색 요약으로 확인). 스키마 수준 문제는 설계로, 인스턴스 수준 문제는 정제 규칙으로 풉니다.', 'small muted'));
  });

  // ---------- 22장 ----------
  RENDER.push(function renderC22() {
    var body = section('c22'); if (!body) return;
    body.appendChild(H4('메신저 대화 열두 줄 → 원장'));
    body.appendChild(linked(D.chat, D.chatLedger, { seedTitle: '윤 매니저와의 대화 (노쇼 자동 처리 요청)' }));
    body.appendChild(P('근거 수준은 모두 **진술**입니다. 다만 진술한 사람과 확인할 사람이 다를 수 있어요. 매니저가 "3회예요"라고 말해도 예약 제한을 실제로 거는 사람이 대표라면 확인은 대표에게서 받습니다. 말 바꿈("2회" → "3회")은 지우지 않고 시점과 함께 남깁니다.', 'small'));
    body.appendChild(H4('모호한 말을 확인할 수 있는 질문으로'));
    body.appendChild(table(['모호한 말', '숨은 뜻', '바꾼 질문'], [['보통 10분? 15분', '값이 확정되지 않았거나 사람마다 다름', '"데스크에 붙은 기준(15분)과 실제로 하시는 시간 가운데 어느 것을 시스템에 넣을까요?"'], ['웬만하면 봐드려요', '예외가 있는데 기준이 없음', '"지난달 상주 회원이 늦게 오신 경우가 몇 번이었고, 그중 노쇼로 친 것은 몇 번이었나요?"'], ['그때그때 달라요', '결정이 사람에게 있음', '"최근 예약 제한 세 번은 각각 며칠이었나요? 앞으로도 대표님이 매번 정하시나요?"'], ['예전 거고 지금은', '규칙이 바뀌었음', '"3회로 바뀐 것은 언제부터인가요? 그 전에 2회로 제한된 회원도 있나요?"'], ['그거도', '앞의 무엇을 가리킴', '(앞뒤로 "손님 이름 적기"임을 확인)']]));
    body.appendChild(h('blockquote', { class: 'motto' }, '규칙을 물으면 바람을 듣고, 사례를 물으면 실제를 듣습니다.'));
    body.appendChild(H4('명사 표시는 빠뜨리지 않는 데 쓰고, 고르는 일은 사람이 합니다'));
    var nouns = svgBox(680, 230, '대화에서 뽑은 명사 후보를 수단·주체·상태·속성으로 걸러 남은 후보 셋', 'minw-560');
    arrowDefs(nouns, 'c22a');
    var cand = ['노쇼', '시작', '상주분', '사진', '데스크', '예약 제한', '대표님', '손님', '이름', '앱', '예약한 사람'];
    cand.forEach(function (c, i) { var y = 10 + i * 19; nouns.appendChild(svgText(20, y + 12, c, 't-sm')); });
    nouns.appendChild(s('rect', { x: 8, y: 4, width: 120, height: 216, rx: 3, style: 'fill:none;stroke:var(--rule-2)' }));
    var drops = [['사진, 앱', '정보를 전하는 수단'], ['데스크, 대표님', '사람·역할 → 연산의 주체'], ['노쇼', '예약의 상태 값 (F7)'], ['이름', '손님의 속성'], ['시작', '예약의 속성 (F6)']];
    drops.forEach(function (d, i) { var y = 8 + i * 42; nouns.appendChild(s('rect', { x: 200, y: y, width: 250, height: 34, rx: 3, class: 'box-s' })); nouns.appendChild(svgText(212, y + 14, d[0], 't-sm t-b')); nouns.appendChild(svgText(212, y + 28, '걸러 냄 · ' + d[1], 't-sm t-mut')); });
    nouns.appendChild(s('line', { x1: 130, y1: 112, x2: 196, y2: 112, class: 'ln', 'marker-end': 'url(#c22a)' }));
    nouns.appendChild(s('line', { x1: 452, y1: 112, x2: 500, y2: 112, class: 'ln', 'marker-end': 'url(#c22a)' }));
    [['손님', '이름만 있음 → 예약에 딸린 값일 수도'], ['예약 제한', '새 개념'], ['상주 회원', '등급']].forEach(function (k, i) { var y = 56 + i * 44, g = s('g', { class: 'L-con' }); g.appendChild(s('rect', { x: 504, y: y, width: 170, height: 36, rx: 3, class: 'box-c' })); g.appendChild(svgText(514, y + 15, k[0], 't-sm t-b')); g.appendChild(svgText(514, y + 29, k[1], 't-sm t-mut')); nouns.appendChild(g); });
    body.appendChild(fig(nouns, 'Chen(1983)의 번역 규칙과 Abbott(1983)의 명사·동사 방법은 후보를 빠뜨리지 않게 해 주지만, 규칙이 서로 겹치고 늘 맞지는 않는다는 지적(Omar 외 2021)이 있습니다. 명사를 모두 개체로 만들면 스키마가 부풉니다.', '그림 22-1'));
    body.appendChild(P('이 대화는 7장 q2(노쇼는 누가, 언제, 무엇으로 판정하나?)에 일부 답을 줍니다. 지금은 사람이 판정하고 자동으로 하고 싶다는 것이에요. 자동 판정을 하려면 "입실 확인"이라는 새 사실이 개념 스키마에 들어와야 합니다. 대화가 담화 세계의 경계를 다시 묻게 만든 경우입니다. 인터뷰를 한 번 더 했는데 새 t·r·q가 하나도 생기지 않으면 다른 담당자나 자료로 옮겨 갑니다(정성 코딩의 포화 기준).', 'small muted'));
  });

  // ---------- 23장 ----------
  RENDER.push(function renderC23() {
    var body = section('c23'); if (!body) return;
    body.appendChild(h('blockquote', { class: 'motto', style: 'margin:0 0 18px' }, '합계 줄은 사실이 아니라 검산 거리입니다.'));
    var tenSteps = ['표 밖의 것 떼기', '머리글 줄 수 정하기', '병합 칸 채우기', '반복 열 묶음 펴기', '칸 안의 여러 사실 나누기', '행 머리에 붙은 값 떼기', '합계 떼고 검산', '표시의 뜻 묻기', '식별 맞추기', '빈칸의 뜻 정하기'];
    var stateSteps = [[], [1, 2, 3], [4], [5, 6, 9, 10], [7, 8]];
    var stateNames = ['원본 시트', '머리글 풀기', '세로로 펴기', '칸 나누기·시각 읽기', '합계 검산·색 묻기'];
    var stage = h('div', { 'aria-live': 'polite' });
    var list = h('ol', { class: 'small', style: 'margin:0;padding-left:1.4em;columns:2;column-gap:24px' });
    tenSteps.forEach(function (t) { list.appendChild(h('li', null, t)); });
    function cell(t, st) { return h('td', { style: st || null }, t); }
    function draw(k) {
      $$('li', list).forEach(function (li, i) { var done = []; for (var j = 1; j <= k; j++) done = done.concat(stateSteps[j]); li.style.fontWeight = stateSteps[k].indexOf(i + 1) >= 0 ? '700' : ''; li.style.color = done.indexOf(i + 1) >= 0 ? 'var(--ink)' : 'var(--ink-3)'; });
      clear(stage);
      if (k === 0) {
        var y = 'background:#FCE38A;color:#1A1714';
        stage.appendChild(h('p', { class: 'small muted' }, '11월 셋째 주 예약 (노란 칸 = 가예약)'));
        stage.appendChild(h('div', { class: 'tbl-wrap' }, h('table', { style: 'font-size:13px' }, [
          h('thead', null, [h('tr', null, [h('th', { rowspan: 2 }, '회의실'), h('th', { colspan: 2 }, '월(11/16)'), h('th', { colspan: 2 }, '화(11/17)'), h('th', { colspan: 2 }, '수(11/18)')]), h('tr', null, ['오전', '오후', '오전', '오후', '오전', '오후'].map(function (x) { return h('th', null, x); }))]),
          h('tbody', null, [
            h('tr', null, [cell('R1(6인)'), cell('김하나 10-11:30'), cell(''), cell('김하나 10-11:30 / 박도윤 11:30-12'), cell(''), cell(''), cell('최유나 1시~2시')]),
            h('tr', null, [cell('R2(4인)'), cell(''), cell('박도윤 3-5시(노쇼)'), cell(''), cell('김하나 2-4', y), cell(''), cell('')]),
            h('tr', null, [cell('R3'), cell(''), cell(''), cell(''), cell(''), cell('이서준 9-10 (취소)'), cell('')]),
            h('tr', null, [cell('합계'), cell('1'), cell('1'), cell('2'), cell('1'), cell('1'), cell('1')])
          ])
        ])));
        stage.appendChild(P('※ 화 오후 R2 칸은 노란색. 사람이 읽기 좋게 만든 표는 담당자 한 사람의 **외부 스키마**입니다. 할 일은 그 모양을 벗겨 아래의 사실을 되찾는 것이에요(상향 전략).', 'small'));
      } else if (k === 1) {
        stage.appendChild(table(['회의실', '월 오전', '월 오후', '화 오전', '화 오후', '수 오전', '수 오후'], [['R1(6인)', '김하나 10-11:30', '', '김하나 10-11:30 / 박도윤 11:30-12', '', '', '최유나 1시~2시'], ['R2(4인)', '', '박도윤 3-5시(노쇼)', '', '김하나 2-4', '', ''], ['R3', '', '', '', '', '이서준 9-10 (취소)', '']]));
        stage.appendChild(P('제목 줄·메모(※)를 떼고, 머리글 두 줄(요일 / 오전·오후)을 하나로 합치고, 병합된 "월(11/16)" 오른쪽 빈칸을 같은 값으로 채웠습니다. 합계 줄은 7단계에서 따로 씁니다.', 'small'));
      } else if (k === 2) {
        stage.appendChild(table(['회의실', '날짜', '반나절', '칸 원문'], [['R1', '11-16', '오전', '김하나 10-11:30'], ['R2', '11-16', '오후', '박도윤 3-5시(노쇼)'], ['R1', '11-17', '오전', '김하나 10-11:30 / 박도윤 11:30-12'], ['R2', '11-17', '오후', '김하나 2-4'], ['R3', '11-18', '오전', '이서준 9-10 (취소)'], ['R1', '11-18', '오후', '최유나 1시~2시']]));
        stage.appendChild(P('행 머리·열 머리·값의 세 짝으로 펴는 일을 "세로로 펴기"(unpivot)라고 부릅니다. 빈 칸은 행이 되지 않아 6개 칸이 남았어요. 반복 열을 그대로 두면 날짜가 바뀔 때마다 열을 더해야 합니다.', 'small'));
      } else if (k === 3) {
        stage.appendChild(table(['회의실', '날짜', '예약자', '시작', '끝', '상태'], [['R1', '11-16', '김하나', '10:00', '11:30', '미기재'], ['R2', '11-16', '박도윤', '15:00', '17:00', '노쇼'], ['R1', '11-17', '김하나', '10:00', '11:30', '미기재'], ['R1', '11-17', '박도윤', '11:30', '12:00', '미기재'], ['R2', '11-17', '김하나', '14:00', '16:00', '미기재 (노란 칸: 가예약?)'], ['R3', '11-18', '이서준', '09:00', '10:00', '취소 (취소 시각 모름)'], ['R1', '11-18', '최유나', '13:00', '14:00', '미기재']], { rowClass: function (r, i) { return i === 3 ? 'hl' : null; } }));
        stage.appendChild(table(['원문', '해석', '근거'], [['`10-11:30`', '10:00 ~ 11:30', '오전 칸'], ['`3-5시`', '15:00 ~ 17:00', '**오후 칸이라 3을 15로 읽음**'], ['`1시~2시`', '13:00 ~ 14:00', '오후 칸'], ['`2-4`', '14:00 ~ 16:00', '오후 칸'], ['`9-10`', '09:00 ~ 10:00', '오전 칸']]));
        stage.appendChild(P('화요일 R1 칸을 "/"로 나눠 예약 후보는 7건이 되었습니다. 칸 해석의 근거는 칸의 **위치**이고, 규칙으로 정할 수 없는 칸(오전 칸의 "12-1")은 q로 남깁니다. "R1(6인)"의 6은 회의실의 사실(F3)로 떼어 냅니다. 괄호가 없는 칸은 근거가 없으니 "상태 미기재"로 둡니다.', 'small'));
      } else {
        stage.appendChild(table(['열', '세어 본 예약', '합계 줄', '같은가'], [['월 오전', 'R1 김하나 = 1', '1', '예'], ['월 오후', 'R2 박도윤(노쇼) = 1', '1', '예'], ['화 오전', 'R1 김하나, 박도윤 = 2', '2', '예'], ['화 오후', 'R2 김하나 = 1', '1', '예'], ['수 오전', 'R3 이서준(취소) = 1', '1', h('span', null, ['예 ', h('span', { class: 'pill warn' }, '취소도 세었음')])], ['수 오후', 'R1 최유나 = 1', '1', '예']]));
        stage.appendChild(P('검산은 모두 맞지만, 수요일 오전의 1은 취소된 예약을 센 값입니다. 매니저의 합계는 "예약이 들어온 건수"였지 "쓴 건수"가 아니었던 거예요.', 'small'));
        stage.appendChild(h('div', { class: 'memo mono', style: 'font-size:12.5px', html: 't8  가예약: 노란 칸. 뜻은 매니저 진술 필요 (확정 전? 결제 전?)<br>q13 가예약은 확정으로 바뀌기도, 그냥 사라지기도 하나요? 언제까지 가예약인가요?<br><b>q14 가예약도 겹침 금지(R3)를 지켜야 하나요? 다른 사람이 같은 시간을 확정할 수 있나요?</b>' }));
        stage.appendChild(P('q14의 답에 따라 4장 배제 제약의 조건(`WHERE status = \'confirmed\'`)이 바뀔 수 있습니다. 색 하나가 내부 스키마의 제약까지 영향을 줍니다. 내보내기를 하면 색 표시는 대개 사라지므로 CSV가 아니라 원본 파일을 받아 봅니다.', 'small muted'));
      }
    }
    add(body, [seg(stateNames.map(function (n, i) { return { label: i + '. ' + n, key: i }; }), draw, { lbl: '단계', start: 0 }), h('div', { class: 'two wide-left' }, [stage, h('div', { class: 'panel', style: 'box-shadow:none' }, [h('div', { class: 'eyebrow', style: 'margin-bottom:6px' }, '되살리는 순서 10단계 · 굵은 줄이 지금 단계'), list])])]);
    body.appendChild(table(['빈칸의 뜻', '예', '옮기는 법'], [['없음', '그 시간에 예약 없음', '행을 만들지 않음'], ['모름', '적는 것을 잊음', '행은 만들지 않되, 기간을 "기록 불완전"으로 표시할지 q'], ['0', '금액 칸이 비면 0원', '0으로 옮김 (뜻이 확인된 경우만)'], ['해당 없음', '아직 가입 전이라 회비가 없음', '행을 만들지 않음. "미납"과 구별되게 가입일을 기록']]));
    body.appendChild(P('1년 치를 옮겨도 채울 수 없는 사실이 있습니다. 취소 시각(F9)이 없어 R5와 D1을 계산할 수 없고, 예약번호도 등급(F2)도 없으며, 상태가 대부분 "미기재"입니다.', 'small muted'));
  });

  // ---------- 24장 ----------
  RENDER.push(function renderC24() {
    var body = section('c24'); if (!body) return;
    var cols = D.dumpCols, rows = D.dump;
    var idx = {}; cols.forEach(function (c, i) { idx[c] = i; });
    // 한 열 통계
    body.appendChild(H4('「틈」 예약 덤프 12행 — 열마다 서로 다른 값 / 빈칸'));
    body.appendChild(h('div', { class: 'controls' }, cols.map(function (c) {
      var vals = {}, blank = 0; rows.forEach(function (r) { vals[r[idx[c]]] = 1; if (r[idx[c]] === '') blank++; });
      return h('span', { class: 'tag', style: 'font-size:12px' }, c + ' ' + Object.keys(vals).length + '/' + blank);
    })));
    body.appendChild(P('빈칸은 결측으로 세지만, 유일성과 종속을 계산할 때는 빈 문자열 값 하나로 다룹니다(원고의 스크립트와 같은 규칙). 그래서 `room_capacity`의 "3"에는 빈 값이 하나로 들어 있어요. SQL의 `NULL`은 서로 같지 않다고 보는 규칙과 다릅니다.', 'small muted'));

    body.appendChild(H4('직접 계산해 보기 — 유일 열 조합 · 함수 종속 · 포함 종속'));
    var mode = 'fd', X = ['member_id'], Y = 'grade';
    var xBox = h('div', { class: 'controls' }), yBox = h('div', { class: 'controls' });
    var tableHolder = h('div'), result = h('div', { 'aria-live': 'polite' });
    function chipRow(box, label, isY) {
      clear(box); box.appendChild(h('span', { class: 'lbl' }, label));
      cols.forEach(function (c) {
        var on = isY ? Y === c : X.indexOf(c) >= 0;
        var b = h('button', { type: 'button', class: 'btn', 'aria-pressed': on ? 'true' : 'false', style: 'font-family:var(--mono);font-size:12px;padding:4px 8px' }, c);
        b.addEventListener('click', function () {
          if (isY) Y = c; else { var k = X.indexOf(c); if (k >= 0) X.splice(k, 1); else if (X.length < 3) X.push(c); }
          compute();
        });
        box.appendChild(b);
      });
    }
    function key(r, cs) { return cs.map(function (c) { return r[idx[c]]; }).join('\u0001'); }
    function compute(judge) {
      chipRow(xBox, mode === 'ind' ? '' : mode === 'fd' ? '왼쪽 X (세 열까지)' : '열 조합 (세 열까지)', false);
      chipRow(yBox, '오른쪽 Y', true);
      xBox.hidden = mode === 'ind'; yBox.hidden = mode !== 'fd';
      var bad = {}, msg = [];
      if (mode === 'ind') {
        var mem = {}; D.members.forEach(function (m) { mem[m[0]] = 1; });
        var missing = {}; rows.forEach(function (r, i) { if (!mem[r[1]]) { bad[i] = 1; missing[r[1]] = 1; } });
        var ms = Object.keys(missing);
        msg.push(h('p', null, [h('span', { class: 'pill ' + (ms.length ? 'bad' : 'ok') }, ms.length ? '성립 안 함' : '성립'), ' 덤프.member_id 값이 모두 회원목록.member_id(M07, M12, M31)에 있는가 → 목록에 없는 값: ', h('b', { class: 'mono' }, ms.join(', ') || '없음')]));
      } else if (!X.length) {
        msg.push(P('열을 하나 이상 고르세요.', 'small muted'));
      } else {
        var groups = {};
        rows.forEach(function (r, i) { var k = key(r, X); (groups[k] = groups[k] || []).push(i); });
        if (mode === 'ucc') {
          var dup = Object.keys(groups).filter(function (k) { return groups[k].length > 1; });
          dup.forEach(function (k) { groups[k].forEach(function (i) { bad[i] = 1; }); });
          msg.push(h('p', null, [h('span', { class: 'pill ' + (dup.length ? 'bad' : 'ok') }, dup.length ? '유일 아님' : '유일'), ' (' + X.join(', ') + ') 값 조합 ' + Object.keys(groups).length + '가지 / 12행' + (dup.length ? ' · 겹친 조합 ' + dup.length + '개' : '')]));
        } else {
          var remove = 0, viol = 0;
          Object.keys(groups).forEach(function (k) {
            var freq = {}; groups[k].forEach(function (i) { var v = rows[i][idx[Y]]; freq[v] = (freq[v] || 0) + 1; });
            var vs = Object.keys(freq);
            if (vs.length > 1) { viol++; var mx = Math.max.apply(null, vs.map(function (v) { return freq[v]; })); remove += groups[k].length - mx; groups[k].forEach(function (i) { bad[i] = 1; }); }
          });
          var g3 = remove / rows.length;
          msg.push(h('p', null, [h('span', { class: 'pill ' + (viol ? (g3 < 0.2 ? 'warn' : 'bad') : 'ok') }, viol ? (g3 < 0.2 ? '근사로만 성립' : '성립 안 함') : '성립'), ' ' + X.join(', ') + ' → ' + Y + (viol ? ' · 어긋난 왼쪽 값 ' + viol + '개 · 지울 최소 행 ' + remove + ' · 오차 g3 = ' + remove + ' / 12 ≈ ' + g3.toFixed(4) : ' · 반례 없음')]));
        }
      }
      if (judge) msg.push(note('<b>' + String(judge.label) + '</b> → ' + String(judge.verdict) + '<br>' + String(judge.why), 'c L-con'));
      clear(result); add(result, msg);
      var hiCols = mode === 'ind' ? ['member_id'] : X.concat(mode === 'fd' ? [Y] : []);
      clear(tableHolder);
      tableHolder.appendChild(h('div', { class: 'tbl-wrap' }, h('table', { style: 'font-size:12px;font-family:var(--mono)' }, [
        h('thead', null, h('tr', null, cols.map(function (c) { return h('th', { style: hiCols.indexOf(c) >= 0 ? 'background:var(--ext-t);color:var(--ext)' : null }, c); }))),
        h('tbody', null, rows.map(function (r, i) { return h('tr', { class: bad[i] ? 'hl' : null, style: bad[i] ? '--t:var(--bad-t)' : null }, r.map(function (v, j) { return h('td', { style: (hiCols.indexOf(cols[j]) >= 0 ? 'font-weight:700;' : '') + 'white-space:nowrap' }, v === '' ? h('span', { class: 'muted' }, '∅') : v); })); }))
      ])));
    }
    var modeSeg = seg([{ label: '함수 종속 X → Y', key: 'fd' }, { label: '유일 열 조합', key: 'ucc' }, { label: '포함 종속(외래 키 후보)', key: 'ind' }], function (k) { mode = k; compute(); }, { lbl: '검사' });
    var presets = h('div', { class: 'controls' }, [h('span', { class: 'lbl' }, '원고의 결과 읽기')].concat(D.profileJudge.map(function (j) {
      var b = h('button', { type: 'button', class: 'btn', style: 'font-size:12.5px' }, j.label);
      b.addEventListener('click', function () { mode = j.mode; if (j.x) X = j.x.slice(); if (j.y) Y = j.y; modeSeg.querySelectorAll('button').forEach(function (bb, i) { bb.setAttribute('aria-pressed', ['fd', 'ucc', 'ind'][i] === mode ? 'true' : 'false'); }); compute(j); });
      return b;
    })));
    add(body, [presets, modeSeg, xBox, yBox, result, tableHolder]);
    modeSeg.querySelectorAll('button')[0].setAttribute('aria-pressed', 'true');
    compute(D.profileJudge[8]);
    body.appendChild(P('"우연"으로 버린 것들의 공통점은 왼쪽 열의 값이 거의 행마다 달라서 키처럼 행동한다는 점입니다. 프로파일러가 낸 종속 목록을 정규화 입력으로 그대로 쓰면 `starts_at → member_id`를 따라 "시작 시각 표"가 생깁니다. 유일 열 조합이 여럿이면 기본 키를 고르는 기준은 자료가 아니라 2장의 참조 방식입니다. `cancelled_at`의 빈칸 83%는 품질 문제가 아니에요. R6에 따라 취소 상태인 두 행에만 값이 있어야 하고 실제로 그렇습니다. 결측은 비율이 아니라 **규칙과 함께** 읽습니다.', 'small'));
    body.appendChild(P('원고의 결과(`verification/tum-profile.json` 등): 세 열 이하의 최소 유일 열 조합 8개, 왼쪽 한 열의 최소 함수 종속 9개, 두 열까지 13개, 근사 종속 `member_id → grade` 오차 0.1667(M07에서 일반 2 · 상주 2), 포함 종속은 M44 때문에 성립 안 함. 이 쪽의 계산은 같은 덤프로 다시 셈한 것입니다.', 'small muted'));
  });

  // ---------- 25장 ----------
  RENDER.push(function renderC25() {
    var body = section('c25'); if (!body) return;
    var lines = D.events.map(function (t) { return JSON.parse(t); });
    var shapes = {}, order = [];
    lines.forEach(function (o, i) { var k = Object.keys(o).sort().join(','); if (!shapes[k]) { shapes[k] = []; order.push(k); } shapes[k].push(i); });
    var names = ['A', "A'", 'B', "B'"], layerOfShape = ['ext', 'ext', 'ctr', 'ctr'];
    var shapeOf = {}; order.forEach(function (k, j) { shapes[k].forEach(function (i) { shapeOf[i] = j; }); });
    body.appendChild(h('blockquote', { class: 'motto', style: 'margin:0 0 18px' }, '없는 것은 모르는 것이고, null 은 비워 둔 것입니다.'));
    body.appendChild(H4('로그는 계약의 지층입니다 — 여덟 줄을 모양별로'));
    var raw = h('pre', { class: 'memo mono', style: 'font-size:12px;white-space:pre-wrap;word-break:break-all;margin:0', 'aria-live': 'polite' });
    var svg = svgBox(680, 170, '2025년 3월부터 2026년 6월까지 로그 여덟 줄이 모양 A, A′, B, B′으로 나뉜다', 'minw-560');
    function dateOf(o) { return (o.start || o.startAt).slice(0, 10); }
    var t0 = Date.parse('2025-02-01'), t1 = Date.parse('2026-07-15');
    var Xd = function (d) { return 40 + (Date.parse(d) - t0) / (t1 - t0) * 610; };
    ['2025-03', '2025-07', '2025-11', '2026-03', '2026-07'].forEach(function (m) { var x = Xd(m + '-01'); svg.appendChild(s('line', { x1: x, y1: 10, x2: x, y2: 140, style: 'stroke:var(--rule);stroke-width:1' })); svg.appendChild(svgText(x, 158, m, 't-sm t-sub', 'middle')); });
    var dots = [];
    lines.forEach(function (o, i) {
      var j = shapeOf[i], cnt = shapes[order[j]].indexOf(i), y = 22 + j * 30;
      var g = s('g', { class: 'hot L-' + layerOfShape[j], tabindex: 0, role: 'button', 'aria-label': (i + 1) + '번째 줄, 모양 ' + names[j] });
      g.appendChild(s('circle', { cx: Xd(dateOf(o)) + cnt * 12, cy: y, r: 7, class: 'fill-c', style: j % 2 ? 'stroke:var(--paper);stroke-width:2' : null }));
      function pick() { dots.forEach(function (d) { d.classList.remove('on'); }); g.classList.add('on'); raw.textContent = (i + 1) + '번째 줄 · 모양 ' + names[j] + '\n' + D.events[i]; }
      g.addEventListener('click', pick); g.addEventListener('keydown', function (e) { if (e.key === 'Enter') pick(); });
      dots.push(g); svg.appendChild(g);
    });
    order.forEach(function (k, j) { svg.appendChild(svgText(8, 26 + j * 30, names[j], 't-sm t-b')); });
    svg.querySelectorAll('circle').forEach(function (c) { c.style.transition = 'r .15s'; });
    add(body, [h('div', { class: 'two wide-left' }, [fig(svg, '점을 눌러 그 줄의 원문을 보세요. 최상위 필드 이름의 집합이 같은 줄끼리 모양으로 묶었습니다(이 쪽에서 직접 묶음). 모양 A 2줄·A′ 1줄(2025-03), B 2줄(2026-01), B′ 3줄(2026-06).', '그림 25-1'), raw])]);
    dots[6].dispatchEvent(new Event('click'));
    body.appendChild(P('여덟 줄을 하나의 스키마로 합치면 `required`가 비어 아무 객체나 통과시키는 스키마가 됩니다(GenSON은 모든 객체에 있었던 키만 `required`에 넣음). 이름 집합 기준으로 먼저 나누고, 모양 사이의 관계는 사람이 판단합니다.', 'small'));

    // 필드 출현
    body.appendChild(H4('필드 출현 수 — 어느 필드도 여덟 줄 모두에 나오지 않습니다'));
    var stats = {}, forder = [];
    lines.forEach(function (o) { Object.keys(o).forEach(function (k) { if (!stats[k]) { stats[k] = { n: 0, types: {} }; forder.push(k); } stats[k].n++; var t = o[k] === null ? 'null' : typeof o[k] === 'number' ? 'integer' : typeof o[k]; stats[k].types[t] = (stats[k].types[t] || 0) + 1; }); });
    var fb = svgBox(680, forder.length * 22 + 30, '필드마다 나온 줄과 없는 줄의 수', 'minw-560');
    var bw = function (n) { return n * 50; };
    forder.forEach(function (k, i) {
      var y = 8 + i * 22, st = stats[k];
      fb.appendChild(svgText(130, y + 13, k, 't-sm t-mono', 'end'));
      var x = 140;
      Object.keys(st.types).forEach(function (t) { var w = bw(st.types[t]); fb.appendChild(s('rect', { x: x, y: y + 2, width: w - 1, height: 15, style: 'fill:' + (t === 'null' ? 'var(--warn)' : t === 'integer' ? 'var(--int)' : 'var(--ink-2)') })); x += w; });
      fb.appendChild(s('rect', { x: x, y: y + 2, width: bw(8 - st.n) - 1, height: 15, style: 'fill:none;stroke:var(--rule-2);stroke-dasharray:3 2' }));
      fb.appendChild(svgText(140 + bw(8) + 8, y + 13, st.n + '줄 · ' + Object.keys(st.types).map(function (t) { return t + ' ' + st.types[t]; }).join(', '), 't-sm t-mut'));
    });
    body.appendChild(fig(fb, '칠한 칸은 나온 줄, 점선 칸은 없는 줄입니다. `minutes`는 integer 2줄과 null 1줄로 나뉩니다. 출현 비율은 모양과 시기를 함께 봐야 뜻이 있어요(`note`는 한 줄뿐이지만 선택 필드일 수 있음).', '그림 25-2'));

    // A ↔ B 대응
    body.appendChild(H4('모양 A와 B의 필드 대응 — 선은 관찰입니다'));
    var map = [['type', 'event', '"booking_confirmed" → "booking.confirmed"'], ['booking', 'bookingId', '같음'], ['member', 'memberId', '같음'], ['room', 'roomCode', '같음'], ['start', 'startAt', '시간대 표기가 생김'], ['end', 'endAt', '같은 변화'], [null, 'eventId', '새로 생김'], ['note', null, "A'에만 있음"]];
    var mp = svgBox(680, map.length * 30 + 10, '모양 A의 필드와 모양 B의 필드를 점선으로 잇는다', 'minw-560');
    map.forEach(function (m, i) {
      var y = 6 + i * 30;
      if (m[0]) { var a = s('g', { class: 'L-ext' }); a.appendChild(s('rect', { x: 10, y: y, width: 120, height: 24, rx: 3, class: 'box-c' })); a.appendChild(svgText(70, y + 16, m[0], 't-sm t-mono', 'middle')); mp.appendChild(a); }
      if (m[1]) { var b = s('g', { class: 'L-ctr' }); b.appendChild(s('rect', { x: 280, y: y, width: 120, height: 24, rx: 3, class: 'box-c' })); b.appendChild(svgText(340, y + 16, m[1], 't-sm t-mono', 'middle')); mp.appendChild(b); }
      if (m[0] && m[1]) mp.appendChild(s('line', { x1: 132, y1: y + 12, x2: 278, y2: y + 12, class: 'ln ln-dash' }));
      mp.appendChild(svgText(420, y + 16, m[2], 't-sm t-mut'));
    });
    body.appendChild(fig(mp, '모양 사이의 필드 대응은 값과 이름이 비슷하다는 **관찰**일 뿐이라 원장에 t로, 근거 수준은 관찰로 적습니다. e-91은 `Z`(UTC)로 적혔어요. `2026-06-02T01:00:00Z`는 한국 시간 10:00과 같은 순간이지만, `+09:00`만 처리하던 소비자라면 이 줄에서 오류가 납니다.', '그림 25-3'));
    body.appendChild(table(['변화', '무엇이 바뀌었나', '옛 소비자가 새 줄을 읽음(FORWARD)', '새 소비자가 옛 줄을 읽음(BACKWARD)', '판정'], [["A → A'", '선택 필드 note 추가', '모르는 필드를 무시하면 됨', 'note가 없어도 됨', h('span', { class: 'pill ok' }, '호환(선택 필드라면)')], ['A → B', '모든 필드 이름 변경, 시간대 표기, eventId 추가', '실패: 아는 필드가 하나도 없음', '실패: 옛 이름을 모름', h('span', { class: 'pill bad' }, '비호환 · MAJOR')], ["B → B'", '선택 필드 minutes 추가', 'Tolerant Reader면 그대로', 'minutes가 없어도 됨', h('span', { class: 'pill ok' }, '호환 · MINOR')]]));
    body.appendChild(h('div', { class: 'two' }, [note('<b>필드가 없음</b><br>그 필드를 모르는(보내지 않는) 생산자가 쓴 줄<br><span class="muted">e-1, e-2: minutes가 생기기 전의 줄</span>'), note('<b>값이 null</b><br>필드는 아는데 값을 넣지 않은 줄<br><span class="muted">e-95: 계산을 못 했나? 일부러 비웠나? → q</span>', 'c L-ctr')]));
    body.appendChild(P('A → B를 FULL 호환으로 만들 방법이 있었습니다. 한동안 새 이름과 옛 이름을 함께 보내고, 모든 소비자가 옮긴 뒤 옛 이름을 지우는 것(11장 진화 겹의 "병행"). 지금 계약은 모양 B′을 기준으로 `minutes`가 없거나 null이면 소비자가 구간으로 계산한다고 적고, 옛 줄은 정제 규칙으로 읽습니다(시간대 없는 시각을 +09:00으로 읽기와 note 버리기는 "확인 필요").', 'small'));
  });

  // ---------- 26장 ----------
  RENDER.push(function renderC26() {
    var body = section('c26'); if (!body) return;
    body.appendChild(H4('옛 DB의 선언된 구조와 선언되지 않은 구조'));
    var er = svgBox(680, 250, '옛 DB의 MEM, RSV, CD 세 표와 선언되지 않은 외래 키 두 개', 'minw-560');
    arrowDefs(er, 'c26a');
    function tbl(x, y, name, colsT, note2) {
      var g = s('g', { class: 'L-int' });
      g.appendChild(s('rect', { x: x, y: y, width: 170, height: 26 + colsT.length * 20, rx: 3, class: 'box-c' }));
      g.appendChild(s('rect', { x: x, y: y, width: 170, height: 24, rx: 3, class: 'fill-c' }));
      g.appendChild(s('text', { x: x + 10, y: y + 17, class: 't-mono t-b', style: 'fill:var(--paper)' }, name));
      colsT.forEach(function (c, i) { g.appendChild(svgText(x + 10, y + 42 + i * 20, c, 't-sm t-mono')); });
      if (note2) g.appendChild(svgText(x, y + 44 + colsT.length * 20, note2, 't-sm t-mut'));
      er.appendChild(g);
    }
    tbl(10, 10, 'MEM', ['MEM_CD  CHAR(4) PK', 'NM', 'TEL', 'DEL_YN'], 'N001, S002 · 첫 글자 = 등급?');
    tbl(250, 10, 'RSV', ['RSV_NO  INTEGER PK', 'MEM_CD  CHAR(4)', 'ROOM    01·02·03', 'YMD     20250304', 'FR · TO_ 1000', 'ST      CHAR(1)', 'ETC     여러 용도'], '외래 키 선언 없음');
    tbl(500, 10, 'CD', ['GRP', 'CD', 'NM'], "GRP='RSV_ST' 외 여러 묶음");
    er.appendChild(s('path', { d: 'M250,76 C200,76 220,56 182,56', class: 'ln ln-dash', 'marker-end': 'url(#c26a)', style: 'stroke:var(--focus);stroke-width:1.6' }));
    er.appendChild(svgText(214, 100, '암묵 외래 키', 't-sm', 'middle'));
    er.appendChild(s('path', { d: 'M420,156 C460,156 470,56 498,56', class: 'ln ln-dash', 'marker-end': 'url(#c26a)', style: 'stroke:var(--focus);stroke-width:1.6' }));
    er.appendChild(svgText(470, 196, "ST → CD(GRP='RSV_ST')", 't-sm', 'middle'));
    body.appendChild(fig(er, '만든 회사는 문을 닫았고 문서는 없습니다. 남은 것은 DB와 회계팀이 매달 직접 사용 내역을 뽑던 질의 하나예요. 가장 흔한 암묵 구조는 외래 키입니다(Hainaut 외 1996, 원고는 서지와 요약으로 확인).', '그림 26-1'));
    body.appendChild(table(['암묵 구조', '「틈」 옛 DB', '찾는 법'], [['선언 안 된 외래 키', '`RSV.MEM_CD` → `MEM.MEM_CD`', '이름이 같은 열을 찾고 포함 종속을 검사(24장)'], ['코드 표 하나에 여러 묶음', '`CD`에 예약 상태와 회원 구분이 함께', '`SELECT DISTINCT GRP FROM CD`로 묶음을 셈'], ['코드값의 뜻', '`ST`의 1~4', '코드 표와 질의를 맞춰 봄. 회계 질의가 3·4를 고름'], ['코드에 박은 뜻', '`MEM_CD` 첫 글자 N·S가 일반·상주', '첫 글자별로 다른 열과 맞는지 셈'], ['여러 용도의 칸', '`ETC`에 손님 이름, 취소 사유, "BLOCK"', "값의 패턴을 셈(`LIKE '손님:%'` 등)"], ['논리 삭제', "`DEL_YN = 'Y'`인 회원", '이 열로 거르는 질의가 있는지 확인'], ['형식에 숨은 뜻', '`YMD` 여덟 글자, `FR`·`TO_` 네 글자', '값이 모두 그 꼴인지 셈. 시간대 없음 → 한국 시간으로 추정(관찰)']]));

    body.appendChild(H4('질의 한 줄에서 실제 계약 복원하기'));
    var parts = [['SELECT ', null], ['MEM_CD, YMD, FR, TO_', 'names'], [' FROM ', null], ['RSV', 'names'], [' WHERE ', null], ["ST IN ('3','4')", 'codes'], [' AND ', null], ["YMD LIKE ? || '%'", 'shape']];
    var items = [['names', '표와 열 이름', 'RSV, MEM_CD, YMD, FR, TO_, ST', '이름을 바꾸면 질의가 실패'], ['shape', '값의 꼴', "YMD는 'YYYYMMDD'(월 앞부분 LIKE로 거름) · FR·TO_는 'HHMM'", ''], ['codes', '코드값의 뜻과 고르는 범위', "ST '3' = 이용, '4' = 노쇼 · ST가 3·4인 행만 = 청구 대상", '코드를 바꾸면 조용히 틀린 답']];
    var q = h('div', { class: 'memo mono', style: 'font-size:13.5px' });
    parts.forEach(function (p) { q.appendChild(p[1] ? h('span', { 'data-p': p[1], style: 'padding:1px 2px;border-radius:2px' }, p[0]) : document.createTextNode(p[0])); });
    var il = h('div', { style: 'display:grid;gap:6px;margin-top:8px' });
    items.forEach(function (it) {
      var b = h('button', { type: 'button', class: 'pair', style: 'cursor:pointer' }, [h('div', { class: 'a', style: 'font-size:14px' }, it[1]), h('div', { class: 'small', html: md(it[2]) }), it[3] ? h('div', { class: 'small muted' }, it[3]) : null]);
      function on() { $$('[data-p]', q).forEach(function (sp) { var hit = sp.getAttribute('data-p') === it[0]; sp.style.background = hit ? 'var(--warn-t)' : ''; sp.style.outline = hit ? '1.5px solid var(--warn)' : ''; }); $$('.pair', il).forEach(function (x) { x.style.borderColor = ''; }); b.style.borderColor = 'var(--warn)'; }
      b.addEventListener('click', on); b.addEventListener('mouseenter', on); b.addEventListener('focus', on);
      il.appendChild(b);
    });
    add(body, [P('회계팀 월말 질의(매달 1회). 아래 항목을 가리키면 질의의 어느 부분에서 나왔는지 켜집니다.', 'small'), q, il]);
    setTimeout(function () { var f = il.querySelector('.pair:nth-child(3)'); if (f) f.click(); }, 0);
    body.appendChild(note('<b>q15</b> 회계 질의는 이용(3)과 노쇼(4)만 고르고 취소(2)는 고르지 않습니다. 그런데 7장 콘셉트 메모의 r4는 "1시간 전보다 늦은 취소는 쓴 걸로 친다"입니다. 늦은 취소는 옛 DB에서 ST를 무엇으로 적었나요? 취소(2)였다면 회계는 늦은 취소를 청구하지 않은 것이고, 매니저 진술과 실제 청구가 다릅니다. 질의 기록은 진술을 반증할 수도 있는 **관찰**입니다.', 'c L-con'));

    body.appendChild(H4('코드에 박은 뜻의 딜레마'));
    body.appendChild(h('div', { class: 'two' }, [note('<b>코드를 바꾸면</b> (김하나 N001 → S00?)<br>RSV의 옛 예약 MEM_CD를 모두 고쳐야 함. 회계팀 자료의 N001과 이어지지 않음'), note('<b>코드를 안 바꾸면</b><br>"첫 글자 = 등급"이 더는 참이 아님. 첫 글자로 등급을 읽던 질의가 틀린 답을 냄')]));
    body.appendChild(P('그 값이 바뀌는 날 둘 중 하나를 포기해야 합니다. 그래서 2a 단계에서 뜻을 코드에서 떼어 별도 사실 유형(F2 회원은 등급에 속한다)으로 옮기고, 코드는 그냥 이름표로 둡니다(참조 방식은 시간이 지나도 바뀌지 않아야 한다).', 'small'));

    body.appendChild(H4('데이터 독립성을 거꾸로 쓰기 — 호환 뷰와 진화 5단계'));
    body.appendChild(table(['옛 RSV의 열', '새 구조에서 만드는 식'], [['RSV_NO', '`b.legacy_no`'], ['MEM_CD', '`m.legacy_code`'], ['ROOM', '`r.legacy_room`'], ['YMD', "`to_char(b.starts_at, 'YYYYMMDD')`"], ['FR', "`to_char(b.starts_at, 'HH24MI')`"], ['TO_', "`to_char(b.ends_at, 'HH24MI')`"], ['ST', "confirmed→'1' · cancelled→'2' · used→'3' · 그 밖→'4'"], ['ETC', '`NULL`']]));
    body.appendChild(h('ol', { style: 'list-style:none;padding:0;margin:12px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px' }, [['호환 뷰로 옮김', '회계 프로그램은 바뀐 것을 모름'], ['계약을 선언', '지금까지의 실제 계약을 문서로'], ['새 계약을 제안', 'E3 이용 확정 이벤트 같은 정식 경계'], ['병행', '호환 뷰와 새 이벤트를 함께'], ['사용 측정과 제거', '새 경계로 옮긴 것을 확인한 뒤 호환 뷰 제거']].map(function (x, i) { return h('li', { class: 'panel', style: 'box-shadow:none;padding:10px 12px' }, [h('div', { class: 'mono small', style: 'color:var(--ink-3)' }, String(i + 1)), h('b', null, x[0]), h('div', { class: 'small muted' }, x[1])]); })));
    body.appendChild(P('호환 뷰는 끝이 아니라 시작입니다. 같은 열을 내준다고 같은 결과가 나오는 것도 아니에요. 값의 꼴(앞의 0, 공백, 빈 문자열과 NULL의 차이)까지 같아야 합니다. 질의 기록에 나오지 않는다고 아무도 안 쓰는 것도 아니니 기록 기간을 적고 "1년에 한 번 쓰는 것이 있나요?"를 묻습니다. (호환 뷰 SQL은 PostgreSQL 문법이고 이 장에서는 실행하지 않았습니다. P14 풀이의 호환 뷰는 SQLite로 열 개 날짜 모두 옛 DB와 같은 결과를 냈습니다.)', 'small muted'));
  });

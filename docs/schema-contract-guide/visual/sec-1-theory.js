  /* ===== 제1부 이론 (1~6장) ===== */

  // ---------- 1장 ----------
  RENDER.push(function renderC01() {
    var body = section('c01'); if (!body) return;
    // 글자 위치로 읽는 파일
    var fields = [['회의실', 'R1'], ['회원번호', '0007'], ['날짜', '20261117'], ['시작', '1000'], ['끝', '1130']];
    var progs = [
      { name: '회원 앱', from: 3, to: 6, want: [1], view: 'V1 내 예약' },
      { name: '데스크 출력', from: 7, to: 14, want: [2], view: 'V2 오늘 일정표' },
      { name: '청구', from: 15, to: 22, want: [3, 4], view: 'V3 청구' }
    ];
    var holder = h('div');
    var say = h('div', { 'aria-live': 'polite' });
    function draw(mode) {
      var fs = fields.map(function (f, i) { return [f[0], i === 1 && mode !== 'before' ? 'G1-0007' : f[1]]; });
      var line = fs.map(function (f) { return f[1]; }).join('');
      var pos = [], p = 1;
      fs.forEach(function (f) { pos.push([p, p + f[1].length - 1]); p += f[1].length; });
      var CW = 26, X0 = 14, W = X0 * 2 + 25 * CW, svg = svgBox(W, 214, mode === 'before' ? '22글자 한 줄을 세 프로그램이 글자 위치로 나눠 읽는다' : '회원번호가 일곱 글자가 되자 같은 위치를 읽는 프로그램이 모두 엉뚱한 값을 읽는다', 'minw-640');
      fs.forEach(function (f, i) {
        var a = pos[i][0], b = pos[i][1], x = X0 + (a - 1) * CW, w = (b - a + 1) * CW;
        svg.appendChild(s('rect', { x: x, y: 26, width: w, height: 40, class: i % 2 ? 'box-s' : 'box', style: i === 1 && mode !== 'before' ? 'stroke:var(--focus);stroke-width:2' : null }));
        svg.appendChild(svgText(x + w / 2, 18, f[0] + ' ' + a + '-' + b, 't-sm t-mut', 'middle'));
      });
      line.split('').forEach(function (ch, i) {
        svg.appendChild(svgText(X0 + i * CW + CW / 2, 52, ch, 't-mono', 'middle'));
        svg.appendChild(svgText(X0 + i * CW + CW / 2, 82, String(i + 1), 't-sm t-sub', 'middle'));
      });
      var lines = [];
      progs.forEach(function (pg, k) {
        var x = X0 + (pg.from - 1) * CW, w = (pg.to - pg.from + 1) * CW, y = 96;
        var want = pg.want.map(function (j) { return fs[j][1]; }).join('');
        var got, ok;
        if (mode === 'layered') { got = want; ok = true; }
        else { got = line.substring(pg.from - 1, pg.to); ok = got === want; }
        if (mode !== 'layered') svg.appendChild(s('path', { d: 'M' + (x + 2) + ',' + y + ' v8 h' + (w - 4) + ' v-8', class: 'ln' }));
        var cx = mode === 'layered' ? 120 + k * 230 : x + w / 2;
        svg.appendChild(svgText(cx, 128, pg.name + (mode === 'layered' ? ' → ' + pg.view : ''), 't-sm t-b', 'middle'));
        svg.appendChild(s('text', { x: cx, y: 150, 'text-anchor': 'middle', class: 't-mono', style: 'fill:' + (ok ? 'var(--ok)' : 'var(--bad)') }, '"' + got + '"'));
        svg.appendChild(s('text', { x: cx, y: 170, 'text-anchor': 'middle', class: 't-sm', style: 'fill:' + (ok ? 'var(--ok)' : 'var(--bad)') }, ok ? '원하던 값' : '원하던 값 "' + want + '"과 다름'));
        lines.push([pg.name, mode === 'layered' ? pg.view : pg.from + '-' + pg.to + '번째 글자', got, ok]);
      });
      if (mode === 'layered') svg.appendChild(svgText(W / 2, 200, '프로그램은 외부 스키마로 읽고, 새 위치는 개념-내부 사상이 압니다', 't-sm t-mut', 'middle'));
      else svg.appendChild(svgText(W / 2, 200, '파일 한 줄 ' + line.length + '글자', 't-sm t-mut', 'middle'));
      clear(holder); holder.appendChild(fig(svg, mode === 'before' ? '세 프로그램이 같은 파일을 **글자 위치**로 읽습니다. 청구 프로그램은 회원번호를 쓰지 않지만, 기대는 것은 저장 형식 전체입니다.' : mode === 'after' ? '지점이 늘어 회원번호가 `G1-0007`(일곱 글자)이 되었습니다. 위치는 그대로 읽으니 세 프로그램이 모두 엉뚱한 글자를 읽습니다. 이 그림은 글자를 실제로 잘라 보여 줍니다.' : '층을 나누면 프로그램은 각자의 외부 스키마로 읽습니다. 저장 형식이 바뀌어도 **사상을 고쳐서 위층을 지킵니다**.', '그림 1-1'));
      clear(say);
    }
    add(body, [seg([{ label: '처음 파일', key: 'before' }, { label: '회원번호를 G1-0007로', key: 'after' }, { label: '세 층으로 나누면', key: 'layered' }], draw, { lbl: '바꿔 보기', start: 0 }), holder, say]);

    // 두 독립성
    body.appendChild(H4('데이터 독립성 두 가지'));
    body.appendChild(table(['이름', '무엇이 바뀌어도', '무엇이 그대로인가', '바꾸는 곳'], [
      [tag('int', '물리적 데이터 독립성'), '내부 스키마(저장 구조·인덱스)', '개념 스키마와 외부 스키마', '개념-내부 사상'],
      [tag('con', '논리적 데이터 독립성'), '개념 스키마(사실 유형을 더하거나 다시 나눔)', '외부 스키마와 그 위의 프로그램', '외부-개념 사상']
    ]));

    // 사상이 흡수하지 못하는 변경
    body.appendChild(H4('어떤 변경을 사상으로 숨길 수 있을까'));
    var changes = [
      { t: '예약 표에 인덱스 추가', at: ['int'], hid: 'yes', ans: '예. 외부·개념 모두 그대로', note: '빨라진 효과는 구조가 아니라 품질의 변화입니다.' },
      { t: '예약을 두 표로 나눔(예약 + 예약 회차)', at: ['int', 'ec'], hid: 'yes', ans: '예. 뷰 정의만 바꿈', note: '`CREATE OR REPLACE VIEW desk_today` — 바뀐 것은 뷰 정의, 곧 외부-개념 사상뿐입니다. 데스크가 보는 열은 같습니다.' },
      { t: '회원번호를 4자리에서 7자리로', at: ['int'], hid: 'part', ans: '대개 예. 외부에 회원번호를 보이면 아니오', note: '회원번호가 외부 스키마에 나가 있으면 모양이 바뀝니다.' },
      { t: '"이용 인원" 사실을 개념에서 지움', at: ['con'], hid: 'no', cat: '정보가 사라짐', ans: '아니오. 그것을 보던 외부 스키마는 원천이 없어짐', note: '' },
      { t: '"끝 시각"의 뜻을 포함에서 불포함으로', at: ['con'], hid: 'no', cat: '뜻이 바뀜', ans: '아니오. 값은 같아도 뜻이 바뀜', note: '' },
      { t: '조회가 0.1초에서 3초로 느려짐', at: ['int'], hid: 'part', cat: '품질이 바뀜', ans: '구조는 숨겨지지만 이용자는 느낌', note: '' }
    ];
    var stackHolder = h('div');
    var stack = [['ext', '외부 스키마'], ['ec', '외부-개념 사상'], ['con', '개념 스키마'], ['ci', '개념-내부 사상'], ['int', '내부 스키마']];
    function drawStack(c) {
      var svg = svgBox(300, 236, '변경이 닿는 층');
      stack.forEach(function (st, i) {
        var y = 8 + i * 44, isMap = st[0] === 'ec' || st[0] === 'ci';
        var layer = st[0] === 'ec' ? 'ext' : st[0] === 'ci' ? 'int' : st[0];
        var hit = c.at.indexOf(st[0]) >= 0;
        var g = s('g', { class: 'L-' + layer });
        g.appendChild(s('rect', { x: isMap ? 40 : 10, y: y, width: isMap ? 220 : 280, height: isMap ? 30 : 36, rx: isMap ? 15 : 3, class: hit ? 'fill-c' : (isMap ? 'box-s' : 'box-c'), style: hit ? null : 'opacity:.55' }));
        g.appendChild(s('text', { x: 150, y: y + (isMap ? 20 : 23), 'text-anchor': 'middle', class: 't-sm t-b', style: hit ? 'fill:var(--paper)' : null }, st[1] + (hit ? ' ← 바뀜' : '')));
        svg.appendChild(g);
      });
      return svg;
    }
    var detail = h('div', { 'aria-live': 'polite' });
    var rows = changes.map(function (c) { return [c.t, h('span', { class: 'pill ' + (c.hid === 'yes' ? 'ok' : c.hid === 'no' ? 'bad' : 'warn') }, c.hid === 'yes' ? '숨길 수 있음' : c.hid === 'no' ? '숨길 수 없음' : '일부만'), c.cat || '']; });
    var tbl = table(['변경', '사상으로 숨길 수 있는가', '숨길 수 없는 까닭'], rows, { onRow: function (r, i, tr) {
      $$('tr', tbl).forEach(function (x) { x.classList.remove('hl'); }); tr.classList.add('hl');
      clear(stackHolder); stackHolder.appendChild(drawStack(changes[i]));
      clear(detail); add(detail, [P('**' + changes[i].ans + '**'), changes[i].note ? P(changes[i].note, 'small muted') : null]);
    } });
    add(body, [h('div', { class: 'two' }, [tbl, h('div', { class: 'panel side' }, [stackHolder, detail])])]);
    body.appendChild(P('숨길 수 없는 변경은 **정보가 사라짐 · 뜻이 바뀜 · 품질이 바뀜** 셋으로 묶입니다. 이 셋이 5장에서 계약을 따로 두는 이유입니다. 사상은 구조를 숨기고, 계약은 뜻·품질·변경 절차를 약속합니다.', 'prose'));
    setTimeout(function () { var first = $('tbody tr', tbl); if (first) first.click(); }, 0);

    var _b = body; body = foldInto(_b, '연표 1970~1987');
    // 연표
    var ev = [[1970, 'Codd', '관계 모델, 데이터 독립성을 목표로'], [1971, 'CODASYL DBTG', '스키마 / 하위 스키마'], [1975, 'ANSI/SPARC 중간 보고서', '외부 · 개념 · 내부 세 층'], [1977, 'Tsichritzis·Klug', '최종 보고서'], [1979, 'Clemons', '하위 스키마 비판, 가상 데이터베이스'], [1987, 'ISO/TR 9007', '개념 스키마와 정보 베이스의 개념·용어']];
    body.appendChild(table(['연도', '누가', '무엇'], ev.map(function (e) { return [h('b', { class: 'mono' }, String(e[0])), e[1], e[2]]; })));
    body.appendChild(P('원고는 1975·1977 보고서 원문을 직접 보지 못했고, 1985년 후속 보고서(NBS IR 85-3173)와 ISO/TR 9007(1987)에서 정의를 옮겼다고 밝힙니다.', 'small muted'));
    body = _b;
  });

  // ---------- 2장 ----------
  RENDER.push(function renderC02() {
    var body = section('c02'); if (!body) return;
    body.appendChild(H4('넣을까 뺄까 — 두 원칙으로 가르기'));
    var items = [
      ['같은 회의실의 확정 예약은 시간이 겹치지 않는다', 'in', '담화 세계의 규칙', '100% 원칙'],
      ['예약 길이는 4시간을 넘지 않는다', 'in', '담화 세계의 규칙', '100% 원칙'],
      ['시작 시각은 `2026-11-17T10:00:00+09:00` 꼴의 문자열이다', 'out', '외부 표현', '개념화 원칙'],
      ['앱 응답의 필드 이름은 `startAt` 이다', 'out', '메시지 형식', '개념화 원칙'],
      ['예약 표에 회의실 코드 인덱스를 둔다', 'out', '물리적 접근', '개념화 원칙'],
      ['회원번호는 `M` 다음 숫자 두 자리다', 'dep', '회원이 이 번호를 실제로 쓰면 담화 세계의 식별 방식, 시스템만 쓰면 내부 표현. 가르는 기준은 "담화 세계의 누가 그것을 쓰는가"', '']
    ];
    var list = h('div', { class: 'qgrid' });
    items.forEach(function (it) {
      var res = h('div', { class: 'res', 'aria-live': 'polite' });
      var row = h('div', { class: 'qcard' }, [
        h('div', { class: 'q', html: md(it[0]) }),
        seg([{ label: '넣음', key: 'in' }, { label: '뺌', key: 'out' }, { label: '경우에 따라', key: 'dep' }], function (k) {
          var ok = k === it[1];
          clear(res); add(res, [h('span', { class: 'pill ' + (ok ? 'ok' : 'bad') }, ok ? '맞음' : '풀이와 다름'), ' ', h('b', null, { in: '넣음', out: '뺌', dep: '경우에 따라' }[it[1]]), ' · ', h('span', { html: md(it[2]) }), it[3] ? h('span', { class: 'muted' }, ' (' + it[3] + ')') : null]);
        }),
        res
      ]);
      list.appendChild(row);
    });
    body.appendChild(list);
    body.appendChild(P('**100% 원칙**: 관련 있는 일반 규칙은 정적이든 동적이든 모두 개념 스키마에 적습니다. 응용 프로그램에만 적힌 규칙은 정보 시스템이 책임지지 않습니다. **개념화 원칙**: 데이터 표현, 물리 조직, 메시지 형식은 뺍니다. 두 원칙 모두 ISO/TR 9007에서 왔습니다.', 'prose small muted'));

    // 담화 세계 경계
    body.appendChild(H4('담화 세계는 고르는 것입니다'));
    body.appendChild(h('div', { class: 'two' }, [
      h('div', { class: 'panel c L-con' }, [h('h5', null, '담화 세계에 넣음'), h('ul', { class: 'small', style: 'margin:0;padding-left:1.2em' }, ['회원, 회원 등급', '회의실, 수용 인원', '예약, 예약 시간, 예약 상태', '월 무료 시간, 초과 요금'].map(function (x) { return h('li', null, x); }))]),
      h('div', { class: 'panel', style: 'border-style:dashed;box-shadow:none' }, [h('h5', null, '넣지 않음'), h('ul', { class: 'small muted', style: 'margin:0;padding-left:1.2em' }, ['출입 카드와 출입 기록', '전기 요금, 청소 일정', '회원의 회사 정보', '실제 결제와 환불(회계 쪽)'].map(function (x) { return h('li', null, x); }))])
    ]));

    // 일반 규칙과 지금의 사실
    body.appendChild(H4('개념 스키마(일반 규칙)와 정보 베이스(지금의 사실)'));
    var rules = ['회원은 회원번호로 식별된다', '회원마다 이름은 하나다', '회의실은 코드로 식별된다', '같은 회의실의 확정 예약은 겹치지 않는다', '예약 상태는 확정 → 취소·이용완료·노쇼'];
    var facts = ['회원 M07 의 이름은 "김하나"', '회원 M12 의 이름은 "박도윤"', '회의실 R1 의 수용 인원은 6', '예약 B101: M07, R1, 10:00-11:30, 확정', '예약 B102: M12, R1, 11:30-12:00, 확정'];
    var lcol = h('div', { class: 'panel c L-con', style: 'box-shadow:none' }, [h('div', { class: 'eyebrow' }, '개념 스키마 · 일반 규칙')].concat(rules.map(function (r, i) { return h('div', { class: 'small', 'data-i': i, style: 'padding:4px 6px;border-radius:3px' }, r); })));
    var rcol = h('div', { class: 'panel', style: 'box-shadow:none' }, [h('div', { class: 'eyebrow' }, '정보 베이스 · 지금의 사실')].concat(facts.map(function (r, i) { return h('div', { class: 'small mono', 'data-i': i, style: 'padding:4px 6px;border-radius:3px' }, r); })));
    var out = h('div', { class: 'small', 'aria-live': 'polite', style: 'margin-top:8px' });
    var tryBtn = h('button', { type: 'button', class: 'btn' }, '예약 B103 (M12, R1, 11:00부터 1시간, 확정) 넣어 보기');
    tryBtn.addEventListener('click', function () {
      var on = tryBtn.getAttribute('aria-pressed') === 'true';
      tryBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
      $$('[data-i]', lcol).forEach(function (e) { e.style.background = !on && e.getAttribute('data-i') === '3' ? 'var(--bad-t)' : ''; });
      $$('[data-i]', rcol).forEach(function (e) { e.style.background = !on && e.getAttribute('data-i') === '3' ? 'var(--bad-t)' : ''; });
      clear(out);
      if (!on) add(out, [h('span', { class: 'pill bad' }, '허락되지 않음'), ' 왼쪽 넷째 규칙이 오른쪽 B101(10:00-11:30)과 맞부딪힙니다. 규칙은 하나지만 사실은 계속 바뀝니다.']);
    });
    add(body, [h('div', { class: 'two' }, [lcol, rcol]), h('div', { class: 'controls' }, tryBtn), out]);

    // 글자 표기 개념 스키마
    var _b = body; body = foldInto(_b, '「틈」의 개념 스키마 (2장 판) · 줄을 누르면 부품 이름');
    var kinds = { 개체: 'con', 값: 'none', 사실: 'con', 제약: 'con', 파생: 'con' };
    var lines = [
      ['개체', '회원 · 참조: 회원번호 (예: M07)'], ['개체', '회의실 · 참조: 회의실 코드 (예: R1)'], ['개체', '예약 · 참조: 예약번호 (예: B101)'],
      ['값', '이름, 등급{일반, 상주}, 시각, 분, 원, 상태{확정, 취소, 이용완료, 노쇼}'],
      ['사실', 'F1 회원 은 이름 을 가진다'], ['사실', 'F2 회원 은 등급 에 속한다'], ['사실', 'F3 회의실 은 수용 인원 을 가진다'], ['사실', 'F4 예약 은 회원 이 한 것이다'], ['사실', 'F5 예약 은 회의실 을 잡는다'], ['사실', 'F6 예약 은 시작 시각 과 끝 시각 을 가진다'], ['사실', 'F7 예약 은 상태 에 있다'], ['사실', 'F8 등급 은 월 무료 분 을 가진다'],
      ['제약', 'R1 F1·F2·F4·F5·F6·F7: 각 개체마다 정확히 하나 (유일 + 필수)', '정적'], ['제약', 'R2 F6: 끝 > 시작, 둘 다 30분 단위, 길이 ≤ 240분', '정적'], ['제약', 'R3 확정 상태인 두 예약이 같은 회의실을 잡으면 시간 구간이 겹치지 않는다', '정적'], ['제약', 'R4 상태 전이는 확정 → 취소 | 이용완료 | 노쇼 만 허용', '동적'], ['제약', 'R5 시작 1시간 전보다 늦게 한 취소는 이용한 것으로 셈한다', '동적'],
      ['파생', 'D1 회원의 월 사용 분 = 그 달 이용완료·노쇼 예약과 R5에 걸린 취소 예약의 길이 합'], ['파생', 'D2 초과 분 = max(0, 월 사용 분 - 등급의 월 무료 분)']
    ];
    var parts = { 개체: '따로 알아볼 수 있는 사물의 종류. ER의 개체 집합에 가깝습니다.', 값: '그 자체로 뜻이 정해진 값의 종류(값 유형).', 사실: '개체·값에 관해 말할 수 있는 문장의 틀(사실 유형). ER의 속성·관계에 가깝습니다.', 제약: '사실들이 지켜야 하는 규칙. 정적 규칙은 한 순간의 상태를, 동적 규칙은 상태가 바뀌는 방식을 말합니다.', 파생: '다른 사실에서 계산되는 사실(파생 규칙).' };
    var pinfo = h('div', { class: 'panel side', 'aria-live': 'polite' }, P('왼쪽 줄을 누르면 그 줄이 어떤 부품인지 보입니다.', 'small muted'));
    var sch = h('div', { class: 'memo mono', style: 'font-size:13px;line-height:1.8' });
    lines.forEach(function (ln) {
      var row = h('div', { class: 'seg L-' + kinds[ln[0]], tabindex: 0, style: 'display:block;border-bottom-width:0' }, [h('span', { style: 'color:var(--ink-3);display:inline-block;width:3.2em' }, '[' + ln[0] + ']'), ln[1], ln[2] ? h('span', { class: 'tag', style: 'margin-left:8px' }, ln[2] + ' 규칙') : null]);
      function pick() { $$('.seg', sch).forEach(function (x) { x.classList.remove('on'); }); row.classList.add('on'); clear(pinfo); add(pinfo, [h('h5', null, ln[0] + (ln[2] ? ' · ' + ln[2] + ' 규칙' : '')), P(parts[ln[0]])]); }
      row.addEventListener('click', pick); row.addEventListener('keydown', function (e) { if (e.key === 'Enter') pick(); });
      sch.appendChild(row);
    });
    add(body, [h('div', { class: 'two' }, [sch, pinfo])]);
    body.appendChild(P('예약번호가 필요한 까닭: 청구에 취소 기록이 필요해 취소된 예약을 지울 수 없습니다. 그래서 (회의실, 시작)으로는 예약 하나를 가리킬 수 없어요. 8장 결과 판에서는 F9(취소 시각)와 R6이 더해집니다.', 'prose small muted'));
    body = _b;
  });

  // ---------- 3장 ----------
  RENDER.push(function renderC03() {
    var body = section('c03'); if (!body) return;
    body.appendChild(H4('개념 사실에서 V2 「오늘 일정표」로 — 열마다 ← 달기'));
    var F = { F1: '회원 은 이름 을 가진다', F3: '회의실 은 수용 인원 을 가진다', F4: '예약 은 회원 이 한 것이다', F5: '예약 은 회의실 을 잡는다', F6: '예약 은 시작·끝 을 가진다', F7: '예약 은 상태 에 있다' };
    var cols = [['회의실', ['F5'], 'F5'], ['시작', ['F6'], 'F6'], ['끝', ['F6'], 'F6'], ['예약자', ['F4', 'F1'], 'F4 → F1'], ['정원', ['F5', 'F3'], 'F5 → F3']];
    var rowsV2 = [['R1', '10:00', '11:30', '김하나', '6'], ['R1', '11:30', '12:00', '박도윤', '6'], ['R2', '14:00', '16:00', '김하나', '4']];
    var fl = h('div', { class: 'panel c L-con', style: 'box-shadow:none' }, [h('div', { class: 'eyebrow' }, '개념 스키마의 사실')].concat(Object.keys(F).map(function (k) { return h('div', { class: 'small', 'data-f': k, style: 'padding:4px 6px;border-radius:3px' }, [h('b', { class: 'mono' }, k + ' '), F[k]]); })));
    var why = h('p', { class: 'small', 'aria-live': 'polite' });
    var thead = h('tr', null, cols.map(function (c) {
      var th = h('th', { tabindex: 0, style: 'cursor:pointer' }, c[0]);
      function on() { $$('[data-f]', fl).forEach(function (e) { e.style.background = c[1].indexOf(e.getAttribute('data-f')) >= 0 ? 'var(--con-t)' : ''; e.style.boxShadow = c[1].indexOf(e.getAttribute('data-f')) >= 0 ? 'inset 3px 0 0 var(--con)' : ''; }); $$('th', thead).forEach(function (t) { t.style.background = ''; }); th.style.background = 'var(--ext-t)'; why.innerHTML = md('**' + c[0] + ' ← ' + c[2] + '** · ' + (c[1].length > 1 ? c[1][0] + '로 상대를 찾고 ' + c[1][1] + '에서 값을 가져옵니다.' : c[1][0] + '에서 바로 옵니다.')); }
      th.addEventListener('mouseenter', on); th.addEventListener('focus', on); th.addEventListener('click', on);
      return th;
    }));
    var vt = h('div', { class: 'tbl-wrap L-ext', style: 'border-color:var(--ext)' }, h('table', null, [h('thead', null, thead), h('tbody', null, rowsV2.map(function (r) { return h('tr', null, r.map(function (c) { return h('td', null, c); })); }))]));
    add(body, [h('div', { class: 'two' }, [fl, h('div', null, [h('div', { class: 'eyebrow', style: 'margin-bottom:6px' }, '외부 스키마 V2 · 안내 데스크 · 열 머리를 가리켜 보세요'), vt, P('고르기: 확정만(F7), 오늘만(F6) · 순서: 회의실, 시작 · 가림: 회원번호와 등급은 보이지 않음 · 갱신: 읽기 전용', 'small muted'), why])])]);
    body.appendChild(P('모든 열에 화살표를 달 수 있어야 하고, 달 수 없는 열은 개념 스키마에 사실이 빠졌다는 신호입니다. 이 표기는 13장 추적표에서 다시 씁니다.', 'prose small'));

    // 다섯 항목
    var _b = body; body = foldInto(_b, '외부 스키마의 다섯 항목 (V2 · V3)');
    var five = {
      V2: [['이용자', '안내 데스크 직원. 손님에게 방을 안내'], ['내용', 'F1, F3, F4, F5, F6, F7'], ['모양', '한 행 = 예약 하나. 시각은 `HH:MM`. 회의실·시작 순'], ['파생 규칙', '확정이고 시작 날짜가 오늘인 예약을 고르고, 회원 이름과 회의실 정원을 붙임'], ['갱신 의미', '읽기 전용']],
      V3: [['이용자', '청구 담당자'], ['내용', '회원 이름 ← F1 · 등급 ← F2 · 사용 분 ← D1 · 무료 분 ← F2 → F8 · 초과 분 ← D2'], ['모양', '행 = 해당 월에 사용 분이 있는 회원 한 명. 순서는 회원 이름'], ['파생 규칙', '고르기 D1 > 0, 월 = 청구 대상 월. 가림 없음(청구 담당자는 모든 회원을 봄)'], ['갱신 의미', '읽기 전용. 초과 분을 0으로 만드는 번역이 여럿이라 쓰기를 받기 어렵습니다. 필요하면 "청구 조정" 사실과 연산을 따로 둡니다']]
    };
    var fiveHolder = h('div');
    add(body, [seg([{ label: 'V2 오늘 일정표', key: 'V2' }, { label: 'V3 월 청구 명세', key: 'V3' }], function (k) { clear(fiveHolder); fiveHolder.appendChild(table(['항목', k], five[k])); }, { start: 0 }), fiveHolder]);
    body.appendChild(h('div', { class: 'controls', style: 'margin-top:10px' }, [h('span', { class: 'lbl' }, '파생 규칙에 쓰는 연산')].concat(['고르기', '뽑기(투영)', '잇기', '계산', '이름 바꾸기', '모양 바꾸기', '가리기'].map(function (x) { return h('span', { class: 'tag L-ext' }, x); }))));
    body = _b;

    // 뷰 갱신 문제
    body.appendChild(H4('쓰기를 받으면 무슨 일이 생기나 — 뷰 갱신 문제'));
    var vh = h('div');
    var demos = {
      V1: function () {
        var svg = svgBox(640, 190, 'V1과 보완 뷰를 합치면 데이터베이스를 되찾을 수 있어 번역이 하나로 정해진다', 'minw-560');
        [['V1 내 예약 (M07)', 'B101 R1 10:00-11:30', 20, 'ext'], ['보완 뷰 (M07 아닌 회원)', 'B102 M12 · B105 M31 …', 330, 'none']].forEach(function (b) {
          var g = s('g', { class: 'L-' + b[3] });
          g.appendChild(s('rect', { x: b[2], y: 14, width: 290, height: 64, rx: 4, class: b[3] === 'none' ? 'box-s' : 'box-c' }));
          g.appendChild(svgText(b[2] + 14, 38, b[0], 't-sm t-b'));
          g.appendChild(svgText(b[2] + 14, 62, b[1], 't-mono'));
          svg.appendChild(g);
        });
        svg.appendChild(svgText(320, 104, '고침: V1에서 B101의 끝을 11:00으로 · 보완 뷰는 그대로', 't-sm', 'middle'));
        arrowDefs(svg, 'v1a');
        svg.appendChild(s('line', { x1: 320, y1: 114, x2: 320, y2: 140, class: 'ln', 'marker-end': 'url(#v1a)' }));
        svg.appendChild(s('rect', { x: 150, y: 146, width: 340, height: 34, rx: 4, class: 'box', style: 'stroke:var(--ok)' }));
        svg.appendChild(svgText(320, 168, '번역이 하나로 정해짐: 예약 B101의 끝 = 11:00', 't-sm t-b', 'middle'));
        return fig(svg, 'V1은 고르기만 한 뷰라 **보완 뷰**(원래 뷰와 합치면 DB 전체를 다시 계산할 수 있는 뷰)가 분명합니다. 보완 뷰를 고정한 채 번역할 수 있으면 번역기가 있습니다(Bancilhon·Spyratos 1981). `WITH CHECK OPTION`을 걸면 M07이 자기 예약의 회원을 M12로 바꾸려는 수정은 거부됩니다.', '그림 3-1');
      },
      V4: function () {
        var svg = svgBox(640, 200, 'V4는 회원 열을 뽑아 버려서 행 하나를 넣는 번역이 회원 수만큼 생긴다', 'minw-560');
        svg.appendChild(s('rect', { x: 20, y: 14, width: 230, height: 60, rx: 4, class: 'box-c L-ext' }));
        svg.appendChild(svgText(34, 38, 'V4 회의실 현황에 넣음', 't-sm t-b'));
        svg.appendChild(svgText(34, 60, 'R3 15:00-16:00', 't-mono'));
        arrowDefs(svg, 'v4a');
        ['M07', 'M12', 'M31', '…'].forEach(function (m, i) {
          var y = 14 + i * 46;
          svg.appendChild(s('path', { d: 'M250,44 C300,44 300,' + (y + 18) + ' 340,' + (y + 18), class: 'ln ln-dash', 'marker-end': 'url(#v4a)' }));
          svg.appendChild(s('rect', { x: 344, y: y, width: 270, height: 36, rx: 3, class: 'box-s' }));
          svg.appendChild(svgText(356, y + 23, m === '…' ? '… 회원 수만큼' : '(' + 'abc'.charAt(i) + ') B201: ' + m + ', R3, 15:00-16:00, 확정', 't-sm t-mono'));
        });
        return fig(svg, '`V4 = 뽑기[회의실, 시작, 끝](확정 예약)`. 어느 회원의 예약인지 V4만으로는 정할 수 없습니다. PostgreSQL의 자동 갱신 조건은 만족하지만, 회원이 필수라면 삽입이 실패합니다. DBMS는 번역이 기계적으로 하나인지만 보고, 업무상 맞는지는 보지 않습니다.', '그림 3-2');
      },
      V5: function () {
        var wrap = h('div');
        var data = [['B101', '김하나', '일반', '120', 'M07'], ['B105', '김하나', '일반', '120', 'M07'], ['B110', '박도윤', '상주', '600', 'M12']];
        var t = h('div');
        function paint(changed) {
          clear(t);
          t.appendChild(table(['예약', '회원 이름', '등급', '무료 분'], data.map(function (r) {
            var hit = changed && r[4] === 'M07';
            return [r[0], r[1], hit ? h('b', { style: 'color:var(--bad)' }, '상주') : r[2], hit ? h('b', { style: 'color:var(--bad)' }, '600') : r[3]];
          }), { rowClass: function (r) { return changed && r[4] === 'M07' && r[0] === 'B105' ? 'hl' : null; } }));
        }
        paint(false);
        var msg = h('p', { class: 'small', 'aria-live': 'polite' });
        var b = h('button', { type: 'button', class: 'btn' }, 'B101 줄의 등급을 "상주"로 고치기');
        b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); paint(on); msg.innerHTML = on ? md('번역: 회원 M07(김하나)의 등급을 상주로 → **B105 줄도 상주로 바뀝니다.** 고치지 않은 줄이 바뀌는 부수 효과예요.') : ''; });
        add(wrap, [P('`V5 = 잇기(예약, 회원, 등급)` · 청구 담당자용', 'small muted'), h('div', { class: 'controls' }, b), t, msg]);
        return wrap;
      }
    };
    add(body, [seg([{ label: 'V1 고르기만 — 번역이 하나', key: 'V1' }, { label: 'V4 뽑기 — 번역이 여럿', key: 'V4' }, { label: 'V5 잇기 — 부수 효과', key: 'V5' }], function (k) { clear(vh); vh.appendChild(demos[k]()); }, { start: 0 }), vh]);
    body.appendChild(note('읽는 외부 스키마는 파생 규칙으로 끝나고, 쓰는 외부 스키마는 갱신 의미를 따로 정해야 합니다. CQRS로 읽으면 읽기 모델로는 쓰기를 받지 않고 "예약하기" 같은 **명령**으로 받습니다(이 연결은 가이드의 해석).', 'c L-ext'));

    // OpenAPI 상자
    var _b = body; body = foldInto(_b, 'OpenAPI 문서 한 장에 섞여 있는 것');
    var oa = [['paths: /bookings  POST, GET', 'ctr', '계약(연산)'], ['responses: 201, 409, 422', 'ctr', '계약(실패)'], ['components.schemas.Booking', 'ext', '외부 스키마(모양)'], ['security: bearerAuth', 'ctr', '계약(조건)'], ['info.version: 1.4.0', 'ctr', '계약(진화)']];
    body.appendChild(h('div', { class: 'panel', style: 'box-shadow:none;font-family:var(--mono);font-size:13px;display:grid;gap:4px' }, oa.map(function (o) { return h('div', { class: 'L-' + o[1], style: 'display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:4px 8px;background:var(--t);border-left:3px solid var(--c)' }, [h('span', null, o[0]), h('span', { style: 'color:var(--c);font-family:var(--sans)' }, '← ' + o[2])]); })));
    body.appendChild(P('OpenAPI 문서 전체를 외부 스키마로 보는 것은 지나칩니다. `components.schemas`와 응답 본문만 외부 스키마입니다.', 'small muted'));
    body = _b;
  });

  // ---------- 4장 ----------
  RENDER.push(function renderC04() {
    var body = section('c04'); if (!body) return;
    body.appendChild(H4('개념 하나, 저장 구조 셋'));
    var svg = svgBox(680, 190, '개념 스키마 하나를 세 가지 표 구조로 실현할 수 있다', 'minw-560');
    arrowDefs(svg, 'c4a');
    var top = s('g', { class: 'L-con' });
    top.appendChild(s('rect', { x: 140, y: 8, width: 400, height: 50, rx: 4, class: 'box-c' }));
    top.appendChild(svgText(340, 28, '개념 스키마 (하나)', 't-sm t-b t-c', 'middle'));
    top.appendChild(svgText(340, 48, '예약 은 상태 에 있다 · 확정 → 취소 | 이용완료 | 노쇼', 't-sm', 'middle'));
    svg.appendChild(top);
    [['구조 A', 'booking.status 열 하나', '(현재 상태만)'], ['구조 B', 'booking + booking_event', '(바뀔 때마다 한 줄)'], ['구조 C', '상태별로 표를 나눔', '(confirmed_booking …)']].forEach(function (c, i) {
      var x = 20 + i * 220, g = s('g', { class: 'L-int' });
      svg.appendChild(s('path', { d: 'M340,60 C340,90 ' + (x + 100) + ',86 ' + (x + 100) + ',112', class: 'ln', 'marker-end': 'url(#c4a)' }));
      g.appendChild(s('rect', { x: x, y: 116, width: 200, height: 64, rx: 4, class: 'box-c' }));
      g.appendChild(svgText(x + 100, 138, c[0], 't-sm t-b t-c', 'middle'));
      g.appendChild(svgText(x + 100, 156, c[1], 't-sm t-mono', 'middle'));
      g.appendChild(svgText(x + 100, 172, c[2], 't-sm t-mut', 'middle'));
      svg.appendChild(g);
    });
    body.appendChild(fig(svg, '같은 개념 스키마를 여러 표 구조로 실현할 수 있고 그중 하나를 고르는 일은 구현 선택이라, 이 가이드는 테이블 구조를 **내부 스키마** 쪽에 둡니다. A를 B로 바꿀 때는 아래 셋째 조건(단일)을 특히 봅니다.', '그림 4-1'));

    body.appendChild(H4('사상이 뜻을 지키는 네 조건'));
    body.appendChild(h('div', { class: 'pairs' }, [['1 기록', '모든 기본 사실 유형이 내부 스키마 어딘가에 기록되는가', '정보가 사라짐'], ['2 식별', '개념의 참조 방식이 저장된 키로 옮겨지는가', '같은 대상을 다른 대상으로 착각'], ['3 단일', '같은 사실이 두 곳에 있다면 누가 둘을 맞추는지 정해져 있는가', '두 곳의 값이 어긋남'], ['4 보장', '모든 제약에 그것을 지키는 자리가 있는가', '규칙을 어긴 상태가 그대로 저장됨']].map(function (c) {
      return h('div', { class: 'panel L-int', style: 'box-shadow:none;border-top:3px solid var(--int)' }, [h('h5', null, c[0]), P(c[1], 'small'), P('어기면 · ' + c[2], 'small muted')]);
    })));

    // 배제 제약 시험대
    body.appendChild(H4('겹침 금지 시험대 — `EXCLUDE ... tstzrange(starts_at, ends_at) WITH &&`'));
    var times = []; for (var m = 9 * 60; m <= 13 * 60; m += 15) times.push(m);
    function hm(x) { return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); }
    function sel(id, val) { var e = h('select', { id: id, class: 'search', style: 'max-width:110px;padding:5px 8px;font-size:14px' }); times.forEach(function (t) { e.appendChild(h('option', { value: t, selected: t === val }, hm(t))); }); return e; }
    var sS = sel('c04-start', 690), sE = sel('c04-end', 750);
    var sSt = h('select', { id: 'c04-status', class: 'search', style: 'max-width:110px;padding:5px 8px;font-size:14px' }, [h('option', { value: 'confirmed' }, '확정'), h('option', { value: 'cancelled' }, '취소')]);
    var bound = '[)';
    var existing = [['B101', 600, 690], ['B102', 690, 720]];
    var bench = h('div');
    var verdict = h('div', { 'aria-live': 'polite' });
    function run() {
      var a = +sS.value, b = +sE.value, st = sSt.value, why = [];
      if (!(b > a)) why.push(['R2', 'CHECK (ends_at > starts_at)', '끝이 시작보다 뒤여야 합니다']);
      if (a % 30 || b % 30) why.push(['R2', 'CHECK (... % 1800 = 0)', '30분 경계가 아닙니다']);
      if (b - a > 240) why.push(['R2', "CHECK (ends_at - starts_at <= interval '4 hours')", '4시간을 넘습니다']);
      var clash = [];
      if (st === 'confirmed' && b > a) existing.forEach(function (e) {
        var hit = bound === '[)' ? (a < e[2] && e[1] < b) : (a <= e[2] && e[1] <= b);
        if (hit) clash.push(e[0]);
      });
      if (clash.length) why.push(['R3', 'EXCLUDE ... WHERE (status = \'confirmed\')', clash.join(', ') + '와 구간이 겹칩니다' + (bound === '[]' ? ' (끝을 포함하는 [] 구간으로 비교)' : '')]);
      var svg = svgBox(680, 120, '회의실 R1의 9시부터 13시까지 예약 구간', 'minw-560');
      var X = function (t) { return 40 + (t - 540) * (600 / 240); };
      for (var t = 540; t <= 780; t += 30) { svg.appendChild(s('line', { x1: X(t), y1: 18, x2: X(t), y2: 96, class: 'ln', style: 'stroke:var(--rule);stroke-width:1' })); svg.appendChild(svgText(X(t), 112, hm(t), 't-sm t-sub', 'middle')); }
      existing.forEach(function (e) {
        var g = s('g', { class: 'L-int' });
        g.appendChild(s('rect', { x: X(e[1]), y: 22, width: X(e[2]) - X(e[1]), height: 28, rx: 3, class: 'box-c' }));
        g.appendChild(svgText((X(e[1]) + X(e[2])) / 2, 41, e[0] + ' 확정', 't-sm t-b', 'middle'));
        svg.appendChild(g);
      });
      var okNew = !why.length;
      if (b > a) {
        svg.appendChild(s('rect', { x: X(a), y: 58, width: Math.max(2, X(b) - X(a)), height: 28, rx: 3, style: 'fill:' + (okNew ? 'var(--ok-t)' : 'var(--bad-t)') + ';stroke:' + (okNew ? 'var(--ok)' : 'var(--bad)') + ';stroke-width:1.5' + (st === 'cancelled' ? ';stroke-dasharray:4 3' : '') }));
        svg.appendChild(svgText((X(a) + X(b)) / 2, 77, '새 예약 ' + (st === 'confirmed' ? '확정' : '취소'), 't-sm t-b', 'middle'));
      }
      svg.appendChild(svgText(10, 41, 'R1', 't-sm t-b'));
      clear(bench); bench.appendChild(fig(svg));
      clear(verdict);
      if (okNew) verdict.appendChild(P('**받아들임** · ' + hm(a) + '–' + hm(b) + ' ' + (st === 'confirmed' ? '확정' : '취소') + ' 예약이 모든 제약을 지킵니다.'));
      else verdict.appendChild(table(['규칙', 'DDL', '거부 이유'], why.map(function (w) { return [h('span', { class: 'pill bad' }, w[0]), '`' + w[1] + '`', w[2]]; })));
    }
    [sS, sE, sSt].forEach(function (e) { e.addEventListener('change', run); });
    var bseg = seg([{ label: "'[)' 끝 불포함 (기본)", key: '[)' }, { label: "'[]' 끝 포함", key: '[]' }], function (k) { bound = k; run(); }, { lbl: '구간', start: 0 });
    add(body, [h('div', { class: 'controls' }, [h('label', { class: 'lbl', for: 'c04-start' }, '새 예약 시작'), sS, h('label', { class: 'lbl', for: 'c04-end' }, '끝'), sE, h('label', { class: 'lbl', for: 'c04-status' }, '상태'), sSt]), bseg, bench, verdict]);
    body.appendChild(P('가장 중요한 한 줄은 `tstzrange(starts_at, ends_at) WITH &&`입니다. 기본 구간이 `[시작, 끝)`이라 10:00–11:30 뒤의 11:30–12:00은 겹치지 않습니다. `[]`로 바꾸면 같은 데이터가 위반이 돼요. 1장의 "끝 시각 포함/불포함"이 이 한 줄에 들어 있습니다. 일반 `UNIQUE`로는 R3을 못 지킵니다. 같은 값이 아니라 **겹침**을 막아야 하니까요. (DDL은 PostgreSQL 문법이고 원고 환경에서 실행하지 못했습니다.)', 'prose small'));

    // 비정규화
    var _b = body; body = foldInto(_b, '비정규화가 예약해 두는 어긋남');
    var dn = [['B101', 'M07', '김하나', 'R1', '11-17 10:00'], ['B105', 'M07', '김하나', 'R2', '11-18 14:00'], ['B120', 'M07', '김하나', 'R1', '11-20 09:00']];
    var dh = h('div'), dmsg = h('p', { class: 'small', 'aria-live': 'polite' });
    function dpaint(n) { clear(dh); dh.appendChild(table(['booking_id', 'member_id', 'member_name', 'room_code', 'starts_at'], dn.map(function (r, i) { return [r[0], r[1], i < n ? h('b', { style: 'color:var(--focus)' }, '김하늘') : r[2], r[3], r[4]]; }))); }
    dpaint(0);
    add(body, [seg([{ label: '처음', key: 0 }, { label: '이름을 한 줄만 고침', key: 1 }, { label: '세 줄 모두 고침', key: 3 }], function (k) { dpaint(k); dmsg.innerHTML = k === 1 ? md('같은 회원 M07이 **두 이름**을 가집니다. `member_id → member_name` 함수 종속이 있는데 member_id가 이 표의 키가 아니라서 생기는 **갱신 이상**입니다.') : k === 3 ? md('세 줄을 다 찾아 고쳐야 맞습니다. 비정규화한다면 누가 맞추는지 보장 위치표에 적습니다. 적지 않은 비정규화는 어긋남을 예약해 둔 것과 같아요.') : ''; }, { start: 0 }), dh, dmsg]);
    body = _b;

    var _b = body; body = foldInto(_b, '보장 위치표 (4장 판)');
    body.appendChild(table(['규칙', '지키는 자리', '방법'], [
      ['R1 회원마다 이름 하나, 예약마다 회원·회의실·시각·상태 하나', 'DB', '`NOT NULL`, 열 하나에 값 하나'],
      ['R2 끝 > 시작, 30분 단위, 4시간 이하', 'DB', '`CHECK`'],
      ['R3 확정 예약은 같은 회의실에서 겹치지 않음', 'DB', '배제 제약(`EXCLUDE`)'],
      ['R4 상태 전이는 확정에서만', '응용의 단일 쓰기 경로 + DB 트리거', '전이표 검사'],
      ['R5 시작 1시간 전보다 늦은 취소는 사용으로 셈', '응용', '취소 시각을 기록하고 청구 집계에서 계산'],
      ['D1·D2 월 사용 분·초과 분', '질의', '청구용 뷰']
    ]));
    body.appendChild(P('내부 스키마 = DDL은 아닙니다. "예약 쓰기는 예약 서비스 한 곳에서만"(R4를 지키는 자리)은 DDL에 나타나지 않아요. 인덱스가 규칙을 지키는 것도 아닙니다. 지키는 것은 `UNIQUE`나 `EXCLUDE` 같은 제약이고, 제약이 안에서 인덱스를 쓸 뿐입니다. 작업 부하와 인덱스 결정은 [12장](#c12)에서 함께 봅니다.', 'prose small muted'));
    body = _b;
  });

  // ---------- 5장 ----------
  RENDER.push(function renderC05() {
    var body = section('c05'); if (!body) return;
    body.appendChild(H4('계약의 다섯 겹 — 외부 스키마를 감싸고 셋을 더합니다'));
    var layersC = [
      ['구조', '어떤 모양을 주고받는가', '요청 `{memberId, roomCode, startAt, endAt}`, 응답 `{bookingId, status}`', true],
      ['의미', '각 값이 무엇을 뜻하는가', '`endAt`은 불포함. 시각은 오프셋을 단 ISO 8601. `roomCode`는 회의실 코드표의 값', true],
      ['행위', '사전·사후조건, 불변식, 실패, 멱등성, 순서', 'pre1~pre3, post1~post2, inv1. 실패 응답 셋. 같은 `Idempotency-Key`로 다시 보내면 같은 결과', false],
      ['품질', '얼마나 빠르고, 자주 쓸 수 있고, 신선한가', '응답 0.5초 이내(가정), 이벤트는 확정 뒤 1분 안에 발행(가정)', false],
      ['진화', '어떻게 바뀌고, 바뀌기 전에 무엇을 알리는가', '필드 추가는 예고 없이 가능. 필드 삭제·뜻 변경은 새 주 버전, 90일 전 공지(가정)', false]
    ];
    var svg = svgBox(400, 300, '계약 상자 안에 외부 스키마(구조·의미)가 있고, 행위·품질·진화가 더해진다');
    var lx = h('div', { class: 'panel c L-ctr side', 'aria-live': 'polite' });
    var gs = [];
    var outer = s('g', { class: 'L-ctr' });
    outer.appendChild(s('rect', { x: 6, y: 6, width: 388, height: 288, rx: 6, class: 'box-c', style: 'fill:transparent' }));
    outer.appendChild(svgText(20, 28, '계약', 't-b t-c'));
    svg.appendChild(outer);
    var inner = s('g', { class: 'L-ext' });
    inner.appendChild(s('rect', { x: 20, y: 40, width: 360, height: 108, rx: 4, class: 'box-c', style: 'fill:transparent' }));
    inner.appendChild(svgText(34, 60, '외부 스키마', 't-sm t-b t-c'));
    svg.appendChild(inner);
    layersC.forEach(function (L, i) {
      var y = L[3] ? 68 + i * 38 : 160 + (i - 2) * 44;
      var g = s('g', { class: 'hot ' + (L[3] ? 'L-ext' : 'L-ctr'), tabindex: 0, role: 'button', 'aria-label': L[0] + ' 겹' });
      g.appendChild(s('rect', { x: L[3] ? 34 : 20, y: y, width: L[3] ? 332 : 360, height: L[3] ? 32 : 36, rx: 3, class: 'box-c' }));
      g.appendChild(svgText(L[3] ? 48 : 34, y + (L[3] ? 21 : 23), L[0], 't-b'));
      g.appendChild(svgText(L[3] ? 100 : 86, y + (L[3] ? 21 : 23), L[1], 't-sm t-mut'));
      function pick() { gs.forEach(function (x) { x.classList.remove('on'); }); g.classList.add('on'); clear(lx); lx.className = 'panel c side fade-in ' + (L[3] ? 'L-ext' : 'L-ctr'); add(lx, [h('div', { class: 'eyebrow' }, L[0] + ' 겹'), h('h5', null, L[1]), P('**「틈」 예약하기 API** · ' + L[2])]); }
      g.addEventListener('click', pick); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      gs.push(g); svg.appendChild(g);
    });
    add(body, [h('div', { class: 'two' }, [fig(svg, '겹을 눌러 보세요. 외부 스키마는 구조와 의미의 상당 부분을 담고, 계약은 그것을 감싸 행위·품질·진화를 더합니다. 다섯 겹은 원전의 목록이 아니라 이 가이드의 교육용 분류입니다.', '그림 5-1'), lx])]);
    setTimeout(function () { gs[2].dispatchEvent(new Event('click')); }, 0);

    // 사전·사후·불변식 흐름
    body.appendChild(H4('예약하기의 세 단언과 실패 응답'));
    var f = svgBox(700, 250, '예약하기 요청은 사전조건 셋과 불변식을 차례로 통과해야 사후조건이 성립하고, 하나라도 어기면 상태 변화 없이 실패 응답을 돌려준다', 'minw-640');
    arrowDefs(f, 'c5a'); arrowDefs(f, 'c5b', 'arrowhead');
    var steps = [['요청', '회원·회의실·시작·끝', 'none'], ['pre1', '회원 존재, 정지 아님', 'ctr'], ['pre2', '30분 경계 · 4시간 이하', 'ctr'], ['pre3', '시작이 지금보다 뒤', 'ctr'], ['inv1', '겹침 없음 (R3)', 'con'], ['post1 · post2', '확정 예약 + E1 발행', 'ok']];
    var fails = [null, '403 member_suspended', '422 invalid_slot', '(5장에 없음 · 11장 422 starts_in_past)', '409 slot_taken', null];
    steps.forEach(function (st, i) {
      var x = 8 + i * 116, g = s('g', { class: st[2] === 'ok' ? 'L-int' : 'L-' + st[2] });
      g.appendChild(s('rect', { x: x, y: 30, width: 104, height: 62, rx: 4, class: st[2] === 'none' ? 'box' : 'box-c', style: st[2] === 'ok' ? 'stroke:var(--ok);fill:var(--ok-t)' : null }));
      g.appendChild(svgText(x + 52, 54, st[0], 't-b t-mono', 'middle'));
      g.appendChild(svgLines(x + 52, 74, st[1].split(' · '), 't-sm', 'middle', 14));
      f.appendChild(g);
      if (i < steps.length - 1) f.appendChild(s('line', { x1: x + 104, y1: 61, x2: x + 114, y2: 61, class: 'ln', 'marker-end': 'url(#c5a)' }));
      if (fails[i]) {
        f.appendChild(s('line', { x1: x + 52, y1: 94, x2: x + 52, y2: 150, class: 'ln ln-dash', 'marker-end': 'url(#c5b)' }));
        f.appendChild(s('rect', { x: x - 2, y: 154, width: 108, height: 52, rx: 3, style: 'fill:var(--bad-t);stroke:var(--bad)' }));
        f.appendChild(svgLines(x + 52, 174, fails[i].indexOf('(') === 0 ? ['응답은 5장에 없음', '11장: 422', 'starts_in_past'] : fails[i].split(' '), 't-sm t-mono', 'middle', 14));
      }
    });
    f.appendChild(svgText(350, 232, '실패는 모두 상태 변화 없음 · 업무 사전조건(pre1)과 형식 사전조건(pre2)은 둘 다 제공자가 검사', 't-sm t-mut', 'middle'));
    body.appendChild(fig(f, 'Meyer의 틀(사전조건은 소비자의 의무)을 그대로 API에 옮기면 어긋납니다. 경계에서는 사전조건을 어긴 요청이 **반드시** 들어오므로 제공자가 검사하고, 어겼을 때 돌려줄 응답을 계약에 적습니다.', '그림 5-2'));

    // 호환되는 변경
    body.appendChild(H4('이 변경, 옛 소비자는 놀랄까'));
    var cases = [
      ['응답에 `confirmedAt` 필드 추가', '사후조건 강화', 'ok', 'Tolerant Reader라면 그대로. 닫힌 모델로 엄격히 검증하면 실패'],
      ['요청의 `note` 필드를 선택으로 허용', '사전조건 약화', 'ok', '그대로 (안 보내던 소비자는 계속 안 보내면 됨)'],
      ['요청의 `attendees` 필드를 필수로', '사전조건 강화', 'bad', '실패 (옛 요청에는 없음)'],
      ['응답에서 `roomCode` 삭제', '사후조건 약화', 'bad', '그 필드를 쓰던 소비자는 실패'],
      ['예약 단위 30분 → 15분 (요청 쪽에서 보면)', '사전조건 약화', 'ok', '옛 회원 앱은 30분 단위로 계속 보냄 → 그대로'],
      ['예약 단위 30분 → 15분 (이벤트 쪽에서 보면)', '사후조건 약화', 'bad', '"모든 예약은 30분 경계"를 믿던 회계 시스템이 10:15 시작 예약을 받음 → 요금 계산이 어긋날 수 있음'],
      ['`endAt`을 "불포함"에서 "포함"으로', '의미 겹 변경', 'bad', '구조는 그대로라 옛 소비자는 오류 없이 틀린 계산을 함. MAJOR를 올리고 가능하면 이름을 바꿈(`endAtInclusive`)'],
      ['빈 결과를 `null`에서 `[]`로', '관찰된 의존일 수 있음', 'warn', '안전하다고 단정할 수 없음. 소비자가 `null`로 결과 없음을 판단한다면 실제 계약의 일부']
    ];
    var ch = h('div', { class: 'qgrid' });
    cases.forEach(function (c) {
      var res = h('div', { class: 'res', 'aria-live': 'polite' });
      ch.appendChild(h('div', { class: 'qcard' }, [
        h('div', { class: 'q', html: md(c[0]) }),
        seg([{ label: '그대로', key: 'ok' }, { label: '깨짐', key: 'bad' }], function (k) {
          clear(res);
          var ok = k === c[2] || (c[2] === 'warn');
          add(res, [h('span', { class: 'pill ' + (c[2] === 'warn' ? 'warn' : ok ? 'ok' : 'bad') }, c[2] === 'warn' ? '확인 필요' : ok ? '맞음' : '풀이와 다름'), ' ', h('b', null, c[1]), ' · ', h('span', { html: md(c[3]) })]);
        }),
        res
      ]));
    });
    body.appendChild(ch);
    body.appendChild(note('옛 소비자가 놀라지 않는 변경은 **사전조건을 약하게**(더 많이 받음) 하거나 **사후조건을 강하게**(더 많이 약속함) 하는 변경입니다. 같은 변경도 방향에 따라 약화가 되고 강화가 됩니다(30분 → 15분). 그래서 진화 겹에는 "누구에게 호환되는가"를 소비자별로 적습니다.', 'c L-ctr'));

    // 소비자 주도 계약
    body.appendChild(H4('소비자 주도 계약 — 지금 소비자들이 쓰는 필드의 합집합'));
    var fieldsC = ['bookingId', 'status', 'roomCode', 'startAt', 'endAt', 'createdAt'];
    var cons = { '회원 앱': ['bookingId', 'status', 'startAt', 'endAt'], '회계 시스템': ['bookingId', 'roomCode', 'startAt', 'endAt'] };
    var active = { '회원 앱': true, '회계 시스템': true };
    var cdc = h('div'), cdcMsg = h('p', { class: 'small', 'aria-live': 'polite' });
    function cdcDraw() {
      var union = {};
      Object.keys(cons).forEach(function (k) { if (active[k]) cons[k].forEach(function (f) { union[f] = 1; }); });
      var dot = function (on, layer) { return h('span', { class: 'L-' + layer, style: 'display:inline-block;width:12px;height:12px;border-radius:50%;' + (on ? 'background:var(--c)' : 'border:1.5px dashed var(--rule-2)') }); };
      var rows = [['제공자 계약', 'none', fieldsC]].concat(Object.keys(cons).map(function (k) { return [k + (active[k] ? '' : ' (빠짐)'), 'ext', active[k] ? cons[k] : []]; })).concat([['소비자 주도 계약 = 합집합', 'ctr', Object.keys(union)]]);
      clear(cdc);
      cdc.appendChild(table([''].concat(fieldsC.map(function (x) { return '`' + x + '`'; })), rows.map(function (r) { return [h('b', null, r[0])].concat(fieldsC.map(function (f) { return dot(r[2].indexOf(f) >= 0, r[1] === 'none' ? 'int' : r[1]); })); })));
      var free = fieldsC.filter(function (f) { return !union[f]; });
      cdcMsg.innerHTML = md('지금 아무도 쓰지 않는 필드: ' + (free.length ? free.map(function (x) { return '`' + x + '`'; }).join(', ') + ' → 지워도 지금의 소비자는 그대로입니다.' : '없음'));
    }
    var cbox = h('div', { class: 'controls' }, [h('span', { class: 'lbl' }, '소비자')].concat(Object.keys(cons).map(function (k) {
      var b = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'true' }, k);
      b.addEventListener('click', function () { active[k] = !active[k]; b.setAttribute('aria-pressed', active[k] ? 'true' : 'false'); cdcDraw(); });
      return b;
    })));
    cdcDraw();
    add(body, [cbox, cdc, cdcMsg]);
    var robinson = (table(['Robinson(2006)의 세 계약', '무엇인가', '성격'], [['제공자 계약', '제공자가 내놓는 기능 전체', '닫혀 있고, 하나이며, 권위가 있음'], ['소비자 계약', '소비자 한 명이 제공자에게 기대하는 것', '열려 있고, 불완전하며, 여럿'], ['소비자 주도 계약', '지금 있는 소비자 계약들을 합한 데서 나온 제공자 계약', '지금의 소비자들에 대해서는 닫혀 있고 완전함']]));

    // 실제 계약
    body.appendChild(H4('실제 계약 = 선언한 계약 + 관찰된 의존'));
    var rc = svgBox(680, 156, '선언한 계약 다섯 필드에 관찰된 의존 셋이 더해져 실제 계약이 된다', 'minw-560');
    var decl = ['bookingId', 'status', 'roomCode', 'startAt', 'endAt'], obs = ['시작 시각순 정렬', '빈 목록일 때 [] (null 아님)', '응답 0.3초 안팎'];
    rc.appendChild(svgText(10, 35, '선언한 계약', 't-sm t-b'));
    rc.appendChild(svgText(10, 51, '순서는 약속 안 함', 't-sm t-sub'));
    decl.forEach(function (d, i) { var x = 120 + i * 108, g = s('g', { class: 'L-ctr' }); g.appendChild(s('rect', { x: x, y: 18, width: 100, height: 34, rx: 3, class: 'box-c' })); g.appendChild(svgText(x + 50, 40, d, 't-sm t-mono', 'middle')); rc.appendChild(g); });
    rc.appendChild(svgText(10, 87, '+ 관찰된 의존', 't-sm t-b'));
    rc.appendChild(svgText(10, 103, 'Hyrum 법칙', 't-sm t-sub'));
    obs.forEach(function (d, i) { var x = 120 + i * 182; rc.appendChild(s('rect', { x: x, y: 70, width: 174, height: 34, rx: 3, style: 'fill:var(--warn-t);stroke:var(--warn);stroke-dasharray:4 3' })); rc.appendChild(svgText(x + 87, 92, d, 't-sm', 'middle')); });
    rc.appendChild(s('line', { x1: 10, y1: 120, x2: 670, y2: 120, class: 'ln' }));
    rc.appendChild(svgText(10, 144, '= 실제 계약 · 소비자가 기대는 것은 이 여덟 가지 전부', 't-sm t-b'));
    body.appendChild(fig(rc, '회계 팀이 정렬을 믿고 첫 줄을 그달 첫 예약으로 처리하면, 내부 변경으로 순서가 바뀌는 날 계약을 어긴 사람 없이 값이 틀립니다. 처방은 둘입니다. 기대도 되는 것은 계약에 올려 **선언**하고, 기대면 안 되는 것은 일부러 **흔듭니다**(예: 순서를 무작위로). 26장에서 질의 기록으로 실제 계약을 복원합니다.', '그림 5-3'));

    var _b = body; body = foldInto(_b, 'Robinson의 세 계약 · 호환성 유형 · 명세 형식이 적는 겹');
    body.appendChild(robinson);
    body.appendChild(table(['유형', '뜻', '먼저 올릴 쪽'], [['BACKWARD', '새 스키마를 쓰는 소비자가 바로 앞 스키마로 쓴 데이터를 읽을 수 있음 (기본값)', '소비자'], ['FORWARD', '새 스키마로 쓴 데이터를 바로 앞 스키마의 소비자가 읽을 수 있음', '생산자'], ['FULL', '바로 앞 스키마와 양쪽 모두', '어느 쪽이든 따로'], ['*_TRANSITIVE', '등록된 모든 이전 버전과', '위와 같음'], ['NONE', '검사하지 않음', '주의']]));
    body.appendChild(H4('명세 형식이 적는 겹 (2026-11-17 조회)'));
    var specs = [['OpenAPI 3.2.1', [1, 0, .5, 0, 0]], ['JSON Schema 2020-12', [1, .5, 0, 0, 0]], ['AsyncAPI 3.1.0', [1, 0, .5, 0, 0]], ['Arazzo 1.1.0', [0, 0, 1, 0, 0]], ['ODCS v3.2.0', [1, 0, 0, 1, .5]], ['Pact 계약 파일', [.5, 0, .5, 0, 0]]];
    body.appendChild(table(['형식', '구조', '의미', '행위', '품질', '진화'], specs.map(function (sp) { return [sp[0]].concat(sp[1].map(function (v) { return h('span', { class: v === 1 ? 'pill' : v ? 'pill' : '', style: v === 1 ? 'background:var(--ctr);color:var(--paper);border-color:transparent' : v ? 'background:var(--ctr-t);color:var(--ctr);border-color:transparent' : 'color:var(--ink-3)' }, v === 1 ? '적음' : v ? '일부' : '—'); })); }), { cls: 'heat' }));
    body.appendChild(P('Pact는 구조·행위의 **예**를 적습니다. 파일만 보면 다섯 겹 가운데 의미·품질·진화 정책이 비기 쉽습니다. OpenAPI·AsyncAPI에 사후조건이나 멱등성을 적는 표준 필드는 열람한 범위에서 보이지 않았다고 원고가 적습니다.', 'small muted'));
    body = _b;
  });

  // ---------- 6장 ----------
  RENDER.push(function renderC06() {
    var body = section('c06'); if (!body) return;
    body.appendChild(H4('예약 B101 하나를 네 표현으로 따라가기'));
    var K = { id: '예약번호', mem: '회원', room: '회의실', start: '시작', end: '끝', st: '상태' };
    function t(k, x) { return '<span data-k="' + k + '" class="kv">' + esc(x) + '</span>'; }
    var reps = [
      ['con', '개념 스키마의 사실', 'F4 예약 ' + t('id', 'B101') + ' 은 회원 ' + t('mem', 'M07') + ' 이 한 것이다<br>F5 예약 ' + t('id', 'B101') + ' 은 회의실 ' + t('room', 'R1') + ' 을 잡는다<br>F6 예약 ' + t('id', 'B101') + ' 은 2026-11-17 ' + t('start', '10:00') + ' 부터 ' + t('end', '11:30') + ' 까지다<br>F7 예약 ' + t('id', 'B101') + ' 은 ' + t('st', '확정') + ' 상태에 있다'],
      ['int', '내부 스키마의 행 · booking', 'booking_id | member_id | room_code | starts_at | ends_at | status<br>' + t('id', 'B101') + ' | ' + t('mem', 'M07') + ' | ' + t('room', 'R1') + ' | 2026-11-17 ' + t('start', '10:00') + '+09 | 2026-11-17 ' + t('end', '11:30') + '+09 | ' + t('st', 'confirmed')],
      ['ext', '외부 스키마 V2 오늘 일정표의 행', '회의실 ' + t('room', 'R1') + ' | 시작 ' + t('start', '10:00') + ' | 끝 ' + t('end', '11:30') + ' | 예약자 ' + t('mem', '김하나') + ' | 정원 6<br><span class="muted">예약번호 없음 · 상태는 고르기 조건(확정만)으로 사라짐</span>'],
      ['ctr', '계약 E1 "예약 확정" 이벤트 한 건', '{"eventId":"e-77","type":' + t('st', '"booking.confirmed"') + ',"bookingId":' + t('id', '"B101"') + ',"memberId":' + t('mem', '"M07"') + ',"roomCode":' + t('room', '"R1"') + ',"startAt":"2026-11-17T' + t('start', '10:00') + ':00+09:00","endAt":"2026-11-17T' + t('end', '11:30') + ':00+09:00"}']
    ];
    var grid = h('div', { class: 'two', style: 'grid-template-columns:repeat(2,minmax(0,1fr))' }, reps.map(function (r) { return h('div', { class: 'panel c L-' + r[0], style: 'box-shadow:none' }, [h('div', { class: 'eyebrow' }, r[1]), h('div', { class: 'mono', style: 'font-size:12.5px;line-height:1.9;overflow-wrap:anywhere', html: r[2] })]); }));
    var expl = { id: '예약번호는 개념·내부·이벤트에 있지만 V2에는 없습니다. V2는 사람이 보는 일정표라 예약번호를 보이지 않기로 한 모양 결정입니다.', mem: '"예약자 김하나"는 F4와 F1을 이어서 만든 값이고 내부 행에는 회원 이름이 없습니다. 이벤트에는 회원번호만 있어요. 회계가 이름을 필요로 하지 않는다는 판단이 계약에 들어간 것입니다.', room: '회의실 코드는 네 표현 모두에 같은 모양으로 나옵니다.', start: '시각은 개념에서 "10:00", 내부에서 시간대가 붙은 timestamptz, V2에서 HH:MM, 이벤트에서 오프셋을 단 ISO 8601입니다.', end: '끝 시각은 모두 불포함 `[시작, 끝)`으로 읽습니다. 이벤트 소비자에게는 의미 겹의 약속입니다.', st: '상태는 내부에서 `confirmed`이고, V2에서는 고르기 조건으로 사라졌고, 이벤트에서는 `type`에 녹아 있습니다.' };
    var ex = h('p', { class: 'small', 'aria-live': 'polite' });
    var kseg = seg(Object.keys(K).map(function (k) { return { label: K[k], key: k }; }), function (k) {
      $$('.kv', grid).forEach(function (e) { var on = e.getAttribute('data-k') === k; e.style.background = on ? 'var(--warn-t)' : ''; e.style.outline = on ? '1.5px solid var(--warn)' : ''; e.style.borderRadius = '2px'; });
      ex.innerHTML = md(expl[k]);
    }, { lbl: '같은 값 따라가기', start: 1 });
    add(body, [kseg, grid, ex]);

    // 전체 그림
    body.appendChild(H4('씨앗에서 네 산출물까지 한 장에'));
    var w = svgBox(700, 400, '씨앗에서 추출 원장을 거쳐 외부·개념·내부 스키마로 가고, 외부에는 계약이, 내부에는 보장 위치표가 붙고, 추적표가 둘을 잇는다', 'minw-640');
    arrowDefs(w, 'c6a');
    function box(x, y, wd, ht, layer, title, sub) {
      var g = s('g', { class: 'L-' + layer });
      g.appendChild(s('rect', { x: x, y: y, width: wd, height: ht, rx: 4, class: layer === 'none' ? 'box' : 'box-c' }));
      g.appendChild(svgText(x + wd / 2, y + 22, title, 't-b', 'middle'));
      if (sub) g.appendChild(svgText(x + wd / 2, y + 42, sub, 't-sm t-mut', 'middle'));
      w.appendChild(g);
    }
    box(200, 6, 300, 48, 'none', '씨앗', '콘셉트 · 요구 · 엑셀 · 로그 …');
    w.appendChild(s('line', { x1: 350, y1: 56, x2: 350, y2: 84, class: 'ln', 'marker-end': 'url(#c6a)' }));
    w.appendChild(svgText(360, 76, '추출 규칙 (7장, 14~26장)', 't-sm t-mut'));
    box(200, 88, 300, 48, 'none', '추출 원장', 'T  F  V  C  R  Q');
    w.appendChild(s('line', { x1: 350, y1: 138, x2: 350, y2: 166, class: 'ln', 'marker-end': 'url(#c6a)' }));
    w.appendChild(svgText(360, 158, '설계 절차 (8~12장)', 't-sm t-mut'));
    box(10, 196, 190, 56, 'ext', '외부 스키마', 'V1 V2 V3 E1');
    box(255, 172, 190, 80, 'con', '개념 스키마', '사실 · 제약 · 파생');
    box(500, 196, 190, 56, 'int', '내부 스키마', '표 · 키 · 인덱스');
    w.appendChild(s('line', { x1: 253, y1: 224, x2: 204, y2: 224, class: 'ln', 'marker-end': 'url(#c6a)' }));
    w.appendChild(svgText(228, 274, '외부-개념 사상', 't-sm t-mut', 'middle'));
    w.appendChild(svgText(228, 288, '(파생 규칙)', 't-sm t-mut', 'middle'));
    w.appendChild(s('line', { x1: 447, y1: 224, x2: 496, y2: 224, class: 'ln', 'marker-end': 'url(#c6a)' }));
    w.appendChild(svgText(472, 274, '개념-내부 사상', 't-sm t-mut', 'middle'));
    w.appendChild(svgText(472, 288, '(저장 규칙)', 't-sm t-mut', 'middle'));
    box(10, 300, 190, 48, 'ctr', '계약', '경계마다 다섯 겹');
    box(500, 300, 190, 48, 'int', '보장 위치표', '규칙마다 지키는 자리');
    w.appendChild(s('line', { x1: 105, y1: 254, x2: 105, y2: 298, class: 'ln' }));
    w.appendChild(s('line', { x1: 595, y1: 254, x2: 595, y2: 298, class: 'ln' }));
    w.appendChild(s('rect', { x: 10, y: 360, width: 680, height: 32, rx: 16, class: 'box-s' }));
    w.appendChild(svgText(350, 381, '추적표 (13장) — 원장 한 줄이 네 산출물의 어디에 나타나는지 잇는 띠', 't-sm t-b', 'middle'));
    body.appendChild(fig(w, '사상은 둘뿐입니다. 계약은 셋째 사상이 아니라, 외부 스키마가 경계를 넘을 때 그 경계에 붙는 약속이에요.', '그림 6-1'));

    var _b = body; body = foldInto(_b, '개념-내부 사상표');
    body.appendChild(table(['개념', '내부', '비고'], [['[개체] 회원(회원번호)', '`member.member_id` 기본 키', '참조 방식이 키로'], ['F1 회원은 이름을 가진다', '`member.name NOT NULL`', '필수 + 하나'], ['F4 예약은 회원이 한 것이다', '`booking.member_id NOT NULL REFERENCES member`', '1:N의 N쪽에 외래 키'], ['F6 예약은 시작·끝을 가진다', '`booking.starts_at`, `booking.ends_at`', '구간은 `[시작, 끝)`'], ['R3 겹침 금지', "`EXCLUDE USING gist (...) WHERE status = 'confirmed'`", 'DB가 지킴'], ['R5 늦은 취소는 사용으로 셈', '`booking.cancelled_at` + 청구 질의', '응용이 지킴']]));
    body = _b;

    body.appendChild(H4('자주 섞이는 용어 쌍 — 눌러서 차이 보기'));
    var pairs = [
      ['외부·개념·내부 vs 개념·논리·물리', '앞의 셋은 **누구의 관점인가**로, 뒤의 셋은 **얼마나 구체적인가**로 나눕니다.', '개념 스키마 = 개념 모델. 내부 스키마 = 논리 모델 + 물리 모델'],
      ['개념 스키마 vs 도메인 모델', '개념 스키마는 사실과 규칙의 구현 독립 기술. DDD의 도메인 모델은 흔히 행위를 가진 코드까지 포함합니다.', '개념 스키마를 먼저 쓰고, 도메인 모델은 그것을 구현하는 선택의 하나로 봄'],
      ['외부 스키마 vs 계약 vs API 명세', '외부 스키마는 모양과 파생, 계약은 약속, API 명세는 둘의 기계가 읽는 부분입니다.', '3장·5장의 구분'],
      ['내부 스키마 vs DDL', 'DDL은 내부 스키마의 대부분을 적지만 단일 쓰기 경로 같은 결정은 못 적습니다.', '보장 위치표로 보충'],
      ['스키마 vs 인스턴스', 'TR 9007의 개념 스키마와 정보 베이스. 일반 규칙과 지금의 사실입니다.', '설계할 때는 인스턴스(예제 데이터)를 늘 함께 씀'],
      ['개념 스키마 하나 vs 맥락마다', 'TR 9007은 유일한 중심 기술, DDD는 맥락마다 모델을 둡니다.', '맥락 하나 = 담화 세계 하나. 맥락 사이는 계약']
    ];
    body.appendChild(h('div', { class: 'pairs' }, pairs.map(function (p) {
      var b = h('button', { type: 'button', class: 'pair', 'aria-expanded': 'false' }, [h('div', { class: 'a' }, p[0]), h('div', { class: 'hint' }, '눌러서 차이 보기'), h('div', { class: 'b', html: md(p[1]) + '<br><b>이 가이드에서는</b> ' + md(p[2]) })]);
      b.addEventListener('click', function () { b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'); });
      return b;
    })));
    body.appendChild(P('6장의 문장 여덟 (가)~(아)는 [서론의 분류 놀이](#sort)에서 「6장 문장 여덟」으로 풀 수 있습니다.', 'small muted'));
  });

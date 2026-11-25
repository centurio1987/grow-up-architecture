// @relation relate
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx). 상자 이름은 개념도와 같고,
// GPU 작업자는 작업자 0 · 1 두 인스턴스로 나눠 그렸다(명세 SD11, 1.1.0). 스트림 게이트웨이 0 · 1 은 이름이 칸에 들어가지 않아 한 칸에 적었다.
// 다시 연결한 브라우저가 앞단의 부하 분산을 지나 살아 있는 게이트웨이로 가므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다.
// 코드는 부하 분산을 흉내 내지 않고, 다시 연결을 늘 게이트웨이 0 으로 보낸다.
// 출처: code/expected-output.txt 의 시나리오 3 줄(204250 · 209250 · 213000 · 214000 · 230000 · 233000 · 270010 · 271000 ·
// 273220 · 273230 · 273720ms 와 jisu · sora · doyun · dora · yuna 줄). 235020ms 는 도라의 실행을 꺼낸 시각으로,
// 받은 뒤 320ms 에서 prefill 220 과 토큰 다섯째까지 80 을 뺀 계산이다. 235002ms 는 받은 235000ms 에 질문 적기 2ms(STORE_RT)를 더한 계산,
// 241020ms 는 도라의 실행을 꺼낸 235020ms 에 6000ms 를 더한 계산이다(끝난 답 화살표는 작업자 0 에서 나가므로 작업자 0 의 도라만 적는다). 배지 번호는 본문 시나리오 3 의 단계 번호와 같다.
//
// 주장: 연결이 끊겨도 실행은 계속되고, 다시 연결한 브라우저에는 Last-Event-ID 다음 순번부터 와 빠짐도 겹침도 없다.
// 게이트웨이가 다시 떠도 다른 게이트웨이가 같은 토큰 기록을 읽어 이어 준다. GPU 작업자가 토큰을 멈추면 요청 대기열이 조각 사이 시간 제한(3초)을 넘은
// 실행을 「실패」로 적어 오류 이벤트가 가고, 잇달아 셋이 「실패」가 되면 그 작업자의 차단기가 열려 다음 질문은 다른 작업자로 간다.
// 취소는 다음 반복에 GPU 자리를 비우고, 두 번 와도 결과가 같다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Boxes, BROWSER, GATEWAY, LB_API, LB_GW, Lane, PATH, QUEUE, RECORD, STORE, W, WORKER } from './_chat-layout';

const HALF = 96;
const GW = { ...GATEWAY, tag: 'GATEWAY 0 · 1', note: '1 이 213000ms 재시작' };
const WORKER0 = { ...WORKER, w: HALF, tag: 'WORKER 0', name: 'GPU 작업자', note: '도라' };
const WORKER1 = { ...WORKER, x: 460, w: HALF, tag: 'WORKER 1', name: 'GPU 작업자', note: '230000ms 멈춤' };

const LANES = [
  { from: { x: 356, y: 140 }, to: { x: 330, y: 140 }, lines: ['HTTP POST · 취소', '273220 · 273720ms'], lx: 290, ly: 86, order: 6, bx: 237, by: 163 },
  { from: { x: 250, y: 140 }, to: { x: 224, y: 140 }, lines: [], lx: 237, ly: 98 },
  { from: { x: 224, y: 185 }, to: { x: 250, y: 185 }, dashed: true, lines: ['HTTP 응답 · 273220 · 273720ms', '두 번 다 stopped after id 30'], lx: 232, ly: 226, anchor: 'start' as const },
  { from: { x: 330, y: 185 }, to: { x: 356, y: 185 }, dashed: true, lines: [], lx: 343, ly: 226 },
  { from: { x: 556, y: 140 }, to: { x: 582, y: 140 }, lines: ['HTTP GET 다시 연결 · Last-Event-ID', '40 · 209250ms / 27 · 214000ms'], lx: 622, ly: 86, order: 1, bx: 569, by: 163 },
  { from: { x: 662, y: 140 }, to: { x: 688, y: 140 }, lines: [], lx: 675, ly: 98 },
  { from: { x: 688, y: 185 }, to: { x: 662, y: 185 }, lines: ['SSE · 209250ms 지수 41 ~ 58', '214000ms 소라 28 ~ 37, 그 뒤 차례로'], lx: 616, ly: 226, order: 2, bx: 500, by: 232 },
  { from: { x: 582, y: 185 }, to: { x: 556, y: 185 }, lines: [], lx: 569, ly: 226 },
  { ...PATH.read, lines: ['읽기 · 209250 · 214000ms', '다음 순번부터'], lx: 778, ly: 268, anchor: 'end' as const },
  { ...PATH.question, lines: ['쓰기 · 235000 ~ 235002ms(계산)', '도라의 질문'], lx: 134, ly: 298, anchor: 'start' as const },
  { from: { x: 200, y: 210 }, waypoints: [{ x: 200, y: 270 }, { x: 406, y: 270 }], to: { x: 406, y: 330 }, lines: ['넣기 · 도라 235002ms(계산) · 취소 알리기 273220ms'], lx: 228, ly: 262, anchor: 'start' as const },
  { ...PATH.check, lines: ['쓰기 · 233000ms', '「실패」 · 273220ms', '「취소됨」'], lx: 622, ly: 337, order: 4, bx: 622, by: 404 },
  { from: { x: 404, y: 550 }, to: { x: 404, y: 430 }, lines: ['꺼내기 · 235020ms(계산)', '도라'], lx: 394, ly: 482, anchor: 'end' as const, order: 5, bx: 236, by: 478 },
  { from: { x: 508, y: 550 }, to: { x: 508, y: 430 }, lines: ['꺼내기 · 270010ms 유나(반열림)', '233000 ~ 263000ms 는 열림'], lx: 518, ly: 482, anchor: 'start' as const },
  { ...PATH.chunk, lines: ['쓰기(XADD) · 230000ms 부터 없음', '상태 읽기 · 273230ms 유나 「취소됨」'], lx: 672, ly: 572, order: 3, bx: 800, by: 520 },
  { ...PATH.answer, lines: ['쓰기 · 끝난 답', '241020ms(계산) 도라'], lx: 240, ly: 572 },
  { ...PATH.close, lines: ['쓰기 · 233000ms', '「실패」 · 273220ms', '「취소됨」'], lx: 290, ly: 350 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={870} title="시나리오 3 — 끊김 · 게이트웨이 재시작 · GPU 작업자 멈춤 · 취소">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="끊겨도 실행은 계속되고, 멈춘 GPU 작업자는 조각 사이 시간 제한으로 가려 차단기가 막는다" />
      <Boxes
        boxes={[
          { ...API, note: '취소 두 번 · 같은 답' },
          LB_API,
          { ...BROWSER, tag: 'FIVE BROWSERS', note: '지수 · 소라 · 도윤 · 도라 · 유나' },
          LB_GW,
          GW,
          STORE,
          { ...QUEUE, note: '1초마다 시간 제한 확인 · 차단기' },
          { ...RECORD, note: '「실패」 · 「취소됨」도 적힘' },
          WORKER0,
          WORKER1,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={680}
        width={864}
        label="실행 출력"
        tone="sunken"
        lines={[
          '지수 — 204250ms 에 id 40 뒤 끊김, 끊긴 동안 만든 18개가 209250ms 에 한꺼번에 와 1 ~ 58 (빠짐 0 · 겹침 0)',
          '소라 — 게이트웨이 1 이 213000ms 에 다시 떠 id 27 뒤 끊기고, 게이트웨이 0 에서 이어 와 1 ~ 58 (빠짐 0 · 겹침 0)',
          '도윤 — id 17 뒤 233000ms 에 오류 이벤트 · 도라 — 작업자 0 에서 받은 뒤 320ms 에 첫 조각',
          '유나 — id 30 뒤 취소, 10ms 뒤 자리를 비우고 토큰 140개를 만들지 않음, 두 번째 취소는 같은 답',
        ]}
      />
    </C4DynamicDiagram>
  );
}

// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_notify-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0). 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(1000 · 1002 · 1050 · 1070 · 1075ms). 70ms 를 나눈 2 · 48 · 20ms 는
// code/ 의 STORE_RT · STEP(50ms 마다 꺼내기, 1002ms 다음 차례가 1050ms) · RT 다. 배지 번호는 본문 시나리오 1 의 단계 번호와 같다.
//
// 주장: 부하와 장애가 없을 때 급한 SMS 하나는 알림 저장소에 적힌 뒤 급한 큐에 들어가고, 다음 꺼내기에서 SMS 발송사 A 로 나가
// 받은 뒤 70ms 에 발송사에 넘겨지며, 그 결과가 5ms 뒤 알림 저장소에 기록된다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Boxes, CALLER, DEVICE, LB, Lane, PATH, QUEUE, SMSV, STORE, W, WORKER } from './_notify-layout';

const LANES = [
  { from: { x: 224, y: 140 }, to: { x: 250, y: 140 }, lines: ['HTTP POST · 1000ms'], lx: 290, ly: 100, order: 1, bx: 150, by: 94 },
  { from: { x: 330, y: 140 }, to: { x: 356, y: 140 }, lines: [], lx: 343, ly: 100 },
  { ...PATH.store, lines: ['적기 · 1000 ~ 1002ms', 'n=0 (키가 처음)'], lx: 622, ly: 112, order: 1, bx: 622, by: 172 },
  { ...PATH.enqueue, lines: ['급한 SMS 큐에 넣기', '1002ms · 답을 돌려줌'], lx: 466, ly: 256, anchor: 'start' as const, order: 2, bx: 438, by: 270 },
  { ...PATH.take, lines: ['꺼내기 · 1050ms', '작업자 1 · 급한 큐 먼저'], lx: 446, ly: 472, anchor: 'end' as const, order: 3, bx: 300, by: 500 },
  { ...PATH.sms, lines: ['HTTP 요청 · 1050ms', 'A 가 200 · 1070ms'], lx: 466, ly: 690, anchor: 'start' as const, order: 4, bx: 438, by: 700 },
  { ...PATH.text, lines: ['문자 · 1070ms 넘김 뒤', '발송사가 전달'], lx: 622, ly: 790 },
  { ...PATH.record, lines: ['결과 기록 · 1075ms', '상태 = 넘김'], lx: 650, ly: 300, anchor: 'start' as const, order: 5, bx: 662, by: 342 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={1010} title="시나리오 1 — 급한 SMS 하나가 70ms 뒤 발송사에 넘겨진다">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="적고, 넣고, 급한 큐에서 꺼내, 발송사의 응답을 기록한다" />
      <Boxes
        boxes={[
          { ...CALLER, tag: 'LOGIN', note: '민수의 인증번호' },
          { ...LB },
          { ...API, note: '키가 처음 · n=0' },
          { ...STORE, note: '받음 · 큐에 넣음 · 보내는 중 · 넘김' },
          { ...QUEUE, note: '급한 SMS 큐에 하나' },
          { ...WORKER, tag: 'WORKER 1', note: '1050ms 에 꺼냄' },
          { ...SMSV, tag: 'SMS A', note: '1070ms 에 200' },
          { ...DEVICE, tag: 'MINSU', note: '문자 한 통' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={900}
        width={864}
        label="받은 뒤 70ms 의 내역"
        tone="sunken"
        lines={[
          '실행 출력 — 1000ms 에 받아 1070ms 에 SMS A 가 200 으로 받음, 1075ms 에 기록',
          '계산 — 70 = 적기 2 + 다음 꺼내기까지 48 + A 의 응답 20 (모형의 가정값 STORE_RT · STEP · RT 에서)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

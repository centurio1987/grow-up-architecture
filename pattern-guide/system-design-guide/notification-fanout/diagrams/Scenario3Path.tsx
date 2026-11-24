// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_notify-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 출처: code/expected-output.txt 의 시나리오 3 줄(220470 · 230770 · 241070 · 250000 · 251000 · 260070 · 300022 · 312000ms,
// sms · jisu's device · guide 줄). 배지 번호는 본문 시나리오 3 의 단계 번호와 같다.
//
// 주장: SMS 발송사 A 가 멈추면 차단기가 열려 SMS 가 B 로 나가고, 반열림의 시험 호출로 A 가 다시 응답하는 것을 확인한 뒤 닫힌다.
// 같은 키로 다시 온 요청은 처음 결과를 돌려받고, 더는 쓸 수 없는 기기 토큰(404)은 다시 보내지 않고 지운다. 작업자가 발송사의 응답 뒤
// 기록 전에 멈추면 같은 알림이 가시성 시간 뒤 한 번 더 나가, 푸시는 같은 알림 태그라 화면에 하나만 남고 SMS 는 두 통이 된다.
// 플랫폼은 「보내는 중」인 알림을 다시 꺼낼 때 「두 번 나갔을 수 있음」으로 센다. 312050 · 312070ms 는 다음 차례와 응답 시각의 계산이다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Badge, Boxes, CALLER, DEVICE, LB, Lane, PATH, PUSHV, QUEUE, SMSV, STORE, W, WORKER } from './_notify-layout';

const LANES = [
  { from: { x: 224, y: 140 }, to: { x: 250, y: 140 }, lines: ['POST · 250000 · 251000ms 같은 키'], lx: 290, ly: 100 },
  { from: { x: 330, y: 140 }, to: { x: 356, y: 140 }, lines: [], lx: 343, ly: 100 },
  { ...PATH.store, lines: ['251000ms 같은 키', 'n=10505 를 돌려줌'], lx: 622, ly: 112, order: 3, bx: 622, by: 172 },
  { ...PATH.enqueue, lines: ['넣기 · 2ms 뒤', '받을 때마다'], lx: 466, ly: 256, anchor: 'start' as const },
  { ...PATH.take, lines: ['꺼내기 · 50ms 마다', '작업자 0 · 1 이 번갈아'], lx: 446, ly: 472, anchor: 'end' as const, order: 6, bx: 300, by: 505 },
  { ...PATH.requeue, dashed: true, lines: ['재시도 대기', 'A 의 500 일 때마다'], lx: 530, ly: 472, anchor: 'start' as const },
  { ...PATH.record, lines: ['기기 토큰 지움 · 260070ms', '기록 못 함 · 300025ms'], lx: 650, ly: 300, anchor: 'start' as const, order: 5, bx: 662, by: 345 },
  { ...PATH.push, lines: ['HTTP 요청 · 도라 404 · 260070ms', '지수 푸시 300000(계산) · 312050ms(계산)'], lx: 134, ly: 735, anchor: 'start' as const, order: 4, bx: 300, by: 694 },
  { ...PATH.sms, lines: ['HTTP 요청 · A 는 220470ms 에 열림', '열린 동안 B · 241070ms 닫힘'], lx: 466, ly: 690, anchor: 'start' as const, order: 1, bx: 438, by: 690 },
  { ...PATH.text, lines: ['지수 문자 2통째', '312070ms(계산)'], lx: 622, ly: 790 },
  { ...PATH.deliver, lines: ['지수 푸시 300020 · 312070ms(계산) 무렵 도착 — 같은 알림 태그라 화면에 1개'], lx: 456, ly: 922 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={1110} title="시나리오 3 — SMS 발송사 A 가 멈추고 작업자 0 이 기록 전에 멈출 때">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="차단기는 B 로 넘기고, 기록 전에 멈춘 작업자의 알림은 한 번 더 나간다" />
      <Boxes
        boxes={[
          { ...CALLER, tag: 'LOGIN · ORDER', note: '답을 잃고 같은 키로' },
          { ...LB },
          { ...API, note: '키를 보고 처음 결과' },
          { ...STORE, note: '도라의 기기 토큰 지움' },
          { ...QUEUE, note: '12000ms 뒤 다시 보임' },
          { ...WORKER, tag: 'WORKER 0 · 1', note: '0 이 300022ms 에 멈춤' },
          { ...PUSHV, tag: 'FCM', note: '도라 404 · 지수 200' },
          { ...SMSV, tag: 'SMS A · B', note: 'A 220000 ~ 240000ms 500' },
          { ...DEVICE, tag: 'JISU · DORA · MINSU', note: '문자 · 푸시' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Badge x={438} y={735} n={2} />
      <Callout
        x={GUTTER}
        y={950}
        width={864}
        label="실행 출력"
        tone="sunken"
        lines={[
          '급한 SMS 801건 가운데 8건이 A 에서 실패해 다시 나갔고, 가장 늦은 것이 받은 뒤 2120ms',
          '작업자 0 이 응답(300020ms) 뒤 기록(300025ms) 전에 멈춤 — 같은 두 건이 12000ms 뒤 다시 보임',
          '312050ms(계산)에 작업자 1 이 다시 보내고, 플랫폼이 「두 번 나갔을 수 있음」 2건을 셈',
          '같은 키로 다시 보내도 알림은 1건, 도라의 404 는 다시 보내지 않고 기기 토큰을 지움',
        ]}
      />
    </C4DynamicDiagram>
  );
}

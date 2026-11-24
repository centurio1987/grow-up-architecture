// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_notify-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 출처: code/expected-output.txt 의 시나리오 2 줄(guide · one-queue · no-share). 크기는 실제의 100분의 1(캠페인 1만 명 · 초당 100건)이다.
// 배지 번호는 본문 시나리오 2 의 단계 번호와 같다.
//
// 주장: 캠페인 1만 건이 먼저 큐에 들어가도 급한 푸시는 급한 큐에서 먼저 꺼내져 받은 뒤 70ms 에 넘겨진다. 푸시 발송사의 한 지역이 실패해도
// 재시도도 할당량을 확인한 뒤에만 나가(새 알림이 기다리는 동안은 초당 100 가운데 20 까지) 429 가 0 이다. 같은 사건열을 큐 하나로 실행하면 급한 푸시가 111720ms 를
// 기다리고, 재시도가 할당량 확인을 건너뛰면 429 가 3796건 생긴다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Boxes, CALLER, DEVICE, LB, Lane, PATH, PUSHV, QUEUE, STORE, W, WORKER } from './_notify-layout';

const LANES = [
  { from: { x: 224, y: 140 }, to: { x: 250, y: 140 }, lines: ['POST 10000 · 11000 · 35000ms'], lx: 290, ly: 100, order: 1, bx: 120, by: 94 },
  { from: { x: 330, y: 140 }, to: { x: 356, y: 140 }, lines: [], lx: 343, ly: 100 },
  { ...PATH.store, lines: ['쓰기 · 10000ms', '11000 · 35000ms', '10003건(계산)'], lx: 622, ly: 97 },
  { ...PATH.enqueue, lines: ['캠페인 큐 10000 · 10002ms', '급한 · 보통 큐 · 11002ms'], lx: 466, ly: 256, anchor: 'start' as const, order: 2, bx: 438, by: 270 },
  { ...PATH.take, lines: ['급한 줄부터 · 11050ms', '(계산) 그다음 보통 · 캠페인'], lx: 446, ly: 472, anchor: 'end' as const, order: 3, bx: 300, by: 505 },
  { ...PATH.requeue, dashed: true, lines: ['재시도 대기 · 500', '30000 ~ 50000ms'], lx: 530, ly: 472, anchor: 'start' as const, order: 5, bx: 600, by: 515 },
  { ...PATH.record, lines: ['결과 기록 · 25ms 뒤', '꺼낼 때마다'], lx: 650, ly: 300, anchor: 'start' as const },
  { ...PATH.push, lines: ['HTTP 요청 · 초당 할당량 100 안에서', '소라의 급한 푸시 11070ms(계산) 200'], lx: 134, ly: 735, anchor: 'start' as const, order: 4, bx: 300, by: 694 },
  { ...PATH.deliver, lines: ['200 일 때 기기에 전달 · 30000 ~ 50000ms 에는 사용자 번호 ÷ 5 의 나머지가 0 · 1 · 2 인 기기로 500'], lx: 456, ly: 922 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={1110} title="시나리오 2 — 캠페인 뒤에 들어온 급한 푸시와 한 지역의 실패">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="급한 줄은 먼저 꺼내고, 재시도도 할당량을 확인한다" />
      <Boxes
        boxes={[
          { ...CALLER, tag: 'MARKETING · LOGIN · ORDER', note: '캠페인 · 소라 · 유나' },
          { ...LB },
          { ...API, note: '캠페인 10000건을 한 번에' },
          { ...STORE, note: '알림 10003건(계산)' },
          { ...QUEUE, note: '캠페인 약 9900(계산) · 급한 · 보통 1' },
          { ...WORKER, note: '50ms 마다 5건까지' },
          { ...PUSHV, tag: 'FCM', note: '초당 100 · 한 지역 500' },
          { ...DEVICE, tag: 'SORA · YUNA · FANS', note: '푸시' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={950}
        width={864}
        label="이 가이드(guide)의 실행과, 같은 사건열로 구조 하나만 바꾼 두 실행"
        tone="sunken"
        lines={[
          '실행 출력 — 소라의 급한 푸시 받은 뒤 70ms · 마지막 캠페인 푸시 받은 뒤 112720ms · 429 0건',
          '실행 출력 — 실패한 지역의 유나 급한 푸시는 한 번 실패해 받은 뒤 15020ms 에 넘겨짐',
          'one-queue — 큐가 하나면 소라의 급한 푸시가 캠페인 뒤에서 기다려 받은 뒤 111720ms 에 넘겨짐',
          'no-share — 재시도가 할당량 확인을 건너뛰면 429 3796건, 마지막 캠페인 푸시 받은 뒤 177408ms',
        ]}
      />
    </C4DynamicDiagram>
  );
}

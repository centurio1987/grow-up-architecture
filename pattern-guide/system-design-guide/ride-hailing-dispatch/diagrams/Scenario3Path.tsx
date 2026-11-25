// @relation relate
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 서버 · 앱 · 저장소 하나씩이라 RoleBox 로 그린다(_dispatch-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 기사 셋(d20 · d21 · d23)과 손님 둘(다나 · 준호)은 한 칸에 묶어 적었다. 앱의 요청이 앞단의 부하 분산을 지나므로 「부하 분산」(LB)을 그린다.
// 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 3 줄(205000 · 220000 · 221000 · 223000 · 230000 · 231000 · 231500 · 236000 · 238000ms).
// 169250ms 는 d22 의 마지막 위치 갱신(4250 + 5000 × 33, 계산), 234500 · 234750ms 는 d23 · d24 의 다음 위치 갱신(4500 · 4750 + 5000 × 46, 계산)이다.
// 셀 2:0 이 노드 1 에서 노드 0 으로 옮겨 가는 것은 code/ 의 hash · owner 로 셈한 값이다. 배지 번호는 그 화살표로 본문 시나리오 3 이 짚는 단계의 번호다(한 화살표의 라벨에는 앞뒤 단계의 사건도 함께 적었다).
//
// 주장: 15초 안에 답하지 않은 기사의 점유는 조건부 쓰기로 거두고 다음 기사에게 넘기며, 늦게 온 수락은 0행이다.
// 30초 넘게 위치 갱신이 없는 기사는 후보에서 빠진다. 위치 인덱스 노드 하나가 멈추면 그 노드의 셀만 옮겨 가고, 그 셀의 기사는
// 다음 위치 갱신까지 보이지 않는다. 같은 멱등 키로 다시 온 요청은 같은 요청을 돌려받는다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import {
  Boxes, DISPATCH, DRIVER, INDEX, INGEST, LB_DRIVER, LB_INGEST, LB_RIDER, Lane, PATH, RECORD, REQUESTS, RIDER, VIA, W,
} from './_dispatch-layout';

const LANES = [
  { ...VIA.locateIn, lines: ['HTTPS POST · 5초마다', 'd22 마지막 169250ms(계산)', 'd23 · d24 는 234500 · 234750ms'], lx: 174, ly: 252, anchor: 'start' as const },
  { ...VIA.locateOut, lines: [], lx: 124, ly: 315 },
  { ...PATH.write, lines: ['쓰기 · 234500', '· 234750ms', '셀 2:0 → 노드 0'], lx: 134, ly: 482, anchor: 'start' as const, order: 8, bx: 100, by: 490 },
  { ...VIA.requestIn, lines: ['HTTPS POST · 205000ms 다나', '231000 · 231500ms 준호(같은 키)'], lx: 674, ly: 84, order: 7, bx: 560, by: 80 },
  { ...VIA.requestOut, lines: [], lx: 543, ly: 130 },
  { ...PATH.key, lines: ['쓰기 · 205000 · 231000ms', '231500ms 같은 키는 새로 적지 않음'], lx: 672, ly: 350, order: 7, bx: 770, by: 520 },
  { ...PATH.search, lines: ['읽기 · 205000ms d22 빠짐', '220000ms d21', '231000ms 0명', '236000ms d23 · d24'], lx: 260, ly: 474, anchor: 'start' as const, order: 6, bx: 236, by: 540 },
  { ...PATH.hold, lines: ['읽기 · 조건부 쓰기 · 205000ms d20 제안', '220000ms 거두기 1행 · d21 제안', '221000ms d20 수락 0행 · 223000ms d21 1행', '236000ms d23 제안 · 238000ms 1행'], lx: 466, ly: 474, anchor: 'start' as const, order: 3, bx: 440, by: 520 },
  { ...PATH.offer, dashed: true, lines: ['앱 연결 · 제안', '205000ms d20', '220000 d21 · 236000 d23'], lx: 300, ly: 205, order: 2, bx: 362, by: 260 },
  { ...VIA.acceptIn, lines: ['HTTPS POST · 221000ms d20(늦음)', '223000 d21 · 238000 d23'], lx: 232, ly: 84, anchor: 'start' as const, order: 4, bx: 348, by: 162 },
  { ...VIA.acceptOut, lines: [], lx: 369, ly: 130 },
  { ...PATH.result, dashed: true, lines: ['앱 연결 · 배정', '223000ms 다나', '238000ms 준호'], lx: 610, ly: 205, order: 4, bx: 550, by: 260 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={870} title="시나리오 3 — 답하지 않은 기사 · 끊긴 앱 · 멈춘 노드 · 다시 온 요청">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="늦은 수락은 0행, 멈춘 노드의 셀은 다음 위치 갱신으로 다시 채워진다" />
      <Boxes
        boxes={[
          { ...DRIVER, tag: 'D20 · D21 · D23', note: 'd20 수락은 제안한 뒤 16000ms(가정)' },
          LB_DRIVER,
          LB_INGEST,
          { ...RIDER, tag: 'DANA · JUNHO', note: '준호의 앱은 같은 키로 두 번' },
          LB_RIDER,
          { ...INGEST, note: '노드 1 이 멈춘 뒤 셀 2:0 → 노드 0' },
          { ...DISPATCH, note: '15초 뒤 거두기 · 5초 뒤 다시 찾기' },
          { ...INDEX, note: '230000ms 노드 1 멈춤 · 셀 20개 옮김' },
          { ...RECORD, note: 'd20 대기로 · d21 · d23 운행 중' },
          { ...REQUESTS, note: 'k-dana → r22 · k-junho → r23' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={680}
        width={864}
        label="실행 출력과 계산"
        tone="sunken"
        lines={[
          '다나 — d22 는 마지막 위치가 35750ms 전이라 빠짐, d20 은 15000ms 안에 답이 없어 220000ms 에 거두기(1행)',
          '다나 — 221000ms 의 d20 수락은 0행, 223000ms 에 d21 이 수락해 받은 뒤 18000ms 에 배정',
          '노드 1 — 230000ms 에 멈추며 셀 20개가 노드 0 에 12개 · 노드 2 에 8개로, 나머지 44개는 그대로',
          '준호 — 231000ms 에 후보 0명, 231500ms 의 같은 키는 r23, 236000ms 에 d23 에게 제안해 받은 뒤 7000ms 에 배정',
          '계산 — d22 의 마지막 위치 갱신 169250ms = 4250 + 5000 × 33',
          '계산 — d23 · d24 의 다음 위치 갱신 234500 · 234750ms = 4500 · 4750 + 5000 × 46',
        ]}
      />
    </C4DynamicDiagram>
  );
}

// @relation relate
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 서버 · 앱 · 저장소 하나씩이라 RoleBox 로 그린다(_dispatch-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 경기장 손님 20명과 기사 12명은 한 칸에 묶어 적었다. 앱의 요청이 앞단의 부하 분산을 지나므로 「부하 분산」(LB)을 그린다.
// 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 2 줄(100000ms 의 r1 · r2, guide · index · lock · seoyun 줄).
// 요청 시각 100000 ~ 101800ms 와 수락 2000 ~ 2750ms 는 code/ 의 Ask 와 DRIVER 표에서 왔다. 9칸이 노드에 2 · 5 · 2 칸으로
// 나뉘는 것은 code/ 의 hash · owner 로 셈한 값이고, 184 · 460 · 184 = 92번 × 2 · 5 · 2 칸의 계산이다.
// 배지 번호는 본문 시나리오 2 의 단계 번호와 같다.
//
// 주장: 같은 순간 같은 기사를 고른 두 요청 가운데 기사 기록의 조건부 쓰기로 하나만 점유를 잡고, 기사 12명이 다 차면
// 남은 요청은 빈 기사가 없음을 확인한 뒤 받은 뒤 45000ms 에 실패 알림이 간다. 몰린 장소의 9칸 가운데 5칸을 맡은
// 노드 1 이 읽기의 56% 를 맡는다. 점유를 잠금 저장소에만 두면 장애 조치 하나로 기사 8명이 손님 둘에게 간다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import {
  Boxes, DISPATCH, DRIVER, INDEX, INGEST, LB_DRIVER, LB_INGEST, LB_RIDER, Lane, PATH, RECORD, REQUESTS, RIDER, VIA, W,
} from './_dispatch-layout';

const LANES = [
  { ...VIA.locateIn, lines: ['HTTPS POST · 5초마다', '경기장 기사 120건(계산)'], lx: 174, ly: 262, anchor: 'start' as const },
  { ...VIA.locateOut, lines: [], lx: 124, ly: 315 },
  { ...PATH.write, lines: ['쓰기 · 100000', '~ 150000ms', '노드 0 · 1 · 2', '20 · 50 · 50건'], lx: 134, ly: 482, anchor: 'start' as const, order: 4, bx: 100, by: 490 },
  { ...VIA.requestIn, lines: ['HTTPS POST · 100000 ~ 101900ms', '경기장 요청 20개 · 서윤 r21'], lx: 674, ly: 84, order: 1, bx: 560, by: 80 },
  { ...VIA.requestOut, lines: [], lx: 543, ly: 130 },
  { ...PATH.key, lines: ['쓰기 · 100000', '~ 101900ms', 'r1 ~ r20 · 서윤 r21'], lx: 798, ly: 462, anchor: 'start' as const },
  { ...PATH.search, lines: ['읽기 · 100000', '~ 150000ms · 9칸씩', '노드 0 · 1 · 2 에', '184 · 460 · 184번'], lx: 260, ly: 474, anchor: 'start' as const, order: 4, bx: 236, by: 540 },
  { ...PATH.hold, lines: ['읽기 · 조건부 쓰기 · 100000ms', 's01 에 r1 1행 · r2 0행 → s02', '100100 ~ 101000ms(계산) s03 ~ s12'], lx: 466, ly: 474, anchor: 'start' as const, order: 1, bx: 440, by: 520 },
  { ...PATH.offer, dashed: true, lines: ['앱 연결 · 제안', '100000 ~ 101000ms', '한 기사에 하나씩'], lx: 300, ly: 205, order: 2, bx: 362, by: 260 },
  { ...VIA.acceptIn, lines: ['HTTPS POST · 수락', '제안한 뒤 2000 ~ 2750ms'], lx: 232, ly: 84, anchor: 'start' as const },
  { ...VIA.acceptOut, lines: [], lx: 369, ly: 130 },
  { ...PATH.result, dashed: true, lines: ['앱 연결 · 배정 12', '받은 뒤 최대 2750ms', '실패 8 · 받은 뒤 45000ms'], lx: 610, ly: 205, order: 3, bx: 550, by: 260 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={850} title="시나리오 2 — 경기장의 몰림에서 같은 기사를 고른 두 요청 가운데 하나만 점유를 잡는다">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="같은 기사는 한 요청만 잡고, 기사가 다 차면 남은 요청은 실패를 알린다" />
      <Boxes
        boxes={[
          { ...DRIVER, tag: 'S01 ~ S12', note: '경기장 둘레 150 ~ 992 m(계산)' },
          LB_DRIVER,
          LB_INGEST,
          { ...RIDER, tag: 'STADIUM × 20 · SEOYUN', note: '경기장은 셀 5:5 · 1800ms 동안' },
          LB_RIDER,
          { ...INGEST, note: '경기장 기사의 셀 → 셀을 맡은 노드' },
          { ...DISPATCH, note: '빈 기사가 없으면 5초 뒤 다시' },
          { ...INDEX, note: '노드 1 이 9칸 가운데 5칸(계산)' },
          { ...RECORD, note: '12명 모두 제안 중 → 운행 중' },
          { ...REQUESTS, note: '요청 21개 · 키마다 하나' },
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
          'guide — 배정 12 · 실패 알림 8(받은 뒤 45000ms, 그때 1 km 안의 빈 기사 0) · 두 제안을 함께 받은 기사 0 · 손님 둘에게 간 기사 0',
          'lock — 101050ms 의 장애 조치로 마지막 1000ms 의 잠금을 잃자, 기사 8명이 두 제안을 받고 손님 둘에게 감',
          '서윤 — 경기장에서 먼 곳의 요청 r21 은 받은 뒤 2000ms 에 o01 에게 배정',
          '계산 — r3 ~ r12 는 100100 ~ 101000ms, r13 ~ r20 은 101100 ~ 101800ms 에 옴(100ms 마다) · 기사 위치 갱신 120건 = 20 + 50 + 50',
        ]}
      />
    </C4DynamicDiagram>
  );
}

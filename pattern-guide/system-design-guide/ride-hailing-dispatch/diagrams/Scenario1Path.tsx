// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 서버 · 앱 · 저장소 하나씩이라 RoleBox 로 그린다(_dispatch-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 앱의 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(60000 · 63000ms, d02 450m · d01 672m, 만료 75000ms, 받은 뒤 3000ms).
// 55250ms 는 d02 의 마지막 위치 갱신으로 250 + 5000 × 11 의 계산이다(code/ 의 첫 갱신 250ms × 기사 순서 · EVERY).
// 셀 2:2 를 노드 2 가 맡는 것은 code/ 의 hash · owner 로 셈한 값이다. 배지 번호는 본문 시나리오 1 의 단계 번호와 같다.
//
// 주장: 기사 앱의 위치 갱신은 셀을 맡은 위치 인덱스 노드에 덮어써지고, 민지의 요청은 요청 기록 저장소에 먼저 적힌 뒤
// 둘레 9칸을 읽어 이웃 셀의 d02 를 고른다. d02 의 기사 기록에 조건부 쓰기로 점유를 잡아 제안하고, 63000ms 의 수락이
// 조건부 쓰기로 운행 중이 되어 받은 뒤 3000ms 에 배정된다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import {
  Boxes, DISPATCH, DRIVER, INDEX, INGEST, LB_DRIVER, LB_INGEST, LB_RIDER, Lane, PATH, RECORD, REQUESTS, RIDER, VIA, W,
} from './_dispatch-layout';

const LANES = [
  { ...VIA.locateIn, lines: ['HTTPS POST · 5초마다', '마지막 55250ms(계산)'], lx: 174, ly: 262, anchor: 'start' as const, order: 1, bx: 70, by: 225 },
  { ...VIA.locateOut, lines: [], lx: 124, ly: 315 },
  { ...PATH.write, lines: ['쓰기 · 55250ms', '노드 2 · 셀 2:2'], lx: 134, ly: 482, anchor: 'start' as const, order: 1, bx: 100, by: 490 },
  { ...VIA.requestIn, lines: ['HTTPS POST · 60000ms', 'k-minji'], lx: 674, ly: 84 },
  { ...VIA.requestOut, lines: [], lx: 543, ly: 130, order: 2, bx: 480, by: 230 },
  { ...PATH.key, lines: ['쓰기 · 60000ms', 'k-minji → r0'], lx: 798, ly: 462, anchor: 'start' as const, order: 2, bx: 770, by: 470 },
  { ...PATH.search, lines: ['읽기 · 60000ms · 9칸', 'd02 450 m · d01 672 m'], lx: 260, ly: 482, anchor: 'start' as const, order: 3, bx: 236, by: 530 },
  { ...PATH.hold, lines: ['읽기 · 60000ms d02 · d01 대기', '조건부 쓰기 · 60000ms 제안 1행', '63000ms 수락 1행'], lx: 466, ly: 482, anchor: 'start' as const, order: 4, bx: 440, by: 520 },
  { ...PATH.offer, dashed: true, lines: ['앱 연결 · 제안', '60000ms', '만료 75000ms'], lx: 300, ly: 205, order: 4, bx: 362, by: 260 },
  { ...VIA.acceptIn, lines: ['HTTPS POST · 63000ms 수락'], lx: 232, ly: 98, anchor: 'start' as const, order: 5, bx: 348, by: 162 },
  { ...VIA.acceptOut, lines: [], lx: 369, ly: 130 },
  { ...PATH.result, dashed: true, lines: ['앱 연결 · 배정', '63000ms', '받은 뒤 3000ms'], lx: 610, ly: 205, order: 5, bx: 550, by: 260 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={830} title="시나리오 1 — 민지의 요청이 받은 뒤 3000ms 에 이웃 셀의 d02 에게 배정된다">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="적고, 9칸을 읽고, 조건부 쓰기로 잡고, 조건부 쓰기로 정한다" />
      <Boxes
        boxes={[
          { ...DRIVER, tag: 'D02', note: '셀 2:2 · 민지에게서 450 m' },
          LB_DRIVER,
          LB_INGEST,
          { ...RIDER, tag: 'MINJI', note: '셀 3:2 · 60000ms 에 요청' },
          LB_RIDER,
          { ...INGEST, note: '셀 2:2 → 노드 2' },
          { ...DISPATCH, note: '9칸에서 d02 를 고름' },
          { ...INDEX, note: '노드 2 에 d02 · 노드 1 에 d01' },
          { ...RECORD, note: 'd02 대기 → 제안 중 → 운행 중' },
          { ...REQUESTS, note: 'k-minji → r0' },
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
          '실행 출력 — 60000ms 에 r0 을 적고 9칸에서 d02 450 m · d01 672 m, d02 에게 제안(1행, 만료 75000ms)',
          '실행 출력 — 63000ms 에 d02 가 수락(1행) → 받은 뒤 3000ms 에 배정',
          '계산 — d02 의 마지막 위치 갱신 55250ms = 250 + 5000 × 11',
          '가정 — 모형의 저장소 · 네트워크 지연은 0',
        ]}
      />
    </C4DynamicDiagram>
  );
}

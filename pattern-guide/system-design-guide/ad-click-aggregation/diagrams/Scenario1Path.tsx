// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ad-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 앱의 클릭 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(30000 · 30050 · 30051 · 65006 · 65008 · 70000 · 70001ms).
// 앱과 광고 서버 사이 50ms, 워터마크 5초, 체크포인트 10초는 이 가이드의 가정 · 설정이다(code/ 의 APP_NET · BOUND · EVERY).
// 배지 번호는 본문 시나리오 1 의 단계 번호와 같다.
//
// 주장: A 의 클릭 하나는 클릭 ID 30051 을 받아 파티션 4 에 쓰이고, 작업 4 가 처음 보는 ID 라 0분의 부분합에 더한다.
// 모든 파티션의 워터마크가 0분의 끝을 지난 65008ms 에 합쳐져 트랜잭션에 들어가고, 70000ms 의 체크포인트에 커밋되어
// 분이 끝나고 10001ms 뒤 결과 표에 보인다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { ADSRV, APP, Boxes, CKPT, CLICKS, JOB, LB, Lane, PATH, RTOPIC, TABLE, W } from './_ad-layout';

const LANES = [
  { from: { x: 224, y: 155 }, to: { x: 250, y: 155 }, lines: ['HTTP 요청', '30000ms 보냄'], lx: 290, ly: 82, order: 1, bx: 237, by: 222 },
  { from: { x: 330, y: 155 }, to: { x: 356, y: 155 }, lines: ['HTTP 전달'], lx: 338, ly: 196, anchor: 'start' as const },
  { ...PATH.produce, lines: ['Kafka 쓰기', '30050ms', '키 = 클릭 ID 30051'], lx: 622, ly: 117, order: 2, bx: 622, by: 178 },
  { ...PATH.consume, lines: ['Kafka 읽기 · 30051ms', '처음 보는 클릭 ID'], lx: 776, ly: 250, anchor: 'end' as const, order: 3, bx: 810, by: 270 },
  { ...PATH.commit, lines: ['트랜잭션 쓰기', '65008ms', '광고 1001 의', '0분 = 1'], lx: 622, ly: 330, order: 4, bx: 622, by: 424 },
  { ...PATH.snapshot, lines: ['체크포인트 · 70000ms', '상태 · 읽은 위치 저장', '트랜잭션 커밋'], lx: 776, ly: 480, anchor: 'end' as const, order: 5, bx: 810, by: 500 },
  { ...PATH.load, lines: ['read_committed', '70001ms 에 읽음'], lx: 290, ly: 372, order: 6, bx: 290, by: 424 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={720} title="시나리오 1 — 클릭 하나가 0분의 결과 행이 되는 길">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="클릭 하나는 분이 끝나고 10001ms 뒤 결과 행 하나가 된다" />
      <Boxes
        boxes={[
          { ...APP, w: 200, tag: 'A', note: '광고 1001 을 누름' },
          { ...LB },
          { ...ADSRV, tag: 'AD SERVER', note: '30050ms 서명 확인 · 클릭 시각' },
          { ...CLICKS, tag: 'PARTITION 4', note: '30050ms 에 쓰임' },
          { ...JOB, tag: 'TASK 4 → SUM', note: '부분합 1 · 65008ms 합침' },
          { ...RTOPIC, note: '70000ms 에 커밋' },
          { ...TABLE, note: '(광고 1001, 0분)=1' },
          { ...CKPT, note: '70000ms 상태 · 읽은 위치' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={500}
        width={620}
        label="0분이 끝난 60000ms 에서 결과가 보이기까지 10001ms"
        tone="sunken"
        lines={[
          '모든 파티션에서 클릭 시각 65000 이상을 읽음 → 65008ms (+5008)',
          '그다음 체크포인트가 끝나 트랜잭션이 커밋됨 → 70000ms (+4992)',
          '결과 표가 커밋된 결과를 읽어 덮어씀 → 70001ms (+1)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

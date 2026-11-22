// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ad-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 집계 작업이 멈춘 동안에도 클릭은 앞단의 부하 분산과 광고 서버를 지나 클릭 토픽에 쌓이므로, 개념도 밖 배포 세부인
// 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0). 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 3 줄(840000 · 845008 · 847000 · 877000 · 877628 · 880000 · 880001ms,
// guide · no-transaction · at-least-once 합계). 멈춘 뒤 다시 시작하기까지 30초는 이 가이드의 가정이다(code/ 의 DOWN).
// 배지 번호는 본문 시나리오 3 의 단계 번호와 같다.
//
// 주장: 집계 작업이 체크포인트 7초 뒤에 멈추면 열린 트랜잭션의 6000 건은 커밋되지 않아 결과 표가 읽지 않는다.
// 다시 시작한 작업은 840000ms 의 사본과 읽은 위치에서 11999 건을 다시 읽어 같은 결과를 내고, 13분의 수가 한 번만 보인다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { ADSRV, APP, Badge, Boxes, CKPT, CLICKS, JOB, LB, Lane, PATH, RTOPIC, TABLE, W } from './_ad-layout';

const LANES = [
  { from: { x: 224, y: 155 }, to: { x: 250, y: 155 }, lines: ['HTTP 요청', '초당 1000 건'], lx: 290, ly: 82 },
  { from: { x: 330, y: 155 }, to: { x: 356, y: 155 }, lines: ['HTTP 전달'], lx: 338, ly: 196, anchor: 'start' as const },
  { ...PATH.produce, lines: ['Kafka 쓰기', '멈춘 동안에도', '계속 쌓임'], lx: 622, ly: 117 },
  { ...PATH.consume, lines: ['Kafka 읽기 · 877000ms', '840000ms 의 위치부터', '11999 건을 다시 읽음'], lx: 776, ly: 250, anchor: 'end' as const, order: 4, bx: 810, by: 270 },
  { from: { x: 860, y: 430 }, to: { x: 860, y: 560 }, lines: ['상태 사본', '840000ms'], lx: 848, ly: 470, anchor: 'end' as const, order: 1, bx: 876, by: 520 },
  { from: { x: 720, y: 560 }, to: { x: 720, y: 430 }, lines: ['877000ms', '사본을 읽음'], lx: 708, ly: 490, anchor: 'end' as const },
  { from: { x: 688, y: 375 }, to: { x: 556, y: 375 }, dashed: true, lines: ['열린 트랜잭션', '6000 건 · 커밋 안 됨'], lx: 600, ly: 322, order: 2, bx: 534, by: 333 },
  { from: { x: 688, y: 412 }, to: { x: 556, y: 412 }, lines: ['다시 낸 6000 건', '880000ms 커밋'], lx: 630, ly: 444, order: 5, bx: 568, by: 449 },
  { ...PATH.load, lines: ['read_committed', '880001ms 13분'], lx: 290, ly: 377 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={760} title="시나리오 3 — 집계 작업이 체크포인트 사이에 멈출 때">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="커밋되지 않은 결과는 보이지 않고, 다시 읽어 한 번만 커밋한다" />
      <Boxes
        boxes={[
          { ...APP, note: '평소처럼 누름' },
          { ...LB },
          { ...ADSRV, note: '받은 즉시 씀' },
          { ...CLICKS, note: '읽어도 기록이 남음 · 3일 보관' },
          { ...JOB, note: '847000 멈춤 → 877000 다시' },
          { ...RTOPIC, note: '열린 트랜잭션은 읽히지 않음' },
          { ...TABLE, note: '13분이 한 번만 보임' },
          { ...CKPT, note: '840000ms 의 사본' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Badge x={676} y={326} n={3} />
      <Callout
        x={GUTTER}
        y={530}
        width={620}
        label="같은 사건열을 다른 구조로 실행한 비교 (실행 출력)"
        tone="sunken"
        lines={[
          '이 가이드: 13분 60000 · 따로 센 5000 (실제 5000)',
          '트랜잭션 없이 (no-transaction): 따로 센 10000 (실제 5000)',
          '최소 한 번 (at-least-once): 13분 120000 (실제 60000), 따로 센 0',
        ]}
      />
    </C4DynamicDiagram>
  );
}

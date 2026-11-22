// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ad-layout.tsx). 상자 이름은 개념도와 같고, 광고 서버는
// 받은 즉시 쓰는 여덟 대(a · d … j)와 5초 동안 클릭을 모아 둔 두 대(b · c)의 인스턴스 둘로 나눴다(명세 SD11, 1.1.0).
// 앱의 클릭 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다. 코드는 부하 분산을
// 흉내 내지 않고, 광고 서버는 클릭 번호 % 10 으로 정한다(code/ 의 generate).
// 출처: code/expected-output.txt 의 시나리오 2 줄(guide · by-ad · no-dedup · processing-time, 300000 · 300316 · 842000ms).
// 피크 초당 1만 건 · 광고 7 의 몫 30% · 다시 보내는 앱 1% · b · c 가 모아 둔 5초는 이 가이드의 가정이다.
// 배지 번호는 본문 시나리오 2 의 단계 번호와 같다.
//
// 주장: 피크에 광고 7 로 클릭의 30% 가 몰려도 클릭 ID 로 나눈 파티션마다 초당 1241 건이라 2분의 결과가 2분이 끝나고
// 10001ms 뒤에 보인다. 두 번 온 6000 건은 같은 파티션의 작업이 거르고, b 가 늦게 넘긴 5000 건은 2분의 행을 덮어쓰며,
// 2분이 끝나고 11분 2초 뒤에 넘어온 c 의 5000 건은 2분을 고치지 않고 따로 세어진다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { ADSRV, APP, Boxes, CLICKS, JOB, LB, Lane, PATH, RTOPIC, TABLE, W } from './_ad-layout';

const LANES = [
  { from: { x: 224, y: 155 }, to: { x: 250, y: 155 }, lines: ['HTTP 요청', '초당 10000 건'], lx: 290, ly: 82 },
  { from: { x: 330, y: 155 }, to: { x: 356, y: 155 }, lines: ['HTTP 전달'], lx: 338, ly: 197, anchor: 'start' as const },
  { from: { x: 330, y: 255 }, to: { x: 356, y: 255 }, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.produce, lines: ['Kafka 쓰기', '키 = 클릭 ID', '파티션 8개에 고르게'], lx: 622, ly: 117, order: 1, bx: 622, by: 178 },
  { from: { x: 556, y: 255 }, to: { x: 730, y: 190 }, waypoints: [{ x: 730, y: 255 }], dashed: true, lines: ['Kafka 쓰기가 늦음', 'b · 300000ms', 'c · 842000ms'], lx: 640, ly: 212, order: 4, bx: 578, by: 280 },
  { ...PATH.consume, lines: ['Kafka 읽기', '같은 클릭 ID 는', '같은 파티션 · 같은 작업'], lx: 776, ly: 268, anchor: 'end' as const, order: 3, bx: 810, by: 300 },
  { ...PATH.commit, lines: ['트랜잭션 쓰기', '2분이 닫힐 때', '늦은 클릭마다 다시', '아주 늦으면 따로'], lx: 622, ly: 330, order: 2, bx: 622, by: 424 },
  { ...PATH.load, lines: ['read_committed', '결과 ID 로 덮어씀', '아주 늦으면 따로 셈'], lx: 290, ly: 362, order: 5, bx: 290, by: 424 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={640} title="시나리오 2 — 피크 1분에 한 광고로 몰리고, 두 번 오고, 늦게 오는 클릭">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="클릭 ID 로 나누고 거르면, 몰려도 늦어도 한 번씩 센다" />
      <Boxes
        boxes={[
          { ...APP, tag: 'APPS', note: '1% 는 1초 뒤 다시 보냄' },
          { ...LB, h: 185 },
          { ...ADSRV, tag: 'AD SERVER a · d … j', note: '받은 즉시 씀' },
          { ...ADSRV, y: 215, tag: 'AD SERVER b · c', note: '120000~124999ms 분을 모아 둠' },
          { ...CLICKS, tag: 'PARTITIONS 0 … 7', note: '가장 바쁜 파티션 초당 1241 건' },
          { ...JOB, tag: 'TASKS 0 … 7 → SUM', note: '두 번 온 6000 건을 거름' },
          { ...RTOPIC, note: '다시 낸 결과 5000 건' },
          { ...TABLE, note: '2분 590000 → 595000' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={480}
        width={W - GUTTER * 2}
        label="같은 사건열을 다른 구조로 실행한 비교 (실행 출력)"
        tone="sunken"
        lines={[
          '광고 ID 로 나눔 (by-ad): 광고 7 의 파티션이 초당 3840 건을 받아, 2분이 끝나고 56444ms 뒤에 보임',
          '클릭 ID 로 거르지 않음 (no-dedup): 두 번 보낸 6000 건을 더 셈',
          '처리 시각으로 묶음 (processing-time): 2분 589991 (실제 595000) · 5분 65000 (실제 60000)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

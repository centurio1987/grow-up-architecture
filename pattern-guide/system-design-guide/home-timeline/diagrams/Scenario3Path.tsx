// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_home-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 앱의 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 코드는 부하 분산을 흉내 내지 않는다. 멈춘 캐시 노드 대신 빈 노드가 곧바로 그 자리를 맡는 것은 이 가이드의 가정이다.
// 출처: code/expected-output.txt 의 시나리오 3 줄(120000 · 120030 · 120032 · 121399 · 125000 · 126000 · 127000ms,
// no-marker · list 줄). 다시 만든 읽기의 118ms 를 나눈 2 · 10 · 1ms 는 code/ 의 STORE_RT · FOLLOWS ÷ LISTS_PER_MS · CACHE_RT 다.
// 배지 번호는 본문 시나리오 3 의 단계 번호와 같다.
//
// 주장: 캐시 노드 0 이 멈추면 그 노드의 타임라인 25002개와 완성 표시가 함께 사라진다. 실패한 퍼뜨리기 작업은 1000ms 뒤 큐 끝에
// 다시 들어가 처음 팔로워부터 다시 쓰고, 같은 글을 24곳에 다시 넣지만 정렬 집합이라 한 번만 남는다. 완성 표시가 없는 캐럴의 타임라인은
// 읽을 때 작성자 글 목록 200곳으로 다시 만들어 빠진 글 0 으로 답한다.
// 콜아웃은 실행 출력 줄과 계산 줄을 나눠 적는다(118ms 는 실행 출력, 2 · 10 · 1ms 는 가정값).
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Badge, Boxes, CACHE, GRAPH, LB, Lane, PATH, POSTS, QUEUE, READER, STORE, W, WORKER } from './_home-layout';

const LANES = [
  { from: { x: 224, y: 140 }, to: { x: 250, y: 140 }, lines: ['POST 120000ms', 'GET 125000 · 126000ms'], lx: 255, ly: 84, order: 1, bx: 165, by: 92 },
  { from: { x: 330, y: 140 }, to: { x: 356, y: 140 }, lines: ['HTTP 전달 · 120000ms'], lx: 332, ly: 106, anchor: 'start' as const },
  { from: { x: 290, y: 210 }, waypoints: [{ x: 290, y: 268 }, { x: 160, y: 268 }], to: { x: 160, y: 330 }, lines: ['HTTP GET', '캐럴 · 데이브'], lx: 280, ly: 234, anchor: 'end' as const, order: 5, bx: 312, by: 250 },
  { ...PATH.store, lines: ['글 쓰기 · 120000ms', '앨리스의 새 글'], lx: 622, ly: 112 },
  { ...PATH.enqueue, lines: ['작업 넣기', '120000ms'], lx: 466, ly: 240, anchor: 'start' as const },
  { ...PATH.take, lines: ['작업 꺼내기', '다시 넣은 뒤 차례가 오면'], lx: 446, ly: 462, anchor: 'end' as const },
  { from: { x: 520, y: 550 }, to: { x: 520, y: 430 }, dashed: true, lines: ['쓰기 실패 120032ms', '121032ms 큐 끝으로'], lx: 530, ly: 452, anchor: 'start' as const, order: 3, bx: 488, by: 490 },
  { ...PATH.graph, lines: ['읽기 · 작업마다', '다시 실행 때도'], lx: 622, ly: 572 },
  { ...PATH.write, lines: ['다시 ZADD', '24곳은 이미 있음'], lx: 290, ly: 572, order: 4, bx: 290, by: 628 },
  { ...PATH.range, lines: ['완성 표시 없음 → 다시 만듦', 'ZADD 66개 · ZRANGE'], lx: 134, ly: 452, anchor: 'start' as const, order: 5, bx: 100, by: 490 },
  { ...PATH.lists, lines: ['작성자 글 목록 200곳 · 10ms', '다시 만들 때 (가정한 속도)'], lx: 568, ly: 250, anchor: 'start' as const, order: 6, bx: 548, by: 258 },
  { ...PATH.follows, lines: ['팔로우 목록 200곳 · 2ms'], lx: 600, ly: 534, anchor: 'start' as const, order: 6, bx: 582, by: 530 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={812} title="시나리오 3 — 캐시 노드 0 이 퍼뜨리는 도중 멈출 때">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="완성 표시가 없는 타임라인은 다시 만들고, 다시 넣은 글은 한 번만 남는다" />
      <Boxes
        boxes={[
          { ...APP, tag: 'ALICE · CAROL · DAVE', note: '씀 · 캐럴과 데이브가 엶' },
          { ...LB },
          { ...POSTS, note: 'id 발급 · 120000ms' },
          { ...STORE, note: '작성자 글 목록은 그대로' },
          { ...READER, note: '요청 뒤 118ms 만에 답함' },
          { ...QUEUE, note: '실패한 작업을 다시 넣음' },
          { ...CACHE, tag: 'NODE 0 · REPLACED', note: '120030ms 25002개 사라짐' },
          { ...WORKER, note: '121399ms 에 다시 끝냄' },
          { ...GRAPH, note: '팔로우 목록은 그대로' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Badge x={236} y={560} n={2} />
      <Callout
        x={GUTTER}
        y={690}
        width={864}
        label="같은 사건열을 다른 구조로 계산한 비교와 118ms 의 내역"
        tone="sunken"
        lines={[
          '실행 출력 — 완성 표시를 보지 않고 남은 것을 그대로 읽었다면 캐럴의 page 1 은 2개, 빠진 글 18개 (no-marker)',
          '실행 출력 — 리스트처럼 같은 ID 를 거르지 않았다면 밥의 page 1 에 앨리스의 새 글이 두 번 (list: x2, repeated=1)',
          '계산 — 다시 만든 읽기 118ms(실행 출력) = 105 + 팔로우 목록 2 + 작성자 글 목록 10 + 캐시에 넣기 1 (2 · 10 · 1 은 가정값)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

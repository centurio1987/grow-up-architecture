// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_home-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 앱의 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 2 줄(90000 · 90500 · 91000 · 96000 · 97000ms, read-all · offset · fan-out-all 줄).
// 팔로워 수는 코드의 축소 모형 값이다(실제의 1000분의 1 — star 의 100000 은 실제 1억 명, 기준 2000 은 실제 200만 명).
// 설계는 큰 계정 표시를 읽고, 모형은 큰 계정 표시 대신 팔로워 수로 그때마다 센다.
// 배지 번호는 본문 시나리오 2 의 단계 번호와 같다.
//
// 주장: star 의 글은 글 저장소의 star 의 글 목록에만 들어가고 작업자는 큰 계정 표시를 보고 건너뛴다. 밥의 다음 페이지는 max_id 아래의
// 20개라 page 1 과 겹치지 않고, 새 글 5개는 since_id 위로 따로 받는다. 모두에게 퍼뜨렸다면 그 글 하나가 50134ms 걸린다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Boxes, CACHE, GRAPH, LB, Lane, PATH, POSTS, QUEUE, READER, STORE, W, WORKER } from './_home-layout';

const LANES = [
  { from: { x: 224, y: 140 }, to: { x: 250, y: 140 }, lines: ['GET 90000 · 96000 · 97000ms', 'POST 90500 ~ 94000ms'], lx: 240, ly: 84, order: 1, bx: 138, by: 92 },
  { from: { x: 330, y: 140 }, to: { x: 356, y: 140 }, lines: ['HTTP 전달 · 90500 ~ 94000ms'], lx: 332, ly: 106, anchor: 'start' as const },
  { from: { x: 290, y: 210 }, waypoints: [{ x: 290, y: 268 }, { x: 160, y: 268 }], to: { x: 160, y: 330 }, lines: ['HTTP GET', 'max_id · since_id'], lx: 280, ly: 234, anchor: 'end' as const },
  { ...PATH.store, lines: ['star 글 · 90500ms', 'star 의 글 목록에 추가'], lx: 622, ly: 112, order: 2, bx: 622, by: 176 },
  { ...PATH.enqueue, lines: ['작업 넣기', '글마다 · 5건'], lx: 466, ly: 240, anchor: 'start' as const },
  { ...PATH.take, lines: ['작업 꺼내기', 'star 의 작업은', '큰 계정 표시를 보고 끝냄'], lx: 446, ly: 462, anchor: 'end' as const, order: 2, bx: 480, by: 470 },
  { ...PATH.graph, lines: ['읽기 · star 의', '큰 계정 표시'], lx: 622, ly: 572, order: 2, bx: 622, by: 628 },
  { ...PATH.write, lines: ['ZADD · 밥에게 4건', '일반 계정의 글만'], lx: 290, ly: 572, order: 3, bx: 290, by: 628 },
  { ...PATH.range, lines: ['ZRANGE BYSCORE REV', '96000ms max_id 아래 20개', '97000ms since_id 위 4개'], lx: 134, ly: 452, anchor: 'start' as const, order: 4, bx: 100, by: 490 },
  { ...PATH.lists, lines: ['star 의 글 목록', '96000ms 0개 · 97000ms 1개'], lx: 568, ly: 250, anchor: 'start' as const, order: 5, bx: 548, by: 258 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={812} title="시나리오 2 — 큰 계정이 쓰는 동안 밥이 페이지를 넘긴다">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="큰 계정의 글은 읽을 때 섞고, 다음 페이지는 max_id 로 넘긴다" />
      <Boxes
        boxes={[
          { ...APP, tag: 'STAR · BOB', note: 'star 가 씀 · 밥이 넘김' },
          { ...LB },
          { ...POSTS, note: 'id 발급 · 작업 넣기' },
          { ...STORE, note: 'star 의 글 목록에 1건' },
          { ...READER, note: '캐시 + star 의 글 목록' },
          { ...QUEUE, note: '작업 5건' },
          { ...CACHE, note: '밥의 캐시에 4건 더' },
          { ...WORKER, note: 'star 의 글은 건너뜀' },
          { ...GRAPH, note: 'star 에 큰 계정 표시' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={690}
        width={864}
        label="같은 사건열을 다른 구조로 계산한 비교 (실행 출력)"
        tone="sunken"
        lines={[
          '오프셋 20 으로 page 2 를 읽었다면 20개 가운데 5개가 page 1 과 겹침 (offset: repeated=5) — max_id 로는 0',
          'star 의 글을 모두에게 퍼뜨렸다면 활성 팔로워 50000명까지 50134ms 걸리고, 그 뒤 앨리스의 글은 밥에게 50035ms 뒤',
          '작성자 글 목록 201곳을 읽어 모아도 page 1 은 같음 (read-all) — 이 가이드는 캐시 1번과 star 의 글 목록 1번',
        ]}
      />
    </C4DynamicDiagram>
  );
}

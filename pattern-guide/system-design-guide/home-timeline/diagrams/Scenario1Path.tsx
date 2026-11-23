// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_home-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 앱의 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(70000 · 70099 · 75000ms, answered 105ms later).
// 읽기 안의 요청 뒤 걸린 시간(50 · 51 · 53 · 55ms)은 code/ 의 NET · CACHE_RT · STORE_RT 를 차례로 더한 계산이다.
// 사용자 수 · 처리량 · 큰 계정 기준은 코드의 축소 모형 값이다(실제의 1000분의 1 — 기준 2000 은 실제 200만 명).
// 앨리스의 팔로워 200명은 줄이지 않은 값이다. 제목의 99ms 는 70099 − 70000 의 계산이라 제목에 (계산)을 붙인다.
// 설계는 큰 계정 표시를 읽고, 모형은 큰 계정 표시 대신 팔로워 수로 그때마다 센다(출력의 200 followers is not above 2000).
// 배지 번호는 본문 시나리오 1 의 단계 번호와 같다.
//
// 주장: 앨리스의 글 하나는 글 저장소에 쓰이고 작업 하나로 큐에 들어가, 작업자가 30일 안에 접속한 팔로워 100명의 캐시에만
// 70000 ~ 70099ms 에 넣는다. 5초 뒤 밥의 읽기는 캐시 한 번과 큰 계정의 글 목록 한 번, 본문 한 번을 읽어 105ms 뒤에 답한다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Boxes, CACHE, GRAPH, LB, Lane, PATH, POSTS, QUEUE, READER, STORE, W, WORKER } from './_home-layout';

const LANES = [
  { from: { x: 224, y: 140 }, to: { x: 250, y: 140 }, lines: ['POST 70000ms', 'GET 75000ms'], lx: 280, ly: 84, order: 1, bx: 224, by: 92 },
  { from: { x: 330, y: 140 }, to: { x: 356, y: 140 }, lines: ['HTTP 전달 · 70000ms'], lx: 332, ly: 106, anchor: 'start' as const },
  { from: { x: 290, y: 210 }, waypoints: [{ x: 290, y: 268 }, { x: 160, y: 268 }], to: { x: 160, y: 330 }, lines: ['HTTP GET', '요청 뒤 50ms'], lx: 280, ly: 234, anchor: 'end' as const, order: 4, bx: 312, by: 250 },
  { ...PATH.store, lines: ['글 쓰기 · 70000ms', 'id=293601284096'], lx: 622, ly: 112, order: 1, bx: 622, by: 176 },
  { ...PATH.enqueue, lines: ['작업 넣기', '70000ms'], lx: 466, ly: 240, anchor: 'start' as const },
  { ...PATH.take, lines: ['작업 꺼내기', '70000ms'], lx: 446, ly: 462, anchor: 'end' as const, order: 2, bx: 480, by: 470 },
  { ...PATH.graph, lines: ['읽기 · 70000ms', '큰 계정 표시 없음', '팔로워 200명', '100명 건너뜀'], lx: 622, ly: 542, order: 2, bx: 622, by: 628 },
  { ...PATH.write, lines: ['ZADD 100번', '70000 ~ 70099ms'], lx: 290, ly: 572, order: 3, bx: 290, by: 628 },
  { ...PATH.range, lines: ['ZRANGE BYSCORE REV', '요청 뒤 51ms(계산)'], lx: 134, ly: 452, anchor: 'start' as const, order: 4, bx: 100, by: 490 },
  { ...PATH.lists, lines: ['star 의 글 목록 · 요청 뒤 53ms(계산)', '본문 20개 · 요청 뒤 55ms(계산)'], lx: 568, ly: 250, anchor: 'start' as const, order: 5, bx: 548, by: 258 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={812} title="시나리오 1 — 앨리스의 글 하나가 밥의 첫 페이지에 오르기까지">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="글은 쓰인 뒤 99ms(계산) 만에 캐시 100곳으로, 읽기는 105ms 만에 끝난다" />
      <Boxes
        boxes={[
          { ...APP, tag: 'ALICE · BOB', note: '70000ms 씀 · 75000ms 엶' },
          { ...LB },
          { ...POSTS, note: 'id 발급 · 70000ms' },
          { ...STORE, note: '앨리스의 글 목록에 추가' },
          { ...READER, note: '캐시 20개 + star 0개' },
          { ...QUEUE, note: '앨리스의 글 작업 하나' },
          { ...CACHE, note: '밥 · 캐럴 … 100명' },
          { ...WORKER, note: '30일 안 접속 100명에게' },
          { ...GRAPH, note: '데이브는 40일 전 접속' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={690}
        width={864}
        label="밥이 연 뒤 첫 페이지를 받기까지 105ms (가정한 왕복 시간의 합)"
        tone="sunken"
        lines={[
          '앱 → 부하 분산 → 타임라인 서비스 50ms · 캐시에서 글 ID 20개 1ms · 팔로우한 큰 계정 star 의 글 목록 2ms',
          '글 저장소에서 본문 20개 2ms · 타임라인 서비스 → 앱 50ms  =  50 + 1 + 2 + 2 + 50 = 105ms',
          '실행 출력 — 맨 위는 앨리스의 글 id=293601284096, 쓰이고 5000ms 뒤에 연 읽기에서 빠진 글 0 (missing=0)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

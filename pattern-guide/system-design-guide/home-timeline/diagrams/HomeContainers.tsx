// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_home-layout.tsx) — 글을 쓰고 읽는 앱은 person, 여러 대가 뜨는
// 글 서비스 · 타임라인 서비스 · 퍼뜨리기 작업자는 container, 작업을 쌓아 두는 퍼뜨리기 큐는 queue,
// 글 저장소 · 팔로우 그래프 · 타임라인 캐시는 database.
// 출처: 리서치 노트 system-design-home-timeline-2026-11-22 1절(추천 구조) · 4-1(쓰기 때 퍼뜨리기) · 4-2(읽을 때 모으기) ·
// 4-3(큰 계정과 혼합) · 4-4(타임라인 캐시의 모양) · 4-5(비활성 사용자) · 4-6(순서와 커서 페이지).
// 큰 계정 기준 200만 명, 활성 30일, 캐시 길이 800, 페이지 20개는 이 가이드의 설정이다(code/ 의 BIG · ACTIVE · KEEP · PAGE —
// 코드는 사용자 수를 1000분의 1로 줄여 BIG 이 2000 이다).
//
// 주장: 글 서비스는 글을 글 저장소에 쓰고 작업을 퍼뜨리기 큐에 넣는다. 퍼뜨리기 작업자는 큰 계정 표시가 없는 계정의 글만
// 30일 안에 접속한 팔로워의 타임라인 캐시에 넣는다. 타임라인 서비스는 캐시에서 글 ID 를 읽고 팔로우한 큰 계정의 글 목록을 섞으며,
// 페이지는 글 ID 경계(max_id · since_id)로 넘긴다. 쓰기가 실패한 작업은 퍼뜨리기 큐에 다시 넣는다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Boxes, CACHE, GRAPH, Lane, PATH, POSTS, QUEUE, READER, STORE, W, WORKER } from './_home-layout';

const LANES = [
  { ...PATH.post, lines: ['HTTP POST', '글을 쓸 때마다'], lx: 290, ly: 112 },
  { ...PATH.store, lines: ['쓰기 · 글마다', '본문 · 작성자 글 목록'], lx: 622, ly: 112 },
  { ...PATH.enqueue, lines: ['작업 넣기', '글마다'], lx: 466, ly: 240, anchor: 'start' as const },
  { ...PATH.take, lines: ['작업 꺼내기', '쉬지 않고'], lx: 446, ly: 462, anchor: 'end' as const },
  { ...PATH.graph, lines: ['읽기 · 작업마다', '큰 계정 표시', '팔로워 · 접속 시각'], lx: 622, ly: 557 },
  { from: { x: 520, y: 550 }, to: { x: 520, y: 430 }, dashed: true, lines: ['작업 다시 넣기', '쓰기가 실패할 때'], lx: 530, ly: 452, anchor: 'start' as const },
  { ...PATH.write, lines: ['ZADD · 자르기', '활성 팔로워마다'], lx: 290, ly: 572 },
  { ...PATH.open, lines: ['HTTP GET', '열 때 · 페이지마다'], lx: 134, ly: 256, anchor: 'start' as const },
  { ...PATH.range, lines: ['ZRANGE BYSCORE REV', '읽을 때마다', '다시 만들 때 ZADD'], lx: 134, ly: 452, anchor: 'start' as const },
  { ...PATH.lists, lines: ['큰 계정의 글 목록 · 본문 읽기', '읽을 때마다', '다시 만들 때 작성자 글 목록 200곳'], lx: 568, ly: 242, anchor: 'start' as const },
  { ...PATH.follows, lines: ['접속 시각 쓰기 · 읽을 때마다', '팔로우 목록 읽기 · 다시 만들 때'], lx: 690, ly: 452, anchor: 'start' as const },
];

export default function HomeContainers() {
  return (
    <C4ContainerDiagram width={W} height={812} title="홈 타임라인의 여덟 실행 단위">
      <DiagramHeader eyebrow="Home timeline · containers" title="일반 계정의 글은 쓸 때 퍼뜨리고, 큰 계정의 글은 읽을 때 섞는다" />
      <Boxes boxes={[APP, POSTS, STORE, READER, QUEUE, CACHE, WORKER, GRAPH]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={690}
        width={864}
        label="세 가지 규칙"
        tone="sunken"
        lines={[
          '큰 계정 표시(팔로워 200만 명 초과)가 있는 계정의 글은 퍼뜨리지 않고, 읽을 때 큰 계정의 글 목록에서 섞는다',
          '30일 안에 접속한 팔로워에게만 퍼뜨리고, 완성 표시가 없거나 30일 넘게 접속하지 않은 사람의 타임라인은 읽을 때 다시 만든다',
          '페이지는 글 ID 로 넘긴다 — 다음 페이지는 max_id 보다 작은 글, 새 글은 since_id 보다 큰 글',
        ]}
      />
    </C4ContainerDiagram>
  );
}

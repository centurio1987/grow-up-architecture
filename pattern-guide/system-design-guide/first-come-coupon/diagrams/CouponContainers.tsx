// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_coupon-layout.tsx) — 사람 쪽 끝은 person,
// 여러 대가 뜨는 API 서버는 container, 저장소 둘(Redis · 쿠폰 DB)은 database, 큐는 queue, 워커는 process.
// 출처: 리서치 노트 coupon-issuance-2026-11-15 6절 집필 메모(후보 B) · 4-1(INCR) · 4-2(유니크 제약) · 4-3(큐 뒤 기록, 토스 C4).
// 화살표의 빈도 값(10ms마다 5건 · 초당 500건)은 이 가이드의 설정값이고 code/ 의 상수와 같다.
//
// 주장: 「아직 남았는가」와 「이 사람이 이미 받았는가」는 Redis 에서 명령 하나씩으로 판정하고,
// 무거운 DB 기록은 큐 뒤에서 워커가 정해 둔 속도로 한다. 화살표마다 통신 방식과 빈도가 붙는다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader } from '../../../../viz/frame/frame';
import { API, APP, Boxes, DB, Lane, PATH, QUEUE, REDIS, W, WORKER } from './_coupon-layout';

const LANES = [
  { ...PATH.request, lines: ['발급 요청 · HTTP POST', '누를 때마다'], lx: 232, ly: 258 },
  { ...PATH.answer, lines: ['성공 · 소진 · 이미 받음', '잠시 후 다시', 'HTTP 응답 · 요청마다'], lx: 232, ly: 358 },
  { ...PATH.decide, lines: ['SADD · INCR · SREM (RESP)', '소진 표시 전까지 요청마다'], lx: 407, ly: 218, anchor: 'start' as const },
  { ...PATH.enqueue, lines: ['Kafka produce', '성공 응답마다'], lx: 555, ly: 268 },
  { ...PATH.poll, lines: ['Kafka poll', '10ms마다 5건'], lx: 717, ly: 380, anchor: 'start' as const },
  { ...PATH.insert, lines: ['SQL INSERT', '유니크 제약', '초당 500건'], lx: 555, ly: 425 },
  { ...PATH.rebuild, dashed: true, lines: ['재계산 · SQL SELECT → SET · SADD (RESP)', '주 노드가 바뀐 뒤 한 번'], lx: 510, ly: 96, anchor: 'start' as const },
];

export default function CouponContainers() {
  return (
    <C4ContainerDiagram width={W} height={550} title="선착순 쿠폰을 판정하고 기록하는 여섯 실행 단위">
      <DiagramHeader eyebrow="First-come coupon · containers" title="판정은 Redis 에서 한 명령씩, 기록은 큐 뒤에서 초당 500건" />
      <Boxes boxes={[{ ...APP, note: '첫 1초 30만 건' }, { ...API, tag: 'API · SCALE OUT' }, REDIS, QUEUE, WORKER, DB]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
    </C4ContainerDiagram>
  );
}

// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_coupon-layout.tsx). Redis 는 주 노드와 복제본을 보이려고
// 두 칸으로 나눴고 이름은 개념도와 같은 「Redis」다. 사용자 앱 · 발급 큐 · 발급 워커 · 쿠폰 DB 는 자리가 개념도와 같다.
// 출처: code/expected-output.txt 의 시나리오 3 줄(300.000ms 멈춤 count=882 · 1300.000ms 승격 count=869 lost 13 ·
// as-is success=1013 db-rows=1000 db-rejected=13 · recount 1770.000ms rebuild count=882 · success=1000 db-rejected=0).
// 복제 지연 5ms 와 승격까지 1초는 이 가이드의 가정이다(code/ 의 LAG_US · FAILOVER_US).
//
// 주장: 주 노드가 확인해 준 쓰기를 복제본이 다 받지 못한 채 승격되면 카운터가 13 뒤로 가고, 같은 번호가 다시 나간다.
// DB 의 번호 유니크 제약이 과발급을 막지만 그 13명은 성공 응답만 받은 미발급으로 남는다. 승격 뒤 큐를 비우고 DB 행으로
// 다시 세면 미발급도 0 이다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Boxes, DB, Lane, PATH, QUEUE, REDIS, W, WORKER } from './_coupon-layout';

const PRIMARY = { ...REDIS, tag: 'PRIMARY · STOPPED', note: '300ms 멈춤 · count 882' };
const REPLICA = { ...REDIS, x: 560, tag: 'REPLICA → PRIMARY', note: '1,300ms 승격 · count 869' };

const LANES = [
  { ...PATH.decide, lines: ['300ms 까지 SADD · INCR', '그 뒤 1초는 오류'], lx: 383, ly: 218, anchor: 'end' as const, order: 1, bx: 395, by: 236 },
  {
    from: { x: 490, y: 125 }, to: { x: 560, y: 125 }, dashed: true,
    lines: ['비동기 복제', '5ms 늦음'], lx: 525, ly: 152, order: 2, bx: 525, by: 125,
  },
  {
    from: { x: 470, y: 260 }, to: { x: 655, y: 190 }, waypoints: [{ x: 470, y: 228 }, { x: 655, y: 228 }],
    lines: ['as-is: INCR 870~882 를', '다른 13명에게 다시 줌'], lx: 667, ly: 214, anchor: 'start' as const, order: 3, bx: 560, by: 228,
  },
  { ...PATH.answer, lines: ['as-is 성공 1,013', '잠시 후 다시'], lx: 240, ly: 340 },
  { ...PATH.enqueue, lines: ['같은 번호', '13건 포함'], lx: 555, ly: 268 },
  { ...PATH.poll, lines: ['10ms마다 5건'], lx: 717, ly: 390, anchor: 'start' as const },
  { ...PATH.insert, lines: ['번호 충돌 13건', '→ 0 rows'], lx: 555, ly: 440, order: 4, bx: 600, by: 470 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={680} title="시나리오 3 — Redis 주 노드가 멈출 때 같은 번호가 다시 나가는 길">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="주 노드가 멈추면 번호 13개가 다시 나가고, DB 가 막은 13명은 미발급" />
      <Boxes boxes={[{ ...APP, note: '멈춘 동안 잠시 후 다시' }, API, PRIMARY, REPLICA, QUEUE, WORKER, DB]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={546}
        width={W - GUTTER * 2}
        label="5 · 승격 뒤 다시 세면 (recount)"
        tone="sunken"
        lines={[
          'as-is: 성공 응답 1,013 · DB 1,000행 · 막힌 INSERT 13 = 성공 응답만 받은 13명',
          'recount: 1,300ms 에 멈춤 → 큐가 빈 1,770ms 에 DB 의 가장 큰 번호 882 로 Redis 를 다시 씀',
          '→ 성공 응답 1,000 · DB 1,000행 · 막힌 INSERT 0',
        ]}
      />
    </C4DynamicDiagram>
  );
}

// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_coupon-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(0.000ms 두 번 누름 · 0.255ms SADD 1 · 0.260ms SADD 0 ·
// 0.510ms 이미 받음 · 1.035ms INCR 1 · 1.285ms 성공 · 10.000ms INSERT 1 row).
//
// 주장: 요청 하나는 SADD → INCR 두 번의 Redis 판정을 지나 큐에 들어간 뒤에야 성공 응답을 받고,
// DB 기록은 그 뒤 워커가 한다. 같은 사람의 두 번째 요청은 첫 판정(SADD)에서 멈춘다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader } from '../../../../viz/frame/frame';
import { API, APP, Boxes, DB, Lane, PATH, QUEUE, REDIS, W, WORKER } from './_coupon-layout';

const INCR = { from: { x: 455, y: 260 }, to: { x: 455, y: 190 } };

const LANES = [
  { ...PATH.request, lines: ['같은 사람 두 번', '0.000ms'], lx: 240, ly: 255, order: 1, bx: 180, by: 285 },
  { ...PATH.decide, lines: ['SADD → 1 (0.255ms)', '두 번째 요청은 → 0'], lx: 383, ly: 218, anchor: 'end' as const, order: 2, bx: 395, by: 236 },
  { ...INCR, lines: ['INCR → 1 (1.035ms)', '앞선 명령 뒤에서 기다림'], lx: 467, ly: 218, anchor: 'start' as const, order: 3, bx: 455, by: 236 },
  { ...PATH.enqueue, lines: ['seq=1 메시지', '1.285ms'], lx: 555, ly: 268, order: 4, bx: 600, by: 300 },
  { ...PATH.answer, lines: ['성공 1.285ms', '이미 받음 0.510ms'], lx: 240, ly: 340, order: 5, bx: 180, by: 318 },
  { ...PATH.poll, lines: ['10.000ms 워커가 꺼냄'], lx: 717, ly: 390, anchor: 'start' as const },
  { ...PATH.insert, lines: ['INSERT seq=1', '→ 1 row (10.000ms)'], lx: 555, ly: 440, order: 6, bx: 600, by: 470 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={550} title="시나리오 1 — 처음 누른 사람이 1번 쿠폰을 받는 길">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="1.285ms 에 성공 응답, 10.000ms 에 DB 한 행 — 두 번째 누름은 SADD 에서 멈춤" />
      <Boxes boxes={[{ ...APP, tag: 'USER 1' }, { ...API, tag: 'API-1 · API-2' }, REDIS, QUEUE, WORKER, DB]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
    </C4DynamicDiagram>
  );
}

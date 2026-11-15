// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_live-layout.tsx). 에지 서버는 대수를 보이려고
// 세 칸(a · b · c)으로 나눴고 이름은 개념도와 같은 「에지 서버」다. Redis Pub/Sub 은 이 장애에서 하는 일이
// 시나리오 1 과 같아 뺐다.
// 출처: code/expected-output.txt 의 시나리오 3 줄(80.0s 멈춤 · 81.5s 4389 · 82.5s 3164 · 88.5s 4199 · 87.9s 마지막 재접속).
// 에지 칸의 수는 집계 서비스가 받은 재생 중 연결 수다(a 에는 일시 정지한 conn 751 이 붙어 있어 연결 수보다 1 작다).
//
// 주장: 에지 하나가 멈추면 집계 서비스가 그 에지의 마지막 보고를 3초 더 쓰는 동안 재접속한 시청자가 두 번 세어지고,
// 그 보고를 뺀 뒤에는 아직 돌아오지 않은 시청자가 빠진다. 재접속이 끝나면 합계가 실제 값으로 돌아온다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { AGG, BROWSER, Boxes, EDGE, Lane, type LaneSpec, W } from './_live-layout';

const EDGE_A = { ...EDGE, x: 370, y: 100, h: 70, tag: 'EDGE A', note: '재생 중 1,399 → 2,099' };
const EDGE_B = { ...EDGE, x: 370, y: 200, h: 70, tag: 'EDGE B', note: '재생 중 1,400 → 2,100' };
const EDGE_C = { ...EDGE, x: 370, y: 300, h: 70, tag: 'EDGE C · STOPPED', note: '80.0s 멈춤' };
const VIEWERS = { ...BROWSER, y: 180, w: 170, h: 110, tag: 'VIEWERS OF C', note: '1,400명 · 영상은 계속' };
const AGGREGATOR = { ...AGG, x: 700, y: 185, w: 188, note: '3초 넘게 묵은 보고는 뺌' };

const LANES: LaneSpec[] = [
  {
    from: { x: 370, y: 335 }, to: { x: 110, y: 290 }, waypoints: [{ x: 110, y: 335 }], dashed: true,
    lines: ['연결 1,400개 끊김 · 화면은 4,199 에서 멈춤', '80.0s · screens-frozen-at=4199'], lx: 120, ly: 396, anchor: 'start',
    order: 1, bx: 240, by: 335,
  },
  {
    from: { x: 194, y: 200 }, to: { x: 370, y: 135 }, waypoints: [{ x: 290, y: 200 }, { x: 290, y: 135 }],
    lines: ['retry 0~8초 뒤 a · b 로 재접속', '80.0s ~ 87.9s'], lx: 24, ly: 118, anchor: 'start',
    order: 2, bx: 290, by: 168,
  },
  { from: { x: 194, y: 235 }, to: { x: 370, y: 235 }, lines: [], lx: 0, ly: 0 },
  {
    from: { x: 570, y: 135 }, to: { x: 700, y: 205 }, waypoints: [{ x: 635, y: 135 }, { x: 635, y: 205 }],
    lines: ['재생 중 연결 수 보고', 'HTTP POST · 1초마다'], lx: 580, ly: 110, anchor: 'start',
  },
  { from: { x: 570, y: 235 }, to: { x: 700, y: 235 }, lines: [], lx: 0, ly: 0 },
  {
    from: { x: 570, y: 335 }, to: { x: 700, y: 255 }, waypoints: [{ x: 650, y: 335 }, { x: 650, y: 255 }], dashed: true,
    lines: ['c 의 마지막 보고 1,400 (79.0s) 을', '3초 더 씀 → 81.5s 4,389'], lx: 600, ly: 396, anchor: 'start',
    order: 3, bx: 650, by: 300,
  },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={530} title="시나리오 3 — 에지 서버 하나가 멈출 때 합계가 틀렸다가 돌아오는 길">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="에지 c 가 멈추면 합계는 4,389 로 늘었다가 3,164 로 줄고 다시 4,199" />
      <Boxes boxes={[VIEWERS, EDGE_A, EDGE_B, EDGE_C, AGGREGATOR]} />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={436}
        width={W - GUTTER * 2}
        label="4 · 5 집계 서비스"
        tone="sunken"
        lines={[
          '4 · 82.5s c 의 보고가 3.5초 묵어 뺌 → total 3,164 (actual 4,199) — 아직 안 돌아온 시청자가 빠짐',
          '5 · 87.9s 마지막 재접속 → 88.0s 보고 → 88.5s total 4,199 — 멈춘 뒤 8.5초',
        ]}
      />
    </C4DynamicDiagram>
  );
}

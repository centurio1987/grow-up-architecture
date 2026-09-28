// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 State — Collaborations
//
// 주장: 요청은 Context 를 거쳐 현재 상태 객체에 닿고, 그 상태가 Context 를 읽고 고친 뒤
// 다음 상태를 정해 돌려준다 — 전이는 Context 의 참조 하나를 바꾸는 마지막 한 걸음이다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 382;
const HEAD_W = 200;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'context', x: GUTTER + 420, label: 'Context' },
  { id: 'state', x: GUTTER + 720, label: '현재 State 객체' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'client', y: 235, text: '1. 시작 상태를 만들어 Context 에 넣는다' },
  { from: 'client', to: 'context', y: 285, text: '2. 요청한다 (어느 상태인지 모른 채)' },
  { from: 'context', to: 'state', y: 330, text: '3. 현재 상태에 넘긴다 (자신을 인자로)' },
  { from: 'state', to: 'context', y: 375, text: '4. Context 의 값을 읽고 고친다' },
  { from: 'state', to: 'context', y: 415, text: '5. 다음 상태를 돌려준다', dashed: true },
  { from: 'context', to: 'context', y: 455, text: '6. 현재 상태 참조를 바꾼다' },
];

export default function StateFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={520}>
      <DiagramHeader eyebrow="State collaboration" title="요청은 Context 를 거치고, 전이는 참조 하나를 바꾼다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 40 : (CX[s.from] + CX[s.to]) / 2;
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 26 } : { x: CX[s.to], y: s.y }}
              waypoints={self ? [{ x: CX[s.from] + 80, y: s.y }, { x: CX[s.from] + 80, y: s.y + 26 }] : undefined}
              routing="orthogonal"
              markerEnd="arrow"
              strokeDasharray={s.dashed ? '6 3' : undefined}
              stroke={ink}
            />
            <text
              x={mid}
              y={s.y - 8}
              textAnchor="middle"
              fontFamily={f.typography.bodyFont}
              fontSize={13}
              fill={ink}
            >
              {s.text}
            </text>
          </g>
        );
      })}
    </Canvas>
  );
}

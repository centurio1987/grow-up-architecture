// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Bridge — Collaborations · Implementation
//
// 주장: 고수준 연산 한 번이 원시 연산 여러 번으로 풀린다. 구현자를 고르는 일은 호출보다 먼저 한 번 일어나고,
// 그 뒤로 Client 는 구현자를 다시 만나지 않는다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 430;
const HEAD_W = 220;

const LANES = [
  { id: 'client', x: GUTTER + 130, label: 'Client' },
  { id: 'abstraction', x: GUTTER + 430, label: 'Abstraction' },
  { id: 'implementor', x: GUTTER + 730, label: 'ConcreteImplementor' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'abstraction', y: 195, text: '1. 구현자를 골라 넘긴다' },
  { from: 'client', to: 'abstraction', y: 245, text: '2. 고수준 연산을 부른다' },
  { from: 'abstraction', to: 'implementor', y: 300, text: '3. 원시 연산을 부른다' },
  { from: 'abstraction', to: 'implementor', y: 345, text: '4. 원시 연산을 되풀이한다' },
  { from: 'implementor', to: 'implementor', y: 390, text: '5. 자기 형식으로 쌓는다' },
  { from: 'implementor', to: 'abstraction', y: 450, text: '6. 쌓인 것을 내놓는다', dashed: true },
  { from: 'abstraction', to: 'client', y: 500, text: '7. 고수준 연산의 결과를 돌려준다', dashed: true },
];

export default function BridgeFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={570}>
      <DiagramHeader
        eyebrow="Bridge collaboration"
        title="고수준 연산 한 번이 원시 연산 여러 번으로 풀린다"
      />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] - 12 : (CX[s.from] + CX[s.to]) / 2;
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 26 } : { x: CX[s.to], y: s.y }}
              waypoints={
                self
                  ? [
                      { x: CX[s.from] + 80, y: s.y },
                      { x: CX[s.from] + 80, y: s.y + 26 },
                    ]
                  : undefined
              }
              routing="orthogonal"
              markerEnd="arrow"
              strokeDasharray={s.dashed ? '6 3' : undefined}
              stroke={ink}
            />
            <text
              x={mid}
              y={s.y - 8}
              textAnchor={self ? 'end' : 'middle'}
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

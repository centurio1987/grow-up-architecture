// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Strategy — Collaborations
//
// 주장: 고르는 일과 쓰는 일이 갈린다. Client 가 전략을 만들어 설치하고, 그 뒤 요청은 Context 를 거쳐
// 같은 연산 모양으로만 전략에 닿는다 — Context 는 어느 전략인지 모른 채 결과를 이어받는다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 330;
const HEAD_W = 200;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'context', x: GUTTER + 420, label: 'Context' },
  { id: 'strategy', x: GUTTER + 720, label: 'Strategy 타입 참조' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'client', y: 235, text: '1. ConcreteStrategy 를 골라 만든다' },
  { from: 'client', to: 'context', y: 285, text: '2. 전략을 설치한다' },
  { from: 'client', to: 'context', y: 330, text: '3. 요청한다' },
  { from: 'context', to: 'strategy', y: 375, text: '4. 연산 모양으로 호출한다' },
  { from: 'strategy', to: 'context', y: 415, text: '5. 결과를 돌려준다', dashed: true },
  { from: 'context', to: 'client', y: 455, text: '6. 결과로 마무리해 응답한다', dashed: true },
];

export default function StrategyFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={500}>
      <DiagramHeader eyebrow="Strategy collaboration" title="고르는 일은 밖에서, 쓰는 일은 연산 모양으로" />
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

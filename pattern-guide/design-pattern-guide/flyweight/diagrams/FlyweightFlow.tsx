// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Flyweight — Collaborations · Implementation
//
// 주장: 만드는 일은 코드마다 한 번뿐이고, 자리마다 달라지는 값은 저장되지 않고
// 연산 호출에 실려 간다. 두 번째 칸은 같은 길을 지나면서 만드는 단계만 건너뛴다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 470;
const HEAD_W = 230;

const LANES = [
  { id: 'client', x: GUTTER + 130, label: 'Client (실사표)' },
  { id: 'factory', x: GUTTER + 435, label: 'FlyweightFactory' },
  { id: 'shared', x: GUTTER + 745, label: 'ConcreteFlyweight' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'client', y: 190, text: '1. 자리마다 다른 값은 자기 쪽에 둔다' },
  { from: 'client', to: 'factory', y: 250, text: '2. 품목 코드로 규격을 청구한다' },
  { from: 'factory', to: 'factory', y: 295, text: '3. 보관소를 확인한다' },
  { from: 'factory', to: 'shared', y: 355, text: '4. 비었으면 만들어 보관한다' },
  { from: 'factory', to: 'client', y: 400, text: '5. 같은 코드면 같은 객체', dashed: true },
  { from: 'client', to: 'shared', y: 445, text: '6. 위치·수량을 인자로 넘긴다' },
  { from: 'shared', to: 'client', y: 490, text: '7. 계산 결과를 돌려준다', dashed: true },
  { from: 'client', to: 'factory', y: 545, text: '8. 다음 칸도 같은 길, 4단계만 건너뛴다' },
];

export default function FlyweightFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={615}>
      <DiagramHeader eyebrow="Flyweight collaboration" title="만드는 일은 코드마다 한 번, 자리마다 다른 값은 호출에 실려 간다" />
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

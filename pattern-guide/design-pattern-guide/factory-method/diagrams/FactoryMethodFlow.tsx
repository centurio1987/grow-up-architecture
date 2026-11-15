// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Factory Method — Motivation · Collaborations
//
// 주장: 만드는 일은 아래(서브클래스)로 내려가고, 쓰는 일은 위(상위 로직)에 남는다.
// 상위 로직은 제품이 필요한 때에 팩토리 메서드를 부를 뿐 어느 클래스가 돌아올지 모르고,
// 돌아온 것을 Product 타입으로만 다룬다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 400;
const HEAD_W = 200;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'creator', x: GUTTER + 420, label: 'Creator 의 상위 로직' },
  { id: 'concrete', x: GUTTER + 720, label: 'ConcreteCreator' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'creator', y: 200, text: '1. Creator 타입으로 마감을 요청한다' },
  { from: 'creator', to: 'creator', y: 245, text: '2. 제품이 필요한 자리에 이른다' },
  { from: 'creator', to: 'concrete', y: 305, text: '3. 팩토리 메서드를 부른다' },
  { from: 'concrete', to: 'concrete', y: 350, text: '4. ConcreteProduct 를 만든다' },
  { from: 'concrete', to: 'creator', y: 410, text: '5. Product 타입으로 돌려준다', dashed: true },
  { from: 'creator', to: 'creator', y: 450, text: '6. Product 연산만으로 마무리한다' },
  { from: 'creator', to: 'client', y: 505, text: '7. 마감 결과를 응답한다', dashed: true },
];

export default function FactoryMethodFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={545}>
      <DiagramHeader eyebrow="Factory Method collaboration" title="만드는 일은 아래로, 쓰는 일은 Product 타입으로" />
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

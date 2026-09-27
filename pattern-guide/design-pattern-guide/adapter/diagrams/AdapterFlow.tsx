// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Adapter — Collaborations
//
// 주장: 변환은 오가는 길 가운데 한 지점에서만 일어난다. Client 는 Target 연산만 부르고,
// Adaptee 는 자기 형식으로만 답하며, 인자와 반환을 양쪽 어휘로 옮기는 두 단계가 Adapter 안에 있다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 430;
const HEAD_W = 200;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'adapter', x: GUTTER + 420, label: 'Adapter' },
  { id: 'adaptee', x: GUTTER + 720, label: 'Adaptee' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'adapter', y: 200, text: '1. Target 연산으로 묻는다' },
  { from: 'adapter', to: 'adapter', y: 245, text: '2. 인자를 Adaptee 어휘로' },
  { from: 'adapter', to: 'adaptee', y: 305, text: '3. Adaptee 연산을 부른다' },
  { from: 'adaptee', to: 'adapter', y: 350, text: '4. 자기 형식으로 답한다', dashed: true },
  { from: 'adapter', to: 'adapter', y: 395, text: '5. 반환을 Target 계약으로' },
  { from: 'adapter', to: 'client', y: 455, text: '6. Target 이 약속한 값을 돌려준다', dashed: true },
  { from: 'client', to: 'adapter', y: 505, text: '7. Adaptee 에 없는 연산은 2~5 를 되풀이해 조립한다' },
];

export default function AdapterFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={575}>
      <DiagramHeader eyebrow="Adapter collaboration" title="변환은 오가는 길 가운데 한 지점에서만" />
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

// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Visitor — Collaborations
//
// 주장: 부르는 쪽은 방문자 하나를 구조에 건넬 뿐이고, 어느 연산이 실행될지는 원소가 정한다.
// 원소마다 자기 이름이 붙은 연산을 부르므로 갈래가 부르는 쪽에 남지 않는다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 430;
const HEAD_W = 184;

const LANES = [
  { id: 'client', x: GUTTER + 100, label: 'Client' },
  { id: 'desk', x: GUTTER + 336, label: 'ShippingDesk' },
  { id: 'box', x: GUTTER + 570, label: 'GiftBox GIFT-301' },
  { id: 'visitor', x: GUTTER + 800, label: 'ListVisitor' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'visitor', y: 186, text: '1. 방문자 하나를 만든다' },
  { from: 'client', to: 'desk', y: 228, text: '2. 구조에 그 방문자를 건넨다' },
  { from: 'desk', to: 'box', y: 274, text: '3. 원소마다 accept(방문자)' },
  { from: 'box', to: 'visitor', y: 320, text: '4. 상자가 visitGiftBox(자기 자신)' },
  { from: 'visitor', to: 'box', y: 362, text: '5. 상자 줄을 적는다', dashed: true },
  { from: 'box', to: 'box', y: 404, text: '6. 자식마다 accept — 3~5 를 되풀이' },
  { from: 'desk', to: 'client', y: 470, text: '7. 여덟 줄이 방문자 안에 쌓여 있다', dashed: true },
];

export default function VisitorFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={566}>
      <DiagramHeader
        eyebrow="Visitor collaboration"
        title="부르는 쪽은 방문자를 건넬 뿐, 어느 연산인지는 원소가 정한다"
      />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 126 : (CX[s.from] + CX[s.to]) / 2;
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 24 } : { x: CX[s.to], y: s.y }}
              waypoints={
                self
                  ? [
                      { x: CX[s.from] + 78, y: s.y },
                      { x: CX[s.from] + 78, y: s.y + 24 },
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

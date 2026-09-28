// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Composite — Collaborations
//
// 주장: 같은 연산 하나가 트리 끝까지 내려갔다가 같은 길로 올라온다. 묶음은 자기 몫을
// 더한 뒤 자식마다 같은 연산을 부르고, 낱개는 자식이 없어 거기서 값을 돌려준다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 430;
const HEAD_W = 176;

const LANES = [
  { id: 'desk', x: GUTTER + 96, label: 'ShippingDesk' },
  { id: 'gift', x: GUTTER + 336, label: 'GiftBox GIFT-301' },
  { id: 'mug', x: GUTTER + 576, label: 'Item mug' },
  { id: 'extras', x: GUTTER + 800, label: 'GiftBox extras' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'desk', to: 'gift', y: 190, text: '1. weightInGrams()' },
  { from: 'gift', to: 'gift', y: 232, text: '2. 자기 포장재 120 g 부터' },
  { from: 'gift', to: 'mug', y: 290, text: '3. 자식에게 같은 연산' },
  { from: 'mug', to: 'gift', y: 332, text: '4. 320 g — 자식이 없어 끝', dashed: true },
  { from: 'gift', to: 'extras', y: 384, text: '5. 다음 자식에게 같은 연산' },
  { from: 'extras', to: 'gift', y: 426, text: '6. 120 g — 안에서 2~4 를 되풀이', dashed: true },
  { from: 'gift', to: 'desk', y: 478, text: '7. 560 g — 몇 겹이었는지는 남지 않는다', dashed: true },
];

export default function CompositeFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={572}>
      <DiagramHeader eyebrow="Composite collaboration" title="같은 연산 하나가 트리 끝까지 내려갔다 올라온다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 44 : (CX[s.from] + CX[s.to]) / 2;
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 24 } : { x: CX[s.to], y: s.y }}
              waypoints={self ? [{ x: CX[s.from] + 76, y: s.y }, { x: CX[s.from] + 76, y: s.y + 24 }] : undefined}
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

// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Builder — Collaborations
//
// 주장: 제품은 절차가 끝난 뒤에 한 번만 밖으로 나온다.
// 절차를 도는 쪽은 부분을 알릴 뿐이고, 제품을 받아 가는 쪽은 빌더를 고른 Client 다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 940;
const TOP = 112;
const LIFE_H = 500;
const HEAD_W = 184;

const LANES = [
  { id: 'client', x: GUTTER + 96, label: 'Client' },
  { id: 'director', x: GUTTER + 366, label: 'Director' },
  { id: 'builder', x: GUTTER + 606, label: 'Builder 참조' },
  { id: 'product', x: GUTTER + 820, label: 'Product' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'client', y: 236, text: '1. ConcreteBuilder 하나를 만든다' },
  { from: 'client', to: 'director', y: 292, text: '2. Builder 타입으로 넘긴다' },
  { from: 'director', to: 'builder', y: 340, text: '3. 부분을 차례로 알린다 (여러 번)' },
  { from: 'builder', to: 'builder', y: 384, text: '4. 자기 표현에 부분을 쌓는다' },
  { from: 'director', to: 'builder', y: 440, text: '5. 절차의 끝을 알린다' },
  { from: 'builder', to: 'product', y: 484, text: '6. 여기서 비로소 제품이 선다' },
  { from: 'client', to: 'builder', y: 528, text: '7. 제품을 꺼낸다' },
  { from: 'builder', to: 'client', y: 572, text: '8. 완성된 제품', dashed: true },
];

export default function BuilderFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={630}>
      <DiagramHeader eyebrow="Builder collaboration" title="절차는 부분만 알리고, 제품은 끝난 뒤에 Client 가 꺼낸다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        // 자기 호출 라벨은 생명선 위에 걸치지 않게 오른쪽으로 빼고 왼쪽 정렬한다.
        const mid = self ? CX[s.from] + 18 : (CX[s.from] + CX[s.to]) / 2;
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
              textAnchor={self ? 'start' : 'middle'}
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

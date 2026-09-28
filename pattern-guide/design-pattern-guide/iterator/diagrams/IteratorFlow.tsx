// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Iterator — Collaborations
//
// 주장: 요청은 집합에 한 번만 가고, 그 뒤로는 클라이언트와 순회자 둘 사이에서만 오간다.
// 칸을 읽는 일은 순회자가 집합에 묻고, 어디까지 왔는지와 끝났는지는 순회자만 안다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 430;
const HEAD_W = 184;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'log', x: GUTTER + 420, label: 'RingScanLog' },
  { id: 'cursor', x: GUTTER + 744, label: 'OldestFirst' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

type Step = { from: string; to: string; y: number; text: string; dashed?: boolean; labelX?: number };

const STEPS: Step[] = [
  { from: 'client', to: 'log', y: 190, text: '1. oldestFirst()' },
  { from: 'log', to: 'cursor', y: 236, text: '2. step = 0 인 순회자를 만든다' },
  { from: 'log', to: 'client', y: 282, text: '3. 순회자를 돌려준다', dashed: true },
  { from: 'client', to: 'cursor', y: 328, text: '4. hasNext() 뒤 next()', labelX: GUTTER + 600 },
  { from: 'cursor', to: 'log', y: 374, text: '5. step 번째 칸을 묻는다' },
  { from: 'log', to: 'cursor', y: 420, text: '6. SCN-03', dashed: true },
  { from: 'cursor', to: 'client', y: 466, text: '7. SCN-03 — step 은 1 로 전진', dashed: true, labelX: GUTTER + 600 },
  { from: 'cursor', to: 'client', y: 512, text: '8. hasNext() 가 false — 끝은 순회자가 알린다', dashed: true, labelX: GUTTER + 600 },
];

export default function IteratorFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={572}>
      <DiagramHeader
        eyebrow="Iterator collaboration"
        title="집합에는 한 번만 묻고, 그다음은 순회자와만 주고받는다"
      />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const mid = s.labelX ?? (CX[s.from] + CX[s.to]) / 2;
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={{ x: CX[s.to], y: s.y }}
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

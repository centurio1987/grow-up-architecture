// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Template Method — Motivation · Collaborations · Consequences
//
// 주장: 호출은 위에서 아래로만 간다. 골격이 단계를 부르고 하위는 부른 적이 없으며,
// 불변 단계(집계·범위 검사·평균)는 내려가지 않고 골격에 남는다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 440;
const HEAD_W = 210;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'skeleton', x: GUTTER + 430, label: 'AbstractClass 의 골격' },
  { id: 'step', x: GUTTER + 740, label: 'ConcreteClass 가 채운 단계' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'skeleton', y: 196, text: '1. 골격 연산 하나를 부른다' },
  { from: 'skeleton', to: 'skeleton', y: 236, text: '2. 집계 자리를 연다 (불변)' },
  { from: 'skeleton', to: 'step', y: 296, text: '3. 머리글 판정을 부른다' },
  { from: 'skeleton', to: 'step', y: 336, text: '4. 줄 해석을 부른다' },
  { from: 'step', to: 'skeleton', y: 376, text: '5. 관측값을 돌려준다', dashed: true },
  { from: 'skeleton', to: 'skeleton', y: 416, text: '6. 범위·집계를 잰다 (불변)' },
  { from: 'skeleton', to: 'step', y: 476, text: '7. 훅을 부른다 (기본은 빔)' },
  { from: 'skeleton', to: 'client', y: 522, text: '8. 요약 한 줄을 남긴다', dashed: true },
];

export default function TemplateMethodFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={596}>
      <DiagramHeader
        eyebrow="Template Method collaboration"
        title="골격이 단계를 부르고, 불변 단계는 내려가지 않는다"
      />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 95 : (CX[s.from] + CX[s.to]) / 2;
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

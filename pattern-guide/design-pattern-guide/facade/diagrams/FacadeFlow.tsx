// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Facade — Collaborations
//
// 주장: 요청 한 번이 Facade 안에서 서브시스템 호출 여럿으로 갈라진다. 되돌아오는 점선은
// 물어본 것에 답하는 줄뿐이고, 서브시스템이 먼저 말을 거는 줄은 하나도 없다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 440;
const HEAD_W = 160;

const LANES = [
  { id: 'client', x: GUTTER + 90, label: 'Client' },
  { id: 'facade', x: GUTTER + 318, label: 'Facade' },
  { id: 'subA', x: GUTTER + 546, label: '서브시스템 A' },
  { id: 'subB', x: GUTTER + 774, label: '서브시스템 B' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'facade', y: 190, text: '1. 업무 말로 한 번 부른다' },
  { from: 'facade', to: 'facade', y: 232, text: '2. 서브시스템 어휘로 옮긴다' },
  { from: 'facade', to: 'subA', y: 292, text: '3. 후보를 묻는다' },
  { from: 'subA', to: 'facade', y: 334, text: '4. 자기 형식으로 답한다', dashed: true },
  { from: 'facade', to: 'subB', y: 376, text: '5. 쓸 수 있는지 묻는다' },
  { from: 'subB', to: 'facade', y: 418, text: '6. 남은 수를 답한다', dashed: true },
  { from: 'facade', to: 'subA', y: 460, text: '7. 확정을 맡긴다' },
  { from: 'facade', to: 'client', y: 520, text: '8. 결과 한 줄을 돌려준다', dashed: true },
];

export default function FacadeFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={572}>
      <DiagramHeader eyebrow="Facade collaboration" title="한 번의 요청이 안에서 여럿으로 나뉜다" />
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
              to={self ? { x: CX[s.from], y: s.y + 24 } : { x: CX[s.to], y: s.y }}
              waypoints={self ? [{ x: CX[s.from] + 70, y: s.y }, { x: CX[s.from] + 70, y: s.y + 24 }] : undefined}
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

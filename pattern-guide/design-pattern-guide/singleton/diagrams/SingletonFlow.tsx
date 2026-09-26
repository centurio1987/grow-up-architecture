// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Singleton — Collaborations · Implementation
//
// 주장: 만드는 일은 첫 호출 한 번에만 일어나고, 그 뒤 모든 호출은 같은 객체로 간다.
// 두 번째 Client 는 접근점을 똑같이 부르지만 만드는 단계를 지나지 않는다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 420;
const HEAD_W = 210;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'access', x: GUTTER + 430, label: 'Singleton 의 접근점' },
  { id: 'unique', x: GUTTER + 740, label: '유일 인스턴스' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'access', y: 200, text: '1. 접근점을 부른다' },
  { from: 'access', to: 'access', y: 245, text: '2. 보관 자리를 확인한다' },
  { from: 'access', to: 'unique', y: 305, text: '3. 비었으면 만들어 보관한다' },
  { from: 'access', to: 'client', y: 350, text: '4. 보관된 객체를 돌려준다', dashed: true },
  { from: 'client', to: 'unique', y: 395, text: '5. 번호를 청구한다' },
  { from: 'unique', to: 'client', y: 440, text: '6. 번호를 돌려준다', dashed: true },
  { from: 'client', to: 'access', y: 495, text: '7. 다음 창구도 같은 길, 3단계만 건너뛴다' },
];

export default function SingletonFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={565}>
      <DiagramHeader eyebrow="Singleton collaboration" title="만드는 일은 첫 호출에 한 번, 그 뒤는 같은 객체로" />
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

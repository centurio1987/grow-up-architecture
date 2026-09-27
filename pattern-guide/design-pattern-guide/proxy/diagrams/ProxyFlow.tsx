// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Proxy — Collaborations
//
// 주장: 통제가 먼저 서고 전달은 통제를 통과했을 때만 일어난다. 막히면 RealSubject 쪽 생명선에는
// 아무 일도 일어나지 않고, Client 는 어느 쪽이었는지 모른 채 같은 타입의 값을 받는다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 400;
const HEAD_W = 200;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'proxy', x: GUTTER + 420, label: 'Proxy' },
  { id: 'real', x: GUTTER + 720, label: 'RealSubject' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'proxy', y: 200, text: '1. Subject 연산으로 묻는다' },
  { from: 'proxy', to: 'proxy', y: 245, text: '2. 종류에 맞는 통제를 한다' },
  { from: 'proxy', to: 'real', y: 305, text: '3. 통과하면 전달한다' },
  { from: 'real', to: 'proxy', y: 350, text: '4. 자기 일을 하고 답한다', dashed: true },
  { from: 'proxy', to: 'client', y: 410, text: '5. Subject 가 약속한 값을 돌려준다', dashed: true },
  { from: 'proxy', to: 'client', y: 470, text: '6. 막히면 전달 없이 여기서 답한다', dashed: true },
];

export default function ProxyFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={545}>
      <DiagramHeader eyebrow="Proxy collaboration" title="통제가 먼저 서고, 전달은 통과했을 때만" />
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

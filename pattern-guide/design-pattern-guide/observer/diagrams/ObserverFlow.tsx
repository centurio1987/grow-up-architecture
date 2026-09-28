// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Observer — Collaborations
//
// 주장: 주체는 자기 상태를 먼저 맞춘 뒤, 등록된 목록에 같은 통지 하나를 뿌린다. 통지에는 무엇을
// 하라는 말이 없어서, 받은 옵저버가 스스로 주체에 되묻고 자기 상태만 주체에 맞춘다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 452;
const HEAD_W = 210;

const LANES = [
  { id: 'client', x: GUTTER + 125, label: 'Client' },
  { id: 'subject', x: GUTTER + 430, label: 'ConcreteSubject' },
  { id: 'observer', x: GUTTER + 735, label: 'ConcreteObserver' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'subject', y: 232, text: '1. 옵저버를 등록한다 (attach)' },
  { from: 'client', to: 'subject', y: 278, text: '2. 상태를 바꾸라고 요청한다' },
  { from: 'subject', to: 'subject', y: 322, text: '3. 자기 상태를 먼저 맞춘다' },
  { from: 'subject', to: 'observer', y: 386, text: '4. 등록된 전부에게 같은 통지 (updated)' },
  { from: 'observer', to: 'subject', y: 430, text: '5. 바뀐 값을 되묻는다' },
  { from: 'subject', to: 'observer', y: 470, text: '6. 값을 돌려준다', dashed: true },
  { from: 'observer', to: 'observer', y: 512, text: '7. 자기 상태만 주체에 맞춘다' },
];

export default function ObserverFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={608}>
      <DiagramHeader eyebrow="Observer collaboration" title="주체는 사실만 뿌리고, 반응은 옵저버가 한다" />
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

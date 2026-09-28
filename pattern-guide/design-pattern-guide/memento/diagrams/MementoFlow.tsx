// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Memento — Collaborations · Participants
//
// 주장: 메멘토 생명선으로 들어가는 줄은 둘뿐이고 둘 다 좌석판에서 나간다. 창구에서 메멘토로
// 가는 줄은 하나도 없다 — 창구는 받아 쌓고 그대로 돌려주는 일만 한다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 1020;
const TOP = 112;
const LIFE_H = 474;
const HEAD_W = 170;

const LANES = [
  { id: 'client', x: GUTTER + 85, label: 'Client' },
  { id: 'desk', x: GUTTER + 352, label: 'ReservationDesk' },
  { id: 'chart', x: GUTTER + 619, label: 'SeatChart' },
  { id: 'memento', x: GUTTER + 886, label: 'SeatMemento' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'desk', y: 190, text: '1. 되돌릴 지점을 잡아 달라 한다', dx: 0 },
  { from: 'desk', to: 'chart', y: 240, text: '2. save() 로 메멘토를 청한다', dx: 0 },
  { from: 'chart', to: 'memento', y: 290, text: '3. 세 값을 한 덩이로 담는다', dx: 0 },
  { from: 'chart', to: 'desk', y: 340, text: '4. 좁은 인터페이스로 돌려준다', dx: 0 },
  { from: 'desk', to: 'desk', y: 390, text: '5. 이력에 쌓아 보관한다', dx: 0 },
  // dx — 이 엣지의 중점이 ReservationDesk 생명선 위라, 글자를 왼쪽으로 밀어 선을 피한다.
  { from: 'client', to: 'chart', y: 440, text: '6. reserve(2) 로 좌석이 바뀐다', dx: -128 },
  { from: 'desk', to: 'chart', y: 506, text: '7. 메멘토를 그대로 돌려준다', dx: 0 },
  { from: 'chart', to: 'memento', y: 554, text: '8. 내용을 열어 자신을 되돌린다', dx: 0 },
];

export default function MementoFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={620}>
      <DiagramHeader eyebrow="Memento collaboration" title="메멘토를 여는 줄은 전부 좌석판에서 나간다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 104 : (CX[s.from] + CX[s.to]) / 2 + s.dx;
        return (
          <g key={s.text + s.y}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 26 } : { x: CX[s.to], y: s.y }}
              waypoints={self ? [{ x: CX[s.from] + 80, y: s.y }, { x: CX[s.from] + 80, y: s.y + 26 }] : undefined}
              routing="orthogonal"
              markerEnd="arrow"
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

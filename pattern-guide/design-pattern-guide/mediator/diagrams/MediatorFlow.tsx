// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Mediator — Motivation · Collaborations
//
// 주장: 사용자가 건드린 동료 하나가 자기 일만 하고 중재자에게 알리면, 나머지 동료를 움직이는
// 줄은 전부 중재자에서 나간다. 동료와 동료를 바로 잇는 줄은 하나도 없다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 484;
const HEAD_W = 146;

const LANES = [
  { id: 'client', x: GUTTER + 81, label: 'Client' },
  { id: 'cabin', x: GUTTER + 258, label: 'CabinList' },
  { id: 'form', x: GUTTER + 435, label: 'SeatForm' },
  { id: 'seat', x: GUTTER + 612, label: 'SeatField' },
  { id: 'issue', x: GUTTER + 789, label: 'IssueButton' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'cabin', y: 190, text: '1. economy 를 고른다', dx: 0 },
  { from: 'cabin', to: 'form', y: 238, text: '1. 바뀌었다고 알린다', dx: 0 },
  { from: 'form', to: 'cabin', y: 286, text: '2. 무엇을 골랐는지 묻는다', dashed: true, dx: 0 },
  { from: 'form', to: 'seat', y: 334, text: '3. 첫 빈 좌석을 채운다', dx: 0 },
  { from: 'form', to: 'issue', y: 394, text: '4. 발권 버튼을 켠다', dx: 88 },
  { from: 'client', to: 'issue', y: 454, text: '5. 발권 버튼을 누른다', dx: -86 },
  { from: 'issue', to: 'form', y: 502, text: '5. 눌렸다고 알린다', dx: 0 },
  { from: 'form', to: 'client', y: 550, text: '5. 발권 한 줄을 만든다', dashed: true, dx: 88 },
];

export default function MediatorFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={620}>
      <DiagramHeader eyebrow="Mediator collaboration" title="동료를 움직이는 줄은 전부 가운데에서 나간다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const mid = (CX[s.from] + CX[s.to]) / 2 + s.dx;
        return (
          <g key={s.text + s.y}>
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

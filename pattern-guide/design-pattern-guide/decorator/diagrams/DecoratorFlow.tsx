// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Decorator — Collaborations
//
// 주장: 요청은 층을 하나도 건너뛰지 않고 안쪽 끝까지 닿았다가 같은 길로 되돌아온다.
// 추가 책임은 전달의 앞(2·4)과 뒤(7)에 붙고, 전달 자체는 어느 층에서도 멈추지 않는다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 470;
const HEAD_W = 168;

const LANES = [
  { id: 'client', x: GUTTER + 96, label: 'Client' },
  { id: 'audit', x: GUTTER + 330, label: 'AuditNotifier' },
  { id: 'sign', x: GUTTER + 564, label: 'SignatureNotifier' },
  { id: 'sms', x: GUTTER + 798, label: 'SmsNotifier' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'audit', y: 196, text: '1. Component 연산으로 보낸다' },
  { from: 'audit', to: 'audit', y: 238, text: '2. 전달 전 — 횟수를 센다' },
  { from: 'audit', to: 'sign', y: 296, text: '3. 그대로 전달' },
  { from: 'sign', to: 'sign', y: 338, text: '4. 전달 전 — 서명을 붙인다' },
  { from: 'sign', to: 'sms', y: 396, text: '5. 전달' },
  { from: 'sms', to: 'sign', y: 438, text: '5. 영수증을 돌려준다', dashed: true },
  { from: 'sign', to: 'audit', y: 480, text: '6. 손대지 않고 올려보낸다', dashed: true },
  { from: 'audit', to: 'audit', y: 516, text: '7. 전달 후 — 감사 번호' },
  { from: 'audit', to: 'client', y: 568, text: '8. 몇 겹이었는지는 남지 않는다', dashed: true },
];

export default function DecoratorFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={632}>
      <DiagramHeader eyebrow="Decorator collaboration" title="요청은 한 층도 건너뛰지 않고 끝까지 닿는다" />
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

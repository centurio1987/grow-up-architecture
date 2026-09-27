// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Prototype — Collaborations · Implementation(프로토타입 관리자, 복제본 초기화)
//
// 주장: 새 객체가 태어나는 자리는 견본의 복제 연산 안뿐이다. Client 는 구체 클래스 이름을 대지 않고
// 키만 대며, 손보는 것은 언제나 복제본 쪽이라 견본의 값은 요청을 몇 번 받아도 그대로다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 490;
const HEAD_W = 184;

const LANES = [
  { id: 'setup', x: GUTTER + 96, label: '견본 등록 지점' },
  { id: 'client', x: GUTTER + 344, label: 'Client' },
  { id: 'manager', x: GUTTER + 578, label: 'PrototypeManager' },
  { id: 'prototype', x: GUTTER + 796, label: '등록된 견본' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  // dx — 라벨이 Client 생명선 위에 걸리면 글자가 점선에 잘려 읽힌다. 빈 칸 쪽으로 민다.
  { from: 'setup', to: 'manager', y: 232, text: '1. 견본을 만들어 키로 등록한다', dx: 132 },
  { from: 'client', to: 'manager', y: 288, text: '2. 키로 오늘 점검표를 청한다' },
  { from: 'manager', to: 'prototype', y: 336, text: '3. 견본에게 자기 복제를 청한다' },
  { from: 'prototype', to: 'manager', y: 380, text: '4. 값이 같은 새 객체', dashed: true },
  { from: 'manager', to: 'client', y: 424, text: '5. Prototype 타입으로 돌려준다', dashed: true },
  { from: 'client', to: 'client', y: 468, text: '6. 복제본만 설비·날짜로 초기화한다' },
  { from: 'client', to: 'manager', y: 524, text: '7. 같은 키로 한 번 더 청한다' },
  { from: 'manager', to: 'client', y: 568, text: '8. 견본은 그대로 100점', dashed: true },
];

export default function PrototypeFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={620}>
      <DiagramHeader
        eyebrow="Prototype collaboration"
        title="새 객체는 견본의 복제 연산 안에서만 태어나고, 손보는 것은 복제본 쪽이다"
      />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = (self ? CX[s.from] + 44 : (CX[s.from] + CX[s.to]) / 2) + (s.dx ?? 0);
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 26 } : { x: CX[s.to], y: s.y }}
              waypoints={self ? [{ x: CX[s.from] + 84, y: s.y }, { x: CX[s.from] + 84, y: s.y + 26 }] : undefined}
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

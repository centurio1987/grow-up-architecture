// @relation relate
// @viz-type VT-101
// 출처: GoF 원서 Mediator — Structure · Participants
//
// 주장: 동료 칸에서 Mediator 로 나가는 화살표가 있다. 가운데 객체를 바깥 Client 만 아는 것이
// 아니라 안쪽 동료들도 알고 그쪽으로 말을 걸며, 동료와 동료를 바로 잇는 선은 하나도 없다.
import { Canvas, Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER, RoleBox } from '../../../../viz/frame/frame';

const W = 912;
const H = 600;
const BOX_H = 78;

const BOXES = [
  {
    x: GUTTER, y: 200, w: 260, role: 'container' as const, tag: 'MEDIATOR',
    name: 'Mediator', note: 'changed(사건) 을 선언한다',
  },
  {
    x: GUTTER, y: 340, w: 260, role: 'process' as const, tag: 'CONCRETE',
    name: 'ConcreteMediator', note: '동료 참조 여럿 · 협력 규칙',
  },
  {
    x: GUTTER, y: 480, w: 260, role: 'person' as const, tag: 'CLIENT',
    name: 'Client', note: '동료를 세우고 조작한다',
  },
  {
    x: 400, y: 230, w: 300, role: 'container' as const, tag: 'COLLEAGUE',
    name: 'Colleague 1', note: 'mediator 참조 · 자기 상태',
  },
  {
    x: 400, y: 390, w: 300, role: 'container' as const, tag: 'COLLEAGUE',
    name: 'Colleague 2', note: 'mediator 참조 · 자기 상태',
  },
];

type Lane = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  waypoints?: { x: number; y: number }[];
  dashed?: boolean;
  label: string;
  lx: number;
  ly: number;
  anchor?: 'start' | 'middle' | 'end';
};

const LANES: Lane[] = [
  {
    from: { x: 154, y: 340 }, to: { x: 154, y: 278 }, dashed: true,
    label: '구현한다', lx: 162, ly: 314, anchor: 'start',
  },
  {
    from: { x: 284, y: 360 }, to: { x: 400, y: 269 },
    waypoints: [{ x: 340, y: 360 }, { x: 340, y: 269 }],
    label: '', lx: 346, ly: 262, anchor: 'start',
  },
  {
    from: { x: 284, y: 400 }, to: { x: 400, y: 429 },
    waypoints: [{ x: 355, y: 400 }, { x: 355, y: 429 }],
    label: '보유하고 부른다', lx: 300, ly: 348, anchor: 'start',
  },
  {
    from: { x: 700, y: 255 }, to: { x: 110, y: 200 },
    waypoints: [{ x: 770, y: 255 }, { x: 770, y: 165 }, { x: 110, y: 165 }],
    label: '사건을 알린다 — 동료가 아는 가운데 객체는 이것뿐',
    lx: 440, ly: 157, anchor: 'middle',
  },
  {
    from: { x: 700, y: 415 }, to: { x: 200, y: 200 },
    waypoints: [{ x: 845, y: 415 }, { x: 845, y: 128 }, { x: 200, y: 128 }],
    label: '사건을 알린다',
    lx: 522, ly: 120, anchor: 'middle',
  },
  {
    from: { x: 284, y: 510 }, to: { x: 560, y: 468 },
    waypoints: [{ x: 560, y: 510 }],
    label: '조작한다', lx: 400, ly: 502, anchor: 'middle',
  },
];

export default function MediatorStructure() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={H}>
      <DiagramHeader eyebrow="Mediator structure" title="안쪽에서 가운데로 나가는 화살표가 있다" />
      {BOXES.map((b) => (
        <RoleBox
          key={b.name}
          x={b.x}
          y={b.y}
          w={b.w}
          h={BOX_H}
          role={b.role}
          tag={b.tag}
          name={b.name}
          note={b.note}
        />
      ))}
      {LANES.map((l) => (
        <g key={l.label + l.lx + l.ly}>
          <Edge
            from={l.from}
            to={l.to}
            waypoints={l.waypoints}
            routing="orthogonal"
            markerEnd="arrow"
            strokeDasharray={l.dashed ? '6 3' : undefined}
            stroke={ink}
          />
          <text
            x={l.lx}
            y={l.ly}
            textAnchor={l.anchor ?? 'middle'}
            fontFamily={f.typography.bodyFont}
            fontSize={12.5}
            fill={ink}
          >
            {l.label}
          </text>
        </g>
      ))}
      <text
        x={700}
        y={348}
        textAnchor="middle"
        fontFamily={f.typography.bodyFont}
        fontSize={12.5}
        fill={ink}
      >
        동료끼리 잇는 선은 없다
      </text>
    </Canvas>
  );
}

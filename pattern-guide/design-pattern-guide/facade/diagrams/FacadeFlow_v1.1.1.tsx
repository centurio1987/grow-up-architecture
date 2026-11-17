// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다. 생명선 머리 위 작은 글자가 GoF 역할 이름이다.
// 출처: GoF 원서 Facade — Collaborations
//
// 판: facade-guide_v1.1.1 의 그림이다(→ facade-flow_v1.1.1.png). 화살표 하나가 시나리오 1 단계 표의 한 줄이고,
// 화살표 번호가 그 단계 번호다. 6단계는 표에서 두 줄(확정 · 배정)이라 화살표도 둘이다.
// 앞 판(v1.0.0 ~ v1.1.0)이 쓰는 그림은 FacadeFlow.tsx → facade-flow.png 그대로 둔다.
//
// 주장: 요청 한 번이 Facade 안에서 서브시스템 호출 여섯으로 나뉜다. 서브시스템에서 출발하는 화살표는
// 하나도 없다 — 돌아온 값은 화살표 글자(→ 뒤)에 적었고, 서브시스템끼리 잇는 화살표도 없다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 136;
const LIFE_H = 470;
const HEAD_W = 124;

const LANES = [
  { id: 'client', x: GUTTER + 70, label: '예약 화면' },
  { id: 'desk', x: GUTTER + 222, label: 'BookingDesk' },
  { id: 'room', x: GUTTER + 390, label: 'RoomCatalog' },
  { id: 'schedule', x: GUTTER + 527, label: 'ScheduleBook' },
  { id: 'equip', x: GUTTER + 664, label: 'EquipmentPool' },
  { id: 'notice', x: GUTTER + 800, label: 'NoticeSender' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

// 머리 위 역할 이름 — 서브시스템 클래스는 넷을 한 줄로 묶는다.
const ROLES = [
  { text: 'CLIENT', from: 'client', to: 'client' },
  { text: 'FACADE', from: 'desk', to: 'desk' },
  { text: 'SUBSYSTEM CLASSES', from: 'room', to: 'notice' },
];

const STEPS = [
  { from: 'client', to: 'desk', y: 212, text: '1. 업무 말로 요청한다' },
  { from: 'desk', to: 'desk', y: 258, text: '2. 넷이 아는 말로 옮긴다' },
  { from: 'desk', to: 'room', y: 324, text: '3. 방 후보 → R2, R3, R4' },
  { from: 'desk', to: 'schedule', y: 366, text: '4. 빈 방 → R2' },
  { from: 'desk', to: 'equip', y: 408, text: '5. 남은 프로젝터 → 2대' },
  { from: 'desk', to: 'schedule', y: 450, text: '6. R2 14시를 확정한다' },
  { from: 'desk', to: 'equip', y: 492, text: '6. 프로젝터 1대를 배정한다' },
  { from: 'desk', to: 'notice', y: 534, text: '7. 안내를 맡긴다' },
  { from: 'desk', to: 'client', y: 584, text: '8. 결과 한 줄을 돌려준다', dashed: true },
];

export default function FacadeFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={640}>
      <DiagramHeader eyebrow="Facade collaboration" title="한 번의 요청이 안에서 여럿으로 나뉜다" />
      {ROLES.map((r) => {
        const left = CX[r.from] - HEAD_W / 2;
        const right = CX[r.to] + HEAD_W / 2;
        const span = r.from !== r.to;
        return (
          <g key={r.text}>
            <text
              x={(left + right) / 2}
              y={TOP - 14}
              textAnchor="middle"
              fontFamily={f.typography.monoFont}
              fontSize={11}
              letterSpacing="1.4"
              fill={ink}
              opacity={0.7}
            >
              {r.text}
            </text>
            {span && <line x1={left} y1={TOP - 7} x2={right} y2={TOP - 7} stroke={ink} strokeWidth={1} opacity={0.4} />}
          </g>
        );
      })}
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        // Client 와 오가는 줄은 가운데에, 창구에서 나가는 줄은 창구 생명선 바로 오른쪽에서 글자를 시작한다
        // — 바로 옆 생명선(RoomCatalog)까지가 168px 이라 가운데 정렬이면 글자가 생명선을 덮는다.
        // 묻는 줄(3·4·5)은 「물음 → 답」으로, 맡기는 줄(6·7)은 동사로 적는다.
        const fromDesk = s.from === 'desk' && s.to !== 'client';
        const x = fromDesk ? CX.desk + 12 : (CX[s.from] + CX[s.to]) / 2;
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
              x={x}
              y={s.y - 8}
              textAnchor={fromDesk ? 'start' : 'middle'}
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

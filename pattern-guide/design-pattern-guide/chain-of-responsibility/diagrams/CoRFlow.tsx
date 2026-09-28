// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Chain of Responsibility — Collaborations
//
// 주장: 요청은 후보를 정해진 순서로 거치고, 맡은 후보에서 멈춘다. 그래서 그 뒤에 선 후보는
// 같은 요청을 아예 보지 못한다 — 이 「보지 못함」이 사슬과 장식 층을 가르는 자리다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 1104;
const TOP = 112;
const LIFE_H = 404;
const HEAD_W = 196;

const LANES = [
  { id: 'client', x: GUTTER + 106, label: 'Client' },
  { id: 'h1', x: GUTTER + 382, label: 'ConcreteHandler (1번째)' },
  { id: 'h2', x: GUTTER + 658, label: 'ConcreteHandler (2번째)' },
  { id: 'h3', x: GUTTER + 934, label: 'ConcreteHandler (3번째)' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'h1', y: 236, text: '1. 사슬의 첫 후보에게만 요청을 낸다' },
  { from: 'h1', to: 'h1', y: 286, text: '2. 내 책임인가 — 아니다' },
  { from: 'h1', to: 'h2', y: 344, text: '3. 받은 그 요청을 그대로 넘긴다' },
  { from: 'h2', to: 'h2', y: 394, text: '4. 내 책임인가 — 맡는다' },
  { from: 'h2', to: 'client', y: 452, text: '5. 결과를 돌려주고 여기서 멈춘다', dashed: true },
];

export default function CoRFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={596}>
      <DiagramHeader eyebrow="Chain of Responsibility collaboration" title="맡은 자리에서 멈추므로, 뒤 후보는 그 요청을 보지 못한다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 92 : (CX[s.from] + CX[s.to]) / 2;
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 28 } : { x: CX[s.to], y: s.y }}
              waypoints={self ? [{ x: CX[s.from] + 84, y: s.y }, { x: CX[s.from] + 84, y: s.y + 28 }] : undefined}
              routing="orthogonal"
              markerEnd="arrow"
              strokeDasharray={s.dashed ? '6 3' : undefined}
              stroke={ink}
            />
            <text
              x={mid}
              y={s.y - 9}
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
      <text
        x={CX.h3}
        y={534}
        textAnchor="middle"
        fontFamily={f.typography.bodyFont}
        fontSize={13}
        fill={ink}
        opacity={0.75}
      >
        6. 이 요청은 여기까지 오지 않는다
      </text>
      <text
        x={CX.client}
        y={562}
        textAnchor="start"
        fontFamily={f.typography.bodyFont}
        fontSize={12.5}
        fill={ink}
        opacity={0.75}
      >
        아무도 맡지 않으면 요청은 사슬 끝에서 처리되지 않은 채 끝난다 — 그것도 정상 종료다.
      </text>
    </Canvas>
  );
}

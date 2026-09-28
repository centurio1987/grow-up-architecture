// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Interpreter — Collaborations
//
// 주장: 조립과 초기화는 Client 가 한 번에 끝내고, 그 뒤 호출은 루트에서 아래로만 간다.
// 비단말은 하위의 답을 받아 합성하고, 단말은 Context 만 건드린 뒤 되돌아온다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 1060;
const TOP = 112;
const LIFE_H = 460;
const HEAD_W = 200;

const LANES = [
  { id: 'client', x: GUTTER + 120, label: 'Client' },
  { id: 'non', x: GUTTER + 380, label: 'NonterminalExpression' },
  { id: 'term', x: GUTTER + 620, label: 'TerminalExpression' },
  { id: 'ctx', x: GUTTER + 860, label: 'Context' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'client', y: 196, text: '1. 문장을 노드 트리로 조립한다' },
  { from: 'client', to: 'ctx', y: 250, text: '2. Context 를 사건으로 초기화한다' },
  { from: 'client', to: 'non', y: 296, text: '3. 루트의 해석을 부른다' },
  { from: 'non', to: 'term', y: 340, text: '4. 왼쪽 하위의 해석을 부른다' },
  { from: 'term', to: 'ctx', y: 384, text: '5. 값을 읽고 검사 횟수를 적는다' },
  { from: 'term', to: 'non', y: 428, text: '5 의 답이 되돌아온다', dashed: true },
  { from: 'non', to: 'term', y: 472, text: '6. 오른쪽 하위를 부른다 (왼쪽이 참일 때만)' },
  { from: 'non', to: 'client', y: 524, text: '7. 합성한 답을 되돌린다', dashed: true },
];

export default function InterpreterFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={600}>
      <DiagramHeader
        eyebrow="Interpreter collaboration"
        title="조립과 초기화는 Client 가, 합성은 트리가 한다"
      />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 95 : (CX[s.from] + CX[s.to]) / 2;
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

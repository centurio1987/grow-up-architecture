// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Command — Motivation · Collaborations
//
// 주장: Client 가 받을 대상을 커맨드 안에 묶어 두면, 그 뒤로 Invoker 는 실행 연산 하나만 부른다.
// Invoker 에서 Receiver 로 바로 가는 줄은 하나도 없다 — 문서를 건드리는 줄은 전부 커맨드에서 나간다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 1020;
const TOP = 112;
const LIFE_H = 474;
const HEAD_W = 170;

const LANES = [
  { id: 'client', x: GUTTER + 85, label: 'Client' },
  { id: 'session', x: GUTTER + 352, label: 'EditorSession' },
  { id: 'command', x: GUTTER + 619, label: 'InsertText' },
  { id: 'document', x: GUTTER + 886, label: 'TextDocument' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  // dx — 이 엣지의 중점이 EditorSession 생명선 위라, 글자를 왼쪽으로 밀어 선을 피한다.
  { from: 'client', to: 'command', y: 190, text: '1. 받을 문서와 인자를 묶는다', dx: -128 },
  { from: 'client', to: 'session', y: 240, text: '2. 버튼에 커맨드를 건다', dx: 0 },
  { from: 'client', to: 'session', y: 290, text: '3. 버튼을 누른다', dx: 0 },
  { from: 'session', to: 'command', y: 340, text: '4. execute() 만 부른다', dx: 0 },
  { from: 'command', to: 'document', y: 390, text: '5. insert(0, "TODO ")', dx: 0 },
  { from: 'session', to: 'session', y: 440, text: '6. 이력에 쌓는다', dx: 0 },
  { from: 'session', to: 'command', y: 506, text: '7. undo() 를 부른다', dx: 0 },
  { from: 'command', to: 'document', y: 554, text: '7. delete(0, 5)', dx: 0 },
];

export default function CommandFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={620}>
      <DiagramHeader eyebrow="Command collaboration" title="문서를 건드리는 줄은 전부 커맨드에서 나간다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 52 : (CX[s.from] + CX[s.to]) / 2 + s.dx;
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

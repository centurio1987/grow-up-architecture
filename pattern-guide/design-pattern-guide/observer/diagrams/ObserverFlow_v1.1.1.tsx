// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Observer — Collaborations
//
// 판: observer-guide_v1.1.1 의 그림이다(→ observer-flow_v1.1.1.png). 화살표 하나가 시나리오 1 단계 표의 한 줄이고,
// 화살표 번호가 그 단계 번호다. 앞 판(v1.0.0 ~ v1.1.0)이 쓰는 그림은 ObserverFlow.tsx → observer-flow.png 그대로 둔다.
//
// 주장: 주체는 자기 상태를 먼저 맞춘 뒤, 등록된 목록에 같은 통지 하나를 뿌린다. 통지에는 무엇을 하라는 말이
// 없어서, 받은 옵저버가 스스로 주체에 되묻고(5) 저마다 자기 상태만 맞춘다(6 · 7). 되물어 받은 값은 화살표 글자
// (→ 뒤)에 적었다. 옵저버 칸은 현황판 · 경보 · 감사 로그 셋이 함께 쓴다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 472;
const HEAD_W = 210;

const LANES = [
  { id: 'client', x: GUTTER + 110, label: 'Client' },
  { id: 'subject', x: GUTTER + 380, label: 'ConcreteSubject' },
  { id: 'observer', x: GUTTER + 640, label: 'ConcreteObserver 셋' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'client', to: 'subject', y: 200, text: '1. 옵저버 셋을 등록한다 (attach)' },
  { from: 'client', to: 'subject', y: 246, text: '2. 출고 9개를 요청한다' },
  { from: 'subject', to: 'subject', y: 300, text: '3. 수량을 먼저 12 → 3 으로 바꾼다' },
  { from: 'subject', to: 'observer', y: 376, text: '4. 등록된 전부에게 같은 통지 (updated)' },
  { from: 'observer', to: 'subject', y: 422, text: '5. 현황판이 수량을 되묻는다 → 3' },
  { from: 'observer', to: 'observer', y: 470, text: '6. 현황판이 자기 표시만 3 으로 맞춘다' },
  { from: 'observer', to: 'observer', y: 536, text: '7. 경보는 켜고, 로그는 한 줄 남긴다' },
];

export default function ObserverFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={628}>
      <DiagramHeader eyebrow="Observer collaboration" title="주체는 사실만 뿌리고, 반응은 옵저버가 한다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        // 자기 호출은 생명선 바로 오른쪽에서 글자를 시작한다 — 옵저버 칸은 오른쪽 끝이라 가운데 정렬이면 캔버스를 넘는다.
        const x = self ? CX[s.from] + 12 : (CX[s.from] + CX[s.to]) / 2;
        return (
          <g key={s.text}>
            <Edge
              from={{ x: CX[s.from], y: s.y }}
              to={self ? { x: CX[s.from], y: s.y + 26 } : { x: CX[s.to], y: s.y }}
              waypoints={self ? [{ x: CX[s.from] + 80, y: s.y }, { x: CX[s.from] + 80, y: s.y + 26 }] : undefined}
              routing="orthogonal"
              markerEnd="arrow"
              stroke={ink}
            />
            <text
              x={x}
              y={s.y - 8}
              textAnchor={self ? 'start' : 'middle'}
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

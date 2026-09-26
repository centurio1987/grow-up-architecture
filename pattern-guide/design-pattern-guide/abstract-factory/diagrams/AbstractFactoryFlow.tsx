// @relation linear
// @viz-type VT-108
// 역할 규약: **면제 ④(모델형)** — 생명선이 패턴의 참여 역할이다.
// 출처: GoF 원서 Abstract Factory — Collaborations
//
// 주장: 계열은 맨 앞 한 번만 정해지고, 그 뒤 요청은 전부 추상 타입 위를 지난다.
// Client 는 제품을 두 번 받아 쓰면서도 어느 계열인지 모른다.
import { Canvas, Edge, Lifeline, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';

const W = 912;
const TOP = 112;
const LIFE_H = 480;
const HEAD_W = 176;

const LANES = [
  { id: 'config', x: GUTTER + 90, label: '구성 지점' },
  { id: 'client', x: GUTTER + 340, label: 'Client' },
  { id: 'factory', x: GUTTER + 570, label: 'AbstractFactory 참조' },
  { id: 'product', x: GUTTER + 790, label: 'AbstractProduct 참조' },
];
const CX = Object.fromEntries(LANES.map((l) => [l.id, l.x])) as Record<string, number>;

const STEPS = [
  { from: 'config', to: 'config', y: 240, text: '1. ConcreteFactory 하나를 고르고 만든다' },
  { from: 'config', to: 'client', y: 296, text: '2. AbstractFactory 타입으로 넘긴다' },
  { from: 'client', to: 'factory', y: 344, text: '3. 제목 제품을 요청한다' },
  { from: 'factory', to: 'client', y: 388, text: '4. 같은 계열 제품', dashed: true },
  { from: 'client', to: 'factory', y: 432, text: '5. 표 제품을 요청한다' },
  { from: 'factory', to: 'client', y: 476, text: '6. 같은 계열 제품', dashed: true },
  { from: 'client', to: 'product', y: 520, text: '7. 추상 타입으로 쓴다' },
  { from: 'product', to: 'client', y: 564, text: '8. 형식에 맞는 조각', dashed: true },
];

export default function AbstractFactoryFlow() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <Canvas width={W} height={610}>
      <DiagramHeader eyebrow="Abstract Factory collaboration" title="계열은 맨 앞에서 한 번, 그 뒤는 추상 타입 위를 지난다" />
      {LANES.map((l) => (
        <Lifeline key={l.id} x={l.x} y={TOP} height={LIFE_H} headWidth={HEAD_W} label={l.label} />
      ))}
      {STEPS.map((s) => {
        const self = s.from === s.to;
        const mid = self ? CX[s.from] + 40 : (CX[s.from] + CX[s.to]) / 2;
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

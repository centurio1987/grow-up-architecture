/**
 * 라이브 동시 시청자 수 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
export const BOX_H = 80;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/** 개념도의 네 상자. 시나리오 1·2 는 이 자리를 그대로 쓰고 tag·note 만 바꾼다. */
export const BROWSER: Box = { x: 24, y: 230, w: 180, role: 'person', tag: 'VIEWERS', name: '시청자 브라우저', note: 'EventSource · 재생 신호' };
export const EDGE: Box = { x: 380, y: 230, w: 200, role: 'container', tag: 'EDGE', name: '에지 서버', note: '연결 목록 · 재생 중 연결 수' };
export const AGG: Box = { x: 690, y: 110, w: 198, role: 'process', tag: 'AGGREGATOR', name: '집계 서비스', note: '에지별 최근 값을 더함' };
export const REDIS: Box = { x: 690, y: 350, w: 198, role: 'queue', tag: 'PUB/SUB', name: 'Redis Pub/Sub', note: '방송마다 채널 하나' };

export function Boxes({ boxes }: { boxes: Box[] }) {
  return (
    <>
      {boxes.map((b) => (
        <RoleBox key={b.tag + b.name} x={b.x} y={b.y} w={b.w} h={b.h ?? BOX_H} role={b.role} tag={b.tag} name={b.name} note={b.note} />
      ))}
    </>
  );
}

type P = { x: number; y: number };

export type LaneSpec = {
  from: P;
  to: P;
  waypoints?: P[];
  dashed?: boolean;
  /** 화살표 곁에 적는 글 — 줄마다 한 문장 조각. 통신 방식과 빈도를 적는다. */
  lines: string[];
  lx: number;
  ly: number;
  anchor?: 'start' | 'middle' | 'end';
  /** 시나리오 단계 번호. 있으면 배지를 (bx, by) 에 그린다. */
  order?: number;
  bx?: number;
  by?: number;
};

export function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill={TONE.sunken} stroke={ink} strokeWidth={1.6} />
      <text x={x} y={y + 4} textAnchor="middle" fontFamily={f.typography.monoFont} fontSize={11.5} fontWeight={700} fill={ink}>
        {n}
      </text>
    </g>
  );
}

export function Lane({ spec }: { spec: LaneSpec }) {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  return (
    <g>
      <Edge
        from={spec.from}
        to={spec.to}
        waypoints={spec.waypoints}
        routing="orthogonal"
        markerEnd="arrow"
        strokeDasharray={spec.dashed ? '6 3' : undefined}
        stroke={ink}
      />
      {spec.lines.map((line, i) => (
        <text
          key={line}
          x={spec.lx}
          y={spec.ly + i * 15}
          textAnchor={spec.anchor ?? 'middle'}
          fontFamily={f.typography.bodyFont}
          fontSize={12}
          fill={ink}
        >
          {line}
        </text>
      ))}
      {spec.order !== undefined && <Badge x={spec.bx ?? spec.lx} y={spec.by ?? spec.ly} n={spec.order} />}
    </g>
  );
}

/** 개념도의 다섯 화살표 자리. 시나리오 그림은 글만 바꿔 쓴다. */
export const PATH = {
  signal: { from: { x: 204, y: 252 }, to: { x: 380, y: 252 } },
  sse: { from: { x: 380, y: 290 }, to: { x: 204, y: 290 } },
  report: { from: { x: 480, y: 230 }, to: { x: 690, y: 150 }, waypoints: [{ x: 480, y: 150 }] },
  publish: { from: { x: 789, y: 190 }, to: { x: 789, y: 350 } },
  deliver: { from: { x: 690, y: 390 }, to: { x: 480, y: 310 }, waypoints: [{ x: 480, y: 390 }] },
} as const;

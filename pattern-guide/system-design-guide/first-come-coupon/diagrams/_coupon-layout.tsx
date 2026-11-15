/**
 * 선착순 쿠폰 발급 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
export const BOX_H = 80;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/** 개념도의 여섯 상자. 시나리오 그림은 이 자리를 그대로 쓰고 tag·note 만 바꾼다. */
export const APP: Box = { x: 24, y: 260, w: 140, role: 'person', tag: 'USERS', name: '사용자 앱', note: '버튼 한 번 = 요청 하나' };
export const API: Box = { x: 300, y: 260, w: 190, role: 'container', tag: 'API', name: '쿠폰 API 서버', note: '판정 순서 · 소진 표시' };
export const REDIS: Box = { x: 300, y: 90, w: 190, h: 100, role: 'database', tag: 'DECISION', name: 'Redis', note: '수량 카운터 · 받은 사람 집합' };
export const QUEUE: Box = { x: 620, y: 260, w: 170, role: 'queue', tag: 'KAFKA', name: '발급 큐', note: '성공한 요청만 쌓임' };
export const WORKER: Box = { x: 620, y: 430, w: 170, role: 'process', tag: 'WORKER', name: '발급 워커', note: '정해 둔 속도로 기록' };
export const DB: Box = { x: 300, y: 420, w: 190, h: 100, role: 'database', tag: 'POSTGRESQL', name: '쿠폰 DB', note: '유니크 제약 둘' };
/**
 * 개념도 밖 배포 세부 — 시나리오 1 · 2 가 기대는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「쿠폰 API 서버」 안의 문단이다.
 * 사용자 앱과 쿠폰 API 서버 사이, 요청 화살표(y=285) 위에 놓는다.
 */
export const LB: Box = { x: 180, y: 261, w: 104, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

export function Boxes({ boxes }: { boxes: Box[] }) {
  return (
    <>
      {boxes.map((b) => (
        <RoleBox
          key={b.tag + b.name}
          x={b.x}
          y={b.y}
          w={b.w}
          h={b.note ? (b.h ?? BOX_H) : b.h}
          role={b.role}
          tag={b.tag}
          name={b.name}
          note={b.note || undefined}
        />
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

/** 개념도의 화살표 자리. 시나리오 그림은 글만 바꿔 쓴다. */
export const PATH = {
  request: { from: { x: 164, y: 285 }, to: { x: 300, y: 285 } },
  toLb: { from: { x: 164, y: 285 }, to: { x: 180, y: 285 } },
  fromLb: { from: { x: 284, y: 285 }, to: { x: 300, y: 285 } },
  answer: { from: { x: 300, y: 318 }, to: { x: 164, y: 318 } },
  decide: { from: { x: 395, y: 260 }, to: { x: 395, y: 190 } },
  enqueue: { from: { x: 490, y: 300 }, to: { x: 620, y: 300 } },
  poll: { from: { x: 705, y: 340 }, to: { x: 705, y: 430 } },
  insert: { from: { x: 620, y: 470 }, to: { x: 490, y: 470 } },
  rebuild: { from: { x: 790, y: 470 }, to: { x: 490, y: 120 }, waypoints: [{ x: 860, y: 470 }, { x: 860, y: 120 }] },
} as const;

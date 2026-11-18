/**
 * 대형 그룹 채팅 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 티켓 예매와 좌석 선점 편의 _ticket-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
export const BOX_H = 80;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/** 개념도의 네 상자. 시나리오 그림은 이 자리를 그대로 쓰거나 한 상자를 인스턴스 여럿으로 나누고 tag·note 만 바꾼다. */
export const APP: Box = { x: 24, y: 330, w: 160, role: 'person', tag: 'APP', name: '사용자 앱', note: '방 화면 · 마지막 순번' };
export const RELAY: Box = { x: 330, y: 330, w: 220, role: 'container', tag: 'RELAY × 67', name: '중계 서버', note: '연결 15000 · 보는 중 목록' };
export const ROOM: Box = { x: 690, y: 130, w: 198, role: 'process', tag: 'ROOM · ONE PER ROOM', name: '방 프로세스', note: '순번을 붙임' };
export const LOG: Box = { x: 690, y: 500, w: 198, h: 110, role: 'database', tag: 'LOG · MAXLEN 100000', name: '방 로그', note: '순번 · 메시지' };
/**
 * 개념도 밖 배포 세부 — 앱의 WebSocket 연결이 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「중계 서버」 안의 문단이다.
 * 사용자 앱과 중계 서버 사이에 세로로 길게 놓아, 보내는 길과 받는 길이 모두 지나게 한다.
 */
export const LB: Box = { x: 206, y: 130, w: 100, h: 300, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

export function Boxes({ boxes }: { boxes: Box[] }) {
  return (
    <>
      {boxes.map((b) => (
        <RoleBox
          key={b.tag + b.name + b.y}
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
  /** 화살표 곁에 적는 글 — 줄마다 한 문장 조각. 통신 방식과 빈도(또는 시각)를 적는다. */
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
  send: { from: { x: 184, y: 352 }, to: { x: 330, y: 352 } },
  deliver: { from: { x: 330, y: 392 }, to: { x: 184, y: 392 } },
  toRoom: { from: { x: 400, y: 330 }, to: { x: 690, y: 160 }, waypoints: [{ x: 400, y: 160 }] },
  toRelays: { from: { x: 690, y: 190 }, to: { x: 500, y: 330 }, waypoints: [{ x: 500, y: 190 }] },
  append: { from: { x: 790, y: 210 }, to: { x: 790, y: 500 } },
  read: { from: { x: 440, y: 410 }, to: { x: 690, y: 555 }, waypoints: [{ x: 440, y: 555 }] },
} as const;

/**
 * 티켓 예매와 좌석 선점 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 결제 · 송금 중복 방지 편의 _payment-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
export const BOX_H = 80;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/** 개념도의 일곱 상자. 시나리오 그림은 이 자리를 그대로 쓰고 tag·note 만 바꾼다. */
export const APP: Box = { x: 24, y: 300, w: 150, role: 'person', tag: 'APP', name: '사용자 앱', note: '지도 · 좌석 · 결제' };
export const ROOM: Box = { x: 300, y: 110, w: 190, role: 'container', tag: 'ROOM', name: '대기실', note: '줄 · 입장 토큰' };
export const CACHE: Box = { x: 650, y: 110, w: 238, h: 110, role: 'database', tag: 'CACHE', name: '좌석 지도 캐시', note: '공연마다 지도 한 장' };
export const API: Box = { x: 300, y: 300, w: 190, role: 'container', tag: 'API', name: '예매 API 서버', note: '점유 · 확정 · 환불' };
export const PAY: Box = { x: 24, y: 490, w: 150, role: 'external', tag: 'PAY', name: '결제 서비스', note: '승인 · 환불' };
export const DB: Box = { x: 300, y: 490, w: 190, h: 110, role: 'database', tag: 'SEAT DB', name: '좌석 DB', note: '좌석 표 · 판매 표' };
export const JOB: Box = { x: 650, y: 490, w: 238, role: 'process', tag: 'JOB · 1 S', name: '지도 갱신 작업', note: '좌석 표를 읽어 지도로' };
/**
 * 개념도 밖 배포 세부 — 사용자 앱의 요청이 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「예매 API 서버」 안의 문단이다.
 * 사용자 앱과 예매 API 서버 사이, 요청 화살표(y=330) 위에 놓는다.
 */
export const LB: Box = { x: 186, y: 306, w: 100, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

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
  join: { from: { x: 99, y: 300 }, to: { x: 300, y: 150 }, waypoints: [{ x: 99, y: 150 }] },
  request: { from: { x: 174, y: 330 }, to: { x: 300, y: 330 } },
  toLb: { from: { x: 174, y: 330 }, to: { x: 186, y: 330 } },
  fromLb: { from: { x: 286, y: 330 }, to: { x: 300, y: 330 } },
  response: { from: { x: 300, y: 368 }, to: { x: 174, y: 368 } },
  apiRoom: { from: { x: 440, y: 300 }, to: { x: 440, y: 190 } },
  roomCache: { from: { x: 490, y: 150 }, to: { x: 650, y: 150 } },
  apiCache: { from: { x: 490, y: 330 }, to: { x: 690, y: 220 }, waypoints: [{ x: 690, y: 330 }] },
  apiDb: { from: { x: 395, y: 380 }, to: { x: 395, y: 490 } },
  apiPay: { from: { x: 330, y: 380 }, to: { x: 99, y: 490 }, waypoints: [{ x: 330, y: 440 }, { x: 99, y: 440 }] },
  jobDb: { from: { x: 650, y: 545 }, to: { x: 490, y: 545 } },
  jobCache: { from: { x: 860, y: 490 }, to: { x: 860, y: 220 } },
} as const;

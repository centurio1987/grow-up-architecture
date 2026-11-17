/**
 * 결제 · 송금 중복 방지 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 API 처리율 제한 편의 _rate-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
export const BOX_H = 80;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/** 개념도의 여덟 상자. 시나리오 그림은 이 자리를 그대로 쓰고 tag·note 만 바꾼다. */
export const APP: Box = { x: 24, y: 130, w: 150, role: 'person', tag: 'APP', name: '사용자 앱', note: '시도마다 멱등 키 하나' };
export const API: Box = { x: 300, y: 130, w: 200, role: 'container', tag: 'API', name: '결제 API 서버', note: '멱등 확인 · 결제사 호출' };
export const PG: Box = { x: 590, y: 130, w: 298, role: 'external', tag: 'PG', name: '결제사', note: '자기 멱등 표 · 거래 기록' };
export const DB: Box = { x: 300, y: 320, w: 200, h: 110, role: 'database', tag: 'PAYMENT DB', name: '결제 DB', note: '멱등 키 표 · 결제 표 · 아웃박스 표' };
export const CONFIRM: Box = { x: 590, y: 320, w: 140, role: 'process', tag: 'JOB · 1 MIN', name: '확정 작업', note: '알 수 없음을 다시 물음' };
export const RECON: Box = { x: 748, y: 320, w: 140, role: 'process', tag: 'BATCH · DAILY', name: '대사 작업', note: '결제사 기록과 맞춤' };
export const RELAY: Box = { x: 300, y: 530, w: 200, role: 'process', tag: 'RELAY', name: '아웃박스 전달기', note: '1초마다 아웃박스를 읽음' };
export const ORDER: Box = { x: 24, y: 530, w: 150, role: 'external', tag: 'ORDER', name: '주문 서비스', note: '결제 id 로 중복을 거름' };
/**
 * 개념도 밖 배포 세부 — 사용자 앱의 요청과 재시도가 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「결제 API 서버」 안의 문단이다.
 * 사용자 앱과 결제 API 서버 사이, 요청 화살표(y=155) 위에 놓는다.
 */
export const LB: Box = { x: 186, y: 131, w: 100, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

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
  request: { from: { x: 174, y: 155 }, to: { x: 300, y: 155 } },
  toLb: { from: { x: 174, y: 155 }, to: { x: 186, y: 155 } },
  fromLb: { from: { x: 286, y: 155 }, to: { x: 300, y: 155 } },
  answer: { from: { x: 300, y: 190 }, to: { x: 174, y: 190 } },
  tx: { from: { x: 400, y: 210 }, to: { x: 400, y: 320 } },
  approve: { from: { x: 500, y: 170 }, to: { x: 590, y: 170 } },
  confirmDb: { from: { x: 590, y: 360 }, to: { x: 500, y: 360 } },
  confirmPg: { from: { x: 610, y: 320 }, to: { x: 610, y: 210 } },
  reconPg: { from: { x: 860, y: 320 }, to: { x: 860, y: 210 } },
  reconDb: { from: { x: 818, y: 400 }, to: { x: 460, y: 430 }, waypoints: [{ x: 818, y: 470 }, { x: 460, y: 470 }] },
  relayDb: { from: { x: 360, y: 530 }, to: { x: 360, y: 430 } },
  notify: { from: { x: 300, y: 570 }, to: { x: 174, y: 570 } },
} as const;

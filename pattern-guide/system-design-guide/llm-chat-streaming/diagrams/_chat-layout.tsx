/**
 * LLM 채팅 서비스 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 알림 대량 발송 편의 _notify-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
const H = 100;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/**
 * 개념도의 일곱 상자. 위 줄은 사용자 쪽(채팅 API · 브라우저 · 스트림 게이트웨이), 가운데 줄은 저장과 대기
 * (대화 저장소 · 요청 대기열 · 토큰 기록), 아래 줄은 GPU 작업자다. 토큰 기록이 대기열 · GPU 작업자 ·
 * 게이트웨이와 모두 이어지므로 오른쪽 가운데에 두어 화살표가 서로 건너지 않게 했다.
 */
export const API: Box = { x: 24, y: 110, w: 200, h: H, role: 'container', tag: 'CHAT API', name: '채팅 API', note: '적고 · 넣고 · 답함' };
export const BROWSER: Box = { x: 356, y: 110, w: 200, h: H, role: 'person', tag: 'BROWSER', name: '브라우저', note: '마지막 순번을 기억' };
export const GATEWAY: Box = { x: 688, y: 110, w: 200, h: H, role: 'container', tag: 'SSE GATEWAY', name: '스트림 게이트웨이', note: '다음 순번부터 보냄' };
export const STORE: Box = { x: 24, y: 330, w: 200, h: H, role: 'database', tag: 'CONVERSATIONS', name: '대화 저장소', note: '질문 · 끝난 답' };
export const QUEUE: Box = { x: 356, y: 330, w: 200, h: H, role: 'queue', tag: 'PAID · FREE', name: '요청 대기열', note: '줄 한도 · 시간 제한 · 차단기' };
export const RECORD: Box = { x: 688, y: 330, w: 200, h: H, role: 'database', tag: 'REDIS STREAMS', name: '토큰 기록', note: '실행마다 순번 · 조각' };
export const WORKER: Box = { x: 356, y: 550, w: 200, h: H, role: 'container', tag: 'GPU WORKERS', name: 'GPU 작업자', note: '연속 배칭 · 빈자리마다 꺼냄' };
/**
 * 개념도 밖 배포 세부 — 브라우저의 요청이 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「스트림 게이트웨이」 안의 문단이다.
 */
export const LB_API: Box = { x: 250, y: 110, w: 80, h: H, role: 'process', tag: 'LB', name: '부하 분산', note: '' };
export const LB_GW: Box = { x: 582, y: 110, w: 80, h: H, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

export function Boxes({ boxes }: { boxes: Box[] }) {
  return (
    <>
      {boxes.map((b) => (
        <RoleBox
          key={b.tag + b.name + b.x + b.y}
          x={b.x}
          y={b.y}
          w={b.w}
          h={b.h}
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

/** 개념도의 화살표 자리. 시나리오 그림은 글만 바꿔 쓴다. 브라우저에서 나가는 화살표는 경로 그림에서 부하 분산을 지난다. */
export const PATH = {
  ask: { from: { x: 356, y: 140 }, to: { x: 224, y: 140 } },
  reply: { from: { x: 224, y: 185 }, to: { x: 356, y: 185 } },
  open: { from: { x: 556, y: 140 }, to: { x: 688, y: 140 } },
  sse: { from: { x: 688, y: 185 }, to: { x: 556, y: 185 } },
  question: { from: { x: 124, y: 210 }, to: { x: 124, y: 330 } },
  enqueue: { from: { x: 200, y: 210 }, waypoints: [{ x: 200, y: 270 }, { x: 406, y: 270 }], to: { x: 406, y: 330 } },
  read: { from: { x: 788, y: 210 }, to: { x: 788, y: 330 } },
  check: { from: { x: 556, y: 380 }, to: { x: 688, y: 380 } },
  take: { from: { x: 456, y: 550 }, to: { x: 456, y: 430 } },
  chunk: { from: { x: 556, y: 600 }, waypoints: [{ x: 788, y: 600 }], to: { x: 788, y: 430 } },
  answer: { from: { x: 356, y: 600 }, waypoints: [{ x: 124, y: 600 }], to: { x: 124, y: 430 } },
  close: { from: { x: 356, y: 400 }, to: { x: 224, y: 400 } },
} as const;

/**
 * 알림 대량 발송 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 홈 타임라인 편의 _home-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
const H = 100;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/**
 * 개념도의 열 상자. 가운데 열이 알림이 지나는 길(알림 API → 우선순위 큐 → 채널 작업자 → SMS 발송사)이고,
 * 오른쪽 열은 저장과 앱이 열려 있을 때의 길, 왼쪽 열은 요청한 서비스 · 실패 큐 · 푸시 발송사다.
 * 시나리오 그림은 이 자리를 그대로 쓰고 tag·note 만 바꾸거나 한 상자를 인스턴스 둘로 나눈다.
 */
export const CALLER: Box = { x: 24, y: 110, w: 200, h: H, role: 'external', tag: 'CALLER SERVICES', name: '요청한 서비스', note: '로그인 · 주문 · 마케팅' };
export const API: Box = { x: 356, y: 110, w: 200, h: H, role: 'container', tag: 'NOTIFY API', name: '알림 API', note: '키 확인 · 적은 뒤 넣기' };
export const STORE: Box = { x: 688, y: 110, w: 200, h: H, role: 'database', tag: 'NOTICES · KEYS', name: '알림 저장소', note: '상태 · 키 · 기기 토큰' };
export const QUEUE: Box = { x: 356, y: 330, w: 200, h: H, role: 'queue', tag: 'URGENT · NORMAL · CAMPAIGN', name: '우선순위 큐', note: '급한 큐부터 꺼냄' };
export const DLQ: Box = { x: 24, y: 550, w: 200, h: H, role: 'queue', tag: 'DEAD-LETTER', name: '실패 큐', note: '다섯 번 실패한 알림' };
export const WORKER: Box = { x: 356, y: 550, w: 200, h: H, role: 'container', tag: 'CHANNEL WORKERS', name: '채널 작업자', note: '응답 가르기 · 차단기' };
export const SSE: Box = { x: 688, y: 550, w: 200, h: H, role: 'container', tag: 'SSE', name: '장기 연결 서버', note: '앱이 열려 있을 때' };
export const PUSHV: Box = { x: 24, y: 770, w: 200, h: H, role: 'external', tag: 'APNS · FCM', name: '푸시 발송사', note: '할당량 안에서' };
export const SMSV: Box = { x: 356, y: 770, w: 200, h: H, role: 'external', tag: 'SMS A · B', name: 'SMS 발송사', note: '차단기가 닫힌 쪽으로' };
export const DEVICE: Box = { x: 688, y: 770, w: 200, h: H, role: 'person', tag: 'DEVICE', name: '사용자 기기', note: '앱 · 문자' };
/**
 * 개념도 밖 배포 세부 — 요청한 서비스의 요청이 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「알림 API」 안의 문단이다.
 */
export const LB: Box = { x: 250, y: 110, w: 80, h: H, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

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

/** 개념도의 화살표 자리. 시나리오 그림은 글만 바꿔 쓴다. 요청한 서비스에서 나가는 화살표는 경로 그림에서 부하 분산을 지난다. */
export const PATH = {
  post: { from: { x: 224, y: 140 }, to: { x: 356, y: 140 } },
  store: { from: { x: 556, y: 140 }, to: { x: 688, y: 140 } },
  enqueue: { from: { x: 456, y: 210 }, to: { x: 456, y: 330 } },
  take: { from: { x: 456, y: 430 }, to: { x: 456, y: 550 } },
  requeue: { from: { x: 520, y: 550 }, to: { x: 520, y: 430 } },
  dlq: { from: { x: 356, y: 600 }, to: { x: 224, y: 600 } },
  record: { from: { x: 556, y: 570 }, waypoints: [{ x: 640, y: 570 }, { x: 640, y: 260 }, { x: 740, y: 260 }], to: { x: 740, y: 210 } },
  sse: { from: { x: 556, y: 620 }, to: { x: 688, y: 620 } },
  history: { from: { x: 840, y: 550 }, to: { x: 840, y: 210 } },
  push: { from: { x: 400, y: 650 }, waypoints: [{ x: 400, y: 710 }, { x: 124, y: 710 }], to: { x: 124, y: 770 } },
  sms: { from: { x: 456, y: 650 }, to: { x: 456, y: 770 } },
  stream: { from: { x: 800, y: 650 }, to: { x: 800, y: 770 } },
  ack: { from: { x: 740, y: 770 }, to: { x: 740, y: 650 } },
  text: { from: { x: 556, y: 820 }, to: { x: 688, y: 820 } },
  deliver: { from: { x: 124, y: 870 }, waypoints: [{ x: 124, y: 900 }, { x: 788, y: 900 }], to: { x: 788, y: 870 } },
} as const;

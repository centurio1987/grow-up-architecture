/**
 * 승차 공유 배차 매칭 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 LLM 채팅 서비스 편의 _chat-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
const H = 100;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/**
 * 개념도의 일곱 상자. 위 줄은 두 앱(기사 앱 · 손님 앱), 가운데 줄은 서버 둘(위치 수집 서비스 · 배차 서비스),
 * 아래 줄은 저장소 셋(위치 인덱스 · 기사 기록 저장소 · 요청 기록 저장소)이다. 배차 서비스가 두 앱과 저장소 셋에
 * 모두 이어지므로 가운데에 두어 화살표가 서로 건너지 않게 했다.
 */
export const DRIVER: Box = { x: 24, y: 110, w: 200, h: H, role: 'person', tag: 'DRIVER APP', name: '기사 앱', note: '5초마다 위치 · 제안에 답함' };
export const RIDER: Box = { x: 688, y: 110, w: 200, h: H, role: 'person', tag: 'RIDER APP', name: '손님 앱', note: '요청마다 멱등 키' };
export const INGEST: Box = { x: 24, y: 330, w: 200, h: H, role: 'container', tag: 'LOCATION INGEST', name: '위치 수집 서비스', note: '셀 ID · 고리로 노드' };
export const DISPATCH: Box = { x: 356, y: 330, w: 200, h: H, role: 'container', tag: 'DISPATCH', name: '배차 서비스', note: '9칸 · 조건부 쓰기 · 15초' };
export const INDEX: Box = { x: 24, y: 550, w: 200, h: H, role: 'database', tag: 'REDIS · CELLS', name: '위치 인덱스', note: '셀마다 정렬 집합 · 메모리' };
export const RECORD: Box = { x: 356, y: 550, w: 200, h: H, role: 'database', tag: 'DRIVERS', name: '기사 기록 저장소', note: '상태 · 요청 ID · 만료' };
export const REQUESTS: Box = { x: 688, y: 550, w: 200, h: H, role: 'database', tag: 'REQUESTS', name: '요청 기록 저장소', note: '멱등 키 · 결과' };
/**
 * 개념도 밖 배포 세부 — 앱의 요청이 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「위치 수집 서비스」 · 「배차 서비스」 안의 문단이다.
 */
export const LB_INGEST: Box = { x: 84, y: 240, w: 80, h: 60, role: 'process', tag: 'LB', name: '부하 분산', note: '' };
export const LB_DRIVER: Box = { x: 252, y: 112, w: 80, h: 56, role: 'process', tag: 'LB', name: '부하 분산', note: '' };
export const LB_RIDER: Box = { x: 580, y: 112, w: 80, h: 56, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

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

/**
 * 개념도의 화살표 자리. 시나리오 그림은 글만 바꿔 쓰고, 앱에서 서버로 가는 화살표는 부하 분산에서 두 토막으로 나눈다.
 * 배차 서비스가 앱에 보내는 제안 · 결과는 앱과 열어 둔 연결로 가므로 부하 분산을 지나지 않는다(점선).
 */
export const PATH = {
  locate: { from: { x: 124, y: 210 }, to: { x: 124, y: 330 } },
  accept: { from: { x: 224, y: 140 }, waypoints: [{ x: 406, y: 140 }], to: { x: 406, y: 330 } },
  offer: { from: { x: 380, y: 330 }, waypoints: [{ x: 380, y: 185 }], to: { x: 224, y: 185 } },
  request: { from: { x: 688, y: 140 }, waypoints: [{ x: 506, y: 140 }], to: { x: 506, y: 330 } },
  result: { from: { x: 532, y: 330 }, waypoints: [{ x: 532, y: 185 }], to: { x: 688, y: 185 } },
  write: { from: { x: 124, y: 430 }, to: { x: 124, y: 550 } },
  search: { from: { x: 356, y: 410 }, waypoints: [{ x: 250, y: 410 }, { x: 250, y: 600 }], to: { x: 224, y: 600 } },
  hold: { from: { x: 456, y: 430 }, to: { x: 456, y: 550 } },
  key: { from: { x: 556, y: 380 }, waypoints: [{ x: 788, y: 380 }], to: { x: 788, y: 550 } },
} as const;

/** 부하 분산을 지나는 앱의 화살표 — 앞 토막(앱 → 부하 분산)에 글을 달고, 뒤 토막은 글 없이 잇는다. */
export const VIA = {
  locateIn: { from: { x: 124, y: 210 }, to: { x: 124, y: 240 } },
  locateOut: { from: { x: 124, y: 300 }, to: { x: 124, y: 330 } },
  acceptIn: { from: { x: 224, y: 140 }, to: { x: 252, y: 140 } },
  acceptOut: { from: { x: 332, y: 140 }, waypoints: [{ x: 406, y: 140 }], to: { x: 406, y: 330 } },
  requestIn: { from: { x: 688, y: 140 }, to: { x: 660, y: 140 } },
  requestOut: { from: { x: 580, y: 140 }, waypoints: [{ x: 506, y: 140 }], to: { x: 506, y: 330 } },
} as const;

/**
 * 홈 타임라인 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 광고 클릭 집계 편의 _ad-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;
const H = 100;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/**
 * 개념도의 여덟 상자. 위 줄은 글이 들어오는 길, 왼쪽 열은 타임라인을 읽는 길, 가운데 열은 퍼뜨리는 길이다.
 * 시나리오 그림은 이 자리를 그대로 쓰고 tag·note 만 바꾼다.
 */
export const APP: Box = { x: 24, y: 110, w: 200, h: H, role: 'person', tag: 'APP', name: '사용자 앱', note: '글 쓰기 · 타임라인 열기' };
export const POSTS: Box = { x: 356, y: 110, w: 200, h: H, role: 'container', tag: 'POST API', name: '글 서비스', note: '글 ID 발급 · 작업 넣기' };
export const STORE: Box = { x: 688, y: 110, w: 200, h: H, role: 'database', tag: 'POSTS · AUTHOR LISTS', name: '글 저장소', note: '본문 · 작성자별 글 ID' };
export const READER: Box = { x: 24, y: 330, w: 200, h: H, role: 'container', tag: 'TIMELINE API', name: '타임라인 서비스', note: '캐시에 큰 계정을 섞음' };
export const QUEUE: Box = { x: 356, y: 330, w: 200, h: H, role: 'queue', tag: 'JOB QUEUE', name: '퍼뜨리기 큐', note: '글마다 작업 · 실패면 다시' };
export const CACHE: Box = { x: 24, y: 550, w: 200, h: H, role: 'database', tag: 'REDIS · SORTED SETS', name: '타임라인 캐시', note: '사용자마다 글 ID 800개' };
export const WORKER: Box = { x: 356, y: 550, w: 200, h: H, role: 'container', tag: 'FAN-OUT WORKERS', name: '퍼뜨리기 작업자', note: '최근 접속한 팔로워에게' };
export const GRAPH: Box = { x: 688, y: 550, w: 200, h: H, role: 'database', tag: 'SOCIAL GRAPH', name: '팔로우 그래프', note: '팔로우 관계 · 마지막 접속' };
/**
 * 개념도 밖 배포 세부 — 앱의 요청이 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「타임라인 서비스」 안의 문단이다.
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

/** 개념도의 화살표 자리. 시나리오 그림은 글만 바꿔 쓴다. 앱에서 나가는 두 화살표는 경로 그림에서 부하 분산을 지난다. */
export const PATH = {
  post: { from: { x: 224, y: 140 }, to: { x: 356, y: 140 } },
  store: { from: { x: 556, y: 140 }, to: { x: 688, y: 140 } },
  enqueue: { from: { x: 456, y: 210 }, to: { x: 456, y: 330 } },
  take: { from: { x: 456, y: 430 }, to: { x: 456, y: 550 } },
  graph: { from: { x: 556, y: 600 }, to: { x: 688, y: 600 } },
  write: { from: { x: 356, y: 600 }, to: { x: 224, y: 600 } },
  open: { from: { x: 124, y: 210 }, to: { x: 124, y: 330 } },
  range: { from: { x: 124, y: 430 }, to: { x: 124, y: 550 } },
  lists: { from: { x: 190, y: 330 }, waypoints: [{ x: 190, y: 295 }, { x: 840, y: 295 }], to: { x: 840, y: 210 } },
  follows: { from: { x: 224, y: 410 }, waypoints: [{ x: 300, y: 410 }, { x: 300, y: 510 }, { x: 788, y: 510 }], to: { x: 788, y: 550 } },
} as const;

/**
 * 광고 클릭 집계 — 도식 넷이 함께 쓰는 상자 자리와 화살표 그리기.
 *
 * 개념도와 시나리오 경로 그림의 상자 이름·자리가 같아야 한다(명세 SD11). 그래서 자리를 여기 한 곳에 둔다.
 * 색·글꼴은 foundation 과 frame 의 TONE 에서만 온다. 틀은 대형 그룹 채팅 편의 _chat-layout.tsx 를 이어 썼다.
 */
import { Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { RoleBox, TONE, type Role } from '../../../../viz/frame/frame';

export const W = 912;

export type Box = { x: number; y: number; w: number; h?: number; role: Role; tag: string; name: string; note: string };

/**
 * 개념도의 일곱 상자. 위 줄은 클릭이 오른쪽으로 가는 길, 아래 줄은 결과가 왼쪽으로 돌아오는 길이다.
 * 시나리오 그림은 이 자리를 그대로 쓰거나 한 상자를 인스턴스 여럿으로 나누고 tag·note 만 바꾼다.
 */
export const APP: Box = { x: 24, y: 110, w: 200, role: 'person', tag: 'APP', name: '사용자 앱', note: '광고를 누름 · 응답 없으면 다시' };
export const ADSRV: Box = { x: 356, y: 110, w: 200, role: 'container', tag: 'AD SERVER × 10', name: '광고 서버', note: '서명 확인 · 클릭 ID · 클릭 시각' };
export const CLICKS: Box = { x: 688, y: 110, w: 200, role: 'queue', tag: 'KAFKA · 8 PARTITIONS', name: '클릭 토픽', note: '키 = 클릭 ID · 3일 보관' };
export const JOB: Box = { x: 688, y: 350, w: 200, role: 'container', tag: 'FLINK · 8 TASKS', name: '집계 작업', note: '거르기 · 1분 창 · 부분합 · 합치기' };
export const RTOPIC: Box = { x: 356, y: 350, w: 200, role: 'queue', tag: 'KAFKA · TRANSACTIONS', name: '결과 토픽', note: '커밋된 것만 읽힘' };
export const TABLE: Box = { x: 24, y: 350, w: 200, h: 104, role: 'database', tag: 'UPSERT TABLE', name: '결과 표', note: '(광고 ID, 분 시작) 으로 덮어씀' };
export const CKPT: Box = { x: 688, y: 560, w: 200, h: 104, role: 'database', tag: 'SNAPSHOTS', name: '체크포인트 저장소', note: '상태 사본 · 읽은 위치' };
/**
 * 개념도 밖 배포 세부 — 앱의 클릭 요청이 지나는 앞단의 부하 분산(명세 SD11, 1.1.0).
 * 개념도 상자가 아니라 경로 그림에만 그린다. 정식 설명은 기술 항목 「광고 서버」 안의 문단이다.
 */
export const LB: Box = { x: 250, y: 110, w: 80, h: 90, role: 'process', tag: 'LB', name: '부하 분산', note: '' };

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

/** 개념도의 화살표 자리. 시나리오 그림은 글만 바꿔 쓴다. */
export const PATH = {
  click: { from: { x: 224, y: 155 }, to: { x: 356, y: 155 } },
  produce: { from: { x: 556, y: 155 }, to: { x: 688, y: 155 } },
  consume: { from: { x: 788, y: 190 }, to: { x: 788, y: 350 } },
  commit: { from: { x: 688, y: 400 }, to: { x: 556, y: 400 } },
  load: { from: { x: 356, y: 400 }, to: { x: 224, y: 400 } },
  snapshot: { from: { x: 788, y: 430 }, to: { x: 788, y: 560 } },
} as const;

// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ticket-layout.tsx) — 예매 화면이 있는 앱은 person,
// 여러 대가 뜨는 대기실 · 예매 API 서버는 container, 좌석 지도 캐시 · 좌석 DB 는 database, 우리가 만들지 않는
// 결제 서비스는 external, 1초마다 실행되는 지도 갱신 작업은 process.
// 출처: 리서치 노트 system-design-ticket-seat-hold-2026-11-17 1절(추천 구조) · 4-1(대기실 · 입장 토큰 · 입장 속도) ·
// 4-2(좌석 점유와 만료) · 4-3(판매 확정과 점유 번호) · 4-4(판매 표의 유일 제약) · 4-6(좌석 지도를 점유 경로에서 뗌).
// 화살표의 빈도와 시간 값은 이 가이드의 설정이고 code/ 의 상수(TICK · RATE · HOLD_TTL)와 같다. 차례 확인 20초는
// 이 가이드의 설정이며 코드는 흉내 내지 않는다(상황 설정의 대역 표).
//
// 대기실이 세는 「고르는 중인 사람 수」는 예매 API 서버의 점유 성공 알림으로 줄어든다(기술 항목 「대기실」 · 「예매 API 서버」).
//
// 주장: 입장 속도는 대기실이 정하고, 좌석 점유는 좌석 DB 의 행 하나를 바꾸는 조건부 UPDATE 한 문장이며,
// 판매 확정은 점유 번호가 그대로이고 만료 전일 때만 된다. 좌석 지도는 1초마다 따로 만들어 캐시에서 읽는다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Boxes, CACHE, DB, JOB, Lane, PATH, PAY, ROOM, W } from './_ticket-layout';

const LANES = [
  { ...PATH.join, lines: ['HTTPS · 줄 서기 한 번', '차례 확인 20초마다'], lx: 200, ly: 124 },
  { ...PATH.request, lines: ['HTTPS · 입장 토큰', '누를 때마다'], lx: 237, ly: 352 },
  { ...PATH.roomCache, lines: ['캐시 읽기 · 1초마다', '빈 좌석 수'], lx: 570, ly: 124 },
  { ...PATH.apiRoom, lines: ['HTTPS 점유 성공 알림', '점유마다'], lx: 430, ly: 240, anchor: 'end' as const },
  { ...PATH.apiCache, lines: ['캐시 읽기', '지도를 열 때마다'], lx: 680, ly: 262, anchor: 'end' as const },
  { ...PATH.apiDb, lines: ['SQL · 좌석을 누를 때마다 UPDATE', '결제마다 확정 트랜잭션'], lx: 405, ly: 420, anchor: 'start' as const },
  { ...PATH.apiPay, lines: ['HTTPS 승인 · 결제마다', '환불 · 확정이 0행일 때'], lx: 200, ly: 408 },
  { ...PATH.jobDb, lines: ['SQL SELECT', '1초마다'], lx: 570, ly: 522 },
  { ...PATH.jobCache, lines: ['캐시 쓰기 · 1초마다', '지도 한 장을 통째로'], lx: 850, ly: 330, anchor: 'end' as const },
];

export default function TicketContainers() {
  return (
    <C4ContainerDiagram width={W} height={770} title="티켓 예매와 좌석 선점의 일곱 실행 단위">
      <DiagramHeader eyebrow="Ticket seat hold · containers" title="입장은 대기실이 정하고, 좌석은 조건부 UPDATE 한 문장으로" />
      <Boxes boxes={[APP, { ...ROOM, tag: 'ROOM · 10 / S' }, CACHE, { ...API, tag: 'API · SCALE OUT' }, PAY, DB, JOB]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="좌석 하나의 상태 (좌석 표의 행 하나)"
        tone="sunken"
        lines={[
          '빈 좌석 → 점유: 조건부 UPDATE 한 문장, 점유 번호 +1, 만료 시각 = 지금 + 10분. 0행이면 「이미 점유됨」',
          '점유 → 판매: 결제 승인 뒤 점유 번호가 그대로이고 만료 전일 때만. 판매 표의 (공연, 좌석) 유일 제약이 마지막 확인',
          '만료 시각이 지난 점유는 청소 작업 없이 빈 좌석으로 본다 — 점유 판정과 지도 갱신이 같은 식을 쓴다',
        ]}
      />
    </C4ContainerDiagram>
  );
}

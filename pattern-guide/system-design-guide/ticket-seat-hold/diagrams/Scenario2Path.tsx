// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ticket-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 들어온 사람의 요청이 앞단의 부하 분산을 지나 예매 API 서버 여러 대로 가므로 개념도 밖 배포 세부인 「부하 분산」(LB)을
// 요청 경로에 그린다(명세 SD11, 1.1.0). 코드는 부하 분산과 서버 대수를 흉내 내지 않는다 — 판정이 좌석 DB 에 있어 대수와 상관없다.
// 출처: code/expected-output.txt 의 시나리오 2 줄(좌석 23 의 2050 · 14050 · 22151 · 23000 · 34151 · 302252 · 304253 · 305000ms,
// guide · guide room · for-update · for-update room · split-select-update · optimistic-version · no room 합계). no room 줄은 시뮬레이션이 아니라
// 도착 시각 표에서 센 하한이고 20000 은 도착한 사람 수다.
// 2만 명 · 60초 · 500석 · 초당 10명 · 앞쪽 빈 좌석 100석 가운데 하나는 이 가이드의 가정이다(code/ 의 main · RATE · WINDOW).
// 배지 번호는 본문 시나리오 2 의 단계 번호와 같다.
//
// 주장: 2만 명이 1분 안에 몰려도 대기실이 초당 10명씩 500명만 들이고, 같은 좌석을 같은 순간 누른 두 사람 가운데
// 조건부 UPDATE 가 1행을 주는 것은 한 사람뿐이라 500석이 이중 판매 없이 팔린다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Boxes, CACHE, DB, JOB, LB, Lane, PATH, PAY, ROOM, W } from './_ticket-layout';

const LANES = [
  { ...PATH.join, lines: ['0 ~ 60초에 2만 명이 줄에 섬', '1초마다 10명씩 500명 입장'], lx: 200, ly: 124, order: 1, bx: 99, by: 225 },
  { ...PATH.toLb, lines: ['HTTPS · 입장 토큰'], lx: 237, ly: 292 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.roomCache, lines: ['캐시 읽기 · 1초마다', '빈 좌석 > 고르는 중일 때만'], lx: 570, ly: 124 },
  { ...PATH.apiRoom, lines: ['HTTPS 점유 성공 알림', '점유마다 · 500번'], lx: 430, ly: 240, anchor: 'end' as const },
  { ...PATH.apiCache, lines: ['2050ms U16 · U17 이', '같은 지도에서 좌석 23'], lx: 680, ly: 262, anchor: 'end' as const, order: 2, bx: 690, by: 290 },
  {
    ...PATH.apiDb,
    lines: ['22151ms U16 1행 · U17 0행', '34151ms U134 0행', '304253ms U16 확정 1행'],
    lx: 405, ly: 422, anchor: 'start' as const, order: 3, bx: 395, by: 398,
  },
  { ...PATH.jobDb, lines: ['SELECT', '1초마다'], lx: 570, ly: 522 },
  { ...PATH.jobCache, lines: ['23000ms 좌석 23 점유로', '305000ms 판매로'], lx: 850, ly: 330, anchor: 'end' as const, order: 4, bx: 860, by: 300 },
  { ...PATH.apiPay, lines: ['점유마다 승인 한 번', '판매 500건'], lx: 200, ly: 408 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={820} title="시나리오 2 — 2만 명이 몰릴 때 대기실과 조건부 UPDATE 가 받아 내는 길">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="입장은 초당 10명, 같은 좌석은 한 사람만 1행" />
      <Boxes
        boxes={[
          { ...APP, tag: 'U1 ~ U20000', note: '앞쪽 100석 중 하나' },
          { ...ROOM, tag: 'ROOM · 10 / S', note: '19500명은 매진 안내' },
          CACHE,
          LB,
          { ...API, tag: 'API · SCALE OUT', note: '서버 메모리에 판정 없음' },
          PAY,
          { ...DB, note: '좌석 23: 점유 번호 1' },
          JOB,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="같은 사람들 · 같은 500석을 다르게 처리하면 (실행 출력의 합계)"
        tone="sunken"
        lines={[
          '이 가이드: 점유 시도 1519 · 0행 1019 · 판매 500 · 이중 판매 0 · 점유 응답 최대 102ms · 마지막 판매 533475ms',
          '잠그고 결제까지 기다림 (for-update): 점유 응답 최대 282204ms · 마지막 판매 2139279ms',
          'SELECT 뒤 UPDATE (split): 두 사람이 함께 점유 성공 21번 → 환불 21건',
          '버전 확인 (optimistic): 판매 · 0행은 이 가이드와 같고, 점유 문장 1519 → 2033 · 버전 충돌 14',
          '대기실이 없으면 (도착 시각 표에서 센 하한): 첫 지도 요청만 초당 334건 · 도착한 2만 명이 모두 예매 경로로',
        ]}
      />
    </C4DynamicDiagram>
  );
}

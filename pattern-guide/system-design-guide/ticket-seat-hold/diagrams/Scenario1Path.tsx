// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ticket-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 지도 · 좌석 · 결제 요청이 앞단의 부하 분산을 지나 예매 API 서버로 가므로 개념도 밖 배포 세부인 「부하 분산」(LB)을
// 요청 경로에 그린다(명세 SD11, 1.1.0). 코드는 부하 분산을 흉내 내지 않는다(상황 설정의 대역 표).
// 출처: code/expected-output.txt 의 시나리오 1 줄(0 · 50 · 20151 · 21000 · 300252 · 302253 · 302304 · 303000ms, one booking 합계).
// 네트워크 50ms · 1ms, 결제 승인 왕복 2초, 고르는 20초 · 결제 정보를 넣는 280초는 이 가이드의 가정이다(code/ 의 상수).
// 배지 번호는 본문 시나리오 1 의 단계 번호와 같다.
//
// 주장: 줄 맨 앞의 U1 은 0ms 에 입장하고, 좌석 47 을 조건부 UPDATE 1행(점유 번호 1, 10분)으로 붙잡은 뒤,
// 결제 승인 다음 확정 1행과 판매 행 하나로 표를 받는다. 지도는 1초 안에 점유 · 판매를 따라온다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Badge, Boxes, CACHE, DB, JOB, LB, Lane, PATH, PAY, ROOM, W } from './_ticket-layout';

const LANES = [
  { ...PATH.join, lines: ['0ms 줄에 서자마자', '입장 · 입장 토큰'], lx: 200, ly: 124, order: 1, bx: 99, by: 225 },
  { ...PATH.toLb, lines: ['HTTPS · 입장 토큰'], lx: 237, ly: 292 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.response, lines: ['302304ms 표', 'HTTPS 응답'], lx: 250, ly: 392, order: 7, bx: 237, by: 368 },
  { ...PATH.roomCache, lines: ['캐시 읽기 · 1초마다', '0ms 빈 좌석 500'], lx: 570, ly: 124 },
  { ...PATH.apiRoom, lines: ['20151ms 점유 성공 알림', 'HTTPS · 고르는 중 1 → 0'], lx: 430, ly: 240, anchor: 'end' as const },
  { ...PATH.apiCache, lines: ['50ms 지도 읽기', '좌석 47 을 고름'], lx: 680, ly: 262, anchor: 'end' as const, order: 2, bx: 690, by: 290 },
  {
    ...PATH.apiDb,
    lines: ['20151ms UPDATE 1행 · 점유 번호 1', '302253ms 확정 1행 + 판매 행 1개'],
    lx: 405, ly: 420, anchor: 'start' as const, order: 3, bx: 395, by: 398,
  },
  { ...PATH.jobDb, lines: ['SELECT', '1초마다'], lx: 570, ly: 522 },
  { ...PATH.jobCache, lines: ['21000ms 47 점유로', '303000ms 47 판매로'], lx: 850, ly: 330, anchor: 'end' as const, order: 4, bx: 860, by: 300 },
  { ...PATH.apiPay, lines: ['300252ms 결제 요청', '302252ms 승인'], lx: 200, ly: 468, order: 5, bx: 300, by: 440 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={760} title="시나리오 1 — 줄 맨 앞의 한 사람이 좌석 하나를 사는 길">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="U1 은 좌석 47 을 점유 번호 1 로 붙잡고, 확정 1행으로 산다" />
      <Boxes
        boxes={[
          { ...APP, tag: 'U1', note: '20초 고르고 280초 결제' },
          { ...ROOM, tag: 'ROOM · 10 / S', note: '줄에 U1 하나 · 고르는 중 0' },
          CACHE,
          LB,
          { ...API, tag: 'API', note: '점유 · 확정' },
          PAY,
          { ...DB, note: '좌석 47 · 판매 행 1개' },
          JOB,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Badge x={422} y={470} n={6} />
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="U1 의 예매 한 건 (one booking)"
        tone="sunken"
        lines={[
          '0ms 입장 → 50ms 지도 → 20151ms 점유 1행 (만료 620151ms) → 300252ms 결제 → 302253ms 확정 1행',
          '좌석을 누르고 결과까지 102ms · 표를 받은 때 302304ms · 판매 1 · 이중 판매 0',
        ]}
      />
    </C4DynamicDiagram>
  );
}

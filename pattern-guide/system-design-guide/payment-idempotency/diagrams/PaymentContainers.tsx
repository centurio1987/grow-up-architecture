// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_payment-layout.tsx) — 결제 화면이 있는 앱은 person,
// 여러 대가 뜨는 결제 API 서버는 container, 결제 DB 는 database, 우리가 만들지 않는 결제사 · 주문 서비스는 external,
// 정해진 때 실행되는 확정 작업 · 대사 작업 · 아웃박스 전달기는 process.
// 출처: 리서치 노트 system-design-payment-idempotency-2026-11-17 1절(추천 구조) · 4-1(멱등 키) · 4-2(같은 키가 또 왔을 때) ·
// 4-3(알 수 없음) · 4-4(결제사 쪽 멱등 키) · 4-5(아웃박스) · 4-6(대사 — 토스페이먼츠 거래 조회 API 는 거래 시점 기준 당일부터 조회). 화살표의 빈도와 시간 값은 이 가이드의 설정이고
// code/ 의 상수(PG_TIMEOUT · CONFIRM_EVERY · CONFIRM_FOR · RELAY_EVERY · RECONCILE_AT)와 같다.
//
// 주장: 멱등 키 표 · 결제 표 · 아웃박스 표가 결제 DB 한 곳에 있어 시작과 끝을 각각 한 트랜잭션으로 쓴다.
// 결제사는 우리 결제 id 를 멱등 키로 받고, 결과를 모르는 결제는 확정 작업이 같은 키로 다시 묻고 대사 작업이 다음 날 맞춘다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Boxes, CONFIRM, DB, Lane, ORDER, PATH, PG, RECON, RELAY, W } from './_payment-layout';

const LANES = [
  { ...PATH.request, lines: ['HTTPS POST /payments', '멱등 키 헤더 · 시도마다'], lx: 237, ly: 104 },
  { ...PATH.answer, lines: ['201 · 202 · 409 · 422', 'HTTP 응답 · 요청마다'], lx: 237, ly: 232 },
  { ...PATH.tx, lines: ['SQL 트랜잭션', '결제마다 시작 · 끝 두 번'], lx: 392, ly: 270, anchor: 'end' as const },
  { ...PATH.approve, lines: ['HTTPS 승인', '결제마다', '키 = 결제 id', '타임아웃 10초'], lx: 545, ly: 228 },
  { ...PATH.confirmDb, lines: ['SQL · 1분마다', '알 수 없음 확정'], lx: 545, ly: 386 },
  { ...PATH.confirmPg, lines: ['HTTPS 승인 요청', '같은 키 · 1분마다', '시도 뒤 1시간까지'], lx: 618, ly: 240, anchor: 'start' as const },
  { ...PATH.reconPg, lines: ['HTTPS 거래 조회 API', '전날 거래 기록', '하루 한 번 04:00'], lx: 852, ly: 240, anchor: 'end' as const },
  { ...PATH.reconDb, lines: ['SQL · 하루 한 번 비교 · 확정 · 불일치 기록'], lx: 640, ly: 490 },
  { ...PATH.relayDb, lines: ['SQL · 1초마다', '아웃박스 읽기'], lx: 352, ly: 478, anchor: 'end' as const },
  { ...PATH.notify, lines: ['HTTP · 결제 성공', '한 번 이상 전달'], lx: 237, ly: 508 },
];

export default function PaymentContainers() {
  return (
    <C4ContainerDiagram width={W} height={760} title="결제 · 송금 중복 방지의 여덟 실행 단위">
      <DiagramHeader eyebrow="Payment idempotency · containers" title="멱등 행과 결제 행을 한 트랜잭션에, 결제사에는 결제 id 를 키로" />
      <Boxes boxes={[APP, { ...API, tag: 'API · SCALE OUT' }, PG, DB, CONFIRM, RECON, RELAY, ORDER]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="결제 하나의 상태"
        tone="sunken"
        lines={[
          '처리 중 → 성공 · 실패 (결제사가 답함) · 알 수 없음 (읽기 타임아웃) — 알 수 없음은 실패로 보지 않는다',
          '알 수 없음 → 같은 키로 다시 물어 성공 · 실패, 결제 시도 뒤 1시간이 지나면 다음 날 04:00 대사로 확정',
        ]}
      />
    </C4ContainerDiagram>
  );
}

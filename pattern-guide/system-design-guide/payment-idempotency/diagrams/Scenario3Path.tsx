// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_payment-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// K2 · K3 의 재시도가 앞단의 부하 분산을 지나 다른 서버로 갈 수 있으므로 개념도 밖 배포 세부인 「부하 분산」(LB)을
// 요청 경로에 그린다(명세 SD11, 1.1.0).
// 출처: code/expected-output.txt 의 시나리오 3 줄. 앞 구간(K2): 404 · 1454 · 1455 · 1506ms, with-key · no-key 합계.
// 뒤 구간(K3 ~ K6): 202 · 10053 · 10104 · 11104 · 11306 · 11457 · 11508 · 60151 · 60302 · 100202 · 110202 · 100800000 ·
// 100801000ms, 네 실행의 합계 줄. 결제사가 응답을 잃는 주문 셋, 100250ms 부터 4시간 멈춤, 읽기 타임아웃 10초,
// 확정 작업 1분마다 · 1시간까지, 결제사 키 보관 3시간, 대사 다음 날 04:00 은 이 가이드의 가정이다(code/ 의 상수).
// 배지 번호는 본문 시나리오 3 의 단계 번호와 같다.
//
// 주장: 앱으로 가는 응답을 잃으면 같은 키의 재시도가 다른 서버에서 저장한 201 을 받는다. 결제사의 승인 응답을 잃으면
// 결제는 실패가 아니라 알 수 없음으로 남고, 같은 키로 다시 물으면 승인 한 건으로 확정되며, 결제사가 답하지 않는 동안
// 생긴 알 수 없음은 다음 날 대사가 결제사 기록으로 확정한다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Badge, Boxes, CONFIRM, DB, LB, Lane, ORDER, PATH, PG, RECON, RELAY, W } from './_payment-layout';

const LANES = [
  { ...PATH.toLb, lines: ['K2 1404ms 같은 키 재시도', 'K3 11104ms 같은 키 재시도'], lx: 94, ly: 90, order: 2, bx: 208, by: 116 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.answer, dashed: true, lines: ['404ms K2 201 사라짐', '1506ms K2 201 재생', '10104ms K3 202 확인 중'], lx: 237, ly: 228, order: 1, bx: 225, by: 205 },
  { ...PATH.tx, lines: ['1455ms K2 키 중복 → 저장한 201', '10053ms P3 알 수 없음', '11457ms P3 성공'], lx: 392, ly: 274, anchor: 'end' as const },
  { ...PATH.approve, lines: ['202ms P3 승인', '응답은 사라짐', '11306ms 같은 키', '→ 승인 재생'], lx: 545, ly: 228, order: 3, bx: 532, by: 150 },
  { ...PATH.confirmPg, lines: ['60151ms P4 재생', '100250ms 뒤 답 없음', '1시간 뒤 멈춤'], lx: 618, ly: 246, anchor: 'start' as const, order: 6, bx: 610, by: 228 },
  { ...PATH.confirmDb, lines: ['60302ms', 'P4 성공'], lx: 545, ly: 386 },
  { ...PATH.reconPg, lines: ['다음 날 04:00', '전날 거래 기록'], lx: 852, ly: 254, anchor: 'end' as const, order: 9, bx: 860, by: 228 },
  { ...PATH.reconDb, lines: ['100800000ms P5 성공 · P6 실패로 확정'], lx: 640, ly: 490 },
  { ...PATH.relayDb, lines: ['1000 · 12000 · 61000 ·', '100801000ms'], lx: 352, ly: 478, anchor: 'end' as const },
  { ...PATH.notify, lines: ['O2 · O3 · O4 · O5', '결제 완료'], lx: 237, ly: 508 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={820} title="시나리오 3 — 응답 하나를 잃어도 승인 한 건으로 맞추는 길">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="앱이 잃으면 저장한 201, 결제 API 서버가 잃으면 알 수 없음에서 확정" />
      <Boxes
        boxes={[
          { ...APP, tag: 'K2 · K3', note: '응답이 없거나 202 면 다시' },
          LB,
          { ...API, tag: 'API-1 · API-2', note: '읽기 타임아웃 10초' },
          { ...PG, tag: 'PG · STOPS 100.25S + 4H', note: 'P3 · P4 · P5 의 첫 응답을 잃음' },
          { ...DB, note: 'P5 · P6 은 다음 날까지 알 수 없음' },
          CONFIRM,
          RECON,
          RELAY,
          ORDER,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Badge x={251} y={205} n={4} />
      <Badge x={558} y={150} n={5} />
      <Badge x={740} y={110} n={7} />
      <Badge x={712} y={304} n={8} />
      <Badge x={818} y={452} n={9} />
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="같은 사건열을 다르게 처리하면 (실행 출력의 합계)"
        tone="sunken"
        lines={[
          '앞 구간을 키 없이: 결제사 승인 2 · O2 가 두 번 승인됨 (no-key)',
          '뒤 구간 이 가이드: 승인 3 · 두 번 승인된 주문 0 · 대사 불일치 0 · 성공 3 = 주문 통지 3',
          '타임아웃을 실패로: 승인 4 · 두 번 승인된 주문 1 · 대사 불일치 3',
          '결제사 키를 재요청마다 새로: 승인 5 · 두 번 승인된 주문 2 · 대사 불일치 2',
          '확정 작업을 1시간에 멈추지 않음: 승인 5 · 두 번 승인된 주문 1 · 대사 불일치 1',
        ]}
      />
    </C4DynamicDiagram>
  );
}

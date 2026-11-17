// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ticket-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// A · B 의 요청이 앞단의 부하 분산을 지나 예매 API 서버로 가므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 요청 경로에
// 그린다(명세 SD11, 1.1.0). 대기실 · 좌석 지도 캐시 · 지도 갱신 작업은 이 시나리오에 나오지 않아 뺐다.
// 출처: code/expected-output.txt 의 시나리오 3 줄(0 · 300000 ~ 540000 · 595000 · 600000 · 608001 · 880101 · 882102ms,
// guide · insert-only · insert-only-no-unique 합계). 결제 서비스 멈춤 594000 ~ 606000ms, A 가 결제 정보를 넣는 594899ms,
// B 가 60초마다 누르는 것은 이 가이드의 가정이다(code/ 의 main).
// 배지 번호는 본문 시나리오 3 의 단계 번호와 같다.
//
// 주장: 결제 서비스가 멈춘 사이 A 의 점유가 600000ms 에 끝나면 B 가 같은 좌석을 점유 번호 2 로 붙잡고,
// A 의 늦은 확정은 점유 번호가 달라 0행이 되어 환불되며 표는 B 에게 간다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Badge, Boxes, DB, LB, Lane, PATH, PAY, W } from './_ticket-layout';

const LANES = [
  { ...PATH.toLb, lines: ['HTTPS · 입장 토큰'], lx: 237, ly: 292 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.apiDb, lines: ['SQL 조건부 UPDATE (1 · 2 · 4)', '확정 트랜잭션 (5 · 6)'], lx: 405, ly: 420, anchor: 'start' as const },
  { ...PATH.apiPay, dashed: true, lines: ['595000ms A 결제 요청', '608000ms 늦은 승인'], lx: 200, ly: 408, order: 3, bx: 300, by: 440 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={780} title="시나리오 3 — 결제 서비스가 멈춘 사이 점유가 끝날 때 마지막 좌석이 가는 길">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="A 의 늦은 확정은 점유 번호가 달라 0행, 표는 B 에게" />
      <Callout
        x={GUTTER}
        y={100}
        width={W - GUTTER * 2}
        label="좌석 1 의 행이 바뀌는 차례 (번호는 본문 시나리오 3 의 단계)"
        tone="neutral"
        lines={[
          '1  0ms  A 의 UPDATE 1행 → held · A · 점유 번호 1 · 만료 600000ms',
          '2  300000 ~ 540000ms  B 가 다섯 번 누름 → 0행, 행은 그대로',
          '3  595000ms  A 의 결제 요청, 결제 서비스는 606000ms 까지 멈춤',
          '4  600000ms  만료 시각이 지나 B 의 UPDATE 1행 → held · B · 점유 번호 2',
          '5  608001ms  A 의 확정이 점유 번호 1 을 찾음 → 0행, 롤백, 환불',
          '6  882102ms  B 의 확정 1행 + 판매 행 → sold · B · 점유 번호 2',
        ]}
      />
      <Boxes
        boxes={[
          { ...APP, tag: 'A · B', note: 'B 는 60초마다 누름' },
          LB,
          { ...API, tag: 'API', note: '점유 · 확정 · 환불' },
          { ...PAY, tag: 'PAY · STOPS 12 S', note: '594 ~ 606초 멈춤' },
          { ...DB, note: '좌석 1: 점유 번호 1 → 2' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Badge x={237} y={378} n={2} />
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="같은 사건열에서 판매 확정만 바꾸면 (실행 출력)"
        tone="sunken"
        lines={[
          '이 가이드 (점유 번호 · 만료를 보는 UPDATE + 유일 제약): 판매 1 (B) · 환불 1 (A) · 이중 판매 0',
          '판매 행 INSERT 만, 유일 제약 있음: 판매 1 (점유가 끝난 A) · B 의 INSERT 는 23505 로 환불',
          '판매 행 INSERT 만, 유일 제약 없음: 판매 2 (A · B) · 이중 판매 1',
        ]}
      />
    </C4DynamicDiagram>
  );
}

// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_payment-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 요청이 앞단의 부하 분산을 지나 api-1 로 가므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 요청 경로에 그린다
// (명세 SD11, 1.1.0). 확정 작업 · 대사 작업은 이 시나리오에 나오지 않아 뺐다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(50 · 51 · 52 · 202 · 353 · 404 · 1000ms, one payment 합계).
// 네트워크 시간 50ms · 1ms · 150ms 는 이 가이드의 가정이다(code/ 의 상수). 352ms 는 그 상수로 셈한 값이다.
//
// 주장: 결제 한 건은 시작 트랜잭션(멱등 행 + 결제 행) → 결제사 승인 → 끝 트랜잭션(성공 + 응답 저장 + 아웃박스) 순서로
// 404ms 에 201 로 끝나고, 멱등 확인이 더한 몫은 2ms 다. 주문 통지는 아웃박스에서 1000ms 에 나간다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Badge, Boxes, DB, LB, Lane, ORDER, PATH, PG, RELAY, W } from './_payment-layout';

const LANES = [
  { ...PATH.toLb, lines: ['K1 · O1 · 30000원', '0ms 요청 하나'], lx: 94, ly: 90, order: 1, bx: 208, by: 116 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  {
    ...PATH.tx,
    lines: ['51ms 멱등 행 + P1 처리 중', '353ms 성공 + 응답 201 + 아웃박스'],
    lx: 392, ly: 272, anchor: 'end' as const, order: 2, bx: 400, by: 236,
  },
  { ...PATH.approve, lines: ['52ms 승인 요청', '키 = P1', '202ms 승인 1건'], lx: 545, ly: 232, order: 3, bx: 545, by: 150 },
  { ...PATH.answer, lines: ['404ms 201 받음', '저장한 값과 같은 본문'], lx: 237, ly: 232, order: 5, bx: 237, by: 205 },
  { ...PATH.relayDb, lines: ['1000ms', '아웃박스 읽기'], lx: 352, ly: 478, anchor: 'end' as const, order: 6, bx: 372, by: 500 },
  { ...PATH.notify, lines: ['O1 결제 완료', '한 번'], lx: 237, ly: 508 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={760} title="시나리오 1 — 결제 한 건이 201 과 주문 통지로 끝나는 길">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="결제 한 건은 404ms 에 201, 멱등 확인의 몫은 2ms" />
      <Boxes
        boxes={[
          { ...APP, tag: 'K1', note: '결제 시도 하나 = 키 하나' },
          LB,
          { ...API, tag: 'API-1', note: '멱등 확인 · 결제사 호출' },
          { ...PG, note: '키 P1 로 승인 한 번' },
          { ...DB, note: '멱등 행 K1 → P1 · 응답 201 저장' },
          RELAY,
          ORDER,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Badge x={422} y={300} n={4} />
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="404ms 가 어디에 쓰였나 (one payment)"
        tone="sunken"
        lines={[
          '앱 → 서버 50 · 결제 DB 왕복 2 (멱등 확인) · 결제사 왕복 300 · 결제 DB 왕복 2 · 서버 → 앱 50',
          '결제사 승인 1건 · 성공 1건 · 주문 통지 1건',
        ]}
      />
    </C4DynamicDiagram>
  );
}

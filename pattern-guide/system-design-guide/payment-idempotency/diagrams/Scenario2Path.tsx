// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_payment-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 같은 키의 두 요청이 서로 다른 서버로 가는 데 기대므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 요청 경로에 그린다
// (명세 SD11, 1.1.0). 이 시나리오에 나오지 않는 확정 작업 · 대사 작업 · 아웃박스 전달기 · 주문 서비스는 뺐다.
// 출처: code/expected-output.txt 의 시나리오 2 줄(66 · 67 · 87 · 96 · 147 · 419 · 1198 · 1249ms, idempotency-table ·
// redis-lock-3s 합계). 피크 1초 580건 · 두 번 누름 10% · 30ms 간격 · 잠금 3초는 이 가이드의 가정이다(code/ 의 main · LOCK_TTL).
//
// 주장: 피크 1초에 같은 키가 처리 중에 또 와도 결제 DB 의 유일 제약이 둘째 요청을 409 로 돌려보내고,
// 1초 뒤 다시 온 요청은 저장한 201 을 받는다. 같은 키에 금액만 다르면 422 다. 승인은 키 수와 같은 580건이다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Boxes, DB, LB, Lane, PATH, PG, W } from './_payment-layout';

const LANES = [
  { ...PATH.toLb, lines: ['피크 1초 580건', '10번째마다 30ms 뒤 한 번 더'], lx: 94, ly: 90, order: 1, bx: 208, by: 116 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  {
    ...PATH.tx,
    lines: ['66ms K109 첫 요청 → 처리 중 행', '87ms K104 두 번째 → 지문 다름', '96ms K109 두 번째 → 키 중복', '1198ms K109 세 번째 → 저장한 201'],
    lx: 392, ly: 262, anchor: 'end' as const, order: 2, bx: 400, by: 236,
  },
  { ...PATH.approve, lines: ['67ms K109 승인 요청', '키 = P109', '모두 승인 580건'], lx: 545, ly: 232, order: 3, bx: 545, by: 150 },
  { ...PATH.answer, lines: ['147ms 409 · 1초 기다림', '1249ms 201 같은 본문'], lx: 237, ly: 232, order: 4, bx: 237, by: 205 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={600} title="시나리오 2 — 피크에 같은 키가 겹칠 때 409 와 저장한 응답으로 받아 내는 길">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="같은 키가 처리 중에 또 오면 409, 1초 뒤에는 저장한 201" />
      <Boxes
        boxes={[
          { ...APP, tag: 'K100 ~ K679', note: '두 번 누름은 같은 키' },
          LB,
          { ...API, tag: 'API-1 · API-2', note: '두 요청이 다른 서버로 감' },
          { ...PG, note: '키마다 승인 한 번' },
          { ...DB, note: '멱등 키 유일 제약 · 요청 지문' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={470}
        width={W - GUTTER * 2}
        label="같은 사건열을 잠금 3초(응답 저장 없음)로 실행하면"
        tone="sunken"
        lines={[
          '이 가이드: 요청 697 · 승인 580 · 409 58 · 재생 58 · 두 번 승인된 주문 0',
          '잠금 3초: 요청 757 · 승인 639 · 잠금 거절 118 · 두 번 승인된 주문 59',
          '잠금이 풀린 뒤 다시 온 요청을 새 결제로 처리한 것이 그 59건이다',
        ]}
      />
    </C4DynamicDiagram>
  );
}

// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_coupon-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 이 시나리오의 1단계가 앞단의 부하 분산에 기대므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 요청 경로에 그린다(명세 SD11, 1.1.0).
// 출처: code/expected-output.txt 의 시나리오 2 줄(atomic · check-then-act 의 success · over · double · already ·
// sold-out · redis-commands · api-local-sold-out · max-wait · db-rows · last-row).
//
// 주장: 90ms 동안 3만 건이 몰려도 성공은 정확히 1,000 이고, 소진 뒤 요청 23,718건은 API 서버가 Redis 에 묻지 않고
// 답한다. DB 쓰기는 요청 속도가 아니라 워커 속도(초당 500건)를 따른다. 같은 사건열을 확인 후 차감으로 처리하면
// 성공이 4,316건이 된다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, APP, Boxes, DB, LB, Lane, PATH, QUEUE, REDIS, W, WORKER } from './_coupon-layout';

const LANES = [
  { ...PATH.toLb, lines: ['30,000건', '90.367ms 동안'], lx: 94, ly: 232, order: 1, bx: 172, by: 248 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.decide, lines: ['명령 16,646건', '가장 긴 대기 48.472ms'], lx: 383, ly: 218, anchor: 'end' as const, order: 2, bx: 395, by: 236 },
  { ...PATH.answer, lines: ['성공 1,000', '이미 받음 600', '소진 28,400'], lx: 240, ly: 340, order: 3, bx: 176, by: 322 },
  { ...PATH.enqueue, lines: ['1,000건만', '성공한 요청'], lx: 555, ly: 268, order: 4, bx: 600, by: 300 },
  { ...PATH.poll, lines: ['10ms마다 5건'], lx: 717, ly: 390, anchor: 'start' as const },
  { ...PATH.insert, lines: ['1,000행', '2,000ms 에 끝'], lx: 555, ly: 440, order: 5, bx: 600, by: 470 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={660} title="시나리오 2 — 정각에 몰린 요청을 받아 내는 곳과 그대로인 곳">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="약 90ms 에 3만 건이 와도 성공은 1,000, DB 쓰기는 초당 500건 그대로" />
      <Boxes
        boxes={[
          { ...APP, tag: 'USERS', note: '같은 사람 두 번 누름 포함' },
          LB,
          { ...API, note: '소진 뒤 23,718건은 바로 답함' },
          REDIS,
          QUEUE,
          WORKER,
          DB,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={546}
        width={W - GUTTER * 2}
        label="같은 3만 건을 확인 후 차감으로 처리하면"
        tone="sunken"
        lines={[
          '성공 4,316 (1,000 을 3,316 넘음) · 두 번 이상 성공한 사람 367명',
          'Redis 명령 44,324 · 가장 긴 대기 209.192ms',
        ]}
      />
    </C4DynamicDiagram>
  );
}

// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_rate-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 이 시나리오의 1단계가 앞단의 부하 분산에 기대므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 요청 경로에 그린다(명세 SD11, 1.1.0).
// 출처: code/expected-output.txt 의 시나리오 2 줄(sliding-lua allowed=609 window0=600 window1=9 redis-calls=649
// api-local-429=551 max-judge=0.540ms · fixed-window allowed=1200 · two-step allowed=612 max-judge=1.050ms ·
// exact-log allowed=600, 0.750%).
//
// 주장: 분 경계 2초에 1,200건이 몰려도 근사 창은 609건만 업무 서비스로 보낸다. 몰림의 대부분은 API 서버의 로컬 차단이
// 받아 내 Redis 에 가지 않는다. 같은 요청을 고정 창으로 세면 1,200건이 다 지나간다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, BACKEND, Boxes, CLIENT, LB, Lane, PATH, REDIS, W } from './_rate-layout';

const LANES = [
  { ...PATH.toLb, lines: ['4건씩 동시에', '6.666ms 마다'], lx: 94, ly: 222, order: 1, bx: 182, by: 248 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.decide, lines: ['EVALSHA 649건', '가장 긴 판정 0.540ms'], lx: 405, ly: 215, anchor: 'end' as const, order: 2, bx: 425, by: 236 },
  { ...PATH.forward, lines: ['59 ~ 60초 600건', '60 ~ 61초 9건'], lx: 610, ly: 268, order: 3, bx: 560, by: 290 },
  { ...PATH.answer, lines: ['429 591건', '(Redis 40 · 로컬 차단 551)'], lx: 242, ly: 350, order: 4, bx: 290, by: 312 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={560} title="시나리오 2 — 분 경계에 몰린 1,200건을 받아 내는 곳과 그대로인 곳">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="2초에 1,200건이 와도 업무 서비스로 가는 것은 609건, Redis 에 가는 것은 649건" />
      <Boxes
        boxes={[
          { ...CLIENT, tag: 'K2 · 4 CONNECTIONS', note: '2초에 1,200건' },
          LB,
          { ...API, note: '로컬 차단으로 551건을 바로 거절' },
          REDIS,
          { ...BACKEND, note: '허용 609건' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={420}
        width={W - GUTTER * 2}
        label="같은 1,200건을 다르게 세면"
        tone="sunken"
        lines={[
          '고정 창: 허용 1,200 (60초부터 새 카운터가 0 에서 다시 세어 60 ~ 61초에도 600)',
          '확인과 증가를 따로 (왕복 두 번): 허용 612 · 가장 긴 판정 1.050ms',
          '요청을 모두 기억하는 정확한 1분 창: 허용 600 — 근사 창은 9건 더 허용 (1,200건의 0.750%)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

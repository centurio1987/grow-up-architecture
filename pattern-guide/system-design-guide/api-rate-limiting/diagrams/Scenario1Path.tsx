// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_rate-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 이 시나리오의 1단계가 앞단의 부하 분산에 기대므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 요청 경로에 그린다(명세 SD11, 1.1.0).
// 출처: code/expected-output.txt 의 시나리오 1 줄(0.000ms lb -> api-1 · 0.260ms allow cur=1 · 0.510ms 200 remaining=599 ·
// 48000.260ms reject cur=600 · 48000.510ms 429 retry-after=13s · 48320.000ms local block · redis-calls=604 api-local-429=146).
//
// 주장: 요청 하나는 Redis 의 Lua 한 번으로 판정되고 0.510ms 에 답을 받는다. 601번째 요청은 429 와 13초를 받고,
// 그 요청을 거절한 API 서버는 Redis 에 다시 묻지 않고 K1 을 스스로 거절한다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, BACKEND, Boxes, CLIENT, LB, Lane, PATH, REDIS, W } from './_rate-layout';

const LANES = [
  { ...PATH.toLb, lines: ['K1 #1 · 0.000ms', '80ms 마다 한 건'], lx: 94, ly: 222, order: 1, bx: 182, by: 248 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  { ...PATH.decide, lines: ['#1 allow cur=1 (0.260ms)', '#601 reject cur=600'], lx: 405, ly: 215, anchor: 'end' as const, order: 2, bx: 425, by: 236 },
  { ...PATH.forward, lines: ['#1 ~ #600', '허용 600건'], lx: 610, ly: 268, order: 3, bx: 560, by: 290 },
  { ...PATH.answer, lines: ['#1 200 remaining=599 (0.510ms)', '#601 429 retry-after=13s'], lx: 242, ly: 350, order: 4, bx: 290, by: 312 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={530} title="시나리오 1 — K1 의 요청이 판정되고 601번째가 429 를 받는 길">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="#1 은 0.510ms 에 200, #601 은 429 와 13초, #605 부터는 API 서버가 스스로 거절" />
      <Boxes boxes={[{ ...CLIENT, tag: 'K1', note: '1분에 750건' }, LB, { ...API, tag: 'API-1 ~ API-4', note: '#601 뒤 K1 을 60.1초까지 차단' }, REDIS, BACKEND]} />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={420}
        width={W - GUTTER * 2}
        label="6 · 로컬 차단"
        tone="sunken"
        lines={[
          '#601 ~ #604 를 거절받은 api-1 ~ api-4 가 K1 을 60,100ms 까지 스스로 거절 (#605 부터)',
          'K1 요청 750건 가운데 Redis 에 간 것 604건, API 서버가 바로 거절한 것 146건',
        ]}
      />
    </C4DynamicDiagram>
  );
}

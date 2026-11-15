// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_live-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 출처: code/expected-output.txt 의 시나리오 2 줄(60.5s ~ 65.5s 의 joins · reports · publishes · sse-writes · naive)
//
// 주장: 입장이 초당 600명으로 몰려도 늘어나는 것은 에지가 받는 연결과 SSE 쓰기뿐이고,
// 중앙(집계 서비스 · Redis Pub/Sub)이 주고받는 메시지는 초당 보고 3 + 발행 1 + 전달 3 = 7건 그대로다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { AGG, BROWSER, Boxes, EDGE, Lane, PATH, REDIS, W } from './_live-layout';

const LANES = [
  { ...PATH.signal, lines: ['입장 약 600명/초', 'SSE 연결 + 재생 신호'], lx: 292, ly: 226, order: 1, bx: 226, by: 252 },
  { ...PATH.report, lines: ['보고 3건/초 — 입장 수와 무관', 'reports=3'], lx: 492, ly: 122, anchor: 'start' as const, order: 2, bx: 480, by: 192 },
  { ...PATH.publish, lines: ['발행 1건/초', 'publishes=1'], lx: 777, ly: 262, anchor: 'end' as const, order: 3, bx: 789, by: 228 },
  { ...PATH.deliver, lines: ['전달 3건/초 (에지 셋)'], lx: 500, ly: 412, anchor: 'start' as const, order: 4, bx: 600, by: 390 },
  { ...PATH.sse, lines: ['연결마다 1건/초', '64.5s · sse-writes=3904'], lx: 292, ly: 310, order: 5, bx: 226, by: 290 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={550} title="시나리오 2 — 입장이 몰릴 때 늘어나는 곳과 그대로인 곳">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="5초에 3,000명이 들어와도 중앙은 초당 보고 3 · 발행 1 · 전달 3 그대로" />
      <Boxes
        boxes={[
          { ...BROWSER, tag: 'VIEWERS · +3000' },
          { ...EDGE, tag: 'EDGE A · B · C', note: '연결 수락 · 에지마다 약 200명/초' },
          AGG,
          REDIS,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={456}
        width={W - GUTTER * 2}
        label="입장마다 전원에게 보냈다면"
        tone="sunken"
        lines={[
          '64.5s 직전 1초: naive=2211540 건 — 같은 1초의 SSE 쓰기 3,904 건의 약 566배',
          '숫자는 최대 1.5초 늦게 따라온다: 64.5s total 3,592 · actual 3,903 → 65.5s 둘 다 4,199',
        ]}
      />
    </C4DynamicDiagram>
  );
}

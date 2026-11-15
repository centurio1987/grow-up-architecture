// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_live-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(2.3s 입장 · 3.5s 1201 · 10.2s 닫기 · 11.5s 1200 · 12.5s 일시 정지 · 58.5s 1199)
//
// 주장: 입장 하나는 에지 → 집계 서비스 → Redis Pub/Sub → 에지 → 모든 화면 순서로 1.2초 뒤에 숫자가 된다.
// 이탈도 같은 길로 나가지만, 연결이 끊긴 것은 바로 알고 재생만 멈춘 것은 만료 시간이 지나야 안다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { AGG, BROWSER, Boxes, EDGE, Lane, PATH, REDIS, W } from './_live-layout';

const LANES = [
  { ...PATH.signal, lines: ['SSE 연결 + 재생 신호', '2.3s · conn 1201'], lx: 292, ly: 226, order: 1, bx: 226, by: 252 },
  { ...PATH.report, lines: ['에지 a 가 재생 중 401 보고', '3.0s · HTTP POST'], lx: 492, ly: 122, anchor: 'start' as const, order: 3, bx: 480, by: 192 },
  { ...PATH.publish, lines: ['400 + 400 + 401 = 1,201 발행', '3.5s · SPUBLISH'], lx: 777, ly: 262, anchor: 'end' as const, order: 4, bx: 789, by: 228 },
  { ...PATH.deliver, lines: ['구독 중인 에지 셋에 전달'], lx: 500, ly: 412, anchor: 'start' as const, order: 5, bx: 600, by: 390 },
  { ...PATH.sse, lines: ['모든 연결에 1,201', '3.5s · SSE 이벤트 하나'], lx: 292, ly: 310, order: 6, bx: 226, by: 290 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={550} title="시나리오 1 — 입장 하나가 모든 화면의 숫자가 되는 길">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="입장 하나가 1.2초 뒤 모든 화면의 1,201 이 되는 길" />
      <Boxes boxes={[BROWSER, { ...EDGE, tag: 'EDGE A', note: '2 · conn 1201 을 목록에 적음' }, AGG, REDIS]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={456}
        width={W - GUTTER * 2}
        label="7 · 8 이탈"
        tone="sunken"
        lines={[
          '7 · 10.2s 탭을 닫음 → 에지 a 가 연결 끊김을 바로 지움 → 3~6 과 같은 길 → 11.5s 1,200',
          '8 · 12.5s 일시 정지 → 마지막 신호 12.0s 에서 45초가 지나야 빠짐 → 3~6 → 58.5s 1,199',
        ]}
      />
    </C4DynamicDiagram>
  );
}

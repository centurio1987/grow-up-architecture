// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 브라우저의 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다(명세 SD11, 1.1.0).
// 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(1000 · 1002 · 1010 · 1230 · 1310 · 7010ms, 받은 뒤 310ms · 6010ms).
// 310ms 를 나눈 2 · 8 · 220 · 80ms 는 code/ 의 STORE_RT · 작업자 1 의 반복 시각(…10ms) · PREFILL · 토큰 넷 × STEP 이다.
// 배지 번호는 본문 시나리오 1 의 단계 번호와 같다.
//
// 주장: 부하와 장애가 없을 때 질문 하나는 대화 저장소에 적힌 뒤 무료 줄에 들어가고, 다음 반복에서 GPU 작업자 1 이 꺼낸다.
// prefill 을 마치고 토큰 5개를 만든 1310ms 에 조각 1 이 토큰 기록에 적히고, 게이트웨이가 그것을 읽어 SSE id 1 로 보낸다.
// 받은 뒤 310ms 에 첫 조각이, 받은 뒤 6010ms 에 마지막 조각이 가고 끝난 답이 대화 저장소에 적힌다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Boxes, BROWSER, GATEWAY, LB_API, LB_GW, Lane, PATH, QUEUE, RECORD, STORE, W, WORKER } from './_chat-layout';

const LANES = [
  { from: { x: 356, y: 140 }, to: { x: 330, y: 140 }, lines: ['HTTP POST · 1000ms'], lx: 290, ly: 98, order: 1, bx: 237, by: 163 },
  { from: { x: 250, y: 140 }, to: { x: 224, y: 140 }, lines: [], lx: 237, ly: 98 },
  { from: { x: 224, y: 185 }, to: { x: 250, y: 185 }, dashed: true, lines: ['HTTP 응답 · 실행 번호 0 · 1002ms'], lx: 232, ly: 226, anchor: 'start' as const },
  { from: { x: 330, y: 185 }, to: { x: 356, y: 185 }, dashed: true, lines: [], lx: 343, ly: 230 },
  { from: { x: 556, y: 140 }, to: { x: 582, y: 140 }, lines: ['HTTP GET · 1002ms'], lx: 622, ly: 98, order: 2, bx: 569, by: 163 },
  { from: { x: 662, y: 140 }, to: { x: 688, y: 140 }, lines: [], lx: 675, ly: 98 },
  { from: { x: 688, y: 185 }, to: { x: 662, y: 185 }, lines: ['SSE id 1 · 1310ms', 'id 58 · 7010ms'], lx: 622, ly: 230 },
  { from: { x: 582, y: 185 }, to: { x: 556, y: 185 }, lines: [], lx: 569, ly: 230 },
  { ...PATH.question, lines: ['적기 · 1000 ~ 1002ms', '민수의 질문'], lx: 134, ly: 298, anchor: 'start' as const },
  { ...PATH.enqueue, lines: ['무료 줄에 넣기 · 1002ms'], lx: 306, ly: 260, order: 2, bx: 420, by: 300 },
  { ...PATH.read, lines: ['읽기 · 조각마다', '1310 ~ 7010ms'], lx: 798, ly: 262, anchor: 'start' as const, order: 4, bx: 760, by: 270 },
  { ...PATH.take, lines: ['꺼내기 · 1010ms', '작업자 1 · prefill 1230ms 까지'], lx: 466, ly: 482, anchor: 'start' as const, order: 3, bx: 438, by: 490 },
  { ...PATH.chunk, lines: ['쓰기(XADD) · id 1 · 1310ms', '100ms 마다(계산) · id 58 · 7010ms'], lx: 672, ly: 572, order: 4, bx: 800, by: 520 },
  { ...PATH.answer, lines: ['쓰기 · 끝난 답 · 7010ms', '조각 58개'], lx: 240, ly: 572, order: 5, bx: 112, by: 520 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={830} title="시나리오 1 — 질문 하나의 첫 조각이 받은 뒤 310ms 에 화면에 간다">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="적고, 줄에 넣고, 꺼내 만들고, 순번과 함께 적은 조각을 게이트웨이가 보낸다" />
      <Boxes
        boxes={[
          { ...API, note: '1000ms 에 받음' },
          LB_API,
          { ...BROWSER, tag: 'MINSU · FREE', note: '온 id 1 ~ 58' },
          LB_GW,
          { ...GATEWAY, tag: 'GATEWAY 0', note: 'id 를 순번으로' },
          { ...STORE, note: '질문 · 끝난 답' },
          { ...QUEUE, note: '무료 줄에 하나' },
          { ...RECORD, note: '실행 0 · id 1 ~ 58' },
          { ...WORKER, tag: 'GPU WORKER 1', note: '1010ms 에 꺼냄' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={680}
        width={864}
        label="받은 뒤 310ms 의 내역"
        tone="sunken"
        lines={[
          '실행 출력 — 1000ms 에 받아 1010ms 에 작업자 1 이 꺼내고, 1310ms 에 id 1, 7010ms 에 id 58 과 끝난 답',
          '계산 — 310 = 적기 2 + 다음 반복까지 8 + prefill 220 + 토큰 다섯째까지 80 (모형의 가정값 STORE_RT · STEP · PREFILL)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

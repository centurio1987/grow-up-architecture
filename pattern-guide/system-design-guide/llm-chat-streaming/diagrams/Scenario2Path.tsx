// @relation relate
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx). 상자 이름은 개념도와 같고,
// 요청 대기열은 유료 줄 · 무료 줄 두 인스턴스로, GPU 작업자는 작업자 0 · 1 두 인스턴스로 나눠 그렸다(명세 SD11, 1.1.0).
// 두 작업자는 모두 두 줄에서 꺼내므로(code/ 의 take), 곧은 꺼내기 화살표 둘에 엇갈린 화살표 둘을 더했다.
// 브라우저의 요청이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다. 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 2 줄(guide · one-queue). 초당 16 실행은 code/ 의 SLOTS · WORKERS 와
// 실행 하나의 길이(PREFILL 220 + (토큰 290 − 1) × STEP 20 = 220 + 289 × 20 = 6000ms)로 계산한 값이다. 배지 번호는 본문 시나리오 2 의 단계 번호와 같다.
//
// 주장: 질문이 GPU 처리 능력보다 초당 4개 많이 들어와도 유료 줄과 무료 줄을 따로 두고 줄마다 한도를 두면, 유료는 받은 뒤 1310ms 안에
// 첫 조각이 오고, 무료는 받은 뒤 3760ms 안에 첫 조각이 오거나 곧바로 429 와 Retry-After 8 로 거절된다. 줄이 하나이고 한도가 없으면
// 줄이 240 까지 길어져 모두가 받은 뒤 14710ms 까지 기다린다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Boxes, BROWSER, GATEWAY, LB_API, LB_GW, Lane, PATH, QUEUE, RECORD, STORE, W, WORKER } from './_chat-layout';

const HALF = 96;
const PAID_LANE = { ...QUEUE, w: HALF, tag: 'PAID', name: '요청 대기열', note: '유료 줄 · 12' };
const FREE_LANE = { ...QUEUE, x: 460, w: HALF, tag: 'FREE', name: '요청 대기열', note: '무료 줄 · 32' };
const WORKER0 = { ...WORKER, w: HALF, tag: 'WORKER 0', name: 'GPU 작업자', note: '48자리' };
const WORKER1 = { ...WORKER, x: 460, w: HALF, tag: 'WORKER 1', name: 'GPU 작업자', note: '48자리' };

const LANES = [
  { from: { x: 356, y: 140 }, to: { x: 330, y: 140 }, lines: ['HTTP POST · 50ms 마다', '20000 ~ 80000ms'], lx: 290, ly: 86, order: 1, bx: 237, by: 163 },
  { from: { x: 250, y: 140 }, to: { x: 224, y: 140 }, lines: [], lx: 237, ly: 98 },
  { from: { x: 224, y: 185 }, to: { x: 250, y: 185 }, dashed: true, lines: ['HTTP 응답 429 · Retry-After 8', '거절마다 · 무료 204건 · 20000 ~ 80000ms'], lx: 212, ly: 226, anchor: 'start' as const, order: 4, bx: 196, by: 232 },
  { from: { x: 330, y: 185 }, to: { x: 356, y: 185 }, dashed: true, lines: [], lx: 343, ly: 226 },
  { from: { x: 688, y: 185 }, to: { x: 662, y: 185 }, lines: ['SSE · 조각마다', '20000ms 부터'], lx: 622, ly: 226 },
  { from: { x: 582, y: 185 }, to: { x: 556, y: 185 }, lines: [], lx: 569, ly: 226 },
  { ...PATH.question, lines: ['적기 · 질문마다', '20000 ~ 80000ms'], lx: 134, ly: 308, anchor: 'start' as const },
  { from: { x: 150, y: 210 }, waypoints: [{ x: 150, y: 272 }, { x: 404, y: 272 }], to: { x: 404, y: 330 }, lines: ['넣기 · 유료 · 초당 4', '20000 ~ 80000ms'], lx: 396, ly: 297, anchor: 'end' as const },
  { from: { x: 170, y: 210 }, waypoints: [{ x: 170, y: 256 }, { x: 508, y: 256 }], to: { x: 508, y: 330 }, lines: ['넣기 · 무료 · 초당 16', '20000 ~ 80000ms'], lx: 518, ly: 300, anchor: 'start' as const, order: 2, bx: 664, by: 296 },
  { from: { x: 404, y: 550 }, to: { x: 404, y: 430 }, lines: ['꺼내기', '빈자리마다', '20000ms 부터'], lx: 394, ly: 482, anchor: 'end' as const, order: 3, bx: 318, by: 488 },
  { from: { x: 508, y: 550 }, to: { x: 508, y: 430 }, lines: ['꺼내기 · 빈자리마다 · 두 작업자 모두 두 줄에서', '네 번에 한 번 무료 먼저', '20000ms 부터'], lx: 518, ly: 482, anchor: 'start' as const },
  { from: { x: 436, y: 550 }, waypoints: [{ x: 436, y: 505 }, { x: 484, y: 505 }], to: { x: 484, y: 430 }, lines: [], lx: 460, ly: 500 },
  { from: { x: 476, y: 550 }, waypoints: [{ x: 476, y: 475 }, { x: 428, y: 475 }], to: { x: 428, y: 430 }, lines: [], lx: 452, ly: 470 },
  { ...PATH.chunk, lines: ['쓰기(XADD) · 토큰 5개마다', '초당 16 실행(계산) · 20000ms 부터'], lx: 672, ly: 572 },
  { ...PATH.read, lines: ['읽기 · 조각마다', '20000ms 부터'], lx: 798, ly: 270, anchor: 'start' as const },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={870} title="시나리오 2 — 질문이 GPU 처리 능력보다 초당 4개 많을 때 줄과 한도가 첫 조각 지연을 묶는다">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="유료 줄과 무료 줄에 한도를 두고, 넘치는 질문은 곧바로 다시 보낼 시간을 알려 거절한다" />
      <Boxes
        boxes={[
          { ...API, note: '줄 길이를 보고 넣거나 거절' },
          LB_API,
          { ...BROWSER, tag: 'USERS', note: '초당 20 · 유료 4 · 무료 16' },
          LB_GW,
          GATEWAY,
          STORE,
          PAID_LANE,
          FREE_LANE,
          RECORD,
          WORKER0,
          WORKER1,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={680}
        width={864}
        label="같은 사건열의 두 실행 (20000 ~ 80000ms 에 1200 질문)"
        tone="sunken"
        lines={[
          'guide — 유료 첫 조각은 받은 뒤 최대 1310ms · 무료는 받은 뒤 최대 3760ms, 무료 204건은 429 와 Retry-After 8',
          'one-queue — 줄 하나에 한도 없음, 줄이 240 까지 길어져 유료 · 무료 모두 받은 뒤 최대 14710ms · 거절 0',
          '계산 — 96자리 ÷ 실행 하나 6000ms = 초당 16 실행, 들어오는 초당 20 과의 차이 4개가 초마다 줄에 쌓임',
        ]}
      />
    </C4DynamicDiagram>
  );
}

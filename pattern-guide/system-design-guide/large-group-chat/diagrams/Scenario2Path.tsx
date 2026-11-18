// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx). 상자 이름은 개념도와 같고, 사용자 앱은
// 인스턴스 셋(보내는 사람들 · 보는 사람들 · P)으로 나눴다. 중계 서버 67대는 한 상자로 그리고 tag 에 대수를 적었다(명세 SD11, 1.1.0).
// 앱의 WebSocket 연결이 앞단의 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다. 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 2 줄(2500 · 2550 · 2552 · 2602ms, guide · all-watching · direct 합계, 두 사람의 순서 두 줄).
// 초당 20건 · 5초 · 10명에 1명이 보는 중 · 프로세스 하나가 1ms 에 100건 보냄은 이 가이드의 가정이다(code/ 의 GAP · PER_MS · main).
// 배지 번호는 본문 시나리오 2 의 단계 번호와 같다. 3 · 4단계는 같은 사건열을 다르게 실행한 비교라 화살표 대신 아래 상자에 적었다.
//
// 주장: 피크에 메시지가 초당 20건 와도 방 프로세스의 일은 메시지마다 67건이고, 중계 서버는 보는 연결 1500 에만 보내 121ms 안에 끝난다.
// 보지 않던 P 는 방을 연 뒤 로그에서 50건을 읽어 102ms 에 따라잡는다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Boxes, LB, LOG, Lane, RELAY, ROOM, W } from './_chat-layout';

const LANES = [
  { from: { x: 174, y: 170 }, to: { x: 196, y: 170 }, lines: [] as string[], lx: 0, ly: 0 },
  { from: { x: 276, y: 170 }, to: { x: 430, y: 300 }, waypoints: [{ x: 430, y: 170 }], lines: ['WebSocket · 초당 20건'], lx: 352, ly: 160, order: 1, bx: 352, by: 192 },
  { from: { x: 480, y: 300 }, to: { x: 690, y: 160 }, waypoints: [{ x: 480, y: 160 }], lines: ['프로세스 메시지 · 보낼 때마다'], lx: 585, ly: 150 },
  { from: { x: 790, y: 210 }, to: { x: 790, y: 500 }, lines: ['XADD', 'seq 1 … 100'], lx: 800, ly: 330, anchor: 'start' as const },
  { from: { x: 690, y: 195 }, to: { x: 560, y: 300 }, waypoints: [{ x: 560, y: 195 }], lines: ['프로세스 메시지', '메시지마다 67곳 · 합계 6700건'], lx: 584, ly: 240, anchor: 'start' as const },
  { from: { x: 400, y: 392 }, to: { x: 276, y: 392 }, lines: ['보는 중 1500곳에', '15ms · WebSocket'], lx: 338, ly: 362, order: 2, bx: 383, by: 392 },
  { from: { x: 196, y: 392 }, to: { x: 174, y: 392 }, lines: [] as string[], lx: 0, ly: 0 },
  { from: { x: 174, y: 545 }, to: { x: 196, y: 545 }, lines: [] as string[], lx: 0, ly: 0 },
  { from: { x: 276, y: 545 }, to: { x: 400, y: 545 }, lines: ['WebSocket · 방 열기', '2500 → 2550ms'], lx: 340, ly: 500, order: 5, bx: 296, by: 545 },
  { from: { x: 590, y: 560 }, to: { x: 690, y: 560 }, lines: ['XREAD after 0', '2550ms'], lx: 640, ly: 530 },
  { from: { x: 400, y: 578 }, to: { x: 276, y: 578 }, lines: ['WebSocket', '2552ms seq 1 … 50'], lx: 340, ly: 590 },
  { from: { x: 196, y: 578 }, to: { x: 174, y: 578 }, lines: [] as string[], lx: 0, ly: 0 },
];

export default function Scenario2Path() {
  return (
    <C4DynamicDiagram width={W} height={830} title="시나리오 2 — 피크 5초 동안 메시지 100건이 100만 연결 방에 가는 길">
      <DiagramHeader eyebrow="Scenario 2 · C4 dynamic" title="방 프로세스는 메시지마다 67건, 중계 서버는 보는 연결에만" />
      <Boxes
        boxes={[
          { ...APP, y: 130, w: 150, tag: 'SENDERS', note: '50ms 마다 한 사람' },
          { ...APP, w: 150, tag: 'WATCHING', note: '100000명 · 최대 121ms' },
          { ...APP, y: 520, w: 150, tag: 'P · NOT WATCHING', note: '2500ms 방을 엶' },
          { ...LB, x: 196, w: 80, h: 470 },
          { ...RELAY, x: 400, y: 300, w: 190, h: 300, tag: 'RELAY × 67', note: '보는 중 1500 · 건너뜀 13500' },
          { ...ROOM, note: 'seq 1 … 100 을 붙임' },
          { ...LOG, note: 'seq 1 … 100' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={640}
        width={W - GUTTER * 2}
        label="같은 메시지 100건을 다르게 보내면 (실행 출력의 합계)"
        tone="sunken"
        lines={[
          '2  이 가이드: 중계 서버마다 메시지 하나에 15ms · 보낸 뒤 최대 121ms · 보는 사람 가운데 뒤처진 사람 0',
          '2  보지 않는 연결에도 보냄 (all-watching): 메시지 하나에 150ms 라 50ms 간격을 못 따라가 최대 10155ms',
          '3  방 프로세스가 연결마다 직접 (direct): 메시지마다 1000000건 · 첫 메시지 10102ms · 최대 995152ms',
          '4  같은 ms 의 X · Y: 이 가이드는 V1 · V2 모두 X Y, 중계 서버마다 순서를 정하면 V2 는 Y X',
          '5  P: 2500ms 에 열고 2602ms 에 seq 1 … 50 까지 따라잡음 (102ms)',
        ]}
      />
    </C4DynamicDiagram>
  );
}

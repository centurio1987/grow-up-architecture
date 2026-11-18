// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx). 상자 이름은 개념도와 같고, 사용자 앱과
// 중계 서버는 인스턴스 여럿(A · V · W, 중계 서버 1 · 2)으로 나눴다(명세 SD11, 1.1.0). 앱의 WebSocket 연결이 앞단의
// 부하 분산을 지나므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 보내는 길과 받는 길에 그린다. 코드는 부하 분산을 흉내 내지 않는다.
// 출처: code/expected-output.txt 의 시나리오 1 줄(0 · 50 · 51 · 53 · 55 · 120ms, one message 합계).
// 앱과 중계 서버 사이 50ms · 서버 사이 1ms · 프로세스 하나가 1ms 에 100건 보냄은 이 가이드의 가정이다(code/ 의 APP_NET · DC_NET · PER_MS).
// 배지 번호는 본문 시나리오 1 의 단계 번호와 같다.
//
// 주장: A 의 메시지 하나는 방 프로세스에서 순번 1 을 받아 방 로그에 먼저 쓰이고, 중계 서버 67대가 보고 있는 10만 연결에만
// 보내 120ms 안에 끝난다. 보지 않는 90만 연결에는 아무것도 가지 않는다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Boxes, LB, LOG, Lane, RELAY, ROOM, W } from './_chat-layout';

const LANES = [
  { from: { x: 184, y: 170 }, to: { x: 206, y: 170 }, lines: ['WebSocket', '0ms 보냄'], lx: 195, ly: 112, order: 1, bx: 195, by: 240 },
  { from: { x: 306, y: 170 }, to: { x: 330, y: 170 }, lines: [] as string[], lx: 0, ly: 0 },
  { from: { x: 550, y: 160 }, to: { x: 690, y: 160 }, lines: ['프로세스 메시지', '50ms → 51ms'], lx: 620, ly: 132 },
  { from: { x: 790, y: 210 }, to: { x: 790, y: 500 }, lines: ['XADD · 51ms', 'seq=1 을 씀'], lx: 800, ly: 340, anchor: 'start' as const, order: 2, bx: 790, by: 270 },
  { from: { x: 720, y: 210 }, to: { x: 550, y: 372 }, waypoints: [{ x: 720, y: 372 }], lines: ['프로세스 메시지 · 53ms', '쓰인 것을 보고 67곳에 seq=1'], lx: 635, ly: 395, order: 3, bx: 720, by: 290 },
  { from: { x: 330, y: 392 }, to: { x: 306, y: 392 }, lines: ['WebSocket · 55 ~ 70ms', '보는 중 1500곳에만'], lx: 328, ly: 440, anchor: 'start' as const, order: 4, bx: 318, by: 392 },
  { from: { x: 206, y: 392 }, to: { x: 184, y: 392 }, lines: [] as string[], lx: 0, ly: 0, order: 5, bx: 195, by: 440 },
];

export default function Scenario1Path() {
  return (
    <C4DynamicDiagram width={W} height={790} title="시나리오 1 — 메시지 하나가 보고 있는 사람에게 가는 길">
      <DiagramHeader eyebrow="Scenario 1 · C4 dynamic" title="순번 1 을 로그에 먼저 쓰고, 보는 연결에만 보낸다" />
      <Boxes
        boxes={[
          { ...APP, y: 130, tag: 'A · SENDS', note: '0ms 메시지 하나' },
          { ...APP, tag: 'V · WATCHING', note: '120ms seq=1 · last=1' },
          { ...APP, y: 500, tag: 'W · NOT WATCHING', note: '받은 것 없음 · last=0' },
          LB,
          { ...RELAY, y: 130, tag: 'RELAY 1', note: 'A 의 연결을 맡음' },
          { ...RELAY, tag: 'RELAY 2 (… 67)', note: '보는 중 1500 · 건너뜀 13500' },
          { ...ROOM, note: 'seq=1 을 붙임' },
          { ...LOG, note: 'seq=1 · 51ms 에 씀' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={650}
        width={W - GUTTER * 2}
        label="메시지 하나 (one message)"
        tone="sunken"
        lines={[
          '방 프로세스가 보낸 것 67건 · 중계 서버들이 보낸 것 100000건 · 보지 않아 건너뛴 연결 900000',
          '보낸 뒤 마지막 앱이 받기까지 120ms · 보는 사람 가운데 뒤처진 사람 0 · 보지 않는 사람이 받은 것 0',
        ]}
      />
    </C4DynamicDiagram>
  );
}

// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx). 상자 이름은 개념도와 같고, 중계 서버는
// 멈춘 중계 서버 1 과 나머지 66대(중계 서버 2 … 67)의 인스턴스 둘로 나눴다(명세 SD11, 1.1.0). 끊긴 앱은 앞단의 부하 분산을
// 다시 지나 살아 있는 중계 서버로 붙으므로 개념도 밖 배포 세부인 「부하 분산」(LB)을 그린다. 코드는 부하 분산이 고르는 중계
// 서버를 세션 번호로 정해 흉내 낸다(code/ 의 stop).
// 출처: code/expected-output.txt 의 시나리오 3 줄(2000 · 3912 · 3914 · 3964ms, guide · no-jitter · pubsub-only 합계).
// 다시 연결하기 전 0 ~ 4999ms 의 무작위 대기는 RFC 6455 의 권고를 따른 이 가이드의 설정이다(code/ 의 JITTER).
// 배지 번호는 본문 시나리오 3 의 단계 번호와 같다.
//
// 주장: 중계 서버 1 이 멈추면 그 연결 15000 이 끊기고 그동안의 메시지는 그 길에서 사라진다. 보던 1500 명은 무작위로 기다렸다
// 다른 중계 서버로 붙어 마지막 순번 이후를 방 로그에서 읽고, 빈자리 없이 5101ms 안에 따라잡는다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Boxes, LB, LOG, Lane, RELAY, ROOM, W } from './_chat-layout';

const LANES = [
  { from: { x: 690, y: 160 }, to: { x: 590, y: 160 }, dashed: true, lines: ['프로세스 메시지 · 2000ms 뒤', '이 길에서 사라짐'], lx: 640, ly: 100, order: 1, bx: 640, by: 185 },
  { from: { x: 400, y: 200 }, to: { x: 276, y: 200 }, dashed: true, lines: ['WebSocket', '2000ms 닫힘'], lx: 345, ly: 170 },
  { from: { x: 196, y: 200 }, to: { x: 174, y: 200 }, dashed: true, lines: [] as string[], lx: 0, ly: 0 },
  { from: { x: 174, y: 352 }, to: { x: 196, y: 352 }, lines: [] as string[], lx: 0, ly: 0 },
  { from: { x: 276, y: 352 }, to: { x: 400, y: 352 }, lines: ['WebSocket 다시 연결', 'R: 1862ms 기다림'], lx: 338, ly: 322, order: 2, bx: 296, by: 372 },
  { from: { x: 790, y: 210 }, to: { x: 790, y: 500 }, lines: ['XADD', '방 메시지마다'], lx: 800, ly: 330, anchor: 'start' as const },
  { from: { x: 720, y: 210 }, to: { x: 590, y: 372 }, waypoints: [{ x: 720, y: 372 }], lines: ['프로세스 메시지', '방 메시지마다 66곳'], lx: 655, ly: 395 },
  { from: { x: 500, y: 410 }, to: { x: 690, y: 555 }, waypoints: [{ x: 500, y: 555 }], lines: ['XREAD after 39', '3912ms'], lx: 595, ly: 525, order: 3, bx: 500, by: 470 },
  { from: { x: 400, y: 392 }, to: { x: 276, y: 392 }, lines: ['WebSocket', '3914ms 40 … 78'], lx: 345, ly: 414, order: 4, bx: 383, by: 392 },
  { from: { x: 196, y: 392 }, to: { x: 174, y: 392 }, lines: [] as string[], lx: 0, ly: 0 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={770} title="시나리오 3 — 중계 서버 하나가 멈출 때 그 방을 보던 중에 끊긴 사람이 놓친 메시지를 채우는 길">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="끊긴 동안의 메시지는 로그에서, 순번이 빈자리를 알려 준다" />
      <Boxes
        boxes={[
          { ...APP, y: 160, w: 150, h: 270, tag: 'R · WATCHING', note: '3964ms last=78' },
          { ...LB, x: 196, w: 80, h: 300 },
          { ...RELAY, x: 400, y: 130, w: 190, h: 90, tag: 'RELAY 1 · STOPS', note: '2000ms 연결 15000 닫힘' },
          { ...RELAY, x: 400, y: 330, w: 190, tag: 'RELAY 2 … 67', note: '다시 붙은 15000 을 나눔' },
          { ...ROOM, note: '중계 서버 1 에도 보냄' },
          { ...LOG, note: 'seq 1 … 200' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}-${l.to.y}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={630}
        width={W - GUTTER * 2}
        label="중계 서버 1 의 15000 연결이 다시 붙는 길 (실행 출력의 합계)"
        tone="sunken"
        lines={[
          '이 가이드: 보던 1500 명이 로그를 한 번씩 읽어 74786건을 채움 · 남은 빈자리 0 · 회복 최대 5101ms',
          '기다림 없이 바로 (no-jitter): 15000 연결이 같은 1초에, 로그 읽기 1500건도 같은 1초에 몰림 · 회복 최대 102ms',
          '로그 없이 (pubsub-only): 1500 명이 74684건을 잃고, 다음 메시지의 순번이 건너뛴 것으로만 안다',
        ]}
      />
    </C4DynamicDiagram>
  );
}

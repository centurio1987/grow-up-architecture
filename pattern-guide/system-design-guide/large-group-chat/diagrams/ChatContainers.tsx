// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx) — 방 화면이 있는 앱은 person,
// 여러 대가 뜨는 중계 서버는 container, 방마다 하나씩 뜨는 방 프로세스는 process, 메시지를 순번과 함께 남기는 방 로그는 database.
// 출처: 리서치 노트 system-design-large-group-chat-2026-11-17 1절(추천 구조) · 4-1(방 프로세스) · 4-2(중계 계층) ·
// 4-3(수동 연결) · 4-4(방 단위 순서) · 4-5(놓친 메시지 따라잡기) · 4-6(전달 보장과 저장).
// 중계 서버 67대 · 서버당 연결 15000 은 Discord 의 relay 당 세션 수(노트 2절)로 셈한 값이고, 방 로그 길이 100000 은
// 1시간 비움(72000건)을 덮으려고 이 가이드가 정한 설정이다(code/ 의 RELAYS · SIZE · MAXLEN).
//
// 주장: 순번은 방 프로세스 한 곳이 붙이고, 방 로그에 먼저 쓴 뒤 중계 서버들에만 보낸다. 중계 서버는 그 방을 보고 있는
// 연결에만 보내고, 보지 않던 사람은 방을 열 때, 보던 중에 끊겼던 사람은 다시 붙을 때 마지막으로 받은 순번 이후를
// 방 로그에서 읽어 따라잡는다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { APP, Boxes, LOG, Lane, PATH, RELAY, ROOM, W } from './_chat-layout';

const LANES = [
  { ...PATH.send, lines: ['WebSocket', '보낼 때마다'], lx: 257, ly: 322 },
  { ...PATH.deliver, lines: ['WebSocket · 보는 방의', '메시지마다'], lx: 257, ly: 414 },
  { ...PATH.toRoom, lines: ['프로세스 메시지 · 보낼 때마다'], lx: 545, ly: 150 },
  { ...PATH.toRelays, lines: ['프로세스 메시지', '방 메시지마다 67곳'], lx: 595, ly: 212 },
  { ...PATH.append, lines: ['XADD · 방 메시지마다', '쓴 뒤에 중계 서버로'], lx: 780, ly: 340, anchor: 'end' as const },
  { ...PATH.read, lines: ['XREAD · 보던 방에 다시 연결할 때', '방을 열 때 · 순번의 빈자리를 볼 때'], lx: 565, ly: 525 },
];

export default function ChatContainers() {
  return (
    <C4ContainerDiagram width={W} height={790} title="대형 그룹 채팅의 네 실행 단위">
      <DiagramHeader eyebrow="Large group chat · containers" title="순번은 방 프로세스 한 곳에서, 보내기는 중계 서버들이" />
      <Boxes boxes={[APP, RELAY, ROOM, LOG]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={650}
        width={W - GUTTER * 2}
        label="세션 하나의 상태 (중계 서버가 연결마다 가짐)"
        tone="sunken"
        lines={[
          '보는 중 — 중계 서버가 방 메시지를 보낸다. 앱은 받은 순번이 마지막 + 1 일 때만 화면에 붙인다',
          '보지 않음 — 보내지 않는다. 방을 열면 먼저 보는 중이 되고, 마지막 순번 이후를 방 로그에서 읽는다',
          '끊김 — 다시 붙으면 보던 사람은 먼저 보는 중이 되고, 마지막 순번 이후를 방 로그에서 읽는다',
        ]}
      />
    </C4ContainerDiagram>
  );
}

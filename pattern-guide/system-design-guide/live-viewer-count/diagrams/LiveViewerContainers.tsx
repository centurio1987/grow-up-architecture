// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_live-layout.tsx) — 사람 쪽 끝은 person,
// 배포 단위가 여럿인 에지는 container, 집계는 process, 메시지 채널은 queue.
// 출처: 리서치 노트 live-viewer-count-2026-11-13 6절 집필 메모(B+A 혼합) · V2(에지 연결) · V26(Redis Pub/Sub)
//
// 주장: 시청자 수를 세는 일은 연결을 이미 가진 에지 서버가 하고, 중앙(집계 서비스 · Redis Pub/Sub)이
// 주고받는 메시지는 시청자 수가 아니라 에지 대수에 비례한다. 화살표마다 통신 방식과 빈도가 붙는다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader } from '../../../../viz/frame/frame';
import { AGG, BROWSER, Boxes, EDGE, Lane, PATH, REDIS, W } from './_live-layout';

const LANES = [
  { ...PATH.signal, lines: ['재생 상태 신호', 'HTTP POST · 20초마다'], lx: 292, ly: 226 },
  { ...PATH.sse, lines: ['시청자 수 합계', 'SSE · 1초마다'], lx: 292, ly: 310 },
  { ...PATH.report, lines: ['에지별 재생 중 연결 수', 'HTTP POST · 1초마다'], lx: 492, ly: 122, anchor: 'start' as const },
  { ...PATH.publish, lines: ['합계 발행', 'SPUBLISH · 1초마다'], lx: 777, ly: 262, anchor: 'end' as const },
  { ...PATH.deliver, lines: ['합계 전달', 'SSUBSCRIBE 구독 · 1초마다'], lx: 500, ly: 412, anchor: 'start' as const },
];

export default function LiveViewerContainers() {
  return (
    <C4ContainerDiagram width={W} height={450} title="시청자 수를 세고 모으고 보내는 네 실행 단위">
      <DiagramHeader eyebrow="Live viewer count · containers" title="세는 일은 에지가, 더하는 일은 한 곳이, 보내는 일은 1초에 한 번" />
      <Boxes
        boxes={[
          { ...BROWSER, tag: 'VIEWERS · 10M' },
          { ...EDGE, tag: 'EDGE · ABOUT 100' },
          AGG,
          REDIS,
        ]}
      />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
    </C4ContainerDiagram>
  );
}

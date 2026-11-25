// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_chat-layout.tsx) — 질문하는 사람의 브라우저는 person,
// 여러 대가 뜨는 채팅 API · 스트림 게이트웨이 · GPU 작업자는 container, 실행을 쌓아 두는 요청 대기열은 queue,
// 대화 저장소와 토큰 기록은 database.
// 출처: 리서치 노트 system-design-llm-chat-streaming-2026-11-24 1절(추천 구조) · 4-1(SSE 와 마지막 이벤트 ID) ·
// 4-2(실행과 토큰 기록) · 4-3(요청 대기열과 거절) · 4-4(연속 배칭) · 4-5(대화 저장소) · 4-6(취소) · 4-7(시간 제한과 차단기).
// 줄 한도(유료 12,000 · 무료 32,000), Retry-After(유료 1초 · 무료 8초), 네 번에 한 번 무료 줄 먼저, 토큰 5개마다 적기,
// 조각 사이 시간 제한 3초, 차단기(잇달아 셋 · 30초), 토큰 기록 보관 10분은 이 가이드의 설정이다
// (code/ 의 LIMIT · RETRY_AFTER · FREE_EVERY · CHUNK · TIMEOUT · FAILS_TO_OPEN · OPEN_FOR — 코드는 줄 한도를 1000분의 1인 12 · 32 로 줄였다).
//
// 주장: 채팅 API 는 질문을 대화 저장소에 적고 요청 대기열의 유료 줄이나 무료 줄에 넣은 뒤 실행 번호를 돌려주고, 줄이 차 있으면
// 429 와 Retry-After 로 곧바로 거절한다. GPU 작업자는 빈자리가 생길 때마다 대기열에서 실행을 꺼내 토큰 5개마다 순번을 붙인 조각을
// 토큰 기록에 적고, 끝난 답을 대화 저장소에 적는다. 「실패」 · 「취소됨」으로 끝난 답은 요청 대기열이 대화 저장소에 적는다. 스트림 게이트웨이는 토큰 기록을 읽어 SSE 로 보내며, 다시 연결한 브라우저에는
// Last-Event-ID 다음 순번부터 보낸다. 요청 대기열은 1초마다 마지막 조각 시각을 읽어 3초 넘게 조용한 실행을 「실패」로 적는다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Boxes, BROWSER, GATEWAY, Lane, PATH, QUEUE, RECORD, STORE, W, WORKER } from './_chat-layout';

const LANES = [
  { ...PATH.ask, lines: ['HTTP POST', '질문 · 취소마다'], lx: 290, ly: 112 },
  { ...PATH.reply, dashed: true, lines: ['HTTP 응답 · 질문마다', '실행 번호 또는 429'], lx: 290, ly: 205 },
  { ...PATH.open, lines: ['HTTP GET · 연결 때', 'Last-Event-ID'], lx: 622, ly: 112 },
  { ...PATH.sse, lines: ['SSE · 조각마다', 'id = 순번'], lx: 622, ly: 205 },
  { ...PATH.question, lines: ['쓰기 · 질문마다', '사용자 메시지'], lx: 134, ly: 298, anchor: 'start' as const },
  { ...PATH.enqueue, lines: ['넣기 · 질문마다 · 취소 알리기'], lx: 306, ly: 260 },
  { ...PATH.read, lines: ['읽기 · 조각마다', 'XREAD BLOCK'], lx: 798, ly: 262, anchor: 'start' as const },
  { ...PATH.check, lines: ['읽기 · 1초마다', '쓰기 · 실행이 끝날 때', '「실패」 · 「취소됨」'], lx: 622, ly: 337 },
  { ...PATH.take, lines: ['꺼내기 · 빈자리마다', '20ms 반복'], lx: 466, ly: 482, anchor: 'start' as const },
  { ...PATH.chunk, lines: ['쓰기(XADD) · 토큰 5개마다', '상태 읽기 · 반복마다'], lx: 672, ly: 572 },
  { ...PATH.answer, lines: ['끝난 답 쓰기', '실행마다 한 번'], lx: 240, ly: 572 },
  { ...PATH.close, lines: ['쓰기 · 실행마다 한 번', '「실패」 · 「취소됨」'], lx: 290, ly: 362 },
];

export default function ChatContainers() {
  return (
    <C4ContainerDiagram width={W} height={850} title="LLM 채팅 서비스의 일곱 실행 단위">
      <DiagramHeader eyebrow="LLM chat streaming · containers" title="질문은 줄에 넣고, 조각은 순번과 함께 적고, 게이트웨이는 다음 순번부터 보낸다" />
      <Boxes boxes={[API, BROWSER, GATEWAY, STORE, QUEUE, RECORD, WORKER]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0] + l.from.x + l.from.y} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={680}
        width={864}
        label="규칙"
        tone="sunken"
        lines={[
          '유료 줄 · 무료 줄 — 네 번 꺼낼 때 한 번은 무료 줄 먼저, 줄이 차면 429 와 Retry-After(유료 1초 · 무료 8초)',
          '조각은 토큰 5개마다 순번을 붙여 토큰 기록에 — 연결이 끊겨도 실행은 계속, 다시 연결하면 다음 순번부터',
          '조각 사이 3초 넘게 조용하면 「실패」와 오류 이벤트 — 잇달아 셋이면 그 GPU 작업자의 차단기가 30초 열림',
          '취소는 두 번 와도 결과 하나, 끝난 답은 대화 저장소에, 토큰 기록은 실행이 끝나고 10분 뒤 지움',
        ]}
      />
    </C4ContainerDiagram>
  );
}

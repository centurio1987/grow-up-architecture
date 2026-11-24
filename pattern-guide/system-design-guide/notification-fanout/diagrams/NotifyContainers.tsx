// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_notify-layout.tsx) — 알림을 요청하는 사내 서비스와 외부 발송사는 external,
// 알림을 받는 기기는 person, 여러 대가 뜨는 알림 API · 채널 작업자 · 장기 연결 서버는 container,
// 알림을 쌓아 두는 우선순위 큐 · 실패 큐는 queue, 알림 저장소는 database.
// 출처: 리서치 노트 system-design-notification-fanout-2026-11-23 1절(추천 구조) · 4-1(먼저 적기와 중복 방지 키) · 4-2(우선순위 큐) ·
// 4-3(작업자와 큐의 전달 규칙) · 4-4(응답 가르기와 재시도) · 4-5(발송사 이중화와 차단기) · 4-6(남는 중복) · 4-7(장기 연결).
// 재시도 몫(새 알림이 기다리는 동안 재시도가 쓰는 초당 할당량의 20%, 푸시에만), 다섯 번 실패하면 실패 큐, 차단기의 기준(최근 10번 가운데 절반)은 이 가이드의 설정이다(code/ 의 SHARE · MAX_ATTEMPTS ·
// WINDOW · FAIL_PERCENT — 코드는 할당량을 100분의 1인 초당 100으로 줄여 SHARE 가 20 이다).
//
// 주장: 알림 API 는 중복 방지 키와 함께 알림을 알림 저장소에 먼저 적고 우선순위 큐에 넣는다. 채널 작업자는 급한 큐부터 꺼내
// 발송사 할당량 안에서 보내고(푸시의 재시도도 할당량을 확인), 응답을 성공 · 다시 보낼 실패(FCM 429 · APNs TooManyRequests · 5xx · 응답 없음 — 응답 없음은 「보내는 중」 그대로) · 기기 토큰 지우기 ·
// 그 밖의 실패(그 밖의 4xx · APNs TooManyProviderTokenUpdates)로 갈라 기록한다. SMS 는 발송사 둘 가운데
// 차단기가 닫힌 쪽으로 보낸다. 앱이 열려 있으면 장기 연결 서버가 먼저 보낸다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, Boxes, CALLER, DEVICE, DLQ, Lane, PATH, PUSHV, QUEUE, SMSV, SSE, STORE, W, WORKER } from './_notify-layout';

const LANES = [
  { ...PATH.post, lines: ['HTTP POST · 알림마다', '중복 방지 키를 붙여'], lx: 290, ly: 112 },
  { ...PATH.store, lines: ['쓰기 · 알림마다', '같은 키면 처음 결과'], lx: 622, ly: 112 },
  { ...PATH.enqueue, lines: ['넣기 · 알림마다', '급함 · 보통 · 캠페인 줄'], lx: 466, ly: 256, anchor: 'start' as const },
  { ...PATH.take, lines: ['꺼내기 · 쉬지 않고', '급한 큐부터'], lx: 446, ly: 472, anchor: 'end' as const },
  { ...PATH.requeue, dashed: true, lines: ['재시도 대기', '5xx · 응답 없음', '429(할당량 · 잦은 요청)'], lx: 530, ly: 472, anchor: 'start' as const },
  { ...PATH.dlq, lines: ['옮기기', '다섯 번 실패하면'], lx: 290, ly: 572 },
  { from: { x: 556, y: 570 }, waypoints: [{ x: 662, y: 570 }, { x: 662, y: 260 }, { x: 740, y: 260 }], to: { x: 740, y: 210 }, lines: ['결과 기록 · 꺼낼 때마다', '기기 토큰 지움', 'FCM 404 · APNs 410'], lx: 672, ly: 300, anchor: 'start' as const },
  { ...PATH.sse, lines: ['HTTP 요청 · 알림마다', '앱이 열려 있을 때'], lx: 622, ly: 642 },
  { ...PATH.history, lines: ['이력 읽기', '다시 연결할 때'], lx: 830, ly: 470, anchor: 'end' as const },
  { ...PATH.push, lines: ['HTTP 요청 · 알림마다', '할당량 확인 · 재시도 몫 20%'], lx: 134, ly: 735, anchor: 'start' as const },
  { ...PATH.sms, lines: ['HTTP 요청 · 알림마다', 'A, 열리면 B'], lx: 466, ly: 690, anchor: 'start' as const },
  { ...PATH.stream, lines: ['SSE', '이벤트마다'], lx: 810, ly: 700, anchor: 'start' as const },
  { ...PATH.ack, dashed: true, lines: ['HTTP POST 받음 확인', '이벤트마다'], lx: 730, ly: 735, anchor: 'end' as const },
  { ...PATH.text, lines: ['문자 · 알림마다'], lx: 622, ly: 805 },
  { ...PATH.deliver, lines: ['발송사가 기기에 전달 · 알림마다 — 같은 접기 ID(iOS apns-collapse-id · Android 알림 태그)면 화면에 하나'], lx: 456, ly: 922 },
];

export default function NotifyContainers() {
  return (
    <C4ContainerDiagram width={W} height={1150} title="알림 대량 발송의 열 실행 단위">
      <DiagramHeader eyebrow="Notification fan-out · containers" title="적은 뒤 큐에 넣고, 급한 것부터 꺼내 할당량 안에서 보낸다" />
      <Boxes boxes={[CALLER, API, STORE, QUEUE, DLQ, WORKER, SSE, PUSHV, SMSV, DEVICE]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0] + l.from.x + l.from.y} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={950}
        width={864}
        label="규칙"
        tone="sunken"
        lines={[
          '급한 줄부터 꺼내고, 푸시의 재시도도 할당량을 확인 — 새 알림이 기다리는 동안은 초당 할당량의 20%(재시도 몫)까지',
          '5xx · 응답 없음은 재시도 대기 — FCM 10초 · SMS 1초부터 두 배씩 + 지터, FCM 은 retry-after 가 더 길면 그 값',
          'APNs 5xx 는 15분 뒤, FCM 429 · APNs TooManyRequests 는 retry-after 와 60초 × 2^(n−1) 가운데 긴 쪽',
          'FCM 404 · APNs 410 은 기기 토큰 지움, 그 밖의 4xx 와 APNs TooManyProviderTokenUpdates 는 실패로 기록',
          '응답 없음은 「보내는 중」 그대로 — 다섯 번 실패하면 실패 큐',
          'SMS 는 발송사 둘 — 최근 10번 가운데 절반이 실패하면 차단기가 열려 B 로, 10초 뒤 시험 호출 셋으로 A 를 확인',
        ]}
      />
    </C4ContainerDiagram>
  );
}

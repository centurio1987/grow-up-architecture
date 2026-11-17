// @relation linear
// @viz-type VT-113
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_rate-layout.tsx). 상자 이름과 자리는 개념도와 같다.
// 이 시나리오도 앞단의 부하 분산이 요청을 서버 넷에 돌아가며 나누는 데 기대므로(로컬 버킷이 한도를 넷으로 나누는 이유)
// 개념도 밖 배포 세부인 「부하 분산」(LB)을 요청 경로에 그린다(명세 SD11, 1.1.0).
// 출처: code/expected-output.txt 의 시나리오 3 줄(15000.000ms 멈춤 · 35000.000ms 빈 재시작 · 35000.510ms NOSCRIPT ·
// open K3-during-outage=1900 · closed K1 allowed=320/480 · local K1 480/480 K3-during-outage=228 K3 allowed=828 ·
// redis counts K3 at 600). 멈춘 시간 20초와 시간 제한 5ms 는 이 가이드의 가정이다(code/ 의 실행 값 · TIMEOUT_US).
//
// 주장: Redis 가 멈춘 동안 API 서버는 5ms 를 기다린 뒤 서버마다의 토큰 버킷으로 판정해, 한도 안의 K1 은 다 허용하고
// 폭주하는 K3 은 초당 12건으로 묶는다. 다시 뜬 Redis 는 그동안 허용한 228건을 모른다.
import { C4DynamicDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, BACKEND, Boxes, CLIENT, LB, Lane, PATH, REDIS, W } from './_rate-layout';

const LANES = [
  { ...PATH.toLb, lines: ['K1 초당 8건', 'K3 16초부터 초당 100건'], lx: 94, ly: 222, order: 1, bx: 182, by: 248 },
  { ...PATH.fromLb, lines: [] as string[], lx: 0, ly: 0 },
  {
    ...PATH.decide, dashed: true,
    lines: ['15 ~ 35초 응답 없음', '5ms 뒤 시간 제한', '35초 NOSCRIPT → EVAL'], lx: 405, ly: 208, anchor: 'end' as const, order: 2, bx: 425, by: 236,
  },
  { ...PATH.forward, lines: ['멈춘 동안 K3 228건', '(초당 12.0건)'], lx: 610, ly: 268, order: 3, bx: 560, by: 290 },
  { ...PATH.answer, lines: ['K1 은 480건 모두 200', 'K3 은 3,572건 429'], lx: 242, ly: 350 },
];

export default function Scenario3Path() {
  return (
    <C4DynamicDiagram width={W} height={600} title="시나리오 3 — 리전 Redis 가 멈춘 동안 로컬 버킷으로 판정하는 길">
      <DiagramHeader eyebrow="Scenario 3 · C4 dynamic" title="Redis 가 20초 멈추면 로컬 버킷이 K3 을 초당 12건으로 묶고, K1 은 그대로" />
      <Boxes
        boxes={[
          { ...CLIENT, tag: 'K1 · K3' },
          LB,
          { ...API, note: '서버마다 키별 버킷 · 1분 150건' },
          { ...REDIS, tag: 'STOPPED 15s ~ 35s', note: '35초에 카운터 없이 다시 뜸' },
          { ...BACKEND, note: 'K1 480건 · K3 828건' },
        ]}
      />
      {LANES.map((l) => (
        <Lane key={`${l.from.x}-${l.from.y}-${l.to.x}`} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={420}
        width={W - GUTTER * 2}
        label="Redis 가 응답하지 않을 때 셋을 비교하면"
        tone="sunken"
        lines={[
          '열어 두기: 멈춘 동안 K3 1,900건 통과 (초당 100건) · K1 480 / 480',
          '닫아 두기: 멈춘 동안 K3 0건 · K1 320 / 480 — 한도 안의 요청 160건까지 거절',
          '로컬 버킷 (이 글): 멈춘 동안 K3 228건 (초당 12.0건) · K1 480 / 480',
          '6 · 다시 뜬 Redis 는 K3 의 228건을 모른 채 600건을 더 허용 — 실제 828건, Redis 의 셈은 600',
        ]}
      />
    </C4DynamicDiagram>
  );
}

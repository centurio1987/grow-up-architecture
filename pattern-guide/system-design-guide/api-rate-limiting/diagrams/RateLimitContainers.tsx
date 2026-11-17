// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_rate-layout.tsx) — 우리가 만들지 않는 클라이언트는 external,
// 여러 대가 뜨는 API 서버는 container, 카운터 저장소 Redis 는 database, 업무 서비스는 process.
// 출처: 리서치 노트 system-design-api-rate-limiting-2026-11-16 1절(추천 구조) · 4-1(근사 창) · 4-2(Lua 원자성) ·
// 4-3(어디서 세는가) · 4-4(429 · Retry-After) · 4-5(고장 때). 화살표의 빈도는 이 가이드의 설정이고 code/ 의 동작과 같다.
// 로컬 버킷 값(서버마다 1분 150건 · 용량 10)은 code/ 의 LIMIT / SERVERS · CAP 이다.
//
// 주장: 판정은 리전 Redis 에서 Lua 스크립트 한 번으로 하고, 거절이 정해진 키는 API 서버가 스스로 거절한다.
// 리전 셋은 같은 구성을 따로 갖고 판정을 위해 서로 묻지 않는다. 화살표마다 통신 방식과 빈도가 붙는다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { API, BACKEND, Boxes, CLIENT, Lane, PATH, REDIS, W } from './_rate-layout';

const LANES = [
  { ...PATH.request, lines: ['HTTPS 요청 · API 키', '요청마다'], lx: 242, ly: 250 },
  { ...PATH.answer, lines: ['200 + 남은 양 헤더', '429 + Retry-After', 'HTTP 응답 · 요청마다'], lx: 242, ly: 350 },
  { ...PATH.decide, lines: ['EVALSHA (Redis 명령)', '로컬 차단이 아닌 요청마다'], lx: 437, ly: 215, anchor: 'start' as const },
  { ...PATH.forward, lines: ['HTTP 전달', '허용된 요청만'], lx: 610, ly: 268 },
];

export default function RateLimitContainers() {
  return (
    <C4ContainerDiagram width={W} height={520} title="API 처리율 제한을 판정하는 네 실행 단위">
      <DiagramHeader eyebrow="API rate limiting · containers" title="판정은 리전 Redis 의 Lua 한 번, 거절이 정해진 키는 API 서버가 스스로" />
      <Boxes boxes={[CLIENT, { ...API, tag: 'API · SCALE OUT' }, REDIS, BACKEND]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={420}
        width={W - GUTTER * 2}
        label="리전 셋이 같은 구성을 따로 갖는다"
        tone="sunken"
        lines={[
          '리전 A · B · C 에 API 서버 · Redis · 업무 서비스가 따로 있고, 판정을 위해 리전끼리 묻지 않는다',
          'Redis 가 응답하지 않으면 API 서버가 키마다 토큰 버킷으로 판정한다 (서버마다 1분 150건 · 용량 10)',
        ]}
      />
    </C4ContainerDiagram>
  );
}

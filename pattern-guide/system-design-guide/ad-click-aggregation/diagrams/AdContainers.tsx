// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 실행 단위라 RoleBox 로 그린다(_ad-layout.tsx) — 광고를 누르는 앱은 person, 여러 대가 뜨는
// 광고 서버와 집계 작업은 container, 기록을 순서대로 쌓아 두는 두 Kafka 토픽은 queue, 체크포인트 저장소와 결과 표는 database.
// 출처: 리서치 노트 system-design-ad-click-aggregation-2026-11-18 1절(추천 구조) · 4-1(클릭 ID 와 중복 제거) ·
// 4-2(정확히 한 번의 범위) · 4-3(트랜잭션 쓰기와 체크포인트) · 4-4(이벤트 시각 창과 늦은 클릭) · 4-5(한 광고에 몰리는 클릭) ·
// 4-6(결과 ID 로 덮어쓰기). 파티션 · 작업 8개, 체크포인트 10초, 워터마크 5초, 허용 지연 10분, 클릭 ID 1시간 기억은 이 가이드의
// 설정이다(code/ 의 PARTS · EVERY · BOUND · LATENESS, 1시간은 모형이 15분이라 코드에 없음).
//
// 주장: 광고 서버가 클릭마다 붙인 클릭 ID 를 키로 클릭 토픽에 쓰고, 집계 작업은 클릭 ID 로 거른 뒤 클릭 시각 1분 창으로
// 작업마다 부분합을 내 합친다. 창의 결과는 체크포인트마다 트랜잭션으로 커밋되고, 결과 표는 커밋된 것만 읽어
// (광고 ID, 분 시작) 으로 덮어쓴다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { ADSRV, APP, Boxes, CKPT, CLICKS, JOB, Lane, PATH, RTOPIC, TABLE, W } from './_ad-layout';

const LANES = [
  { ...PATH.click, lines: ['HTTP 요청', '누를 때마다'], lx: 290, ly: 132 },
  { ...PATH.produce, lines: ['Kafka 쓰기', '클릭마다', '키 = 클릭 ID'], lx: 622, ly: 117 },
  { ...PATH.consume, lines: ['Kafka 읽기 · 계속', '파티션 하나에 작업 하나'], lx: 776, ly: 262, anchor: 'end' as const },
  { ...PATH.commit, lines: ['트랜잭션 쓰기', '분이 닫힐 때', '늦은 클릭마다', '커밋 · 체크포인트마다'], lx: 622, ly: 334 },
  { ...PATH.load, lines: ['read_committed', '읽기 · 커밋마다'], lx: 290, ly: 377 },
  { ...PATH.snapshot, lines: ['상태 사본 쓰기 · 10초마다', '다시 시작할 때 읽음'], lx: 776, ly: 490, anchor: 'end' as const },
];

export default function AdContainers() {
  return (
    <C4ContainerDiagram width={W} height={720} title="광고 클릭 집계의 일곱 실행 단위">
      <DiagramHeader eyebrow="Ad click aggregation · containers" title="클릭은 클릭 ID 로 한 번, 분의 결과는 (광고, 분) 으로 덮어쓴다" />
      <Boxes boxes={[APP, ADSRV, CLICKS, JOB, RTOPIC, TABLE, CKPT]} />
      {LANES.map((l) => (
        <Lane key={l.lines[0]} spec={l} />
      ))}
      <Callout
        x={GUTTER}
        y={500}
        width={620}
        label="같은 클릭이 결과에 한 번만 들어가게 나눠 맡는 곳"
        tone="sunken"
        lines={[
          '앱이 다시 보낸 클릭 — 클릭 ID 로 거른다 (1시간 기억)',
          '집계 작업이 멈춤 — 체크포인트의 상태와 읽은 위치에서 다시 읽는다',
          '커밋 전에 멈춤 — 그 트랜잭션의 결과는 결과 표가 읽지 않는다',
          '늦은 클릭으로 같은 분이 다시 나옴 — (광고 ID, 분 시작) 으로 덮어쓴다',
          '분이 끝나고 11분 지나 넘어온 클릭 — 그 분을 고치지 않고 광고마다 따로 센다',
        ]}
      />
    </C4ContainerDiagram>
  );
}

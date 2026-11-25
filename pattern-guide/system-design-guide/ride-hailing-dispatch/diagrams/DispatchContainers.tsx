// @relation relate
// @viz-type VT-110
// 역할 규약: 칸이 시스템의 서버 · 앱 · 저장소 하나씩이라 RoleBox 로 그린다(_dispatch-layout.tsx) — 기사 앱 · 손님 앱은 person,
// 여러 대가 뜨는 위치 수집 서비스 · 배차 서비스는 container, 위치 인덱스 · 기사 기록 저장소 · 요청 기록 저장소는 database.
// 출처: 리서치 노트 system-design-ride-hailing-dispatch-2026-11-25 1절(추천 구조) · 4-1(위치 갱신과 오래된 위치) ·
// 4-2(위치 인덱스와 이웃 셀) · 4-3(셀로 나누기) · 4-4(제안과 점유) · 4-5(수락 시간) · 4-6(멱등 키).
// 셀 한 변 1 km, 둘레 9칸, 오래된 기준 30초, 수락 시간 15초, 다시 찾기 5초, 새 제안은 받은 뒤 45초까지, 거두기는 이 가이드의 설정이다
// (code/ 의 CELL · RING · STALE · ACCEPT · AGAIN · LAST_OFFER · withdraw). 5초 위치 갱신은 교육용 분석의 전제와 Lyft 발표의 값이다.
//
// 주장: 기사 앱은 5초마다 위치 갱신을 위치 수집 서비스에 보내고, 위치 수집 서비스는 그 셀을 맡은 위치 인덱스 노드에 덮어쓴다.
// 손님 앱의 요청은 멱등 키와 함께 배차 서비스로 가고, 배차 서비스는 요청 기록 저장소에 적은 뒤 둘레 9칸을 읽어,
// 가장 가까운 빈 기사의 기사 기록에 조건부 쓰기로 점유를 잡고 제안한다. 수락도 거두기도 기사 기록 한 행의 조건부 쓰기다.
import { C4ContainerDiagram } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { Boxes, DISPATCH, DRIVER, INDEX, INGEST, Lane, PATH, RECORD, REQUESTS, RIDER, W } from './_dispatch-layout';

const LANES = [
  { ...PATH.locate, lines: ['HTTPS POST · 5초마다', '위치 갱신'], lx: 134, ly: 262, anchor: 'start' as const },
  { ...PATH.accept, lines: ['HTTPS POST · 수락마다'], lx: 315, ly: 130 },
  { ...PATH.offer, dashed: true, lines: ['앱 연결 · 제안마다'], lx: 300, ly: 205 },
  { ...PATH.request, lines: ['HTTPS POST · 요청마다', '멱등 키'], lx: 597, ly: 115 },
  { ...PATH.result, dashed: true, lines: ['앱 연결 · 요청마다', '배정 또는 실패'], lx: 610, ly: 205 },
  { ...PATH.write, lines: ['쓰기 · 갱신마다', '셀의 노드에'], lx: 134, ly: 482, anchor: 'start' as const },
  { ...PATH.search, lines: ['읽기 · 찾을 때마다', '둘레 9칸'], lx: 260, ly: 482, anchor: 'start' as const },
  { ...PATH.hold, lines: ['조건부 쓰기 · 제안 · 수락 · 거두기마다', '읽기 · 찾을 때마다'], lx: 466, ly: 482, anchor: 'start' as const },
  { ...PATH.key, lines: ['쓰기 · 요청마다', '멱등 키 · 결과'], lx: 798, ly: 462, anchor: 'start' as const },
];

export default function DispatchContainers() {
  return (
    <C4ContainerDiagram width={W} height={870} title="승차 공유 배차 매칭의 일곱 상자">
      <DiagramHeader eyebrow="Ride-hailing dispatch · containers" title="위치는 셀의 노드에 덮어쓰고, 기사는 기사 기록 한 행의 조건부 쓰기로 내준다" />
      <Boxes boxes={[DRIVER, RIDER, INGEST, DISPATCH, INDEX, RECORD, REQUESTS]} />
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
          '셀은 한 변 1 km 의 칸, 셀 ID 로 일관 해싱한 노드에 적음 — 찾을 때는 둘레 9칸, 30초 넘게 위치 갱신이 없는 기사와 이 요청에 이미 제안한 기사는 뺌',
          '제안 — 대기이거나 점유가 만료됐을 때만 제안 중 · 요청 ID · 만료 15초 뒤로 (0행이면 다음 후보)',
          '수락 — 제안 중이고 요청 ID 가 같고 만료 전일 때만 운행 중으로',
          '거두기 — 15초 안에 수락이 없으면 제안 중이고 요청 ID 가 같을 때만 대기로, 그다음 후보에게 제안',
          '한 번에 한 기사, 후보가 없으면 5초 뒤 다시, 새 제안은 받은 뒤 45초까지, 같은 멱등 키는 같은 요청',
        ]}
      />
    </C4ContainerDiagram>
  );
}

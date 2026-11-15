// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Temporal Property(eaaDev 초안) 의 "How it Works" — 시점을 인자로 받는 접근자 ·
//       Effectivity(eaaDev 초안) 의 한 줄 의도와 "How it Works" — 값에 기간을 달고 Range 로 둔다 ·
//       Fowler Analysis Patterns 3장 §3.8 Dual Time Record 의 그림 3.11(apsupp/apchap3.pdf,
//       2026-09-30 직접 확인) — 기록에서 시간 기록으로 가는 연관이 둘이고 이름이 applicability·recording time 이다.
//
// 주장: **시점 판정이 시간 속성 쪽에 있다.** 속성 값은 하나가 아니라 유효 기간이 붙은 값 여럿이고,
// 그 기간은 Range 값 하나이며, 값마다 우리가 그것을 안 날이 따로 붙는다 — 그래서 사건 시각과
// 기록 시각 두 축을 한 접근자가 받는다. 사원은 그 속성을 여럿 들 수 있다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 520;

// 잎 칸의 폭을 손으로 맞춘다. 부모 칸이 자식 칸 중심 위에 앉으므로(domain-model.tsx 의 중점 규칙)
// 좁은 잎 위에 넓은 부모가 오면 옆 열로 비어져 나온다.
const LEAF_W = 230;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'employee', name: 'Employee', attributes: ['일당 : TemporalProperty', '소속 : TemporalProperty'] },
    {
      id: 'property',
      name: 'TemporalProperty',
      methods: ['valueOn(TimePoint)', 'valueOn(TimePoint, TimePoint)'],
    },
    // 기록 시각은 그림 3.11 이 기록 쪽에 붙인 둘째 시간 연관이다 — 이 칸의 줄로 적는다.
    { id: 'effectivity', name: 'Effectivity', attributes: ['value', 'recordedOn : TimePoint'] },
    {
      id: 'range',
      name: 'Range',
      attributes: ['from : TimePoint', 'to : TimePoint [0..1]'],
      methods: ['includes()'],
      width: LEAF_W,
    },
    { id: 'timepoint', name: 'TimePoint', methods: ['ordinal()'], width: LEAF_W },
  ],
  relations: [
    // 사원 하나가 시간 속성을 여럿 든다 — 이 예제는 일당과 소속 둘이다.
    { from: 'employee', to: 'property', kind: 'composition', fromCard: '1', toCard: '*' },
    // 시간 속성 하나가 유효 기간이 붙은 값 여럿을 쥔다. 이 다중도가 「값이 하나가 아니라 이력이다」다.
    { from: 'property', to: 'effectivity', kind: 'composition', fromCard: '1', toCard: '*' },
    // 값 하나가 유효 구간 하나를 가리킨다 — 두 날짜 칸이 아니라 Range 값 하나다.
    { from: 'effectivity', to: 'range', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    // 구간의 두 끝. 선이 둘인 것은 from 과 to 가 따로 있다는 뜻이고, 칸 안의 두 줄이 그 끝이다.
    { from: 'range', to: 'timepoint', kind: 'association', toCard: '1', above: 'from' },
    { from: 'range', to: 'timepoint', kind: 'association', toCard: '1', above: 'from' },
  ],
};

export default function TemporalPropertyModel() {
  return (
    <Canvas width={W} height={545}>
      <DiagramHeader
        eyebrow="Temporal Property model"
        title="시점 판정은 속성이 맡고, 값마다 유효 구간과 기록 시각이 붙는다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 3장 「Observations and Measurements」 §3.4·§3.5·§3.8·§3.9 의
//       그림 3.6·3.7·3.11·3.12(apsupp/apchap3.pdf, 2026-09-29 직접 확인).
//
// 주장: 기록 한 건이 **대상 · 항목 · 값 세 자리를 각각 따로** 잡는다. 세 자리는 한 칸에 뭉쳐 있지 않고
// 저마다 상대가 있으며, 두 시각과 거부 표시는 Measurement 가 아니라 **상위 사실 층**에 붙는다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 1100;

// 잎 칸의 폭을 손으로 맞춘다. 부모 칸은 자식 칸 중심 위에 앉으므로(domain-model.tsx 의 중점 규칙)
// 좁은 잎 위에 넓은 부모가 오면 옆 열로 비어져 나온다. 같은 폭으로 두면 열 사이에 통로가 생기고
// 그 통로가 `1` `*` 라벨이 앉을 자리가 된다.
const LEAF_W = 208;

const SPEC: DomainModelSpec = {
  entities: [
    // 두 시각은 그림 3.11 이 Observation 에 붙인 것이다 — Measurement 가 아니라 이 칸에 적는다.
    { id: 'obs', name: 'Observation', attributes: ['잰 시각 : TimeRecord', '적은 시각 : TimeRecord'] },
    { id: 'meas', name: 'Measurement' },
    { id: 'rej', name: 'RejectedObservation', width: LEAF_W },
    { id: 'subject', name: 'Subject', attributes: ['이름'], width: LEAF_W },
    { id: 'ptype', name: 'PhenomenonType', attributes: ['이름'], width: LEAF_W },
    { id: 'quantity', name: 'Quantity', attributes: ['amount : Number', 'units : Unit'], width: LEAF_W },
  ],
  relations: [
    // 그림 3.7 — Measurement 는 Observation 의 한 종류다.
    { from: 'meas', to: 'obs', kind: 'inheritance' },
    // 그림 3.12 — 거부된 관측도 Observation 의 한 종류이고, 그 일반화에 «dynamic» 표기가 붙는다.
    { from: 'rej', to: 'obs', kind: 'inheritance' },
    // 그림 3.7 — 사실 하나는 대상 하나에 붙고, 대상 하나에 사실이 여럿이다.
    { from: 'obs', to: 'subject', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    // 그림 3.6 — 측정 하나는 항목 하나를 가리키고, 항목 하나에 측정이 여럿이다.
    { from: 'meas', to: 'ptype', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    // 그림 3.6 — 측정 하나가 값 하나를 품는다.
    { from: 'meas', to: 'quantity', kind: 'association', fromCard: '1', toCard: '1', above: 'from' },
  ],
};

export default function MeasurementModel() {
  return (
    <Canvas width={W} height={548}>
      <DiagramHeader eyebrow="Measurement model" title="기록 한 건이 대상 · 항목 · 값 세 자리를 따로 가진다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

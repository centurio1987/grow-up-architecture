// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 3장 「Observations and Measurements」 §3.5·§3.8·§3.9 의
//       그림 3.7·3.9·3.11·3.12(apsupp/apchap3.pdf, 2026-09-29 직접 확인).
//
// 주장: **대상 연결과 항목 연결이 값의 종류를 모르는 층(Observation)에 붙고**, 값의 종류가
// 하위 종류를 가른다 — 크기가 오면 수치 관측, 범주가 오면 범주형 관측이다. 거부도 값의 종류가
// 아니라 같은 층에 붙는 하위 종류라, 두 종류가 한 벌로 거부된다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 1320;

// 잎 칸의 폭을 손으로 맞춘다. 부모 칸은 자식 칸 중심 위에 앉으므로(domain-model.tsx 의 중점 규칙)
// 좁은 잎 위에 넓은 부모가 오면 옆 열로 비어져 나온다. 같은 폭으로 두면 열 사이에 통로가 생기고
// 그 통로가 `1` `*` 라벨이 앉을 자리가 된다.
const LEAF_W = 196;

const SPEC: DomainModelSpec = {
  entities: [
    // 두 시각은 그림 3.11 이 Observation 에 붙인 것이다 — 하위 종류가 아니라 이 칸에 적는다.
    { id: 'obs', name: 'Observation', attributes: ['잰 시각', '적은 시각'] },
    { id: 'subject', name: 'Subject', attributes: ['이름'], width: LEAF_W },
    { id: 'ptype', name: 'PhenomenonType', attributes: ['이름'], width: LEAF_W },
    { id: 'meas', name: 'Measurement', width: LEAF_W },
    { id: 'cat', name: 'CategoryObservation', width: LEAF_W },
    { id: 'rej', name: 'RejectedObservation', width: LEAF_W },
    { id: 'quantity', name: 'Quantity', attributes: ['amount : Number', 'units : Unit'], width: LEAF_W },
    { id: 'phenomenon', name: 'Phenomenon', attributes: ['이름'], width: LEAF_W },
  ],
  relations: [
    // 그림 3.7 — 사실 하나는 대상 하나에 붙고, 대상 하나에 사실이 여럿이다. 이 선이 상위 타입에 붙어 있다.
    { from: 'obs', to: 'subject', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    // 그림 3.7 — 관측 하나는 항목 하나를 가리키고, 항목 하나에 관측이 여럿이다.
    { from: 'obs', to: 'ptype', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    // 그림 3.7 — 값 자리에 크기가 오는 종류.
    { from: 'meas', to: 'obs', kind: 'inheritance' },
    // 그림 3.7 — 값 자리에 범주가 오는 종류.
    { from: 'cat', to: 'obs', kind: 'inheritance' },
    // 그림 3.12 — 거부된 관측도 Observation 의 한 종류이고, 그 일반화에 «dynamic» 표기가 붙는다.
    { from: 'rej', to: 'obs', kind: 'inheritance' },
    // 그림 3.7 — 수치 관측 하나가 크기 하나를 품는다.
    { from: 'meas', to: 'quantity', kind: 'association', fromCard: '1', toCard: '1', above: 'from' },
    // 그림 3.7·3.9 — 범주 관측 하나가 범주 값 하나를 가리킨다.
    { from: 'cat', to: 'phenomenon', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    // 그림 3.9 — 범주 값은 항목 하나에 속하고, 항목 하나가 범주 값 여럿을 든다.
    // 배치는 위의 cat → phenomenon 이 이미 잡았으므로 이 관계는 선으로만 남는다(첫 선언이 이긴다).
    { from: 'ptype', to: 'phenomenon', kind: 'association', fromCard: '1', toCard: '*', above: 'from' },
  ],
};

export default function ObservationModel() {
  return (
    <Canvas width={W} height={560}>
      <DiagramHeader
        eyebrow="Observation model"
        title="대상과 항목은 값의 종류를 모르는 층에 붙고, 값의 종류가 하위 종류를 가른다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

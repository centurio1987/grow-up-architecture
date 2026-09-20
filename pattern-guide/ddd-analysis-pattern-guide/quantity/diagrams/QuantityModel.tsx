// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 3장 그림 3.2~3.4
//
// 주장: 수치는 혼자 다니지 않는다. **수치와 단위가 한 값**이고, 단위를 바꾸는 근거는 모델 안의
// 방향 있는 비율(Conversion Ratio)이다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

// 하위 칸의 `width` 는 **열 간격을 벌리려고** 손으로 고정한 것이다. 배치는 부모 칸을 자식 칸
// 중심 위에 놓는데(domain-model.tsx 의 min/max 중점 규칙), Money 나 CompoundUnit 처럼 좁은 칸
// 위에 넓은 부모가 앉으면 부모가 옆 열까지 비어져 나와 Quantity 와 Unit 이 겹쳤다(실측 —
// 이전 판 PNG 에서 두 칸이 맞붙어 연관선과 다중도가 보이지 않았다). 두 열을 같은 폭으로 두면
// 부모끼리 통로가 생기고, 그 통로가 `*` `1` 라벨이 앉을 자리가 된다.
const LEAF_W = 200;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'quantity', name: 'Quantity', attributes: ['amount : Number'], methods: ['plus(Quantity) : Quantity', 'minus(Quantity) : Quantity'] },
    { id: 'unit', name: 'Unit', attributes: ['symbol : String'] },
    // from·to 는 Figure 3.3 에서 Unit 으로 가는 두 연관의 끝이다. 선 둘과 짝을 맞춰 적는다.
    { id: 'ratio', name: 'ConversionRatio', attributes: ['from : Unit', 'to : Unit', 'number : Number'] },
    { id: 'compound', name: 'CompoundUnit', width: LEAF_W },
    { id: 'money', name: 'Money', width: LEAF_W },
  ],
  relations: [
    { from: 'quantity', to: 'unit', kind: 'association', fromCard: '*', toCard: '1' },
    // Figure 3.3 의 Unit 은 from 쪽으로도 to 쪽으로도 비율에 걸린다 — 연관이 하나가 아니라 둘이다.
    { from: 'ratio', to: 'unit', kind: 'association', fromCard: '*', toCard: '1' },
    { from: 'ratio', to: 'unit', kind: 'association', fromCard: '*', toCard: '1' },
    { from: 'compound', to: 'unit', kind: 'inheritance' },
    { from: 'money', to: 'quantity', kind: 'inheritance' },
  ],
};

export default function QuantityModel() {
  return (
    <Canvas width={W} height={440}>
      <DiagramHeader eyebrow="Quantity model" title="수치와 단위가 한 값이고, 환산 근거는 모델 안에 있다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

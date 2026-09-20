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

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'quantity', name: 'Quantity', attributes: ['amount : Number'], methods: ['plus(Quantity) : Quantity', 'minus(Quantity) : Quantity'] },
    { id: 'unit', name: 'Unit', attributes: ['symbol : String'] },
    { id: 'ratio', name: 'ConversionRatio', attributes: ['number : Number'] },
    { id: 'compound', name: 'CompoundUnit' },
    { id: 'money', name: 'Money' },
  ],
  relations: [
    { from: 'quantity', to: 'unit', kind: 'association', fromCard: '*', toCard: '1' },
    { from: 'ratio', to: 'unit', kind: 'association', fromCard: '*', toCard: '1' },
    { from: 'compound', to: 'unit', kind: 'inheritance' },
    { from: 'money', to: 'quantity', kind: 'inheritance' },
  ],
};

export default function QuantityModel() {
  return (
    <Canvas width={W} height={500}>
      <DiagramHeader eyebrow="Quantity model" title="수치와 단위가 한 값이고, 환산 근거는 모델 안에 있다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

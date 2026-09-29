// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 4장 그림 4.20(apchap4.pdf 의 Range 속성·연산과 Age Band 제약) ·
//       Range(eaaDev 초안)의 "any type that supports comparison operations" ·
//       JAOO 1999 슬라이드의 Magnitude 연산 목록
//
// 주장: 구간 규칙은 범위 자신이 진다. 구간을 쓰는 개념(요금표 · 요금 구간)은 끝점 둘을 자기 칸으로
// 풀어 들지 않고 Range 값 하나를 가리키고, 그 Range 는 끝점 타입에 크기 비교만 요구한다 —
// Quantity 는 그 끝점이 될 수 있는 값 가운데 하나다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 640;

// 같은 층에 놓이는 RateBand 와 Range 사이 통로는 56px 뿐이다(domain-model.tsx 의 COL_GAP).
// 그 자리에 다중도 라벨을 걸면 칸에 덮이므로(Knowledge Level 편 실측) 두 칸을 잇는 선에는
// 라벨을 달지 않고 다중도는 본문이 말로 쓴다.
const SPEC: DomainModelSpec = {
  entities: [
    { id: 'table', name: 'RateTable', attributes: ['span : Range'] },
    { id: 'band', name: 'RateBand', attributes: ['weights : Range', 'fee : Fee'] },
    {
      id: 'range',
      name: 'Range',
      attributes: ['lower : Magnitude', 'upper : Magnitude', 'isLowerInclusive : boolean', 'isUpperInclusive : boolean'],
      methods: ['includes()', 'overlaps()', 'abuts()'],
    },
    { id: 'magnitude', name: 'Magnitude', methods: ['= · < · <= · > · >='] },
    { id: 'quantity', name: 'Quantity', attributes: ['amount : Number', 'units : Unit'] },
  ],
  relations: [
    { from: 'table', to: 'band', kind: 'composition', fromCard: '1', toCard: '*' },
    // 표 자신도 Range 를 하나 든다 — 요금이 적용되는 무게 전체가 그 구간이다.
    { from: 'table', to: 'range', kind: 'association', fromCard: '1', toCard: '1', above: 'from' },
    // 같은 층 — 구간 하나가 Range 하나를 가리킨다(* — 1). 라벨은 위 주석의 이유로 달지 않는다.
    { from: 'band', to: 'range', kind: 'association' },
    // 끝점 둘. 선이 둘인 것은 upper 와 lower 가 따로 있다는 뜻이고, 칸 안의 두 줄이 그 끝이다.
    { from: 'range', to: 'magnitude', kind: 'association', toCard: '1', above: 'from' },
    { from: 'range', to: 'magnitude', kind: 'association', toCard: '1', above: 'from' },
    // Quantity 는 크기 비교가 되는 값의 한 종류다 — 끝점의 요건이 아니라 한 경우다.
    { from: 'quantity', to: 'magnitude', kind: 'inheritance' },
  ],
};

export default function RangeModel() {
  return (
    <Canvas width={W} height={560}>
      <DiagramHeader eyebrow="Range model" title="구간 규칙은 범위가 지고, 끝점에는 크기 비교만 요구한다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

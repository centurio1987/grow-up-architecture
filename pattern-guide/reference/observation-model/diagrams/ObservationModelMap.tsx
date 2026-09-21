// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 3장 그림 3.2·3.3·3.4·3.7·3.12, 4장 그림 4.20 (martinfowler.com/apsupp 의 UML 보충본)
//       · JAOO 1999 튜토리얼 슬라이드("Money is a kind of quantity")
//
// 주장: 값(Quantity) 위에 기록(Measurement)이, 기록 위에 사실(Observation)이 층으로 앉는다.
// Quantity 는 Unit 하나를 들고, Unit 사이의 환산 근거(Conversion Ratio)와 합성(Compound Unit)은
// Unit 쪽에 붙는다. Range 는 Quantity 둘을 끝점으로 든다. 틀린 사실은 지우지 않고 Rejected Observation 이 된다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 1000;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'observation', name: 'Observation' },
    // 원서 그림은 Range 의 끝점 타입을 Magnitude(비교만 되면 되는 값)로 적는다. 이 그림은 Quantity 를
    // 따라가는 길만 그리므로 끝점을 Quantity 로 좁혀 적었다 — 본문 「Range」 절이 그 사정을 말한다.
    {
      id: 'range',
      name: 'Range',
      attributes: ['upper : Quantity', 'lower : Quantity', 'isUpperInclusive : Boolean', 'isLowerInclusive : Boolean'],
      methods: ['includes(Quantity) : Boolean']
    },
    // quantity 속성은 아래 Quantity 로 가는 연관선의 끝이다(그림 3.7 의 `quantity : Quantity`).
    { id: 'measurement', name: 'Measurement', attributes: ['quantity : Quantity'] },
    // 그림 3.12 의 «dynamic» — 관측 객체가 나중에 이 종류로 바뀐다. 지워지는 것이 아니다.
    { id: 'rejected', name: 'Rejected Observation', stereotype: 'dynamic' },
    // 폭을 손으로 넓힌다 — 아래 변에 선 셋(Money · Unit · Range)이 붙는데, 글자 폭대로 두면 Money 의
    // 일반화 앵커가 Unit 의 중심 x 와 겹쳐 두 선이 한 점에서 꺾여 「Unit ◁— Quantity」로 읽혔다(실측).
    // 넓히면 앵커 사이가 벌어져 Money 선은 Unit 선의 왼쪽에서, Range 선은 오른쪽에서 따로 꺾인다.
    { id: 'quantity', name: 'Quantity', attributes: ['amount : Number'], width: 200 },
    { id: 'money', name: 'Money' },
    { id: 'unit', name: 'Unit' },
    { id: 'compound', name: 'Compound Unit' },
    // from·to 는 그림 3.3 에서 Unit 으로 가는 두 연관의 끝이다. 선 둘과 짝을 맞춰 적는다.
    { id: 'ratio', name: 'Conversion Ratio', attributes: ['from : Unit', 'to : Unit', 'number : Number'] },
  ],
  relations: [
    // 사실 → 기록: Measurement 는 Observation 의 한 종류(그림 3.7).
    { from: 'measurement', to: 'observation', kind: 'inheritance' },
    { from: 'rejected', to: 'observation', kind: 'inheritance' },
    // 기록 → 값: Measurement 가 Quantity 를 품는다. 층위를 말하는 그림이라 Measurement 를 위에 둔다.
    { from: 'measurement', to: 'quantity', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    { from: 'money', to: 'quantity', kind: 'inheritance' },
    // 값 → 단위: 여러 Quantity 가 Unit 하나를 가리킨다(그림 3.2 의 `units : Unit`).
    { from: 'quantity', to: 'unit', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    { from: 'compound', to: 'unit', kind: 'inheritance' },
    // 그림 3.3 — Unit 은 from 쪽으로도 to 쪽으로도 여러 비율에 걸린다. 연관이 둘이다.
    { from: 'ratio', to: 'unit', kind: 'association', fromCard: '*', toCard: '1', above: 'to' },
    { from: 'ratio', to: 'unit', kind: 'association', fromCard: '*', toCard: '1' },
    // 그림 4.20 — Range 의 upper·lower 는 연관이 아니라 속성이다(그림 3.3 의 from·to 와 다르다). 그래서
    // 선은 하나만 긋고 「둘」은 칸 안의 속성 두 줄이 말한다 — 선을 둘로 그으면 같은 높이에서 꺾이는 수평
    // 구간이 겹쳐 한 선처럼 읽혔다(실측). 포함도 상속도 아니라 배치가 계층으로 안 세므로 Range 를 Quantity
    // 아래 행에 두라고만 말한다(above) — 맨 위 행에 두면 선이 Measurement·Rejected Observation 칸을
    // 가로질렀다(실측). 화살표 방향은 그대로 Range → Quantity 다.
    { from: 'range', to: 'quantity', kind: 'association', fromCard: '*', above: 'to' },
  ],
};

export default function ObservationModelMap() {
  return (
    <Canvas width={W} height={930}>
      <DiagramHeader eyebrow="Observation model" title="값 위에 기록이, 기록 위에 사실이 층으로 앉는다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

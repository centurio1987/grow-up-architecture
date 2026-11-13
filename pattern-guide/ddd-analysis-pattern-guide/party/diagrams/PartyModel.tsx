// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 2장 「Accountability」 §2.1 Party 의 그림 2.1 · 2.2(apsupp/apchap2.pdf),
//       개정 초안 Organization Structures 의 「Party」(apsupp/accountability.pdf)
//
// 주장: 공통으로 붙는 것은 **상위 개념 Party 한 자리**에 서고, 사람과 조직은 그 아래 갈래가 된다.
// 행위 주체를 참조해야 하는 개념(발주서)도 갈래가 아니라 **Party 를 끝점으로** 잡는다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 1120;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'order', name: 'PurchaseOrder', attributes: ['발행일', '금액'] },
    { id: 'party', name: 'Party', attributes: ['식별자', '이름'] },
    { id: 'person', name: 'Person', attributes: ['생년'] },
    { id: 'org', name: 'Organization', attributes: ['사업자등록번호'] },
    { id: 'address', name: 'PostalAddress', attributes: ['주소 문자열'] },
    { id: 'phone', name: 'TelephoneNumber', attributes: ['번호'] },
    { id: 'email', name: 'EmailAddress', attributes: ['주소'] },
  ],
  relations: [
    // 발주서는 하위 갈래가 아니라 Party 를 끝점으로 잡는다. 연관이라 계층이 아니므로 위아래만 따로 말한다.
    { from: 'order', to: 'party', kind: 'association', fromCard: '*', toCard: '2', above: 'from' },
    { from: 'person', to: 'party', kind: 'inheritance' },
    { from: 'org', to: 'party', kind: 'inheritance' },
    { from: 'party', to: 'address', kind: 'association', fromCard: '1', toCard: '0..*', above: 'from' },
    { from: 'party', to: 'phone', kind: 'association', fromCard: '1', toCard: '0..*', above: 'from' },
    { from: 'party', to: 'email', kind: 'association', fromCard: '1', toCard: '0..*', above: 'from' },
  ],
};

export default function PartyModel() {
  return (
    <Canvas width={W} height={700}>
      <DiagramHeader eyebrow="Party model" title="공통으로 붙는 것은 Party 한 자리에 놓인다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
      <Callout
        x={GUTTER}
        y={600}
        width={W - GUTTER * 2}
        label="두 규칙"
        lines={[
          '사람과 조직 단위에 똑같이 붙는 것은 갈래마다가 아니라 Party 에 한 번 놓인다',
          '행위 주체를 가리켜야 하는 개념은 Person·Organization 이 아니라 Party 를 끝점으로 삼는다',
        ]}
      />
    </Canvas>
  );
}

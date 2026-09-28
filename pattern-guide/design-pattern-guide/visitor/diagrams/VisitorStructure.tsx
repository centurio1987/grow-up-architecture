// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Visitor — Structure · Participants
//
// 주장: 연산 이름은 Visitor 칸에 원소 타입 수만큼 적히고, 원소 칸에는 accept 하나만 적힌다.
// 같은 자리에 연산 이름이 ConcreteElement 칸으로 옮겨 적히면 그 그림은 Visitor 가 아니다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    {
      id: 'objectStructure',
      name: 'ObjectStructure',
      methods: ['accept(Visitor)'],
    },
    {
      id: 'visitor',
      name: 'Visitor',
      stereotype: 'interface',
      methods: ['visitConcreteElementA()', 'visitConcreteElementB()'],
    },
    {
      id: 'concreteVisitor',
      name: 'ConcreteVisitor',
      attributes: ['누적 상태'],
      methods: ['visitConcreteElementA()', 'visitConcreteElementB()'],
    },
    { id: 'element', name: 'Element', stereotype: 'interface', methods: ['accept(Visitor)'] },
    { id: 'concreteElementA', name: 'ConcreteElementA', methods: ['accept(Visitor)'] },
    { id: 'concreteElementB', name: 'ConcreteElementB', methods: ['accept(Visitor)'] },
  ],
  relations: [
    { from: 'client', to: 'objectStructure', kind: 'dependency' },
    { from: 'client', to: 'concreteVisitor', kind: 'dependency' },
    { from: 'concreteVisitor', to: 'visitor', kind: 'realization' },
    { from: 'concreteElementA', to: 'element', kind: 'realization' },
    { from: 'concreteElementB', to: 'element', kind: 'realization' },
    // 구조가 원소를 열거한다 — 0..* 라야 「구조 위를 돈다」는 말이 선다.
    { from: 'objectStructure', to: 'element', kind: 'association', toCard: '0..*', above: 'from' },
    // accept 가 방문자를 인자로 받고 그 안에서 방문 연산을 부른다.
    // 이 화살표가 원소 쪽에서 나가야 「갈래가 원소 쪽에 있다」는 주장이 선다.
    { from: 'element', to: 'visitor', kind: 'dependency' },
  ],
};

export default function VisitorStructure() {
  return (
    <Canvas width={W} height={600}>
      <DiagramHeader
        eyebrow="Visitor structure"
        title="연산 이름은 Visitor 칸에 원소 타입 수만큼, 원소 칸에는 accept 하나만"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

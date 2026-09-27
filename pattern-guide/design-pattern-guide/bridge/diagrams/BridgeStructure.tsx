// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Bridge — Structure · Participants
//
// 주장: 두 계층을 잇는 선은 Abstraction 에서 Implementor 인터페이스로 가는 하나뿐이고,
// 구현 쪽에서 추상 쪽으로 향하는 선은 없다. 그래서 한쪽 계층이 늘어도 반대쪽 코드에 이름이 나타나지 않는다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    {
      id: 'abstraction',
      name: 'Abstraction',
      attributes: ['imp : Implementor'],
      methods: ['operation()'],
    },
    { id: 'refined', name: 'RefinedAbstraction', methods: ['operation()', 'addedOperation()'] },
    {
      id: 'implementor',
      name: 'Implementor',
      stereotype: 'interface',
      methods: ['primitiveA()', 'primitiveB()'],
    },
    { id: 'concrete', name: 'ConcreteImplementor', methods: ['primitiveA()', 'primitiveB()'] },
  ],
  relations: [
    { from: 'client', to: 'abstraction', kind: 'dependency' },
    { from: 'refined', to: 'abstraction', kind: 'inheritance' },
    { from: 'abstraction', to: 'implementor', kind: 'aggregation', toCard: '1' },
    { from: 'concrete', to: 'implementor', kind: 'realization' },
  ],
};

export default function BridgeStructure() {
  return (
    <Canvas width={W} height={580}>
      <DiagramHeader
        eyebrow="Bridge structure"
        title="두 계층을 잇는 선은 Abstraction → Implementor 하나뿐"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

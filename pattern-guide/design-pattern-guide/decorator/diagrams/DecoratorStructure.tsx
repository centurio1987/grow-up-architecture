// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Decorator — Structure · Participants
//
// 주장: Decorator 가 Component 를 구현하면서 동시에 Component 를 필드로 든다. 이 한 칸이
// 두 관계를 함께 갖기 때문에 데코레이터가 데코레이터를 감쌀 수 있다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'component', name: 'Component', stereotype: 'interface', methods: ['operation(arg)'] },
    { id: 'concrete', name: 'ConcreteComponent', methods: ['operation(arg)'] },
    { id: 'decorator', name: 'Decorator', stereotype: 'abstract', attributes: ['component : Component'], methods: ['operation(arg)'] },
    { id: 'concreteDecorator', name: 'ConcreteDecorator', attributes: ['addedState'], methods: ['operation(arg)', 'addedBehavior()'] },
  ],
  relations: [
    { from: 'client', to: 'component', kind: 'dependency' },
    { from: 'concrete', to: 'component', kind: 'realization' },
    { from: 'decorator', to: 'component', kind: 'realization' },
    { from: 'decorator', to: 'component', kind: 'aggregation', toCard: '1' },
    { from: 'concreteDecorator', to: 'decorator', kind: 'inheritance' },
  ],
};

export default function DecoratorStructure() {
  return (
    <Canvas width={W} height={560}>
      <DiagramHeader eyebrow="Decorator structure" title="Decorator 는 Component 를 구현하면서 Component 를 가진다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Composite — Structure · Participants
//
// 주장: Composite 가 Component 를 구현하면서 동시에 Component 를 **0개 이상** 든다.
// 자식 쪽 카디널리티가 하나가 아니라 0..* 라는 것이 이 패턴의 모양이고, 같은 자리에
// 1 이 적히면 그 그림은 Decorator 가 된다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'component', name: 'Component', stereotype: 'interface', methods: ['operation()'] },
    { id: 'leaf', name: 'Leaf', methods: ['operation()'] },
    {
      id: 'composite',
      name: 'Composite',
      attributes: ['children : Component'],
      methods: ['operation()', 'add(Component)', 'remove(Component)'],
    },
  ],
  relations: [
    { from: 'client', to: 'component', kind: 'dependency' },
    { from: 'leaf', to: 'component', kind: 'realization' },
    { from: 'composite', to: 'component', kind: 'realization' },
    { from: 'composite', to: 'component', kind: 'aggregation', toCard: '0..*' },
  ],
};

export default function CompositeStructure() {
  return (
    <Canvas width={W} height={430}>
      <DiagramHeader
        eyebrow="Composite structure"
        title="Composite 는 Component 를 구현하면서 Component 를 0..* 개 든다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

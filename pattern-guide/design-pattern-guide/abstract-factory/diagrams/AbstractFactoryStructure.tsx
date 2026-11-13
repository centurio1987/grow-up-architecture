// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Abstract Factory — Structure · Participants · Collaborations
//
// 주장: Client 로 들어가는 화살표는 **추상 두 개**(AbstractFactory · AbstractProduct)뿐이고,
// 구체 클래스를 만드는 화살표는 ConcreteFactory 에서만 나간다 — 그래서 한 팩토리가 만든 제품은 같은 계열이다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 600;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client', attributes: ['factory : AbstractFactory'], methods: ['report()'] },
    { id: 'factory', name: 'AbstractFactory', stereotype: 'interface', methods: ['createProductA()', 'createProductB()'] },
    { id: 'concreteFactory', name: 'ConcreteFactory', methods: ['createProductA()', 'createProductB()'] },
    { id: 'product', name: 'AbstractProduct', stereotype: 'interface', methods: ['use()'] },
    { id: 'concreteProduct', name: 'ConcreteProduct', methods: ['use()'] },
  ],
  relations: [
    { from: 'client', to: 'factory', kind: 'aggregation', toCard: '1' },
    { from: 'client', to: 'product', kind: 'dependency' },
    { from: 'concreteFactory', to: 'factory', kind: 'realization' },
    { from: 'concreteProduct', to: 'product', kind: 'realization' },
    { from: 'concreteFactory', to: 'concreteProduct', kind: 'dependency' },
  ],
};

export default function AbstractFactoryStructure() {
  return (
    <Canvas width={W} height={590}>
      <DiagramHeader eyebrow="Abstract Factory structure" title="Client 가 참조하는 것은 추상 둘, 구체를 만드는 것은 팩토리 하나" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

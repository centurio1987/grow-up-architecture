// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Factory Method — Structure · Participants
//
// 주장: 계층이 둘이고 짝을 이룬다. Creator 쪽 상위 로직은 Product 쪽 추상 타입만 알고,
// 구체 클래스를 고르는 일은 두 계층의 아래 칸(ConcreteCreator → ConcreteProduct)에서만 일어난다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'creator', name: 'Creator', stereotype: 'abstract', methods: ['run(staff)', 'createSlip() : Product'] },
    { id: 'concreteCreator', name: 'ConcreteCreator', methods: ['createSlip() : Product'] },
    { id: 'product', name: 'Product', stereotype: 'interface', methods: ['net()'] },
    { id: 'concreteProduct', name: 'ConcreteProduct', methods: ['net()'] },
  ],
  relations: [
    { from: 'client', to: 'creator', kind: 'dependency' },
    { from: 'concreteCreator', to: 'creator', kind: 'inheritance' },
    { from: 'concreteProduct', to: 'product', kind: 'realization' },
    // 상위 로직이 제품을 Product 타입으로만 다룬다 — 이 선이 Creator 칸에서 나가야 주장이 선다.
    { from: 'creator', to: 'product', kind: 'dependency' },
    // 구체 클래스를 고르는 유일한 자리. `above` 는 배치 힌트이고 관계 종류는 그대로 의존이다.
    { from: 'concreteCreator', to: 'concreteProduct', kind: 'dependency', above: 'from' },
  ],
};

export default function FactoryMethodStructure() {
  return (
    <Canvas width={W} height={420}>
      <DiagramHeader eyebrow="Factory Method structure" title="짝을 이룬 두 계층, 구체 클래스는 아래 칸에서만 만난다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

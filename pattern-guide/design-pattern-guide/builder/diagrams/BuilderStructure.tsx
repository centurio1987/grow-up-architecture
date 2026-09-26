// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Builder — Structure · Participants · Collaborations
//
// 주장: Director 에서 나가는 선은 **추상 Builder 하나**뿐이라 제품 타입이 Director 에 닿지 않는다.
// Product 로 가는 선은 ConcreteBuilder 에서만 나가고, 그것을 받아 가는 쪽은 빌더를 고른 Client 다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 640;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'director', name: 'Director', attributes: ['builder : Builder'], methods: ['construct(input)'] },
    { id: 'builder', name: 'Builder', stereotype: 'interface', methods: ['buildPart(part)'] },
    { id: 'concreteBuilder', name: 'ConcreteBuilder', methods: ['buildPart(part)', 'getResult() : Product'] },
    { id: 'product', name: 'Product', methods: ['use()'] },
  ],
  relations: [
    { from: 'client', to: 'director', kind: 'dependency' },
    // `above` 는 배치 힌트다(관계 종류는 그대로 의존). Client 가 구체 빌더를 만들고 거기서 제품을
    // 꺼내는 선이라, 안 주면 ConcreteBuilder 가 Builder 밑으로만 배치돼 이 선이 Builder 칸 밑을 지난다.
    { from: 'client', to: 'concreteBuilder', kind: 'dependency', above: 'from' },
    { from: 'director', to: 'builder', kind: 'aggregation', toCard: '1' },
    { from: 'concreteBuilder', to: 'builder', kind: 'realization' },
    { from: 'concreteBuilder', to: 'product', kind: 'dependency', above: 'from' },
  ],
};

export default function BuilderStructure() {
  return (
    <Canvas width={W} height={570}>
      <DiagramHeader eyebrow="Builder structure" title="Director 는 추상 Builder 하나만 알고, 제품은 Client 가 꺼낸다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

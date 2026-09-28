// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Iterator — Structure · Participants
//
// 주장: 순회 위치를 나타내는 필드가 ConcreteAggregate 가 아니라 ConcreteIterator 에 있고,
// ConcreteAggregate 는 그 순회자를 만들어 내주는 연산만 갖는다. 같은 자리에 position 이
// ConcreteAggregate 쪽으로 옮겨 적히면 그 그림은 이 패턴이 아니다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'aggregate', name: 'Aggregate', stereotype: 'interface', methods: ['createIterator()'] },
    { id: 'iterator', name: 'Iterator', stereotype: 'interface', methods: ['hasNext()', 'next()'] },
    { id: 'concreteAggregate', name: 'ConcreteAggregate', attributes: ['elements'], methods: ['createIterator()'] },
    { id: 'concreteIterator', name: 'ConcreteIterator', attributes: ['position'], methods: ['hasNext()', 'next()'] },
  ],
  relations: [
    { from: 'client', to: 'aggregate', kind: 'dependency' },
    { from: 'concreteAggregate', to: 'aggregate', kind: 'realization' },
    { from: 'concreteIterator', to: 'iterator', kind: 'realization' },
    // 생성 연산의 반환 타입이 추상 Iterator 다 — 이 선이 Aggregate 칸에서 나가야 주장이 선다.
    { from: 'aggregate', to: 'iterator', kind: 'dependency' },
    // 순회자가 자기 집합을 들고 원소를 읽는다. `above` 는 배치 힌트이고 관계 종류는 그대로 연관이다.
    { from: 'concreteIterator', to: 'concreteAggregate', kind: 'association', toCard: '1', above: 'to' },
  ],
};

export default function IteratorStructure() {
  return (
    <Canvas width={W} height={425}>
      <DiagramHeader
        eyebrow="Iterator structure"
        title="position 은 ConcreteIterator 에, 순회자를 내주는 연산은 ConcreteAggregate 에"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

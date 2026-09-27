// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Prototype — Structure · Participants · Implementation(프로토타입 관리자)
//
// 주장: 계층이 하나뿐이다. Client 와 PrototypeManager 로 드나드는 선은 전부 Prototype 추상 타입이고,
// ConcretePrototype 을 이름으로 아는 선은 견본을 등록하는 Client 쪽 의존 하나뿐이다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 760;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client', attributes: ['manager : PrototypeManager'], methods: ['today(key)'] },
    {
      id: 'manager',
      name: 'PrototypeManager',
      // 보관 타입이 Prototype 이라는 것이 이 그림의 주장이라 속성으로 드러낸다.
      attributes: ['prototypes : Map<key, Prototype>'],
      methods: ['register(key, p)', 'unregister(key)', 'create(key) : Prototype'],
    },
    { id: 'prototype', name: 'Prototype', stereotype: 'interface', methods: ['copy() : Prototype', 'initialize(...)'] },
    { id: 'concrete', name: 'ConcretePrototype', methods: ['copy() : Prototype', 'initialize(...)'] },
  ],
  relations: [
    { from: 'client', to: 'manager', kind: 'aggregation', toCard: '1' },
    { from: 'concrete', to: 'prototype', kind: 'realization' },
    // 복제본을 받아 쓰는 선. Client 가 아는 타입은 여기까지다.
    { from: 'client', to: 'prototype', kind: 'dependency' },
    // 구체 클래스 이름이 등장하는 유일한 선. 견본을 처음 만들어 등록하는 자리다.
    { from: 'client', to: 'concrete', kind: 'dependency' },
  ],
};

export default function PrototypeStructure() {
  return (
    <Canvas width={W} height={380}>
      <DiagramHeader
        eyebrow="Prototype structure"
        title="계층은 하나, 구체 이름은 견본을 등록하는 자리에만 있다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Flyweight — Structure · Participants · Collaborations
//
// 주장: 자리마다 달라지는 값(extrinsicState)을 들고 있는 칸은 Client 하나뿐이고,
// ConcreteFlyweight 가 들고 있는 것은 intrinsicState 뿐이다. Client 에서 구체 칸으로
// 곧장 가는 화살표는 없다 — 공유 대상을 얻는 길이 FlyweightFactory 하나로 모인다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 640;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client', attributes: ['extrinsicState'], methods: ['use()'] },
    { id: 'factory', name: 'FlyweightFactory', attributes: ['flyweights'], methods: ['flyweight(key) : Flyweight'] },
    { id: 'flyweight', name: 'Flyweight', stereotype: 'interface', methods: ['operation(extrinsicState)'] },
    { id: 'concrete', name: 'ConcreteFlyweight', attributes: ['intrinsicState'], methods: ['operation(extrinsicState)'] },
    { id: 'unshared', name: 'UnsharedConcreteFlyweight', attributes: ['allState'], methods: ['operation(extrinsicState)'] },
  ],
  relations: [
    { from: 'client', to: 'factory', kind: 'dependency' },
    { from: 'factory', to: 'concrete', kind: 'aggregation', toCard: '0..*' },
    { from: 'client', to: 'flyweight', kind: 'aggregation', toCard: '0..*' },
    { from: 'concrete', to: 'flyweight', kind: 'realization' },
    { from: 'unshared', to: 'flyweight', kind: 'realization' },
  ],
};

export default function FlyweightStructure() {
  return (
    <Canvas width={W} height={400}>
      <DiagramHeader eyebrow="Flyweight structure" title="자리마다 다른 값은 Client 칸에만, 공유 칸에는 내재 상태만" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

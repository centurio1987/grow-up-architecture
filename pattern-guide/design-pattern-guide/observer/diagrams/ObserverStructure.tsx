// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Observer — Structure · Participants
//
// 주장: 주체 쪽에서 나가는 화살표는 **Observer 한 종류**뿐이고 그 끝은 목록이다. 구체 옵저버로
// 들어가는 화살표는 Client 에서 내려온 것 하나라, 옵저버가 늘고 줄어도 주체 쪽은 그대로다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 800;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'subject', name: 'Subject', methods: ['attach(observer)', 'detach(id)', 'notify()'] },
    { id: 'concreteSubject', name: 'ConcreteSubject', attributes: ['state'], methods: ['getState()'] },
    { id: 'observer', name: 'Observer', stereotype: 'interface', methods: ['update(subject)'] },
    { id: 'concreteObserver', name: 'ConcreteObserver', attributes: ['observerState'], methods: ['update(subject)'] },
  ],
  relations: [
    { from: 'client', to: 'concreteSubject', kind: 'dependency' },
    // `above` 는 배치 힌트다(관계 종류는 그대로 의존). 안 주면 ConcreteObserver 가 Observer 밑으로만
    // 배치돼 이 엣지가 Observer 칸을 스치고, 「Client ⇢ Observer」 로 잘못 읽힌다.
    { from: 'client', to: 'concreteObserver', kind: 'dependency', above: 'from' },
    { from: 'concreteSubject', to: 'subject', kind: 'aggregation', toCard: '1' },
    { from: 'subject', to: 'observer', kind: 'aggregation', toCard: '0..N' },
    { from: 'concreteObserver', to: 'observer', kind: 'realization' },
  ],
};

export default function ObserverStructure() {
  return (
    <Canvas width={W} height={516}>
      <DiagramHeader eyebrow="Observer structure" title="주체가 아는 것은 Observer 한 종류의 목록뿐" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

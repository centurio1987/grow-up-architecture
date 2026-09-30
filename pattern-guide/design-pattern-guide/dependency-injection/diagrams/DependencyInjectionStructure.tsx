// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: Martin Fowler 「Inversion of Control Containers and the Dependency Injection pattern」
// (martinfowler.com/articles/injection.html) — Forms of Dependency Injection · Service Locator vs Dependency Injection
//
// 칸 이름의 출처는 갈린다 — 다섯 가운데 원전의 이름은 Assembler 하나뿐이고,
// Dependent · Collaborator · ConcreteCollaborator · Client 넷은 이 가이드가 붙인 역할 이름이다.
// 원전은 주입받는 쪽을 자기 예제의 클래스 이름으로 부르고, 주입되는 쪽을 component 와 service 로 부른다.
//
// 주장: 구현을 골라 넣는 일은 Assembler 가 맡고, Dependent 는 Collaborator 타입만 안다.
// Dependent 에서 Assembler 로 가는 선이 없다는 것이 이 그림의 요점이다 — 그 선이 생기면
// Service Locator 가 된다. Client 는 조립을 청구하고 조립된 Dependent 에 일을 시킨다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    {
      id: 'client',
      name: 'Client',
      methods: ['조립된 의존 객체에 일을 시킨다'],
    },
    {
      id: 'assembler',
      name: 'Assembler',
      methods: ['구현을 골라 만든다', '의존 객체에 넣는다'],
    },
    {
      id: 'dependent',
      name: 'Dependent',
      attributes: ['collaborator : Collaborator'],
      methods: ['주입 지점으로 받는다', '협력 타입의 연산만 부른다'],
    },
    {
      id: 'collaborator',
      name: 'Collaborator',
      stereotype: 'interface',
      methods: ['의존 객체가 쓸 연산을 선언한다'],
    },
    {
      id: 'concrete',
      name: 'ConcreteCollaborator',
      methods: ['그 연산을 실제로 수행한다'],
    },
  ],
  relations: [
    { from: 'client', to: 'assembler', kind: 'dependency', above: 'from' },
    { from: 'client', to: 'dependent', kind: 'dependency', above: 'from' },
    { from: 'assembler', to: 'concrete', kind: 'dependency', above: 'from' },
    { from: 'assembler', to: 'dependent', kind: 'dependency' },
    { from: 'dependent', to: 'collaborator', kind: 'aggregation', toCard: '1..*' },
    { from: 'concrete', to: 'collaborator', kind: 'realization' },
  ],
};

export default function DependencyInjectionStructure() {
  return (
    <Canvas width={W} height={580}>
      <DiagramHeader
        eyebrow="Dependency Injection structure"
        title="넣는 일은 조립자가, 쓰는 일은 의존 객체가 — 되돌아오는 선이 없다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

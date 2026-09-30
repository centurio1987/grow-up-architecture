// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: Evans·Fowler 「Specifications」(martinfowler.com/apsupp/spec.pdf) — Specification · Composite Specification
//
// 주장: 판정 연산은 Candidate 바깥의 Specification 계층에 서고, Candidate 쪽으로는
// 의존만 나간다(후보는 명세를 모른다). CompositeSpecification 은 Specification 을
// 구현하면서 동시에 Specification 을 1..* 개 들어, 조합 결과가 다시 같은 자리에 들어간다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    {
      id: 'owner',
      name: 'SpecificationOwner',
      attributes: ['spec : Specification'],
      methods: ['판정을 명세에 넘긴다'],
    },
    {
      id: 'spec',
      name: 'Specification',
      stereotype: 'interface',
      methods: ['isSatisfiedBy(Candidate) : Boolean'],
    },
    {
      id: 'leaf',
      name: 'LeafSpecification',
      methods: ['isSatisfiedBy(Candidate) : 직접 판정'],
    },
    {
      id: 'composite',
      name: 'CompositeSpecification',
      attributes: ['components : Specification'],
      methods: ['isSatisfiedBy(Candidate) : 하위를 합성'],
    },
    {
      id: 'candidate',
      name: 'Candidate',
      methods: ['판정에 쓰이는 속성을 내준다'],
    },
  ],
  relations: [
    { from: 'client', to: 'owner', kind: 'dependency' },
    { from: 'owner', to: 'spec', kind: 'aggregation', toCard: '1' },
    { from: 'leaf', to: 'spec', kind: 'realization' },
    { from: 'composite', to: 'spec', kind: 'realization' },
    { from: 'composite', to: 'spec', kind: 'aggregation', toCard: '1..*' },
    { from: 'spec', to: 'candidate', kind: 'dependency' },
  ],
};

export default function SpecificationStructure() {
  return (
    <Canvas width={W} height={520}>
      <DiagramHeader
        eyebrow="Specification structure"
        title="판정은 후보 바깥에 서고, 조합 명세는 같은 타입을 다시 든다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

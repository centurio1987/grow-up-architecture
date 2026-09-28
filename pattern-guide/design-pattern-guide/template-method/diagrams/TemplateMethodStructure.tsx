// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Template Method — Structure · Participants
//
// 주장: 계층이 하나다. 골격 연산과 단계 연산이 같은 상위 타입 안에 함께 선언되고,
// 하위 타입은 단계만 채운다. Client 가 잡는 타입도 상위 타입 하나뿐이다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 700;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    {
      id: 'abstractClass',
      name: 'AbstractClass',
      stereotype: 'abstract',
      methods: [
        'ingest() : 골격 (순서 고정)',
        'isHeader() : primitive',
        'parseLine() : primitive',
        'droppedNote() : hook',
      ],
    },
    {
      id: 'concreteClass',
      name: 'ConcreteClass',
      methods: ['isHeader()', 'parseLine()', 'droppedNote()'],
    },
  ],
  relations: [
    { from: 'client', to: 'abstractClass', kind: 'dependency' },
    { from: 'concreteClass', to: 'abstractClass', kind: 'inheritance' },
  ],
};

export default function TemplateMethodStructure() {
  return (
    <Canvas width={W} height={372}>
      <DiagramHeader
        eyebrow="Template Method structure"
        title="계층 하나, 골격과 단계가 같은 타입에 선언된다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

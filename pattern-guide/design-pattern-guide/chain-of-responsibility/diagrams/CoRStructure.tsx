// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Chain of Responsibility — Structure · Participants
//
// 주장: ConcreteHandler 는 Handler 를 구현하면서 동시에 Handler 하나를 다음으로 든다.
// 그 「다음」이 0..1 이라서 사슬은 아무 데서나 끝날 수 있고, 끝나면 요청은 처리되지 않는다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 768;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'handler', name: 'Handler', stereotype: 'interface', methods: ['handleRequest(request)'] },
    { id: 'concrete', name: 'ConcreteHandler', attributes: ['successor : Handler'], methods: ['handleRequest(request)'] },
  ],
  relations: [
    { from: 'client', to: 'handler', kind: 'dependency' },
    { from: 'concrete', to: 'handler', kind: 'realization' },
    { from: 'concrete', to: 'handler', kind: 'aggregation', toCard: '0..1' },
  ],
};

export default function CoRStructure() {
  return (
    <Canvas width={W} height={424}>
      <DiagramHeader eyebrow="Chain of Responsibility structure" title="ConcreteHandler 는 Handler 를 구현하면서 Handler 를 다음으로 든다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

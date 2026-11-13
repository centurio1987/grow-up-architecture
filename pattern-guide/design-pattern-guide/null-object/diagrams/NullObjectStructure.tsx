// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: Bobby Woolf 「The Null Object Pattern」(PLoPD3) — Structure · Participants
//
// 주장: Client 는 협력자를 AbstractObject 자리 하나로만 들고, 그 자리는 비지 않는다.
// RealObject 와 NullObject 가 같은 타입을 구현해 서로 갈아 끼워지고, 협력자가 없는
// 상태는 참조를 비우는 대신 NullObject 인스턴스가 진다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 620;

const SPEC: DomainModelSpec = {
  entities: [
    {
      id: 'client',
      name: 'Client',
      attributes: ['collaborator : AbstractObject'],
      methods: ['request 를 협력자에게 넘긴다'],
    },
    {
      id: 'abstract',
      name: 'AbstractObject',
      stereotype: 'interface',
      methods: ['request()'],
    },
    {
      id: 'real',
      name: 'RealObject',
      methods: ['request() : 실제 동작'],
    },
    {
      id: 'null',
      name: 'NullObject',
      methods: ['request() : 중립 동작'],
    },
  ],
  relations: [
    { from: 'client', to: 'abstract', kind: 'aggregation', toCard: '1' },
    { from: 'real', to: 'abstract', kind: 'realization' },
    { from: 'null', to: 'abstract', kind: 'realization' },
  ],
};

export default function NullObjectStructure() {
  return (
    <Canvas width={W} height={420}>
      <DiagramHeader
        eyebrow="Null Object structure"
        title="협력자 자리는 비지 않는다 — 부재를 NullObject 가 맡는다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Adapter — Structure · Participants
//
// 주장: Client 에서 나가는 화살표는 Target 으로만 향하고, Adaptee 로 들어가는 화살표는 Adapter 하나뿐이다.
// 그래서 Adaptee 의 어휘를 아는 코드가 Adapter 한 칸으로 모인다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'target', name: 'Target', stereotype: 'interface', methods: ['request(arg)'] },
    { id: 'adapter', name: 'Adapter', attributes: ['adaptee : Adaptee'], methods: ['request(arg)'] },
    { id: 'adaptee', name: 'Adaptee', methods: ['specificRequest(other)'] },
  ],
  relations: [
    { from: 'client', to: 'target', kind: 'dependency' },
    { from: 'adapter', to: 'target', kind: 'realization' },
    { from: 'adapter', to: 'adaptee', kind: 'aggregation', toCard: '1' },
  ],
};

export default function AdapterStructure() {
  return (
    <Canvas width={W} height={560}>
      <DiagramHeader eyebrow="Adapter structure" title="Adaptee 의 어휘를 아는 코드는 Adapter 한 칸뿐" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Facade — Structure · Participants
//
// 주장: 화살표가 Client → Facade → 서브시스템 한 방향으로만 흐른다. 서브시스템 칸에서
// Facade 로 나가는 화살표가 하나도 없어서, 서브시스템은 Facade 없이도 그대로 쓸 수 있다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;
const PAD = 10;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    {
      id: 'facade',
      name: 'Facade',
      attributes: ['서브시스템 클래스 참조 여럿'],
      methods: ['operation(요청)'],
    },
    { id: 's1', name: 'SubsystemClass 1', methods: ['action1()'] },
    { id: 's2', name: 'SubsystemClass 2', methods: ['action2()'] },
    { id: 's3', name: 'SubsystemClass 3', methods: ['action3()'] },
  ],
  relations: [
    { from: 'client', to: 'facade', kind: 'dependency' },
    { from: 'facade', to: 's1', kind: 'aggregation', toCard: '1' },
    { from: 'facade', to: 's2', kind: 'aggregation', toCard: '1' },
    { from: 'facade', to: 's3', kind: 'aggregation', toCard: '1' },
  ],
  groups: [{ id: 'sub', label: '서브시스템', members: ['s1', 's2', 's3'] }],
};

export default function FacadeStructure() {
  return (
    <Canvas width={W} height={400}>
      <DiagramHeader eyebrow="Facade structure" title="화살표는 밖에서 안으로만 간다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER + PAD, y: 104 + PAD }} groupPad={PAD} />
    </Canvas>
  );
}

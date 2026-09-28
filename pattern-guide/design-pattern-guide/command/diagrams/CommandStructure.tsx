// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Command — Structure · Participants
//
// 주장: Invoker 에서 나가는 화살표는 **Command 한 종류**뿐이다. Receiver 로 들어가는 화살표는
// ConcreteCommand 에서 나온 것 하나라, 받을 대상은 커맨드 객체 안에 묶여 있고 Invoker 는 모른다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 860;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'invoker', name: 'Invoker', methods: ['bind(button, command)', 'press(button)', 'undoLast()'] },
    { id: 'command', name: 'Command', stereotype: 'interface', methods: ['execute()', 'undo()'] },
    {
      id: 'concreteCommand',
      name: 'ConcreteCommand',
      attributes: ['receiver', 'arguments'],
      methods: ['execute()', 'undo()'],
    },
    { id: 'receiver', name: 'Receiver', methods: ['action()'] },
  ],
  relations: [
    // `above` 는 배치 힌트다(관계 종류는 그대로 의존). 안 주면 Client 가 ConcreteCommand 와 같은
    // 행으로 내려가고, 두 의존 엣지가 Command 칸 밑을 지나 다른 관계로 읽힌다(렌더러 종료 코드 6).
    { from: 'client', to: 'concreteCommand', kind: 'dependency', above: 'from' },
    { from: 'client', to: 'invoker', kind: 'dependency' },
    { from: 'invoker', to: 'command', kind: 'aggregation', toCard: '0..N' },
    { from: 'concreteCommand', to: 'command', kind: 'realization' },
    { from: 'concreteCommand', to: 'receiver', kind: 'association', toCard: '1' },
  ],
};

export default function CommandStructure() {
  return (
    <Canvas width={W} height={440}>
      <DiagramHeader eyebrow="Command structure" title="Invoker 가 아는 것은 Command 한 종류뿐" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

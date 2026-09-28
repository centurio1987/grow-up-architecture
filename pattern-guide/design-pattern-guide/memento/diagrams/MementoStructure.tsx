// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Memento — Structure · Participants
//
// 주장: Memento 칸으로 들어가는 화살표는 둘인데 뜻이 다르다. Originator 에서 온 것만 내용을
// 열고, Caretaker 에서 온 것은 보관만 한다. Caretaker 에서 Originator 의 상태로 가는 선은 없다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 860;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'caretaker', name: 'Caretaker', attributes: ['mementos'], methods: ['checkpoint()', 'undo()'] },
    { id: 'memento', name: 'Memento', attributes: ['state'] },
    {
      id: 'originator',
      name: 'Originator',
      attributes: ['state'],
      methods: ['createMemento()', 'setMemento(m)'],
    },
  ],
  relations: [
    // `above` 는 배치 힌트다(관계 종류는 그대로 의존). 안 주면 Client 가 Originator 와 같은 행으로
    // 내려가고, 두 의존 엣지가 Caretaker 칸 밑을 지나 다른 관계로 읽힌다.
    { from: 'client', to: 'originator', kind: 'dependency', above: 'from' },
    { from: 'client', to: 'caretaker', kind: 'dependency' },
    { from: 'caretaker', to: 'memento', kind: 'aggregation', toCard: '0..N' },
    { from: 'originator', to: 'memento', kind: 'dependency' },
  ],
};

export default function MementoStructure() {
  return (
    <Canvas width={W} height={440}>
      <DiagramHeader eyebrow="Memento structure" title="메멘토를 여는 쪽은 Originator 하나뿐" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 State — Structure · Participants · Collaborations
//
// 주장: Context 는 **현재 상태 하나**만 State 타입으로 들고 요청을 그리로 넘긴다.
// ConcreteState 는 State 를 구현하면서 Context 를 되짚어 읽고 고치므로, 화살표가 Context 로 되돌아온다 —
// 이 되돌아오는 화살표가 Strategy 구조에는 없는 자리다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'context', name: 'Context', attributes: ['state : State'], methods: ['request()'] },
    { id: 'state', name: 'State', stereotype: 'interface', methods: ['handle(context) : State'] },
    { id: 'concrete', name: 'ConcreteState', methods: ['handle(context) : State'] },
  ],
  relations: [
    { from: 'client', to: 'context', kind: 'dependency' },
    // `above` 는 배치 힌트다(관계 종류는 그대로 의존). Strategy 구조 도식과 같은 이유로 둔다 —
    // 안 주면 ConcreteState 가 State 밑으로만 배치돼 이 엣지가 State 칸 밑을 지난다.
    { from: 'client', to: 'concrete', kind: 'dependency', above: 'from' },
    { from: 'context', to: 'state', kind: 'aggregation', toCard: '1' },
    { from: 'concrete', to: 'state', kind: 'realization' },
    // 이 되짚는 의존이 Strategy 구조 도식에는 없는 자리다 — 상태가 Context 를 읽고 고친다.
    { from: 'concrete', to: 'context', kind: 'dependency' },
  ],
};

export default function StateStructure() {
  return (
    <Canvas width={W} height={400}>
      <DiagramHeader eyebrow="State structure" title="Context 는 현재 상태 하나만 가지고 요청을 그리로 넘긴다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

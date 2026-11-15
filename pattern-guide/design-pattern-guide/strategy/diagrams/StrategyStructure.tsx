// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Strategy — Structure · Participants · Collaborations
//
// 주장: Context 는 **연산 모양 하나**만 알고, 계산 방법은 그 모양을 구현한 별도 단위에 산다.
// 전략을 고르고 만드는 일은 Context 밖(Client)이라, 방법이 늘어도 Context 는 그대로다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'context', name: 'Context', attributes: ['strategy : Strategy'], methods: ['request()'] },
    { id: 'strategy', name: 'Strategy', stereotype: 'interface', methods: ['algorithm(data)'] },
    { id: 'concrete', name: 'ConcreteStrategy', methods: ['algorithm(data)'] },
  ],
  relations: [
    { from: 'client', to: 'context', kind: 'dependency' },
    // `above` 는 배치 힌트다(관계 종류는 그대로 의존). 안 주면 ConcreteStrategy 가 Strategy 밑으로만
    // 배치돼 이 엣지가 Strategy 칸 밑을 지나고(경로의 21% — render-viz 겹침 가드가 잡는다),
    // `Client ⇢ Strategy` + `Strategy ⇢ ConcreteStrategy` 두 선으로 읽혀 본문 주장의 정반대가 된다.
    { from: 'client', to: 'concrete', kind: 'dependency', above: 'from' },
    { from: 'context', to: 'strategy', kind: 'aggregation', toCard: '1' },
    { from: 'concrete', to: 'strategy', kind: 'realization' },
  ],
};

export default function StrategyStructure() {
  return (
    <Canvas width={W} height={400}>
      <DiagramHeader eyebrow="Strategy structure" title="Context 는 연산 모양만 알고 방법은 밖에 있다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

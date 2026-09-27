// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Proxy — Structure · Participants
//
// 주장: Proxy 와 RealSubject 가 같은 Subject 를 구현하고 Client 는 Subject 로만 나간다.
// 그래서 둘은 Client 코드를 고치지 않고 서로 자리를 바꿀 수 있다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    { id: 'subject', name: 'Subject', stereotype: 'interface', methods: ['request(arg)'] },
    { id: 'proxy', name: 'Proxy', attributes: ['realSubject : Subject'], methods: ['request(arg)'] },
    { id: 'real', name: 'RealSubject', methods: ['request(arg)'] },
  ],
  relations: [
    { from: 'client', to: 'subject', kind: 'dependency' },
    { from: 'proxy', to: 'subject', kind: 'realization' },
    { from: 'real', to: 'subject', kind: 'realization' },
    { from: 'proxy', to: 'real', kind: 'aggregation', toCard: '1' },
  ],
};

export default function ProxyStructure() {
  return (
    <Canvas width={W} height={400}>
      <DiagramHeader eyebrow="Proxy structure" title="같은 Subject 를 구현하므로 둘은 서로 자리를 바꿀 수 있다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

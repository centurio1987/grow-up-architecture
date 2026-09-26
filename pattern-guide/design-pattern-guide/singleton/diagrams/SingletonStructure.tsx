// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Singleton — Structure · Participants · Collaborations
//
// 주장: 바깥으로 열린 것은 접근점 하나뿐이다. 인스턴스를 만드는 자리(닫힌 생성자)도
// 그것을 담아 두는 자리(uniqueInstance)도 Singleton 칸 안에 있고, Client 에서 나가는
// 화살표는 접근점으로만 향한다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    {
      id: 'singleton',
      name: 'Singleton',
      attributes: ['- uniqueInstance : Singleton'],
      methods: ['- Singleton()', '+ instance() : Singleton', '+ businessOperation()'],
    },
  ],
  relations: [
    // Client 가 가진 통로는 접근점 호출 하나뿐이다 — 생성도 보관도 Singleton 안에서 끝난다.
    { from: 'client', to: 'singleton', kind: 'dependency' },
  ],
};

export default function SingletonStructure() {
  return (
    <Canvas width={W} height={270}>
      <DiagramHeader eyebrow="Singleton structure" title="바깥으로 열린 것은 접근점 하나뿐" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

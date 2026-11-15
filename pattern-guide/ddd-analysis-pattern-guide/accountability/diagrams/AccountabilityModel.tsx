// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 2장 「Accountability」 §2.4 의 그림 2.8(apsupp/apchap2.pdf),
//       개정 초안 Organization Structures 의 「Accountability」(apsupp/accountability.pdf)
//
// 주장: 두 Party 를 잇는 **링크가 자기 자리를 가진 개념**이고, 그 개념이 종류와 기간을 단다.
// 양 끝은 둘 다 Party 이지만 **서로 다른 자리**(위임하는 쪽 · 책임지는 쪽)를 차지한다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 960;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'atype', name: 'AccountabilityType', attributes: ['이름'] },
    { id: 'acc', name: 'Accountability' },
    { id: 'period', name: 'TimePeriod', attributes: ['시작 시점', '끝 시점'] },
    { id: 'party', name: 'Party', attributes: ['이름'] },
  ],
  relations: [
    // 종류는 관계마다 하나이고, 한 종류가 관계 여럿을 분류한다.
    { from: 'atype', to: 'acc', kind: 'association', fromCard: '1', toCard: '*', above: 'from' },
    // 관계 하나가 Party 둘을 잡는다 — 갈래가 아니라 Party 를 끝점으로 잡는 것이 핵심이라 2 로 적는다.
    { from: 'acc', to: 'party', kind: 'association', fromCard: '*', toCard: '2', above: 'from' },
    { from: 'acc', to: 'period', kind: 'association', fromCard: '1', toCard: '1', above: 'from' },
  ],
};

export default function AccountabilityModel() {
  return (
    <Canvas width={W} height={660}>
      <DiagramHeader eyebrow="Accountability model" title="두 Party 를 잇는 링크가 자기 자리를 갖는다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
      <Callout
        x={GUTTER}
        y={540}
        width={W - GUTTER * 2}
        label="세 규칙"
        lines={[
          '관계는 어느 한쪽 Party 에 딸린 칸이 아니라 자기 자리를 갖는 개념이다',
          '양 끝은 둘 다 Party 이고, 위임하는 쪽과 책임지는 쪽으로 자리가 나뉜다',
          '계통을 하나 더 쓰는 일은 클래스를 더하는 일이 아니라 AccountabilityType 인스턴스를 더하는 일이다',
        ]}
      />
    </Canvas>
  );
}

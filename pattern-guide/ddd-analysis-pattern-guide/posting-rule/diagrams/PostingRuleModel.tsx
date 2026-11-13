// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 6장 그림 6.7 · 6.27 · accounting.pdf(2000) 의 Event—Posting Rule—Entry 라벨
//       · eaaDev Agreement Dispatcher · 회계 배경 확정안(pattern-guide/research/accounting-context.md)
//
// 주장: 사건과 규칙은 **같은 사건 종류에서 만나고**, 규칙은 계산과 대상 계정을 자기가 쥔 채
// 균형 잡힌 거래 한 건을 낸다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 880;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'rule', name: 'PostingRule', attributes: ['유효 기간', '계산 규칙', '대상 계정'] },
    { id: 'kind', name: 'EventType', attributes: ['이름'] },
    { id: 'event', name: 'AccountingEvent', attributes: ['원천 식별자', '발생 시점', '접수 시점', '사용량 또는 금액'] },
    { id: 'tx', name: 'Transaction', attributes: ['거래일', '원천 식별자', '만든 규칙'] },
    { id: 'entry', name: 'Entry', attributes: ['순번', '금액 : Money'] },
    { id: 'account', name: 'Account', attributes: ['식별자', '이름', '통화'] },
    { id: 'money', name: 'Money', attributes: ['정수 금액', '통화'] },
  ],
  relations: [
    { from: 'rule', to: 'kind', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    { from: 'event', to: 'kind', kind: 'association', fromCard: '*', toCard: '1', above: 'to' },
    { from: 'rule', to: 'tx', kind: 'association', fromCard: '0..1', toCard: '*', above: 'from' },
    { from: 'tx', to: 'entry', kind: 'aggregation', fromCard: '1', toCard: '2..*' },
    { from: 'entry', to: 'account', kind: 'association', fromCard: '*', toCard: '1', above: 'from' },
    { from: 'entry', to: 'money', kind: 'association', above: 'from' },
  ],
};

export default function PostingRuleModel() {
  return (
    <Canvas width={W} height={1020}>
      <DiagramHeader eyebrow="Posting Rule model" title="사건과 규칙은 사건 종류에서 만나고, 규칙이 거래를 낸다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
      <Callout
        x={GUTTER}
        y={836}
        width={W - GUTTER * 2}
        label="세 규칙"
        lines={[
          'PostingRule 은 대상 계정을 Account 의 식별자로 가진다 — 사건은 그 계정을 모른다',
          '사건 종류와 발생 시점이 주어지면 적용할 PostingRule 이 하나로 정해진다',
          '한 규칙이 낸 다리들의 금액 합 = 0 이어야 Transaction 이 만들어지고,',
          '같은 원천 식별자와 같은 규칙으로는 두 번 만들어지지 않는다',
        ]}
      />
    </Canvas>
  );
}

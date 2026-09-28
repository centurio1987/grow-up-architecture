// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 6장 그림 6.2 · 6.3 · 6.27 · eaaDev Accounting Transaction ·
//       회계 배경 확정안(pattern-guide/research/accounting-context.md)
//
// 주장: 거래는 **Entry 를 2개 이상 묶는 그릇**이고, 합이 0 인지 판정하는 자리는 그 묶음이다.
// 각 Entry 는 자기 금액이 기록될 Account 하나를 가리키고, 거래를 만드는 쪽에 Posting Rule 이 있다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'rule', name: 'PostingRule', attributes: ['사건 종류', '유효 기간'] },
    { id: 'tx', name: 'Transaction', attributes: ['식별자', '날짜', '원천 사건 참조', '되돌리는 거래'] },
    { id: 'entry', name: 'Entry', attributes: ['순번', '금액 : Money'] },
    { id: 'account', name: 'Account', attributes: ['식별자', '이름', '통화'] },
    { id: 'money', name: 'Money', attributes: ['정수 금액', '통화'] },
  ],
  relations: [
    { from: 'rule', to: 'tx', kind: 'association', fromCard: '0..1', toCard: '*' },
    { from: 'tx', to: 'entry', kind: 'aggregation', fromCard: '1', toCard: '2..*' },
    { from: 'entry', to: 'account', kind: 'association', fromCard: '*', toCard: '1' },
    { from: 'entry', to: 'money', kind: 'association' },
  ],
};

export default function TransactionModel() {
  return (
    <Canvas width={W} height={532}>
      <DiagramHeader eyebrow="Transaction model" title="거래는 합이 0 인 Entry 묶음이다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
      <Callout
        x={GUTTER}
        y={438}
        width={W - GUTTER * 2}
        label="묶음이 지키는 규칙"
        lines={[
          '한 Transaction 이 묶은 Entry 금액의 합 = 0 (같은 단위끼리), Entry 는 2개 이상',
          '확정된 Transaction 의 구성은 바뀌지 않는다 — 정정은 되돌리는 거래를 새로 만든다',
        ]}
      />
    </Canvas>
  );
}

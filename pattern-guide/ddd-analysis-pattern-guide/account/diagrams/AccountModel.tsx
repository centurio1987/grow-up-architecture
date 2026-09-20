// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 6장 그림 6.1 · 회계 배경 확정안(pattern-guide/research/accounting-context.md)
//
// 주장: 잔액은 저장된 숫자가 아니라 **Entry 합으로 정의된다**. 거래는 Entry 를 묶고, 그 묶음 안에서
// 금액의 합이 0 이다 — 이 두 규칙이 회계 모델의 뼈대다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'type', name: 'AccountType', attributes: ['이름'] },
    { id: 'account', name: 'Account', attributes: ['식별자', '이름', '통화', '열림 또는 닫힘'], methods: ['/balance(기준 시점) : Money'] },
    { id: 'entry', name: 'Entry', attributes: ['금액 : Money'] },
    { id: 'tx', name: 'Transaction', attributes: ['날짜', '되돌리는 거래'] },
    { id: 'money', name: 'Money', attributes: ['정수 금액', '통화'] },
  ],
  relations: [
    { from: 'account', to: 'type', kind: 'association', fromCard: '*', toCard: '1' },
    { from: 'account', to: 'entry', kind: 'association', fromCard: '1', toCard: '*' },
    { from: 'tx', to: 'entry', kind: 'aggregation', fromCard: '0..1', toCard: '2..*' },
    { from: 'entry', to: 'money', kind: 'association' },
  ],
};

export default function AccountModel() {
  return (
    <Canvas width={W} height={560}>
      <DiagramHeader eyebrow="Account model" title="잔액은 저장된 값이 아니라 Entry 합이다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
      <Callout
        x={GUTTER}
        y={470}
        width={W - GUTTER * 2}
        label="두 규칙"
        lines={[
          'balance(t) = t 까지 이 Account 에 속한 Entry 금액의 합',
          '복식부기에서 한 Transaction 이 묶은 Entry 금액의 합 = 0',
        ]}
      />
    </Canvas>
  );
}

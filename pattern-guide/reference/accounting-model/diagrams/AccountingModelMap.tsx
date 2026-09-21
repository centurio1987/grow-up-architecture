// @relation layered
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 6장 그림 6.1 · 6.2 · 6.3 · 6.20 · 6.27(apchap6.pdf) ·
//       eaaDev Account · Accounting Transaction · Agreement Dispatcher · DDD Reference 「Knowledge Level」
//
// 주장: 회계 모델은 두 층이다. 아래층은 매일 쌓이는 사실(Account · Entry · Transaction · Money)이고
// 위층은 그 사실을 해석하는 지식(AccountType · Posting Rule)이다. Entry 는 Account 와 Transaction
// 양쪽에 걸리고, Posting Rule 은 계정 종류를 보고 균형 잡힌 Transaction 을 만든다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;
/** 경계와 칸 사이 여백. 22 로 두면 카디널리티 라벨(앵커에서 20 아래)이 프레임 점선 위에 앉는다(실측). */
const PAD = 10;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'type', name: 'AccountType', attributes: ['이름'] },
    { id: 'rule', name: 'Posting Rule', attributes: ['계산 방법', '유효 기간'] },
    { id: 'account', name: 'Account', attributes: ['식별자', '통화', '열림 또는 닫힘'], methods: ['/balance(기준 시점) : Money'] },
    { id: 'tx', name: 'Transaction', attributes: ['날짜', '되돌리는 거래'] },
    { id: 'entry', name: 'Entry', attributes: ['시각', '금액 : Money'] },
    { id: 'money', name: 'Money', attributes: ['금액', '통화'] },
  ],
  relations: [
    // 운영 → 지식. 연관이라 계층으로 안 세므로 어느 쪽이 위인지만 말한다.
    { from: 'account', to: 'type', kind: 'association', fromCard: '*', toCard: '1', above: 'to' },
    // 같은 층 안의 두 역할 — trigger(입력 계정 종류) · output(출력 계정 종류).
    { from: 'rule', to: 'type', kind: 'association', fromCard: '*', toCard: '1' },
    { from: 'rule', to: 'type', kind: 'association', fromCard: '*', toCard: '1' },
    // 규칙이 만든 거래. 사람이 직접 적은 거래는 creator 가 없어 0..1.
    { from: 'rule', to: 'tx', kind: 'association', fromCard: '0..1', toCard: '*', above: 'from' },
    { from: 'tx', to: 'entry', kind: 'aggregation', fromCard: '1', toCard: '2..*' },
    { from: 'account', to: 'entry', kind: 'association', fromCard: '1', toCard: '*' },
    { from: 'entry', to: 'money', kind: 'association', above: 'from' },
  ],
  // 라벨은 프레임 왼쪽 위에 놓이고 Account→AccountType 선과 그 `*` 라벨이 그 자리를 지난다(실측 —
  // 'operational level' 까지 적으면 글자가 선에 잘린다). 선에 닿기 전에 끝나게 한글 두 단어만 둔다.
  // 영문 용어(knowledge level · operational level)는 본문의 개념 헤딩이 든다.
  groups: [
    { id: 'knowledge', label: '지식 층위', members: ['type', 'rule'] },
    { id: 'operational', label: '운영 층위', members: ['account', 'tx', 'entry', 'money'] },
  ],
};

export default function AccountingModelMap() {
  return (
    <Canvas width={W} height={950}>
      <DiagramHeader eyebrow="Accounting model" title="사실은 아래층에, 규칙은 위층에 산다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER + PAD, y: 104 + PAD + 8 }} groupPad={PAD} />
      <Callout
        x={GUTTER}
        y={800}
        width={W - GUTTER * 2}
        label="세 규칙"
        lines={[
          '부호 규약: 자산 · 비용 계정이 늘면 +(차변), 부채 · 자본 · 수익 계정이 늘면 −(대변) — 그래서 한 거래의 합은 0',
          'Account 의 balance(t) = t 까지 이 Account 에 속한 Entry 금액의 합 · Transaction 이 묶은 Entry 금액의 합 = 0',
          'Posting Rule → AccountType 두 선은 trigger(입력 계정 종류) · output(출력 계정 종류)',
        ]}
      />
    </Canvas>
  );
}

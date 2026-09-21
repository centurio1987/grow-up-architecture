// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 DDD 전술 모델의 요소(aggregate 안팎의 클래스)다.
// 출처: Evans, Domain-Driven Design Reference(2015) Aggregates 16쪽 · Repositories 17쪽 ·
//       Vernon, Effective Aggregate Design Part II 규칙 「Reference Other Aggregates By Identity」(8쪽) ·
//       회계 배경 확정안(pattern-guide/research/accounting-context.md) 1절·3절·5절
//
// 주장: 한 Bounded Context 안에 Aggregate 가 여럿이고, Aggregate 마다 **Aggregate Root 하나가 입구**다.
// Root 의 메서드가 자기 묶음의 불변식을 지키고, 다른 Aggregate 는 객체가 아니라 **id 로만** 가리킨다.
// Repository 는 Root 를 id 로 찾아오는 자리라 Aggregate 밖, Bounded Context 안에 있다.
import { Boundary, Canvas, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, Frame, GUTTER, HEADER_H, Label } from '../../../../viz/frame/frame';
import { DomainModel, layoutDomainModel, type DomainBox, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 912;

// 배치는 리프를 실제 폭 + 통로로 깔고 부모를 자식 열 가운데에 놓는다(domain-model.tsx). root 가
// 자식보다 넓으면 옆 root 와 맞붙는다(실측 — 이전 판에서 Transaction 과 Account 가 닿아 두 Aggregate
// 프레임이 겹쳤다). 자식 열(Entry · Money)을 root 보다 넓게 고정해 통로를 만든다.
const ROOT_W = 300;
const LEAF_W = 340;

const SPEC: DomainModelSpec = {
  entities: [
    {
      id: 'ledger',
      name: 'GeneralLedger',
      stereotype: 'Repository',
      methods: ['account(AccountId) : Account', 'transaction(TransactionId) : Transaction'],
    },
    {
      id: 'tx',
      name: 'Transaction',
      stereotype: 'Aggregate Root',
      attributes: ['식별자 : TransactionId', '날짜'],
      methods: ['create(entries) — 불변식 ① 검사'],
      width: ROOT_W,
    },
    {
      id: 'entry',
      name: 'Entry',
      stereotype: 'Entity',
      attributes: ['seq (거래 안 순번 = 식별자)', 'accountId : AccountId', 'amount : Money'],
      width: LEAF_W,
    },
    { id: 'money', name: 'Money', stereotype: 'Value Object', attributes: ['정수 금액', '통화'], width: LEAF_W },
    {
      id: 'account',
      name: 'Account',
      stereotype: 'Aggregate Root',
      attributes: ['식별자 : AccountId', '이름', '통화', '열림 또는 닫힘'],
      methods: ['checkPostable(amount) — 불변식 ② 검사', 'close()'],
      width: ROOT_W,
    },
  ],
  relations: [
    // Repository 는 Root 를 id 로 찾아온다 — 층위를 말하려고 above 로 위에 둔다.
    { from: 'ledger', to: 'tx', kind: 'dependency', above: 'from' },
    { from: 'ledger', to: 'account', kind: 'dependency', above: 'from' },
    // Aggregate 안: Root 가 child entity 를 소유하고, entity 가 VO 를 값으로 품는다.
    { from: 'tx', to: 'entry', kind: 'composition', fromCard: '1', toCard: '2..*' },
    { from: 'entry', to: 'money', kind: 'association', above: 'from' },
    // Aggregate 사이: 객체가 아니라 식별자로 가리킨다(점선 = 의존, 라벨은 id 타입).
    { from: 'entry', to: 'account', kind: 'dependency', toCard: 'AccountId' },
  ],
};

const ORIGIN = { x: GUTTER + 48, y: HEADER_H + 64 };
const BC_PAD = 56;
/** Aggregate 프레임과 칸 사이 여백. 아래쪽은 프레임 안에 라벨을 넣으려고 더 준다. */
const AGG_PAD = 22;
const AGG_PAD_BOTTOM = 46;

/**
 * Aggregate 경계를 spec 의 `groups` 로 두지 않고 여기서 그리는 이유 — `groups` 의 라벨은 프레임 선
 * **위 바깥**에 앉는데, 그 자리를 Repository 에서 root 로 내려오는 점선의 꺾임 구간이 지나가
 * 글자와 선이 겹쳤다(실측). 라벨을 프레임 **안 아래**에 두면 그 아래는 비어 있다.
 */
function aggregateFrame(boxes: DomainBox[]) {
  const x = Math.min(...boxes.map((b) => b.x)) - AGG_PAD;
  const y = Math.min(...boxes.map((b) => b.y)) - AGG_PAD;
  return {
    x,
    y,
    width: Math.max(...boxes.map((b) => b.x + b.width)) + AGG_PAD - x,
    height: Math.max(...boxes.map((b) => b.y + b.height)) + AGG_PAD_BOTTOM - y,
  };
}

/**
 * Aggregate 경계 — 점(dot) 패턴으로 그린다. `Frame` 의 `dashed`('6 4')는 의존 점선('5 3')과
 * 교차점에서 구분되지 않았다(채점 관찰). 색·굵기는 `Frame` 과 같은 foundation 토큰이다.
 */
function AggregateBoundary(r: { x: number; y: number; width: number; height: number }) {
  const f = useVizFoundation();
  return <Boundary {...r} radius={0} stroke={f.boundary.stroke} strokeWidth={f.boundary.width} dashPattern="2 5" />;
}

export default function DddTacticalMap() {
  const layout = layoutDomainModel(SPEC, ORIGIN);
  const box = (id: string) => layout.byId.get(id)!;
  const aggTx = aggregateFrame([box('tx'), box('entry'), box('money')]);
  const aggAccount = aggregateFrame([box('account')]);
  const bc = {
    x: ORIGIN.x - BC_PAD,
    y: ORIGIN.y - BC_PAD,
    width: layout.width + BC_PAD * 2,
    height: layout.height + BC_PAD * 2,
  };
  const entry = box('entry');
  const account = box('account');
  // Entry → Account 점선은 Entry 윗변에서 나가 중간 높이에서 꺾여 Account 밑변으로 들어간다.
  // 라벨은 그 가로 구간 바로 위, 꺾이는 지점 오른쪽에 둔다 — 가운데에 두면 Account 프레임의
  // 왼쪽 테두리와 그 안의 프레임 라벨에 붙는다(실측).
  const midY = (entry.y + account.y + account.height) / 2;
  const midX = entry.x + entry.width / 2 + 56;
  const calloutY = bc.y + bc.height + 28;
  const calloutLines = [
    '① 한 Transaction 의 Entry 금액 합 = 0 (통화별), Entry 는 2개 이상 — Transaction root 가 만들 때 검사',
    '② Entry 가 가리키는 Account 는 열려 있고 통화가 같다 — Account root 가 전기 전에 검사',
    '지키는 자리는 언제나 root 의 메서드. 밖에서 Entry 를 직접 바꾸면 ①을 검사할 곳이 없다',
  ];
  const height = calloutY + 34 + calloutLines.length * 20 + GUTTER;

  return (
    <Canvas width={W} height={height}>
      <DiagramHeader eyebrow="DDD tactical map" title="Aggregate 마다 Root 가 입구이고, 밖은 id 로만 가리킨다" />
      <Frame x={bc.x} y={bc.y} width={bc.width} height={bc.height} label="Bounded Context — 총계정원장 전기" />
      <AggregateBoundary {...aggTx} />
      <AggregateBoundary {...aggAccount} />
      <Label x={aggTx.x + 12} y={aggTx.y + aggTx.height - 14} size={10.5} dim>
        Aggregate — Transaction
      </Label>
      <Label x={aggAccount.x + 12} y={aggAccount.y + aggAccount.height - 14} size={10.5} dim>
        Aggregate — Account
      </Label>
      <DomainModel spec={SPEC} origin={ORIGIN} />
      <Label x={midX} y={midY - 8} size={11} bold>
        id 참조
      </Label>
      <Callout x={GUTTER} y={calloutY} width={W - GUTTER * 2} label="불변식" lines={calloutLines} />
    </Canvas>
  );
}

# 회계 도메인 배경 확정안 — Account · Transaction · Posting Rule 공통 상황

- 상태: **AI 중재 승인 · 유저 최종 판정 대기**. KAN-001.1-P5N9NF 검토서의 판단 항목 2(확정안 채택)·3(문서1 처분)이 2026-09-18 에 중재자 판정으로 승인됐고, 그 판정에 따라 11절의 추천안이 본문에 반영된 상태다. **유저 판정은 그 검토서에서 아직 열려 있다** — 검토서가 승인으로 닫히면 이 줄을 «확정»으로 바꾼다. 그때까지 Account 편(KAN-001.3-Q6FYKP)은 이 안으로 쓰고, 유저 판정이 뒤집히면 불변식 ④(파생 잔액의 지연 허용)와 정정 방식(역분개 한 가지)에 얹힌 서술부터 다시 본다.
- 작성: 2026-09-17, 메인 세션. 수집이 아니라 판단 문서다 — 사실은 아래 근거 자료에서 오고, 경계를 어디에 긋는지는 이 문서가 정한다. 판단인 문장에는 근거를 붙였다.
- 쓰는 곳: 분석 패턴 가이드 중 Account · Transaction · Posting Rule 세 편의 `### 상황 설정` 표와 `### 상황이 달라지면` 표(analysis-guide 원칙 AG9·AG11). 세 편이 같은 배경을 공유해야 서로 모순되지 않는다.
- 근거 자료
  - 리서치 노트: `pattern-guide/research/analysis-patterns.md` 의 Account · Transaction · Posting Rule 절, 특히 각 절 끝의 「배경 확정안 재료」
  - 심화 문서 두 편: `pattern-guide/consideration/Account와 Entry의 관계 설계.md`(이하 문서2), `pattern-guide/consideration/account-transaction-entry-modeling.md`(이하 문서1)
  - DDD aggregate 설계 규칙: Vaughn Vernon, "Effective Aggregate Design" Part I·II — 진짜 불변식만 한 일관성 경계에 · 작은 aggregate · 다른 aggregate는 id로 참조 · 경계 밖은 결과적 일관성, 그리고 "트랜잭션 하나에 aggregate 인스턴스 하나만 수정"

## 1. 결론 한눈에

```text
 원천 사건(청구·결제 등, 다른 컨텍스트의 사실)
        │ sourceRef 만 넘어온다
        ▼
 ┌─────────────────┐  규칙 선택·계산   ┌──────────────────────────────────┐
 │ PostingRule     │ ───────────────▶ │ Transaction  «aggregate root»     │
 │ «aggregate root»│  (AccountId 목록) │  id · sourceRef · 날짜 · reverses?│
 │ 지식 층위       │                   │  ├─ Entry «불변 child entity»     │
 └─────────────────┘                   │  │   seq · accountId · amount     │
                                       │  └─ Entry … (2개 이상, 합 = 0)    │
                                       └───────────────┬──────────────────┘
                                                       │ TransactionPosted 이벤트
                                                       ▼
 ┌─────────────────┐   AccountId 로만   ┌──────────────────────────────────┐
 │ Account         │ ◀───────────────── │ AccountBalance «읽기 모델»         │
 │ «aggregate root»│                    │  accountId · balance · 적용 순번  │
 │ Entry 컬렉션 없음│                    └──────────────────────────────────┘
 └─────────────────┘
```

- 복식부기라서 **균형 불변식(한 거래의 Entry 합 = 0)이 Transaction에 있다.** 그래서 Transaction이 root이고 Entry는 그 안의 불변 child entity다.
- Account는 **Entry를 소유하지 않는다.** 잔액은 Entry에서 파생되는 값이고, 이 컨텍스트에서는 이벤트로 늦게 맞춰지는 읽기 모델이 들고 있다.
- Posting Rule은 지식 층위의 규칙 객체이고, 한 번 실행하면 **균형 잡힌 Transaction 한 건**을 낸다.
- 어느 aggregate도 다른 aggregate의 객체를 필드로 들지 않는다. 전부 id로 가리킨다.

## 2. Bounded context

**총계정원장(General Ledger) 전기 컨텍스트** — 다른 컨텍스트에서 일어난 업무 사건을 균형 잡힌 분개(Transaction)로 전기하고, 계정별 잔액을 파생한다.

이 컨텍스트가 하지 **않는** 일: 결제 승인, 신용 한도 판단, 청구서 발행. 그 결과는 원천 사건으로 들어올 뿐이다. 이 선을 먼저 긋는 이유는 "잔액이 음수가 되면 안 된다" 같은 규칙이 원장이 아니라 결제 승인 쪽의 규칙이기 때문이다(그 규칙을 원장이 지켜야 하는 상황은 8절 ④-a 로 따로 둔다).

## 3. 불변식과 그 위치

- **I1 균형** — 한 Transaction의 Entry 금액 합은 통화별로 0이다(Entry는 2개 이상).
  - 위치: Transaction root 의 생성(전기) 팩토리 · 동기
- **I2 불변 사실** — 전기된 Transaction 과 그 Entry 는 수정·삭제하지 않는다. 정정은 원 Transaction 을 id 로 가리키는 역분개 Transaction 으로 한다. "이미 정정됨" 표시를 원 거래에 쓰지 않고, 그 거래를 가리키는 역분개 거래가 있는지로 파생한다.
  - 위치: Transaction root — 생성 후 상태를 바꾸는 메서드가 없다 · 동기
- **I3 멱등 전기** — 같은 원천 사건을 같은 규칙으로 두 번 전기하지 않는다.
  - 위치: 집합 규칙이라 한 aggregate 인스턴스로는 못 지킨다 → Transaction 의 전기 키 `(sourceRef, postingRuleId)` + 저장소의 유일성 제약 · 동기(저장 시점)
- **I4 잔액 파생** — 계정 잔액 = 그 계정을 가리키는 Entry 금액의 합.
  - 위치: aggregate 경계 밖 — `AccountBalance` 읽기 모델이 `TransactionPosted` 이벤트를 받아 갱신 · 결과적
- **I5 계정 유효** — Entry 가 가리키는 Account 가 존재하고 닫혀 있지 않다.
  - 위치: 전기 서비스가 Account 를 읽기 전용 입력으로 조회해 검사 · 동기 검사, 계정 폐쇄와 동시에 일어나는 경합은 허용
- **I6 규칙 기간** — 같은 사건 종류에 대해 유효 기간이 겹치는 Posting Rule 이 둘 이상 없다.
  - 위치: 여러 규칙 인스턴스에 걸친 집합 규칙 → 규칙 등록 서비스 + 저장소 제약 · 동기(등록 시점)

- I1이 Transaction에 있는 근거: 복식부기의 균형은 한 거래에 속한 다리들 사이의 규칙이지 한 계정의 규칙이 아니다. 문서2 「후속 논의」의 결론("이 불변식은 단일 Entry에도, Account에도 없고 여러 Entry를 묶는 Transaction에 있다")과 같다.
- I3·I6을 aggregate 안에 넣지 못하는 이유: "같은 키의 인스턴스가 저장소 전체에 하나"와 "기간이 겹치는 규칙이 없다"는 여러 인스턴스에 걸친 규칙이다. aggregate 하나가 볼 수 있는 범위를 넘으므로 저장소 제약과 등록 서비스가 맡는다. 전기 키에 규칙 id 를 넣는 이유는 사건 하나가 규칙 여럿(예: 본 거래와 세금)을 부를 수 있기 때문이다. 원천 사건 식별자를 거래 키로 삼는 방식은 TigerBeetle 이 id 를 멱등성 키로 쓰는 방식과 같다(리서치 노트 Transaction 절).
- I4를 결과적 일관성으로 두는 근거: 전기 한 번에 Transaction과 Account(또는 잔액)를 함께 고치면 트랜잭션 하나가 aggregate 둘을 수정하게 된다. 이 컨텍스트에는 잔액을 동기적으로 지켜야 할 규칙이 없으므로(2절) 그 비용을 치를 이유가 없다.

## 4. root · entity · VO 배정

- `Transaction` — **aggregate root**
  - `id: TransactionId`, `sourceRef: SourceRef`(원천 사건의 식별자), `postingRuleId`(이 거래를 만든 규칙, I3 키의 나머지 절반), `date`, `entries: Entry[2..*]`, `reverses?: TransactionId`
  - 초안(draft) 상태를 저장하지 않는다. 다리를 메모리에서 조립한 뒤 팩토리가 I1을 검사하고 전기된 상태로 한 번에 만든다. 만든 뒤에는 바꿀 수 없다(I2).
- `Entry` — **Transaction 안의 불변 child entity**
  - `seq`(거래 안 순번), `accountId: AccountId`, `amount: Money`
  - 식별자는 `(TransactionId, seq)`. 금액·계정·날짜가 같은 두 Entry도 다른 사실이라 식별성이 필요하다(문서2 「후속 논의」 1). Apache OFBiz 의 `AcctgTransEntry` 기본 키가 `(acctgTransId, acctgTransEntrySeqId)` 인 것과 같은 구조다.
- `Money` — **VO**: `amount`(정수 최소 단위) + `currency`. 분석 패턴 Quantity를 금액에 쓴 형태.
- `Account` — **별도 aggregate root**
  - `id: AccountId`, `name`, `accountTypeId`(지식 층위 참조), `currency`, `status: open | closed`
  - **Entry 컬렉션이 없다.** 잔액 필드도 없다.
- `AccountBalance` — **읽기 모델(aggregate 아님)**: `accountId`, `balance: Money`, `lastAppliedSeq`(같은 이벤트를 두 번 받아도 한 번만 반영하기 위한 순번)
- `PostingRule` — **별도 aggregate root, 지식 층위**
  - `id`, `eventType`(어떤 원천 사건에 반응하는가), `effectivity: DateRange`(언제 유효한가), 출력 규칙(입력 금액 → 계정별 금액), 대상 `AccountId` 목록
  - 실행 결과 = 균형 잡힌 `Transaction` 한 건(6절 흐름의 3~4단계)
  - 규칙 하나를 aggregate 하나로 둔다. 계약(Agreement)이 규칙 목록을 통째로 소유하는 선택지는 쓰지 않는다 — 규칙을 따로 편집하고 aggregate 를 작게 두기 위해서다. 대가로 I6이 경계 밖으로 나간다.
  - **전제**: 규칙 계산이 계정의 현재 잔액을 입력으로 쓰지 않는다(누진·한도 요율이 없다). 쓰는 규칙이 생기면 잔액 지연이 곧 계산 오류가 되므로 8절 ④-a 로 간다.

## 5. 타 aggregate 참조 방식

- `Entry` → `Account`: `AccountId`
- `Transaction`(역분개) → 원 `Transaction`: `TransactionId`
- `PostingRule` → `Account`: `AccountId` 목록
- `AccountBalance` → `Account`: `AccountId`
- `Transaction` → 원천 사건: `SourceRef`(다른 컨텍스트의 식별자, 이 컨텍스트에서는 값)
- 어느 aggregate도 다른 aggregate 타입을 필드나 메서드 시그니처에 들지 않는다(analysis-guide 원칙 AG7).

## 6. 전기 한 번의 흐름

1. 원천 사건이 도착한다 — 이 컨텍스트가 받는 것은 사건 종류·시점·금액·`sourceRef` 뿐이다.
2. 사건 종류와 시점으로 유효한 `PostingRule`을 고른다 — 규칙이 기간마다 바뀔 수 있어서 시점이 필요하다.
3. 규칙이 계정별 금액 목록을 계산한다 — 규칙은 계산만 하고 저장하지 않는다. 결과가 균형을 이루는지는 규칙이 아니라 다음 단계가 판정한다.
4. `Transaction` 팩토리가 I1을 검사하고 인스턴스를 만든다 — 균형 검사를 root 한 곳에 두어야 규칙이 틀려도 불균형 거래가 저장되지 않는다.
5. 전기 서비스가 I5를 검사한 뒤 저장한다 — 저장소의 `(sourceRef, postingRuleId)` 유일성 제약이 I3을 지킨다. 중복이면 이미 전기된 거래를 돌려준다.
6. 저장이 끝나면 `TransactionPosted` 이벤트가 나간다.
7. `AccountBalance`가 이벤트를 받아 Entry 금액을 더한다 — `lastAppliedSeq`로 같은 이벤트의 중복 반영을 막는다(I4).

## 7. 일관성 쟁점 넷에 대한 답

- **중복 전기 방지** → I3. 원천 사건과 규칙의 식별자 쌍을 거래의 키로 삼아 저장소가 두 번째 저장을 거부한다. "사건 처리됨" 표시를 사건 쪽에 쓰는 Fowler 방식은 쓰지 않는다 — 사건 수정과 거래 생성이 두 aggregate 작업이 되기 때문이다.
- **취소·정정** → I2. 원 거래를 고치지 않고, 원 거래를 `reverses`로 가리키며 금액 부호를 뒤집은 역분개 거래를 새로 전기한다. 이 컨텍스트는 **역분개 한 가지만** 쓴다. Fowler 의 Replacement(지우고 다시 쓰기)는 이력을 잃고, Difference(차액만 전기)는 원 거래와의 대응을 읽는 쪽이 계산해야 해서 쓰지 않는다.
- **동시 처리** → 서로 다른 거래는 공유하는 aggregate가 없다. 같은 계정으로 동시에 두 거래가 전기돼도 잠금 경합이 없다. 잔액 읽기 모델은 순번으로 멱등하게 반영한다.
- **파생 잔액의 지연 허용** → 허용한다. 잔액 조회는 방금 전기한 거래를 아직 반영하지 않았을 수 있다. 허용할 수 없는 상황은 8절 ④-a 다.

## 8. Entry 소속 네 가지 — 「상황이 달라지면」 표의 재료

요청서가 든 네 가지를 각각 "어떤 상황이면 그 경계가 맞는가"로 정리했다. 세 가이드는 이 네 행에 이 확정안의 선택(첫 행)을 표시해 싣는다.

1. **Transaction이 가진다** — 이 확정안. 균형 불변식이 거래 단위에 있는 복식부기 원장. 근거: 문서2 「후속 논의」, 리서치 노트 Transaction 절의 원전 그림(Transaction 쪽 제약 `Sum(entries.amount)=0`).
2. **Account가 가진다** — 단식 기록이고, 계정 단위 규칙이 그 계정의 Entry **전체**에 걸리며, Entry 수가 작게 제한될 때만(예: 사용 횟수가 정해진 선불권). Entry가 계속 쌓이는 원장에서는 지양한다 — 계정 하나를 고칠 때마다 전체 Entry를 불러오고 잠그게 된다(문서2 시나리오 1).
3. **홀로 존재한다** — 거래 균형 규칙이 없는 단식 기록(포인트 적립 내역, 활동 기록). Entry가 trivial aggregate가 되고 Account를 id로 가리킨다(문서2 시나리오 2). 근거: 리서치 노트 Account 절 — Fowler eaaDev가 계정 없는 Entry와 거래 없는 Entry를 선택지로 적는다.
4. **별도 entity로 존재하고 Account가 그에 대한 VO를 가진다** — 두 갈래로 나뉜다(리서치 노트 Account 절의 ④-a · ④-b 표기를 따른다).
   - **④-a Account가 요약 VO(잔액, 예약액)만 가진다** — "잔액이 음수가 되면 안 된다" 같은 규칙을 전기 시점에 동기적으로 지켜야 할 때. 대가는 전기 한 번에 Account와 Transaction 두 aggregate를 한 트랜잭션에서 고친다는 것이다. Vernon 규칙의 명시적 예외로 받아들이거나, 잔액 예약(hold)을 먼저 잡고 전기하는 두 단계로 나눈다(문서2 종합 의견 B, TigerBeetle 의 pending → post/void 두 단계 전송).
   - **④-b Account가 Entry 내역 투영 VO 목록을 가진다** — **지양.** 같은 사실이 두 곳에 있어 동기화 부담이 생기고 목록이 계속 커진다(문서2 시나리오 3). 문서1의 `List<AccountLedger>`가 이 형태다.

## 9. consideration 두 문서와의 정합

- **문서2(Account와 Entry의 관계 설계)** — 종합 의견과 후속 논의의 결론이 이 확정안과 같다. 정합.
- **문서1(account-transaction-entry-modeling)**
  - 맞는 부분: Transaction이 root이고, 다리(`TransactionLeg`)는 `accountId`만 들며, `post()`가 균형을 검사한다. DB에서 Entry를 한 테이블에 두고 두 관점으로 읽는 3절 설명도 이 확정안과 부딪치지 않는다.
  - 어긋나는 부분 둘
    1. `Account`가 `List<AccountLedger>`를 보유한다 → 이 확정안의 8절 ④-b, 지양하는 형태다.
    2. `TransferService`가 한 번의 호출에서 Transaction과 Account 둘을 저장한다 → 트랜잭션 하나에 aggregate 셋을 수정한다. 이 확정안은 Account를 건드리지 않고 잔액을 이벤트로 파생한다.
  - 처분 선택지: **(가) 정정** — 1~3절은 두고 4절 코드를 이 확정안(Account에 목록 없음, 잔액은 읽기 모델)으로 고친다. **(나) 재명명** — 제목과 머리말을 "대안 모델: 계정별 내역 사본을 Account에 두는 설계와 그 대가"로 바꾸고 이 확정안을 링크한다.
  - 추천: (가). 문서1은 머리말에서 스스로를 "완벽한 도메인 코드 모델링 예시"라고 부르므로, 그대로 두고 이름만 바꾸면 독자가 코드를 권고로 읽는 위험이 남는다. DB 매핑 설명(3절)은 정정해도 살아남는다.

## 10. Fowler 원전과 이 확정안의 차이

- **분석 층위에서는 Entry가 Account와 Transaction 양쪽에 연관된다.** 원서 그림 6.1은 계정 쪽 제약(`balance = sum(entries.amount)`), 그림 6.2·6.3은 거래 쪽 제약(`Sum(entries.amount) = 0`)을 두고, eaaDev의 여러 다리 거래 코드는 Entry가 계정과 거래를 양방향으로 참조한다. 가이드의 「등장하는 개념과 정의」는 이 개념 관계를 그대로 설명한다. **DDD로 옮길 때 한쪽 소유를 끊은 것이 이 확정안이다** — 한 내부 객체가 두 root에 동시에 속할 수 없기 때문이다.
- **Posting Rule의 출력 단위.** 원서 그림 6.7은 계정을 트리거로 삼는 모델이고, eaaDev(2005)의 규칙 예는 고객 계정에 Entry 하나를 만든다. 이 확정안은 출력 단위를 **균형 잡힌 Transaction 한 건**으로 정한다. I1을 거래 팩토리 한 곳에서 지키기 위한 판단이다.
- **회계 장의 우선 근거.** Fowler는 apchap6 머리말에서 accounting.pdf의 패턴이 원서 6장을 대체한다고 적었다. accounting.pdf는 본문 텍스트 추출이 안 되어 그림 라벨과 코드 수준으로만 확인했다(사건 → 약정 → 시점별 규칙 선택 → Posting Rule → Accounting Entry, 그리고 Adjustment).

## 11. 유저 확정 대기 항목

1. 이 확정안의 채택 — bounded context · 불변식 I1~I6 · 배정 · 참조 방식
2. 파생 잔액의 지연 허용 — 허용(추천)이면 이대로, 허용하지 않으면 8절 ④-a 하이브리드가 기본 배정이 된다
3. 정정 방식을 역분개 한 가지로 고정 — 고정(추천)하면 후보 보고서의 Adjustment(조건부 보류)는 비권고로 정해진다
4. Posting Rule의 출력 단위를 균형 잡힌 Transaction 으로 정하고, 규칙 하나를 aggregate 하나로 둠(추천)
5. 전기 키를 `(원천 사건, 규칙)` 쌍으로 두는 멱등 방식(추천)
6. 문서1의 처분 — (가) 정정(추천) / (나) 재명명

## 출처

모든 웹 출처의 조회일은 2026-09-17 이다. 원서 본문은 직접 열람하지 못했고, 원서 위치는 리서치 노트 머리말의 방식(목차 PDF + 저자 공개 그림 PDF)으로 확인했다.

- 리서치 노트 `pattern-guide/research/analysis-patterns.md` — Account · Transaction · Posting Rule 절의 「DDD 매핑 후보」와 「배경 확정안 재료」
- `pattern-guide/consideration/Account와 Entry의 관계 설계.md` — 시나리오 1~3, 종합 의견, 후속 논의
- `pattern-guide/consideration/account-transaction-entry-modeling.md` — 1~4절
- Martin Fowler, 『Analysis Patterns: Reusable Object Models』, Addison-Wesley — Chapter 6 「Inventory and Accounting」 §6.1 Account, §6.2 Transactions, §6.5 Posting Rules(쪽은 확인 안 함) · [목차 PDF](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf)
- [UML Diagrams for Chapter 6 (apchap6.pdf)](https://martinfowler.com/apsupp/apchap6.pdf) — 그림 6.1(Account 쪽 잔액 제약), 6.2·6.3(Transaction 쪽 합 0 제약), 6.27(Posting Rule 이 Transaction 의 creator), 머리말의 accounting.pdf 대체 표시
- [Accounting Patterns 개정 초안 (accounting.pdf)](https://martinfowler.com/apsupp/accounting.pdf) — 본문 텍스트 추출 불가, 그림 라벨과 코드 블록만 판독
- [Accounting Transaction (eaaDev)](https://martinfowler.com/eaaDev/AccountingTransaction.html) — 여러 다리 거래, `canPost()`, Entry 가 계정·거래를 양방향 참조
- [Accounting Entry (eaaDev)](https://martinfowler.com/eaaDev/AccountingEntry.html) — 계정 없는 Entry, 거래 없는 Entry 를 선택지로 서술
- [Account (eaaDev)](https://martinfowler.com/eaaDev/Account.html) — Account 가 entries 컬렉션을 갖는 코드
- [Patterns for Accounting (eaaDev)](https://martinfowler.com/eaaDev/AccountingNarrative.html) — Account 와 Transaction 이 모두 선택이라는 서술
- [Reversal Adjustment (eaaDev)](https://martinfowler.com/eaaDev/ReversalAdjustment.html) · [Replacement Adjustment](https://martinfowler.com/eaaDev/ReplacementAdjustment.html) · [Difference Adjustment](https://martinfowler.com/eaaDev/DifferenceAdjustment.html) — 정정 방식 셋
- [Agreement Dispatcher (eaaDev)](https://martinfowler.com/eaaDev/AgreementDispatcher.html) — 사건 종류·시점별 규칙 선택
- [Effective Aggregate Design Part I (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf) — 진짜 불변식만 한 경계에, 작은 aggregate, 트랜잭션 하나에 aggregate 인스턴스 하나
- [Effective Aggregate Design Part II (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf) — id 참조, 경계 밖 결과적 일관성, 규칙을 깨도 되는 이유
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Aggregate 의 외부 참조는 root 만, Domain Event 는 불변
- [TigerBeetle: Transfer](https://docs.tigerbeetle.com/reference/transfer/) · [Reliable Transaction Submission](https://docs.tigerbeetle.com/coding/reliable-transaction-submission/) — id 를 멱등성 키로 사용, 수정 불가·정정 전송, pending → post/void
- [OFBiz accounting-entitymodel.xml](https://github.com/apache/ofbiz-framework/blob/trunk/applications/datamodel/entitydef/accounting-entitymodel.xml) — `AcctgTransEntry` 기본 키 `(acctgTransId, acctgTransEntrySeqId)`

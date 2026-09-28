# 심화: Transaction과 Account의 관계 및 Entry 모델링

> 한 줄 요약: 복식부기 회계 도메인에서 `Transaction`과 `Account`라는 두 Aggregate Root 간의 결합도를 낮추고, `Entry`의 소속 딜레마를 해결하기 위한 객체 모델링 및 DB 매핑 가이드.
>
> 관련 패턴: [Account 가이드](../ddd-analysis-pattern-guide/account/account-guide_v1.1.0.md), [Transaction 가이드](../ddd-analysis-pattern-guide/transaction/transaction-guide_v1.0.0.md)

---

## 1. 딜레마의 시작: Entry는 도대체 어디에 속하는가?

`Account`(계정) 패턴과 `Transaction`(거래) 패턴을 개별적으로 학습하다 보면 `Entry`(항목) 객체의 정의가 충돌하는 모순을 마주하게 됩니다.
* `Account` 관점에서 `Entry`는 계정의 **입출금 내역(History)**입니다.
* `Transaction` 관점에서 `Entry`는 합계가 0이 되도록 맞추는 **대차대조 다리(Leg)**입니다.

현실 세계의 장부에서는 한 거래의 특정 다리(Leg) 내용이 곧 계정의 입출금 내역과 일치합니다. 그렇다면 소프트웨어 도메인 모델에서도 하나의 `Entry` 객체를 `Transaction`과 `Account`가 같이 메모리 참조(Reference)로 공유해도 될까요?

### DDD의 원칙: 하나의 내부 객체가 두 AR을 섬길 수 없다
도메인 주도 설계(DDD)의 핵심 원칙에 따르면, **하나의 내부 구성원(Entity나 Value Object)이 두 개의 서로 다른 Aggregate Root(AR)에 동시에 소속될 수 없습니다.** 만약 `Transaction`과 `Account`가 동일한 `Entry` 객체의 메모리 주소를 공유한다면, 캡슐화와 일관성 경계가 무너지게 됩니다. 

따라서 물리적 개념으로는 하나일지라도, 도메인 코드상에서는 **어떤 AR의 렌즈로 보느냐에 따라 두 개의 완전히 다른 클래스로 분리**하여 모델링하는 것이 정석입니다.

---

## 2. Transaction의 정체성: 연속성이 결여된 불변 애그리거트

에릭 에반스의 오리지널 DDD 기준에서 AR은 보통 긴 생명주기와 상태 변화(Continuity)를 가집니다. 그러나 `Transaction`은 한 번 생성되면 상태가 변하지 않는 과거의 사실(Fact)임에도 불구하고 당당한 **불변 애그리거트(Immutable Aggregate)**로 취급됩니다. 그 이유는 두 가지 절대적인 필수 조건을 만족하기 때문입니다.

1. **일관성 경계(Consistency Boundary)의 수호**: 생성 시점에 "차변과 대변의 합이 정확히 0이어야 한다"는 치명적인 불변식을 원자적(Atomically)으로 검증해야 하는 책임이 있습니다.
2. **전역 식별성(Global Identity)**: 환불, 거래 취소(상쇄 분개), 영수증 발급 등을 위해 다른 시스템이나 외부에서 전역 고유 ID를 통해 이 거래를 지목할 수 있어야 합니다.

> **참고**: 상태의 '연속성(Continuity)'은 AR의 선택적 조건일 뿐입니다. 일관성 경계와 전역 식별성만 존재한다면 충분히 AR의 역할을 수행할 수 있습니다.

---

## 3. 물리적 DB 스키마와 도메인 객체의 분리

객체 모델에서는 `Entry`를 양쪽 AR의 관점에 따라 각각의 객체로 분리하지만, RDBMS에 영속화할 때는 하나의 `entry` 테이블로 통합하는 것이 효율적입니다.

### DB 테이블 구조 (RDBMS)
데이터베이스는 정규화 원칙에 따라 외래키(FK)를 '자식 테이블' 쪽에 몰아서 설계합니다.
* `account` 테이블 (id, ...)
* `transaction` 테이블 (id, created_at, ...)
* `entry` 테이블 (id, **`transaction_id` (FK)**, **`account_id` (FK)**, amount, posted_at)

### 도메인 모델 로딩 (ORM / Repository)
DB에는 하나의 `entry` 테이블만 존재하지만, 애플리케이션으로 불러올 때 패러다임 불일치를 해소합니다.
* 계정 관점 조회 시: `SELECT * FROM entry WHERE account_id = ?` 쿼리를 통해 계정 내역 전용 VO(`AccountLedger`)로 변환하여 메모리에 올립니다. 이 목록이 올라가는 자리는 `Account` AR 안이 아니라 AR 경계 밖의 읽기 모델입니다(4절).
* `Transaction` 조회 시: `SELECT * FROM entry WHERE transaction_id = ?` 쿼리를 통해 대차대조 다리 VO(`TransactionLeg`)로 변환하여 메모리에 올립니다.

결론적으로 DB의 1개 테이블(1 row)이 메모리에 올라올 때는 각 관점의 목적에 맞는 2개의 다른 객체로 렌더링됩니다.

---

## 4. 완벽한 도메인 코드 모델링 예시

> **2026-09-29 정정.** 이 절의 코드 두 자리를 고쳤습니다 — `Account` 가 들고 있던 `List<AccountLedger>` 를 빼고, `TransferService` 가 한 호출에서 거래와 계정 셋을 저장하던 것을 `Transaction` 하나만 저장하도록 바꿨습니다. 근거는 [회계 배경 확정안](../research/accounting-context.md)의 3절(불변식 I4 — 잔액은 경계 밖에서 파생) · 4절(배정 — `Account` 에 Entry 컬렉션도 잔액 필드도 없음) · 8절 ④-b(지양) 입니다. 확정안 8절 ④-b 와 [Account 가이드](../ddd-analysis-pattern-guide/account/account-guide_v1.1.0.md) · [Transaction 가이드](../ddd-analysis-pattern-guide/transaction/transaction-guide_v1.0.0.md)의 「상황이 달라지면」 표가 「지양하는 형태」의 예로 드는 `List<AccountLedger>` 는 **정정 전의 이 코드**이고, 그 형태를 고르면 무엇을 치르는지는 그 표들이 설명합니다. 1~3절은 확정안과 어긋나지 않아 그대로 두었습니다.

"애그리거트 간에는 객체 참조 대신 ID로 참조하라", "각자의 문맥에 맞는 Entry VO 분리", "한 트랜잭션에서 고치는 애그리거트는 하나" — 세 원칙을 모두 적용한 이상적인 도메인 코드 흐름입니다.

```java
// ==========================================
// 1. Transaction AR의 관점 (저울의 다리)
// ==========================================
class TransactionLeg { 
    private final String accountId; // 외부 AR 참조는 ID로만!
    private final Money amount;
    // ... 생성자, getter
}

class Transaction { // << Aggregate Root >>
    private final String id;
    private final List<TransactionLeg> legs = new ArrayList<>();
    private boolean isPosted = false;

    void addLeg(String accountId, Money amount) {
        // 🌟 필수 조건: 전기된 거래는 구성이 바뀌지 않는다 (확정안 I2)
        if (isPosted) throw new IllegalStateException("전기된 거래는 바꿀 수 없습니다");
        legs.add(new TransactionLeg(accountId, amount));
    }

    // 🌟 필수 조건: 일관성 경계(합 0) 수호
    void post() {
        Money sum = legs.stream().map(TransactionLeg::getAmount).reduce(Money.zero(), Money::add);
        if (!sum.isZero()) throw new IllegalStateException("대차대조 불균형!");
        this.isPosted = true;
    }
}

// ==========================================
// 2. Account AR의 관점 (내역을 담지 않고, 받을 자격만 판정)
// ==========================================
class Account { // << Aggregate Root >>
    private final String id;
    private final String currency;
    private boolean closed = false;

    // Entry 목록도 잔액 필드도 두지 않는다. 잔액은 4번의 읽기 모델이 답한다.
    // Account가 동기적으로 지키는 규칙은 "이 계정이 이 금액을 받을 수 있는가" 하나뿐이다.
    void checkPostable(Money amount) {
        if (closed) throw new IllegalStateException("닫힌 계정입니다: " + id);
        if (!currency.equals(amount.getCurrency())) throw new IllegalStateException("계정 통화와 다릅니다: " + id);
    }
}

// ==========================================
// 3. Domain Service (조율자) — 한 번의 전기가 저장하는 AR은 Transaction 하나
// ==========================================
class TransferService {
    public void transfer(String fromAccountId, String toAccountId, Money amount) {
        // 1. 전기 자격 검사 — Account는 '읽기 전용 입력'으로만 쓴다(고쳐서 저장하지 않는다)
        accountRepo.findById(fromAccountId).checkPostable(amount.negate());
        accountRepo.findById(toAccountId).checkPostable(amount);

        // 2. Transaction AR 생성 및 Leg 검증
        Transaction tx = new Transaction(UUID.randomUUID().toString());
        tx.addLeg(fromAccountId, amount.negate());
        tx.addLeg(toAccountId, amount);
        tx.post(); // 합이 0인지 원자적 승인

        // 3. 영속화 — 이 트랜잭션이 저장하는 AR은 tx 하나뿐이다
        txRepo.save(tx);

        // 4. 계정 쪽은 고치지 않고, 일어난 사실만 알린다. 잔액은 이 이벤트에서 파생된다
        eventBus.publish(new TransactionPosted(tx.getId(), List.of(
                new AccountAmount(fromAccountId, amount.negate()),
                new AccountAmount(toAccountId, amount))));
    }
}

// ==========================================
// 4. 읽기 모델 (AR이 아님) — 계정별 내역과 잔액이 사는 곳
// ==========================================
record AccountAmount(String accountId, Money amount) {}
record TransactionPosted(String transactionId, List<AccountAmount> lines) {}

class AccountLedger { 
    private final String accountId;     // 어느 계정의 내역인가 — 역시 ID로만!
    private final String transactionId; // 외부 AR 참조는 ID로만!
    private final Money amount;
    private final LocalDateTime postedAt;
    // ... 생성자, getter
}

class AccountLedgerView {
    private final Map<String, List<AccountLedger>> byAccount = new HashMap<>();

    // 전기가 끝난 뒤 이벤트로 따라온다(결과적 일관성). Account AR은 건드리지 않는다
    void on(TransactionPosted event) {
        for (AccountAmount line : event.lines()) {
            byAccount.computeIfAbsent(line.accountId(), k -> new ArrayList<>())
                     .add(new AccountLedger(line.accountId(), event.transactionId(),
                                            line.amount(), LocalDateTime.now()));
        }
    }

    Money balanceOf(String accountId) {
        return byAccount.getOrDefault(accountId, List.of()).stream()
                        .map(AccountLedger::getAmount)
                        .reduce(Money.zero(), Money::add);
    }
}
```

### 요약
이처럼 설계하면 `Account`와 `Transaction`은 서로 완전히 독립된 일관성 경계를 유지합니다. 어느 쪽도 상대방 객체를 물리적으로 들고 있지 않으며(`ID`만 소유), 각자 자신만의 데이터 변형 통제권을 완벽하게 행사할 수 있습니다.

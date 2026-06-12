# 심화: Transaction과 Account의 관계 및 Entry 모델링

> 한 줄 요약: 복식부기 회계 도메인에서 `Transaction`과 `Account`라는 두 Aggregate Root 간의 결합도를 낮추고, `Entry`의 소속 딜레마를 해결하기 위한 객체 모델링 및 DB 매핑 가이드.
>
> 관련 패턴: [Account 패턴](account-pattern.md), [Transaction 패턴](transaction-pattern.md)

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
* `Account` 조회 시: `SELECT * FROM entry WHERE account_id = ?` 쿼리를 통해 계정 내역 전용 VO(`AccountLedger`)로 변환하여 메모리에 올립니다.
* `Transaction` 조회 시: `SELECT * FROM entry WHERE transaction_id = ?` 쿼리를 통해 대차대조 다리 VO(`TransactionLeg`)로 변환하여 메모리에 올립니다.

결론적으로 DB의 1개 테이블(1 row)이 메모리에 올라올 때는 각 AR의 목적에 맞는 2개의 다른 객체로 렌더링됩니다.

---

## 4. 완벽한 도메인 코드 모델링 예시

"애그리거트 간에는 객체 참조 대신 ID로 참조하라"는 원칙과 "각자의 문맥에 맞는 Entry VO 분리"를 모두 적용한 이상적인 도메인 코드 흐름입니다.

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
// 2. Account AR의 관점 (계정의 내역)
// ==========================================
class AccountLedger { 
    private final String transactionId; // 외부 AR 참조는 ID로만!
    private final Money amount;
    private final LocalDateTime postedAt;
    // ... 생성자, getter
}

class Account { // << Aggregate Root >>
    private final String id;
    private final List<AccountLedger> ledgers = new ArrayList<>();

    // Account 전용 내부 규칙을 통해 내역 기입
    void addLedger(String transactionId, Money amount) {
        ledgers.add(new AccountLedger(transactionId, amount, LocalDateTime.now()));
    }

    Money calculateBalance() {
        return ledgers.stream().map(AccountLedger::getAmount).reduce(Money.zero(), Money::add);
    }
}

// ==========================================
// 3. Domain Service (조율자)
// ==========================================
class TransferService {
    public void transfer(String fromAccountId, String toAccountId, Money amount) {
        // 1. Transaction AR 생성 및 Leg 검증
        Transaction tx = new Transaction(UUID.randomUUID().toString());
        tx.addLeg(fromAccountId, amount.negate());
        tx.addLeg(toAccountId, amount);
        tx.post(); // 합이 0인지 원자적 승인

        // 2. 검증 완료된 정보를 바탕으로 Account AR에 직접 갱신 지시
        Account fromAccount = accountRepo.findById(fromAccountId);
        Account toAccount = accountRepo.findById(toAccountId);
        fromAccount.addLedger(tx.getId(), amount.negate());
        toAccount.addLedger(tx.getId(), amount);

        // 3. 영속화
        txRepo.save(tx);
        accountRepo.save(fromAccount);
        accountRepo.save(toAccount);
    }
}
```

### 요약
이처럼 설계하면 `Account`와 `Transaction`은 서로 완전히 독립된 일관성 경계를 유지합니다. 어느 쪽도 상대방 객체를 물리적으로 들고 있지 않으며(`ID`만 소유), 각자 자신만의 데이터 변형 통제권을 완벽하게 행사할 수 있습니다.

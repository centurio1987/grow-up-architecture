# Account 패턴 — 잔액을 저장하지 않고 기록에서 계산하기

## 한눈에 보는 개요

잔액을 숫자 필드 하나로 두면 언제 왜 그 값이 됐는지 다시 확인할 수 없어요. Account 패턴은 금액이 오간 기록을 남기고, 잔액은 그 기록을 합산한 결과로 봅니다.

![예시 도식 — 구조 한 장](diagrams/sample.png)

분류는 회계 계열 분석 패턴이고, Transaction 패턴과 함께 쓰여요.

## 패턴 자세히 들여다보기

### 시나리오 1 — 월급이 들어오고 커피를 사기

1. 1일에 월급 3000000원이 들어옵니다. 계정 `급여통장` 에 +3000000 Entry 를 남겨요.
2. 3일에 커피 4500원을 씁니다. 같은 계정에 -4500 Entry 를 남기고, 앞의 Entry 는 손대지 않아요.
3. 잔액을 물으면 두 Entry 를 더해 2995500 을 돌려줍니다. 어디에도 잔액 숫자를 적어 두지 않았어요.

### 시나리오 2 — 잘못 적은 금액을 바로잡기

1. 3일의 커피가 실은 5400원이었다는 것을 5일에 알게 됩니다.
2. 3일 Entry 를 고치는 대신 -900 짜리 정정 Entry 를 5일 날짜로 새로 남깁니다.
3. 5일 기준 잔액은 세 Entry 의 합 2994600 이고, 4일 기준 잔액을 다시 계산하면 여전히 2995500 이 나와요. 과거가 바뀌지 않았기 때문이에요.

### 개념 정리

- **Account**: 기록이 모이는 이름표예요. 시나리오 1 의 `급여통장` 이고, 스스로 잔액 숫자를 들고 있지 않아요.
- **Entry**: 금액 하나가 계정에 오간 사실이에요. 한 번 남기면 고치지 않고, 시나리오 2 처럼 정정도 새 Entry 로 남깁니다.
- **Balance**: 특정 시점까지의 Entry 금액을 더한 값이에요.

![예시 도식 — 구조 한 장](diagrams/sample.png)

## 사용 목적

잔액이 어떻게 만들어졌는지 설명해야 하는 도메인에서 꺼냅니다. 이력을 물을 일이 없는 단순 카운터라면 숫자 필드가 더 가벼워요.

## 패턴의 경계

### 디자인 패턴을 충족하는 최소 조건

- [필수] 잔액은 Entry 합산으로 도출하고, 따로 덮어쓰지 않습니다. 시나리오 1 의 3단계가 그 계산이에요. (근거: Analysis Patterns 그림 6.1)
- [필수] 한 번 남긴 Entry 는 바꾸지 않고 정정도 새 Entry 로 남깁니다. 시나리오 2 의 2단계가 그 자리입니다. (근거: Analysis Patterns 6.1 절)
- [선택] 조회가 잦으면 합산 결과를 캐시로 둡니다. 시나리오 1 의 3단계를 매번 실행하기 부담스러울 때만요.

### 비슷한 패턴·안티패턴과의 차이

잔액 필드를 두고 변경 로그를 옆에 따로 쌓는 설계도 닮아 보여요. 시나리오 2 의 2단계를 그 설계로 실행해 보면 필드는 고치고 로그는 남기는 두 갈래 작업이 되고, 둘이 어긋났을 때 어느 쪽이 맞는지 정할 기준이 없습니다. 시나리오 1 의 3단계처럼 잔액을 계산 결과로만 두면 어긋날 두 값이 애초에 없어요.

## 구현 예시

### 상황 설정

| 항목 | 이 가이드의 전제 |
| --- | --- |
| bounded context | 가계부 회계 — 한 사람의 수입과 지출을 기록한다 |
| 불변식의 위치 | Entry 금액 합 = 잔액, Account 경계 밖에서 계산 |
| root · entity · VO 배정 | Entry 는 root, Money 는 VO |
| 다른 aggregate 참조 방식 | Entry 가 Account 를 id 로 참조 |

### 구현

```java
import java.util.List;

record Entry(String accountId, long amount) {}

public final class Ledger {
    public static long balance(List<Entry> entries, String accountId) {
        return entries.stream().filter(e -> e.accountId().equals(accountId)).mapToLong(Entry::amount).sum();
    }
}
```

```typescript
interface Entry {
  readonly accountId: string;
  readonly amount: number;
}

export function balance(entries: readonly Entry[], accountId: string): number {
  return entries.filter((e) => e.accountId === accountId).reduce((sum, e) => sum + e.amount, 0);
}
```

```rust
struct Entry {
    account_id: String,
    amount: i64,
}

fn balance(entries: &[Entry], account_id: &str) -> i64 {
    entries.iter().filter(|e| e.account_id == account_id).map(|e| e.amount).sum()
}
```

## 스스로 점검하기

**1. 책임 옮기기.** Entry 를 수정할 수 있게 열어 두면 지난달 잔액을 다시 계산했을 때 무엇이 달라질까요?

> 풀이 — 고친 Entry 가 지난달 합에 들어가 지난달 잔액이 바뀝니다.

## 참고 자료

- Martin Fowler, *Analysis Patterns*, Addison-Wesley, 1996 — Account 장(그림 6.1).

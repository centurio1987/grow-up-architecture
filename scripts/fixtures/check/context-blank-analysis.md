# Account 패턴 — 잔액을 저장하지 않고 기록에서 계산하기

## 한눈에 보는 개요

잔액을 숫자 필드 하나로 두면 언제 왜 그 값이 됐는지 되짚을 수 없어요. Account 패턴은 금액이 오간 기록을 남기고, 잔액은 그 기록을 합산한 결과로 봅니다.

![예시 도식 — 구조 한 장](diagrams/sample.png)

분류는 회계 계열 분석 패턴이고, Transaction 패턴과 함께 쓰여요.

## 패턴 자세히 들여다보기

### 등장하는 개념과 정의

- **Account**: 기록이 모이는 이름표예요. 스스로 잔액 숫자를 들고 있지 않아요.
- **Entry**: 금액 하나가 계정에 오간 사실이에요. 한 번 남기면 고치지 않습니다.
- **Balance**: 특정 시점까지의 Entry 금액을 더한 값이에요.

![예시 도식 — 구조 한 장](diagrams/sample.png)

### 동작 절차

1. 거래가 일어나면 Entry 를 새로 남깁니다. 기존 Entry 를 고치지 않아야 과거 잔액을 다시 계산할 수 있어요.
2. 잔액이 필요할 때 해당 계정의 Entry 를 모아 금액을 더합니다.

## 사용 목적

잔액이 어떻게 만들어졌는지 설명해야 하는 도메인에서 꺼냅니다. 이력을 물을 일이 없는 단순 카운터라면 숫자 필드가 더 가벼워요.

## 패턴의 경계

### 디자인 패턴을 충족하는 최소 조건

- [필수] 잔액은 Entry 합산으로 도출하고, 따로 덮어쓰지 않습니다. (근거: Analysis Patterns 그림 6.1)
- [필수] 한 번 남긴 Entry 는 바꾸지 않고 정정도 새 Entry 로 남깁니다. (근거: Analysis Patterns 6.1 절)
- [선택] 조회가 잦으면 합산 결과를 캐시로 둡니다.

### 비슷한 패턴·안티패턴과의 차이

잔액 필드를 두고 변경 로그를 옆에 따로 쌓는 설계도 닮아 보여요. 그 설계에서는 로그와 필드가 어긋날 수 있고, 어긋났을 때 어느 쪽이 맞는지 정할 기준이 없습니다.

## 구현 예시

### 상황 설정

| 항목 | 이 가이드의 전제 |
| --- | --- |
| bounded context | 가계부 회계 — 한 사람의 수입과 지출을 기록한다 |
| 불변식의 위치 |  |
| root · entity · VO 배정 | 해당 없음 |
| 다른 aggregate 참조 방식 | - |

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

Entry 를 수정할 수 있게 열어 두면 지난달 잔액을 다시 계산했을 때 무엇이 달라질까요?

## 참고 자료

- Martin Fowler, *Analysis Patterns*, Addison-Wesley, 1996 — Account 장.

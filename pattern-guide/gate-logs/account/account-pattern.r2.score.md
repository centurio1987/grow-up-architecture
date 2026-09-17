## Account 가이드 2라운드 재채점

잠정 결론은 **FAIL**입니다. 1라운드 미흡 다섯 건은 모두 해소됐지만, 고친 구역에서 **새 MUST 미흡이 2건** 생겼습니다(AG6, E1). 둘 다 몇 줄만 고치면 됩니다.

```
판정 요약
MUST          통과 32 / 전체 33   (명세 원칙. 미흡: AG6)
SHOULD        미흡 0개            (PG20·PG26 충족)
IF-APPLICABLE 충족 3 (PG10·AG10·AG12) / 해당없음 0 / 미흡 0
공통 루브릭    A 충족 · E 미흡(E1) · F 충족 · V 충족(V1 계수 2, V2·V3 충족, V4는 메인 합산)
잠정 결론      FAIL — 새 MUST 미흡 2건(AG6, E1). 공통 MUST 합산 시 40 / 42
```

## 1라운드 미흡 해소표

| 코드 | 1라운드 지적 | 현재 본문 근거 | 판정 |
| --- | --- | --- | --- |
| AG4 | 표의 "팩토리"가 정의 없음 | 303: "`Transaction` root 의 Factory `Transaction.create`" / 312 "**Factory**(팩토리): 불변식을 검사한 뒤에만 aggregate 를 만들어…" / 313 Repository / 314 도메인 서비스 | 해소 |
| E1 | 개요(22)가 역분개를 패턴 성질처럼 서술 | 22: "확정된 기록은 고치지 않고, 바로잡을 때도 Entry 를 새로 더합니다. 이 글의 예에서는 … (역분개)를 씁니다." / 202: "정정 방식을 역분개로 정한 것은 이 가이드의 정책" | 해소 |
| E2 | TigerBeetle "posted 누적값만" | 1068: "`debits_pending` · `debits_posted` · `credits_pending` · `credits_posted` 네 누적값만" (1라운드에 원문 대조로 확인) | 해소 |
| V1 | 그림 없이 이어진 산문 최장 3 | `golden.py measure` 의 `max_prose_run_without_visual` = **2**. 줄 단위 재계수도 최장 2(20·39·156·196·222·319·1008·1103). register: 존댓말 종결 73 / 평서체 종결 0 | 해소 |
| V2 | 1240 "두 root 안에 동시에 들어갈 수 없어서"에 반례 없음 | 1019: "왜 안 되는지는 개요의 숫자로 확인할 수 있습니다" + 1021~1030 도식("거래 쪽 … 70,000 / 계정 쪽 … 100,000 → … 어느 쪽이 맞는지 정한 규칙이 없음") + 1040이 이어받음 | 해소 |

1라운드 관찰 사항도 반영됐습니다.
- 이벤트가 Entry 객체 대신 값만 담습니다(442 / 638 / 859).
- 152 "캐시할 수 있다고"로 어조를 바로잡았습니다.
- 자본 계정을 추가했습니다(64 · 115 · 207 · 272).
- 부호 규약에 hledger 출처가 붙었습니다(115).

## 새 미흡 목록

**1. E1 모순 없음 — 한 곳은 부호 해석이 규약과 반대이고, 한 곳은 "조건마다"라는 말이 사실과 다릅니다**

(a) 부호 해석
- 인용
  - 1010: "그대로 전기하면 현금은 100,000 늘고 매출은 90,000 만 줄어 합이 10,000 어긋난 거래가 원장에 남아요."
  - 115: "부채·자본·수익 계정이 늘면 − 예요"
  - 996: "수익 계정은 − 방향으로 늘어남"
- 문제: 글의 규약으로는 매출 −90,000 이 수익 90,000 증가입니다. 1010은 이것을 "줄어"라고 읽었습니다.
- 고칠 곳: 1010을 "현금에는 +100,000, 매출에는 −90,000 만 기록돼 합이 +10,000 인 거래가 원장에 남아요"로 바꿉니다.

(b) 근거 표기
- 인용
  - 196: "조건마다 근거가 원서 그림인지, Fowler 의 후속 초안(eaaDev)인지, 이 가이드의 정책인지를 괄호로 밝혔어요."
  - 206(조건 5)과 209(조건 8)에는 근거 괄호가 없습니다.
- 고칠 곳
  - 206 끝에 "(근거: 이 가이드의 정책 — 확정안 I5)"를 붙입니다.
  - 209 끝에 "(근거: eaaDev Account 의 잔액 캐시)"를 붙입니다.
  - 또는 196을 "필수 조건마다"로 좁힙니다.

**2. AG6 표와 구현 1:1 — TypeScript의 `AccountAmount` 에 값으로 같음을 판단하는 수단이 없습니다**
- 인용: 304 "`Money` · `AccountAmount` = VO" / TS 571~574 `interface AccountAmount { readonly accountId; readonly amount }`
- 세 펜스 비교
  - Java 368은 `record` 라서 값 비교가 기본입니다.
  - Rust 785는 `#[derive(… PartialEq, Eq)]` 입니다.
  - TS에는 비교 수단이 없어 `===` 참조 비교만 남습니다.
  - 같은 펜스의 VO `Money` 는 566에 `equals` 를 두었습니다.
- 경미한 건이고, 불변성은 625 `Object.freeze({ ...line })` 로 지켜집니다.
- 고칠 곳: TS에 한 줄을 추가합니다.
  - 예: `const sameAmount = (a: AccountAmount, b: AccountAmount) => a.accountId === b.accountId && a.amount.equals(b.amount);`
  - 또는 `Money` 처럼 `equals` 를 가진 클래스로 바꿉니다.
  - 해설 1013에 "VO 는 값으로 비교"를 한 구절 덧붙입니다.

**관찰(판정 아님)**
- 115와 132에서 "posting"이 두 뜻으로 쓰입니다. 115의 "posting 금액"(hledger의 거래 한 줄 = Entry)이 132 "전기(posting)"(기록하는 행위)보다 먼저 나옵니다. 115에서 "posting(hledger 에서 Entry 에 해당하는 한 줄)"로 한 번 풀어 주기를 권합니다.
- 207: "자산·부채·자본·수익·비용 … (원서 그림 6.20 · 6.28)". 노트 941에 따르면 그림 6.28은 Asset·Liability·Income·Expense이고 자본은 없습니다. 괄호를 "계정 종류(원서 그림 6.20), 분류 예(그림 6.28)"로 나누기를 권합니다.
- 코드는 같은 거래 id를 거절합니다(479 / 678 / 902). 확정안 6절 5단계는 `(sourceRef, postingRuleId)` 중복이면 기존 거래를 돌려줍니다. 키가 다르고 가이드가 I3를 제외했으므로(321) AG9 모순은 아닙니다. Transaction 가이드에서 두 동작을 맞춰야 합니다.
- AG9: 확정안 파일은 1라운드와 같습니다(165줄, "잠정"). 추가된 내용(303 ② "Entry 객체를 밖으로 내보내지 않음", 304 `AccountAmount` VO·값만 담는 이벤트, ③ 폐쇄 경합 허용)은 확정안 I2·I5·4절과 부딪히지 않고, 경계를 새로 정한 것도 없습니다.

## 사실 확인 결과

**실행 검증**
- 공식 컴파일 검사 `check-guides.py --compile` 가 PASS입니다(javac 21.0.11 · tsc 5.9.3 · rustc 1.95.0, edition 2021).
- 추출한 세 펜스를 직접 실행하니 출력이 모두 **9줄**이고 서로 diff 0이며, 988~998 표와 일치합니다.
- 1011: 계정 확인을 저장 뒤로 옮기면 가수금 Entry 합이 `-50000 KRW` 이고, 올바른 순서로 T6 역분개를 전기하면 "가수금 계정은 닫혀 있습니다"로 거절됩니다. 131의 서술과도 일치합니다.
- 1118: 건너뛰기 줄을 지우면 현금 `175000 KRW (Entry 합과 같음: false)`, 매출 `-200000 KRW` 입니다. 일치합니다.

**AG6~AG8 세 펜스 확인**(AccountAmount 동등성 건 외에는 충족)
- root는 Account와 Transaction뿐입니다. Entry는 `seq` 로 비교합니다(398 / 597 / 814).
- Account 필드(371~376 / 578~584 / 789~795)와 Transaction 시그니처(`create(TransactionId, 날짜, AccountAmount 목록)`, `reverse`, `lines()`)에 다른 aggregate 타입이 없습니다.
- Entry는 밖으로 나가지 않습니다(`private`, `lines()` 는 값만 돌려줌: 438 / 634 / 855). 상태 변경은 root의 `close()` 뿐입니다.

**WebFetch·원문 대조**
- **hledger 부호 규약(115)**: 원문 "Positive and negative posting amounts represent debits and credits respectively." / "(Some reports show revenue, liability and equity account balances as negative numbers as a result; this is normal.)" → 일치합니다.
- **DDD Reference 정의(312~314, 1133)**: Building Blocks 절에 Entities · Value Objects · Domain Events · Services · Modules · Aggregates · Repositories · Factories가 있습니다.
  - Factory: "Create an entire aggregate as a piece, enforcing its invariants." → 312와 일치
  - Repository: "illusion of an in-memory collection … Provide methods to add and remove … select objects" → 313은 식별자 조회로 좁혔지만 틀리지 않음
  - 도메인 서비스: 원문은 "not a natural responsibility of an entity or value object … standalone interface declared as a service"입니다. 314의 "여러 aggregate 를 식별자로 찾아 함께 다루는"은 원문보다 좁은 예시이고, 1133 설명에는 Services가 빠져 있습니다(경미, 판정 없음).
- **Vernon Part I(1037, 1134)**: 원문 "Rule: Design Small Aggregates" / "will keep growing over time. We would likely need to load thousands and thousands of objects" / "a properly designed bounded context modifies only one aggregate instance per transaction" → 일치합니다.
- **TigerBeetle pending(1068)**: 1라운드에 Account 문서를 대조해 네 필드 모두 TigerBeetle이 갱신한다고 확인했고, 현재 서술과 일치합니다.
- 나머지 새 서술(57 whenCharged/whenBooked, 60 Transaction 선택성, 204 Money Bag, 1049 오래된 Entry 정리)은 리서치 노트 915 · 931 · 924 · 923에 있고 출처 링크도 붙어 있습니다.

## 분량 관찰
구현 코드는 Java 203줄 · TypeScript 201줄 · Rust 230줄로 문서의 약 56%입니다. 1002~1006의 필드 대조 표가 핵심 선언을 따로 보여 주고, 거절 시나리오도 2건으로 줄어서, 지금 길이는 이해에 방해가 되지 않는다고 봅니다.

(참고: `golden.py measure` 의 문체 등급은 A(S2 코드 R5 한 건)입니다. 문체 등급 합산은 메인에 맡깁니다. 임시 파일은 scratchpad의 `acct/r2/` 에만 두었고 채점 대상 파일은 고치지 않았습니다.)
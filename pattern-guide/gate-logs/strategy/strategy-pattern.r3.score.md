3라운드 재채점 결과는 PASS 입니다. 2라운드 미흡 넷이 모두 해소됐고, 새 미흡은 없습니다(막지는 않는 권고 넷). 새 실험 표와 `AnyPlan` 실행 결과는 전부 그대로 재현됐습니다.

```
판정 요약 (3라운드, 878줄)
MUST          통과 36 / 전체 36   (spec 27/27 · 공통 9/9)
SHOULD        미흡 0개            (PG20·PG26·A4·E4·F2·V3 충족, V4 는 메인 몫)
IF-APPLICABLE 충족 2(PG10·GG5) / 해당없음 0 / 미흡 0
공통 루브릭    A 충족 · E 충족 · F 충족 · V 충족
잠정 결론      PASS — (H축과 문체 등급은 메인이 합산)
```

**승계 표시:** 바뀌지 않은 구역은 1·2라운드 판정을 승계했습니다. 해당 항목은 PG1·PG4·PG16~PG19·PG21~PG23·GG1·GG4·GG5·E4·F2 입니다. 다만 구현 세 펜스는 다시 컴파일·실행해 출력이 같음을 확인했습니다. V1 은 `golden.py measure` 의 `max_prose_run_without_visual: 2` 로 충족입니다. 본문 URL 집합과 참고 자료 URL 집합의 차이는 0이고, 금지 문형 grep 결과도 0건입니다.

## 2라운드 미흡 해소표

| 항목 | 판정 | 현재 본문 근거 |
| --- | --- | --- |
| GG3 (1번 "별도 단위") | 해소 | 204 "계산 방법마다 그 연산을 구현한 별도 단위(클래스나 함수 값)가 있고, 한 구현의 연산 안에 계산 방법을 고르는 분기가 없습니다. 같은 클래스의 객체 여럿이 필드 값만 다르고 계산 코드는 같다면(`FlatRate(3_000)` 과 `FlatRate(5_000)`) … 만족합니다". 반례는 206 `AnyPlan` |
| E2 (불가능 주장) | 해소 | 216 "1번만 빠지고 2·3번은 만족하는 코드가 실제로 있어서", 241–246 판정표(`AnyPlan` 행: 1번 빠짐 · 2·3번 만족 → Strategy 아님) |
| E1 (분기 코드 기준 vs 권역 요금) | 해소 | 269·345 "Context 의 계산 코드에 새 방법의 이름(`case` 값·메서드 이름)을 더해야 하는가", 722 "이것은 계산 코드에 새 방법의 이름을 넣는 변경이 아니라 … 공통 연산 모양을 넓히는 변경이라, 분기 코드로 돌아가는 것과는 달라요" |
| A2 (API) | 해소 | 766 "Javadoc(Java 소스 주석에서 만들어 내는 라이브러리 설명 문서)". 첫 등장 약어 전수 확인: SE·UTF-16·MDN 모두 풀어 씀 |

바뀐 구역에서 새로 걸리는 것은 없었습니다.
- PG9: 1번 반례 205·206, 3번 반례 210·211.
- PG14: `AnyPlan` 펜스는 `java no-compile`.
- 비교 절:
  - State(266·298): 3번과 일관됩니다. "전이를 누가 정하든 State … 3번에 따라 이 코드를 Strategy 로도 판정하지 않아요"
  - Command(262·331): "필드 모양은 기준으로 쓰지 않아요". 노트 129(받는 객체 없는 명령 허용)와 맞습니다.
  - Template Method(267·329): "계산 순서는 두 쪽 다 고정돼요".
- 4-c(92): 원서 구현 쟁점 1 "the strategy can store a reference to its context" 로 확인했습니다.

## 새 미흡
없습니다. 아래는 막지는 않는 권고입니다.

1. **196:** "매개변수를 하나 더 넓힐 때마다 여섯 구현의 시그니처를 모두 함께 고쳐야 합니다(구현 해설에서 실제로 컴파일해 봅니다)"
   - TypeScript 에서 인터페이스만 `fee(subtotal, weightGrams, zone)` 로 넓히고 구현 셋을 그대로 둬도 tsc strict 가 통과하고, 출력도 원래와 같았습니다(직접 확인).
   - 730 규칙(매개변수가 적으면 1번 빠짐)으로 보면 "고쳐야 한다"는 여전히 맞아서 미흡으로 보지는 않았습니다.
   - 고칠 곳: 괄호를 "(Java·Rust 는 컴파일러가 막고, TypeScript 는 통과하므로 1번을 지키려면 직접 맞춰야 함)"으로 바꾸면 정확합니다.
2. **730:** "같은 연산 모양이려면 매개변수의 개수와 순서마다의 뜻까지 같아야 함"
   - "뜻"은 코드로 판정할 수 없습니다.
   - "개수까지 같아야"를 적용하면 `{ fee: () => 3_000 }` 같은 TS 관용 전략도 1번이 빠집니다.
   - 고칠 곳: "앞쪽 매개변수를 빼거나 순서를 바꿔 자리가 어긋나면 빠짐(뒤쪽을 생략하는 것은 허용)"처럼 자리 기준으로 쓰면 코드로 판정할 수 있습니다.
3. **718 `Object` 행:** 캐스트로 부르는 경우의 판정이 명시돼 있지 않습니다. 필드 타입이 `Object` 라서 2번이 빠진다는 말을 끝에 붙이면 됩니다.
4. **204 "계산 방법을 고르는 분기":** 구현 절 `FreeOverThreshold` 의 `subtotal >= threshold ? 0 : amount` 와 가르는 기준을 한 구절 더하면 analyzer 판정이 확실해집니다. 예: "호출 인자를 보지 않고 생성 때 정한 종류 값(`plan` 같은)만으로 서로 다른 계산식을 고르는 분기".

## 재현 결과
모두 Java 21.0.11 · rustc 1.95.0 · tsc 5.9.3 strict · Node 22.22.3 에서 확인했습니다.

| 본문 주장 | 결과 |
| --- | --- |
| 728 Java `ByWeight.fee(long weightGrams)` | `ByWeight is not abstract and does not override abstract method fee(long,long) in ShippingPolicy` 일치 |
| 729 Rust 같은 변경 | `error[E0050]: method fee has 2 parameters but the declaration in trait ShippingPolicy::fee has 3` 일치 |
| 730 TS 같은 변경 | 컴파일 통과, `weight: A=80000 B=145000` 일치. 32 × 1,500 + 32,000 = 80,000 · 58 × 1,500 + 58,000 = 145,000 |
| 731 `((ByWeight) policy).fee(...)` | 컴파일 통과, 첫 출력 전에 `ClassCastException: class FlatRate cannot be cast to class ByWeight` 일치 |
| 732 Java `zone` 추가 | 고치기 전에는 세 구현 모두 `does not override abstract method fee(long,long,String)`, 세 구현을 고친 뒤에는 출력 세 줄이 원래와 동일. 일치 |
| 239 `AnyPlan` + 구현 절 `Checkout` | 32,000원·2,300g 주문에서 `"weight"` 36500 · `"flat"` 35000. 일치 |
| 196 6 × 5 = 30, 쓰는 값 6 | 일치 |
| 129 배송비만 바뀔 때 1 + m 대 2 + m | 일치 |
| 734 TS Handbook 인용 | WebFetch 로 확인: "the names of the parameters are not considered" 와 매개변수가 적은 함수 허용 설명. 일치 |

## 3번 조건 판단
원서 문자보다는 강하지만, 원서의 동기와 결과가 받치는 해석입니다.

**근거:**
- 협력 절은 "Clients **usually** create and pass a ConcreteStrategy"(노트 13)로 예외를 열어 둡니다.
- 반면 동기는 "The client of Composition specifies which Compositor should be used by installing …"이고, 결과는 "a client must understand how Strategies differ before it can select"와 조건문 제거입니다. 둘 다 Client 가 고른다는 쪽이고, Context 안 `switch` 선택은 조건문 제거와 정면으로 어긋납니다.
- 원서 Strategy 페이지(unc.edu 사본)에서 Context 가 직접 전략을 고르거나 바꾸는 서술은 찾지 못했습니다.

**권고:**
- 첫 절 "선택이 Context 밖"은 [필수] 유지가 방어 가능합니다. 다만 3번 문구에 "원서는 'usually' 로 적었고, 이 가이드는 조건문 제거와 Client 가 전략 차이를 안다는 결과를 근거로 필수로 둔다"는 근거를 밝혀 두는 것이 정확합니다.
- 둘째 절 "요청 처리가 선택을 바꾸지 않음"은 원서에 직접 근거가 없는 가이드 자체 확장입니다. 298 이 "원서는 이런 적응형 선택을 따로 다루지 않고"로 이미 일부 밝혔습니다.
- 유저에게는 둘째 절을 [필수]로 둘지 [선택]으로 내릴지를 묻는 것이 핵심입니다.

재현에 쓴 파일은 스크래치패드 `/private/tmp/claude-501/-Users-centurio-design-pattern-guide/548f6b02-e307-4d44-899e-76d3cf3468b5/scratchpad/strat/r3/` 에만 있고, 가이드는 고치지 않았습니다.
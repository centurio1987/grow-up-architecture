2라운드 잠정 결론은 PASS입니다. 1라운드에서 막혔던 A2·A3·E2는 셋 다 해소됐고, 고친 구역에서 새 MUST·SHOULD 미흡은 나오지 않았습니다. 세 언어 코드를 직접 컴파일·실행해 11행 출력과 역방향 환산이 같게 나오는 것을 확인했습니다.

```
판정 요약 (2라운드)
MUST          통과 40 / 전체 40   (명세 MUST 31/31, AG9·AG11 은 회계 3편 전용이라 해당없음 · 공통 MUST 9/9)
SHOULD        미흡 0개            (PG20·PG26·A4·E4·F2·V3 충족, V4 등급은 메인 몫 — check 출력은 A)
IF-APPLICABLE 충족 3(PG10·AG10·AG12) / 해당없음 0 / 미흡 0
공통 루브릭    A·E·F·V 모두 충족
잠정 결론      PASS (H축과 문체 등급은 메인이 합산)
```

파일 대부분이 바뀌어서 "승계"로 넘긴 항목은 없고, 전 항목을 현재 본문으로 다시 봤습니다.

## 1. 1라운드 미흡 해소 여부

| 코드 | 1라운드 지적 | 현재 본문 근거 | 판정 |
| --- | --- | --- | --- |
| A2 | 약어 PoEAA·DDD·JEP·FHIR·UCUM·JSR 을 풀지 않음 | 25: "PoEAA(『Patterns of Enterprise Application Architecture』)" · 237: "DDD(Domain-Driven Design, 도메인 주도 설계)" · 848: "JEP(JDK Enhancement Proposal) 395" · 867: "HL7 FHIR(Fast Healthcare Interoperability Resources)는 … UCUM(Unified Code for Units of Measure)은 … JSR(Java Specification Request) 385" | 해소 |
| A2 (새 약어) | — | 186: "IEEE 754(2진 부동소수점 표준)" · 848: "JSON(JavaScript Object Notation)" · 850: "NaN(Not a Number)" · 867: "API(Application Programming Interface)" | 충족 |
| A3 | "값 객체"가 정의 전에 나옴, "newtype" 정의 없음 | 121: "별도 값 객체(식별자 없이 값으로 같음을 판단하는 불변 객체)로". "newtype" 은 grep 결과 0건이라 문장째 빠졌습니다 | 해소 |
| E2 | id 참조 정의를 DDD Reference 에 잘못 기댐 | 237: "앞의 다섯은 Evans 의 DDD Reference 를 따르고, 마지막 id 참조는 Vernon 의 aggregate 설계 규칙에서 왔습니다" · 244: "Vernon 의 규칙 \"Reference Other Aggregates By Identity\" 입니다([Effective Aggregate Design Part II](…))" · 931: "Bounded Context 2쪽" · 932: Vernon 참고 자료 추가 | 해소 |

## 2. 새 미흡: 없음

바뀐 구역마다 무엇을 확인했는지 적습니다.

**바뀐 `[필수]` 조건 (AG2 개념 판정 · PG9 반례)**
- 1번: 150: "도메인 연산이 양을 주고받을 때 수치만 넘기지 않습니다". 책임으로 적혀 있고, 반례는 151 `onHandKg: number` 입니다.
- 2번: 152: "곱하기·나누기를 제공한다면 결과 단위를 정합니다". 제공할 때만 걸리는 개념 조건이고, 반례는 153 `Weight` 입니다.
- 3번: 154: "수치와 단위가 같은 두 Quantity 는 같은 값으로 판정합니다. 그리고 한 곳의 계산이 같은 값을 쓰던 다른 곳을 바꾸지 않아요". 불변은 수단으로만 들고 조건으로 삼지 않아 클래스 구조 조건이 아닙니다. 반례는 155 "복사도 하지 않으면 … aliasing bug" 입니다.
- 점검 문제 1의 풀이(900)도 새 문구 "한 곳의 계산이 다른 곳을 바꾸지는 않지만"에 맞춰져 있습니다.

**새 코드 (`convertTo`·`times`·얼린 id) — 세 언어 동작과 AG6~AG8**
- 세 펜스를 뽑아 javac 21, tsc(strict + noUncheckedIndexedAccess) → node, rustc 2021 로 실행했습니다. 세 출력이 서로 같고, 799–811행 표 11행과도 글자 단위로 같습니다.
- 표 밖 동작도 따로 넣어 봤고 세 언어가 같습니다.
  - 1000 g → kg 는 `1 kg`, 1500 g 는 `1.5 kg`, −1500 g 는 `-1.5 kg` 입니다. 838행 주장과 일치합니다.
  - 1500.5 g → kg 는 "kg 로 옮기면 소수점 아래 세 자리를 넘습니다"로 거부됩니다.
  - 0.3 kg + 100 g 는 `400 g`, 100 g − 0.05 kg 는 `50 g`, 0.001 kg × 3 는 `0.003 kg` 입니다.
- 850행 주장도 확인했습니다. 10¹³ kg → g 에서 Rust 만 "수치가 표현 범위를 넘었습니다"를 내고, Java·TypeScript 는 `10000000000000000 g` 을 냅니다.
- Java: `new Quantity(ONE, null)` 는 "단위가 없습니다"로 거부됩니다(278 `Objects.requireNonNull(unit, …)`).
- TypeScript id: 얼린 `StockId` 의 `value` 에 대입하면 런타임 TypeError 가 납니다. `const wrong: StockId = new IngredientId(…)` 는 **TS2322** "Types have separate declarations of a private property 'brand'"로 막힙니다. 848행 주장과 일치합니다.
- AG6: root 타입은 세 펜스 모두 `IngredientStock` 하나입니다. 역방향 환산 자릿수 검사는 표 233행이 Quantity 몫으로 둔 대로 Java 323 · TypeScript 497 · Rust 694 의 `convertTo` 안에 있습니다. root 몫인 양수·음수 검사는 Java 365/372 · TypeScript 553/555 · Rust 748/750 에 있고, 음수 검사는 교체보다 앞입니다.
- AG7: `IngredientStock` 의 필드와 시그니처에 다른 aggregate 타입이 없습니다(Java 355 · TypeScript 541 · Rust 728).
- AG8: `onHand()` 는 불변 Quantity 만 돌려주고, `convertTo` 는 새 값을 돌려줍니다.
- PG19: `times(long)` / `times(bigint)` / `times(i64) -> Result` 는 언어 관용 차이의 범위입니다.

**나머지 바뀐 구역**
- PG5: 3-b 의 이유 81 "이렇게 고른 이유는 아래 그림에서", 4-b 의 이유 85 "저울로 잰 양과 장부가 달라지기 때문이에요"가 붙어 있습니다.
- PG6: 114행이 관찰 가능한 단서로 바뀌었습니다.
- PG7: 121–142행에 조회수 모델과 3항목 대조표가 들어왔습니다.
- PG12·PG13: 비교표 165–168행의 구분 기준과 얻는 것·포기하는 것이 유지됩니다.
- PG14: 174 `typescript no-compile` · 190 `java no-compile` 입니다.
- PG24·PG25: 새로 들어온 링크 4개(Currency 47, Vernon 244, Type Compatibility 848, UnitConverter 874)가 그 자리에 달려 있고 참고 자료에도 있습니다. 본문 링크 23개 모두 참고 자료에 있습니다.
- AG3~AG5: 표 230–235행은 4행이고 라벨 순서가 같습니다.
- AG10: 858행 "(이 가이드)" 행이 234행 서술과 일치합니다.
- AG12: 874행에 UnitConverter 대응이 들어 있습니다.
- V1: `golden.py measure` 의 `voice_compliance.max_prose_run_without_visual` = **2** 라 충족입니다. 평서체 종결 4건은 104행 기억법 인용 블록뿐입니다.
- V2: 금지 문형 grep 결과 0건입니다.
- V3: `device_traces` 에 7종 흔적이 있습니다.

**판정에 영향 없는 참고 (선택)**
- 838: "**고친 코드로** 실행하면"은 개정 이력처럼 읽힙니다. "방향을 가르는 이 줄이 있는 본문 코드로"로 바꾸기를 권합니다.
- 828: "id 로만 가리키면 재고 코드에서 카탈로그를 바꿀 길이 없습니다"는 조금 넓습니다. 저장소로 불러와 바꾸는 길은 남아 있으니 "재고 객체를 거쳐서는"으로 좁히는 편이 정확합니다.
- 126행 `Post` 펜스는 오인 코드가 아니라 PG14 대상은 아닙니다. 다만 `PostId` 정의가 없어 단독으로는 컴파일되지 않습니다.
- 수치 파싱이 언어마다 조금 다릅니다. Java `BigDecimal` 은 "1e3"·".5"를 받고 TypeScript·Rust 는 거부하며, Rust 는 "+5"도 받습니다. 시나리오 밖이라 PG19 에는 영향이 없습니다.

## 3. 사실 확인 결과

| 주장 (행) | 확인 방법 | 결과 |
| --- | --- | --- |
| FHIR qty-3 는 조건부이고 `code` 필수가 아님 (878) | WebFetch 요약이 qty-3 을 엉뚱한 문장으로 돌려줘 원본 HTML 을 받아 grep | "qty-3 Rule (base) If a code for the unit is present, the system SHALL also be present", `code : code [0..1]`, "implicit precision" — **일치** |
| UnitConverter `inverse`·`concatenate`·`isLinear` (874) | WebFetch javadoc | "Returns the inverse of this converter." · "Concatenates this converter with another converter." · "Indicates whether this converter represents a (one-dimensional) linear transformation." — **일치** |
| Fowler bliki: 불변을 먼저, 복사도 가능 (154) | WebFetch | "immutability is my favorite technique to avoid aliasing bugs, it's also possible to avoid them by ensuring assignments always make a copy" — **일치** |
| TypeScript private 멤버가 호환성을 가름 (848) | WebFetch Handbook + tsc 실측 | "if the target type contains a private member, then the source type must also contain a private member that originated from the same class" · TS2322 발생 — **일치** |
| IEEE 754 오차 (182–186) | node 실측 | 연쇄 `minus` 결과 `-2.7755575615628914e-17` — **일치** |
| 36.5 = 73/2 는 정확히 표현됨 (904) | node 실측 | 이진 표기 `100100.1` — **일치** |
| i64 넘침 (850) · 역방향 환산 (838) · 11행 출력 (799–811) | 세 언어 실행 | **일치** |

## 4. 상황 설정 표 칸별 관찰의 변화 (판정 아님)

- **불변식의 위치:** 원래 정보량이 높았던 칸입니다. 824–828행 「표의 칸을 거꾸로 바꿔 보면」 표의 1·2행이 이 칸이 무엇을 막는지 반례로 보여 줘서 더 단단해졌습니다.
- **root·entity·VO 배정:** 234행이 ConversionRatio 를 "어느 aggregate 에도 속하지 않는 공유 상수 표"로 정확히 적어 조금 나아졌습니다. 다만 root/entity 부분은 여전히 예제를 받치는 내용입니다.
- **타 aggregate 참조 방식:** 235행에 VO 관점 한 문장("같은 인스턴스를 함께 써도 복사한 것과 결과가 같다")이 붙었고, 828행 반례 행이 `IngredientId` 의 쓸모를 보여 줍니다. 코드가 이 칸을 실제로 실행하지 않는다는 점은 그대로입니다.
- **bounded context:** 변화가 없고 정보량은 여전히 낮습니다.
- **1.1 에 넘길 것:** 「표의 칸을 거꾸로 바꿔 보면」 표는 값 객체 계열에서 칸마다 뜻을 부여하는 장치로 작동했습니다. 명세 1.1 에서 갈래별 표를 정할 때 이 장치를 함께 넣을 후보로 봅니다.

## 분량

`### 구현` 코드는 Java 173 · TypeScript 170 · Rust 197줄(비어 있지 않은 줄 140 · 140 · 162)입니다. Rust 는 1라운드 213줄에서 줄었습니다.
```
판정 요약
MUST          통과 37 / 전체 40   (명세 MUST 31/31, 범위 밖인 AG9·AG11 은 해당없음이라 제외 · 공통 MUST 6/9)
SHOULD        미흡 0개            (PG20·PG26·A4·E4·F2·V3 충족, V4 기계 리듬 등급은 메인 몫)
IF-APPLICABLE 충족 3(PG10·AG10·AG12) / 해당없음 0 / 미흡 0
공통 루브릭    A 미흡(A2·A3) · E 미흡(E2) · F 충족 · V 충족(V1·V2·V3)
잠정 결론      FAIL — MUST 3건 미흡(A2·A3·E2). 세 건 모두 몇 줄 고치면 되는 수정이고, 구조·코드는 손댈 곳이 없습니다. (H축과 문체 등급은 메인이 합산)
```

## 1. 미흡 항목

**A2 [MUST] 용어·약어 풀어쓰기** — 약어는 처음 나올 때 원어로 한 번 풀어야 합니다(L0 C2). 아래 약어는 본문 어디에서도 풀리지 않습니다. `grep 'Enterprise\|Specification Request\|Enhancement Proposal\|Fast Healthcare\|Unified Code'` 결과는 0건이고, `Domain-Driven` 은 참고 자료 900행에만 있습니다.
- 25: "Money(PoEAA 18장)". 46·189·898행에서도 풀리지 않습니다. `PoEAA(Fowler 『Patterns of Enterprise Application Architecture』)` 로 한 번 푸세요.
- 213: "표에 쓴 DDD 전술 용어는". 본문 첫 등장입니다. `DDD(Domain-Driven Design, 도메인 주도 설계)` 로 푸세요.
- 817: "[JEP 395](https://openjdk.org/jeps/395)". `JEP(JDK Enhancement Proposal) 395` 로 푸세요.
- 840: "[HL7 FHIR R5]" · 841: "[UCUM]" · 842: "[JSR 385]". 표 셀이 좁으면 836행 도입 문장에서 한 번에 푸세요. `FHIR(Fast Healthcare Interoperability Resources)` · `UCUM(Unified Code for Units of Measure)` · `JSR(Java Specification Request)` 입니다.

**A3 [MUST] 미정의 용어 없음** — 핵심 용어가 정의보다 먼저 나옵니다.
- 120: "별도 값 객체로 감싸라고 적는데, 그 자리는 Quantity 가 아니라 id 값 객체입니다". 151행 "알맞은 값 객체로"도 같습니다. 값 객체의 정의는 219행에서야 나옵니다. 120행 첫 등장에 `값 객체(식별자 없이 값으로 같음을 판단하는 불변 객체)` 를 괄호로 넣으세요. AG1 때문에 개념 절에는 전술 분류를 매길 수 없으니, 뜻만 한 줄 주면 됩니다.
- 189: "서로 다른 newtype 으로 두는 예". newtype 은 정의가 없습니다. `newtype(기존 타입 하나를 감싸 새 이름을 붙인 타입)` 을 추가하세요.

**E2 [MUST] 사실 정확성** — 출처가 문장을 뒷받침하지 않습니다.
- 213: "표에 쓴 DDD 전술 용어는 이런 뜻입니다([DDD Reference](…DDD_Reference_2015-03.pdf))." 링크가 220행 "**id 참조** — 다른 aggregate 를 객체로 들지 않고 식별자 값으로만 가리키는 방식이에요"까지 뒷받침하는 것으로 읽힙니다.
- DDD Reference PDF를 받아 텍스트로 뽑아 대조했습니다. Aggregates 절(16쪽)은 "allow external objects to hold references to the root only"라고 적어, root 에 대한 객체 참조를 허용합니다. id 전용 참조는 이 문서에 없습니다.
- id 전용 참조 규칙은 Vernon 「Effective Aggregate Design Part II」에 있습니다. 규칙 제목 "Rule: Reference Other Aggregates By Identity"를 PDF에서 직접 확인했고, 링크는 candidates.md 416행에 있습니다.
- 고칠 곳 (1): 220행 `id 참조` 줄에 [Vernon, Effective Aggregate Design Part II](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf) 를 따로 달고 참고 자료에도 올리세요.
- 고칠 곳 (2): 900행 쪽 목록에 `Bounded Context 2쪽` 을 추가하세요. 본문이 정의하는데 쪽이 빠져 있습니다.

## 2. 충족 항목

- PG1: 16개 헤딩이 spec 순서·문구와 일치합니다. 127: "### 디자인 패턴을 충족하는 최소 조건"
- PG2: 네 요소가 모두 있습니다. 5: "레시피에 적힌 100 g 이 숫자 100 으로만 `consume` 에 들어가면" · 7: "수치와 단위를 한 값으로 묶고 계산을 그 값에게 맡깁니다" · 9–21행 Before/After 도식 · 25: "분류는 … §3.1 이고, 함께 쓰는 패턴은"
- PG3: 42–46행에서 개념 5개를 정의합니다. 202: "`IngredientStock` | 패턴 밖의 타입"
- PG4: 48–68행 classDiagram 의 클래스 5개가 정의 목록 5개와 1:1로 맞습니다.
- PG5: 모든 단계에 이유가 붙고, 3·4단계는 갈래가 나뉘어 있습니다. 85: "순서를 바꿔 교체부터 하면, 규칙 위반으로 거부하더라도 음수 보유량이 이미 저장돼 있습니다"
- PG6: 111: "단위가 **필드 이름이나 주석에만** 있고(`weightKg`, `// 단위: g`)" · 113: "`-2.7755575615628914e-17` 로 남거나"
- PG7: 121: "타입 하나와 환산 코드가 늘어나지만 막아 줄 단위 오류가 없습니다"
- PG8: 131·133·135행이 `[필수]` 셋, 137–140행이 `[선택]` 넷입니다.
- PG9: 134: "`plus` 가 수치만 더해서 0.3 kg 과 100 g 의 합이 100.3 kg 으로 나와요"
- PG10(IF-APPLICABLE): 불변식이 조건 항목으로 올라가 있습니다. 135: "[필수] **불변이고, 같음을 값으로 판정한다**"
- PG11: 146–149행에서 4개 대상을 비교합니다.
- PG12: 164: "구분 기준은 연산이 상대의 단위를 읽고 판단하는가입니다". 151·177·189행도 같은 형식입니다.
- PG13: 표의 얻는 것·포기하는 것 열에 더해 187: "누가 언제 무엇을 쟀는지 … Quantity 가 책임지지 않으므로"
- PG14: 155 "```typescript no-compile" · 166 "```java no-compile". 점검 문제의 코드 펜스(855·877행)와 구현 펜스에는 표식이 없습니다.
- PG15: 197: "고정인 것도 정해 둡니다. 단위는 g · kg · L 셋이고", 199–204행에 매핑표가 있습니다.
- PG16: 224 java → 392 typescript → 559 rust 순서이고, 사이에 산문이 없습니다.
- PG17: 메인의 컴파일 통과에 더해, 제가 javac 21 · tsc --strict · rustc 2021 로 다시 빌드하고 실행했고 세 펜스 모두 성공했습니다.
- PG18: 225: "import java.math.BigDecimal;" · 561: "use std::fmt;". 외부 의존이 없습니다.
- PG19: 359: "public static void main" · 540: "const stock = new IngredientStock(" · 752: "fn main() -> Result<(), String>"
- PG20(SHOULD): 801–805행에서 세 언어의 대응 줄을 한 표로 짚습니다.
- PG21: 840–845행의 사례마다 링크가 있습니다.
- PG22: 별점·난이도·활용성을 grep 한 결과 0건입니다.
- PG23: 821·834행 조건부 절 둘 다 조건이 성립하고, "해당 없음" 류 문구는 0건입니다.
- PG24: 노트 밖 사실 자리에 출처가 달려 있습니다. 849: "([unit-api](…)) … [Quantity javadoc](…) … [Unit javadoc](…)", 참고 자료 905행에도 있습니다.
- PG25: 894: "Chapter 3 「Observations and Measurements」(35쪽부터) §3.1 Quantity". 스크립트로 대조해 본문 링크 20개가 전부 참고 자료에 있음을 확인했습니다.
- PG26(SHOULD): 853: "최소 조건의 `[필수]` 셋을 하나씩 적용해 판정해 보세요"
- AG1: 70: "어느 묶음에 넣을지는 뒤의 구현 예시가 상황 설정 표로 정해요". 42–68행에 전술 분류와 스테레오타입이 없습니다.
- AG2: 129: "클래스 모양이 아니라 **개념이 무엇을 책임지는가**로 판정합니다"
- AG3: 206–211행의 헤더·4행·라벨 순서가 규칙과 같습니다. 208: "빵집 재료 재고 — 입고와 사용으로 재료별 보유량을 기록한다"
- AG4: 215–220행에서 Bounded Context·Aggregate·Aggregate Root·Entity·Value Object·id 참조를 한 줄씩 정의합니다. 출처 문제는 E2에서 다룹니다.
- AG5: 211: "재료 카탈로그 aggregate(이 예제 밖)의 재료를 `IngredientId` 로 가리킨다"
- AG6: 세 펜스 각각 확인했습니다.
  - Java: 339 "if (after.isNegative())" 검사가 342 "onHand = after;" 보다 앞입니다. 250 "record Quantity(BigDecimal amount, Unit unit)" · 317 "private final StockId id;"
  - TypeScript: 521 검사가 524 교체보다 앞입니다. 422 "Object.freeze(this);" · 448 값으로 판단하는 `equals` · 502 "readonly id: StockId"
  - Rust: 723 검사가 726 교체보다 앞입니다. 600 "#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]" · 700 "id: StockId"
- AG7: 318 "private final IngredientId ingredientId; // 재료 카탈로그 aggregate 는 id 로만 가리킨다" · TypeScript 503 · Rust 701. 다른 aggregate 타입은 세 펜스 어디에도 없습니다. 다만 실제 코드에 두 번째 aggregate 가 없어서 조건이 저절로 충족된 형태입니다(3절 참고).
- AG8: 세 펜스 각각 확인했습니다. 319 "private Quantity onHand;" · 353 불변 VO를 반환하는 게터 · TypeScript 499 "private onHandValue: Quantity;" · Rust 738 "pub fn on_hand(&self) -> Quantity"(Copy). 가변 컬렉션을 밖으로 내보내지 않습니다.
- AG9 · AG11: 해당없음. 회계 3편(Account·Transaction·Posting Rule) 전용 규칙입니다.
- AG10(IF-APPLICABLE): 노트 417–424행에 경계 선택지 A·B·C 가 있어 적용 조건이 성립합니다. 827: "(이 가이드) | Unit·ConversionRatio 는 코드 상수 VO"로 시작하는 3열·4행 표가 있습니다.
- AG12(IF-APPLICABLE): 842: "`Quantity<Q>` 의 `getValue()` · `getUnit()` · `add` · `subtract` | Quantity 의 amount · unit · plus · minus"
- A1: 31: "개요의 After 그림에 나온 값을 조각으로 나눠 보면". 개요 → 개념 → 절차 → 경계 → 예시 순으로 쌓입니다.
- A4(SHOULD): 23: "이 글을 끝까지 읽으면 어떤 숫자 필드를 Quantity 로 바꿔야 하는지 가려낼 수 있어요"
- E1: 775행 "같은 열 줄을 출력합니다"가 777–788행 표와 실제 실행 결과 모두와 일치합니다. 105행 확인 질문의 답도 코드 동작과 같습니다.
- E3: 153: "두 주석의 값은 node 로 직접 실행해 얻은 결과예요". 다시 실행해 같은 값을 얻었습니다(5절).
- E4(SHOULD): Java SE 21 문서 · FHIR R5 · unit-api 2.2 로 모두 현행입니다.
- F1: 77: "단위 확인을 호출하는 쪽마다 따로 쓰면 한 곳만 빠뜨려도 단위가 섞인 계산이 나옵니다"
- F2(SHOULD): 5행이 빵집 재고의 구체 오류로 엽니다.
- V1: 종결 톤은 5: "해 봅시다", 7: "맞춘 뒤에 계산해요"로 존댓말 설명체가 유지됩니다. 표 셀의 한다체는 spec 표 서식(AG3·AG10 예시)과 같습니다. 호흡은 인용이 아니라 세어서 판정했습니다.

  | 계수 방식 | 산문 문단 | 최장 연속 | 판정 |
  | --- | --- | --- | --- |
  | authoring-kit `golden.py` 의 `longest_prose_run` 을 이 파일에 실행(펜스·표가 끊고, 헤딩이 구간을 리셋하고, 목록·인용은 세지도 끊지도 않음) | 41 | **2** | `max_prose_run = 2` 이하라 충족 |
  | 참고: 헤딩을 리셋으로 보지 않을 때 | 41 | 4 | 3 이상인 구간 6곳(23–31, 70–87, 101–116, 187–197, 817–823, 847–853행)이 전부 헤딩을 건넙니다 |

- V2: 금지 문형("성립해서", "자명", "해당 없음" 등)을 grep 한 결과 0건입니다. 101행 논증이 곱셈과 나눗셈 두 경우를 끝까지 폅니다.
- V3(SHOULD): 장치가 실제로 쓰였습니다. 103행 기억법 인용 · 105: "잠깐, 확인 하나만 해 볼까요?" · 164: "여기서 헷갈리기 쉬운 포인트는" · 799: "여기서 가장 중요한 줄은"

## 3. 상황 설정 표 칸별 관찰 (판정 아님)

1. **bounded context** — 정보량이 낮습니다. 208행은 195행 산문을 다시 적은 것이고, Quantity 의 모델링 결정은 담지 않습니다. 그런데 이 편에서 BC가 실제로 뜻을 갖는 자리가 따로 있습니다. 847행에 따르면 재고에서는 2.50 = 2.5 이지만 측정 기록에서는 끝의 0이 정밀도입니다. 이 차이가 칸에는 없습니다.
   - 권할 처분: **갈래별 표**. VO 계열에서는 "이 BC 에서 값의 의미를 정하는 규칙(단위 집합·자릿수·같음 판정)"을 적게 합니다.
2. **불변식의 위치** — 정보량이 높습니다. VO 몫(최소 조건 1~3, 세 자리 규칙)과 root 몫(음수 금지, 양수 입력)을 가르는 실제 설계 결정이고, 794–795행 대응표와 점검 문제 3이 이 칸에 기댑니다.
   - 권할 처분: **유지**.
3. **root·entity·VO 배정** — 정보량은 중간입니다. Quantity 가 VO라는 것은 자명합니다(노트 415행 "VO로 확정"). IngredientStock 이 root/entity 라는 부분은 예제를 받치는 도구입니다. 패턴에 대한 정보는 "Unit·ConversionRatio 는 코드 상수인 VO" 한 문장뿐이고, 그마저 `### 상황이 달라지면` 표가 더 잘 다룹니다.
   - 권할 처분: **갈래별 표**. "참조 데이터(Unit·비율)의 배정" 칸으로 바꿉니다.
4. **타 aggregate 참조 방식** — 정보량이 낮습니다. 가리키는 대상(재료 카탈로그)이 예제 밖이고 코드에 없어서, AG7이 저절로 충족됩니다. 이 칸을 채우려고 `IngredientId` 필드·게터·출력 1행(361·541·754행)이 세 언어에 들어갔습니다. 패턴에 대한 정보는 "값째로 복사돼 aggregate 사이를 건너간다" 한 구절뿐입니다.
   - 권할 처분: **IF-APPLICABLE**. Unit·비율을 별도 aggregate 로 두는 경계(대안표 2~4행)일 때만 적게 하고, VO 갈래 표에서는 "경계를 넘는 방식: 값 복사" 한 줄로 대체합니다.

종합: VO 계열에는 1.0 표 그대로보다 **갈래별 표**가 맞아 보입니다. 실제 경계 정보는 `### 상황이 달라지면` 표에 모여 있습니다.

## 4. 분량 관찰 (판정 아님)

- `### 구현` 코드 줄 수는 Java 165(비어 있지 않은 줄 135) · TypeScript 164(138) · Rust 213(181)입니다. 산문은 펜스를 빼고 22,156자입니다. `paths.json` 의 exemplars 가 비어 있어 10배 검사는 건너뛰었습니다.
- 패턴과 무관한 부분이 큽니다. 10진 문자열 파서와 표시 코드가 TypeScript `of` 12줄 + `toString` 6줄, Rust `of` 23줄 + `Display` 14줄로 약 55줄입니다. Rust 는 여기에 오버플로 처리(`overflow()`·`checked_*`·모든 연산의 `Result`)가 더해집니다.
- 표 4번째 칸 때문에 들어간 `IngredientId` 필드·게터·출력이 세 언어 합쳐 약 20줄이고, 출력 1행은 시나리오에 보태는 것이 없습니다.

## 5. 사실 확인에서 걸린 것

**WebFetch·PDF 직접 확인**
- unit-api README: "JSR 385 - Units of Measurement API 2.2" — 849행과 일치합니다.
- Quantity javadoc: `isEquivalentTo` "Compares two instances … performing the conversion of units if necessary"이고, `getValue`·`getUnit`·`add`·`subtract` 가 있습니다. 842–844·849행과 일치합니다.
- Unit javadoc: `getConverterTo` 가 "UnconvertibleException - if a converter cannot be constructed"를 던집니다. 849행과 일치합니다.
- TigerBeetle: unsigned 128-bit, "map the smallest useful unit of the fractional currency to 1", asset scale 2. 845·849행과 일치합니다.
- DDD Reference PDF: Bounded Context 2쪽 · Entities 11쪽 · Aggregates 16쪽입니다. **220행 id 참조를 이 문서가 뒷받침하지 않습니다**(E2).
- Vernon Part II PDF: "Rule: Reference Other Aggregates By Identity"가 있습니다. E2 수정에 쓸 출처입니다.

**직접 실행해 확인**
- 세 펜스 실행 결과가 777–788행 1~10행과 글자 단위로 같습니다(javac 21 / tsc --strict → node 22 / rustc 2021).
- node: `0.19999999999999998` · `-2.7755575615628914e-17` 이 157–158행과 같습니다. `JSON.stringify` 에 bigint 를 넘기면 TypeError 가 납니다.
- Java: `Weight[value=100.3, unit=kg]` 가 172행과 같습니다. `Currency` KRW 는 0, USD 는 2로 46행과 같습니다. `BigDecimal("2.0").equals("2.00")` 은 false, `compareTo` 는 0 으로 817행과 같습니다.

**노트에 없는데 본문에 있는 것** — JSR 385 메서드 대응과 unit-api 2.2 는 그 자리 링크와 참고 자료가 모두 있습니다. 46행 Currency 값은 "실행하면"이라는 실측 서술만 있고 그 자리 링크는 없습니다. 참고 자료 901행에 Currency 문서가 있어 충족으로 봤고, 46행에 Currency 링크를 붙이는 것은 선택입니다.

**판정에는 영향 없는 참고**
- 817행 "`number` 정수는 −(2⁵³−1)~2⁵³−1 밖에서 정확하지 않고"는 범위를 넘긴 표현입니다. 범위 밖에도 2⁵³ 처럼 정확한 정수가 있으니 "안전하게 표현되는 범위는"으로 바꾸기를 권합니다.
- 807행 "0.0005 kg 이 되어 거부돼요"는 BigDecimal(Java)에서만 그대로 맞습니다. 정수 표현(TypeScript bigint · Rust i64)에서는 나눗셈이 조용히 버림이 됩니다.
- 67행 mermaid `Quantity <|-- Money` 는 189행 "어느 쪽으로 모델링해도 성립해요"와 약하게 긴장합니다. 그림은 JAOO 슬라이드의 "a kind of"를 따른 것이라 모순까지는 아닙니다.
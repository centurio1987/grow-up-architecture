# 추가 패턴 후보 보고서

- 조사일: 2026-09-17 (본문의 모든 웹 출처 조회일도 같은 날짜입니다)
- 현재 구성: 33편 — GoF 23편(`PATTERNS.md`) + Fowler 분석 패턴 10편(`pattern-guide/ddd-analysis-pattern-guide/README.md`의 기반 추상 3 · 값 모델링 2 · 관찰/측정 2 · 회계/거래 3)
- 조사 범위: 세 갈래입니다. ① GoF 밖에서 널리 쓰이는 설계 패턴 ② Fowler 『Analysis Patterns』 목차 중 현재 10편 밖의 절 + martinfowler.com eaaDev 초안 + PoEAA(『Patterns of Enterprise Application Architecture』) Base Patterns ③ DDD(Domain-Driven Design) 전술 용어 기준선 1편 신설 여부
- 판단 기준:
  - **기존 33편과의 경계를 한 줄로 적지 못하면 후보에서 뺍니다.** 원전 내용을 확인하지 못해 경계를 못 쓰는 경우도 같습니다.
  - 가치 근거는 원전 인용이나 이 레포 파일의 줄 번호로만 댑니다. 사용 빈도 수치는 출처가 없어 쓰지 않았습니다.
  - "(판단)"이 붙은 문장은 출처로 확정된 사실이 아니라 이 보고서의 추정입니다.
  - 원서 쪽수는 확인하지 못한 경우 "쪽 확인 안 함"으로 적었습니다.
- 용어: spec은 루트 카드(`KANBAN/cards/KAN-001-YXTC2C.md`) 결정 1의 집필 명세입니다. `gof-guide`는 최소 조건을 코드 구조로 판정하고, `analysis-guide`는 개념 책임 분리로 판정하며 DDD 상황 설정 표(bounded context / 불변식의 위치 / root·entity·VO 배정 / 타 aggregate 참조 방식)를 필수로 요구합니다. VO는 Value Object(값 객체)입니다.
- 검토 수: 정식 형식 15건(갈래 1: 8건, 갈래 2: 7건) + 기준선 1건 + 간이 검토(형식 생략, 제외 근거만) 14건

## 요약 — 결정할 것

**A. 채택 권고 (추천 순)** — 채택하면 1건당 집필 work 1개가 늘어납니다(루트 카드 결정 9: work 1 = 가이드 1편).

1. **DDD 전술 용어 기준선 1편** — 분석 10편이 필수 상황 설정 표에서 쓰는 Aggregate·Entity·VO·Bounded Context를 현재 어느 편도 정의하지 않습니다(Aggregate 언급 0편). 채택하면 분석 편 파일럿(.3의 Account·Quantity)보다 **먼저** 써야 하고, 새 spec이 필요합니다. → 3절
2. **Dependency Injection** — GoF 가이드 6편이 정의 없이 DI를 언급합니다. Service Locator는 이 편의 안티패턴 비교 대상으로 흡수합니다. → 1절
3. **Temporal Property (Effectivity · Dual Time Record 포함)** — 분석 README가 Range를 유효 기간으로 쓴다고 적은 3편이 유효 기간 모델링 자체는 정의하지 않습니다. → 2절
4. **Null Object** — `strategy-pattern.md:84`가 정의 없이 이 용어를 씁니다. Rust의 `Option`과 대비할 수 있습니다. → 1절
5. **Specification** — 원 논문이 "분석 패턴이자 설계 패턴"이라고 적은 패턴이라 GoF 트랙과 분석 트랙을 잇습니다. → 1절

**B. 조건부 보류** — 다른 결정이 나면 자동으로 정해집니다.

- **Adjustment (Reversal · Replacement · Difference)** — 회계 배경 확정안(.1 유저 결정 ②)이 정정 방식을 Reversal 하나로 고정하면 비권고, 둘 이상을 허용하거나 방식 비교가 필요하면 채택입니다.
- **Type Object** — .5에서 Knowledge Level 편을 쓸 때 비교 절 1항목으로 수용되면 비권고, 수용되지 않으면 채택입니다.

**C. 비권고 — 단독 편은 만들지 않고 기존 편에 흡수**

- Service Locator → DI 편 비교 절 / Object Pool → Flyweight 편 비교 절 / Lazy Initialization → Singleton·Proxy 편 비교 절 / Extension Object → 제외
- Money → Quantity 편 / Organization Hierarchy·Structure·Post → Accountability·Party 편 / Summary Account → Account 편 / Event Sourcing → Account 편 비교 절(Domain Event 정의는 기준선으로) / Identification Scheme → 기준선 Entity 절 보충 예

**D. 현재 구성에 대한 관찰 (4절)** — 편 수를 줄일 근거는 없습니다. 다음 두 가지는 재집필할 때 반영하기를 권합니다.

- Observation 편이 원전의 Category Observation을 "Observation"이라고 부릅니다. 편 수는 유지하고 정의를 정정하는 것을 권합니다.
- 회계 3편의 원서 6장은 저자가 더 새로운 accounting 문서로 대체한다고 명시했습니다. 리서치 노트에서 두 출처를 함께 쓰는 것을 권합니다.

**채택할 때 따라오는 비용**

- A의 5건을 모두 채택하면 work가 5개 늘어납니다.
- 루트 카드 「검증」의 숫자가 바뀝니다. `grep ... | wc -l # 23`, `--gates 33건`, `HTML 33편`이 해당합니다.
- `PATTERNS.md`에 "GoF 밖 설계 패턴" 범주를 새로 만들어야 합니다.
- 기준선 문서는 최소 조건 절이 없어 analyzer 대상이 아니고, 검사기의 편 수 집계에서도 빼야 합니다.

---

## 1. GoF 밖 설계 패턴 후보

### Null Object
- 갈래: GoF 밖 설계
- 한 줄 정의: "없음"을 null 참조 대신, 같은 인터페이스를 구현하되 중립 동작(아무 일도 하지 않음)을 하는 객체로 표현해서 호출자의 null 검사를 없애는 패턴입니다.
- 원전·출처:
  - Bobby Woolf, "Null Object" — 『Pattern Languages of Program Design 3』(PLoPD3) "General Purpose Design Patterns" 부의 1장입니다([InformIT 목차](https://www.informit.com/store/pattern-languages-of-program-design-3-9780201310115), 조회 2026-09-17). 쪽 확인 안 함. InformIT는 발행일을 1997-10-07로, Wikipedia는 1998로 표기합니다.
  - 선행 발표는 Thomas Kühne의 "Void Value"(1996)입니다([Wikipedia: Null object pattern](https://en.wikipedia.org/wiki/Null_object_pattern), 조회 2026-09-17).
  - 일반화된 형태는 PoEAA의 Special Case(18장)입니다. 의도는 "A subclass that provides special behavior for particular cases"입니다([eaaCatalog Special Case](https://martinfowler.com/eaaCatalog/specialCase.html), 조회 2026-09-17).
  - 리팩터링으로는 "Introduce Special Case"(별칭 "Introduce Null Object")가 있습니다([refactoring.com](https://refactoring.com/catalog/introduceSpecialCase.html), 조회 2026-09-17).
- 기존 33편과의 경계: Strategy와 가장 가깝습니다. 구조로 보면 "아무것도 하지 않는 구체 전략"이지만, Strategy의 의도는 알고리즘 교체이고 Null Object의 의도는 **부재의 표현**입니다. Wikipedia도 이 패턴을 State·Strategy의 특수한 경우로 봅니다.
- 필요한 spec: gof-guide
- **★ 정정(2026-09-30 실측) — 아래 첫 근거는 재집필로 사라졌다.** 현행 발행본 전체에서 `Null Object`·`널 객체` 는 **0회**다. 근거로 든 `strategy-pattern.md:84` 의 `NoDiscountStrategy` 자리는 그 편이 도메인을 배송 요금(`ShippingPolicy`)으로 바꿔 쓰면서 **없어졌다** — 「무할인」·「할인 없」 으로도 잡히지 않는다.
  **그래서 이 편의 근거는 나머지 둘이 진다.** ① Rust 에 null 참조가 없어 `Option` 을 쓰므로 **「언어가 부재를 타입으로 강제할 때도 이 패턴이 필요한가」** 가 세 언어 대조에서 드러난다 ② 원전 쪽에 「오류를 정상 실행처럼 보이게 한다」는 비판이 있어 안티패턴 갈래의 소재가 이미 있다. 둘 다 재집필과 무관하게 유효하다.
- 가치 근거:
  - (**재집필로 소멸 — 위 정정 참고**) `pattern-guide/design-pattern-guide/strategy-pattern.md:84`가 `NoDiscountStrategy`를 "Null Object 형태"라고 부르지만 정의는 없습니다. 요청서의 "등장하는 개념 빠짐없이 정의"를 지키려면 정의할 자리가 필요합니다.
  - Wikipedia 비판 절에 "can make errors/bugs appear as normal program execution"이라는 문장이 있어, 경계·안티패턴 절에 쓸 소재가 원전 쪽에 이미 있습니다.
  - Rust에는 null 참조가 없고 `Option`을 씁니다(["there are no "null" references"](https://doc.rust-lang.org/std/option/index.html), 조회 2026-09-17). 세 언어 비교에서 "언어가 부재를 타입으로 강제할 때도 Null Object가 필요한가"라는 차이가 드러납니다.
- 비용 신호: Java·TS는 인터페이스 구현, Rust는 trait 구현으로 세 블록 모두 짧고 자기완결입니다. 외부 crate도 필요 없습니다(판단).
- 추천: **채택 권고** — 기존 편이 이미 이 용어를 쓰고 있고, 세 언어 예시를 만드는 비용이 낮습니다.
- **미해결 질문(2026-09-30 발행 뒤 남음)** — 원전 Implementation 3 「Clients don't agree on null behavior」가 **pluggable variables 로 실행 중에 do-nothing 방식을 바꾸는 널 객체**를 인정한다(「If the do nothing behavior must be customized at run time, the NullObject class will require pluggable variables」). 이 모양은 발행본의 `[필수]` 4번(자기 필드를 바꾸는 코드가 없고 동작을 가르는 분기가 없다)에 걸린다. 즉 **이 가이드가 원전보다 좁은 자리가 State 말고 하나 더 있다.** 채점자가 1라운드에서 찾아 본문의 전칭(「좁게 잡은 자리는 여기 하나뿐」)만 걷어 냈고, 이 자리를 본문에서 다루려면 집필 단계로 돌아가야 한다. `[선택]` 로 한 항목을 더하거나 조건 4 의 문면을 「만들 때 정한 방식이 실행 중에 바뀌지 않는다」로 넓히는 두 길이 있는데, 어느 쪽이든 조건을 쓰는 자리를 전수로 따라 고쳐야 한다(`.4` 카드 12번).

### Specification
- 갈래: GoF 밖 설계
- 한 줄 정의: 후보 객체가 기준을 만족하는지 판정하는 책임(`isSatisfiedBy`)을 후보와 분리된 객체에 두는 패턴입니다. 같은 기준 표현을 선택(selection)·검증(validation)·주문 제작(construction-to-order)에 함께 씁니다.
- 원전·출처:
  - Eric Evans & Martin Fowler, "Specifications"([martinfowler.com/apsupp/spec.pdf](https://martinfowler.com/apsupp/spec.pdf), 조회 2026-09-17). 문서 날짜 확인 안 함.
  - Evans 『Domain-Driven Design』 9장 "Making Implicit Concepts Explicit"의 "Specification" 절([dddcommunity.org 목차](https://www.dddcommunity.org/uncategorized/toc/), 조회 2026-09-17). 쪽 확인 안 함.
- 기존 33편과의 경계: 원 논문은 구현 변형을 GoF 패턴으로 설명합니다. Hard Coded Specification은 "treating the specification as a Strategy"이고, Composite Specification은 "uses an interpreter"로 and/or/not 노드를 조합합니다. 따라서 Strategy·Interpreter·Composite 편과 구조가 겹칩니다. Specification에만 있는 것은 두 가지입니다. 판정 기준을 도메인 개념으로 이름 붙여 재사용한다는 점, 그리고 Subsumption(`isGeneralizationOf`로 명세끼리 포함 관계를 비교)입니다.
- 필요한 spec: gof-guide를 권합니다. 최소 조건(판정 연산 하나 + 조합자)이 코드 구조로 판정되기 때문입니다. 원 논문이 도메인 배경(화물·컨테이너, 트레이더 포트폴리오)을 예로 들므로 상황 설정 절에 그 배경을 가져오면 됩니다.
- 가치 근거:
  - 논문 원문 "We see this as an analysis pattern, a way of capturing how people think about a domain, and a design pattern" — 이번 조사에서 두 트랙에 동시에 걸친 후보는 이것 하나였습니다.
  - 논문 도판이 『Analysis Patterns』 §9.2(Portfolio), §3.5(Observation), §4.1(Enterprise Segment)을 가리킵니다. 그래서 분석 편 중 Observation 계열과 연결됩니다.
- 비용 신호: Java는 인터페이스 + default `and/or/not`, TS는 인터페이스나 함수, Rust는 trait + 조합 구조체나 클로저로 표준 라이브러리만으로 쓸 수 있습니다(판단). Subsumption까지 구현하면 분량이 커지므로 최소 조건에서 `[선택]`으로 두는 편이 맞습니다(판단).
- 추천: **채택 권고** — 기존 GoF 3편과 분석 편을 함께 참조하는 연결점이고, 원전이 짧고 공개돼 있습니다.

### Dependency Injection
- 갈래: GoF 밖 설계
- 한 줄 정의: 객체가 협력 객체를 스스로 만들거나 찾지 않고, 별도의 조립자(assembler)가 추상 타입의 구현을 생성자·setter·인터페이스를 통해 넣어 주는 패턴입니다.
- 원전·출처: Martin Fowler, "Inversion of Control Containers and the Dependency Injection pattern", 2004-01-23([martinfowler.com](https://martinfowler.com/articles/injection.html), 조회 2026-09-17).
  - 원문 정의: "have a separate object, an assembler, that populates a field ... with an appropriate implementation"
  - 세 형태: Constructor / Setter / Interface Injection
  - "Inversion of Control"이라는 이름은 너무 일반적이라("like saying my car is special because it has wheels") DI라는 이름을 제안했습니다.
- 기존 33편과의 경계: Strategy와 겹칩니다. Strategy도 생성자·setter 주입을 최소 조건으로 둡니다(`strategy-pattern.md` 최소 조건 3). 다만 Strategy의 의도는 "교체 가능한 알고리즘"이고, DI의 의도는 "구성과 사용의 분리"이며 알고리즘이 아닌 모든 협력 객체에 적용됩니다.
- 필요한 spec: gof-guide
- **★ 정정(2026-09-30 실측) — 아래 「6편이 정의 없이 언급」은 재집필 전 상태다.** 33편을 다시 쓴 뒤 현행 발행본에서 `의존성 주입`·`Dependency Injection` 을 세어 보면 **singleton 편 3회뿐**이고 나머지 다섯(strategy · factory-method · abstract-factory · flyweight · mediator)은 **0회**다. 게다가 남은 셋도 「정의 없이」가 아니다 — `singleton:174` 가 「의존성 주입(Dependency Injection, 객체가 쓸 협력 객체를 바깥에서 넣어 주는 방식)」으로 **괄호 안에서 짧게 푼다.** 아래 줄 번호는 전부 폐지된 `*-pattern.md` 기준이라 지금 파일에는 없다.
  **그래서 채택 근거가 바뀐다.** 「6편이 참조하는 개념의 정본 자리」가 아니라 **「singleton 편이 비교 절에서 `의존성 주입 컨테이너의 단일 스코프` 를 갈래로 다루는데 그 갈래를 풀 자리가 괄호 한 줄뿐이다」** 가 지금의 근거다(`singleton:245`·`:270`). Fowler 원전의 Service Locator 논쟁과 세 형태(Constructor · Setter · Interface)는 그대로 유효하다.
- 가치 근거(**재집필 전 상태 — 위 정정을 먼저 읽는다**): 기존 GoF 가이드 6편이 DI를 정의 없이 언급합니다.
  - `singleton-pattern.md:164`, `:198`
  - `strategy-pattern.md:264`
  - `factory-method-pattern.md:189`, `:196`, `:213`
  - `abstract-factory-pattern.md:184`, `:209`
  - `flyweight-pattern.md:179`
  - `mediator-pattern.md:139`

  정의 정본이 없으면 6편이 각자 DI를 정의해야 합니다. 비교 절 소재도 원전에 있습니다. Fowler의 결론은 "The choice between Service Locator and Dependency Injection is less important than the principle of separating service configuration from the use of services"입니다.
- 비용 신호: 컨테이너 없이 순수 생성자 주입으로 세 언어 모두 자연스럽습니다. Rust는 제네릭 매개변수나 `Box<dyn Trait>`를 씁니다(판단). `### 실제 라이브러리에서` 절에 프레임워크를 넣으려면 별도 출처가 필요합니다.
- 추천: **채택 권고** — 6편이 참조하는 개념의 정본 자리이고, Service Locator 논쟁을 비교 절에 담을 수 있습니다.

### Service Locator
- 갈래: GoF 밖 설계
- 한 줄 정의: 객체가 필요한 서비스를 전역에서 접근할 수 있는 locator에 명시적으로 요청해서 얻는 패턴입니다.
- 원전·출처: 세 원전의 평가가 갈립니다.
  - Fowler 2004(위와 같은 글): "the application class asks for it explicitly by a message to the locator". 일반 애플리케이션에서는 Service Locator를 약간 선호하고, 외부에 배포할 컴포넌트에는 DI를 권합니다.
  - Robert Nystrom 『Game Programming Patterns』 Decoupling Patterns 장: "Provide a global point of access to a service without coupling users to the concrete class that implements it", 사용은 "sparingly"([gameprogrammingpatterns.com](https://gameprogrammingpatterns.com/service-locator.html), 조회 2026-09-17).
  - Mark Seemann, "Service Locator is an Anti-Pattern", 2010-02-03: 클래스의 의존성을 숨겨 컴파일 타임이 아니라 런타임 오류를 낸다([blog.ploeh.dk](https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/), 조회 2026-09-17).
- 기존 33편과의 경계: Singleton과 DI 사이에 있습니다. Singleton처럼 전역 접근점을 두지만(Nystrom도 See Also에서 Singleton과 비교합니다) 구체 클래스와의 결합은 끊습니다. DI와는 목표(구성과 사용의 분리)가 같고 방향만 반대입니다. 서비스를 요청해서 가져오는지(pull), 넣어 받는지(push)의 차이입니다.
- 필요한 spec: gof-guide (단독 편일 때)
- 가치 근거: 원전 셋의 평가가 갈린다는 사실이 DI 편 `### 비슷한 패턴·안티패턴과의 차이` 절의 좋은 소재입니다. 반면 단독 편으로 쓰면 개념·절차가 DI 편과 대부분 겹칩니다(판단).
- 비용 신호: 세 언어 모두 쓸 수는 있습니다. 다만 Rust에서 전역 가변 레지스트리를 만들려면 `static`과 동기화 타입이 필요해 예시가 패턴 밖 요소로 커집니다(판단).
- 추천: **비권고(단독)** — DI 편 비교 절의 안티패턴 대상으로 흡수합니다.

### Object Pool
- 갈래: GoF 밖 설계
- 한 줄 정의: 객체를 하나씩 할당·해제하지 않고 고정된 풀에서 재사용해 성능과 메모리 사용을 개선하는 패턴입니다. Nystrom의 Intent는 "reusing objects from a fixed pool instead of allocating and freeing them individually"입니다.
- 원전·출처: Nystrom 『Game Programming Patterns』 Optimization Patterns 장([gameprogrammingpatterns.com](https://gameprogrammingpatterns.com/object-pool.html), 조회 2026-09-17).
- 기존 33편과의 경계: Flyweight와 가깝습니다. Nystrom은 Flyweight를 "동시에 공유", Object Pool을 "시간 순서로 재사용"으로 구분합니다. `flyweight-pattern.md:37`에도 같은 구분이 이미 있습니다.
- 필요한 spec: gof-guide
- 가치 근거: 경계 설명은 Flyweight 편에 이미 있습니다. 원전의 주의점 중 두 가지 — 가비지 컬렉터와 함께 쓸 때의 충돌, 재사용 객체가 이전 상태를 그대로 갖고 있는 문제 — 는 관리 언어(Java·TS)에서 이 패턴의 이득이 약해지는 조건입니다.
- 비용 신호: Java·TS는 GC 환경이라 예시가 성능 이득을 보여 주기 어렵습니다(원전 주의점 근거, 판단). Rust는 인덱스 기반 풀로 자연스럽게 쓸 수 있습니다(판단).
- 추천: **비권고(단독)** — Flyweight 편 비교 절에서 다룹니다.

### Type Object
- 갈래: GoF 밖 설계
- 한 줄 정의: 종류마다 서브클래스를 만들지 않고 "종류"를 나타내는 클래스 하나를 두어, 그 인스턴스 하나하나가 타입 하나를 표현하게 하는 패턴입니다. 새 종류를 런타임 데이터로 만들 수 있습니다. Nystrom의 Intent는 "creating a single class, each instance of which represents a different type of object"입니다.
- 원전·출처:
  - Ralph Johnson & Bobby Woolf, "Type Object" — PLoPD3 "General Purpose Design Patterns" 부의 4장([InformIT 목차](https://www.informit.com/store/pattern-languages-of-program-design-3-9780201310115), 조회 2026-09-17). 쪽 확인 안 함.
  - Nystrom 『Game Programming Patterns』 Behavioral Patterns 장([gameprogrammingpatterns.com](https://gameprogrammingpatterns.com/type-object.html), 조회 2026-09-17).
- 기존 33편과의 경계: Knowledge Level 편과 가장 가깝습니다. `knowledge-level-pattern.md:162`가 Type Object를 "관련 구현 패턴"으로 지목합니다.
  - Type Object는 타입·인스턴스 클래스 한 쌍으로 이루어진 코드 구조입니다.
  - Knowledge Level은 "A group of objects that describe how another group of objects should behave"라는 모델 수준의 층 분리입니다([DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) p.51).
- 필요한 spec: gof-guide
- 가치 근거: analysis-guide spec은 `detail.terms`에서 "분석 층위 개념만" 정의하도록 합니다(루트 카드 「새 골격」). 그래서 Knowledge Level 편 안에서 코드 수준의 Type Object를 정의할 자리가 좁습니다. 반대로 비교 절 1항목으로 충분할 수도 있어 지금은 판정할 수 없습니다.
- 비용 신호: 세 언어 모두 자연스럽습니다. Rust는 타입 구조체를 id나 공유 참조로 가리키면 됩니다(판단).
- 추천: **보류(조건부)** — .5에서 Knowledge Level 편 비교 절에 수용되면 비권고, 수용되지 않으면 채택합니다.

### Extension Object
- 갈래: GoF 밖 설계
- 한 줄 정의: 객체의 인터페이스가 나중에 확장될 것을 예상해, 추가 인터페이스를 별도의 확장 객체로 정의하는 패턴입니다. 클라이언트는 `GetExtension(이름)`으로 지원 여부를 조회해서 씁니다. 원문 Intent는 "Anticipate that an object's interface needs to be extended in the future. Additional interfaces are defined by extension objects."입니다.
- 원전·출처: Erich Gamma, "Extension Object" — PLoPD3 "General Purpose Design Patterns" 부의 6장([InformIT 목차](https://www.informit.com/store/pattern-languages-of-program-design-3-9780201310115)). 논문 사본은 [ecs.syr.edu PDF](https://ecs.syr.edu/faculty/fawcett/handouts/cse776/PatternPDFs/ExtensionObject.pdf)에 있습니다(조회 2026-09-17, 서버 인증서가 만료돼 브라우저 경고가 뜹니다). 쪽 확인 안 함.
- 기존 33편과의 경계: 논문의 Related Patterns 절이 기존 세 편과의 차이를 직접 적습니다.
  - Visitor: 안정된 클래스 계층과 의존 순환이 필요합니다. Extension Object는 둘 다 필요 없습니다.
  - Decorator: 클라이언트에게 더 투명하고, 인터페이스가 좁을 때 적합합니다.
  - Adapter: 기존 인터페이스를 변환합니다. Extension Object는 인터페이스를 추가합니다.
- 필요한 spec: gof-guide
- 가치 근거: 비교 대상 셋이 모두 기존 편이라 경계 학습 소재는 있습니다. 그러나 논문의 동기 예시(OLE 2·OpenDoc 복합 문서)는 지금 독자에게 낯선 배경입니다(판단).
- 비용 신호: Java·TS는 이름으로 객체를 조회하는 방식이 자연스럽습니다. Rust에서 이름으로 확장을 돌려주려면 `std::any::Any`의 `downcast_ref` 같은 동적 타입 조회가 필요해([std::any](https://doc.rust-lang.org/std/any/index.html), 조회 2026-09-17) 예시가 패턴 밖 요소로 커집니다(판단).
- 추천: **비권고** — 가치 근거가 약하고 Rust 예시 비용이 큽니다.

### Lazy Initialization (PoEAA Lazy Load)
- 갈래: GoF 밖 설계
- 한 줄 정의: 값이나 객체의 생성·로드를 처음 필요할 때까지 미루는 기법입니다. PoEAA Lazy Load의 의도는 "An object that doesn't contain all of the data you need but knows how to get it"이고, 네 가지 변형(Lazy Initialization, Virtual Proxy, Value Holder, Ghost)이 있습니다.
- 원전·출처: PoEAA 11장([eaaCatalog Lazy Load](https://martinfowler.com/eaaCatalog/lazyLoad.html), 조회 2026-09-17). 쪽 확인 안 함.
- 기존 33편과의 경계: Proxy 편의 가상 프록시(`proxy-pattern.md:18`)가 Lazy Load 네 변형 중 하나입니다. Singleton 편은 "게으른 초기화와 싱글톤은 동의어가 아니다"라고 이미 구분합니다(`singleton-pattern.md:38`).
- 필요한 spec: gof-guide
- 가치 근거: 두 편이 이미 경계를 다룹니다. 언어 표준 기능으로 흡수되는 추세이기도 합니다. Rust는 `LazyLock`을 1.80.0에서 안정화했습니다([std::sync::LazyLock](https://doc.rust-lang.org/std/sync/struct.LazyLock.html), 조회 2026-09-17).
- 비용 신호: 세 언어 모두 표준 기능 호출로 끝나서, 최소 조건으로 판정할 "구조"가 빈약합니다(판단).
- 추천: **비권고** — Singleton·Proxy 편 비교 절로 충분합니다.

### 간이 검토 — 형식 생략, 비권고

- **Registry**(PoEAA Base Patterns, [eaaCatalog](https://martinfowler.com/eaaCatalog/)): 역할 설명이 Singleton 편(`singleton-pattern.md:159`)과 Prototype 편의 Prototype Registry(`prototype-pattern.md:29`)에 이미 있습니다. 단독 편으로 둘 추가 근거를 찾지 못했습니다.
- **Double Dispatch**: Visitor 편 최소 조건 3(`visitor-pattern.md:30`)이 이미 정의합니다. 패턴을 구성하는 기법이지 독립 설계 단위가 아니라고 봤습니다(판단).
- **Role Object**(Bäumer·Riehle·Siberski·Wulf, PLoP '97, Intent "Adapt an object to different client's needs through transparently attached role objects", [riehle.org](https://riehle.org/computer-science/research/1997/plop-1997-role-object.html), 조회 2026-09-17): Party 편(사람·조직 추상)의 비교 대상으로 쓸 만합니다. 단독 편은 Party·Accountability와 도메인이 겹칩니다.
- **『Game Programming Patterns』 게임 특화 장**(Double Buffer, Game Loop, Update Method, Bytecode, Subclass Sandbox, Component, Event Queue, Data Locality, Dirty Flag, Spatial Partition — [목차](https://gameprogrammingpatterns.com/contents.html), 조회 2026-09-17): 게임 루프·렌더링 맥락을 전제하므로 이 레포의 두 트랙(GoF · 업무 도메인 분석) 밖입니다.
- **PoEAA 영속성·웹·분산 패턴**(Unit of Work, Identity Map, Data Mapper, Front Controller 등, [eaaCatalog](https://martinfowler.com/eaaCatalog/)): 인프라 계층이라 트랙 밖입니다. Repository만 DDD 기준선 용어로 다룹니다(3절).

## 2. 분석 패턴 후보

원서 목차는 Pearson이 공개한 목차 PDF로 확인했습니다([toc_9780134271439.pdf](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf), 조회 2026-09-17). 절 번호만 있고 쪽수는 없습니다. 원서 본문은 확인하지 못했고, 저자가 공개한 UML 도판 PDF(apchap2·3·5·6)로 구조를 확인했습니다.

### Temporal Property (Effectivity · Dual Time Record 포함)
- 갈래: 분석 패턴
- 한 줄 정의: 시간에 따라 값이 바뀌는 속성을 유효 기간이 붙은 값들의 이력으로 모델링하고, 날짜를 인자로 받는 접근자로 조회하게 하는 패턴입니다. 원문 표현으로는 "what is the value of this property at April 1st 2000"을 묻는 모델입니다.
- 원전·출처:
  - eaaDev 초안 세 편입니다.
    - Temporal Property(2004-03-07): "A property that changes over time"([링크](https://martinfowler.com/eaaDev/TemporalProperty.html))
    - Effectivity(2004-03-07): "Add a time period to an object to show when it is effective"([링크](https://martinfowler.com/eaaDev/Effectivity.html))
    - Temporal Patterns 서술(2005-02-16): actual time("the time something happened")과 record time("the time we knew about it")을 구분하는 bi-temporal 설명([링크](https://martinfowler.com/eaaDev/timeNarrative.html))

    모두 조회 2026-09-17입니다. eaaDev 목록 페이지는 이 초안들이 2006년 여름 이후 "frozen" 상태라고 적습니다([eaaDev](https://martinfowler.com/eaaDev/)).
  - 『Analysis Patterns』 3.8 Dual Time Record(목차). 도판 [apchap3.pdf](https://martinfowler.com/apsupp/apchap3.pdf) Figure 3.11에서 Observation은 recording time(Time Record)과 applicability(Time Period)를 따로 가집니다. 쪽 확인 안 함.
- 기존 33편과의 경계: Range 편과 가장 가깝습니다. Effectivity 원문은 "you should ensure you actually use Range for the effectivity range"라고 해 Range를 부품으로 씁니다. Range는 구간 값 자체이고, Temporal Property는 그 구간으로 속성 값의 이력을 조회하는 모델입니다.
- 필요한 spec: analysis-guide
- 가치 근거:
  - 분석 README의 「패턴 간 의존 관계」는 Range를 "Accountability 유효 기간, Measurement 정상 범위, Posting Rule 적용 기간"에 쓴다고 적습니다. 유효 기간 모델링을 여러 편이 전제하지만 정의한 편은 없습니다.
  - `posting-rule-pattern.md:97`의 "과거 사건은 그 시점에 유효했던 규칙으로 재처리·정정할 수 있다"는 기록 시점과 유효 시점의 구분(bi-temporal)을 이미 요구합니다.
  - 같은 개념을 원전 두 개(원서 3.8, eaaDev 2004–2005)가 다룹니다.
- 비용 신호:
  - 상황 설정 표 시안: bounded context는 인사·급여(원문 narrative의 급여율 변경 예 — 2월 15일 발효, 3월 15일 인지), aggregate root는 Employee, 급여율 이력은 (Range, 금액) VO 목록입니다. 불변식 "같은 속성의 유효 기간은 겹치지 않는다"는 시안의 판단이고 원문 문구는 아닙니다. 타 aggregate 참조는 없습니다. 네 행이 모두 채워집니다.
  - 코드: Rust 표준 라이브러리의 `std::time`에는 달력 날짜 타입이 없습니다([std::time](https://doc.rust-lang.org/std/time/index.html), 조회 2026-09-17). spec이 외부 crate를 금지하므로 Rust 예시는 날짜를 정수 일 번호 같은 자체 VO로 표현해야 합니다. 이 제약은 Range 편 재집필에도 똑같이 걸립니다.
- 추천: **채택 권고** — 기존 여러 편이 전제하는 개념의 정의 자리가 없고, 상황 설정 표가 공회전하지 않습니다.

### Adjustment (Reversal · Replacement · Difference)
- 갈래: 분석 패턴
- 한 줄 정의: 이미 전기한 잘못된 회계 항목을 바로잡는 세 가지 방식입니다.
  - Replacement: 삭제하고 새로 만듭니다.
  - Reversal: 반대 부호 항목으로 상쇄한 뒤 올바른 항목을 전기합니다.
  - Difference: 차이만큼만 전기합니다.
- 원전·출처:
  - eaaDev "Patterns for Accounting" 서술(2006-01-24, [링크](https://martinfowler.com/eaaDev/AccountingNarrative.html)):
    - Replacement는 "deletes the incorrect Accounting Transactions and creates the correct set ... you lose history"
    - Reversal은 "for each one you post an opposite Accounting Entry to cancel it out"
    - Difference는 "posts in new entries that represent the difference", 그리고 "performing one of the other adjustments in a Parallel Model"
  - Reversal Adjustment(2006-01-02, [링크](https://martinfowler.com/eaaDev/ReversalAdjustment.html)). 모두 조회 2026-09-17입니다.
  - 원서 6장 도판 [apchap6.pdf](https://martinfowler.com/apsupp/apchap6.pdf) 서문은 "there is a more up to date discussion of patterns in accounting at http://martinfowler.com/apsupp/accounting.pdf The patterns there supercede the patterns in the Analysis Patterns book"라고 적습니다. [accounting.pdf](https://martinfowler.com/apsupp/accounting.pdf)의 PDF 개요에 세 Adjustment가 들어 있습니다. 본문은 텍스트 추출이 안 돼 확인 안 함.
- 기존 33편과의 경계: Account 편과 겹칩니다. `account-pattern.md:16`, `:27`은 "상쇄(reversal) Entry로 정정"을 최소 조건 2로 이미 요구하지만 Replacement·Difference 대안과 선택 기준은 없습니다. Transaction 편과는 "균형 거래를 성립시키는 것"과 "성립한 거래를 정정하는 것"으로 나뉩니다.
- 필요한 spec: analysis-guide
- 가치 근거:
  - 하위 카드 .1 S4의 회계 배경 확정안이 "취소/정정"을 일관성 요구로 명시합니다(`KANBAN/cards/KAN-001.1-P5N9NF.md` 전략 절). 정정 방식은 Entry가 불변인지 가변인지를 바꿔 aggregate 설계에 영향을 줍니다. Reversal 원문도 "a simple alternative when entries are immutable"라고 적습니다.
  - 원문 "entries are mutable up to a certain date, and immutable after that. This will lead you to a combination"은 요청서가 강조한 "상황 설정에 따라 모델이 달라진다"의 직접 사례입니다.
- 비용 신호: 상황 설정 표는 bounded context 원장, root Transaction, 정정은 원 거래 id를 참조하는 새 Transaction(Reversal)으로 채워집니다. Difference는 원문상 Parallel Model이 전제라서 구현 절에서 빼고 비교로만 다루는 것이 맞습니다(판단).
- 추천: **보류(조건부)** — 회계 배경 확정안(.1 유저 결정 ②)이 정정 방식을 Reversal 하나로 고정하면 Account·Transaction 편의 `### 상황이 달라지면`으로 충분하므로 비권고입니다. 둘 이상을 허용하거나 방식 비교가 필요하면 채택입니다.

### Event Sourcing (Domain Event 포함)
- 갈래: 분석 패턴 (실제로는 아키텍처 수준)
- 한 줄 정의: 애플리케이션 상태의 모든 변경을 이벤트 객체의 순서열로 기록하고, 상태를 그 이벤트들로부터 재구성하는 패턴입니다. 원문은 "Capture all changes to an application state as a sequence of events"입니다.
- 원전·출처:
  - eaaDev Event Sourcing(2005-12-12, [링크](https://martinfowler.com/eaaDev/EventSourcing.html)): "Event Sourcing is the foundation for Parallel Models or Retroactive Events"
  - eaaDev Domain Event(2005-12-12, [링크](https://martinfowler.com/eaaDev/DomainEvent.html)): "Captures the memory of something interesting which affects the domain", Event Sourcing의 "necessary pattern"
  - DDD Reference p.13 Domain Events: 2004년 책 이후 도입된 용어로 표시됩니다.

  모두 조회 2026-09-17입니다.
- 기존 33편과의 경계: Account 편과 발상이 같습니다. 잔액을 Entry 합으로 도출하는 방식이며, `account-pattern.md:84`가 이 유사성을 이미 언급합니다. 차이는 범위입니다. Account는 한 개념(잔액)을 도출하고, Event Sourcing은 애플리케이션 상태 전체의 저장 방식입니다.
- 필요한 spec: 새 spec 필요 — aggregate 하나를 기준으로 한 analysis-guide 상황 설정 표에도, gof-guide의 코드 구조 판정에도 온전히 맞지 않습니다(판단).
- 가치 근거: DDD Reference 감사의 글이 CQRS와 Event Sourcing을 "now quite mainstream options for the architecture of a DDD system"이라고 적습니다. eaaDev의 Parallel Model·Retroactive Event·Agreement Dispatcher 계열도 이 패턴을 전제합니다.
- 비용 신호: 이벤트 저장·재생·스냅샷의 최소 구현은 세 언어로 자기완결하게 쓸 수 있지만 편당 코드량이 기존 분석 편보다 커집니다(판단).
- 추천: **비권고(이번 재집필)** — Domain Event는 DDD 기준선에서 정의하고, Event Sourcing은 Account 편 비교 대상으로 둡니다. 아키텍처 패턴 트랙을 따로 연다면 첫 후보입니다(판단).

### Money
- 갈래: 분석 패턴 (PoEAA Base Pattern)
- 한 줄 정의: 금액과 통화를 묶어 통화가 섞인 연산과 반올림 손실을 막는 값 객체입니다.
- 원전·출처: PoEAA 18장([eaaCatalog Money](https://martinfowler.com/eaaCatalog/money.html), 페이지 표기 2003-03-05, 조회 2026-09-17). 원문은 "avoid adding your dollars to your yen", "it's easy to lose pennies ... because of rounding errors"입니다. 쪽 확인 안 함.
- 기존 33편과의 경계: Quantity 편이 Money를 "통화 특화 변형"으로 이미 소개하고, 예시 코드 자체가 `Money` 클래스입니다(`quantity-pattern.md:6`, `:18`, `:46`). 단독 편이 더할 수 있는 것은 반올림 규칙입니다. `quantity-pattern.md:18`이 언급하는 분배(allocation)는 PoEAA 원문에서 확인하지 못했습니다.
- 필요한 spec: analysis-guide
- 가치 근거: 회계 편이 금액을 Quantity/Money로 표현하라고 요구합니다(`account-pattern.md` 최소 조건 3). 정의할 자리는 필요하지만 Quantity 편에 이미 있습니다.
- 비용 신호: VO 단독 패턴이라 상황 설정 표의 bounded context·aggregate 행이 공회전할 위험이 있습니다. 루트 카드가 "값 객체 계열에서 공회전하는지 파일럿 Quantity로 실측"하겠다고 적은 위험과 같습니다.
- 추천: **비권고(단독)** — Quantity 편의 개념 정의와 `### 상황이 달라지면`에 반올림 규칙을 흡수합니다.

### Organization Hierarchy · Organization Structure · Post
- 갈래: 분석 패턴
- 한 줄 정의: 셋으로 나뉩니다.
  - Organization Hierarchy: 조직 간 상하 관계를 조직의 자기 참조 계층(parent/subsidiary)으로 모델링합니다.
  - Organization Structure: 같은 관계를 유형(Organization Structure Type)과 기간(Time Period)을 가진 관계 객체로 모델링합니다.
  - Post: Person·Organization과 나란히 놓인 Party 하위 타입입니다.
- 원전·출처: 『Analysis Patterns』 2.2·2.3·2.9(목차). 도판 [apchap2.pdf](https://martinfowler.com/apsupp/apchap2.pdf)(조회 2026-09-17)에서 각 구조를 확인했습니다. 본문 확인 안 함.
  - Figure 2.4: Organization parent/subsidiary {hierarchy}
  - Figure 2.6: Organization Structure + Organization Structure Type + Time Period
  - Figure 2.8: Accountability + Accountability Type + Party
  - Figure 2.15: Party의 하위 타입 Person·Organization·Post
- 기존 33편과의 경계: Accountability 편이 이 전개의 끝입니다. 도판 2.6에서 2.8로 가면서 Organization Structure의 "조직 한정"이 Party로 일반화된 것이 Accountability입니다. `accountability-pattern.md:6`도 "Organization Structure(조직 구조 특화 변형)"를 별칭으로 둡니다. Post는 Party 편의 하위 타입 하나입니다.
- 필요한 spec: analysis-guide
- 가치 근거: 원서가 도판 번호 순서대로 Hierarchy → Structure → Accountability로 전개합니다. 따라서 Accountability 편의 개요에서 "왜 조직 계층만으로는 부족한가"라는 도입 동기로 쓰기 좋습니다. 단독 편으로는 Accountability와 대부분 겹칩니다.
- 비용 신호: 상황 설정 표는 채워지지만(조직 aggregate) 구현 코드가 Accountability 편 예시와 중복됩니다(판단).
- 추천: **비권고(단독)** — Accountability 편의 개요·비교 절과 Party 편의 개념 정의(Post)로 흡수합니다.

### Summary Account
- 갈래: 분석 패턴
- 한 줄 정의: 하위 계정(components)을 계층으로 묶고, 자기 항목을 하위 계정들의 항목에서 도출하는 계정입니다. 도판의 제약 문구는 "entries is derived as components.entries"입니다.
- 원전·출처: 『Analysis Patterns』 6.3(목차). 도판 [apchap6.pdf](https://martinfowler.com/apsupp/apchap6.pdf) Figure 6.5(Summary Account / Detail Account, components {hierarchy})와 Figure 6.6(allEntries = entries AND components.entries)으로 확인했습니다(조회 2026-09-17). 본문 확인 안 함.
- 기존 33편과의 경계: Account 편의 변형입니다. 구조는 GoF Composite(부분-전체 계층)를 계정에 적용한 모양입니다(도판 기준 판단).
- 필요한 spec: analysis-guide
- 가치 근거: 새로 생기는 불변식이 "상위 계정 항목 = 하위 계정 항목의 합" 하나라서 Account 편 `### 상황이 달라지면`의 한 행으로 수용할 수 있습니다(판단).
- 비용 신호: 단독 편이면 Account 편과 상황 설정 표가 거의 같아집니다(판단).
- 추천: **비권고(단독)** — Account 편에 흡수합니다. 같은 장의 Memo Account(6.4)·Corresponding Account(6.13)는 목차 위치만 확인했고 내용을 확인하지 못해 경계를 쓸 수 없으므로, 판단 기준에 따라 후보에서 뺐습니다.

### Identification Scheme (Name · Object Merge 포함)
- 갈래: 분석 패턴
- 한 줄 정의: 객체가 여러 식별자(Identifier)를 갖고, 각 식별자가 어느 식별 체계(Identification Scheme)에 속하는지를 모델로 두는 패턴입니다. Object Merge는 같은 대상을 가리키는 두 객체가 발견됐을 때 하나로 합치는 문제를 다룹니다(도판상 Active Object / Superseded Object).
- 원전·출처: 『Analysis Patterns』 5장 5.1 Name · 5.2 Identification Scheme · 5.3 Object Merge · 5.4 Object Equivalence(목차). 도판 [apchap5.pdf](https://martinfowler.com/apsupp/apchap5.pdf) Figure 5.1–5.5(조회 2026-09-17). 본문 확인 안 함.
- 기존 33편과의 경계: DDD Entity와 가깝습니다. DDD Reference p.11은 Entity에 대해 "Define a means of distinguishing each object regardless of its form or history"라고 요구합니다. Entity는 "식별자로 구분돼야 한다"는 요구이고, Identification Scheme은 "식별자가 여럿이고 체계마다 유일하다"는 구조입니다. Party 편(당사자 식별)과도 닿습니다.
- 필요한 spec: analysis-guide
- 가치 근거: DDD 기준선을 채택하면 Entity 절에서 식별자 설계를 다룰 자리가 생깁니다. 반면 원서 본문을 확인하지 못해 단독 편을 쓸 1차 자료가 도판뿐입니다.
- 비용 신호: 1차 자료가 부족해 집필 워커가 원서를 따로 확보해야 합니다.
- 추천: **비권고(단독)** — 기준선을 채택하면 Entity 절의 보충 예로만 씁니다.

### 간이 검토 — 형식 생략, 비권고

- **Conversion Ratio · Compound Units**(원서 3.2·3.3, apchap3 Figure 3.3·3.4): Quantity의 확장입니다. `quantity-pattern.md:122`가 "변환 규칙 관리"를 한계로 이미 언급합니다. Quantity 편 `### 상황이 달라지면`으로 흡수합니다.
- **Protocol · Rejected Observation · Active Observation/Hypothesis/Projection · Associated Observation · Process of Observation**(원서 3.7·3.9–3.12): 도판(apchap3 Figure 3.10·3.12–3.14)상 Observation 모델의 확장입니다. Rejected Observation은 Observation의 동적 하위 타입, Associated Observation은 evidence 연결입니다. Observation 편 `### 상황이 달라지면` 후보로만 둡니다.
- **Enterprise Segment · Measurement Protocol · Phenomenon with Range**(원서 4.1·4.2·4.4): 기업 재무라는 특정 도메인의 관찰 모델입니다. Range·Measurement 편의 예시 배경으로 쓸 수 있습니다.
- **원서 6장 나머지**(6.6–6.12, 6.14–6.15: Individual Instance Method, Posting Rule Execution, Choosing Entries, Accounting Practice, Sources of an Entry 등): Posting Rule 편의 구현 변형입니다. 저자가 이 장을 accounting.pdf로 대체한다고 명시했으므로(위 Adjustment 출처) 새 편을 만들 근거가 약합니다.
- **Planning · Trading · Derivative Contracts · Trading Packages**(원서 8–11장): 목차만 확인했고 본문과 도판을 확인하지 않아 경계를 한 줄로 쓸 수 없습니다. 판단 기준에 따라 뺍니다. 참고로 Specification 논문이 §9.2 Portfolio를 예로 들므로 Specification 편의 상황 설정 소재로는 쓸 수 있습니다.
- **Part 2 Support Patterns**(원서 12–15장: Layered Architecture, Application Facades, Type Model Design Templates, Association Patterns): 분석 패턴이 아니라 구현 지원 패턴입니다. Application Facade는 GoF Facade 편과 이름이 겹치지만 목차만 확인했습니다.
- **eaaDev Temporal의 나머지**(Time Point, Temporal Object, Snapshot, Audit Log): Temporal Property 후보의 비교 대상으로 흡수합니다(timeNarrative가 한 서술 안에서 함께 다룹니다).
- **eaaDev Presentation Patterns**(Presentation Model, Passive View 등 10개, [eaaDev](https://martinfowler.com/eaaDev/)): UI 아키텍처라 트랙 밖입니다.
- **eaaDev Events의 나머지**(Event Collaboration, Parallel Model, Retroactive Event, Agreement Dispatcher): Event Sourcing을 전제하므로 Event Sourcing 비권고를 따릅니다.

## 3. DDD 전술 용어 기준선 문서

### DDD 전술 용어 기준선 (Bounded Context · Entity · Value Object · Aggregate · Repository · Domain Event · Factory · Domain Service)
- 갈래: DDD 기준선
- 한 줄 정의: 분석 패턴 10편이 상황 설정 표와 구현 절에서 쓰는 DDD 전술 용어를 한 편에서 정의하고, 10편은 그 정의를 참조하는 기준선 문서입니다.
- 원전·출처:
  - Eric Evans, 『Domain-Driven Design Reference』 2015-03, CC BY 4.0([소개](https://www.domainlanguage.com/ddd/reference/), [PDF](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf), 조회 2026-09-17). 용어별 쪽은 Bounded Context p.2, Entities p.11, Value Objects p.12, Domain Events p.13(2004년 책 이후 도입된 용어로 표시), Services p.14, Aggregates p.16, Repositories p.17, Factories p.18입니다.
  - Evans 『Domain-Driven Design』 5장(Entities, Value Objects, Services, Modules)·6장(Aggregates, Factories, Repositories)([dddcommunity.org 목차](https://www.dddcommunity.org/uncategorized/toc/), 조회 2026-09-17).
  - Fowler bliki "DDD_Aggregate", 2013-04-23: "Any references from outside the aggregate should only go to the aggregate root", "Transactions should not cross aggregate boundaries"([링크](https://martinfowler.com/bliki/DDD_Aggregate.html), 조회 2026-09-17).
  - Fowler bliki "ValueObject", 2016-11-14: 값으로 동등성 판단, "value objects should be immutable". 옛 J2EE 문헌이 DTO를 "value object"라 부른 용법도 주의로 적습니다([링크](https://martinfowler.com/bliki/ValueObject.html), 조회 2026-09-17).
  - Vaughn Vernon, "Effective Aggregate Design" Part II(2011), 규칙 "Reference Other Aggregates By Identity"([소개](https://www.dddcommunity.org/library/vernon_2011/), [PDF](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf), 조회 2026-09-17).
- 기존 33편과의 경계: 기존 편과 내용이 겹치지 않습니다. 분석 10편 본문을 검색한 결과는 다음과 같습니다.
  - Aggregate·Repository·Domain Event·Domain Service·Factory·Bounded Context: 언급 0편
  - Entity: 1편(`party-pattern.md`)
  - Value Object·값 객체: 7편

  이름이 겹치는 곳은 GoF Factory Method·Abstract Factory뿐입니다. DDD Factory는 "creation of an entire, internally consistent aggregate, or a large value object"를 캡슐화하는 **생성 책임의 위치** 문제이고(Reference p.18), GoF 생성 패턴은 **생성할 타입의 결정** 문제입니다(판단).
- 필요한 spec: **새 spec 필요** — 패턴이 아니라 용어 정의 문서라서, gof-guide·analysis-guide의 필수 절(최소 조건 · 세 언어 구현 · 상황 설정 표)이 맞지 않습니다.
- 가치 근거:
  - analysis-guide spec의 상황 설정 MUST 표(루트 카드 「새 골격」 analysis-guide 차이)가 bounded context · root/entity/VO 배정 · 타 aggregate 참조 방식을 요구합니다. 따라서 **10편 모두** 이 용어를 씁니다.
  - 요청서는 "등장하는 개념들을 빠짐없이 소개하고 정의한다"를 요구합니다.
  - 루트 카드 전략 절은 "분석 패턴 10편은 aggregate 경계를 정의하지 않은 채 경계를 암시하는 코드를 싣는다"는 것을 재집필 이유로 적었습니다. 경계를 정의할 용어 정본이 지금은 없습니다.
- 비용 신호: 새 spec 1개, 검증 명령 수정(33편 집계 · `--gates` · HTML 수에서 기준선 제외 또는 별도 집계), 그리고 **순서 제약**이 붙습니다. 분석 편 파일럿(.3 S2 Account, Quantity)이 이 문서를 참조하므로 .7(추가 패턴 카드)이 아니라 .2 또는 .3 파일럿보다 앞에 둬야 합니다.
- 추천: **채택 권고** — 정의 반복을 막는 비용(문서 1편 + spec 1개)이 반복 비용보다 작습니다(아래 비교).

#### 신설하지 않을 때 — 10편이 각자 정의

- 장점: 각 편이 자기완결입니다. 독자가 링크를 따라가지 않아도 되고, 요청서 문구를 가장 문자 그대로 충족합니다.
- 반복량: MUST 표가 요구하는 용어만 해도 최소 넷(Bounded Context · Aggregate root · Entity · VO)입니다. 10편이면 정의가 최소 40회 반복됩니다(표 행에서 센 값).
- 정의가 갈라질 위험: 현재 검증 명령 중 편 사이 정의 문장이 같은지 검사하는 것은 없습니다. `--spec-shared`는 spec 파일의 공유 블록만 봅니다. 10편의 정의가 조금씩 달라져도 게이트가 잡지 못합니다.
- 게이트 비용: 이해 게이트·외부 검토(편당 외부 모델 호출 2회, 루트 카드 수행안 절)가 같은 용어 정의를 10번 다시 봅니다.

#### 신설할 때 — 기준선 1편 + 10편은 한 줄 정의와 링크

- 정본이 한 곳입니다. 각 편의 `### 등장하는 개념과 정의`에는 한 줄 요약 + 기준선 링크만 둡니다.
- 출처 라이선스: DDD Reference가 CC BY 4.0이라 출처를 표기하면 원문 정의를 인용·번역해 기준선에 실을 수 있습니다.
- 규칙 근거를 한 곳에 둡니다. analysis-guide의 "aggregate 간 객체 참조 0" 규칙의 근거(Fowler "references from outside ... only go to the aggregate root", Vernon "Reference Other Aggregates By Identity")를 10편이 반복해서 대지 않아도 됩니다.
- 연결: Knowledge Level은 DDD Reference p.51에도 독립 항목으로 있어 기준선에서 분석 편으로 링크를 걸 수 있습니다.
- 사람 판단이 필요한 한 가지: "한 줄 정의 + 정본 링크"가 요청서의 "빠짐없이 정의"를 충족한다고 볼지는 유저가 판정할 문제입니다. 충족하지 않는다고 보면 신설해도 각 편에 짧은 정의가 남아 절감 폭이 줄어듭니다.
- 권장 범위: Reference Part II Building Blocks 중 7개(Entities, Value Objects, Domain Events, Services, Aggregates, Repositories, Factories)에, MUST 표 첫 행이 요구하는 Bounded Context를 더합니다. Layered Architecture·Modules는 빼는 것이 적당합니다(판단).

## 4. 현재 구성에서 빼거나 합칠 것이 있는가

**결론: 편을 빼거나 합칠 근거는 없습니다.** 아래 세 가지는 편 수와 무관하게 재집필 때 반영할 관찰입니다.

### 관찰 1 — Observation 편의 이름이 원전 구조와 어긋남
- 원서 도판(apchap3.pdf Figure 3.7·3.9)에서 **Observation은 상위 타입**이고 Measurement와 Category Observation이 그 하위 타입입니다.
- 현 가이드는 원전의 Category Observation을 Observation이라고 부릅니다.
  - `observation-pattern.md:3`: Observation을 "정성적(범주형) 사실"로 정의합니다.
  - `:6`: 별칭에 Category Observation을 둡니다.
  - `:34`: "정량은 Measurement, 정성은 Observation으로 나뉜다"고 적습니다.
  - 그런데 `:16`은 "공통 상위 개념(예: Observation 추상)"이라고 적어, 한 문서 안에서 Observation이 두 뜻으로 쓰입니다.
- 처분안:
  - (a) 편 수를 유지하고 Observation 편을 원전대로 "상위 타입 Observation + Category Observation"으로 정정합니다. **권고** — 원서 목차가 3.4 Measurement와 3.5 Observation을 별도 절로 둡니다.
  - (b) 두 편을 1편으로 합칩니다. 편 수가 33에서 32로 줄고 검증 숫자가 바뀝니다.

### 관찰 2 — 회계 3편의 1차 출처: 저자가 원서 6장의 대체를 명시함
- apchap6.pdf 서문: "The patterns there [accounting.pdf] supercede the patterns in the Analysis Patterns book".
- 기존 Account·Transaction·Posting Rule 편의 참고 자료는 원서만 인용합니다(`account-pattern.md:167`, `transaction-pattern.md:175`, `posting-rule-pattern.md:181`).
- eaaDev Accounting Entry(2005-01-22, [링크](https://martinfowler.com/eaaDev/AccountingEntry.html), 조회 2026-09-17)는 "Account often goes with Accounting Entry"라고 하면서도 "this is not always the case. Some see entries without accounts"라고 적습니다. 요청서가 든 "entry가 홀로 존재할 수도 있다"는 경우의 원전 근거입니다.
- 처분: 편 수는 바뀌지 않습니다. .1 S3 분석 패턴 노트와 S4 회계 배경 확정안에서 eaaDev 초안·accounting.pdf를 원서 6장과 함께 1차 출처로 쓰는 것을 권합니다.

### 관찰 3 — 나머지 분석 편은 원서 절과 1:1로 대응하고, Knowledge Level만 독립 절이 없음
- 원서 목차 대응: Party 2.1, Accountability 2.4, Quantity 3.1, Measurement 3.4, Observation 3.5, Range 4.3, Account 6.1, Transaction 6.2("Transactions"), Posting Rule 6.5("Posting Rules").
- Knowledge Level은 원서에 독립 절이 없고 2.5 "Accountability Knowledge Level"만 있습니다. 기존 편도 "여러 장에 걸쳐 등장"이라고 적습니다(`knowledge-level-pattern.md:160`). 대신 DDD Reference p.51이 Knowledge Level을 독립 패턴으로 싣고 Fowler 1997을 인용하므로 유지할 근거는 충분합니다.

### GoF 23편 — 관찰 없음
- 근거 1: 23편이 GoF 카탈로그의 항목과 하나씩 대응합니다(`PATTERNS.md`). 중복된 편이 없습니다.
- 근거 2: 구조가 비슷해 자주 혼동되는 쌍(`PATTERNS.md` 「빠른 비교가 자주 필요한 페어」 5쌍)은 새 골격의 `### 비슷한 패턴·안티패턴과의 차이` 절에서 다루도록 설계돼 있습니다(루트 카드 결정 2). 합칠 이유가 아니라 비교할 이유입니다.

## 5. 결정

유저 결정 대기 — 검토서 판단 항목으로 올라간다.

## 출처

모든 항목의 조회일은 2026-09-17입니다.

**Fowler — 『Analysis Patterns』 관련**
- [martinfowler.com — Analysis Patterns 책 페이지](https://martinfowler.com/books/ap.html) — 출판 연도를 1996으로 표기합니다. 레포 README는 1997로 표기하고, 도판 PDF의 저작권 표기는 1997입니다. 판권 연도 확인 안 함.
- [Pearson — Analysis Patterns 목차 PDF](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf)
- [martinfowler.com — UML Diagrams for Chapter 2 (apchap2.pdf)](https://martinfowler.com/apsupp/apchap2.pdf)
- [martinfowler.com — UML Diagrams for Chapter 3 (apchap3.pdf)](https://martinfowler.com/apsupp/apchap3.pdf)
- [martinfowler.com — UML Diagrams for Chapter 5 (apchap5.pdf)](https://martinfowler.com/apsupp/apchap5.pdf)
- [martinfowler.com — UML Diagrams for Chapter 6 (apchap6.pdf)](https://martinfowler.com/apsupp/apchap6.pdf)
- [martinfowler.com — Accounting Patterns (accounting.pdf)](https://martinfowler.com/apsupp/accounting.pdf) — PDF 개요만 확인, 본문 추출 안 됨

**Fowler — eaaDev 초안**
- [eaaDev 목록](https://martinfowler.com/eaaDev/)
- [Temporal Patterns 서술](https://martinfowler.com/eaaDev/timeNarrative.html)
- [Effectivity](https://martinfowler.com/eaaDev/Effectivity.html)
- [Temporal Property](https://martinfowler.com/eaaDev/TemporalProperty.html)
- [Patterns for Accounting 서술](https://martinfowler.com/eaaDev/AccountingNarrative.html)
- [Reversal Adjustment](https://martinfowler.com/eaaDev/ReversalAdjustment.html)
- [Accounting Entry](https://martinfowler.com/eaaDev/AccountingEntry.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Domain Event](https://martinfowler.com/eaaDev/DomainEvent.html)

**Fowler — PoEAA · 기타**
- [PoEAA 카탈로그](https://martinfowler.com/eaaCatalog/)
- [PoEAA Money](https://martinfowler.com/eaaCatalog/money.html)
- [PoEAA Special Case](https://martinfowler.com/eaaCatalog/specialCase.html)
- [PoEAA Lazy Load](https://martinfowler.com/eaaCatalog/lazyLoad.html)
- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html)
- [Evans & Fowler — Specifications (spec.pdf)](https://martinfowler.com/apsupp/spec.pdf)
- [refactoring.com — Introduce Special Case](https://refactoring.com/catalog/introduceSpecialCase.html)
- [bliki — DDD_Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html)
- [bliki — ValueObject](https://martinfowler.com/bliki/ValueObject.html)

**GoF 밖 설계 패턴**
- [InformIT — Pattern Languages of Program Design 3](https://www.informit.com/store/pattern-languages-of-program-design-3-9780201310115)
- [Wikipedia — Null object pattern](https://en.wikipedia.org/wiki/Null_object_pattern)
- [Erich Gamma — The Extension Objects Pattern (PDF 사본)](https://ecs.syr.edu/faculty/fawcett/handouts/cse776/PatternPDFs/ExtensionObject.pdf)
- [Riehle — Role Object (PLoP '97)](https://riehle.org/computer-science/research/1997/plop-1997-role-object.html)
- [Mark Seemann — Service Locator is an Anti-Pattern](https://blog.ploeh.dk/2010/02/03/ServiceLocatorisanAnti-Pattern/)
- [Game Programming Patterns — 목차](https://gameprogrammingpatterns.com/contents.html)
- [Game Programming Patterns — Object Pool](https://gameprogrammingpatterns.com/object-pool.html)
- [Game Programming Patterns — Type Object](https://gameprogrammingpatterns.com/type-object.html)
- [Game Programming Patterns — Service Locator](https://gameprogrammingpatterns.com/service-locator.html)

**DDD**
- [Domain Language — DDD Reference 소개](https://www.domainlanguage.com/ddd/reference/)
- [DDD Reference 2015-03 PDF](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf)
- [dddcommunity.org — Domain-Driven Design 목차](https://www.dddcommunity.org/uncategorized/toc/)
- [dddcommunity.org — Effective Aggregate Design](https://www.dddcommunity.org/library/vernon_2011/)
- [Vernon — Effective Aggregate Design Part II PDF](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf)

**Rust 표준 라이브러리 문서**
- [std::option](https://doc.rust-lang.org/std/option/index.html)
- [std::sync::LazyLock](https://doc.rust-lang.org/std/sync/struct.LazyLock.html)
- [std::any](https://doc.rust-lang.org/std/any/index.html)
- [std::time](https://doc.rust-lang.org/std/time/index.html)

# 디자인 패턴 가이드 인덱스

GoF(Gang of Four) 23개 디자인 패턴의 한국어 가이드 모음. 각 문서는 authoring-kit 명세 `gof-guide`(분석 패턴은 `analysis-guide`)가 정한 골격을 따른다.

> 가이드 작성 자동화: `.claude/skills/design-pattern-guide`
> 코드 부합도 분석: `.claude/skills/design-pattern-analyzer`

## Creational Patterns (생성 패턴)

객체 생성 메커니즘을 다루며, 상황에 맞는 객체 생성 방식을 제공한다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Singleton (싱글톤) | 클래스가 단 하나의 인스턴스만 가지도록 보장하고 전역 접근점을 제공 | [singleton-guide_v1.0.1.md](pattern-guide/design-pattern-guide/singleton/singleton-guide_v1.0.1.md) |
| Factory Method (팩토리 메서드) | 객체 생성의 책임을 서브클래스로 위임 | [factory-method-guide_v1.0.1.md](pattern-guide/design-pattern-guide/factory-method/factory-method-guide_v1.0.1.md) |
| Abstract Factory (추상 팩토리) | 관련된 제품군(family)을 일관되게 생성하는 인터페이스 제공 | [abstract-factory-guide_v1.0.1.md](pattern-guide/design-pattern-guide/abstract-factory/abstract-factory-guide_v1.0.1.md) |
| Builder (빌더) | 복잡한 객체의 생성 과정을 단계적으로 분리 | [builder-guide_v1.0.1.md](pattern-guide/design-pattern-guide/builder/builder-guide_v1.0.1.md) |
| Prototype (프로토타입) | 미리 만들어 둔 견본을 복제해 새 객체를 얻음 | [prototype-guide_v1.0.1.md](pattern-guide/design-pattern-guide/prototype/prototype-guide_v1.0.1.md) |

## Structural Patterns (구조 패턴)

클래스와 객체를 더 큰 구조로 조합하는 방법을 다룬다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Adapter (어댑터) | 호환되지 않는 인터페이스 사이를 변환 | [adapter-guide_v1.0.1.md](pattern-guide/design-pattern-guide/adapter/adapter-guide_v1.0.1.md) |
| Bridge (브릿지) | 추상(Abstraction)과 구현(Implementor)을 분리해 독립적으로 확장 | [bridge-guide_v1.0.1.md](pattern-guide/design-pattern-guide/bridge/bridge-guide_v1.0.1.md) |
| Composite (컴포지트) | 부분-전체 계층을 같은 인터페이스로 다루고, 묶음의 답은 자식들의 답을 모아 만듦 | [composite-guide_v1.0.1.md](pattern-guide/design-pattern-guide/composite/composite-guide_v1.0.1.md) |
| Decorator (데코레이터) | 객체에 동적으로 책임을 추가 | [decorator-guide_v1.0.1.md](pattern-guide/design-pattern-guide/decorator/decorator-guide_v1.0.1.md) |
| Facade (퍼사드) | 서브시스템에 통합된 단순한 진입점 제공 | [facade-guide_v1.0.1.md](pattern-guide/design-pattern-guide/facade/facade-guide_v1.0.1.md) |
| Flyweight (플라이웨이트) | 다수의 미세 객체를 공유로 효율화 | [flyweight-guide_v1.0.1.md](pattern-guide/design-pattern-guide/flyweight/flyweight-guide_v1.0.1.md) |
| Proxy (프록시) | 다른 객체에 대한 접근을 대리/제어 | [proxy-guide_v1.0.1.md](pattern-guide/design-pattern-guide/proxy/proxy-guide_v1.0.1.md) |

## Behavioral Patterns (행위 패턴)

객체 간 책임 분배와 상호작용 방식을 다룬다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Chain of Responsibility (책임 연쇄) | 후보를 한 줄로 세워 요청을 흘려보내고, 맡을 수 있는 첫 후보가 처리하고 멈춤 | [chain-of-responsibility-guide_v1.0.1.md](pattern-guide/design-pattern-guide/chain-of-responsibility/chain-of-responsibility-guide_v1.0.1.md) |
| Command (커맨드) | 요청을 객체로 만들어 부르는 쪽이 실행 연산만 알게 함 | [command-guide_v1.0.1.md](pattern-guide/design-pattern-guide/command/command-guide_v1.0.1.md) |
| Interpreter (인터프리터) | 문법 규칙 하나를 타입 하나로 세우고, 문장의 뜻을 트리에서 합성 | [interpreter-guide_v1.0.1.md](pattern-guide/design-pattern-guide/interpreter/interpreter-guide_v1.0.1.md) |
| Iterator (이터레이터) | 순회 위치를 집합 밖의 순회자에 들려, 내부 표현을 숨긴 채 원소를 차례로 내줌 | [iterator-guide_v1.0.1.md](pattern-guide/design-pattern-guide/iterator/iterator-guide_v1.0.1.md) |
| Mediator (중재자) | 동료들이 서로를 참조하지 않고 중재자를 거쳐 협력하게 함 | [mediator-guide_v1.0.1.md](pattern-guide/design-pattern-guide/mediator/mediator-guide_v1.0.1.md) |
| Memento (메멘토) | 되돌릴 상태를 통째로 떠서, 아무도 못 여는 값으로 맡김 | [memento-guide_v1.0.1.md](pattern-guide/design-pattern-guide/memento/memento-guide_v1.0.1.md) |
| Observer (옵저버) | 1:N 의존성 관계에서 상태 변화 자동 통보 | [observer-guide_v1.0.1.md](pattern-guide/design-pattern-guide/observer/observer-guide_v1.0.1.md) |
| State (상태) | 상태마다 객체를 두고 요청을 위임하며, 그 상태 객체가 실행 중에 바뀜 | [state-guide_v1.0.1.md](pattern-guide/design-pattern-guide/state/state-guide_v1.0.1.md) |
| Strategy (전략) | 알고리즘군을 캡슐화하고 런타임 교체 | [strategy-guide_v1.1.1.md](pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.1.md) |
| Template Method (템플릿 메서드) | 알고리즘 골격을 상위 타입에, 달라지는 단계만 하위 타입에 | [template-method-guide_v1.0.1.md](pattern-guide/design-pattern-guide/template-method/template-method-guide_v1.0.1.md) |
| Visitor (방문자) | 원소 타입마다 갈리는 연산을 원소 밖 한 클래스에 모으고, 어느 연산인지는 원소가 고름 | [visitor-guide_v1.0.1.md](pattern-guide/design-pattern-guide/visitor/visitor-guide_v1.0.1.md) |

## GoF 밖 설계 패턴

GoF 23편에는 없지만 같은 층에서 쓰이는 설계 패턴이다. 원전이 원서가 아니라 **논문이나 저자 공개 자료**이고, 그래서 근거 괄호가 장·절 번호 대신 **문서 제목과 절 이름**을 적는다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Specification (명세) | 후보가 기준을 만족하는지 판정하는 책임을 후보와 분리된 객체에 두고, 그 객체를 조합해 기준을 쌓음 | [specification-guide_v1.0.1.md](pattern-guide/design-pattern-guide/specification/specification-guide_v1.0.1.md) |
| Dependency Injection (의존성 주입) | 협력 객체를 스스로 만들거나 찾지 않고, 조립자가 추상 타입의 구현을 생성자·설치 연산으로 넣어 줌 | [dependency-injection-guide_v1.0.1.md](pattern-guide/design-pattern-guide/dependency-injection/dependency-injection-guide_v1.0.1.md) |
| Null Object (널 객체) | 협력자가 없는 상태를 빈 참조가 아니라 같은 인터페이스의 중립 동작 객체로 표현해, 쓰는 쪽에서 부재 검사를 없앰 | [null-object-guide_v1.0.1.md](pattern-guide/design-pattern-guide/null-object/null-object-guide_v1.0.1.md) |

## 분석 패턴 (Analysis Patterns)

Martin Fowler 『Analysis Patterns』(1997)의 분석 패턴이다. GoF 가 **구현 설계**의 반복을 다룬다면 이쪽은 **도메인을 개념으로 모델링하는 단계**의 반복을 다룬다 — 사람·조직·관계·측정·회계처럼 업무 시스템의 뼈대가 되는 구조다.
계열별 분류와 패턴 간 의존 흐름은 [분석 패턴 인덱스](pattern-guide/ddd-analysis-pattern-guide/README.md)에 있다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Party (당사자) | 사람과 조직을 한 이름으로 받아 공통인 것을 그 한 자리에 모음 | [party-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/party/party-guide_v1.0.1.md) |
| Accountability (책임 관계) | 두 당사자를 잇는 관계를 칸이 아니라 개념으로 세워 종류·기간을 닮 | [accountability-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/accountability/accountability-guide_v1.0.1.md) |
| Knowledge Level (지식 수준) | 사실을 해석하는 규칙을 사실과 다른 층에 인스턴스로 세움 | [knowledge-level-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/knowledge-level/knowledge-level-guide_v1.0.1.md) |
| Quantity (수량) | 값과 단위를 묶어 단위 안전 연산 제공 | [quantity-guide_v1.1.1.md](pattern-guide/ddd-analysis-pattern-guide/quantity/quantity-guide_v1.1.1.md) |
| Range (범위) | 두 끝과 「그 끝을 포함하는가」를 한 값에 담아 경계 판정을 한 곳에 모음 | [range-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/range/range-guide_v1.0.1.md) |
| Temporal Property (시간 속성) | 시간에 따라 바뀌는 속성을 유효 기간이 붙은 값들의 이력으로 두고, 시점을 인자로 받는 접근자로 그 시점의 값을 돌려줌 | [temporal-property-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/temporal-property/temporal-property-guide_v1.0.1.md) |
| Measurement (측정) | 값 하나를 대상·항목과 묶어 기록 한 건으로 세운다 | [measurement-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/measurement/measurement-guide_v1.0.1.md) |
| Observation (관찰) | 대상에 대한 사실을 값의 종류와 상관없이 한 층으로 다룬다 | [observation-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/observation/observation-guide_v1.0.1.md) |
| Account (계정) | 잔액을 항목(Entry)의 합으로 도출 | [account-guide_v1.1.1.md](pattern-guide/ddd-analysis-pattern-guide/account/account-guide_v1.1.1.md) |
| Transaction (거래) | 함께 적어야 할 기록을 한 묶음으로 만들고, 만드는 자리에서 합을 0 으로 맞춤 | [transaction-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/transaction/transaction-guide_v1.0.1.md) |
| Posting Rule (전기 규칙) | 무엇에 반응해 얼마를 어느 계정에 적을지를 규칙 하나가 쥔다 | [posting-rule-guide_v1.0.1.md](pattern-guide/ddd-analysis-pattern-guide/posting-rule/posting-rule-guide_v1.0.1.md) |

> 분석 패턴의 「최소 조건」은 코드 구조가 아니라 **개념적 책임 분리**를 기준으로 판정한다 — 같은 모델이 상속·인터페이스·값 객체·규칙 엔진 등 여러 형태로 실현되기 때문이다.

## 빠른 비교가 자주 필요한 페어

각 가이드의 「비슷한 패턴·안티패턴과의 차이」 절에서 더 자세히 다룬다.

- Factory Method ↔ Abstract Factory: 생성을 제품을 쓰는 클래스 **자신의 하위 클래스**에 미루는가(제품 한 종류) vs **별개의 팩토리 객체**에 미루는가(서로 맞물리는 제품군)
- Strategy ↔ State: 구현 객체들이 같은 계산의 대안인가 vs 객체가 오가는 상태인가 — 요청 처리 결과로 다음 구현이 정해지는 코드가 있는지는 **먼저 보는 곳**이고, 밖에서 온 선택으로 갈아 끼워도 State 일 수 있다
- Adapter ↔ Decorator ↔ Proxy: 인터페이스 변환 vs 행위 추가 vs 접근 제어
- Builder ↔ Abstract Factory: 조립 단계를 순서대로 부르고 마지막에 결과를 꺼내는가 vs 호출 한 번에 완성된 제품을 받는가
- Mediator ↔ Facade: 가운데 객체를 **안쪽 객체들도** 아는가 vs **바깥 Client 만** 아는가 — 갈리는 것은 방향이다

## 참고 문서

가이드가 기대는 **주제 밖 사전 지식**을 원서 없이 읽히게 푼 문서다. 패턴의 판정·비교·구현은 싣지 않는다 — 그건 가이드의 몫이다.
가이드 본문이 필요한 자리에서 이 문서들을 내부 링크로 가리킨다.

| 문서 | 답하는 것 |
| --- | --- |
| [GoF 공통 어휘](pattern-guide/reference/gof-vocabulary/gof-vocabulary-ref_v1.0.2.md) | 인터페이스에 프로그래밍 · 위임 · 클래스/객체 패턴 · 결합 시점과 디스패치 · 내재/외재 상태 · Invoker·Receiver·Command |
| [DDD 전술 용어](pattern-guide/reference/ddd-tactical-terms/ddd-tactical-terms-ref_v1.0.2.md) | Bounded Context · Aggregate · Root · Entity · Value Object · id 참조 · 불변식 · Repository |
| [복식부기와 회계 모델](pattern-guide/reference/accounting-model/accounting-model-ref_v1.0.2.md) | 부호 규약 · 원장과 전기 · 역분개 · Account · Entry · Transaction · AccountType · 지식/운영 층위 · Posting Rule · Money |
| [수량·측정·관측 모델](pattern-guide/reference/observation-model/observation-model-ref_v1.0.2.md) | Quantity · Unit · Conversion Ratio · Compound Unit · Money · Measurement · Observation · Range · Rejected Observation |

## 코드 부합도 분석

각 가이드의 "## 디자인 패턴을 충족하는 최소 조건" 섹션은 `design-pattern-analyzer` skill 이 사용하는 평가 기준이다. 작성한 코드가 해당 패턴에 부합하는지 검사하려면:

> "python/patterns/observer.py 가 Observer 패턴 부합하는지 분석해줘"

처럼 요청하면 분석 리포트가 `analysis/` 폴더에 생성된다.

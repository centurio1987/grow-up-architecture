# 디자인 패턴 가이드 인덱스

GoF(Gang of Four) 23개 디자인 패턴의 한국어 가이드 모음. 각 문서는 authoring-kit 명세 `gof-guide`(분석 패턴은 `analysis-guide`)가 정한 골격을 따른다.

> 가이드 작성 자동화: `.claude/skills/design-pattern-guide`
> 코드 부합도 분석: `.claude/skills/design-pattern-analyzer`

## Creational Patterns (생성 패턴)

객체 생성 메커니즘을 다루며, 상황에 맞는 객체 생성 방식을 제공한다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Singleton (싱글톤) | 클래스가 단 하나의 인스턴스만 가지도록 보장하고 전역 접근점을 제공 | [singleton-guide_v1.0.0.md](pattern-guide/design-pattern-guide/singleton/singleton-guide_v1.0.0.md) |
| Factory Method (팩토리 메서드) | 객체 생성의 책임을 서브클래스로 위임 | [factory-method-guide_v1.0.0.md](pattern-guide/design-pattern-guide/factory-method/factory-method-guide_v1.0.0.md) |
| Abstract Factory (추상 팩토리) | 관련된 제품군(family)을 일관되게 생성하는 인터페이스 제공 | [abstract-factory-guide_v1.0.0.md](pattern-guide/design-pattern-guide/abstract-factory/abstract-factory-guide_v1.0.0.md) |
| Builder (빌더) | 복잡한 객체의 생성 과정을 단계적으로 분리 | [builder-guide_v1.0.0.md](pattern-guide/design-pattern-guide/builder/builder-guide_v1.0.0.md) |
| Prototype (프로토타입) | 미리 만들어 둔 견본을 복제해 새 객체를 얻음 | [prototype-guide_v1.0.0.md](pattern-guide/design-pattern-guide/prototype/prototype-guide_v1.0.0.md) |

## Structural Patterns (구조 패턴)

클래스와 객체를 더 큰 구조로 조합하는 방법을 다룬다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Adapter (어댑터) | 호환되지 않는 인터페이스 사이를 변환 | [adapter-guide_v1.0.0.md](pattern-guide/design-pattern-guide/adapter/adapter-guide_v1.0.0.md) |
| Bridge (브릿지) | 추상(Abstraction)과 구현(Implementor)을 분리해 독립적으로 확장 | [bridge-guide_v1.0.0.md](pattern-guide/design-pattern-guide/bridge/bridge-guide_v1.0.0.md) |
| Composite (컴포지트) | 부분-전체 계층을 같은 인터페이스로 다루고, 묶음의 답은 자식들의 답을 모아 만듦 | [composite-guide_v1.0.0.md](pattern-guide/design-pattern-guide/composite/composite-guide_v1.0.0.md) |
| Decorator (데코레이터) | 객체에 동적으로 책임을 추가 | [decorator-guide_v1.0.0.md](pattern-guide/design-pattern-guide/decorator/decorator-guide_v1.0.0.md) |
| Facade (퍼사드) | 서브시스템에 통합된 단순한 진입점 제공 | [facade-guide_v1.0.0.md](pattern-guide/design-pattern-guide/facade/facade-guide_v1.0.0.md) |
| Flyweight (플라이웨이트) | 다수의 미세 객체를 공유로 효율화 | [flyweight-guide_v1.0.0.md](pattern-guide/design-pattern-guide/flyweight/flyweight-guide_v1.0.0.md) |
| Proxy (프록시) | 다른 객체에 대한 접근을 대리/제어 | [proxy-guide_v1.0.0.md](pattern-guide/design-pattern-guide/proxy/proxy-guide_v1.0.0.md) |

## Behavioral Patterns (행위 패턴)

객체 간 책임 분배와 상호작용 방식을 다룬다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Chain of Responsibility (책임 연쇄) | 핸들러 체인으로 요청 처리 책임을 분산 | [chain-of-responsibility-guide_v0.1.0.md](pattern-guide/design-pattern-guide/chain-of-responsibility/chain-of-responsibility-guide_v0.1.0.md) |
| Command (커맨드) | 요청을 객체로 만들어 부르는 쪽이 실행 연산만 알게 함 | [command-guide_v1.0.0.md](pattern-guide/design-pattern-guide/command/command-guide_v1.0.0.md) |
| Interpreter (인터프리터) | 간단한 DSL을 AST로 표현하고 평가 | [interpreter-guide_v0.1.0.md](pattern-guide/design-pattern-guide/interpreter/interpreter-guide_v0.1.0.md) |
| Iterator (이터레이터) | 집계 객체의 내부 표현을 숨기고 순회 인터페이스 제공 | [iterator-guide_v0.1.0.md](pattern-guide/design-pattern-guide/iterator/iterator-guide_v0.1.0.md) |
| Mediator (중재자) | 동료들이 서로를 참조하지 않고 중재자를 거쳐 협력하게 함 | [mediator-guide_v1.0.0.md](pattern-guide/design-pattern-guide/mediator/mediator-guide_v1.0.0.md) |
| Memento (메멘토) | 캡슐화를 깨지 않고 객체 상태를 보존·복원 | [memento-guide_v0.1.0.md](pattern-guide/design-pattern-guide/memento/memento-guide_v0.1.0.md) |
| Observer (옵저버) | 1:N 의존성 관계에서 상태 변화 자동 통보 | [observer-guide_v1.0.0.md](pattern-guide/design-pattern-guide/observer/observer-guide_v1.0.0.md) |
| State (상태) | 상태마다 객체를 두고 요청을 위임하며, 그 상태 객체가 실행 중에 바뀜 | [state-guide_v1.0.0.md](pattern-guide/design-pattern-guide/state/state-guide_v1.0.0.md) |
| Strategy (전략) | 알고리즘군을 캡슐화하고 런타임 교체 | [strategy-guide_v1.1.0.md](pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.md) |
| Template Method (템플릿 메서드) | 알고리즘 골격을 상위 클래스에, 단계는 하위 클래스에 | [template-method-guide_v0.1.0.md](pattern-guide/design-pattern-guide/template-method/template-method-guide_v0.1.0.md) |
| Visitor (방문자) | 데이터 구조와 연산을 분리, double dispatch | [visitor-guide_v0.1.0.md](pattern-guide/design-pattern-guide/visitor/visitor-guide_v0.1.0.md) |

## 빠른 비교가 자주 필요한 페어

각 가이드의 "흔히 오해하는 지점" 섹션에서 더 자세히 다룬다.

- Factory Method ↔ Abstract Factory: 제품 1종 vs 제품군
- Strategy ↔ State: 외부 교체 vs 내부 전이
- Adapter ↔ Decorator ↔ Proxy: 인터페이스 변환 vs 행위 추가 vs 접근 제어
- Builder ↔ Abstract Factory: 단계적 조립 vs 제품군 일관성
- Mediator ↔ Facade: 동료 간 중재 vs 서브시스템 단순 진입점

## 참고 문서

가이드가 기대는 **주제 밖 사전 지식**을 원서 없이 읽히게 푼 문서다. 패턴의 판정·비교·구현은 싣지 않는다 — 그건 가이드의 몫이다.
가이드 본문이 필요한 자리에서 이 문서들을 내부 링크로 가리킨다.

| 문서 | 답하는 것 |
| --- | --- |
| [GoF 공통 어휘](pattern-guide/reference/gof-vocabulary/gof-vocabulary-ref_v1.0.1.md) | 인터페이스에 프로그래밍 · 위임 · 클래스/객체 패턴 · 결합 시점과 디스패치 · 내재/외재 상태 · Invoker·Receiver·Command |
| [DDD 전술 용어](pattern-guide/reference/ddd-tactical-terms/ddd-tactical-terms-ref_v1.0.1.md) | Bounded Context · Aggregate · Root · Entity · Value Object · id 참조 · 불변식 · Repository |
| [복식부기와 회계 모델](pattern-guide/reference/accounting-model/accounting-model-ref_v1.0.1.md) | 부호 규약 · 원장과 전기 · 역분개 · Account · Entry · Transaction · AccountType · 지식/운영 층위 · Posting Rule · Money |
| [수량·측정·관측 모델](pattern-guide/reference/observation-model/observation-model-ref_v1.0.1.md) | Quantity · Unit · Conversion Ratio · Compound Unit · Money · Measurement · Observation · Range · Rejected Observation |

## 코드 부합도 분석

각 가이드의 "## 디자인 패턴을 충족하는 최소 조건" 섹션은 `design-pattern-analyzer` skill 이 사용하는 평가 기준이다. 작성한 코드가 해당 패턴에 부합하는지 검사하려면:

> "python/patterns/observer.py 가 Observer 패턴 부합하는지 분석해줘"

처럼 요청하면 분석 리포트가 `analysis/` 폴더에 생성된다.

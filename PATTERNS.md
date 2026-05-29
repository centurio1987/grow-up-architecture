# 디자인 패턴 가이드 인덱스

GoF(Gang of Four) 23개 디자인 패턴의 한국어 가이드 모음. 각 문서는 `.claude/skills/design-pattern-guide/template.md` 표준 양식을 따른다.

> 가이드 작성 자동화: `.claude/skills/design-pattern-guide`
> 코드 부합도 분석: `.claude/skills/design-pattern-analyzer`

## Creational Patterns (생성 패턴)

객체 생성 메커니즘을 다루며, 상황에 맞는 객체 생성 방식을 제공한다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Singleton (싱글톤) | 클래스가 단 하나의 인스턴스만 가지도록 보장하고 전역 접근점을 제공 | [singleton-pattern.md](pattern-guide/singleton-pattern.md) |
| Factory Method (팩토리 메서드) | 객체 생성의 책임을 서브클래스로 위임 | [factory-method-pattern.md](pattern-guide/factory-method-pattern.md) |
| Abstract Factory (추상 팩토리) | 관련된 제품군(family)을 일관되게 생성하는 인터페이스 제공 | [abstract-factory-pattern.md](pattern-guide/abstract-factory-pattern.md) |
| Builder (빌더) | 복잡한 객체의 생성 과정을 단계적으로 분리 | [builder-pattern.md](pattern-guide/builder-pattern.md) |
| Prototype (프로토타입) | 기존 객체를 복제해 새 객체 생성 | [prototype-pattern.md](pattern-guide/prototype-pattern.md) |

## Structural Patterns (구조 패턴)

클래스와 객체를 더 큰 구조로 조합하는 방법을 다룬다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Adapter (어댑터) | 호환되지 않는 인터페이스 사이를 변환 | [adapter-pattern.md](pattern-guide/adapter-pattern.md) |
| Bridge (브릿지) | 추상(Abstraction)과 구현(Implementor)을 분리해 독립적으로 확장 | [bridge-pattern.md](pattern-guide/bridge-pattern.md) |
| Composite (컴포지트) | 부분-전체 계층을 같은 인터페이스로 다룸 | [composite-pattern.md](pattern-guide/composite-pattern.md) |
| Decorator (데코레이터) | 객체에 동적으로 책임을 추가 | [decorator-pattern.md](pattern-guide/decorator-pattern.md) |
| Facade (퍼사드) | 서브시스템에 통합된 단순한 진입점 제공 | [facade-pattern.md](pattern-guide/facade-pattern.md) |
| Flyweight (플라이웨이트) | 다수의 미세 객체를 공유로 효율화 | [flyweight-pattern.md](pattern-guide/flyweight-pattern.md) |
| Proxy (프록시) | 다른 객체에 대한 접근을 대리/제어 | [proxy-pattern.md](pattern-guide/proxy-pattern.md) |

## Behavioral Patterns (행위 패턴)

객체 간 책임 분배와 상호작용 방식을 다룬다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Chain of Responsibility (책임 연쇄) | 핸들러 체인으로 요청 처리 책임을 분산 | [chain-of-responsibility-pattern.md](pattern-guide/chain-of-responsibility-pattern.md) |
| Command (커맨드) | 요청을 객체로 캡슐화해 큐잉·undo 등을 지원 | [command-pattern.md](pattern-guide/command-pattern.md) |
| Interpreter (인터프리터) | 간단한 DSL을 AST로 표현하고 평가 | [interpreter-pattern.md](pattern-guide/interpreter-pattern.md) |
| Iterator (이터레이터) | 집계 객체의 내부 표현을 숨기고 순회 인터페이스 제공 | [iterator-pattern.md](pattern-guide/iterator-pattern.md) |
| Mediator (중재자) | 다대다 객체 관계를 중재자로 모음 | [mediator-pattern.md](pattern-guide/mediator-pattern.md) |
| Memento (메멘토) | 캡슐화를 깨지 않고 객체 상태를 보존·복원 | [memento-pattern.md](pattern-guide/memento-pattern.md) |
| Observer (옵저버) | 1:N 의존성 관계에서 상태 변화 자동 통보 | [observer-pattern.md](pattern-guide/observer-pattern.md) |
| State (상태) | 내부 상태에 따라 객체 행동을 바꿈 | [state-pattern.md](pattern-guide/state-pattern.md) |
| Strategy (전략) | 알고리즘군을 캡슐화하고 런타임 교체 | [strategy-pattern.md](pattern-guide/strategy-pattern.md) |
| Template Method (템플릿 메서드) | 알고리즘 골격을 상위 클래스에, 단계는 하위 클래스에 | [template-method-pattern.md](pattern-guide/template-method-pattern.md) |
| Visitor (방문자) | 데이터 구조와 연산을 분리, double dispatch | [visitor-pattern.md](pattern-guide/visitor-pattern.md) |

## 빠른 비교가 자주 필요한 페어

각 가이드의 "흔히 오해하는 지점" 섹션에서 더 자세히 다룬다.

- Factory Method ↔ Abstract Factory: 제품 1종 vs 제품군
- Strategy ↔ State: 외부 교체 vs 내부 전이
- Adapter ↔ Decorator ↔ Proxy: 인터페이스 변환 vs 행위 추가 vs 접근 제어
- Builder ↔ Abstract Factory: 단계적 조립 vs 제품군 일관성
- Mediator ↔ Facade: 동료 간 중재 vs 서브시스템 단순 진입점

## 코드 부합도 분석

각 가이드의 "## 디자인 패턴을 충족하는 최소 조건" 섹션은 `design-pattern-analyzer` skill 이 사용하는 평가 기준이다. 작성한 코드가 해당 패턴에 부합하는지 검사하려면:

> "python/patterns/observer.py 가 Observer 패턴 부합하는지 분석해줘"

처럼 요청하면 분석 리포트가 `analysis/` 폴더에 생성된다.

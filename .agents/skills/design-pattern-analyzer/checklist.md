# 디자인 패턴 최소 충족 조건 — 내장 체크리스트

이 문서는 프로젝트 루트에 해당 패턴의 가이드 문서가 **없을 때만** 사용되는 fallback이다.
프로젝트에 `<pattern>-pattern.md` 가 있으면 그 문서의 "디자인 패턴을 충족하는 최소 조건" 섹션을 우선 사용한다.

각 패턴 항목은 다음 4구역으로 구성된다.
- **최소 조건**: 충족 여부를 판정할 항목 (각 항목은 "충족 / 부분 / 미충족 / 판정 불가" 4값)
- **흔한 오인**: 패턴으로 잘못 부르는 코드 형태
- **언어 관용구**: Python / TypeScript / Rust / Java 에서 자주 쓰이는 합법적 변형
- **자동 시그널**: 정적 분석으로 빠르게 잡을 수 있는 코드 신호

---

## Singleton

### 최소 조건
1. **외부 생성 차단** — 외부 코드가 `new`/생성자 직접 호출로 새 인스턴스를 만들 수 없어야 한다.
2. **단일 인스턴스 보장** — 어떤 경로로 접근하더라도 동일 객체를 반환한다(`a is b` / `a === b` / 포인터 동일).
3. **전역 접근점 제공** — `getInstance()` 류의 단일 진입점이 존재한다.
4. **(선택) 스레드 안전** — 멀티스레드 사용을 명시한 코드라면 동시 초기화에 대한 보호가 있어야 한다.

### 흔한 오인
- "단지 모듈 레벨 상수 객체 하나" — 캡슐화/제어 없이 그냥 전역 변수면 Singleton이라기보다 "전역 객체"다.
- 클래스가 인스턴스를 1개만 운영하지만 `new` 자체는 누구나 호출 가능한 경우 (조건 1 위반).
- 매 호출마다 새 객체를 만들면서 캐시처럼 보이게 한 코드 (조건 2 위반).

### 언어 관용구
- Python: `__new__` 오버라이드, 클래스 변수 보관, 메타클래스, 모듈 자체를 단일체로 사용.
- TypeScript: `private constructor` + `static getInstance()`.
- Rust: `std::sync::OnceLock` 또는 `OnceCell` 로 정적 1회 초기화. `static mut`은 비권장.
- Java: Initialization-on-demand holder, `enum Singleton`, 또는 `synchronized` getInstance.

### 자동 시그널
- Python: `_instance`, `cls._instance`, `__new__`, `if cls._instance is None`
- TS/JS: `private constructor`, `static getInstance`, `private static instance`
- Rust: `OnceLock`, `OnceCell`, `LazyLock`, `static .* = .*::new()`
- Java: `private .* constructor`, `static .* getInstance`, `private static .* instance`, `enum .*\{`

---

## Factory Method

### 최소 조건
1. **제품 인터페이스(또는 추상 클래스) 존재** — 반환 타입이 추상화되어 있다.
2. **생성 책임을 메서드로 분리** — `new Concrete()` 호출이 별도 메서드(팩토리 메서드)에 캡슐화된다.
3. **서브클래스/구현체가 생성 결정** — 어떤 구체 제품을 만들지 결정하는 코드가 호출자가 아니라 팩토리 측에 있다.
4. **호출자는 구체 타입을 모름** — 호출자는 추상 타입에만 의존해야 한다.

### 흔한 오인
- 단순히 `if/else`로 객체 종류만 분기하는 정적 함수 — Simple Factory(또는 Static Factory)이지 GoF Factory Method가 아니다(서브클래스화 부재).
- 반환 타입이 구체 클래스이면 호출자가 결국 그 타입을 알게 되어 조건 4 위반.

### 언어 관용구
- Python: 추상 베이스 클래스(ABC) + 서브클래스의 메서드 오버라이드, 또는 callable 주입.
- TypeScript: `abstract class Creator` + `abstract factoryMethod(): Product`.
- Rust: trait 메서드 + 구현체별 반환, 또는 closure/`Box<dyn Trait>` 반환.
- Java: 추상 클래스의 `protected abstract Product create()`.

### 자동 시그널
- `abstract` 또는 `trait`/`Protocol` 정의 + 동일 메서드 시그니처를 가진 구체 구현체 2개 이상.

---

## Abstract Factory

### 최소 조건
1. **관련된 제품군(family)이 둘 이상** — 예: Button + Window + Scrollbar 가 같은 테마로 묶임.
2. **팩토리 인터페이스가 각 제품 생성 메서드를 모두 보유**.
3. **구체 팩토리가 같은 family 의 제품만 일관되게 만든다** (혼합 생성 금지가 의도).
4. **클라이언트는 추상 팩토리·추상 제품에만 의존**.

### 흔한 오인
- 제품이 1종류뿐인데 추상 팩토리라고 부르는 경우 — Factory Method 로 충분하다.
- "팩토리들의 팩토리" 라는 표현만 보고 추상 팩토리라고 단정 — 본질은 제품군 일관성이다.

---

## Builder

### 최소 조건
1. **복잡한 객체를 단계적으로 조립** — 생성 과정이 여러 메서드 호출로 분리됨.
2. **중간 상태를 외부에서 직접 다루지 않음** — 빌더가 보관.
3. **최종 객체는 `build()`/`get()` 류로만 추출**.
4. **(선택) 같은 생성 절차로 다른 표현을 만들 수 있음** — Director 분리 시.

### 흔한 오인
- 인자 많은 생성자를 단지 chaining 으로 바꾼 fluent setter — Builder 라기보다 fluent API.
- mutable 객체를 그대로 노출하면서 build 호출 없이 빠져나가는 경우.

---

## Adapter

### 최소 조건
1. **두 인터페이스의 불일치를 명시적으로 변환** — 한쪽이 기대하는 API ↔ 다른 쪽 실제 API.
2. **Adaptee 코드는 수정하지 않음** — 외부 라이브러리/레거시를 감싸는 게 정석.
3. **Target 인터페이스를 구현/상속**하여 클라이언트가 그대로 사용 가능.

### 흔한 오인
- 단순 위임(delegation)만 하는 wrapper — Target 인터페이스가 따로 정의돼 있지 않으면 Adapter 라기보다 그냥 facade.

---

## Decorator

### 최소 조건
1. **컴포넌트 인터페이스 공유** — Decorator 와 ConcreteComponent 가 같은 타입.
2. **런타임 합성** — Decorator 안에 component 필드를 가지고 위임.
3. **행위를 덧붙임** — 호출 전후로 추가 동작을 수행한다.
4. **여러 데코레이터를 중첩 가능** — `Dec1(Dec2(Comp))` 가 의미를 가진다.

### 흔한 오인
- 상속으로 메서드를 오버라이드해 기능을 추가한 경우 — Decorator 라기보다 단순 서브클래싱.
- Python `@decorator` 문법은 이름이 같을 뿐, 항상 GoF Decorator 인 건 아니다.

---

## Strategy

### 최소 조건
1. **알고리즘 인터페이스 정의**.
2. **여러 구체 알고리즘이 같은 인터페이스 구현**.
3. **Context 가 알고리즘을 필드/주입으로 보유**하고 호출.
4. **런타임 교체 가능**.

### 흔한 오인
- 단순 함수 포인터/콜백 — 인터페이스가 명시되지 않으면 Strategy 라고 부르기 약함(단, 일급 함수 언어에서는 관용으로 받아들임).
- `if/else` 알고리즘 선택을 함수로 빼낸 정도 — 교체 가능성 없으면 미달.

---

## Observer

### 최소 조건
1. **Subject 와 Observer 의 1:N 관계**.
2. **구독/해지(register/unregister) API 존재**.
3. **상태 변화 시 자동 통보** — Subject 가 등록된 모든 Observer 에 알림.
4. **Observer 들은 Subject 의 내부를 직접 조회하지 않음** — 통보 받은 정보로 처리.

### 흔한 오인
- 단순 콜백 1개 등록 — 그건 callback이지 Observer 아님.
- pub/sub 메시지 브로커를 그대로 Observer 라고 부르는 것 — 유사하지만 GoF Observer 는 객체 내부 협업이 핵심.

---

## 그 외 패턴에 대한 일반 원칙

위에 없는 패턴(Composite, Proxy, Facade, Command, State, Template Method, Iterator, Chain of Responsibility, Mediator, Memento, Visitor, Interpreter, Prototype, Bridge, Flyweight 등)을 분석할 때는 다음 4가지 일반 질문에 답해 판정한다.

1. **의도(Intent)**: 이 패턴이 해결하려는 문제를 코드가 실제로 해결하고 있는가?
2. **역할(Role) 분리**: 패턴이 요구하는 각 역할이 코드에 식별 가능한가? 한 클래스가 둘 이상 역할을 겸하고 있지는 않은가?
3. **확장 지점(Variation Point)**: 패턴의 핵심 확장 지점이 코드에 열려 있는가? (예: Template Method 의 hook, Visitor 의 accept/visit)
4. **결합도(Coupling)**: 호출자/협력 객체가 추상화에만 의존하는가, 아니면 구체 타입을 알고 있는가?

판정 시 위 4문항에 대해 명시적으로 답을 적어 리포트에 넣는다.

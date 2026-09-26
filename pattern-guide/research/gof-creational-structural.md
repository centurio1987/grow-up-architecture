# GoF 생성·구조 패턴 리서치 노트

범위는 GoF(Gamma·Helm·Johnson·Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*, Addison-Wesley, 1994)의 생성 패턴 5개(Factory Method · Abstract Factory · Builder · Prototype · Singleton)와 구조 패턴 7개(Adapter · Bridge · Composite · Decorator · Facade · Flyweight · Proxy)이고, 작성일은 2026-09-17이다. 용도는 가이드 33편 재집필 때 집필 워커가 편마다 원전을 다시 검색하지 않도록 원전 대응(intent·participants·collaborations·consequences), 최소 조건 후보, 비교 대상, Java·TypeScript·Rust 구현 쟁점, 출처가 확인된 실제 사용처를 한곳에 모으는 것이다. GoF 원문은 원서 CD-ROM의 HTML판 사본(UNC 강의 사이트 `https://www.cs.unc.edu/~stotts/GOF/hires/`)에서 직접 대조했으며, 이 사본의 게시 적법성과 링크 영속성은 확인하지 않았다. 원서 쪽 번호는 원서가 본문 전체에서 쓰는 "패턴명 (시작 쪽)" 표기 관례(1장 "The number in parentheses after each pattern name gives the page number for the pattern")로 확인한 **패턴 시작 쪽**이며 판면을 직접 보지는 않았다. intent는 원문 영어를 그대로 싣고, 나머지는 요지만 옮겼다. 원문 번호 목록은 원문 순서를 따른다. "(해석)" 표시는 공식 문서가 패턴명을 쓰지 않아 participant 대응을 이 노트가 판단한 경우다.

## Factory Method (팩토리 메서드)

### 원전 대응
- 분류: 생성(Creational) · **클래스 범위(Class)**. GoF Table 1.1에서 생성 패턴 중 클래스 범위는 Factory Method 하나다(1장). 원서 시작 쪽 107. 별칭 Virtual Constructor.
- 의도(intent): "Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses." (GoF 원문 Factory Method · Intent)
- participants:
  - `Product` (예: Document) — 팩토리 메서드가 만드는 객체의 인터페이스를 정의한다.
  - `ConcreteProduct` (MyDocument) — Product 인터페이스를 구현한다.
  - `Creator` (Application) — Product 타입을 반환하는 팩토리 메서드를 선언한다. 기본 ConcreteProduct를 반환하는 기본 구현을 둘 수도 있다. Product가 필요할 때 팩토리 메서드를 호출할 수 있다.
  - `ConcreteCreator` (MyApplication) — 팩토리 메서드를 오버라이드해 ConcreteProduct 인스턴스를 반환한다.
- collaborations: 원문은 한 항목뿐이다 — Creator는 적절한 ConcreteProduct를 반환하도록 팩토리 메서드 정의를 서브클래스에 맡긴다. 가이드의 단계 서술은 원문 Motivation·Related Patterns를 합쳐 이렇게 풀 수 있다.
  1. 클라이언트가 ConcreteCreator 인스턴스를 Creator 타입으로 쓴다.
  2. Creator의 상위 연산(원문 예의 `NewDocument`, 원문 표현으로 template method)이 실행 중 제품이 필요해지면 팩토리 메서드(`CreateDocument`)를 호출한다. — 왜: Creator는 "언제" 만들지만 알고 "무엇을" 만들지는 모르기 때문이다(원문 Motivation).
  3. 동적 디스패치로 ConcreteCreator의 오버라이드가 실행되어 ConcreteProduct를 만든다.
  4. Creator는 반환값을 Product 인터페이스로만 다룬다. — 왜: 애플리케이션 특화 클래스 이름을 Creator 코드에서 제거하는 것이 이 패턴의 첫 번째 결과이기 때문이다.
- consequences(원문 기준):
  - 얻는 것: 애플리케이션 특화 클래스를 코드에 묶을 필요가 없어진다(코드는 Product 인터페이스만 다룸). (1) 서브클래스에 훅을 제공한다 — 기본 구현이 있는 팩토리 메서드는 서브클래스가 확장판 객체를 끼울 자리가 된다. (2) 병렬 클래스 계층을 연결한다 — Figure의 `CreateManipulator`처럼 어느 클래스끼리 짝인지를 한곳에 모은다.
  - 대가: 특정 ConcreteProduct 하나를 만들려고 Creator를 서브클래싱해야 할 수 있다. Creator를 어차피 서브클래싱할 때는 괜찮지만 아니면 진화 지점이 하나 늘어난다.
- 원문 Implementation 요지: 두 변형(추상 Creator로 기본 구현 없음 / 구체 Creator가 기본 구현 제공), 매개변수화된 팩토리 메서드(식별자 인자로 여러 제품, 서브클래스가 오버라이드해 일부만 바꾸고 나머지는 부모에 위임), Creator 생성자에서 팩토리 메서드를 부르지 말 것(C++, 서브클래스 오버라이드가 아직 준비 안 됨 → 필요 시점에 만드는 lazy 접근자), 템플릿(제네릭)으로 서브클래싱 회피(`StandardCreator<TheProduct>`).

### 최소 조건 후보
- [필수] 팩토리 메서드의 반환 타입이 추상 `Product`(인터페이스·추상 클래스)다 — 반례: `PdfDocument createDocument()`처럼 구체 타입을 반환하면 호출하는 쪽이 구체 클래스에 묶여 "애플리케이션 특화 클래스를 코드에서 제거"하는 결과가 사라진다.
- [필수] 생성 연산이 `Creator`의 **오버라이드 가능한 인스턴스 연산**으로 선언된다(Rust는 trait 메서드) — 반례: `static create(type)` + `switch`는 서브클래스가 결정할 자리가 없으므로 Simple Factory 또는 정적 생성 메서드다(refactoring.guru Factory Comparison).
- [필수] Creator 쪽 상위 로직은 제품을 팩토리 메서드로만 얻고 Product 인터페이스로만 다룬다 — 반례: 상위 로직이 `new MyDocument()`를 직접 호출하면 서브클래스가 제품 클래스를 바꿀 수 없다.
- [필수] 제품 클래스 결정이 서브클래스(구현체) 쪽에 있다: 팩토리 메서드를 오버라이드하는 `ConcreteCreator`가 1개 이상 있거나 그러도록 설계에 열려 있다 — 반례: 오버라이드가 금지(`final`)된 생성 메서드는 이름이 `create`여도 이 패턴이 아니다. 기본 구현만 있고 서브클래스가 아직 없는 경우의 판정은 미해결 질문 참고.
- [선택] Creator가 기본 구현을 제공한다(원문 변형 2).
- [선택] 매개변수화된 팩토리 메서드(제품 식별자 인자). 단 오버라이드 가능해야 한다 — 정적이면 Simple Factory.
- [선택] 팩토리 메서드가 Creator의 template method 안에서 호출된다(원문 Related Patterns: "usually called within Template Methods").
- [선택] 필요 시점에 만드는 lazy 접근자(`GetProduct`).
- 불변식: 모든 오버라이드가 반환하는 객체는 Product 계약을 만족한다(Creator의 상위 로직이 구체 타입을 몰라도 동작해야 하므로).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 프레임워크·기반 클래스가 객체를 **언제** 만들지는 아는데 **무엇을** 만들지는 하위 모듈마다 다르다(원문 Motivation의 Application/Document 딜레마). 코드 모양: 추상 기반 클래스 메서드 안에서 `new` 대상만 하위 클래스마다 달라 `if (this instanceof ...)` 분기가 생긴다.
  - 클래스가 만들 객체의 클래스를 예상할 수 없다 / 서브클래스가 만들 객체를 지정하게 하고 싶다 / 여러 헬퍼 서브클래스 중 어느 쪽에 위임하는지에 대한 지식을 한곳에 두고 싶다(원문 Applicability).
  - 두 클래스 계층이 짝을 이룬다(컬렉션↔이터레이터, 도형↔조작기). GoF Iterator 장은 `CreateIterator`를 팩토리 메서드의 예로 명시한다.
  - 기존 코드 확장 지점으로 "이 부품만 서브클래스에서 바꿔 끼우고 싶다"(Node.js `http.Agent#createConnection`의 오버라이드 안내가 이 모양).
- 쓰지 말아야 할 때:
  - 인스턴스화할 클래스가 절대 바뀌지 않거나, 이미 서브클래스가 쉽게 오버라이드할 수 있는 초기화 연산 안에서 생성이 일어날 때(GoF Discussion of Creational Patterns).
  - 제품 종류마다 Creator 서브클래스가 생기는데 그 서브클래스들이 하는 일이 거의 없을 때 — 원문 토론은 이 경우 Prototype이 더 낫다고 본다.
  - 설계 초기에는 Factory Method로 시작해 유연성이 더 필요해질 때 Abstract Factory·Prototype·Builder로 옮겨 가는 것이 흔하다(같은 토론 절, refactoring.guru Relations).

### 비교 대상
- vs Abstract Factory: 제품 **1종**의 클래스를 **상속(서브클래스)**으로 결정 vs 관련 제품 **군**을 **팩토리 객체 합성**으로 결정. Table 1.1에서 FM은 클래스 범위, AF는 객체 범위이고, AF의 각 생성 연산은 흔히 팩토리 메서드로 구현된다(GoF 1장·Abstract Factory Related Patterns·Discussion of Creational Patterns). 오인하기 쉬운 코드 모양: 제품을 **쓰는 로직**과 `createButton()`·`createCheckbox()` 추상 메서드가 **같은 추상 클래스**에 있으면 팩토리 메서드 여러 개이고, 제품 생성만 하는 **별도 객체를 주입받아** 쓰면 Abstract Factory다. (PATTERNS.md 빠른 비교 페어)
- vs Simple Factory / 정적 생성 메서드: 오버라이드 불가능한 한 곳의 조건문이 제품을 고르는가, 서브클래스가 오버라이드로 고르는가. refactoring.guru Factory Comparison은 Simple Factory를 "큰 조건문을 가진 생성 메서드 하나"(Head First Design Patterns 정의), 정적 생성 메서드를 "static으로 선언된 생성 메서드"로 구분하고 둘 다 GoF Factory Method와 다르다고 적는다. 오인하기 쉬운 코드 모양: `Calendar.getInstance()`, `NumberFormat.getInstance()` — 정적이라 서브클래스가 결정하지 않는다.
- vs Prototype: FM은 제품 계층과 평행한 Creator 계층이 필요하고 초기화 단계는 필요 없다. Prototype은 Creator 서브클래싱이 필요 없지만 복제 후 `Initialize` 같은 초기화 연산이 필요할 수 있다(GoF Factory Method Related Patterns). 오인하기 쉬운 코드 모양: 서브클래스가 `createShape()`를 오버라이드해 **미리 만든 인스턴스의 `clone()`**을 반환하면 두 패턴의 결합이다.
- vs Template Method: 팩토리 메서드는 흔히 template method의 한 단계로 호출된다(GoF). refactoring.guru는 "Factory Method is a specialization of Template Method"라고 적는다. 오인하기 쉬운 코드 모양: 추상 훅 메서드가 **객체를 반환**하면 FM, **계산·동작 단계**면 Template Method의 기본 연산이다.

### 세 언어 구현 쟁점
- Java:
  - 관용구: 추상 클래스의 `protected abstract Product createProduct()` + 그것을 부르는 `public final` 상위 메서드. 표준 API의 `Iterable#iterator()`가 GoF `CreateIterator`에 대응한다.
  - 함정: 상위 클래스 생성자에서 팩토리 메서드를 부르면 서브클래스 필드 초기화 전에 오버라이드가 실행된다. JLS §12.5는 생성 중인 객체라도 오버라이드된 메서드가 쓰이며, 예제에서 서브클래스 필드의 기본값 0이 출력됨을 보인다(GoF가 C++에 대해 한 경고와 같은 문제).
  - 함정: 정적 팩토리(`of`, `valueOf`, `getInstance`)와 이름이 같아 혼동된다. Effective Java 3판 Item 1이 이 둘을 구분한다고 알려져 있으나 이 노트에서 원문은 확인하지 않았다.
  - GoF Implementation 5(템플릿으로 서브클래싱 회피)의 Java 대응은 생성자에 `Supplier<? extends Product>`를 받는 형태로 볼 수 있다(해석).
- TypeScript:
  - 관용구: `abstract class Creator { protected abstract createProduct(): Product; ... }`. 추상 클래스는 직접 인스턴스화할 수 없고 추상 멤버를 구현하지 않은 하위 클래스는 컴파일 오류다(TS Handbook Classes).
  - 함정: 구조적 타이핑이므로 `implements Product`를 쓰지 않은 객체도 모양만 맞으면 반환값으로 통과한다(Handbook Type Compatibility). Product 계약이 이름이 아니라 모양으로만 검사된다.
  - 함정: `private`·`protected`는 타입 검사 때만 강제된다(Handbook Classes). JS 소비자는 `createProduct`를 외부에서 부를 수 있다.
  - 함정: 파생 클래스의 인스턴스 필드는 `super()`가 반환된 뒤에 정의되므로 기반 클래스 생성자는 파생 클래스 필드에 접근할 수 없다(MDN Public class fields). 기반 생성자에서 팩토리 메서드를 부르면 오버라이드가 초기화 안 된 필드를 본다.
- Rust:
  - 상속이 없다. trait의 **필수 메서드**가 팩토리 메서드, trait의 **기본 구현 메서드**가 Creator의 상위 로직 역할을 한다. Rust Book 10.2는 기본 구현이 같은 trait의 기본 구현 없는 메서드를 호출할 수 있다고 명시한다.
  - 동적 선택: `fn create_product(&self) -> Box<dyn Product>`. 트레이트 객체는 동적 디스패치 비용이 있다(Rust Book 18.2).
  - 정적 선택: 연관 타입 `type Product: ProductTrait; fn create(&self) -> Self::Product;`. std의 `IntoIterator::into_iter`/연관 타입 `IntoIter`가 이 모양이다(해석).
  - 함정: 생성자는 관례일 뿐인 정적 inherent 메서드(`new`)다(Rust API Guidelines C-CTOR). trait에 `fn new() -> Self`를 두면 receiver가 없고 `Self`를 반환하므로 `where Self: Sized`를 붙이지 않는 한 그 trait은 dyn 호환이 아니게 된다(Rust Reference, Dyn compatibility).

### 실제 사용처
- `java.lang.Iterable#iterator()` — `Creator` = Iterable을 구현하는 컬렉션 계층, 팩토리 메서드 = `iterator()`, `Product` = `java.util.Iterator`, `ConcreteProduct` = 각 컬렉션의 이터레이터 구현. 대응 근거는 GoF Iterator 장("CreateIterator is an example of a factory method")이고 Javadoc에는 패턴명이 없다. — [Iterable (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Iterable.html) · Java SE 21
- Node.js `http.Agent#createConnection(options[, callback])` — `Creator` = `http.Agent`, 팩토리 메서드 = `createConnection`, `Product` = `stream.Duplex`(소켓), `ConcreteCreator` = 사용자 정의 Agent 서브클래스. 문서가 "custom agents may override this method"라고 오버라이드를 안내한다. — [HTTP | Node.js](https://nodejs.org/api/http.html) · 조회 시 문서 v26.9.0, 메서드 Added in v0.11.4
- Rust `std::iter::IntoIterator::into_iter` — `Creator` = IntoIterator 구현 타입, 팩토리 메서드 = `into_iter`, `Product` = `Iterator`(연관 타입 `IntoIter`로 구현체마다 결정). 정적 디스패치 변형이다(해석). — [IntoIterator](https://doc.rust-lang.org/std/iter/trait.IntoIterator.html) · 버전 표기 확인 안 함

### 기존 가이드 승계분
- 최소 조건 취지: 제품들이 공통 추상 타입을 가져야 하고, 생성 책임은 서브클래스가 오버라이드할 수 있는 Creator의 인스턴스 메서드여야 하며(정적 유틸 메서드는 아님), Creator의 상위 로직은 추상 Product에만 의존하고, 새 제품은 기존 Creator 수정 없이 새 ConcreteCreator 추가로 확장한다. 오버라이드 가능성과 추상 의존이 깨지면 Simple/Static Factory로 분류한다. 이름이 `create`로 시작한다는 것만으로는 부족하고, 반환 타입이 구체 클래스면 목적이 사라진다고 본다.
- 참고 자료:
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides(GoF), "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 - "Factory Method" 장.
  - Refactoring.Guru, "Factory Method" - https://refactoring.guru/design-patterns/factory-method
  - Joshua Bloch, "Effective Java" 3rd ed., Item 1: "Consider static factory methods instead of constructors" - 정적 팩토리와 팩토리 메서드의 차이를 이해하는 데 유용.
  - Oracle Java SE API Documentation - `java.util.Collection#iterator()`, `java.util.Calendar#getInstance()` 등 표준 라이브러리의 팩토리 메서드 사례.
  - Martin Fowler, "Patterns of Enterprise Application Architecture" - 엔터프라이즈 환경에서의 객체 생성 책임 분리 논의.

### 출처
- [Factory Method — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3c.htm) — Intent·별칭·Applicability·Participants·Collaborations·Consequences·Implementation·Known Uses·Related Patterns 원문, Proxy (207)·Template Method (325) 등 쪽 표기 · 조회 2026-09-17
- [Introduction(1장) — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — Table 1.1 목적×범위 분류, 괄호 속 숫자가 쪽 번호라는 관례, 패턴별 시작 쪽 · 조회 2026-09-17
- [Discussion of Creational Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc3.htm) — FM의 서브클래싱 방식과 AF·Builder·Prototype의 합성 방식 비교, FM이 불필요한 경우 · 조회 2026-09-17
- [Iterator — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat5d.htm) — "CreateIterator is an example of a factory method" · 조회 2026-09-17
- [Factory Method — refactoring.guru](https://refactoring.guru/design-patterns/factory-method) — Relations with Other Patterns, Pros and Cons · 조회 2026-09-17
- [Factory Method in Java — refactoring.guru](https://refactoring.guru/design-patterns/factory-method/java/example) — Java 사용 예 목록(`Calendar#getInstance` 등 정적 메서드 포함)과 식별 기준 · 조회 2026-09-17
- [Factory Comparison — refactoring.guru](https://refactoring.guru/design-patterns/factory-comparison) — creation method·static creation method·Simple factory·Factory Method 구분 · 조회 2026-09-17
- [JLS SE 21 Chapter 12 (§12.5)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html) — 생성 중 오버라이드 메서드 호출과 필드 기본값 예제 · 조회 2026-09-17
- [Iterable (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Iterable.html) — `iterator()` 존재·설명 · 조회 2026-09-17
- [HTTP | Node.js 문서](https://nodejs.org/api/http.html) — `agent.createConnection` 설명, 커스텀 Agent의 오버라이드 안내, 문서 버전 v26.9.0 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — abstract 클래스·멤버 규칙, private/protected가 타입 검사 때만 강제됨 · 조회 2026-09-17
- [TypeScript Handbook — Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — 구조적 서브타이핑 · 조회 2026-09-17
- [MDN — Public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields) — 파생 클래스 필드가 `super()` 반환 후 정의됨 · 조회 2026-09-17
- [Rust Book 10.2 Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) — 기본 구현이 기본 구현 없는 메서드를 호출할 수 있음 · 조회 2026-09-17
- [Rust Book 18.2 Trait Objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) — 정적/동적 디스패치 · 조회 2026-09-17
- [Rust Reference — Traits (Dyn compatibility)](https://doc.rust-lang.org/reference/items/traits.html) — dyn 호환 조건(receiver, `Self: Sized`) · 조회 2026-09-17
- [Rust API Guidelines — Predictability (C-CTOR)](https://rust-lang.github.io/api-guidelines/predictability.html) — 생성자는 정적 inherent 메서드 관례 · 조회 2026-09-17
- [IntoIterator (Rust std)](https://doc.rust-lang.org/std/iter/trait.IntoIterator.html) — "Conversion into an Iterator" · 조회 2026-09-17

### 미해결 질문
- ~~refactoring.guru의 Java 사용 예(`Calendar#getInstance()`, `NumberFormat#getInstance()`, `EnumSet#of()` 등)는 정적 메서드라 GoF 정의(서브클래스가 결정)와 맞지 않는다. 가이드가 이 예를 쓸지, "흔한 오인"으로 쓸지 정해야 한다.~~ → **닫힘(가이드 v1.0.0, 2026-09-27)**: 「실제 사용처」가 아니라 **오인 사례**로 썼다. 최소 조건 절의 "이름으로 판정하려는 것" 자리와 Simple Factory 비교에 둔다. 판정 근거는 `static` 이라 최소 조건 2번(재정의로 결정)에서 빠진다는 것이고, 채점이 `javap` 로 두 메서드가 실제 `static` 임을 확인했다.
- ~~기본 구현만 있고 오버라이드하는 서브클래스가 아직 없는 구체 Creator(GoF 변형 2)를 분석기가 Factory Method로 판정할지 정하지 않았다. 원문은 이를 "유연성을 위한" 정상 변형으로 본다.~~ → **닫힘(가이드 v1.0.0, 2026-09-27)**: 최소 조건 4번이 정했다 — "ConcreteCreator 가 하나 이상 있거나, **아직 없더라도 재정의가 막혀 있지 않아 그렇게 할 수 있습니다**". 즉 열려 있으면 Factory Method 로 판정한다. `final` 로 재정의가 막힌 생성 메서드만 빠진다.
- Effective Java 3판 Item 1의 "static factory method는 GoF Factory Method와 다르다" 취지 문장은 원문을 확인하지 않았다(기존 가이드 참고 자료에만 있음).
- 기존 가이드 참고 자료의 PoEAA(Fowler) 항목이 Factory Method의 어느 절과 연결되는지 확인하지 않았다.

## Abstract Factory (추상 팩토리)

### 원전 대응
- 분류: 생성 · 객체 범위(Object). 원서 시작 쪽 87. 별칭 Kit.
- 의도(intent): "Provide an interface for creating families of related or dependent objects without specifying their concrete classes." (GoF 원문 Abstract Factory · Intent)
- participants:
  - `AbstractFactory` (WidgetFactory) — 추상 제품 객체를 만드는 연산들의 인터페이스를 선언한다.
  - `ConcreteFactory` (MotifWidgetFactory, PMWidgetFactory) — 구체 제품 객체를 만드는 연산을 구현한다.
  - `AbstractProduct` (Window, ScrollBar) — 제품 한 종류의 인터페이스를 선언한다.
  - `ConcreteProduct` (MotifWindow, MotifScrollBar) — 대응하는 구체 팩토리가 만들 제품을 정의하고 AbstractProduct 인터페이스를 구현한다.
  - `Client` — AbstractFactory와 AbstractProduct가 선언한 인터페이스만 쓴다.
- collaborations:
  1. 보통 런타임에 ConcreteFactory 인스턴스 **하나**를 만든다. 그 팩토리는 특정 구현 계열의 제품들을 만든다. — 왜: 구체 팩토리 클래스가 애플리케이션에 한 번만 등장하게 해 제품군 교체 지점을 한곳으로 모으려고(원문 Consequences 2).
  2. 다른 계열의 제품이 필요하면 클라이언트는 다른 구체 팩토리를 쓴다.
  3. AbstractFactory는 제품 객체 생성을 ConcreteFactory 서브클래스에 미룬다.
  - 가이드용 단계 풀이: 구성 지점에서 ConcreteFactory 선택·생성 → Client에 AbstractFactory 타입으로 전달 → Client가 `createA()`·`createB()` 호출 → 같은 계열 ConcreteProduct 반환 → Client는 AbstractProduct 인터페이스로만 사용.
- consequences(원문 기준):
  - 얻는 것: (1) 구체 클래스를 격리한다 — 제품 클래스 이름이 구체 팩토리 구현 안에만 있고 클라이언트 코드에 나타나지 않는다. (2) 제품군 교체가 쉽다 — 구체 팩토리를 바꾸면 제품군 전체가 한꺼번에 바뀐다. (3) 제품 간 일관성을 촉진한다 — 한 번에 한 계열만 쓰도록 강제하기 쉽다.
  - 대가: (4) 새로운 **종류**의 제품 지원이 어렵다 — AbstractFactory 인터페이스가 만들 수 있는 제품 집합을 고정하므로, 종류를 늘리려면 AbstractFactory와 모든 서브클래스를 바꿔야 한다.
- 원문 Implementation 요지: 구체 팩토리는 제품군당 하나면 되므로 보통 Singleton으로 구현한다. 제품 생성은 제품마다 팩토리 메서드를 두는 방식이 가장 흔하고, 제품군이 많으면 프로토타입을 들고 복제하는 구체 팩토리로 계열마다 서브클래스를 만들 필요를 없앤다. 확장 가능한 팩토리 — 종류를 매개변수로 받는 단일 `Make` 연산은 더 유연하지만 덜 안전하다(반환이 모두 같은 추상 인터페이스라 클라이언트가 하위 타입 연산을 안전하게 쓸 수 없음).

### 최소 조건 후보
- [필수] 팩토리 **객체**가 생성 책임을 지고, 클라이언트는 그 추상 타입(`AbstractFactory`)을 통해 제품을 요청한다 — 반례: 제품을 쓰는 클래스 자신의 추상 메서드로 생성을 미루면 Factory Method다.
- [필수] 서로 관련된 제품 **종류가 둘 이상**이고 한 팩토리가 그 종류들을 모두 만든다(생성 연산 여러 개, 또는 종류 매개변수를 받는 `make(kind)`) — 반례: 제품 1종만 만드는 팩토리 객체는 "제품군 일관성"이라는 결과가 성립할 대상이 없다. 단, GoF 토론 절에 1종짜리 팩토리 계층을 Abstract Factory로 부르는 예가 있어 미해결 질문으로 남긴다.
- [필수] 각 제품 종류가 `AbstractProduct`로 추상화되고 생성 연산의 반환 타입도 추상이다 — 반례: `LightButton createButton()`처럼 구체 타입을 반환하면 구체 클래스 격리(결과 1)가 깨진다.
- [필수] 계열(variant)마다 `ConcreteFactory`가 분리되어 있다 — 반례: 팩토리 하나가 메서드마다 `if (theme == LIGHT)`로 분기하면 계열 교체 지점이 모든 생성 연산으로 흩어져 결과 2가 성립하지 않는다.
- [필수] `Client`는 AbstractFactory·AbstractProduct 인터페이스만 쓴다 — 반례: 클라이언트 코드 곳곳에 `new MotifWindow()`가 남아 있으면 팩토리를 바꿔도 계열이 섞인다.
- 불변식: 한 ConcreteFactory 인스턴스가 만든 제품들은 모두 같은 계열이다(결과 3).
- [선택] ConcreteFactory를 Singleton으로 둔다(원문 Implementation 1).
- [선택] 각 생성 연산을 팩토리 메서드로 구현한다 / 프로토타입 복제로 구현한다(원문 Implementation 2).
- [선택] 단일 매개변수화 `make(kind)` 연산(원문 Implementation 3, 타입 안전성 대가).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 시스템이 제품의 생성·구성·표현 방식과 독립적이어야 한다 / 여러 제품군 중 하나로 시스템을 구성해야 한다 / 함께 쓰도록 설계된 제품군을 섞이지 않게 강제해야 한다 / 구현은 숨기고 인터페이스만 드러내는 제품 라이브러리를 제공한다(원문 Applicability).
  - 코드 모양: OS·테마·DB 벤더·클라우드 제공자별 `if (platform == ...)` 분기가 여러 생성 지점에 **반복**된다. 섞이면 안 되는 조합(원문 예: Motif 창 + Presentation Manager 스크롤바)이 버그로 나온다.
- 쓰지 말아야 할 때:
  - 제품 **종류**가 자주 늘어난다 — 인터페이스와 모든 구체 팩토리를 매번 고쳐야 한다(원문 결과 4).
  - 계열이 하나뿐이거나 제품 간 일관성 요구가 없다 — Factory Method로 충분하다. 원문 토론은 AF·Prototype·Builder가 FM보다 유연하지만 더 복잡하다고 적는다.
  - refactoring.guru Pros and Cons: 인터페이스·클래스가 많이 늘어 필요 이상으로 복잡해질 수 있다.

### 비교 대상
- vs Factory Method: 제품군을 팩토리 객체 합성으로 vs 제품 1종을 서브클래스 상속으로. AF의 생성 연산은 흔히 팩토리 메서드로 구현되므로 "AF 안에 FM이 있다"는 구조가 정상이다(GoF Related Patterns, Discussion of Creational Patterns). 오인하기 쉬운 코드 모양: `interface GuiFactory { Button createButton(); }` 하나만 있는 인터페이스를 주입받는 코드 — 객체 합성이긴 하지만 제품군이 없다. (PATTERNS.md 빠른 비교 페어: 제품 1종 vs 제품군)
- vs Builder: AF는 제품(군)을 호출 즉시 반환하고, Builder는 여러 단계 뒤 마지막에 반환한다. Builder의 초점은 복잡한 객체 하나를 단계적으로 만드는 것, AF의 초점은 (단순하든 복잡하든) 제품 **군**이다(GoF Builder Related Patterns, refactoring.guru Relations). 오인하기 쉬운 코드 모양: `factory.createCar()` 내부에서 엔진·바퀴를 조립 — 클라이언트가 단계를 호출하지 않고 한 번에 받으면 AF(또는 FM), 단계 호출 뒤 `getResult()`로 꺼내면 Builder. (PATTERNS.md 빠른 비교 페어: 단계적 조립 vs 제품군 일관성)
- vs Prototype: 경쟁 관계이면서 결합도 가능하다 — AF가 프로토타입 집합을 보관했다가 복제해 제품을 반환할 수 있다(GoF Prototype Related Patterns, AF Implementation 2). 오인하기 쉬운 코드 모양: `Map<String, Shape>` 레지스트리에서 꺼내 `clone()`하는 팩토리 클래스 — 계열별 팩토리 서브클래스 없이 프로토타입 집합만 바꾸면 Prototype 기반 AF.
- vs Facade: AF는 서브시스템 객체를 서브시스템에 독립적으로 **생성**하는 인터페이스를 주고, 플랫폼 특화 클래스를 숨기는 목적에서는 Facade의 대안이 될 수 있다(GoF Facade Related Patterns). 오인하기 쉬운 코드 모양: 서브시스템 객체를 만들어 돌려주기만 하는 클래스를 "Facade"라고 부르는 경우.

### 세 언어 구현 쟁점
- Java:
  - 관용구: `interface GuiFactory { Button createButton(); Checkbox createCheckbox(); }` + 계열별 구현 클래스, 구체 팩토리 선택은 설정·DI 한 곳. JDK의 `TransformerFactory`처럼 추상 클래스 + `newInstance()`가 구현체를 찾아 주는 방식도 있다.
  - 함정: 제품 종류 추가가 인터페이스 변경이라 모든 구현이 깨진다(원문 결과 4).
- TypeScript:
  - 관용구: 인터페이스 + 객체 리터럴이나 클래스로 구체 팩토리 구현.
  - 함정: 구조적 타이핑이라 두 계열 제품의 모양이 같으면 타입 시스템이 계열 섞임을 막지 못한다(Handbook Type Compatibility). 명목 구분이 필요하면 클래스에 `private`/`protected` 멤버를 두는 방법이 있다 — Handbook은 private·protected 멤버가 있으면 같은 클래스에서 유래한 멤버만 호환된다고 명시한다.
- Rust:
  - 동적 디스패치: `trait GuiFactory { fn create_button(&self) -> Box<dyn Button>; ... }` — 런타임에 팩토리 교체 가능.
  - 정적 디스패치: 연관 타입이나 제네릭으로 제품 타입을 고정 — 한 팩토리 구현의 제품 타입이 컴파일 시 묶이므로 계열 일관성을 타입으로 강제하는 효과가 있다(해석). refactoring.guru의 Rust 예제는 같은 팩토리를 `app`(제네릭, 정적)과 `app-dyn`(동적) 두 클라이언트로 보여 주고, 라이브러리는 정적·바이너리는 동적 디스패치를 권한다.
  - 함정: 제네릭 메서드나 `Self` 반환이 있는 trait은 dyn 호환이 아니다(Rust Reference, Dyn compatibility).

### 실제 사용처
- `org.w3c.dom.Document` — `AbstractFactory` = Document, 생성 연산 = `createElement`·`createTextNode`·`createComment` 등, `AbstractProduct` = `Element`·`Text`·`Comment` 인터페이스, `ConcreteFactory` = DOM 구현체의 Document 클래스(구현 클래스명 확인 안 함). Javadoc이 "the Document interface also contains the factory methods needed to create these objects"라고 쓰고, 생성된 노드는 `ownerDocument`로 그 Document에 묶인다(계열 일관성). — [Document (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/org/w3c/dom/Document.html) · Java SE 21
- `javax.xml.transform.TransformerFactory` — `AbstractFactory` = TransformerFactory(추상 클래스), 생성 연산 = `newTransformer()`·`newTemplates()`, `AbstractProduct` = `Transformer`·`Templates`, `ConcreteFactory` = `newInstance()`가 찾아 주는 구현. Javadoc: "can be used to create Transformer and Templates objects". refactoring.guru도 AF 사례로 든다. — [TransformerFactory (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/transform/TransformerFactory.html) · Java SE 21
- `java.sql.Connection` — `AbstractFactory` = Connection, 생성 연산 = `createStatement`·`prepareStatement`·`prepareCall`, `AbstractProduct` = `Statement`·`PreparedStatement`·`CallableStatement`, `ConcreteFactory` = 드라이버별 Connection 구현(해석, Javadoc에 패턴명 없음). — [Connection (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html) · Java SE 21

### 기존 가이드 승계분
- 최소 조건 취지: 한 인터페이스가 복수 종류의 제품을 함께 만들어야 하고(생성 메서드 하나뿐이면 FM), 각 제품이 추상 제품 인터페이스로 추상화되며, 변형마다 구체 팩토리가 분리되고(내부 `if (theme)` 분기는 아님), 제품군 내 일관성이 보장되고, 클라이언트는 추상 팩토리에만 의존해 구체 팩토리는 한 곳에서만 인스턴스화한다. 이름에 Factory가 들어가도 단일 종류만 만들면 AF가 아니며, 단계 개념 유무가 Builder와의 결정적 차이라고 본다.
- 참고 자료:
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (Gang of Four), "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — Chapter 3, "Abstract Factory".
  - Refactoring.Guru, "Abstract Factory" — https://refactoring.guru/design-patterns/abstract-factory
  - Oracle Java Platform SE Documentation, `javax.xml.parsers.DocumentBuilderFactory` — https://docs.oracle.com/javase/8/docs/api/javax/xml/parsers/DocumentBuilderFactory.html
  - Joshua Bloch, "Effective Java" (3rd ed.), Item 1 "Consider static factory methods instead of constructors" — 추상 팩토리와의 대비를 통해 정적 팩토리·팩토리 메서드의 위치를 이해하는 데 유용하다.
  - Wikipedia, "Abstract factory pattern" — https://en.wikipedia.org/wiki/Abstract_factory_pattern

### 출처
- [Abstract Factory — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3a.htm) — Intent·별칭 Kit·Applicability·Participants·Collaborations·Consequences 1~4·Implementation(Singleton, 제품 생성, 확장 가능한 팩토리)·Known Uses·Related Patterns · 조회 2026-09-17
- [Discussion of Creational Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc3.htm) — 제품 1종짜리 GraphicsFactory 계층을 AF 적용 예로 든 부분, 설계가 FM에서 다른 생성 패턴으로 진화한다는 서술 · 조회 2026-09-17
- [Builder — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3b.htm) — Related Patterns의 AF 대비 · 조회 2026-09-17
- [Prototype — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3d.htm) — AF와 경쟁·결합 관계 · 조회 2026-09-17
- [Facade — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4e.htm) — AF가 Facade의 대안이 될 수 있다는 Related Patterns · 조회 2026-09-17
- [Abstract Factory — refactoring.guru](https://refactoring.guru/design-patterns/abstract-factory) — Relations, Pros and Cons · 조회 2026-09-17
- [Abstract Factory in Java — refactoring.guru](https://refactoring.guru/design-patterns/abstract-factory/java/example) — JDK 사용 예 목록(`DocumentBuilderFactory`·`TransformerFactory`·`XPathFactory#newInstance`)과 식별 기준 · 조회 2026-09-17
- [Abstract Factory in Rust — refactoring.guru](https://refactoring.guru/design-patterns/abstract-factory/rust/example) — 정적(`app`)·동적(`app-dyn`) 디스패치 두 구현과 선택 기준 · 조회 2026-09-17
- [Document (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/org/w3c/dom/Document.html) — "factory methods needed to create these objects", ownerDocument 연관 · 조회 2026-09-17
- [TransformerFactory (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.xml/javax/xml/transform/TransformerFactory.html) — Transformer·Templates 생성, `newTransformer`·`newTemplates` · 조회 2026-09-17
- [Connection (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html) — `createStatement`·`prepareCall` 등 생성 메서드 · 조회 2026-09-17
- [TypeScript Handbook — Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — 구조적 서브타이핑, private·protected 멤버가 호환성에 주는 영향 · 조회 2026-09-17
- [Rust Reference — Traits (Dyn compatibility)](https://doc.rust-lang.org/reference/items/traits.html) — dyn 호환 조건 · 조회 2026-09-17

### 미해결 질문
- ~~GoF Discussion of Creational Patterns는 "각 팩토리가 제품 하나만 만드는" GraphicsFactory 계층도 Abstract Factory 적용으로 부르고, refactoring.guru의 JDK 사례(`DocumentBuilderFactory`는 주로 `DocumentBuilder` 1종)도 같은 모양이다. "제품 종류 2개 이상"을 [필수]로 둘지, 의도(intent)의 "families"를 근거로 [필수]를 유지하되 이 사례를 경계 사례로 설명할지 정해야 한다. 기존 가이드는 전자(1종이면 FM)였다.~~ → **닫힘(가이드 v1.0.0, 2026-09-27)**: 「제품 종류 둘 이상」을 **`[필수]` 로 유지**한다. 근거는 Intent 의 families 다(PG27 통과). 다만 원전 토론 절의 1종짜리 사례가 반대 방향이라, 가이드는 최소 조건 2번 경계 문단에서 **이 선이 원전이 그어 준 것이 아니라 의도의 「군」을 기준으로 이 가이드가 고른 것**임을 밝히고 `IconSet`(생성 연산 1개) 반례로 경계를 보인다.
- JDK 내장 `Document`·`TransformerFactory` 구현 클래스명(ConcreteFactory)은 확인하지 않았다.
- 기존 가이드 참고 자료의 "Chapter 3" 표기: CD판 목차에서 Creational Patterns가 Introduction·Case Study 다음 장인 것은 확인했으나 판면의 장 번호는 확인하지 않았다.

## Builder (빌더)

### 원전 대응
- 분류: 생성 · 객체 범위. 원서 시작 쪽 97.
- 의도(intent): "Separate the construction of a complex object from its representation so that the same construction process can create different representations." (GoF 원문 Builder · Intent)
- participants:
  - `Builder` (TextConverter) — Product의 부분(part)을 만드는 추상 인터페이스를 명세한다.
  - `ConcreteBuilder` (ASCIIConverter, TeXConverter, TextWidgetConverter) — Builder 인터페이스를 구현해 부분을 만들고 조립한다. 자신이 만드는 표현을 정의하고 추적한다. 제품을 꺼내는 인터페이스(`GetASCIIText`, `GetTextWidget`)를 제공한다.
  - `Director` (RTFReader) — Builder 인터페이스를 써서 객체를 구성한다.
  - `Product` (ASCIIText, TeXText, TextWidget) — 구성 중인 복합 객체. ConcreteBuilder가 그 내부 표현과 조립 과정을 정의한다. 구성 부분을 정의하는 클래스들과 부분을 최종 결과로 조립하는 인터페이스를 포함한다.
- collaborations:
  1. 클라이언트가 Director를 만들고 원하는 Builder 객체로 구성한다. — 왜: 같은 구성 절차(Director)에 다른 표현(Builder)을 끼우기 위해.
  2. Director는 제품의 부분을 만들어야 할 때마다 Builder에 알린다.
  3. Builder는 Director의 요청을 처리해 제품에 부분을 추가한다.
  4. 클라이언트가 Builder에게서 제품을 꺼낸다. — 왜: Director는 결과 제품의 구체 타입을 모르기 때문이다(표현마다 제품 클래스가 다름).
- consequences(원문 기준):
  - 얻는 것: 제품의 내부 표현을 바꿀 수 있다(새 Builder만 정의하면 됨). 구성 코드와 표현 코드를 격리한다(ConcreteBuilder에 특정 제품 생성·조립 코드가 모이고, 다른 Director — 예: SGMLReader — 가 같은 Builder들을 재사용). 구성 과정을 더 세밀하게 제어한다(한 번에 만드는 다른 생성 패턴과 달리 Director 통제 아래 단계적으로 만들고, 완성된 뒤에만 꺼냄).
  - 대가: 원문 Consequences에 명시된 단점 항목은 없다. refactoring.guru Pros and Cons는 새 클래스가 여럿 필요해 전체 복잡도가 늘어난다고 적는다.
- 원문 Implementation 요지: Builder 인터페이스는 모든 ConcreteBuilder의 제품을 만들 만큼 일반적이어야 한다(보통 "요청 결과를 제품에 덧붙이는" 모델이면 충분). **제품에 공통 추상 클래스가 없는 것이 보통**이다 — 구체 빌더들이 만드는 표현이 너무 달라 공통 부모의 이득이 적다. C++에서는 빌드 메서드를 순수 가상이 아닌 빈 메서드로 두어 필요한 것만 오버라이드한다.

### 최소 조건 후보
- [필수] 제품과 **분리된** Builder 객체가 부분 구성 연산을 단계별로 받는다 — 반례: Product 자신이 `return this` 세터를 체이닝하면 구성과 표현이 분리되지 않은 fluent interface다(refactoring.guru Builder in Rust: "The Builder design pattern is not the same as the Fluent Interface idiom").
- [필수] 완성된 제품을 꺼내는 명시적 조회·종결 연산이 있다(원문 `GetResult` 계열, Rust API Guidelines의 "terminal" 메서드) — 반례: 부분 연산이 호출될 때마다 완성품을 돌려주면 "완성된 뒤에만 꺼낸다"는 결과(세밀한 제어)가 없다.
- [필수] 구성 절차를 호출하는 쪽(Director 또는 클라이언트)은 Builder의 인터페이스만 쓰고 제품 내부 구조를 조립하지 않는다 — 반례: 클라이언트가 빌더에서 부품을 꺼내 제품 필드에 직접 꽂으면 구성 코드가 격리되지 않는다.
- [필수 — GoF형으로 판정할 때] Director가 추상 Builder 인터페이스에만 의존해, 같은 절차로 ConcreteBuilder를 바꿔 다른 표현을 만든다 — 반례: Director가 특정 ConcreteBuilder 타입에 묶이면 "같은 구성 절차로 다른 표현"이라는 intent가 성립하지 않는다.
- [선택] Director의 존재 — refactoring.guru는 "Having a director class in your program isn't strictly necessary"라고 적고, 입력·옵션이 많은 단일 제품용 빌더(Rust API Guidelines C-BUILDER, Java `HttpRequest.Builder`)에는 Director가 없다.
- [선택] 제품들의 공통 인터페이스 — 원문은 오히려 없는 것이 보통이라고 한다.
- [선택] 메서드 체이닝(`return self`) — C-BUILDER는 권장하지만 GoF 조건은 아니다.
- [선택] 종결 시점 검증 — `HttpRequest.Builder#build()`는 URI가 없으면 `IllegalStateException`을 던진다. 기존 가이드는 이를 필수로 두었다(미해결 질문 참고).
- 불변식(권장): 종결 연산이 돌려준 제품은 이후 빌더 변경과 독립이다 — `HttpRequest.Builder`는 `build()`마다 새 `HttpRequest`를 반환하고 만들어진 요청은 불변이라고 명시한다.

### 사용 단서
- 이런 코드/요구가 보이면:
  - 복합 객체를 만드는 알고리즘이 부분과 그 조립 방식에서 독립적이어야 한다 / 구성 과정이 서로 다른 표현을 허용해야 한다(원문 Applicability). 코드 모양: 같은 파싱·순회 절차에서 출력 포맷만 여러 개(원문 RTF → ASCII·TeX·위젯).
  - 입력이 많거나, 복합 데이터(슬라이스 등)를 점진적으로 넣어야 하거나, 선택 설정이 많거나, 여러 "맛(flavor)" 중 선택해야 해서 인자가 많은 생성자가 여러 개로 불어난다(Rust API Guidelines C-BUILDER). 코드 모양: 인자 8개짜리 생성자와 그 오버로드.
  - 생성에 부수 효과가 있다(태스크 생성, 프로세스 실행) — C-BUILDER가 특히 적합하다고 명시.
- 쓰지 말아야 할 때:
  - 필드가 적고 선택 옵션이 없어 생성자·객체 리터럴로 충분할 때 — 새 클래스가 여럿 늘어 복잡도만 커진다(refactoring.guru Pros and Cons).
  - 단계 없이 호출 즉시 완성품이 나오면 되는 경우 — Factory Method·Abstract Factory 영역이다(원문: 다른 생성 패턴은 "in one shot").

### 비교 대상
- vs Abstract Factory: 단계적 조립 후 마지막 반환 vs 제품군을 즉시 반환(GoF Builder Related Patterns). 오인하기 쉬운 코드 모양: `builder.buildEngine(); builder.buildWheels();` 없이 `factory.createCar()` 한 번으로 끝나면 AF(또는 FM), 호출이 여러 단계로 나뉘고 끝에 꺼내면 Builder. (PATTERNS.md 빠른 비교 페어)
- vs Fluent interface(세터 체이닝): 체이닝은 호출 문법이고 Builder는 구성과 표현의 분리다(refactoring.guru Builder in Rust). 오인하기 쉬운 코드 모양: `new Pizza().size(12).cheese(true)`처럼 **제품 자신**이 가변 세터를 체이닝하는 것.
- vs Factory Method: 한 번에 만드느냐, Director 통제 아래 단계적으로 만드느냐(원문 Consequences의 "Unlike creational patterns that construct products in one shot"). 오인하기 쉬운 코드 모양: `createDocument(options)` 안에서 여러 부품을 조립 — 클라이언트에게 단계가 노출되지 않으면 Builder가 아니다.
- 관계(혼동 아님): Builder가 흔히 만드는 것이 Composite다(GoF Related Patterns). refactoring.guru는 Director를 Bridge의 Abstraction, Builder들을 Implementation으로 결합할 수 있다고 적는다.

### 세 언어 구현 쟁점
- Java:
  - 관용구: 정적 중첩 `Builder` 클래스 + 제품의 비공개 생성자(Effective Java 3판 Item 2로 알려짐, 원문 확인 안 함). 표준 API는 `HttpRequest.newBuilder()...build()`, `ProcessBuilder#start()`.
  - 함정: 빌더는 가변이고 스레드 안전하지 않은 경우가 많다 — `HttpRequest.Builder` Javadoc은 세터가 같은 인스턴스를 반환하고 동기화되지 않아 외부 동기화 없이 여러 스레드에서 호출하면 안 된다고 명시한다.
  - 함정: 같은 빌더로 여러 번 종결 연산을 부를 수 있는지 계약을 밝혀야 한다 — `ProcessBuilder#start()`는 같은 인스턴스에서 반복 호출해 같은 속성의 프로세스를 여러 개 만들 수 있다고 명시한다.
- TypeScript:
  - 관용구: 선택 속성(`?`)이 있는 옵션 객체 리터럴이 단순 빌더를 대체하는 경우가 많다(Handbook Object Types의 Optional Properties). 순서·검증·다른 표현이 필요할 때 빌더 클래스를 쓴다.
  - 관용구: 하위 클래스에서도 체이닝 타입을 유지하려면 반환 타입 `this`를 쓴다(Handbook Classes의 `this` Types).
  - 함정: `readonly`는 런타임 동작을 바꾸지 않는다(Handbook Object Types). 제품 불변성을 런타임에 강제하려면 `Object.freeze` 등이 필요하고 그것도 얕은 동결이다(MDN Object.freeze).
- Rust:
  - 관용구: C-BUILDER — 별도 `TBuilder` 타입, 필수 데이터만 받는 빌더 생성자, 설정 메서드, 하나 이상의 종결 메서드.
  - 소유권 쟁점: **비소비형(non-consuming) 빌더가 권장**된다 — 종결 메서드(`Command::spawn`)가 설정 데이터의 소유권이 필요 없어 `&self`를 받으므로 설정 메서드는 `&mut self`를 받고 돌려주며, 한 줄 체이닝과 복잡한 단계적 구성 모두에 쓸 수 있다. 종결 시 소유권을 넘겨야 하면(예: `io::Write` 소유권을 태스크에 넘김) **소비형**이다. 이때 설정 메서드가 가변 빌림이면 한 줄 체이닝이 불가능하고, 소유 `self`를 주고받으면 복잡한 구성이 불편해지는 절충이 있어, C-BUILDER는 소비형 빌더의 모든 메서드가 소유 `self`를 받고 돌려주도록 권한다.
  - std 시그니처 실례: `OpenOptions::open(&self, path)`와 `Command::spawn(&mut self)`는 빌더를 남기고(비소비형), `thread::Builder::spawn(self, f)`는 빌더를 소비한다(소비형). 가이드 예제에서 두 형태를 대비할 수 있다.
  - 참고(보조 출처): rust-unofficial Patterns 책의 Builder 항목.

### 실제 사용처
- `java.net.http.HttpRequest.Builder` — `Builder` = HttpRequest.Builder(인터페이스), `ConcreteBuilder` = JDK 내부 구현(클래스명 확인 안 함), `Product` = `HttpRequest`, 종결 = `build()`, Director 없음. Javadoc: "A builder of HTTP requests", Since 11. — [HttpRequest.Builder (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html) · Java 11+
- `java.lang.ProcessBuilder` — `Builder`·`ConcreteBuilder` = ProcessBuilder(속성 모음 관리), `Product` = `Process`, 종결 = `start()`(반복 호출 가능). — [ProcessBuilder (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ProcessBuilder.html) · Java SE 21
- Rust `std::process::Command` — 문서가 "A process builder"라고 부르고 C-BUILDER가 "Command is the builder for a child process"라고 든다. `Product` = `Child`/`Output`/`ExitStatus`, 종결 = `spawn`·`output`·`status`(모두 `&mut self`). — [Command](https://doc.rust-lang.org/std/process/struct.Command.html) · 버전 표기 확인 안 함
- Rust `std::fs::OpenOptions` — 문서가 "This builder exposes the ability to configure how a File is opened"라고 쓴다. `Product` = `File`, 종결 = `open`. — [OpenOptions](https://doc.rust-lang.org/std/fs/struct.OpenOptions.html)
- Rust `std::thread::Builder` — "Thread factory, which can be used in order to configure the properties of a new thread." 이름은 Builder, 문서 표현은 factory. 종결 = `spawn`. — [thread::Builder](https://doc.rust-lang.org/std/thread/struct.Builder.html)
- Spring `UriComponentsBuilder` — "Builder for UriComponents", `Product` = `UriComponents`. — [UriComponentsBuilder (Spring Framework 7.0.9 API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/UriComponentsBuilder.html) · 조회 시 7.0.9

### 기존 가이드 승계분
- 최소 조건 취지: 생성이 여러 번의 부품 설정 호출로 나뉘고, 빌더는 부품 누적만 맡고 명시적 종결 메서드로 결과를 내며, GoF 변형이면 Director가 빌더 인터페이스에만 의존하고 Effective Java 변형이면 다인자 생성을 가독성 있게 캡슐화하며, `build()` 시점에 필수 필드·불변식을 검증한다. fluent setter와 혼동하지 말 것, 필드 2~3개 DTO에 빌더는 과함, 제품이 자기 자신을 반환하면 제품이 곧 빌더라 분리가 깨진 것이라고 본다.
- 참고 자료:
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (1994). *Design Patterns: Elements of Reusable Object-Oriented Software* — "Builder" 항목 (GoF 원전).
  - Joshua Bloch (2018). *Effective Java*, 3rd Edition — Item 2: "Consider a builder when faced with many constructor parameters".
  - Refactoring.Guru — Builder Pattern: https://refactoring.guru/design-patterns/builder
  - Oracle Java SE API Docs — `java.lang.StringBuilder`, `java.lang.ProcessBuilder`, `java.util.stream.Stream.Builder`
  - Square OkHttp `Request.Builder` 소스: https://github.com/square/okhttp
  - Spring Framework `UriComponentsBuilder` 문서: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/UriComponentsBuilder.html

### 출처
- [Builder — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3b.htm) — Intent·Applicability·Participants·Collaborations 4단계·Consequences·Implementation(제품 공통 추상 클래스 불필요)·Known Uses·Related Patterns · 조회 2026-09-17
- [Builder — refactoring.guru](https://refactoring.guru/design-patterns/builder) — Director가 필수가 아니라는 서술, Relations, Pros and Cons · 조회 2026-09-17
- [Builder in Rust — refactoring.guru](https://refactoring.guru/design-patterns/builder/rust/example) — Builder와 Fluent Interface 구분, 제품 공통 인터페이스 불필요 · 조회 2026-09-17
- [Builder in Java — refactoring.guru](https://refactoring.guru/design-patterns/builder/java/example) — JDK 사용 예 목록(`StringBuilder#append` 등)과 식별 기준 · 조회 2026-09-17
- [Rust API Guidelines — Type safety (C-BUILDER)](https://rust-lang.github.io/api-guidelines/type-safety.html) — 빌더가 필요한 조건, 종결 메서드, 비소비형(권장)·소비형 빌더의 소유권 절충, Command 예 · 조회 2026-09-17
- [HttpRequest.Builder (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html) — 세터가 같은 인스턴스 반환·비동기화, build마다 새 불변 HttpRequest, IllegalStateException, Since 11 · 조회 2026-09-17
- [ProcessBuilder (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ProcessBuilder.html) — 속성 모음 관리, start 반복 호출 · 조회 2026-09-17
- [Command (Rust std)](https://doc.rust-lang.org/std/process/struct.Command.html) — "A process builder", spawn·output·status 시그니처 · 조회 2026-09-17
- [OpenOptions (Rust std)](https://doc.rust-lang.org/std/fs/struct.OpenOptions.html) — "This builder exposes..." · 조회 2026-09-17
- [thread::Builder (Rust std)](https://doc.rust-lang.org/std/thread/struct.Builder.html) — "Thread factory..." · 조회 2026-09-17
- [UriComponentsBuilder (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/util/UriComponentsBuilder.html) — "Builder for UriComponents", 조회 시 문서 7.0.9 · 조회 2026-09-17
- [TypeScript Handbook — Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) — Optional Properties, readonly가 런타임 동작을 바꾸지 않음 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — `this` Types 절 존재 · 조회 2026-09-17
- [MDN — Object.freeze()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) — freeze는 얕다 · 조회 2026-09-17
- [rust-unofficial Patterns — Builder](https://rust-unofficial.github.io/patterns/patterns/creational/builder.html) — 보조 출처(존재 확인만) · 조회 2026-09-17

### 미해결 질문
- 기존 가이드는 "`build()` 시점 검증"을 필수 조건으로 두었지만 GoF 원문에는 그런 조건이 없다. 분석기 기준으로 [필수]로 올릴지 [선택]으로 둘지 정해야 한다.
- GoF형(Director + 여러 표현)과 옵션형(Effective Java·C-BUILDER, Director 없음)을 한 가이드에서 "같은 패턴의 두 변형"으로 다룰지, 옵션형을 별도 관용구로 분리할지 정해야 한다. 표준 라이브러리 실례는 거의 모두 옵션형이고, Director가 있는 표준 라이브러리 실례는 찾지 못했다.
- refactoring.guru Java 예의 `StringBuilder#append`·`ByteBuffer#put`·`Appendable`을 Builder 사례로 볼지 — 종결 연산(`toString`)은 있으나 "구성과 표현의 분리" 기준에서 논쟁 여지가 있다.
- Effective Java 3판 Item 2 원문과 OkHttp `Request.Builder` 소스는 확인하지 않았다(기존 참고 자료 승계).

## Prototype (프로토타입)

### 원전 대응
- 분류: 생성 · 객체 범위. 원서 시작 쪽 117.
- 의도(intent): "Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype." (GoF 원문 Prototype · Intent)
- participants:
  - `Prototype` (Graphic) — 자기 자신을 복제하는 인터페이스를 선언한다.
  - `ConcretePrototype` (Staff, WholeNote, HalfNote) — 자기 자신을 복제하는 연산을 구현한다.
  - `Client` (GraphicTool) — 프로토타입에게 자기 복제를 요청해 새 객체를 만든다.
- collaborations: 원문은 한 항목 — 클라이언트가 프로토타입에게 자기 복제를 요청한다. 원문 Implementation을 합친 가이드용 단계 풀이는 다음과 같다.
  1. (선택) 프로토타입 관리자(레지스트리)에 키로 프로토타입을 등록해 둔다. — 왜: 프로토타입 수가 고정되지 않고 런타임에 늘고 줄 때 클라이언트가 직접 관리하지 않게 하려고.
  2. 클라이언트가 Prototype 타입 참조(또는 레지스트리 조회 결과)에 `clone`을 호출한다. — 왜: 클라이언트가 구체 제품 클래스 이름을 몰라도 되게.
  3. ConcretePrototype이 자기 상태를 복사한 새 객체를 반환한다. 무엇을 공유하고 무엇을 복사할지(얕은/깊은 복사)는 이 연산이 결정한다.
  4. (선택) 클라이언트가 복제본의 상태를 원하는 값으로 초기화한다(`Initialize` 연산 또는 기존 세터). — 왜: 초기화 인자 수가 프로토타입 클래스마다 달라 `clone`에 인자를 넘기면 균일한 복제 인터페이스가 깨지기 때문(원문 Implementation 3).
- consequences(원문 기준):
  - Abstract Factory·Builder와 공통: 구체 제품 클래스를 클라이언트에게서 숨겨 알아야 할 이름을 줄이고, 수정 없이 애플리케이션 특화 클래스와 일하게 한다.
  - 추가로 얻는 것: (1) 런타임에 제품 추가·제거(프로토타입 등록). (2) 값을 바꿔 새 "종류"의 객체 정의(클래스 정의 없이). (3) 구조를 바꿔 새 객체 정의(부분회로 같은 복합 구조를 프로토타입으로 — 단 Clone이 깊은 복사여야). (4) 서브클래싱 감소(FM의 평행 Creator 계층 불필요 — 클래스가 1급 객체가 아닌 C++ 같은 언어에서 이득이 큼). (5) 동적 로딩한 클래스로 애플리케이션 구성.
  - 대가: 모든 Prototype 서브클래스가 Clone을 구현해야 하는데, 이미 있는 클래스에 추가하기 어렵고 복사를 지원하지 않는 객체나 순환 참조를 내부에 가지면 구현이 어렵다.
- 원문 Implementation 요지: 프로토타입 관리자(키로 등록·해제·조회하는 연관 저장소), Clone 구현이 가장 어려운 부분(얕은 복사 vs 깊은 복사 — "Cloning forces you to decide what if anything will be shared"), 복제본 초기화(`Initialize`, 깊은 복사본을 재초기화하기 전 기존 부분 정리 주의).

### 최소 조건 후보
- [필수] 복제 연산이 **추상 타입(Prototype) 수준**에 선언되어 있다 — 반례: 구체 클래스에만 복사 생성자가 있고 호출부가 `new Staff(other)`를 쓰면 클라이언트가 구체 클래스를 알아야 하므로 "구체 제품 클래스를 숨긴다"는 결과가 없다.
- [필수] 클라이언트는 프로토타입 **인스턴스**에 복제를 요청해 새 객체를 얻고, 만들 구체 클래스를 스스로 고르지 않는다 — 반례: `clone()`은 있는데 호출부가 `if (x instanceof WholeNote) new WholeNote()`로 분기하면 복사 메서드일 뿐이다.
- [필수] 복제본과 원본 사이의 공유 범위(얕은/깊은)가 **의도적으로 결정**되어 있다 — 반례: 가변 하위 객체를 얕게 공유해 복제본 수정이 프로토타입을 오염시키면 이후 모든 복제본이 바뀐다. 원문은 복잡한 구조의 프로토타입은 보통 깊은 복사가 필요하다고 한다.
- 불변식: 복제본을 변경해도(의도적으로 공유한 부분 제외) 프로토타입의 상태가 바뀌지 않는다. `clone()`은 원본과 **다른 객체**를 반환한다 — Java `Object#clone` Javadoc은 `x.clone() != x`, `x.clone().getClass() == x.getClass()`가 참인 것을 "general intent"로 들되 절대 요구는 아니라고 적는다.
- [선택] 프로토타입 관리자(레지스트리) — 원문은 프로토타입 수가 고정되지 않을 때 두라고 한다.
- [선택] 복제 후 초기화 연산(`Initialize`).
- [선택] 언어 내장 복제 수단 사용(Java `Object#clone`, Rust `Clone`, DOM `cloneNode`).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 시스템이 제품 생성 방식과 독립적이어야 하고, 인스턴스화할 클래스가 런타임에(동적 로딩 등으로) 정해지거나 / 제품 계층과 평행한 팩토리 계층을 피하고 싶거나 / 인스턴스가 가질 수 있는 상태 조합이 몇 가지뿐이라 그만큼 프로토타입을 두고 복제하는 편이 편할 때(원문 Applicability).
  - 코드 모양: 팔레트·템플릿 목록에서 "이것과 같은 것 하나 더"(원문 음악 편집기의 GraphicTool). 설정값만 다른 객체를 위해 서브클래스를 만들고 있다. 같은 초기화 코드가 반복된다(refactoring.guru: 반복 초기화 코드를 미리 만든 프로토타입 복제로 대체).
  - 합성·장식이 많이 쓰인 복잡한 구조를 처음부터 다시 만들지 않고 복제하고 싶다(원문 Related Patterns: Composite·Decorator를 많이 쓰는 설계).
- 쓰지 말아야 할 때:
  - 내부에 복사할 수 없는 자원이나 순환 참조가 있어 Clone 구현이 어렵다(원문 liability, refactoring.guru Cons).
  - 클래스가 1급 객체인 언어에서는 클래스 객체 자체가 이미 프로토타입처럼 동작해 이득이 줄어든다(원문 결과 4, Smalltalk·Objective C 언급).

### 비교 대상
- vs Abstract Factory: 경쟁 관계이면서 결합 가능 — AF가 프로토타입 집합을 보관했다가 복제해 제품을 반환할 수 있다(GoF Related Patterns). 오인하기 쉬운 코드 모양: 계열별 팩토리 서브클래스 없이 `partCatalog`(프로토타입 사전)만 바꾸는 팩토리.
- vs Factory Method: FM은 Creator 서브클래스 계층이 필요하고 초기화 단계가 필요 없다. Prototype은 Creator 계층이 필요 없지만 복제 후 초기화 연산이 필요할 수 있다(GoF Factory Method Related Patterns, refactoring.guru Relations). 오인하기 쉬운 코드 모양: 서브클래스마다 `createGraphic()`을 오버라이드 — 그 수가 제품 수만큼 늘면 Prototype으로 바꿀 신호(GoF Discussion of Creational Patterns).
- vs Spring `prototype` 빈 스코프(이름만 같음): Spring 문서는 prototype 스코프를 "요청될 때마다 새 빈 인스턴스를 생성"하는 것으로 정의한다. 기존 인스턴스를 **복제**하지 않으므로 GoF Prototype과 다르다. 오인하기 쉬운 코드 모양: `@Scope("prototype")`만 보고 Prototype 패턴이라고 부르는 것.
- vs JavaScript 프로토타입 상속·`structuredClone`: `Object.create(proto)`는 기존 객체를 새 객체의 **프로토타입(위임 대상)**으로 설정할 뿐 상태를 복사하지 않는다(MDN Object.create). `structuredClone`은 깊은 복사를 하지만 프로토타입 체인을 따라가거나 복제하지 않고 클래스 private 요소도 복제하지 않는다(MDN Structured clone algorithm) — 다형적 `clone()`이 아니다.

### 세 언어 구현 쟁점
- Java:
  - `Object#clone()`은 `protected`이고 기본 동작은 필드를 대입하듯 복사하는 **얕은 복사**다. `Cloneable`을 구현하지 않은 객체에서 호출하면 `CloneNotSupportedException`이 난다. 관례상 `super.clone()`으로 얻은 객체의 가변 "깊은 구조"를 복사해 독립성을 맞춘다(Javadoc `Object#clone`).
  - 함정: `Cloneable` 인터페이스에는 `clone` 메서드가 **없다** — 구현만으로는 복제할 수 없고 리플렉션 호출도 성공이 보장되지 않는다(Javadoc `Cloneable`). Prototype 인터페이스를 직접 선언(`Shape clone()`)하는 편이 계약이 분명하다. refactoring.guru Java 예제도 `Cloneable` 없이 복사 생성자 + 추상 `clone()`으로 구현한다.
  - Effective Java 3판 Item 13("clone 재정의는 주의해서")이 복사 생성자·복사 팩토리를 권한다고 알려져 있으나 원문 확인 안 함.
- TypeScript:
  - 관용구: `interface Prototype { clone(): this }` 또는 추상 클래스의 `abstract clone(): Shape`. `this` 타입은 현재 클래스 타입을 동적으로 가리킨다(Handbook Classes).
  - 함정: `structuredClone`으로 클래스 인스턴스를 복제하면 프로토타입 체인이 복제되지 않아 메서드가 사라진 평범한 객체가 되고, 함수는 `DataCloneError`를 낸다(MDN Structured clone algorithm). 객체 스프레드 `{...obj}`도 얕은 복사이며 열거 불가능 속성과 프로토타입을 복사하지 않는다(MDN Spread syntax). 두 방식 모두 다형적 `clone()`을 대신하지 못한다.
  - 함정: `#private` 필드는 해당 클래스 안에서만 접근 가능하므로(MDN Private properties) `clone()`을 그 클래스 안에서 구현해야 한다.
- Rust:
  - `Clone` 트레이트가 내장 Prototype 인터페이스 역할을 한다. `Clone`은 항상 명시적이며 비용이 클 수도 있고, 암묵적 비트 복사인 `Copy`와 다르다(std `Clone` 문서). `#[derive(Clone)]`의 복사 깊이는 필드 타입의 `Clone` 구현을 따른다.
  - 함정: `pub trait Clone: Sized`이고, `Sized`를 슈퍼트레이트로 가지는 트레이트는 dyn 호환이 아니다(Rust Reference) — `Box<dyn Clone>`은 불가능하다. 다형 복제가 필요하면 `trait Shape { fn clone_box(&self) -> Box<dyn Shape>; }` 같은 별도 메서드를 둔다(널리 쓰이는 관용 해법이지만 공식 문서 명시는 확인 안 함).
  - 함정: `Rc<T>`/`Arc<T>`에 `clone`을 호출하면 **같은 할당을 가리키는 새 포인터**가 생길 뿐 값은 복제되지 않는다(std `rc` 모듈 문서). 필드에 `Rc`가 있으면 `derive(Clone)`의 결과는 그 부분을 공유한다.

### 실제 사용처
- `java.lang.Object#clone()` + `java.lang.Cloneable` — `Prototype` 연산 = `clone()`, `ConcretePrototype` = `Cloneable`을 구현하고 `clone`을 공개 재정의한 클래스. 단 `Cloneable`에 메서드가 없어 인터페이스 대응은 부분적이다. refactoring.guru도 Java의 기본 사례로 든다. — [Object (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html) · [Cloneable (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Cloneable.html) · Java SE 21
- DOM `Node.cloneNode(deep)` — `Prototype` = `Node`, `ConcretePrototype` = `Element`·`Text` 등 하위 인터페이스 구현, `Client` = 구체 노드 타입을 모르고 `cloneNode`를 부르는 코드. `deep` 매개변수가 하위 트리 복제 여부(얕은/깊은)를 정하고, `addEventListener`로 붙인 리스너는 복제되지 않는다(MDN). — [Node: cloneNode() method](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode)
- Rust `std::clone::Clone` — `Prototype` 인터페이스 대응(정적 디스패치 전용, dyn 불가). refactoring.guru Rust 예제는 "Prototype pattern is ready to use out of the box"로 설명한다. — [Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html)

### 기존 가이드 승계분
- 최소 조건 취지: 원형 객체가 자기와 같은 타입의 새 객체를 반환하는 복제 메서드를 공통 인터페이스·추상 클래스 수준에서 노출하고, 클라이언트는 구체 클래스를 몰라도 `prototype.clone()`만으로 새 객체를 얻으며, 의도한 복제 깊이 안에서 복제본이 원본을 훼손하지 않고 그 경계가 문서화되어야 한다. 프로토타입 레지스트리는 선택이지만 런타임 동적 추가 사례에서는 사실상 필수라고 본다. `Object.clone()` 재정의만으로는 패턴이 아니며, 싱글톤과 목적이 정반대에 가깝고, 복제 깊이는 기본값이 아니라 설계 결정이라고 본다.
- 참고 자료:
  - Gamma, Helm, Johnson, Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*, Addison-Wesley, 1994. (GoF 원전, "Prototype" 장)
  - Joshua Bloch, *Effective Java*, 3rd Edition, Item 13: "Override clone judiciously" — `Cloneable`/`clone()`의 결함과 복사 생성자·정적 팩토리 권장
  - Oracle Java Platform Documentation, `java.lang.Object#clone()`, `java.lang.Cloneable`
  - Refactoring Guru, "Prototype Pattern" — https://refactoring.guru/design-patterns/prototype
  - Wikipedia, "Prototype pattern" — https://en.wikipedia.org/wiki/Prototype_pattern

### 출처
- [Prototype — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3d.htm) — Intent·Applicability·Participants·Collaborations·Consequences·liability·Implementation(관리자, 얕은/깊은 복사, 초기화)·Known Uses·Related Patterns · 조회 2026-09-17
- [Factory Method — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3c.htm) — Related Patterns의 Prototype 대비(Initialize 필요) · 조회 2026-09-17
- [Discussion of Creational Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc3.htm) — GraphicTool 예에서 Prototype이 가장 낫다는 판단 · 조회 2026-09-17
- [Prototype — refactoring.guru](https://refactoring.guru/design-patterns/prototype) — Relations, Pros and Cons(순환 참조) · 조회 2026-09-17
- [Prototype in Java — refactoring.guru](https://refactoring.guru/design-patterns/prototype/java/example) — `Object#clone` 사용 예, Cloneable 없는 구현 · 조회 2026-09-17
- [Prototype in Rust — refactoring.guru](https://refactoring.guru/design-patterns/prototype/rust/example) — 내장 `Clone` 트레이트 설명 · 조회 2026-09-17
- [Object (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html) — `clone`의 general intent(`x.clone() != x` 등), super.clone 관례, 독립성, 얕은 복사 · 조회 2026-09-17
- [MDN — Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) — 객체 스프레드는 얕은 복사, 프로토타입 미복사 · 조회 2026-09-17
- [Cloneable (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Cloneable.html) — clone 메서드 부재, CloneNotSupportedException · 조회 2026-09-17
- [Bean Scopes — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html) — prototype 스코프 정의, 조회 시 문서 7.0.9 · 조회 2026-09-17
- [MDN — Object.create()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create) — 기존 객체를 새 객체의 프로토타입으로 사용 · 조회 2026-09-17
- [MDN — The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — 함수 DataCloneError, 프로토타입 체인 미복제, private 요소 미복제 · 조회 2026-09-17
- [MDN — Window.structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) — 깊은 복제 · 조회 2026-09-17
- [MDN — Node.cloneNode()](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode) — 복제·deep 매개변수·리스너 미복제 · 조회 2026-09-17
- [MDN — Private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties) — `#` 요소는 클래스 밖에서 참조 불가 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — `this` Types · 조회 2026-09-17
- [Clone (Rust std)](https://doc.rust-lang.org/std/clone/trait.Clone.html) — `pub trait Clone: Sized`, Copy와의 차이 · 조회 2026-09-17
- [Rust Reference — Traits (Dyn compatibility)](https://doc.rust-lang.org/reference/items/traits.html) — Sized 슈퍼트레이트 금지 · 조회 2026-09-17
- [std::rc 모듈 (Rust std)](https://doc.rust-lang.org/std/rc/index.html) — Rc clone은 같은 할당의 새 포인터 · 조회 2026-09-17

### 미해결 질문
- Rust `clone_box` 관용 해법의 공식 문서 근거를 찾지 못했다(커뮤니티 관용으로만 표기할지 정해야 함).
- Wikipedia "Prototype pattern"과 Effective Java Item 13은 이번에 내용을 대조하지 않았다(기존 참고 자료 승계).

## Singleton (싱글톤)

### 원전 대응
- 분류: 생성 · 객체 범위. 원서 시작 쪽 127.
- 의도(intent): "Ensure a class only has one instance, and provide a global point of access to it." (GoF 원문 Singleton · Intent)
- participants:
  - `Singleton` — 클라이언트가 유일 인스턴스에 접근하는 `Instance` 연산을 정의한다. `Instance`는 클래스 연산(Smalltalk의 클래스 메서드, C++의 static 멤버 함수)이다. 자신의 유일 인스턴스를 만드는 책임을 질 수 있다.
- collaborations: 원문은 한 항목 — 클라이언트는 오직 `Instance` 연산으로만 Singleton 인스턴스에 접근한다. 원문 Implementation을 합친 단계 풀이:
  1. 클라이언트가 `Singleton::Instance()`를 호출한다.
  2. `Instance`는 유일 인스턴스를 담는 클래스 변수를 확인해, 비어 있으면 인스턴스를 만들어 저장한다(원문 예는 지연 초기화). — 왜: 최초 사용 전에 반드시 생성·초기화되게 하고, 정적 초기화 시점에는 필요한 정보가 없을 수도 있어서.
  3. 저장된 같은 인스턴스를 반환한다.
  4. 생성자는 `protected`라 클라이언트가 직접 인스턴스화하면 컴파일 오류가 난다(원문 C++ 예). — 왜: 하나만 만들어지게 보장하면서 서브클래싱은 허용하려고.
- consequences(원문은 이득만 나열):
  - (1) 유일 인스턴스에 대한 통제된 접근. (2) 이름 공간 축소 — 전역 변수의 개선. (3) 연산·표현의 정제 허용 — 서브클래싱하고 런타임에 확장 클래스의 인스턴스로 구성 가능. (4) 인스턴스 수 가변 허용 — `Instance` 연산만 바꾸면 여러 개로 바꿀 수 있음. (5) 클래스 연산보다 유연 — static 멤버 함수는 가상이 아니라 서브클래스가 다형적으로 오버라이드할 수 없음.
  - 대가(원문 밖 출처): Wikipedia Criticism — 전역 상태를 들여오고, 의존이 숨어 결합이 늘며, 단위 테스트가 어려워지고, 여러 인스턴스를 동시에 쓰는 추상화를 막는다. 의존성 주입으로 피할 수 있다. refactoring.guru Cons — 단일 책임 원칙 위반(두 문제를 동시에 해결), 나쁜 설계를 가릴 수 있음, 멀티스레드 환경에서 특별 처리 필요, 비공개 생성자·정적 메서드 때문에 목(mock) 만들기가 어려움.
- 원문 Implementation 요지: 유일 인스턴스 보장(생성 연산을 클래스 연산 뒤에 숨기고 생성자는 protected, 전역·정적 객체로 두는 방식은 C++에서 유일성·초기화 정보·초기화 순서 문제), Singleton 서브클래싱(환경 변수로 서브클래스 선택, 또는 이름→인스턴스 "registry of singletons").

### 최소 조건 후보
- [필수] 클래스(모듈) 밖에서 임의로 인스턴스를 만들 수 없다 — `private`/`protected` 생성자 또는 언어 수단(Java `enum`, Rust 비공개 필드) — 반례: 공개 생성자가 있고 "관습적으로 하나만 쓰면" 두 번째 `new`를 막는 것이 없다.
- [필수] 유일 인스턴스를 **클래스(모듈) 자신이** 보관하고 생성 시점을 통제한다 — 반례: DI 컨테이너가 보관하는 단일 빈. Spring 문서 스스로 자신의 singleton 스코프가 "per-container and per-bean"이라 GoF 싱글톤(ClassLoader당 하나)과 다르다고 명시한다.
- [필수] 잘 알려진 단일 접근점(`Instance`/`getInstance`/모듈 export)이 항상 같은 인스턴스를 준다 — 반례: 호출 시점·인자에 따라 다른 객체를 반환하면 유일성이 없다(인자별 인스턴스는 Multiton·Flyweight 쪽).
- [필수] 동시 진입에서도 두 번째 인스턴스가 생기지 않는다 — 반례: 동기화 없는 `if (instance == null) instance = new ...`(refactoring.guru Cons: 멀티스레드 특별 처리 필요, Wikipedia Double-checked locking). 이 조건은 GoF 원문이 아니라 후대 출처에서 온다.
- 불변식: 정의된 범위(Java는 ClassLoader, Node CommonJS는 해석된 파일 경로, Rust는 프로세스의 `static`) 안에서 접근점이 반환하는 참조는 항상 동일하다. 가이드는 **범위를 명시**해야 한다.
- [선택] 지연 초기화 — 즉시 초기화도 싱글톤이다(원문 예는 지연, refactoring.guru는 지연을 장점으로 듦).
- [선택] 서브클래싱·레지스트리(원문 Implementation 2).
- [선택] 직렬화·리플렉션 방어(Java 특유).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 클래스 인스턴스가 정확히 하나여야 하고 잘 알려진 접근점이 필요하다 / 그 유일 인스턴스를 서브클래싱으로 확장하고 클라이언트 코드 수정 없이 쓰게 하고 싶다(원문 Applicability).
  - 코드 모양: 프로세스 전체가 공유하는 환경 핸들(원문 Known Uses의 InterViews `Session`, JDK `Runtime`). 여러 곳에서 `new Registry()`를 해서 상태가 갈라지는 버그. 전역 변수를 덮어써 앱이 깨지는 문제(refactoring.guru Problem 2).
- 쓰지 말아야 할 때:
  - 테스트에서 교체해야 하는 협력 객체 — 결합이 숨고 단위 테스트가 어려워진다(Wikipedia Criticism, refactoring.guru Cons). 의존성 주입이 대안이다.
  - "하나만 필요"하지만 강제할 필요는 없는 경우 — DI 컨테이너의 단일 스코프로 충분하다(Spring Bean Scopes, 해석).
  - 인자마다 다른 공유 인스턴스가 필요한 경우 — Flyweight 쪽이다.

### 비교 대상
- vs 전역 변수: Singleton은 이름 공간을 전역 변수로 오염시키지 않고 접근을 통제한다(원문 결과 1·2). 오인하기 쉬운 코드 모양: `export let config = {...}`처럼 누구나 재할당할 수 있는 모듈 전역.
- vs 정적 유틸리티 클래스(클래스 연산만 있는 클래스): 인스턴스가 없으므로 서브클래스 다형성이나 인스턴스 수 변경이 어렵다(원문 결과 5). 오인하기 쉬운 코드 모양: `final class Utils { private Utils(){} static ... }` — 생성자는 막혔지만 인스턴스가 **없다**.
- vs Spring singleton 스코프(컨테이너 관리 단일 인스턴스): GoF는 ClassLoader당 하나를 하드코딩, Spring은 컨테이너·빈 정의당 하나(Spring Bean Scopes). 오인하기 쉬운 코드 모양: 기본 스코프 `@Component` 클래스 — 클래스는 `new`로 여러 번 만들 수 있다.
- vs Flyweight: Singleton은 인스턴스 하나, Flyweight는 내재 상태별로 여러 인스턴스를 공유한다. refactoring.guru는 여기에 "Singleton은 가변일 수 있고 Flyweight는 불변"을 덧붙인다(불변 여부는 Flyweight 절 미해결 참고). 오인하기 쉬운 코드 모양: `getInstance(key)`가 키별 캐시 인스턴스를 반환.
- vs 안티패턴 논의: Wikipedia는 "Some consider the singleton to be an anti-pattern"이라고 적고 DI를 회피 수단으로 든다. 가이드의 "쓰지 말아야 할 때"에 근거로 쓸 수 있다.

### 세 언어 구현 쟁점
- Java:
  - `enum` 싱글톤: JLS §8.9 — enum 클래스는 enum 상수 외의 인스턴스가 없고, 명시적 인스턴스화는 컴파일 오류이며, 리플렉션 인스턴스화가 금지되고(`Constructor#newInstance`는 enum 클래스면 `IllegalArgumentException`), 직렬화 메커니즘이 역직렬화로 중복 인스턴스가 생기지 않게 특별 처리한다. Effective Java 3판 Item 3이 enum 방식을 권한다고 알려져 있으나 원문 확인 안 함.
  - Holder 관용구(Initialization-on-demand holder): 중첩 static 클래스의 초기화가 처음 접근할 때 일어나고, JLS §12.4.2의 클래스별 고유 초기화 락이 동시 초기화를 직렬화한다. Wikipedia는 이 관용구가 생성이 실패하지 않을 때만 쓸 수 있고, 실패하면 이후 시도가 `NoClassDefFoundError`를 낸다고 적는다.
  - 이중 검사 잠금(DCL): 원형은 데이터 경합이 있고, J2SE 5.0 이후 `volatile`로 올바른 형태가 가능하다(Wikipedia Double-checked locking).
  - 직렬화 함정: enum이 아닌 싱글톤이 `Serializable`이면 역직렬화가 새 객체를 만들 수 있다. `readResolve`로 스트림에서 읽은 객체 대신 반환할 객체를 지정할 수 있다(Java Object Serialization Specification §3.7).
  - 리플렉션 함정: `AccessibleObject#setAccessible(true)`는 Java 언어 접근 검사를 억제하므로 `private` 생성자를 우회할 수 있다(모듈 경계 조건은 Javadoc 참고).
  - 범위 함정: 유일성은 ClassLoader 단위다(Spring 문서의 GoF 설명 표현).
- TypeScript:
  - `private constructor`(TS 2.0+): 클래스 본문 밖에서 인스턴스화·확장 불가(TS 2.0 Release Notes). 그러나 `private`는 타입 검사 때만 강제되어 컴파일된 JS에서는 `new`가 가능하다(Handbook Classes).
  - JS에는 네이티브 private 생성자가 없고 MDN은 private static 플래그로 흉내 내는 방법을 제시한다(MDN Private properties의 "Simulating private constructors").
  - 모듈 스코프 싱글톤: 모듈은 여러 `<script>`에서 참조되어도 한 번만 실행된다(MDN JavaScript modules). Node ESM은 모듈을 **URL 기준으로** 해석·캐시한다(Node ESM 문서) — 쿼리 문자열이 다르면 다른 모듈 인스턴스가 된다(해석). CommonJS는 **해석된 파일명 기준** 캐시라, `node_modules` 위치가 다르면 같은 `require('foo')`도 다른 객체가 될 수 있고, 대소문자 무시 파일 시스템에서 `./foo`와 `./FOO`는 다른 객체가 된다(Node Modules 문서 "Module caching caveats").
- Rust:
  - 관용구: `static INSTANCE: OnceLock<T>`(1.70.0 안정화) 또는 `static INSTANCE: LazyLock<T>`(1.80.0 안정화, 스레드 안전한 LazyCell, 동시 초기화 시 다른 호출을 블록). 가변 상태가 필요하면 `Mutex`로 감싼다 — `Mutex::new`는 1.63.0부터 `const`라 `static`에 바로 둘 수 있다.
  - 함정: `static mut`를 읽거나 쓰려면 `unsafe`가 필요하고(Rust Reference, Mutable statics), 2024 에디션에서 `static mut` 참조를 만드는 것은 `static_mut_refs` 린트가 기본 deny다. 에디션 가이드는 1회 초기화 용도라면 `OnceLock`/`LazyLock`을 쓰라고 한다.
  - 외부 생성 차단: 비공개 필드를 가진 구조체는 모듈 밖에서 필드를 채워 인스턴스를 만들 수 없다(Rust Book 7.3).
  - 설계 대안: refactoring.guru Rust 예제는 전역 없이 `main`에서 만든 객체를 인자로 넘기는 "Safe Singleton"을 첫 번째로 보인다.

### 실제 사용처
- `java.lang.Runtime#getRuntime()` — `Singleton` = `Runtime`, `Instance` = `getRuntime()`. Javadoc: "Every Java application has a single instance of class Runtime". refactoring.guru도 사례로 든다. — [Runtime (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runtime.html) · Java SE 21
- Rust `std::io::stdout()` — 호출할 때마다 핸들을 새로 반환하지만 각 핸들은 뮤텍스로 동기화된 **하나의 공유 전역 버퍼**를 참조한다. 유일한 것은 핸들이 아니라 버퍼이므로 "전역 유일 자원에 대한 접근점" 변형으로 분류한다(해석). — [stdout](https://doc.rust-lang.org/std/io/fn.stdout.html)
- Node.js CommonJS 모듈 캐시 — 같은 파일로 해석되는 `require('foo')`는 매번 정확히 같은 객체를 반환한다. 모듈 스코프 싱글톤의 런타임 근거이자 범위 제한(해석된 파일명)의 근거다. — [Modules: CommonJS modules | Node.js](https://nodejs.org/api/modules.html) · 조회 시 문서 v26.9.0

### 기존 가이드 승계분
- 최소 조건 취지: 모든 생성자가 외부 인스턴스화를 막아야 하고(공개 생성자면 관습적 단일 객체일 뿐), 클래스 내부 static 필드가 유일 인스턴스를 보유하며 생성·수명을 스스로 책임지고, 공개된 전역 접근점이 항상 같은 인스턴스를 주고, 멀티스레드에서도 두 번째 인스턴스가 생기지 않아야 한다. 정적 유틸리티 클래스는 인스턴스가 없어 싱글톤이 아니고, Spring singleton 스코프는 컨테이너 관리 단일 인스턴스이며, 지연 초기화와 싱글톤은 동의어가 아니라고 본다.
- 참고 자료:
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — Singleton 패턴의 원전.
  - Joshua Bloch, "Effective Java" (3rd Edition), Addison-Wesley, 2017 — Item 3: "Enforce the singleton property with a private constructor or an enum type". `enum` 기반 싱글톤 권고의 출처.
  - Bill Pugh, "The Java Memory Model and the Initialization-on-demand Holder Idiom" — 초기화-시점 보유자 관용구(Holder Idiom)의 정식 설명.
  - Oracle JDK 문서, `java.lang.Runtime` — 표준 라이브러리의 싱글톤 구현 사례. https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Runtime.html
  - Refactoring Guru, "Singleton Pattern" — 다이어그램과 다양한 언어별 구현 비교. https://refactoring.guru/design-patterns/singleton

### 출처
- [Singleton — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat3e.htm) — Intent·Applicability·Participants·Collaborations·Consequences 1~5·Implementation(protected 생성자, 서브클래싱, 레지스트리)·Known Uses·Related Patterns · 조회 2026-09-17
- [Singleton — refactoring.guru](https://refactoring.guru/design-patterns/singleton) — Problem·Solution·Pros and Cons·Relations(Flyweight와의 차이) · 조회 2026-09-17
- [Singleton in Java — refactoring.guru](https://refactoring.guru/design-patterns/singleton/java/example) — `Runtime#getRuntime` 등 사용 예, 반패턴 인식 언급 · 조회 2026-09-17
- [Singleton in Rust — refactoring.guru](https://refactoring.guru/design-patterns/singleton/rust/example) — static mut의 unsafe성, Safe Singleton(인자 전달), Mutex::new const 언급 · 조회 2026-09-17
- [Singleton pattern — Wikipedia](https://en.wikipedia.org/wiki/Singleton_pattern) — Criticism 절(전역 상태, 테스트, DI 대안) · 조회 2026-09-17
- [Initialization-on-demand holder idiom — Wikipedia](https://en.wikipedia.org/wiki/Initialization-on-demand_holder_idiom) — JLS 초기화 의존, 생성 실패 시 NoClassDefFoundError · 조회 2026-09-17
- [Double-checked locking — Wikipedia](https://en.wikipedia.org/wiki/Double-checked_locking) — 원형의 경합, J2SE 5.0 이후 volatile · 조회 2026-09-17
- [JLS SE 21 Chapter 8 (§8.9 Enum Classes)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) — enum 인스턴스 제한, 리플렉션 금지, 직렬화 특별 처리 · 조회 2026-09-17
- [JLS SE 21 Chapter 12 (§12.4.2)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html) — 클래스별 고유 초기화 락 LC · 조회 2026-09-17
- [Constructor (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Constructor.html) — enum 클래스 생성자면 newInstance가 IllegalArgumentException · 조회 2026-09-17
- [AccessibleObject (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/AccessibleObject.html) — setAccessible(true)가 접근 검사 억제 · 조회 2026-09-17
- [Java Object Serialization Specification — Object Input Classes (§3.7)](https://docs.oracle.com/en/java/javase/21/docs/specs/serialization/input.html) — readResolve 정의 · 조회 2026-09-17
- [Runtime (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runtime.html) — 단일 인스턴스 서술 · 조회 2026-09-17
- [Bean Scopes — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html) — GoF 싱글톤과 Spring singleton 스코프 차이 · 조회 2026-09-17
- [TypeScript 2.0 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html) — private·protected 생성자 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — private는 타입 검사 때만 강제, soft/hard private · 조회 2026-09-17
- [MDN — Private properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties) — Simulating private constructors · 조회 2026-09-17
- [MDN — JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) — 모듈은 한 번만 실행 · 조회 2026-09-17
- [Modules: ECMAScript modules | Node.js](https://nodejs.org/api/esm.html) — ES 모듈은 URL로 해석·캐시, require.cache 미사용 · 조회 2026-09-17
- [Modules: CommonJS modules | Node.js](https://nodejs.org/api/modules.html) — 모듈 캐시와 caveats · 조회 2026-09-17
- [OnceLock (Rust std)](https://doc.rust-lang.org/std/sync/struct.OnceLock.html) — 1.70.0, 한 번만 쓰이는 동기화 원시 타입 · 조회 2026-09-17
- [LazyLock (Rust std)](https://doc.rust-lang.org/std/sync/struct.LazyLock.html) — 1.80.0, 첫 접근 시 초기화, 스레드 안전 · 조회 2026-09-17
- [Mutex (Rust std)](https://doc.rust-lang.org/std/sync/struct.Mutex.html) — `new`가 const 1.63.0 · 조회 2026-09-17
- [Rust Reference — Static items](https://doc.rust-lang.org/reference/items/static-items.html) — mutable static 읽기·쓰기에 unsafe 필요 · 조회 2026-09-17
- [Rust Edition Guide — static mut references (2024)](https://doc.rust-lang.org/edition-guide/rust-2024/static-mut-references.html) — static_mut_refs 기본 deny, OnceLock/LazyLock 권장 · 조회 2026-09-17
- [Rust Book 7.3 Paths](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html) — 비공개 필드가 있으면 외부에서 인스턴스 생성 불가 · 조회 2026-09-17
- [stdout (Rust std)](https://doc.rust-lang.org/std/io/fn.stdout.html) — 공유 전역 버퍼 · 조회 2026-09-17

### 미해결 질문
- GoF 원문 생성자는 서브클래싱을 위해 `protected`인데 기존 가이드는 `private`를 필수로 두었다. 서브클래싱 가능한 싱글톤(원문 Implementation 2)을 가이드에서 허용할지 정해야 한다.
- "동시성에서의 유일성"은 GoF 원문 조건이 아니라 후대 출처(refactoring.guru, Wikipedia) 기준이다. [필수]로 두되 출처를 그렇게 표기할지 확인이 필요하다.
- Rust `std::io::stdout()`을 싱글톤 사례로 쓸지(핸들은 여러 개) — 변형 사례로만 쓸지 정해야 한다.
- Effective Java Item 3과 Bill Pugh의 원문 글은 확인하지 않았다(Wikipedia holder 문서가 Pugh 페이지 `cs.umd.edu/~pugh/java/memoryModel/`를 외부 링크로 거는 것만 확인).
- refactoring.guru가 드는 `java.awt.Desktop#getDesktop()`, `System#getSecurityManager()`는 Javadoc을 확인하지 않았다(`SecurityManager`는 최근 JDK에서 폐기 경로에 있어 사례 부적합 가능성, 확인 안 함).

## Adapter (어댑터)

### 원전 대응
- 분류: 구조(Structural) · **클래스와 객체 범위 모두**. GoF Table 1.1은 Adapter를 클래스 범위와 객체 범위 칸에 함께 싣는다(클래스 어댑터 = 상속, 객체 어댑터 = 합성). 원서 시작 쪽 139. 별칭 Wrapper.
- 의도(intent): "Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces." (GoF 원문 Adapter · Intent)
- participants:
  - `Target` (Shape) — Client가 쓰는 도메인 특화 인터페이스를 정의한다.
  - `Client` (DrawingEditor) — Target 인터페이스를 따르는 객체와 협력한다.
  - `Adaptee` (TextView) — 적응이 필요한 기존 인터페이스를 정의한다.
  - `Adapter` (TextShape) — Adaptee의 인터페이스를 Target 인터페이스에 맞춘다.
- collaborations:
  1. 클라이언트가 Adapter 인스턴스의 (Target) 연산을 호출한다. — 왜: 클라이언트는 Target만 알기 때문이다.
  2. Adapter가 그 요청을 수행하는 Adaptee 연산을 호출한다. 이때 이름·인자·반환 형식을 바꾸거나, Adaptee에 없는 연산을 여러 호출로 조립한다. — 왜: 적응 작업량은 "연산 이름 변경"부터 "전혀 다른 연산 집합 지원"까지 Target과 Adaptee가 얼마나 닮았느냐에 달려 있다(원문 Consequences).
- consequences(원문 기준):
  - 클래스 어댑터: 구체 Adapter 클래스에 묶여 Adaptee의 **서브클래스까지** 적응할 수는 없다. Adapter가 Adaptee의 서브클래스이므로 Adaptee 동작 일부를 오버라이드할 수 있다. 객체가 하나라 추가 간접 참조가 없다.
  - 객체 어댑터: 한 Adapter가 Adaptee와 그 모든 서브클래스와 일할 수 있고 모든 Adaptee에 한꺼번에 기능을 더할 수도 있다. 대신 Adaptee 동작을 오버라이드하기 어렵다(Adaptee를 서브클래싱하고 Adapter가 그 서브클래스를 참조해야 함).
  - 기타: 적응 작업량의 스펙트럼, pluggable adapter(적응 기능을 클래스에 내장해 재사용성 향상), **적응된 객체는 더 이상 Adaptee 인터페이스를 따르지 않으므로 모든 클라이언트에 투명하지 않다** → 두 클라이언트가 한 객체를 서로 다르게 봐야 하면 two-way adapter.
- 원문 Implementation 요지: C++ 클래스 어댑터는 Target을 public 상속, Adaptee를 private 상속. pluggable adapter 구현 3방식 — 좁은 Adaptee 인터페이스에 대한 추상 연산, 위임(delegate) 객체, 블록으로 매개변수화한 어댑터.

### 최소 조건 후보
- [필수] Client가 의존하는 `Target` 인터페이스가 있고, 재사용하려는 `Adaptee`의 인터페이스가 그와 **호환되지 않는다** — 반례: 인터페이스가 이미 같으면 감싸는 목적이 변환일 수 없다 → 책임 추가면 Decorator, 접근 통제면 Proxy(GoF Related Patterns: Decorator는 인터페이스를 바꾸지 않고, Proxy는 같은 인터페이스를 제공).
- [필수] `Adapter`가 Target을 구현(또는 상속)해 Client는 Target 타입으로만 Adapter를 쓴다 — 반례: 클라이언트가 `TextShapeAdapter`의 고유 메서드를 직접 부르면 Client가 Target을 따르는 객체와 협력한다는 participant 정의가 깨진다.
- [필수] Adapter는 요청을 **기존 Adaptee의 연산 호출로 수행**하며 인터페이스 차이(이름·인자·반환·연산 집합)를 메운다 — 반례: Adaptee 기능을 Adapter 안에서 다시 구현하면 "기존 클래스를 재사용"한다는 적용 조건(Applicability 1)이 사라진다.
- [필수] Client 코드는 Adaptee 타입에 의존하지 않는다 — 반례: 호출부 곳곳에서 Adaptee 형식으로 직접 변환하면 변환 책임이 Adapter 한 곳에 모이지 않는다.
- [선택] 객체 어댑터(합성) / 클래스 어댑터(상속) — 둘 다 이 패턴이다.
- [선택] two-way adapter, pluggable adapter.
- 불변식: Adapter를 거친 Target 연산의 의미(계약)는 Target이 정의한 대로다 — Adaptee의 의미를 Target 계약에 맞게 옮기는 것이 Adapter의 책임이다(해석).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 기존 클래스를 쓰고 싶은데 인터페이스가 필요한 것과 맞지 않는다 / 관계없거나 예상하지 못한 클래스와 협력하는 재사용 클래스를 만들고 싶다 / (객체 어댑터만) 기존 서브클래스 여러 개를 각각 서브클래싱해 적응시키기가 비실용적이다(원문 Applicability).
  - 코드 모양: 서드파티·레거시 API를 호출하는 **변환 코드가 호출부마다 반복**된다. 콜백 스타일 함수를 `await`로 쓰려고 매번 `new Promise`로 감싼다(`util.promisify`가 대체). 바이트 스트림을 문자 `Reader` 자리에 넣어야 한다(`InputStreamReader`).
- 쓰지 말아야 할 때:
  - 두 쪽 인터페이스를 **처음부터** 설계할 수 있다 — 설계 전에 분리를 계획하는 것은 Bridge다(GoF Discussion of Structural Patterns).
  - 여러 객체의 협력을 단순화한 **새** 인터페이스가 목적이다 — Facade(같은 절).
  - 인터페이스는 같고 기능을 더하려 한다 — Decorator.
  - refactoring.guru Cons: 인터페이스·클래스가 늘어 복잡해지므로, 서비스 클래스를 나머지 코드에 맞게 직접 고치는 편이 더 간단할 때가 있다.

### 비교 대상
- vs Bridge: 둘 다 다른 객체에 대한 간접 수준을 두고 요청을 전달하지만, Adapter는 **이미 있는** 두 인터페이스의 불일치를 설계 **후**에 해소하고, Bridge는 추상과 (여러) 구현을 설계 **전**에 분리해 독립적으로 진화시킨다(GoF Discussion of Structural Patterns · Adapter versus Bridge). 오인하기 쉬운 코드 모양: 인터페이스 필드를 보유하고 위임하는 클래스 — 위임 대상 인터페이스를 **우리가 설계했고 구현이 여럿**이면 Bridge, **외부에서 주어진** 타입을 맞추면 Adapter.
- vs Decorator: Adapter는 인터페이스를 바꾸고 Decorator는 책임만 바꾼다. Decorator는 더 투명해 재귀 합성이 가능하지만 순수 Adapter는 불가능하다(GoF Adapter Related Patterns). 오인하기 쉬운 코드 모양: 생성자가 다른 타입의 인스턴스를 받는 래퍼 — 래퍼가 **감싼 대상과 같은 인터페이스**를 구현하면 Decorator/Proxy, **다른 인터페이스**면 Adapter. (PATTERNS.md 빠른 비교 페어: 인터페이스 변환 vs 행위 추가 vs 접근 제어)
- vs Proxy: Adapter는 대상과 다른 인터페이스를, Proxy는 같은 인터페이스를 제공한다. 단, 보호 프록시는 일부 연산을 거부할 수 있어 인터페이스가 사실상 대상의 부분집합일 수 있다(GoF Proxy Related Patterns). 오인하기 쉬운 코드 모양: 일부 메서드에서 `UnsupportedOperationException`을 던지는 래퍼 — 시그니처가 대상과 같으면 보호 프록시에 가깝다. (PATTERNS.md 빠른 비교 페어)
- vs Facade: Facade를 "여러 객체에 대한 어댑터"로 볼 수도 있지만 Facade는 **새** 인터페이스를 정의하고 Adapter는 **기존** 인터페이스를 재사용한다(GoF Discussion of Structural Patterns). refactoring.guru는 "Adapter usually wraps just one object, while Facade works with an entire subsystem"을 덧붙인다. 오인하기 쉬운 코드 모양: 외부 SDK 여러 클래스를 감싸 우리 도메인 인터페이스를 구현하는 클래스 — 우리 코드가 **이미 정의한** 인터페이스를 구현하면 Adapter, 호출 편의를 위해 **새로 만든** 인터페이스면 Facade.

### 세 언어 구현 쟁점
- Java:
  - 클래스는 직접 상위 클래스를 하나만 가진다(JLS §8.1.4의 `extends` 절). 그래서 GoF의 C++ 클래스 어댑터(Target public 상속 + Adaptee private 상속)를 그대로 옮길 수 없고, Target이 인터페이스일 때만 `class Adapter extends Adaptee implements Target` 형태가 가능하다. 이 형태는 Adaptee의 public 메서드가 Adapter에 그대로 노출된다(해석). 기본은 객체 어댑터.
  - 표준 API 명칭 함정: `InputStreamReader` Javadoc은 스스로를 "a bridge from byte streams to character streams"라고 부르지만 구조는 Adapter다.
  - `Arrays.asList`는 배열을 **복사하지 않는 뷰**다 — 고정 크기이고 배열과 리스트의 변경이 서로에게 보인다(Javadoc). 어댑터가 Adaptee 상태를 공유한다는 점을 가이드에서 짚을 수 있다.
- TypeScript:
  - 구조적 타이핑이라 Adaptee의 모양이 이미 Target과 맞으면 어댑터 없이 그대로 대입된다(Handbook Type Compatibility). 어댑터는 이름·시그니처가 실제로 다를 때만 필요하다.
  - 함정: 같은 이유로 **우연히 모양만 맞고 의미가 다른** 객체도 Target으로 통과한다. `class X implements Target`을 명시해 컴파일러가 누락을 잡게 하는 편이 낫다(해석).
  - 함수 단위 어댑터가 흔하다: Node `util.promisify`는 error-first 콜백 함수를 Promise 반환 함수로 바꾼다.
- Rust:
  - 고아 규칙(orphan rule) 때문에 외부 크레이트의 트레이트를 외부 타입에 직접 구현할 수 없다. 한 필드짜리 튜플 구조체로 감싸는 newtype 패턴이 그 우회로이며, 이것이 Rust에서 가장 흔한 Adapter 형태다(Rust Book 20.2 "Implementing External Traits with the Newtype Pattern").
  - `Read::bytes()`처럼 한 트레이트(`Read`)를 다른 트레이트(`Iterator`)로 바꿔 주는 메서드가 표준 라이브러리의 Adapter다.
  - 명칭 함정: std `iter` 모듈 문서는 `map`·`take`·`filter` 같은 "iterator adapters"를 "a form of the 'adapter pattern'"이라고 부르지만, 이들은 **Iterator를 받아 Iterator를 돌려주므로** GoF 기준(인터페이스 불변 + 기능 추가)으로는 Decorator에 가깝다(미해결 질문 참고).

### 실제 사용처
- `java.io.InputStreamReader` — `Target` = `Reader`, `Adaptee` = `InputStream`, `Adapter` = InputStreamReader(지정 charset으로 바이트를 문자로 디코딩). refactoring.guru도 Adapter 사례로 든다. — [InputStreamReader (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStreamReader.html) · Java SE 21
- `java.util.Arrays#asList(T...)` — `Target` = `List`, `Adaptee` = 배열, `Adapter` = 반환된 고정 크기 리스트(배열에 기반한 뷰). — [Arrays (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html) · Java SE 21
- Spring MVC `HandlerAdapter` — `Client` = `DispatcherServlet`, `Target` = HandlerAdapter 인터페이스, `Adaptee` = 여러 핸들러 타입, `Adapter` = 핸들러 타입마다 구현하는 HandlerAdapter. Javadoc: "Interface that must be implemented for each handler type to handle a request... The DispatcherServlet accesses all installed handlers through this interface, meaning that it does not contain code specific to any handler type." — [HandlerAdapter (Spring Framework 7.0.9 API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerAdapter.html) · 조회 시 7.0.9
- Node.js `util.promisify(original)` — `Target` = Promise를 반환하는 함수 형태, `Adaptee` = error-first 콜백 함수, `Adapter` = 반환된 함수. — [Util | Node.js](https://nodejs.org/api/util.html) · 조회 시 문서 v26.9.0
- Rust `std::io::Read::bytes()` → `Bytes<R>` — `Target` = `Iterator`, `Adaptee` = `Read` 구현체, `Adapter` = `Bytes`. 문서: "Transforms this Read instance to an Iterator over its bytes." — [Read](https://doc.rust-lang.org/std/io/trait.Read.html)

### 기존 가이드 승계분
- 최소 조건 취지: Target과 Adaptee가 별도로 존재하고 시그니처가 일치하지 않으며, Adapter는 Target을 구현하고 클라이언트는 Target 타입으로만 다루고, Adapter 안에서 Adaptee를 호출하며 이름·파라미터·반환 중 최소 하나의 차이를 메우는 변환이 있어야 하고(1:1 그대로 넘기기만 하면 Proxy에 가까움), Client와 Adaptee는 서로를 직접 알지 못한다. Facade(새 인터페이스)·Decorator(같은 인터페이스, 보강)·Proxy(같은 인터페이스, 접근 제어)와 구분하고, 필드만 옮기는 DTO 매퍼는 Target 경유 구조가 없으면 단순 변환 함수로 본다.
- 참고 자료:
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*, Addison-Wesley, 1994 — "Adapter" 항목 (Structural Patterns).
  - Joshua Bloch, *Effective Java* (3rd Edition), Item 18 ("상속보다는 컴포지션을 사용하라") — Object Adapter가 합성을 권장하는 배경.
  - Refactoring.Guru — Adapter Pattern: https://refactoring.guru/design-patterns/adapter
  - Oracle JDK Documentation — `java.io.InputStreamReader`, `java.util.Arrays#asList`.
  - Eric Evans, *Domain-Driven Design*, Addison-Wesley, 2003 — Anti-Corruption Layer 패턴과 어댑터의 관계.
  - Spring Framework Reference — `HandlerAdapter` 인터페이스가 다양한 컨트롤러 타입을 `DispatcherServlet`이 기대하는 단일 시그니처로 어댑팅하는 사례.

### 출처
- [Adapter — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4a.htm) — Intent·별칭·Applicability·Participants·Collaborations·클래스/객체 어댑터 Consequences·two-way adapter·Implementation·Known Uses·Related Patterns · 조회 2026-09-17
- [Introduction(1장) — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — Table 1.1에서 Adapter가 클래스·객체 범위 양쪽에 실림 · 조회 2026-09-17
- [Discussion of Structural Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc4.htm) — Adapter versus Bridge, Facade를 어댑터로 보는 해석의 한계 · 조회 2026-09-17
- [Proxy — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4g.htm) — Related Patterns의 Adapter 대비(보호 프록시 부분집합) · 조회 2026-09-17
- [Adapter — refactoring.guru](https://refactoring.guru/design-patterns/adapter) — Relations, Pros and Cons · 조회 2026-09-17
- [Adapter in Java — refactoring.guru](https://refactoring.guru/design-patterns/adapter/java/example) — JDK 사용 예 목록과 식별 기준 · 조회 2026-09-17
- [JLS SE 21 Chapter 8 (§8.1.4)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) — extends 절이 직접 상위 클래스 타입을 지정 · 조회 2026-09-17
- [InputStreamReader (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStreamReader.html) — "a bridge from byte streams to character streams" · 조회 2026-09-17
- [Arrays (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html) — asList 고정 크기, 배열에 기반, 변경 상호 반영 · 조회 2026-09-17
- [HandlerAdapter (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerAdapter.html) — 핸들러 타입별 구현, DispatcherServlet 확장성, 조회 시 7.0.9 · 조회 2026-09-17
- [Util | Node.js 문서](https://nodejs.org/api/util.html) — util.promisify 설명 · 조회 2026-09-17
- [TypeScript Handbook — Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — 구조적 서브타이핑 · 조회 2026-09-17
- [Rust Book 20.2 Advanced Traits](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html) — 고아 규칙과 newtype 패턴 · 조회 2026-09-17
- [Read (Rust std)](https://doc.rust-lang.org/std/io/trait.Read.html) — bytes() 설명 · 조회 2026-09-17
- [std::iter 모듈 (Rust std)](https://doc.rust-lang.org/std/iter/index.html) — iterator adapters를 adapter pattern의 한 형태로 부름 · 조회 2026-09-17

### 미해결 질문
- Rust std 문서는 iterator adapter를 "adapter pattern"의 한 형태라고 부르지만 GoF 기준으로는 인터페이스가 그대로라 Decorator에 가깝다. Rust 가이드 편에서 이 명칭 충돌을 어떻게 설명할지(“Rust 문서의 adapter ≠ GoF Adapter”로 명시할지) 정해야 한다.
- `InputStreamReader`의 Javadoc 자기 명칭("bridge")과 GoF Bridge의 충돌도 같은 성격이다. 가이드에서 "흔한 오해" 소재로 쓸지 결정이 필요하다.
- refactoring.guru가 드는 `javax.xml.bind.annotation.adapters.XmlAdapter`는 현행 JDK에 포함되는지 확인하지 않았다(JAXB가 JDK에서 분리된 이력이 있다고 알려져 있으나 확인 안 함).
- Spring `HandlerAdapter`의 구체 구현 클래스명은 확인하지 않았다.
- Evans DDD의 Anti-Corruption Layer와 Adapter 관계는 원문 확인 안 함(기존 참고 자료 승계).

## Bridge (브릿지)

### 원전 대응
- 분류: 구조 · 객체 범위. 원서 시작 쪽 151. 별칭 Handle/Body.
- 의도(intent): "Decouple an abstraction from its implementation so that the two can vary independently." (GoF 원문 Bridge · Intent)
- participants:
  - `Abstraction` (Window) — 추상의 인터페이스를 정의한다. `Implementor` 타입 객체에 대한 참조를 유지한다.
  - `RefinedAbstraction` (IconWindow) — Abstraction이 정의한 인터페이스를 확장한다.
  - `Implementor` (WindowImp) — 구현 클래스의 인터페이스를 정의한다. Abstraction의 인터페이스와 정확히 대응할 필요가 없고 상당히 달라도 된다. 보통 Implementor는 원시(primitive) 연산만 제공하고 Abstraction이 그 위에 고수준 연산을 정의한다.
  - `ConcreteImplementor` (XWindowImp, PMWindowImp) — Implementor 인터페이스를 구현하고 구체 구현을 정의한다.
- collaborations: 원문은 한 항목 — Abstraction이 클라이언트 요청을 Implementor 객체에 전달한다. 원문 Implementation을 합친 단계 풀이:
  1. Implementor를 정한다: Abstraction 생성자 매개변수로 고르거나, 기본 구현으로 시작해 사용량에 따라 바꾸거나, 다른 객체(예: Abstract Factory)에 결정을 맡긴다. — 왜: 추상이 구현에 영구히 묶이지 않게.
  2. 클라이언트가 Abstraction/RefinedAbstraction의 고수준 연산을 호출한다.
  3. Abstraction이 그 연산을 Implementor의 원시 연산 호출(들)로 수행한다. — 왜: 추상 쪽 계층과 구현 쪽 계층을 서로 모른 채 각자 서브클래싱으로 늘리기 위해.
- consequences(원문 기준, 이득만 나열):
  - (1) 인터페이스와 구현의 분리 — 구현을 런타임에 구성하고 객체가 구현을 바꿀 수도 있다. 구현 클래스를 바꿔도 Abstraction과 클라이언트를 재컴파일할 필요가 없어 클래스 라이브러리 버전 간 바이너리 호환에 중요하다. 계층화를 촉진한다.
  - (2) 확장성 향상 — Abstraction 계층과 Implementor 계층을 독립적으로 확장한다.
  - (3) 구현 세부(구현자 공유, 참조 카운트)를 클라이언트에게 숨긴다.
  - 대가(원문 밖): refactoring.guru Cons — 응집도가 높은 클래스에 적용하면 코드가 더 복잡해질 수 있다.
- 원문 Implementation 요지: **Implementor가 하나뿐이면 추상 Implementor 클래스가 필요 없다** — 퇴화(degenerate) 형태지만 구현 변경이 클라이언트에 영향을 주지 않게 하는 분리는 여전히 유용하다. 올바른 Implementor 생성(위 단계 1). 구현자 공유(Handle/Body 참조 카운트). C++ 다중 상속으로 Abstraction과 ConcreteImplementor를 결합하면 구현이 정적으로 묶이므로 "진짜 Bridge"는 아니다.

### 최소 조건 후보
- [필수] Abstraction이 Implementor를 **상속이 아닌 참조(합성)**로 보유하고 요청을 전달한다 — 반례: `XIconWindow extends IconWindow`처럼 추상×구현 조합을 상속으로 만들면 원문 Motivation의 클래스 폭증 형태이며, 원문 Implementation도 정적 상속 결합은 진짜 Bridge가 아니라고 한다.
- [필수] Abstraction의 연산은 Implementor **인터페이스**를 통해서만 구현 쪽을 호출한다 — 반례: 연산 안에서 `if (imp instanceof XWindowImp)` 분기를 하면 구현 쪽 확장이 추상 쪽 수정을 부른다. 단 **어떤** ConcreteImplementor를 만들지는 Abstraction 생성자가 결정해도 된다(원문 Implementation "Creating the right Implementor object").
- [필수] 구현 쪽이 추상 쪽과 **독립적으로 교체·확장 가능한 축**으로 분리되어 있다 — 반례: 새 ConcreteImplementor를 추가할 때마다 Abstraction 코드를 고쳐야 하면 결과 2(독립 확장)가 없다.
- [선택] `RefinedAbstraction`의 존재.
- [선택] ConcreteImplementor 2개 이상 — 원문은 1개뿐인 퇴화 형태도 Bridge로 인정한다(미해결 질문 참고).
- [선택] Implementor 인터페이스가 Abstraction과 다른 수준(원시 연산) — 원문은 "보통"이라고만 한다.
- [선택] Implementor 공유·참조 카운트, 런타임 구현 전환, Abstract Factory로 Implementor 생성.

### 사용 단서
- 이런 코드/요구가 보이면:
  - 추상과 구현의 영구 바인딩을 피하고 싶다(런타임에 구현 선택·전환) / 추상과 구현 **둘 다** 서브클래싱으로 확장돼야 한다 / 구현 변경이 클라이언트 재컴파일을 부르면 안 된다 / (C++) 구현을 클라이언트에게 완전히 숨기고 싶다 / 클래스 수가 곱으로 불어난다(Rumbaugh의 "nested generalizations") / 여러 객체가 구현을 공유하는 사실을 숨기고 싶다(원문 Applicability).
  - 코드 모양: `CircleOpenGL`, `CircleVulkan`, `SquareOpenGL`, `SquareVulkan`… 처럼 두 축의 곱집합 클래스 이름. 플랫폼별 코드가 도메인 클래스 계층 곳곳에 섞여 있다.
- 쓰지 말아야 할 때:
  - 이미 존재하는 두 인터페이스를 사후에 맞추는 일 — Adapter(GoF Adapter versus Bridge).
  - 변화 축이 하나뿐이고 교체 대상이 알고리즘 하나 — Strategy로 충분하다(구조가 비슷하다는 refactoring.guru Relations 서술 + 해석).
  - 응집도가 높은 클래스를 억지로 쪼갤 때(refactoring.guru Cons).

### 비교 대상
- vs Adapter: 설계 전 분리(Bridge) vs 설계 후 맞춤(Adapter). Bridge는 안정된 인터페이스를 주면서 구현을 바꾸고 새 구현을 받아들이며, Adapter는 독립적으로 설계된 두 클래스를 다시 구현하지 않고 함께 일하게 한다(GoF Discussion of Structural Patterns, Adapter·Bridge Related Patterns). 오인하기 쉬운 코드 모양: Abstraction과 Implementor 인터페이스가 달라 "변환"처럼 보이는 위임 — 두 인터페이스를 **같은 설계자가 함께** 정의했고 구현이 여럿이면 Bridge.
- vs Strategy: 둘 다 합성·위임 구조라 모양이 비슷하지만 푸는 문제가 다르다(refactoring.guru Relations: "Bridge, State, Strategy (and to some degree Adapter) have very similar structures"). Strategy의 원문 의도는 "알고리즘군을 정의하고 캡슐화해 교체 가능하게"이고 Bridge는 추상 **계층 전체**와 구현 계층을 분리한다. 오인하기 쉬운 코드 모양: 클래스 하나가 인터페이스 필드 하나를 갖고 한 메서드에서만 위임 — RefinedAbstraction도, 원시 연산 위에 쌓인 고수준 연산도 없으면 Strategy에 가깝다(해석).
- 관계(혼동 아님): Abstract Factory가 특정 Bridge를 생성·구성할 수 있다(GoF Bridge Related Patterns). refactoring.guru는 Builder의 Director를 Abstraction, Builder들을 Implementation으로 결합하는 방식을 든다.

### 세 언어 구현 쟁점
- Java:
  - 관용구: `interface Implementor` + `abstract class Abstraction { protected final Implementor imp; Abstraction(Implementor imp) {...} }` 생성자 주입.
  - JDK의 가까운 모양: `HashSet`은 Set을 `HashMap` 인스턴스로 구현한다(Javadoc) — 구현자가 고정된 퇴화 형태이며 GoF Known Uses의 libg++ `HashSet`(Set을 HashTable로 구현하는 퇴화 Bridge)과 같은 모양이다. `Collections.newSetFromMap(Map)`은 "사실상 어떤 Map 구현에도 대응하는 Set 구현"을 제공한다(Javadoc) — 구현자를 교체할 수 있는 쪽이다(둘 다 해석).
- TypeScript:
  - 관용구: 생성자 매개변수 속성(`constructor(protected readonly imp: Renderer) {}`)으로 Implementor 주입(Handbook Classes의 Parameter Properties).
  - 구조적 타이핑이라 ConcreteImplementor가 `implements Renderer`를 쓰지 않아도 모양만 맞으면 주입된다(Handbook Type Compatibility).
- Rust:
  - 정적 브리지: `struct Window<I: WindowImp> { imp: I }` — 컴파일 시 결합되어 원문 결과 1의 "런타임 구성·전환"은 잃지만 동적 디스패치 비용이 없다(Rust Book 18.2 정적/동적 디스패치). std `HashMap<K, V, S>`가 해시 알고리즘(`S: BuildHasher`)을 맵마다 교체할 수 있게 한 것이 이 모양이다(해석).
  - 동적 브리지: `struct Window { imp: Box<dyn WindowImp> }` — 런타임 교체 가능.
  - RefinedAbstraction: 상속이 없으므로 Abstraction을 필드로 품은 구조체나, Abstraction 연산을 기본 구현으로 가진 트레이트로 표현한다(해석).

### 실제 사용처
- `java.util.logging.Handler` × `java.util.logging.Formatter` — `Abstraction` = Handler(직계 하위 `MemoryHandler`·`StreamHandler`), `Implementor` = Formatter(직계 하위 `SimpleFormatter`·`XMLFormatter`), 연결 = `Handler#setFormatter`. Javadoc: "Typically each logging Handler will have a Formatter associated with it." 출력 대상 축과 형식 축이 독립적으로 늘어난다(해석, 패턴명 없음). — [Handler (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Handler.html) · [Formatter (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Formatter.html) · Java SE 21
- `java.util.Collections#newSetFromMap(Map)` — `Abstraction` = 반환된 `Set`, `Implementor` = 전달한 임의의 `Map` 구현(ConcreteImplementor). RefinedAbstraction은 없다(해석). — [Collections (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html) · Java SE 21
- Rust `std::collections::HashMap<K, V, S>` + `std::hash::BuildHasher` — `Abstraction` = HashMap, `Implementor` = BuildHasher("A trait for creating instances of Hasher"), 교체 = `with_hasher`. 컴파일 시 결정되는 정적 변형(해석). — [HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html) · [BuildHasher](https://doc.rust-lang.org/std/hash/trait.BuildHasher.html)

### 기존 가이드 승계분
- 최소 조건 취지: 변경 축이 두 개이고 각각 별도 상속 트리(추상·구현자)로 표현되어야 하며, 추상이 구현자 인터페이스 타입 필드를 보유해 생성 시 주입받고(상속 연결은 아님), 추상의 public 메서드가 구현자 메서드 호출로 위임하며, 양쪽을 서로 수정 없이 확장할 수 있어야 한다. 한쪽을 늘릴 때 반대쪽을 고쳐야 하면 Adapter나 Strategy로 분류하고, 인터페이스 필드 하나만으로는 Bridge가 아니며, 정제된 추상은 1개여도 된다고 본다.
- 참고 자료:
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (1994), Bridge 패턴 장.
  - Refactoring.Guru, "Bridge" — https://refactoring.guru/design-patterns/bridge
  - Wikipedia, "Bridge pattern" — https://en.wikipedia.org/wiki/Bridge_pattern
  - Oracle, "JDBC Overview" — https://docs.oracle.com/javase/tutorial/jdbc/overview/index.html
  - Joshua Bloch, "Effective Java" 3rd ed., Item 18 (상속보다는 컴포지션을 사용하라).

### 출처
- [Bridge — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4b.htm) — Intent·별칭 Handle/Body·Applicability 6개·Participants·Collaborations·Consequences·Implementation(Implementor 1개 퇴화 형태, Implementor 생성, 공유, 다중 상속 한계)·Known Uses(ET++, libg++, NeXT AppKit)·Related Patterns · 조회 2026-09-17
- [Discussion of Structural Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc4.htm) — Adapter versus Bridge · 조회 2026-09-17
- [Strategy — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat5i.htm) — Strategy Intent 문장 · 조회 2026-09-17
- [Bridge — refactoring.guru](https://refactoring.guru/design-patterns/bridge) — Relations(Strategy·State와 유사 구조, AF·Builder 결합), Pros and Cons · 조회 2026-09-17
- [Bridge in Java — refactoring.guru](https://refactoring.guru/design-patterns/bridge/java/example) — JDK 사례 목록이 없고 식별 기준만 있음 · 조회 2026-09-17
- [Bridge pattern — Wikipedia](https://en.wikipedia.org/wiki/Bridge_pattern) — 표준 라이브러리 사례를 싣지 않음(예제 코드만) · 조회 2026-09-17
- [Handler (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Handler.html) — 직계 하위 클래스, setFormatter · 조회 2026-09-17
- [Formatter (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Formatter.html) — 직계 하위 클래스, Handler와의 연관 서술 · 조회 2026-09-17
- [HashSet (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashSet.html) — HashMap 인스턴스 기반 · 조회 2026-09-17
- [Collections (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html) — newSetFromMap 설명 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — Parameter Properties · 조회 2026-09-17
- [Rust Book 18.2 Trait Objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) — 정적/동적 디스패치와 비용 · 조회 2026-09-17
- [HashMap (Rust std)](https://doc.rust-lang.org/std/collections/struct.HashMap.html) — 맵마다 해시 알고리즘 교체(with_hasher) · 조회 2026-09-17
- [BuildHasher (Rust std)](https://doc.rust-lang.org/std/hash/trait.BuildHasher.html) — Hasher 인스턴스 생성 트레이트 · 조회 2026-09-17

### 미해결 질문
- 기존 가이드는 "두 개의 독립된 클래스 계층"을 필수로 두었지만 GoF 원문은 Implementor가 하나뿐인 퇴화 형태(추상 Implementor 없음)도 Bridge로 본다. 분석기 기준에서 퇴화 형태를 "Bridge(퇴화)"로 인정할지 정해야 한다.
- 표준 라이브러리 실례 3건은 모두 문서가 패턴명을 쓰지 않는 해석 사례다. 공식 문서가 Bridge라고 명시하는 실례는 찾지 못했다.
- 기존 가이드 참고 자료의 JDBC를 Bridge 사례로 볼지 — Oracle JDBC Overview 페이지 내용은 확인하지 않았고, JDBC `DriverManager`/`Driver` 구조를 Bridge로 명시한 공식 출처도 찾지 못했다.
- SLF4J(자칭 facade)를 Bridge 사례로 볼 여지가 있는지는 Facade 절 미해결 질문과 함께 정해야 한다.

## Composite (컴포지트)

### 원전 대응
- 분류: 구조 · 객체 범위. 원서 시작 쪽 163.
- 의도(intent): "Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly." (GoF 원문 Composite · Intent)
- participants:
  - `Component` (Graphic) — 합성에 참여하는 객체의 인터페이스를 선언한다. 모든 클래스에 공통인 기본 동작을 적절히 구현한다. 자식 컴포넌트에 접근·관리하는 인터페이스를 선언한다. (선택) 재귀 구조에서 부모에 접근하는 인터페이스를 정의하고 적절하면 구현한다.
  - `Leaf` (Rectangle, Line, Text 등) — 합성의 잎 객체. 자식이 없다. 원시 객체의 동작을 정의한다.
  - `Composite` (Picture) — 자식을 가진 컴포넌트의 동작을 정의한다. 자식 컴포넌트를 저장한다. Component 인터페이스의 자식 관련 연산을 구현한다.
  - `Client` — Component 인터페이스로 합성 객체를 조작한다.
- collaborations:
  1. 클라이언트는 Component 인터페이스로 합성 구조의 객체와 상호작용한다. — 왜: 개별 객체와 합성을 구별하지 않기 위해.
  2. 수신자가 Leaf면 요청을 직접 처리한다.
  3. 수신자가 Composite면 **보통** 요청을 자식 컴포넌트들에 전달하며, 전달 전후에 추가 연산을 할 수 있다. — 왜: 부분의 결과로 전체의 결과를 만들기 위해(재귀).
- consequences(원문 기준):
  - 얻는 것: 원시 객체와 복합 객체로 된 클래스 계층을 정의한다(원시 객체를 기대하는 곳에 복합 객체도 들어감). 클라이언트를 단순하게 한다(잎인지 복합인지 몰라도 되어 태그·case 문이 필요 없음). 새 종류의 컴포넌트 추가가 쉽다.
  - 대가: 설계가 지나치게 일반적이 될 수 있다 — 복합체가 특정 컴포넌트만 갖게 제한하기 어렵고, 타입 시스템 대신 런타임 검사가 필요하다.
- 원문 Implementation 요지: 명시적 부모 참조, 컴포넌트 공유(부모가 하나라는 제약 → Flyweight), Component 인터페이스 최대화, **자식 관리 연산 선언 위치 — 투명성 vs 안전성**(Component에 선언하면 모든 컴포넌트를 균일하게 다루는 투명성을 얻고 잎에 자식을 추가하는 무의미한 호출의 안전성을 잃음, Composite에만 선언하면 정적 타입 언어에서 컴파일 시 잡히는 안전성을 얻고 투명성을 잃음. 원문 패턴 서술은 투명성을 강조), Component에 자식 리스트를 두지 말 것(모든 잎에 공간 낭비), 자식 순서, 탐색 결과 캐싱, 삭제 책임(GC 없는 언어), 자식 저장 자료구조.

### 최소 조건 후보
- [필수] `Leaf`와 `Composite`가 공통 `Component` 타입을 따른다 — 반례: 폴더와 파일이 공통 타입 없이 따로 있어 클라이언트가 `if (x instanceof Folder)`로 분기하면 결과 "태그·case 문 제거"가 없다.
- [필수] `Composite`는 **Component 타입**의 자식을 0개 이상 보유해 임의 깊이로 중첩된다 — 반례: `Folder`가 `List<File>`만 가지면 폴더 안에 폴더를 넣을 수 없어 부분-전체 **계층**이 아니다.
- [필수] Composite의 연산이 (보통) 자식에게 전달되어 부분의 결과로 전체의 결과를 만든다 — 반례: Composite가 자식을 보관만 하고 연산에서 쓰지 않으면 단순 컨테이너다. 원문은 "usually forwards"라고 쓴다.
- [필수] 클라이언트는 Component 인터페이스로 개별 객체와 합성을 **균일하게** 다룬다 — 반례: 클라이언트 연산마다 잎/가지 판별이 필요하면 의도(uniformly)가 성립하지 않는다.
- 불변식: 구조는 트리다 — 한 노드가 자기 조상의 자식이 되는 순환이 없다. 부모 참조를 두는 설계에서는 한 컴포넌트의 부모가 하나다(원문 Implementation 2의 전제). DOM은 순환 삽입에 `HierarchyRequestError`를 던지고, 이미 문서에 있는 노드를 `appendChild`하면 원래 위치에서 **이동**시켜 한 노드가 두 곳에 동시에 있지 못하게 한다(MDN appendChild).
- [선택] 자식 관리 연산(`add`/`remove`/`getChild`)을 Component에 둘지(투명성) Composite에만 둘지(안전성) — 어느 쪽도 패턴이다.
- [선택] 부모 참조, 자식 순서, 결과 캐싱.

### 사용 단서
- 이런 코드/요구가 보이면:
  - 객체의 부분-전체 계층을 표현하고 싶다 / 클라이언트가 합성과 개별 객체의 차이를 무시하고 균일하게 다루게 하고 싶다(원문 Applicability).
  - 코드 모양: 파일·폴더, 도형·그룹, UI 컨테이너·위젯, 조직·부서, 수식 트리에서 합계·렌더링·검색을 재귀로 구현하면서 **잎과 가지를 구분하는 분기가 반복**된다(Wikipedia Composite: "programmers often have to discriminate between a leaf-node and a branch").
  - 원문 Known Uses: 거의 모든 UI 툴킷의 View 계층, 컴파일러 파스 트리, 금융 포트폴리오(자산의 집합이 자산 인터페이스를 따름), Command의 MacroCommand.
- 쓰지 말아야 할 때:
  - 복합체에 들어갈 수 있는 구성 요소를 **타입으로** 제한해야 한다 — 원문 liability(런타임 검사로 대체해야 함).
  - 잎과 복합의 기능이 너무 달라 공통 인터페이스가 억지로 일반화된다(refactoring.guru Cons).

### 비교 대상
- vs Decorator: 둘 다 재귀 합성이라 구조 다이어그램이 비슷하지만, Decorator는 서브클래싱 없이 **책임을 덧붙이는** 것(장식)이 목적이고 Composite는 많은 객체를 하나처럼 **표현**하는 것이 목적이다. 함께 쓰면 Decorator 관점에서 Composite는 ConcreteComponent, Composite 관점에서 Decorator는 Leaf다(GoF Discussion of Structural Patterns · Composite versus Decorator versus Proxy). Decorator를 "자식이 하나인 퇴화 Composite"로 볼 수 있으나 목적은 객체 집계가 아니다(GoF Decorator Related Patterns). 오인하기 쉬운 코드 모양: 같은 인터페이스를 구현하고 같은 타입 필드를 가진 래퍼 — 필드가 **컬렉션**이고 결과를 **모으면** Composite, **하나**를 감싸 **덧붙이면** Decorator.
- vs Visitor: 연산을 노드 클래스(Composite·Leaf)에 흩어 둘 것인가, Visitor로 한곳에 모을 것인가(GoF Composite Related Patterns: "Visitor localizes operations and behavior that would otherwise be distributed across Composite and Leaf classes"). 오인하기 쉬운 코드 모양: 노드마다 `accept(visitor)`만 있고 실제 연산은 방문자에 있는 트리 — 구조는 Composite, 연산 배치는 Visitor.
- vs Iterator(관계): Iterator로 Composite를 순회할 수 있다(GoF Related Patterns). 순회 책임을 트리 밖으로 뺄 때 쓴다.
- vs 단순 트리 자료구조: 노드 타입이 하나이고 다형적 연산 전달이 없는 트리(예: 이진 탐색 트리)는 Composite로 보지 않는다는 것이 기존 가이드 주장이다 — 외부 출처로는 확인하지 못했다(미해결 질문).

### 세 언어 구현 쟁점
- Java:
  - 관용구: `interface Component { void operation(); }`, `class Composite implements Component { private final List<Component> children; }`.
  - 투명성 vs 안전성: AWT는 `Container extends Component`로 자식 보유 능력을 Container 쪽에 둔다(Javadoc: 컨테이너는 다른 AWT 컴포넌트를 담을 수 있는 컴포넌트). 투명성을 택하면 Leaf의 자식 관리 연산이 런타임 예외를 던지게 된다(원문 trade-off의 Java 대응, 해석).
- TypeScript:
  - 클래스 계층 방식(열린 확장)과 판별 유니온(discriminated union) 방식(닫힌 집합) 중 선택. 판별 유니온은 공통 리터럴 속성으로 좁히기(narrowing)를 하므로(Handbook Narrowing) 연산마다 `switch`가 생긴다 — 원문이 없애려던 태그·case 문이 돌아오는 대신 컴파일러가 누락을 잡는 절충이다(해석).
  - DOM `Node` 계층은 투명성 쪽 설계다: 자식을 가질 수 없는 노드 타입에 자식을 추가하면 예외가 난다(MDN Node).
- Rust:
  - 재귀 타입은 컴파일 시 크기를 알 수 없으므로 `Box` 같은 간접 참조가 필요하다(Rust Book 15.1). 트리 노드는 `enum Node { Leaf(..), Group(Vec<Node>) }`(닫힌 집합, `match`) 또는 `Vec<Box<dyn Component>>`(열린 집합, 트레이트 객체).
  - 부모 참조가 필요하면 자식은 `Rc`로 소유하고 부모는 `Weak`로 가리켜 참조 순환을 피한다 — Rust Book 15.6의 트리 예제가 `parent: RefCell<Weak<Node>>`를 쓴다.
  - 자식 관리 메서드를 트레이트에 넣으면(투명성) Leaf 구현이 무의미한 기본 구현이나 에러를 반환해야 한다(해석).

### 실제 사용처
- `java.awt.Container` — `Component` = `java.awt.Component`, `Composite` = Container("a component that can contain other AWT components"), `Leaf` = 자식을 담지 않는 AWT 컴포넌트들. refactoring.guru도 `Container#add(Component)`를 사례로 든다. — [Container (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/awt/Container.html) · Java SE 21
- DOM `Node` / `Element` / `Text` — `Component` = `Node`(추상 기반, 평범한 Node 객체는 없음), `Composite` = `Element`·`Document`·`DocumentFragment`, `Leaf` = `Text` 등. `appendChild`는 부모가 Document·DocumentFragment·Element가 아니면 `HierarchyRequestError`를 던진다(투명성 설계). — [MDN Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) · [MDN Node.appendChild()](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild)

### 기존 가이드 승계분
- 최소 조건 취지: Leaf와 Composite가 같은 추상 타입을 구현해 같은 핵심 연산을 지원하고, Composite는 Component를 0개 이상 자식으로 보유해 임의 깊이로 중첩되며, `Composite.operation()`이 자식들의 연산을 호출해 결과를 모으고(위임 없으면 컬렉션일 뿐), 클라이언트는 Leaf/Composite를 구별하지 않는다(`instanceof` 필수면 미충족). 트리 자료구조 = 컴포지트가 아니고, Decorator는 자식 1개·책임 추가, Leaf에 `add`를 두고 예외를 던지는 투명성은 타입 안전성을 잃는 절충임을 의식해야 한다고 본다.
- 참고 자료:
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — "Composite" 항목.
  - Refactoring Guru, "Composite": https://refactoring.guru/design-patterns/composite
  - Java Platform SE API, `java.awt.Container`: https://docs.oracle.com/javase/8/docs/api/java/awt/Container.html
  - Java Platform SE API, `javax.swing.JComponent`: https://docs.oracle.com/javase/8/docs/api/javax/swing/JComponent.html
  - Joshua Bloch, "Effective Java" (3rd ed.) — 상속 vs 합성 관련 항목(컴포지트의 자식 보유는 합성 기반).

### 출처
- [Composite — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4c.htm) — Intent·Applicability·Participants·Collaborations·Consequences·Implementation(투명성 vs 안전성 등 9항목)·Known Uses·Related Patterns · 조회 2026-09-17
- [Discussion of Structural Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc4.htm) — Composite versus Decorator · 조회 2026-09-17
- [Decorator — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4d.htm) — Related Patterns의 "degenerate composite" 서술 · 조회 2026-09-17
- [Composite — refactoring.guru](https://refactoring.guru/design-patterns/composite) — Relations, Pros and Cons · 조회 2026-09-17
- [Composite in Java — refactoring.guru](https://refactoring.guru/design-patterns/composite/java/example) — `Container#add`, JSF `UIComponent#getChildren` 사례와 식별 기준 · 조회 2026-09-17
- [Composite pattern — Wikipedia](https://en.wikipedia.org/wiki/Composite_pattern) — 잎/가지 구분 문제 서술 · 조회 2026-09-17
- [Container (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/awt/Container.html) — 컨테이너 정의 · 조회 2026-09-17
- [MDN — Node](https://developer.mozilla.org/en-US/docs/Web/API/Node) — 추상 기반 클래스, 자식 불가 노드에 자식 추가 시 예외 · 조회 2026-09-17
- [MDN — Node.appendChild()](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild) — HierarchyRequestError 조건(부모 타입, 순환), 기존 노드 이동 · 조회 2026-09-17
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — Discriminated unions · 조회 2026-09-17
- [Rust Book 15.1 Box](https://doc.rust-lang.org/book/ch15-01-box.html) — 재귀 타입과 Box · 조회 2026-09-17
- [Rust Book 15.6 Reference Cycles](https://doc.rust-lang.org/book/ch15-06-reference-cycles.html) — 부모를 Weak로 가리키는 트리 예제 · 조회 2026-09-17

### 미해결 질문
- "노드 타입이 하나인 단순 트리 자료구조는 Composite가 아니다"라는 기존 가이드 주장의 외부 출처를 찾지 못했다. GoF 의도(개별·합성의 균일한 취급)에서 끌어낸 해석으로 표기할지 정해야 한다.
- DOM 노드의 `Text` 등 잎 타입 목록과 `Element`의 Composite 대응은 MDN Node 요약 수준에서만 확인했다(하위 인터페이스별 자식 허용 규칙 전체는 대조 안 함).
- `javax.swing.JComponent`(기존 참고 자료)와 JSF `UIComponent`(refactoring.guru)는 Javadoc을 확인하지 않았다.

## Decorator (데코레이터)

### 원전 대응
- 분류: 구조 · 객체 범위. 원서 시작 쪽 175. 별칭 Wrapper.
- 의도(intent): "Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality." (GoF 원문 Decorator · Intent)
- participants:
  - `Component` (VisualComponent) — 책임을 동적으로 덧붙일 수 있는 객체의 인터페이스를 정의한다.
  - `ConcreteComponent` (TextView) — 추가 책임이 붙을 수 있는 객체를 정의한다.
  - `Decorator` — Component 객체에 대한 참조를 유지하고, Component의 인터페이스를 따르는(conform) 인터페이스를 정의한다.
  - `ConcreteDecorator` (BorderDecorator, ScrollDecorator) — 컴포넌트에 책임을 추가한다.
- collaborations:
  1. 클라이언트가 (장식 여부를 모른 채) Component 인터페이스로 요청한다.
  2. Decorator가 요청을 자신이 참조하는 Component 객체에 전달한다.
  3. 전달 **전후에** 추가 연산을 선택적으로 수행한다. — 왜: 감싼 객체의 인터페이스를 그대로 둔 채 책임만 덧붙이기 위해.
  4. 참조 대상이 또 다른 Decorator면 같은 과정이 재귀적으로 반복된다. — 왜: 객체의 전체 기능을 컴파일 시점에 정할 수 없는 상황을 다루므로 재귀 합성이 Decorator의 본질이다(GoF Discussion of Structural Patterns).
- consequences(원문 기준, 이득 2·대가 2):
  - 얻는 것: (1) 정적 (다중) 상속보다 유연하다 — 런타임에 책임을 붙였다 떼고, 조합을 섞고, 같은 속성을 두 번 붙일 수 있다(이중 테두리). (2) 계층 위쪽의 기능 과다 클래스를 피한다 — 쓰는 만큼만 비용을 내는(pay-as-you-go) 방식으로 작은 조각을 조합한다.
  - 대가: (3) 데코레이터와 컴포넌트는 동일 객체가 아니다 — 투명한 외피지만 객체 동일성(identity)에 의존하면 안 된다. (4) 비슷해 보이는 작은 객체가 많아진다 — 연결 방식만 다른 객체들이라 이해하는 사람에겐 쉽게 맞춤화되지만 배우기·디버깅이 어렵다.
- 원문 Implementation 요지: 인터페이스 일치(ConcreteDecorator들은 공통 클래스를 상속, 적어도 C++), 책임이 하나면 추상 Decorator 클래스 생략 가능, Component 클래스를 가볍게(데이터 저장보다 인터페이스 정의에 집중 — 무거우면 데코레이터마다 부담), 겉(skin)을 바꾸는 Decorator vs 속(guts)을 바꾸는 Strategy.

### 최소 조건 후보
- [필수] Decorator가 Component 인터페이스를 **따른다**(클라이언트가 장식된 객체를 원래 타입으로 쓴다) — 반례: 감싼 결과가 다른 인터페이스를 노출하면 Adapter다(GoF Related Patterns: "a decorator only changes an object's responsibilities, not its interface").
- [필수] Decorator가 **추상 Component 타입** 참조를 보유하고 요청을 그 객체에 전달한다 — 반례: `BorderedTextView extends TextView`처럼 구체 클래스를 상속해 기능을 추가하면 정적 상속이며, 조합마다 클래스가 필요해진다(결과 1의 반대).
- [필수] 참조 대상이 추상 타입이라 데코레이터 위에 데코레이터를 **겹칠 수 있다** — 반례: 필드 타입이 `TextView`(구체)라 다른 데코레이터를 넣을 수 없으면 재귀 합성이라는 본질이 빠진다.
- [필수] 추가 책임은 전달과 **함께** 수행되며 전달 흐름을 끊지 않는다 — 반례: 조건에 따라 요청을 다음으로 넘기지 않고 멈추면 Chain of Responsibility 쪽이다(refactoring.guru Relations: "decorators aren't allowed to break the flow of the request"). 이 조건의 근거는 GoF가 아니라 refactoring.guru다.
- 불변식: 장식된 객체의 동일성에 의존하지 않는다 — `decorated == original`은 거짓이다(원문 결과 3).
- [선택] 추상 Decorator 클래스 — 책임이 하나면 생략 가능(원문 Implementation 2).
- [선택] ConcreteDecorator가 추가 연산·상태를 노출 — refactoring.guru는 Decorator로 접근하는 인터페이스가 "the same or gets extended"라고 쓰지만 기존 가이드는 인터페이스 변경 금지를 조건으로 두었다(미해결 질문).
- [선택] 데코레이터를 런타임에 붙였다 떼는 API.

### 사용 단서
- 이런 코드/요구가 보이면:
  - 다른 객체에 영향 없이 **개별 객체**에 동적·투명하게 책임을 더하고 싶다 / 나중에 뗄 수 있는 책임이다 / 서브클래싱이 비실용적이다 — 독립 확장의 조합이 폭발하거나 클래스 정의가 숨겨져 서브클래싱할 수 없다(원문 Applicability).
  - 코드 모양: `BufferedEncryptedCompressedFileStream` 같은 조합형 클래스 이름. 로깅·재시도·캐싱·메트릭을 같은 인터페이스 위에 겹겹이 쌓는다. 원문 Known Uses의 스트림(압축·7비트 ASCII 변환을 FileStream 위에 차례로 장식).
- 쓰지 말아야 할 때:
  - 코드가 객체 동일성(참조 비교, 식별자 기반 맵)에 의존한다(원문 결과 3).
  - 겉이 아니라 **속(알고리즘)**을 바꿔야 한다 — Strategy(원문 Implementation 4).
  - Component 인터페이스가 무거워 데코레이터마다 전달 메서드가 많다(원문 Implementation 3).
  - refactoring.guru Cons: 스택 중간의 특정 래퍼를 떼기 어렵고, 순서에 의존하지 않게 구현하기 어렵고, 초기 구성 코드가 지저분해질 수 있다.

### 비교 대상
- vs Adapter: 책임만 바꾸고 인터페이스는 유지(Decorator) vs 인터페이스를 새로 줌(Adapter). Decorator는 더 투명해 재귀 합성이 가능하다(GoF Adapter·Decorator Related Patterns). 오인하기 쉬운 코드 모양: 감싼 뒤 메서드 이름을 바꿔 노출하는 "LoggingWrapper" — 이름이 바뀌면 Adapter다. (PATTERNS.md 빠른 비교 페어)
- vs Proxy: 구현은 비슷하지만 목적이 다르다. Decorator는 책임을 **더하고**, Proxy는 접근을 **통제한다**. Proxy는 속성을 동적으로 붙이고 떼는 데 관심이 없고 재귀 합성을 위해 설계되지 않았다. Proxy에서는 대상(subject)이 핵심 기능을 정의하고 프록시가 접근을 제공·거부하지만, Decorator에서는 컴포넌트가 기능 일부만 제공하고 나머지를 데코레이터들이 채운다(GoF Discussion of Structural Patterns, Proxy Related Patterns). refactoring.guru는 "Proxy usually manages the life cycle of its service object on its own, whereas the composition of Decorators is always controlled by the client"를 덧붙인다. 오인하기 쉬운 코드 모양: `new CachingService(new RealService())` — 클라이언트가 조합을 고르고 여러 겹 쌓을 수 있으면 Decorator, 대상 생성·수명을 래퍼가 감추고 한 겹이면 Proxy. (PATTERNS.md 빠른 비교 페어)
- vs Composite: 자식 하나짜리 퇴화 Composite로 볼 수 있지만 목적은 집계가 아니라 책임 추가다(GoF Decorator Related Patterns, Discussion of Structural Patterns). 오인하기 쉬운 코드 모양: 컬렉션이 아니라 단일 필드를 가진 같은 인터페이스 구현.
- vs Strategy: Decorator는 객체의 겉(skin)을, Strategy는 속(guts)을 바꾼다(GoF Related Patterns). 오인하기 쉬운 코드 모양: 컴포넌트가 내부에 교체 가능한 알고리즘 객체를 들고 있으면 Strategy다.
- vs Chain of Responsibility: 구조는 비슷하지만 CoR 핸들러는 서로 독립적인 임의 연산을 하고 어느 지점에서든 전달을 멈출 수 있다(refactoring.guru Relations).
- vs 언어 기능 decorator(TypeScript `@` 문법 등, 이름만 같음): TypeScript 5.0 릴리스 노트는 decorator를 "클래스와 그 멤버를 재사용 가능한 방식으로 맞춤화하는" ECMAScript 기능으로 설명한다. 클래스 **정의**에 붙는 문법이지 런타임에 **객체**를 감싸 겹치는 GoF Decorator와 다르다(해석). TS에는 5.0부터의 Stage 3 decorators와 이전 `experimentalDecorators`(Stage 2 구현)가 공존한다(TS Handbook Decorators).

### 세 언어 구현 쟁점
- Java:
  - 관용구: `java.io`의 필터 스트림 — `FilterInputStream`은 다른 입력 스트림을 감싸(`in` 필드) 모든 요청을 넘기는 버전으로 메서드를 오버라이드하고, 하위 클래스가 필요한 메서드를 재정의·추가한다(Javadoc). `BufferedInputStream`은 다른 입력 스트림에 버퍼링과 `mark`/`reset` 기능을 **더한다**(Javadoc).
  - 함정: 인터페이스가 크면 전달 메서드를 빠뜨리기 쉽다(원문 Implementation 3의 "가벼운 Component"). `equals`/`hashCode`가 동일성 기반이면 장식 전후 비교가 깨진다(원문 결과 3의 Java 대응, 해석).
- TypeScript:
  - 관용구: `class LoggingService implements Service { constructor(private readonly inner: Service) {} ... }`. 구조적 타이핑이라 `implements`가 없어도 모양만 맞으면 Component 자리에 들어간다(Handbook Type Compatibility). 함수 단위로는 고차 함수로 감싸는 형태가 흔하다(해석).
  - 함정: `@decorator` 문법과 이름 충돌(위 비교). `experimentalDecorators` 설정 여부에 따라 의미가 다르다.
- Rust:
  - 정적 데코레이터: `BufReader<R: Read>`처럼 제네릭 래퍼가 같은 트레이트(`Read`)를 구현 — 겹치면 타입이 `BufReader<Take<File>>`처럼 중첩되고 동적 디스패치 비용이 없다(해석, Rust Book 18.2). iterator adapter(`Map`, `Filter` 등)도 이 모양이다.
  - 동적 데코레이터: `Box<dyn Read>`를 감싸 런타임에 조합.
  - 함정: 전달을 줄이려고 `Deref`로 내부 객체 메서드를 자동 노출하는 것은 상속 흉내이며 비공식 Rust Patterns 책이 "Deref polymorphism" 안티패턴으로 분류한다. Rust API Guidelines C-DEREF도 `Deref`는 스마트 포인터만 구현하라고 한다. 필요한 메서드는 명시적으로 위임한다.

### 실제 사용처
- `java.io.FilterInputStream` / `java.io.BufferedInputStream` — `Component` = `InputStream`, `ConcreteComponent` = `FileInputStream`·`ByteArrayInputStream` 등(InputStream 직계 하위), `Decorator` = FilterInputStream(감싼 스트림에 요청 전달), `ConcreteDecorator` = BufferedInputStream·DataInputStream·PushbackInputStream 등(FilterInputStream 직계 하위). refactoring.guru도 I/O 스트림을 대표 사례로 든다. — [FilterInputStream (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FilterInputStream.html) · [BufferedInputStream (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedInputStream.html) · Java 1.0+
- Rust `std::io::BufReader<R>` — `Component` = `Read` 트레이트, `ConcreteDecorator` = BufReader("adds buffering to any reader"). refactoring.guru Rust Decorator 예제가 이 타입을 쓴다. — [BufReader](https://doc.rust-lang.org/std/io/struct.BufReader.html)
- `java.util.Collections#synchronizedList(List)` — `Component` = `List`, `ConcreteDecorator` = 반환된 동기화 리스트("a synchronized (thread-safe) list backed by the specified list"). refactoring.guru는 `synchronizedXXX`·`unmodifiableXXX`·`checkedXXX`를 Decorator 사례로 든다. 접근 통제로 보면 보호 프록시로도 읽힌다(미해결 질문). — [Collections (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html) · Java SE 21

### 기존 가이드 승계분
- 최소 조건 취지: 원본과 데코레이터가 같은 추상 타입을 구현해 클라이언트가 그 타입에만 의존하고, 데코레이터는 같은 Component 타입 인스턴스를 필드로 보유해 추가 행위 후 위임하며(상속이 아닌 합성), 데코레이터를 다시 데코레이터로 감쌀 수 있고, 원본 인터페이스를 바꾸지 않는다. 공통 인터페이스가 깨지면 단순 합성, 인터페이스가 바뀌면 Adapter에 가깝다고 본다. Proxy는 목적이 대리(접근 제어·지연·원격·캐싱)이고 보통 1단, Python `@decorator`는 고차 함수 문법이라 별개, 상속만 쓰면 데코레이터가 아니라고 본다.
- 참고 자료:
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (Addison-Wesley, 1994) — Decorator 패턴의 원전.
  - Eric Freeman, Elisabeth Robson, "Head First Design Patterns" (O'Reilly) — 본 가이드의 예시 1(`Beverage`/`Espresso`/`Mocha`)이 대중화된 출처.
  - Oracle, "Java Platform SE API Documentation — `java.io.FilterInputStream`, `java.io.BufferedReader`, `java.io.DataInputStream`": https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/io/package-summary.html
  - Refactoring.Guru, "Decorator": https://refactoring.guru/design-patterns/decorator
  - Joshua Bloch, "Effective Java" 3판, Item 18 "Favor composition over inheritance" — 데코레이터가 왜 상속의 대안이 되는지에 대한 일반 원칙.

### 출처
- [Decorator — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4d.htm) — Intent·별칭·Applicability·Participants·Collaborations·Consequences(이득 2, 대가 2)·Implementation·Known Uses(스트림)·Related Patterns · 조회 2026-09-17
- [Discussion of Structural Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc4.htm) — Composite versus Decorator versus Proxy · 조회 2026-09-17
- [Proxy — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4g.htm) — Related Patterns의 Decorator 대비 · 조회 2026-09-17
- [Decorator — refactoring.guru](https://refactoring.guru/design-patterns/decorator) — Relations(Adapter·Proxy·CoR·Composite·Strategy), Pros and Cons · 조회 2026-09-17
- [Decorator in Java — refactoring.guru](https://refactoring.guru/design-patterns/decorator/java/example) — JDK 사용 예 목록과 식별 기준 · 조회 2026-09-17
- [Decorator in Rust — refactoring.guru](https://refactoring.guru/design-patterns/decorator/rust/example) — BufReader로 벡터 리더를 장식하는 예 · 조회 2026-09-17
- [InputStream (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html) — 직계 하위 클래스(FileInputStream·ByteArrayInputStream·FilterInputStream 등) · 조회 2026-09-17
- [FilterInputStream (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FilterInputStream.html) — 감싼 스트림에 요청 전달, 직계 하위 클래스, `in` 필드, Since 1.0 · 조회 2026-09-17
- [BufferedInputStream (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/BufferedInputStream.html) — "adds functionality to another input stream" · 조회 2026-09-17
- [Collections (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html) — synchronizedList·unmodifiableList 설명 · 조회 2026-09-17
- [BufReader (Rust std)](https://doc.rust-lang.org/std/io/struct.BufReader.html) — "adds buffering to any reader" · 조회 2026-09-17
- [TypeScript 5.0 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html) — Decorators 설명 · 조회 2026-09-17
- [TypeScript Handbook — Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) — experimentalDecorators(Stage 2)와 5.0 Stage 3 지원 안내 · 조회 2026-09-17
- [TypeScript Handbook — Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — 구조적 서브타이핑 · 조회 2026-09-17
- [Rust API Guidelines — Predictability (C-DEREF)](https://rust-lang.github.io/api-guidelines/predictability.html) — Deref는 스마트 포인터만 · 조회 2026-09-17
- [rust-unofficial Patterns — Deref polymorphism](https://rust-unofficial.github.io/patterns/anti_patterns/deref.html) — Deref로 상속 흉내는 안티패턴(보조 출처) · 조회 2026-09-17
- [Rust Book 18.2 Trait Objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) — 정적/동적 디스패치 · 조회 2026-09-17

### 미해결 질문
- ConcreteDecorator가 Component에 없는 **추가 공개 메서드**를 가져도 되는가 — GoF 관련 패턴 절은 "인터페이스를 바꾸지 않는다", refactoring.guru는 "the same or gets extended", 기존 가이드는 변경 금지다. GoF 구조 다이어그램(이미지)의 `AddedBehavior` 표기는 이미지라 이번에 확인하지 못했다. 분석기 기준을 "기존 인터페이스 보존은 필수, 추가 메서드는 허용"으로 둘지 정해야 한다.
- `Collections.unmodifiableList`·`synchronizedList`를 Decorator(refactoring.guru)로 볼지 보호 프록시로 볼지 — GoF는 보호 프록시가 데코레이터와 똑같이 구현될 수 있다고만 한다. 가이드에서 경계 사례로 쓸지 정해야 한다.
- "전달 흐름을 끊지 않는다" 조건은 refactoring.guru 근거뿐이다. GoF 원문은 전달 전후 추가 연산만 말한다.
- Head First Design Patterns의 Beverage 예 출처 주장은 확인하지 않았다(기존 참고 자료 승계).

## Facade (퍼사드)

### 원전 대응
- 분류: 구조 · 객체 범위. 원서 시작 쪽 185.
- 의도(intent): "Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use." (GoF 원문 Facade · Intent)
- participants(원문에는 Client 항목이 없다):
  - `Facade` (Compiler) — 어떤 서브시스템 클래스가 요청을 책임지는지 안다. 클라이언트 요청을 적절한 서브시스템 객체에 위임한다.
  - `subsystem classes` (Scanner, Parser, ProgramNode 등) — 서브시스템 기능을 구현한다. Facade가 맡긴 일을 처리한다. **Facade를 모른다** — Facade에 대한 참조를 두지 않는다.
- collaborations:
  1. 클라이언트가 Facade에 요청을 보낸다.
  2. Facade가 요청을 적절한 서브시스템 객체(들)에 전달한다. 실제 일은 서브시스템 객체가 하지만, Facade가 자기 인터페이스를 서브시스템 인터페이스로 **번역**하는 일을 할 수도 있다. — 왜: 클라이언트가 다뤄야 할 객체 수를 줄이고 서브시스템과 약하게 결합하기 위해.
  3. Facade를 쓰는 클라이언트는 서브시스템 객체에 직접 접근할 필요가 없다(하지만 금지되지는 않는다 — 결과 3).
- consequences(원문 기준, 이득만 나열):
  - (1) 클라이언트를 서브시스템 컴포넌트로부터 보호해 다룰 객체 수를 줄이고 사용을 쉽게 한다. (2) 서브시스템과 클라이언트 사이 약결합을 촉진한다 — 서브시스템 컴포넌트를 클라이언트 영향 없이 바꾸고, 시스템과 객체 의존을 계층화하고, 복잡·순환 의존을 없애고, 재컴파일 범위를 줄이고, 이식을 돕는다. (3) 필요하면 애플리케이션이 서브시스템 클래스를 쓰는 것을 막지 않는다 — 사용 편의와 일반성 중 고를 수 있다.
  - 대가(원문 밖): refactoring.guru Cons — "A facade can become a god object coupled to all classes of an app."
- 원문 Implementation 요지: 클라이언트-서브시스템 결합을 더 줄이려면 Facade를 추상 클래스로 두고 서브시스템 구현마다 구체 서브클래스를 두거나, 다른 서브시스템 객체로 Facade를 구성한다. 클래스처럼 서브시스템에도 public/private 인터페이스가 있다 — Facade는 public 인터페이스의 일부이고, 서브시스템 클래스를 private으로 두는 것도 유용하다.

### 최소 조건 후보
- [필수] 여러 클래스(인터페이스들의 집합)로 된 **서브시스템**이 있고 Facade는 그것들에 대한 통합된 상위 인터페이스를 제공한다 — 반례: 클래스 하나를 감싼 래퍼는 Adapter·Decorator·Proxy 쪽이다(refactoring.guru: Adapter는 보통 한 객체, Facade는 서브시스템 전체).
- [필수] Facade는 요청을 서브시스템 객체에 **위임**하고, 실제 일은 서브시스템이 한다(호출 순서 조립·인터페이스 번역은 허용) — 반례: Facade 안에서 서브시스템 기능을 다시 구현하면 서브시스템을 단순화하는 게 아니라 대체한다.
- [필수] 서브시스템 클래스는 Facade를 **모른다**(참조 없음) — 반례: 서브시스템 객체가 Facade를 호출·참조해 서로 통신하면 Mediator에 가깝다(GoF Facade Related Patterns).
- [필수] Facade는 새 기능을 정의하지 않는다 — 원문 Mediator 대비 문장("it doesn't define new functionality")이 근거 — 반례: 비즈니스 규칙이 Facade에 쌓이면 refactoring.guru가 경고하는 god object가 된다.
- [선택] 클라이언트가 서브시스템에 직접 접근하는 것을 허용 — 원문 결과 3은 "막지 않는다"이고, Implementation 2는 일부 서브시스템 클래스를 private으로 두는 것도 유용하다고 한다(기존 가이드는 필수로 두었다 — 미해결 질문).
- [선택] Facade를 Singleton으로(원문 Related Patterns: 보통 Facade 객체 하나면 됨).
- [선택] 추상 Facade + 서브시스템 구현별 구체 Facade(원문 Implementation 1).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 복잡한 서브시스템에 대부분의 클라이언트에게 충분한 단순한 기본 뷰를 주고 싶다(맞춤이 더 필요한 클라이언트만 Facade 너머를 본다) / 클라이언트와 추상 구현 클래스 사이 의존이 많다 / 서브시스템을 계층화하고 계층마다 진입점을 두고 싶다(원문 Applicability).
  - 코드 모양: 여러 호출부에서 `A` 생성 → `B` 설정 → `C` 호출을 **같은 순서로 반복**한다(예: 파일 열기 + 전체 읽기 + 문자열 할당). 라이브러리 "시작하기"가 10단계다.
- 쓰지 말아야 할 때:
  - 목적이 인터페이스 **변환**이다 — Adapter.
  - 목적이 동료 객체 **간** 통신 조정이다 — Mediator.
  - 대부분의 클라이언트가 세밀한 제어를 필요로 해 Facade가 우회로로만 쓰인다(원문 Applicability 1에서 끌어낸 해석).
  - Facade에 도메인 규칙을 넣고 싶어진다 — god object 위험(refactoring.guru Cons).

### 비교 대상
- vs Mediator: 둘 다 기존 클래스의 기능을 추상화하지만, Mediator는 동료 객체들 사이의 **임의 통신**을 추상화하고 흔히 어느 한쪽에 속하지 않는 기능을 모으며 동료들은 Mediator를 **알고** 그와 통신한다. Facade는 서브시스템 인터페이스만 추상화해 쓰기 쉽게 할 뿐 새 기능을 정의하지 않고 서브시스템 클래스는 Facade를 **모른다**(GoF Facade Related Patterns). refactoring.guru는 "Objects within the subsystem can communicate directly"를 덧붙인다. 오인하기 쉬운 코드 모양: 서브시스템 객체들이 생성자로 "Manager"를 받아 서로의 이벤트를 그 Manager에 보고하면 Mediator, 바깥 클라이언트만 "Manager"를 호출하면 Facade. (PATTERNS.md 빠른 비교 페어: 동료 간 중재 vs 서브시스템 단순 진입점)
- vs Adapter: Facade는 **새** 인터페이스를 정의하고 Adapter는 **기존** 인터페이스를 재사용한다(GoF Discussion of Structural Patterns). 오인하기 쉬운 코드 모양: 외부 SDK 여러 클래스를 감싸 우리 쪽 기존 포트 인터페이스를 구현 — 기존 인터페이스를 구현하면 Adapter.
- vs Abstract Factory: 서브시스템 객체를 서브시스템 독립적으로 **생성**하는 인터페이스로 함께 쓰거나, 플랫폼 특화 클래스를 숨기는 목적의 대안이 될 수 있다(GoF Facade Related Patterns).
- vs Proxy: 둘 다 복잡한 대상을 완충하고 스스로 초기화할 수 있지만 Proxy는 대상과 **같은** 인터페이스라 서로 교체 가능하다(refactoring.guru Relations).
- vs God object(안티패턴): 새 기능을 정의하지 않는다는 조건이 깨져 앱의 모든 클래스와 결합한 Facade(refactoring.guru Cons).

### 세 언어 구현 쟁점
- Java:
  - 관용구: 서브시스템 객체를 필드로 가진 클래스, 또는 정적 메서드 모음. `java.nio.file.Files`는 정적 메서드만으로 이뤄지고 대부분 연관된 파일 시스템 제공자에 위임한다(Javadoc).
  - 서브시스템 숨기기: 원문 Implementation 2의 public/private 서브시스템 클래스를 Java에서는 접근 제한자(패키지 전용 등)로 표현한다(해석).
- TypeScript:
  - 모듈 자체가 Facade 역할을 할 수 있다 — 공개 함수만 `export`하고 서브시스템 모듈은 내보내지 않는 식(해석). 단순 재노출(barrel 파일)은 인터페이스를 단순화하지 않으므로 Facade가 아니다(해석).
- Rust:
  - 항목은 기본적으로 부모 모듈에 비공개이고 구조체 필드도 기본 비공개다(Rust Book 7.3) — 서브시스템 모듈을 비공개로 두고 상위 모듈에서 `pub fn`만 노출하면 원문 Implementation 2(private 서브시스템 클래스)를 언어 차원에서 표현할 수 있다(해석).
  - std의 편의 함수(`fs::read_to_string`, 문서 표현 "convenience function")가 함수 단위 Facade 모양이다.

### 실제 사용처
- Spring `JdbcClient`(6.1+) — `Facade` = JdbcClient, `subsystem` = JDBC `PreparedStatement` 실행 흐름(과 그 위의 `JdbcTemplate`). JdbcClient Javadoc: "a convenient unified facade for JDBC PreparedStatement execution", JdbcTemplate Javadoc: "For a more focused and convenient facade on top of this, consider JdbcClient as of 6.1." — 공식 문서가 facade라고 명시한 사례. — [JdbcClient (Spring Framework 7.0.9 API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/simple/JdbcClient.html) · [JdbcTemplate (Spring Framework 7.0.9 API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html) · 조회 시 7.0.9
- Rust `std::fs::read_to_string` — `Facade` = 함수, `subsystem` = `File::open` + `Read::read_to_string` + 버퍼 할당. 문서: "a convenience function for using File::open and read_to_string with fewer imports and without an intermediate variable"(해석, 패턴명 없음). — [fs::read_to_string](https://doc.rust-lang.org/std/fs/fn.read_to_string.html)
- `java.nio.file.Files` — `Facade` = Files의 정적 메서드, `subsystem` = 파일 시스템 제공자(`FileSystemProvider`)와 채널·스트림들(해석). — [Files (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html) · Java SE 21

### 기존 가이드 승계분
- 최소 조건 취지: 퍼사드 뒤에 둘 이상의 협력 객체로 된 서브시스템이 있어야 하고(단일 클래스 래핑은 래퍼), 자주 쓰는 시나리오를 고수준 메서드 하나로 노출하며 내부 호출 순서를 캡슐화하고, 퍼사드는 서브시스템을 알지만 서브시스템은 퍼사드를 모르고, 클라이언트의 서브시스템 직접 접근을 막지 않으며(막으면 본래 의도와 다름), 새 도메인 로직을 도입하지 않는다(늘면 응용 서비스나 God 객체). Adapter(변환, 1:1)·Mediator(양방향 의존)·단순 래퍼·Singleton(단일 인스턴스 ≠ 단일 인터페이스)과 구분한다.
- 참고 자료:
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (Gang of Four), "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — Facade 패턴 원전.
  - Eric Freeman, Elisabeth Robson, "Head First Design Patterns" (2nd ed.), O'Reilly, 2020 — 홈시어터(Home Theater) 예시의 원형이 소개된 책.
  - Refactoring.Guru, "Facade", https://refactoring.guru/design-patterns/facade
  - SLF4J 공식 문서, "Simple Logging Facade for Java (SLF4J) user manual", https://www.slf4j.org/manual.html
  - Oracle Jakarta Server Faces 사양 — `jakarta.faces.context.FacesContext` 설명.
  - Martin Fowler, "Patterns of Enterprise Application Architecture", Addison-Wesley, 2002 — 계층화 아키텍처(Layered Architecture)에서의 경계 객체로서의 퍼사드 논의.

### 출처
- [Facade — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4e.htm) — Intent·Applicability·Participants(Client 없음, 서브시스템은 Facade 모름)·Collaborations(번역 작업 허용)·Consequences 1~3·Implementation·Known Uses·Related Patterns(Mediator·AF·Singleton) · 조회 2026-09-17
- [Discussion of Structural Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc4.htm) — Facade는 새 인터페이스, Adapter는 기존 인터페이스 · 조회 2026-09-17
- [Facade — refactoring.guru](https://refactoring.guru/design-patterns/facade) — Relations(Adapter·AF·Flyweight·Mediator·Singleton·Proxy), Pros and Cons(god object) · 조회 2026-09-17
- [Facade in Java — refactoring.guru](https://refactoring.guru/design-patterns/facade/java/example) — FacesContext·ExternalContext 사례와 식별 기준 · 조회 2026-09-17
- [JdbcClient (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/simple/JdbcClient.html) — "convenient unified facade" · 조회 2026-09-17
- [JdbcTemplate (Spring Framework API)](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html) — JdbcClient를 facade로 소개, 조회 시 7.0.9 · 조회 2026-09-17
- [fs::read_to_string (Rust std)](https://doc.rust-lang.org/std/fs/fn.read_to_string.html) — convenience function 서술 · 조회 2026-09-17
- [Files (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html) — 정적 메서드만, 파일 시스템 제공자에 위임 · 조회 2026-09-17
- [SLF4J user manual](https://www.slf4j.org/manual.html) — "serves as a simple facade or abstraction for various logging frameworks", 배포 시점에 백엔드 선택 · 조회 2026-09-17
- [Rust Book 7.3 Paths](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html) — 항목·필드 기본 비공개 · 조회 2026-09-17

### 미해결 질문
- SLF4J는 스스로 facade라고 부르지만 "여러 로깅 프레임워크 중 하나를 배포 시점에 끼우는 추상화"라 GoF Facade(한 서브시스템의 협력 단순화)보다 Bridge/Adapter 구조에 가깝다는 해석이 가능하다. 가이드에서 실제 사용처로 쓸지, "이름이 facade인 경계 사례"로 쓸지 정해야 한다.
- 기존 가이드의 "서브시스템 직접 접근 허용"을 [필수]로 둘지 — 원문 결과 3은 "막지 않는다"지만 Implementation 2는 private 서브시스템 클래스도 유용하다고 해 [선택]이 원문에 더 가깝다.
- refactoring.guru·기존 가이드의 `FacesContext`·`ExternalContext` 사례는 Jakarta 사양 문서를 확인하지 않았다.
- PoEAA의 퍼사드 논의(기존 참고 자료)는 확인하지 않았다(PoEAA의 Remote Facade와 GoF Facade 구분 필요 여부 포함).

## Flyweight (플라이웨이트)

### 원전 대응
- 분류: 구조 · 객체 범위. 원서 시작 쪽 195.
- 의도(intent): "Use sharing to support large numbers of fine-grained objects efficiently." (GoF 원문 Flyweight · Intent)
- participants:
  - `Flyweight` — 플라이웨이트가 외재 상태를 받아 동작하는 인터페이스를 선언한다.
  - `ConcreteFlyweight` (Character) — Flyweight 인터페이스를 구현하고, 내재 상태가 있으면 그 저장소를 둔다. **공유 가능해야** 하며 저장하는 상태는 모두 내재(객체의 컨텍스트와 독립)여야 한다.
  - `UnsharedConcreteFlyweight` (Row, Column) — 모든 Flyweight 서브클래스가 공유될 필요는 없다. Flyweight 인터페이스는 공유를 가능하게 할 뿐 강제하지 않는다. 흔히 ConcreteFlyweight를 자식으로 가진다.
  - `FlyweightFactory` — 플라이웨이트를 만들고 관리한다. 적절한 공유를 보장한다 — 요청이 오면 기존 인스턴스를 주거나 없으면 만든다.
  - `Client` — 플라이웨이트에 대한 참조를 유지한다. 플라이웨이트의 외재 상태를 계산하거나 저장한다.
- collaborations:
  1. 플라이웨이트가 동작하는 데 필요한 상태를 내재 또는 외재로 구분한다. 내재 상태는 ConcreteFlyweight에, 외재 상태는 Client가 저장·계산한다. — 왜: 컨텍스트마다 다른 상태를 빼내야 적은 수의 공유 객체로 많은 객체를 대신할 수 있다.
  2. 클라이언트는 ConcreteFlyweight를 직접 인스턴스화하지 않고 FlyweightFactory에서만 얻는다. — 왜: 공유가 제대로 되도록.
  3. 클라이언트는 연산을 호출할 때 외재 상태를 플라이웨이트에 넘긴다.
- consequences(원문 기준):
  - 대가: 외재 상태를 넘기고·찾고·계산하는 런타임 비용이 생긴다(특히 원래 내재였던 상태라면).
  - 얻는 것: 그 비용은 공간 절약으로 상쇄되고, 공유가 많을수록 절약이 커진다. 절약은 공유로 줄어든 인스턴스 수, 객체당 내재 상태량, 외재 상태를 저장하느냐 계산하느냐에 달렸다.
  - Composite와 결합 시: 공유된 잎은 부모 포인터를 저장할 수 없고 부모는 외재 상태로 전달되어야 한다 — 계층 안 객체 간 통신 방식에 큰 영향.
- Applicability는 **모두** 참이어야 한다고 명시: 객체가 매우 많다 / 그 수 때문에 저장 비용이 크다 / 대부분의 상태를 외재화할 수 있다 / 외재 상태를 빼면 많은 객체 그룹을 비교적 적은 공유 객체로 대체할 수 있다 / 애플리케이션이 객체 동일성에 의존하지 않는다(공유되므로 개념상 다른 객체의 동일성 검사가 참이 됨).
- 원문 Implementation 요지: 외재 상태 제거가 적용 가능성을 좌우한다(외재 상태 종류가 공유 전 객체 수만큼 많으면 절약이 없음 — 훨씬 적은 수의 구조로 저장돼야 함). 공유 객체 관리 — 팩토리는 흔히 연관 저장소를 쓰고, 공유는 더는 필요 없을 때 회수하기 위한 참조 카운트나 GC를 함의하지만 플라이웨이트 수가 고정·소량(예: ASCII 문자)이면 영구 보관해도 된다.

### 최소 조건 후보
- [필수] 상태가 **내재(공유·컨텍스트 독립)**와 **외재(컨텍스트별)**로 나뉘고, 외재 상태는 플라이웨이트에 저장되지 않고 연산 호출 시 전달된다 — 반례: 좌표(x, y)를 플라이웨이트 필드에 저장하면 좌표마다 인스턴스가 필요해 공유가 안 된다.
- [필수] 공유 대상 인스턴스는 **팩토리(또는 동등한 풀)를 통해서만** 얻고, 같은 키에는 같은 인스턴스가 돌아온다 — 반례: 클라이언트가 `new ConcreteFlyweight()`를 자유롭게 호출하면 공유가 보장되지 않는다(원문 collaboration 2).
- [필수] 공유 중인 내재 상태는 어느 클라이언트도 바꾸지 않는다 — 반례: 한 클라이언트가 공유 글꼴 객체의 크기를 바꾸면 그 객체를 쓰는 모든 컨텍스트가 바뀐다. 원문 표현은 "공유 가능해야 하고 저장 상태는 컨텍스트 독립"이며 "불변(immutable)"이라는 단어는 쓰지 않는다(미해결 질문).
- [필수] 클라이언트가 공유 객체의 **동일성에 의존하지 않는다** — 반례: `==`로 개념상 다른 두 글자를 구분하는 코드는 공유하는 순간 깨진다(원문 Applicability 5).
- [선택] `UnsharedConcreteFlyweight`.
- [선택] 참조 카운트·회수(원문 Implementation 2 — 수가 고정·소량이면 불필요).
- [선택] Composite와 결합(부모 참조 외재화).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 위 Applicability 다섯 조건이 **모두** 성립한다.
  - 코드 모양: 문서 편집기의 글자 객체 — 원문 Known Uses의 InterViews Doc 편집기는 180,000자 문서에 글자 객체 480개만 할당했다. 게임 지도에서 같은 종류의 나무·타일 수백만 개(refactoring.guru 예제). 작은 값 범위에 몰린 박싱 객체(`Integer` 캐시).
- 쓰지 말아야 할 때:
  - 메모리 부족 문제가 없다(refactoring.guru Java 예제 페이지: 그렇다면 무시해도 된다).
  - 외재 상태의 종류가 객체 수만큼 다양하다(원문 Implementation 1).
  - 코드가 객체 동일성에 의존한다(원문 Applicability 5).
  - refactoring.guru Cons: 외재 상태를 매번 다시 계산하면 RAM 대신 CPU를 쓰는 거래가 되고, 상태를 쪼갠 이유가 새 팀원에게 잘 보이지 않는다.

### 비교 대상
- vs Singleton: Singleton은 인스턴스 하나, Flyweight는 내재 상태(키)별로 여러 인스턴스를 공유한다. refactoring.guru는 "Singleton 객체는 가변일 수 있고 Flyweight 객체는 불변"을 두 번째 차이로 든다. 오인하기 쉬운 코드 모양: `getInstance(key)`가 키별 캐시 인스턴스를 돌려주는 "싱글톤".
- vs Object Pool / 단순 캐시: Object Pool은 클라이언트가 풀에서 객체를 **요청해 쓰고 반납**하는 주기를 가지며, 반납된 객체를 다음 사용에 맞게 리셋하는 책임이 풀에 있다(Wikipedia Object pool pattern). Flyweight는 반납 개념 없이 같은 인스턴스를 여러 컨텍스트가 **동시에** 참조하고, 컨텍스트별 상태는 애초에 밖에 둔다(GoF, 해석 결합). 오인하기 쉬운 코드 모양: `ConnectionPool.acquire()/release()`를 Flyweight라고 부르는 것, 또는 상태 분리 없이 결과만 메모이즈하는 캐시.
- vs Composite(관계): 공유 잎 노드를 가진 방향 비순환 그래프로 논리적 계층을 구현하는 조합이 흔하다 — 대신 잎은 부모를 저장하지 못한다(GoF Related Patterns·Consequences).
- 관계: State·Strategy 객체는 흔히 플라이웨이트로 구현하는 것이 최선이다(GoF Related Patterns).

### 세 언어 구현 쟁점
- Java:
  - 표준 관용: `Integer.valueOf(int)`는 -128~127을 **항상** 캐시한다(Javadoc). JLS §5.1.7은 이 범위의 `int` 상수 박싱 결과 두 개가 항상 `==`임을 보장한다.
  - 함정(동일성): `Integer`는 value-based 클래스다 — 같은 값이면 `==` 여부를 구별하려 해서는 안 되고 동기화 대상으로 쓰는 것도 강하게 권하지 않는다(Value-based Classes 문서). 원문 Applicability 5의 Java판이다.
  - 팩토리 구현: 동시 접근이면 `ConcurrentHashMap#computeIfAbsent` — 메서드 호출 전체가 원자적으로 수행되고 키가 없을 때 매핑 함수가 호출당 정확히 한 번 실행된다(Javadoc).
- TypeScript:
  - 팩토리: `Map<string, Flyweight>` 캐시.
  - 함정: `readonly`는 런타임 동작을 바꾸지 않는다(Handbook Object Types) — 공유 내재 상태를 런타임에도 막으려면 `Object.freeze`가 필요하고, 그것도 **얕은** 동결이다(MDN Object.freeze).
- Rust:
  - 공유 수단: `Rc<T>`(단일 스레드)·`Arc<T>`(스레드 안전) — `clone`은 같은 할당을 가리키는 새 포인터라 내재 상태가 복제되지 않는다(std `rc` 모듈 문서).
  - 불변 공유가 기본: Rust의 공유 참조는 기본적으로 변경을 막고 `Rc`도 예외가 아니다. 가변이 필요하면 `Cell`/`RefCell`을 넣어야 한다(std `rc` 모듈 문서) — 원문 "공유 상태는 컨텍스트 독립" 조건을 타입 시스템이 기본으로 강제하는 셈이다(해석).
  - 동일성 확인이 필요하면 `Rc::ptr_eq`(std `Rc`) — 반대로 도메인 로직이 이것에 의존하면 원문 Applicability 5 위반이다(해석).
  - 팩토리: `HashMap<Key, Rc<T>>`. 전역 팩토리가 필요하면 Singleton 절의 `OnceLock`/`LazyLock` + `Mutex` 조합.

### 실제 사용처
- `java.lang.Integer#valueOf(int)` — `FlyweightFactory` = `valueOf`, `ConcreteFlyweight` = 캐시된 `Integer`(불변·value-based), 외재 상태 = 없음(값 전체가 내재) — 부분 대응. refactoring.guru가 대표 사례로 든다(`Boolean`·`Byte`·`Character`·`Short`·`Long`·`BigDecimal`도 언급). — [Integer (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html) · Java SE 21
- `java.lang.String#intern()` — `FlyweightFactory` = String 클래스가 비공개로 유지하는 문자열 풀, `ConcreteFlyweight` = 풀의 문자열. — [String (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html) · Java SE 21
- `java.lang.Boolean#valueOf(boolean)` / `Boolean.TRUE`·`FALSE` — `FlyweightFactory` = `valueOf`, 공유 인스턴스 2개. Javadoc은 생성자보다 정적 팩토리 `valueOf(boolean)`이 공간·시간 면에서 나을 가능성이 크다고 쓴다. — [Boolean (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Boolean.html) · Java SE 21

### 기존 가이드 승계분
- 최소 조건 취지: 상태가 내재(Flyweight 내부)와 외재(메서드 파라미터로 주입)로 명시적으로 나뉘고, 공유되는 내재 상태는 불변이며, 같은 키에 같은 인스턴스를 주는 FlyweightFactory가 있어야 하고(자유로운 `new`면 공유 미보장), 외재 상태는 클라이언트나 컨텍스트 객체가 보관해 `operation(extrinsicState)` 형태로 넘긴다. 상태 분리·불변성이 없으면 단순 캐시, 팩토리가 없으면 비패턴이라고 본다. 캐싱·Object Pool(독점 사용)과 다르고, Singleton(1개)과 달리 키별 N개이며, 외재 상태가 어딘가 저장되면 외재가 아니라고 본다.
- 참고 자료:
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*, Addison-Wesley, 1994 — "Flyweight" 항목.
  - OpenJDK 소스: `java.lang.Integer.IntegerCache`, `java.lang.String#intern()` — 표준 라이브러리에서의 플라이웨이트 적용 사례.
  - Refactoring Guru, "Flyweight" — https://refactoring.guru/design-patterns/flyweight
  - Joshua Bloch, *Effective Java* (3rd ed.), Item 1 "Consider static factory methods instead of constructors" — `valueOf` 류 정적 팩토리와 인스턴스 통제(instance-controlled) 클래스 논의.
  - Wikipedia, "Flyweight pattern" — https://en.wikipedia.org/wiki/Flyweight_pattern

### 출처
- [Flyweight — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4f.htm) — Intent·Applicability(모두 참)·Participants 5개·Collaborations·Consequences·Implementation(외재 상태 제거, 공유 객체 관리·회수)·Known Uses(Doc 180,000자/480객체, ET++ Layout)·Related Patterns · 조회 2026-09-17
- [Flyweight — refactoring.guru](https://refactoring.guru/design-patterns/flyweight) — Relations(Singleton 차이, 불변 주장), Pros and Cons · 조회 2026-09-17
- [Flyweight in Java — refactoring.guru](https://refactoring.guru/design-patterns/flyweight/java/example) — `Integer#valueOf` 등 사례, 메모리 문제 없으면 무시해도 된다는 서술 · 조회 2026-09-17
- [Flyweight pattern — Wikipedia](https://en.wikipedia.org/wiki/Flyweight_pattern) — 불변 객체는 공유가 쉽고 가변 객체도 재초기화로 공유할 수 있다는 서술 · 조회 2026-09-17
- [Object pool pattern — Wikipedia](https://en.wikipedia.org/wiki/Object_pool_pattern) — 요청·사용·반납 주기, 풀의 상태 리셋 책임 · 조회 2026-09-17
- [Integer (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Integer.html) — valueOf의 -128~127 캐시 · 조회 2026-09-17
- [String (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html) — intern의 문자열 풀 · 조회 2026-09-17
- [Boolean (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Boolean.html) — valueOf 권장 · 조회 2026-09-17
- [JLS SE 21 Chapter 5 (§5.1.7 Boxing Conversion)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-5.html) — -128~127 박싱 결과의 `==` 보장 · 조회 2026-09-17
- [Value-based Classes (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/doc-files/ValueBased.html) — 동일성 의존·동기화 금지 권고 · 조회 2026-09-17
- [ConcurrentHashMap (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html) — computeIfAbsent 원자성 · 조회 2026-09-17
- [TypeScript Handbook — Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) — readonly는 런타임 동작 불변 · 조회 2026-09-17
- [MDN — Object.freeze()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) — 얕은 동결 · 조회 2026-09-17
- [std::rc 모듈 (Rust std)](https://doc.rust-lang.org/std/rc/index.html) — 공유 소유권, clone은 새 포인터, 공유 참조는 기본 변경 불가 · 조회 2026-09-17
- [Rc (Rust std)](https://doc.rust-lang.org/std/rc/struct.Rc.html) — ptr_eq · 조회 2026-09-17
- [Arc (Rust std)](https://doc.rust-lang.org/std/sync/struct.Arc.html) — 스레드 안전 참조 카운트 포인터 · 조회 2026-09-17

### 미해결 질문
- 내재 상태의 **불변성**을 [필수]로 쓸지 — refactoring.guru는 "Flyweight objects are immutable"이라 단언하고 기존 가이드도 필수로 두었지만, GoF 원문은 "공유 가능·컨텍스트 독립"만 요구하고 Wikipedia는 가변 객체도 재초기화로 공유할 수 있다고 적는다. "공유 중 변경 금지"로 완화할지 결정이 필요하다.
- `Integer#valueOf`에는 외재 상태가 없다 — 외재 상태 전달이 없는 사례를 Flyweight 실례로 쓸지, "인스턴스 통제 캐시(부분 대응)"로만 쓸지 정해야 한다. 기존 가이드 조건 4("외재 상태는 메서드 인자로")와 충돌한다.
- TypeScript·Rust 표준 라이브러리에서 공식 문서가 확인되는 Flyweight 실례를 찾지 못했다.
- 기존 참고 자료의 OpenJDK `IntegerCache` 소스는 확인하지 않았다(Javadoc의 캐시 보장만 확인).

## Proxy (프록시)

### 원전 대응
- 분류: 구조 · 객체 범위. 원서 시작 쪽 207. 별칭 Surrogate.
- 의도(intent): "Provide a surrogate or placeholder for another object to control access to it." (GoF 원문 Proxy · Intent)
- participants:
  - `Proxy` (ImageProxy) — 실제 대상에 접근하게 해 주는 참조를 유지한다(RealSubject와 Subject의 인터페이스가 같으면 Subject를 참조해도 됨). Subject와 **동일한 인터페이스**를 제공해 실제 대상 대신 쓰일 수 있게 한다. 실제 대상에 대한 접근을 통제하고 그 생성·삭제를 책임질 수도 있다. 종류별 추가 책임 — remote: 요청과 인자를 인코딩해 다른 주소 공간의 실제 대상에 보냄 / virtual: 실제 대상 정보를 캐시해 접근을 미룸 / protection: 호출자가 요청에 필요한 권한을 가졌는지 검사.
  - `Subject` (Graphic) — RealSubject와 Proxy의 공통 인터페이스를 정의해 RealSubject가 기대되는 곳 어디서나 Proxy를 쓸 수 있게 한다.
  - `RealSubject` (Image) — 프록시가 대표하는 실제 객체를 정의한다.
- collaborations:
  1. 클라이언트가 Subject 인터페이스로 Proxy에 요청한다.
  2. Proxy가 종류에 맞는 통제를 한다(권한 검사, 지연 생성, 인코딩, 참조 카운트 등).
  3. Proxy가 **적절할 때** RealSubject에 요청을 전달한다(원문 collaboration). — 왜: 대상에 직접 접근하기 불편하거나 바람직하지 않을 때(원격에 있음, 접근 제한, 영속 객체) 대리자를 두기 위해(GoF Discussion of Structural Patterns).
  4. (보호 프록시) 권한이 없으면 전달하지 않고 거부할 수 있다.
- consequences(원문 기준): 객체 접근에 간접 수준이 생기고 그 용도는 종류마다 다르다 — remote는 객체가 다른 주소 공간에 있다는 사실을 숨긴다, virtual은 요청 시 생성 같은 최적화를 한다, protection과 smart reference는 접근 시 추가 관리 작업을 한다. 여기에 **copy-on-write**도 숨길 수 있다(대상이 참조 카운트되고, 프록시 복사는 카운트만 올리며, 수정 요청이 올 때만 실제 복사).
  - 대가(원문 밖): refactoring.guru Cons — 새 클래스가 많아져 복잡해지고 서비스 응답이 늦어질 수 있다.
- Applicability의 네 종류(원문): remote proxy(다른 주소 공간 객체의 로컬 대표, Coplien의 "Ambassador"), virtual proxy(비싼 객체를 요청 시 생성), protection proxy(접근 권한 통제), smart reference(맨 포인터 대체 — 참조 카운트로 자동 해제(스마트 포인터), 최초 참조 시 영속 객체 로드, 접근 전에 실제 객체가 잠겼는지 확인).
- 원문 Implementation 요지: C++ `operator->` 오버로딩, Smalltalk `doesNotUnderstand`로 자동 전달, 프록시가 실제 대상의 구체 타입을 항상 알 필요는 없다(추상 인터페이스로만 다루면 한 Proxy 클래스로 모든 RealSubject를 다룸 — 단 인스턴스화해야 하면 구체 클래스를 알아야 함).

### 최소 조건 후보
- [필수] Proxy가 Subject와 **같은 인터페이스**를 제공해 RealSubject 자리에 대체될 수 있다 — 반례: 인터페이스가 다르면 Adapter다(GoF Related Patterns). 보호 프록시가 일부 연산을 거부해 사실상 부분집합이 되는 것은 허용된다.
- [필수] Proxy가 RealSubject에 대한 참조를 유지하고 적절할 때 요청을 전달한다 — 참조는 직접 참조가 아닐 수 있다(원격 프록시는 "호스트 ID와 로컬 주소", 가상 프록시는 파일명 같은 간접 참조로 시작해 나중에 직접 참조를 얻음) — 반례: 실제 대상 없이 스스로 결과를 만들어 내는 객체는 대리자가 아니라 또 하나의 구현이다(해석).
- [필수] 끼어드는 목적이 **접근 통제**다 — 원격 투명성, 지연 생성, 권한 검사, 스마트 참조(참조 카운트·로드·잠금 확인), copy-on-write 중 하나 이상 — 반례: 목적이 책임을 덧붙이는 것이면 Decorator다(GoF Related Patterns: "a decorator adds one or more responsibilities to an object, whereas a proxy controls access to an object").
- [선택] RealSubject의 생성·삭제(수명) 책임 — 원문은 "may be", refactoring.guru는 "usually manages the life cycle".
- [선택] 동적 생성 프록시(런타임 생성 클래스·핸들러) — Java `java.lang.reflect.Proxy`, JS `Proxy`.
- [선택] 요청 거부(보호 프록시).
- 불변식: 클라이언트는 Subject 인터페이스만으로 동작하고 Proxy인지 RealSubject인지 구별할 필요가 없다(Subject participant 정의) — 단 Decorator와 마찬가지로 객체 동일성은 다르다(해석).

### 사용 단서
- 이런 코드/요구가 보이면:
  - 단순한 포인터보다 다재다능하거나 정교한 참조가 필요하다(원문 Applicability 머리말).
  - 코드 모양: 무거운 객체(이미지·대용량 문서·ORM 연관 엔티티)를 첫 사용까지 만들지 않고 싶다(virtual). 원격 호출을 로컬 객체 호출처럼 쓰고 싶다(remote). 메서드마다 권한 검사 코드가 중복된다(protection). 공유 객체의 참조 수 추적·잠금 확인이 필요하다(smart reference). 수정할 때만 복사하고 싶다(copy-on-write).
- 쓰지 말아야 할 때:
  - 인터페이스를 바꿔야 한다 — Adapter.
  - 기능을 여러 겹 조합해야 한다 — Decorator. Proxy는 대상과 프록시의 **한 관계**에 집중하고 그 관계는 정적으로 표현될 수 있어 재귀 합성이 필수가 아니다(GoF Discussion of Structural Patterns).
  - 대상 객체 **내부의 자기 호출**까지 가로채야 한다 — 프록시 기반 AOP에서는 대상 안에서 `this.bar()`로 부른 호출이 프록시를 거치지 않는다(Spring Proxying Mechanisms).

### 비교 대상
- vs Decorator: 구현은 비슷할 수 있으나 목적이 다르다 — Proxy는 접근 통제, Decorator는 책임 추가. Proxy는 속성을 동적으로 붙이고 떼는 데 관심이 없고 재귀 합성을 위해 설계되지 않았다. 보호 프록시는 데코레이터와 **똑같이** 구현될 수도 있지만, 원격 프록시는 실제 대상의 직접 참조 없이 간접 참조만 갖는다(GoF Related Patterns, Discussion of Structural Patterns). refactoring.guru: Proxy는 대개 서비스 객체 수명을 스스로 관리하고, Decorator 조합은 항상 클라이언트가 통제한다. 오인하기 쉬운 코드 모양: `new CachingRepository(new JdbcRepository())` — 클라이언트가 조립하고 더 쌓을 수 있으면 Decorator, 팩토리·컨테이너가 대상을 숨긴 채 한 겹으로 넘겨주면 Proxy. (PATTERNS.md 빠른 비교 페어)
- vs Adapter: Adapter는 감싼 객체에 **다른** 인터페이스를, Proxy는 **같은** 인터페이스를 준다(GoF Related Patterns). 오인하기 쉬운 코드 모양: 원격 API 클라이언트 스텁 — 로컬 인터페이스가 원격 서비스 계약과 같으면 remote proxy, 로컬 도메인 인터페이스로 바꿔 부르면 Adapter. (PATTERNS.md 빠른 비교 페어)
- vs Facade: 둘 다 복잡한 대상을 완충하고 스스로 초기화할 수 있지만 Proxy는 대상과 같은 인터페이스라 교체 가능하다(refactoring.guru Relations). 오인하기 쉬운 코드 모양: 서비스 하나를 감싸 지연 초기화하는 클래스가 메서드를 줄이거나 합쳐 노출하면 Facade 쪽.

### 세 언어 구현 쟁점
- Java:
  - 정적 프록시: Subject 인터페이스를 구현하는 클래스가 RealSubject 필드를 들고 전달.
  - 동적 프록시 `java.lang.reflect.Proxy`: 런타임에 **인터페이스들**을 구현하는 프록시 클래스를 만들고, 인터페이스 메서드 호출을 `InvocationHandler#invoke`로 보낸다. `Object`의 `hashCode`·`equals`·`toString` 호출도 핸들러로 디스패치된다(Javadoc) — 핸들러가 이들을 대상에 넘기지 않으면 동등성 의미가 바뀐다.
  - 클래스 프록시의 한계: Spring AOP는 대상이 인터페이스를 하나라도 구현하면 JDK 동적 프록시를, 아니면 대상 타입의 런타임 서브클래스(CGLIB)를 만든다. CGLIB 방식에서는 `final` 클래스는 프록시할 수 없고 `final`·`private` 메서드는 advice를 걸 수 없다(Spring Proxying Mechanisms).
  - 자기 호출 함정: 호출이 대상 객체에 도달한 뒤 대상이 `this`로 자기 메서드를 부르면 프록시를 거치지 않는다(Spring Proxying Mechanisms).
- TypeScript:
  - 정적 프록시: `class ProxyX implements Subject`.
  - JS `Proxy` 객체: 핸들러 트랩으로 대상 객체의 기본 동작을 가로채고 재정의한다(MDN Proxy).
  - 함정: 프록시는 **다른 동일성**을 가진 별개 객체라 대상의 private 요소(`#field`)에 접근하지 못한다 — 메서드 안에서 `this.#secret`을 읽으면 `TypeError`가 난다. 같은 이유로 no-op 프록시도 DOM 요소나 `Map`처럼 내부 슬롯이 있는 네이티브 객체에서는 동작하지 않는다(MDN Proxy "No private field forwarding").
- Rust:
  - GoF smart reference와 copy-on-write가 표준 스마트 포인터에 대응한다: `Rc<T>`(참조 카운트, 원문의 "smart pointers"), `MutexGuard`(뮤텍스로 보호된 데이터 접근 — 원문의 "접근 전 잠금 확인", 스코프를 벗어나면 잠금 해제), `Cow`("A clone-on-write smart pointer").
  - `Deref`로 대상 메서드를 투명하게 노출할 수 있지만, 구현 기준은 "대상 타입의 값처럼 투명하게 동작 / deref가 싸다 / deref 강제 변환이 놀랍지 않다"이고, deref 구현이 **예기치 않게 실패할 수 있으면 구현하지 말라**고 한다(std `Deref` 문서). 원격 호출·권한 거부처럼 실패할 수 있는 프록시는 `Deref`가 아니라 Subject 트레이트를 명시적으로 구현해야 한다(해석). C-DEREF도 `Deref`는 스마트 포인터 용도로만 쓰라고 한다.
  - 동적 교체가 필요하면 `Box<dyn Subject>`.

### 실제 사용처
- `java.lang.reflect.Proxy` + `InvocationHandler` — `Proxy` = 런타임 생성 프록시 인스턴스, `Subject` = 프록시 인터페이스들, `RealSubject` = 핸들러가 호출을 넘기는 대상(핸들러 구현에 달림). refactoring.guru도 첫 사례로 든다. — [Proxy (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html) · Java SE 21
- Spring AOP 프록시 — `Proxy` = JDK 동적 프록시 또는 CGLIB 서브클래스, `RealSubject` = 대상(target) 객체, 통제 = advice(트랜잭션·보안 등). — [Proxying Mechanisms :: Spring Framework](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html) · 조회 시 7.0.9
- JavaScript `Proxy` — `Proxy` = `new Proxy(target, handler)`, `RealSubject` = target, 통제 = handler 트랩. — [MDN Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) · MDN Baseline "Widely available" 표기
- Rust `std::sync::MutexGuard` — smart reference 프록시: `RealSubject` = 뮤텍스가 보호하는 데이터, 접근 = `Deref`/`DerefMut`, 스코프 종료 시 잠금 해제(RAII). — [MutexGuard](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html)
- Rust `std::borrow::Cow` — copy-on-write 프록시(원문 Consequences의 copy-on-write 최적화에 대응, 해석). — [Cow](https://doc.rust-lang.org/std/borrow/enum.Cow.html)

### 기존 가이드 승계분
- 최소 조건 취지: 프록시와 실제 객체가 같은 인터페이스를 구현하고, 클라이언트는 어느 쪽인지 알 필요 없이 치환 가능하며(Liskov), 프록시는 결국 RealSubject에 위임하거나 정책에 따라 차단·대체하고(최종 목적지가 RealSubject), "왜 사이에 끼어드는가"(지연 생성·권한 검사·원격 호출·참조 추적 중 하나 이상)가 분명해야 한다. 공통 인터페이스가 없으면 래퍼, 의도가 모호하면 Decorator와 구분되지 않으며, Adapter(다른 인터페이스)·Facade(여러 하위 객체의 새 진입점)와 구분하고, 의도도 인터페이스 일치도 없으면 단순 위임이라고 본다.
- 참고 자료:
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (1994), Proxy 패턴(p.207).
  - Refactoring.Guru, "Proxy Pattern" — https://refactoring.guru/design-patterns/proxy
  - Java Platform SE Docs, "java.lang.reflect.Proxy" — https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/Proxy.html
  - Spring Framework Reference, "Aspect Oriented Programming with Spring" — https://docs.spring.io/spring-framework/reference/core/aop.html
  - Joshua Bloch, "Effective Java" (3rd ed.), Item 22 (Use interfaces only to define types) 및 동적 프록시 관련 논의.
  - Baeldung, "Dynamic Proxies in Java" — https://www.baeldung.com/java-dynamic-proxies

### 출처
- [Proxy — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/pat4g.htm) — Intent·별칭·Applicability(네 종류)·Participants·Collaborations·Consequences(copy-on-write)·Implementation·Known Uses·Related Patterns(Adapter·Decorator, 간접 참조) · 조회 2026-09-17
- [Discussion of Structural Patterns — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/disc4.htm) — Decorator versus Proxy · 조회 2026-09-17
- [Introduction(1장) — GoF 원서 CD HTML판](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — Proxy (207) 쪽 표기 · 조회 2026-09-17
- [Proxy — refactoring.guru](https://refactoring.guru/design-patterns/proxy) — Relations, Pros and Cons · 조회 2026-09-17
- [Proxy in Java — refactoring.guru](https://refactoring.guru/design-patterns/proxy/java/example) — `java.lang.reflect.Proxy`·`java.rmi.*` 등 사례 목록과 식별 기준 · 조회 2026-09-17
- [Proxy (Java SE 21 API)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/Proxy.html) — 인터페이스 프록시, InvocationHandler 디스패치, Object 메서드 디스패치 · 조회 2026-09-17
- [Proxying Mechanisms — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html) — JDK 동적 프록시/CGLIB 선택, final·private 제약, self-invocation · 조회 2026-09-17
- [MDN — Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) — 정의, No private field forwarding, 내부 슬롯 객체 제약 · 조회 2026-09-17
- [MutexGuard (Rust std)](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html) — RAII scoped lock, Deref/DerefMut 접근 · 조회 2026-09-17
- [Cow (Rust std)](https://doc.rust-lang.org/std/borrow/enum.Cow.html) — clone-on-write smart pointer · 조회 2026-09-17
- [Rc (Rust std)](https://doc.rust-lang.org/std/rc/struct.Rc.html) — 단일 스레드 참조 카운트 포인터 · 조회 2026-09-17
- [Deref (Rust std)](https://doc.rust-lang.org/std/ops/trait.Deref.html) — 스마트 포인터, 구현해야 할 때/말아야 할 때, 실패하면 안 됨 · 조회 2026-09-17
- [Rust API Guidelines — Predictability (C-DEREF)](https://rust-lang.github.io/api-guidelines/predictability.html) — Deref는 스마트 포인터만 · 조회 2026-09-17

### 미해결 질문
- refactoring.guru가 드는 `java.rmi.*`(remote proxy 스텁)와 `javax.persistence.PersistenceContext`·`javax.ejb.EJB`는 공식 문서를 확인하지 않았다. RMI를 remote proxy 사례로 쓰려면 Oracle RMI 문서 확인이 필요하다.
- Rust `Rc`·`MutexGuard`는 `Deref`로 대상 **타입의 메서드**를 노출할 뿐 Subject 트레이트를 구현하지 않는다. "같은 인터페이스" 조건을 Deref 기반 투명성으로 인정할지 정해야 한다.
- Java 동적 프록시의 `equals`/`hashCode` 디스패치가 동일성 불변식에 주는 영향은 해석이다. 가이드에 쓰려면 예제 검증이 필요하다.
- 기존 참고 자료의 Effective Java Item 22와 동적 프록시의 연결, Baeldung 글은 확인하지 않았다(Baeldung은 블로그 — 보조 출처 취급 필요).

## 교차 비교 메모

12패턴 가이드끼리 서로 링크해야 할 쌍과 구분 기준 한 줄이다. 괄호는 근거 위치(각 패턴 절 「비교 대상」에 출처 있음). ★는 PATTERNS.md 「빠른 비교가 자주 필요한 페어」에 걸린 쌍이다.

- ★ Factory Method ↔ Abstract Factory — 제품 1종을 서브클래스 오버라이드(클래스 범위)로 vs 제품군을 팩토리 객체 합성(객체 범위)으로. AF의 생성 연산은 흔히 FM으로 구현된다. (GoF 1장 Table 1.1, AF Related Patterns, Discussion of Creational Patterns)
- ★ Builder ↔ Abstract Factory — 복합 객체 하나를 단계적으로 조립해 마지막에 꺼냄 vs 제품(군)을 호출 즉시 반환. (GoF Builder Related Patterns)
- Factory Method ↔ Prototype — 평행 Creator 서브클래스 계층이 필요(초기화 단계 불필요) vs 복제로 Creator 계층 불필요(복제 후 초기화 연산이 필요할 수 있음). (GoF FM Related Patterns)
- Abstract Factory ↔ Prototype — 경쟁 관계이면서, 프로토타입 집합을 복제하는 구체 팩토리로 결합 가능. (GoF Prototype Related Patterns, AF Implementation)
- Abstract Factory ↔ Singleton — 구체 팩토리는 제품군당 하나면 되므로 흔히 Singleton(관계, 혼동 아님). (GoF AF Implementation·Related Patterns)
- Abstract Factory ↔ Facade — 서브시스템 객체 **생성**을 숨기는 목적이면 AF가 Facade의 대안. (GoF Facade Related Patterns)
- Abstract Factory ↔ Bridge — AF가 특정 Bridge(Abstraction+Implementor 조합)를 생성·구성(관계). (GoF Bridge Related Patterns)
- Builder ↔ Composite — Builder가 흔히 만드는 결과물이 Composite(관계). (GoF Builder Related Patterns)
- Singleton ↔ Flyweight — 인스턴스 1개 vs 내재 상태(키)별 여러 공유 인스턴스. (refactoring.guru Relations)
- Singleton ↔ Facade — Facade 객체는 보통 하나라 흔히 Singleton(관계). 단일 인스턴스와 단일 인터페이스는 별개 개념. (GoF Facade Related Patterns)
- ★ Adapter ↔ Decorator ↔ Proxy — 다른 인터페이스로 변환 vs 같은 인터페이스에 책임 추가(재귀 합성) vs 같은 인터페이스로 접근 통제(한 관계, 수명 관리). (GoF Adapter·Decorator·Proxy Related Patterns, Discussion of Structural Patterns)
- Adapter ↔ Bridge — 이미 있는 두 인터페이스를 설계 후 맞춤 vs 추상과 구현을 설계 전 분리해 독립 진화. (GoF Discussion of Structural Patterns)
- Adapter ↔ Facade — 기존 인터페이스 재사용(보통 한 객체) vs 새 인터페이스 정의(서브시스템 전체). (GoF Discussion of Structural Patterns, refactoring.guru)
- Composite ↔ Decorator — 여러 자식을 하나처럼 표현(집계) vs 한 객체를 감싸 책임 추가(장식). 함께 쓰면 서로에게 Leaf/ConcreteComponent로 보인다. (GoF Discussion of Structural Patterns)
- Composite ↔ Flyweight — 공유 잎으로 트리를 DAG로 구현 가능하지만 공유 잎은 부모를 저장하지 못하고 부모를 외재 상태로 받음(관계). (GoF Flyweight Consequences·Related Patterns)
- Prototype ↔ Composite·Decorator — 합성·장식이 많은 구조는 처음부터 다시 만들지 않고 복제하는 데 Prototype이 유리(관계). 복합 구조의 Clone은 깊은 복사여야 함. (GoF Prototype Related Patterns·Consequences)
- Facade ↔ Proxy — 서브시스템에 새 단순 인터페이스 vs 대상과 같은 인터페이스라 교체 가능. (refactoring.guru Relations)
- 행위 패턴 노트(`gof-behavioral.md`)와 걸어야 할 쌍:
  - ★ Facade ↔ Mediator — 서브시스템이 모르는 단방향 진입점, 새 기능 없음 vs 동료들이 알고 통신하는 중재자, 흩어진 기능 집중. (GoF Facade Related Patterns)
  - Factory Method ↔ Template Method — 팩토리 메서드는 흔히 template method 안에서 호출되는 "객체를 반환하는 단계". (GoF FM Related Patterns)
  - Factory Method ↔ Iterator — 컬렉션의 `CreateIterator`가 팩토리 메서드의 대표 사례(평행 계층 연결). (GoF Iterator)
  - Bridge ↔ Strategy — 구조는 비슷하지만 추상 계층 전체와 구현 계층의 분리 vs 한 컨텍스트의 교체 가능한 알고리즘. (refactoring.guru Relations, GoF Strategy Intent)
  - Decorator ↔ Strategy — 객체의 겉(skin)을 바꿈 vs 속(guts)을 바꿈. (GoF Decorator Related Patterns)
  - Decorator ↔ Chain of Responsibility — 전달을 끊지 않고 책임을 쌓음 vs 핸들러가 독립적으로 처리하고 전달을 멈출 수 있음. (refactoring.guru Relations)
  - Composite ↔ Visitor / Iterator — 연산을 노드 클래스에 둘지 Visitor로 모을지, 순회를 Iterator로 뺄지(관계). (GoF Composite Related Patterns)
  - Composite ↔ Chain of Responsibility — 컴포넌트-부모 링크가 흔히 책임 연쇄 경로로 쓰임(관계). (GoF Composite Related Patterns)
  - Flyweight ↔ State·Strategy — State·Strategy 객체는 흔히 플라이웨이트로 구현(관계). (GoF Flyweight Related Patterns)
- 이름 충돌 메모(가이드 「흔한 오해」 공용 소재): Java `InputStreamReader`의 자칭 "bridge"(구조는 Adapter), Rust std "iterator adapters"(구조는 Decorator에 가까움), Spring `prototype` 스코프(복제 아님), Spring `singleton` 스코프(컨테이너당 하나), TypeScript `@decorator`(클래스 정의 문법), SLF4J "Facade"(백엔드 교체 추상화).

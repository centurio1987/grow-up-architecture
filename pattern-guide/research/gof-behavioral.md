# GoF 행위 패턴 리서치 노트

범위는 GoF(Gamma·Helm·Johnson·Vlissides, *Design Patterns*, 1994)의 행위 패턴 11개(Chain of Responsibility · Command · Interpreter · Iterator · Mediator · Memento · Observer · State · Strategy · Template Method · Visitor)이고, 작성일은 2026-09-17(모든 웹 출처 조회일 동일)이다. 용도는 디자인 패턴 가이드 재집필 워커가 편마다 원전을 다시 검색하지 않도록 participants·collaborations·consequences, 최소 조건 후보, 비교 대상, Java·TypeScript·Rust 구현 쟁점, 출처가 확인된 실제 사용처를 한곳에 모아 두는 것이다. 원전 구조 정보는 UNC 강의 페이지에 호스팅된 GoF 원서 HTML 사본(Design Patterns CD 판)의 본문을 직접 읽어 확인했고, 원서 쪽수는 그 사본의 표 1.1(Design pattern space)에 붙은 교차참조 쪽 표기만 옮겼다(종이책 대조는 하지 않음). 이 사본은 사실 확인용이며 문장을 가이드에 옮겨 적지 않는다. 본문 괄호 표기는 [GoF]=해당 패턴 출처 목록의 GoF 원문 사본, [GoF 토론]=원서 5장 끝 "Discussion of Behavioral Patterns", [RG]=refactoring.guru, [노트]=출처 없이 작성자가 도출·판단한 것(가이드에 사실로 옮기기 전에 재검토 필요)을 뜻한다. 「실제 사용처」의 "패턴명 명시 출처 없음"은 API 동작은 공식 문서로 확인했으나 그 API를 해당 패턴이라고 부른 신뢰 출처는 찾지 못했다는 뜻이다.

## Chain of Responsibility (책임 연쇄)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 223쪽부터(표 1.1의 쪽 표기, 종이책 확인 안 함)
- 의도(intent): 요청을 보내는 쪽과 받는 쪽의 결합을 피하려고, 둘 이상의 객체에게 요청을 처리할 기회를 줌. 받는 객체들을 사슬로 엮고 어떤 객체가 처리할 때까지 요청을 사슬을 따라 넘김 [GoF]
- participants [GoF]:
  - `Handler` (예: HelpHandler) — 요청 처리 인터페이스 정의. **(선택)** successor 링크 구현
  - `ConcreteHandler` (PrintButton, PrintDialog) — 자기 책임인 요청을 처리. successor에 접근 가능. 처리할 수 있으면 처리, 아니면 successor로 전달
  - `Client` — 사슬 위의 ConcreteHandler 객체에게 요청을 개시
- collaborations: 원문은 "클라이언트가 요청을 내면, 어떤 ConcreteHandler가 책임을 맡을 때까지 요청이 사슬을 따라 전파된다" 한 문장 [GoF]. 단계 분해 [노트]:
  1. Client가 사슬의 시작 처리자에게 요청 전달 — 왜: Client는 실제 처리자를 모름
  2. 처리자가 자기 책임인지 판단 — 왜: 처리 결정권이 처리자에게 있음
  3. 처리 가능하면 처리하고 종료, 아니면 successor에게 같은 요청 전달
  4. 사슬 끝까지 아무도 처리하지 않으면 요청은 처리되지 않은 채 끝남(원전 consequence "수신 보장 없음")
- consequences [GoF]:
  - 얻는 것: **결합도 감소** — 발신자와 수신자가 서로를 명시적으로 모르고, 사슬 속 객체도 사슬 구조를 몰라도 됨. 후보 수신자 전부 대신 successor 하나만 참조
  - 얻는 것: **책임 배분의 유연성** — 런타임에 사슬을 추가·변경해 책임을 바꿈. 서브클래싱과 결합해 정적으로 특화 가능
  - 대가: **수신이 보장되지 않음** — 명시적 수신자가 없으므로 사슬 끝으로 떨어질 수 있고, 사슬 구성이 잘못돼도 처리되지 않음
- 원전 구현 쟁점(요지) [GoF]: successor 사슬을 새 링크로 정의할지, 기존 링크(Composite의 부모 참조 등)를 쓸지 / Handler가 successor를 보관하고 기본 `HandleRequest`가 무조건 전달하게 하면 관심 없는 서브클래스는 재정의 불필요 / 요청 표현 — 고정된 연산 호출(안전하지만 요청 종류 고정), 요청 코드 + 조건 분기(개방적이지만 타입 안전성 낮음), 별도 Request 객체 / Smalltalk `doesNotUnderstand`로 자동 전달
- Applicability [GoF]: 요청을 처리할 수 있는 객체가 여럿이고 처리자를 미리 모르며 자동으로 정해져야 할 때 · 수신자를 명시하지 않고 여러 객체 중 하나에 요청하고 싶을 때 · 요청을 처리할 객체 집합을 동적으로 지정해야 할 때
- Known Uses [GoF]: MacApp·ET++ `EventHandler`, Symantec TCL `Bureaucrat`, NeXT AppKit `Responder`(사용자 이벤트 처리) · Unidraw 커맨드 해석을 부모로 전달 · ET++ `InvalidateRect`가 감싸는 컨테이너를 거쳐 Window까지 전달

### 최소 조건 후보
- [필수] 요청을 받을 수 있는 후보 처리자가 공통 타입(Handler 인터페이스·추상 클래스·함수 시그니처)으로 다뤄지고 순서 있는 사슬을 이룸 — 반례: 처리자가 늘 하나로 고정된 위임은 사슬이 아님
- [필수] 각 처리자가 요청을 보고 "직접 처리할지 / 다음으로 넘길지(또는 거기서 멈출지)"를 스스로 결정함 — 반례: 모든 노드가 무조건 다음을 호출하고 흐름을 끊을 수 없다면 Decorator·파이프라인에 가까움([RG] CoR↔Decorator 관계 서술)
- [필수] 발신자는 사슬의 시작점만 알고 실제 처리자를 지정하지 않음 — 반례: 클라이언트가 조건을 보고 처리자를 골라 직접 호출하면 디스패처일 뿐
- [선택] Handler가 successor 참조 필드를 직접 보관 — GoF가 participant 설명에 "(optional)"로 표기하고 기존 링크(부모 참조) 사용을 허용. 컨테이너가 넘겨주는 체인 객체(`FilterChain`)로 다음을 호출하는 방식도 여기에 해당
- [선택] Handler 기본 구현이 무조건 successor로 전달(관심 없는 처리자는 재정의 불필요) [GoF]
- [선택] 요청을 Request/Command 객체로 표현 [GoF]
- [선택] 사슬 끝의 기본(catch-all) 처리자 — "수신 보장 없음" 대가를 줄이는 수단 [노트]
- 불변식 후보: 사슬은 유한하고 순환하지 않아야 요청이 반드시 종료됨 [노트] · 한 처리자가 요청을 처리했다고 판단하면(정통형) 이후 처리자는 그 요청을 받지 않음 [GoF participant 설명에서 도출]

### 사용 단서
- 이런 코드/요구가 보이면:
  - 요청 종류와 처리 순서를 미리 알 수 없고, 처리자 집합·순서를 런타임에 바꿔야 함 [RG]
  - 인증 → 권한 → 캐시 → 실제 처리처럼 정해진 순서로 여러 검사를 통과시키고, 앞 단계가 요청을 막을 수 있어야 함 (서블릿 필터가 요청을 차단할 수 있음 — Jakarta `Filter` Javadoc)
  - UI 이벤트·도움말 요청이 자식 위젯에서 부모 위젯으로 올라가며 처리자를 찾음 [GoF Motivation, RG Java 페이지 "GUI 부모 컴포넌트로 이벤트 버블링"]
  - `if (a.canHandle(r)) a.handle(r); else if (b.canHandle(r)) …`가 여러 호출부에 복제됨 [노트]
- 쓰지 말아야 할 때:
  - 요청이 반드시 처리돼야 하는데 사슬 끝 기본 처리자를 둘 수 없음 — 원전 대가 "수신 보장 없음" [GoF]
  - 처리자가 항상 하나로 정해져 있음 — 단순 위임으로 충분 [노트]
  - 등록된 모두에게 같은 사건을 알려야 함 → Observer [GoF 토론, RG]
  - 모든 래퍼가 기능을 덧붙이기만 하고 흐름을 끊으면 안 됨 → Decorator [RG]

### 비교 대상
- vs Decorator: 구조가 매우 비슷(재귀 합성으로 실행을 일련의 객체에 통과)하나, CoR 처리자는 서로 독립적인 임의 작업을 하고 어느 지점에서든 전달을 멈출 수 있음 / Decorator는 기본 인터페이스와 일관되게 행위를 확장하며 요청 흐름을 끊지 않음 ([RG] CoR Relations). 오인하기 쉬운 모양: `handle(r) { log(r); next.handle(r); }` — 모든 노드가 무조건 `next`를 호출하고 부가 작업만 하면 이름은 Handler여도 의도는 Decorator [노트]
- vs Observer: CoR은 잠재 수신자 사슬을 따라 순차 전달해 하나가 처리 / Observer는 수신자가 동적으로 구독·해제하고 통지는 등록된 모두에게 ([RG] 발신자-수신자 연결 4방식, [GoF 토론] "Decoupling Senders and Receivers"). 오인 모양: `for (l : listeners) if (l.handle(e)) break;` — `break`로 멈추면 CoR 변형, 멈춤 없이 모두 호출하면 Observer 통지 루프 [노트]
- vs Command: 요청 자체를 Command 객체로 표현해 사슬로 넘기거나, 처리자를 Command로 구현 ([RG], [GoF] Implementation "requests as objects", Command Known Uses의 THINK `Task`가 사슬로 전달). 경쟁이 아니라 결합 관계
- vs Composite: Composite의 부모 링크가 successor 역할을 함 ([GoF] Related Patterns, Composite Related Patterns)
- vs Mediator: 둘 다 발신자-수신자를 분리하나, 인터페이스가 고정돼 임의 디스패치를 쓰면 타입 안전성이 떨어지는 점은 같음. CoR은 사슬이 이미 시스템 구조의 일부이고 여러 객체 중 하나가 처리할 위치에 있을 때 좋음 ([GoF 토론])

### 세 언어 구현 쟁점
- Java:
  - 고전형은 `abstract class Handler { private Handler next; … }` + `setNext` 체이닝. 사슬 끝 `null` 처리(기본 처리자 또는 null 검사)가 흔한 함정 [노트]
  - Jakarta Servlet `Filter.doFilter(req, res, FilterChain chain)`은 처리자가 successor 필드를 갖지 않고 컨테이너가 준 `FilterChain`으로 다음 필터(또는 체인 끝 자원)를 호출하거나, 호출하지 않아 요청을 차단함 (Javadoc) — GoF "successor 링크는 선택" 변형의 실례
  - `java.util.logging.Logger`는 기본적으로 부모 로거에도 출력을 보냄(`setUseParentHandlers`) (Javadoc) — "처리한 뒤에도 계속 전달"하는 변형이라 정통형(처리하면 멈춤)과 판정을 구분해야 함 [노트]
- TypeScript:
  - 함수형 미들웨어 `(req, res, next) => …`가 관용 — Express 문서: 미들웨어가 요청-응답 사이클을 끝내지 않으면 `next()`를 호출해 제어를 넘겨야 하며, 그렇지 않으면 요청이 매달린 채 남음 → "`next` 호출 누락"이 대표 함정
  - DOM 이벤트는 부모 요소로 버블링되고 `stopPropagation()`으로 중단 (MDN) — 사슬 중단의 표준 API
  - 구조적 타이핑이라 `handle` 메서드 모양만 맞으면 Handler로 통과 (TS 핸드북 Type Compatibility) — 의도하지 않은 객체가 사슬에 들어갈 수 있음 [노트]
- Rust (std만):
  - refactoring.guru Rust 예제: 제네릭으로 사슬 타입을 정적으로 표현하면 "다음의 다음" 링크 타입까지 전부 알아야 해 어렵고, `Box<dyn Handler>`로 연결하면 어떤 조합이든 가능 → `Option<Box<dyn Handler>>` 필드가 관용
  - 각 처리자가 다음 처리자를 소유(`Box`)하는 단방향 연결이 소유권 모델과 잘 맞음. Composite 부모 링크형(자식→부모)은 강한 참조 순환을 피하려고 `Weak`가 필요 (`std::rc::Weak` 문서: 트리에서 부모→자식은 `Rc`, 자식→부모는 `Weak`)
  - 대안: `Vec<Box<dyn Handler>>`를 순회하며 `std::ops::ControlFlow`로 중단 — 문서가 "순회나 visitor처럼 사용자가 조기 종료를 고르게 할 때" 쓴다고 설명. 단 순서·중단 판단을 외부 루프가 쥐는 "목록 디스패치" 변형이 됨 [노트]

### 실제 사용처
- `jakarta.servlet.Filter` / `jakarta.servlet.FilterChain` (Jakarta Servlet 6.0) — `Filter`=ConcreteHandler, `FilterChain`=successor 링크를 대신하는 체인 객체, 체인 끝의 서블릿·정적 자원=마지막 처리자. Javadoc: 필터는 `chain.doFilter()`로 다음 엔티티를 호출하거나 넘기지 않아 요청 처리를 차단. 패턴명 명시: [RG] Java CoR 페이지가 `javax.servlet.Filter#doFilter()`를 예로 듦(단 같은 사이트 Strategy 페이지도 같은 API를 예로 듦 — 미해결 질문 참조) — https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/filter
- Spring Security `FilterChainProxy` / `SecurityFilterChain` (Spring Security 7.1.1 레퍼런스) — `FilterChainProxy`=사슬 진입점(Client가 보는 Handler), `SecurityFilterChain`=현재 요청에 호출할 필터 사슬 결정, 각 Security Filter=ConcreteHandler. 문서: 필터는 downstream 필터나 서블릿 호출을 막을 수 있음. 패턴명 명시 출처 없음 — https://docs.spring.io/spring-security/reference/servlet/architecture.html
- `java.util.logging.Logger` (Java SE 21) — Logger=ConcreteHandler, 부모 Logger=successor. 기본적으로 부모에게도 출력 전달(처리 후 계속 전달하는 변형). 패턴명 명시: [RG] Java CoR 페이지(`Logger#log()`) — https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Logger.html
- Express 미들웨어 (expressjs.com 가이드) — 미들웨어 함수=ConcreteHandler, `next`=successor 호출. 패턴명 명시 출처 없음 — https://expressjs.com/en/guide/using-middleware.html
- DOM 이벤트 버블링 (MDN) — 요소=ConcreteHandler, 부모 요소=successor, `stopPropagation()`=전달 중단. [RG]는 "GUI에서 부모 컴포넌트로 이벤트 버블링"을 CoR 대표 용례로 일반 서술(DOM 특정 아님) — https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling

### 기존 가이드 승계분
- 최소 조건 취지: ① 사슬의 모든 처리자가 공통 Handler 추상 타입을 공유하고 발신자·다음 처리자는 그 타입만 앎 ② 처리자가 다음 처리자 참조(next/successor)를 스스로 보유하고 연결이 처리자 안에 캡슐화됨 ③ 외부 디스패처가 아니라 처리자가 처리/위임을 결정 ④ 발신자는 사슬 머리만 알고 구체 처리자를 모름. 하나라도 빠지면 단순 리스트 순회나 Observer 변형으로 봄. 오해 정리: Decorator(무엇을 더하나 vs 누가 처리하나), Observer(브로드캐스트·순서 무관 vs 순차·중단 가능), 한 곳의 if/else 분기, 외부 루프가 모든 처리자를 부르는 "핸들러 목록 순회"(실무에선 CoR로 묶어 부르기도 함)
  - 원전 대조 메모: ②는 GoF가 successor 링크를 "(optional)"로 표기하고 기존 링크 사용을 허용하므로 [선택]으로 내리는 것을 검토
- 참고 자료(기존 목록 그대로):
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (1994). "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley. — Chain of Responsibility 패턴의 원전.
  - Refactoring.Guru, "Chain of Responsibility" — https://refactoring.guru/design-patterns/chain-of-responsibility
  - Jakarta EE Servlet Specification, `jakarta.servlet.Filter` / `jakarta.servlet.FilterChain` JavaDoc.
  - Spring Framework Reference, "Servlet Filters" 및 Spring Security의 `SecurityFilterChain` 문서.
  - Joshua Bloch, "Effective Java" (3rd ed.) — 인터페이스/추상 클래스 설계와 관련된 항목들이 CoR의 Handler 설계에 직접적인 가이드를 제공한다.
  - OkHttp 공식 문서, "Interceptors" — https://square.github.io/okhttp/features/interceptors/

### 출처
- [GoF 원서 HTML 사본 — Chain of Responsibility](https://www.cs.unc.edu/~stotts/GOF/hires/pat5a.htm) — Intent, Participants(successor 링크 optional), Collaborations, Consequences 3개, Implementation, Known Uses, Related Patterns(Composite) · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 행위·객체 범위 분류, 쪽 표기 223 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Decoupling Senders and Receivers(CoR·Command·Observer·Mediator 비교), CoR 클래스가 Template Method를 포함하기 쉽다는 요약 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Composite](https://www.cs.unc.edu/~stotts/GOF/hires/pat4c.htm) — Related Patterns: 부모 링크를 CoR에 사용 · 조회 2026-09-17
- [refactoring.guru — Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) — Applicability, Pros/Cons, Relations(Decorator·Command·Composite·발신자-수신자 4방식), "처리하면 더 넘기지 않는" 정통형 서술 · 조회 2026-09-17
- [refactoring.guru — Chain of Responsibility in Java](https://refactoring.guru/design-patterns/chain-of-responsibility/java/example) — 사용 예 `javax.servlet.Filter#doFilter()`, `java.util.logging.Logger#log()`, GUI 이벤트 버블링 · 조회 2026-09-17
- [refactoring.guru — Chain of Responsibility in Rust](https://refactoring.guru/design-patterns/chain-of-responsibility/rust/example) — `Box` 동적 디스패치로 사슬을 구성하는 이유 · 조회 2026-09-17
- [Jakarta Servlet 6.0 — Filter](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/filter) — doFilter에서 다음 엔티티 호출 또는 차단 · 조회 2026-09-17
- [Jakarta Servlet 6.0 — FilterChain](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/filterchain) — 다음 필터 또는 체인 끝 자원 호출 · 조회 2026-09-17
- [Spring Security Reference — Servlet Architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html) — FilterChainProxy·SecurityFilterChain 역할, 필터의 downstream 차단 (문서 버전 7.1.1) · 조회 2026-09-17
- [Java SE 21 — java.util.logging.Logger](https://docs.oracle.com/en/java/javase/21/docs/api/java.logging/java/util/logging/Logger.html) — 부모 로거로 출력 전달, setUseParentHandlers · 조회 2026-09-17
- [Express — Using middleware](https://expressjs.com/en/guide/using-middleware.html) — next() 호출 규칙과 미호출 시 요청이 매달림 · 조회 2026-09-17
- [MDN — Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling) — 버블링과 stopPropagation() · 조회 2026-09-17
- [TypeScript Handbook — Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — 구조적 서브타이핑 · 조회 2026-09-17
- [Rust std — std::rc::Weak](https://doc.rust-lang.org/std/rc/struct.Weak.html) — 순환 참조 방지, 부모 역참조에 Weak · 조회 2026-09-17
- [Rust std — std::ops::ControlFlow](https://doc.rust-lang.org/std/ops/enum.ControlFlow.html) — 순회·visitor에서 조기 종료 선택 용도 · 조회 2026-09-17

### 미해결 질문
- [RG]가 `javax.servlet.Filter#doFilter()`를 Java CoR 페이지와 Java Strategy 페이지 양쪽에서 예로 듦 — 가이드에서 어느 패턴 사례로 쓸지 기준 필요([노트] 판단: `FilterChain`으로 다음을 호출하거나 차단하는 구조라 CoR 쪽이 맞아 보임)
- "모든 처리자가 처리하고 계속 넘기는" 변형(서블릿 필터 대부분, Logger 부모 전달)을 정통형과 같은 [필수] 조건으로 판정할지 — GoF participant 설명은 "처리 가능하면 처리, 아니면 전달", [RG]는 "처리 후 넘길지 결정"도 CoR로 봄
- Express 미들웨어·DOM 버블링·Spring Security 필터 사슬을 CoR이라고 명시한 1차/공식 출처는 확인하지 못함
- 기존 참고 자료의 OkHttp Interceptors 문서와 Effective Java 관련 항목은 이번에 확인 안 함

## Command (커맨드)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 233쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함). 별칭: Action, Transaction
- 의도(intent): 요청을 객체로 캡슐화해, 서로 다른 요청으로 클라이언트를 매개변수화하고, 요청을 큐에 넣거나 로그로 남기며, 되돌릴 수 있는(undoable) 연산을 지원 [GoF]
- participants [GoF]:
  - `Command` — 연산 실행 인터페이스 선언
  - `ConcreteCommand` (PasteCommand, OpenCommand) — Receiver 객체와 액션 사이의 바인딩 정의. Receiver의 해당 연산을 호출해 `Execute` 구현
  - `Client` (Application) — ConcreteCommand를 만들고 receiver 설정
  - `Invoker` (MenuItem) — 커맨드에게 요청 수행을 요구
  - `Receiver` (Document, Application) — 요청 수행에 딸린 연산을 수행하는 법을 앎. 어떤 클래스든 Receiver가 될 수 있음
- collaborations [GoF]:
  1. Client가 ConcreteCommand를 만들고 receiver를 지정 — 왜: 바인딩을 실행 시점 이전에 확정
  2. Invoker가 ConcreteCommand를 저장 — 왜: 실행 시점을 요청 생성 시점과 분리
  3. Invoker가 커맨드의 `Execute`를 호출해 요청을 발행. 커맨드가 undo 가능하면 ConcreteCommand가 `Execute` 전에 되돌리기용 상태를 저장
  4. ConcreteCommand가 receiver의 연산을 호출해 요청 수행 — 왜: Invoker를 Receiver(와 그 요청)로부터 분리
- consequences [GoF]: 연산을 호출하는 객체와 수행법을 아는 객체를 분리 · 커맨드는 일급 객체라 다른 객체처럼 조작·확장 가능 · 커맨드를 복합 커맨드로 조립(MacroCommand, 일반적으로 Composite의 사례) · 기존 클래스를 바꾸지 않고 새 Command 추가가 쉬움. 원전 Consequences는 대가를 따로 나열하지 않음. [RG] 단점: 발신자와 수신자 사이에 새 계층이 생겨 코드가 복잡해질 수 있음
- 원전 구현 쟁점(요지) [GoF]: 커맨드가 얼마나 똑똑해야 하나(receiver와 액션의 단순 바인딩 ~ receiver 없이 모든 것을 스스로 수행 ~ receiver를 동적으로 찾음) / undo·redo — Receiver, 인자, 요청 처리로 바뀔 수 있는 receiver의 원래 값을 추가 저장해야 할 수 있고, receiver는 이전 상태로 되돌리는 연산을 제공해야 함. 1단계 undo는 마지막 커맨드만, 다단계는 실행된 커맨드의 history list / 호출마다 상태가 다른 커맨드는 history에 넣기 전 복사해야 함(Prototype 역할) / undo·redo 반복 중 오차 누적(hysteresis) → Memento로 복원 정보 확보 / C++ 템플릿(undo 불가·인자 없는 커맨드)
- Applicability [GoF]: 수행할 액션으로 객체를 매개변수화(절차형 언어의 콜백을 객체지향으로 대체) · 요청을 서로 다른 시점에 지정·큐잉·실행(원래 요청과 독립된 수명, 다른 프로세스로 전송 가능) · undo(`Unexecute` + history list) · 크래시 복구용 변경 로그(load/store 추가) · primitive 연산 위의 고수준 연산(트랜잭션)으로 시스템 구조화

### 최소 조건 후보
- [필수] 요청(수행할 액션 + receiver·인자 바인딩)이 객체 또는 그에 준하는 일급 값으로 만들어져, 호출 시점과 분리돼 보관·전달될 수 있음 — 반례: 버튼 핸들러 안에서 `document.paste()`를 바로 호출하면 요청이 객체로 존재하지 않음
- [필수] Invoker는 공통 실행 인터페이스(`execute`/`run` 등)만 알고 Receiver와 구체 연산을 모름 — 반례: 메뉴 항목이 `if (cmd.equals("paste")) doc.paste();`로 분기하면 Invoker가 Receiver에 결합
- [선택] 별도 Receiver — GoF는 receiver 없이 스스로 모든 것을 수행하는 커맨드도 허용
- [선택] `undo`/`unexecute` — Applicability의 한 용도로, 인터페이스에 "추가하는" 연산 [GoF]
- [선택] history list · 큐 · 영속 로그 · MacroCommand [GoF]
- [선택] Client와 Invoker가 다른 객체 — 한 객체가 겸해도 되는지 원전 명시 없음(미해결)
- 불변식 후보(undo를 지원할 때): `execute` 후 `undo`하면 Receiver가 `execute` 직전 상태로 돌아가야 함 [GoF undo 쟁점에서 도출] · history에 들어간 커맨드는 이후 재사용으로 상태가 바뀌면 안 됨(필요하면 복사) [GoF]

### 사용 단서
- 이런 코드/요구가 보이면:
  - 메뉴·툴바 버튼·단축키가 같은 기능을 공유하고, 어떤 기능을 붙일지 설정으로 바꿔야 함 [GoF MenuItem 예, Swing `Action` Javadoc "같은 기능을 여러 컨트롤이 접근할 때"]
  - 작업을 지금 실행하지 않고 큐·스케줄러·스레드 풀에 넘김 [GoF, `Executor` Javadoc "작업 제출과 실행 방식의 분리"]
  - undo/redo, 매크로 기록, 변경 로그 재적용이 필요 [GoF, RG]
  - 코드 모양: `Map<String, Runnable> commands`, `history.push(cmd)` [노트]
- 쓰지 말아야 할 때:
  - 호출 시점·장소가 고정이고 큐잉·undo·로깅 요구가 없어 새 계층 비용만 늘어남 [RG 단점]
  - 일회성 콜백 하나를 넘기는 것뿐 — GoF가 커맨드를 "콜백의 객체지향 대체"라고 설명하므로, 일급 함수가 있는 언어에선 함수 값으로 충분한 경우가 많음 [노트]
  - undo를 역연산으로 구현하기가 어렵거나 불가능 → 상태 스냅샷(Memento) 쪽 검토 [RG Command Applicability]

### 비교 대상
- vs Strategy: 둘 다 어떤 액션으로 객체를 매개변수화할 수 있어 비슷해 보이지만 의도가 매우 다름 — Command는 임의의 연산을 객체로 바꿔(연산의 매개변수가 필드가 됨) 실행 지연·큐잉·이력 저장·원격 전송을 가능하게 하고, Strategy는 같은 일을 하는 서로 다른 방법을 한 컨텍스트 안에서 교체 ([RG] Command·Strategy Relations). 오인 모양: `class Button { Runnable onClick; }`(서로 다른 요청을 실행만 함 → Command)와 `class Archiver { Compression c; }`(같은 목적의 방법 교체 → Strategy)는 둘 다 "인터페이스 필드 하나"라 구조로는 구분 불가 [노트]
- vs Memento: undo 구현에서 결합 — 커맨드는 대상에 연산을 수행하고, 메멘토는 커맨드 실행 직전 대상 상태를 저장 ([RG], [GoF] Related "Memento가 undo에 필요한 상태를 보관"). [GoF 토론] 둘 다 나중에 쓰는 "마법 토큰"이지만 Command는 실행이 다형적 연산이고 Memento는 인터페이스가 좁아 값으로만 전달
- vs Chain of Responsibility: 처리자를 Command로 구현하거나 요청 자체를 Command로 표현해 사슬로 넘김 ([RG]). [GoF 토론] Command는 발신자-수신자 바인딩을 별도 객체에 정의해 분리
- vs Visitor: Visitor는 서로 다른 클래스의 여러 객체에 연산을 실행할 수 있는 강화된 Command로 볼 수 있음 ([RG])
- vs Composite · Prototype: MacroCommand는 Composite, history에 넣기 전 복사되는 커맨드는 Prototype 역할 ([GoF] Related)
- vs 단순 콜백·functor: GoF Known Uses — Coplien의 functor는 함수만 유지하지만 Command는 receiver와 함수(액션) 사이의 바인딩 유지에 초점

### 세 언어 구현 쟁점
- Java:
  - `Runnable`("결과를 반환하지 않는 연산", 함수형 인터페이스)·`Callable`이 가장 가벼운 Command, `Executor`/`ExecutorService`가 Invoker — 람다로 ConcreteCommand 클래스를 생략 가능 (Javadoc)
  - undo가 필요하면 추상 메서드가 둘(`execute`/`undo`)이 되어 함수형 인터페이스가 아니므로 람다 하나로 표현 불가 → 인터페이스+클래스. Swing은 `UndoableEdit`(undo/redo 가능한 편집) + `UndoManager`(편집 목록 관리)로 제공 (Javadoc)
  - 함정: 람다가 참조하는 객체가 가변이면 history에 쌓인 커맨드의 의미도 바뀜 — GoF "history에 넣기 전 복사" 쟁점과 같은 문제 [노트]
- TypeScript:
  - 일급 함수 `() => void`가 가장 가벼운 Command. undo가 필요하면 `{ execute(): void; undo(): void }` 객체 리터럴이나 클래스
  - 함정: 클래스 메서드를 콜백으로 떼어 넘기면 `this`가 사라짐 (TS 핸드북 "this at Runtime in Classes") → 화살표 함수 필드나 `bind`
  - 함정: 커맨드를 큐·로그·워커로 보내려고 복제·직렬화할 때 함수 객체는 구조화된 복제 알고리즘으로 복제할 수 없어 `DataCloneError` (MDN) → 전송·저장이 필요한 커맨드는 `{ type: "paste", at: 3 }` 같은 데이터형 커맨드(discriminated union) + 실행기로 분리 [노트, MDN 사실 근거]
  - VS Code 확장 API는 문자열 ID로 커맨드를 등록(`registerCommand`)하고 UI·키바인딩·`executeCommand`가 같은 커맨드를 실행 — 레지스트리형 Invoker
- Rust (std만):
  - rust-unofficial 패턴 책: trait 객체(`Box<dyn Command>`), 함수 포인터, `Fn` trait 객체 세 접근. 작고 함수로 정의되면 함수 포인터(동적 디스패치 없음), 여러 함수·변수를 가진 구조체면 trait 객체가 적합 (보조 출처)
  - refactoring.guru Rust: 커맨드가 전역 컨텍스트에 대한 영구 참조를 들고 있으면 안 되고, 컨텍스트를 `execute`의 가변 매개변수로 위에서 아래로 넘기라고 권함 — 빌림 규칙 때문
  - 공식 Rust 책 21장 스레드 풀: `type Job = Box<dyn FnOnce() + Send + 'static>`을 채널로 보내 워커가 실행 = 커맨드 큐
  - 함정: `FnOnce`는 한 번만 호출 가능(Rust 책 13장) → redo처럼 재실행하는 커맨드에는 `Fn`/`FnMut` 또는 trait 필요
  - 함정: `std::process::Command`는 이름만 같은 "프로세스 빌더"(문서) — Command 패턴 사례로 인용 금지

### 실제 사용처
- `java.lang.Runnable` + `java.util.concurrent.Executor` / `ExecutorService` (Java SE 21) — `Runnable`=Command, `Executor`=Invoker(작업 제출과 실행 방식 분리), 람다가 호출하는 대상=Receiver. 패턴명 명시: [RG] Java Command 페이지("All implementations of java.lang.Runnable") — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executor.html
- `javax.swing.Action` (Java SE 21) — `Action`(`ActionListener.actionPerformed`)=Command, 버튼·메뉴 항목=Invoker. Javadoc: 같은 기능을 여러 컨트롤이 접근할 때 쓰는 `ActionListener` 확장. 패턴명 명시: [RG] Java Command 페이지 — https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/Action.html
- `javax.swing.undo.UndoableEdit` / `UndoManager` (Java SE 21) — `UndoableEdit`=undo·redo 가능한 Command, `UndoManager`=history list 관리자. 패턴명 명시 출처 없음 — https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/undo/UndoableEdit.html
- VS Code Extension API `vscode.commands.registerCommand` / `executeCommand` — 커맨드 ID↔핸들러 바인딩, UI·키바인딩·프로그램 호출이 Invoker. 패턴명 명시 출처 없음, API 버전 확인 안 함 — https://code.visualstudio.com/api/extension-guides/command
- (공식 문서 예제) Rust 책 21장 `ThreadPool::execute` + `Job` — `Job`(`FnOnce` 박스)=Command, `ThreadPool`=Invoker. 표준 라이브러리 API가 아니라 책의 예제 코드 — https://doc.rust-lang.org/book/ch21-02-multithreaded.html

### 기존 가이드 승계분
- 최소 조건 취지: ① 요청(동작 + Receiver 참조 등 매개변수)이 하나의 객체로 캡슐화 ② 모든 커맨드가 공통 실행 인터페이스(`execute()`)를 통해 호출되고 Invoker는 구체 클래스를 모름 ③ Invoker와 Receiver 분리 ④ `execute()`만 부르면 수행되도록 필요한 정보를 자기 안에 가짐(자기 완결). 1·3이 빠지면 "이름만 바꾼 메서드 호출", undo가 필요한데 4가 빠지면 실용성 붕괴. 오해 정리: Strategy(어떤 알고리즘 vs 어떤 작업을 언제·어디서), 람다·콜백은 분리·캡슐화 의도가 분명할 때만 패턴, `undo()`는 선택(Undoable Command는 확장형), 복잡한 복원은 Memento와 결합
  - 원전 대조 메모: ④ "자기 완결"은 GoF "커맨드가 얼마나 똑똑해야 하나"(receiver를 동적으로 찾는 커맨드도 허용)와 긴장 — [필수] 유지 여부 검토
- 참고 자료(기존 목록 그대로):
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (GoF, 1994) — Command 패턴 원전.
  - Eric Freeman, Elisabeth Robson, "Head First Design Patterns" 2nd Edition, O'Reilly, 2020 — 리모컨/주문 예시로 Command 패턴 설명.
  - Refactoring.Guru, "Command Pattern" — https://refactoring.guru/design-patterns/command
  - Oracle Java Documentation, `java.lang.Runnable`, `java.util.concurrent.ExecutorService`, `java.util.concurrent.Callable` — 표준 라이브러리에서의 커맨드 큐 구현.
  - Martin Fowler, "CQRS" — https://martinfowler.com/bliki/CQRS.html — 도메인 수준에서 Command를 일급 객체로 다루는 아키텍처 사례.
  - Joshua Kerievsky, "Refactoring to Patterns", Addison-Wesley, 2004 — 기존 코드에서 Command 패턴으로 리팩터링하는 절차.

### 출처
- [GoF 원서 HTML 사본 — Command](https://www.cs.unc.edu/~stotts/GOF/hires/pat5b.htm) — Intent, Also Known As, Applicability, Participants, Collaborations, Consequences, Implementation(undo·복사·hysteresis), Known Uses(functor와의 차이), Related Patterns · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 233 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Objects as Arguments(Command·Memento 토큰 비교), Decoupling Senders and Receivers · 조회 2026-09-17
- [refactoring.guru — Command](https://refactoring.guru/design-patterns/command) — Applicability(undo 두 방식), Pros/Cons, Relations(Strategy·Memento·CoR·Visitor·Prototype) · 조회 2026-09-17
- [refactoring.guru — Command in Java](https://refactoring.guru/design-patterns/command/java/example) — 사용 예 Runnable, javax.swing.Action · 조회 2026-09-17
- [refactoring.guru — Command in Rust](https://refactoring.guru/design-patterns/command/rust/example) — 전역 컨텍스트를 영구 참조하지 말고 execute 매개변수로 전달 · 조회 2026-09-17
- [Rust Design Patterns (rust-unofficial) — Command](https://rust-unofficial.github.io/patterns/patterns/behavioural/command.html) — trait 객체·함수 포인터·Fn trait 객체 접근과 선택 기준(보조 출처) · 조회 2026-09-17
- [Java SE 21 — Runnable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Runnable.html) — 결과 없는 연산, 함수형 인터페이스 · 조회 2026-09-17
- [Java SE 21 — Executor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executor.html) — 작업 제출과 실행 메커니즘 분리 · 조회 2026-09-17
- [Java SE 21 — javax.swing.Action](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/Action.html) — 여러 컨트롤이 같은 기능에 접근하는 ActionListener 확장 · 조회 2026-09-17
- [Java SE 21 — javax.swing.undo.UndoableEdit](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/undo/UndoableEdit.html) — undo/redo 가능한 편집, UndoManager와 함께 사용 · 조회 2026-09-17
- [Java SE 21 — javax.swing.undo.UndoManager](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/undo/UndoManager.html) — UndoableEdit 목록 관리 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — this at Runtime in Classes · 조회 2026-09-17
- [MDN — The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — 함수 객체 복제 시 DataCloneError · 조회 2026-09-17
- [VS Code API — Commands](https://code.visualstudio.com/api/extension-guides/command) — registerCommand/executeCommand · 조회 2026-09-17
- [The Rust Programming Language — 21.2 Turning Our Single-Threaded Server into a Multithreaded Server](https://doc.rust-lang.org/book/ch21-02-multithreaded.html) — `type Job = Box<dyn FnOnce() + Send + 'static>` · 조회 2026-09-17
- [The Rust Programming Language — 13.1 Closures](https://doc.rust-lang.org/book/ch13-01-closures.html) — FnOnce/FnMut/Fn 구분 · 조회 2026-09-17
- [Rust std — std::process::Command](https://doc.rust-lang.org/std/process/struct.Command.html) — "A process builder" · 조회 2026-09-17

### 미해결 질문
- Client와 Invoker가 같은 객체인 경우(람다를 만들어 곧바로 executor에 넘김)도 [필수] 조건 충족으로 볼지 — GoF는 역할을 나누지만 겸할 수 있는지 명시 없음
- `UndoableEdit`/`UndoManager`, VS Code 커맨드 API를 Command 패턴이라고 명시한 공식·신뢰 출처 확인 못 함
- 기존 가이드 조건 ④(자기 완결)를 [필수]로 둘지
- 기존 참고 자료의 Head First·Refactoring to Patterns·Fowler CQRS 내용은 이번에 확인 안 함

## Interpreter (인터프리터)

### 원전 대응
- 분류: 행위 · **클래스** 범위 [GoF 표 1.1]. 원서 243쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함)
- 의도(intent): 언어가 주어지면 그 문법의 표현(representation)과, 그 표현으로 언어의 문장을 해석하는 인터프리터를 함께 정의 [GoF]
- participants [GoF]:
  - `AbstractExpression` (RegularExpression) — 추상 구문 트리(AST)의 모든 노드에 공통인 추상 `Interpret` 연산 선언
  - `TerminalExpression` (LiteralExpression) — 문법의 단말 기호에 대한 `Interpret` 구현. 문장 속 단말 기호마다 인스턴스가 필요
  - `NonterminalExpression` (AlternationExpression, RepetitionExpression, SequenceExpression) — 문법 규칙 `R ::= R1 R2 … Rn` 하나마다 클래스 하나. R1~Rn 각각에 대한 AbstractExpression 타입 인스턴스 변수 보유. 비단말 기호의 `Interpret` 구현 — 보통 R1~Rn 변수에 대해 재귀 호출
  - `Context` — 인터프리터 전역 정보 보유
  - `Client` — 문법이 정의하는 언어의 특정 문장을 나타내는 AST를 구축하거나 받음(Nonterminal·Terminal 인스턴스로 조립). `Interpret` 호출
- collaborations [GoF]:
  1. Client가 문장을 Nonterminal·Terminal 인스턴스의 AST로 구축(또는 받음) — 왜: 파싱은 패턴 범위 밖, 해석은 트리를 입력으로 함
  2. Client가 Context를 초기화하고 `Interpret` 호출
  3. 각 NonterminalExpression 노드는 하위 표현식들의 `Interpret`로 자기 `Interpret`를 정의하고, TerminalExpression의 `Interpret`가 재귀의 기저가 됨 — 왜: 의미를 트리 구조를 따라 합성
  4. 각 노드의 `Interpret`는 Context로 인터프리터 상태를 저장·조회
- consequences [GoF]:
  - 얻는 것: 문법 변경·확장이 쉬움(규칙이 클래스이므로 상속으로 점진 수정) · 문법 구현이 쉬움(노드 클래스 구현이 비슷하고 생성 자동화 가능) · 새 해석 방법 추가(예쁜 출력·타입 검사) — 계속 늘면 Visitor로 문법 클래스 변경 회피
  - 대가: 복잡한 문법은 유지보수가 어려움(규칙마다 최소 클래스 하나, BNF 규칙 하나에 여러 클래스가 필요할 수도) — 문법이 매우 복잡하면 파서·컴파일러 생성기가 더 적합
- 원전 구현 쟁점(요지) [GoF]: AST 생성은 패턴이 다루지 않음(테이블 기반 파서, 손으로 쓴 재귀 하강 파서, 클라이언트가 직접) / `Interpret`를 표현식 클래스에 꼭 정의할 필요 없음 — 새 해석이 자주 생기면 Visitor로 분리 / 같은 단말 기호가 많이 나오면 Flyweight로 공유(내재 상태 vs 전달 상태) / Composite과 구현 쟁점을 많이 공유
- Applicability [GoF]: 해석할 언어가 있고 문장을 AST로 표현할 수 있을 때. 특히 문법이 단순하고 효율이 핵심 관심사가 아닐 때 잘 맞음(가장 효율적인 인터프리터는 파스 트리를 직접 해석하지 않고 다른 형태로 변환, 예: 정규식 → 상태 기계. 그 변환기 자체는 이 패턴으로 구현 가능)
- Known Uses [GoF]: Smalltalk 컴파일러 등 객체지향 컴파일러, SPECTalk(입력 파일 형식 기술 해석), QOCA(제약 평가). "가장 일반적인 형태로 보면 Composite을 쓰는 거의 모든 곳에 Interpreter가 들어 있지만, 클래스 계층을 언어 정의로 생각하려는 경우로 한정해야 한다"

### 최소 조건 후보
- [필수] 해석 대상인 작은 언어(문법)가 있고, 그 문장이 노드 객체의 트리(AST)로 표현됨 — 반례: 문자열을 받자마자 한 함수에서 `if (op == "+") …`로 평가하면 표현(representation)이 없음
- [필수] 문법 기호가 노드 타입에 대응 — 단말 기호 노드(Terminal)와, 하위 표현식을 필드로 보유하는 규칙별 비단말 노드(Nonterminal) — 반례: 모든 노드가 `Map<String, Object>` 한 타입이면 규칙이 타입으로 드러나지 않음
- [필수] 해석이 트리를 따라 재귀적으로 합성됨(비단말의 의미 = 하위 해석의 조합, 단말이 기저) — 반례: 트리를 만들고도 해석은 별도의 평탄한 명령 목록을 실행하면 이 패턴이 아닌 컴파일 기법
- [선택] 해석 연산이 노드 클래스 안(`interpret(Context)`)에 있음 — GoF가 Visitor로 분리하는 것을 허용
- [선택] Context 객체 — 원전 참여자이지만 변수 바인딩·입력 위치 같은 전역 정보가 없으면 비어 있을 수 있음 [노트]
- [선택] 파서 — 패턴 범위 밖 [GoF]
- [선택] 단말 노드 공유(Flyweight) [GoF]
- 불변식 후보: AST는 유한·비순환 트리(원전 "AST는 Composite의 사례") · Terminal의 해석은 하위 호출 없이 끝남(재귀 기저) [GoF collaborations에서 도출]

### 사용 단서
- 이런 코드/요구가 보이면:
  - 사용자·설정이 작은 규칙 언어를 입력하고 그것을 반복 평가(검색 필터식 `status = open AND priority > 2`, 계산식, 권한 규칙, 정규식 유사 매칭) [노트, GoF 모티베이션은 정규식]
  - 조건·연산 조합을 트리로 쌓고 같은 트리를 여러 입력에 대해 평가 [노트]
- 쓰지 말아야 할 때:
  - 문법이 크거나 자주 확장됨 → 클래스 폭증, 파서·컴파일러 생성기가 적합 [GoF]
  - 성능이 핵심 — 트리를 직접 해석하는 방식은 느릴 수 있음, 다른 형태로 변환 필요 [GoF]
  - 해석 연산 종류(평가·출력·최적화·타입 검사)가 계속 늘어남 → Interpret를 노드에 두지 말고 Visitor로 [GoF]

### 비교 대상
- vs Composite: AST 자체가 Composite의 사례. 구분 기준은 "그 클래스 계층을 언어(문법)로 보느냐" ([GoF] Related Patterns, Known Uses). 오인 모양: `Folder`/`File` 트리에 `size()`를 재귀 합산 — 구조는 같지만 문법이 없으므로 Composite
- vs Visitor: Interpreter는 해석 연산을 노드 클래스에 분산, 연산 종류가 늘면 Visitor로 한 클래스에 모음 ([GoF] Consequences·Implementation·Related). 오인 모양: `ast.accept(new EvalVisitor(ctx))` — 해석을 Visitor로 옮긴 Interpreter(두 패턴 결합)이며 "Visitor라서 Interpreter가 아니다"가 아님 [노트]
- vs Iterator · Flyweight: 인터프리터가 Iterator로 구조를 순회, Flyweight로 단말 기호 공유 ([GoF] Related)
- vs State: 파싱 문맥 정의에 State를 쓸 수 있음 ([GoF 토론] Summary)
- vs 파서 생성기(ANTLR 등): 복잡한 문법엔 파서 생성기가 더 나은 대안이며 AST를 만들지 않고 해석할 수도 있음 ([GoF] Applicability). 패턴은 파싱을 다루지 않음
- vs Strategy(기존 가이드 주장): Strategy는 단일 알고리즘 교체, Interpreter는 트리로 의미 합성 — 원전 직접 비교 없음 [노트]

### 세 언어 구현 쟁점
- Java:
  - 고전형 `interface Expr { int interpret(Context c); }` + 노드 클래스
  - Java 21: `sealed interface` + `record` 노드 + `switch` 패턴 매칭으로 해석 함수를 노드 밖에 둘 수 있음. JEP 441 예제가 바로 식 평가 `eval`이며 "이런 패턴 매칭이 없으면 번거로운 visitor 패턴이 필요"라고 명시. sealed 계층에 대한 패턴 `switch`는 망라적(exhaustive)이어야 해 노드 추가 시 누락이 컴파일 단계에서 드러남 (JEP 441·409)
  - 함정: 위 형태는 GoF의 "노드마다 Interpret" 대신 "한 함수에서 분기" — [선택] 조건(해석 위치)만 바뀐 것이고 AST와 재귀 합성은 유지돼야 이 패턴 [노트]
- TypeScript:
  - discriminated union AST `type Expr = { kind: "num"; value: number } | { kind: "add"; left: Expr; right: Expr }` + `switch (e.kind)` + `never` 망라성 검사 (TS 핸드북 Narrowing). 클래스형도 가능
  - 함정: 입력 문자열을 `eval`/`new Function`으로 실행하는 것은 이 패턴이 아니며 보안 문제 [노트]
- Rust (std만):
  - `enum Expr { Num(i64), Add(Box<Expr>, Box<Expr>) }` — 자기 자신을 직접 담는 재귀 enum은 크기를 알 수 없어 컴파일 오류, `Box` 등 간접 참조 필요 (Rust 책 15.1 cons list). `match`가 망라성 보장
  - trait 객체형 `Box<dyn Expression>`도 가능. Context는 노드가 보관하지 말고 `&mut Context` 매개변수로 전달하는 편이 빌림 규칙과 맞음 [노트]
  - rust-unofficial 패턴 책의 Interpreter 페이지는 재귀 하강 파서로 중위식을 후위식으로 바꾸는 예와 `macro_rules!`를 들며 "문법·파서 구현이 이 패턴이라는 인식은 오해"라고 함 — GoF(파싱은 범위 밖, AST 해석이 핵심)와 초점이 달라 보조 출처로만 사용

### 실제 사용처
- Spring Expression Language `org.springframework.expression.spel.SpelNode` (Spring Framework 7.0.9) — Javadoc: 파싱된 SpEL 식의 AST 노드, `getValue(ExpressionState)`로 "식 노드를 평가". `SpelNode`=AbstractExpression, `ExpressionState`=Context, `OpAnd`·`OpPlus`·`Ternary` 등=NonterminalExpression, `IntLiteral`·`StringLiteral`·`NullLiteral` 등=TerminalExpression(구현 클래스 목록은 Javadoc "All Known Implementing Classes"). 패턴명 명시 출처 없음 — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/expression/spel/SpelNode.html
- OpenJDK `java.util.regex.Pattern` 내부 `Node` 계층 (jdk-21-ga 소스) — 소스 주석: "컴파일된 정규식을 나타내는 객체 트리의 구성 요소이며 각 타입이 `match()`로 자기 구문을 매칭". `Node`=AbstractExpression, `Matcher`=Context 역할(매치 상태 보관), `Slice` 계열=Terminal 성격, `Branch`·`Loop`=Nonterminal 성격. 비공개 내부 구현(버전에 따라 바뀔 수 있음)이고 노드가 `next`로 이어진 연결 구조라 GoF의 순수 트리와 다름. 패턴명 명시 출처 없음 — https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/util/regex/Pattern.java
- (역사적) GoF Known Uses — Smalltalk 컴파일러, SPECTalk, QOCA

### 기존 가이드 승계분
- 최소 조건 취지: ① 모든 노드가 공통 추상 표현식 인터페이스(`interpret(Context)`)로 다형적으로 호출됨(switch로 노드 종류를 분기하면 아님) ② 문법 규칙과 클래스가 1:1 대응(Terminal/Nonterminal 구분) ③ Nonterminal이 자식 표현식을 보유하고 재귀 호출로 결과 합성 ④ 변수 바인딩 등 공유 정보는 Context로 전달(단순 식이면 생략 가능). ①과 ③이 정체성. 오해 정리: ANTLR·JavaCC 같은 파서 생성기 자체는 이 패턴이 아님, 거대한 switch 평가 함수, Visitor(노드가 평가 보유 vs 외부 방문자가 담당), Strategy(트리 여부로 판별)
  - 원전 대조 메모: ①은 GoF Implementation("Interpret를 표현식 클래스에 정의하지 않아도 되며 Visitor로 분리 가능")과 충돌 — [선택]으로 낮출지 검토
- 참고 자료(기존 목록 그대로):
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — Interpreter 항목.
  - Refactoring.Guru, "Interpreter" — https://refactoring.guru/design-patterns/interpreter
  - Oracle JDK 소스, `java.util.regex.Pattern` 및 내부 `Node` 계층 — Pattern 클래스가 정규식 노드 트리를 어떻게 구성·평가하는지 살펴볼 수 있는 표준 사례.
  - Martin Fowler, "Domain-Specific Languages", Addison-Wesley, 2010 — 인터프리터 패턴의 한계와 외부/내부 DSL, 파서 제너레이터(ANTLR 등)와의 비교가 상세히 다뤄진다.
  - Joshua Kerievsky, "Refactoring to Patterns", Addison-Wesley, 2004 — "Replace Conditional Dispatcher with Command/Interpreter" 항목.

### 출처
- [GoF 원서 HTML 사본 — Interpreter](https://www.cs.unc.edu/~stotts/GOF/hires/pat5c.htm) — Intent, Applicability, Participants, Collaborations, Consequences, Implementation(파싱 범위 밖·Visitor·Flyweight), Known Uses, Related Patterns · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 클래스 범위 분류, 쪽 표기 243 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Interpreter가 State로 파싱 문맥 정의 · 조회 2026-09-17
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441) — Java 21 정식, eval 예제와 "cumbersome visitor pattern" 서술, 망라성 · 조회 2026-09-17
- [JEP 409: Sealed Classes](https://openjdk.org/jeps/409) — Java 17 정식, 패턴 망라성 분석의 토대 · 조회 2026-09-17
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — discriminated unions, never 망라성 검사 · 조회 2026-09-17
- [The Rust Programming Language — 15.1 Using Box<T>](https://doc.rust-lang.org/book/ch15-01-box.html) — 재귀 타입 "infinite size" 오류와 Box 간접 참조 · 조회 2026-09-17
- [Rust Design Patterns (rust-unofficial) — Interpreter](https://rust-unofficial.github.io/patterns/patterns/behavioural/interpreter.html) — 재귀 하강 파서 예, macro_rules! 언급(보조 출처) · 조회 2026-09-17
- [Spring Framework 7.0.9 API — SpelNode](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/expression/spel/SpelNode.html) — AST 노드, getValue(ExpressionState), 구현 클래스 목록 · 조회 2026-09-17
- [OpenJDK jdk-21-ga — Pattern.java](https://github.com/openjdk/jdk/blob/jdk-21-ga/src/java.base/share/classes/java/util/regex/Pattern.java) — 내부 Node 계층 주석과 match() 구조 · 조회 2026-09-17

### 미해결 질문
- refactoring.guru에는 Interpreter 페이지가 없음 — 기존 가이드 참고 자료의 `https://refactoring.guru/design-patterns/interpreter`는 2026-09-17 조회 시 HTTP 404, 패턴 카탈로그 페이지에도 Interpreter 항목 없음. 새 가이드 참고 자료에서 이 링크를 뺄지 결정 필요(보조 비교 출처도 부족)
- Java·TS·Rust 현행 표준/주요 라이브러리 중 공식 문서가 "Interpreter 패턴"이라고 명시한 사례 확인 못 함. 기존 가이드가 표준 사례로 든 `java.util.regex.Pattern`은 비공개 내부 구현이라 공개 문서 근거가 없음
- sealed+record+switch, TS union switch, Rust enum match 형태(해석이 노드 밖)를 가이드에서 Interpreter 구현으로 인정할지 판정 기준 필요
- 기존 참고 자료의 Fowler *Domain-Specific Languages*, Kerievsky 항목명은 이번에 확인 안 함

## Iterator (반복자)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 257쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함). 별칭: Cursor
- 의도(intent): 집합(aggregate) 객체의 내부 표현을 드러내지 않고 그 원소들에 순차적으로 접근하는 방법을 제공 [GoF]
- participants [GoF]:
  - `Iterator` — 원소 접근·순회 인터페이스 정의
  - `ConcreteIterator` — Iterator 인터페이스 구현. 집합 순회에서 현재 위치를 추적
  - `Aggregate` — Iterator 객체를 생성하는 인터페이스 정의
  - `ConcreteAggregate` — Iterator 생성 인터페이스를 구현해 알맞은 ConcreteIterator 인스턴스 반환
- collaborations: 원문은 "ConcreteIterator가 집합의 현재 객체를 추적하고 순회상 다음 객체를 계산할 수 있다" 한 문장 [GoF]. 단계 분해(1·2는 participants에서 도출) [노트]:
  1. 클라이언트가 Aggregate에 반복자를 요청 — 왜: 클라이언트는 집합의 구체 표현을 모름
  2. ConcreteAggregate가 자기 구조에 맞는 ConcreteIterator를 만들어 반환
  3. (외부 반복자) 클라이언트가 다음 원소를 요청하면 ConcreteIterator가 현재 위치를 근거로 다음 원소를 계산하고 위치를 전진
  4. 순회 종료를 반복자가 알려줌(IsDone / `hasNext` false / `None`)
- consequences [GoF]: 집합 순회 방식의 변형 지원(반복자 인스턴스만 바꾸면 순회 알고리즘 변경, 서브클래스로 새 순회 추가) · Aggregate 인터페이스 단순화 · 한 집합에 둘 이상의 순회를 동시에 진행(각 반복자가 자기 순회 상태 보유). 원전 Consequences에는 대가 항목이 없고, 구현 쟁점에서 순회 중 집합 변경의 위험(견고성)을 다룸. [RG] 단점: 단순 컬렉션만 다루면 과함, 특화 컬렉션을 직접 순회하는 것보다 덜 효율적일 수 있음
- 원전 구현 쟁점(요지) [GoF]: 누가 반복을 제어하나 — 외부 반복자(클라이언트가 진행)는 더 유연(두 컬렉션 비교 쉬움), 내부 반복자(반복자가 연산을 각 원소에 적용)는 쓰기 쉬움 / 누가 순회 알고리즘을 정의하나 — 집합이 정의하고 반복자는 상태만 보관하면 cursor(Memento의 단순한 예, 각주) / 견고성 — 순회 중 삽입·삭제가 순회를 방해하지 않는 robust iterator, 복사는 일반적으로 비쌈 / 최소 인터페이스 `First`·`Next`·`IsDone`·`CurrentItem`(하나로 합칠 수도 있음) / 다형적 반복자는 팩토리 메서드·동적 할당 비용이 있어 다형성이 필요할 때만 / 특권 접근(friend) / Composite용 반복자(외부 반복자는 경로 저장 필요, 내부 반복자가 쉬움) / NullIterator
- Applicability [GoF]: 내부 표현을 노출하지 않고 집합 내용에 접근 · 여러 순회 지원 · 서로 다른 집합 구조를 균일한 인터페이스로 순회(다형적 반복)
- Known Uses [GoF]: Booch components 큐(추상 Queue 인터페이스로 반복자를 구현해 팩토리 메서드 불필요) · Smalltalk 컬렉션의 내부 반복자 `do:`와 외부 반복자 `ReadStream` · ET++ 다형적 반복자 · Unidraw 커서 기반 반복자 · ObjectWindows 2.0

### 최소 조건 후보
- [필수] 순회 상태(현재 위치)를 집합 객체 자체가 아니라 반복자(또는 커서·호출 스택)가 보유 — 반례: 컬렉션에 `currentIndex` 필드를 두고 `next()`를 컬렉션이 제공하면 동시에 두 순회를 할 수 없음(원전 consequence 3 위반)
- [필수] 클라이언트가 인덱스·노드 포인터 같은 내부 표현에 의존하지 않고 순회 인터페이스로만 원소를 얻음 — 반례: `for (int i = 0; i < arr.length; i++) arr[i]`는 인덱스 표현에 의존(원전 의도 "내부 표현을 드러내지 않고")
- [필수] "다음 원소 얻기"와 "끝났는지 알기"가 반복자 연산으로 제공됨(분리하든 합치든) — 반례: 끝을 알려면 클라이언트가 `size()`와 비교해야 한다면 표현 의존 [GoF 최소 인터페이스에서 도출]
- [선택] Aggregate의 반복자 생성 메서드(팩토리 메서드) — 원전 participant이지만 Known Uses(Booch 큐)는 팩토리 없이도 구현, 다형적 반복자일 때 필요
- [선택] 서로 다른 집합을 같은 추상 인터페이스로 순회(다형적 반복) — GoF는 "다형성이 필요할 때만" 쓰라고 함
- [선택] 외부/내부 반복자 선택 — 둘 다 이 패턴 [GoF]
- [선택] `remove`·`previous`·`skipTo` 등 추가 연산 [GoF]
- [선택] 순회 중 변경에 대한 견고성 또는 fail-fast 감지
- 불변식 후보: 순회 중 반복자 밖에서 집합이 구조적으로 변경되면 동작이 정의되지 않거나(Java `Iterator.remove` 문서: 명세되지 않음) 감지돼야 함 · 끝에 도달한 뒤의 동작은 언어마다 다름 — Rust `Iterator::next`는 `None` 뒤에 다시 `Some`을 줄 수도 있어 `fuse()`로 보장해야 함(std 문서), Java `next()`는 원소가 없으면 `NoSuchElementException` (Javadoc)

### 사용 단서
- 이런 코드/요구가 보이면:
  - 트리·그래프·페이지 단위 API 결과처럼 내부 구조가 복잡한 컬렉션을 클라이언트에게 숨기고 순서대로 원소를 주고 싶음 [RG]
  - 호출부마다 `node = node.next` 루프나 인덱스 계산 같은 순회 코드가 복제됨 [RG "순회 코드 중복 감소"]
  - 같은 구조를 여러 방식(전위·후위, 역순, 필터)으로 순회 [GoF consequence 1]
  - 순회를 멈췄다가 이어가거나 여러 순회를 동시에 진행 [GoF, RG]
- 쓰지 말아야 할 때:
  - 언어 표준 컬렉션·반복자로 충분한 단순한 경우 별도 반복자 클래스를 만드는 것은 과함 [RG]
  - 특화 컬렉션을 직접 접근하는 편이 확실히 효율적인 경우 [RG]
  - 원소들이 공통 부모 타입이 없고 타입별로 다른 연산이 필요 → Visitor [GoF Visitor Consequences "Visiting across class hierarchies"]

### 비교 대상
- vs Visitor: 반복자는 공통 부모 타입(`Item`)의 원소만 다룰 수 있고, 방문자는 공통 부모가 없는 서로 다른 타입의 원소도 방문 가능 ([GoF] Visitor Consequences). 함께 쓰임 — 반복자가 집합을 순회하고 방문자가 각 원소에 연산 적용 ([GoF 토론] Summary, [RG]). 오인 모양: `java.nio.file.FileVisitor` + `Files.walkFileTree` — 이름은 visitor지만 방문 연산이 원소 타입별이 아니라 순회 이벤트별(디렉터리 전/후, 파일, 실패)이고 `accept` 기반 더블 디스패치가 없어 내부 반복자 + 콜백에 가까움 [노트, Javadoc 사실 근거]
- vs Composite: 반복자는 Composite 같은 재귀 구조에 자주 적용 ([GoF] Related)
- vs Memento: 반복 상태를 메멘토로 캡처할 수 있고, 커서는 Memento의 단순한 예 ([GoF] Related·각주, [RG])
- vs Factory Method: 다형적 반복자는 팩토리 메서드로 알맞은 Iterator 서브클래스를 생성 ([GoF] Related, [RG])
- vs 인덱스 for 루프(비패턴): 클라이언트가 인덱스라는 내부 표현에 직접 의존 (기존 가이드 주장, 원전 의도와 일치) 

### 세 언어 구현 쟁점
- Java:
  - `Iterable<T>.iterator()`=Aggregate의 생성 연산, `Iterator<T>`의 `hasNext()`/`next()`=최소 인터페이스. `Iterable`을 구현하면 향상된 `for` 문(JLS 14.14.2)의 대상 (Javadoc)
  - `Iterable.forEach(Consumer)`는 내부 반복자 (Javadoc)
  - `Iterator.remove()`는 선택 연산(optional operation)이고, 이 메서드 외의 방법으로 순회 중 컬렉션을 수정하면 반복자 동작이 명세되지 않음 (Javadoc)
  - `ArrayList` 반복자는 fail-fast — 반복자 생성 후 반복자 자신의 `remove`/`add` 외 방법으로 구조가 바뀌면 `ConcurrentModificationException`을 던지되 best-effort이므로 이 예외에 프로그램 정확성을 기대면 안 됨 (Javadoc)
  - `java.util.Scanner`도 `Iterator<String>` 구현 (Javadoc)
- TypeScript:
  - JS 반복 프로토콜 — iterable은 `[Symbol.iterator]()`가 iterator를 반환하고, iterator는 `next()`가 `IteratorResult`(`{ value, done }`)를 반환 (MDN). `for...of`가 이 프로토콜을 사용
  - 생성기 함수(`function*`)로 ConcreteIterator를 짧게 구현 가능(MDN 반복 프로토콜 문서가 `[Symbol.iterator]`를 생성기로 구현하는 예 제시). 내장 `Iterator` 클래스는 `map`·`filter` 같은 헬퍼 메서드 제공 (MDN)
  - 함정: ES5 이하로 컴파일할 때 `for...of`·배열 전개의 정확한 반복 의미를 위해 `downlevelIteration` 설정이 필요 (tsconfig 문서)
  - 구조적 타이핑이라 `next()` 모양만 맞으면 iterator로 통과 [노트, 핸드북 Type Compatibility 근거]
- Rust (std만):
  - `std::iter` 모듈 설명이 "Composable external iteration" — 외부 반복자가 기본. `Iterator` trait은 필수 메서드 `next(&mut self) -> Option<Self::Item>` 하나, `map`·`fold` 등은 제공 메서드 (std 문서)
  - `IntoIterator`=Aggregate의 생성 연산, `for` 루프는 반복자 문법 설탕. `iter()`(&T)·`iter_mut()`(&mut T)·`into_iter()`(T) 세 형태가 소유권별로 다른 ConcreteIterator (std 문서)
  - 견고성: 벡터를 순회하는 `for` 본문에서 삽입·삭제를 시도하면 빌림 규칙 때문에 컴파일 오류 — 순회 중 변경 문제를 컴파일 타임에 차단 (Rust 책 8.1)
  - 함정: `next()`가 `None`을 반환한 뒤 다시 `Some`을 줄 수 있음 → 끝 이후 동작을 보장하려면 `fuse()` (std 문서) · 반복자는 lazy라 소비하지 않으면 아무 일도 일어나지 않음(컴파일러 경고) (std 문서)
  - refactoring.guru Rust: 사용자 정의 반복자도 별도 인터페이스를 만들지 말고 표준 `Iterator` trait을 구현하는 것이 권장 방식

### 실제 사용처
- `java.util.Iterator` / `java.lang.Iterable` (Java SE 21) — `Iterator`=Iterator, `Iterable`=Aggregate, `ArrayList` 등=ConcreteAggregate, 각 컬렉션의 내부 반복자 클래스=ConcreteIterator. 패턴명 명시: [RG] Java Iterator 페이지(모든 `java.util.Iterator` 구현, `Scanner`, `Enumeration`) — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html
- JS 반복 프로토콜 `Symbol.iterator` / `Iterator` (MDN) — iterable=Aggregate, iterator=Iterator, `Array`·`Map` 등 내장 iterable=ConcreteAggregate. 패턴명 명시 출처 없음 — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
- Rust `std::iter::Iterator` / `IntoIterator` (std 1.98.1) — `Iterator`=Iterator, `IntoIterator`=Aggregate, `Vec`의 `IntoIter` 등=ConcreteIterator. [RG] Rust Iterator 페이지가 표준 trait 사용을 이 패턴의 관용 구현으로 소개 — https://doc.rust-lang.org/std/iter/trait.Iterator.html

### 기존 가이드 승계분
- 최소 조건 취지: ① 컬렉션과 분리된 반복자 객체가 "현재 위치"를 관리(컬렉션에 `currentIndex`를 두면 아님) ② `hasNext()`/`next()`에 준하는 통일된 추상 순회 인터페이스에 클라이언트가 의존 ③ 인덱스·노드 같은 내부 표현 은닉(배열→연결 리스트로 바꿔도 클라이언트 코드 유지) ④ 집합 객체가 자기에 맞는 반복자를 만들어 주는 진입점(`iterator()`) 제공. 오해 정리: 외부(향상된 for)·내부(`forEach`) 반복자 모두 이 패턴, 인덱스 for 루프는 아님, `Iterable`만 구현하고 내부 리스트를 그대로 노출하면 캡슐화 깨짐, `next()` 이름만으로는 판정 불가
  - 원전 대조 메모: ④는 GoF Known Uses(Booch 큐는 팩토리 메서드 불필요)·Implementation(다형성이 필요할 때만)과 긴장 — [선택] 여부 검토
- 참고 자료(기존 목록 그대로):
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — "Iterator" 항목 (pp. 257-271)
  - Joshua Bloch, "Effective Java" (3rd Edition) — Item 58 "Prefer for-each loops to traditional for loops", Item 47 "Prefer Collection to Stream as a return type"
  - Java 공식 문서: `java.util.Iterator`, `java.lang.Iterable` (https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Iterator.html)
  - Java 공식 문서: Fail-fast iterators 동작 설명 (`ArrayList`, `HashMap`의 Javadoc 내 "fail-fast" 단락)
  - `CopyOnWriteArrayList` / `ConcurrentHashMap` Javadoc — Fail-safe(약한 일관성) 이터레이터의 사례
  - Hiroshi Yuki, "Java 언어로 배우는 디자인 패턴 입문" — Iterator 패턴 장 (BookShelf 예제의 원형)
  - Refactoring.Guru, "Iterator" (https://refactoring.guru/design-patterns/iterator)

### 출처
- [GoF 원서 HTML 사본 — Iterator](https://www.cs.unc.edu/~stotts/GOF/hires/pat5d.htm) — Intent, Also Known As, Applicability, Participants, Collaborations, Consequences, Implementation(외부/내부, cursor, robust, 최소 인터페이스), Known Uses, Related Patterns, 각주 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 257 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Visitor](https://www.cs.unc.edu/~stotts/GOF/hires/pat5k.htm) — Consequences "Visiting across class hierarchies"(Iterator와의 차이) · 조회 2026-09-17
- [refactoring.guru — Iterator](https://refactoring.guru/design-patterns/iterator) — Applicability, Pros/Cons, Relations · 조회 2026-09-17
- [refactoring.guru — Iterator in Java](https://refactoring.guru/design-patterns/iterator/java/example) — 사용 예 java.util.Iterator 구현, Scanner, Enumeration · 조회 2026-09-17
- [refactoring.guru — Iterator in Rust](https://refactoring.guru/design-patterns/iterator/rust/example) — 표준 Iterator trait 사용 권장, next만 필수 · 조회 2026-09-17
- [Java SE 21 — Iterator](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html) — hasNext/next, remove 선택 연산, 순회 중 수정 시 미명세 · 조회 2026-09-17
- [Java SE 21 — Iterable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Iterable.html) — 향상된 for 대상(JLS 14.14.2), forEach · 조회 2026-09-17
- [Java SE 21 — ArrayList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html) — fail-fast 반복자와 best-effort 주의 · 조회 2026-09-17
- [Java SE 21 — Scanner](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Scanner.html) — implements Iterator<String> · 조회 2026-09-17
- [MDN — Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) — iterable/iterator 프로토콜, Symbol.iterator · 조회 2026-09-17
- [MDN — Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) — 내장 반복자 목록과 헬퍼 메서드 · 조회 2026-09-17
- [TypeScript TSConfig — downlevelIteration](https://www.typescriptlang.org/tsconfig/downlevelIteration) — 구형 런타임 대상 반복 의미 · 조회 2026-09-17
- [Rust std — std::iter](https://doc.rust-lang.org/std/iter/index.html) — Composable external iteration, 세 형태, for 문법 설탕, laziness · 조회 2026-09-17
- [Rust std — Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html) — next 필수·제공 메서드, None 뒤 재개 가능, fuse (std 1.98.1) · 조회 2026-09-17
- [The Rust Programming Language — 8.1 Vectors](https://doc.rust-lang.org/book/ch08-01-vectors.html) — 순회 중 삽입·삭제는 컴파일 오류 · 조회 2026-09-17

### 미해결 질문
- 기존 가이드 조건 ④(Aggregate의 생성 책임 [필수])를 [선택]으로 내릴지
- 기존 참고 자료의 원서 쪽수 "pp. 257-271" — 시작 257은 표 1.1과 일치, 끝 쪽은 확인 안 함
- `CopyOnWriteArrayList`/`ConcurrentHashMap`의 약한 일관성 반복자 서술, Effective Java 아이템 번호는 이번에 확인 안 함
- `FileVisitor`를 가이드에서 Iterator 쪽 비교 사례로 쓸지 Visitor 변형 사례로 쓸지(RG는 Visitor 예로 듦)

## Mediator (중재자)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 273쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함)
- 의도(intent): 객체 집합이 상호작용하는 방식을 캡슐화하는 객체를 정의. 객체들이 서로를 명시적으로 참조하지 않게 해 느슨한 결합을 촉진하고, 상호작용을 독립적으로 바꿀 수 있게 함 [GoF]
- participants [GoF]:
  - `Mediator` (DialogDirector) — Colleague 객체와 통신하는 인터페이스 정의
  - `ConcreteMediator` (FontDialogDirector) — Colleague들을 조율해 협력 행위를 구현. 자기 동료들을 알고 유지
  - `Colleague classes` (ListBox, EntryField) — 각 Colleague 클래스는 자기 Mediator 객체를 앎. 다른 동료와 통신했을 상황마다 대신 중재자와 통신
- collaborations: 원문 "Colleague들은 Mediator와 요청을 주고받고, Mediator는 적절한 동료들 사이에 요청을 라우팅해 협력 행위를 구현한다" [GoF]. **(주의 2026-09-28 — 원문 Collaborations 절은 두 문장짜리 한 문단이고 번호 목록이 아니다. 아래 1~4 는 Motivation 소속이다.** `gof-creational-structural.md` 의 Flyweight, 같은 파일 Observer 에 이어 **세 번째로 나온 같은 유형**이라 `collaborations` 키를 인용할 때는 절마다 원문을 확인한다 — Mediator v1.0.0 집필자 확인) 모티베이션의 사건 순서(폰트 대화상자) [GoF]:
  1. 리스트 박스가 자기 director에게 변경되었다고 알림 — 왜: 동료는 누가 영향받는지 모름
  2. director가 리스트 박스에서 선택 항목을 가져옴
  3. director가 선택 항목을 입력 필드에 전달
  4. 입력 필드에 텍스트가 생겼으므로 director가 동작 버튼(예: "demibold")을 활성화 — 왜: 위젯 간 의존 규칙이 director 한 클래스에 지역화되어, 확장·교체로 바꿀 수 있음
- consequences [GoF]:
  - 얻는 것: 서브클래싱 제한(여러 객체에 흩어질 행위를 지역화, 바꾸려면 Mediator만 서브클래싱하고 Colleague는 그대로 재사용) · 동료 간 결합 분리(Colleague·Mediator를 독립적으로 변경·재사용) · 객체 프로토콜 단순화(다대다를 중재자–동료 일대다로) · 객체 협력 방식을 독립 개념으로 추상화
  - 대가: **제어 집중** — 상호작용의 복잡성을 중재자의 복잡성으로 맞바꿈. 프로토콜을 캡슐화하므로 어떤 동료보다 복잡해져 유지보수하기 어려운 단일체(monolith)가 될 수 있음. [RG]는 "God Object로 진화할 수 있음"으로 표현
- 원전 구현 쟁점(요지) [GoF]: 동료가 하나의 중재자와만 일하면 추상 Mediator 클래스 생략 가능 / Colleague–Mediator 통신 — (a) Mediator를 Observer로 구현(동료=Subject, 상태 변경 시 중재자에 통지) (b) Mediator에 특화된 통지 인터페이스를 두고 동료가 자신을 인자로 넘겨 발신자를 식별
- Applicability [GoF]: 객체 집합이 잘 정의됐지만 복잡한 방식으로 통신해 상호 의존이 비구조적이고 이해하기 어려움 · 객체가 많은 다른 객체를 참조·통신해 재사용이 어려움 · 여러 클래스에 분산된 행위를 많은 서브클래싱 없이 커스터마이즈해야 함
- Known Uses [GoF]: ET++·THINK C 대화상자의 director 객체 · Smalltalk/V for Windows `ViewManager`(=Mediator, pane=Colleague, pane끼리 직접 참조하지 않음, 이벤트 심볼 등록으로 통신) · Observer의 `ChangeManager`(주체–관찰자 사이 중재로 중복 갱신 방지) · Unidraw `CSolver`(커넥터 간 연결 제약 해결)

### 최소 조건 후보
- [필수] 협력하는 동료 객체들이 서로를 직접 참조하지 않고, 협력이 필요하면 중재자를 거침 — 반례: 리스트 박스가 입력 필드 참조를 필드로 들고 `entryField.setText()`를 직접 호출
- [필수] "사건 X가 일어나면 어느 동료에게 무엇을 시킨다"는 협력 규칙이 중재자 한 곳에 모여 있음 — 반례: 이벤트 버스만 있고 반응 규칙이 각 구독자에 흩어져 있으면 통신이 분산된 Observer ([GoF 토론]: Observer는 통신을 분산, Mediator는 캡슐화)
- [필수] 중재자는 동료들을 알고, 동료는 중재자와 통신할 수단(참조 필드 또는 호출 시 전달받는 인자)을 가짐 — 반례: 동료가 중재자를 전혀 모르고 바깥에서 호출만 당하면 Facade 구조(서브시스템은 퍼사드를 모름, [GoF] Facade Related)
- [선택] 추상 Mediator 인터페이스 — 동료가 하나의 중재자와만 일하면 생략 가능 [GoF]
- [선택] 동료→중재자 통지를 Observer 메커니즘으로 구현 [GoF]
- [선택] 동료가 자신을 인자로 넘겨 발신자를 식별 [GoF]
- 불변식 후보: 동료 사이 의존 그래프에 동료→동료 간선이 없고 모든 협력 간선은 동료↔중재자 [노트, 원전 의도에서 도출]

### 사용 단서
- 이런 코드/요구가 보이면:
  - 폼·대화상자에서 한 위젯 변경이 여러 위젯의 값·활성화를 바꿈 [GoF 모티베이션]
  - 클래스 하나를 고치면 얽힌 다른 클래스들이 줄줄이 바뀌고, 컴포넌트를 다른 화면·앱에서 재사용하지 못함 [RG, GoF]
  - 협력 방식만 다르게 하려고 컴포넌트 서브클래스를 대량으로 만듦 [RG, GoF]
  - 코드 모양: 각 컴포넌트에 `this.other1.x(); this.other2.y();` 같은 교차 참조가 컴포넌트 수의 제곱으로 늘어남 [노트]
- 쓰지 말아야 할 때:
  - 중재자가 서로 무관한 규칙 묶음까지 떠안아 God Object가 될 조짐 — 제어 집중 대가 [GoF, RG]
  - 바깥에서 서브시스템을 단방향으로 쉽게 쓰게 하는 것뿐 → Facade [GoF]
  - 한 객체의 상태 변화를 다수에게 알리기만 하면 됨 → Observer [GoF 토론, RG]

### 비교 대상
- vs Facade (PATTERNS.md 빠른 비교 페어 "동료 간 중재 vs 서브시스템 단순 진입점"): Facade는 서브시스템을 더 편한 인터페이스로 추상화하고 프로토콜이 **단방향**(퍼사드→서브시스템), 서브시스템 클래스는 퍼사드를 모르며 퍼사드는 새 기능을 정의하지 않음 / Mediator는 동료들이 제공하지 않거나 못하는 협력 행위를 가능하게 하고 프로토콜이 **다방향**, 동료는 중재자를 알고 서로 직접 대신 중재자와 통신 ([GoF] Mediator Related, Facade Related). [RG]: 둘 다 강하게 결합된 클래스들의 협력을 조직하지만 Facade 아래 서브시스템 객체는 서로 직접 통신할 수 있고, Mediator의 컴포넌트는 중재자만 앎. 오인 모양: `OrderFacade.place()`가 `inventory.reserve(); payment.charge(); shipping.schedule();`만 순서대로 부르고 각 서비스가 OrderFacade를 모름 → Facade / 각 서비스가 사건을 조정자에게 알리고 조정자가 다른 서비스를 움직임 → Mediator [노트]
- vs Observer: [GoF 토론] "경쟁 패턴" — Observer는 Observer·Subject 객체를 도입해 통신을 **분산**, Mediator는 다른 객체 사이 통신을 **캡슐화**(제약 유지 책임을 중재자에 집중). Observer 쪽이 재사용 가능한 클래스를 만들기 쉽고, Mediator 쪽이 통신 흐름을 이해하기 쉬움. [RG]: Mediator의 목표는 컴포넌트 간 상호 의존 제거, Observer의 목표는 동적 단방향 연결. 중재자를 publisher로 두고 컴포넌트가 구독하는 흔한 구현은 Observer처럼 보이지만, 모든 컴포넌트가 publisher가 되어 서로 동적으로 연결되면 중앙 중재자 없는 분산 관찰자. 오인 모양: `eventBus.publish("x")` + 각 구독자가 자기 반응 규칙 보유 → Observer / 한 핸들러 클래스가 사건별로 동료들을 조율 → Mediator [노트]
- vs Command · Chain of Responsibility: 발신자-수신자 분리의 다른 방식 — Mediator는 중재자를 통해 간접 참조. 인터페이스가 고정돼 자체 디스패치 방식을 쓰면 타입 안전성이 떨어질 수 있음 ([GoF 토론], [RG])
- vs Observer의 ChangeManager: ChangeManager는 Mediator의 사례 ([GoF] Observer Implementation·Related, Mediator Known Uses)
- vs God Object(안티패턴): 시간이 지나며 중재자가 God Object로 진화할 수 있음 ([RG] Cons)

### 세 언어 구현 쟁점
- Java:
  - 동료가 `Mediator` 인터페이스 참조를, 중재자가 동료들을 필드로 가지는 상호 참조 → 생성 순서 문제(생성 후 `setMediator` 주입 등) [노트]
  - GoF식 `changed(Colleague sender)` 통지는 중재자 쪽에 `sender == listBox` 같은 동일성 분기를 만들기 쉬움 → 사건 타입(enum·sealed 이벤트)으로 통지하면 분기가 사건 기준으로 정리됨 [노트]
- TypeScript:
  - `EventTarget`/`CustomEvent`나 Node `EventEmitter`로 동료→중재자 통지를 구현하면 GoF 구현 쟁점 (a) "Observer로 구현한 Mediator" [노트, GoF 근거]
  - 함정: 문자열 이벤트 이름은 오타가 타입 검사에 걸리지 않음 → 메시지를 discriminated union으로 정의 (TS 핸드북 Narrowing: discriminated union은 네트워크 메시지 같은 "모든 종류의 메시징 체계" 표현에 좋음)
  - `EventEmitter`는 리스너를 등록 순서대로 동기 호출 (Node 문서) — 중재 규칙의 실행 순서가 구독 순서에 좌우됨
- Rust (std만):
  - 중재자↔동료 상호 참조는 소유권 모델과 충돌. refactoring.guru Rust "Top-Down Ownership": 중재자가 모든 컴포넌트를 소유하고, 컴포넌트는 중재자 참조를 보관하지 않고 메서드 호출 인자로 받음. 컴포넌트 간 상호작용용 중재자 trait(`notify_about_arrival` 등)과 외부 이벤트를 받는 API를 구분
  - `Rc<RefCell<…>>`로 상호 참조를 흉내 내면: 통지 도중 이미 빌린 값을 다시 `borrow_mut`하면 런타임 panic (`RefCell` 문서) · 상호 `Rc`는 순환으로 메모리 누수, 한쪽을 `Weak`로 (Rust 책 15.6)
  - 대안: 동료는 id로 식별하고 중재자가 컬렉션에 보관, 동료는 "무슨 일이 일어났는지"를 반환값(메시지 enum)으로 돌려주고 중재자가 라우팅 [노트]

### 실제 사용처
- (역사적) GoF Known Uses — ET++·THINK C 대화상자 director, Smalltalk/V for Windows `ViewManager`(=ConcreteMediator, pane=Colleague), `ChangeManager`, Unidraw `CSolver`. 현행 라이브러리 아님 — https://www.cs.unc.edu/~stotts/GOF/hires/pat5e.htm
- [RG] Java Mediator 페이지 주장(보조 출처 단독): `java.util.Timer`(scheduleXXX), `Executor#execute()`, `ExecutorService`(invokeXXX·submit), `ScheduledExecutorService`(scheduleXXX), `java.lang.reflect.Method#invoke()`. Javadoc상 이 API들이 "동료 간 협력 규칙을 캡슐화"하는 구조인지 확인되지 않아 participant 대응 불명 → 가이드 사례로 채택 보류(미해결 질문) — https://refactoring.guru/design-patterns/mediator/java/example
- [RG] 서술: MVC의 Controller를 Mediator의 동의어로 봄(보조 출처, 공식 근거 없음)
- 공식 문서로 확인된 현행 Java/TS/Rust 사용처: **찾지 못함**(목표 2개 미달)

### 기존 가이드 승계분
- 최소 조건 취지: ① 동료는 다른 동료의 구체 타입·참조를 필드로 갖지 않고 협력은 반드시 중재자 경유 ② 별도 중재자 객체가 있고 동료→중재자 방향 참조가 있음 ③ "이벤트 X면 A에 a(), B에 b()" 같은 상호작용 로직이 중재자 안에 캡슐화 ④ 동료는 "무슨 일이 일어났는지"만 통지하고 수신자를 지정하지 않음. 빠지면 헬퍼 클래스나 Facade/Observer 변형. 오해 정리: Facade(단방향 창구, 서브시스템 객체끼리 대화하느냐가 결정적 차이), Observer(주체가 일방 브로드캐스트 vs 임의 동료가 발신자가 되고 중재자가 라우팅, 실무에선 결합해 구현), 전역 싱글턴이면 Mediator라는 오해, 변환 유틸리티 클래스
  - 원전 대조 메모: ④는 GoF 문장에 직접 대응이 없으나 취지는 participant 설명("다른 동료와 통신했을 상황마다 대신 중재자와 통신")과 일치
- 참고 자료(기존 목록 그대로):
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — Chapter 5 "Mediator"
  - Refactoring.Guru, "Mediator Pattern": https://refactoring.guru/design-patterns/mediator
  - Spring Framework Reference Documentation — `ApplicationContext`, `ApplicationEventPublisher` 절
  - Joshua Bloch, "Effective Java" 3rd ed. — 의존성 주입과 느슨한 결합에 관한 논의
  - `java.util.concurrent.Executor` Javadoc — 작업 제출과 실행을 분리하는 중재자적 사례

### 출처
- [GoF 원서 HTML 사본 — Mediator](https://www.cs.unc.edu/~stotts/GOF/hires/pat5e.htm) — Intent, Motivation(사건 순서), Applicability, Participants, Collaborations, Consequences, Implementation, Known Uses, Related Patterns(Facade·Observer) · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 273 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — "Should Communication be Encapsulated or Distributed?"(Mediator vs Observer), Decoupling Senders and Receivers · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Facade](https://www.cs.unc.edu/~stotts/GOF/hires/pat4e.htm) — Related Patterns: Mediator와의 차이(서브시스템 클래스는 퍼사드를 모름, 새 기능 없음) · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Observer](https://www.cs.unc.edu/~stotts/GOF/hires/pat5g.htm) — ChangeManager는 Mediator의 사례 · 조회 2026-09-17
- [refactoring.guru — Mediator](https://refactoring.guru/design-patterns/mediator) — Applicability, Pros/Cons(God Object), Relations(Facade·Observer·발신자-수신자 4방식) · 조회 2026-09-17
- [refactoring.guru — Mediator in Java](https://refactoring.guru/design-patterns/mediator/java/example) — Java 핵심 라이브러리 사용 예 주장, MVC Controller 서술 · 조회 2026-09-17
- [refactoring.guru — Mediator in Rust](https://refactoring.guru/design-patterns/mediator/rust/example) — Top-Down Ownership 접근 · 조회 2026-09-17
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — discriminated union이 메시징 체계 표현에 적합 · 조회 2026-09-17
- [Node.js v26.9.0 — Events](https://nodejs.org/api/events.html) — EventEmitter가 리스너를 등록 순서대로 동기 호출 · 조회 2026-09-17
- [Rust std — RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html) — 이미 빌린 상태에서 가변 빌림 시 panic · 조회 2026-09-17
- [The Rust Programming Language — 15.6 Reference Cycles Can Leak Memory](https://doc.rust-lang.org/book/ch15-06-reference-cycles.html) — Rc/RefCell 순환 누수와 Weak · 조회 2026-09-17
- [Java SE 21 — javax.swing.ButtonGroup](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/ButtonGroup.html) — 그룹 내 버튼 하나를 켜면 나머지를 끄는 동작(미해결 질문의 후보 근거) · 조회 2026-09-17

### 미해결 질문
- 공식 문서로 Mediator 구조가 확인되는 현행 Java/TS/Rust 사용처를 찾지 못함. 후보: `javax.swing.ButtonGroup`(Javadoc으로 동작 확인 — 버튼끼리 서로 몰라도 그룹이 상호 배제를 조율. Mediator라고 명시한 신뢰 출처는 없음)
- [RG] Java 사용 예(Timer·Executor·Method#invoke)를 채택할지 — 기존 가이드 참고 자료의 "`Executor`를 중재자적 사례"로 든 서술도 같은 근거 부족 문제
- 기존 참고 자료의 Spring `ApplicationEventPublisher`는 Spring 문서가 "표준 Observer 디자인 패턴"이라고 부름(Observer 절 참조) — Mediator 참고 자료로 남길지
- **확정(Mediator v1.0.0, 2026-09-28)** — **GoF Mediator 절 Consequences 는 5항목**이다(얻는 것 4 + 대가 1): limits subclassing · decouples colleagues · simplifies object protocols · abstracts how objects cooperate · **centralizes control**. 원서 HTML 사본에서 항목 머리 `It …` 를 전수 카운트해 확인했다. **이 노트의 「얻는 것 4 + 대가 1」 기재가 맞다.**
- **`javax.swing.ButtonGroup` 조사 결과(Mediator v1.0.0, 2026-09-28, Java 21.0.11 직접 실행)** — Javadoc 에 `ButtonModel.setGroup(ButtonGroup)`/`getGroup()` 이 공개 인터페이스로 있어 **동료→중재자 참조가 선언으로 남아 있고**, 클래스 설명이 그룹 내 상호 배제를 적는다. 실행 확인: ① `add` 전에는 `getGroup()` 이 `null` ② 뒤에는 그 그룹을 가리킴 ③ 한 버튼을 켜면 다른 버튼이 꺼짐 ④ **`setSelected(false)` 는 무시됨**(어느 버튼에도 속하지 않는 규칙). **다만 Javadoc 이 이 클래스를 Mediator 라고 부르지는 않아** 가이드도 구조 대응만 적었다. 패턴명 출처는 **여전히 미확인**.
- **비교 대상의 근거 위치를 갈라 적을 것(Mediator v1.0.0, 2026-09-28)** — **GoF Mediator 절 Related Patterns 에 실제로 나오는 이름은 Facade 와 Observer 둘뿐**이다. 이 노트 「비교 대상」의 Command·Chain of Responsibility 는 근거가 Related Patterns 가 아니라 **행위 패턴 토론(disc5)** 이다. 섞어 두면 앞 배치에서 난 귀속 오류(없는 이름을 그 절 근거로 달기)가 되풀이된다.
- **Rust 절에 `Rc::new_cyclic` 경로를 추가할 것(Mediator v1.0.0, 2026-09-28, rustc 1.95.0 실측)** — 노트는 Top-Down Ownership 과 `Rc<RefCell<…>>` 흉내만 적는데, `Rc::new_cyclic` 으로 `Weak<dyn Trait>` 를 동료에게 나눠 주는 조립이 성립한다. 함께 실측한 둘: **양쪽을 `Rc` 로 두면 `Drop` 이 한 번도 안 불리고 한쪽을 `Weak` 로 바꾸면 둘 다 불린다** · 동료가 자기 빌림을 든 채 통지하면 `RefCell already mutably borrowed` 로 패닉하고 **종료 코드 101** 이다.

## Memento (메멘토)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 283쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함). 별칭: Token
- 의도(intent): 캡슐화를 위반하지 않고 객체의 내부 상태를 포착해 외부화함으로써, 나중에 객체를 그 상태로 복원할 수 있게 함 [GoF]
- participants [GoF]:
  - `Memento` (SolverState) — Originator의 내부 상태를 저장(얼마나 저장할지는 Originator 재량). Originator 외 객체의 접근을 막음 — 사실상 인터페이스가 둘: Caretaker는 **좁은(narrow) 인터페이스**(다른 객체에 넘기기만 가능), Originator는 복원에 필요한 모든 데이터에 접근하는 **넓은(wide) 인터페이스**. 이상적으로는 그 메멘토를 만든 Originator만 내부 상태에 접근
  - `Originator` (ConstraintSolver) — 현재 내부 상태의 스냅샷을 담은 메멘토를 생성. 메멘토로 내부 상태를 복원
  - `Caretaker` (undo mechanism) — 메멘토 보관 책임. 메멘토 내용을 조작하거나 들여다보지 않음
- collaborations [GoF]:
  1. Caretaker가 Originator에게 메멘토를 요청 — 왜: 상태를 꺼내는 직접 인터페이스를 열지 않기 위해 Originator가 스스로 포장
  2. Caretaker가 메멘토를 한동안 보관
  3. 필요하면 Caretaker가 메멘토를 Originator에게 돌려주고 Originator가 복원. 되돌릴 일이 없으면 돌려주지 않을 수도 있음
  4. 메멘토는 수동적(passive) — 그것을 만든 Originator만 상태를 설정·조회
- consequences [GoF]:
  - 얻는 것: 캡슐화 경계 보존(Originator만 관리해야 하지만 바깥에 보관해야 하는 정보를 노출하지 않음) · Originator 단순화(요청된 상태 버전 관리를 클라이언트가 맡음)
  - 대가: 비용이 클 수 있음(많은 정보 복사, 잦은 생성·반환) · 좁은/넓은 인터페이스 정의가 언어에 따라 어려움 · 메멘토 관리의 숨은 비용(Caretaker는 삭제 책임이 있지만 메멘토에 얼마나 많은 상태가 있는지 모름). [RG] 추가: 동적 언어(PHP·Python·JavaScript)는 메멘토 안 상태가 그대로 유지됨을 보장할 수 없음, Caretaker가 Originator 수명주기를 추적해야 낡은 메멘토를 폐기 가능
- 원전 구현 쟁점(요지) [GoF]: 언어 지원 — 두 단계 정적 보호가 이상적, C++은 Originator를 Memento의 friend로 하고 넓은 인터페이스를 private으로 / 증분 변경 저장 — 메멘토가 예측 가능한 순서로 생성·반환되면(Command history) 변경분만 저장
- Applicability [GoF]: 객체 상태(일부)의 스냅샷을 저장해 나중에 그 상태로 복원해야 하고, **그리고** 상태를 얻는 직접 인터페이스가 구현 세부를 노출해 캡슐화를 깨는 경우(두 조건 동시)
- Known Uses [GoF]: Unidraw `CSolver` 연결 제약 · Dylan 컬렉션의 반복 상태 객체(표현이 클라이언트에게 완전히 숨겨짐) · QOCA 제약 풀이기의 증분 메멘토(순서대로만 되돌림)

### 최소 조건 후보
- [필수] Originator가 자기 상태의 스냅샷 객체를 만들고, 같은 Originator가 그것으로 자신을 복원(복원 로직이 Originator 안) — 반례: 외부 코드가 getter로 필드를 읽어 저장하고 setter로 되돌리면 캡슐화 위반(원전 Applicability 두 번째 조건이 바로 이 상황)
- [필수] 스냅샷을 보관하는 쪽(Caretaker)은 내용을 읽거나 바꾸지 않고 보관·전달만 함(좁은 인터페이스) — 반례: undo 스택이 `memento.getBalance()`를 읽어 분기하면 캡슐화 경계 붕괴
- [필수] 스냅샷은 생성 시점의 상태를 복원할 수 있어야 하므로 이후 Originator 변경에 영향받지 않음 — 원전 "snapshot" 용어에서 도출 [노트]. 반례: 내부 가변 리스트 참조를 그대로 담으면 이후 변경이 메멘토에 반영돼 복원 불가
- [선택] 언어 수준의 좁은/넓은 인터페이스 강제(C++ friend, Java private 중첩 클래스, Rust 모듈 private, JS `#` 필드) — 원전이 "언어에 따라 어렵다"고 인정
- [선택] 전체 상태 대신 증분 저장 [GoF]
- [선택] 여러 메멘토의 history(undo/redo 스택) [RG]
- [선택] 직렬화를 스냅샷 수단으로 사용 [RG Java]
- 불변식 후보: `originator.restore(originator.save())` 직후 Originator의 관찰 가능한 상태는 save 시점과 같음 [노트] · 한 Originator가 만든 메멘토를 다른 타입의 Originator가 해석하지 않음(원전 "이상적으로는 만든 Originator만 접근")

### 사용 단서
- 이런 코드/요구가 보이면:
  - undo/redo, 오류 시 이전 상태로 롤백(트랜잭션성 작업) [RG]
  - 편집기·그리기 도구·제약 풀이기에서 이전 해로 복귀 [GoF 모티베이션·Known Uses]
  - undo를 구현하려고 객체에 public getter/setter를 잔뜩 추가하고 있음 — 캡슐화 붕괴 신호 [GoF Applicability 조건 2]
- 쓰지 말아야 할 때:
  - 상태 복사·복원이 비싸거나 메멘토가 자주 생겨 메모리를 많이 씀 [GoF 비용, RG RAM]
  - 객체가 단순하고 외부 자원 링크가 없으면 Prototype 복제가 더 간단한 대안 [RG]
  - 역연산이 쉬운 변경이면 상태 저장 대신 Command의 역연산으로 undo [RG Command Applicability]
  - 상태를 그대로 공개해도 캡슐화 문제가 없는 값 객체 — 원전 적용 조건 2가 성립하지 않음 [노트]

### 비교 대상
- vs Command (undo): Command는 연산을 수행(역연산으로 되돌릴 수도), Memento는 실행 직전 상태 자체를 저장. 함께 쓰임 — 커맨드가 연산, 메멘토가 직전 상태 ([RG], [GoF] Related "Commands can use mementos"). [GoF 토론] 둘 다 나중에 쓰는 토큰이지만 Command는 다형적 실행 연산을 가지고 Memento는 인터페이스가 좁아 값으로만 전달. 오인 모양: `class DepositCommand { int amount; undo(){ account.withdraw(amount); } }`(역연산 → Command만) vs `undo(){ account.restore(snapshot); }`(스냅샷 → Command+Memento) [노트]
- vs Prototype: 객체가 단순하고 외부 자원 링크가 없거나 재연결이 쉬우면 Prototype이 Memento보다 단순한 대안 ([RG]). 구분: Prototype 복제본은 원본과 같은 공개 인터페이스를 가진 온전한 객체(새 객체를 만드는 목적), Memento는 복원 전용 불투명 토큰 [기존 가이드 요지 + GoF 의도]
- vs Iterator: 반복 상태를 메멘토로 캡처(Dylan 컬렉션), 커서는 Memento의 단순한 예 ([GoF] Related·Iterator 각주, [RG])
- vs 직렬화: 직렬화는 메멘토 구현 수단 중 하나 — [RG] Java 페이지는 `Serializable` 구현이 Memento를 "흉내낼 수 있다"고 표현. 오인 모양: 객체를 직렬화한 뒤 외부 코드가 역직렬화한 객체의 필드를 꺼내 원본에 복사하면 복원 책임이 Originator 밖이라 Memento 아님 [노트]

### 세 언어 구현 쟁점
- Java:
  - Memento를 Originator의 `static` 중첩 클래스로 두고 필드·생성자를 `private`으로 — JLS §6.6.1상 private 멤버는 그 선언을 감싸는 최상위 클래스 본문 안에서 접근 가능하므로 바깥 Originator만 넓은 인터페이스를 씀(C++ friend 대체) [JLS 근거, 적용은 노트]
  - `record`(JEP 395)로 불변 스냅샷을 만들 수 있으나 record는 컴포넌트마다 public 접근자 메서드를 자동 생성 → 외부에 노출하면 좁은 인터페이스가 깨짐. private 중첩 record로 두거나 불투명 인터페이스 타입으로만 반환 [JEP 395 사실 + 노트]
  - 가변 컬렉션 필드는 스냅샷 생성 시 방어적 복사 필요 [노트]
- TypeScript:
  - TS `private`는 타입 검사에서만 강제되는 soft private(대괄호 표기로 우회 가능), JS `#field`는 컴파일 후에도 유지되는 hard private (TS 핸드북 Classes) → 좁은 인터페이스를 런타임까지 지키려면 `#` 필드
  - 깊은 복사는 `structuredClone`(구조화된 복제 알고리즘으로 deep clone, MDN) — 단 함수 객체는 복제 불가(`DataCloneError`, MDN). `Object.freeze`는 얕아서 중첩 객체는 여전히 변경 가능 (MDN)
  - [RG]: JavaScript 같은 동적 언어는 메멘토 내부 상태가 손대지 않은 채 유지됨을 보장할 수 없음
- Rust (std만):
  - 모듈 privacy가 좁은/넓은 인터페이스를 제공 — private 항목은 현재 모듈과 그 하위 모듈에서 접근 가능 (Rust Reference) → Memento 구조체 필드를 private으로 두고 같은 모듈의 Originator만 접근, 다른 모듈의 Caretaker는 불투명 값으로 보관 [Reference 사실 + 노트]
  - 스냅샷은 `#[derive(Clone)]` 등으로 만든 소유 값이어야 함 — Originator 내부를 빌린 참조를 메멘토에 담으면 그 빌림이 살아 있는 동안 Originator를 수정할 수 없음 [노트]
  - refactoring.guru Rust는 개념 예제와 serde 직렬화 예를 함께 제시 — serde는 외부 crate라 가이드 구현에는 사용 불가

### 실제 사용처
- `jakarta.faces.component.StateHolder` (Jakarta Faces 4.0) — `saveState(FacesContext)`로 상태 객체를 내고 `restoreState(FacesContext, Object)`로 복원, 두 메서드는 강하게 결합된 계약이라 상속 계층의 서로 다른 수준에 나눠 둘 수 없음(Javadoc). StateHolder 구현 컴포넌트=Originator, 반환된 상태 `Object`=Memento(불투명), Faces 상태 관리 기구=Caretaker. 패턴명 명시: [RG] Java Memento 페이지(`javax.faces.component.StateHolder` 구현) — https://jakarta.ee/specifications/faces/4.0/apidocs/jakarta/faces/component/stateholder
- `javax.swing.undo.StateEditable` / `StateEdit` (Java SE 21) — `StateEditable`=Originator(`storeState`/`restoreState`에 Hashtable 사용), `StateEdit`=Caretaker(편집 전후 상태를 Hashtable로 저장하고 undo/redo 시 복원 요청), Hashtable=Memento(좁은 인터페이스 강제는 없음). 패턴명 명시 출처 없음 — https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/undo/StateEdit.html
- `java.io.Serializable` — [RG]: 모든 Serializable 구현이 Memento를 "흉내낼 수 있음". API에 역할 분리가 없으므로 사용처보다 "구현 수단"으로 분류하는 편이 정확 [노트]

### 기존 가이드 승계분
- 최소 조건 취지: ① Originator/Memento/Caretaker 세 역할 분리(한 클래스가 다 하면 자체 백업일 뿐) ② Caretaker는 Memento 내부를 읽거나 수정할 수 없음(좁은 인터페이스) ③ 복원 로직은 Originator가 수행(외부에서 분해해 setter 호출은 위반) ④ 특정 시점 스냅샷 — 이후 변경에 영향받지 않음(불변 또는 방어적 복사). 오해 정리: 단순 직렬화(역할 분리가 핵심, 직렬화는 수단), 깊은 복사(복사본이 공개 인터페이스를 다 노출하면 캡슐화 미보존), Command(역연산 기록 vs 직전 상태 기록, 결합 가능), Prototype(새 객체 생성 vs 같은 객체를 과거 상태로)
  - 원전 대조 메모: ④의 "불변성"은 GoF가 명시하지 않음(스냅샷·증분 메멘토를 함께 제시) — [필수] 문구를 "복원 가능성" 중심으로 조정할지 검토
- 참고 자료(기존 목록 그대로):
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides (GoF), "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — "Memento" 항목.
  - Refactoring.Guru, "Memento" — https://refactoring.guru/design-patterns/memento
  - Wikipedia, "Memento pattern" — https://en.wikipedia.org/wiki/Memento_pattern
  - Joshua Bloch, "Effective Java" 3rd Edition — 직렬화(Serialization) 관련 장(아이템 85~90)에서 불투명 토큰으로서의 직렬 형식 다루기.
  - Spring Framework Reference Documentation — `TransactionStatus`와 Savepoint API의 사용 (트랜잭션 메멘토의 실제 사례).
  - Hibernate ORM Documentation — `PersistenceContext`의 엔티티 스냅샷과 더티 체킹 메커니즘.

### 출처
- [GoF 원서 HTML 사본 — Memento](https://www.cs.unc.edu/~stotts/GOF/hires/pat5f.htm) — Intent, Also Known As, Applicability, Participants(좁은/넓은 인터페이스), Collaborations, Consequences, Implementation, Known Uses, Related Patterns · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 283 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Objects as Arguments(Command·Memento 토큰 비교) · 조회 2026-09-17
- [refactoring.guru — Memento](https://refactoring.guru/design-patterns/memento) — Applicability, Pros/Cons(동적 언어 보장 불가), Relations(Command·Iterator·Prototype) · 조회 2026-09-17
- [refactoring.guru — Memento in Java](https://refactoring.guru/design-patterns/memento/java/example) — 직렬화로 원리 구현, Serializable·StateHolder 예 · 조회 2026-09-17
- [refactoring.guru — Memento in Rust](https://refactoring.guru/design-patterns/memento/rust/example) — 개념 예제와 serde 예 · 조회 2026-09-17
- [Jakarta Faces 4.0 — StateHolder](https://jakarta.ee/specifications/faces/4.0/apidocs/jakarta/faces/component/stateholder) — saveState/restoreState 계약 · 조회 2026-09-17
- [Java SE 21 — javax.swing.undo.StateEdit](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/undo/StateEdit.html) — 편집 전후 상태를 Hashtable로 저장·복원 · 조회 2026-09-17
- [Java SE 21 — javax.swing.undo.StateEditable](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/javax/swing/undo/StateEditable.html) — StateEdit로 undo/redo되는 객체의 인터페이스 · 조회 2026-09-17
- [Java SE 21 — java.sql.Savepoint](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Savepoint.html) — Connection.rollback으로 참조하는 트랜잭션 내 지점(미해결 질문 근거) · 조회 2026-09-17
- [JLS SE 21 — Chapter 6 (§6.6.1)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-6.html) — private 멤버는 선언을 감싼 최상위 클래스 본문 안에서 접근 가능 · 조회 2026-09-17
- [JEP 395: Records](https://openjdk.org/jeps/395) — Java 16 정식, 컴포넌트마다 public 접근자 자동 생성 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — private(soft) vs #(hard) · 조회 2026-09-17
- [MDN — structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) — deep clone · 조회 2026-09-17
- [MDN — The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — 함수 객체 복제 불가 · 조회 2026-09-17
- [MDN — Object.freeze()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) — freeze는 얕음 · 조회 2026-09-17
- [The Rust Reference — Visibility and privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html) — private 항목은 현재 모듈과 하위 모듈에서 접근 가능 · 조회 2026-09-17

### 미해결 질문
- `java.sql.Savepoint`(Javadoc: 트랜잭션 내 지점, `Connection.rollback`으로 참조) — Connection=Originator, Savepoint=불투명 토큰으로 볼 수 있으나 상태를 담지 않는 식별자라 Memento로 부를지 판단 보류
- 기존 참고 자료의 Spring `TransactionStatus`/Savepoint·Hibernate 스냅샷 더티 체킹을 Memento 사례로 본 근거, Effective Java 아이템 85~90 범위는 이번에 확인 안 함
- 기존 가이드 조건 ④(불변성 [필수])의 문구 조정 여부
- StateEdit·StateHolder 예시에서 "좁은 인터페이스"가 언어로 강제되지 않는 경우를 가이드 판정에서 [필수] 위반으로 볼지(원전은 언어 한계를 인정)

## Observer (옵저버)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 293쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함). 별칭: Dependents, Publish-Subscribe
- 의도(intent): 객체 사이에 일대다 의존을 정의해, 한 객체의 상태가 바뀌면 그에 의존하는 모든 객체가 자동으로 통지받고 갱신되게 함 [GoF]
- participants [GoF]:
  - `Subject` — 자기 옵저버들을 앎(옵저버 수는 제한 없음). Observer를 붙이고(attach) 떼는(detach) 인터페이스 제공
  - `Observer` — Subject 변경을 통지받을 객체용 갱신(update) 인터페이스 정의
  - `ConcreteSubject` — ConcreteObserver가 관심 있는 상태 저장. 상태가 바뀌면 옵저버들에게 통지 전송
  - `ConcreteObserver` — ConcreteSubject 참조 유지. 주체와 일관되게 유지할 상태 저장. Observer 갱신 인터페이스를 구현해 자기 상태를 주체와 일치시킴
- collaborations [GoF]:
  1. ConcreteSubject는 옵저버 상태가 자신과 어긋나게 만들 수 있는 변경이 일어날 때마다 옵저버들에게 통지 — 왜: 주체는 옵저버가 몇이고 누구인지 신경 쓰지 않음
  2. 통지받은 ConcreteObserver는 주체에게 정보를 질의할 수 있고, **그 정보로 자기 상태를 주체와 맞춤** — **(정정 2026-09-28: 원문 불릿은 둘이다.** 이 노트가 2·3 으로 나눠 적었던 것이 원문에서는 이 한 불릿이다. 원서 HTML 사본 대조, Observer v1.0.0 집필자와 독립 채점자가 각각 확인. **「항목 n」으로 인용하면 어긋난다** — `gof-creational-structural.md` 의 Flyweight `collaborations` 에서도 같은 유형을 찾았다)
  - 원문 부기: 변경을 요청한 옵저버도 주체의 통지를 받을 때까지 자기 갱신을 미룸 · `Notify`를 항상 주체가 호출하는 것은 아님(옵저버나 제3의 객체가 호출할 수도 있음)
- consequences [GoF]: 주체와 옵저버를 독립적으로 변경·재사용, 주체나 다른 옵저버를 수정하지 않고 옵저버 추가
  - 얻는 것: **추상 결합** — 주체는 추상 Observer 인터페이스를 따르는 목록만 알므로 서로 다른 추상 계층에 속할 수 있음(하위 계층 주체가 상위 계층 옵저버에게 알려도 계층 유지)
  - 얻는 것: **브로드캐스트 통신 지원** — 통지에 수신자를 지정할 필요 없음, 언제든 옵저버 추가·제거, 통지를 처리할지 무시할지는 옵저버 몫
  - 대가: **예상치 못한 갱신** — 옵저버들이 서로를 모르므로 주체 변경의 최종 비용이 보이지 않음, 연쇄 갱신, 의존 기준이 불명확하면 가짜 갱신, 단순 update 프로토콜은 무엇이 바뀌었는지 알려주지 않음. [RG] 추가: 구독자 통지 순서가 무작위
- 원전 구현 쟁점(요지) [GoF]: 주체→옵저버 매핑(해시 테이블로 공간 절약) / 여러 주체 관찰(Update에 주체 전달) / 누가 Notify를 호출하나 — 상태 설정 연산(잊지 않지만 연속 연산이면 비효율) vs 클라이언트(일괄 가능하지만 잊기 쉬움) / 삭제된 주체에 대한 댕글링 참조 / **통지 전 주체 상태의 자기 일관성**(서브클래스 연산이 상속 연산을 부를 때 깨지기 쉬움 → Template Method로 Notify를 마지막 단계에) / push 모델(상세 정보 전달, 옵저버 재사용성↓) vs pull 모델(최소 통지 후 옵저버가 질의, 비효율 가능) / 관심 사건(aspect)별 등록 / 복잡한 갱신 의미론은 ChangeManager(Mediator의 사례, 흔히 Singleton) / Subject·Observer 인터페이스를 한 클래스로 결합(Smalltalk)
- Applicability [GoF]: 추상화가 서로 의존하는 두 측면을 가짐 · 한 객체 변경이 다른 객체들 변경을 요구하는데 몇 개인지 모름 · 누구인지 가정하지 않고 다른 객체에 통지해야 함
- Known Uses [GoF]: Smalltalk MVC(Model=Subject, View=Observer 기반 클래스) · Smalltalk·ET++·THINK의 일반 의존 메커니즘 · InterViews(Observer/Observable), Andrew Toolkit(view/data object), Unidraw

### 최소 조건 후보
- [필수] 주체는 옵저버를 공통 갱신 인터페이스(타입 또는 함수 시그니처)로만 알고 구체 타입을 모름 — 반례: 주체가 `chartView.redraw(); tableView.refresh();`를 직접 호출
- [필수] 런타임에 옵저버를 붙이고 뗄 수 있음 — 원전 Subject 책임. 반례: 생성자에서 고정된 리스너 하나만 호출하면 단순 콜백·위임
- [필수] 주체 상태 변경이 그 시점에 등록된 모든 옵저버에게 통지됨(0개~N개, 주체는 개수를 신경 쓰지 않음) — 반례: 처리 가능한 첫 리스너에서 멈추면 Chain of Responsibility
- [선택] push(변경 내용 전달) / pull(옵저버가 질의) 모델 선택 — 둘 다 패턴 [GoF]
- [선택] 관심 사건(이벤트 종류·속성 이름)별 등록 [GoF]
- [선택] ChangeManager 같은 중개 객체 [GoF]
- [선택] 비동기 통지·통지 순서 보장 — 원전 기본형은 규정하지 않음(Node `EventEmitter`는 등록 순서 동기 호출, Java `Observable`은 순서 미정)
- 불변식 후보: 통지는 주체 상태가 자기 일관적인 뒤에 보냄 [GoF] · 해제된 옵저버는 이후 통지를 받지 않음 [노트] · 주체가 사라져도 옵저버에 댕글링 참조가 남지 않고, 해제를 잊은 옵저버가 주체에 붙잡혀 누수되지 않음 [GoF 댕글링 참조, Wikipedia lapsed listener]

### 사용 단서
- 이런 코드/요구가 보이면:
  - 한 객체 변경이 다른 객체들의 변경을 요구하는데 대상 집합을 미리 모르거나 런타임에 바뀜 [GoF, RG]
  - 모델–뷰처럼 서로 의존하는 두 측면을 분리해 따로 재사용 [GoF]
  - 일부 객체가 제한된 시간이나 특정 경우에만 관찰 [RG]
  - 코드 모양: 도메인 객체 setter 안에 UI 갱신·로그·캐시 무효화 호출이 줄줄이 붙어 있음 [노트]
- 쓰지 말아야 할 때:
  - 갱신 연쇄의 비용·순서가 중요한데 옵저버 구조가 그것을 가림 [GoF 예상치 못한 갱신, RG 통지 순서]
  - 여러 주체에 걸친 복잡한 제약을 한 번에 조율해야 함 → ChangeManager·Mediator [GoF]
  - 스레드 간 신뢰성 있는 순서 메시징이나 흐름 제어(backpressure)가 필요 → `java.util.concurrent` 자료구조나 `Flow` (Java `Observable` 폐기 사유 문구가 안내)

### 비교 대상
- vs Mediator: [GoF 토론] 경쟁 패턴 — Observer는 통신을 분산, Mediator는 캡슐화. Observer 클래스가 재사용하기 쉽고 Mediator가 흐름을 이해하기 쉬움. Mediator를 Observer로 구현할 수 있음 ([GoF] Mediator Implementation, [RG]). 오인 모양은 Mediator 절 참조
- vs Chain of Responsibility: Observer는 수신자가 동적으로 구독·해제하고 통지는 모두에게 / CoR은 사슬을 따라 순차로 넘기다 하나가 처리 ([RG], [GoF 토론] "Observer는 Command보다 느슨한 바인딩 — 주체가 여러 옵저버를 가질 수 있고 수가 런타임에 변함")
- vs Command: [GoF 토론] Observer는 변경 신호 인터페이스로 발신자(주체)와 수신자(옵저버)를 분리하며 객체 사이에 데이터 의존이 있을 때 최적, Command는 발신자-수신자 바인딩을 별도 객체로 정의
- vs Reactive Streams(`java.util.concurrent.Flow`): Publisher·Subscriber·Subscription으로 흐름 제어(flow-controlled)되는 구성요소 (Javadoc). 옵저버의 확장형이며 구독 요청량 조절 같은 GoF에 없는 계약이 핵심 — 이름이 비슷해도 판정 기준을 분리 [노트]
- vs Pub/Sub 메시지 브로커(기존 가이드 주장): GoF가 Publish-Subscribe를 **별칭**으로 나열하므로 이름만으로 구분 불가. 기존 가이드 기준은 "주체가 옵저버 목록을 직접 보유·동일 프로세스 동기 통지 vs 브로커 경유·서로 모름" — 이 구분을 뒷받침하는 1차 출처는 확인 안 함(미해결)
- vs 단순 콜백(기존 가이드 주장): 콜백 하나를 고정 호출하는 1:1 위임은 동적 구독·다수 통지가 없음

### 세 언어 구현 쟁점
- Java:
  - `java.util.Observer`/`Observable`은 Java 9부터 deprecated (JDK-8154801 "deprecate Observer and Observable", Fixed in 9). 폐기 사유(Javadoc): 지원하는 이벤트 모델이 제한적, `Observable`이 전달하는 통지 순서가 명세되지 않음, 상태 변경과 통지가 일대일로 대응하지 않음. 대안 안내: 더 풍부한 이벤트 모델은 `java.beans`, 스레드 간 신뢰성 있는 순서 메시징은 `java.util.concurrent` 자료구조, 리액티브 스트림 방식은 `Flow` API
  - `Observable`은 클래스라 상속으로만 주체 기능을 얻음(자바 단일 상속과 충돌) [Javadoc 사실 + 노트]
  - `PropertyChangeSupport`를 필드로 두고 리스너 관리·이벤트 디스패치를 위임하는 방식이 표준 (Javadoc)
  - 함정: 해제를 잊은 리스너가 주체에 잡혀 누수(lapsed listener problem — GC 언어에서 흔한 누수 원인, Wikipedia)
  - Spring `ApplicationEventPublisher`는 기본이 동기 — `publishEvent()`가 모든 리스너 처리가 끝날 때까지 블록되고, 리스너는 발행자의 트랜잭션 문맥 안에서 동작 (Spring 문서)
- TypeScript:
  - DOM `addEventListener`의 `once`(한 번 호출 뒤 자동 제거)·`signal`(연결된 `AbortController.abort()` 시 제거) 옵션이 해제 누락을 줄임 (MDN)
  - `removeEventListener`는 이벤트 타입·리스너 함수 자체·일부 옵션 조합으로 대상을 식별 → 인라인 화살표 함수로 등록하면 같은 함수 참조가 없어 해제할 수 없음 [MDN 사실 + 노트]
  - Node `EventEmitter`: 모든 리스너를 등록 순서대로 **동기** 호출, 한 이벤트에 리스너가 10개를 넘으면 기본적으로 경고 출력(메모리 누수 탐지용, `setMaxListeners`로 조정) (Node 문서)
  - 구조적 타이핑이라 `update(…)` 모양만 맞으면 Observer로 통과 [노트]
- Rust (std만):
  - 구독자를 함수·클로저로 받는 `Vec<Box<dyn Fn(&Event)>>`가 관용. refactoring.guru Rust: 구독자는 람다나 명시적 함수이며, 명시적 함수는 해제할 수 있지만 함수 타입에 따라 제약이 있음 → 해제용 구독 id(핸들)를 돌려주는 설계가 흔함 [노트]
  - 옵저버가 주체를 참조하거나 공유 가변 상태를 쓰면 `Rc<RefCell<T>>` 필요 → 통지 도중 옵저버가 주체를 다시 `borrow_mut`하면 런타임 panic (`RefCell` 문서) · 주체↔옵저버 상호 `Rc`는 순환 누수이므로 한쪽을 `Weak`로 (Rust 책 15.6, `Weak` 문서)
  - 스레드 간이면 `std::sync::mpsc` 채널이 있으나 다중 생산자·**단일 소비자** FIFO(문서)라 브로드캐스트가 아님 — 구독자마다 채널을 두는 식으로 조합해야 함 [노트]

### 실제 사용처
- `java.beans.PropertyChangeSupport` / `PropertyChangeListener` (Java SE 21) — `PropertyChangeSupport`=Subject 기능(리스너 목록 관리·`PropertyChangeEvent` 디스패치)을 위임받는 객체, bean=ConcreteSubject, `PropertyChangeListener`=Observer. 속성 이름별 등록 지원(원전 "관심 사건 명시"). 연결 근거: `Observable` 폐기 Javadoc이 대안으로 `java.beans` 패키지를 지목 — https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/beans/PropertyChangeSupport.html
- Spring Framework `ApplicationEventPublisher` / `ApplicationListener` (Spring Framework 7.0.9 레퍼런스) — 문서가 "본질적으로 표준 Observer 디자인 패턴"이라고 명시. `ApplicationContext`=Subject, `ApplicationListener` 빈=ConcreteObserver, `ApplicationEvent`=통지 내용(push) — https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html
- DOM `EventTarget.addEventListener` (MDN) — `EventTarget`=Subject, listener=Observer. 패턴명 명시 출처 없음 — https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
- Node.js `EventEmitter` (Node.js v26.9.0 문서) — emitter=Subject, listener 함수=Observer, 이벤트 이름별 등록. 패턴명 명시 출처 없음 — https://nodejs.org/api/events.html

### 기존 가이드 승계분
- 최소 조건 취지: ① 주체는 구체 옵저버가 아니라 공통 Observer/Listener 인터페이스에만 의존(직접 `new`·캐스팅하면 아님) ② 런타임 attach/detach API ③ 하나의 상태 변화가 다수 옵저버에게 자동 전파(항상 1:1이면 콜백) ④ 느슨한 결합 — 옵저버는 같은 주체의 다른 옵저버를 몰라도 됨. 빠지면 단순 콜백·이벤트 디스패처·메시지 큐 같은 변형. 오해 정리: 단순 콜백(1:1), Pub/Sub 브로커(발행자·구독자가 서로 모르고 비동기 vs 주체가 목록을 직접 보유·동기 통지), 데이터 바인딩(양방향 동기화 목적), RxJava `Observable`(백프레셔·연산자 등 GoF에 없는 개념이 핵심)
  - 원전 대조 메모: ③ "항상 1:1이면 옵저버가 아님" — GoF는 "옵저버 수는 제한 없음(any number)"이라는 구조적 가능성을 요구하지 실제 개수를 요구하지 않음 → 문구 조정 검토
- 참고 자료(기존 목록 그대로):
  - Gamma, Helm, Johnson, Vlissides (GoF), "Design Patterns: Elements of Reusable Object-Oriented Software", Addison-Wesley, 1994 — Observer 항목.
  - Oracle, "Deprecation of `java.util.Observer` and `java.util.Observable`" (JDK-8154801), Java 9 Release Notes.
  - Oracle Java SE API Docs, `java.beans.PropertyChangeSupport`, `java.beans.PropertyChangeListener`.
  - Oracle Java SE API Docs, `java.util.concurrent.Flow` (Reactive Streams in JDK 9+).
  - Refactoring.Guru, "Observer" — https://refactoring.guru/design-patterns/observer
  - Erich Gamma et al., "Lapsed Listener Problem" — 옵저버 메모리 누수에 대한 고전적 논의.
  - ReactiveX 공식 문서, "Observable" — 옵저버 패턴의 반응형 확장 사례.

### 출처
- [GoF 원서 HTML 사본 — Observer](https://www.cs.unc.edu/~stotts/GOF/hires/pat5g.htm) — Intent, Also Known As, Applicability, Participants, Collaborations, Consequences, Implementation(push/pull, 자기 일관성, ChangeManager), Known Uses, Related Patterns · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 293 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Mediator와 경쟁, Command보다 느슨한 바인딩 · 조회 2026-09-17
- [refactoring.guru — Observer](https://refactoring.guru/design-patterns/observer) — Applicability, Pros/Cons(무작위 통지 순서), Relations · 조회 2026-09-17
- [refactoring.guru — Observer in Java](https://refactoring.guru/design-patterns/observer/java/example) — 핵심 라이브러리 사용 예(EventListener 등) · 조회 2026-09-17
- [refactoring.guru — Observer in Rust](https://refactoring.guru/design-patterns/observer/rust/example) — 함수·클로저 구독자, 해제 제약 · 조회 2026-09-17
- [Java SE 21 — java.util.Observable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Observable.html) — Deprecated(since 9)와 사유·대안 · 조회 2026-09-17
- [Java SE 21 — java.util.Observer](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Observer.html) — Deprecated(since 9) · 조회 2026-09-17
- [OpenJDK Bug System — JDK-8154801 (REST)](https://bugs.openjdk.org/rest/api/2/issue/JDK-8154801?fields=summary,resolution,fixVersions) — 제목 "deprecate Observer and Observable", Fixed, fixVersion 9 · 조회 2026-09-17
- [Java SE 21 — java.beans.PropertyChangeSupport](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/beans/PropertyChangeSupport.html) — 리스너 목록 관리·이벤트 디스패치 위임 · 조회 2026-09-17
- [Java SE 21 — java.util.concurrent.Flow](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Flow.html) — flow-controlled Publisher/Subscriber/Subscription · 조회 2026-09-17
- [Spring Framework Reference 7.0.9 — Additional Capabilities of the ApplicationContext](https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html) — "standard Observer design pattern", 기본 동기 이벤트 · 조회 2026-09-17
- [MDN — EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) — once, signal 옵션 · 조회 2026-09-17
- [MDN — EventTarget.removeEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener) — 해제 대상 식별 방식 · 조회 2026-09-17
- [Node.js v26.9.0 — Events](https://nodejs.org/api/events.html) — 등록 순서 동기 호출, 기본 10개 초과 경고 · 조회 2026-09-17
- [Wikipedia — Lapsed listener problem](https://en.wikipedia.org/wiki/Lapsed_listener_problem) — 옵저버 패턴에서 비롯한 누수(보조 출처) · 조회 2026-09-17
- [Rust std — RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html) — 빌림 중 재빌림 panic · 조회 2026-09-17
- [Rust std — std::rc::Weak](https://doc.rust-lang.org/std/rc/struct.Weak.html) — 순환 참조 방지 · 조회 2026-09-17
- [The Rust Programming Language — 15.6 Reference Cycles Can Leak Memory](https://doc.rust-lang.org/book/ch15-06-reference-cycles.html) — Rc/RefCell 순환 누수 · 조회 2026-09-17
- [Rust std — std::sync::mpsc](https://doc.rust-lang.org/std/sync/mpsc/index.html) — multi-producer, single-consumer FIFO · 조회 2026-09-17

### 미해결 질문
- 기존 참고 자료 "Erich Gamma et al., 'Lapsed Listener Problem'" — 저자 귀속 근거 확인 못 함(Wikipedia 항목은 Gamma 저작으로 소개하지 않음) → 출처 표기 정정 후보
- 기존 참고 자료 "Java 9 Release Notes"에 이 폐기 항목이 있는지 확인 못 함(JDK-8154801 버그 기록과 Javadoc으로는 확인됨)
- Pub/Sub 브로커와 GoF Observer의 구분 기준을 뒷받침할 1차 출처 필요(GoF는 Publish-Subscribe를 별칭으로 나열)
- DOM `EventTarget`, Node `EventEmitter`를 Observer라고 명시한 공식 출처는 확인 못 함
- 기존 가이드 조건 ③ 문구 조정 여부

## State (상태)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 305쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함). 별칭: Objects for States
- 의도(intent): 객체의 내부 상태가 바뀔 때 행위를 바꿀 수 있게 함. 객체가 마치 클래스를 바꾼 것처럼 보이게 됨 [GoF]
- participants [GoF]:
  - `Context` (TCPConnection) — 클라이언트가 관심 있는 인터페이스 정의. 현재 상태를 정의하는 ConcreteState 서브클래스의 인스턴스 유지
  - `State` (TCPState) — Context의 특정 상태와 연관된 행위를 캡슐화하는 인터페이스 정의
  - `ConcreteState subclasses` (TCPEstablished, TCPListen, TCPClosed) — 각 서브클래스가 Context의 한 상태와 연관된 행위를 구현
- collaborations [GoF]:
  1. Context가 상태 의존 요청을 현재 ConcreteState 객체에 위임 — 왜: 상태별 분기를 Context에서 없앰
  2. Context는 요청을 처리하는 State 객체에 자신을 인자로 넘길 수 있어, State가 필요하면 Context에 접근
  3. Context가 클라이언트의 주 인터페이스. 클라이언트는 State 객체로 Context를 구성할 수 있지만, 구성된 뒤에는 State 객체를 직접 다루지 않음
  4. 어떤 상태가 다음 상태가 되는지와 그 조건은 **Context 또는 ConcreteState 서브클래스 어느 쪽이든** 결정할 수 있음
- consequences [GoF]:
  - 얻는 것: 상태별 행위를 지역화하고 상태마다 분할 — 새 상태·전이는 서브클래스 추가로. 대안(데이터 값 + Context 연산의 조건문 검사)은 비슷한 조건문이 Context 곳곳에 흩어지고 새 상태 추가 시 여러 연산을 고쳐야 함
  - 대가: 행위가 여러 State 서브클래스로 흩어져 클래스 수가 늘고 한 클래스보다 덜 간결함(상태가 많으면 오히려 이득)
  - 얻는 것: 상태 전이를 명시적으로 — 내부 데이터 값만으로 상태를 정의하면 전이가 변수 대입으로만 드러남. 전이가 Context의 State 변수 하나를 재바인딩하는 것이라 Context 관점에서 원자적이어서 불일치 내부 상태를 막음
  - 얻는 것: State 객체 공유 가능 — 인스턴스 변수가 없으면(상태가 타입에 완전히 인코딩) 여러 Context가 공유, 본질적으로 내재 상태 없는 flyweight
- 원전 구현 쟁점(요지) [GoF]: 누가 전이를 정의하나 — **패턴은 규정하지 않음**. 기준이 고정이면 Context에 전부 구현 가능, 보통은 State 서브클래스가 후속 상태와 시점을 지정하는 편이 유연(Context에 상태 설정 인터페이스 추가 필요, 대가는 State 서브클래스 간 구현 의존) / 테이블 기반 대안(Cargill) — 입력→후속 상태 테이블, 장점은 규칙성(코드 대신 데이터 수정), 단점은 가상 호출보다 느릴 수 있음·전이 기준이 덜 명시적·전이 시 동작 추가가 어려움. 핵심 차이: State 패턴은 상태별 **행위**를 모델링, 테이블 방식은 **전이** 정의에 초점 / State 객체를 필요할 때 생성·파괴 vs 미리 만들어 두기 / 동적 상속(Self 같은 위임 기반 언어는 패턴을 직접 지원)
- Applicability [GoF]: 객체 행위가 상태에 의존하고 런타임에 그 상태에 따라 바뀌어야 함 · 연산에 객체 상태에 의존하는 큰 다분기 조건문이 있고(상태는 보통 열거 상수로 표현), 여러 연산이 같은 조건 구조를 반복
- Known Uses [GoF]: Johnson & Zweig의 TCP 연결 프로토콜 적용 · 그리기 편집기의 도구(HotDraw `DrawingController`→현재 `Tool`, Unidraw `Viewer`–`Tool`) — 사용자가 새 도구를 고르면 편집기가 현재 Tool 객체를 교체 · Coplien의 Envelope-Letter 이디엄과 관련

### 최소 조건 후보
- [필수] 상태별 행위가 공통 State 인터페이스를 구현하는 별도 객체로 나뉨 — 반례: Context의 모든 메서드가 `switch (status)`를 반복(원전 Applicability가 해결 대상으로 지목한 모양)
- [필수] Context는 상태 의존 요청을 현재 상태 객체에 위임하고, 클라이언트는 Context 인터페이스만 씀 — 반례: 클라이언트가 `ctx.getState().open(ctx)`를 직접 호출하면 상태가 노출됨
- [필수] Context의 현재 상태 객체가 Context 사용 중(요청 처리 결과로) 런타임에 바뀜 — 원전 의도 "내부 상태가 바뀔 때 행위를 바꿈"·Applicability "런타임에 상태에 따라 행위가 바뀌어야". 반례: 생성 시 한 번 주입하고 바뀌지 않으면 Strategy에 가까움
- [선택] 전이 결정 위치 — ConcreteState가 후속 상태를 정함(흔함, 유연) 또는 Context가 정함(기준이 고정일 때) [GoF collaborations·Implementation]
- [선택] State 메서드에 Context를 인자로 전달 [GoF]
- [선택] 무상태 State 객체 공유(Flyweight·Singleton) [GoF]
- [선택] 테이블 기반 전이 — 원전은 "대안"으로 구분하므로 이것만 있고 상태 객체가 없으면 이 패턴 아님
- 불변식 후보: Context는 항상 정확히 하나의 현재 상태를 가짐(전이는 참조 하나의 원자적 재바인딩) [GoF] · 각 상태에서 허용되지 않는 요청의 처리(무시·오류)가 그 상태 객체에 정의돼 있음 [노트]

### 사용 단서
- 이런 코드/요구가 보이면:
  - 같은 메서드가 상태에 따라 전혀 다르게 동작하고 여러 메서드에 같은 `switch (status)`가 반복 [GoF, RG]
  - 상태 수가 많고 상태별 코드가 자주 바뀜, 비슷한 상태·전이 사이에 중복 코드 [RG]
  - 주문(생성→결제→배송→완료), 문서 결재(초안→검토→게시 — Rust 책 예), 연결(수신 대기→연결됨→종료 — GoF TCP 예), 재생기(정지↔재생 — RG Rust 예) [노트, 괄호는 출처별 예]
- 쓰지 말아야 할 때:
  - 상태가 몇 개뿐이거나 거의 바뀌지 않음 — 과함 [RG]
  - 전이 규칙을 데이터로 바꿔 끼우는 것이 중요하고 전이 시 동작이 거의 없음 → 테이블 기반 [GoF]
  - Rust에서 잘못된 전이를 컴파일 타임에 막는 것이 더 중요 → 상태를 서로 다른 타입으로 인코딩 (Rust 책 18.3)

### 비교 대상
- vs Strategy (PATTERNS.md 빠른 비교 페어 "외부 교체 vs 내부 전이"): 둘 다 합성으로 컨텍스트가 도우미 객체에 일부 작업을 위임. Strategy는 그 객체들을 서로 완전히 독립적이고 서로 모르게 하고, State는 구체 상태 사이 의존을 제한하지 않고 상태가 컨텍스트의 상태를 바꾸게 허용 — "State는 Strategy의 확장으로 볼 수 있음" ([RG] Relations). [RG] State 본문: 구체 상태는 서로를 알고 전이를 개시할 수 있지만 전략들은 거의 서로 모름. Wikipedia: State는 인터페이스 메서드 호출로 전략을 바꿀 수 있는 Strategy로 해석 가능. **주의**: GoF는 전이 결정이 Context에 있어도 State로 보고, Known Uses(도구 선택)는 사용자 선택으로 상태 객체가 바뀜 → "누가 바꾸나" 하나만으로는 판별 불충분, "행위가 객체의 상태 변화에 따라 바뀌는가(상태 전이가 도메인의 일부인가) vs 같은 목적 알고리즘 중 무엇을 쓸지 고르는가"로 판별 [노트, 출처 종합]. 오인 모양: `state = state.play()`처럼 상태가 다음 상태를 반환 → State / `player.setShuffle(new RandomOrder())`를 클라이언트가 호출하고 구현들이 서로를 모름 → Strategy
- vs enum + switch(대안·비패턴): 데이터 값과 조건문으로 상태를 표현하면 비슷한 조건문이 흩어지고 새 상태 추가 시 여러 연산 수정 ([GoF] Consequences). Rust 책: enum도 가능한 해법이지만 값을 검사하는 곳마다 match가 필요해 더 반복적일 수 있음
- vs 테이블 기반 FSM: State는 상태별 행위, 테이블은 전이 정의에 초점 ([GoF] Implementation)
- vs Flyweight · Singleton: 상태 객체 공유 ([GoF] Related)
- vs Bridge: 구조(합성 위임)가 매우 비슷하지만 해결하는 문제가 다름 ([RG])

### 세 언어 구현 쟁점
- Java:
  - 고전형 `interface State { State onPay(Order ctx); … }` 또는 `void onPay(Order ctx)` + `ctx.setState(…)`
  - enum 상수별 클래스 본문: JLS §8.9.1 — enum 상수의 선택적 클래스 본문은 enum의 직접 서브클래스인 final 익명 클래스를 선언 → 상수마다 메서드를 재정의해 "공유되는 무상태 State 객체"(원전 flyweight 결과)를 간결하게 표현 [JLS 사실 + 노트]
  - 상태가 데이터를 가져야 하면 `sealed interface` + `record` 상태 + 패턴 `switch`(JEP 409·441) — 이 경우 행위가 Context의 switch로 모여 GoF State라기보다 "대안"(가이드 판정 필요) [노트]
  - 함정: 상태 설정 메서드를 public으로 열면 클라이언트가 임의 전이 가능 [노트]
- TypeScript:
  - 클래스형 State, 또는 discriminated union `type State = { kind: "draft" } | { kind: "review"; reviewer: string }` + `switch (state.kind)` + `never` 망라성 검사 (TS 핸드북 Narrowing) — 후자는 행위가 한 함수에 모이는 enum+switch 계열 [노트]
  - 함정: 클래스는 구조적으로 비교되므로 멤버 모양이 같은 서로 다른 상태 클래스는 타입상 서로 대체 가능 (TS 핸드북 Classes "Relationships Between Classes") → `kind` 같은 판별 필드로 구분
  - 함정: 상태 객체 메서드를 콜백으로 떼어 넘기면 `this` 유실 (TS 핸드북 Classes)
- Rust (std만):
  - 공식 Rust 책 18.3 블로그 게시물 예: `Post { state: Option<Box<dyn State>> }`, 전이 메서드는 `fn request_review(self: Box<Self>) -> Box<dyn State>`로 기존 상태를 소비하고 새 상태 반환. Rust는 구조체 필드를 비워 둘 수 없으므로 `Option::take()`로 상태를 꺼낸 뒤 결과를 다시 넣음
  - 책이 든 단점: 상태가 전이를 구현하므로 상태끼리 결합(중간에 새 상태를 넣으면 이웃 상태 코드 수정), 로직 중복 · trait 객체로 쓰는 `State`에서는 `self`를 반환하는 기본 구현을 둘 수 없음(dyn compatibility 규칙)
  - 책의 대안: 상태를 서로 다른 타입(`DraftPost` → `PendingReviewPost` → `Post`)으로 인코딩해 잘못된 상태·전이를 컴파일 오류로 만듦 — 전이가 캡슐화되지 않고 타입으로 드러나는 다른 트레이드오프
  - "왜 enum이 아닌가"(책): enum도 가능하나 값 검사 위치마다 match 필요. 결론: 소유권 같은 특성 때문에 객체지향 패턴이 Rust에서 항상 최선은 아님
  - refactoring.guru Rust 음악 재생기 예도 `self: Box<Self>` 방식 사용

### 실제 사용처
- (공식 문서 예제) The Rust Programming Language 18.3 블로그 `Post` — `Post`=Context, `State` trait=State, `Draft`·`PendingReview`·`Published`=ConcreteState. 라이브러리가 아니라 책의 예제 — https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html
- (역사적) GoF Known Uses — TCPConnection(Johnson & Zweig), HotDraw `DrawingController`–`Tool`, Unidraw `Viewer`–`Tool` — https://www.cs.unc.edu/~stotts/GOF/hires/pat5h.htm
- [RG] Java State 페이지 주장(보조 출처 단독): `javax.faces.lifecycle.LifeCycle#execute()`(RG 표기 그대로, FacesServlet이 제어하며 JSF 라이프사이클의 현재 단계에 따라 동작이 달라진다는 설명). 공식 문서로 State 구조 확인 안 함 → 채택 보류 — https://refactoring.guru/design-patterns/state/java/example
- 공식 문서로 GoF State 구조가 확인되는 현행 Java/TS/Rust **라이브러리** 사용처: **찾지 못함**(목표 2개 미달)

### 기존 가이드 승계분
- 최소 조건 취지: ① 상태가 enum·int 플래그가 아니라 공통 인터페이스를 구현하는 객체이고 상태별 동작이 그 메서드에 캡슐화 ② Context는 행동을 직접 구현하지 않고 State에 위임(Context에 상태별 switch가 남으면 아님) ③ 전이 결정권이 상태 측 — 현재 상태가 판단해 `context.setState(next)` 호출(Strategy와 갈리는 결정적 차이) ④ 상태 클래스는 다른 상태의 내부 구현을 모르고 새 상태 객체를 주입하는 형태로만 전이. ③이 빠지면 사실상 Strategy, ②가 빠지면 enum 분기. 오해 정리: Strategy(UML 거의 동일, 누가 바꾸나·상태 간 순서), enum+switch는 OCP 위반, FSM ≠ State 패턴(테이블 방식은 엄밀한 GoF State와 다름), 상태 객체는 보통 불변·싱글턴 공유
  - 원전 대조 메모: ③은 GoF Collaborations("Context 또는 ConcreteState가 결정")·Implementation("패턴은 규정하지 않음")과 **충돌** — [선택]으로 내리고 Strategy 비교 기준을 재작성할 필요
- 참고 자료(기존 목록 그대로):
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (Addison-Wesley, 1994) — State 패턴 원전.
  - Eric Freeman, Elisabeth Robson, "Head First Design Patterns" 2nd ed. (O'Reilly, 2020) — 자판기(Gumball Machine) 예시로 유명한 State 패턴 챕터.
  - Refactoring Guru, "State" — https://refactoring.guru/design-patterns/state
  - Spring StateMachine 공식 문서 — https://docs.spring.io/spring-statemachine/docs/current/reference/
  - David Harel, "Statecharts: A Visual Formalism for Complex Systems" (Science of Computer Programming, 1987) — 계층적 상태 기계(HSM)의 이론적 배경.
  - Oracle JDK Docs, `java.nio.channels.SelectionKey` — https://docs.oracle.com/javase/8/docs/api/java/nio/channels/SelectionKey.html

### 출처
- [GoF 원서 HTML 사본 — State](https://www.cs.unc.edu/~stotts/GOF/hires/pat5h.htm) — Intent, Also Known As, Applicability, Participants, Collaborations(전이 결정은 어느 쪽이든), Consequences, Implementation(전이 정의 주체, 테이블 대안), Known Uses, Related Patterns · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 305 · 조회 2026-09-17
- [refactoring.guru — State](https://refactoring.guru/design-patterns/state) — Strategy와의 핵심 차이 서술, Applicability, Pros/Cons, Relations(Bridge·Strategy) · 조회 2026-09-17
- [refactoring.guru — State in Java](https://refactoring.guru/design-patterns/state/java/example) — JSF LifeCycle 사용 예 주장 · 조회 2026-09-17
- [refactoring.guru — State in Rust](https://refactoring.guru/design-patterns/state/rust/example) — self: Box<Self> 전이, Rust 책 참조 · 조회 2026-09-17
- [Wikipedia — State pattern](https://en.wikipedia.org/wiki/State_pattern) — State를 전략을 바꿀 수 있는 Strategy로 해석(보조 출처) · 조회 2026-09-17
- [The Rust Programming Language — 18.3 Implementing an Object-Oriented Design Pattern](https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html) — Box<dyn State>·take()·단점·타입 인코딩 대안·enum 논의 · 조회 2026-09-17
- [JLS SE 21 — Chapter 8 (§8.9.1)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) — enum 상수 클래스 본문은 final 익명 서브클래스 · 조회 2026-09-17
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441) — 패턴 switch 망라성 · 조회 2026-09-17
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — discriminated unions, 망라성 검사 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — 클래스의 구조적 비교, this 유실 · 조회 2026-09-17

### 미해결 질문
- 공식 문서로 GoF State 구조가 확인되는 현행 Java/TS 라이브러리 사용처를 찾지 못함(목표 미달). [RG]의 JSF `Lifecycle` 주장 채택 여부
- 기존 가이드 조건 ③(전이 결정권은 상태 측 [필수])이 원전과 충돌 — 새 가이드 [선택] 전환과 Strategy 편 비교 문구 동기화 필요
- 기존 참고 자료 `java.nio.channels.SelectionKey`가 State 사례라는 근거 확인 못 함(이번에 Javadoc도 보지 않음). Spring Statemachine·Harel Statecharts 내용도 확인 안 함
- enum+match / sealed+switch / union switch 형태를 가이드에서 State 구현으로 인정할지, "대안"으로만 둘지

## Strategy (전략)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 315쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함). 별칭: Policy
- 의도(intent): 알고리즘 군(family)을 정의하고 각각을 캡슐화해 서로 바꿔 쓸 수 있게 함. Strategy는 알고리즘을 사용하는 클라이언트와 독립적으로 알고리즘을 바꿀 수 있게 함 [GoF]
- 모티베이션 요지 [GoF]: 텍스트 줄바꿈 알고리즘을 필요로 하는 클래스에 하드와이어링하면 ① 클라이언트가 커지고 유지보수가 어려워짐(여러 알고리즘을 지원하면 더) ② 때에 따라 맞는 알고리즘이 다른데 쓰지도 않는 알고리즘까지 지원 ③ 알고리즘이 클라이언트의 일부라 새 알고리즘 추가·변경이 어려움 → `Composition`이 `Compositor` 참조를 유지하고 재포맷할 때마다 책임을 넘기며, `Composition`의 클라이언트가 원하는 `Compositor`를 설치
- participants [GoF]:
  - `Strategy` (Compositor) — 지원하는 모든 알고리즘에 공통인 인터페이스 선언. Context는 이 인터페이스로 ConcreteStrategy가 정의한 알고리즘을 호출
  - `ConcreteStrategy` (SimpleCompositor, TeXCompositor, ArrayCompositor) — Strategy 인터페이스를 써서 알고리즘 구현
  - `Context` (Composition) — ConcreteStrategy 객체로 구성됨(is configured with). Strategy 객체 참조 유지. Strategy가 자기 데이터에 접근하도록 인터페이스를 정의할 수 있음(may)
  - 참고: `Client`는 participants 목록에 없지만 collaborations에서 ConcreteStrategy를 만들어 Context에 넘기는 주체로 등장
- collaborations [GoF] (원문은 두 문단, 아래는 시간 순으로 재배열):
  1. Client가 보통 ConcreteStrategy 객체를 만들어 Context에 넘김. 이후 Client는 Context하고만 상호작용. 흔히 Client가 고를 ConcreteStrategy 군이 있음 — 왜: 알고리즘 선택 책임을 Context 밖에 둬서 Context를 알고리즘 변화로부터 격리
  2. Context는 자기 클라이언트의 요청을 자기 전략으로 전달(forward)
  3. 알고리즘 호출 시 Context가 알고리즘에 필요한 데이터를 전부 인자로 넘기거나, 자신을 인자로 넘겨 전략이 필요할 때 Context에 콜백하게 함 — 왜: 결합도(낮음) vs 필요한 데이터만 정확히 가져가기(결합 높음)의 트레이드오프(Implementation 1)
  4. Strategy와 Context가 상호작용해 선택된 알고리즘을 구현
- consequences [GoF] (원전 7항목):
  - 얻는 것 — **관련 알고리즘 군**: Strategy 클래스 계층이 컨텍스트가 재사용할 알고리즘·행위 군을 정의, 상속으로 알고리즘 공통 기능 추출 가능
  - 얻는 것 — **서브클래싱의 대안**: Context를 직접 서브클래싱하면 행위가 Context에 하드와이어링되고 알고리즘 구현과 Context 구현이 섞여 이해·유지보수·확장이 어려우며 알고리즘을 동적으로 바꿀 수 없음. 알고리즘만 다른 관련 클래스가 잔뜩 생김. 분리하면 Context와 독립적으로 바꾸고 전환·이해·확장이 쉬움
  - 얻는 것 — **조건문 제거**: `switch (_breakingStrategy) { case SimpleStrategy: …; case TeXStrategy: … }`가 `_compositor->Compose()`로 바뀜. 조건문이 많은 코드는 Strategy 적용이 필요하다는 신호인 경우가 많음
  - 얻는 것 — **구현 선택지**: 같은 행위를 시간·공간 트레이드오프가 다른 여러 구현으로 제공
  - 대가 — **클라이언트가 전략 간 차이를 알아야 함**: 적절한 전략을 고르려면 차이를 이해해야 하고 구현 문제에 노출될 수 있음 → 행위 변형이 클라이언트에게 의미 있을 때만 사용
  - 대가 — **Strategy–Context 통신 오버헤드**: 모든 ConcreteStrategy가 같은 인터페이스를 공유하므로 단순한 전략은 전달받은 정보를 쓰지 않을 수 있음(Context가 쓰이지도 않을 매개변수를 만듦) → 문제가 되면 더 긴밀한 결합 필요
  - 대가 — **객체 수 증가**: 무상태 전략을 컨텍스트들이 공유해 줄일 수 있음(잔여 상태는 Context가 요청마다 전달). 공유 전략은 호출 간 상태를 유지하면 안 됨 → Flyweight
- 원전 구현 쟁점 [GoF]:
  1. **Strategy·Context 인터페이스 정의** — (a) Context가 데이터를 매개변수로 전략에 전달("데이터를 전략에게 가져감", 결합↓, 필요 없는 데이터까지 전달 가능) (b) Context가 자신을 인자로 넘기고 전략이 명시적으로 데이터를 요청하거나, 전략이 Context 참조를 보관(필요한 것만 요청, Context가 더 정교한 데이터 인터페이스를 정의해야 해 결합↑). 알고리즘의 데이터 요구가 선택을 결정
  2. **템플릿 매개변수로서의 전략**(C++) — (1) 컴파일 타임에 선택할 수 있고 (2) 런타임에 바꿀 필요가 없을 때만 적용. 추상 Strategy 클래스가 필요 없고 정적 바인딩으로 효율↑
  3. **Strategy 객체를 선택 사항으로** — 전략이 없는 것이 의미 있으면 Context가 전략 유무를 확인해 없으면 기본 행위 수행. 클라이언트는 기본 행위가 마음에 들지 않을 때만 전략을 다룸
- Applicability [GoF]: 행위만 다른 관련 클래스가 많음 · 알고리즘 변형(예: 시간/공간 트레이드오프)이 필요 · 알고리즘이 클라이언트가 알면 안 되는 데이터를 사용(복잡한 알고리즘 특화 자료구조 은닉) · 클래스가 많은 행위를 정의하고 그것이 연산 안의 다중 조건문으로 나타남
- Known Uses [GoF]: ET++·InterViews 줄바꿈 알고리즘 · RTL System 컴파일러 최적화(레지스터 할당 `RegisterAllocator`, 명령어 스케줄링 `RISCscheduler`/`CISCscheduler`) · ET++SwapsManager 금융 계산 엔진(현금흐름 생성·스왑 평가·할인계수 계산 전략을 조합) · Booch components(메모리 할당 전략 managed/controlled/unmanaged를 템플릿 인자로) · RApp 회로 배선(`Router`가 Strategy) · Borland ObjectWindows `Validator`(입력 필드가 선택적 전략에 검증 위임)
- Related Patterns [GoF]: Flyweight — 전략 객체는 좋은 flyweight가 되는 경우가 많음. (Strategy와의 비교는 Template Method·Decorator 쪽 Related Patterns에 있음)

### 최소 조건 후보
- [필수] 같은 목적의 교체 가능한 알고리즘들이 공통 인터페이스(인터페이스·추상 클래스·함수 시그니처·trait)를 따름 — 반례: `if (type == TEX) composeTeX(); else composeSimple();`처럼 변형이 한 클래스 안 메서드·분기로만 존재
- [필수] Context는 알고리즘을 직접 구현하지 않고 보유하거나 전달받은 전략 객체에 위임하며, 구체 전략 타입을 모른 채 공통 인터페이스로만 호출 — 반례: Context가 내부에서 `new TeXCompositor()`를 직접 만들거나 `instanceof`로 전략 종류를 분기
- [필수] 어떤 전략을 쓸지는 Context 밖(클라이언트·설정·조립 코드)에서 정해져 Context에 설치됨 — 근거: GoF collaborations "Clients usually create and pass a ConcreteStrategy", [RG] "컨텍스트는 알맞은 알고리즘을 고를 책임이 없고 클라이언트가 원하는 전략을 넘긴다". 반례: Context 내부 조건문이 전략을 고르면 원전이 제거하려던 조건문이 Context에 그대로 남음
- [선택] **런타임 교체(setter)** — GoF Implementation 2는 컴파일 타임에 선택되고 런타임에 바뀌지 않는 템플릿 매개변수 전략도 Strategy로 인정. 설치 방식은 생성 시 1회 주입·호출마다 인자 전달·setter 교체·제네릭 타입 매개변수 모두 가능
- [선택] 전략이 클래스 — 함수형 인터페이스·람다·클로저·함수 포인터도 가능 ([RG] 단점 3 "익명 함수 집합으로 대체", rust-unofficial Strategy "trait 없이 클로저로")
- [선택] 데이터 전달 방식: 매개변수 전달 vs Context 자신 전달 [GoF Implementation 1]
- [선택] 전략이 없을 때의 기본 행위(선택적 전략) [GoF Implementation 3]
- [선택] 무상태 전략 공유(Flyweight) [GoF Consequences]
- [선택] 전략 선택을 돕는 레지스트리·팩토리 [노트]
- 불변식 후보:
  - 모든 ConcreteStrategy는 Strategy 인터페이스의 같은 계약(입력·출력의 의미, 사전·사후조건)을 지켜 Context가 어느 것을 받아도 올바르게 동작(치환 가능성) [노트]. 실례: `Comparator`는 "전순서(total ordering)를 부과하는 비교 함수"라는 계약을 가지며(Javadoc), Rust `slice::sort_by`는 비교 함수가 전순서가 아니면 panic할 수 있다고 명시(std 문서) — 계약 위반 전략이 Context를 깨뜨리는 사례
  - 여러 Context가 공유하는 전략은 호출 간 상태를 유지하지 않음 [GoF]
  - 전략들은 서로를 모름 — 어떤 전략이 다음 전략을 지정하면 State 쪽 [RG]

### 사용 단서
- 이런 코드/요구가 보이면:
  - 한 객체 안에서 같은 일을 하는 알고리즘 변형을 쓰고 런타임에 바꿔야 함 [RG]
  - 어떤 행위를 실행하는 방식만 다른 비슷한 클래스가 여럿 있음 [RG, GoF "행위만 다른 관련 클래스"]
  - 비즈니스 로직과, 그 로직 입장에서는 덜 중요한 알고리즘 구현 세부(특화 자료구조·의존성)를 분리하고 싶음 [RG, GoF "클라이언트가 알면 안 되는 데이터"]
  - 같은 알고리즘의 변형을 고르는 거대한 조건문 [RG, GoF]
  - 코드 모양 [노트]: `switch (paymentMethod)`가 계산 메서드 여러 곳에 반복되고 새 결제 수단마다 Context를 수정 / 정렬·비교 기준, 할인·요금 정책, 압축·직렬화 포맷, 재시도·백오프 정책, 거절 정책(`ThreadPoolExecutor`), 해시 알고리즘(Rust `HashMap`의 `S`), 메모리 할당기(`#[global_allocator]`)처럼 "정책(policy)"이라 부를 만한 교체 지점
- 쓰지 말아야 할 때:
  - 알고리즘이 두어 개뿐이고 거의 바뀌지 않음 — 새 클래스·인터페이스로 프로그램을 과하게 복잡하게 만들 뿐 [RG]
  - 행위 변형이 클라이언트에게 의미가 없음 — 클라이언트가 차이를 알아야 하는 부담만 생김 [GoF]
  - 전략마다 필요한 데이터가 크게 달라 공통 인터페이스가 비대해지거나 대부분의 인자가 쓰이지 않음 [GoF 통신 오버헤드]
  - 알고리즘 전체가 아니라 고정된 골격 속 몇 단계만 달라짐 → Template Method [GoF TM Related, RG]
  - 교체가 아니라 객체의 상태 변화에 따라 행위가 자동으로 바뀌어야 함 → State [RG]
  - 일급 함수가 있는 언어에서 무상태 한두 줄 알고리즘이면 클래스 계층 대신 함수 값으로 충분 [RG 단점 3]

### 비교 대상
- vs State (PATTERNS.md 빠른 비교 페어 "외부 교체 vs 내부 전이"):
  - 구분 기준: 둘 다 합성으로 도우미 객체에 위임하지만 Strategy는 전략 객체들을 서로 완전히 독립적이고 서로 모르게 하고, State는 구체 상태 사이 의존을 허용하며 상태가 컨텍스트의 상태를 바꿀 수 있음 ([RG] Strategy·State Relations, State 본문). GoF State collaborations는 전이 결정을 Context나 ConcreteState 어느 쪽이든 허용 → 판별은 "누가 바꾸나"보다 "교체 대상이 같은 목적 알고리즘의 선택인가, 객체 상태에 따른 반응인가(상태 전이가 도메인의 일부인가)" [노트, 출처 종합]
  - 오인 코드 모양: `class Order { OrderState state; void pay() { state = state.pay(this); } }` — 인터페이스 필드 + 위임이라 UML은 Strategy와 같지만 `pay()`가 다음 상태를 반환 → State / `class Checkout { PricingPolicy policy; void setPolicy(PricingPolicy p) }` + 정책 구현들이 서로를 모름 → Strategy [노트]
  - Wikipedia 보조 서술: State는 인터페이스 메서드 호출로 전략을 바꿀 수 있는 Strategy로 해석 가능
- vs Template Method:
  - 구분 기준: Template Method는 **상속**으로 알고리즘 **일부**를 바꾸고, Strategy는 **위임**으로 알고리즘 **전체**를 바꿈 ([GoF] Template Method Related). TM은 클래스 수준이라 정적, Strategy는 객체 수준이라 런타임 교체 가능 ([RG]). GoF Strategy Consequences "서브클래싱의 대안"도 같은 축
  - 오인 코드 모양: `abstract class ReportExporter { final byte[] export() { header(); body(); footer(); } protected abstract void body(); }` → TM / `class ReportExporter { Formatter formatter; byte[] export() { return formatter.format(data); } }` → Strategy [노트]
  - 혼동 주의 1: Spring `JdbcTemplate`은 이름에 Template이 있지만 상속이 아니라 "핵심 JDBC 워크플로를 실행하고 SQL 제공·결과 추출은 애플리케이션 코드에 맡기며, 이 클래스를 쓰는 코드는 콜백 인터페이스만 구현하면 된다"(Javadoc) — 골격 고정 + 가변 단계를 콜백 객체로 위임하는 형태라 상속형 GoF TM이 아님(콜백 = Strategy류) [Javadoc 사실 + 노트]
  - 혼동 주의 2: rust-unofficial 패턴 책의 Strategy 설명은 "알고리즘 골격만 추상 수준에서 정의하고 구체 구현을 분리"라고 서술해 TM과 섞여 있음 → Rust 절에서 인용 시 주의(보조 출처)
- vs Command:
  - 구분 기준: 둘 다 어떤 액션으로 객체를 매개변수화할 수 있어 비슷해 보이지만 의도가 매우 다름 — Command는 임의의 연산을 객체로 바꿔(매개변수가 필드가 됨) 실행 지연·큐잉·이력·원격 전송을 가능하게 하고, Strategy는 같은 일을 하는 서로 다른 방법을 한 컨텍스트 안에서 교체 ([RG] Relations)
  - 오인 코드 모양: `executor.submit(() -> compress(file))` — "무엇을 할지"(작업 자체)를 넘겨 나중에 실행 → Command / `new Archiver(new GzipCompression())` — Archiver는 "압축한다"는 것은 알고 "어떻게"만 위임 → Strategy [노트]
  - 참고: GoF Command Applicability는 커맨드를 "콜백의 객체지향 대체"라고 부름 — 콜백이라는 겉모양은 둘 다 같으므로 의도로 판별
- vs Decorator: 데코레이터는 객체의 겉(skin)을, 전략은 속(guts)을 바꿈 — 객체를 바꾸는 두 대안 ([GoF] Decorator Related, [RG]). 오인 모양: `new BufferedInputStream(in)`(같은 인터페이스로 감싸 행위 추가 → Decorator) vs `new TreeMap<>(comparator)`(내부 알고리즘 교체 → Strategy) [노트]
- vs Bridge (· State · Adapter): 구조가 매우 비슷(모두 합성 기반 위임)하지만 해결하는 문제가 다름 — 패턴은 코드 구조 레시피가 아니라 해결하는 문제를 전달하는 것 ([RG])
- vs Flyweight: 전략 객체는 좋은 flyweight가 되는 경우가 많음 ([GoF] Related)
- vs 단순 다형성 / if-else 메서드 추출(기존 가이드 안티패턴): 분기를 메서드로 추출만 하고 호출부 분기가 남으면 Strategy 아님 — 원전 Consequences "조건문 제거"와 같은 기준

### 세 언어 구현 쟁점
- Java:
  - 전략 인터페이스가 추상 메서드 하나면 함수형 인터페이스 → 람다·메서드 참조로 ConcreteStrategy 클래스 생략. `java.util.function` 문서: 함수형 인터페이스는 람다·메서드 참조의 대상 타입이며 함수형 메서드 하나를 가짐. `@FunctionalInterface`: 개념상 추상 메서드가 정확히 하나. `Comparator`가 대표(`@FunctionalInterface`) (Javadoc). [RG] Java 페이지: Java 8 람다가 Strategy의 더 단순한 대안
  - 전략 조립: `Comparator.comparing(keyExtractor)` 같은 static/default 메서드로 전략을 합성 — 전략 군을 인터페이스 쪽에서 제공 (Javadoc)
  - 표준 라이브러리에 설치 방식 3가지가 모두 있음 (Javadoc): 생성자 주입 `new TreeMap<>(comparator)`(이후 교체 불가) · 호출 인자 `list.sort(comparator)` · setter `ThreadPoolExecutor.setRejectedExecutionHandler(handler)`(런타임 교체) → "런타임 교체 [필수]" 판정 재검토 근거
  - enum으로 닫힌 전략 집합: JLS §8.9.1 enum 상수별 클래스 본문으로 상수마다 알고리즘을 재정의 — 각 상수가 무상태 공유 ConcreteStrategy [JLS 사실 + 노트]
  - 함정: 전략이 연관 메서드를 둘 이상 가져야 하면(예: `compress` + `fileExtension`) 함수형 인터페이스가 아니어서 람다 불가 → 인터페이스 + 클래스/enum [노트]
  - 함정: 싱글턴·static으로 공유하는 전략에 가변 필드를 두면 원전 "공유 전략은 호출 간 상태를 유지하지 않음" 위반 → 동시성 버그 [GoF + 노트]
- TypeScript:
  - 일급 함수: 전략 = 함수 타입 표현식 `(a: T, b: T) => number` (TS 핸드북 Function Type Expressions)
  - `Array.prototype.sort(compareFn)`가 표준 실례. `compareFn`을 생략하면 원소를 문자열로 바꿔 UTF-16 코드 단위 순서로 비교하는 기본 행위 — 원전 Implementation 3 "선택적 전략 + 기본 행위"의 실례이자 함정(MDN 예: `[1, 30, 4, 21, 100000].sort()` → `[1, 100000, 21, 30, 4]`) (MDN)
  - 함정: `sort()`는 제자리 정렬로 원 배열을 바꾸고 같은 배열 참조를 반환 (MDN) — 예제 작성 시 원본 변경 주의
  - 구조적 타이핑: `implements` 없이도 메서드 이름·시그니처 모양만 맞으면 Strategy 타입으로 통과 (TS 핸드북 Type Compatibility) → 의도치 않은 객체가 전략으로 들어갈 수 있음, 의도를 드러내려면 `implements` 명시 [핸드북 사실 + 노트]
  - 여러 메서드를 가진 전략은 `interface` + 객체 리터럴·클래스. 클래스 메서드를 전략 함수로 떼어 넘기면 `this` 유실 (TS 핸드북 Classes "this at Runtime in Classes")
  - 전략 레지스트리: 전략 종류를 문자열 리터럴 유니온으로 두고 `switch` + `never` 망라성 검사로 누락 방지 (TS 핸드북 Narrowing) [적용은 노트]
- Rust (std만):
  - 세 가지 표현 [Rust 책·rust-unofficial·RG 종합]:
    - (a) 제네릭 + trait 경계 `struct Context<S: Strategy> { strategy: S }` — 단형화(monomorphization)로 정적 디스패치, 컴파일 타임 선택·런타임 교체 불가 = 원전 "템플릿 매개변수로서의 전략"과 같은 트레이드오프 (Rust 책 18.2: 동질 컬렉션만 다루면 제네릭·trait 경계가 낫고 컴파일 타임에 단형화됨)
    - (b) trait 객체 `Box<dyn Strategy>` — 동적 디스패치, 런타임 교체·서로 다른 전략을 한 컬렉션에 보관 가능, 정적 디스패치에는 없는 런타임 조회 비용이 있고 인라인 최적화가 막힘 (Rust 책 18.2)
    - (c) 클로저 `F: Fn(&T) -> U` 또는 `Box<dyn Fn(&T) -> U>` — rust-unofficial Strategy: trait 없이 클로저로 같은 아이디어, `Option::map`이 같은 원리 · [RG] Rust: 함수·클로저로 복잡한 인터페이스 정의 없이 행위를 주입, 반복자 동작 방식처럼 Rust에서 암묵적으로 널리 쓰임
  - 클로저 trait 선택: 여러 번 호출되는 전략은 `Fn`/`FnMut`, `FnOnce`는 한 번만 호출 가능 (Rust 책 13.1). `slice::sort_by`는 `FnMut(&T, &T) -> Ordering`을 받음 (std 문서)
  - 표준 라이브러리 실례: `HashMap<K, V, S>`의 `S`(BuildHasher) — `with_hasher`·`with_capacity_and_hasher`·`default`로 "HashMap마다" 해시 알고리즘 교체(문서, 기본은 현재 SipHash 1-3) · `GlobalAlloc` + `#[global_allocator]`로 표준 라이브러리 기본 할당기를 등록한 할당기로 교체(문서)
  - 함정: trait 객체로 쓸 trait은 dyn compatibility 규칙을 지켜야 함 — Rust 책 18.3이 "trait 객체일 때 `self`를 반환하는 기본 구현을 둘 수 없다"를 그 규칙의 예로 듦 → 전략 trait에 제네릭 메서드나 `Self` 반환을 넣으면 (b) 방식이 막힘 [책 사실 + 노트]
  - 함정: 전략이 Context 데이터를 참조로 보관하면 수명 매개변수가 Context 전체로 전파 → 원전 Implementation 1(a) "데이터를 매개변수로 전달" 방식이 빌림 규칙과 잘 맞음 [노트]

### 실제 사용처
- `java.util.Comparator` + `List.sort` / `Collections.sort` / `TreeMap(Comparator)` (Java SE 21) — `Comparator`=Strategy, 람다·구현 클래스=ConcreteStrategy, `List.sort`·`TreeMap`=Context(TreeMap은 생성 시 설치, `List.sort`는 호출마다 전달). Javadoc: 정렬 메서드(`Collections.sort`, `Arrays.sort`)에 넘겨 정렬 순서를 정밀 제어, 전순서 계약, `@FunctionalInterface`. 패턴명 명시: [RG] Java Strategy 페이지("`java.util.Comparator#compare()` called from `Collections#sort()`") — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html
- Spring Framework `org.springframework.core.io.ResourceLoader` (Spring Framework 7.0.9) — Javadoc 첫 문장이 "Strategy interface for loading resources". `ResourceLoader`=Strategy, `DefaultResourceLoader`(기본 구현, `ResourceEditor`가 사용)와 그 서브클래스 `FileSystemResourceLoader`·`ClassRelativeResourceLoader`·`ServletContextResourceLoader`=ConcreteStrategy, `ResourceEditor` 등 ResourceLoader를 받아 쓰는 쪽=Context. 패턴명 명시: Javadoc 자체 — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/io/ResourceLoader.html
- `java.util.concurrent.ThreadPoolExecutor` + `RejectedExecutionHandler` (Java SE 21) — `RejectedExecutionHandler`=Strategy, `AbortPolicy`(기본)·`CallerRunsPolicy`·`DiscardPolicy`·`DiscardOldestPolicy`=ConcreteStrategy(Javadoc "네 가지 미리 정의된 handler policy", 사용자 정의 핸들러도 가능), `ThreadPoolExecutor`=Context(`execute`가 거절 시 핸들러의 `rejectedExecution` 호출, `setRejectedExecutionHandler`로 런타임 교체). 패턴명 명시 출처 없음 — 원전 별칭 "Policy"와 Javadoc 용어 "policies"의 일치에 근거한 노트 대응 — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html
- `Array.prototype.sort(compareFn)` (MDN) — `compareFn`=ConcreteStrategy(함수), `sort`=Context 연산, 생략 시 기본 행위(선택적 전략). 패턴명 명시 출처 없음 — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
- Rust `slice::sort_by` (std 1.98.1) — 비교 클로저=ConcreteStrategy, `sort_by`=Context 연산. 패턴명 명시 출처 없음([RG] Rust는 "Rust에서 Strategy가 암묵적으로 널리 쓰인다"고 일반 서술) — https://doc.rust-lang.org/std/primitive.slice.html
- Rust `std::collections::HashMap<K, V, S>` + `BuildHasher` (std 1.98.1) — `S`=Strategy(제네릭 매개변수, 컴파일 타임 선택), `RandomState`=기본 ConcreteStrategy, `with_hasher`=설치. 패턴명 명시 출처 없음 — https://doc.rust-lang.org/std/collections/struct.HashMap.html
- Rust `std::alloc::GlobalAlloc` + `#[global_allocator]` (std 1.98.1) — `GlobalAlloc`=Strategy, 등록한 할당기=ConcreteStrategy, 표준 라이브러리 할당 경로=Context. GoF Known Uses의 Booch 메모리 할당 전략과 같은 계열 [노트]. 패턴명 명시 출처 없음 — https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html
- (채택 보류) [RG] Java Strategy 페이지의 `javax.servlet.http.HttpServlet`(service·doXXX), `javax.servlet.Filter#doFilter()` — 같은 사이트가 HttpServlet은 Template Method 예, Filter는 CoR 예로도 들어 분류가 겹침(미해결 질문)

### 기존 가이드 승계분
- 최소 조건 취지: ① 교체 대상 알고리즘들이 모두 같은 인터페이스(추상 클래스·함수형 시그니처 포함)를 구현하고 클라이언트는 그 추상 타입에만 의존 ② 각 알고리즘이 독립 객체(또는 1급 함수)로 캡슐화(같은 클래스 안 분기를 메서드로 추출한 것만으로는 아님) ③ 런타임에 컨텍스트의 전략을 다른 전략으로 바꿔 끼울 수 있음(생성자 주입·setter·메서드 인자) ④ 컨텍스트는 알고리즘을 직접 구현하지 않고 위임 — "무엇을 할지"는 알고 "어떻게"는 모름. ①과 ③이 함께 빠지면 단순 다형성이나 절차적 분기를 흉내 낸 약한 전략. 오해 정리: State(구조 거의 동일·의도 다름, 전략끼리는 서로 모르고 클라이언트가 명시 선택, 상태는 전이를 앎), if/else 함수 추출(새 알고리즘마다 분기 수정이면 OCP 위반), Template Method(상속 vs 합성이 가장 중요한 차이), 모든 다형성을 전략으로 부르기(교체 가능한 알고리즘이라는 의도가 드러나야 함)
  - 원전 대조 메모: ③ "런타임 교체 [필수]"는 GoF Implementation 2(컴파일 타임 선택·런타임 불변 템플릿 전략도 Strategy)와 충돌 — 새 가이드에선 [선택]으로, 대신 "선택이 Context 밖에서 이뤄져 설치됨"을 [필수]로 두는 안 검토. ③의 괄호 속 주입 방식(생성자·메서드 인자)은 이미 "교체"가 아닌 "설치"도 포함하고 있어 문구와 예시가 어긋남
- 참고 자료(기존 목록 그대로):
  - Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software* (GoF, 1994) — Strategy 패턴 정식 정의.
  - Refactoring.Guru, "Strategy" — https://refactoring.guru/design-patterns/strategy
  - Joshua Bloch, *Effective Java* (3rd Edition) — Item 42·44 (함수 객체와 표준 함수형 인터페이스, 람다와 전략 패턴의 관계).
  - Oracle Java Documentation, `java.util.Comparator` — https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Comparator.html
  - Oracle Java Documentation, `java.awt.LayoutManager` / `javax.swing` 레이아웃 매니저 — 컨테이너의 자식 배치 알고리즘을 전략으로 위임하는 대표 사례.
  - Robert C. Martin, *Agile Software Development: Principles, Patterns, and Practices* — OCP와 전략 패턴의 관계.

### 출처
- [GoF 원서 HTML 사본 — Strategy](https://www.cs.unc.edu/~stotts/GOF/hires/pat5i.htm) — Intent, Also Known As(Policy), Motivation, Applicability, Participants, Collaborations, Consequences 7항목, Implementation 3항목(템플릿 매개변수 전략 포함), Known Uses, Related Patterns(Flyweight) · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 315 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Template Method](https://www.cs.unc.edu/~stotts/GOF/hires/pat5j.htm) — Related Patterns: 상속으로 일부 vs 위임으로 전체 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Decorator](https://www.cs.unc.edu/~stotts/GOF/hires/pat4d.htm) — Related Patterns: skin vs guts · 조회 2026-09-17
- [GoF 원서 HTML 사본 — State](https://www.cs.unc.edu/~stotts/GOF/hires/pat5h.htm) — Collaborations: 전이 결정은 Context 또는 ConcreteState · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Command](https://www.cs.unc.edu/~stotts/GOF/hires/pat5b.htm) — Applicability: 콜백의 객체지향 대체 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Encapsulating Variation(Strategy 객체는 알고리즘을 캡슐화, 패턴이 없으면 Context에 박힘) · 조회 2026-09-17
- [refactoring.guru — Strategy](https://refactoring.guru/design-patterns/strategy) — 컨텍스트는 선택 책임이 없고 클라이언트가 전략을 넘김, Applicability 4항목, Pros/Cons(과복잡화·함수형 대안), Relations(Bridge·State·Command·Decorator·Template Method) · 조회 2026-09-17
- [refactoring.guru — State](https://refactoring.guru/design-patterns/state) — 상태는 서로를 알고 전이 개시, 전략은 거의 서로 모름 · 조회 2026-09-17
- [refactoring.guru — Strategy in Java](https://refactoring.guru/design-patterns/strategy/java/example) — 람다가 더 단순한 대안, 사용 예 Comparator·HttpServlet·Filter · 조회 2026-09-17
- [refactoring.guru — Strategy in TypeScript](https://refactoring.guru/design-patterns/strategy/typescript/example) — 사용 예·식별 기준(위임 메서드 + 교체 setter) · 조회 2026-09-17
- [refactoring.guru — Strategy in Rust](https://refactoring.guru/design-patterns/strategy/rust/example) — trait 기반 개념 예와 함수·클로저 접근 · 조회 2026-09-17
- [Rust Design Patterns (rust-unofficial) — Strategy](https://rust-unofficial.github.io/patterns/patterns/behavioural/strategy.html) — trait 예·클로저 예·Option::map, 골격 서술이 TM과 섞임(보조 출처) · 조회 2026-09-17
- [Wikipedia — Strategy pattern](https://en.wikipedia.org/wiki/Strategy_pattern) — 런타임 알고리즘 선택 개요(보조 출처) · 조회 2026-09-17
- [Wikipedia — State pattern](https://en.wikipedia.org/wiki/State_pattern) — State를 Strategy로 해석(보조 출처) · 조회 2026-09-17
- [Java SE 21 — Comparator](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Comparator.html) — 전순서 비교 함수, sort 메서드에 전달, @FunctionalInterface, comparing 팩토리 · 조회 2026-09-17
- [Java SE 21 — List](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html) — default void sort(Comparator) · 조회 2026-09-17
- [Java SE 21 — TreeMap](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html) — TreeMap(Comparator) 생성자 · 조회 2026-09-17
- [Java SE 21 — ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html) — 네 가지 거절 handler policy, setRejectedExecutionHandler · 조회 2026-09-17
- [Java SE 21 — java.util.function](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/package-summary.html) — 함수형 인터페이스는 람다·메서드 참조의 대상 타입 · 조회 2026-09-17
- [Java SE 21 — FunctionalInterface](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/FunctionalInterface.html) — 추상 메서드 정확히 하나 · 조회 2026-09-17
- [JLS SE 21 — Chapter 8 (§8.9.1)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) — enum 상수 클래스 본문 · 조회 2026-09-17
- [Spring Framework 7.0.9 API — ResourceLoader](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/io/ResourceLoader.html) — "Strategy interface for loading resources" · 조회 2026-09-17
- [Spring Framework 7.0.9 API — DefaultResourceLoader](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/io/DefaultResourceLoader.html) — 기본 구현, ResourceEditor가 사용, 서브클래스 목록 · 조회 2026-09-17
- [Spring Framework 7.0.9 API — JdbcTemplate](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html) — 워크플로 실행 + 콜백 인터페이스 위임 · 조회 2026-09-17
- [MDN — Array.prototype.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) — compareFn, 기본 문자열 비교, 제자리 정렬 · 조회 2026-09-17
- [TypeScript Handbook — More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) — Function Type Expressions · 조회 2026-09-17
- [TypeScript Handbook — Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — 구조적 서브타이핑 · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — this at Runtime in Classes · 조회 2026-09-17
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — never 망라성 검사 · 조회 2026-09-17
- [The Rust Programming Language — 18.2 Using Trait Objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) — 정적 vs 동적 디스패치, 동질 컬렉션이면 제네릭 · 조회 2026-09-17
- [The Rust Programming Language — 18.3 Implementing an Object-Oriented Design Pattern](https://doc.rust-lang.org/book/ch18-03-oo-design-patterns.html) — dyn compatibility 규칙 예 · 조회 2026-09-17
- [The Rust Programming Language — 13.1 Closures](https://doc.rust-lang.org/book/ch13-01-closures.html) — Fn/FnMut/FnOnce · 조회 2026-09-17
- [Rust std — primitive slice](https://doc.rust-lang.org/std/primitive.slice.html) — sort_by(FnMut), 전순서가 아니면 panic 가능 · 조회 2026-09-17
- [Rust std — HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html) — HashMap마다 해시 알고리즘 교체(with_hasher 등), 기본 SipHash 1-3 · 조회 2026-09-17
- [Rust std — GlobalAlloc](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html) — #[global_allocator]로 기본 할당기 교체 · 조회 2026-09-17
- [Java SE 21 — java.awt.Container](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/awt/Container.html) — setLayout(LayoutManager)(미해결 질문 근거) · 조회 2026-09-17
- [Java SE 21 — java.awt.LayoutManager](https://docs.oracle.com/en/java/javase/21/docs/api/java.desktop/java/awt/LayoutManager.html) — 컨테이너 배치 방법을 아는 클래스의 인터페이스(미해결 질문 근거) · 조회 2026-09-17

### 미해결 질문
- 기존 가이드 조건 ③(런타임 교체 [필수]) vs 원전 Implementation 2(템플릿 매개변수 전략) — 새 가이드에서 [선택]으로 내릴지. 노트 권고: [선택]으로 두고 "선택이 Context 밖에서 이뤄짐"을 [필수]로(`TreeMap` 생성자 주입, Rust 제네릭 `S`가 모두 이 경우)
- State 편 조건 ③(전이 결정권 상태 측 [필수])이 원전과 충돌 → Strategy 편의 State 비교 문구를 "누가 바꾸나" 단독 기준으로 쓰면 안 됨. 두 편 문구 동기화 필요
- Effective Java 3판 아이템 번호(기존 가이드 Item 42·44)와 "strategy enum" 서술은 원서 확인 안 함
- `java.awt.LayoutManager`(`Container.setLayout`으로 설치, Javadoc 확인)를 Strategy로 명시한 신뢰 출처를 찾지 못함 — 기존 가이드가 "대표 사례"로 든 근거 필요
- `ThreadPoolExecutor` 거절 정책·`Array.prototype.sort`·`slice::sort_by`·`HashMap` `S`·`GlobalAlloc`을 Strategy라고 명시한 1차 출처 없음(노트 대응). Javadoc이 스스로 "Strategy interface"라고 부르는 사례는 Spring `ResourceLoader`만 확인
- [RG]가 `HttpServlet`을 Strategy와 Template Method 양쪽 예로, `Filter#doFilter`를 Strategy와 CoR 양쪽 예로 든 불일치 — 가이드 사례에서 제외 권고
- rust-unofficial 패턴 책의 Strategy 정의(골격 서술)가 TM과 섞여 있음 — Rust 절에서 이 책을 인용할 범위
- GoF participants 목록에 Client가 없음 — 새 가이드 "등장하는 개념과 정의(participants 전부)"에 Client를 넣을지(collaborations에는 등장)

## Template Method (템플릿 메서드)

### 원전 대응
- 분류: 행위 · **클래스** 범위 [GoF 표 1.1]. 원서 325쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함)
- 의도(intent): 연산 안에 알고리즘의 골격을 정의하고 일부 단계를 서브클래스로 미룸. 알고리즘 구조를 바꾸지 않고 서브클래스가 알고리즘의 특정 단계를 재정의하게 함 [GoF]
- participants [GoF]:
  - `AbstractClass` (Application) — 구체 서브클래스가 알고리즘 단계를 구현하도록 추상 primitive operation 정의. 알고리즘 골격을 정의하는 template method 구현 — template method는 primitive operation뿐 아니라 AbstractClass에 정의된 연산이나 다른 객체의 연산도 호출
  - `ConcreteClass` (MyApplication) — 서브클래스 특유 단계를 수행하도록 primitive operation 구현
- collaborations: 원문은 "ConcreteClass는 알고리즘의 불변 단계 구현을 AbstractClass에 의존한다" 한 문장 [GoF]. 단계 분해(Consequences의 제어 역전 서술에서 도출) [노트]:
  1. 클라이언트가 AbstractClass 타입으로 template method 호출
  2. template method가 고정된 순서로 불변 단계를 실행 — 왜: 알고리즘 구조를 한 곳에 고정
  3. 가변 단계에서 서브클래스가 구현한 primitive 연산이나 재정의한 hook을 호출(부모가 자식을 호출 — 할리우드 원칙)
  4. 결과를 조립해 반환
- consequences [GoF]:
  - 코드 재사용의 기본 기법, 특히 클래스 라이브러리에서 공통 행위를 추출하는 수단
  - 역전된 제어 구조 — "할리우드 원칙(Don't call us, we'll call you)": 부모 클래스가 서브클래스 연산을 호출하고 그 반대가 아님
  - template method가 호출하는 연산 종류: 구체 연산(ConcreteClass 또는 클라이언트 클래스) · 구체 AbstractClass 연산 · primitive(추상) 연산 · factory method · **hook 연산**(서브클래스가 필요하면 확장하는 기본 행위, 흔히 기본은 아무것도 안 함)
  - 어떤 연산이 hook(재정의해도 됨)이고 어떤 것이 추상(반드시 재정의)인지 명시하는 것이 중요
  - 서브클래스가 부모 연산을 재정의하면서 부모 호출을 잊기 쉬움 → 부모의 template method에서 hook을 호출하게 바꿔 부모가 확장 방식을 통제
  - 대가(원전은 별도 나열 없음) [RG]: 제공된 골격이 일부 클라이언트를 제약 · 서브클래스가 기본 단계 구현을 억제하면 리스코프 치환 원칙 위반 가능 · 단계가 많을수록 유지보수 어려움
- 원전 구현 쟁점 [GoF]: C++ 접근 제어 — template method가 호출하는 primitive는 protected, 반드시 재정의할 것은 pure virtual, template method 자체는 재정의되면 안 되므로 non-virtual / primitive 연산 수 최소화(재정의할 것이 많을수록 번거로움) / 명명 규칙(MacApp은 재정의할 연산에 "Do-" 접두사)
- Applicability [GoF]: 알고리즘의 불변 부분을 한 번 구현하고 가변 행위는 서브클래스에 맡김 · 서브클래스 공통 행위를 공통 클래스로 추출해 중복 제거(Opdyke·Johnson의 "일반화를 위한 리팩터링") · 서브클래스 확장 통제(특정 지점의 hook에서만 확장 허용)
- Known Uses [GoF]: 거의 모든 추상 클래스에서 발견. Wirfs-Brock 등이 개요 제공

### 최소 조건 후보
- [필수] 상위 타입에 알고리즘 단계와 호출 순서를 고정한 골격 메서드(template method)가 있음 — 반례: 추상 메서드만 선언하고 호출 순서는 서브클래스나 클라이언트가 정하면 그냥 추상 클래스
- [필수] 가변 단계가 별도 연산(추상 primitive 또는 기본 구현이 있는 hook)으로 분리되어 서브클래스(구현 타입)가 채움 — 반례: 서브클래스가 골격 메서드 전체를 재정의하면 골격 공유가 없음
- [필수] 제어가 상위→하위로 흐름(골격이 하위 단계를 호출) — 반례: 서브클래스가 `super.step1(); myStep(); super.step3();`로 순서를 스스로 조립(원전 "부모 호출을 잊기 쉬운" 구조)
- [선택] 골격 메서드 재정의 금지 장치(Java `final`, C++ non-virtual) — 원전은 "재정의되면 안 된다"고 권고하지만, `InputStream.read(byte[], int, int)`처럼 재정의 가능한 골격도 흔하고 TypeScript는 수단이 없음
- [선택] hook(기본 구현이 있는 선택적 단계) — 없어도 패턴 [GoF 연산 종류 목록]
- [선택] primitive를 protected로 제한 [GoF]
- [선택] factory method를 단계로 호출 [GoF]
- 불변식 후보: 서브클래스는 골격의 단계 순서를 바꾸지 못함 [GoF 의도에서 도출] · 각 단계 구현은 골격이 기대하는 사전·사후조건을 지킴(기본 단계 억제 시 LSP 위반 위험 — [RG])

### 사용 단서
- 이런 코드/요구가 보이면:
  - 거의 같은 알고리즘을 가진 클래스 여럿이 일부 단계만 달라 알고리즘을 바꾸면 모든 클래스를 고쳐야 함 [RG, GoF]
  - 클라이언트가 큰 알고리즘의 특정 단계만 확장하고 전체 구조는 건드리지 못하게 해야 함 [RG, GoF "확장 통제"]
  - 프레임워크가 흐름(초기화→처리→정리)을 쥐고 사용자 확장 지점을 정해 줌 (Spring `AbstractApplicationContext.onRefresh`, `ThreadPoolExecutor.beforeExecute`/`afterExecute` hook)
  - 서브클래스가 부모 메서드를 재정의하면서 `super` 호출을 자꾸 빠뜨림 [GoF]
  - 코드 모양: 여러 클래스에 `open(); validate(); parse(); close();` 같은 순서가 복붙 [노트]
- 쓰지 말아야 할 때:
  - 알고리즘 전체를 런타임에 바꿔야 함 → Strategy [GoF, RG]
  - 변형 축이 여럿이라 조합마다 서브클래스가 늘어남(상속은 축 하나) [노트]
  - 서브클래스가 기본 단계를 억제해야 하는 경우가 많음(LSP 위반 위험) [RG]
  - 단계 수가 계속 늘어남 [RG]

### 비교 대상
- vs Strategy: 상속으로 알고리즘 일부 vs 위임으로 전체 ([GoF] Related), 클래스 수준·정적 vs 객체 수준·런타임 ([RG]). 오인 코드 모양과 Spring `JdbcTemplate`(이름은 Template이지만 콜백 위임) 주의점은 Strategy 절 참조
- vs Factory Method: Factory Method는 Template Method의 특수화이며, factory method가 큰 template method의 한 단계가 될 수 있음 ([RG]). factory method는 흔히 template method가 호출 ([GoF] TM Related, FM Related — 문서 예제의 `NewDocument`가 template method)
- vs Observer 구현: 통지를 template method의 마지막 단계로 두어 주체 상태가 일관된 뒤에 통지 ([GoF] Observer Implementation)
- vs Iterator 내부 순회: 순회 연산 `Traverse`가 primitive `TestItem`·`ProcessItem`을 가진 template method ([GoF] Iterator 각주)
- vs Chain of Responsibility: 사슬 속 클래스는 처리 여부·전달 대상 결정을 primitive로 둔 template method를 최소 하나 포함하기 쉬움 ([GoF 토론] Summary)

### 세 언어 구현 쟁점
- Java:
  - `abstract class` + `public final` 골격 + `protected abstract` 단계 + 빈 `protected` hook. `final` 메서드는 서브클래스가 재정의·숨김 불가, 시도하면 컴파일 오류 (JLS §8.4.3.3) — 원전 "template method는 재정의되면 안 됨"의 Java 대응
  - 인터페이스 `default` 메서드로 골격을 제공할 수 있지만 인터페이스 메서드 수정자에 `final`이 없어(JLS §9.4 InterfaceMethodModifier: public·private·abstract·default·static·strictfp) 재정의를 막을 수 없음 [JLS 사실 + 노트]
  - 표준 실례와 함정: `InputStream.read(byte[], int, int)`는 추상 `read()`를 반복 호출하는 골격이지만 Javadoc이 "서브클래스는 더 효율적인 구현을 제공하도록 권장"한다고 명시 — final이 아닌(성능을 위해 재정의되는) 골격 · `AbstractList`는 수정 불가 리스트라면 `get(int)`·`size()`만 구현하면 되고 수정 가능하면 `set` 등을 추가 재정의 · `ThreadPoolExecutor`는 protected hook `beforeExecute`·`afterExecute`·`terminated`를 문서화 (Javadoc)
- TypeScript:
  - `abstract class`·`abstract` 메서드 지원, 추상 클래스는 직접 인스턴스화 불가 (TS 핸드북 Classes). `protected` 지원
  - `final` 수정자 없음 — final 클래스 제안 microsoft/TypeScript#8306은 "Won't Fix" 라벨로 종료, final 메서드 제안 #33446은 Duplicate로 종료 → 골격 메서드 재정의를 컴파일러로 막을 수 없음
  - `noImplicitOverride` 설정은 재정의 시 `override` 키워드를 요구해 기반 클래스와 이름이 어긋나는 실수를 드러내지만 재정의 자체를 금지하지는 않음 (tsconfig 문서) [문서 사실 + 노트]
  - 대안: 골격을 클래스 밖 함수로 두고 단계들을 객체로 받음 — 이 경우 상속형 TM이 아니라 Strategy 쪽으로 이동 [노트]
- Rust (std만):
  - 상속이 없으므로 trait의 제공(provided) 메서드가 필수(required) 메서드를 호출하는 형태가 골격 역할: Rust 책 10.2 "기본 구현은 같은 trait의 기본 구현 없는 다른 메서드를 호출할 수 있어, 구현자는 작은 부분만 지정하면 됨" · `std::io::Read`는 필수 메서드 `read()` 하나로 정의되고 다른 여러 메서드가 `read()`로 구현됨 · `Iterator`는 필수 `next` + 수십 개 제공 메서드 (std 문서)
  - 함정: 제공 메서드는 구현자가 재정의할 수 있음 — trait에는 골격 고정(final) 수단이 없음. 고정하려면 골격을 trait 밖 제네릭 함수 `fn run<T: Steps>(t: &mut T)`로 두는 방법이 있으나 그러면 "상위 타입이 골격 보유" 모양이 바뀜 [노트]
  - 함정: trait 객체로 쓸 경우 제네릭 제공 메서드 등은 dyn compatibility 제약을 받음 — `Iterator` 문서의 많은 제공 메서드가 `where Self: Sized` 경계를 가짐 [문서 관찰 + 노트]
  - refactoring.guru Rust에 개념 예제 있음(trait 기본 메서드 방식)

### 실제 사용처
- Spring Framework `AbstractApplicationContext` (Spring Framework 7.0.9) — 클래스 Javadoc: "Template Method 디자인 패턴을 사용하며, 구체 서브클래스가 추상 메서드를 구현해야 함". `refreshBeanFactory()`="서브클래스가 실제 설정 로드를 위해 구현해야 함"(primitive), `onRefresh()`·`onClose()`="컨텍스트별 작업을 추가하려고 재정의할 수 있는 template method"(Javadoc 용어, 원전 기준으로는 hook). AbstractApplicationContext=AbstractClass, `GenericApplicationContext` 등 서브클래스=ConcreteClass. 패턴명 명시: Javadoc 자체 — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/support/AbstractApplicationContext.html
- `java.io.InputStream` (Java SE 21) — AbstractClass, 추상 `read()`=primitive, `read(byte[], int, int)`=template method(구현 요구사항: `read()`를 반복 호출). 패턴명 명시: [RG] Java TM 페이지("`InputStream`·`OutputStream`·`Reader`·`Writer`의 모든 비추상 메서드") — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html
- `java.util.AbstractList` (Java SE 21) — `get(int)`·`size()`=primitive, 나머지 리스트 연산=골격. 패턴명 명시: [RG] Java TM 페이지 — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/AbstractList.html
- `jakarta.servlet.http.HttpServlet` (Jakarta Servlet 6.0) — protected `service()`가 HTTP 메서드별 `doGet`·`doPost` 등으로 디스패치하는 골격, 서브클래스는 doXXX 중 최소 하나 재정의, `service` 재정의 이유는 거의 없음(Javadoc). 패턴명 명시: [RG] Java TM 페이지(doXXX 기본 405 응답) — https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/http/httpservlet
- `java.util.concurrent.ThreadPoolExecutor` hook 메서드 (Java SE 21) — Javadoc "Hook methods" 절: 각 작업 전후 호출되는 protected `beforeExecute`·`afterExecute`, 종료 시 `terminated`. 패턴명 명시 출처 없음(원전 hook 용어와 일치) — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html
- Rust `std::io::Read` (std 1.98.1) — trait=AbstractClass 역할, `read`=primitive, `read_to_end`·`read_exact` 등 제공 메서드=골격. 패턴명 명시 출처 없음 — https://doc.rust-lang.org/std/io/trait.Read.html

### 기존 가이드 승계분
- 최소 조건 취지: ① 추상 클래스 등 상위 타입이 전체 단계와 호출 순서를 고정한 메서드를 보유하고 보통 `final`로 봉인 ② 가변 단계가 추상 메서드(primitive) 또는 기본 구현 있는 hook으로 분리 ③ 제어 흐름이 상위→하위(할리우드 원칙) ④ 구체 하위 클래스가 최소 1개 이상(차이가 없거나 하위 클래스가 없으면 동기가 없는 추상 클래스). 1·3이 무너지면 단순 상속 재정의. 오해 정리: Strategy(상속·컴파일 타임 고정 vs 합성·런타임 주입, 전체 교체면 Strategy·일부 단계면 TM), 추상 메서드만 두면 TM이라는 오해(순서를 정한 골격 메서드가 있어야), hook은 필수 아님, Factory Method는 TM의 특수한 경우
  - 원전 대조 메모: ①의 `final` 봉인은 원전 권고와 일치하나 TS에선 불가·Java 표준 라이브러리에도 비final 골격이 흔함 → [선택]으로 분리 검토
- 참고 자료(기존 목록 그대로):
  - 원전: Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (Addison-Wesley, 1994), Template Method 항목.
  - Eric Freeman, Elisabeth Robson, "Head First Design Patterns" 2nd Edition, O'Reilly, 2020. — 음료 제조 예시의 원형.
  - Java EE / Jakarta EE 명세: `javax.servlet.http.HttpServlet` — `service()` / `doGet()` / `doPost()` 구조.
  - Java 표준 라이브러리: `java.io.InputStream#read(byte[], int, int)`을 기반으로 한 read 메서드 골격.
  - Refactoring.Guru, "Template Method" — https://refactoring.guru/design-patterns/template-method
  - Robert C. Martin, "Agile Software Development, Principles, Patterns, and Practices" — Template Method와 LSP/OCP 관계 논의.

### 출처
- [GoF 원서 HTML 사본 — Template Method](https://www.cs.unc.edu/~stotts/GOF/hires/pat5j.htm) — Intent, Applicability, Participants, Collaborations, Consequences(할리우드 원칙, hook), Implementation, Known Uses, Related Patterns(Factory Method·Strategy) · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 클래스 범위 분류, 쪽 표기 325 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Factory Method](https://www.cs.unc.edu/~stotts/GOF/hires/pat3c.htm) — Related Patterns: factory method는 template method 안에서 호출 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Summary: CoR 클래스와 template method · 조회 2026-09-17
- [refactoring.guru — Template Method](https://refactoring.guru/design-patterns/template-method) — Applicability, Pros/Cons(LSP·단계 수), Relations(Factory Method·Strategy) · 조회 2026-09-17
- [refactoring.guru — Template Method in Java](https://refactoring.guru/design-patterns/template-method/java/example) — 사용 예 InputStream 등·AbstractList 등·HttpServlet · 조회 2026-09-17
- [refactoring.guru — Template Method in Rust](https://refactoring.guru/design-patterns/template-method/rust/example) — 개념 예제 존재 · 조회 2026-09-17
- [Spring Framework 7.0.9 API — AbstractApplicationContext](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/support/AbstractApplicationContext.html) — "Uses the Template Method design pattern", refreshBeanFactory·onRefresh·onClose · 조회 2026-09-17
- [Java SE 21 — InputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/InputStream.html) — read(b, off, len)이 read()를 반복 호출, 더 효율적 구현 권장 · 조회 2026-09-17
- [Java SE 21 — AbstractList](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/AbstractList.html) — get·size만 구현하면 수정 불가 리스트 · 조회 2026-09-17
- [Java SE 21 — ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html) — Hook methods 절 · 조회 2026-09-17
- [Jakarta Servlet 6.0 — HttpServlet](https://jakarta.ee/specifications/servlet/6.0/apidocs/jakarta.servlet/jakarta/servlet/http/httpservlet) — service가 doXXX로 디스패치, 최소 하나 재정의 · 조회 2026-09-17
- [JLS SE 21 — Chapter 8 (§8.4.3.3)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html) — final 메서드 재정의·숨김 금지 · 조회 2026-09-17
- [JLS SE 21 — Chapter 9 (§9.4)](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html) — 인터페이스 메서드 수정자 목록(final 없음) · 조회 2026-09-17
- [TypeScript Handbook — Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) — abstract 클래스·멤버, protected · 조회 2026-09-17
- [TypeScript TSConfig — noImplicitOverride](https://www.typescriptlang.org/tsconfig/noImplicitOverride) — override 키워드 요구 · 조회 2026-09-17
- [microsoft/TypeScript#8306 — Support final classes (non-subclassable)](https://github.com/microsoft/TypeScript/issues/8306) — closed, 라벨 Won't Fix · 조회 2026-09-17
- [microsoft/TypeScript#33446 — Support final methods](https://github.com/microsoft/TypeScript/issues/33446) — closed, 라벨 Duplicate · 조회 2026-09-17
- [The Rust Programming Language — 10.2 Traits](https://doc.rust-lang.org/book/ch10-02-traits.html) — 기본 구현이 다른 필수 메서드 호출 가능 · 조회 2026-09-17
- [Rust std — std::io::Read](https://doc.rust-lang.org/std/io/trait.Read.html) — 필수 read 하나, 다른 메서드는 read로 구현 · 조회 2026-09-17
- [Rust std — Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html) — 필수 next + 제공 메서드, where Self: Sized · 조회 2026-09-17

### 미해결 질문
- Rust trait 제공 메서드·Java 인터페이스 default 메서드처럼 상속 없이 골격을 제공하는 형태를 Template Method로 인정할지 — 원전은 "클래스 범위(상속)" 패턴으로 분류
- 기존 가이드 조건 ①의 `final` 봉인을 [필수]에서 분리할지
- `JdbcTemplate`을 Template Method로 소개하는 흔한 설명의 근거 — 공식 Javadoc은 콜백 인터페이스 위임만 서술
- TS final 제안 이슈의 종료 사유(메인테이너 코멘트 원문)는 라벨만 확인하고 본문은 확인 안 함

## Visitor (방문자)

### 원전 대응
- 분류: 행위 · 객체 범위 [GoF 표 1.1]. 원서 331쪽부터(표 1.1 쪽 표기, 종이책 확인 안 함)
- 의도(intent): 객체 구조의 원소들에 수행할 연산을 표현. 연산이 작용하는 원소들의 클래스를 바꾸지 않고 새 연산을 정의할 수 있게 함 [GoF]
- participants [GoF]:
  - `Visitor` (NodeVisitor) — 객체 구조 안의 **ConcreteElement 클래스마다** Visit 연산 선언. 연산 이름과 시그니처가 Visit 요청을 보낸 클래스를 식별 → 방문자가 방문 중인 원소의 구체 클래스를 알고 그 인터페이스로 직접 접근
  - `ConcreteVisitor` (TypeCheckingVisitor) — Visitor가 선언한 각 연산 구현. 각 연산은 구조 안 해당 클래스에 대한 알고리즘 조각. 알고리즘 문맥을 제공하고 지역 상태를 저장(흔히 순회 중 결과 누적)
  - `Element` (Node) — 방문자를 인자로 받는 `Accept` 연산 정의
  - `ConcreteElement` (AssignmentNode, VariableRefNode) — 방문자를 인자로 받는 `Accept` 구현
  - `ObjectStructure` (Program) — 원소를 열거할 수 있음. 방문자가 원소를 방문하게 하는 고수준 인터페이스를 제공할 수 있음. Composite이거나 리스트·집합 같은 컬렉션일 수 있음
- collaborations [GoF]:
  1. Visitor 패턴을 쓰는 클라이언트가 ConcreteVisitor 객체를 생성
  2. 클라이언트가 객체 구조를 순회하며 각 원소를 방문자로 방문 — 왜: 연산은 방문자 하나에, 순회는 구조(또는 반복자)에
  3. 방문받은 원소는 자기 클래스에 대응하는 Visitor 연산을 호출 — 왜: 실행될 연산이 방문자 타입과 원소 타입 둘로 결정(더블 디스패치)
  4. 원소는 자신을 그 연산의 인자로 넘겨 방문자가 필요하면 원소 상태에 접근
- consequences [GoF]:
  - 얻는 것: 새 연산 추가가 쉬움(새 방문자만 추가, 기능이 여러 클래스에 흩어져 있으면 클래스마다 수정해야 함) · 관련 연산을 모으고 무관한 연산을 분리(알고리즘 특화 자료구조를 방문자에 숨김) · 클래스 계층을 가로지른 방문(반복자는 원소가 공통 부모 `Item`을 가져야 하지만 방문자는 무관한 타입도 방문) · 상태 누적(없으면 추가 인자나 전역 변수가 됨)
  - 대가: **새 ConcreteElement 추가가 어려움** — 새 원소마다 Visitor에 새 추상 연산과 모든 ConcreteVisitor에 구현 필요(기본 구현 상속은 예외적). 핵심 고려는 "구조에 적용하는 알고리즘이 자주 바뀌나, 구조를 이루는 원소 클래스가 자주 바뀌나" · **캡슐화 파괴** — ConcreteElement 인터페이스가 방문자가 일할 만큼 강력하다고 가정하므로 내부 상태 접근용 public 연산을 강요할 수 있음
- 원전 구현 쟁점(요지) [GoF]: Visitor에 ConcreteElement마다 `VisitConcreteElement` 연산을 선언 — 각주 10: 인자로 이미 구분되므로 오버로딩으로 같은 이름 `Visit`을 줄 수도 있으나 호출부가 덜 분명해지는 장단점이 있어 "오버로딩을 좋게 보느냐"의 문제 / **더블 디스패치** — 실행되는 연산이 요청 종류와 두 수신자(Visitor·Element)의 타입에 따라 정해짐, `Accept`가 더블 디스패치 연산이며 "이것이 Visitor 패턴의 핵심". 각주 11: 더블·다중 디스패치를 직접 지원하는 언어(CLOS)는 Visitor 필요성이 줄어듦 / 순회 책임 — 객체 구조(흔함, composite는 `Accept`에서 자식 순회), 반복자(내부 반복자는 더블 디스패치를 일으키지 않음), 방문자(ConcreteVisitor마다 순회 코드 중복, 연산 결과에 따라 순회가 달라지는 복잡한 경우)
- Applicability [GoF]: 인터페이스가 서로 다른 여러 클래스의 객체를 담은 구조에서 구체 클래스에 의존하는 연산 수행 · 서로 무관한 연산이 많고 원소 클래스를 "오염"시키기 싫음(구조를 여러 애플리케이션이 공유하면 필요한 곳에만 연산) · 구조를 정의하는 클래스는 거의 안 바뀌고 새 연산은 자주 정의(구조 클래스가 자주 바뀌면 연산을 그 클래스에 두는 편이 나음)
- Known Uses [GoF]: Smalltalk-80 컴파일러 `ProgramNodeEnumerator`(소스 분석) · IRIS Inventor "actions"(렌더링·이벤트 처리·검색·파일·경계 상자 방문자, RTTI와 2차원 테이블로 C++ 더블 디스패치 구현) · "Visitor" 용어는 Mark Linton이 X Consortium Fresco 명세에서 명명

### 최소 조건 후보
- [필수] 방문 대상 원소 타입 집합이 있고, 방문자에 원소 타입마다 하나씩 방문 연산이 있음(이름으로 구분하든 오버로딩하든) — 반례: `visit(Element e)` 하나 안에서 `instanceof`로 다시 분기
- [필수] 실행될 연산이 방문자 타입과 원소의 **런타임** 구체 타입 둘 다로 결정됨(더블 디스패치 또는 언어의 등가 기능) — 원전 "Visitor 패턴의 핵심". 반례: Java·TS에서 호출부가 `visitor.visit(element)`를 원소의 선언 타입으로 직접 호출하면 오버로드가 컴파일 타임(정적 바인딩)에 골라져 서브타입별 연산이 호출되지 않음([RG] Visitor and Double Dispatch)
- [필수] 연산(평가·출력·검증·변환)이 원소 클래스 밖 방문자 하나로 응집되어, 새 연산 = 새 ConcreteVisitor 추가로 원소 클래스 수정 없이 가능 — 반례: 새 연산마다 모든 노드 클래스에 메서드를 추가하면 그냥 다형성(원전 "기능을 여러 클래스에 흩뜨리는" 대안)
- [선택] 원소의 `accept(Visitor)` 메서드 — 원전 기본형의 더블 디스패치 수단이지만, 망라적 패턴 매칭(sealed + switch, enum + match)이 있는 언어는 accept 없이 같은 효과를 냄(JEP 441 서술) — 판정 기준은 미해결
- [선택] 방문 연산 이름 구분 vs 오버로딩 [GoF 각주 10]
- [선택] 순회 책임 위치(구조·반복자·방문자) [GoF]
- [선택] 반환값·추가 인자 제네릭화(`ElementVisitor<R, P>`) · 기본(no-op) 방문 구현을 제공하는 어댑터
- 불변식 후보: Visitor 인터페이스는 원소 타입 집합 전체를 망라하며, 원소 타입이 추가되면 모든 방문자가 갱신 대상이 됨 [GoF consequence, `ElementVisitor` Javadoc 경고] · 각 ConcreteElement의 accept는 자기 타입에 대응하는 방문 연산만 호출 [GoF Implementation]

### 사용 단서
- 이런 코드/요구가 보이면:
  - AST·문서 트리·장면 그래프처럼 타입이 다양한 원소로 된 **안정적인** 구조에 평가·출력·검증·변환 연산이 계속 추가됨 [GoF]
  - 핵심 클래스에서 부가 행위(내보내기·통계)를 걷어내고 싶음 [RG]
  - 어떤 행위가 계층의 일부 클래스에만 의미 있음 [RG]
  - 순회하며 결과를 누적(타입 검사 환경, 합계) [GoF]
  - 코드 모양: 여러 곳에 `if (n instanceof Add) … else if (n instanceof Mul) …` 타입 분기가 복제 [노트]
- 쓰지 말아야 할 때:
  - 원소 클래스가 자주 추가·변경됨 — 연산을 원소 클래스에 두는 편이 쉬움 [GoF]
  - 원소가 동질적 — 반복자 계열로 충분 [rust-unofficial "데이터가 동질이면 iterator 유사 패턴"]
  - 방문자가 원소의 private 상태에 접근해야 해 캡슐화를 깨야 함 [GoF, RG]
  - 언어가 망라적 패턴 매칭을 지원하고 연산이 단순함 — JEP 441은 패턴 매칭 없이 이런 계산을 표현하려면 "번거로운 visitor 패턴"이 필요하다고 하며 패턴 매칭이 더 투명하고 직관적이라고 서술 [JEP 441]

### 비교 대상
- vs Iterator: 반복자는 공통 부모 타입 원소만, 방문자는 무관한 타입의 원소도 방문 ([GoF] Visitor Consequences). 함께 씀 ([GoF 토론], [RG]). 오인 모양: `FileVisitor` + `Files.walkFileTree`(Iterator 절 참조)
- vs Composite: Composite 트리 전체에 연산 적용 ([GoF] Related, [RG])
- vs Interpreter: 방문자로 해석을 수행하거나 AST 노드별 행위를 한 클래스에 모음 ([GoF] Related)
- vs Command: 서로 다른 클래스의 여러 객체에 연산을 실행할 수 있는 강화된 Command로 볼 수 있음 ([RG])
- vs Strategy(기존 가이드 주장): Strategy는 하나의 동작 교체, Visitor는 여러 원소 타입에 걸친 동작 집합 — ConcreteVisitor에 visit가 하나뿐이면 사실상 Strategy. 원전 직접 비교 없음 [노트]
- vs 타입 스위치·패턴 매칭(대안·안티패턴 후보): Java 21 이전 `instanceof` 체인은 망라성 검사가 없음. JEP 441 패턴 `switch`는 sealed 계층에서 망라적이어야 해 accept 없이 컴파일 타임 안전성 확보. TS 컴파일러 위키는 `forEachChild` 재귀 순회가 "visitor 패턴을 포괄하고 더 유연"하다고 소개. 오인 모양: `switch (node) { case Add a -> …; case Mul m -> … }`는 accept가 없어도 "원소 밖에 연산 응집 + 망라적 분기"라 Visitor와 같은 트레이드오프(원소 추가 시 모든 switch 수정)를 가짐 [노트]
- vs Fold: rust-unofficial — fold는 visitor와 비슷하지만 방문하며 자료구조의 새 버전을 만듦

### 세 언어 구현 쟁점
- Java:
  - 고전형 `interface Visitor<R> { R visitNum(Num n); R visitAdd(Add a); }` + 각 원소 `accept(Visitor<R> v) { return v.visitAdd(this); }`
  - 오버로딩(`visit(Num)`, `visit(Add)`)을 쓰면 오버로드 선택이 컴파일 타임이라, `accept` 안의 `v.visit(this)`처럼 `this`의 정적 타입이 구체 타입인 곳에서만 올바르게 동작 — 호출부에서 `visitor.visit(element)`로 직접 부르면 선언 타입 기준으로 선택됨 ([RG] Visitor and Double Dispatch)
  - 표준 API `javax.lang.model.element.ElementVisitor<R, P>` — Javadoc이 "visitor 디자인 패턴 스타일"이라고 명시, `Element.accept(ElementVisitor<R,P>, P)`. API Note 경고: 미래 언어 구조를 위해 메서드가 추가될 수 있고 이미 추가된 적이 있으며, 인터페이스를 직접 구현한 방문자는 미래 버전과 소스 비호환이 될 수 있음 → 원전 "새 ConcreteElement 추가가 어려움"의 실사례
  - Java 21 대안: sealed + record + 패턴 `switch`(JEP 441, 409)
- TypeScript:
  - 메서드 오버로드는 시그니처를 여러 개 선언하고 구현은 하나이며 구현 시그니처는 외부에서 보이지 않음 (TS 핸드북 More on Functions) — 런타임 타입별 디스패치가 없으므로 방문 메서드 이름을 `visitNum`·`visitAdd`로 구분해야 함(원전 각주 10의 "다른 이름" 방식) [핸드북 사실 + 노트]
  - discriminated union + `switch (node.kind)` + `never` 망라성 검사가 흔한 대안 (TS 핸드북 Narrowing)
  - TypeScript 컴파일러 API 위키: AST 순회는 `forEachChild`를 재귀적으로 쓰는 것이 일반적이며 이것이 visitor 패턴을 포괄하고 더 유연함
  - ESLint 규칙: `create()`가 노드 타입(또는 선택자) 키로 된 visitor 함수 객체를 반환하고, ESLint가 AST를 순회하며 내려갈 때(`:exit`면 올라갈 때) 호출 — 순회는 프레임워크, 연산은 방문자 객체 (ESLint 문서)
- Rust (std만):
  - 원소 집합이 닫혀 있으면 `enum` + `match`(망라성)로 accept 없이 표현하는 것이 자연스러움 [노트]
  - trait 기반 고전형 `trait Visitor { fn visit_num(&mut self, n: &Num); fn visit_add(&mut self, a: &Add); }` — Rust에는 오버로딩이 없어 이름 구분 필수 [노트]
  - rust-unofficial: visit 메서드가 값을 반환하지 않으면 순회 코드를 `walk_*` 함수로 분리해 알고리즘 간에 공유하고 no-op 기본 메서드를 제공하는 것이 Rust의 흔한 방식(Java의 accept가 같은 역할). 방문자 객체는 상태를 가질 수 있어 노드 사이에 정보를 전달
  - 방문자 상태 누적은 `&mut self`, 원소는 `&` 빌림 → 빌림 충돌 없음. 방문 중 원소를 수정하려면 `&mut` 원소를 받는 별도 방문자 trait이 필요 [노트]
  - 조기 종료는 `std::ops::ControlFlow` — 문서가 "그래프 순회나 visitor처럼 사용자가 조기 종료를 고르게 할 때" 쓴다고 명시
  - 외부 crate 사례(가이드 코드엔 사용 불가): serde `de::Visitor` — "deserializer를 거니는 visitor", Deserializer가 Visitor를 구동

### 실제 사용처
- `javax.lang.model.element.ElementVisitor` / `Element.accept` (Java SE 21, `java.compiler` 모듈) — `ElementVisitor`=Visitor, 각 `visitXyz`=Visit 연산, `Element`=Element, `TypeElement`·`ExecutableElement` 등 하위 인터페이스 구현=ConcreteElement, `SimpleElementVisitor14` 등=기본 구현 어댑터. 패턴명 명시: Javadoc 자체 ("in the style of the visitor design pattern") — https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/element/ElementVisitor.html
- `java.nio.file.FileVisitor` / `Files.walkFileTree` (Java SE 21) — `FileVisitor`=Visitor, `SimpleFileVisitor`=기본 구현, `walkFileTree`=ObjectStructure 순회. 단 방문 연산이 원소 타입별이 아니라 순회 이벤트별이고 accept·더블 디스패치가 없는 변형 [노트]. 패턴명 명시: [RG] Java Visitor 페이지 — https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/FileVisitor.html
- ESLint custom rules (eslint.org latest 문서) — 규칙이 반환하는 노드 타입별 메서드 객체=ConcreteVisitor, ESLint 순회기=ObjectStructure. 문서가 "visitor function"이라고 부름 — https://eslint.org/docs/latest/extend/custom-rules
- serde `de::Visitor` (serde 1.0.229, docs.rs) — `Visitor`=Visitor, `Deserializer`=방문자를 받아 구동하는 쪽([RG] Rust는 Deserializer를 Visitor 패턴의 "Element"로 설명). 외부 crate — 가이드의 std 전제와 무관하게 "실제 라이브러리에서" 절에만 사용 가능 — https://docs.rs/serde/latest/serde/de/trait.Visitor.html
- (대안 사례) TypeScript Compiler API `ts.forEachChild` — 위키가 visitor 패턴을 포괄하는 재귀 순회로 소개 — https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

### 기존 가이드 승계분
- 최소 조건 취지: ① Element 계층이 있고 모든 ConcreteElement가 `accept(Visitor)` 노출(외부 instanceof+cast면 타입 분기) ② Visitor가 ConcreteElement 구체 타입마다 별도 `visit(ConcreteElementX)` 오버로드 정의(`visit(Element)` 하나에 내부 분기면 더블 디스패치 불성립) ③ `accept` 안에서 `visitor.visit(this)`로 자신을 넘겨 더블 디스패치 성립 ④ 연산은 Visitor, 데이터는 Element. 1·2·3은 동시 만족 필요. 오해 정리: instanceof 분기(타입 스위치), accept 없이 Visitor만(순회 책임이 흐려지고 호출 측이 분기를 떠안음), Strategy(visit가 하나뿐이면 사실상 Strategy), "연산 추가가 쉬우니 항상 좋다"(원소 추가에 약함 — Expression Problem)
  - 원전 대조 메모: ②의 "오버로드"는 원전 각주 10(오버로딩은 선택, 이름 구분도 가능)과 충돌 — "원소 타입마다 방문 연산"으로 문구 수정 필요. TS·Rust는 런타임 오버로드 디스패치가 없어 오버로드 요구 자체가 성립하지 않음
- 참고 자료(기존 목록 그대로):
  - Gamma, Helm, Johnson, Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software*, Addison-Wesley, 1994 — Visitor 패턴 원전.
  - Refactoring.Guru, "Visitor" — https://refactoring.guru/design-patterns/visitor
  - Wikipedia, "Visitor pattern" — https://en.wikipedia.org/wiki/Visitor_pattern
  - Wikipedia, "Double dispatch" — https://en.wikipedia.org/wiki/Double_dispatch
  - Philip Wadler, "The Expression Problem", 1998 — Visitor의 트레이드오프를 이론적으로 정리한 글.
  - Java API: `javax.lang.model.element.ElementVisitor` — https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/element/ElementVisitor.html
  - ASM Framework, `ClassVisitor` — https://asm.ow2.io/javadoc/org/objectweb/asm/ClassVisitor.html
  - Eclipse JDT, `ASTVisitor` — https://help.eclipse.org/latest/topic/org.eclipse.jdt.doc.isv/reference/api/org/eclipse/jdt/core/dom/ASTVisitor.html

### 출처
- [GoF 원서 HTML 사본 — Visitor](https://www.cs.unc.edu/~stotts/GOF/hires/pat5k.htm) — Intent, Applicability, Participants, Collaborations, Consequences, Implementation(더블 디스패치, 순회 책임, 각주 10·11), Known Uses, Related Patterns · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Chapter 1 (Table 1.1)](https://www.cs.unc.edu/~stotts/GOF/hires/chap1.htm) — 분류, 쪽 표기 331 · 조회 2026-09-17
- [GoF 원서 HTML 사본 — Discussion of Behavioral Patterns](https://www.cs.unc.edu/~stotts/GOF/hires/disc5.htm) — Objects as Arguments(Visitor는 Accept의 인자), Summary(반복자 + 방문자) · 조회 2026-09-17
- [refactoring.guru — Visitor](https://refactoring.guru/design-patterns/visitor) — Applicability, Pros/Cons, Relations(Command·Composite·Iterator) · 조회 2026-09-17
- [refactoring.guru — Visitor and Double Dispatch](https://refactoring.guru/design-patterns/visitor-double-dispatch) — 오버로드는 컴파일 타임(정적) 바인딩 · 조회 2026-09-17
- [refactoring.guru — Visitor in Java](https://refactoring.guru/design-patterns/visitor/java/example) — 사용 예 ElementVisitor·TypeVisitor·FileVisitor 등 · 조회 2026-09-17
- [refactoring.guru — Visitor in Rust](https://refactoring.guru/design-patterns/visitor/rust/example) — serde 역직렬화 모델을 Visitor 사례로 설명 · 조회 2026-09-17
- [Rust Design Patterns (rust-unofficial) — Visitor](https://rust-unofficial.github.io/patterns/patterns/behavioural/visitor.html) — walk_* 함수, 동질 데이터면 iterator, fold와의 차이(보조 출처) · 조회 2026-09-17
- [Java SE 21 — ElementVisitor](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/element/ElementVisitor.html) — visitor 디자인 패턴 스타일, 메서드 추가 경고 · 조회 2026-09-17
- [Java SE 21 — Element](https://docs.oracle.com/en/java/javase/21/docs/api/java.compiler/javax/lang/model/element/Element.html) — accept(ElementVisitor<R,P>, P) · 조회 2026-09-17
- [Java SE 21 — FileVisitor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/FileVisitor.html) — walkFileTree에 제공되는 파일 방문자 · 조회 2026-09-17
- [Java SE 21 — Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html) — walkFileTree(Path, FileVisitor) · 조회 2026-09-17
- [JEP 441: Pattern Matching for switch](https://openjdk.org/jeps/441) — "cumbersome visitor pattern", 망라성 · 조회 2026-09-17
- [TypeScript Handbook — More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) — 오버로드 구현 시그니처는 외부에서 보이지 않음 · 조회 2026-09-17
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — discriminated union, 망라성 검사 · 조회 2026-09-17
- [TypeScript Wiki — Using the Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) — forEachChild가 visitor 패턴을 포괄 · 조회 2026-09-17
- [ESLint — Custom Rules](https://eslint.org/docs/latest/extend/custom-rules) — create()가 visitor 함수 객체 반환, :exit · 조회 2026-09-17
- [Rust std — std::ops::ControlFlow](https://doc.rust-lang.org/std/ops/enum.ControlFlow.html) — 순회·visitor 조기 종료 · 조회 2026-09-17
- [docs.rs — serde::de::Visitor (serde 1.0.229)](https://docs.rs/serde/latest/serde/de/trait.Visitor.html) — deserializer를 거니는 visitor · 조회 2026-09-17
- [serde.rs — Implementing Deserialize](https://serde.rs/impl-deserialize.html) — Deserializer가 Visitor를 구동 · 조회 2026-09-17

### 미해결 질문
- accept 없는 패턴 매칭(Java sealed+switch, TS union switch, Rust enum match)을 가이드에서 Visitor 구현으로 인정할지, "대안"으로만 둘지 — Interpreter·State 편과 같은 기준으로 한 번에 정해야 함
- 기존 가이드 조건 ②(타입별 오버로드 [필수])가 원전 각주 10과 충돌 — 문구 수정 필요
- 기존 참고 자료의 ASM `ClassVisitor`, Eclipse JDT `ASTVisitor` 링크와 내용, Wadler "The Expression Problem"(1998) 원문은 이번에 확인 안 함
- `FileVisitor`를 Visitor 사례로 쓸지(RG) Iterator 쪽 비교 사례로 쓸지

## 교차 비교 메모

범위: 이 노트의 11패턴 사이, 그리고 생성·구조 패턴과의 비교 쌍. 각 줄은 "구분 기준 한 줄 (출처)". PATTERNS.md 「빠른 비교가 자주 필요한 페어」 중 이 노트 범위는 Strategy↔State, Mediator↔Facade 두 쌍.

- Strategy ↔ State: 같은 목적 알고리즘 중 무엇을 쓸지 고르며 전략끼리 서로 모름 vs 객체 상태에 따른 반응이며 상태가 컨텍스트의 상태를 바꿀 수 있음 — 전이 결정 위치는 원전상 Context·ConcreteState 어느 쪽이든 가능하므로 단독 기준으로 쓰지 않음 ([RG], [GoF] State Collaborations)
- Strategy ↔ Template Method: 위임으로 알고리즘 전체 교체(객체 수준, 런타임 가능) vs 상속으로 알고리즘 일부 단계 교체(클래스 수준, 정적) ([GoF] TM Related, [RG])
- Strategy ↔ Command: 같은 일을 하는 서로 다른 방법의 교체 vs 임의의 연산을 객체화해 지연·큐잉·이력·원격 실행 ([RG])
- Strategy ↔ Decorator(구조): 속(guts) 교체 vs 겉(skin) 덧씌우기 — 객체를 바꾸는 두 대안 ([GoF] Decorator Related, [RG])
- Strategy ↔ Bridge(구조) ↔ State (↔ Adapter): 모두 합성 기반 위임으로 구조가 비슷, 해결하는 문제로 구분 ([RG])
- Strategy ↔ Flyweight(구조): 무상태 전략은 공유 가능한 flyweight ([GoF] Strategy Related)
- State ↔ Flyweight · Singleton: 인스턴스 변수 없는 상태 객체를 공유 ([GoF] State Related)
- State ↔ 테이블 기반 FSM: 상태별 행위 모델링 vs 전이 정의에 초점 ([GoF] State Implementation)
- Template Method ↔ Factory Method(생성): Factory Method는 TM의 특수화이며 TM의 한 단계가 될 수 있음 ([RG], [GoF] TM·FM Related)
- Template Method ↔ Observer: 통지를 template method 마지막 단계에 두어 주체 상태 일관성 보장 ([GoF] Observer Implementation)
- Command ↔ Memento: 실행이 다형적인 요청 토큰 vs 인터페이스가 좁아 값으로만 전달되는 상태 토큰, undo에서 결합 ([GoF 토론], [RG])
- Command ↔ Composite(구조): MacroCommand는 Composite ([GoF] Command Related)
- Command ↔ Prototype(생성): history에 넣기 전 복사되는 커맨드는 Prototype 역할 ([GoF] Command Related, [RG])
- Command ↔ Chain of Responsibility: 요청을 Command 객체로 표현해 사슬로 전달하거나 처리자를 Command로 구현 ([GoF] CoR Implementation, [RG])
- Command ↔ Visitor: Visitor는 여러 클래스의 객체에 연산을 실행하는 강화된 Command ([RG])
- Command ↔ 콜백·functor: 함수만 유지 vs receiver와 액션의 바인딩 유지 ([GoF] Command Known Uses)
- Mediator ↔ Observer: 통신을 중재자에 캡슐화(중앙) vs Subject·Observer로 분산 — 경쟁 패턴이며 Mediator를 Observer로 구현할 수 있음 ([GoF 토론], [GoF] Mediator Implementation, [RG])
- Mediator ↔ Facade(구조): 다방향 프로토콜·동료가 중재자를 앎·새 협력 행위 vs 단방향 프로토콜·서브시스템이 퍼사드를 모름·새 기능 없음 ([GoF] Mediator·Facade Related, [RG])
- Mediator ↔ Singleton(생성) / Observer의 ChangeManager: ChangeManager는 Mediator의 사례이며 흔히 Singleton ([GoF] Observer Implementation·Related)
- Chain of Responsibility ↔ Command ↔ Mediator ↔ Observer: 발신자-수신자 분리 4방식 — 사슬 순차 전달 / 단방향 바인딩 객체 / 중재자 경유 간접 통신 / 동적 구독·해제 ([RG], [GoF 토론])
- Chain of Responsibility ↔ Decorator(구조): 처리자는 독립적 임의 작업을 하고 흐름을 끊을 수 있음 vs 데코레이터는 기본 인터페이스와 일관되게 확장하고 흐름을 끊지 않음 ([RG])
- Chain of Responsibility ↔ Observer: 순차 전달·하나가 처리 vs 등록된 모두에게 브로드캐스트 ([RG], [GoF 토론])
- Chain of Responsibility ↔ Composite(구조): 부모 링크를 successor로 사용 ([GoF] CoR·Composite Related)
- Chain of Responsibility ↔ Template Method: 사슬 속 클래스는 처리 여부·전달 대상을 primitive로 둔 template method를 포함하기 쉬움 ([GoF 토론])
- Iterator ↔ Visitor: 공통 부모 타입 원소의 순차 접근 vs 무관한 타입 원소별 연산, 함께 사용 ([GoF] Visitor Consequences, [GoF 토론], [RG])
- Iterator ↔ Composite(구조): 재귀 구조 순회 ([GoF] Iterator·Composite Related)
- Iterator ↔ Memento: 반복 상태를 메멘토로 캡처, 커서는 Memento의 단순한 예 ([GoF] Iterator·Memento Related, [RG])
- Iterator ↔ Factory Method(생성): 다형적 반복자는 팩토리 메서드로 생성 ([GoF] Iterator Related, [RG])
- Iterator ↔ Proxy(구조): C++ 다형적 반복자 정리를 스택 할당 proxy로 보장 ([GoF] Iterator Implementation)
- Interpreter ↔ Composite(구조): AST는 Composite, "클래스 계층을 언어로 보느냐"로 구분 ([GoF] Interpreter Known Uses·Related)
- Interpreter ↔ Visitor: 해석 연산을 노드에 분산 vs 방문자 한 클래스에 모음 ([GoF] Interpreter Consequences·Related)
- Interpreter ↔ Flyweight(구조): 단말 기호 공유 ([GoF] Interpreter Related)
- Interpreter ↔ State: 파싱 문맥 정의에 State 사용 ([GoF 토론])
- Visitor ↔ Composite(구조): Composite 트리 전체에 연산 적용 ([GoF] Visitor·Composite Related, [RG])
- Visitor / Interpreter / State ↔ 언어 패턴 매칭(sealed+switch, TS union switch, Rust enum match): 원소·노드·상태 밖에 연산을 모으고 망라성 검사로 누락을 잡는 대안 — 세 편이 같은 인정 기준을 써야 함 (JEP 441, TS 핸드북, Rust 책 18.3, [노트])
- Memento ↔ Prototype(생성): 단순하고 외부 자원 링크가 없는 객체면 복제가 더 간단한 대안, 목적은 새 객체 생성 vs 같은 객체의 과거 상태 복원 ([RG], [GoF] 의도)
- Memento ↔ 직렬화: 직렬화는 메멘토 구현 수단 중 하나 ([RG] Java)
- Observer ↔ Reactive Streams(`Flow`): 흐름 제어 계약(Subscription)이 핵심인 확장형 (Javadoc, [노트])

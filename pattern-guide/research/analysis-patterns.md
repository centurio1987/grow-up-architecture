# 분석 패턴 리서치 노트

- 작성일: 2026-09-17 (본문의 모든 웹 출처 조회일도 같은 날짜입니다)
- 범위: Martin Fowler 『Analysis Patterns: Reusable Object Models』(Addison-Wesley)에서 가져온 10패턴 — Party · Accountability · Knowledge Level · Quantity · Range · Measurement · Observation · Account · Transaction · Posting Rule. 원서 목차와 함께 Fowler가 직접 공개한 보충 자료(apsupp UML 그림 PDF, 개정 초안 PDF, 1999 튜토리얼 슬라이드), eaaDev 초안 페이지(2004–2006), DDD 1차 자료(Evans DDD Reference, Vernon "Effective Aggregate Design")를 대조했습니다.
- 용도: ① 분석 패턴 가이드 집필 워커의 입력(가이드 골격의 각 절 재료) ② 회계 도메인 배경 확정안 작성자의 입력(회계 3패턴 끝의 「배경 확정안 재료」).
- 출판 연도 표기: Fowler 책 소개 페이지는 "1996 book"이라고 적고, Google Books는 1997로 표기합니다. 이 노트는 기존 가이드와 요청서를 따라 1997로 씁니다. 판권 연도는 확인 안 함.

**읽는 법 (공통 약속)**

- **원서 본문은 직접 열람하지 못했습니다.** 원서 위치는 네 자료를 겹쳐 확인했습니다. (a) Pearson 목차 PDF — 장·절 번호와 절 제목 (b) InformIT 목차 — 같은 절 제목(번호 없음)으로 교차 확인 (c) Google Books 목차 — 장 시작 쪽 (d) martinfowler.com/apsupp의 UML 그림 PDF — 원서 그림 번호 그대로 다시 그린 연관·다중도·제약. **절 단위 쪽 번호는 전부 확인 안 함**이고, 장 시작 쪽만 적습니다.
- apsupp 그림 PDF는 `pdftotext`로 텍스트를 뽑아 읽었습니다. 다중도가 어느 쪽 끝에 붙는지는 레이아웃 판독이라, 애매한 곳은 "판독"이라고 표시했습니다.
- **(판단)**이 붙은 문장은 출처로 확정된 사실이 아니라 이 노트의 분석입니다. 「DDD 매핑 후보」 절은 대부분 판단이며, 근거로 쓴 출처 내용만 사실입니다.
- 출처 등급: martinfowler.com·표준 문서·공식 문서·원저자 논문은 1차, Wikipedia·블로그·독서 노트는 **보조 출처**로 표시합니다.
- 층위 표기: 등장 개념마다 Fowler의 분석 층위를 붙입니다 — **지식 층위**(knowledge level: 타입·규칙), **운영 층위**(operational level: 매일 생기는 사실), **값**(두 층위에서 속성으로 쓰이는 값 타입).
- 약어: VO = Value Object(값 객체), AR = Aggregate Root, BC = Bounded Context, OCL = Object Constraint Language(UML 제약 표기).

**공통 1차 자료 (패턴별 「출처」에는 해당 패턴에서 확인한 내용을 다시 적습니다)**

- 원서 위치 확인용: Pearson 목차 PDF, InformIT 목차, Google Books 목차, apsupp `apchap2/3/4/6.pdf`
- Google Books 목차의 장 시작 쪽: Introduction 1, Part I "Analysis Patterns" 15, Observations and Measurements 35, Observations for Corporate Finance 57, Referring to Objects 85, Inventory and Accounting 95, Using the Accounting Models 133, Appendix B Table of Patterns 331
- Fowler 개정 초안: `apsupp/accountability.pdf`(「Organization Structures」, PDF 메타데이터상 2001-01-02 작성, 본문에 "as with the previous edition"이라는 문구가 있어 개정판 초안으로 보임), `apsupp/accounting.pdf`(PDF 메타데이터상 2000-12-09 작성 — **본문은 글꼴 인코딩 때문에 텍스트 추출이 안 되고, 그림 라벨과 코드 블록만 판독됩니다**)
- `apchap6.pdf` 머리말: "for this chapter, remember that there is a more up to date discussion of patterns in accounting at http://martinfowler.com/apsupp/accounting.pdf The patterns there supercede the patterns in the Analysis Patterns book" — **회계 3패턴은 원서 6장보다 accounting.pdf와 그 후속인 eaaDev 초안을 우선 근거로 삼으라는 Fowler 본인 표시**입니다.
- eaaDev 목록 페이지: "I haven't been working on this material actively since the summer of 2006", "pretty much frozen for the moment" — 초안 상태로 고정된 자료입니다.

---

## Party (당사자)

> **집필 결과 되먹임 (2026-09-29, v1.0.0 · 게이트 3R PASS)**
> - **★ 최소 조건 후보 `[필수]` 3번이 두 조건이다.** 「공통만 Party 에 두고 한쪽에만 있는 것은 하위 타입에」의 **앞뒤를 갈라야 한다** — 앞은 성립 요건(`[필수]`), 뒤는 원전이 **갈래 없는 모델을 인정하므로** `[선택]`. **노트를 그대로 받으면 `[필수]` 를 잘못 올린다**
> - **`[필수]` 2번(다른 개념이 Party 를 참조)에 존재 요건이 빠져 있다.** 원전의 사용 조건은 「공통 **행위**가 보일 때」이고 **식별자·이름만 공통인 모델은 통과시키면 안 된다.** 조건 문면에 「식별자와 이름 말고도」가 필요하다
> - **★ 「DDD 매핑 후보」의 식별성(Evans Entity 정의)을 최소 조건으로 올리지 말 것.** `accountability.pdf` 전문에 identity·identifier·unique **0건**, 그림 2.1·2.2 에 식별자 속성 없음(실측). Evans 는 Party 를 언급한 적이 없다. **노트가 이 항목을 매핑 절에 둔 것이 옳고, 그 배치가 곧 표기를 가르는 신호다**(집필자가 1R 에 `[필수]` 로 올렸다 걸렸다)
> - **★ 귀속 정정** — 「isn't one to turn to blindly」는 `roles.pdf` 가 아니라 **`accountability.pdf` 의 Party 「When to use it」**에 있다(`roles.txt` 에 `blindly` **0건**). `roles.pdf` 에 귀속할 수 있는 것은 "five broad categories" 와 다섯 이름뿐이다
> - **조건 3 을 떠받치는 원전 *진술* 을 새로 찾았다** — `accountability.pdf` Party 절 Example: 통신 회사 고객이 개인일 수도 사업자일 수도 있는데 「다루는 방식이 같은 부분에서는 party 로 다루고, 다른 부분에서만 하위 타입으로 다룬다」. **그림 둘이 원전의 *실천* 이라면 이것은 *진술* 이라 근거로서 더 강하다**
> - **`Post`(§2.9, Figure 2.15)는 원서 정의 미확인**이라 v1.0.0 이 본문에서 통째로 뺐다. 「등장 개념」에 **「정의 확인 전에는 가이드에 싣지 않음」**을 적어 두면 뒤 편이 같은 판단을 되풀이하지 않는다
> - **연락 수단 다중도(미해결 2)는 여전히 미해결** — 본문은 `0..*` 를 **이 글의 모델**로만 적었다(원서 판독값은 `0..1` 이라 이 한정이 중요하다)
> - **세 언어 실측 — TypeScript 브랜드 타입 네 조합**(노트의 TS 쟁점이 「판단 — 구조적 타이핑 일반론, 별도 문서 확인 안 함」이던 자리): 둘 다 브랜드 → `TS2345` 1건(`PurchaseOrderId`) · **받는 쪽만** → `TS2345` 1건(`string`) · **넘기는 쪽만 → 0건** · 둘 다 민짜 → 0건. **막아 주는 것은 받는 쪽 브랜드 하나뿐이고, 넘기는 쪽 브랜드는 진단 메시지의 이름만 바꾼다.** 브랜드 줄을 *지우면* `TS2552` 15건이 나고 뒤 줄 번호가 2줄 당겨진다 — 민짜 별칭으로 바꾸는 것과 다르다
> - **함정 셋** — 도식은 `above: 'from'` 으로 계층을 선언해야 하고 `@relation` 은 `relate` 여야 한다(`branch` 는 VT-101 축과 어긋나 lint 가 막는다) · **`### 구현` 절에는 언어 펜스 셋 말고 어떤 펜스도 둘 수 없다** · **Rust 가 분량 상한에 가장 먼저 걸린다**(초안 421줄 → 247줄, 출력 불변)


### 원전 대응

- 원서 위치: Chapter 2 「Accountability」 §2.1 「Party」(Pearson 목차 PDF, InformIT 목차로 교차 확인). 쪽은 확인 안 함(Part I 표제 15쪽, Chapter 3 시작 35쪽). 그림은 Figure 2.1, 2.2와 §2.9 「Post」의 Figure 2.15입니다(apchap2.pdf). 개정 초안(accountability.pdf)에는 독립 패턴 「Party (5)」로 있으며 의도문은 "An abstraction of people and organizational units"입니다.
- 문제와 해법:
  - 문제: 주소록을 모델링할 때 사람과 회사가 각자 우편 주소·전화번호를 가지면 중복이 생깁니다(초안의 주소록 예). Figure 2.1은 Person과 Organization이 각각 Telephone Number·Address·E-mail Address와 따로 연관된 모델입니다.
  - 해법: Person과 Organization의 상위 타입 Party를 두고 연락 수단 연관을 Party로 끌어올립니다(Figure 2.2). 초안은 이것을 "누구나 알고 쓰지만 이름이 없는 개념(unnamed concept)"이라 부르고, 데이터 모델에서 person/org, player, legal entity 같은 이름으로 보인다고 적습니다.
  - 초안의 구현 지침: 사람과 조직 단위에 공통인 행위는 Party에 두고, 한쪽에만 해당하는 것만 하위 타입에 둡니다. 부서나 비공식 팀도 Party로서 주소·전화번호를 가질 수 있습니다.
  - 초안의 사용 시점: 모델에 사람과 조직이 있고 공통 행위가 보일 때 씁니다. 사람과 조직을 구분할 필요가 없으면 하위 타입 없이 Party 클래스만 두는 경우도 고려하라고 적습니다. 역할이 여러 가지면 Role Object 같은 역할 패턴을 보되 "isn't one to turn to blindly"라고 적습니다.
- 등장 개념:
  - `Party` — 사람과 조직 단위를 묶는 상위 타입 · 운영 층위
  - `Person` — Party의 하위 타입(개인) · 운영 층위
  - `Organization` — Party의 하위 타입(회사·부서·팀 같은 조직 단위) · 운영 층위
  - `Address` · `Telephone Number` · `E-mail Address` — Party에 연관되는 연락 수단(Figure 2.2) · 운영 층위
  - `Post` — Figure 2.15에서 Person·Organization과 나란히 Party 하위 타입으로 나오는 개념(§2.9) · 운영 층위. 원서 정의는 확인 안 함
  - `Party Type` — Party의 분류 · 지식 층위. 원서에서는 §2.5 「Accountability Knowledge Level」(Figure 2.9)에서 등장하므로 Accountability 노트에서 다룹니다
- 관계:
  - Person, Organization → Party: 일반화(Figure 2.2)
  - Party — Telephone Number / Address / E-mail Address: 연관. 판독상 Party 쪽 `*`, 연락 수단 쪽 `0..1`(Figure 2.1에서도 Person·Organization 쪽 `*`, 연락 수단 쪽 `0..1`). 원도 대조 필요
  - 파생 규칙: 확인한 그림(2.1, 2.2, 2.15)에 없음
- 모델 불변식: 확인한 그림에 명시 제약이 없습니다. 가이드가 개념 규칙으로 쓸 수 있는 것은 "Party를 받는 자리는 하위 타입을 몰라도 공통 속성·행위만으로 동작한다" 정도입니다(판단).

### 최소 조건 후보

- [필수] 사람과 조직(또는 그에 준하는 행위 주체)을 포괄하는 상위 개념 Party가 이름을 가진 개념으로 존재한다 — 빠지면: Person과 Organization이 각자 주소·전화 연관을 따로 가진 Figure 2.1 상태가 되어 연락 수단 로직이 두 번 쓰입니다.
- [필수] 행위 주체를 받는 다른 개념(송장·계약·Accountability)이 하위 타입이 아니라 Party를 참조한다 — 빠지면: `Invoice.customerPerson`과 `Invoice.customerCompany` 두 필드에 "둘 중 하나만 채운다" 규칙이 붙습니다.
- [필수] 모든 행위 주체가 공유하는 속성·행위만 Party에 두고, 한쪽에만 있는 것은 하위 타입에 둔다 — 빠지면: 생년월일·사업자번호까지 Party에 올라간 God Class가 됩니다.
- [선택] Person·Organization 하위 타입 — 초안은 구분이 필요 없으면 생략할 수 있다고 적습니다.
- [선택] 역할(고객·공급자)을 Party 하위 타입이 아닌 별도 역할/관계로 모델링 — roles.pdf의 Role Object, Role Relationship.
- [선택] Party Type(지식 층위)으로 분류 — Accountability와 함께 쓸 때 필요합니다.

### 사용 단서

- 이런 요구가 보이면: "고객이 개인일 수도 사업자일 수도 있다", "주소·연락처가 사람에게도 부서에도 붙는다", "거래 상대가 사람이든 회사든 같은 송장 처리를 쓴다".
- 쓰지 말아야 할 때: 사람만(또는 조직만) 다루는 시스템, 사람과 조직 사이에 공통 행위가 없는 경우(초안의 사용 조건 "공통 행위가 보일 때"의 반대 — 판단), "고객"·"공급자" 같은 역할 구분이 목적인데 Party 하위 타입으로 풀려는 경우.

### 비교 대상

- vs 분리된 Person·Organization 두 타입(Figure 2.1): 구분 기준은 공통 연관·행위가 반복되는가입니다.
- vs 역할 패턴(roles.pdf, 1997 Working Draft): Party는 "누구인가", 역할은 "어떤 맥락에서 무엇을 하는가"입니다. roles.pdf는 역할 표현을 다섯 갈래(Single Role Type, Separate Role Type, Role Subtype, Role Object, Role Relationship)로 나누고, 한 주체가 여러 역할을 동시에 갖거나 수명 중에 역할이 바뀌는 경우("an agent who is also a customer")를 문제로 듭니다. 고객을 Party 하위 타입으로 두면 이 경우에 깨집니다(판단).
- vs Accountability: Party는 그래프의 노드, Accountability는 타입이 붙은 링크입니다. 초안 「Object Graph」 절은 Organization Hierarchy는 연관 자체로, Accountability는 연관 객체(association object)로 링크를 표현한다고 적습니다.
- vs Organization Hierarchy(§2.2): 조직 사이 계층이 하나(또는 둘)이면 Organization에 재귀 연관을 두는 쪽이 가장 단순하다고 초안이 적습니다.

### DDD 매핑 후보 (상황 설정 표의 재료)

- 기본 배정: Party는 Entity입니다. 이름이 같은 두 사람도 구별돼야 하므로 식별성이 정의의 중심입니다(Evans DDD Reference의 Entities 정의: "An object must be distinguished from other objects even though they might have the same attributes"). 연락 수단은 기본값으로 VO입니다. 다만 Fowler는 ValueObject bliki에서 우편 주소를 값으로 볼지 참조로 볼지는 맥락에 따라 다르다고 적습니다.
- BC 한 줄 후보(판단): "거래처·고객 관리 — 송장·계약이 참조할 행위 주체의 정체와 연락 수단을 관리한다."
- 선택지 A — Party 하나를 aggregate root로 두고 하위 타입은 root의 종류로 둡니다.
  - 전제: 사람과 조직을 같은 등록·수정 흐름과 같은 저장소로 다루고, 다른 aggregate는 `PartyId` 하나로 참조합니다.
  - 장점: 참조 형식이 하나이고 repository도 하나입니다.
  - 단점: 개인 실명 확인과 법인 등록처럼 하위 타입별 절차가 커지면 root가 비대해집니다.
- 선택지 B — Person과 Organization을 별도 aggregate로 두고, 공통 부분은 `PartyId` VO와 읽기용 인터페이스로만 둡니다.
  - 전제: 두 하위 타입의 수명주기·불변식·담당 팀이 다릅니다.
  - 장점: aggregate가 작습니다.
  - 단점: 참조하는 쪽이 어느 저장소를 볼지 알아야 해서 `PartyId`에 종류 태그가 필요하고, "모든 Party 조회"가 두 저장소를 합쳐야 합니다.
- 선택지 C — 연락 수단(주소)을 별도 Entity/aggregate로 둡니다.
  - 전제: 여러 Party가 같은 주소를 공유하고, 주소 변경이 공유자 모두에 반영돼야 합니다(예: 한 사업장 소속 담당자 여럿).
  - 장점: 한 번만 고칩니다. 단점: 공유 참조의 삭제·변경 규칙이 생깁니다.
- 불변식의 위치: Party 내부 불변식은 약합니다(필수 이름, 식별자 형식 정도 — 판단). "같은 사업자등록번호의 Organization은 하나" 같은 유일성은 aggregate 하나로 지킬 수 없는 집합 규칙이라 저장소 유일성 제약이나 등록 서비스가 맡습니다(판단).
- 타 aggregate 참조: 송장·계약·Accountability가 `PartyId`로 참조합니다.
- 공회전 판단(판단): root·VO 배정은 자명하지만 "불변식의 위치" 칸이 빈약해서 표가 반쯤 공회전합니다. 가이드 예제는 Party를 참조하는 쪽(송장이나 Accountability)과 함께 보여야 표가 의미를 가집니다.

### 세 언어 구현 쟁점

- Java: 닫힌 하위 타입 집합은 `sealed interface Party permits Person, Organization`으로 표현합니다(JEP 409, Java 17 정식). `PartyId`는 `record`가 맞습니다(JEP 395, Java 16 정식 — 컴포넌트 값으로 equals/hashCode 자동 생성). 반대로 Entity를 record로 만들면 equals가 모든 컴포넌트 비교가 되어 "식별자가 같으면 같은 Party"라는 Entity 동등성과 어긋납니다(record 규칙은 JEP 395 확인, 결론은 판단).
- TypeScript: `type Party = Person | Organization`에 공통 리터럴 속성(`kind`)을 두면 discriminated union으로 좁힐 수 있습니다(TypeScript Handbook "Narrowing"). `readonly`는 타입 검사 때만 쓰기를 막고 런타임 동작은 바꾸지 않습니다(Handbook "Object Types"). id를 `string`으로 두면 `PartyId`와 다른 id가 서로 대입 가능해 섞일 수 있으므로 구분 수단이 필요합니다(판단 — 구조적 타이핑 일반론, 이 조회에서 별도 문서 확인 안 함).
- Rust: `enum Party { Person(Person), Organization(Organization) }` 또는 trait로 표현합니다. id는 newtype(`struct PartyId(u64)`)에 `#[derive(PartialEq, Eq, Hash)]` — Rust Book은 기존 타입을 얇게 감싸는 것을 newtype pattern이라 부릅니다.

### 실제 사례

- OASIS UBL 2.4: "In UBL, a party is defined as an individual, a group, or a body having a role in a business function. Dependent on the business process, a Party may play various roles in the document exchange." 역할 목록은 §2.4 Party Roles에 있습니다.
- Apache OFBiz 데이터 모델(`party-entitymodel.xml`): `Party`(partyId, partyTypeId …) 엔터티가 있고, `Person`과 `PartyGroup`이 `partyId`를 기본 키로 공유합니다. 역할은 하위 타입이 아니라 `PartyRole`(partyId, roleTypeId) 엔터티로 분리돼 있습니다.
- 기존 가이드가 든 TM Forum SID의 Party 모델: 1차 링크 확인 안 함.

### 기존 가이드 승계분

- 최소 조건 취지: ① Person·Organization을 포괄하는 공통 상위 추상 Party ② 다른 개념이 구체 타입이 아니라 Party를 참조 ③ 공통 속성·행위는 Party에 집약하고 하위 타입에서 중복하지 않음. 오해 지점으로 God Class화, Accountability와의 혼동, 역할(Role)과의 혼동을 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Chapter 2 / martinfowler.com/books/ap.html / OASIS UBL Party 데이터 구조

### 출처

- [Analysis Patterns 책 소개 (martinfowler.com)](https://martinfowler.com/books/ap.html) — "1996 book" 표기, 의료·금융 거래·회계 등에서 나온 패턴, UML 이전 표기 · 조회 2026-09-17
- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §2.1 Party ~ §2.9 Post 번호와 제목 · 조회 2026-09-17
- [Analysis Patterns 목차 (InformIT)](https://www.informit.com/store/analysis-patterns-reusable-object-models-9780201895421) — Chapter 2 절 제목 교차 확인 · 조회 2026-09-17
- [Analysis Patterns (Google Books)](https://books.google.com/books/about/Analysis_Patterns.html?id=4V8pZmpwmBYC) — 장 시작 쪽, 1997 표기 · 조회 2026-09-17
- [UML Diagrams for Chapter 2 of Analysis Patterns (apchap2.pdf)](https://martinfowler.com/apsupp/apchap2.pdf) — Figure 2.1, 2.2, 2.15 구조 · 조회 2026-09-17
- [Organization Structures 개정 초안 (accountability.pdf)](https://martinfowler.com/apsupp/accountability.pdf) — 「Party (5)」 의도문, 주소록 예, 구현 지침, 사용 시점, Object Graph 절 · 조회 2026-09-17
- [Dealing with Roles (roles.pdf)](https://martinfowler.com/apsupp/roles.pdf) — 역할 표현 다섯 갈래, © 20 Jul 1997 Working Draft · 조회 2026-09-17
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Entities(11쪽) 정의 · 조회 2026-09-17
- [Value Object (Fowler bliki, 2016-11-14)](https://martinfowler.com/bliki/ValueObject.html) — 주소를 값으로 볼지 참조로 볼지는 맥락 의존 · 조회 2026-09-17
- [JEP 409: Sealed Classes](https://openjdk.org/jeps/409) — Release 17, Closed/Delivered · 조회 2026-09-17
- [JEP 395: Records](https://openjdk.org/jeps/395) — Release 16, 컴포넌트 기반 equals/hashCode · 조회 2026-09-17
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — discriminated unions · 조회 2026-09-17
- [TypeScript Handbook: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) — readonly는 런타임 동작을 바꾸지 않음 · 조회 2026-09-17
- [The Rust Programming Language: Advanced Traits](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html) — newtype pattern 정의 · 조회 2026-09-17
- [UBL 2.4 (OASIS)](https://docs.oasis-open.org/ubl/os-UBL-2.4/UBL-2.4.html) — Party 정의 문장, §2.4 Party Roles · 조회 2026-09-17
- [OFBiz party-entitymodel.xml](https://github.com/apache/ofbiz-framework/blob/trunk/applications/datamodel/entitydef/party-entitymodel.xml) — Party·Person·PartyGroup·PartyRole 필드와 기본 키 · 조회 2026-09-17

### 미해결 질문

1. 원서 §2.1 「Party」의 쪽 — 확인 안 함.
2. Figure 2.1/2.2의 연락 수단 다중도가 정말 `0..1`인지(한 Party에 전화번호 하나뿐인 모델인지) — 원도 대조 필요.
3. 1997 원서 본문의 Party 정의 문구가 2001 초안의 "An abstraction of people and organizational units"와 같은지 — 확인 안 함.
4. §2.9 「Post」(Figure 2.15)의 원서 정의 — 확인 안 함.
5. TM Forum SID의 Party·PartyRole 1차 문서 링크 — 확인 안 함.

---

## Accountability (책임 관계)

> **집필 결과 되먹임 (2026-09-29, v1.0.0 · 3R FAIL 뒤 조건부 판정으로 발행)**
> - **★ `[필수]` 후보 4 의 문면을 바꿨다.** 「양 끝의 역할(commissioner/responsible 또는 parent/child)이 **구별된다**」는 **이름을 조건으로 삼게 읽힌다.** 원전 안에서 이름 쌍이 갈리고(원서 그림은 commissioner/responsible, 초안은 parent/child), **이름으로 읽으면 대칭 연결이 그대로 통과한다.** 판정 가능한 형태는 **「두 끝을 맞바꾸면 다른 사실이 되는가」** 다
> - **★ 조건 3 의 근거로 쓰면 안 되는 문장이 이 노트에 있다.** 「비교 대상」 절 Object Graph 인용 옆의 「**흔히** 연관에 타입이 붙는다」는 **연관 객체 일반의 흔한 규칙**이라 단독 근거로 쓰면 PG27 에 걸린다(그 문장이 Accountability 를 직접 지목해 더 위험하다). 쓸 수 있는 것은 도입부 「typed according to the kind of link」와 「Making it work」의 인스턴스 생성 지침이다
> - **노트에 없는 원전 사실 셋** — ① 초안 「Object Graph」가 실무의 그래프는 「**대개**(Most)」 비순환이라 적는다(순환 금지를 `[선택]` 으로 두는 근거) ② 초안 「When to use it」이 **권한 계통이 여럿인 것**을 이 패턴을 쓰는 동기로 적는다(위임된 책임 없는 연결을 거르는 근거) ③ **기본형의 accountability type 은 「흥미로운 행동이 없다」** — Knowledge Level 편과 가르는 자리다(그 편 `[필수]` 2「이름표가 아니라 규칙을 쥔다」를 통과하지 못한다)
> - **「선택지 C」 기술은 정확하지만 「지양 후보」로만 적으면 오해를 부른다** — 초안 생성자가 양 끝 Party 모두에 자기를 등록하고 순환 검사가 그 컬렉션을 탄다. **그것이 원전의 예제 모양이다**
> - **식별성: 원전에 근거가 없다**(집필자·채점자 각각 실측) — `accountability.pdf`(25쪽)·`apchap2.pdf` 두 파일 모두 **identity·identifier·unique 각각 0건**, 그림 2.8~2.15 에 식별자 속성 없음. **Party 편이 미뤄 둔 판단을 받아 보니 이쪽에도 근거가 없어 같은 `[선택]` 표기가 됐다**
> - **미해결 1(§2.4·§2.5 쪽)은 여전히 확인 못 함** — 쪽 없이 장·절만 쓴다
> - **실측 보탬** — OFBiz `PartyRelationship` 필드가 **14개**(노트가 「등」으로 줄인 것에 `statusId`·`relationshipName`·`securityGroupId`·`priorityTypeId`·`permissionsEnumId`·`positionTitle`·`comments` 포함). AOM 논문은 그림 4 가 종류 층/운영 층을 가르고 IDPH 공중보건 시스템을 Party·Accountability·Observation 기반 사례로 든다
> - **★ 이 편 고유의 함정** — **양 끝이 둘 다 `PartyId`** 라 두 끝을 맞바꿔 넘기면 **진단 0건 · 실행 거절 0건**이고 출력 12줄 중 **2줄만 조용히 바뀐다. 브랜드 타입으로도 못 막는다**
> - **`### 구현` 절 펜스 함정을 실제로 밟았다** — **해설에** ```text 을 넣었더니 `--compile` 이 「실제 4개」로 막았다. **해설도 그 절 안**이다. **Rust 가 분량 상한에 먼저 걸리고**(367 → 240줄) **가장 효과적인 줄이기는 「불변식의 위치」 표에 없는 검사를 빼는 것**이다 — 그러면 표↔코드 1:1 이 오히려 또렷해진다


### 원전 대응

- 원서 위치: Chapter 2 「Accountability」 §2.4 「Accountability」(Pearson 목차 PDF). 변형은 §2.5 「Accountability Knowledge Level」, §2.6 「Party Type Generalizations」, §2.7 「Hierarchic Accountability」, §2.8 「Operating Scopes」, §2.9 「Post」이고, 도입 단계는 §2.2 「Organization Hierarchies」, §2.3 「Organization Structure」입니다. 쪽은 확인 안 함. 그림은 Figure 2.3–2.15(apchap2.pdf). 개정 초안에는 「Accountability (17)」로 있으며 의도문은 "Represents a complex graph of relationships between parties"입니다.
- 문제와 해법 (원서 그림의 진행 순서):
  - Figure 2.3: Operating Unit 1—* Region 1—* Division 1—* Sales Office처럼 조직 수준마다 클래스를 둔 명시적 구조. 초안은 이 방식의 단점으로 "조직 종류 사이 공통 행위가 많으면 안 맞고, 현재 조직 분류가 설계에 박혀서 중간 단계(지역)를 추가하면 수정이 필요하다"를 듭니다.
  - Figure 2.4: Organization에 재귀 연관(parent 0..1 — subsidiary *, `{hierarchy}`)을 두고, 하위 타입별 부모 타입을 OCL 제약으로 표현합니다.
  - Figure 2.5: sales/product 두 계층을 같은 Organization 위에 둡니다.
  - Figure 2.6–2.7: 링크를 `Organization Structure` 객체(parent·subsidiary Organization, `Time Period`)로 만들고 `Organization Structure Type`으로 분류, 타입에 `Rule`을 붙입니다.
  - Figure 2.8: 양 끝을 Party로 일반화한 `Accountability`(commissioner·responsible Party, `Time Period`, `Accountability Type`).
  - 초안의 사용 시점: 권한 라인이 여러 종류일 때 씁니다. 계층이 하나둘이면 Organization Hierarchy로 충분하고, "don't use it until you need it"이라고 적습니다. 기존 계층을 Accountability로 옮기는 리팩터링은 인터페이스부터 맞추라고 적습니다.
- 등장 개념:
  - `Accountability` — 두 Party 사이의 타입 있는 관계 · 운영 층위
  - `Accountability Type` — 관계의 종류(고용·감독 등) · 지식 층위
  - `commissioner` / `responsible` — Accountability 양 끝의 역할 이름(Figure 2.8). 초안은 `parent` / `child`로 바꿔 부릅니다
  - `Time Period` — 관계의 유효 기간 · 값. Figure 3.11에서 Time Record의 하위 타입(start·end Timepoint)으로 나옵니다
  - `Party Type` — Party의 분류 · 지식 층위(Figure 2.9)
  - `Action` — Figure 2.9에서 Accountability와 `*`—`*`로 연관된 개념 · 운영 층위. 원서 의미는 확인 안 함
  - `Hierarchic Accountability Type`, `Leveled Accountability Type` — 연결 규칙을 담은 Accountability Type 하위 타입(Figure 2.11–2.13) · 지식 층위
  - `Operating Scope` — Accountability의 적용 범위(Figure 2.14: Clinical Care Scope, Protocol Scope, Resource Provision(amount: Quantity), Sales Territory, Location 0..1) · 운영 층위
  - `Post` — Figure 2.15의 Party 하위 타입 · 운영 층위
  - `Connection Rule` — 초안 Figure 0.10: 한 Accountability Type이 허용하는 (부모 Party Type, 자식 Party Type) 쌍 · 지식 층위
- 관계 (Figure 2.8–2.13, 판독):
  - Accountability `*` — `1` Accountability Type
  - Accountability `*` — commissioner `1` Party / Accountability `*` — responsible `1` Party
  - Accountability — Time Period
  - Accountability Type `*` — commissioners `1..*` Party Type / Accountability Type `*` — responsibles `1..*` Party Type (Figure 2.9)
  - Party `*` — type `1` Party Type (Figure 2.9)
  - Party Type supertype `0,1` — subtypes `*`, Party의 `/all types`는 파생: "self type and all self type's supertypes" (Figure 2.10)
  - Leveled Accountability Type — levels `{list}` Party Type (Figure 2.12)
- 모델 불변식:
  - 타입 규칙(Figure 2.9 OCL): `x.type.commissioners->includes(x.commissioner.type) and x.type.responsibles->includes(x.responsible.type)`. Figure 2.10은 이를 supertype까지 포함한 `allTypes` 교집합으로 일반화합니다.
  - Hierarchic Accountability Type: "party may be responsible to only one accountability of this type" (Figure 2.11)
  - Leveled Accountability Type: "party may be responsible to only a party whose party type is the next in the levels list" (Figure 2.12)
  - 순환 금지(초안): 같은 Accountability Type 안에서 부모의 조상에 자식이 있으면 생성 불가, 부모 = 자식 불가. 초안은 Accountability를 **불변 객체**로 취급해서 검사를 생성 시점 팩토리(`create` → `canCreate`)에 둡니다. 타입이 다르면 역방향 관계도 허용합니다.
  - 초안: 타입 규칙 검사 행위는 Accountability Type에 둡니다 — "if you want to change the rules by just replacing a single object, the accountability type is the point of replacement."

### 최소 조건 후보

- [필수] 두 Party 사이의 관계가 단순 참조가 아니라 독립 객체로 존재한다 — 빠지면: `Person.manager` 같은 필드가 되어 기간·종류·이력을 붙일 곳이 없습니다.
- [필수] 관계의 종류가 클래스가 아니라 Accountability Type 인스턴스(데이터)다 — 빠지면: `Employment`, `Supervision` 클래스가 종류마다 늘어납니다.
- [필수] 양 끝이 Party로 일반화돼 있다 — 빠지면: 사람–조직, 조직–조직 관계마다 다른 구조가 생깁니다.
- [필수] 양 끝의 역할(commissioner/responsible 또는 parent/child)이 구별된다 — 빠지면: "누가 누구에게 책임지는가" 방향이 사라집니다(기존 가이드의 오해 지점과 같은 취지).
- [선택] Time Period(유효 기간)
- [선택] 지식 층위 규칙(Party Type, Connection Rule, Hierarchic/Leveled 타입)
- [선택] 순환 금지 검사
- [선택] Operating Scope

### 사용 단서

- 이런 요구가 보이면: "같은 사람이 지역 조직과 기능 조직 양쪽에 보고한다", "보고 라인·계약 관계·진료 책임이 계속 늘어난다", "관계가 언제부터 언제까지 유효했는지 이력이 필요하다", "병원에는 의사·컨설턴트만 소속될 수 있다" 같은 연결 규칙.
- 쓰지 말아야 할 때: 계층이 하나(또는 둘)뿐일 때 — 초안은 Organization Hierarchy가 더 단순하다고 적습니다. 책임·권한 의미가 없는 단순 다대다 연관까지 Accountability로 끌어오면 모델이 모호해집니다(기존 가이드 오해 지점).

### 비교 대상

- vs 단순 연관(재귀 연관, Organization Hierarchy): 링크가 속성(기간·종류)을 갖거나 링크 종류가 여럿이면 Accountability, 아니면 연관. 초안 Object Graph 절: "using association objects is a good bit more complicated than a simple association, so only go that far if you need to."
- vs Organization Structure(§2.3, Figure 2.6): 양 끝이 Organization으로 한정된 전 단계. 사람까지 같은 구조에 넣으려면 Party로 일반화한 Accountability.
- vs 타입별 관계 클래스 하드코딩: 새 관계 종류가 코드 추가인가 데이터 추가인가.
- vs Role Relationship(roles.pdf): 역할을 두 객체 사이 관계로 보는 패턴. Accountability는 관계 종류를 지식 층위로 올린 일반형으로 볼 수 있습니다(판단).

### DDD 매핑 후보 (상황 설정 표의 재료)

- 기본 배정: Accountability는 Entity입니다. 같은 두 Party·같은 타입이라도 기간이 다른 관계는 다른 사실이고, 종료 처리 대상으로 지목돼야 하기 때문입니다(판단). Time Period는 VO. Accountability Type과 Party Type은 지식 층위 → 운영 aggregate와 분리된 aggregate(참조 데이터).
- BC 한 줄 후보(판단): "조직·권한 관리 — 누가 누구에게 어떤 종류로 책임지는지와 그 유효 기간을 관리한다."
- 선택지 A — Accountability 하나하나를 독립 aggregate root로 둡니다. 양 끝은 `PartyId`, 종류는 `AccountabilityTypeId`.
  - 전제: 관계 수가 많고 개별 생성·종료가 잦으며 그래프 전체 규칙이 약합니다.
  - 장점: aggregate가 작고 동시 편집 경합이 거의 없습니다.
  - 단점: 타입 규칙 검사는 Accountability Type을 **읽어야** 해서 팩토리/도메인 서비스가 필요합니다. "한 Party는 이 타입에서 책임자 1명" 같은 집합 규칙과 순환 금지는 단일 Accountability 경계 밖이라, 저장소 유일성 제약이나 사후 탐지·보정(결과적 일관성)으로 지켜야 합니다.
- 선택지 B — 특정 Accountability Type의 관계 전체를 하나의 "조직 구조" aggregate(root)가 소유합니다(원형은 Figure 2.6의 Organization Structure).
  - 전제: 구조의 크기가 제한적이고 편집 빈도가 낮으며 동시 편집자가 적습니다. 순환 금지·계층 유일성이 **트랜잭션 안에서 반드시 지켜져야 하는 진짜 불변식**입니다.
  - 장점: 그래프 불변식을 root가 원자적으로 강제합니다(Vernon 규칙 "Model True Invariants In Consistency Boundaries").
  - 단점: 큰 aggregate — Vernon 규칙 "Design Small Aggregates"와 긴장합니다. 조직이 커지면 로딩·락 비용이 커집니다.
- 선택지 C — Party aggregate가 자기 Accountability 컬렉션을 가집니다(초안 샘플 코드가 Party에 `parentAccountabilities`/`childAccountabilities` Set을 양방향으로 둠).
  - 평가(판단): 관계 하나가 두 Party에 걸치므로 한쪽이 소유하면 비대칭이 되고, 생성 시 두 aggregate를 함께 고쳐야 해서 지양 후보입니다. 초안 코드는 분석 설명용이지 경계 권고가 아닙니다.
- 불변식의 위치: 타입 규칙 = 생성 팩토리(Type은 읽기 전용 입력), 순환·계층 유일성 = 선택지에 따라 root 안(B) 또는 경계 밖(A).
- 지식 층위 변경 쟁점(판단): Accountability Type의 규칙이 바뀌었을 때 이미 존재하는 Accountability가 새 규칙을 위반하면 무효로 볼지 — 원서 언급 확인 안 함. Knowledge Level 노트의 "타입 버전 고정" 선택지와 연결됩니다.

### 세 언어 구현 쟁점

- 공통: commissioner와 responsible이 같은 `PartyId` 타입이라 인자 순서를 바꿔 넣는 실수를 타입 검사가 못 잡습니다. 이름 있는 필드나 역할별 래퍼 타입으로 막을 수 있습니다(판단).
- Java: Time Period는 `record TimePeriod(LocalDate start, LocalDate end)`에 compact constructor로 경계 검증(JEP 395). java.time 패키지 문서는 "with"를 "the immutable equivalent of a setter"라고 설명합니다. 순환 검사는 표준 컬렉션(`HashSet`, `ArrayDeque`) BFS로 충분합니다(판단).
- TypeScript: 날짜를 `Date`로 들고 있으면 `setFullYear` 같은 변경 메서드가 있어 공유 시 aliasing 위험이 있습니다(MDN Date — Temporal 도입으로 Date를 legacy로 표기). ISO 문자열이나 epoch 숫자로 들고 다니는 선택지가 있습니다(판단).
- Rust: 역할 방향을 필드 이름으로 고정하고(`commissioner: PartyId, responsible: PartyId`), 순환 검사는 `std::collections::{HashSet, VecDeque}`로 구현합니다(판단). 표준 라이브러리에 달력 날짜 타입이 없어 기간 표현은 정수 일 수나 외부 크레이트가 필요합니다(std::time 문서: Duration, Instant, SystemTime만 제공).

### 실제 사례

- Apache OFBiz `PartyRelationship`: 필드 `partyIdFrom`, `partyIdTo`, `roleTypeIdFrom`, `roleTypeIdTo`, `fromDate`, `thruDate`, `partyRelationshipTypeId` 등이 있고 기본 키가 (partyIdFrom, partyIdTo, roleTypeIdFrom, roleTypeIdTo, fromDate)입니다 — 양 끝 Party, 방향, 유효 기간, 관계 종류가 모두 있습니다. `PartyRelationshipType`에는 `parentTypeId`와 `roleTypeIdValidFrom`/`roleTypeIdValidTo`가 있어 타입 계층과 허용 역할이라는 지식 층위 규칙을 데이터로 둡니다.
- Yoder & Johnson, "The Adaptive Object-Model Architectural Style"(WICSA3): Property 패턴의 관계형 변형을 설명하며 "An Association (called Accountability … by Fowler and Hayes)"라고 적습니다 — Accountability가 AOM 문헌에서 일반 연관 객체로 계승된 근거입니다.

### 기존 가이드 승계분

- 최소 조건 취지: ① 관계의 객체화(자체 속성 보유) ② 관계 종류의 데이터화(AccountabilityType 인스턴스) ③ 양 끝의 Party 일반화. 오해 지점으로 Type을 enum 문자열로만 두기, 모든 다대다의 만능 해법으로 남용, 방향성(책임 주체 vs 위임자) 무시를 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Chapter 2 / martinfowler.com/books/ap.html / TM Forum SID Party·PartyRelationship

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §2.2–§2.9 번호와 제목 · 조회 2026-09-17
- [Analysis Patterns 목차 (InformIT)](https://www.informit.com/store/analysis-patterns-reusable-object-models-9780201895421) — Chapter 2 절 제목 교차 확인 · 조회 2026-09-17
- [UML Diagrams for Chapter 2 (apchap2.pdf)](https://martinfowler.com/apsupp/apchap2.pdf) — Figure 2.3–2.15의 연관·다중도·OCL 제약 · 조회 2026-09-17
- [UML Diagrams for Chapter 3 (apchap3.pdf)](https://martinfowler.com/apsupp/apchap3.pdf) — Figure 3.11 Time Period가 Time Record 하위 타입 · 조회 2026-09-17
- [Organization Structures 개정 초안 (accountability.pdf)](https://martinfowler.com/apsupp/accountability.pdf) — 「Accountability (17)」 의도문·사용 시점·샘플 코드·순환 검사·Connection Rule(Figure 0.10, 0.11)·Hierarchic/Levelled Accountability Type · 조회 2026-09-17
- [Dealing with Roles (roles.pdf)](https://martinfowler.com/apsupp/roles.pdf) — Role Relationship · 조회 2026-09-17
- [Effective Aggregate Design Part I (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf) — "Model True Invariants In Consistency Boundaries", "Design Small Aggregates" · 조회 2026-09-17
- [java.time 패키지 문서 (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html) — "with - the immutable equivalent of a setter" · 조회 2026-09-17
- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) — setter 메서드 존재, Temporal 도입으로 legacy 표기 · 조회 2026-09-17
- [Rust std::time](https://doc.rust-lang.org/std/time/index.html) — Duration·Instant·SystemTime만 제공, 달력 날짜 없음 · 조회 2026-09-17
- [OFBiz party-entitymodel.xml](https://github.com/apache/ofbiz-framework/blob/trunk/applications/datamodel/entitydef/party-entitymodel.xml) — PartyRelationship·PartyRelationshipType 필드와 기본 키 · 조회 2026-09-17
- [The Adaptive Object-Model Architectural Style (Yoder & Johnson)](https://adaptiveobjectmodel.com/WICSA3/ArchitectureOfAOMsWICSA3.pdf) — Accountability를 Association으로 언급 · 조회 2026-09-17

### 미해결 질문

1. 원서 §2.4 「Accountability」·§2.5 「Accountability Knowledge Level」의 쪽 — 확인 안 함.
2. Figure 2.9의 `Action`이 무엇인지(Accountability와 다대다) — 확인 안 함.
3. 원서(1997)의 commissioner/responsible 명명을 가이드에서 쓸지, 초안(2001)의 parent/child를 쓸지 — 집필 결정 사항. 초안은 parent/child 은유를 "a very useful metaphor"라며 선호한다고 적습니다.
4. 지식 층위 규칙이 바뀌었을 때 기존 Accountability의 유효성 처리 — 원서 언급 확인 안 함.
5. TM Forum SID PartyRelationship 1차 문서 — 확인 안 함.

---

## Knowledge Level (지식 수준)

> **집필 결과 되먹임 (2026-09-29, v1.0.0 · 게이트 3R PASS)**
> - **★ `[필수]` 후보 2 는 `[선택]` 이 맞다.** 원문이 **"It's a **common convention** to make the connection between the knowledge and operational level through associations between a 'thing' and a 'thing type'."** 이다. 이 노트의 「등장 개념」 절이 이미 「**관례적** 연결」로 적어 둔 것과 일치하니 「최소 조건 후보」 쪽 표기를 내린다. **그리고 `[필수]` 로 올리면 발행된 Posting Rule 편이 이 패턴에서 탈락해 그 편 `:276` 과 충돌한다**(그 모델에서 원천 사건은 규칙을 가리키지 않고 `(사건 종류, 발생 시점)` 조회가 답한다) — **조건을 세울 때 발행본을 판정해 보는 검사가 필요하다**
> - **★ 「모델 불변식」의 「허용 조합」도 성립 요건이 아니다** — "Connection rules … provide a simple yet very flexible **form** of knowledge level" 이고, **Levelled Accountability Type** 절이 "Connection rules are **the most common way** … but **a simpler alternative** is to list the levels" 로 대안을 나란히 둔다
> - **★ 요점 선언의 한정어가 조건 둘을 가른다** — "whose **instances** affect the behavior of a group of operational objects, **typically** allowing you to alter a system 'without programming'" 에서 **`typically` 는 「프로그래밍 없이」만 한정하고 `instances` 는 한정 없이 선다**
> - **그림 위/아래 배치는 "Another personal convention"** 이고 표준이 아니라고 저자가 적는다(노트 서술과 일치, 원문 확인)
> - **Evans DDD Reference 원문 확인** — 문제 서술 "Classes that have the same data and behavior may multiply just to accommodate different assembly rules.", 해법 "Create a distinct set of objects that can be used to **describe and constrain** the structure and behavior of the basic model."
> - **미해결 2 는 여전히 확인 못 함** — 초안에서 **층의 수를 규정한 문장을 찾지 못했다.** 그래서 「대개 두 단계면 충분」을 본문에서 다루지 않았고 `[선택]` 후보 「층위 3단 이상」도 조건에 넣지 않았다. 미해결 3(소급)도 원전에 없어 조건을 「이 가이드의 정책」으로 뒀다
> - **실측 보탬** — OFBiz `PartyRelationshipType` 이 노트에 필드 둘로 적혀 있는데 실측은 **일곱**이고, `RoleType` 으로 가는 관계 둘과 **자기 자신으로 가는 Parent 관계**가 있다 — 마지막 것이 「지식 객체끼리의 연관」 사례다. FHIR R5 Observation `code` = `1..1 CodeableConcept` 확인
> - **도식 실측** — 도식이 **층을 주장하면 `@relation` 은 `layered`**(`groups:` 로 경계를 선언하면 lint 신호와 맞는다), **링크가 자기 자리를 갖는다는 주장이면 `relate`**(Accountability 편이 그쪽). `above` 계층 선언은 양쪽 다 필요하다. **같은 층 두 칸 사이 통로가 56px 뿐이라 `1..*` 라벨이 칸에 덮인다**


### 원전 대응

- 원서 위치: 1997 원서 목차(Pearson PDF, InformIT)에는 「Knowledge Level」이라는 독립 절이 **없습니다**. 제목으로 확인되는 곳은 Chapter 2 §2.5 「Accountability Knowledge Level」입니다. 그림에서 지식/운영 층위 구분선이 확인되는 곳은 Figure 2.9, 2.10, 3.6, 3.10, 3.14, 4.7, 6.20입니다(apchap2/3/4/6.pdf). 개정 초안(accountability.pdf)에는 독립 패턴 「Knowledge Level (32)」이 있습니다. 원서 1장 등에서 일반론으로 다루는지는 확인 안 함.
- DDD 쪽 위치: Evans 『Domain-Driven Design』(2003) Chapter 16 「Large-Scale Structure」에 KNOWLEDGE LEVEL이 있고(InformIT 목차), DDD Reference 51쪽이 Fowler 1997을 출처로 겁니다.
- 문제와 해법:
  - 초안 의도문: "A group of objects that describe how another group of objects should behave (also known as a meta level)". 지식 객체 인스턴스들이 운영 객체들의 행동을 결정해서, 코드를 바꾸는 대신 지식 객체를 만들고 연결해 시스템을 바꾼다는 설명입니다. 예시는 Employee Type이 Pay Strategy·Retirement Plan 조합을 가리키고 Employee가 Employee Type을 참조하는 구조(초안 Figure 0.14)입니다.
  - Evans(DDD Reference): 역할과 관계가 상황마다 달라서 복잡도가 폭발하는 문제에 대해 "Create a distinct set of objects that can be used to describe and constrain the structure and behavior of the basic model. Keep these concerns separate as two 'levels,' one very concrete, the other reflecting rules and knowledge that a user or super-user is able to customize."
  - 초안의 경고: "without programming"으로 비개발자가 바꾸게 한다는 기대는 "eldorado"라고 적습니다. 테스트가 더 중요해지고 어려워지며, 디버깅·형상관리 도구를 직접 만들어야 하고, 드물게 써야 하지만 필요할 때는 필수("Rather like parachutes")라고 적습니다. 진짜 이점은 설계를 아는 사람이 변경을 훨씬 빨리 할 수 있다는 점이라고 적습니다.
- 등장 개념:
  - `Knowledge Level` — 운영 객체가 어떻게 행동할지 기술하는 객체 집합 · 지식 층위
  - `Operational Level` — 매일의 운영 사실(초안: 임상의의 일상 운영 행동) · 운영 층위
  - `thing` / `thing type` — 두 층위를 잇는 관례적 연결(초안: thing type을 type object라 부름) · 각각 운영/지식
  - 이 책에서의 지식 층위 인스턴스 예: `Party Type`, `Accountability Type`(Figure 2.9), `Phenomenon Type`(Figure 3.6), `Observation Concept`·`Protocol`(Figure 3.10), `Associative Function`(Figure 3.14), `Measurement Protocol`(Figure 4.7), `Account Type`·`Posting Rule`(Figure 6.20)
- 관계:
  - 운영 객체 `*` — `1` 타입 객체(Figure 2.9: Party `*`—`1` Party Type, Accountability `*`—`1` Accountability Type; Figure 3.6: Measurement `*`—`1` Phenomenon Type)
  - 지식 객체끼리의 규칙 연관(Figure 2.9: Accountability Type — commissioners/responsibles Party Type)
  - 초안의 표기 관례: 지식 층위를 그림 위쪽, 운영 층위를 아래쪽에 점선으로 나눕니다(Cosmos 프로젝트에서 유래, 표준은 아님)
- 모델 불변식:
  - 운영 인스턴스는 지식 층위가 허용한 조합만 가질 수 있습니다(Figure 2.9 OCL, 초안 Connection Rule).
  - 참조 방향: 운영 → 지식(그림상 타입 연관의 `1` 쪽이 지식 층위).
  - 지식 층위가 바뀔 때 기존 운영 인스턴스와의 정합성 규칙은 원서에서 확인 안 함.

### 최소 조건 후보

- [필수] 개별 사실(운영)과 그 사실의 종류·규칙(지식)이 다른 객체 집합으로 분리돼 있다 — 빠지면: 인스턴스 안에 분류 규칙 메서드가 섞여 규칙 변경 = 코드 변경이 됩니다.
- [필수] 운영 인스턴스가 자기를 규정하는 지식 객체를 참조한다 — 빠지면: "이 인스턴스가 어떤 종류인가"를 데이터로 알 수 없습니다.
- [필수] 지식 객체가 단순 이름표가 아니라 운영 객체의 구조나 행동을 **제약하거나 결정**한다(규칙·전략·허용 조합) — 빠지면: 코드 테이블일 뿐이고 규칙은 여전히 `if (type == ...)`로 흩어집니다(Evans 정의의 "describe and constrain").
- [선택] 규칙 변경을 런타임에 반영
- [선택] 지식 층위 편집 도구
- [선택] 층위 3단 이상(기존 가이드는 대개 두 단계면 충분하다고 적음 — 원서 근거는 확인 안 함)

### 사용 단서

- 이런 요구가 보이면: "새 검사 항목·관계 종류·요금 정책이 배포 없이 추가돼야 한다", "종류마다 허용 조합이 다르고 자주 바뀐다", "같은 데이터와 행동을 가진 클래스가 조립 규칙만 달라서 늘어난다"(Evans 문제 서술 "Classes that have the same data and behavior may multiply just to accommodate different assembly rules").
- 쓰지 말아야 할 때: 규칙이 거의 안 바뀌고 종류가 몇 개로 닫혀 있을 때 — 초안은 드물게 쓰라고 경고합니다. 테스트·디버깅 도구를 갖출 여력이 없을 때.

### 비교 대상

- vs 하드코딩된 타입 enum: enum은 종류 집합이 컴파일 시점에 닫혀 있고 규칙은 enum 밖 코드에 있습니다. Knowledge Level은 종류가 데이터이고 규칙이 종류 객체 안(또는 거기서 가리키는 전략)에 있습니다. 구분 기준은 "새 종류 추가가 코드 변경인가"와 "규칙이 타입 객체에 붙어 있는가"입니다.
- vs Type Object(Johnson & Woolf, PLoPD3 1997): 의도문 "Decouple instances from their classes so that those classes can be implemented as instances of a class." 논문이 직접 "Fowler talks about the separate Object Type and Object worlds, and calls these the 'knowledge level' and the 'operational level.' He uses Type Object to define types for organizational units, accountability relationships, parties involved in relationships, contracts, the terms for contracts, and measurements"라고 적습니다. Type Object는 한 쌍(thing–thing type)의 구현 기법이고, Knowledge Level은 그런 타입 객체들이 모여 규칙까지 담는 층위 전체입니다(판단).
- vs Adaptive Object Model(Yoder & Johnson): Type Object·Property·Strategy를 핵심으로 사용자 객체 모델을 런타임에 해석하는 아키텍처 스타일입니다. Fowler는 Agreement Dispatcher를 "an example of an Adaptive Object Model"이라고 적습니다. AOM은 Knowledge Level을 시스템 전체 아키텍처로 밀어붙인 형태로 볼 수 있습니다(판단).
- vs 메타데이터/"meta level": 초안은 meta라는 말이 가장 흔하지만 비개발자에게 더 뜻이 통해서 knowledge level이라 부른다고 적습니다. "Active Object Model"이라는 용어는 운영 층위를 수동적으로 들리게 해서 좋아하지 않는다고 적습니다.

### DDD 매핑 후보 (상황 설정 표의 재료)

- 성격: Evans는 Knowledge Level을 aggregate 같은 빌딩 블록이 아니라 **대규모 구조(Large-Scale Structure)**로 분류합니다. 그래서 이 패턴 단독으로는 상황 설정 표의 root·entity·VO 칸이 비고, 적용 대상(예: Accountability Type, Phenomenon Type, Account Type)을 하나 정해야 채워집니다(판단). **가이드는 예제 도메인 하나를 고정해야 표가 공회전하지 않습니다.**
- 선택지 A — 지식 객체(Type)를 별도 aggregate로 두고 운영 aggregate는 `TypeId`로 참조합니다.
  - 전제: 타입 편집과 운영 사실 기록이 다른 시점·다른 사용자에게서 일어납니다.
  - 장점: 운영 aggregate가 작고, 타입을 독립적으로 편집합니다. 규칙 교체 지점이 Type 하나입니다(초안의 "point of replacement").
  - 단점: 운영 aggregate를 만들 때 Type을 읽어 검증해야 하고, 타입 규칙 변경이 기존 운영 인스턴스에 소급되는지를 정책으로 정해야 합니다.
  - 내부 배정 예: `AccountabilityType`(root) 안에 `ConnectionRule`을 VO 목록으로 둡니다 — 규칙은 통째로 교체되는 값이기 때문입니다(판단).
- 선택지 B — 타입 버전 고정: 운영 인스턴스가 생성 시점의 `TypeVersionId`를 참조하거나, 필요한 규칙을 VO 스냅샷으로 복사해 둡니다.
  - 전제: 규칙 변경이 과거 사실에 소급되면 안 됩니다(회계·의료 기록).
  - 장점: 과거 사실의 해석이 고정됩니다. Fowler Agreement Dispatcher의 시점별 규칙(temporal collection)과 같은 방향입니다.
  - 단점: 버전 관리 비용, 스냅샷 중복.
- 선택지 C — 지식 층위를 별도 BC(설정·카탈로그)로 분리하고 운영 BC는 번역된 사본을 받습니다.
  - 전제: 지식 편집자(업무 설계자)와 운영 사용자가 다른 조직이고 배포 주기가 다릅니다.
  - 장점: 운영 BC가 설정 모델 변화에 덜 흔들립니다. 단점: 동기화·번역 계층 비용.
- 불변식의 위치: "운영 인스턴스는 허용된 조합만"은 운영 aggregate 생성 팩토리(Type은 읽기 입력). "타입끼리의 일관성"(예: Party Type supertype 계층에 순환 없음)은 Type aggregate 또는 타입 체계 aggregate.

### 세 언어 구현 쟁점

- Java: 타입을 `enum`으로 만들면 종류 집합이 컴파일 시점에 닫혀 Knowledge Level의 요점("새 종류는 데이터")과 반대가 됩니다(판단). 지식 객체는 일반 클래스 인스턴스로, 계산 규칙은 인터페이스 구현(Strategy)이나 람다로 둡니다. 닫힌 전략 계층이 필요하면 sealed interface(JEP 409)를 쓸 수 있으나 그 경우 새 전략 추가는 코드 변경입니다(판단).
- TypeScript: 지식 객체를 설정 데이터에서 읽어 만들 수 있으나, 규칙의 "행동"은 데이터로 직렬화되지 않으므로 이름 → 함수 레지스트리가 필요합니다(판단).
- Rust: `enum`은 닫힌 집합, `Box<dyn Trait>`은 열린 집합입니다. 지식 층위를 런타임 데이터로 두려면 trait 객체 + 레지스트리(`HashMap<String, Box<dyn Rule>>`) 형태가 됩니다(판단).
- 공통: 초안이 경고한 대로 지식 층위 설정 자체에 대한 테스트(설정 조합 검증)가 필요합니다.

### 실제 사례

- HL7 FHIR R5 Observation: `code`(1..1, CodeableConcept, "Type of observation (code / type)")가 무엇을 관찰했는지를 코드로 가리킵니다. 관찰 항목이 스키마 필드가 아니라 코드(지식)로 표현되는 구조입니다.
- Apache OFBiz `PartyRelationshipType`: `roleTypeIdValidFrom`/`roleTypeIdValidTo`로 관계 종류마다 허용 역할을 데이터로 둡니다(Fowler의 Connection Rule과 같은 취지 — 판단).
- Fowler Agreement Dispatcher(eaaDev): 계약(agreement) 객체가 사건 타입별·시점별 Posting Rule을 담고, 스스로를 Adaptive Object Model의 예라고 적습니다.

### 기존 가이드 승계분

- 최소 조건 취지: ① 운영 수준 객체와 지식 수준 객체의 명시적 분리 ② 운영 → 지식 참조 ③ 분류·제약·허용 조합 같은 규칙의 데이터화. 오해 지점으로 코드값 목록으로만 쓰기, 두 수준을 한 클래스에 섞기, 무한 메타 계층을 들었습니다.
- 참고 자료(기존 목록): Fowler 1997(여러 장에 걸친 Knowledge/Operational Level 논의) / martinfowler.com/books/ap.html / 관련 구현 패턴 Type Object, Item–Description, Metamodel

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §2.5 「Accountability Knowledge Level」, 독립 「Knowledge Level」 절 없음 · 조회 2026-09-17
- [Analysis Patterns 목차 (InformIT)](https://www.informit.com/store/analysis-patterns-reusable-object-models-9780201895421) — 절 제목 교차 확인 · 조회 2026-09-17
- [UML Diagrams for Chapter 2 (apchap2.pdf)](https://martinfowler.com/apsupp/apchap2.pdf) — Figure 2.9·2.10 지식/운영 구분선과 OCL · 조회 2026-09-17
- [UML Diagrams for Chapter 3 (apchap3.pdf)](https://martinfowler.com/apsupp/apchap3.pdf) — Figure 3.6·3.10·3.14 구분선 · 조회 2026-09-17
- [UML Diagrams for Chapter 4 (apchap4.pdf)](https://martinfowler.com/apsupp/apchap4.pdf) — Figure 4.7 구분선 · 조회 2026-09-17
- [UML Diagrams for Chapter 6 (apchap6.pdf)](https://martinfowler.com/apsupp/apchap6.pdf) — Figure 6.20 구분선 · 조회 2026-09-17
- [Organization Structures 개정 초안 (accountability.pdf)](https://martinfowler.com/apsupp/accountability.pdf) — 「Knowledge Level (32)」 의도문·용어·경고·사용 시점 · 조회 2026-09-17
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Knowledge Level(51쪽), Large-scale Structure 분류 · 조회 2026-09-17
- [Domain-Driven Design 목차 (InformIT)](https://www.informit.com/store/domain-driven-design-tackling-complexity-in-the-heart-9780321125217) — Chapter 16 Large-Scale Structure 아래 KNOWLEDGE LEVEL · 조회 2026-09-17
- [The Type Object Pattern (Johnson & Woolf)](http://www.cs.ox.ac.uk/jeremy.gibbons/dpa/typeobject.pdf) — 의도문, Fowler의 knowledge/operational level 언급 · 조회 2026-09-17
- [The Adaptive Object-Model Architectural Style (Yoder & Johnson)](https://adaptiveobjectmodel.com/WICSA3/ArchitectureOfAOMsWICSA3.pdf) — Type Object 참조, 지식 층위 언급 · 조회 2026-09-17
- [Agreement Dispatcher (eaaDev, 2005-03-11)](https://martinfowler.com/eaaDev/AgreementDispatcher.html) — "an example of an Adaptive Object Model", 시점별 규칙 · 조회 2026-09-17
- [JEP 409: Sealed Classes](https://openjdk.org/jeps/409) — Release 17 · 조회 2026-09-17
- [HL7 FHIR R5 Observation](https://hl7.org/fhir/R5/observation.html) — `code` 1..1 CodeableConcept · 조회 2026-09-17
- [OFBiz party-entitymodel.xml](https://github.com/apache/ofbiz-framework/blob/trunk/applications/datamodel/entitydef/party-entitymodel.xml) — PartyRelationshipType 필드 · 조회 2026-09-17

### 미해결 질문

1. 1997 원서에서 Knowledge Level을 일반 개념으로 정의한 위치(1장 또는 §2.5 본문)와 쪽 — 확인 안 함.
2. 기존 가이드의 "대개 두 단계면 충분하다"는 주장의 원서 근거 — 확인 안 함.
3. 지식 층위 변경을 기존 운영 인스턴스에 소급할지에 대한 Fowler의 권고 — 확인 안 함.
4. 기존 가이드 참고 자료의 "Item–Description" 패턴 원전 — 확인 안 함.

---

---

## Quantity (수량)

### 원전 대응

- 원서 위치: Chapter 3 「Observations and Measurements」 §3.1 「Quantity」. 이어지는 §3.2 「Conversion Ratio」, §3.3 「Compound Units」가 이 패턴의 확장입니다(Pearson 목차 PDF). 쪽은 확인 안 함(Chapter 3 시작 35쪽). 그림은 Figure 3.1–3.5입니다(apchap3.pdf). Fowler의 1999 JAOO 튜토리얼 슬라이드에 「Quantity」 페이지가 따로 있습니다.
- 문제와 해법:
  - 문제(Figure 3.1): Person의 `height`·`weight`·`blood glucose level`이 `Number`여서 단위가 모델에 없습니다.
  - 해법(Figure 3.2): 속성 타입을 `Quantity`로 바꿉니다. Quantity는 `amount: Number`, `units: Unit`과 연산 `+, -, *, /, =, >, <`를 가집니다.
  - JAOO 슬라이드의 Quantity 정의: `amount: Number`, `units: Unit`, `+, -, *, /`, `<, >, =, <=, >=`, `as(Unit): Quantity`, `toString(): String`, `valueOf(String): Quantity`. 슬라이드 요점은 "Define arithmetic operations for quantity", "Money is a kind of quantity", "Use Conversion Ratio to convert to other units"입니다.
  - PoEAA Money(Fowler 2003, 18장 요약 페이지): 돈이 주류 언어의 1급 타입이 아니어서 두 문제가 생긴다고 적습니다. 하나는 통화("avoid adding your dollars to your yen without taking the currency differences into account"), 다른 하나는 반올림("it's easy to lose pennies")입니다.
- 등장 개념:
  - `Quantity` — 수치와 단위를 묶은 값 · 값
  - `Unit` — 단위 · 값(단위 집합을 운영 중 늘린다면 지식 층위 성격 — 판단)
  - `Conversion Ratio` — from Unit에서 to Unit으로 바꾸는 `number: Number` · 원서 그림에 층위 표시 없음(지식 층위 성격 — 판단)
  - `Compound Unit` / `Atomic Unit` / `Unit Reference(power: Integer)` — 합성 단위(예: m/s²)의 구조(Figure 3.4) · 값
  - `Money` — Quantity의 한 종류(JAOO) · 값
- 관계:
  - Figure 3.3: Unit `1` (from) — `*` Conversion Ratio, Unit `1` (to) — `*` Conversion Ratio
  - Figure 3.4: Atomic Unit, Compound Unit → Unit(일반화). Compound Unit `1` — `1..*` Unit Reference, Unit Reference `*` — `1` Atomic Unit(판독)
  - Figure 3.5(대안): Compound Unit — direct `{bag}` `*` Atomic Unit, inverse `{bag}` `*` Atomic Unit(판독)
- 모델 불변식:
  - Figure 3.4 제약: "must have more than one unit reference or one unit reference with (power < 0 or power > 1)"
  - Figure 3.5 제약: "must have more than one inverse or at least two direct units"
  - 단위가 다른 Quantity끼리 연산할 때의 처리(거부인지 자동 변환인지)는 원서 문구를 확인 안 함. 그림은 연산자 목록만 보여 줍니다. PoEAA Money는 통화 차이를 고려하지 않은 합산을 막아야 한다는 취지입니다.

### 최소 조건 후보

- [필수] 수치와 단위가 떨어지지 않는 한 값이다 — 빠지면: Figure 3.1처럼 `height: Number`가 되고 단위는 필드 이름이나 주석에만 남습니다.
- [필수] 연산과 비교가 단위를 확인한다(맞지 않으면 거부하거나 명시적 변환을 요구) — 빠지면: 달러에 엔을 그대로 더합니다(PoEAA Money).
- [필수] 불변이고, 같음을 값(수치 + 단위)으로 판정한다 — 빠지면: `add`가 자기 자신을 바꿔 같은 객체를 공유하던 다른 금액도 바뀝니다(Fowler ValueObject bliki의 aliasing bug).
- [선택] Conversion Ratio로 명시 변환(`as(Unit)`)
- [선택] Compound Unit
- [선택] 금액 특화: 통화 최소 단위 반올림과 배분 규칙(PoEAA Money)
- [선택] 문자열 파싱과 표시(`valueOf(String)`, `toString()`)

### 사용 단서

- 이런 요구가 보이면: "cm와 inch가 섞여 들어온다", "금액이 여러 통화다", "검사 결과마다 단위가 다르다", "합계를 내면 1원씩 어긋난다".
- 쓰지 말아야 할 때: 수가 식별자나 코드라서 산술 의미가 없을 때 — Fowler bliki는 정수 id에 산술 같은 맞지 않는 행위를 막으려면 별도 VO로 감싸라고 적습니다. Quantity가 아니라 id VO입니다. 단위가 도메인 전체에서 하나로 고정되고 연산도 없을 때(판단).

### 비교 대상

- vs 원시 숫자 필드(Primitive Obsession): Fowler ValueObject bliki — "It's often a good idea to replace common primitives, such as strings, with appropriate value objects." 이점으로 변수·매개변수가 명시적이 되고(타입 검사), 검증이 한곳에 모이고, 맞지 않는 행위를 막는다고 적습니다. "Primitive Obsession"이라는 이름의 1차 출처(『Refactoring』)는 이 조회에서 확인 안 함.
- vs Measurement: Quantity는 값이고, Measurement는 그 값을 대상·Phenomenon Type과 묶은 사실입니다(Figure 3.6의 `quantity: Quantity` 속성).
- vs Money: JAOO는 "Money is a kind of quantity"라고 적습니다. PoEAA Money는 통화와 반올림에 특화된 형태입니다.
- vs Range: Range의 끝점이 Quantity일 수 있습니다(Figure 4.20 제약 "range's bounds must be quantities with time units").
- vs 단위 문자열만 붙인 래퍼: 단위를 들고만 있고 연산에서 확인하지 않으면 안전성이 없습니다(구 가이드 오해 지점과 같은 취지).

### DDD 매핑 후보 (상황 설정 표의 재료)

- 배정: VO로 확정입니다. 식별성이 없고 속성 조합만 의미가 있습니다(Evans DDD Reference의 Value Objects: "When you care only about the attributes and logic of an element of the model, classify it as a value object … Treat the value object as immutable"). Fowler bliki도 "Small objects, such as points, monies, or ranges, are good examples of value objects"라고 적습니다.
- **공회전 판단**: root·entity·타 aggregate 참조 칸이 비거나 자명합니다. 근거는 두 가지입니다. Quantity에는 수명주기가 없고, 늘 다른 개념의 속성으로만 존재합니다. 가이드는 둘 중 하나를 골라야 합니다. (a) Quantity를 품는 aggregate(Measurement나 Entry)를 예제로 표를 채운다 (b) "VO 전용 축약 표"(불변식 위치 = 생성자·연산)로 줄였다고 명시한다(판단).
- 경계 선택지가 생기는 곳은 Unit과 Conversion Ratio입니다.
  - 선택지 A — Unit을 코드 상수(닫힌 집합) VO로 둡니다.
    - 전제: 단위·통화 집합이 고정돼 있습니다.
    - 장점: 단순하고 컴파일 시점에 검사됩니다. 단점: 새 단위를 넣으려면 배포가 필요합니다.
  - 선택지 B — Unit과 Conversion Ratio를 지식 층위 참조 데이터(별도 aggregate)로 둡니다. Quantity에는 `UnitCode` VO만 넣고, 변환은 비율을 조회하는 도메인 서비스가 맡습니다.
    - 전제: 운영 중에 단위를 추가하거나 환산 비율을 바꿉니다.
    - 장점: 확장성. 단점: 변환에 조회가 끼고, 비율 데이터가 없을 때의 처리가 필요합니다.
  - 선택지 C — 환율처럼 시간에 따라 바뀌는 비율은 시점별 이력으로 둡니다. 변환 결과에 적용한 비율과 시점을 함께 남깁니다(판단).
- 불변식의 위치: VO 생성자(단위 필수, 금액 scale 규칙)와 연산 메서드(단위 일치 확인).
- BC: 여러 BC가 같은 정의를 공유하는 공용 모델 후보입니다(판단).

### 세 언어 구현 쟁점

- Java:
  - `record Quantity(BigDecimal amount, Unit unit)`의 equals는 컴포넌트 equals에 맡겨집니다(JEP 395). 그런데 `BigDecimal.equals`는 "considers two BigDecimal objects equal only if they are equal in value and scale. Therefore 2.0 is not equal to 2.00"입니다. `compareTo`는 2.0과 2.00을 같게 봅니다. 그래서 compact constructor에서 scale을 정규화하거나 equals를 다시 정의해야 합니다(판단).
  - `BigDecimal.divide`는 "if the exact quotient does not have a terminating decimal expansion"이면 `ArithmeticException`을 던지므로 반올림 방식을 명시해야 합니다.
  - 통화는 `java.util.Currency`(ISO 4217 코드, `getDefaultFractionDigits`)로 표현합니다. 금액 API(JSR 354)는 Java SE 밖 별도 API입니다 — JSR 354 페이지는 JDK의 금액 지원이 "little or no support"이고 `java.util.Currency`는 구조체일 뿐이라고 적습니다.
- TypeScript:
  - `number`는 IEEE 754 배정밀도이고, 정수를 손실 없이 표현하는 범위는 −(2⁵³−1)~2⁵³−1입니다(MDN Number). 금액을 최소 단위 정수로 둘 때도 이 범위 안이어야 합니다.
  - `bigint`는 number와 섞어 연산할 수 없고, `JSON.stringify`에서 기본적으로 `TypeError`가 납니다(MDN BigInt).
  - `readonly`는 컴파일 시점에만 막고(Handbook), `Object.freeze`는 얕게(shallow) 얼립니다(MDN).
  - 객체 동등성이 참조 비교라서 직접 만든 `equals`를 표준 라이브러리(`includes` 등)가 쓰지 않습니다(Fowler ValueObject bliki의 JavaScript 예).
- Rust:
  - `#[derive(Clone, Copy, PartialEq, Eq, Hash)] struct Money { minor: i64, currency: CurrencyCode }` 형태를 씁니다. `f32`·`f64`는 NaN 때문에 `PartialEq`만 구현하고 `Eq`는 구현하지 않으므로(std `Eq` 문서), 부동소수 금액이면 `Eq`/`Hash`를 파생할 수 없습니다.
  - 정수 연산자는 debug 빌드에서 오버플로 시 panic합니다(Rust Reference). 금액 합산은 `checked_add`(`Option<i64>` 반환)로 오버플로를 도메인 오류로 바꿀 수 있습니다.
  - Rust Book은 단위가 다른 `Millimeters`/`Meters` newtype과 `Add<Meters> for Millimeters` 구현을 예로 듭니다 — 단위를 타입으로 구분하는 표준 문서 사례입니다. `std::marker::PhantomData`로 단위를 타입 매개변수에 싣는 방법도 있습니다(판단).
  - 표준 라이브러리의 10진 소수 타입은 이 조회에서 찾지 못했습니다(확인 안 함).

### 실제 사례

- JSR 385 "Units of Measurement API 2.0": Final Release 2019-08-29, JSR 363의 후속입니다. 구현 프로젝트 사이트에 JSR 385 Maintenance Release 2 공개 소식이 있습니다.
- JSR 354 "Money and Currency API": Final Release 2015-05-13, 패키지 `javax.money`, "Provides an API for representing, transporting, and performing comprehensive calculations with Money and Currency".
- UCUM(The Unified Code for Units of Measure): Version 2.2, 2024-06-17, Regenstrief Institute & UCUM Organization.
- HL7 FHIR R5 Quantity 데이터 타입: `value`(decimal, "Numerical value (with implicit precision)"), `comparator`(< | <= | >= | > | ad), `unit`, `system`, `code`. 규칙 qty-3 "If a code for the unit is present, the system SHALL also be present". UCUM으로 코드화할 수 있으면 UCUM 코드를 SHOULD로 권고합니다.
- TigerBeetle: 계정 debits/credits와 이체 금액이 부호 없는 128비트 정수입니다. "map the smallest useful unit of the fractional currency to 1", USD 센트는 asset scale 2입니다.
- Joda-Money: "The JDK provides a standard currency class, but not a standard representation of money. Joda-Money fills this gap".

### 기존 가이드 승계분

- 최소 조건 취지: ① 값과 단위의 결합 ② 단위 인지 연산(호환 안 되는 연산 거부 또는 명시 변환) ③ 불변 값 객체로서의 동등성. 오해 지점으로 단위를 문자열로만 들고 검사하지 않기, double 금액, 가변 Quantity를 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Chapter 3 / Fowler PoEAA Money / JSR-385(javax.measure), Joda-Money
- 주의: 구 가이드 예시 2의 JSR-385 코드(`Quantity<Mass> bag = javax.measure.quantity.... ;`, `bag.to(GRAM.getUnit())`)는 자리표시가 섞인 형태라 그대로 컴파일되지 않습니다. 승계 대상이 아닙니다(판단).

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §3.1 Quantity, §3.2 Conversion Ratio, §3.3 Compound Units · 조회 2026-09-17
- [Analysis Patterns (Google Books)](https://books.google.com/books/about/Analysis_Patterns.html?id=4V8pZmpwmBYC) — Chapter 3 시작 35쪽 · 조회 2026-09-17
- [UML Diagrams for Chapter 3 (apchap3.pdf)](https://martinfowler.com/apsupp/apchap3.pdf) — Figure 3.1–3.5 구조와 제약 · 조회 2026-09-17
- [Analysis Patterns 튜토리얼 슬라이드 (Fowler, JAOO 1999)](http://jaoo.dk/jaoo1999/schedule/MartinFowlerAnalysisPatterns.pdf) — Quantity 연산 목록, "Money is a kind of quantity" · 조회 2026-09-17
- [Money (PoEAA)](https://martinfowler.com/eaaCatalog/money.html) — 통화·반올림 문제, 18장 안내 · 조회 2026-09-17
- [Value Object (Fowler bliki, 2016-11-14)](https://martinfowler.com/bliki/ValueObject.html) — primitive를 VO로 바꾸는 이점, aliasing bug, JavaScript 동등성 문제, money·range가 VO 예 · 조회 2026-09-17
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Value Objects(12쪽) · 조회 2026-09-17
- [JEP 395: Records](https://openjdk.org/jeps/395) — 컴포넌트 기반 equals · 조회 2026-09-17
- [BigDecimal (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html) — equals의 scale 비교, compareTo, divide의 ArithmeticException · 조회 2026-09-17
- [Currency (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Currency.html) — ISO 4217, getDefaultFractionDigits · 조회 2026-09-17
- [MDN: Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) — IEEE 754 배정밀도, 안전 정수 범위 · 조회 2026-09-17
- [MDN: BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) — Number와 혼합 연산 불가, JSON.stringify TypeError · 조회 2026-09-17
- [TypeScript Handbook: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) — readonly는 런타임 무효 · 조회 2026-09-17
- [MDN: Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) — freeze is shallow · 조회 2026-09-17
- [Rust std::cmp::Eq](https://doc.rust-lang.org/std/cmp/trait.Eq.html) — f32/f64는 PartialEq만 구현 · 조회 2026-09-17
- [Rust Reference: Operator expressions](https://doc.rust-lang.org/reference/expressions/operator-expr.html) — debug 빌드 정수 오버플로 panic · 조회 2026-09-17
- [Rust std: i64](https://doc.rust-lang.org/std/primitive.i64.html) — `checked_add` → `Option<i64>` · 조회 2026-09-17
- [The Rust Programming Language: Advanced Traits](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html) — Millimeters/Meters newtype과 Add 구현 · 조회 2026-09-17
- [Rust std::marker::PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html) — 표준 타입 존재 확인 · 조회 2026-09-17
- [JSR 385](https://jcp.org/en/jsr/detail?id=385) — Final Release 2019-08-29, JSR 363 후속 · 조회 2026-09-17
- [Units of Measurement 프로젝트](https://unitsofmeasurement.github.io/) — JSR 385 Maintenance Release 2 공개 · 조회 2026-09-17
- [JSR 354](https://jcp.org/en/jsr/detail?id=354) — Final Release 2015-05-13, javax.money, JDK 지원 부족 서술 · 조회 2026-09-17
- [UCUM](https://ucum.org/ucum) — Version 2.2, 2024-06-17 · 조회 2026-09-17
- [HL7 FHIR R5 Data Types](https://hl7.org/fhir/R5/datatypes.html) — Quantity 요소, qty-3, UCUM 권고 · 조회 2026-09-17
- [TigerBeetle: Data Modeling](https://docs.tigerbeetle.com/coding/data-modeling/) — u128 정수 금액, asset scale · 조회 2026-09-17
- [Joda-Money](https://www.joda.org/joda-money/) — JDK에 금액 표현 없음, 값 타입 제공 · 조회 2026-09-17

### 미해결 질문

1. 원서 §3.1 「Quantity」의 쪽 — 확인 안 함.
2. 원서가 단위 불일치 연산을 어떻게 처리하라고 하는지(예외인지 자동 변환인지) — 확인 안 함.
3. Figure 3.4에서 Unit Reference와 Atomic Unit 사이 다중도 — 판독이라 원도 대조 필요.
4. "Primitive Obsession"이라는 용어의 1차 출처(『Refactoring』) — 확인 안 함.
5. Money를 Quantity 하위 타입으로 둘지(JAOO "a kind of quantity"), 별도 VO로 둘지 — 가이드 결정 사항.
6. Rust 표준 라이브러리에 10진 소수 타입이 없다는 점 — 확인 안 함.

---

## Range (범위)

> **집필 결과 되먹임 (2026-09-29, v1.0.0 · 게이트 2R PASS)**
> - **★ 끝점 타입의 결정적 사실이 「최소 조건 후보」 쪽에 없다.** 「모델 불변식」에는 「Age Band의 경계는 시간 단위 Quantity입니다(Figure 4.20 제약)」로 정확히 적혀 있는데, **그 제약이 Range 가 아니라 Age Band 쪽에 붙어 있다**는 사실이 후보 목록에서는 드러나지 않는다. v1.0.0 이 **`[필수]`(끝점은 크기 비교가 되는 값) / `[선택]`(끝점을 Quantity 로)** 을 가른 근거가 정확히 그 **위치 사실**이다
> - **★ 후보 「두 끝점(과 경계 규칙)이 한 객체다」는 두 조건이 붙어 있다** — 구간이 따로 선 값인가 / 각 끝의 포함 여부가 구간 쪽인가. **근거도 다르다**(Figure 4.19→4.20 교체 / Figure 4.20 의 두 boolean). Party 편에서 난 유형과 같다
> - **★ 후보 「불변이고 값으로 같음」은 `[선택]` 이 맞다** — **Figure 4.20 의 Range 연산 목록에 `=` 가 없다.** Quantity 의 Figure 3.2 에는 있어서 그 편은 `[필수]` 로 둘 수 있었다
> - **노트가 `[필수]` 로 두지 않은 「끝점에 크기 비교」를 `[필수]` 로 올렸다** — eaaDev How it Works 가 「비교 관계가 끝점 타입에 있어야 하고 값들을 줄 세울 기본 정렬 기준이 필요하다」로 **요건형**으로 적는다
> - **★ 「시작 ≤ 끝」을 `[필수]` 로 올리면 eaaDev 자신의 DateRange 예제(빈 구간 허용)가 탈락한다.** 미해결 3·4 는 여전히 확인 안 함이고 v1.0.0 은 둘 다 `[선택]` 으로 뒀다
> - **노트에 없어 새로 확인한 사실 셋** — ① eaaDev 「Range」의 절 구조(`Range` 제목 블록 / `How it Works` / `When to Use It` / `Example: Date Range (Java)`)와 **「single object」 문장이 제목 없는 도입부에 있다**(1R 의 귀속 오류가 이것이었다 — `curl` 로 받아 `<h2>` 경계로 잘라 확인) ② How it Works 의 요건형 문장 ③ **`std::ops::Range::contains` 가 `PartialOrd` 만 요구해 `Range<f64>` 가 합법이다**
> - **★ `apchap4.pdf` 는 WebFetch 로 못 읽는다(LZW 압축).** 내려받아 `pdftotext -layout` 로 풀면 Figure 4.19·4.20·4.22 의 속성·연산·제약 문자열이 그대로 나온다
> - **진단 원인 오진 하나** — 「순서가 없는 타입이면 컴파일이 막힌다」는 틀렸다. **`f64` 에는 순서가 있고, 없는 것은 NaN 때문에 성립하지 않는 전순서다.** 막는 것은 **비교 연산이 붙어 있지 않은 타입**이다


### 원전 대응

- 원서 위치: Chapter 4 「Observations for Corporate Finance」 §4.3 「Range」, §4.4 「Phenomenon with Range」(Pearson 목차 PDF). 쪽은 확인 안 함(Chapter 4 시작 57쪽). 그림은 Figure 4.19, 4.20, 4.22입니다(apchap4.pdf). JAOO 1999 슬라이드에 「Range」, 「Phenomenon with Range」 페이지가 있습니다. eaaDev 초안 「Range」(2004-03-07)는 "Base Patterns"로 분류돼 있습니다.
- 위치 정정: 구 가이드 참고 자료는 "Range 논의(Quantity/측정 맥락에서 등장)"라고 적었지만, 목차상 위치는 3장이 아니라 4장(기업 재무 관찰)입니다.
- 문제와 해법:
  - Figure 4.19: Age Band가 `upper`·`lower` 두 연관으로 Time Quantity(각 0..1)를 가집니다. 끝점을 두 필드로 둔 모델입니다.
  - Figure 4.20: `Range`(`upper: Magnitude`, `lower: Magnitude`, `isUpperInclusive: boolean`, `isLowerInclusive: boolean`, `includes()`, `overlaps()`, `abuts()`). Age Band `*` — `1` Range, 제약은 "range's bounds must be quantities with time units"입니다.
  - JAOO 슬라이드: 같은 속성·연산에 Magnitude(`=, <, =<, >, >=`), 예시 "Between 10 miles and 50 miles", "6m < x ≤ 15m".
  - eaaDev 초안:
    - "Ranges are usually handled by a pair of values and you check against them both. Range instead uses a single object to represent the range as a whole, and then provides the relevant operations to test to see if values fall in the range and to compare ranges."
    - 비교 연산이 있는 타입이면 무엇이든 끝점이 될 수 있습니다. 매개변수화 타입(Range<number>, Range<date>)이 자연스럽지만 이름은 Number Range, Date Range처럼 부르는 편을 선호한다고 적습니다.
    - 열린 범위는 null을 무제한으로 보거나, 양 극단을 Special Case로 둡니다. 어느 쪽이든 `Range.greaterThan(6)` 같은 생성 메서드 뒤에 숨깁니다.
    - 연속 타입(실수)은 경계 포함 여부를 boolean 표시로 둡니다("you don't want to be using a lower of 6.0000000000001").
    - 범위끼리의 비교로 overlaps, touches, includes를 둡니다. start + length 표현도 가능합니다.
    - "Range is a pattern I use all the time."
  - eaaDev DateRange 예제(날짜 정밀도, 이산):
    - `isEmpty()`는 `start.after(end)`이고 `EMPTY` 상수가 있습니다 — **start > end를 오류가 아니라 빈 범위로 표현합니다.**
    - `upTo(end)`는 (PAST, end), `startingOn(start)`는 (start, FUTURE)입니다.
    - `includes`는 양 끝 포함입니다(`!arg.before(start) && !arg.after(end)`).
    - 그 밖에 `equals`, `overlaps`, `includes(DateRange)`, `gap`, `compareTo`, `abuts`, `partitionedBy`, `combination`, `isContiguous`가 있습니다.
  - Phenomenon with Range(JAOO, Figure 4.22): Phenomenon(예: 정상 심박수)에 Range를 붙여 측정값을 분류합니다. JAOO의 할당 순서는 Measurement 생성 → `phenomenonIncluding(aMeasurement)` → 각 Phenomenon의 `includes(aMeasurement)` → `setPhenomenon(fastHeartRate)`입니다. 예시는 "Normal Heart Rate is 60–80 beats per minute"입니다.
- 등장 개념:
  - `Range` — 두 끝점과 경계 포함 규칙을 가진 구간 · 값
  - `Magnitude` — 비교 연산을 가진 끝점 타입 · 값
  - `upper` / `lower`, `isUpperInclusive` / `isLowerInclusive` — 끝점과 경계 포함 표시 · 값
  - `includes` / `overlaps` / `abuts` — 포함·겹침·맞닿음 판정 · 행위
  - `empty range`, `open-ended range`, `gap`, `partitionedBy` — eaaDev 확장 · 값/행위
  - `Age Band` — 나이대(Figure 4.19/4.20) · 층위 확인 안 함
  - `Phenomenon`, `Phenomenon Type` — Range로 분류되는 관찰 범주와 그 종류 · 지식 층위(Figure 3.10 구분선 기준)
- 관계:
  - Age Band `*` — `1` Range (Figure 4.20)
  - Phenomenon — Range: 연관(판독상 Range 쪽 0..1). Phenomenon `*` — `1` Phenomenon Type (Figure 4.22)
- 모델 불변식:
  - 경계 포함 규칙이 객체에 들어 있습니다(Figure 4.20 속성).
  - Age Band의 경계는 시간 단위 Quantity입니다(Figure 4.20 제약).
  - Phenomenon with Range 두 제약: "the business phenomena's ranges should not overlap", "the business phenomena's ranges should cover all possible values for the phenomenon type"(Figure 4.22). JAOO는 앞의 것만 적습니다.
  - 빈 범위: eaaDev는 start > end를 빈 범위로 허용합니다. 원서의 규칙은 확인 안 함.

### 최소 조건 후보

- [필수] 두 끝점(과 경계 규칙)이 한 객체다 — 빠지면: Figure 4.19처럼 upper/lower 두 필드가 되고, 호출부마다 비교식을 반복합니다.
- [필수] 포함 판정(`includes`)을 객체가 제공한다 — 빠지면: `x >= lower && x < upper`가 여기저기 흩어집니다. eaaDev: "The key method to provide in any use of Range is the includes method."
- [필수] 경계 포함·제외 규칙이 명시되고 고정돼 있다 — 빠지면: 같은 [10, 20]을 어떤 코드는 20 포함으로, 어떤 코드는 제외로 해석합니다. 연속 타입이면 포함 표시가 필수입니다(eaaDev).
- [필수] 불변이고 값으로 같음을 판정한다 — 빠지면: 공유된 기간 객체의 끝을 바꾸자 다른 계약 기간까지 바뀝니다(ValueObject bliki의 aliasing 일반론).
- [선택] 범위 비교(`overlaps`, `abuts`, `includes(range)`, `gap`, `partitionedBy`)
- [선택] 열린 범위(`upTo`, `startingOn`, Special Case)
- [선택] 빈 범위 표현 규칙 — eaaDev는 start > end를 빈 범위로 허용하고, 구 가이드는 "시작 ≤ 끝"을 생성 불변식으로 둡니다. 가이드는 둘 중 하나를 명시해야 합니다.
- [선택] start + length 표현

### 사용 단서

- 이런 요구가 보이면: "유효 기간", "정상 범위 60–80", "나이대별 요율", "요금 구간", "예약 시간이 겹치면 안 된다", "기간들이 1년을 빈틈 없이 나눠야 한다".
- 쓰지 말아야 할 때: 끝점 타입에 순서가 없을 때(eaaDev는 비교 연산을 전제). 임계값 하나와 비교가 한 곳뿐이면 과합니다(판단).

### 비교 대상

- vs 시작/끝 필드 쌍(Figure 4.19 vs 4.20): 구간 연산과 경계 규칙이 객체 안에 있는가가 기준입니다. eaaDev: "When modeling it's more explicit to use ranges than to use pairs - and just as intuitive."
- vs Quantity + 비교자: FHIR Range 문서는 "the Range type should not be used to represent out of range measurements: A quantity type with the comparator element should be used instead"라고 적습니다. 값 하나가 "> 10"인 것은 범위가 아니라 비교자를 붙인 Quantity입니다.
- vs Time Period(Figure 3.11): 시간 전용 구간(start·end Timepoint)입니다. Range는 비교 가능한 모든 타입의 일반형입니다.
- vs Phenomenon with Range: Range를 써서 측정값을 범주로 분류하는 지식 층위 구조입니다.
- vs 언어 내장 range(Rust `std::ops::Range`): 반열림으로 고정돼 있고, 문서에서 확인한 연산은 `contains`와 빈 범위 규칙뿐입니다. 겹침·맞닿음 같은 구간 비교는 이 조회에서 확인 안 함.

### DDD 매핑 후보 (상황 설정 표의 재료)

- 배정: VO로 확정입니다(Evans Value Objects, Fowler bliki "points, monies, or ranges"). **공회전 판단**: Range 단독으로는 root·참조 칸이 빕니다(Quantity와 같은 이유).
- 경계 선택지는 **범위들의 컬렉션 불변식**에서 생깁니다. 비중첩·전 구간 덮음(Phenomenon with Range), 유효 기간 비중첩(Accountability Time Period, Posting Rule effectivity), 예약 겹침 금지가 그 예입니다.
  - 선택지 A — 범위 목록을 소유하는 root가 불변식을 강제합니다. 예: Phenomenon Type이 자기 Phenomenon과 Range 목록을 소유.
    - 전제: 목록이 작고 함께 편집됩니다.
    - 장점: 트랜잭션 안에서 보장됩니다. 단점: 목록이 크면 큰 aggregate가 됩니다(Vernon "Design Small Aggregates").
  - 선택지 B — 범위를 가진 항목(예약 1건 등)마다 별도 aggregate로 두고, 비중첩은 저장소 제약이나 등록 서비스·사후 탐지로 지킵니다.
    - 전제: 항목이 많고 동시 생성이 잦습니다.
    - 장점: 작은 aggregate. 단점: 도메인 불변식이 DB 제약에 가 있어 도메인 코드에 드러나지 않습니다(판단). PostgreSQL `EXCLUDE USING GIST (during WITH &&)`가 이 방식의 사례입니다.
- 불변식의 위치: 단일 Range 규칙(경계 규칙, 빈 범위 처리)은 VO 생성자. 컬렉션 규칙은 선택지 A의 root나 선택지 B의 저장소 제약.
- BC: 공용 값 타입(판단).

### 세 언어 구현 쟁점

- Java:
  - Java SE 표준 라이브러리의 범용 Range 타입은 이 조회에서 찾지 못했습니다(확인 안 함). `record DateRange(LocalDate start, LocalDate end)`에 compact constructor로 규칙을 넣습니다(JEP 395). java.time 클래스는 불변입니다(패키지 문서).
  - 열린 끝은 null 대신 명시 팩토리(`upTo`, `startingOn`)로 표현합니다(eaaDev).
  - 시간 구간은 반열림 [start, end)가 흔합니다 — ThreeTen-Extra `Interval`은 "start inclusive and the end exclusive"입니다. 반면 FHIR Period는 양 끝 포함입니다. 경계 규칙을 타입 이름이나 문서로 고정해야 합니다.
- TypeScript:
  - 표준 Range 타입은 확인 안 함.
  - `Date`는 setter가 있어 가변입니다(MDN). 끝점을 복사해 두거나 epoch 숫자·ISO 문자열로 둡니다.
  - Temporal은 TC39 finished proposals 목록에 올라 있고 예상 발행 연도는 2027입니다. TypeScript lib와 런타임별 지원 범위는 확인 안 함.
  - `number` 끝점은 부동소수라 연속 구간이면 포함·제외 표시가 필요합니다(eaaDev의 6.0000000000001 논지).
- Rust:
  - `std::ops::Range`(`start..end`)는 "contains all values with start <= x < end", "It is empty if start >= end"이고 `contains`를 제공합니다. 양 끝 포함은 `RangeInclusive`(`..=`)로 별도 타입입니다.
  - 표준 라이브러리에 달력 날짜 타입이 없어(std::time) 날짜 구간은 정수 일 수나 외부 크레이트가 필요합니다.

### 실제 사례

- PostgreSQL Range Types:
  - 내장 타입 int4range, int8range, numrange, tsrange, tstzrange, daterange(각각 multirange 짝이 있음)
  - 경계 표기: 포함 `[` `]`, 제외 `(` `)`. 하한을 생략하면 무제한. infinity 값 사용 가능
  - 이산 타입 int4range, int8range, daterange의 정규형은 `[)`
  - 겹침 금지는 UNIQUE 대신 exclusion constraint(`EXCLUDE USING GIST (during WITH &&)`)
- HL7 FHIR R5:
  - Range: low/high(SimpleQuantity), "The low and the high values are inclusive and are assumed to have arbitrarily high precision", 규칙 rng-2(low ≤ high)
  - Period: start "Starting time with inclusive boundary", end "End time with inclusive boundary, if not ongoing", 규칙 per-1(start ≤ end)
  - Observation.referenceRange: low/high/age(Range)
- Google Guava `Range`: 각 끝이 bounded/unbounded, bounded면 open(끝점 미포함) 또는 closed(포함).
- ThreeTen-Extra `Interval`: "An immutable interval of time between two instants", start 포함·end 제외, end ≥ start.
- Rust `std::ops::Range`(위 참고).

### 기존 가이드 승계분

- 최소 조건 취지: ① 두 끝점의 단일 객체화 ② 구간 연산 제공(최소 `includes`, `overlaps`) ③ 생성 시 "시작 ≤ 끝" 검증과 불변성. 오해 지점으로 경계 포함 규칙 미명시, 연산을 외부 유틸로 두기, 열린 구간을 null로 때우기를 들었습니다.
- 참고 자료(기존 목록): Fowler 1997(Quantity/측정 맥락의 Range 논의 — 실제 위치는 §4.3) / martinfowler.com/books/ap.html / Google Guava `Range`, ThreeTen-Extra `Interval`

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §4.3 Range, §4.4 Phenomenon with Range · 조회 2026-09-17
- [Analysis Patterns (Google Books)](https://books.google.com/books/about/Analysis_Patterns.html?id=4V8pZmpwmBYC) — Chapter 4 시작 57쪽 · 조회 2026-09-17
- [UML Diagrams for Chapter 4 (apchap4.pdf)](https://martinfowler.com/apsupp/apchap4.pdf) — Figure 4.19, 4.20, 4.22 속성·제약 · 조회 2026-09-17
- [Analysis Patterns 튜토리얼 슬라이드 (Fowler, JAOO 1999)](http://jaoo.dk/jaoo1999/schedule/MartinFowlerAnalysisPatterns.pdf) — Range, Phenomenon with Range, 할당 순서 · 조회 2026-09-17
- [Range (eaaDev, 2004-03-07)](https://martinfowler.com/eaaDev/Range.html) — 서술, 열린 범위, 연속 타입, DateRange 예제 · 조회 2026-09-17
- [Value Object (Fowler bliki)](https://martinfowler.com/bliki/ValueObject.html) — range가 VO 예 · 조회 2026-09-17
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Value Objects(12쪽) · 조회 2026-09-17
- [Effective Aggregate Design Part I (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf) — Design Small Aggregates · 조회 2026-09-17
- [PostgreSQL: Range Types](https://www.postgresql.org/docs/current/rangetypes.html) — 내장 타입, 경계 표기, 정규형 `[)`, exclusion constraint · 조회 2026-09-17
- [HL7 FHIR R5 Data Types](https://hl7.org/fhir/R5/datatypes.html) — Range(inclusive, rng-2, 범위 밖 측정 비권고), Period(inclusive, per-1) · 조회 2026-09-17
- [HL7 FHIR R5 Observation](https://hl7.org/fhir/R5/observation.html) — referenceRange low/high/age · 조회 2026-09-17
- [Guava Range](https://guava.dev/releases/snapshot-jre/api/docs/com/google/common/collect/Range.html) — bounded/unbounded, open/closed · 조회 2026-09-17
- [ThreeTen-Extra Interval](https://www.threeten.org/threeten-extra/apidocs/org.threeten.extra/org/threeten/extra/Interval.html) — 불변, start 포함·end 제외 · 조회 2026-09-17
- [Rust std::ops::Range](https://doc.rust-lang.org/std/ops/struct.Range.html) — 반열림, contains, 빈 범위 규칙 · 조회 2026-09-17
- [JEP 395: Records](https://openjdk.org/jeps/395) — compact constructor 포함 record 선언 · 조회 2026-09-17
- [java.time 패키지 문서 (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html) — 불변 날짜·시간 클래스 · 조회 2026-09-17
- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) — setter 존재, legacy 표기 · 조회 2026-09-17
- [TC39 Finished Proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) — Temporal, 예상 발행 연도 2027 · 조회 2026-09-17
- [Rust std::time](https://doc.rust-lang.org/std/time/index.html) — 달력 날짜 없음 · 조회 2026-09-17

### 미해결 질문

1. 원서 §4.3 「Range」의 쪽 — 확인 안 함.
2. Figure 4.22에서 Phenomenon–Range 다중도 — 판독이라 원도 대조 필요.
3. 원서가 start > end(역전 범위)를 빈 범위로 보는지 오류로 보는지 — 확인 안 함(eaaDev는 빈 범위).
4. 가이드의 기본 경계 규칙: 양 끝 포함(FHIR Period, eaaDev DateRange.includes)인지 반열림(PostgreSQL 이산 정규형, ThreeTen Interval, Rust Range)인지 — 기준선 또는 가이드 결정 사항.
5. Temporal의 TypeScript lib·런타임 지원 현황 — 확인 안 함.
6. Age Band의 분석 층위(지식인지 운영인지) — 확인 안 함.

---

## Measurement (측정)

> **집필 결과 되먹임 (2026-09-29, v1.0.0 · 게이트 2R PASS)**
> - **★ 조건 「더하거나 비교하거나」는 OR 로 유지한다.** **섭씨는 간격 척도라 덧셈이 뜻이 없어서**(36.5 + 36.5 ≠ 73 °C), AND 로 좁히면 **발행된 Quantity 편 selfcheck 2 가 인정한 36.5 °C 기록이 탈락한다**
> - **★ 정정: 그림 3.1·3.2 는 §3.1 Quantity 소속이다**(§3.4 아님). v1.0.0 의 1R 미흡이 이것이었고, **같은 글 안에서 조건 3·참고 자료·도식 소스는 §3.1 로 옳게 적고 조건 하나만 혼자 틀렸다.** 관측·측정 계열 후속 편(Observation·Range)이 **같은 전후 대조를 인용할 때 되풀이될 오류다**
> - **★ 그림 4.11 의 Status Type 하위 타입은 Actual·Planned 둘뿐이다.** 「관측도 계획도 아닌 값」(설정값·규정치)은 **원전에 자리가 없다** — v1.0.0 이 도식으로 만들었다가 지운 자리다. 조건을 새로 지어 배제하면 발행된 Quantity 편과 충돌할 위험이 있다
> - **원전 그림 일곱 장을 `pdftotext -layout` 으로 읽어 확인했다**(3.1·3.2·3.6·3.7·3.11·3.12·4.11). 「판독」 표시 중 **그림 3.11 의 두 연관 이름(recording time · applicability)** · **그림 3.12 의 «dynamic» 표기** · **그림 4.11 의 Status Type → Actual/Planned + Planned → Plan** 은 **확인 완료**로 올릴 수 있다. **그림 3.2 가 Quantity 칸에 `+ - * / = > <` 를 적어 둔다는 사실은 노트에 없는데** 「더하거나 비교하거나」 조건을 받치는 근거다
> - **`[필수]` 근거가 대부분 모델 그림이라 조건마다 「그림이 무엇을 선언한 것인가」를 자격으로 적었다** — 모델의 **전후 대조**(§3.1 → §3.4 에서 속성이 연관으로 바뀐다) · **구조 선언** · **속성 타입 선언** · **다중도 선언**. 그림이 근거인 패턴에 쓸 수 있는 분류다
> - **미해결 2(명칭 정리) 처분** — Measurement 의 대등한 비교 짝을 **「범주형 관측(Category Observation)」** 으로 쓰고 Observation 은 **상위 개념**으로 다뤘다. Observation 편이 상위 타입 중심으로 쓰이면 그대로 맞물린다
> - **미해결 3(Phenomenon Type 의 허용 단위 제약)** — **그림 3.6 에 그 제약이 없음을 확인**했다. 「원서 확인 안 함」 → 「그림에는 없음(원서 본문은 확인 안 함)」으로 조일 수 있다
> - **미해결 6(OGC/ISO 계보)** · **EAV 1차 출처** · **LOINC 코드(8480-6)** 는 확인 못 해 단정하지 않았다
> - **FHIR Observation 의 `referenceRange`(low/high SimpleQuantity, age Range)를 일부러 안 실었다** — Range 편 판본이 움직이는 중이었다. **Range 편이 굳었으니 두 편이 이 요소를 어느 쪽에서 다룰지 정할 자리다**


### 원전 대응

- 원서 위치: Chapter 3 「Observations and Measurements」 §3.4 「Measurement」(Pearson 목차 PDF). 관련 절은 §3.1 Quantity, §3.5 Observation, §3.7 Protocol, §3.8 Dual Time Record, §3.9 Rejected Observation, 그리고 Chapter 4 §4.2 Measurement Protocol입니다. 쪽은 확인 안 함(Chapter 3 시작 35쪽). Wikipedia(보조 출처)는 OGC/ISO O&M 모델의 기원으로 Fowler 1997 pp. 35–55를 인용합니다.
- **타입 계층 주의(원서 기준)**: Figure 3.7과 3.9에서 **Observation은 상위 타입**이고 **Measurement와 Category Observation이 그 하위 타입**입니다. 원서에서 Measurement는 Observation의 한 종류이고, Measurement와 짝으로 대비되는 것은 Observation이 아니라 **Category Observation**입니다. 구 가이드(observation-pattern.md)는 원서의 Category Observation을 "Observation"이라고 부르므로, 새 가이드에서 명칭을 정리해야 합니다.
- 문제와 해법:
  - 문제(JAOO): Person에 Quantity 속성을 계속 붙이는 모델(Figure 3.2)에 대해 "What if there are tens or hundreds of attributes?"라고 묻습니다.
  - 해법(JAOO): "For each attribute of person, define an instance of phenomenon type", "To record a value for a person create a measurement". 조회는 `Person.amountOf(PhenomenonType): Quantity`입니다.
  - Figure 3.6: Phenomenon Type `1` — `*` Measurement(`quantity: Quantity`), Person `1` — `*` Measurement, 지식/운영 구분선.
  - Chapter 4 확장(Figure 4.7, 4.8): Measurement Protocol(Source / Calculated), Calculated Measurement(sources `*`), Calculated Measurement Protocol(input types `{list}` `1..*` Phenomenon Type, result type, formula Method). JAOO 예시는 "Revenue = Income - Costs", "Body Mass Index = weight / height2"입니다.
- 등장 개념:
  - `Measurement` — 대상에 대한 정량 사실(Observation의 하위 타입) · 운영 층위
  - `Phenomenon Type` — 무엇을 쟀는가(키, 몸무게, 매출) · 지식 층위
  - `Quantity` — 측정값 · 값
  - `Person` → `Object of Care` — 관찰 대상. Figure 4.1에서 Object of Care로 일반화되고 Patient, Population, Enterprise Segment가 함께 보입니다(판독) · 운영 층위
  - `Protocol` — 측정 방법(Figure 3.10, Observation `*` — `0..1` Protocol, 판독) · 지식 층위
  - `Measurement Protocol` / `Source Measurement Protocol` / `Calculated Measurement Protocol` — 원천 읽기와 계산 정의(Figure 4.7, 4.8) · 지식 층위
  - `Calculated Measurement` — 계산으로 얻은 측정(sources) · 운영 층위
  - `Time Record` / `Timepoint` / `Time Period` — Dual Time Record의 기록 시각(recording time)과 적용 시각(applicability)(Figure 3.11) · 값
- 관계:
  - Measurement `*` — `1` Phenomenon Type, Measurement `*` — `1` Person(Figure 3.6)
  - Measurement → Observation(일반화, Figure 3.7)
  - Observation `*` — `1` Object of Care(Figure 4.1, 4.7)
  - Calculated Measurement — sources `*` Measurement(Figure 4.7, 판독)
  - Figure 4.7에 "/derived via measurement protocol" 파생 표기가 있습니다. 무엇이 파생인지는 판독 불가
- 모델 불변식:
  - 측정 1건 = 대상 1 · Phenomenon Type 1 · Quantity 1(다중도)
  - Figure 4.7 제약: "all measurements' protocols are measurement protocols and vice-versa", "all calculated measurements' protocols are calculated measurement protocols and vice-versa"
  - Figure 4.10 Comparative Calculation 제약: "input types have cardinality (2,2); both inputs are the same phenomenon type"
  - Phenomenon Type이 허용 단위(차원)를 제약한다는 규칙은 원서에서 확인 안 함 — 가이드가 쓰려면 원전 명시가 아님을 밝혀야 합니다.

### 최소 조건 후보

- [필수] 측정값이 대상의 고정 속성이 아니라 대상·항목·값을 묶은 독립 사실 객체다 — 빠지면: `Person.height`·`Person.weight` 필드가 되어 항목이 늘 때마다 스키마를 바꿉니다(Figure 3.1/3.2).
- [필수] "무엇을 쟀는가"가 지식 층위 데이터(Phenomenon Type)다 — 빠지면: `enum MeasurementKind { HEIGHT, WEIGHT }`에 새 검사 항목마다 배포가 필요합니다.
- [필수] 값이 Quantity다 — 빠지면: `value: double`만 남아 mmHg와 kPa가 섞입니다.
- [선택] 기록 시각과 적용 시각 분리(Dual Time Record)
- [선택] Protocol(측정 방법)
- [선택] 삭제 대신 거부 기록(Rejected Observation)
- [선택] 계산 측정(Calculated Measurement Protocol)
- [선택] 공통 상위 Observation 아래 두기(Category Observation과 통합)

### 사용 단서

- 이런 요구가 보이면: "검사 항목이 수백 개이고 계속 늘어난다", "같은 항목을 다른 방법으로 잰다", "잘못 기록된 측정을 지우지 않고 거부로 남긴다", "BMI·매출처럼 다른 측정에서 계산되는 지표".
- 쓰지 말아야 할 때: 속성이 몇 개로 고정되고 이력도 필요 없을 때는 필드가 낫습니다(판단 — JAOO는 "When should we use this model?"이라고 질문만 던지며, 원서의 답은 확인 안 함).

### 비교 대상

- vs Quantity 타입 속성(Figure 3.2): 구분 기준은 항목 수와 가변성입니다.
- vs Observation: 원서에서는 is-a 관계입니다(Measurement ⊂ Observation). 짝으로 비교할 대상은 **Category Observation**이고, 기준은 값이 Quantity인가 범주(Phenomenon)인가입니다.
- vs EAV(Entity–Attribute–Value) 테이블: 구조는 닮았지만 Measurement는 attribute를 규칙을 담을 수 있는 지식 층위 객체(Phenomenon Type)로, value를 Quantity로 둡니다(판단 — EAV 1차 출처는 확인 안 함).
- vs Account/Entry: 둘 다 값의 기록 이력이지만, Entry는 합산해 잔액을 만들고 Measurement는 건마다 독립 사실이라 합산 의미가 없습니다(판단).

### DDD 매핑 후보 (상황 설정 표의 재료)

- 기본 배정: Measurement는 **불변 Entity** 후보입니다. 같은 대상·항목·값의 측정 두 건도 다른 사건이고, 거부·증거(evidence) 연결 때 id로 지목되기 때문입니다(판단). Phenomenon Type은 지식 층위 aggregate(참조 데이터), Quantity는 VO입니다.
- BC 한 줄 후보(판단): "임상 기록 / 지표 관리 — 대상에 대한 측정 사실을 항목 정의에 따라 기록한다."
- 선택지 A — Measurement를 불변 독립 aggregate로 둡니다. `SubjectId`, `PhenomenonTypeId`(또는 버전)로 참조합니다.
  - 전제: 측정이 대량으로 쌓이고, 개별 거부나 증거 참조가 필요합니다.
  - 장점: 작고, 동시 기록 경합이 없습니다.
  - 단점: "한 대상·한 항목·한 시점에 유효 측정은 1건" 같은 집합 규칙은 경계 밖입니다.
- 선택지 B — 대상(Subject) aggregate가 Measurement 컬렉션을 가집니다.
  - 평가(판단): Account가 Entry를 가지는 구조와 같습니다. consideration 「Account와 Entry의 관계 설계」가 시나리오 1을 지양한 논거(무한 증가, 전체 로드, 락 경합)가 그대로 적용됩니다. "현재 체중" 같은 요약만 필요하면 파생 값만 가지는 하이브리드가 대안입니다.
- 선택지 C — 측정 묶음(검사 패널·측정 세션) aggregate가 여러 Measurement를 child로 가집니다.
  - 전제: 묶음 단위로 확정·거부하는 불변식이 있습니다. FHIR `hasMember`가 묶음 표현 사례입니다.
  - 장점: 묶음 불변식을 root가 지킵니다. 단점: 한 측정이 여러 묶음에 속하면 안 맞습니다.
- 선택지 D — 식별이 필요 없는 센서 시계열이면 Measurement를 VO(시점 + 값)로 두고 시계열 저장소에 쌓습니다(판단).
- 계산 측정: Calculated Measurement의 sources는 Measurement id 목록(VO)입니다. 원천이 거부되면 계산값 재평가는 결과적 일관성으로 처리합니다(판단).

### 세 언어 구현 쟁점

- 두 시각(Dual Time Record): Java는 `Instant`(기록 시각)와 `LocalDate`·`OffsetDateTime`(적용 시각)을 구분합니다(java.time 패키지 문서 — Instant는 "essentially a numeric timestamp", LocalDate는 "a date without a time"). TypeScript `Date`는 가변·legacy(MDN)입니다. Rust std에는 달력 없이 `SystemTime`만 있습니다.
- 정밀도: FHIR Quantity의 value는 "Numerical value (with implicit precision)"라 유효숫자에 의미가 있습니다. Java `BigDecimal`은 scale을 보존합니다(equals가 scale까지 비교하는 성질이 여기서는 정밀도 정보를 보존하는 쪽으로 작용 — 판단). TypeScript `number`와 Rust `f64`는 IEEE 754 배정밀도라 1.50과 1.5를 구분하지 못합니다(판단 — MDN Number 근거).
- 하위 타입 표현: Observation 노트 참고.

### 실제 사례

- HL7 FHIR R5 Observation(Normative, v4.0.0부터):
  - `code` 1..1 CodeableConcept — 항목(지식)
  - `subject` 0..1 Reference(Patient | Group | Device | Location | Organization | …)
  - `effective[x]` dateTime | Period | Timing | instant
  - `value[x]`에 `valueQuantity`
  - `referenceRange`(low/high SimpleQuantity, age Range)
  - `hasMember`, `derivedFrom`
- OGC Abstract Specification Topic 20 "Observations, measurements and samples"(OGC 20-082r4, ISO 19156:2023과 공동): 관찰과 표본에 대한 개념 스키마 표준입니다. Fowler 계보는 Wikipedia(보조 출처)에만 있습니다 — "derived from generic patterns proposed by Fowler and Odell". OGC 20-082r4 본문에서는 Fowler 언급을 찾지 못했습니다.
- UCUM: FHIR Quantity가 단위 코드로 권고합니다.

### 기존 가이드 승계분

- 최소 조건 취지: ① 측정의 객체화(대상·항목·값의 독립 객체) ② 측정 항목의 데이터화(Knowledge Level, PhenomenonType) ③ 값의 Quantity 표현. 오해 지점으로 항목을 enum/컬럼으로 두기, 단위 없는 숫자 저장, 정성 사실(범주형)을 Measurement에 욱여넣기를 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Chapter 3 / martinfowler.com/books/ap.html / HL7 FHIR `Observation` 리소스, LOINC 코드 체계
- 주의: 구 가이드 FHIR 예시의 LOINC 코드(8480-6 Systolic blood pressure)는 이 조회에서 확인 안 함.

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §3.4 Measurement, §3.5 Observation, §3.7–§3.9, §4.2 · 조회 2026-09-17
- [Analysis Patterns (Google Books)](https://books.google.com/books/about/Analysis_Patterns.html?id=4V8pZmpwmBYC) — Chapter 3 시작 35쪽 · 조회 2026-09-17
- [UML Diagrams for Chapter 3 (apchap3.pdf)](https://martinfowler.com/apsupp/apchap3.pdf) — Figure 3.6, 3.7(Observation 상위 타입), 3.9, 3.10, 3.11 · 조회 2026-09-17
- [UML Diagrams for Chapter 4 (apchap4.pdf)](https://martinfowler.com/apsupp/apchap4.pdf) — Figure 4.1, 4.7, 4.8, 4.10 · 조회 2026-09-17
- [Analysis Patterns 튜토리얼 슬라이드 (Fowler, JAOO 1999)](http://jaoo.dk/jaoo1999/schedule/MartinFowlerAnalysisPatterns.pdf) — Measurement 동기, amountOf, Calculated Measurement 예 · 조회 2026-09-17
- [HL7 FHIR R5 Observation](https://hl7.org/fhir/R5/observation.html) — 요소 목록, Normative 상태 · 조회 2026-09-17
- [HL7 FHIR R5 Data Types](https://hl7.org/fhir/R5/datatypes.html) — Quantity value의 implicit precision · 조회 2026-09-17
- [OGC Abstract Specification Topic 20 (20-082r4)](https://docs.ogc.org/as/20-082r4/20-082r4.html) — 표준 범위 · 조회 2026-09-17
- [Observations and Measurements (Wikipedia, 보조 출처)](https://en.wikipedia.org/wiki/Observations_and_Measurements) — Fowler & Odell 패턴 기원, Fowler 1997 pp. 35–55 인용 · 조회 2026-09-17
- [UCUM](https://ucum.org/ucum) — 단위 코드 표준 · 조회 2026-09-17
- [java.time 패키지 문서 (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html) — Instant, LocalDate 설명 · 조회 2026-09-17
- [MDN: Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) — 가변, legacy · 조회 2026-09-17
- [MDN: Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) — IEEE 754 배정밀도 · 조회 2026-09-17
- [Rust std::time](https://doc.rust-lang.org/std/time/index.html) — SystemTime, 달력 없음 · 조회 2026-09-17

### 미해결 질문

1. 원서 §3.4 「Measurement」의 쪽 — 확인 안 함.
2. **명칭 정리**: 원서는 Observation = 상위 타입, Measurement·Category Observation = 하위 타입입니다. 구 가이드는 Category Observation을 "Observation"이라 불렀습니다. Measurement 편의 비교 대상을 "Category Observation"으로 바꿀지, Observation 편을 상위 타입 중심으로 다시 쓸지 결정이 필요합니다.
3. Phenomenon Type이 허용 단위(차원)를 제약하는지 — 원서 확인 안 함.
4. Figure 4.7의 "/derived via measurement protocol"이 무엇의 파생인지 — 판독 불가.
5. JAOO의 "When should we use this model?"에 대한 원서의 답 — 확인 안 함.
6. ISO 19156/OGC 문서 본문이 Fowler를 기원으로 명시하는지 — 20-082r4에서 못 찾았고, 이전 판(OGC 10-004r3)은 로그인이 필요해 확인 안 함.
7. 구 가이드의 LOINC 코드 예시 — 확인 안 함.

---

## Observation (관찰)

### 원전 대응

- 원서 위치: Chapter 3 §3.5 「Observation」(Pearson 목차 PDF). 변형은 §3.6 Subtyping Observation Concepts, §3.7 Protocol, §3.8 Dual Time Record, §3.9 Rejected Observation, §3.10 Active Observation, Hypothesis, and Projection, §3.11 Associated Observation, §3.12 Process of Observation, 그리고 Chapter 4 §4.4 Phenomenon with Range입니다. 쪽은 확인 안 함. 그림은 Figure 3.7–3.14, 4.9, 4.11, 4.21, 4.22입니다(apchap3/4.pdf).
- **명칭 주의(원서 기준)**: Figure 3.7에서 Observation은 Person `1` — `*` Observation, Phenomenon Type `1` — `*` Observation 연관을 가진 **상위 타입**입니다. 하위 타입은 **Measurement**(`quantity: Quantity`)와 **Category Observation**(`*` — `1` Category)입니다. JAOO 슬라이드도 Observation 아래 Category Observation과 Measurement를 `{overlapping}`으로 둡니다. **구 가이드 observation-pattern.md는 원서의 Category Observation을 "Observation"(정성적 사실)이라고 부르므로 원서 용어와 어긋납니다.**
- 문제와 해법:
  - 문제: 정량 속성은 Measurement로 풀었지만, "혈액형 O", "남성" 같은 범주형 사실도 같은 구조로 기록해야 합니다(JAOO 예: "Martin Fowler is blood group O", "Martin Fowler is Male").
  - 해법: 대상과 Phenomenon Type을 가진 공통 상위 Observation을 두고, 값 종류에 따라 하위 타입을 나눕니다. 범주 조회는 `Person.valueOf(PhenomenonType): Phenomenon`입니다(JAOO).
  - Figure 3.9: Category Observation `*` — `1` Phenomenon, Phenomenon Type `1` — `*` Phenomenon, Measurement `*` — `1` Phenomenon Type.
  - Figure 3.8: Observation 사이 evidence `*` / assessment `*` 연관 — 관찰이 다른 관찰의 증거나 평가가 됩니다(판독).
  - Figure 3.10: Observation Concept(supertypes `{dag}`), Phenomenon Type `1` — `*` Phenomenon, Protocol `0..1`, Category Observation의 하위 타입 Absence·Presence(판독).
  - Figure 3.11(Dual Time Record): Observation에 recording time과 applicability 두 Time Record. Time Record의 하위 타입은 Timepoint와 Time Period(start `1`, end `1` Timepoint)입니다.
  - Figure 3.12: Rejected Observation(`«dynamic»` 표기), Observation과 `1` — `*` 연관(연관 이름 판독 불가).
  - Figure 3.13: Observation 하위 타입 Hypothesis, Projection, Active Observation. Figure 4.9·4.11에서 Projection은 Plan과 연관되고 Status Type은 Actual/Planned입니다(판독).
  - Figure 3.14(Associated Observation): 지식 층위에 Associative Function(arguments `1..*` Observation Concept, product `1` Observation Concept), 운영 층위에 Associated Observation(evidence `1..*` Observation).
  - Phenomenon with Range(Figure 4.22, JAOO): 측정값을 범위로 Phenomenon에 할당합니다(Range 노트 참고).
- 등장 개념:
  - `Observation` — 대상에 대한 사실의 상위 타입 · 운영 층위
  - `Measurement` — 정량 하위 타입 · 운영 층위
  - `Category Observation` — 범주 하위 타입 · 운영 층위
  - `Category` — Figure 3.7의 범주 값. 이후 그림에서는 Phenomenon/Observation Concept로 정교화됩니다(판독) · 지식 층위
  - `Phenomenon` — 범주 값(예: 혈액형 O) · 지식 층위
  - `Phenomenon Type` — 관찰 항목(예: 혈액형) · 지식 층위
  - `Observation Concept` — Phenomenon을 일반화한 개념, supertypes DAG · 지식 층위
  - `Absence` / `Presence` — "있음/없음"을 명시하는 Category Observation 하위 타입 · 운영 층위
  - `Protocol` — 관찰 방법 · 지식 층위
  - `Time Record` / `Timepoint` / `Time Period` — 기록 시각·적용 시각 · 값
  - `Rejected Observation` — 거부된 관찰(dynamic 하위 타입) · 운영 층위
  - `Hypothesis` / `Projection` / `Active Observation` — 관찰의 확정 정도·시제 · 운영 층위
  - `Associated Observation` / `Associative Function` — 증거 관찰에서 도출한 관찰과 그 규칙 · 운영 / 지식
- 관계: 위 「문제와 해법」의 그림별 연관을 따릅니다.
- 모델 불변식:
  - Observation Concept supertypes는 `{dag}`(순환 없음, Figure 3.10)
  - Associated Observation의 evidence는 `1..*`(근거 없는 연관 관찰 불가, Figure 3.14)
  - Phenomenon with Range: 같은 Phenomenon Type의 범위는 겹치지 않고 모든 값을 덮음(Figure 4.22)
  - Category Observation의 Phenomenon은 그 Observation의 Phenomenon Type에 속해야 한다 — 구조상 도출이며, 원서에 명시 제약이 있는지는 확인 안 함(판단)
  - 거부는 삭제가 아니라 dynamic 하위 타입 전환으로 표시(`«dynamic»` 표기에서 도출 — 판단)

### 최소 조건 후보

(원서대로 Observation을 상위 타입 패턴으로 볼 때의 후보입니다.)

- [필수] 대상에 대한 사실(정량·범주 모두)이 대상의 속성이 아니라 Observation 객체다 — 빠지면: `Person.bloodGroup` 문자열 필드가 됩니다.
- [필수] 관찰 항목이 지식 층위 데이터(Phenomenon Type)다 — 빠지면: 범주 항목마다 컬럼이 늘어납니다.
- [필수] 범주형 값이 통제된 지식 객체(Phenomenon/Observation Concept)다 — 빠지면: "A형", "a형", "Type A"가 섞인 자유 문자열이 됩니다.
- [필수] 정량(Measurement)과 범주(Category Observation)가 공통 상위(대상·항목·시간 구조)를 공유한다 — 빠지면: "이 환자의 모든 관찰" 조회가 서로 다른 두 모델을 합쳐야 합니다(구 가이드 조건 ③의 취지).
- [선택] Absence/Presence(“없음”의 명시 기록)
- [선택] Dual Time Record
- [선택] Rejected Observation
- [선택] Hypothesis / Projection / Active Observation
- [선택] Associated Observation(증거 기반 도출)
- [선택] Observation Concept 계층(DAG)
- [선택] Phenomenon with Range(측정값 → 범주 자동 분류)

### 사용 단서

- 이런 요구가 보이면: 소견·진단·등급·상태 같은 범주형 사실, "없음"도 사실로 남겨야 할 때, 진단과 그 근거 관찰을 연결해야 할 때, 가설과 확정 소견을 구분해야 할 때.
- 쓰지 말아야 할 때: 범주가 몇 개로 고정되고 이력·근거가 필요 없으면 enum 필드가 낫습니다(판단). 정량 값만 다루면 Measurement만으로 충분합니다.

### 비교 대상

- vs Measurement: 원서에서는 상위–하위 관계입니다. 대등하게 비교할 짝은 Measurement vs Category Observation이고, 기준은 값이 Quantity인가 Phenomenon(범주)인가입니다.
- vs 범주 문자열/enum 속성: 통제 어휘가 지식 층위 데이터로 관리되는가.
- vs Phenomenon with Range: 범주 값을 사람이 지정하는가, 측정값의 범위에서 도출하는가.
- vs Knowledge Level: Observation은 Knowledge Level을 관찰 도메인에 적용한 대표 사례입니다(Figure 3.6·3.10의 구분선 — 판단).

### DDD 매핑 후보 (상황 설정 표의 재료)

- 기본 배정: Observation(하위 타입 포함)은 **불변 Entity** 후보입니다. 거부·증거·연관 관찰이 id로 지목하기 때문입니다(판단). Phenomenon Type·Phenomenon·Observation Concept는 지식 층위입니다.
- BC 한 줄 후보(판단): "임상 기록 — 대상에 대한 관찰 사실. 코드 체계(지식)는 별도 BC 또는 외부 표준."
- 하위 타입 표현 선택지(설계 층위이지만 aggregate 표에 영향):
  - A — 상속 계층(Observation 추상 + Measurement / Category Observation): 원서 구조 그대로입니다.
  - B — 단일 Observation + 값 합타입(`value: Quantity | PhenomenonRef | …`): FHIR `value[x]` 방식입니다. 장점: 값 종류 추가가 타입 하나 추가로 끝납니다. 단점: 값 종류별 규칙이 분기로 흩어집니다(판단).
- 경계 선택지:
  - 선택지 A — Observation 하나하나를 aggregate로 두고, evidence·assessment는 `ObservationId` 목록(VO)으로 둡니다.
    - 전제: 한 근거가 여러 진단에 공유됩니다(원서 그림이 evidence `*` 다대다).
    - 장점: 작은 aggregate. 단점: 근거가 거부되면 연관 관찰 재평가를 도메인 이벤트로 결과적으로 처리해야 합니다(판단).
  - 선택지 B — 진단(Associated Observation)이 근거 Observation을 child로 소유합니다.
    - 전제: 근거가 그 진단 전용이고 공유되지 않습니다.
    - 장점: 진단과 근거를 한 번에 확정·거부합니다. 단점: 원서의 다대다 연관과 맞지 않아 공유가 없을 때만 성립합니다(판단).
  - Observation Concept 체계(DAG):
    - 체계 전체를 aggregate 하나로 두고 root가 순환 금지를 강제합니다 — 체계가 작을 때.
    - 개념별 aggregate + 순환 검사 서비스로 둡니다 — 체계가 클 때.
    - SNOMED CT 같은 외부 코드 체계를 쓰면 체계 무결성은 BC 밖으로 나갑니다(판단).

### 세 언어 구현 쟁점

- Java: `sealed interface Observation permits Measurement, CategoryObservation`(JEP 409). 구현을 record로 하면 Entity 동등성과 충돌하는 점은 Party 노트와 같습니다.
- TypeScript: discriminated union `{ kind: "measurement"; quantity: Quantity } | { kind: "category"; phenomenonId: PhenomenonId }`(Handbook Narrowing).
- Rust: `enum ObservationValue { Quantity(Quantity), Category(PhenomenonId) }`. Absence/Presence는 `bool`보다 enum이 뜻이 분명합니다(판단). DAG 순환 검사는 표준 컬렉션으로 구현합니다(판단).

### 실제 사례

- HL7 FHIR R5 Observation:
  - `value[x]` 선택형 — Quantity | CodeableConcept | string | boolean | integer | Range | Ratio | SampledData | time | dateTime | Period | Attachment | Reference(MolecularSequence). 정량·범주를 한 리소스의 합타입으로 둡니다.
  - `status` 1..1(registered | preliminary | final | amended +)
  - `interpretation` 0..*("High, low, normal, etc") — 범위 판정 결과를 담는 자리(Phenomenon with Range와 유사 — 판단)
  - `derivedFrom` 0..* Reference(… | Observation | …) — 근거 연결과 유사(판단)
  - `hasMember` 0..*
  - Scope: "Most observations are simple name/value pair assertions"
- OGC Topic 20 / ISO 19156:2023(Measurement 노트 참고).
- 구 가이드의 SNOMED CT(112144000 Blood group A)·LOINC(883-9 ABO group) 코드 예시: 확인 안 함.

### 기존 가이드 승계분

- 최소 조건 취지: ① 정성적 사실의 객체화 ② 현상의 분류 체계화(Knowledge Level: PhenomenonType과 Phenomenon) ③ 측정과의 통합 가능성(최소한 같은 subject·시점 구조 공유). 오해 지점으로 범주 값을 자유 문자열로 저장, 정량과 정성의 혼용, 현상 간 규칙을 코드로만 처리를 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Chapter 3 / martinfowler.com/books/ap.html / HL7 FHIR `Observation`(valueCodeableConcept), SNOMED CT
- 주의: 구 가이드는 이 편을 원서의 **Category Observation** 의미로 썼습니다. 원서의 Observation은 상위 타입입니다.

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §3.5–§3.12, §4.4 · 조회 2026-09-17
- [UML Diagrams for Chapter 3 (apchap3.pdf)](https://martinfowler.com/apsupp/apchap3.pdf) — Figure 3.7(Observation 상위, Measurement·Category Observation 하위), 3.8–3.14 · 조회 2026-09-17
- [UML Diagrams for Chapter 4 (apchap4.pdf)](https://martinfowler.com/apsupp/apchap4.pdf) — Figure 4.9, 4.11, 4.21, 4.22 · 조회 2026-09-17
- [Analysis Patterns 튜토리얼 슬라이드 (Fowler, JAOO 1999)](http://jaoo.dk/jaoo1999/schedule/MartinFowlerAnalysisPatterns.pdf) — Observation `{overlapping}` 하위 타입, valueOf, 혈액형 예 · 조회 2026-09-17
- [HL7 FHIR R5 Observation](https://hl7.org/fhir/R5/observation.html) — value[x] 선택형, status, interpretation, derivedFrom, hasMember, Scope and Usage · 조회 2026-09-17
- [OGC Abstract Specification Topic 20 (20-082r4)](https://docs.ogc.org/as/20-082r4/20-082r4.html) — 관찰 개념 스키마 표준 · 조회 2026-09-17
- [Observations and Measurements (Wikipedia, 보조 출처)](https://en.wikipedia.org/wiki/Observations_and_Measurements) — Fowler & Odell 기원 서술 · 조회 2026-09-17
- [JEP 409: Sealed Classes](https://openjdk.org/jeps/409) — Release 17 · 조회 2026-09-17
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — discriminated unions · 조회 2026-09-17

### 미해결 질문

1. 원서 §3.5 「Observation」의 쪽 — 확인 안 함.
2. **명칭 결정**: 새 가이드 Observation 편을 원서대로 "상위 타입 Observation(+ Category Observation)"으로 쓸지, 구 가이드처럼 범주형 관찰만 다룰지. 원서에서 Observation은 Measurement와 Category Observation을 묶는 상위 타입이고, 구 가이드는 Category Observation을 Observation이라 불렀습니다.
3. Figure 3.7의 `Category`와 Figure 3.9의 `Phenomenon`의 관계(이름만 바뀐 것인지 별개 개념인지) — 확인 안 함.
4. Figure 3.8 evidence/assessment 연관의 방향·다중도 — 판독이라 원도 대조 필요.
5. Figure 3.12 Rejected Observation과 Observation 사이 연관의 이름 — 판독 불가.
6. Category Observation의 Phenomenon이 Phenomenon Type에 속해야 한다는 제약이 원서에 명시돼 있는지 — 확인 안 함.
7. 구 가이드의 SNOMED CT·LOINC 코드 예시 — 확인 안 함.

---

---

## Account (계정)

### 원전 대응

- 원서 위치: Chapter 6 「Inventory and Accounting」 §6.1 「Account」(Pearson 목차 PDF). 관련 절은 §6.3 Summary Account, §6.4 Memo Account, §6.12 Balance Sheet and Income Statement, §6.13 Corresponding Account, §6.14 Specialized Account Model입니다. 쪽은 확인 안 함(Chapter 6 시작 95쪽). 그림은 Figure 6.1, 6.4, 6.5, 6.6, 6.28, 6.29, 6.30, 6.32, 6.34입니다(apchap6.pdf).
- **원서 대체 표시와 근거 세대**: apchap6.pdf 머리말에서 Fowler는 accounting.pdf의 패턴이 원서 6장을 "supercede"한다고 적습니다.
  - accounting.pdf(PDF 메타데이터상 2000-12-09 작성): **본문은 텍스트 추출이 안 됩니다.** 판독되는 코드 블록에 `class Account ...`, `class Entry`, `class EntryType extends NamedObject`, `public class AccountingTransaction`이 있습니다.
  - eaaDev(후속 초안): 「Account」(2005-01-22), 「Accounting Entry」(2005-01-22), 서술 「Patterns for Accounting」(2006-01-24)이 공개돼 있습니다.
  - 그래서 이 노트는 원서 그림(구조·제약)과 eaaDev 서술(의도·사용 시점·코드)을 함께 근거로 씁니다.
- 문제와 해법:
  - 원서 Figure 6.1: Account `1` — `*` Entry. Account는 `balance: Quantity`, Entry는 `amount: Quantity`, `whenCharged: Timepoint`, `whenBooked: Timepoint`를 가지고, 제약은 `balance=sum(entries.amount)`입니다.
  - JAOO 슬라이드: Account `balance: Money`, Entry `amount: Money`, `{balance = sum(entries)}`, "Entries record history of changes to an account".
  - Figure 6.4(대안, 판독): Entry 없이 Transaction이 Account를 withdrawal from / deposit to로 직접 가리키고, balance를 "= sum(withdrawals) - sum(deposits)"로 파생합니다.
  - eaaDev Account:
    - 의도문: "Collect together related accounting entries and provide summarizing behavior"
    - 세 관점: ① entry의 컨테이너이면서 잔액 같은 요약 행위를 가진 것 ② "an Audit Log of some value" — 현재 값, 과거 어느 시점의 값, 각 변경을 모두 알고 싶을 때 ③ entry와 그 descriptor(분류 기준) 사이의 간접층
    - 돈 이외에도 씁니다(냉장고 맥주병, 창고 네트워크 예)
    - "There are two essential qualities to the account pattern: keeping a collection of entries and providing summarizing information over those entries."
    - 최적화: entry가 많으면 현재 잔액을 필드에 캐시하고 과거 잔액은 거꾸로 계산합니다. 오래된 entry 묶음을 잔액이 같은 consolidating entry 하나로 바꿀 수 있습니다(이후 날짜 잔액은 유지되지만 세부 조회는 불가).
    - 통화: 보통 계정당 하나이고, 여러 통화를 받으면 요약 계산에 Money Bag이 필요합니다.
    - 사용 시점: 현재 값·과거 값·변경 이력이 모두 필요할 때입니다. 현재 값만이면 필드, 현재·과거 값만이면 Temporal Property로 충분합니다. 이미 Accounting Entry를 쓰면서 공통 descriptor로 묶고 싶을 때도 씁니다. 도메인 전문가가 계정으로 생각하는지도 기준입니다. Posting Rule Network, Difference Adjustment는 Account를 쓰면 훨씬 쉽다고 적습니다.
    - 코드: `Collection entries`, `Currency currency`, `addEntry(Money amount, MfDate date)`에서 `Assert.equals(currency, amount.currency())`, `balance(DateRange period)`는 기간에 든 entry 합, `balance(MfDate)` = `balance(DateRange.upTo(date))`, `balance()` = 오늘.
  - eaaDev Accounting Entry:
    - 의도문: "An allocation of a sum of money"
    - "in Analysis Patterns I put them in the same pattern. But this is not always the case. Some see entries without accounts, some all entries as just parts of accounts."
    - Domain Event와 같은 질문을 던지라고 적습니다("Should the entries be immutable? Which dates should they have?"). open 상태에서는 변경을 허용하고 closed/booked 이후에는 금지하는 규칙이 흔하다고 적습니다.
  - eaaDev 서술(2006): 잔액은 entry 합, 기간 잔액 가능. "much of these are optional. I've seen systems use Accounting Entry without Account or Accounting Transaction. Essentially Account acts as a descriptor for classifying Accounting Transactions."
- 등장 개념:
  - `Account` — entry 모음과 요약 행위 · 운영 층위
  - `Entry` / `Accounting Entry` — 금액(또는 수량)의 할당 한 건 · 운영 층위
  - `balance` — entry 합으로 파생되는 요약 · 값(파생)
  - `amount` — Quantity/Money · 값
  - `whenCharged` / `whenBooked` — Entry의 두 시각(Figure 6.1) · 값. 정의는 확인 안 함
  - `descriptor` — Entry 분류 기준(프로젝트, 비용 유형 등, eaaDev) · 운영 층위
  - `Summary Account` / `Detail Account` — 하위 계정 components를 합치는 요약 계정(Figure 6.5 `{hierarchy}`, 6.32 `{DAG}`) · 운영 층위
  - `Memo Account` — §6.4. 내용 확인 안 함
  - `Balance Sheet Account` / `Income Statement Account` / `Asset` · `Liability` · `Income` · `Expense Account` — 계정 분류(Figure 6.28) · 운영 층위(분류는 하위 타입으로 표현)
  - `Corresponding Account` — correspondents `{symmetric, transitive}`, Party와 owner/classifier 연관(Figure 6.29, 판독) · 운영 층위
  - `Account Type` — 계정 종류(Figure 6.20) · 지식 층위
  - `Holding` / `Location` / `Item Type` / `Inventory Entry` / `Transfer` — 재고 특화(Figure 6.30) · 운영 층위(Item Type은 지식 성격 — 판단)
  - `Derived Account` / `Account Filter` — 필터로 entry를 고른 파생 계정(Figure 6.34) · 운영 층위
  - `consolidating entry`, `Money Bag` — eaaDev 최적화·다중 통화 · 운영/값
- 관계:
  - Account `1` — `*` Entry(Figure 6.1)
  - Summary Account — components `*`(`{hierarchy}` 또는 `{DAG}`), Detail Account `1` — `*` Entry, "Overload: entries is derived as components.entries"(Figure 6.5, 6.32)
  - Figure 6.6: allEntries 파생 = entries AND components.entries, baseEntries
  - Figure 6.30: Location `1` — `*` Holding, Holding — `1` Item Type, 제약 "self.item type == self.account.item type"
  - Figure 6.34: Derived Account `*` — `1` Account Filter(`isIncluded()`), "entries = all e:entries for which account filter.isIncluded (e) == true"
- 모델 불변식:
  - balance = Σ entries.amount(Figure 6.1). 기간 한정 잔액도 가능(eaaDev `balance(DateRange)`)
  - 계정 안 entry의 통화 일치(eaaDev 코드 Assert)
  - Summary Account의 entries = components의 entries(파생)
  - 재고: entry의 item type = account의 item type(Figure 6.30)
  - Entry 변경 규칙: 늘 불변이거나 booked 전까지만 변경 가능(eaaDev Accounting Entry)

### 최소 조건 후보

- [필수] Account가 entry들의 요약으로서 잔액을 제공하고, 잔액은 entry에서 파생되거나 entry와 일관되게 유지된다 — 빠지면: `balance` 컬럼만 UPDATE해서 과거 시점 잔액과 변경 이유가 없습니다. eaaDev 기준으로 현재 값만 필요하면 필드로 충분하니 그것은 Account가 아닙니다.
- [필수] 값의 변경은 entry 추가로 기록되고, 확정(booked)된 entry는 수정·삭제하지 않으며 정정은 새 entry로 한다 — 빠지면: 금액 UPDATE로 정정해서 감사 추적이 사라집니다. eaaDev가 booked 전 변경과 Replacement Adjustment도 인정하므로, [필수] 범위를 "확정 이후 불변"으로 한정합니다(판단).
- [필수] 금액이 단위(통화)를 가진 Quantity/Money이고 계정 안 단위가 일치한다 — 빠지면: 원화 계정에 달러 entry를 합산합니다.
- [선택] 기간 잔액(`balance(DateRange)`), 입금·출금 합계
- [선택] 잔액 캐시, consolidating entry
- [선택] Summary Account 계층
- [선택] Account Type(지식 층위)과 계정 분류(자산/부채/수익/비용)
- [선택] 다중 통화(Money Bag)
- [선택] entry 두 시각(whenCharged/whenBooked)

### 사용 단서

- 이런 요구가 보이면: "지난달 말 잔액", "잔액이 왜 이렇게 됐는지 내역", "금액이나 재고 수량의 입출 이력", "프로젝트·비용 유형별 집계".
- 쓰지 말아야 할 때: 현재 값만 필요하면 필드, 현재·과거 값만 필요하고 개별 변경이 필요 없으면 Temporal Property(eaaDev). 도메인 전문가가 계정 개념을 쓰지 않으면 쓰지 않습니다(eaaDev). 정량이 아닌 것(소스 코드 버전 관리)에 적용하는 것은 Fowler가 "stretching the analogy a little too far"라고 적습니다.

### 비교 대상

- vs 잔액 필드: 과거 시점 잔액과 개별 변경 이력이 필요한가.
- vs Temporal Property: 과거 값만인가, 개별 변경 사건까지인가(eaaDev Account "When to Use It").
- vs Accounting Entry 단독: 공통 descriptor로 묶기, Posting Rule Network, Difference Adjustment가 필요한가(eaaDev).
- vs Transaction: Account는 한 계정의 이력, Transaction은 여러 계정 사이 이동의 균형입니다.
- vs Event Sourcing: 상태를 기록의 합으로 재구성한다는 발상이 같습니다. eaaDev 서술 — "Accounts keep track of the monetary consequences of events, which means they work very well with Event Sourcing."
- vs Measurement: 건마다 독립 사실인가, 합산해 잔액을 만드는가(판단).

### DDD 매핑 후보 (상황 설정 표의 재료)

- 기본 배정: Account는 Entity(계좌 식별자)입니다. Entry는 두 견해가 갈립니다 — 불변 Entity(consideration 「Account와 Entry의 관계 설계」 후속 논의: 같은 금액 두 번 입금은 다른 사실이고 역분개가 원 Entry id를 지목) 대 관점별 VO(consideration 「account-transaction-entry-modeling」의 Leg/Ledger).
- BC 한 줄 후보(판단): "원장(ledger) — 계정별 금액 이동 기록과 잔액을 제공한다."
- 선택지 요약(상세는 이 노트 「배경 확정안 재료」 4):
  - A — Account가 Entry 컬렉션 소유(원서 Figure 6.1, eaaDev 코드 모양 그대로)
  - B — Entry 독립 aggregate, AccountId 참조
  - C — Transaction이 Entry 소유, AccountId 참조(복식부기)
  - D — B나 C 위에 Account가 파생 VO(잔액 요약 또는 내역 투영)를 가짐
- balance 배치: 파생(질의·프로젝션)인가, Account 안 캐시 VO인가 — 동기 불변식(잔액 하한)이 있는가로 정합니다.
- Summary Account: 계정 트리를 조회용 구조(읽기 모델)로 둘지, 계정과목표(chart of accounts) aggregate가 계층·DAG 불변식을 지키게 할지 선택합니다(판단).
- Account Type: 지식 층위 aggregate입니다.
- 공회전 판단: 공회전하지 않습니다. 불변식의 위치 자체가 이 도메인의 핵심 쟁점입니다.

### 세 언어 구현 쟁점

- 금액: Quantity 노트 쟁점 그대로입니다 — Java `BigDecimal`의 scale·`divide`, TypeScript `number` 2⁵³ 한계와 `bigint` 직렬화, Rust 정수 오버플로와 `checked_add`.
- 기간 잔액: Range 노트의 경계 규칙을 따릅니다. eaaDev `balance(DateRange)`는 양 끝 포함 `includes`(날짜 정밀도)입니다.
- 컬렉션 노출: Account가 Entry 컬렉션을 그대로 내주면 호출자가 수정할 수 있으므로 읽기 전용 뷰나 복사본이 필요합니다(판단).
- Rust: 소유권 규칙상 한 Entry 값을 Account와 Transaction이 동시에 소유할 수 없습니다. Fowler의 양방향 공유 모델을 옮기려면 공유 포인터나 id 참조가 필요하고, id 참조가 aggregate 간 참조 규칙과 맞습니다(판단).
- TypeScript: `Date` 가변(MDN) — Entry 시각은 불변 표현(epoch 숫자, ISO 문자열)으로 둡니다(판단).

### 실제 사례

- TigerBeetle Account:
  - 누적 `debits_posted`/`credits_posted`를 가지고, 잔액은 둘의 차이입니다(계정 성격에 따라 방향 선택).
  - "Account fields cannot be changed by the user after creation. However, debits and credits fields are updated by TigerBeetle as transfers move money to and from an account."
  - `flags.debits_must_not_exceed_credits`: "transfers will be rejected that would cause this account's debits to exceed credits. Specifically when account.debits_pending + account.debits_posted + transfer.amount > account.credits_posted." — 잔액 캐시에 동기 한도 불변식을 붙인 사례입니다.
- Apache OFBiz `GlAccount`: `glAccountId`, `glAccountTypeId`, `glAccountClassId`, `parentGlAccountId`, `accountCode`, `accountName` 등 — 계정 계층(parent)과 계정 유형을 가집니다.
- hledger: 거래의 posting으로 계정 잔액을 계산하고, 저널에 balance assertion을 둘 수 있습니다.

### 기존 가이드 승계분

- 최소 조건 취지: ① 항목 집합으로서의 계정(잔액은 항목에서 도출하거나 항목과 일관 유지) ② 항목의 불변 이력성(정정은 상쇄 항목) ③ 금액의 Quantity 표현. 오해 지점으로 잔액만 저장, Entry 사후 수정·삭제, 상대 계정(복식부기) 무시를 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Chapter 6 Account/Entry / Fowler "Accounting Patterns"와 martinfowler.com/books/ap.html / 복식부기, Event Sourcing 아키텍처
- 주의: 구 account-pattern.md 코드(`class Account { private final List<Entry> entries … }`)는 consideration 「Account와 Entry의 관계 설계」가 "DDD 전술로 읽으면 시나리오 1 — 코드 경계는 수정 대상"이라고 판정한 형태입니다. 개념 명제("잔액 = 불변 Entry 집합의 합")만 승계합니다.

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §6.1 Account, §6.3, §6.4, §6.12–§6.14 · 조회 2026-09-17
- [Analysis Patterns (Google Books)](https://books.google.com/books/about/Analysis_Patterns.html?id=4V8pZmpwmBYC) — Chapter 6 시작 95쪽 · 조회 2026-09-17
- [UML Diagrams for Chapter 6 (apchap6.pdf)](https://martinfowler.com/apsupp/apchap6.pdf) — Figure 6.1, 6.4–6.6, 6.28–6.30, 6.32, 6.34, accounting.pdf로 대체한다는 머리말 · 조회 2026-09-17
- [Accounting Patterns 개정 초안 (accounting.pdf)](https://martinfowler.com/apsupp/accounting.pdf) — PDF 메타데이터 2000-12-09, 본문 텍스트 추출 불가, Account·Entry·EntryType·AccountingTransaction 코드 블록만 판독 · 조회 2026-09-17
- [Analysis Patterns 튜토리얼 슬라이드 (Fowler, JAOO 1999)](http://jaoo.dk/jaoo1999/schedule/MartinFowlerAnalysisPatterns.pdf) — Account/Entry 슬라이드 · 조회 2026-09-17
- [Account (eaaDev, 2005-01-22)](https://martinfowler.com/eaaDev/Account.html) — 의도문, 세 관점, 최적화, 통화, 사용 시점, 코드 · 조회 2026-09-17
- [Accounting Entry (eaaDev, 2005-01-22)](https://martinfowler.com/eaaDev/AccountingEntry.html) — 의도문, account 없는 entry, 불변성·날짜 질문, open/booked · 조회 2026-09-17
- [Patterns for Accounting (eaaDev, 2006-01-24)](https://martinfowler.com/eaaDev/AccountingNarrative.html) — 잔액 파생, Account·Transaction 선택성, Event Sourcing, 정정 3방식 · 조회 2026-09-17
- [Accounting Transaction (eaaDev, 2005-01-22)](https://martinfowler.com/eaaDev/AccountingTransaction.html) — Entry의 account·transaction 양방향 참조, post 흐름 · 조회 2026-09-17
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Aggregates(16쪽) "allow external objects to hold references to the root only" · 조회 2026-09-17
- [Effective Aggregate Design Part I (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf) — 규칙 1·2, 늘어나는 컬렉션 문제, "modifies only one aggregate instance per transaction" · 조회 2026-09-17
- [Effective Aggregate Design Part II (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf) — 규칙 3·4, 지연 허용을 도메인 전문가에게 묻기, 낙관적 동시성, Reasons To Break the Rules · 조회 2026-09-17
- [TigerBeetle: Account](https://docs.tigerbeetle.com/reference/account/) — 필드 불변, 한도 flag 조건식 · 조회 2026-09-17
- [TigerBeetle: Data Modeling](https://docs.tigerbeetle.com/coding/data-modeling/) — debit/credit 잔액, 계정 불변 · 조회 2026-09-17
- [OFBiz accounting-entitymodel.xml](https://github.com/apache/ofbiz-framework/blob/trunk/applications/datamodel/entitydef/accounting-entitymodel.xml) — GlAccount 필드 · 조회 2026-09-17
- [hledger manual](https://hledger.org/hledger.html) — balance assertions · 조회 2026-09-17

### 미해결 질문

1. 원서 §6.1 「Account」의 쪽 — 확인 안 함.
2. Figure 6.4의 파생식과 연관 방향 — 판독이라 원도 대조 필요.
3. §6.4 Memo Account의 내용 — 확인 안 함.
4. Figure 6.29의 Party 연관 역할명(owner/classifier) — 판독.
5. accounting.pdf 본문 서술 — 텍스트 추출 불가, OCR은 시도하지 않음.
6. Summary Account를 aggregate로 볼지 읽기 모델로 볼지 — 가이드/배경 결정.
7. 원서 Entry의 whenCharged와 whenBooked 정의 — 확인 안 함.

### 배경 확정안 재료

**1. Fowler 모델에서 Account–Entry–Transaction은 누가 누구를 소유/참조하는가**

- 원서 1997(apchap6.pdf):
  - Figure 6.1: Account `1` — `*` Entry, Account 쪽 제약 `balance=sum(entries.amount)`.
  - Figure 6.2/6.3: Entry `*` — `1` Account, Entry `2`(또는 `2..*`) — `1` Transaction, Transaction 쪽 제약 `Sum(entries.amount) = 0`.
  - 분석 모델이라 연관만 정의하고 소유(composition)는 정하지 않습니다. 텍스트 추출본에서 composition 표기는 확인 안 됨.
- accounting.pdf 2000-12: 본문 텍스트 추출이 안 됩니다. 판독되는 코드 블록 클래스는 `class Account ...`, `public class AccountingTransaction`, `class Transaction...`, `class Entry...`, `class EntryType extends NamedObject`, `class AccountingEvent`, `abstract class PostingRule`, `class Adjustment extends AccountingEvent`입니다. eaaDev 2005 코드의 선행본으로 보입니다(판단).
- eaaDev 2005:
  - Account 코드가 entries 컬렉션을 직접 가집니다(컨테이너).
  - Accounting Transaction의 multi-legged 코드: Entry가 `account`와 `transaction` 필드를 모두 가집니다(양방향). Entry 생성자는 transaction만 부릅니다("a combination of package access for the constructor and coding convention"). `post()`에서 각 `entry.post()`가 `account.addEntry(this)`를 호출합니다. "Entries are immutable, which makes it much easier to deal with maintaining the two-way links."
- eaaDev 2006 서술: Account와 Transaction은 모두 선택이고, Account는 descriptor 역할입니다.
- 정리(판단): Fowler 개념 모델에서 Entry는 **Account 컬렉션과 Transaction 컬렉션이 동시에 담는 공유 객체**입니다. Evans aggregate 정의("allow external objects to hold references to the root only")로 옮기면 한쪽 소유를 끊어야 합니다. consideration 「account-transaction-entry-modeling」 1절의 출발점과 같은 인식입니다.

**2. 복식부기 균형 불변식은 어디에 있는가**

- Transaction에 있습니다(원서 Figure 6.2/6.3 제약, eaaDev `canPost()`). 상세는 Transaction 노트 「배경 확정안 재료」 2.
- Account 쪽 불변식은 균형이 아니라 ① balance의 파생 정의 ② 계정 통화 일치 ③ (업무 선택) 잔액 하한입니다.

**3. Vernon 4규칙을 적용할 때의 쟁점 (Account 관점)**

- 규칙 1 "Model True Invariants In Consistency Boundaries":
  - balance = Σ entries는 잔액을 저장하지 않으면 지킬 상태가 없는 정의일 뿐입니다. 캐시하면 "캐시 = Σ"가 불변식이 됩니다(판단).
  - "잔액 음수 금지"는 진짜 동기 불변식 후보입니다. 그걸 지키는 데 필요한 최소 상태는 모든 Entry가 아니라 현재 잔액(+진행 중 예약액)입니다(consideration 「Account와 Entry의 관계 설계」 종합 의견 B).
- 규칙 2 "Design Small Aggregates": Vernon Part I은 0..* 연관이 "will keep growing over time"이고 한 건 추가에 수천 건을 메모리에 올리는 문제를 듭니다. Account 안 Entry 컬렉션이 정확히 이 구조입니다. Fowler도 entry가 많으면 잔액 캐시와 consolidating entry를 권합니다.
- 규칙 3 "Reference Other Aggregates By Identity": Entry → AccountId.
- 규칙 4 "Use Eventual Consistency Outside the Boundary": 잔액 프로젝션의 지연을 업무가 허용하는지 묻습니다 — Vernon: "Ask the domain experts if they could tolerate some time delay between the modification of one instance and the others involved."
- **동시 처리(같은 Account에 동시 Entry)**: Account가 balance를 가지면 같은 aggregate 동시 수정이라 낙관적 동시성 충돌·재시도가 생깁니다(Vernon Part II가 optimistic concurrency로 aggregate를 보호한다고 언급). balance를 가지지 않으면 경합은 없지만 동기 한도 검사도 못 합니다.
- **파생 balance 지연 vs 잔액 음수 금지 같은 동기 불변식**:
  - 지연 허용이면 비동기 프로젝션으로 충분합니다.
  - 동기로 막아야 하면 둘 중 하나입니다.
    - (i) Entry(또는 Transaction) 생성과 Account balance 갱신을 한 DB 트랜잭션에서 합니다. 두 aggregate 수정이라 Vernon "modifies only one aggregate instance per transaction"의 예외입니다. 예외 근거로 Part II "Reasons To Break the Rules"(UI 편의, 기술 메커니즘 부족, 전역 트랜잭션, 조회 성능)와 user-aggregate affinity를 들 수 있습니다.
    - (ii) 예약(2단계): Account에서 먼저 한도를 확인하고 예약한 뒤, 거래 확정 후 post하거나 void합니다. TigerBeetle의 two-phase transfer(pending → post/void, "A pending transfer resolves at most once")와 한도 검사식 `debits_pending + debits_posted + amount > credits_posted`가 사례입니다.

**4. Entry 소속 4가지 — 각각 어떤 상황에서 타당한가**

- ① **Transaction이 Entry를 가짐**(Entry = Transaction aggregate의 불변 child entity, Account는 AccountId로 참조)
  - 타당한 상황: 복식부기이고 균형(Σ=0)이 핵심 생성 불변식입니다. Entry가 거래 밖에서 단독 생성되지 않습니다. 계정 단위 동기 불변식이 없거나 예약 방식으로 풀 수 있습니다.
  - 근거: 원서 Figure 6.2/6.3의 제약이 Transaction에 있습니다. eaaDev에서 Entry 생성자는 transaction만 부릅니다. consideration 「Account와 Entry의 관계 설계」 후속 논의의 결론("진짜 aggregate root는 Transaction")입니다. Apache OFBiz `AcctgTransEntry`의 기본 키가 (`acctgTransId`, `acctgTransEntrySeqId`)라 Entry가 거래에 종속됩니다. hledger·Beancount 문법에서 posting은 transaction 안에 기술됩니다.
  - 약점: 계정 잔액은 파생·프로젝션이라 동기 한도 검사에 별도 장치가 필요합니다. "계정별 내역" 조회는 Entry를 AccountId로 가로질러 읽는 읽기 모델이 됩니다(Vernon Part II는 id 참조로 조회 부담이 커지면 CQRS를 고려하라고 적습니다).
- ② **Account가 Entry를 가짐**(Entry = Account aggregate의 child)
  - 타당한 상황: 단식 원장이거나 Transaction을 두지 않는 경우입니다(eaaDev: 모든 entry를 컴퓨터가 만들면 Accounting Transaction이 주는 이득이 적음). 계정당 Entry 수가 적거나, 기간 마감·consolidating entry로 컬렉션 크기를 묶을 수 있습니다. 계정 단위 동기 불변식(잔액 하한)이 핵심이고 여러 계정의 원자 갱신이 없습니다.
  - 근거: 원서 Figure 6.1, eaaDev Account 코드(컨테이너), eaaDev Accounting Entry "some all entries as just parts of accounts".
  - 약점: 끝없이 늘어나는 컬렉션(Vernon 규칙 2), 동시 기입 경합. 복식부기에서는 거래 하나가 두 Account aggregate를 한 트랜잭션에서 고쳐야 합니다. consideration 「Account와 Entry의 관계 설계」가 시나리오 1을 지양한 근거와 같습니다.
- ③ **Entry가 홀로 존재**(Entry = 자체 aggregate, AccountId와 선택적으로 TransactionId를 참조)
  - 타당한 상황: Transaction 없는 기록, Entry 묶음에 생성 불변식이 없음, 대량 append-only 기록, 개별 Entry를 역분개 등으로 id 지목.
  - 근거: eaaDev Accounting Entry "Some see entries without accounts". eaaDev 서술 "systems use Accounting Entry without Account or Accounting Transaction". consideration 「Account와 Entry의 관계 설계」의 기본 권고 시나리오 2와 후속 논의("불변식이 없어도 trivial aggregate 자격 충분"). Vernon Part II는 불변식을 공유하지 않는 인스턴스의 일괄 생성을 "if creating a batch of aggregate instances all at once is semantically no different than creating one at a time repeatedly, it represents one reason to break the rule of thumb with impunity"라고 허용합니다.
  - 약점: 복식부기면 균형 불변식이 여러 Entry aggregate에 걸쳐 경계 밖으로 나갑니다. 그래서 복식부기에서는 ①이 자연스럽습니다(consideration 후속 논의).
- ④ **Entry는 별도 entity + Account가 VO를 가짐** — 두 변형을 나눠야 합니다.
  - ④-a Account가 **요약 VO(잔액, 예약액)만** 가짐
    - 타당한 상황: 동기 계정 불변식(잔액 음수 금지)이 있을 때.
    - 근거: consideration 「Account와 Entry의 관계 설계」 종합 의견 B의 "시나리오 2 + 파생 value 하이브리드". TigerBeetle 계정의 누적 debits/credits와 한도 flag.
    - 약점: Entry 생성과 잔액 갱신의 원자성 — 두 aggregate 수정 또는 예약 방식이 필요합니다.
  - ④-b Account가 **Entry 투영 VO 컬렉션**(예: consideration 문서1 의 **정정 전** `List<AccountLedger>`)을 가짐
    - 타당한 상황: 계정별 내역이 작고, 계정 aggregate 안에서 내역 기반 규칙(예: 최근 N건 기준 한도)이 필요할 때(판단).
    - 근거: consideration 「account-transaction-entry-modeling」의 **정정 전(2026-09-29 이전)** 코드. 그 문서는 같은 날 이 프로젝트의 배정대로 정정돼 지금은 **①의 근거**다(그 문서 4절 머리에 정정 기록).
    - 약점: 컬렉션 무한 증가, 같은 사실의 이중 상태(Transaction 쪽 Leg와 Account 쪽 Ledger) 동기화. consideration 「Account와 Entry의 관계 설계」 시나리오 3의 (a)안 비판("lazy-load 유혹", "중복 상태 동기화 부담", 경계 혼란)이 그대로 적용됩니다.

**5. consideration 두 문서는 어느 선택지인가 (결론·전제·논거)**

- 「account-transaction-entry-modeling」(심화: Transaction과 Account의 관계 및 Entry 모델링)
  - 전제: "하나의 내부 구성원(Entity나 Value Object)이 두 개의 서로 다른 Aggregate Root(AR)에 동시에 소속될 수 없습니다." Transaction은 상태 연속성이 없어도 AR이 될 수 있습니다 — 필수 조건은 일관성 경계(생성 시 합 0 원자 검증)와 전역 식별성(환불·취소·영수증에서 id로 지목)이고, 연속성은 선택입니다.
  - 결론:
    - 객체 모델에서는 Entry를 AR 관점마다 다른 VO로 나눕니다. Transaction AR은 `List<TransactionLeg>`(accountId, amount), Account AR은 (정정 전) `List<AccountLedger>`(transactionId, amount, postedAt)를 가집니다.
    - DB에서는 `entry` 테이블 하나(transaction_id FK, account_id FK)를 두고, 각 AR이 자기 FK로 조회해 자기 VO로 올립니다.
    - (정정 전) `TransferService`가 Transaction을 만들고 `post()`로 합 0을 검증한 뒤 두 Account에 `addLedger`하고, 세 aggregate를 각각 save했습니다. **2026-09-29 정정 후에는 `txRepo.save(tx)` 하나만 하고 `TransactionPosted` 를 발행하며, 계정별 내역은 AR 밖 `AccountLedgerView` 가 그 이벤트로 쌓습니다.**
  - 논거: 두 AR이 같은 Entry를 메모리 참조로 공유하면 캡슐화와 일관성 경계가 무너집니다. 외부 AR은 id로만 참조합니다. 관점별 VO 분리로 "서로 완전히 독립된 일관성 경계"를 얻습니다.
  - 선택지 대응: Transaction 쪽은 ①입니다(단, Entry가 id를 가진 child entity가 아니라 id 없는 VO). Account 쪽은 ④-b입니다. 뒤 문서의 용어로는 Account 쪽이 시나리오 1(id 없는 Composite Association value 컬렉션)에 해당합니다(판단).
  - 논거의 빈틈(판단):
    - 서비스 한 메서드가 aggregate 3개를 수정·저장합니다. 한 DB 트랜잭션이면 Vernon "one aggregate instance per transaction"의 예외인데 문서가 이를 언급하지 않습니다. 따로 저장하면 부분 실패(Transaction만 저장된 상태)의 처리가 문서에 없습니다.
    - Transaction 코드에 가변 `isPosted`가 있어 "불변 aggregate" 서술과 다릅니다.
    - DB 한 행이 두 VO로 투영되므로, 정정(역분개) 때 양쪽 투영의 일관성 규칙이 추가로 필요합니다.
- 「Account와 Entry의 관계 설계」(frontmatter 2026-06-30)
  - 전제: 결정 기준은 영속성 편의나 직관성이 아니라 "불변식이 어디에 있는가"이고, Vernon 4원칙이 기준선입니다. 핵심 질문은 "Account와 Entry가 한 트랜잭션에서 원자적으로 지켜야 하는 규칙이 실제로 존재하는가?"입니다.
  - 결론:
    - 기본은 시나리오 2(Entry 별도 aggregate, Account id 참조) → ③.
    - "잔액 음수 금지" 같은 동기 불변식이 있으면 파생 balance VO 하이브리드 → ④-a.
    - 시나리오 1(Composite Association value — Account 안 id 없는 Entry 컬렉션) → ②의 VO 형태, 지양.
    - 시나리오 3(Aggregated Association value의 컬렉션 노출) → ④-b, 지양.
    - 복식부기면 root는 Transaction, Entry는 불변 child entity, Account는 id 참조 + 필요 시 파생 balance → ① + ④-a.
  - 논거:
    - Entry는 끝없이 늘어나는 entity입니다. 식별성이 load-bearing입니다(같은 금액 두 번 입금은 별개 사실, 역분개가 원 Entry id를 지목).
    - 연속성은 Entity의 흔한 표지일 뿐 정의가 아니므로 불변 Entity가 성립합니다.
    - 불변식이 없다는 것은 aggregate 결격 사유가 아닙니다(trivial aggregate).
    - 기존 account-pattern.md 스니펫은 시나리오 1이라 코드 경계는 고치고, 개념 명제("잔액 = 불변 Entry 합")는 유지합니다.
- 두 문서가 갈리는 지점(판단): ⓐ Entry를 전역 식별이 있는 Entity로 보는가 관점별 VO로 보는가 ⓑ Account가 내역 컬렉션을 가지는가 요약만 가지는가. "균형 불변식은 Transaction에 있다"는 점은 두 문서가 일치합니다.

---

## Transaction (거래)

> **집필 결과 되먹임 (2026-09-29, v1.0.0 · 게이트 3R PASS)**
> - **★ 원전 그림에서 캡션이 그림 내용보다 앞에 온다.** 캡션 위치를 반대로 읽으면 **귀속이 한 칸씩 밀린다.** 그림을 인용하기 전에 이것을 확인한다
> - **노트에 없던 제약 발견** — 그림 6.30 에 「all entry.item types are the same」 말고 **「self.item type == self.account.item」**(Entry 의 품목이 그 계정의 품목과 같다)이 함께 있다. v1.0.0 이 최소 조건 4 의 근거로 썼다
> - **미해결 3(그림 6.4 판독) 해소** — 실측: Entry 클래스가 없고 Transaction 이 Account 를 `withdrawal from`·`deposit to` 로 가리키며 `amount`(Quantity)와 `Timepoint` 를 가진다. 잔액은 `sum(withdrawals) − sum(deposits)` 파생. **노트 판독이 맞다**
> - **미해결 5(방향 표현)·7(최소 다리 수) 해소** — 부호 방식, 다리 수 검사를 합 검사보다 앞에 두어 팩토리에서 함께 봄. 미해결 6(다중 통화)은 `[선택]` 조건 8 로 열어 뒀다
> - **보탤 원전 사실** — eaaDev 가 두 다리 거래를 「늘 부호만 반대인 두 기록」으로 적고 **검증 장치가 필요한 쪽을 여러 다리 거래로 가른다.** 이것이 「구조가 합 0 을 보장하면 그 보장이 판정 자리를 대신한다」의 근거이고, TigerBeetle 같은 구조 보장형을 최소 조건으로 걸러 내지 않게 하는 자리다
> - **세 언어 실측** — TypeScript 브랜드 타입이 **실제로 필요하다**(`type AccountId = string` 이면 `TransactionId` 와 섞인다). **Rust 소유권이 서술을 바꾼다** — `post` 가 거래를 소유권째 가져가 다리를 찍는 자리가 저장 **앞**으로 온다


### 원전 대응

- 원서 위치: Chapter 6 §6.2 「Transactions」(Pearson 목차 PDF). 관련 절은 §6.11 Sources of an Entry, §6.15 Booking Entries to Multiple Accounts입니다. 쪽은 확인 안 함(Chapter 6 시작 95쪽). 그림은 Figure 6.2, 6.3, 6.4, 6.27, 6.30(Transfer)입니다(apchap6.pdf).
- **원서 대체 표시와 근거 세대**: apchap6.pdf 머리말이 accounting.pdf를 원서 6장의 대체로 표시합니다.
  - accounting.pdf(2000-12-09): 본문 텍스트 추출 불가. 판독되는 코드 블록에 `public class AccountingTransaction`, `class Transaction...`, `class Entry...`, `class AccountingTransaction...`, `class Account...`가 있습니다.
  - eaaDev 후속: 「Accounting Transaction」(2005-01-22), 정정 패턴 「Replacement Adjustment」(2005-12-29), 「Reversal Adjustment」(2006-01-02), 「Difference Adjustment」(페이지 표기 2005-01-02), 서술 「Patterns for Accounting」(2006-01-24).
- 문제와 해법:
  - eaaDev 의도문: "Link two (or more) entries together so that the total of all entries in a transaction is zero". 복식부기는 "every withdrawel must be balanced with a deposit"이고 "For an accountant you cannot create money, it is only ever moved around"라고 적습니다.
  - 원서 Figure 6.2: Entry `2` — `1` Transaction, "Sum(entries.amount) = 0". Figure 6.3은 `2..*`입니다.
  - JAOO 슬라이드: Entry `amount: Money`, `2..*`, `{sum(entries.amount) = 0}`, 예시 "I withdraw $100 from my checking account", "The Willenhall Coal Company delivers 30 tons of coal to Bilston Gasworks"(돈이 아닌 수량), 질문 "Why are transactions useful?".
  - two-legged vs multi-legged(eaaDev):
    - two-legged는 부호가 반대인 entry 둘, multi-legged는 합이 0인 n개입니다. "notice that the only difference is the multiplicity of the association".
    - two-legged에서 두 entry가 부호만 다르면 entry를 생략하고 거래에 데이터를 둘 수 있습니다(eaaDev Figure 4 "accounting transaction without entries"). 날짜가 다르면 entry가 필요합니다(영국 은행 3일 이체 예).
    - multi-legged는 만들기가 어려워 Proposed Object로 조립한 뒤 post합니다.
  - 사용 시점(eaaDev):
    - 복식부기의 존재 이유는 누수·부정("finding and preventing leaks, or in other words combatting fraud")입니다.
    - "it really only makes sense to use Accounting Transaction if you're using Account"
    - 모든 entry를 컴퓨터가 만들면 로그와 소스로 추적이 충분해 거래가 주는 이득이 적습니다.
    - 도메인 전문가가 필요하다고 느끼지 않으면 부가 기능으로 넣지 말라고 적습니다.
    - 확실치 않으면 two-legged로 시작합니다(서로 리팩터링이 쉬움).
  - 코드(eaaDev):
    - two-legged: 생성자에서 from·to Entry를 만들어 각 `account.addEntry`하고 entries에 추가합니다. entry 생성자는 거래 과정 밖에서 못 쓰게 제한합니다. `Account.withdraw(amount, target, date)` 편의 메서드를 둡니다.
    - multi-legged: 필드 `date`, `entries`, `wasPosted`. `add(amount, account)`는 posted면 `ImmutableTransactionException`을 던집니다. `Entry(amount, date, account, transaction)`는 양방향입니다. `post()`는 `canPost()`(= `balance().isZero()`)가 거짓이면 `UnableToPostException`을 던지고, 참이면 각 `entry.post()` → `account.addEntry(this)` 후 `wasPosted = true`로 둡니다.
  - 정정 3방식(서술 2006):
    - Replacement: 잘못된 거래를 지우고 올바른 거래를 만듭니다. 단순하지만 이력을 잃습니다.
    - Reversal: 잘못된 거래를 두고 각각에 반대 entry를 게시한 뒤 올바른 거래를 게시합니다. 이력을 지키지만 상쇄 entry가 많아집니다.
    - Difference: 잘못된 것과 올바른 것의 차이만 게시합니다. 이력을 지키고 거래 수가 최소지만 구현이 복잡합니다.
- 등장 개념:
  - `Accounting Transaction` — 합이 0인 entry 묶음 · 운영 층위
  - `Entry` — 거래의 다리(leg) · 운영 층위
  - `two-legged` / `multi-legged` — 다중도 변형 · 구조
  - `Proposed Object` — 게시 전 조립 상태 · 운영 층위(상태)
  - `post` / `canPost` — 게시와 게시 가능 판정 · 행위
  - `Transfer` — 재고 이동 거래(Figure 6.30) · 운영 층위
  - `Replacement / Reversal / Difference Adjustment` — 정정 방식 · 운영 층위
  - `date`(Timepoint), `amount`(Money/Quantity) · 값
- 관계:
  - Transaction `1` — `2` 또는 `2..*` Entry, Entry `*` — `1` Account(Figure 6.2, 6.3)
  - eaaDev: Entry ↔ Transaction, Entry ↔ Account 양방향
  - Figure 6.27: Posting Rule `0..1` creator — `*` Transaction, Entry — Transaction 사이 sources/consequences 연관(방향·다중도 판독 불가)
  - Figure 6.4(판독): entry 없는 변형 — Transaction이 Account를 withdrawal from / deposit to로 가리키고 amount와 Timepoint를 가짐
  - Figure 6.30: Transfer — Inventory Entry `2..*`, 제약 "all entry.item types are the same"
- 모델 불변식:
  - 게시 시점에 Σ entries.amount = 0(Figure 6.2/6.3, eaaDev `canPost`)
  - two-legged: entry 정확히 2개, 부호 반대
  - 게시 후 entry 추가 불가(`wasPosted`)
  - Entry는 거래를 통해서만 생성(생성자 접근 제한 관례)
  - 재고 Transfer: 모든 entry의 item type이 같음(Figure 6.30)
  - 코드 관찰(판단): eaaDev `balance()`는 entries가 비면 0을 돌려주므로 빈 거래도 `canPost()`가 참입니다. 최소 다리 수는 다중도(2..*)나 two-legged 구조가 따로 지켜야 합니다.

### 최소 조건 후보

- [필수] 둘 이상의 Entry를 한 사건으로 묶는다 — 빠지면: 이체를 출금 Entry 하나로만 기록해서 입금 누락을 모델이 잡지 못합니다.
- [필수] 게시 시점에 Σ = 0을 검증하고 불균형이면 게시할 수 없다 — 빠지면: Entry를 각자 게시해 누수를 검출하지 못합니다.
- [필수] 게시는 전부 아니면 전무이고, 게시 후 거래 구성은 바뀌지 않는다 — 빠지면: 다리 3개 중 2개만 반영된 상태가 관찰되거나, 게시 뒤 다리를 추가해 균형이 깨집니다.
- [필수] 합산하는 Entry 금액의 단위가 합산 가능하다(같은 통화·같은 item type, 아니면 환산 규칙) — 빠지면: 달러 −100과 원 +100이 "합 0"으로 통과합니다(Figure 6.30 제약과 Quantity 규칙에서 도출 — 판단).
- [선택] two-legged 전용형(entry 생략)
- [선택] multi-legged + Proposed Object(작성 중 상태)
- [선택] 원천 연결(creator Posting Rule, 원천 사건)
- [선택] 정정 방식(Reversal / Replacement / Difference)
- [선택] 거래 날짜와 다리별 날짜 분리

### 사용 단서

- 이런 요구가 보이면: "돈이 어디서 와서 어디로 갔는지 늘 짝이 맞아야 한다", "감사·부정 방지", "입금표 한 장에 수표 두 장"(eaaDev multi-legged 예), "이체 출금일과 입금일이 다르다".
- 쓰지 말아야 할 때: Account를 쓰지 않을 때. 도메인 전문가가 복식부기를 요구하지 않고 모든 Entry를 시스템이 만들어 로그로 추적이 충분할 때(eaaDev). 필요 없는데 multi-legged 일반형부터 만들 때.

### 비교 대상

- vs 단순 이체 기록(from/to/amount 한 행): 원서 Figure 6.4, eaaDev Figure 4가 이 변형입니다. 두 Entry가 부호만 다를 때 유효합니다. 구분 기준은 다리별로 날짜나 다른 속성이 달라지는가, 다리가 3개 이상인가입니다.
- vs 단식부기(Account Entry만): 균형 검증이 있는가.
- vs DB 트랜잭션: DB 트랜잭션은 저장의 원자성이고, Accounting Transaction은 도메인 균형 규칙입니다(구 가이드 오해 지점과 같은 취지).
- vs Domain Event: 거래는 결과 기록, 사건은 원인입니다. eaaDev 서술: "When a Domain Event is processed, it can produce a set of Accounting Transactions. If all Accounting Transactions are produced from processing Domain Events then the Accounting Transactions use Event Sourcing".
- vs Posting Rule: 거래를 만드는 규칙과 만들어진 거래.
- 정정 3방식끼리: 이력 보존, 항목 수, 구현 복잡도(서술 2006). Reversal은 "a simple alternative when entries are immutable and thus you can't use Replacement Adjustment", Difference와의 선택은 "depends on how your users want to see the information"(Reversal 페이지). Difference는 사용자가 명시적 상쇄 대신 요약을 원할 때입니다(Difference 페이지).

### DDD 매핑 후보 (상황 설정 표의 재료)

- 기본 배정: Transaction은 aggregate root 후보입니다. consideration 두 문서 모두 일관성 경계(합 0)와 전역 식별성을 근거로 듭니다. 게시 후 불변입니다.
- BC 한 줄 후보(판단): "원장 — 계정 사이 가치 이동을 균형 잡힌 거래로 기록한다."
- 선택지 A — Transaction root + Entry 불변 child entity(`EntryId` 전역 식별) + `AccountId` 참조.
  - 전제: 역분개·감사가 특정 Entry를 id로 지목해야 합니다.
  - 근거: consideration 「Account와 Entry의 관계 설계」 후속 논의, OFBiz `AcctgTransEntry` 기본 키 구조.
- 선택지 B — Transaction root + Leg VO(id 없음).
  - 전제: 정정이 거래 단위로만 지목됩니다(판단).
  - 근거: consideration 「account-transaction-entry-modeling」의 `TransactionLeg`.
- 선택지 C — two-legged 단일 기록(debitAccountId, creditAccountId, amount), Entry 없음.
  - 전제: 다리가 늘 2개이고 날짜가 같습니다. 3개 이상은 여러 기록을 원자적으로 연결합니다.
  - 근거: eaaDev "accounting transaction without entries", TigerBeetle Transfer(`debit_account_id`, `credit_account_id`, `amount`), `flags.linked`("either succeed or fail together").
- 선택지 D — Transaction 없이 Entry aggregate만: 복식부기 균형이 경계 밖으로 나가므로 비권고입니다(판단).
- 상태: draft(Proposed Object — 다리 추가 가능) → posted(불변). draft를 저장되는 aggregate 상태로 둘지, 메모리에서 조립해 한 번에 posted로 생성할지 선택합니다(판단).
- 공회전 판단: 공회전하지 않습니다.

### 세 언어 구현 쟁점

- 합 0 검사는 금액 표현에 좌우됩니다.
  - Java: `BigDecimal.equals`는 scale까지 비교하므로 `0.00`과 `0`이 다릅니다. 영 판정은 `compareTo`로 합니다(BigDecimal 문서의 equals·compareTo 설명).
  - TypeScript: `number` 부동소수 합은 정확히 0이 안 될 수 있으므로 최소 단위 정수(안전 정수 범위 안)나 `bigint`를 씁니다(판단 — MDN Number 근거).
  - Rust: 정수 합산은 `checked_add`로 오버플로를 잡습니다(debug 빌드 panic — Reference).
- 게시 후 불변:
  - Java: posted 상태에서 `add`가 예외를 던지게 하거나(eaaDev), draft와 posted를 다른 타입으로 나눕니다(판단).
  - TypeScript: `readonly`는 컴파일 시점만, `Object.freeze`는 얕음 — 배열 안 다리까지 고정하려면 추가 조치가 필요합니다.
  - Rust: `fn post(self) -> Result<PostedTransaction, _>`처럼 소유권 이동으로 draft를 소비해 게시 후 수정을 타입으로 막습니다(판단).
- 방향 표현: Fowler는 부호 있는 amount(`amount.negate()`)를 쓰고, TigerBeetle은 부호 없는 amount + debit/credit 계정 id, OFBiz는 `debitCreditFlag`를 씁니다. 가이드는 하나를 골라야 합니다.

### 실제 사례

- TigerBeetle Transfer:
  - `debit_account_id`, `credit_account_id`, `amount`(u128)
  - "Transfers cannot be modified after creation. If a detail of a transfer is incorrect and needs to be modified, this is done using correcting transfers." / "Transfers cannot be deleted after creation."
  - `flags.linked`로 원자 체인
  - two-phase(pending → post_pending_transfer / void_pending_transfer)
  - id = 멱등성 키(재시도 시 `exists`)
- hledger: "The posting amounts in a transaction must sum up to zero, indicating that the inflows and outflows are equal. We call this a balanced transaction."
- Beancount: "The crucial and only constraint on postings is that the sum of their balance amounts must be zero." / "ensuring that the sum of all the amounts on its postings equals ZERO, in all currencies".
- Apache OFBiz:
  - `AcctgTrans`: `acctgTransId`, `acctgTransTypeId`, `transactionDate`, `isPosted`, `postedDate` 등
  - `AcctgTransEntry`: 기본 키 (`acctgTransId`, `acctgTransEntrySeqId`), `glAccountId`, `amount`, `currencyUomId`, `debitCreditFlag` 등

### 기존 가이드 승계분

- 최소 조건 취지: ① 다수 항목의 묶음 ② 합 0 균형 불변식(불균형 거래는 게시 불가) ③ 원자적 반영(전부 또는 전무). 오해 지점으로 출금만 기록(단식부기), 균형 검사 없이 각자 게시, 원자성을 DB 트랜잭션과만 동일시를 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Chapter 6 Transaction / martinfowler.com/books/ap.html / 복식부기, 결제 원장 아키텍처
- 주의(판단): 구 조건 ③ "모든 Entry가 각 계정에 함께 반영"은 Entry가 Account 안에 있는 모델을 전제합니다. 선택지 A(Entry가 Transaction 안)에서는 "Transaction 1건 저장 = 원자적 반영"으로 다시 서술해야 합니다. 구 transaction-pattern.md 코드도 `post()`에서 `e.account.post(...)`로 Account 객체를 직접 수정합니다(aggregate 간 객체 참조).

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §6.2 Transactions, §6.11, §6.15 · 조회 2026-09-17
- [UML Diagrams for Chapter 6 (apchap6.pdf)](https://martinfowler.com/apsupp/apchap6.pdf) — Figure 6.2, 6.3, 6.4, 6.27, 6.30, 대체 머리말 · 조회 2026-09-17
- [Accounting Patterns 개정 초안 (accounting.pdf)](https://martinfowler.com/apsupp/accounting.pdf) — 2000-12-09, 본문 추출 불가, AccountingTransaction·Entry 코드 블록 판독 · 조회 2026-09-17
- [Analysis Patterns 튜토리얼 슬라이드 (Fowler, JAOO 1999)](http://jaoo.dk/jaoo1999/schedule/MartinFowlerAnalysisPatterns.pdf) — Transaction 슬라이드와 예시 · 조회 2026-09-17
- [Accounting Transaction (eaaDev, 2005-01-22)](https://martinfowler.com/eaaDev/AccountingTransaction.html) — 의도문, two/multi-legged, 사용 시점, 코드 · 조회 2026-09-17
- [Patterns for Accounting (eaaDev, 2006-01-24)](https://martinfowler.com/eaaDev/AccountingNarrative.html) — 정정 3방식, Event Sourcing과의 관계 · 조회 2026-09-17
- [Reversal Adjustment (eaaDev, 2006-01-02)](https://martinfowler.com/eaaDev/ReversalAdjustment.html) — 방법, 원 사건에 역전 entry 부착, 사용 시점 · 조회 2026-09-17
- [Replacement Adjustment (eaaDev, 2005-12-29)](https://martinfowler.com/eaaDev/ReplacementAdjustment.html) — 삭제 후 재작성, 이력 손실, 기간 한정 사용 · 조회 2026-09-17
- [Difference Adjustment (eaaDev)](https://martinfowler.com/eaaDev/DifferenceAdjustment.html) — Account 사용 시 쉬움, Reversal과의 선택 기준 · 조회 2026-09-17
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Aggregates(16쪽) · 조회 2026-09-17
- [Effective Aggregate Design Part I (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf) — 한 트랜잭션 한 aggregate · 조회 2026-09-17
- [Effective Aggregate Design Part II (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf) — 결과적 일관성, Reasons To Break the Rules · 조회 2026-09-17
- [TigerBeetle: Transfer](https://docs.tigerbeetle.com/reference/transfer/) — 수정·삭제 불가, correcting transfer, flags.linked, two-phase · 조회 2026-09-17
- [TigerBeetle: Reliable Transaction Submission](https://docs.tigerbeetle.com/coding/reliable-transaction-submission/) — id 멱등성 키, exists · 조회 2026-09-17
- [TigerBeetle: Account](https://docs.tigerbeetle.com/reference/account/) — pending 포함 한도 검사 · 조회 2026-09-17
- [hledger manual](https://hledger.org/hledger.html) — balanced transaction 정의 · 조회 2026-09-17
- [Beancount Language Syntax](https://beancount.github.io/docs/beancount_language_syntax/) — posting 합 0, 모든 통화 · 조회 2026-09-17
- [OFBiz accounting-entitymodel.xml](https://github.com/apache/ofbiz-framework/blob/trunk/applications/datamodel/entitydef/accounting-entitymodel.xml) — AcctgTrans·AcctgTransEntry 필드와 기본 키 · 조회 2026-09-17
- [BigDecimal (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html) — equals vs compareTo · 조회 2026-09-17

### 미해결 질문

1. 원서 §6.2 「Transactions」의 쪽 — 확인 안 함.
2. Figure 6.27 sources/consequences 연관의 방향·다중도·의미 — 판독 불가.
3. Figure 6.4 판독 결과 — 원도 대조 필요.
4. §6.15 Booking Entries to Multiple Accounts의 내용 — 확인 안 함.
5. 방향 표현: 부호 방식(Fowler)인지 debit/credit 방식(TigerBeetle, OFBiz)인지 — 가이드·배경 결정.
6. 다중 통화 거래의 균형 규칙(Beancount "in all currencies", hledger는 cost로 환산 후 검사) — 배경 확정안에서 단일 통화로 한정할지.
7. 최소 다리 수 규칙을 어디에 둘지(eaaDev 코드상 빈 거래도 canPost 참).
8. Difference Adjustment 페이지 날짜 표기(2005-01-02)가 같은 계열 페이지(2005-12-29, 2006-01-02)와 어긋남 — 표기 오류인지 확인 안 함.

### 배경 확정안 재료

**1. Account–Entry–Transaction 관계 (Transaction 관점)**

- 원서 1997: Transaction `1` — `2..*` Entry, Entry `*` — `1` Account. Σ=0 제약은 Transaction에 있습니다. Posting Rule이 Transaction의 creator입니다(Figure 6.27, `0..1`).
- accounting.pdf 2000-12: 텍스트 추출 불가. 판독되는 코드 블록에 AccountingTransaction·Entry·Account 클래스가 있어 eaaDev 2005 코드의 선행본으로 보입니다(판단). 그림 라벨은 Event → Accounting Entry 흐름 위주입니다(Posting Rule 노트 「배경 확정안 재료」 1).
- eaaDev 2005: Transaction이 entries를 가지고, 각 Entry가 account를 참조하며, post 시 `account.addEntry`로 Account 컬렉션에도 들어갑니다. **Entry가 두 컬렉션에 동시에 속합니다.**

**2. 복식부기 균형 불변식은 어디에 있는가**

- Transaction에 있습니다 — 원서 Figure 6.2/6.3 제약, eaaDev `canPost()`(`balance().isZero()`).
- 시스템 전체 보존("money is conserved much like physicists conserve energy")은 모든 거래가 균형이라는 데서 따라 나오는 결과입니다(판단).
- 외부 사례도 거래 단위로 검사합니다(hledger, Beancount). TigerBeetle은 transfer 한 건이 debit 하나·credit 하나라 구조적으로 균형입니다(판단).

**3. Vernon 4규칙을 적용할 때의 쟁점**

- **중복 전기 방지(멱등성)**:
  - TigerBeetle: "Transfers and Accounts carry an id field that is used as an idempotency key to ensure the same object is not created twice." 클라이언트가 id를 만들어 로컬에 저장하고, 재시도 때 같은 id를 씁니다. 이미 있으면 `exists`를 돌려줍니다.
  - DDD 적용(판단): 명령을 내는 쪽이 `TransactionId`를 만들고, 저장소 유일 제약이 중복 게시를 거부합니다. Posting Rule이 만든 거래면 원천 사건 id에서 결정적으로 id를 만듭니다(Posting Rule 노트).
- **취소·정정(역분개 vs 수정)**:
  - Reversal(eaaDev): "For each entry that needs to be adjusted you create two new entries. One entry is a simple reversal of the previous entry, using the same occurred date and the same amount with opposite sign. Then you post a new entry which is what the old amount should have been." 역전 entry는 새 사건이 아니라 원 사건에 붙이고, 원 사건을 adjusted로 표시합니다("so shouldn't be adjusted again"). 상쇄 쌍을 걸러내는 조회가 필요합니다.
  - Replacement(eaaDev): 잘못된 entry를 지우고 hindsight entry를 만듭니다. 이력을 잃습니다. 청구서 발송 전까지처럼 기간을 한정해 씁니다. Event Sourcing이면 Parallel Model로 재생할 수 있습니다.
  - Difference(eaaDev): 차이만 게시합니다.
  - 혼합(eaaDev Reversal): "Often you'll find entries are mutable up to a certain date, and immutable after that. This will lead you to a conbination of Reversal Adjustment and Replacement Adjustment."
  - TigerBeetle: 수정·삭제 불가, correcting transfer로만 고칩니다.
  - DDD 적용(판단): Reversal은 새 Transaction aggregate가 원 `TransactionId`(또는 `EntryId`)를 참조하는 형태라 원 aggregate를 고치지 않아도 됩니다(Vernon 규칙 부합). "이미 정정됨" 표시를 원 aggregate에 쓰면 두 aggregate를 고치게 되므로, 표시를 정정 거래의 존재에서 파생하거나 결과적으로 갱신합니다. Replacement는 게시 전(draft/open) 상태에서만 허용하는 aggregate 상태 규칙으로 둡니다.
- **동시 처리(같은 Account에 동시 Entry)**: 게시된 Transaction은 불변이라 거래 aggregate 자체의 경합은 드뭅니다. 경합은 Account 쪽 동기 불변식에서 생깁니다(Account 노트 「배경 확정안 재료」 3).
- **원자성과 aggregate 수**: 선택지 ①(Entry가 Transaction 안)이면 거래 게시 = Transaction 하나 저장이라 규칙에 맞고, 계정 잔액 반영은 파생·비동기입니다. 잔액 음수 금지를 동기로 강제하면 Transaction + Account(들) 수정이 되어 Vernon 규칙의 예외가 되거나, 예약(two-phase)이 필요합니다. TigerBeetle "A pending transfer resolves at most once", 한도 검사에 pending이 포함됩니다.
- **파생 balance의 지연 허용 여부**: 조회용 잔액의 지연 허용은 업무 결정입니다(Vernon "Ask the domain experts…"). 동기 불변식이 있는 계정만 ④-a(Account 노트)로 한정하는 혼합도 가능합니다(판단).

**4. Entry 소속 4가지 — Transaction 관점 요약 (상세는 Account 노트 「배경 확정안 재료」 4)**

- ① Transaction이 가짐: 균형 불변식이 한 경계 안에 있음 — 복식부기 기본값 후보.
- ② Account가 가짐: 균형이 여러 Account aggregate에 걸침 — 거래 게시가 늘 다중 aggregate 수정.
- ③ 홀로 존재: 균형이 여러 Entry aggregate에 걸침 — 복식부기에는 부적합, 단식·무불변식 기록에 적합.
- ④ 별도 entity + Account가 VO 보유: ①이나 ③ 위에 Account 요약(④-a) 또는 내역 투영(④-b).

**5. consideration 두 문서 (Transaction 관점)**

- 「account-transaction-entry-modeling」: Transaction AR + `TransactionLeg` VO(①의 VO 변형). `post()`에서 합 0을 검증합니다. Transaction의 AR 자격을 일관성 경계 + 전역 식별성으로 제시하고, 연속성은 선택이라고 봅니다.
- 「Account와 Entry의 관계 설계」: 복식부기면 Transaction root + Entry 불변 child entity(① 정석). Account는 id 참조, 필요 시 파생 balance.
- 두 문서는 "균형 불변식은 Transaction"에서 일치하고, Entry의 식별성(VO vs Entity)과 Account 쪽 보유물(내역 VO 컬렉션 vs 요약 VO)에서 갈립니다.

---

---

## Posting Rule (전기 규칙)

> **집필 결과 되먹임 (2026-09-29, v1.0.0 · 게이트 2R PASS)**
> - **★ 귀속 정정** — 아래 「구현 선택(JAOO, Figure 6.9–6.13)」이 두 출처를 한 괄호에 묶었다. 계산을 **싱글톤 하위 클래스 · 계산 전략 객체 · `case` 문 · 요율 매개변수** 넷으로 견준 것은 **원서 그림 6.9 · 6.10 · 6.12 · 6.13** 이고 **JAOO 슬라이드에는 `case` 문 슬라이드가 없다.** 집필자가 1라운드에 이 귀속을 그대로 옮겨 적었다가 걸렸다
> - **★ `[필수]` 가 셋뿐이다** — 멱등(중복 전기 금지)을 `[필수]` 로 올렸다가 PG27 로 걸려 `[선택]` 으로 내렸다. 근거로 댄 중복 처리 단언은 ① 저자가 「이 예제에서는 사건 클래스를 처리기로 삼았다」고 **스스로 한정한 절**에 있고 ② 단언이 붙은 클래스가 규칙이 아니라 **사건**이며 ③ **규범 쪽 서술에는 중복 처리 이야기가 없다.** 「원전이 성립 요건으로 적은 자리」가 아니라 이 가이드의 정책이다
> - **파생 세금 사건의 eaaDev 귀속은 확인 불가** — accounting.pdf 쪽 코드는 실재하지만 eaaDev 페이지에는 호출 한 줄뿐이고 저자가 논의를 미룬 뒤 돌아오지 않는다. v1.0.0 은 eaaDev 를 근거에서 뺐다
> - **「Chapter 7 시작 133쪽」의 출처가 Google Books** 인데 참고 자료에 그 출처가 없다. v1.0.0 은 쪽 번호를 빼고 「확인하지 못했다」로 적었다
> - **미해결 2·3 해소** — 출력 단위는 확정안 10절대로 균형 거래, 트리거 방식은 사건 트리거형(2000/2005 세대)을 기준 모델로. 7번(Agreement 층위)은 규칙 하나 = aggregate 하나를 택해 계약을 aggregate 로 두지 않고 「상황이 달라지면」 한 행으로 남겼다
> - **새 실측 셋** — 멱등 검사를 빼면 거래 수 4 → 5(미수금 +1,800 KRW 중복) · 기간 비중첩 검사를 빼고 R9 등록을 사건 루프 앞으로 옮기면 3/20 사건이 등록 순서에 따라 2,160 또는 2,400 · **TypeScript 브랜드 타입은 다섯을 모두 떼야 진단 0건이고, 하나만 떼면 진단이 사라지는 것이 아니라 원인이 옆 타입으로 옮겨 간다**
> - **★ 도식 함정** — 관계를 `association`·`dependency` 만 쓰면 모든 노드가 한 행에 깔려 **겹침 가드(종료 코드 7)** 에 막힌다. 계층 간선(`above`)으로 선언해 트리로 만들어야 렌더가 통과한다


### 원전 대응

- 원서 위치: Chapter 6 §6.5 「Posting Rules」(Pearson 목차 PDF). 이어지는 절은 §6.6 Individual Instance Method, §6.7 Posting Rule Execution, §6.8 Posting Rules for Many Accounts, §6.9 Choosing Entries, §6.10 Accounting Practice, §6.11 Sources of an Entry입니다. Chapter 7 「Using the Accounting Models」(시작 133쪽, §7.1–§7.9)이 전화 서비스 과금 예로 이 모델을 적용합니다(§7.3 Setting Up New Phone Services, §7.4 Setting Up Calls, §7.5 Implementing Account-based Firing, §7.6 Separating Calls into Day and Evening, §7.7 Charging for Time, §7.8 Calculating the Tax). 쪽은 확인 안 함. 그림은 Figure 6.7–6.13, 6.20, 6.21, 6.23, 6.25–6.27입니다(apchap6.pdf).
- **원서 대체 표시와 근거 세대**: apchap6.pdf 머리말이 accounting.pdf를 원서 6장의 대체로 표시합니다.
  - accounting.pdf(PDF 메타데이터상 2000-12-09): **본문 텍스트 추출 불가.** 그림 라벨과 코드 블록만 판독됩니다.
    - 그림 라벨: `Event` · `process()` · `findAgreement(Event)` → `Agreement` · `getRule(EventType)`(뒤 그림은 `getRule(EventType, Date)`) → `Posting Rule`(`Event Type`과 `1`/`✻` 연관, 뒤 그림은 `effectivity: Date Range`) —creates→ `Accounting Entry`. `Adjustment`(old events, replacement, adjusted event). `source` Event — Accounting Entry.
    - 코드: `abstract class PostingRule { protected EntryType type; … makeEntry(AccountingEvent evt, Money amount) … evt.getCustomer().addEntry(newEntry); evt.addResultingEntry(newEntry); … process(AccountingEvent evt) { makeEntry(evt, calculateAmount(evt)); …`. 이 밖에 `class MultiplyByRatePR extends PostingRule`, `class AmountFormulaPR extends PostingRule`, `class PoorCapPR extends PostingRule`, `class TaxEvent extends MonetaryEvent`, `class AccountingEvent { … PostingRule findRule() …`, `class ServiceAgreement`.
  - eaaDev 「Agreement Dispatcher」(2005-03-11)가 같은 계열 예(전기 요금 청구)를 공개합니다. eaaDev에는 Posting Rule 독립 페이지가 없습니다(`eaaDev/PostingRule.html`은 404, eaaDev 목록에도 없음).
- **두 세대의 차이(판단 — 그림·코드 대조 결과)**:
  - 1997 원서 / 1999 JAOO: **계정 트리거형**. 규칙이 trigger Account(또는 Account Type의 개별 계정)의 미처리 Entry를 읽어 output Account에 Entry를 게시합니다.
  - 2000 accounting.pdf / 2005 eaaDev: **사건 트리거형**. Domain Event(AccountingEvent)를 Agreement가 사건 타입과 발생 시점으로 규칙을 골라 처리하고, 결과 Entry를 사건에 연결합니다.
- 문제와 해법:
  - JAOO "Posting Rule (simple)": Posting Rule(`multiplier: Number`, `execute()`)이 trigger `1` Account, output `1` Account와 연관됩니다. 예시는 "5% of state tax is deducted from gross income".
  - Individual Instance Method(§6.6, JAOO): 규칙 인스턴스마다 자기 계산 Method를 가집니다(누진 소득세 15% / 28% / 31% 예). "Each instance of posting rule has its own method", "Conceptual statement".
  - Account Types(JAOO, Figure 6.20): trigger/output을 Account Type(지식 층위)으로 올리고, 운영 층위의 Employee Account가 Account Type과 Employee를 참조합니다. 예시는 "Apply the graduated tax algorithm to the gross pay of Doug and Dinsdale Piranha to yield their net pay".
  - Network of Posting Rules(JAOO 초과근무 예): raw Overtime → straight OT hours / Excess Hours → Straight Dollars / Excess Payment / Premium → Total Overtime(Summary Account Type). 한 규칙의 출력 계정이 다음 규칙의 트리거가 됩니다.
  - 실행(JAOO "Executing the network"): list of Posting Rules → `run(employee)` → `get account(input account type)` → `get unprocessed entries` → 각 entry마다 `execute posting rule` → `post entry`(output account).
  - 절차형의 문제(JAOO "Procedural Approach" → "Changing the Rules"): 날짜 조건 분기(`[on or after April 15]` multiply by rate * 0.9 / `[before April 15]` multiply by rate)가 쌓입니다. 해법은 "Adding an effectivity time" — Posting Rule `effectivity: Date Range`, 실행은 "get unprocessed entries in (date range)"입니다.
  - 구현 선택(JAOO, Figure 6.9–6.13): 주별 세금을 Singleton 하위 클래스로 둘지, Calculation Strategy(Method)로 둘지, case 문으로 둘지, "multiply by rate" 매개변수로 둘지 비교합니다.
  - Figure 6.21 account finder, Figure 6.23 eligibility condition(각 Method), Figure 6.25/6.26 Accounting Practice(Type), Figure 6.27 Transaction의 creator Posting Rule.
  - eaaDev Agreement Dispatcher:
    - 의도문: "Structure a processor for Domain Events around business agreements."
    - 문제: 사건에 반응하는 처리 규칙을 찾고 바꾸기 쉬워야 하고, 사건이 늦게 도착하므로 옛 사건은 옛 규칙으로 처리해야 합니다 — "A shipping company decides to increase its charge from $10 to $15 on March 14th. On March 22nd it receives an event saying a shipment was made on March 7th. It's important that it processes this event using the rules that were valid on March 7th".
    - 구조: agreement가 "a hash map whose keys are event types and whole values are temporal collections of processors"를 가집니다. 계약의 상속은 언어 상속 대신 parent 속성으로 둡니다.
    - 평가: Adaptive Object Model의 예이며 "hard to learn and can be quite intimidating for the newcomer". 변동의 주축이 계약이 아니면 그 축으로 dispatcher를 짜라고 적습니다.
    - 코드:
      - `PostingRule(AccountType type, boolean isTaxable)`
      - `process(evt)` = `makeEntry(evt, calculateAmount(evt))` + 과세면 `generateTax(evt)`
      - `makeEntry`: `new Entry(amount, evt.getWhenNoticed())` → `evt.getSubject().addEntry(newEntry, type)` → `evt.addResultingEntry(newEntry)`
      - `ServiceAgreement.getPostingRule(event)`: `rules.get(event.getWhenOccurred())`, 없으면 `MissingPostingRuleException`
      - `EventList.process()`: 미처리 사건만 처리하고 실패는 기록 후 계속
      - `AccountingEvent.process()`: `assert !isProcessed; if (adjustedEvent != null) adjustedEvent.reverse(); subject.process(this); markProcessed();`
    - "multiple customers share the same service agreement"
    - 조합 권고: "Domain Event, Agreement Dispatcher, and Accounting Entry … works particularly well because … Accounting Entrys are easy to adjust"
- 등장 개념:
  - `Posting Rule` — 입력을 출력 계정 게시로 바꾸는 규칙 · 지식 층위(Figure 6.20 구분선 위)
  - `trigger` / `output` Account — 규칙의 입력·출력 계정 · 운영 층위(Account Type 수준이면 지식 층위)
  - `multiplier` — 단순 규칙의 계수 · 값
  - `Method` / `Calculation Strategy` — 규칙별 계산 · 지식 층위
  - `effectivity: Date Range` — 규칙 유효 기간 · 값
  - `account finder`, `eligibility condition` — 출력 계정 결정, 적용 조건(Figure 6.21, 6.23) · 지식 층위
  - `Accounting Practice` / `Accounting Practice Type` — 규칙 묶음과 그 종류(Figure 6.25, 6.26) · 지식 층위
  - `Agreement` / `ServiceAgreement` — 사건 타입별 시점 규칙 묶음 · 여러 고객이 공유하는 계약이면 지식 층위, 고객별 계약이면 운영 성격(판단)
  - `Event Type` — 사건 종류 · 지식 층위
  - `AccountingEvent`(Domain Event) — `type`, `whenOccurred`, `whenNoticed`, `subject`, resulting entries · 운영 층위
  - `Temporal Collection` — 시점별 값 저장 구조(Temporal Property 구현) · 구조
  - `Posting Rule Network` — 규칙 연쇄 · 구조
  - `Adjustment` — 정정 사건 · 운영 층위
- 관계:
  - Figure 6.7: Account `1` trigger — `*` Posting Rule, Account `1` output — `*` Posting Rule, Posting Rule `*` — `1` Number(multiplier)
  - Figure 6.8: Posting Rule `*` — `1` Method(calculation)
  - Figure 6.20: Account Type `1` trigger/output — `*` Posting Rule(지식), Employee Account `*` — `1` Account Type, `*` — `1` Employee(운영)
  - Figure 6.21, 6.23: + account finder, + eligibility condition(각 Method `1`)
  - Figure 6.25: Posting Rule `*` — `*` Accounting Practice / Figure 6.26: Accounting Practice `*` — `1` Accounting Practice Type, accounting Object(users, practice type)
  - Figure 6.27: Posting Rule `0..1` creator — `*` Transaction
  - eaaDev: ServiceAgreement → EventType별 TemporalCollection<PostingRule>, Customer → ServiceAgreement(공유), Customer → `Map<AccountType, Account>`, AccountingEvent → resulting Entries, AccountingEvent → Subject
- 모델 불변식:
  - 사건 타입과 발생 시점마다 적용 규칙이 결정적입니다(TemporalCollection `get(date)`). 없으면 오류(`MissingPostingRuleException`).
  - 사건은 한 번만 처리됩니다(`assert !isProcessed`, `markProcessed`).
  - 늦게 도착한 사건은 **발생 시점** 규칙으로 처리합니다(`whenOccurred`로 규칙 조회, Entry 날짜는 `whenNoticed`).
  - 정정 사건을 처리할 때는 원 사건을 먼저 reverse합니다.
  - 산출물은 원천에 연결됩니다(resulting entries, Transaction creator).
  - (JAOO) effectivity 기간 안의 미처리 entry만 처리합니다.

### 최소 조건 후보

- [필수] 규칙이 독립 객체(인스턴스)로 존재해 추가·교체할 수 있다 — 빠지면: `if (event.type == USAGE) … else if (SERVICE_CALL) …` 분기 서비스가 됩니다(JAOO "Procedural Approach").
- [필수] 입력(트리거 계정의 Entry 또는 사건)과 출력(대상 계정 게시)의 연결을 규칙이 맡고, 입력 쪽은 출력 계정 구조를 모른다 — 빠지면: 사용량 사건 객체가 "기본요금 계정"에 직접 Entry를 넣습니다.
- [필수] 규칙 선택 기준(트리거 계정/계정 타입, 또는 사건 타입)이 데이터로 규칙에 연결돼 있다 — 빠지면: 규칙 객체는 있지만 고르는 곳이 `switch`입니다(구 가이드 오해 지점과 같은 취지).
- [선택] 유효 기간 + 늦게 온 사건은 발생 시점 규칙
- [선택] 계정 타입 수준 규칙(지식 층위) + account finder
- [선택] Individual Instance Method / Strategy
- [선택] eligibility condition
- [선택] 규칙 네트워크(연쇄)
- [선택] 산출물 ↔ 원천 추적(resulting entries, creator)
- [선택] 출력을 균형 Transaction으로(원서 Figure 6.27. eaaDev·accounting.pdf 예제 규칙은 Entry 하나만 만듦)
- [선택] Agreement 계층(parent 속성)

### 사용 단서

- 이런 요구가 보이면: "요금 정책이 날짜별로 바뀌는데 늦게 들어온 사용량은 그때 요율로 계산", "고객 계약마다 과금 규칙이 다름", "급여 총액에서 세금·공제·초과근무가 연쇄 계산", "세금은 과세 항목에만 붙음".
- 쓰지 말아야 할 때: 규칙이 거의 안 바뀌고 몇 개뿐일 때 — Agreement Dispatcher는 학습 부담이 큰 Adaptive Object Model이라고 eaaDev가 경고합니다. 변동의 주축이 계약이 아닐 때는 Agreement 대신 그 축으로 dispatcher를 짭니다(eaaDev "If the primary point of variation for your business processing isn't the agreements, then use that alternative as the central point for your dispatcher").

### 비교 대상

- vs 서비스 계층 조건 분기(절차형): 규칙 변경이 코드 수정과 날짜 조건 누적으로 나타나는가(JAOO "Changing the Rules").
- vs Strategy(GoF): 계산 방법 교체는 Strategy로 구현할 수 있습니다(JAOO). Posting Rule은 여기에 입력·출력 계정, 유효 기간, 선택 기준을 더한 도메인 개념입니다.
- vs Knowledge Level: Posting Rule은 회계에 적용한 지식 층위입니다(Figure 6.20 구분선).
- vs Temporal Property / Effectivity(eaaDev 목록에 있음): 시점별 규칙을 저장하는 구조입니다. Agreement Dispatcher의 temporal collection은 Temporal Property의 구현이라고 eaaDev가 적습니다.
- vs 계정 매핑 테이블(OFBiz `InvoiceItemTypeGlAccount` 등): 계산 없이 출력 계정만 결정하므로 account finder 부분만 데이터화한 형태입니다(판단).
- vs hledger auto posting rule: 쿼리 매칭(트리거)과 금액 배수(`*`)를 가져 원서의 simple Posting Rule(trigger + multiplier)과 모양이 같습니다(판단).

### DDD 매핑 후보 (상황 설정 표의 재료)

- 규칙 쪽(지식 층위):
  - 선택지 A — Agreement aggregate가 사건 타입별 시점 규칙 목록을 가집니다. 같은 사건 타입의 유효 기간 비중첩·빈틈 정책을 root가 강제합니다.
    - 전제: 계약당 규칙 수가 적고, 여러 고객이 계약을 공유합니다(eaaDev ServiceAgreement 구조).
    - 장점: 규칙 교체와 기간 규칙이 한 경계 안에 있습니다. 단점: 계약 편집 시 규칙 전체를 로드합니다.
  - 선택지 B — PostingRule 하나하나를 aggregate(사건 타입, effectivity)로 둡니다. 비중첩은 저장소 제약(Range 노트의 PostgreSQL exclusion constraint 같은 방식)이나 등록 서비스로 지킵니다.
    - 전제: 규칙이 많고 독립적으로 편집합니다.
    - 장점: 작은 aggregate. 단점: 기간 불변식이 경계 밖입니다.
  - 선택지 C — 계산식은 코드(Strategy 구현)로, 선택·계정 매핑만 데이터(매핑 aggregate)로 둡니다.
    - 전제: 계산식 종류가 닫혀 있고 자주 바뀌는 것은 대상 계정과 요율뿐입니다.
    - 장점: 테스트가 쉽습니다. 단점: 새 계산식은 배포가 필요합니다.
- 실행 쪽(운영 층위):
  - 도메인 서비스(또는 프로세스 매니저)가 사건을 읽고 → 규칙을 조회(읽기)하고 → 산출(Transaction 또는 Entry)을 **새 aggregate로 생성**합니다. 한 트랜잭션에서 새 aggregate 하나를 만드는 형태면 Vernon 규칙에 맞습니다(판단).
  - "사건 처리됨" 표시: Fowler는 사건 객체에 `markProcessed`합니다. DDD로 옮기면 사건(또는 처리 기록) 수정과 산출 aggregate 생성이 두 aggregate 작업이 됩니다. 대안(판단)은 산출물에 `sourceEventId`(+ 규칙 id) 유일 제약을 두고 "처리 여부 = 산출물 존재"로 파생하거나, 처리 기록을 결과적으로 갱신하는 것입니다.
- 사건: Domain Event는 불변입니다(Evans DDD Reference "Domain events are ordinarily immutable, as they are a record of something in the past").
- BC 한 줄 후보(판단): "과금·전기 — 업무 사건을 계약 규칙에 따라 원장 기록으로 바꾼다." 원장 BC와 분리할 수 있습니다.
- 공회전 판단: 공회전하지 않지만, 규칙(지식)과 실행(운영) 두 벌의 표가 필요합니다(판단).

### 세 언어 구현 쟁점

- 시점별 규칙 조회: 정렬된 맵에서 "해당 날짜 이하의 가장 큰 키"를 찾는 구조가 필요합니다. Java는 `TreeMap`(NavigableMap), Rust는 `BTreeMap`의 범위 조회가 후보이고, TypeScript 표준 컬렉션에는 정렬 맵이 없어 정렬 배열 이진 탐색이 필요합니다(판단 — 세 API 문서는 이 조회에서 확인 안 함).
- 계산 규칙 교체: Java 인터페이스·람다(닫힌 집합이면 sealed, JEP 409), TypeScript 함수 값, Rust `Box<dyn Trait>`(판단).
- 금액 계산:
  - 사용량(Quantity) × 요율 → 반올림 규칙이 필요합니다. Java `BigDecimal.divide`는 나누어떨어지지 않으면 `ArithmeticException`이라 반올림 방식을 명시해야 합니다.
  - eaaDev 예제는 `Money.dollars(usageEvent.getAmount().getAmount() * usageEvent.getRate())`로 `double` 요율을 곱합니다 — 예제를 그대로 옮기면 금액 정밀도 문제가 재현됩니다(판단 — 코드 관찰).
- 멱등 키: 사건 id + 규칙 id로 산출 id를 결정적으로 만드는 방식(판단). 언어별 이름 기반 UUID 지원은 확인 안 함.

### 실제 사례

- hledger auto posting rules:
  - "The = directive declares an 'auto posting rule', which adds extra postings to existing transactions."
  - `--auto` 플래그로 실행하면 QUERY에 맞는 posting마다 규칙의 posting을 그 거래에 추가합니다.
  - 금액에 `*`를 쓰면 매칭된 posting 금액의 배수입니다("adding tax postings with a standard percentage").
  - 생성된 posting은 보고서 실행 동안만 존재하는 임시값입니다.
- Evans 『Domain-Driven Design』 Chapter 11 「Applying Analysis Patterns」: 장 제목은 InformIT 목차로 확인했습니다. 원서 'Inventory and Accounting' 장의 모델을 쓰는 두 예("Earning interest with accounts", "Posting rules")는 **보조 출처**(독서 노트)로만 확인했습니다.
- Apache OFBiz: `GlAccountTypeDefault`(glAccountTypeId, organizationPartyId → glAccountId), `InvoiceItemTypeGlAccount`(invoiceItemTypeId, organizationPartyId → glAccountId) — 업무 항목 유형을 원장 계정으로 매핑하는 데이터입니다(account finder에 해당 — 판단).
- 구 가이드의 통신 BSS 레이팅/빌링, ERP 회계 규칙 엔진: 1차 링크 확인 안 함.

### 기존 가이드 승계분

- 최소 조건 취지: ① 규칙의 객체화 ② 사건과 처리의 분리(사건 측이 계정 구조를 모름) ③ 규칙 적용 매핑의 데이터화(가능하면 유효 기간 포함). 오해 지점으로 적용 분기를 결국 if-else로 처리, 규칙에 유효 기간이 없어 과거 사건을 과거 규칙으로 재처리 못 함, 균형 Transaction을 만들지 않고 한쪽 계정만 건드림을 들었습니다.
- 참고 자료(기존 목록): Fowler 1997 Posting Rules / Using the Accounting Models / martinfowler.com/books/ap.html / 통신 BSS 레이팅·빌링, ERP 회계 규칙 엔진
- 주의(판단): 구 가이드는 "출력은 항상 합 0의 Transaction이어야 한다"를 오해 지점으로 규정합니다. 그러나 eaaDev 2005와 accounting.pdf 코드의 규칙은 고객 계정에 Entry 하나만 만들고, 원서 Figure 6.27은 Transaction의 creator입니다. 출력 단위는 원전만으로 하나로 정해지지 않으므로 배경 확정안에서 정해야 합니다.

### 출처

- [Analysis Patterns 목차 (Pearson PDF)](https://www.pearson.de/media/muster/toc/toc_9780134271439.pdf) — §6.5–§6.11, Chapter 7 §7.1–§7.9 · 조회 2026-09-17
- [Analysis Patterns (Google Books)](https://books.google.com/books/about/Analysis_Patterns.html?id=4V8pZmpwmBYC) — Chapter 7 시작 133쪽 · 조회 2026-09-17
- [UML Diagrams for Chapter 6 (apchap6.pdf)](https://martinfowler.com/apsupp/apchap6.pdf) — Figure 6.7–6.13, 6.20, 6.21, 6.23, 6.25–6.27, 대체 머리말 · 조회 2026-09-17
- [Accounting Patterns 개정 초안 (accounting.pdf)](https://martinfowler.com/apsupp/accounting.pdf) — 2000-12-09, 본문 추출 불가, Event→Agreement→Posting Rule→Accounting Entry 그림 라벨과 PostingRule·AccountingEvent 코드 판독 · 조회 2026-09-17
- [Analysis Patterns 튜토리얼 슬라이드 (Fowler, JAOO 1999)](http://jaoo.dk/jaoo1999/schedule/MartinFowlerAnalysisPatterns.pdf) — simple Posting Rule, Individual Instance Method, Account Types, Network, 실행, effectivity, Singleton vs Strategy · 조회 2026-09-17
- [Agreement Dispatcher (eaaDev, 2005-03-11)](https://martinfowler.com/eaaDev/AgreementDispatcher.html) — 의도문, 늦은 사건 예, 구조, 사용 시점, 코드 · 조회 2026-09-17
- [eaaDev 목록](https://martinfowler.com/eaaDev/) — Posting Rule 독립 페이지 없음, 2006 여름 이후 작업 중단 · 조회 2026-09-17
- [Patterns for Accounting (eaaDev, 2006-01-24)](https://martinfowler.com/eaaDev/AccountingNarrative.html) — 사건 처리와 Accounting Transaction, Retroactive Event 정정 · 조회 2026-09-17
- [Reversal Adjustment (eaaDev, 2006-01-02)](https://martinfowler.com/eaaDev/ReversalAdjustment.html) — 역전 entry를 원 사건에 부착, adjusted 표시 · 조회 2026-09-17
- [Accounting Entry (eaaDev, 2005-01-22)](https://martinfowler.com/eaaDev/AccountingEntry.html) — Entry를 원인 Domain Event에 연결 · 조회 2026-09-17
- [Domain-Driven Design Reference (Evans, 2015)](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) — Domain Events(13쪽) 불변성 · 조회 2026-09-17
- [Domain-Driven Design 목차 (InformIT)](https://www.informit.com/store/domain-driven-design-tackling-complexity-in-the-heart-9780321125217) — Chapter 11 Applying Analysis Patterns · 조회 2026-09-17
- [Domain Driven Design by Eric Evans Notes (보조 출처)](http://www.withouthaste.com/codeNotes/domainDrivenDesign.php) — Chapter 11의 두 예 "Earning interest with accounts", "Posting rules" · 조회 2026-09-17
- [Effective Aggregate Design Part I (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf) — 한 트랜잭션 한 aggregate · 조회 2026-09-17
- [Effective Aggregate Design Part II (Vernon)](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf) — 결과적 일관성 · 조회 2026-09-17
- [TigerBeetle: Reliable Transaction Submission](https://docs.tigerbeetle.com/coding/reliable-transaction-submission/) — id 멱등성 키 · 조회 2026-09-17
- [hledger manual](https://hledger.org/hledger.html) — auto posting rules · 조회 2026-09-17
- [OFBiz accounting-entitymodel.xml](https://github.com/apache/ofbiz-framework/blob/trunk/applications/datamodel/entitydef/accounting-entitymodel.xml) — GlAccountTypeDefault, InvoiceItemTypeGlAccount 필드 · 조회 2026-09-17
- [BigDecimal (Java SE 21)](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/math/BigDecimal.html) — divide의 ArithmeticException · 조회 2026-09-17
- [JEP 409: Sealed Classes](https://openjdk.org/jeps/409) — Release 17 · 조회 2026-09-17

### 미해결 질문

1. 원서 §6.5 「Posting Rules」의 쪽 — 확인 안 함.
2. **출력 단위**: Entry 하나(eaaDev 2005, accounting.pdf 코드)인가, 균형 Transaction(원서 Figure 6.27, 구 가이드)인가 — 배경 확정안 결정 사항.
3. **트리거 방식**: 계정 트리거형(1997)과 사건 트리거형(2000/2005) 중 가이드의 기준 모델 — 결정 사항.
4. accounting.pdf 본문 서술 — 텍스트 추출 불가, OCR은 시도하지 않음.
5. Figure 6.27의 sources/consequences 연관 의미 — 판독 불가.
6. Evans Chapter 11 "Posting rules" 예제의 실제 내용 — 보조 출처로만 확인.
7. Agreement의 층위: 여러 고객이 공유하는 계약 템플릿(지식)인가, 고객별 계약(운영)인가 — 가이드 결정 사항.
8. §6.9 Choosing Entries, §6.10 Accounting Practice의 서술 — 확인 안 함.
9. Chapter 7 전화 과금 예의 규칙 구성 — 확인 안 함.

### 배경 확정안 재료

**1. Posting Rule이 Entry를 만드는 흐름 (세 출처 병행)**

- 원서 1997(apchap6 그림 + JAOO):
  1. 트리거 계정(또는 계정 타입에 속한 개별 계정)에서 미처리 Entry를 조회합니다. effectivity가 있으면 기간 안의 것만 봅니다.
  2. 규칙이 계산합니다(multiplier 또는 Method).
  3. 출력 계정에 Entry를 게시합니다.
  4. Transaction의 creator는 Posting Rule입니다(Figure 6.27). 규칙 네트워크로 연쇄합니다.
- accounting.pdf 2000-12(판독, 본문 추출 불가): Event → `findAgreement(Event)` → Agreement → `getRule(EventType, Date)` → Posting Rule(`effectivity: Date Range`) → creates Accounting Entry. Event — Accounting Entry(`source`). Adjustment(old events / replacement / adjusted event). 흐름을 설명하는 본문 문장은 확인 안 함.
- eaaDev 2005:
  1. `EventList.process()`가 미처리 사건마다
  2. `AccountingEvent.process()`: `assert !isProcessed` → 정정 사건이면 `adjustedEvent.reverse()` → `subject.process(this)`
  3. `Customer.process(e)` → `serviceAgreement.process(e)`
  4. `getPostingRule(e)`: 사건 타입의 temporal collection에서 `whenOccurred` 시점 규칙
  5. `PostingRule.process(evt)`: `calculateAmount(evt)` → `makeEntry(evt, amount)`: `new Entry(amount, whenNoticed)` → `subject.addEntry(entry, accountType)` → `evt.addResultingEntry(entry)` → 과세면 `generateTax(evt)`
  6. `markProcessed()`
- 소유/참조(판단): 사건이 결과 Entry를 참조(resulting entries)하고, Entry는 고객의 AccountType별 Account에 추가됩니다. **eaaDev 예제에는 Accounting Transaction이 없습니다.**

**2. 복식부기 균형 불변식은 어디에 있는가**

- eaaDev 예제 규칙은 Entry 하나를 만들고 균형을 검사하지 않습니다. 서술(2006)은 Accounting Transaction을 선택으로 봅니다.
- 복식부기를 요구하면(판단): 규칙의 출력 단위를 균형 Transaction으로 두고, 다리 쌍을 만드는 책임은 규칙에, Σ=0 검사는 Transaction에 둡니다(Transaction 노트 「배경 확정안 재료」 2).

**3. Vernon 4규칙을 적용할 때의 쟁점**

- **중복 전기 방지(멱등성)**: Fowler는 사건 객체의 `isProcessed` 표시로 막습니다. DDD에서는 사건(또는 처리 기록)과 산출물이 다른 aggregate라 세 방식 중 하나를 고릅니다(판단).
  - (a) 산출 Transaction id를 f(사건 id, 규칙 id)로 결정적으로 만들고 유일 제약을 둡니다 → 재처리하면 중복이 거부됩니다. TigerBeetle의 "id = idempotency key" 방식을 응용한 것입니다.
  - (b) 처리 기록 수정과 산출 생성을 한 트랜잭션으로 묶습니다(Vernon 규칙 예외).
  - (c) 산출 후 처리 기록을 결과적으로 갱신합니다 — (a) 없이 재시도하면 중복 위험이 남습니다.
- **취소·정정**:
  - 잘못된 사건은 새 사건(Retroactive Event)이 대체합니다. 원 사건의 결과 Entry를 역전(Reversal — 역전 entry는 원 사건에 붙이고 원 사건을 adjusted로 표시)한 뒤 새 사건을 처리합니다(eaaDev Reversal, `adjustedEvent.reverse()`). Replacement·Difference도 선택지입니다(Transaction 노트 「배경 확정안 재료」 3).
  - 재처리할 때는 발생 시점 규칙을 씁니다(Agreement Dispatcher).
- **동시 처리**: 같은 고객 계정에 여러 사건의 산출이 동시에 게시됩니다 → Account 노트 「배경 확정안 재료」 3. 규칙 계산이 **현재 잔액을 입력으로 쓰면**(예: 누진·한도 요율) 잔액 지연이나 경합이 곧 계산 오류가 되므로, 그런 규칙만 동기 잔액이 필요합니다(판단).
- **규칙 변경**: 시점별 규칙은 규칙 aggregate 안에서 같은 사건 타입의 유효 기간이 겹치지 않아야 합니다(Range 노트의 컬렉션 불변식). 산출물에 적용한 규칙 id·버전을 남기는 것은 감사용 후보입니다(판단).
- **파생 balance의 지연 허용 여부**: 위 "동시 처리"의 잔액 입력 규칙과 같은 쟁점입니다.

**4. Entry 소속 선택지와의 연결**

- 규칙 출력이 Entry 하나면 ③(Entry 홀로 존재), 균형 Transaction이면 ①(Transaction이 가짐)입니다.
- 규칙 실행이 고객 Account에 Entry를 직접 추가하는 eaaDev 모양(`subject.addEntry`)은 ②(Account가 가짐)입니다(Account 노트 「배경 확정안 재료」 4).

**5. consideration 두 문서와의 관계**

- 두 문서 모두 Posting Rule을 다루지 않습니다.
- 「account-transaction-entry-modeling」의 `TransferService`가 거래 다리를 직접 구성하는 자리는, Posting Rule을 도입하면 규칙으로 옮겨갈 자리입니다(판단).
- 「Account와 Entry의 관계 설계」의 "불변식 위치를 먼저 확정하라"는 원칙은 규칙 출력 단위(Entry vs Transaction) 결정에도 그대로 적용됩니다(판단).

---

## 교차 메모

**10패턴 사이 의존 (근거 그림·문서)**

- Accountability → Party: commissioner/responsible 양 끝이 Party입니다(Figure 2.8).
- Accountability → Knowledge Level: Accountability Type, Party Type(Figure 2.9).
- Accountability → 기간 값: Time Period(Figure 2.8). 원서의 Time Period는 Range가 아니라 Time Record 하위 타입입니다(Figure 3.11). 구 README의 "Range는 Accountability 유효 기간 …에 쓰인다"는 원서 표기와 다릅니다(원서 Range는 §4.3).
- Accountability(Operating Scope) → Quantity: Resource Provision `amount: Quantity`(Figure 2.14).
- Measurement → Quantity: `quantity: Quantity`(Figure 3.6).
- Measurement → Knowledge Level: Phenomenon Type(Figure 3.6).
- Measurement ⊂ Observation: 의존이 아니라 일반화입니다 — Measurement는 Observation의 하위 타입입니다(Figure 3.7).
- Observation → Knowledge Level: Phenomenon Type, Phenomenon, Observation Concept, Protocol(Figure 3.9, 3.10).
- Observation(Phenomenon with Range) → Range(Figure 4.22, JAOO).
- Range → Quantity: Age Band 경계가 시간 단위 Quantity입니다(Figure 4.20 제약). 끝점 일반형은 비교 가능한 Magnitude입니다.
- Account → Quantity: balance와 Entry amount가 Quantity입니다(Figure 6.1). Money는 Quantity의 일종입니다(JAOO).
- Account → Range: `balance(DateRange)`(eaaDev Account).
- Account → Party: Figure 6.29 owner/classifier 연관(판독).
- Account → Knowledge Level: Account Type(Figure 6.20).
- Transaction → Account: Entry가 Account에 게시됩니다. eaaDev "it really only makes sense to use Accounting Transaction if you're using Account".
- Posting Rule → Account(trigger/output, Figure 6.7), → Transaction(creator, Figure 6.27), → Knowledge Level(Account Type, Figure 6.20), → Range(`effectivity: Date Range` — JAOO, accounting.pdf 라벨), → Quantity(Usage `amount: Quantity` — eaaDev).
- 10편 밖에 있지만 여러 편이 기대는 개념:
  - Time Point / Time Period — Accountability, Measurement·Observation의 Dual Time Record, Account Entry의 whenCharged/whenBooked
  - Domain Event — Posting Rule(2005), Accounting Entry
  - Temporal Property / Effectivity — Posting Rule 시점 규칙
  - Adjustment 3종 — Transaction·Posting Rule 정정
  - Type Object — Knowledge Level

**집필 순서에 대한 관찰(판단)**

- 의존 방향으로 보면 Quantity·Range(값) → Party → Knowledge Level → Accountability → Measurement → Observation → Account → Transaction → Posting Rule 순서가 자연스럽습니다.
- 구 README 분류(기반 추상 → 값 모델링 → 관찰/측정 → 회계)와 달리, 값 패턴과 Knowledge Level이 Accountability보다 먼저 필요합니다.

**원전 대비 명칭·근거 정정 두 가지**

- Observation / Category Observation: 원서의 Observation은 Measurement와 Category Observation의 상위 타입입니다. 구 가이드는 Category Observation을 Observation이라 불렀습니다(Measurement·Observation 노트).
- 회계 3패턴의 근거 세대: 원서 6장(1997) → accounting.pdf(2000-12, Fowler가 6장 대체로 표시, 본문 추출 불가) → eaaDev(2005–2006). 원서의 "Account / Transactions / Posting Rules"는 eaaDev에서 "Account / Accounting Entry / Accounting Transaction / Agreement Dispatcher"로 재편됐고, Posting Rule 독립 페이지는 없습니다.

**DDD 전술 용어 기준선 문서에 대한 관찰**

- 10편 모두 상황 설정 표(BC / 불변식의 위치 / root·entity·VO 배정 / 타 aggregate 참조 방식)를 요구합니다. 이 노트의 DDD 매핑 절에서 반복해 필요했던 정의는 Entity, Value Object, Aggregate, Repository, Domain Event, Bounded Context, 불변식과 일관성 경계, 결과적 일관성, 멱등 키, Vernon 4규칙과 예외 사유입니다. 편마다 다시 정의하면 문구와 해석이 갈라집니다(판단).
- 기준선 1편에 필요한 것(판단):
  1. **정의는 1차 출처 문장으로.** Evans DDD Reference는 Creative Commons Attribution 4.0 라이선스라(문서 표지 명시) 정의 문장을 출처와 함께 인용할 수 있습니다. 쪽: Entities 11, Value Objects 12, Domain Events 13, Aggregates 16, Repositories 17, Knowledge Level 51.
  2. **Vernon 규칙 원문 제목**: "Model True Invariants In Consistency Boundaries", "Design Small Aggregates"(Part I), "Reference Other Aggregates By Identity", "Use Eventual Consistency Outside the Boundary"(Part II). 여기에 Part I의 "modifies only one aggregate instance per transaction"과 Part II의 "Reasons To Break the Rules"(UI 편의, 기술 메커니즘 부족, 전역 트랜잭션, 조회 성능)를 더합니다.
  3. **분석 층위 용어**: 지식 층위 / 운영 층위, 분석 모델(연관만 정의)과 구현 경계(소유 결정)의 차이, apsupp 그림 표기(`{hierarchy}`, `{dag}`, `«dynamic»`, 파생 `/`) 읽는 법.
  4. **상황 설정 표 4칸의 뜻과 공회전 처리 규칙**: VO 계열(Quantity, Range)과 구조 패턴(Knowledge Level)은 표가 비므로 "그 값·구조를 품는 aggregate 예제로 채운다" 또는 "VO 전용 축약 표를 쓴다"를 공통 규칙으로 정해야 합니다.
  5. **코드 공통 약속**: aggregate 간 객체 참조 0(id 타입 사용), 금액 표현(최소 단위 정수 vs 10진), 시간 구간 경계 규칙(양 끝 포함 vs 반열림). 개념 정의는 Quantity·Range 편이 하고, 프로젝트 기본값 선택은 기준선이 정하는 분담입니다.
  6. **공통 예제 도메인 고정**: 회계 배경 확정안을 Account·Transaction·Posting Rule 세 편이 공유해야 Entry 소속 결정(이 노트의 선택지 ①~④)이 편마다 어긋나지 않습니다.
- 같은 디렉토리의 candidates.md도 DDD 전술 용어 기준선 1편을 채택 권고 1순위로 올려 두었습니다.

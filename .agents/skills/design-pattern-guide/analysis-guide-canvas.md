<!-- @write: analysis-guide 1.1.0 캔버스. 절 헤딩의 문구·레벨·순서를 바꾸지 않는다(최소 조건 헤딩은 design-pattern-analyzer 계약). 상황 설정 표의 헤더와 행 라벨도 바꾸지 않는다. 작성 방법의 정본은 spec.md 이고 아래 지시는 그 요약이다. 최종본에는 슬롯·집필 지시·조건 블록 표식이 하나도 남지 않는다. 문체는 voice 가 정한다. -->

# {{ title.pattern }} — {{ title.subtitle }}

<!-- @write: title — 패턴 자리는 원전(Fowler)의 패턴 이름. 부제는 이 패턴의 비결을 한 구절로 예고한다. 분류명이나 가이드 같은 낱말로 채우지 않는다. -->

## 한눈에 보는 개요

<!-- @write: overview — 네 가지를 모두 싣는다. ① 이 개념을 모델에 두지 않으면 어디가 아픈가를 구체 상황 하나로 ② 패턴이 그 아픔을 없애는 한 수 ③ 문제에서 해결로의 전후를 보이는 그림 1개(text 도식 또는 diagrams/ 의 viz 도식 이미지) ④ 분류(원전의 장 범주)와 함께 쓰는 패턴 한 줄. 정의·절차·코드는 뒤 절로 미룬다. 활용성 별점·난이도 같은 평가 수치 금지(PG2·PG22). -->

{{ overview.body }}

## 패턴 자세히 들여다보기

### 등장하는 개념과 정의

<!-- @write: detail.terms — 패턴이 모델링하는 분석 층위의 도메인 개념과 그 관계를 하나도 빠짐없이 정의한다. Entity·Value Object·Aggregate 같은 DDD 전술 분류는 여기서 매기지 않는다(상황 설정 표의 몫). 뒤 절에서 정의 없는 이름이 튀어나오면 미흡. 정의 목록 바로 뒤에 diagrams/ 의 클래스 구조 도식 이미지 1개를 개념 모델(연관·다중도)로, 전술 분류 스테레오타입 없이, 클래스 이름은 정의 목록과 1:1(PG3·PG4·AG1). -->

{{ detail.terms.body }}

### 동작 절차

<!-- @write: detail.procedure — 개념들이 어떤 순서로 협력해 업무 사건 하나를 처리하는가를 번호 단계로 빠짐없이 쓴다. 한 단계는 한 협력. 단계마다 왜 그 개념이 그 일을 맡는지, 또는 순서를 바꾸면 어떤 불변식이 깨지는지 붙인다. 절차가 갈라지면 갈래마다 따로 적는다(PG5). -->

{{ detail.procedure.body }}

## 사용 목적

<!-- @write: purpose — 이 패턴을 꺼내게 하는 단서를 업무 요구나 기존 모델에서 관찰되는 구체 상황으로 2개 이상. 유연성·확장성 같은 추상 서술은 단서가 아니다. 쓰지 말아야 할 경우를 1개 이상, 그때 잃는 것과 함께. 비슷한 단서에서 다른 패턴을 고르는 경우는 한 줄 예고만 하고 차이는 경계 절로 넘긴다(PG6·PG7). -->

{{ purpose.body }}

## 패턴의 경계

### 디자인 패턴을 충족하는 최소 조건

<!-- @write: boundary.minimum — 조건마다 맨 앞에 대괄호로 감싼 필수 또는 선택 표기를 붙인다(spec.md 의 표기 그대로). 필수는 1개 이상이고, 빠지면 그 패턴이 아니게 되는 것만 필수다. 조건은 개념적 책임 분리(어떤 개념이 무엇을 책임지는가)와 모델 불변식으로 쓴다. 클래스 구조·필드 배치·상속·컬렉션 소유를 조건으로 삼지 않는다. 필수 조건마다 빠지면 무엇이 되는지 구체 반례. 필수 조건마다 괄호로 원전 근거(근거: 원서·저자 보충 자료의 해당 자리)를 달고, 원전이 흔한 규칙·구현 선택지로 적은 것이나 이 가이드 예제의 정책은 필수가 아니라 선택에 둔다. 불변식은 산문이 아니라 조건 항목으로 올린다(PG8·PG9·PG10·PG27·AG2). -->

{{ boundary.minimum.body }}

### 비슷한 패턴·안티패턴과의 차이

<!-- @write: boundary.compare — 비교 대상 2개 이상(비슷한 분석 패턴이나 오해하기 쉬운 모델링 안티패턴). 대상마다 모델에서 확인할 수 있는 구분 기준 한 문장을 먼저 두고, 이어서 이 패턴을 고르면 얻는 것과 포기하는 것. 공통점 나열로 채우지 않는다. 오인 코드 펜스는 정보 문자열을 언어 이름 뒤에 no-compile 을 붙인 꼴로 단다(PG11·PG12·PG13·PG14). -->

{{ boundary.compare.body }}

## 구현 예시

### 상황 설정

<!-- @write: example.context — 표 앞에서 도메인 하나와 요구 전제를 산문으로 적고 예시 타입 이름이 어느 개념인지 매핑한다(PG15). 이어지는 표는 행 4개, 헤더와 라벨의 문구·순서를 바꾸지 않고 빈 칸을 두지 않는다. bounded context 칸은 한 줄. 타 aggregate 참조 방식은 id 참조로, 무엇이 무엇을 어떤 id 로 가리키는지까지. 표에서 처음 쓰는 DDD 전술 용어(Bounded Context·Aggregate·Aggregate Root·Entity·Value Object 등)는 셀 안 괄호나 표 바로 아래 목록에서 한 줄로 정의한다(잠정 규칙). 값 객체 계열에서 칸이 자명해 보여도 비우지 않는다. 표 아래에 불변식의 위치 칸의 불변식 전부와 참조 방식 칸의 id 참조 전부를 한 행씩, 다른 곳에 두거나 객체 참조로 바꾸면 어느 동작에서 무엇이 어긋나는지 수치·상태로 적은 경계 반례 표를 둔다(AG3·AG4·AG5·AG13). -->

{{ example.context.body }}

| 항목 | 이 가이드의 설정 |
| --- | --- |
| bounded context | {{ example.context.bounded_context }} |
| 불변식의 위치 | {{ example.context.invariant_location }} |
| root·entity·VO 배정 | {{ example.context.assignment }} |
| 타 aggregate 참조 방식 | {{ example.context.reference }} |

<!-- @if: family=accounting -->
<!-- @write: 회계 계열(Account·Transaction·Posting Rule)에만 해당한다 — 회계 배경 확정안(paths.json 의 dirs.research 아래 accounting-context.md)을 링크로 인용하고, 위 표의 네 칸을 확정안과 일치시킨다. 확정안에 없는 경계 결정이 필요하면 본문에서 정하지 말고 게이트 보고에 올린다. 회계 계열이 아니면 이 조건 블록을 통째로 지운다(AG9). -->

{{ example.context.accounting_citation }}
<!-- @end -->

### 구현

<!-- @write: example.impl — 아래 세 펜스를 이 순서 그대로 채운다: java, typescript, rust. 세 펜스 사이에 산문·헤딩을 끼우지 않는다(HTML 파생본에서 탭 하나로 묶인다). 펜스마다 단독 파일로 컴파일돼야 한다(Java 21 · TypeScript strict · Rust 2021 edition). 표준 라이브러리만, 생략 표기 없음, 빈 펜스 금지. 세 펜스 모두 같은 시나리오를 같은 개념·타입 이름으로 구현하고 진입점(Java main · TypeScript 최상위 호출 · Rust fn main)을 갖는다. 상황 설정 표와 1:1 — root 타입은 표의 root 뿐, entity 는 식별자, VO 는 식별자 없이 불변, 불변식의 위치 칸이 가리킨 root 메서드가 그 불변식을 검사한다. aggregate 타입의 필드·메서드 시그니처에 다른 aggregate 타입 금지(id 타입으로만). aggregate 안의 변경은 root 메서드로만. 펜스마다 250줄 이하. 코드의 정본은 가이드 폴더의 code/ 실행 파일이고 본문 펜스는 거기서 가져오며, 실행 출력은 code/expected-output.txt 와 같은 펜스로 싣는다(PG16·PG17·PG18·PG19·PG28·PG29·AG6·AG7·AG8). -->

```java
```

```typescript
```

```rust
```

<!-- @write: example.impl 해설 — 세 펜스 뒤에 한 번만 쓴다. 핵심 라인을 짚을 때 세 언어의 대응 줄을 함께 가리킨다. 표의 네 칸이 코드의 어디에 나타나는지(root 메서드의 불변식 검사, id 타입 참조) 짚는다. 같은 해설을 언어마다 반복하지 않는다(PG15·PG20). -->

{{ example.impl.notes }}

<!-- @if: boundary_options=multiple -->
### 상황이 달라지면

<!-- @write: example.alternatives — 이 패턴의 개념을 aggregate 로 묶는 경계 선택지가 둘 이상 성립할 때만 싣는다. 상황 · 경계 · 이유 세 열의 표로, 이 가이드가 고른 경계도 한 행으로 넣고 행은 필요한 만큼 늘린다. 상황 칸은 그 경계가 맞는 업무 조건, 경계 칸은 누가 root 이고 무엇이 누구 안에 있는가, 이유 칸은 그 조건에서 지키는 불변식이나 치르는 비용. 회계 계열(Account·Transaction·Posting Rule)은 반드시 싣고 Entry 소속 네 가지(Transaction 이 가진다 / Account 가 가진다 / 홀로 존재한다 / 별도 entity 로 존재하고 Account 가 그에 대한 VO 를 가진다)를 각각 한 행으로 둔다. 해당 없으면 이 조건 블록을 헤딩째 지우고 사유는 게이트 보고에만 남긴다(AG10·AG11·PG23). -->

| 상황 | 경계 | 이유 |
| --- | --- | --- |
| {{ example.alternatives.1.situation }} | {{ example.alternatives.1.boundary }} | {{ example.alternatives.1.reason }} |
<!-- @end -->

<!-- @if: realworld=sourced -->
### 실제 사례

<!-- @write: example.realworld — 출처 링크로 확인한 실제 사례(시스템·표준·공개 문서)만 싣는다. 사례마다 그 시스템·문서의 어느 개념이 패턴의 어느 개념에 대응하는지 매핑한다. 확인된 사례가 없으면 이 조건 블록을 헤딩째 지우고 사유는 게이트 보고에만 남긴다(PG21·PG23·AG12). -->

{{ example.realworld.body }}
<!-- @end -->

## 스스로 점검하기

<!-- @write: selfcheck — 본문을 정독해야 풀리는 문제로 마무리한다. 최소 조건을 적용해 주어진 모델이 이 패턴인지 판정하는 문제를 1개 이상 넣고, 비슷한 패턴 판별 문제와 상황이 바뀌면 경계가 어떻게 바뀌는지 또는 책임을 옮기면 어떤 불변식이 깨지는지 추적하는 문제를 섞는다. 문제 속 코드에는 no-compile 을 달지 않는다(PG14·PG26). -->

{{ selfcheck.body }}

## 참고 자료

<!-- @write: refs — Fowler 원전(Analysis Patterns)의 해당 장·절을 맨 앞에 적는다. 본문에서 출처로 단 링크를 전부 모으고(회계 계열은 배경 확정안 포함), 항목마다 본문의 무엇을 뒷받침하는지 한 구절을 붙인다. 리서치 노트에만 있고 본문이 쓰지 않은 출처는 올리지 않는다(PG24·PG25). -->

{{ refs.body }}

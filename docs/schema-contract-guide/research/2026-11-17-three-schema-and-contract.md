---
title: 세 층 스키마와 계약을 정의하고 설계하는 이론 — 리서치
topic: 외부·개념·내부 스키마(ANSI/SPARC)와 계약, 설계의 씨앗이 되는 입력 형식, 거친 자료에서 스키마 뽑기
collected: 2026-11-17
sources_count: 140
---

## 개요

장편 가이드 「세 층 스키마와 계약」의 집필 재료로 모은 자료입니다. 조사는 네 갈래(세 층 스키마의 원전과 외부 스키마, 개념 스키마 방법론과 내부 스키마, 계약과 스키마 진화, 설계 입력 형식과 거친 자료)로 나눠 동시에 진행했고 이 문서에서 합쳤습니다. 핵심 결론은 이렇습니다. 세 층의 정의와 100% 원칙·개념화 원칙은 ISO/TR 9007과 1985년 ANSI/SPARC 후속 보고서로 1차 확인이 되지만, 1977/78 최종 보고서 원문의 데이터 독립성 정의와 Batini·Ceri·Navathe 1992 책 본문은 확인하지 못했습니다. 현대 API 형식을 "외부 스키마"라고 부르거나 계약과 외부 스키마를 직접 잇는 문헌도 찾지 못했으므로, 가이드에서는 그 연결을 이 가이드의 해석으로 밝혀 씁니다.

확인 수준 표시는 절마다 붙였습니다. [1차]는 원문이나 공식 문서를 직접 본 것, [2차]는 다른 문헌의 인용이나 서지 기록만 본 것, [요약]은 검색 결과 요약만 본 것입니다.

## 1. 세 층 스키마의 원전과 정의

확인 수준 표시: [1차]는 원문이나 공식 문서를 직접 열어 본 것, [2차]는 다른 문헌의 인용이나 서지 기록만 본 것입니다.

### 1.1 서지

- ANSI/X3/SPARC Study Group on Data Base Management Systems, "Interim Report 75-02-08", *FDT (Bulletin of ACM SIGFIDET/SIGMOD)* 7(2), 1975, pp.1–140 (S4, S5). 본문 미열람.
- 최종 보고서: D. Tsichritzis, A. Klug 편, "The ANSI/X3/SPARC DBMS Framework. Report of the Study Group on Data Base Management Systems", AFIPS Press, 1977 (ISO/TR 9007 참고문헌 [2]) (S1). 학술지판 *Information Systems* 3(3), 1978, pp.173–191, DOI 10.1016/0306-4379(78)90001-7 (S6, 서지만 확인). 두 판의 차이는 미확인.
- Klug, Tsichritzis, "Multiple View Support within the ANSI/SPARC Framework", VLDB 1977, pp.477–488 (S7, 초록만).

### 1.2 세 층의 정의 [1차, 단 원전을 요약한 1985년 후속 보고서]

NBS IR 85-3173(ANSI/X3/SPARC 산하 DAFTG, 1985-05) §2.2에서 직접 확인 (S3).

- 개념 스키마: "The conceptual schema serves as an information model of the enterprise" (p.9). 기업이 관심을 두는 개체·속성·관계, 무결성·보안 제약을 기술하며 데이터 모델에 근거해야 한다.
- 내부 스키마: 무엇이 어떻게 저장되는지 규정한다. 효율을 반영한 저장 구조의 추상 모델이며 표현 방식과 접근 경로가 여기에 속한다 (p.9).
- 외부 스키마: 외부 수준에는 외부 뷰가 여럿 있고, 각 뷰는 특정 응용이 관심을 두는 개체·속성·관계를 나타내는 데이터 객체 집합이다. 각 뷰에 그 객체를 응용에 보일 형태로 기술한 외부 스키마가 붙는다 (p.11).
- 사상: 그림 2.1에 외부–개념 사상, 개념–내부 사상, 저장 사상이 있다. 실행 시 변환기가 요청을 층마다 번역한다 (pp.10, 13).
- 목적: 개념 스키마를 효율 고려와 응용별 요구에서 떼어 "relatively stable description of the enterprise model"로 둔다. "This flexibility and adaptability is usually called data independence." (p.11)

ISO/TR 9007의 요약 (S1 p.9): 개념 스키마는 데이터베이스에 담길 수 있는 정보 내용의 "unique central description"이다. "Each external schema is therefore derived from the common conceptual schema." 내부 스키마도 개념 스키마에서 파생된다. 개념 관점은 의미, 외부 관점은 바깥 형식, 내부 관점은 컴퓨터 안 물리 표현에 집중한다.

### 1.3 1975 중간 보고서의 용어 [2차]

Partridge 외(2025)가 중간 보고서를 인용한 부분 (S2 §5.4): 개념 모델은 "a collection of objects that represent the entities in an enterprise". 개념 스키마와 개념 데이터로 이루어지며 TR 9007은 뒤의 것을 정보 베이스라고 부른다. 외부·내부 두 층은 당시에도 흔했고, 세 번째 층인 개념 층을 명시해야 한다는 것이 보고서의 주장이었다.

### 1.4 논리적·물리적 데이터 독립성

- 원전(Tsichritzis·Klug)의 정의 문장은 미확인 (open question).
- ISO/TR 9007 §1.10 개념 스키마 시설 요구 여섯 가운데 둘이 같은 효과를 규정한다 (S1 p.18). 요구 5: 사용자가 보는 정보 뷰는 개념 스키마와 모순되지 않는 것으로 제한되고, 외부 스키마가 바뀌어도 개념 스키마에 영향이 없어야 한다. 요구 6: "The conceptual schema should be kept invariant by the facility with respect to changes in the internal (physical) representation". 이 항목들은 "data independence"라는 말을 쓰지 않는다.
- 교과서식 정의(2차): 논리적 독립성은 논리 스키마를 바꿔도 응용 프로그램을 다시 쓰지 않아도 되는 능력, 물리적 독립성은 물리 스키마에 대해 같은 능력 (S26). 주류 DBMS가 물리 독립성을 완전히 이루지는 못했다는 서술도 2차 (S16).

## 2. ISO/TR 9007:1987

### 2.1 서지와 경위

- "Information processing systems — Concepts and terminology for the conceptual schema and the information base", 1987-07-01, 편집 J. J. van Griethuysen, Technical Report type 3 (S1, S25).
- 1977-11 ISO TC97/SC5 작업반 결성 결의, 1978–1985 WG3가 16회 회의(15개국 48명), 1982 최종 원고 N695, 1987 발행. 별칭 "Orange Report" (S25, 2차).
- 1.1절은 ANSI/X3/SPARC 보고서가 세 스키마 틀 속에서 개념 스키마의 필요를 밝혔다는 문장으로 시작한다 (S1 p.9).

### 2.2 용어 [1차, S1 pp.10–13]

- universe of discourse(담화 세계): 기술 대상으로 고른 실제 또는 가정된 세계의 부분에서 "The collection of all objects (entities) that ever have been, are, or ever will be". 구체적(재고), 추상적(조직 구조), 가상(원더랜드)일 수 있다.
- conceptual schema: "The description of the possible states of affairs of the universe of discourse" (분류·규칙·법칙 포함).
- information base: 특정 시점이나 기간에 담화 세계에 있다고 인식된 구체적 객체와 실제 상태의 기술.
- information system: 개념 스키마 + 정보 베이스 + 정보 처리기.
- 개념 스키마의 일반 규칙은 정보 베이스에 일어날 수 있는 일과 없는 일을 통제한다.

### 2.3 원칙 [1차, S1 pp.7, 16–17]

- 100 Percent principle: "All relevant general static and dynamic aspects, i.e. all rules, laws, etc., of the universe of discourse should be described in the conceptual schema." 이어서 정보 시스템은 다른 곳(특히 응용 프로그램)에 적힌 규칙을 지키지 못한 책임을 지지 않는다고 한다.
- Conceptualization principle: 개념 스키마는 개념적으로 관련 있는 측면만 담는다. 배제 대상은 외부·내부 데이터 표현, 물리 조직과 접근, 메시지 형식·자료 구조 같은 외부 사용자 표현 전부.
- Helsinki principle(ISO TC97/SC5/WG3, Helsinki 1978): 의미 있는 발화 교환은 미리 합의한 의미·구문 규칙이 있어야 가능하다.
- 개념 스키마 경계를 정할 때 고려할 요인: 인스턴스가 아닌 클래스를 기술, 자주 바뀌지 않는 개념 우선, 폭넓게 영향을 주는 규칙 포함 (p.16).
- 개념 스키마의 네 역할(1.9절): 담화 세계의 일반 행동을 이해하는 공통 기반, 정보의 허용된 진화·조작 정의, 외부·내부 구문 형식을 해석하는 기반, 외부·내부 스키마 사이 사상의 기반. 개념 스키마가 표현 변환에서 의미 보존을 강제한다 (p.17).
- 작업반이 정한 원칙은 일곱이라고 알려져 있으나 확인한 것은 위 셋 (S25, open question).

### 2.4 TR 9007 자신의 유보

- 세 스키마 틀은 "widely, but not yet universally, accepted" (p.9).
- 개념 스키마가 기업 모델이어야 하는지, 사용자 뷰와 물리 설계 사이의 중심점이어야 하는지 묻고 둘 다라고 답한다 (p.9).
- '개념 스키마'라는 말이 전혀 개념적이지 않은 데이터베이스 측면에 쓰이기도 한다고 지적한다 (p.10 부근).
- 사물과 사물의 기술을 섞지 말라고 경고한다 (1.7절, p.15).

## 3. CODASYL 하위 스키마와 SQL 뷰

- CODASYL DBTG(위원장 William Olle)의 1971-04 보고서가 DDL·DML 명세와 함께 schema·subschema 개념을 들여왔다 (S16, 2차). NBS 1985는 1975 ANSI/SPARC 보고서가 세 스키마 틀을 처음 도입했다고 평가한다 (S3 p.4).
- Clemons 1979(VLDB, 초록): 기존 subschema는 저장 스키마의 레코드·세트와 너무 닮아 생산성·데이터 독립성이 나쁘다고 비판하고, 저장 DB에서 도출되지만 같은 모양일 필요가 없는 가상 데이터베이스를 제안 (S15).
- "SQL 뷰 = 외부 스키마"를 직접 쓴 표준 문장은 확인 못 함. Bancilhon·Spyratos 1981 도입부: "A view is a query definition named and stored." 뷰는 데이터베이스 상태에서 뷰 상태로 가는 사상 f (S8 pp.557, 559).
- Chamberlin·Gray·Traiger 1975, "Views, Authorization, and Locking in a Relational Data Base System", AFIPS NCC 44, pp.425–430 (2차 서지).

## 4. 뷰 갱신 문제

### 4.1 문제

- 뷰 갱신을 만족하는 데이터베이스 갱신이 보통 여럿이라서 하나를 골라야 한다 (S8 p.558).
- 연구사(Masunaga 1984, VLDB): Codd가 1974년 처음 보고했고 Chamberlin 외와 Stonebraker가 첫 해법을 냈다. Dayal·Bernstein과 Carlson·Arora는 함수 종속을, Bancilhon·Spyratos는 보완 뷰를, Keller는 구조적 데이터 모델을 썼다 (S10).
- 예(Guagliardo·Franconi 2012, S9): 조인 뷰 V = E ⋈ D에 (Ford, Sales, Reyes)를 넣으면 D의 기존 (Sales, Locke)와 조인되어 (Ford, Sales, Locke)가 부수 효과로 나타난다. 투영 뷰 π_EMP,DEP(R)에 (Ford, Sales)를 넣으면 MGR 값에 정답이 없다.

### 4.2 Bancilhon·Spyratos 1981 [1차]

- "Update Semantics of Relational Views", *ACM TODS* 6(4), 1981-12, pp.557–575, DOI 10.1145/319628.319634 (S8).
- 보완 뷰(complement): 원 뷰와 합치면 데이터베이스를 계산해 낼 수 있는 뷰. 한 뷰에 보완이 여럿일 수 있고, 어느 보완을 고르느냐가 갱신 정책을 정한다.
- 주결과: 갱신 집합 U가 번역기를 가질 필요충분조건은 보완 뷰를 고정한 채(constant complement) 번역할 수 있는 것.
- 계산 알고리즘은 주지 않았다 (S9 p.5). 후속: Lechtenbörger, Gottlob 외, Cosmadakis·Papadimitriou (S9, 2차).

### 4.3 Dayal·Bernstein 1982, Keller 1985 [서지만]

- Dayal, Bernstein, "On the correct translation of update operations on relational views", *ACM TODS* 7(3), 1982-09, pp.381–416, DOI 10.1145/319732.319740 (S11). 앞선 VLDB 1978 논문은 올바른 번역 가능성을 형식화하고 뷰 정의에 거는 조건을 유도 (S11 초록).
- Keller, PODS 1985, pp.154–163, DOI 10.1145/325405.325423: 선택·투영·조인 뷰의 갱신 번역 알고리즘. 다섯 기준(부수 효과 없음 등)은 2차 요약만 확인 (S11).

### 4.4 SQL 표준과 PostgreSQL [1차]

- PostgreSQL CREATE VIEW: 자동 갱신 가능 조건은 FROM 항목이 정확히 하나(테이블이나 갱신 가능한 뷰), 최상위에 WITH·DISTINCT·GROUP BY·HAVING·LIMIT·OFFSET·집합 연산이 없음, select 목록에 집계·윈도·집합 반환 함수가 없음. 열 단위로 판단해 기반 열을 단순 참조하는 열만 갱신 가능 (S12).
- 그 밖의 뷰는 INSTEAD OF 트리거나 규칙으로 갱신 의미를 직접 준다 (S12, S13).
- WITH CHECK OPTION: 뷰에서 보이지 않게 될 새 행을 거부. LOCAL은 그 뷰 조건만, CASCADED는 하위 뷰까지, 생략하면 CASCADED (S12).
- 표준 기능 대응(PostgreSQL 부록 D): F311-04·F751·T213 지원, T111(Updatable joins, unions, and columns) 미지원 (S14).

## 5. 현대에서 외부 스키마에 해당하는 것

- REST·GraphQL·CQRS·BFF를 "외부 스키마"라고 부르는 문헌은 찾지 못했다. 아래 대응은 해석이다 (open question).
- 해석의 가장 강한 근거: TR 9007 개념화 원칙이 개념 스키마에서 빼라고 한 목록에 "message formats"가 외부 사용자 표현의 예로 들어 있다 (S1 p.17).
- REST(Fielding 2000, 5.2.1): 자원은 "a conceptual mapping to a set of entities", 표현은 바이트 열과 표현 메타데이터. 2003년 메일 "The resource in REST is the conceptual mapping, not the concept." (S21)
- GraphQL(2021-10 명세): 타입 시스템이 서비스의 능력을 기술하고, 응답은 클라이언트가 요청한 것만 담는다 (S19).
- CQRS: Fowler bliki(2011-07-14)는 Greg Young에게서 들었다고 밝히고 "use a different model to update information", 대부분 시스템에서 위험한 복잡성을 더한다고 경고 (S17). Microsoft Learn(2025-02-20)은 "The read and write representations of data often differ."라고 서술, 읽기 모델은 실체화 뷰로 둘 수 있고 쓰기 모델과는 결과적 일관성 (S18).
- BFF(Sam Newman, 2015-11-18): 사용자 경험 하나에 백엔드 하나, "one experience, one BFF" (S20).
- Pat Helland, "Data on the Outside versus Data on the Inside"(CIDR 2005): 서비스는 상대 서비스가 쓰도록 다듬은 데이터 부분집합을 내보내고, 메시지 스키마와 업무 의미는 잘 정의되어야 하며 내부 데이터는 로직을 거쳐서만 접근된다 (S24).

## 6. 세 층 구조에 대한 비판과 한계

- NBS 1985(DAFTG)는 이전 틀이 "consists of too many interfaces"라고 지적하고 메타데이터 관리 질문을 남긴다 (S3 pp.5, 13).
- 벤더가 용어는 받아들였지만 호환되지 않게 구현했고 공식 표준이 되지 못했다 (S16, 2차).
- TR 9007 자신의 유보 (2.4절).
- Partridge 외 2025(arXiv 2509.01617, 프리프린트): 개념 스키마를 정보 베이스에서 떼어 내는 관행("schema turn")을 비판 (S2).
- 전사 단일 모델: Fowler "Bounded Context"(2014-01-15)는 대규모 시스템의 전면 통합 모델이 "will not be feasible or cost-effective"하다는 Evans의 말을 인용하고, 컨텍스트마다 모델을 두고 사이를 매핑하라고 정리 (S22). Tilkov(2015-03-30)는 "a canonical data model is a bad idea" (S23). TR 9007의 "unique central description"과 DDD의 여러 모델을 나란히 놓는 것은 해석이며, 둘을 직접 맞붙인 문헌은 찾지 못했다.

## 7. 개념 스키마 설계 방법론

### 7.1 Chen 1976 [1차]

- Peter Pin-Shan Chen, "The Entity-Relationship Model — Toward a Unified View of Data", *ACM TODS* 1(1), 1976-03, pp.9–36 (S27).
- 네트워크·관계형·엔터티 집합 모델의 관점을 하나로 묶는 바탕을 목표로 하고, "the real world consists of entities and relationships"라는 관점을 택한다.
- 네 층 관점(§2.1): 층 1 머릿속의 개체와 관계에 관한 정보, 층 2 정보 구조, 층 3 접근 경로와 무관한 데이터 구조, 층 4 접근 경로에 의존하는 데이터 구조. 네트워크 모델은 주로 층 4, 관계형은 층 3·2, ER은 층 1·2에서 출발. ANSI/SPARC 세 층과는 다른 축이다(조사자 해석).
- entity: "a 'thing' which can be distinctly identified". relationship: "an association among entities". role: 관계 안에서 개체가 하는 기능(husband, wife). value set과 attribute: attribute는 개체 집합이나 관계 집합에서 value set으로 가는 함수. "attribute and value set are different concepts although they may have the same name".
- 관계의 속성: PROJECT-WORKER의 PERCENTAGE-OF-TIME은 직원의 속성도 프로젝트의 속성도 아니다.
- 약한 개체: 자기 속성만으로 식별되지 않는 개체(직원의 DEPENDENT는 이름 + 직원 번호로 식별). 식별은 1:n 관계로만 한다.
- ER 도식: 개체 집합은 직사각형, 관계 집합은 마름모, 약한 개체는 이중 테두리.

### 7.2 ORM/NIAM과 CSDP [1차, Halpin 개요]

- Terry Halpin, "Object-Role Modeling: an overview"(Microsoft, 2001년경) (S28). 초기 형태는 1970년대 중반 유럽의 이항 관계 모델링과 NIAM. 책: Halpin·Morgan, *Information Modeling and Relational Databases*, 2판 2008, 3판 2024 (S52, 서지만).
- CSDP 7단계(개요 문서 Table 1의 설명 그대로):

| 단계 | 설명 |
| --- | --- |
| 1 | Transform familiar information examples into elementary facts, and apply quality checks |
| 2 | Draw the fact types, and apply a population check |
| 3 | Check for entity types that should be combined, and note any arithmetic derivations |
| 4 | Add uniqueness constraints, and check arity of fact types |
| 5 | Add mandatory role constraints, and check for logical derivations |
| 6 | Add value, set comparison and subtyping constraints |
| 7 | Add other constraints and perform final checks |

- 큰 응용은 담화 세계를 모듈로 나눠 모듈마다 CSDP를 돌린 뒤 하위 스키마를 전역 개념 스키마로 통합 (S28).
- 1단계가 가장 중요하다("Step 1 is the most important stage of the CSDP"). 시스템이 다룰 정보 사례(출력 보고서·입력 양식)를 자연어로 말로 옮기고, 영역 전문가가 검증한다. 예: 교수 명부 표의 첫 행에서 "The Academic with empNr 715 has EmpName 'Adams A'" 같은 사실을 뽑는다. 품질 검사: 객체가 잘 식별되는가(값과 개체 구분, 개체는 참조 방식으로 식별), 문장에 "and"가 있으면 쪼갤 수 있는가 (S28).
- 기본 사실(elementary fact): 객체가 속성을 갖거나 객체들이 관계에 참여한다고 단언하되, 더 단순한 사실들의 연언으로 나눌 수 없는 것. "Bill Clinton jogs and is the president of the USA"는 기본 사실 둘 (S28).
- 2단계 인구 검사: 각 사실 유형을 표본 행으로 채워 본다. 표본은 고객과 모델을 검증하고 제약을 이해하는 데 쓰지만 스키마 도식의 일부는 아니다 (S28). 반례를 넣어 전문가가 그 패턴이 가능한지 확인하는 방식(영화 제목이 유일하지 않은 표본으로 추정 유일성 제약을 반증) (S30).
- 3단계: 같은 술어를 공유하는 개체 유형을 합치고(교수·부교수·강사 → Academic, 원래 정보는 "Academic has Rank"로 보존), 산술로 유도되는 사실 유형은 표시하고 규칙을 준다 (S28).
- 4단계: 유일성 제약은 역할 항목이 최대 한 번 나타난다는 선언. 유일성이 두 역할을 빠뜨린 n항 사실 유형은 쪼갠다. "If a fact type is elementary all its functional dependencies (FDs) are implied by uniqueness constraints" (S28).
- 5단계: 필수 역할 제약(그 유형의 모든 객체가 그 역할을 함), 여러 역할에 걸친 포괄적 논리합 제약. 논리 유도 검사(규칙을 데이터 표로 저장하고 유도 규칙으로 계산) (S28).
- 6단계: 값 제약(열거·범위), 집합 비교 제약(부분집합·동등·배타), 하위 유형 (S28).
- 7단계: 고리 제약, 빈도 제약 등, 그리고 원래 사례와의 일관성·중복 없음·완전성 최종 점검 (S28).
- data use case(Halpin 1999, Business Rules Journal): UML 유스케이스에 빗대 주제 전문가에게 친숙한 정보 표본(보고서·화면·양식)을 부르는 말. 전문가가 표의 행을 읽고, 모델러가 기본 사실 문장으로 다시 쓰고, 전문가가 검증하고, 모델러가 사실 유형으로 추상화 (S29).
- 주의: Halpin은 ER이 자연어에서 멀고 인스턴스로 채울 수 없다고 평하는데 ORM 진영의 입장이다 (S28).

### 7.3 설계 전략과 스키마 통합

- Batini, Ceri, Navathe, *Conceptual Database Design: An Entity-Relationship Approach*, Benjamin/Cummings, 1992 (서지만, 본문 미열람).
- 전략 넷(같은 계열 교재 Atzeni 외 슬라이드, S33): 하향식은 추상 개념 몇 개로 된 초기 스키마를 연속 정제(변환 T1 개체 하나를 개체 둘+관계로, T2 일반화로, T3 관계를 여러 관계로, T4 관계를 개체로, T5·T6 속성 추가). 상향식은 요구를 조각으로 나눠 작은 스키마를 만들고 통합(개체 생성, 관계 생성, 일반화 생성, 속성을 개체·관계로 묶기). 안쪽에서 바깥은 중요한 개념 몇 개에서 바깥으로 퍼져 나감. 혼합은 주요 개념만 담은 뼈대 스키마를 만든 뒤 각 부분을 하향·상향으로 다듬음.
- Batini 2015 강의록 비교: 상향식은 나무를 맨 끝에 보고, 안쪽에서 바깥은 가장 중요한 부분을 일찍 완성하며, 하향식은 재구성 위험이 작다 (S34).
- 요구 분석 규칙(S33): 추상화 수준 선택, 문장 구조 표준화, 복잡한 구 피하기, 동음이의어·이음동의어를 찾아 용어 표준화, 상호 참조 명시, 용어집 작성. 요구의 원천은 사용자, 기존 문서(양식·규정·업무 절차·법규), 대체될 기존 응용. 연산과 빈도도 요구 단계에서 적는다(예: 연수생 등록 하루 약 40회).
- 스키마 통합(Batini, Lenzerini, Navathe, "A Comparative Analysis of Methodologies for Database Schema Integration", *ACM Computing Surveys* 18(4), 1986-12, pp.323–364) [1차] (S32):
  - 정의: 기존·제안 데이터베이스의 스키마를 전역 통합 스키마로 합치는 일. 설계 시의 뷰 통합과 분산 관리 시의 데이터베이스 통합 두 맥락.
  - 네 단계: 사전 통합(통합 대상·순서·선호 정하기, 이진·n항 전략), 비교(대응과 충돌 찾기, 스키마 간 성질 발견), 맞추기(conforming: 충돌 해소, "Automatic conflict resolution is generally not feasible"), 병합과 재구성(중간 통합 스키마를 만들고 품질 기준에 맞게 재구성).
  - 이름 충돌: 동음이의어(EQUIPMENT가 한쪽은 기계, 다른 쪽은 가구까지), 이음동의어(CLIENT와 CUSTOMER). 동음이의는 같은 이름끼리 비교해 찾지만 이음동의는 외부 명세가 있어야 찾는다.
  - 구조 충돌: 유형 충돌(한쪽은 개체, 다른 쪽은 속성), 종속 충돌(결혼이 1:1 대 m:n), 키 충돌(SS# 대 Emp_id), 행위 충돌(마지막 직원을 지우면 부서도 지워지는가).
  - 병합 예: Book과 Publication을 겹친 뒤 Book을 Publication의 부분집합으로 만들고 공통 속성을 상위로.
  - 통합 스키마 기준: 완전성과 정확성, 최소성, 이해 용이성.
  - 설계 단계 그림은 물리 설계를 거래(transaction) 집합에 맞춘 최적화로 서술 (Fig.1).

### 7.4 스키마 품질

- 세 목록이 서로 다르다(충돌, 양쪽 기록). Atzeni 슬라이드 넷: 정확성·완전성·가독성·최소성 (S33). Batini 2015 강의록 여덟: 모델에 대한 정확성, 요구에 대한 정확성, 최소성(예: '합격 과목 수'는 시험 관계 개수로 계산되므로 중복, 개념 설계에서는 표시만 하고 논리 설계에서 성능을 위해 둘 수 있음), 완전성, 적절성(불필요한 개념이 얼마나 있는가), 도식 가독성, 간결성, ER 정규화 (S34). 흔히 인용되는 여덟(completeness, correctness, minimality, expressiveness, readability, self-explanation, extensibility, normality)은 1992년 책 본문으로 확인하지 못했다.
- Lindland, Sindre, Sølvberg, "Understanding quality in conceptual modeling", *IEEE Software*, 1994 (원문 미열람, Krogstie 외 1995와 2차로 확인): 문장 집합 M(모델), L(언어), D(도메인), I(청중의 이해)로 구문 품질(M과 L의 일치), 의미 품질(M과 D의 일치: 타당성·완전성, 실현 가능한 수준의 타당성·완전성), 화용 품질(M과 I의 일치: 이해)을 정의 (S36, S37).
- Moody·Shanks(1994 ER, 2003 *Information Systems* 28(6)): 품질 요인 목록이 2차 자료마다 다르다(여섯·일곱 요인). 원문 확인 필요 (S38). Moody ECIS 2003: 후보 지표 29개 중 실무에서 쓸모가 확인된 것은 소수였고, 참여자들은 지표보다 주관 평점과 서술을 더 유용하게 여겼다 (S38).

## 8. 내부 스키마(물리 설계)

### 8.1 정규화의 근거

- Codd, "A Relational Model of Data for Large Shared Data Banks", *CACM* 13(6), 1970-06, pp.377–387 [1차] (S39): 목표는 내부 표현이 바뀌어도 응용 프로그램이 영향받지 않는 것. 여기서 normal form은 값이 관계인 도메인을 없애는 절차(오늘의 1NF). 순서·인덱스·접근 경로 의존을 없앨 대상으로 든다. "From an informational standpoint, an index is a redundant component of the data representation." 인덱스는 질의를 빠르게 하지만 삽입·삭제를 느리게 하고, 활동 패턴이 바뀌면 인덱스를 만들고 없앨 수 있어야 한다.
- 연표(2차): 2NF·3NF는 Codd 1971 IBM 보고서(1972 단행본 재수록), BCNF는 Boyce·Codd 1974, 4NF는 Fagin 1977(*ACM TODS* 2(3), 다치 종속), 5NF는 Fagin 1979 (S40, S41).
- 정의(2차): 1NF 필드에 집합·중첩 레코드 없음, 2NF 비키 속성이 후보 키 전체에 종속, 3NF 비자명 FD가 슈퍼키에서 시작하거나 주 속성으로 끝남, BCNF 비자명 FD가 모두 슈퍼키에서 시작, 4NF 비자명 다치 종속이 모두 슈퍼키에서 시작. 이상은 삽입·갱신·삭제 (S40).

### 8.2 물리 설계의 입력은 작업 부하

- Ramakrishnan·Gehrke, *Database Management Systems* 3판, 물리 설계 장 슬라이드 (S42):
  - 개념·외부 스키마 다음 단계는 인덱스 선택, 클러스터링 결정, 성능 목표를 위한 개념·외부 스키마 다듬기.
  - 입력은 가장 중요한 질의와 빈도, 가장 중요한 갱신과 빈도, 각각의 성능 목표. "We must begin by understanding the workload."
  - 결정: 어느 릴레이션에 어떤 검색 키로 인덱스를 둘지, 클러스터 여부, 해시·트리 선택, 정규화 대안 비교, 비정규화, 수평 분할, 복제, 뷰.
  - "our choice of indexes is guided by the plan(s) we expect an optimizer to consider for a query."
  - 비정규화는 질의가 충분히 중요하고 인덱스나 다른 3NF 스키마로 성능을 못 얻을 때만. BCNF 대신 3NF를 택할 수 있다.
  - 수평 분해 예: 큰 계약과 작은 계약을 나누고 원래 이름은 UNION 뷰로 가린다. 스키마를 바꾼 뒤에는 뷰로 응용을 보호한다.
  - 인덱스는 시간이 지나며 다시 조정한다.
- Lightstone·Teorey·Nadeau, *Physical Database Design*, 2007 (서지만) (S53).
- 자동 인덱스 추천: Chaudhuri·Narasayya, VLDB 1997 — SQL 질의 작업 부하를 입력으로 받아 인덱스 집합을 제안 (S50).

### 8.3 PostgreSQL 공식 문서 근거 (18.7 문서 기준)

- 인덱스 종류: B-tree(기본, 비교·범위·정렬), Hash(=만), GiST, SP-GiST, GIN(배열·역인덱스), BRIN(블록 범위 요약, 값이 물리 순서와 상관될 때) (S43).
- 다중 열 인덱스: 선두 열 조건이 스캔 범위를 정한다. "Multicolumn indexes should be used sparingly" (S46).
- 부분 인덱스: 일부 행에만 걸치는 인덱스, 일부 행에 대한 유일성 강제에 쓸 수 있다. 대부분의 경우 이점이 작다는 경고 (S47).
- 인덱스 쓰기 비용: 테이블과 동기화해야 해서 데이터 조작에 부담을 더한다 (S48).
- 통계: 계획기는 `pg_statistic`으로 선택도를 추정하고, 열끼리 상관되면 `CREATE STATISTICS`로 보정 (S49).
- 선언적 분할: range·list·hash. 이득은 대개 테이블이 아주 클 때만, 경험칙은 테이블이 서버 메모리를 넘을 때. 분할 키는 WHERE에 가장 자주 나오는 열. 고유·기본 키 제약은 분할 키 열을 모두 포함해야 한다. 파티션이 많을수록 좋다고 가정하지 말 것 (S44).
- 실체화 뷰: 질의 결과를 저장하고 `REFRESH MATERIALIZED VIEW`로 갱신. `CONCURRENTLY`는 고유 인덱스가 있어야 한다. 표준 SQL이 아닌 PostgreSQL 확장 (S45).

## 9. 개념에서 관계형 논리 모델로

- Elmasri·Navathe, *Fundamentals of Database Systems* 5판 7장 슬라이드 (S51):
  1. 강한 개체 유형 → 릴레이션, 키 하나를 기본 키로.
  2. 약한 개체 유형 → 소유자 기본 키를 외래 키로 넣고, 기본 키는 소유자 키 + 부분 키.
  3. 1:1 → 외래 키(전체 참여 쪽에 두는 것이 낫다), 병합 릴레이션, 상호 참조 릴레이션 셋 중 하나.
  4. 1:N → N쪽에 1쪽 기본 키를 외래 키로.
  5. M:N → 새 릴레이션, 두 기본 키의 조합이 기본 키.
  6. 다중값 속성 → 새 릴레이션(속성 + 소유 개체 키).
  7. n항 관계 → 새 릴레이션, 참여 개체 키 n개.
  8. 하위 유형 → 8A 상위·하위 각각(어떤 경우든 가능), 8B 하위만(전체 하위 유형일 때), 8C 한 릴레이션 + 유형 속성 하나(배타 예), 8D 한 릴레이션 + 불 플래그 여럿(중첩 예).
- Halpin의 ORM→관계형 사상: 사실 유형이 기본 사실이면 결과에 중복이 없다. 복합 키를 가진 사실 유형은 각각 테이블로, 같은 객체 유형에 붙은 단순 키 사실 유형은 한 테이블로 묶는다. 필수 역할은 NOT NULL로, 부분집합·동등 제약은 외래 키 같은 제약으로, 유도 규칙은 SQL 뷰로 (S28).
- Chen 1976의 entity relation과 relationship relation이 위 사상 규칙의 원형 (S27).

## 10. 계약(contract)과 스키마 진화

### 10.1 Meyer의 Design by Contract

- 서지: 1986 기술 보고서 *Design by Contract*, TR-EI-12/CO, Interactive Software Engineering(서지는 2차 목록에서만 확인, 원문 미열람) (S57). 1991 책 장 "Design by Contract", *Advances in Object-Oriented Software Engineering*, pp.1–50 (S57). 1992 논문 "Applying 'Design by Contract'", *IEEE Computer* 25(10), pp.40–51 (S54, pp.40–43 열람). *Object-Oriented Software Construction* 1판 1988, 2판 1997(Prentice Hall, ISBN 978-0136291558) (S57, S59).
- 계약의 비유: 두 당사자가 각자 이익을 기대하고 그 대가로 의무를 진다. 한쪽의 의무는 대개 다른 쪽의 이익이다. 원문 짧은 인용 "These benefits and obligations are documented in a contract document." (S54 p.41)
- 1992 논문 표 1(택배 예): 고객의 의무는 각 변 2m 이하·5kg 이하 소포와 100프랑, 이익은 4시간 안 배달. 공급자의 의무는 4시간 안 배달, 이익은 너무 크거나 무겁거나 돈을 안 낸 소포는 다루지 않아도 되는 것 (S54).
- No Hidden Clauses: 계약이 빠짐없이 적혔다면 계약 밖 요구를 조건으로 붙일 수 없다. 모든 계약에 암묵적으로 걸리는 규칙(법규 같은 것)은 막지 않으며, 그것이 클래스 불변식에 해당한다고 설명 (S54).
- Eiffel 표기: `require`(사전조건), `ensure`(사후조건), `old`(진입 시점 값). 예: `put_child`의 사전조건 `new /= Void`, 사후조건 `new.parent = Current; child_count = old child_count + 1`. 조항이 없으면 `require True`와 같다 (S54).
- 특수 상황 처리는 단언이 아니라 제어 구조로 한다 (S54).
- Eiffel 공식 문서: 사전조건은 공급자를 보호하는 고객의 의무("The client's obligation, which protects the supplier, is called a precondition."). 루틴 몸체가 자기 사전조건을 다시 검사하지 않는다. 불변식은 모든 생성 절차가 확립하고 외부에 내보낸 모든 루틴이 유지한다. 사전조건 위반은 고객의 버그, 사후조건·불변식 위반은 공급자의 버그 (S55).
- 하위 유형 규칙: 재정의한 사전조건은 약하거나 같아야 하고(`require else`, OR로 묶음), 사후조건은 강하거나 같아야 한다(`ensure then`, AND로 묶음). 불변식은 부모 것과 AND로 쌓인다 (S56). Liskov·Wing 1994의 행위 하위 유형과의 관계는 2차 자료 서술만 확인 (S57).
- Hoare 1969, "An Axiomatic Basis for Computer Programming", CACM 12(10), pp.576–580, 583. 표기 `P {Q} R`: 프로그램 Q 시작 전에 P가 참이면 끝났을 때 R이 참 (S58). 1992 논문은 클래스 불변식 개념이 Hoare 1972 "Proof of Correctness of Data Representations"(Acta Informatica 1(4))의 data invariant에서 왔다고 적음 (S54).

### 10.2 API 계약 명세

- OpenAPI: 조회 시점 최신 3.2.1(2026-09-10). 버전 목록 3.2.1, 3.2.0, 3.1.2, 3.1.1, 3.1.0, 3.0.x, 2.0 (S60). 3.2.0은 2025년 9월(릴리스 19일, OAI 공지 23일로 두 날짜가 보임) (S61, S62). 3.1.0에서 JSON Schema 2020-12로 옮김 (S61). 목적은 "a standard, language-agnostic interface to HTTP APIs"를 정의하는 것 (S60).
- OpenAPI가 사후조건·호출 순서·연산 단위 멱등성을 적는 표준 필드는 명세 일부 열람 범위에서 찾지 못했다(추론). 호출 순서는 Arazzo 1.1.0(2026-05-17)이 다룬다 (S69). 멱등성은 HTTP 의미론에 있다: RFC 9110 §9.2.2 "PUT, DELETE, and safe request methods are idempotent" (S70).
- JSON Schema: 현재 버전 2020-12, Core와 Validation 두 문서 (S63). JSON 문서가 어떤 모양이어야 하는지 단언한다 (S64). 모르는 키워드는 주석으로 다루라고 권함(§4.3.1) (S64). 진화 규칙은 정의하지 않음 (S91).
- AsyncAPI: 3.0.0(2023-12-05)에서 `publish`/`subscribe`를 `send`/`receive`로 바꾸고 채널을 연산에서 떼어 냈으며 `reply`로 요청·응답을 지원 (S67). 최신 3.1.0(2026-01-31) (S68). 구성 요소는 Channels·Operations·Messages·Servers·Components, 프로토콜 세부는 bindings (S66). 전달 보장·순서 같은 의미 약속을 표현하는지는 미확정 (open question).

### 10.3 소비자 주도 계약

- Ian Robinson, "Consumer-Driven Contracts: A Service Evolution Pattern", martinfowler.com, 2006-06-12 (S71).

| 용어 | 요지 | 성격 |
| --- | --- | --- |
| 제공자 계약(provider contract) | 제공자가 업무 기능을 노출하는 요소 집합(문서 스키마, 인터페이스, 대화, 정책, 서비스 품질) | 닫힘, 단일, 권위 있음 |
| 소비자 계약(consumer contract) | 소비자의 합리적 기대를 제공자가 받아들일 때 지는 의무 | 열림, 불완전, 여럿, 권위 없음 |
| 소비자 주도 계약(consumer-driven contract) | 소비자 기대들의 합에서 생겨나는 제공자 계약 | 현재 소비자에 대해 닫히고 완전, 단일, 권위 없음 |

- 문제의 원인: 소비자가 스키마 전체를 검증하면 제공자가 필드 하나를 지워도 배포를 같이 맞춰야 한다. 처방은 쓰는 필드만 검증하는 "just enough" 검증과 모르는 요소를 무시하는 Must Ignore (S71).
- Tolerant Reader(Fowler, 2011-05-09): 필요한 필드만 읽고 나머지는 무시하며 구조 가정을 최소로 한다 (S72). Robinson 글에는 이 용어가 쓰이지 않음 (S71).
- Pact: 소비자 테스트에서 계약이 생기는 "contract by example". 소비자 테스트가 mock provider로 상호작용을 기록 → pact 파일 생성 → 제공자 검증에서 기록된 요청을 실제 제공자에 재생해 최소 기대 데이터가 있는지 확인. provider state로 사전 상태를 준비 (S73, S74, S75). can-i-deploy는 배포 직전 소비자·제공자 버전 조합별 검증 결과 표(Pact Matrix)로 배포 가능 여부를 알려 줌 (S76). pending pacts는 새 기대가 제공자 빌드를 바로 깨지 않게 함 (S77).

### 10.4 데이터 계약

- ODCS(Open Data Contract Standard, Bitol 프로젝트, LF AI & Data): 조회 시점 최신 v3.2.0(2026-09-08, 연도는 2차 자료로 확인) (S79, S89). 주요 절: Fundamentals, Schema, Context, References, Data Quality, Support & Communication Channels, Pricing, Team, Roles, Service-Level Agreement, Infrastructures & Servers, Custom & Other Properties, Authoritative Definitions, Tags, Variables (S78).
- 필수 필드 `apiVersion`, `kind`(`DataContract`), `id`, `version`. `status` 예: proposed, draft, active, deprecated, retired (S80).
- Schema: 객체 수준 `logicalType`·`physicalType`(table/view/topic/file)·`physicalName`, 속성 수준 `required`·`unique`·`primaryKey`·`classification` 등 (S81).
- Data Quality: 품질 규칙 유형 text·library·sql·custom, 라이브러리 지표 nullValues·missingValues·invalidValues·duplicateValues·rowCount, 차원 accuracy·completeness·conformity·consistency·coverage·timeliness·uniqueness (S82).
- SLA 항목: latency, generalAvailability, endOfSupport, endOfLife, retention, frequency, timeOfAvailability, timeToDetect, timeToNotify, timeToRepair (S83).
- Data Contract Specification(datacontract.com)은 ODCS v3.1.0 발표와 함께 폐기, 2026년 말까지 도구 지원, 마지막 버전 1.2.1 (S86, S87).
- Andrew Jones, *Driving Data Quality with Data Contracts*, Packt, 2023-06 (서지만 확인) (S88).
- 충돌: ODCS v3.1.0을 "zero breaking changes"라고 한 공지(S84)와 같은 판 릴리스 노트의 "Breaking JSON Schema change" 표기(S79). 양쪽 기록.

### 10.5 스키마 진화 호환성

- Confluent Schema Registry 기본값은 BACKWARD (S90).

| 유형 | 정의 | 업그레이드 순서 |
| --- | --- | --- |
| BACKWARD | 새 스키마 X의 소비자가 X-1로 쓴 데이터를 읽는다 | 소비자 먼저 |
| BACKWARD_TRANSITIVE | 등록된 모든 이전 버전 데이터를 읽는다 | 소비자 먼저 |
| FORWARD | X로 쓴 데이터를 X-1 소비자가 읽는다 | 생산자 먼저 |
| FORWARD_TRANSITIVE | X로 쓴 데이터를 모든 이전 버전 소비자가 읽는다 | 생산자 먼저 |
| FULL | X와 X-1 사이에서 양쪽 다 | 독립적으로 |
| FULL_TRANSITIVE | 모든 버전 사이에서 양쪽 다 | 독립적으로 |
| NONE | 검사 안 함 | 주의 |

- 근거 문장: BACKWARD는 "consumers using the new schema can read data produced with the last schema" (S91). 업그레이드 순서 문장도 같은 문서 (S91).
- Avro/Protobuf에서 기본값이 있는 필드의 추가·삭제는 완전 호환 (S90). 필수 필드 추가·삭제의 칸은 원문 표를 다시 확인해야 함 (open question).
- JSON Schema(관대한 정책): 선택 필드 추가·삭제는 세 유형 모두 허용, 필수 필드 추가는 FORWARD만, 필수 필드 삭제는 BACKWARD만 (S90). 열린 모델(`additionalProperties` 기본 true)과 닫힌 모델(`false`)에 따라 판정이 달라짐 (S90, S92).
- Avro 해석 규칙(1.12.0): 필드는 이름으로 맞춘다. 읽는 쪽에 없는 필드의 값은 무시. 쓴 쪽에 없는 필드는 읽는 쪽 기본값을 쓰고, 기본값이 없으면 오류. 정수→더 넓은 수 타입 승격 허용 (S93).
- Protocol Buffers: 필드 번호가 와이어 형식의 정체성이며 바꾸면 안전하지 않다. 필드 추가·삭제는 안전하되 지운 번호는 재사용 금지, `reserved`로 번호와 이름을 막는다. 재사용하면 해독이 모호해지고 데이터 손상·개인정보 유출로 이어질 수 있다 (S94, S95). "Never re-use a tag number." (S95)
- JSON Schema 진화 판단이 어려운 이유: 구조 서술과 `allOf`/`oneOf`/`not`/`if` 같은 규칙 서술이 섞여 있음 (S92).

### 10.6 Postel 법칙, RFC 9413, Hyrum 법칙, Semver

- RFC 761(1980-01) §2.10 "be conservative in what you do, be liberal in what you accept from others." (S96). RFC 1122 §1.2.2 "Be liberal in what you accept, and conservative in what you send." (S97)
- RFC 9413 "Maintaining Robust Protocols"(M. Thomson, D. Schinazi, 2023-06, IAB, Informational): 잘못된 입력을 조용히 받아 주면 결함이 사실상 표준으로 굳는다("A flaw can become entrenched as a de facto standard."). 새 구현은 버그까지 맞춰야 한다. 처방은 명세를 발행 뒤에도 계속 유지하는 적극적 유지보수와, 명세가 뒷받침하는 비관용(명시되지 않은 조건에 치명적 오류를 내는 선택) (S98).
- Hyrum 법칙 원문 요지: API 이용자가 충분히 많으면 계약에 무엇을 약속했든 관찰 가능한 모든 동작에 누군가 기댄다. 짧은 인용 "all observable behaviors of your system will be depended on by somebody" (S99).
- Semantic Versioning 2.0.0: MAJOR는 호환되지 않는 API 변경, MINOR는 하위 호환 기능 추가, PATCH는 하위 호환 버그 수정. 공개 API를 선언해야 한다 (S100).

### 10.7 경계의 약속으로서 계약(DDD)

- Evans, *Domain-Driven Design Reference*(2015-03): Services — "Define a service contract, a set of assertions about interactions with the service." Open-host Service — 하위 시스템 접근을 서비스 집합 프로토콜로 정의하고 연다. Published Language — 잘 문서화된 공유 언어를 공통 매체로 쓴다. 기존 도메인 모델을 교환 언어로 그대로 쓰면 굳어 버린다는 이유. Anticorruption Layer — 하류가 상류 모델을 자기 용어로 번역하는 격리 계층 (S101).
- OpenAPI·AsyncAPI·JSON Schema·ODCS를 Published Language를 기계가 읽게 적는 수단으로 보는 것은 조사자의 해석이다. 계약과 ANSI/SPARC 외부 스키마를 직접 잇는 문헌은 찾지 못했다 (open question).

## 11. 설계의 씨앗이 되는 입력 형식

표시: [요약]은 검색 결과 요약만 보고 본문을 열지 못한 출처입니다. 한 단계 약한 근거로 다룹니다.

### 11.1 유스케이스(Cockburn)

- Alistair Cockburn, *Writing Effective Use Cases*, Addison-Wesley, ISBN 978-0-201-70225-5. 2000년 10월 출간, 저작권 표기 2001 (S102, S104).
- 작성 12단계(책 샘플 "The Writing Process"): 범위와 경계 이름 붙이기 → 주 행위자 → 사용자 목표 목록 → 최외곽 요약 유스케이스 → 수정 → 하나를 골라 확장 → 이해관계자와 관심사·사전조건·보장 적기 → 주 성공 시나리오(3~9단계) → 확장 조건(시스템이 감지하고 처리해야 하는 것 전부) → 확장 처리 → 하위 유스케이스로 빼거나 합치기 → 전체 재조정 (S102, S103).
- fully dressed 템플릿 항목(책 p.120 근거, 2차): Title, Primary Actor, Goal in Context, Scope, Level, Stakeholders and Interests, Precondition, Minimal Guarantees, Success Guarantees, Trigger, Main Success Scenario, Extensions, Technology & Data Variations List (S105).
- 해설(저신뢰 3자 요약): 사전조건은 시스템이 참으로 보고 다시 검사하지 않는 것, 최소 보장은 실패를 포함한 모든 결과에서 성립하는 것(예: 시도가 기록된다), 성공 보장은 목표 달성 시 세계의 상태 (S106).
- 목표 수준: summary(+), user-goal(!), subfunction(-)이 기본. 기본 권장은 user-goal (S103, S105). 기호는 소스마다 다름.
- 데이터 정밀도 규칙(초안): 유스케이스 본문에는 정밀도 1단계(데이터 별칭)만 쓰고, 필드(2단계)와 타입·길이·검증(3단계)은 따로 둔다 (S103).

### 11.2 사용자 스토리

- Connextra 형식: Rachel Davies가 2000년대 초 Connextra에서 시작 (Cohn, S107). "so that" 절은 필수는 아니지만 거의 늘 쓴다고 Cohn이 밝힘 (S107). Mountain Goat 틀은 "생각 도구이지 의례가 아니다" (S108).
- Dan North, "Introducing BDD"(2006-09-20, Better Software 2006-03 선행 게재): As a [X] / I want [Y] / so that [Z] (S109).
- INVEST(Bill Wake, 2003-08-17): Independent, Negotiable("captures the essence, not the details"), Valuable, Estimable, Small, Testable(테스트를 쓸 수 있을 만큼 이해) (S110).
- 3C(Ron Jeffries, 2001-08-30): Card(요구를 나타내는 표), Conversation(대화, 가장 유용한 보조는 예시), Confirmation(인수 테스트) (S111).

### 11.3 Gherkin과 예시 명세

- Cucumber Gherkin 참조: Feature, Rule(하나의 업무 규칙을 보이는 시나리오 묶음), Example/Scenario, Given("describe the initial context of the system"), When("describe an event, or an action"), Then("describe an expected outcome, or result"), And/But, Background, Scenario Outline과 Examples(표의 각 행이 한 번의 실행) (S112).
- Given/When/Then의 기원은 Dan North 2006 (S109).
- Gojko Adzic, *Specification by Example*, Manning, 2011-06 (S113). 일곱 핵심 패턴 이름은 [요약].

### 11.4 이벤트 스토밍

- Alberto Brandolini, "Introducing Event Storming", 2013-11-18 블로그: 복잡한 업무 도메인을 빠르게 탐색하는 워크숍 형식. 2013년 원문의 색: 주황 도메인 이벤트(시간순), 파랑 명령, 보라 외부 시스템·시간 경과 트리거, 연노랑 페르소나(선택). 진행: 사람 초대 → 넓은 모델링 공간 → 이벤트 탐색 → 이벤트의 기원(명령·외부 트리거) → 집합체 찾기. 선택 목표로 하위 도메인, bounded context, 핵심 인수 테스트, 핵심 읽기 모델 스케치 (S114).
- 세 층위: Big Picture, Process Modelling, Software Design (S116, S117).
- 현재 흔한 범례(2차): 이벤트 주황, 명령 파랑, 행위자 작은 노랑, 정책 보라("When X, then Y"), 집합체 노란 직사각형, 읽기 모델 초록, 외부 시스템 분홍, 핫스팟 빨강 또는 진보라 (S118).
- 충돌: 보라색이 2013 원문에서는 외부·시간 트리거, 현재 범례에서는 정책 (S114 대 S118). 색은 워크숍마다 다르고 범례를 붙여 두는 관행이 중요.

### 11.5 도메인 스토리텔링

- Stefan Hofer, Henning Schwentner, *Domain Storytelling*, Addison-Wesley, 2021년 9월경 [출간일 요약 충돌].
- 그림 언어: 행위자(사람·역할, 막대 인물), 작업 객체(활동이 다루는 것), 활동(화살표와 동사), 순번, 주석. 문장 구조 예 "Cashier suggests available seats to moviegoer." 한 스토리에는 if·or가 없고 중요한 대안은 별도 스토리로 만든다 (S119).

### 11.6 요구사항 문장

- ISO/IEC/IEEE 29148:2018 개별 요구의 특성 아홉(2차): Appropriate, Complete, Conforming, Correct, Feasible, Necessary, Singular, Unambiguous, Verifiable (S120). 표준 원문은 유료라 미열람.
- 구문 지침 요약(2차): shall은 구속 요구, will은 사실·목적, should는 바람, may는 허용. 템플릿 [Condition] [Subject] [Action] [Object] [Constraint] (S121).
- EARS(Easy Approach to Requirements Syntax): Alistair Mavin 등, Rolls-Royce, IEEE RE'09(2009) 첫 발표 (S122, S123). 일반 구조 "While <precondition>, when <trigger>, the <system> shall <response>", 절 순서 고정. 기본 패턴 다섯과 조합형:
  - Ubiquitous: The <system> shall <response>.
  - Event-driven: When <trigger>, the <system> shall <response>.
  - State-driven: While <precondition>, the <system> shall <response>.
  - Unwanted behaviour: If <trigger>, then the <system> shall <response>.
  - Optional feature: Where <feature is included>, the <system> shall <response>.
  - Complex: 키워드 조합 (S122).

### 11.7 양식에서 스키마 뽑기

- Choobineh, Mannino, Nunamaker, Konsynski, "An Expert Database Design System Based on Analysis of Forms", *IEEE TSE* 14(2), 1988-02, pp.242–253: 폼 필드의 origin·hierarchy·cardinality를 잡고 관련 폼을 점진 병합해 개념 스키마를 만든다. 규칙 단계는 폼 선택 → 엔터티 식별 → 속성 부착 → 관계 식별 → 카디널리티 식별 → 무결성 제약 (S124).
- Choobineh, Venkatraman 1992, *Information Systems* 17(3): 업무 양식에서 함수 종속을 유도하는 방법 [요약].
- Batini·Ceri·Navathe의 양식 분석 장은 확인 못 함 (open question).

## 12. 자연어 문장에서 모델 뽑기

- Peter P. Chen, "English sentence structure and entity-relationship diagrams", *Information Sciences* 29(2–3), 1983, pp.127–149: 영어 구성 요소(명사·동사·형용사·부사·동명사·절)와 ER 도식의 대응, 번역 규칙 11개 [초록 요약, 본문 미열람] (S125).
- 문법–ER 대응표(Wikipedia, Chen 1997 출처로 표기): 보통 명사→개체 유형, 고유 명사→개체, 타동사→관계 유형, 자동사→속성 유형, 형용사→개체 속성, 부사→관계 속성 (S126). 1983 규칙 그대로인지 미확인.
- 규칙 일부(2차 발표 자료): 동명사는 관계를 개체 유형으로 바꾼 것, 절은 상위 개체 유형. 규칙들이 "hints and guidelines"에 가깝다는 평 [요약].
- 한계(Omar·Alsheky·Faiz 2021, JOPAS 20(2)): 규칙이 겹쳐 함께 쓰기 어렵고, 보통 명사가 모두 개체가 되지는 않는다. "a student has date of birth"의 date of birth는 개체가 아니다. 자기 데이터셋에서 잰 정확도라 일반화는 금물 (S127).
- Russell J. Abbott, "Program design by informal English descriptions", *CACM* 26(11), 1983-11, pp.882–894: 보통 명사→데이터 타입, 직접 참조→변수, 동사·속성→연산자 [초록 요약] (S125 서지 묶음). 동의어·암묵 정보를 Abbott의 한계로 직접 쓴 소스는 못 찾음 (open question).

## 13. 거친 자료에서 설계하기

### 13.1 데이터 프로파일링 [1차, 저자 원고]

- Abedjan, Golab, Naumann, "Profiling relational data: a survey", *The VLDB Journal* 24(4), 2015, pp.557–581 (S128).
- 정의(Johnson 인용): "Data profiling refers to the activity of creating small but informative summaries of a database."
- 분류: 단일 열(카디널리티, 값 분포, 패턴·자료형·도메인), 다중 열(상관·연관 규칙, 군집·이상치, 요약), 종속(유일성: 키 발견, 포함 종속: 외래 키 발견, 함수 종속; 각각 조건부·근사 변형).
- 유일 열 조합(UCC)은 "sets of columns whose values uniquely identify rows". 포함 종속은 한 열 집합의 값이 모두 다른 열 집합에 나타나는 것으로 외래 키의 전제. 함수 종속은 정규화에, 포함 종속은 조인 경로 제안에 쓰인다.
- 결정적 문장: 발견된 메타데이터는 주어진 인스턴스에 관한 것이라 값 도메인·기본 키·외래 키 같은 스키마 성질을 "with certainty" 도출할 수 없고 전문가 해석이 필요하다. "the chance existence of a dependency in the data at hand does not imply that this dependency is meaningful."
- 세 도전: 입력 관리, 계산, 출력 관리(결과 해석이 가장 어렵다).
- 실제 자료에는 규칙의 예외가 있으므로 조건부·부분·근사 변형을 둔다. 발견 결과를 제약으로 번역해 정제·통합 단계에서 강제할 수 있다.
- TANE(Huhtala, Kärkkäinen, Porkka, Toivonen, *The Computer Journal* 42(2), 1999): 속성 값으로 행을 분할해 함수 종속과 근사 종속을 찾고, 같은 분할로 오류·예외 행을 찾기 쉽다 (S129). Papenbrock 외 2015(PVLDB 8(10))가 일곱 알고리즘을 비교 (S130, 알고리즘 이름 목록 미확인).

### 13.2 데이터베이스 역공학

- Hainaut, Tonneau, Joris, Chandelon 1993, "Schema Transformation Techniques for Database Reverse Engineering"(ER'93, pp.353–372): 두 단계 — 특정 DBMS에 묶인 데이터 구조를 추출한 뒤 스키마 변환으로 의미를 복원(개념화). 최적화 구조 제거, 개념 정규화 등 (S131).
- Hainaut, Henrard, Roland, Englebert, Hick 1996, "Structure Elicitation in Database Reverse Engineering"(WCRE'96, pp.131–140): 구조와 제약은 흔히 선언되지 않고 절차 코드나 화면 동작으로 구현된다. 가장 흔한 암묵 구조인 외래 키를 이끌어 내는 기법 (S132).
- Chiang, Barron, Storey 1994, "Reverse engineering of relational databases: Extraction of an EER model from a relational database", *Data & Knowledge Engineering* 12(2), pp.107–142: 스키마 분석과 데이터 인스턴스 분석을 함께 써서 EER 모델을 뽑고 사람 입력이 필요한 곳을 표시 [요약].

### 13.3 JSON 스키마 추론

- Baazizi, Ben Lahmar, Colazzo, Ghelli, Sartiani, "Schema Inference for Massive JSON Datasets", EDBT 2017; 확장판 VLDB Journal 28(4), 2019: 항목마다 스키마를 뽑고 동치 관계로 합친다. 종류 동치(K)와 레이블 동치(L)가 간결함과 정밀함을 조절 [요약] (S133).
- quicktype: 샘플에서 JSON Schema를 추론하고, 검토·편집한 스키마를 커밋한 뒤 그 스키마로 코드를 만드는 흐름을 권함 (S134).
- GenSON: 같은 종류 객체는 속성을 합치고, 같은 키의 타입이 다르면 타입 목록으로 합친다. `required`는 모든 객체에 있었던 키만. 모든 입력이 출력 스키마에 맞아야 한다 (S135).

### 13.4 스프레드시트, 인터뷰·업무 기록

- Cunha, Saraiva, Visser, "From spreadsheets to relational databases and back", PEPM 2009: 데이터에서 함수 종속을 뽑아 관계 스키마를 만들고 되돌린다 [요약] (S136).
- Hermans, Pinzger, van Deursen, "Automatically Extracting Class Diagrams from Spreadsheets", ECOOP 2010: 시트의 반복 패턴으로 클래스 도식을 뽑는 도구 Gyro [요약] (S137).
- Wagner, Méndez Fernández, "Analysing Text in Software Projects", arXiv 1612.00164(2016): 소프트웨어 프로젝트의 텍스트를 수동 코딩·자동 방법·자연어 처리로 분석 (S138). 개방·축·선택 코딩과 포화 기준은 강의 자료 수준 [요약] (S139). 요구공학에서 정성 코딩으로 개념 스키마를 뽑은 1차 문헌은 못 찾음 (open question).

### 13.5 반례와 데이터 품질

- Rahm, Do, "Data Cleaning: Problems and Current Approaches", IEEE Data Engineering Bulletin, 2000-12: 품질 문제를 단일/다중 소스, 스키마/인스턴스 수준의 두 축으로 나눈다 [초록 + 요약] (S140).
- 거친 자료를 설계 결정으로 바꾸는 순서(조사자 종합, 단일 소스의 절차 아님): 프로파일링으로 후보 → 예외 행을 사람이 보고 오류인지 업무 예외인지 판단 → 제약으로 올림 / 정제 규칙 / 모델에서 허용 중 하나로 기록 → 올린 제약을 계약과 시나리오 표로 되돌려 적음.

## Open questions (부족·미결 자료)

- 1975 ANSI/SPARC 중간 보고서 본문과 Tsichritzis·Klug 1977/78 최종 보고서 원문(논리적·물리적 데이터 독립성의 원문 정의)을 보지 못했습니다. 정의는 NBS 1985 후속 보고서와 ISO/TR 9007로 대신했습니다.
- ISO/TR 9007 3장(일곱 원칙 가운데 나머지 넷, 세 층 구조 절)은 미리보기에 없어 확인하지 못했습니다.
- Dayal·Bernstein 1982, Keller 1985, SQL 표준 본문(갱신 가능 뷰 규정)은 서지와 2차 요약만 확인했습니다.
- Batini·Ceri·Navathe 1992 책 본문(전략·변환 원문, 품질 기준 여덟, 양식 분석 장)을 보지 못했습니다. 전략과 품질 기준은 같은 계열 교재 슬라이드와 Batini 2015 강의록으로 대신했고, 품질 기준 목록은 소스마다 다릅니다.
- Moody·Shanks의 품질 요인 목록은 2차 자료마다 여섯·일곱 요인으로 갈립니다.
- CSDP 3~7단계의 책 속 절 제목과 인구 검사의 책 속 정의 문장은 확인하지 못했습니다.
- Meyer 1986 기술 보고서 원문, Meyer 본인이 계약을 Hoare triple과 같다고 쓴 1차 문장은 확인하지 못했습니다.
- OpenAPI·AsyncAPI 명세 일부를 읽지 못해, 연산 단위 멱등성이나 전달·순서 보장을 적는 표준 필드가 없다는 것은 열람 범위 안의 추론입니다.
- Confluent 문서의 Avro/Protobuf 변경 허용 표에서 필수 필드 추가·삭제 칸을 확인하지 못했습니다.
- ODCS 릴리스 연도는 릴리스 페이지에 연도가 없어 2차 자료로 맞췄고, v3.1.0의 호환성 서술은 두 공식 자료가 서로 다릅니다.
- Chen 1983의 번역 규칙 11개 원문, Hainaut 역공학의 단계 세부, Chiang·Barron·Storey 1994의 절차, ISO/IEC/IEEE 29148 원문, JSON 스키마 추론 논문 본문, Rahm·Do 본문은 확인하지 못했습니다.
- 이벤트 스토밍의 색 범례에는 정본이 없습니다. 2013년 원문과 현재 관행이 보라색의 뜻에서 다릅니다.
- REST·GraphQL·CQRS·BFF를 외부 스키마로 보는 문헌, 계약과 ANSI/SPARC 외부 스키마를 직접 잇는 문헌, 요구공학에서 정성 코딩으로 개념 스키마를 뽑은 1차 문헌은 찾지 못했습니다.

## 주장 ↔ 소스 매핑

- 세 층의 정의와 층 사이 사상, 데이터 독립성 한 문장: S3, S1
- 개념 스키마는 유일한 중심 기술이고 외부 스키마는 거기서 파생된다: S1
- 담화 세계·개념 스키마·정보 베이스 정의, 100% 원칙, 개념화 원칙, Helsinki 원칙: S1 (경위 S25)
- 개념 스키마 시설 요구 5·6이 논리적·물리적 독립성에 해당: S1
- 뷰는 이름 붙여 저장한 질의, 뷰 갱신 문제와 보완 뷰·고정 보완 번역: S8, S9
- 뷰 갱신 연구사: S10
- PostgreSQL 자동 갱신 가능 뷰 조건과 WITH CHECK OPTION, 표준 기능 T111 미지원: S12, S14
- REST 자원·표현, GraphQL 타입 시스템, CQRS, BFF, 서비스 경계 안팎 데이터: S21, S19, S17, S18, S20, S24
- 세 층 구조의 한계, 전사 단일 모델 비판: S3, S16, S2, S22, S23
- ER 모델의 개념과 네 층 관점, 약한 개체: S27
- CSDP 7단계와 기본 사실, 인구 검사, data use case: S28, S29, S30
- 설계 전략 넷과 변환, 요구 분석 규칙: S33, S34
- 스키마 통합 네 단계와 충돌 분류, 통합 스키마 기준: S32
- 스키마 품질 기준(목록 충돌), 구문·의미·화용 품질: S33, S34, S32, S36, S37, S38
- 데이터 독립성 목표와 인덱스는 중복 구성 요소라는 Codd의 서술: S39
- 물리 설계의 입력은 작업 부하, 인덱스·비정규화·수평 분할 결정: S42, S32
- PostgreSQL 인덱스 종류·부분 인덱스·분할·실체화 뷰: S43, S44, S45, S46, S47, S48, S49
- ER→관계 사상 규칙과 하위 유형 사상 넷: S51, ORM 사상 S28
- 계약의 의무·이익, 사전·사후조건·불변식, 하위 유형 규칙: S54, S55, S56, S58
- OpenAPI·JSON Schema·AsyncAPI·Arazzo의 범위와 버전: S60, S61, S63, S64, S66, S67, S68, S69
- 멱등 메서드 정의: S70
- 제공자 계약·소비자 계약·소비자 주도 계약, Tolerant Reader, Pact: S71, S72, S73, S74, S76
- 데이터 계약(ODCS)의 구성과 버전, DCS 폐기: S78, S79, S80, S81, S82, S83, S86
- 진화 호환성 유형과 업그레이드 순서, Avro·Protobuf 규칙, JSON Schema 진화 규칙 부재: S90, S91, S92, S93, S94, S95
- Postel 법칙, RFC 9413, Hyrum 법칙, Semver: S96, S97, S98, S99, S100
- 서비스 계약은 상호작용에 관한 단언의 집합(DDD), Published Language, Anticorruption Layer: S101
- 유스케이스 템플릿과 작성 단계, 데이터 정밀도 규칙: S102, S103, S105
- 사용자 스토리, INVEST, 3C: S107, S109, S110, S111
- Gherkin 키워드: S112
- 이벤트 스토밍 원문과 현재 범례: S114, S118
- 도메인 스토리텔링 그림 언어: S119
- 29148 특성(2차)과 EARS 패턴: S120, S122, S123
- 양식 분석으로 개념 스키마 만들기: S124
- 자연어에서 ER 뽑기와 한계: S125, S126, S127
- 프로파일링 분류, 인스턴스로는 스키마 성질을 확실히 도출할 수 없다: S128
- 근사 종속과 예외 행: S129
- 역공학 두 단계와 암묵 구조: S131, S132
- JSON 스키마 추론: S133, S134, S135
- 스프레드시트에서 관계 스키마·클래스 도식 뽑기: S136, S137
- 충돌 항목: 이벤트 스토밍 보라색 S114(외부·시간 트리거) 대 S118(정책) — 원문은 S114, 관행은 2차. ODCS v3.1.0 S84("zero breaking changes") 대 S79("Breaking JSON Schema change") — 둘 다 공식 쪽 자료라 판정 보류. 품질 기준 목록 S33(넷) 대 S34(여덟) 대 2차 인용(여덟, 다른 항목) — 책 원문 확인 전까지 판정 보류. Cockburn 목표 수준 기호 S103 대 S105.


## 소스 목록

- S1. ISO/TR 9007:1987 미리보기 PDF — https://assets.vde-verlag.de/iec-normen/preview-pdf/info_iso9007%7Bed1.0%7Den.pdf (게시일: 1987-07-01, 조회일: 2026-11-17)
- S2. Partridge 외, "Disentangling the schema turn", arXiv 2509.01617 — https://arxiv.org/pdf/2509.01617 (게시일: 2025-09, 조회일: 2026-11-17)
- S3. ANSI/X3/SPARC DAFTG, "Reference Model for DBMS Standardization", NBS IR 85-3173 — https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nbsir85-3173.pdf (게시일: 1985-05, 조회일: 2026-11-17)
- S4. Interim Report 75-02-08 서지 — https://researchr.org/publication/SPARC75 (게시일: 1975, 조회일: 2026-11-17)
- S5. FDT 7(3-4) 편집자 노트 — https://sigmodrecord.org/publications/sigmodRecord/7509/pdfs/984403.fm.pdf (게시일: 1975, 조회일: 2026-11-17)
- S6. Tsichritzis·Klug, Information Systems 3(3) 서지 — https://www.sciencedirect.com/science/article/abs/pii/0306437978900017 (게시일: 1978, 조회일: 2026-11-17)
- S7. Klug·Tsichritzis, VLDB 1977 서지·초록 — https://www.vldb.org/dblp/db/conf/vldb/KlugT77.html (게시일: 1977, 조회일: 2026-11-17)
- S8. Bancilhon·Spyratos, Update Semantics of Relational Views — https://cs.uwaterloo.ca/~david/cs848/background/constant-complement.pdf (게시일: 1981-12, 조회일: 2026-11-17)
- S9. Guagliardo·Franconi, On the translatability of view updates, KRDB12-1 — https://www.inf.unibz.it/krdb/wp-content/KRDB%20files/tech-reports/KRDB12-1.pdf (게시일: 2012-03-12, 조회일: 2026-11-17)
- S10. Masunaga, A relational database view update translation mechanism, VLDB 1984 — https://www.vldb.org/conf/1984/P309.PDF (게시일: 1984-08, 조회일: 2026-11-17)
- S11. Dayal·Bernstein(TODS 7(3), VLDB 1978), Keller(PODS 1985) 서지 — https://scilit.com/publications/b8ea9a62739767f19e6c61e617d2b1bb , https://www.vldb.org/dblp/db/conf/vldb/DayalB78.html , https://bibtex.github.io/PODS-1985-Keller.html (게시일: 1982-09 등, 조회일: 2026-11-17)
- S12. PostgreSQL, CREATE VIEW — https://www.postgresql.org/docs/current/sql-createview.html (게시일: 미상(현행판), 조회일: 2026-11-17)
- S13. PostgreSQL, Rules on INSERT, UPDATE, and DELETE — https://www.postgresql.org/docs/current/rules-update.html (게시일: 미상, 조회일: 2026-11-17)
- S14. PostgreSQL 부록 D, SQL Conformance — https://www.postgresql.org/docs/current/features-sql-standard.html (게시일: 미상(PostgreSQL 18), 조회일: 2026-11-17)
- S15. Clemons, An External Schema Facility for CODASYL 1978, VLDB 1979 — https://vldb.org/dblp/db/conf/vldb/Clemons79.html (게시일: 1979, 조회일: 2026-11-17)
- S16. Wikipedia, Three-schema approach / ANSI-SPARC Architecture / Data Base Task Group(2차) — https://en.wikipedia.org/wiki/ANSI-SPARC_Architecture (게시일: 미상, 조회일: 2026-11-17)
- S17. Martin Fowler, CQRS — https://martinfowler.com/bliki/CQRS.html (게시일: 2011-07-14, 조회일: 2026-11-17)
- S18. Microsoft Learn, CQRS Pattern — https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs (게시일: 2025-02-20, 조회일: 2026-11-17)
- S19. GraphQL Specification, October 2021 — https://spec.graphql.org/October2021/ (게시일: 2021-10, 조회일: 2026-11-17)
- S20. Sam Newman, Backends For Frontends — https://samnewman.io/patterns/architectural/bff/ (게시일: 2015-11-18, 조회일: 2026-11-17)
- S21. Fielding, 박사 논문 5장과 2003년 www-tag 메일 — https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm , https://lists.w3.org/Archives/Public/www-tag/2003Jul/0323.html (게시일: 2000 / 2003-07-25, 조회일: 2026-11-17)
- S22. Martin Fowler, Bounded Context — https://martinfowler.com/bliki/BoundedContext.html (게시일: 2014-01-15, 조회일: 2026-11-17)
- S23. Stefan Tilkov, Thoughts on a Canonical Data Model — https://www.innoq.com/en/blog/thoughts-on-a-canonical-data-model/ (게시일: 2015-03-30, 조회일: 2026-11-17)
- S24. Pat Helland, Data on the Outside versus Data on the Inside, CIDR 2005 — https://www.cidrdb.org/cidr2005/papers/P12.pdf (게시일: 2005, 조회일: 2026-11-17)
- S25. van Griethuysen, The Orange Report ISO TR9007 (1982-1987), Business Rules Journal(2차) — https://www.brcommunity.com/articles.php?id=b479 (게시일: 2009-05, 조회일: 2026-11-17)
- S26. Wikipedia, Data independence(2차) — https://en.wikipedia.org/wiki/Data_independence (게시일: 미상, 조회일: 2026-11-17)
- S27. Chen, The Entity-Relationship Model, ACM TODS 1(1) — https://www.comp.nus.edu.sg/~lingtw/papers/tods76.chen.pdf (게시일: 1976-03, 조회일: 2026-11-17)
- S28. Halpin, Object-Role Modeling: an overview — https://www.orm.net/pdf/ORMwhitePaper.pdf (게시일: 미상(2001년경), 조회일: 2026-11-17)
- S29. Halpin, Fact-Orientation before Object-Orientation (Part 1): The Case for Data Use Cases — https://www.brcommunity.com/articles.php?id=a430 (게시일: 1999-11, 조회일: 2026-11-17)
- S30. Halpin, Fact-orientation before Object-orientation (Part 2) — https://www.brcommunity.com/articles.php?id=b023 (게시일: 2000-07, 조회일: 2026-11-17)
- S31. Wikipedia, Object–role modeling(2차) — https://en.wikipedia.org/wiki/Object%E2%80%93role_modeling (게시일: 미상, 조회일: 2026-11-17)
- S32. Batini·Lenzerini·Navathe, A Comparative Analysis of Methodologies for Database Schema Integration — https://www.comp.nus.edu.sg/~lingtw/papers/batini.pdf (게시일: 1986-12, 조회일: 2026-11-17)
- S33. Atzeni 외, Database Systems 6장 개념 설계 슬라이드 — https://users.dimi.uniud.it/~dario.dellamonica/teaching/21_22_1sem_BDlab/slides_lezioni/02_progettazione_concettuale.pdf (게시일: 1999, 조회일: 2026-11-17)
- S34. Batini, Course on Database Design, Part 4 Conceptual Design — https://www.myecole.it/biblio/wp-content/uploads/2020/11/Part-4-Conceptual-design.pdf (게시일: 2015, 조회일: 2026-11-17)
- S35. Shanks, Conceptual Data Modelling: An Empirical Study of Expert and Novice Data Modellers — https://distantreader.org/stacks/journals/ajis02/ajis02-360.htm (게시일: 1997-05, 조회일: 2026-11-17)
- S36. Krogstie·Lindland·Sindre, Defining quality aspects for conceptual models — https://folk.idi.ntnu.no/krogstie/publications/1995/ISCO3/fulltext.pdf (게시일: 1995, 조회일: 2026-11-17)
- S37. Wikipedia, SEQUAL framework(2차) — https://en.wikipedia.org/wiki/SEQUAL_framework (게시일: 미상, 조회일: 2026-11-17)
- S38. Moody ECIS 2003 초록, Moody·Shanks 서지 — https://aisel.aisnet.org/ecis2003/78 (게시일: 2003, 조회일: 2026-11-17)
- S39. Codd, A Relational Model of Data for Large Shared Data Banks — https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf (게시일: 1970-06, 조회일: 2026-11-17)
- S40. Wikipedia, Database normalization(2차) — https://en.wikipedia.org/wiki/Database_normalization (게시일: 미상, 조회일: 2026-11-17)
- S41. Fagin, Multivalued Dependencies and a New Normal Form for Relational Databases(초록만) — https://www.comp.nus.edu.sg/~lingtw/papers/fagin.pdf (게시일: 1977-09, 조회일: 2026-11-17)
- S42. Ramakrishnan·Gehrke, Physical Database Design 슬라이드 — https://pages.cs.wisc.edu/~dbbook/openAccess/thirdEdition/slides/slides3ed-english/Ch20_DB_Tuning.pdf (게시일: 미상, 조회일: 2026-11-17)
- S43. PostgreSQL, Index Types — https://www.postgresql.org/docs/current/indexes-types.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- S44. PostgreSQL, Table Partitioning — https://www.postgresql.org/docs/current/ddl-partitioning.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- S45. PostgreSQL, CREATE MATERIALIZED VIEW — https://www.postgresql.org/docs/current/sql-creatematerializedview.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- S46. PostgreSQL, Multicolumn Indexes — https://www.postgresql.org/docs/current/indexes-multicolumn.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- S47. PostgreSQL, Partial Indexes — https://www.postgresql.org/docs/current/indexes-partial.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- S48. PostgreSQL, Indexes Introduction — https://www.postgresql.org/docs/current/indexes-intro.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- S49. PostgreSQL, How the Planner Uses Statistics — https://www.postgresql.org/docs/current/planner-stats.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- S50. Chaudhuri·Narasayya, An Efficient, Cost-Driven Index Selection Tool for Microsoft SQL Server — https://www.microsoft.com/en-us/research/publication/an-efficient-cost-driven-index-selection-tool-for-microsoft-sql-server/ (게시일: 1997, 조회일: 2026-11-17)
- S51. Elmasri·Navathe, Fundamentals of Database Systems 7장 슬라이드 — https://www.cs.purdue.edu/homes/bb/cs448_Spring2014/lecture-files/pdf/ch07-Relational%20Database%20Design%20by%20ER-%20and%20EERR-to-Relational%20Mapping.pdf (게시일: 2007, 조회일: 2026-11-17)
- S52. Halpin·Morgan, Information Modeling and Relational Databases 3판 서지 — https://shop.elsevier.com/books/information-modeling-and-relational-databases/halpin/978-0-443-23790-4 (게시일: 2024-07-11, 조회일: 2026-11-17)
- S53. Lightstone·Teorey·Nadeau, Physical Database Design 서지 — https://libcat.library.tamu.edu/Record/in00002429676 (게시일: 2007, 조회일: 2026-11-17)
- S54. Meyer, "Applying 'Design by Contract'", IEEE Computer 25(10) — https://www.kth.se/social/files/59526bfb56be5b4f17000807/meyer-92-contracts.pdf (게시일: 1992-10, 조회일: 2026-11-17)
- S55. Eiffel Tutorial, Design by Contract, Assertions and Exceptions — https://www.eiffel.org/doc/eiffel/ET-_Design_by_Contract_%28tm%29%2C_Assertions_and_Exceptions (게시일: 미상, 조회일: 2026-11-17)
- S56. Eiffel Tutorial, Inheritance — https://www.eiffel.org/doc/eiffel/ET-_Inheritance (게시일: 미상, 조회일: 2026-11-17)
- S57. Wikipedia, Design by contract(2차, 서지 확인용) — https://en.wikipedia.org/wiki/Design_by_contract (게시일: 미상, 조회일: 2026-11-17)
- S58. Hoare, "An Axiomatic Basis for Computer Programming", CACM 12(10) — https://www.cs.cmu.edu/~crary/819-f09/Hoare69.pdf (게시일: 1969-10, 조회일: 2026-11-17)
- S59. OOSC 2판 서지(Wikipedia, 서점 목록) — https://en.wikipedia.org/wiki/Object-Oriented_Software_Construction (게시일: 미상, 조회일: 2026-11-17)
- S60. OpenAPI Specification v3.2.1 — https://spec.openapis.org/oas/latest.html (게시일: 2026-09-10, 조회일: 2026-11-17)
- S61. OAI/OpenAPI-Specification Releases — https://github.com/OAI/OpenAPI-Specification/releases (게시일: 연도 표시 없음, 조회일: 2026-11-17)
- S62. OpenAPI 3.2.0 릴리스 노트(Speakeasy) — https://speakeasy.com/openapi/release-notes (게시일: 2025-09-19, 조회일: 2026-11-17)
- S63. JSON Schema Specification — https://json-schema.org/specification (게시일: 미상, 조회일: 2026-11-17)
- S64. JSON Schema Core 2020-12 (draft-bhutton-json-schema-01) — https://json-schema.org/draft/2020-12/json-schema-core (게시일: 2022-06-16, 조회일: 2026-11-17)
- S65. JSON Schema 2020-12 released (Open Collective) — https://opencollective.com/json-schema/updates/json-schema-2020-12-released (게시일: 2020-12경, 조회일: 2026-11-17)
- S66. AsyncAPI Specification 3.0.0 — https://www.asyncapi.com/docs/reference/specification/v3.0.0 (게시일: 2023-12-05, 조회일: 2026-11-17)
- S67. AsyncAPI 3.0.0 Release Notes — https://www.asyncapi.com/blog/release-notes-3.0.0 (게시일: 2023-12-05, 조회일: 2026-11-17)
- S68. AsyncAPI 3.1.0 Release Notes — https://www.asyncapi.com/blog/release-notes-3.1.0 (게시일: 2026-01-31, 조회일: 2026-11-17)
- S69. Arazzo Specification v1.1.0 — https://spec.openapis.org/arazzo/latest.html (게시일: 2026-05-17, 조회일: 2026-11-17)
- S70. RFC 9110 HTTP Semantics — https://www.rfc-editor.org/rfc/rfc9110.html (게시일: 2022-06, 조회일: 2026-11-17)
- S71. Ian Robinson, Consumer-Driven Contracts — https://martinfowler.com/articles/consumerDrivenContracts.html (게시일: 2006-06-12, 조회일: 2026-11-17)
- S72. Martin Fowler, Tolerant Reader — https://martinfowler.com/bliki/TolerantReader.html (게시일: 2011-05-09, 조회일: 2026-11-17)
- S73. Pact Docs — https://docs.pact.io/ (게시일: 미상, 조회일: 2026-11-17)
- S74. Pact Docs, How Pact works — https://docs.pact.io/getting_started/how_pact_works (게시일: 미상, 조회일: 2026-11-17)
- S75. Pact Docs, Terminology — https://docs.pact.io/getting_started/terminology (게시일: 미상, 조회일: 2026-11-17)
- S76. Pact Docs, can-i-deploy — https://docs.pact.io/pact_broker/can_i_deploy (게시일: 미상, 조회일: 2026-11-17)
- S77. Pact Docs, Pending pacts — https://docs.pact.io/pact_broker/advanced_topics/pending_pacts (게시일: 미상, 조회일: 2026-11-17)
- S78. ODCS 문서 최신판 — https://bitol-io.github.io/open-data-contract-standard/latest/ (게시일: 미상, 조회일: 2026-11-17)
- S79. ODCS Releases — https://github.com/bitol-io/open-data-contract-standard/releases (게시일: 연도 표시 없음, 조회일: 2026-11-17)
- S80. ODCS Fundamentals — https://bitol-io.github.io/open-data-contract-standard/latest/fundamentals/ (게시일: 미상, 조회일: 2026-11-17)
- S81. ODCS Schema — https://bitol-io.github.io/open-data-contract-standard/latest/schema/ (게시일: 미상, 조회일: 2026-11-17)
- S82. ODCS Data Quality — https://bitol-io.github.io/open-data-contract-standard/latest/data-quality/ (게시일: 미상, 조회일: 2026-11-17)
- S83. ODCS Service-Level Agreement — https://bitol-io.github.io/open-data-contract-standard/latest/service-level-agreement/ (게시일: 미상, 조회일: 2026-11-17)
- S84. Bitol, ODCS v3.1.0 발표 — https://bitol.io/bitol-announces-odcs-v3-1-0-stronger-smarter-and-stricter/ (게시일: 2025-12-07, 조회일: 2026-11-17)
- S85. ODCS 저장소 — https://github.com/bitol-io/open-data-contract-standard (게시일: 미상, 조회일: 2026-11-17)
- S86. Data Contract Specification 저장소(폐기 공지) — https://github.com/datacontract/datacontract-specification (게시일: 미상, 조회일: 2026-11-17)
- S87. Data Contract CLI, Migrate DCS to ODCS — https://cli.datacontract.com/migrate-dcs-to-odcs (게시일: 미상, 조회일: 2026-11-17)
- S88. Andrew Jones, Driving Data Quality with Data Contracts — https://www.oreilly.com/library/view/driving-data-quality/9781837635009/ (게시일: 2023-06, 조회일: 2026-11-17)
- S89. BARC, ODCS 3.2 분석(2차) — https://barc.com/odcs-3-2-data-contract-standard/ (게시일: 2026-09경, 조회일: 2026-11-17)
- S90. Confluent, Schema Evolution and Compatibility — https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html (게시일: 미상, 조회일: 2026-11-17)
- S91. Confluent, Schema Evolution and Compatibility(6.1판) — https://docs.confluent.io/platform/6.1/schema-registry/avro.html (게시일: 미상, 조회일: 2026-11-17)
- S92. Robert Yokota, Understanding JSON Schema Compatibility — https://yokota.blog/2021/03/29/understanding-json-schema-compatibility/ (게시일: 2021-03-29, 조회일: 2026-11-17)
- S93. Apache Avro 1.12.0 Specification — https://avro.apache.org/docs/1.12.0/specification/ (게시일: 미상, 조회일: 2026-11-17)
- S94. Protocol Buffers Language Guide (proto 3) — https://protobuf.dev/programming-guides/proto3/ (게시일: 미상, 조회일: 2026-11-17)
- S95. Protocol Buffers Dos and Don'ts — https://protobuf.dev/best-practices/dos-donts/ (게시일: 미상, 조회일: 2026-11-17)
- S96. RFC 761 — https://www.rfc-editor.org/rfc/rfc761.txt (게시일: 1980-01, 조회일: 2026-11-17)
- S97. RFC 1122 — https://www.rfc-editor.org/rfc/rfc1122.txt (게시일: 1989-10, 조회일: 2026-11-17)
- S98. RFC 9413 Maintaining Robust Protocols — https://www.rfc-editor.org/rfc/rfc9413.html (게시일: 2023-06, 조회일: 2026-11-17)
- S99. Hyrum's Law — https://www.hyrumslaw.com/ (게시일: 미상, 조회일: 2026-11-17)
- S100. Semantic Versioning 2.0.0 — https://semver.org/ (게시일: 미상, 조회일: 2026-11-17)
- S101. Eric Evans, Domain-Driven Design Reference — https://domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf (게시일: 2015-03, 조회일: 2026-11-17)
- S102. Writing Effective Use Cases 샘플 장(Pearson) — https://ptgmedia.pearsoncmg.com/images/9780201702255/samplepages/0201702258.pdf (게시일: 미상, 조회일: 2026-11-17)
- S103. Writing Effective Use Cases 사전 출판 초안 발췌 — https://courses.cs.duke.edu/compsci308/spring23/readings/cockburn_use_cases.pdf (게시일: 2000-02-21, 조회일: 2026-11-17)
- S104. Writing Effective Use Cases(InformIT) — https://www.informit.com/store/writing-effective-use-cases-9780201702255 (게시일: 2000-10-05, 조회일: 2026-11-17)
- S105. Wikipedia, Use case — https://en.wikipedia.org/wiki/Use_case (게시일: 미상, 조회일: 2026-11-17)
- S106. Cockburn use case writing guide(3자 요약, 저신뢰) — https://cdn.jsdelivr.net/npm/usecases-skill@0.1.0/skills/usecases/use-case-guide.md (게시일: 미상, 조회일: 2026-11-17)
- S107. Mike Cohn, Why the Three-Part User Story Template Works So Well — https://www.mountaingoatsoftware.com/blog/why-the-three-part-user-story-template-works-so-well (게시일: 미상, 조회일: 2026-11-17)
- S108. Mountain Goat Software, User Stories — https://www.mountaingoatsoftware.com/agile/user-stories (게시일: 미상, 조회일: 2026-11-17)
- S109. Dan North, Introducing BDD — https://dannorth.net/blog/introducing-bdd/ (게시일: 2006-09-20, 조회일: 2026-11-17)
- S110. Bill Wake, INVEST in Good Stories, and SMART Tasks — https://xp123.com/invest-in-good-stories-and-smart-tasks/ (게시일: 2003-08-17, 조회일: 2026-11-17)
- S111. Ron Jeffries, Essential XP: Card, Conversation, Confirmation — https://ronjeffries.com/xprog/articles/expcardconversationconfirmation (게시일: 2001-08-30, 조회일: 2026-11-17)
- S112. Cucumber, Gherkin Reference — https://cucumber.io/docs/gherkin/reference/ (게시일: 미상, 조회일: 2026-11-17)
- S113. Gojko Adzic, Specification by Example(Manning) — https://manning.com/adzic (게시일: 2011-06, 조회일: 2026-11-17)
- S114. Alberto Brandolini, Introducing Event Storming — https://ziobrando.blogspot.com/2013/11/introducing-event-storming.html (게시일: 2013-11-18, 조회일: 2026-11-17)
- S115. Wikipedia, Event storming — https://en.wikipedia.org/wiki/Event_storming (게시일: 미상(최종 편집 2026-02-18), 조회일: 2026-11-17)
- S116. EventStorming Resources — https://www.eventstorming.com/resources/ (게시일: 미상, 조회일: 2026-11-17)
- S117. EventStorming 홈페이지 — https://www.eventstorming.com/ (게시일: 미상, 조회일: 2026-11-17)
- S118. SAP curated resources for DDD, EventStorming(2차) — https://github.com/SAP/curated-resources-for-domain-driven-design/blob/main/knowledgebase/tools/eventstorming.md (게시일: 미상, 조회일: 2026-11-17)
- S119. Domain Storytelling 발췌(InformIT) — https://www.informit.com/articles/article.aspx?p=3129449&seqNum=2 (게시일: 미상, 조회일: 2026-11-17)
- S120. Leveraging LLMs for the Quality Assurance of Software Requirements(29148 특성 2차) — https://arxiv.org/html/2408.10886 (게시일: 2024-08, 조회일: 2026-11-17)
- S121. Requirements fundamentals(SWEBOK 기반 교수 사이트, 2차) — https://sites.google.com/site/profvanselow/swebok/software-requirements-ch-1/1-2-requirements-fundamentals (게시일: 미상, 조회일: 2026-11-17)
- S122. Alistair Mavin, EARS — https://alistairmavin.com/ears/ (게시일: 미상, 조회일: 2026-11-17)
- S123. Wikipedia, Easy Approach to Requirements Syntax — https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax (게시일: 미상, 조회일: 2026-11-17)
- S124. Choobineh 외, An Expert Database Design System Based on Analysis of Forms — https://experts.arizona.edu/en/publications/an-expert-database-design-system-based-on-analysis-of-forms/ (게시일: 1988-02, 조회일: 2026-11-17)
- S125. Chen 1983 서지(Information Sciences 29) — https://www.sciencedirect.com/science/article/abs/pii/0020025583900142 (게시일: 1983, 조회일: 2026-11-17)
- S126. Wikipedia, Entity–relationship model — https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model (게시일: 미상, 조회일: 2026-11-17)
- S127. Omar 외, Novel rules for extracting the entities of entity relationship models, JOPAS 20(2) — https://sebhau.edu.ly/journal/jopas/article/download/1329/659/1710 (게시일: 2021, 조회일: 2026-11-17)
- S128. Abedjan·Golab·Naumann, Profiling Relational Data: A Survey(저자 원고) — https://hpi.de/oldsite/fileadmin/user_upload/fachgebiete/naumann/publications/2015/dataprofiling_main.pdf (게시일: 2015, 조회일: 2026-11-17)
- S129. TANE(Helsinki 대학) — https://www.cs.helsinki.fi/research/fdk/datamining/tane/ (게시일: 1999, 조회일: 2026-11-17)
- S130. Papenbrock 외, Functional Dependency Discovery: An Experimental Evaluation of Seven Algorithms — https://hpi.de/oldsite/fileadmin/user_upload/fachgebiete/naumann/publications/PDFs/2015_papenbrock_functional.pdf (게시일: 2015, 조회일: 2026-11-17)
- S131. Hainaut 외, Schema Transformation Techniques for Database Reverse Engineering — https://researchportal.unamur.be/en/publications/schema-transformation-techniques-for-database-reverse-engineering (게시일: 1993, 조회일: 2026-11-17)
- S132. Hainaut 외, Structure Elicitation in Database Reverse Engineering — https://researchportal.unamur.be/en/publications/structure-elicitation-in-database-reverse-engineering (게시일: 1996, 조회일: 2026-11-17)
- S133. Baazizi 외, Parametric schema inference for massive JSON datasets — https://researchportal.ip-paris.fr/en/publications/parametric-schema-inference-for-massive-json-datasets/ (게시일: 2019-08, 조회일: 2026-11-17)
- S134. quicktype — https://github.com/glideapps/quicktype (게시일: 미상, 조회일: 2026-11-17)
- S135. GenSON — https://github.com/wolverdude/GenSON (게시일: 미상, 조회일: 2026-11-17)
- S136. Cunha 외, From spreadsheets to relational databases and back — https://docentes.fct.unl.pt/jmc-cunha/publications/spreadsheets-relational-databases-and-back (게시일: 2009, 조회일: 2026-11-17)
- S137. Hermans 외, Automatically Extracting Class Diagrams from Spreadsheets — https://research.vu.nl/en/publications/automatically-extracting-class-diagrams-from-spreadsheets/ (게시일: 2010, 조회일: 2026-11-17)
- S138. Wagner·Méndez Fernández, Analysing Text in Software Projects — https://arxiv.org/abs/1612.00164 (게시일: 2016-12-01, 조회일: 2026-11-17)
- S139. 정성 코딩 강의 자료(2차) — https://third-bit.com/ds4se/grounded/ (게시일: 미상, 조회일: 2026-11-17)
- S140. Rahm·Do, Data Cleaning: Problems and Current Approaches — https://dbs.uni-leipzig.de/en/publication/title/data_cleaning_problems_and_current_approaches (게시일: 2000-12, 조회일: 2026-11-17)

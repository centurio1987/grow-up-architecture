## 2. 개념 스키마 설계 방법론

### 2.1 Chen 1976 [1차]

- Peter Pin-Shan Chen, "The Entity-Relationship Model — Toward a Unified View of Data", *ACM TODS* 1(1), 1976-03, pp.9–36 (B-S1).
- 네트워크·관계형·엔터티 집합 모델의 관점을 하나로 묶는 바탕을 목표로 하고, "the real world consists of entities and relationships"라는 관점을 택한다.
- 네 층 관점(§2.1): 층 1 머릿속의 개체와 관계에 관한 정보, 층 2 정보 구조, 층 3 접근 경로와 무관한 데이터 구조, 층 4 접근 경로에 의존하는 데이터 구조. 네트워크 모델은 주로 층 4, 관계형은 층 3·2, ER은 층 1·2에서 출발. ANSI/SPARC 세 층과는 다른 축이다(조사자 해석).
- entity: "a 'thing' which can be distinctly identified". relationship: "an association among entities". role: 관계 안에서 개체가 하는 기능(husband, wife). value set과 attribute: attribute는 개체 집합이나 관계 집합에서 value set으로 가는 함수. "attribute and value set are different concepts although they may have the same name".
- 관계의 속성: PROJECT-WORKER의 PERCENTAGE-OF-TIME은 직원의 속성도 프로젝트의 속성도 아니다.
- 약한 개체: 자기 속성만으로 식별되지 않는 개체(직원의 DEPENDENT는 이름 + 직원 번호로 식별). 식별은 1:n 관계로만 한다.
- ER 도식: 개체 집합은 직사각형, 관계 집합은 마름모, 약한 개체는 이중 테두리.

### 2.2 ORM/NIAM과 CSDP [1차, Halpin 개요]

- Terry Halpin, "Object-Role Modeling: an overview"(Microsoft, 2001년경) (B-S2). 초기 형태는 1970년대 중반 유럽의 이항 관계 모델링과 NIAM. 책: Halpin·Morgan, *Information Modeling and Relational Databases*, 2판 2008, 3판 2024 (B-S26, 서지만).
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

- 큰 응용은 담화 세계를 모듈로 나눠 모듈마다 CSDP를 돌린 뒤 하위 스키마를 전역 개념 스키마로 통합 (B-S2).
- 1단계가 가장 중요하다("Step 1 is the most important stage of the CSDP"). 시스템이 다룰 정보 사례(출력 보고서·입력 양식)를 자연어로 말로 옮기고, 영역 전문가가 검증한다. 예: 교수 명부 표의 첫 행에서 "The Academic with empNr 715 has EmpName 'Adams A'" 같은 사실을 뽑는다. 품질 검사: 객체가 잘 식별되는가(값과 개체 구분, 개체는 참조 방식으로 식별), 문장에 "and"가 있으면 쪼갤 수 있는가 (B-S2).
- 기본 사실(elementary fact): 객체가 속성을 갖거나 객체들이 관계에 참여한다고 단언하되, 더 단순한 사실들의 연언으로 나눌 수 없는 것. "Bill Clinton jogs and is the president of the USA"는 기본 사실 둘 (B-S2).
- 2단계 인구 검사: 각 사실 유형을 표본 행으로 채워 본다. 표본은 고객과 모델을 검증하고 제약을 이해하는 데 쓰지만 스키마 도식의 일부는 아니다 (B-S2). 반례를 넣어 전문가가 그 패턴이 가능한지 확인하는 방식(영화 제목이 유일하지 않은 표본으로 추정 유일성 제약을 반증) (B-S4).
- 3단계: 같은 술어를 공유하는 개체 유형을 합치고(교수·부교수·강사 → Academic, 원래 정보는 "Academic has Rank"로 보존), 산술로 유도되는 사실 유형은 표시하고 규칙을 준다 (B-S2).
- 4단계: 유일성 제약은 역할 항목이 최대 한 번 나타난다는 선언. 유일성이 두 역할을 빠뜨린 n항 사실 유형은 쪼갠다. "If a fact type is elementary all its functional dependencies (FDs) are implied by uniqueness constraints" (B-S2).
- 5단계: 필수 역할 제약(그 유형의 모든 객체가 그 역할을 함), 여러 역할에 걸친 포괄적 논리합 제약. 논리 유도 검사(규칙을 데이터 표로 저장하고 유도 규칙으로 계산) (B-S2).
- 6단계: 값 제약(열거·범위), 집합 비교 제약(부분집합·동등·배타), 하위 유형 (B-S2).
- 7단계: 고리 제약, 빈도 제약 등, 그리고 원래 사례와의 일관성·중복 없음·완전성 최종 점검 (B-S2).
- data use case(Halpin 1999, Business Rules Journal): UML 유스케이스에 빗대 주제 전문가에게 친숙한 정보 표본(보고서·화면·양식)을 부르는 말. 전문가가 표의 행을 읽고, 모델러가 기본 사실 문장으로 다시 쓰고, 전문가가 검증하고, 모델러가 사실 유형으로 추상화 (B-S3).
- 주의: Halpin은 ER이 자연어에서 멀고 인스턴스로 채울 수 없다고 평하는데 ORM 진영의 입장이다 (B-S2).

### 2.3 설계 전략과 스키마 통합

- Batini, Ceri, Navathe, *Conceptual Database Design: An Entity-Relationship Approach*, Benjamin/Cummings, 1992 (서지만, 본문 미열람).
- 전략 넷(같은 계열 교재 Atzeni 외 슬라이드, B-S7): 하향식은 추상 개념 몇 개로 된 초기 스키마를 연속 정제(변환 T1 개체 하나를 개체 둘+관계로, T2 일반화로, T3 관계를 여러 관계로, T4 관계를 개체로, T5·T6 속성 추가). 상향식은 요구를 조각으로 나눠 작은 스키마를 만들고 통합(개체 생성, 관계 생성, 일반화 생성, 속성을 개체·관계로 묶기). 안쪽에서 바깥은 중요한 개념 몇 개에서 바깥으로 퍼져 나감. 혼합은 주요 개념만 담은 뼈대 스키마를 만든 뒤 각 부분을 하향·상향으로 다듬음.
- Batini 2015 강의록 비교: 상향식은 나무를 맨 끝에 보고, 안쪽에서 바깥은 가장 중요한 부분을 일찍 완성하며, 하향식은 재구성 위험이 작다 (B-S8).
- 요구 분석 규칙(B-S7): 추상화 수준 선택, 문장 구조 표준화, 복잡한 구 피하기, 동음이의어·이음동의어를 찾아 용어 표준화, 상호 참조 명시, 용어집 작성. 요구의 원천은 사용자, 기존 문서(양식·규정·업무 절차·법규), 대체될 기존 응용. 연산과 빈도도 요구 단계에서 적는다(예: 연수생 등록 하루 약 40회).
- 스키마 통합(Batini, Lenzerini, Navathe, "A Comparative Analysis of Methodologies for Database Schema Integration", *ACM Computing Surveys* 18(4), 1986-12, pp.323–364) [1차] (B-S6):
  - 정의: 기존·제안 데이터베이스의 스키마를 전역 통합 스키마로 합치는 일. 설계 시의 뷰 통합과 분산 관리 시의 데이터베이스 통합 두 맥락.
  - 네 단계: 사전 통합(통합 대상·순서·선호 정하기, 이진·n항 전략), 비교(대응과 충돌 찾기, 스키마 간 성질 발견), 맞추기(conforming: 충돌 해소, "Automatic conflict resolution is generally not feasible"), 병합과 재구성(중간 통합 스키마를 만들고 품질 기준에 맞게 재구성).
  - 이름 충돌: 동음이의어(EQUIPMENT가 한쪽은 기계, 다른 쪽은 가구까지), 이음동의어(CLIENT와 CUSTOMER). 동음이의는 같은 이름끼리 비교해 찾지만 이음동의는 외부 명세가 있어야 찾는다.
  - 구조 충돌: 유형 충돌(한쪽은 개체, 다른 쪽은 속성), 종속 충돌(결혼이 1:1 대 m:n), 키 충돌(SS# 대 Emp_id), 행위 충돌(마지막 직원을 지우면 부서도 지워지는가).
  - 병합 예: Book과 Publication을 겹친 뒤 Book을 Publication의 부분집합으로 만들고 공통 속성을 상위로.
  - 통합 스키마 기준: 완전성과 정확성, 최소성, 이해 용이성.
  - 설계 단계 그림은 물리 설계를 거래(transaction) 집합에 맞춘 최적화로 서술 (Fig.1).

### 2.4 스키마 품질

- 세 목록이 서로 다르다(충돌, 양쪽 기록). Atzeni 슬라이드 넷: 정확성·완전성·가독성·최소성 (B-S7). Batini 2015 강의록 여덟: 모델에 대한 정확성, 요구에 대한 정확성, 최소성(예: '합격 과목 수'는 시험 관계 개수로 계산되므로 중복, 개념 설계에서는 표시만 하고 논리 설계에서 성능을 위해 둘 수 있음), 완전성, 적절성(불필요한 개념이 얼마나 있는가), 도식 가독성, 간결성, ER 정규화 (B-S8). 흔히 인용되는 여덟(completeness, correctness, minimality, expressiveness, readability, self-explanation, extensibility, normality)은 1992년 책 본문으로 확인하지 못했다.
- Lindland, Sindre, Sølvberg, "Understanding quality in conceptual modeling", *IEEE Software*, 1994 (원문 미열람, Krogstie 외 1995와 2차로 확인): 문장 집합 M(모델), L(언어), D(도메인), I(청중의 이해)로 구문 품질(M과 L의 일치), 의미 품질(M과 D의 일치: 타당성·완전성, 실현 가능한 수준의 타당성·완전성), 화용 품질(M과 I의 일치: 이해)을 정의 (B-S10, B-S11).
- Moody·Shanks(1994 ER, 2003 *Information Systems* 28(6)): 품질 요인 목록이 2차 자료마다 다르다(여섯·일곱 요인). 원문 확인 필요 (B-S12). Moody ECIS 2003: 후보 지표 29개 중 실무에서 쓸모가 확인된 것은 소수였고, 참여자들은 지표보다 주관 평점과 서술을 더 유용하게 여겼다 (B-S12).

## 3. 내부 스키마(물리 설계)

### 3.1 정규화의 근거

- Codd, "A Relational Model of Data for Large Shared Data Banks", *CACM* 13(6), 1970-06, pp.377–387 [1차] (B-S13): 목표는 내부 표현이 바뀌어도 응용 프로그램이 영향받지 않는 것. 여기서 normal form은 값이 관계인 도메인을 없애는 절차(오늘의 1NF). 순서·인덱스·접근 경로 의존을 없앨 대상으로 든다. "From an informational standpoint, an index is a redundant component of the data representation." 인덱스는 질의를 빠르게 하지만 삽입·삭제를 느리게 하고, 활동 패턴이 바뀌면 인덱스를 만들고 없앨 수 있어야 한다.
- 연표(2차): 2NF·3NF는 Codd 1971 IBM 보고서(1972 단행본 재수록), BCNF는 Boyce·Codd 1974, 4NF는 Fagin 1977(*ACM TODS* 2(3), 다치 종속), 5NF는 Fagin 1979 (B-S14, B-S15).
- 정의(2차): 1NF 필드에 집합·중첩 레코드 없음, 2NF 비키 속성이 후보 키 전체에 종속, 3NF 비자명 FD가 슈퍼키에서 시작하거나 주 속성으로 끝남, BCNF 비자명 FD가 모두 슈퍼키에서 시작, 4NF 비자명 다치 종속이 모두 슈퍼키에서 시작. 이상은 삽입·갱신·삭제 (B-S14).

### 3.2 물리 설계의 입력은 작업 부하

- Ramakrishnan·Gehrke, *Database Management Systems* 3판, 물리 설계 장 슬라이드 (B-S16):
  - 개념·외부 스키마 다음 단계는 인덱스 선택, 클러스터링 결정, 성능 목표를 위한 개념·외부 스키마 다듬기.
  - 입력은 가장 중요한 질의와 빈도, 가장 중요한 갱신과 빈도, 각각의 성능 목표. "We must begin by understanding the workload."
  - 결정: 어느 릴레이션에 어떤 검색 키로 인덱스를 둘지, 클러스터 여부, 해시·트리 선택, 정규화 대안 비교, 비정규화, 수평 분할, 복제, 뷰.
  - "our choice of indexes is guided by the plan(s) we expect an optimizer to consider for a query."
  - 비정규화는 질의가 충분히 중요하고 인덱스나 다른 3NF 스키마로 성능을 못 얻을 때만. BCNF 대신 3NF를 택할 수 있다.
  - 수평 분해 예: 큰 계약과 작은 계약을 나누고 원래 이름은 UNION 뷰로 가린다. 스키마를 바꾼 뒤에는 뷰로 응용을 보호한다.
  - 인덱스는 시간이 지나며 다시 조정한다.
- Lightstone·Teorey·Nadeau, *Physical Database Design*, 2007 (서지만) (B-S27).
- 자동 인덱스 추천: Chaudhuri·Narasayya, VLDB 1997 — SQL 질의 작업 부하를 입력으로 받아 인덱스 집합을 제안 (B-S24).

### 3.3 PostgreSQL 공식 문서 근거 (18.7 문서 기준)

- 인덱스 종류: B-tree(기본, 비교·범위·정렬), Hash(=만), GiST, SP-GiST, GIN(배열·역인덱스), BRIN(블록 범위 요약, 값이 물리 순서와 상관될 때) (B-S17).
- 다중 열 인덱스: 선두 열 조건이 스캔 범위를 정한다. "Multicolumn indexes should be used sparingly" (B-S20).
- 부분 인덱스: 일부 행에만 걸치는 인덱스, 일부 행에 대한 유일성 강제에 쓸 수 있다. 대부분의 경우 이점이 작다는 경고 (B-S21).
- 인덱스 쓰기 비용: 테이블과 동기화해야 해서 데이터 조작에 부담을 더한다 (B-S22).
- 통계: 계획기는 `pg_statistic`으로 선택도를 추정하고, 열끼리 상관되면 `CREATE STATISTICS`로 보정 (B-S23).
- 선언적 분할: range·list·hash. 이득은 대개 테이블이 아주 클 때만, 경험칙은 테이블이 서버 메모리를 넘을 때. 분할 키는 WHERE에 가장 자주 나오는 열. 고유·기본 키 제약은 분할 키 열을 모두 포함해야 한다. 파티션이 많을수록 좋다고 가정하지 말 것 (B-S18).
- 실체화 뷰: 질의 결과를 저장하고 `REFRESH MATERIALIZED VIEW`로 갱신. `CONCURRENTLY`는 고유 인덱스가 있어야 한다. 표준 SQL이 아닌 PostgreSQL 확장 (B-S19).

## 4. 개념에서 관계형 논리 모델로

- Elmasri·Navathe, *Fundamentals of Database Systems* 5판 7장 슬라이드 (B-S25):
  1. 강한 개체 유형 → 릴레이션, 키 하나를 기본 키로.
  2. 약한 개체 유형 → 소유자 기본 키를 외래 키로 넣고, 기본 키는 소유자 키 + 부분 키.
  3. 1:1 → 외래 키(전체 참여 쪽에 두는 것이 낫다), 병합 릴레이션, 상호 참조 릴레이션 셋 중 하나.
  4. 1:N → N쪽에 1쪽 기본 키를 외래 키로.
  5. M:N → 새 릴레이션, 두 기본 키의 조합이 기본 키.
  6. 다중값 속성 → 새 릴레이션(속성 + 소유 개체 키).
  7. n항 관계 → 새 릴레이션, 참여 개체 키 n개.
  8. 하위 유형 → 8A 상위·하위 각각(어떤 경우든 가능), 8B 하위만(전체 하위 유형일 때), 8C 한 릴레이션 + 유형 속성 하나(배타 예), 8D 한 릴레이션 + 불 플래그 여럿(중첩 예).
- Halpin의 ORM→관계형 사상: 사실 유형이 기본 사실이면 결과에 중복이 없다. 복합 키를 가진 사실 유형은 각각 테이블로, 같은 객체 유형에 붙은 단순 키 사실 유형은 한 테이블로 묶는다. 필수 역할은 NOT NULL로, 부분집합·동등 제약은 외래 키 같은 제약으로, 유도 규칙은 SQL 뷰로 (B-S2).
- Chen 1976의 entity relation과 relationship relation이 위 사상 규칙의 원형 (B-S1).

### 2.x 이 절의 open questions

- Batini·Ceri·Navathe 1992 책 본문(품질 기준 여덟, 전략 원문, 양식 분석 장) 미확인.
- Moody·Shanks 품질 요인 목록 충돌.
- Lindland 1994 원문 미열람.
- CSDP 3~7단계 책 절 제목, 인구 검사의 책 속 정의 문장 미확인.
- BCNF 원 발표, Codd 1972, Fagin 1977 본문 미열람.
- Lightstone 외 2007, Elmasri·Navathe 물리 설계 장 미확인.

### 2.y 소스

- B-S1. Chen, The Entity-Relationship Model, ACM TODS 1(1) — https://www.comp.nus.edu.sg/~lingtw/papers/tods76.chen.pdf (게시일: 1976-03, 조회일: 2026-11-17)
- B-S2. Halpin, Object-Role Modeling: an overview — https://www.orm.net/pdf/ORMwhitePaper.pdf (게시일: 미상(2001년경), 조회일: 2026-11-17)
- B-S3. Halpin, Fact-Orientation before Object-Orientation (Part 1): The Case for Data Use Cases — https://www.brcommunity.com/articles.php?id=a430 (게시일: 1999-11, 조회일: 2026-11-17)
- B-S4. Halpin, Fact-orientation before Object-orientation (Part 2) — https://www.brcommunity.com/articles.php?id=b023 (게시일: 2000-07, 조회일: 2026-11-17)
- B-S5. Wikipedia, Object–role modeling(2차) — https://en.wikipedia.org/wiki/Object%E2%80%93role_modeling (게시일: 미상, 조회일: 2026-11-17)
- B-S6. Batini·Lenzerini·Navathe, A Comparative Analysis of Methodologies for Database Schema Integration — https://www.comp.nus.edu.sg/~lingtw/papers/batini.pdf (게시일: 1986-12, 조회일: 2026-11-17)
- B-S7. Atzeni 외, Database Systems 6장 개념 설계 슬라이드 — https://users.dimi.uniud.it/~dario.dellamonica/teaching/21_22_1sem_BDlab/slides_lezioni/02_progettazione_concettuale.pdf (게시일: 1999, 조회일: 2026-11-17)
- B-S8. Batini, Course on Database Design, Part 4 Conceptual Design — https://www.myecole.it/biblio/wp-content/uploads/2020/11/Part-4-Conceptual-design.pdf (게시일: 2015, 조회일: 2026-11-17)
- B-S9. Shanks, Conceptual Data Modelling: An Empirical Study of Expert and Novice Data Modellers — https://distantreader.org/stacks/journals/ajis02/ajis02-360.htm (게시일: 1997-05, 조회일: 2026-11-17)
- B-S10. Krogstie·Lindland·Sindre, Defining quality aspects for conceptual models — https://folk.idi.ntnu.no/krogstie/publications/1995/ISCO3/fulltext.pdf (게시일: 1995, 조회일: 2026-11-17)
- B-S11. Wikipedia, SEQUAL framework(2차) — https://en.wikipedia.org/wiki/SEQUAL_framework (게시일: 미상, 조회일: 2026-11-17)
- B-S12. Moody ECIS 2003 초록, Moody·Shanks 서지 — https://aisel.aisnet.org/ecis2003/78 (게시일: 2003, 조회일: 2026-11-17)
- B-S13. Codd, A Relational Model of Data for Large Shared Data Banks — https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf (게시일: 1970-06, 조회일: 2026-11-17)
- B-S14. Wikipedia, Database normalization(2차) — https://en.wikipedia.org/wiki/Database_normalization (게시일: 미상, 조회일: 2026-11-17)
- B-S15. Fagin, Multivalued Dependencies and a New Normal Form for Relational Databases(초록만) — https://www.comp.nus.edu.sg/~lingtw/papers/fagin.pdf (게시일: 1977-09, 조회일: 2026-11-17)
- B-S16. Ramakrishnan·Gehrke, Physical Database Design 슬라이드 — https://pages.cs.wisc.edu/~dbbook/openAccess/thirdEdition/slides/slides3ed-english/Ch20_DB_Tuning.pdf (게시일: 미상, 조회일: 2026-11-17)
- B-S17. PostgreSQL, Index Types — https://www.postgresql.org/docs/current/indexes-types.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- B-S18. PostgreSQL, Table Partitioning — https://www.postgresql.org/docs/current/ddl-partitioning.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- B-S19. PostgreSQL, CREATE MATERIALIZED VIEW — https://www.postgresql.org/docs/current/sql-creatematerializedview.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- B-S20. PostgreSQL, Multicolumn Indexes — https://www.postgresql.org/docs/current/indexes-multicolumn.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- B-S21. PostgreSQL, Partial Indexes — https://www.postgresql.org/docs/current/indexes-partial.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- B-S22. PostgreSQL, Indexes Introduction — https://www.postgresql.org/docs/current/indexes-intro.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- B-S23. PostgreSQL, How the Planner Uses Statistics — https://www.postgresql.org/docs/current/planner-stats.html (게시일: 미상(18.7 문서), 조회일: 2026-11-17)
- B-S24. Chaudhuri·Narasayya, An Efficient, Cost-Driven Index Selection Tool for Microsoft SQL Server — https://www.microsoft.com/en-us/research/publication/an-efficient-cost-driven-index-selection-tool-for-microsoft-sql-server/ (게시일: 1997, 조회일: 2026-11-17)
- B-S25. Elmasri·Navathe, Fundamentals of Database Systems 7장 슬라이드 — https://www.cs.purdue.edu/homes/bb/cs448_Spring2014/lecture-files/pdf/ch07-Relational%20Database%20Design%20by%20ER-%20and%20EERR-to-Relational%20Mapping.pdf (게시일: 2007, 조회일: 2026-11-17)
- B-S26. Halpin·Morgan, Information Modeling and Relational Databases 3판 서지 — https://shop.elsevier.com/books/information-modeling-and-relational-databases/halpin/978-0-443-23790-4 (게시일: 2024-07-11, 조회일: 2026-11-17)
- B-S27. Lightstone·Teorey·Nadeau, Physical Database Design 서지 — https://libcat.library.tamu.edu/Record/in00002429676 (게시일: 2007, 조회일: 2026-11-17)

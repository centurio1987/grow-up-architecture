## 1. 세 층 스키마의 원전과 정의

확인 수준 표시: [1차]는 원문이나 공식 문서를 직접 열어 본 것, [2차]는 다른 문헌의 인용이나 서지 기록만 본 것입니다.

### 1.1 서지

- ANSI/X3/SPARC Study Group on Data Base Management Systems, "Interim Report 75-02-08", *FDT (Bulletin of ACM SIGFIDET/SIGMOD)* 7(2), 1975, pp.1–140 (A-S4, A-S5). 본문 미열람.
- 최종 보고서: D. Tsichritzis, A. Klug 편, "The ANSI/X3/SPARC DBMS Framework. Report of the Study Group on Data Base Management Systems", AFIPS Press, 1977 (ISO/TR 9007 참고문헌 [2]) (A-S1). 학술지판 *Information Systems* 3(3), 1978, pp.173–191, DOI 10.1016/0306-4379(78)90001-7 (A-S6, 서지만 확인). 두 판의 차이는 미확인.
- Klug, Tsichritzis, "Multiple View Support within the ANSI/SPARC Framework", VLDB 1977, pp.477–488 (A-S7, 초록만).

### 1.2 세 층의 정의 [1차, 단 원전을 요약한 1985년 후속 보고서]

NBS IR 85-3173(ANSI/X3/SPARC 산하 DAFTG, 1985-05) §2.2에서 직접 확인 (A-S3).

- 개념 스키마: "The conceptual schema serves as an information model of the enterprise" (p.9). 기업이 관심을 두는 개체·속성·관계, 무결성·보안 제약을 기술하며 데이터 모델에 근거해야 한다.
- 내부 스키마: 무엇이 어떻게 저장되는지 규정한다. 효율을 반영한 저장 구조의 추상 모델이며 표현 방식과 접근 경로가 여기에 속한다 (p.9).
- 외부 스키마: 외부 수준에는 외부 뷰가 여럿 있고, 각 뷰는 특정 응용이 관심을 두는 개체·속성·관계를 나타내는 데이터 객체 집합이다. 각 뷰에 그 객체를 응용에 보일 형태로 기술한 외부 스키마가 붙는다 (p.11).
- 사상: 그림 2.1에 외부–개념 사상, 개념–내부 사상, 저장 사상이 있다. 실행 시 변환기가 요청을 층마다 번역한다 (pp.10, 13).
- 목적: 개념 스키마를 효율 고려와 응용별 요구에서 떼어 "relatively stable description of the enterprise model"로 둔다. "This flexibility and adaptability is usually called data independence." (p.11)

ISO/TR 9007의 요약 (A-S1 p.9): 개념 스키마는 데이터베이스에 담길 수 있는 정보 내용의 "unique central description"이다. "Each external schema is therefore derived from the common conceptual schema." 내부 스키마도 개념 스키마에서 파생된다. 개념 관점은 의미, 외부 관점은 바깥 형식, 내부 관점은 컴퓨터 안 물리 표현에 집중한다.

### 1.3 1975 중간 보고서의 용어 [2차]

Partridge 외(2025)가 중간 보고서를 인용한 부분 (A-S2 §5.4): 개념 모델은 "a collection of objects that represent the entities in an enterprise". 개념 스키마와 개념 데이터로 이루어지며 TR 9007은 뒤의 것을 정보 베이스라고 부른다. 외부·내부 두 층은 당시에도 흔했고, 세 번째 층인 개념 층을 명시해야 한다는 것이 보고서의 주장이었다.

### 1.4 논리적·물리적 데이터 독립성

- 원전(Tsichritzis·Klug)의 정의 문장은 미확인 (open question).
- ISO/TR 9007 §1.10 개념 스키마 시설 요구 여섯 가운데 둘이 같은 효과를 규정한다 (A-S1 p.18). 요구 5: 사용자가 보는 정보 뷰는 개념 스키마와 모순되지 않는 것으로 제한되고, 외부 스키마가 바뀌어도 개념 스키마에 영향이 없어야 한다. 요구 6: "The conceptual schema should be kept invariant by the facility with respect to changes in the internal (physical) representation". 이 항목들은 "data independence"라는 말을 쓰지 않는다.
- 교과서식 정의(2차): 논리적 독립성은 논리 스키마를 바꿔도 응용 프로그램을 다시 쓰지 않아도 되는 능력, 물리적 독립성은 물리 스키마에 대해 같은 능력 (A-S27). 주류 DBMS가 물리 독립성을 완전히 이루지는 못했다는 서술도 2차 (A-S16).

## 2. ISO/TR 9007:1987

### 2.1 서지와 경위

- "Information processing systems — Concepts and terminology for the conceptual schema and the information base", 1987-07-01, 편집 J. J. van Griethuysen, Technical Report type 3 (A-S1, A-S26).
- 1977-11 ISO TC97/SC5 작업반 결성 결의, 1978–1985 WG3가 16회 회의(15개국 48명), 1982 최종 원고 N695, 1987 발행. 별칭 "Orange Report" (A-S26, 2차).
- 1.1절은 ANSI/X3/SPARC 보고서가 세 스키마 틀 속에서 개념 스키마의 필요를 밝혔다는 문장으로 시작한다 (A-S1 p.9).

### 2.2 용어 [1차, A-S1 pp.10–13]

- universe of discourse(담화 세계): 기술 대상으로 고른 실제 또는 가정된 세계의 부분에서 "The collection of all objects (entities) that ever have been, are, or ever will be". 구체적(재고), 추상적(조직 구조), 가상(원더랜드)일 수 있다.
- conceptual schema: "The description of the possible states of affairs of the universe of discourse" (분류·규칙·법칙 포함).
- information base: 특정 시점이나 기간에 담화 세계에 있다고 인식된 구체적 객체와 실제 상태의 기술.
- information system: 개념 스키마 + 정보 베이스 + 정보 처리기.
- 개념 스키마의 일반 규칙은 정보 베이스에 일어날 수 있는 일과 없는 일을 통제한다.

### 2.3 원칙 [1차, A-S1 pp.7, 16–17]

- 100 Percent principle: "All relevant general static and dynamic aspects, i.e. all rules, laws, etc., of the universe of discourse should be described in the conceptual schema." 이어서 정보 시스템은 다른 곳(특히 응용 프로그램)에 적힌 규칙을 지키지 못한 책임을 지지 않는다고 한다.
- Conceptualization principle: 개념 스키마는 개념적으로 관련 있는 측면만 담는다. 배제 대상은 외부·내부 데이터 표현, 물리 조직과 접근, 메시지 형식·자료 구조 같은 외부 사용자 표현 전부.
- Helsinki principle(ISO TC97/SC5/WG3, Helsinki 1978): 의미 있는 발화 교환은 미리 합의한 의미·구문 규칙이 있어야 가능하다.
- 개념 스키마 경계를 정할 때 고려할 요인: 인스턴스가 아닌 클래스를 기술, 자주 바뀌지 않는 개념 우선, 폭넓게 영향을 주는 규칙 포함 (p.16).
- 개념 스키마의 네 역할(1.9절): 담화 세계의 일반 행동을 이해하는 공통 기반, 정보의 허용된 진화·조작 정의, 외부·내부 구문 형식을 해석하는 기반, 외부·내부 스키마 사이 사상의 기반. 개념 스키마가 표현 변환에서 의미 보존을 강제한다 (p.17).
- 작업반이 정한 원칙은 일곱이라고 알려져 있으나 확인한 것은 위 셋 (A-S26, open question).

### 2.4 TR 9007 자신의 유보

- 세 스키마 틀은 "widely, but not yet universally, accepted" (p.9).
- 개념 스키마가 기업 모델이어야 하는지, 사용자 뷰와 물리 설계 사이의 중심점이어야 하는지 묻고 둘 다라고 답한다 (p.9).
- '개념 스키마'라는 말이 전혀 개념적이지 않은 데이터베이스 측면에 쓰이기도 한다고 지적한다 (p.10 부근).
- 사물과 사물의 기술을 섞지 말라고 경고한다 (1.7절, p.15).

## 3. CODASYL 하위 스키마와 SQL 뷰

- CODASYL DBTG(위원장 William Olle)의 1971-04 보고서가 DDL·DML 명세와 함께 schema·subschema 개념을 들여왔다 (A-S16, 2차). NBS 1985는 1975 ANSI/SPARC 보고서가 세 스키마 틀을 처음 도입했다고 평가한다 (A-S3 p.4).
- Clemons 1979(VLDB, 초록): 기존 subschema는 저장 스키마의 레코드·세트와 너무 닮아 생산성·데이터 독립성이 나쁘다고 비판하고, 저장 DB에서 도출되지만 같은 모양일 필요가 없는 가상 데이터베이스를 제안 (A-S15).
- "SQL 뷰 = 외부 스키마"를 직접 쓴 표준 문장은 확인 못 함. Bancilhon·Spyratos 1981 도입부: "A view is a query definition named and stored." 뷰는 데이터베이스 상태에서 뷰 상태로 가는 사상 f (A-S8 pp.557, 559).
- Chamberlin·Gray·Traiger 1975, "Views, Authorization, and Locking in a Relational Data Base System", AFIPS NCC 44, pp.425–430 (2차 서지).

## 4. 뷰 갱신 문제

### 4.1 문제

- 뷰 갱신을 만족하는 데이터베이스 갱신이 보통 여럿이라서 하나를 골라야 한다 (A-S8 p.558).
- 연구사(Masunaga 1984, VLDB): Codd가 1974년 처음 보고했고 Chamberlin 외와 Stonebraker가 첫 해법을 냈다. Dayal·Bernstein과 Carlson·Arora는 함수 종속을, Bancilhon·Spyratos는 보완 뷰를, Keller는 구조적 데이터 모델을 썼다 (A-S10).
- 예(Guagliardo·Franconi 2012, A-S9): 조인 뷰 V = E ⋈ D에 (Ford, Sales, Reyes)를 넣으면 D의 기존 (Sales, Locke)와 조인되어 (Ford, Sales, Locke)가 부수 효과로 나타난다. 투영 뷰 π_EMP,DEP(R)에 (Ford, Sales)를 넣으면 MGR 값에 정답이 없다.

### 4.2 Bancilhon·Spyratos 1981 [1차]

- "Update Semantics of Relational Views", *ACM TODS* 6(4), 1981-12, pp.557–575, DOI 10.1145/319628.319634 (A-S8).
- 보완 뷰(complement): 원 뷰와 합치면 데이터베이스를 계산해 낼 수 있는 뷰. 한 뷰에 보완이 여럿일 수 있고, 어느 보완을 고르느냐가 갱신 정책을 정한다.
- 주결과: 갱신 집합 U가 번역기를 가질 필요충분조건은 보완 뷰를 고정한 채(constant complement) 번역할 수 있는 것.
- 계산 알고리즘은 주지 않았다 (A-S9 p.5). 후속: Lechtenbörger, Gottlob 외, Cosmadakis·Papadimitriou (A-S9, 2차).

### 4.3 Dayal·Bernstein 1982, Keller 1985 [서지만]

- Dayal, Bernstein, "On the correct translation of update operations on relational views", *ACM TODS* 7(3), 1982-09, pp.381–416, DOI 10.1145/319732.319740 (A-S11). 앞선 VLDB 1978 논문은 올바른 번역 가능성을 형식화하고 뷰 정의에 거는 조건을 유도 (A-S11 초록).
- Keller, PODS 1985, pp.154–163, DOI 10.1145/325405.325423: 선택·투영·조인 뷰의 갱신 번역 알고리즘. 다섯 기준(부수 효과 없음 등)은 2차 요약만 확인 (A-S11).

### 4.4 SQL 표준과 PostgreSQL [1차]

- PostgreSQL CREATE VIEW: 자동 갱신 가능 조건은 FROM 항목이 정확히 하나(테이블이나 갱신 가능한 뷰), 최상위에 WITH·DISTINCT·GROUP BY·HAVING·LIMIT·OFFSET·집합 연산이 없음, select 목록에 집계·윈도·집합 반환 함수가 없음. 열 단위로 판단해 기반 열을 단순 참조하는 열만 갱신 가능 (A-S12).
- 그 밖의 뷰는 INSTEAD OF 트리거나 규칙으로 갱신 의미를 직접 준다 (A-S12, A-S13).
- WITH CHECK OPTION: 뷰에서 보이지 않게 될 새 행을 거부. LOCAL은 그 뷰 조건만, CASCADED는 하위 뷰까지, 생략하면 CASCADED (A-S12).
- 표준 기능 대응(PostgreSQL 부록 D): F311-04·F751·T213 지원, T111(Updatable joins, unions, and columns) 미지원 (A-S14).

## 5. 현대에서 외부 스키마에 해당하는 것

- REST·GraphQL·CQRS·BFF를 "외부 스키마"라고 부르는 문헌은 찾지 못했다. 아래 대응은 해석이다 (open question).
- 해석의 가장 강한 근거: TR 9007 개념화 원칙이 개념 스키마에서 빼라고 한 목록에 "message formats"가 외부 사용자 표현의 예로 들어 있다 (A-S1 p.17).
- REST(Fielding 2000, 5.2.1): 자원은 "a conceptual mapping to a set of entities", 표현은 바이트 열과 표현 메타데이터. 2003년 메일 "The resource in REST is the conceptual mapping, not the concept." (A-S21)
- GraphQL(2021-10 명세): 타입 시스템이 서비스의 능력을 기술하고, 응답은 클라이언트가 요청한 것만 담는다 (A-S19).
- CQRS: Fowler bliki(2011-07-14)는 Greg Young에게서 들었다고 밝히고 "use a different model to update information", 대부분 시스템에서 위험한 복잡성을 더한다고 경고 (A-S17). Microsoft Learn(2025-02-20)은 "The read and write representations of data often differ."라고 서술, 읽기 모델은 실체화 뷰로 둘 수 있고 쓰기 모델과는 결과적 일관성 (A-S18).
- BFF(Sam Newman, 2015-11-18): 사용자 경험 하나에 백엔드 하나, "one experience, one BFF" (A-S20).
- Pat Helland, "Data on the Outside versus Data on the Inside"(CIDR 2005): 서비스는 상대 서비스가 쓰도록 다듬은 데이터 부분집합을 내보내고, 메시지 스키마와 업무 의미는 잘 정의되어야 하며 내부 데이터는 로직을 거쳐서만 접근된다 (A-S24).

## 6. 세 층 구조에 대한 비판과 한계

- NBS 1985(DAFTG)는 이전 틀이 "consists of too many interfaces"라고 지적하고 메타데이터 관리 질문을 남긴다 (A-S3 pp.5, 13).
- 벤더가 용어는 받아들였지만 호환되지 않게 구현했고 공식 표준이 되지 못했다 (A-S16, 2차).
- TR 9007 자신의 유보 (2.4절).
- Partridge 외 2025(arXiv 2509.01617, 프리프린트): 개념 스키마를 정보 베이스에서 떼어 내는 관행("schema turn")을 비판 (A-S2).
- 전사 단일 모델: Fowler "Bounded Context"(2014-01-15)는 대규모 시스템의 전면 통합 모델이 "will not be feasible or cost-effective"하다는 Evans의 말을 인용하고, 컨텍스트마다 모델을 두고 사이를 매핑하라고 정리 (A-S22). Tilkov(2015-03-30)는 "a canonical data model is a bad idea" (A-S23). TR 9007의 "unique central description"과 DDD의 여러 모델을 나란히 놓는 것은 해석이며, 둘을 직접 맞붙인 문헌은 찾지 못했다.

### 1.x 이 절의 open questions

- 1975 중간 보고서 본문, Tsichritzis·Klug 원문의 데이터 독립성 정의 미확인.
- Dayal·Bernstein, Keller 본문 미확인(서지만).
- SQL 표준 본문의 갱신 가능 뷰 규정 미확인(유료).
- TR 9007 3장(나머지 원칙, 3층 구조 절) 미확인.
- CODASYL 1971 보고서의 subschema 정의 원문 미확인.
- 현대 API 형식을 외부 스키마로 보는 문헌 없음.

### 1.y 소스

- A-S1. ISO/TR 9007:1987 미리보기 PDF — https://assets.vde-verlag.de/iec-normen/preview-pdf/info_iso9007%7Bed1.0%7Den.pdf (게시일: 1987-07-01, 조회일: 2026-11-17)
- A-S2. Partridge 외, "Disentangling the schema turn", arXiv 2509.01617 — https://arxiv.org/pdf/2509.01617 (게시일: 2025-09, 조회일: 2026-11-17)
- A-S3. ANSI/X3/SPARC DAFTG, "Reference Model for DBMS Standardization", NBS IR 85-3173 — https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nbsir85-3173.pdf (게시일: 1985-05, 조회일: 2026-11-17)
- A-S4. Interim Report 75-02-08 서지 — https://researchr.org/publication/SPARC75 (게시일: 1975, 조회일: 2026-11-17)
- A-S5. FDT 7(3-4) 편집자 노트 — https://sigmodrecord.org/publications/sigmodRecord/7509/pdfs/984403.fm.pdf (게시일: 1975, 조회일: 2026-11-17)
- A-S6. Tsichritzis·Klug, Information Systems 3(3) 서지 — https://www.sciencedirect.com/science/article/abs/pii/0306437978900017 (게시일: 1978, 조회일: 2026-11-17)
- A-S7. Klug·Tsichritzis, VLDB 1977 서지·초록 — https://www.vldb.org/dblp/db/conf/vldb/KlugT77.html (게시일: 1977, 조회일: 2026-11-17)
- A-S8. Bancilhon·Spyratos, Update Semantics of Relational Views — https://cs.uwaterloo.ca/~david/cs848/background/constant-complement.pdf (게시일: 1981-12, 조회일: 2026-11-17)
- A-S9. Guagliardo·Franconi, On the translatability of view updates, KRDB12-1 — https://www.inf.unibz.it/krdb/wp-content/KRDB%20files/tech-reports/KRDB12-1.pdf (게시일: 2012-03-12, 조회일: 2026-11-17)
- A-S10. Masunaga, A relational database view update translation mechanism, VLDB 1984 — https://www.vldb.org/conf/1984/P309.PDF (게시일: 1984-08, 조회일: 2026-11-17)
- A-S11. Dayal·Bernstein(TODS 7(3), VLDB 1978), Keller(PODS 1985) 서지 — https://scilit.com/publications/b8ea9a62739767f19e6c61e617d2b1bb , https://www.vldb.org/dblp/db/conf/vldb/DayalB78.html , https://bibtex.github.io/PODS-1985-Keller.html (게시일: 1982-09 등, 조회일: 2026-11-17)
- A-S12. PostgreSQL, CREATE VIEW — https://www.postgresql.org/docs/current/sql-createview.html (게시일: 미상(현행판), 조회일: 2026-11-17)
- A-S13. PostgreSQL, Rules on INSERT, UPDATE, and DELETE — https://www.postgresql.org/docs/current/rules-update.html (게시일: 미상, 조회일: 2026-11-17)
- A-S14. PostgreSQL 부록 D, SQL Conformance — https://www.postgresql.org/docs/current/features-sql-standard.html (게시일: 미상(PostgreSQL 18), 조회일: 2026-11-17)
- A-S15. Clemons, An External Schema Facility for CODASYL 1978, VLDB 1979 — https://vldb.org/dblp/db/conf/vldb/Clemons79.html (게시일: 1979, 조회일: 2026-11-17)
- A-S16. Wikipedia, Three-schema approach / ANSI-SPARC Architecture / Data Base Task Group(2차) — https://en.wikipedia.org/wiki/ANSI-SPARC_Architecture (게시일: 미상, 조회일: 2026-11-17)
- A-S17. Martin Fowler, CQRS — https://martinfowler.com/bliki/CQRS.html (게시일: 2011-07-14, 조회일: 2026-11-17)
- A-S18. Microsoft Learn, CQRS Pattern — https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs (게시일: 2025-02-20, 조회일: 2026-11-17)
- A-S19. GraphQL Specification, October 2021 — https://spec.graphql.org/October2021/ (게시일: 2021-10, 조회일: 2026-11-17)
- A-S20. Sam Newman, Backends For Frontends — https://samnewman.io/patterns/architectural/bff/ (게시일: 2015-11-18, 조회일: 2026-11-17)
- A-S21. Fielding, 박사 논문 5장과 2003년 www-tag 메일 — https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm , https://lists.w3.org/Archives/Public/www-tag/2003Jul/0323.html (게시일: 2000 / 2003-07-25, 조회일: 2026-11-17)
- A-S22. Martin Fowler, Bounded Context — https://martinfowler.com/bliki/BoundedContext.html (게시일: 2014-01-15, 조회일: 2026-11-17)
- A-S23. Stefan Tilkov, Thoughts on a Canonical Data Model — https://www.innoq.com/en/blog/thoughts-on-a-canonical-data-model/ (게시일: 2015-03-30, 조회일: 2026-11-17)
- A-S24. Pat Helland, Data on the Outside versus Data on the Inside, CIDR 2005 — https://www.cidrdb.org/cidr2005/papers/P12.pdf (게시일: 2005, 조회일: 2026-11-17)
- A-S26. van Griethuysen, The Orange Report ISO TR9007 (1982-1987), Business Rules Journal(2차) — https://www.brcommunity.com/articles.php?id=b479 (게시일: 2009-05, 조회일: 2026-11-17)
- A-S27. Wikipedia, Data independence(2차) — https://en.wikipedia.org/wiki/Data_independence (게시일: 미상, 조회일: 2026-11-17)

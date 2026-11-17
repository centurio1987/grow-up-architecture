## E. 참고 문헌

본문과 실습에서 근거로 쓴 문헌을 주제별로 묶었습니다. 주제마다 원전을 먼저, 2차 자료를 뒤에 두었어요. 모든 주소의 조회일은 **2026-11-17**입니다. 조사 과정과 문헌별 요약은 `research/2026-11-17-three-schema-and-contract.md`에 있고, 그 문서의 소스 번호(S1~S140)를 끝 열에 적었습니다.

확인 수준은 이렇게 적었습니다.

| 표시 | 뜻 |
| --- | --- |
| 원문 | 원문이나 공식 문서를 직접 열어 확인함 |
| 일부 | 원문을 열었지만 일부만 읽음(범위를 함께 적음) |
| 초록 | 초록이나 서지 페이지만 확인함 |
| 서지 | 서지 정보만 확인함. 내용은 다른 문헌의 인용으로 앎 |
| 2차 | 백과사전·강의 자료·해설처럼 원전이 아닌 자료 |
| 요약 | 검색 결과 요약만 봄. 가장 약한 근거 |

### 세 층 스키마와 개념 스키마의 원전

| 문헌 | 주소 | 확인 | 소스 |
| --- | --- | --- | --- |
| ANSI/X3/SPARC Study Group on DBMS, "Interim Report 75-02-08", *FDT* 7(2), 1975 | https://researchr.org/publication/SPARC75 | 서지 | S4 |
| D. Tsichritzis, A. Klug (eds.), "The ANSI/X3/SPARC DBMS Framework", AFIPS Press, 1977 / *Information Systems* 3(3), 1978, pp.173–191 | https://www.sciencedirect.com/science/article/abs/pii/0306437978900017 | 서지 | S6 |
| A. Klug, D. Tsichritzis, "Multiple View Support within the ANSI/SPARC Framework", VLDB 1977, pp.477–488 | https://www.vldb.org/dblp/db/conf/vldb/KlugT77.html | 초록 | S7 |
| ANSI/X3/SPARC DAFTG, "Reference Model for DBMS Standardization", NBS IR 85-3173, 1985-05 | https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nbsir85-3173.pdf | 원문 | S3 |
| ISO/TR 9007:1987, "Concepts and terminology for the conceptual schema and the information base", J. J. van Griethuysen (ed.), 1987-07-01 | https://assets.vde-verlag.de/iec-normen/preview-pdf/info_iso9007%7Bed1.0%7Den.pdf | 일부(미리보기 약 19쪽) | S1 |
| E. F. Codd, "A Relational Model of Data for Large Shared Data Banks", *CACM* 13(6), 1970, pp.377–387 | https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf | 원문 | S39 |
| P. P. Chen, "The Entity-Relationship Model — Toward a Unified View of Data", *ACM TODS* 1(1), 1976, pp.9–36 | https://www.comp.nus.edu.sg/~lingtw/papers/tods76.chen.pdf | 원문 | S27 |
| E. K. Clemons, "An External Schema Facility for CODASYL 1978", VLDB 1979, pp.119–128 | https://vldb.org/dblp/db/conf/vldb/Clemons79.html | 초록 | S15 |
| C. Partridge 외, "Disentangling the schema turn", arXiv 2509.01617, 2025 (프리프린트) | https://arxiv.org/pdf/2509.01617 | 원문 | S2 |
| J. J. van Griethuysen, "The Orange Report ISO TR9007 (1982–1987)", *Business Rules Journal*, 2009 | https://www.brcommunity.com/articles.php?id=b479 | 2차 | S25 |
| Wikipedia, "ANSI-SPARC Architecture" 외 | https://en.wikipedia.org/wiki/ANSI-SPARC_Architecture | 2차 | S16 |
| Wikipedia, "Data independence" | https://en.wikipedia.org/wiki/Data_independence | 2차 | S26 |

### 외부 스키마와 뷰

| 문헌 | 주소 | 확인 | 소스 |
| --- | --- | --- | --- |
| F. Bancilhon, N. Spyratos, "Update Semantics of Relational Views", *ACM TODS* 6(4), 1981, pp.557–575 | https://cs.uwaterloo.ca/~david/cs848/background/constant-complement.pdf | 원문 | S8 |
| U. Dayal, P. A. Bernstein, "On the correct translation of update operations on relational views", *ACM TODS* 7(3), 1982, pp.381–416 / A. M. Keller, PODS 1985, pp.154–163 | https://scilit.com/publications/b8ea9a62739767f19e6c61e617d2b1bb | 서지 | S11 |
| Y. Masunaga, "A relational database view update translation mechanism", VLDB 1984 | https://www.vldb.org/conf/1984/P309.PDF | 원문 | S10 |
| P. Guagliardo, E. Franconi, "On the translatability of view updates", KRDB12-1, 2012 | https://www.inf.unibz.it/krdb/wp-content/KRDB%20files/tech-reports/KRDB12-1.pdf | 원문 | S9 |
| D. Chamberlin, J. Gray, I. Traiger, "Views, Authorization, and Locking in a Relational Data Base System", AFIPS NCC 44, 1975 | (주소 없음) | 서지(2차 인용) | — |
| PostgreSQL 문서, CREATE VIEW / Rules on INSERT, UPDATE, DELETE / 부록 D SQL Conformance | https://www.postgresql.org/docs/current/sql-createview.html | 원문 | S12–S14 |
| R. T. Fielding, 박사 논문 5장(2000), www-tag 메일(2003-07-25) | https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm | 원문 | S21 |
| GraphQL Specification, October 2021 | https://spec.graphql.org/October2021/ | 원문 | S19 |
| M. Fowler, "CQRS", 2011-07-14 | https://martinfowler.com/bliki/CQRS.html | 원문 | S17 |
| Microsoft Learn, "CQRS pattern", 2025-02-20 | https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs | 원문 | S18 |
| S. Newman, "Backends For Frontends", 2015-11-18 | https://samnewman.io/patterns/architectural/bff/ | 원문 | S20 |
| P. Helland, "Data on the Outside versus Data on the Inside", CIDR 2005 | https://www.cidrdb.org/cidr2005/papers/P12.pdf | 원문 | S24 |
| M. Fowler, "Bounded Context", 2014-01-15 | https://martinfowler.com/bliki/BoundedContext.html | 원문 | S22 |
| S. Tilkov, "Thoughts on a Canonical Data Model", 2015-03-30 | https://www.innoq.com/en/blog/thoughts-on-a-canonical-data-model/ | 원문 | S23 |

### 개념 스키마 설계 방법

| 문헌 | 주소 | 확인 | 소스 |
| --- | --- | --- | --- |
| T. Halpin, "Object-Role Modeling: an overview" (2001년경) | https://www.orm.net/pdf/ORMwhitePaper.pdf | 원문 | S28 |
| T. Halpin, "Fact-Orientation before Object-Orientation (Part 1): The Case for Data Use Cases", *Business Rules Journal*, 1999 | https://www.brcommunity.com/articles.php?id=a430 | 원문 | S29 |
| T. Halpin, "Fact-orientation before Object-orientation (Part 2)", 2000 | https://www.brcommunity.com/articles.php?id=b023 | 원문 | S30 |
| T. Halpin, T. Morgan, *Information Modeling and Relational Databases*, 3판, Elsevier, 2024 | https://shop.elsevier.com/books/information-modeling-and-relational-databases/halpin/978-0-443-23790-4 | 서지 | S52 |
| C. Batini, M. Lenzerini, S. B. Navathe, "A Comparative Analysis of Methodologies for Database Schema Integration", *ACM Computing Surveys* 18(4), 1986, pp.323–364 | https://www.comp.nus.edu.sg/~lingtw/papers/batini.pdf | 원문 | S32 |
| C. Batini, S. Ceri, S. B. Navathe, *Conceptual Database Design: An Entity-Relationship Approach*, Benjamin/Cummings, 1992 | (주소 없음) | 서지(본문 미확인) | — |
| P. Atzeni 외, *Database Systems* 6장 개념 설계 강의 슬라이드 | https://users.dimi.uniud.it/~dario.dellamonica/teaching/21_22_1sem_BDlab/slides_lezioni/02_progettazione_concettuale.pdf | 2차(교재 슬라이드) | S33 |
| C. Batini, "Course on Database Design, Part 4 – Conceptual Design", 2015 | https://www.myecole.it/biblio/wp-content/uploads/2020/11/Part-4-Conceptual-design.pdf | 2차(강의록) | S34 |
| O. I. Lindland, G. Sindre, A. Sølvberg, "Understanding quality in conceptual modeling", *IEEE Software*, 1994 | (원문 미열람) | 서지 | — |
| J. Krogstie, O. I. Lindland, G. Sindre, "Defining quality aspects for conceptual models", 1995 | https://folk.idi.ntnu.no/krogstie/publications/1995/ISCO3/fulltext.pdf | 원문 | S36 |
| D. L. Moody, ECIS 2003 / Moody·Shanks, *Information Systems* 28(6), 2003 | https://aisel.aisnet.org/ecis2003/78 | 초록 | S38 |
| G. Shanks, "Conceptual Data Modelling: An Empirical Study of Expert and Novice Data Modellers", 1997 | https://distantreader.org/stacks/journals/ajis02/ajis02-360.htm | 원문 | S35 |
| Wikipedia, "Object–role modeling" / "SEQUAL framework" | https://en.wikipedia.org/wiki/Object%E2%80%93role_modeling | 2차 | S31, S37 |

### 내부 스키마

| 문헌 | 주소 | 확인 | 소스 |
| --- | --- | --- | --- |
| R. Fagin, "Multivalued Dependencies and a New Normal Form for Relational Databases", *ACM TODS* 2(3), 1977 | https://www.comp.nus.edu.sg/~lingtw/papers/fagin.pdf | 초록 | S41 |
| R. Ramakrishnan, J. Gehrke, *Database Management Systems* 3판, 물리 설계 장 슬라이드 | https://pages.cs.wisc.edu/~dbbook/openAccess/thirdEdition/slides/slides3ed-english/Ch20_DB_Tuning.pdf | 2차(교재 슬라이드) | S42 |
| R. Elmasri, S. B. Navathe, *Fundamentals of Database Systems* 5판 7장 슬라이드 | https://www.cs.purdue.edu/homes/bb/cs448_Spring2014/lecture-files/pdf/ch07-Relational%20Database%20Design%20by%20ER-%20and%20EERR-to-Relational%20Mapping.pdf | 2차(교재 슬라이드) | S51 |
| S. Lightstone, T. Teorey, T. Nadeau, *Physical Database Design*, 2007 | https://libcat.library.tamu.edu/Record/in00002429676 | 서지 | S53 |
| S. Chaudhuri, V. Narasayya, "An Efficient, Cost-Driven Index Selection Tool for Microsoft SQL Server", VLDB 1997 | https://www.microsoft.com/en-us/research/publication/an-efficient-cost-driven-index-selection-tool-for-microsoft-sql-server/ | 초록 | S50 |
| PostgreSQL 18.7 문서: Index Types, Multicolumn Indexes, Partial Indexes, Indexes Introduction, Planner Statistics, Table Partitioning, CREATE MATERIALIZED VIEW | https://www.postgresql.org/docs/current/indexes-types.html | 원문 | S43–S49 |
| Wikipedia, "Database normalization" | https://en.wikipedia.org/wiki/Database_normalization | 2차 | S40 |

### 계약

| 문헌 | 주소 | 확인 | 소스 |
| --- | --- | --- | --- |
| C. A. R. Hoare, "An Axiomatic Basis for Computer Programming", *CACM* 12(10), 1969 | https://www.cs.cmu.edu/~crary/819-f09/Hoare69.pdf | 원문 | S58 |
| B. Meyer, "Applying 'Design by Contract'", *IEEE Computer* 25(10), 1992, pp.40–51 | https://www.kth.se/social/files/59526bfb56be5b4f17000807/meyer-92-contracts.pdf | 일부(pp.40–43) | S54 |
| B. Meyer, *Design by Contract*, TR-EI-12/CO, 1986 / *Object-Oriented Software Construction*, 1988·1997 | https://en.wikipedia.org/wiki/Design_by_contract | 서지(2차) | S57, S59 |
| Eiffel 문서, "Design by Contract, Assertions and Exceptions" / "Inheritance" | https://www.eiffel.org/doc/eiffel/ET-_Design_by_Contract_%28tm%29%2C_Assertions_and_Exceptions | 원문 | S55, S56 |
| E. Evans, *Domain-Driven Design Reference*, 2015-03 | https://domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf | 원문 | S101 |
| OpenAPI Specification v3.2.1, 2026-09-10 / 릴리스 기록 | https://spec.openapis.org/oas/latest.html | 일부(앞부분) | S60–S62 |
| JSON Schema 2020-12 (Core, draft-bhutton-json-schema-01) | https://json-schema.org/draft/2020-12/json-schema-core | 원문 | S63–S65 |
| AsyncAPI 3.0.0 명세·발표(2023-12-05), 3.1.0 발표(2026-01-31) | https://www.asyncapi.com/docs/reference/specification/v3.0.0 | 일부 | S66–S68 |
| Arazzo Specification v1.1.0, 2026-05-17 | https://spec.openapis.org/arazzo/latest.html | 원문 | S69 |
| RFC 9110, HTTP Semantics, 2022 | https://www.rfc-editor.org/rfc/rfc9110.html | 원문 | S70 |
| I. Robinson, "Consumer-Driven Contracts: A Service Evolution Pattern", 2006-06-12 | https://martinfowler.com/articles/consumerDrivenContracts.html | 원문 | S71 |
| M. Fowler, "Tolerant Reader", 2011-05-09 | https://martinfowler.com/bliki/TolerantReader.html | 원문 | S72 |
| Pact 문서(How Pact works, Terminology, can-i-deploy, Pending pacts) | https://docs.pact.io/ | 원문 | S73–S77 |
| Open Data Contract Standard(문서, 릴리스, Fundamentals, Schema, Data Quality, SLA) | https://bitol-io.github.io/open-data-contract-standard/latest/ | 원문(연도는 2차로 보완) | S78–S85, S89 |
| Data Contract Specification 저장소(폐기 공지), Data Contract CLI 이전 안내 | https://github.com/datacontract/datacontract-specification | 원문 | S86, S87 |
| A. Jones, *Driving Data Quality with Data Contracts*, Packt, 2023 | https://www.oreilly.com/library/view/driving-data-quality/9781837635009/ | 서지 | S88 |
| Confluent, "Schema Evolution and Compatibility" | https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html | 일부 | S90, S91 |
| R. Yokota, "Understanding JSON Schema Compatibility", 2021-03-29 | https://yokota.blog/2021/03/29/understanding-json-schema-compatibility/ | 원문 | S92 |
| Apache Avro 1.12.0 Specification | https://avro.apache.org/docs/1.12.0/specification/ | 원문 | S93 |
| Protocol Buffers, Language Guide (proto 3) / Dos and Don'ts | https://protobuf.dev/programming-guides/proto3/ | 원문 | S94, S95 |
| RFC 761 (1980), RFC 1122 (1989), RFC 9413 (2023) | https://www.rfc-editor.org/rfc/rfc9413.html | 원문 | S96–S98 |
| Hyrum's Law | https://www.hyrumslaw.com/ | 원문 | S99 |
| Semantic Versioning 2.0.0 | https://semver.org/ | 원문 | S100 |

### 제3부의 근거: 형식이 있는 씨앗

제3부 장들의 근거로 모은 자료입니다.

| 문헌 | 주소 | 확인 | 소스 |
| --- | --- | --- | --- |
| A. Cockburn, *Writing Effective Use Cases*, Addison-Wesley, 2000(출간)·2001(저작권 표기) — 샘플 장, 사전 출판 초안 | https://ptgmedia.pearsoncmg.com/images/9780201702255/samplepages/0201702258.pdf | 일부 | S102–S104 |
| M. Cohn, Mountain Goat Software 글(사용자 스토리 틀) | https://www.mountaingoatsoftware.com/agile/user-stories | 원문 | S107, S108 |
| D. North, "Introducing BDD", 2006 | https://dannorth.net/blog/introducing-bdd/ | 원문 | S109 |
| B. Wake, "INVEST in Good Stories, and SMART Tasks", 2003-08-17 | https://xp123.com/invest-in-good-stories-and-smart-tasks/ | 원문 | S110 |
| R. Jeffries, "Essential XP: Card, Conversation, Confirmation", 2001-08-30 | https://ronjeffries.com/xprog/articles/expcardconversationconfirmation | 원문 | S111 |
| Cucumber, Gherkin Reference | https://cucumber.io/docs/gherkin/reference/ | 원문 | S112 |
| G. Adzic, *Specification by Example*, Manning, 2011 | https://manning.com/adzic | 서지 | S113 |
| A. Brandolini, "Introducing Event Storming", 2013-11-18 / eventstorming.com | https://ziobrando.blogspot.com/2013/11/introducing-event-storming.html | 원문 | S114, S116, S117 |
| S. Hofer, H. Schwentner, *Domain Storytelling*, 2021 — 발췌 | https://www.informit.com/articles/article.aspx?p=3129449&seqNum=2 | 일부 | S119 |
| A. Mavin, EARS | https://alistairmavin.com/ears/ | 원문 | S122 |
| F. Choobineh 외, "An Expert Database Design System Based on Analysis of Forms", *IEEE TSE* 14(2), 1988 | https://experts.arizona.edu/en/publications/an-expert-database-design-system-based-on-analysis-of-forms/ | 초록 | S124 |
| P. P. Chen, "English sentence structure and entity-relationship diagrams", *Information Sciences* 29, 1983 | https://www.sciencedirect.com/science/article/abs/pii/0020025583900142 | 서지 | S125 |
| R. J. Abbott, "Program design by informal English descriptions", *CACM* 26(11), 1983 | (주소 없음) | 요약 | — |
| Omar 외, "Novel rules for extracting the entities of entity relationship models", *JOPAS* 20(2), 2021 | https://sebhau.edu.ly/journal/jopas/article/download/1329/659/1710 | 원문 | S127 |
| ISO/IEC/IEEE 29148:2018 특성(2차, arXiv 2408.10886), SWEBOK 기반 해설 | https://arxiv.org/html/2408.10886 | 2차 | S120, S121 |
| Wikipedia, "Use case" / "Event storming" / "Easy Approach to Requirements Syntax" / "Entity–relationship model" | https://en.wikipedia.org/wiki/Use_case | 2차 | S105, S115, S123, S126 |
| SAP curated resources for DDD, EventStorming | https://github.com/SAP/curated-resources-for-domain-driven-design/blob/main/knowledgebase/tools/eventstorming.md | 2차 | S118 |
| Cockburn 유스케이스 해설(3자 요약) | https://cdn.jsdelivr.net/npm/usecases-skill@0.1.0/skills/usecases/use-case-guide.md | 2차(저신뢰) | S106 |

### 제4부의 근거: 거친 자료

제4부 장들의 근거로 모은 자료입니다.

| 문헌 | 주소 | 확인 | 소스 |
| --- | --- | --- | --- |
| Z. Abedjan, L. Golab, F. Naumann, "Profiling relational data: a survey", *VLDB Journal* 24(4), 2015 | https://hpi.de/oldsite/fileadmin/user_upload/fachgebiete/naumann/publications/2015/dataprofiling_main.pdf | 원문(저자 원고) | S128 |
| Y. Huhtala 외, TANE, *The Computer Journal* 42(2), 1999 | https://www.cs.helsinki.fi/research/fdk/datamining/tane/ | 원문(소개 페이지) | S129 |
| T. Papenbrock 외, "Functional Dependency Discovery: An Experimental Evaluation of Seven Algorithms", *PVLDB* 8(10), 2015 | https://hpi.de/oldsite/fileadmin/user_upload/fachgebiete/naumann/publications/PDFs/2015_papenbrock_functional.pdf | 요약 | S130 |
| J.-L. Hainaut 외, "Schema Transformation Techniques for Database Reverse Engineering", ER 1993 | https://researchportal.unamur.be/en/publications/schema-transformation-techniques-for-database-reverse-engineering | 초록 | S131 |
| J.-L. Hainaut 외, "Structure Elicitation in Database Reverse Engineering", WCRE 1996 | https://researchportal.unamur.be/en/publications/structure-elicitation-in-database-reverse-engineering | 초록 | S132 |
| R. H. L. Chiang, T. M. Barron, V. C. Storey, "Reverse engineering of relational databases", *Data & Knowledge Engineering* 12(2), 1994 | (주소 없음) | 요약 | — |
| M.-A. Baazizi 외, "Parametric schema inference for massive JSON datasets", *VLDB Journal* 28(4), 2019 | https://researchportal.ip-paris.fr/en/publications/parametric-schema-inference-for-massive-json-datasets/ | 요약 | S133 |
| quicktype / GenSON (저장소 문서) | https://github.com/wolverdude/GenSON | 원문 | S134, S135 |
| J. Cunha, J. Saraiva, J. Visser, "From spreadsheets to relational databases and back", PEPM 2009 | https://docentes.fct.unl.pt/jmc-cunha/publications/spreadsheets-relational-databases-and-back | 요약 | S136 |
| F. Hermans, M. Pinzger, A. van Deursen, "Automatically Extracting Class Diagrams from Spreadsheets", ECOOP 2010 | https://research.vu.nl/en/publications/automatically-extracting-class-diagrams-from-spreadsheets/ | 요약 | S137 |
| S. Wagner, D. Méndez Fernández, "Analysing Text in Software Projects", arXiv 1612.00164, 2016 | https://arxiv.org/abs/1612.00164 | 초록 | S138 |
| E. Rahm, H. H. Do, "Data Cleaning: Problems and Current Approaches", IEEE Data Engineering Bulletin, 2000 | https://dbs.uni-leipzig.de/en/publication/title/data_cleaning_problems_and_current_approaches | 초록 + 요약 | S140 |
| 정성 코딩 강의 자료 | https://third-bit.com/ds4se/grounded/ | 2차 | S139 |

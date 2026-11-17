## 5. 계약(contract)과 스키마 진화

### 5.1 Meyer의 Design by Contract

- 서지: 1986 기술 보고서 *Design by Contract*, TR-EI-12/CO, Interactive Software Engineering(서지는 2차 목록에서만 확인, 원문 미열람) (C-S4). 1991 책 장 "Design by Contract", *Advances in Object-Oriented Software Engineering*, pp.1–50 (C-S4). 1992 논문 "Applying 'Design by Contract'", *IEEE Computer* 25(10), pp.40–51 (C-S1, pp.40–43 열람). *Object-Oriented Software Construction* 1판 1988, 2판 1997(Prentice Hall, ISBN 978-0136291558) (C-S4, C-S6).
- 계약의 비유: 두 당사자가 각자 이익을 기대하고 그 대가로 의무를 진다. 한쪽의 의무는 대개 다른 쪽의 이익이다. 원문 짧은 인용 "These benefits and obligations are documented in a contract document." (C-S1 p.41)
- 1992 논문 표 1(택배 예): 고객의 의무는 각 변 2m 이하·5kg 이하 소포와 100프랑, 이익은 4시간 안 배달. 공급자의 의무는 4시간 안 배달, 이익은 너무 크거나 무겁거나 돈을 안 낸 소포는 다루지 않아도 되는 것 (C-S1).
- No Hidden Clauses: 계약이 빠짐없이 적혔다면 계약 밖 요구를 조건으로 붙일 수 없다. 모든 계약에 암묵적으로 걸리는 규칙(법규 같은 것)은 막지 않으며, 그것이 클래스 불변식에 해당한다고 설명 (C-S1).
- Eiffel 표기: `require`(사전조건), `ensure`(사후조건), `old`(진입 시점 값). 예: `put_child`의 사전조건 `new /= Void`, 사후조건 `new.parent = Current; child_count = old child_count + 1`. 조항이 없으면 `require True`와 같다 (C-S1).
- 특수 상황 처리는 단언이 아니라 제어 구조로 한다 (C-S1).
- Eiffel 공식 문서: 사전조건은 공급자를 보호하는 고객의 의무("The client's obligation, which protects the supplier, is called a precondition."). 루틴 몸체가 자기 사전조건을 다시 검사하지 않는다. 불변식은 모든 생성 절차가 확립하고 외부에 내보낸 모든 루틴이 유지한다. 사전조건 위반은 고객의 버그, 사후조건·불변식 위반은 공급자의 버그 (C-S2).
- 하위 유형 규칙: 재정의한 사전조건은 약하거나 같아야 하고(`require else`, OR로 묶음), 사후조건은 강하거나 같아야 한다(`ensure then`, AND로 묶음). 불변식은 부모 것과 AND로 쌓인다 (C-S3). Liskov·Wing 1994의 행위 하위 유형과의 관계는 2차 자료 서술만 확인 (C-S4).
- Hoare 1969, "An Axiomatic Basis for Computer Programming", CACM 12(10), pp.576–580, 583. 표기 `P {Q} R`: 프로그램 Q 시작 전에 P가 참이면 끝났을 때 R이 참 (C-S5). 1992 논문은 클래스 불변식 개념이 Hoare 1972 "Proof of Correctness of Data Representations"(Acta Informatica 1(4))의 data invariant에서 왔다고 적음 (C-S1).

### 5.2 API 계약 명세

- OpenAPI: 조회 시점 최신 3.2.1(2026-09-10). 버전 목록 3.2.1, 3.2.0, 3.1.2, 3.1.1, 3.1.0, 3.0.x, 2.0 (C-S7). 3.2.0은 2025년 9월(릴리스 19일, OAI 공지 23일로 두 날짜가 보임) (C-S8, C-S9). 3.1.0에서 JSON Schema 2020-12로 옮김 (C-S8). 목적은 "a standard, language-agnostic interface to HTTP APIs"를 정의하는 것 (C-S7).
- OpenAPI가 사후조건·호출 순서·연산 단위 멱등성을 적는 표준 필드는 명세 일부 열람 범위에서 찾지 못했다(추론). 호출 순서는 Arazzo 1.1.0(2026-05-17)이 다룬다 (C-S16). 멱등성은 HTTP 의미론에 있다: RFC 9110 §9.2.2 "PUT, DELETE, and safe request methods are idempotent" (C-S17).
- JSON Schema: 현재 버전 2020-12, Core와 Validation 두 문서 (C-S10). JSON 문서가 어떤 모양이어야 하는지 단언한다 (C-S11). 모르는 키워드는 주석으로 다루라고 권함(§4.3.1) (C-S11). 진화 규칙은 정의하지 않음 (C-S38).
- AsyncAPI: 3.0.0(2023-12-05)에서 `publish`/`subscribe`를 `send`/`receive`로 바꾸고 채널을 연산에서 떼어 냈으며 `reply`로 요청·응답을 지원 (C-S14). 최신 3.1.0(2026-01-31) (C-S15). 구성 요소는 Channels·Operations·Messages·Servers·Components, 프로토콜 세부는 bindings (C-S13). 전달 보장·순서 같은 의미 약속을 표현하는지는 미확정 (open question).

### 5.3 소비자 주도 계약

- Ian Robinson, "Consumer-Driven Contracts: A Service Evolution Pattern", martinfowler.com, 2006-06-12 (C-S18).

| 용어 | 요지 | 성격 |
| --- | --- | --- |
| 제공자 계약(provider contract) | 제공자가 업무 기능을 노출하는 요소 집합(문서 스키마, 인터페이스, 대화, 정책, 서비스 품질) | 닫힘, 단일, 권위 있음 |
| 소비자 계약(consumer contract) | 소비자의 합리적 기대를 제공자가 받아들일 때 지는 의무 | 열림, 불완전, 여럿, 권위 없음 |
| 소비자 주도 계약(consumer-driven contract) | 소비자 기대들의 합에서 생겨나는 제공자 계약 | 현재 소비자에 대해 닫히고 완전, 단일, 권위 없음 |

- 문제의 원인: 소비자가 스키마 전체를 검증하면 제공자가 필드 하나를 지워도 배포를 같이 맞춰야 한다. 처방은 쓰는 필드만 검증하는 "just enough" 검증과 모르는 요소를 무시하는 Must Ignore (C-S18).
- Tolerant Reader(Fowler, 2011-05-09): 필요한 필드만 읽고 나머지는 무시하며 구조 가정을 최소로 한다 (C-S19). Robinson 글에는 이 용어가 쓰이지 않음 (C-S18).
- Pact: 소비자 테스트에서 계약이 생기는 "contract by example". 소비자 테스트가 mock provider로 상호작용을 기록 → pact 파일 생성 → 제공자 검증에서 기록된 요청을 실제 제공자에 재생해 최소 기대 데이터가 있는지 확인. provider state로 사전 상태를 준비 (C-S20, C-S21, C-S22). can-i-deploy는 배포 직전 소비자·제공자 버전 조합별 검증 결과 표(Pact Matrix)로 배포 가능 여부를 알려 줌 (C-S23). pending pacts는 새 기대가 제공자 빌드를 바로 깨지 않게 함 (C-S24).

### 5.4 데이터 계약

- ODCS(Open Data Contract Standard, Bitol 프로젝트, LF AI & Data): 조회 시점 최신 v3.2.0(2026-09-08, 연도는 2차 자료로 확인) (C-S26, C-S36). 주요 절: Fundamentals, Schema, Context, References, Data Quality, Support & Communication Channels, Pricing, Team, Roles, Service-Level Agreement, Infrastructures & Servers, Custom & Other Properties, Authoritative Definitions, Tags, Variables (C-S25).
- 필수 필드 `apiVersion`, `kind`(`DataContract`), `id`, `version`. `status` 예: proposed, draft, active, deprecated, retired (C-S27).
- Schema: 객체 수준 `logicalType`·`physicalType`(table/view/topic/file)·`physicalName`, 속성 수준 `required`·`unique`·`primaryKey`·`classification` 등 (C-S28).
- Data Quality: 품질 규칙 유형 text·library·sql·custom, 라이브러리 지표 nullValues·missingValues·invalidValues·duplicateValues·rowCount, 차원 accuracy·completeness·conformity·consistency·coverage·timeliness·uniqueness (C-S29).
- SLA 항목: latency, generalAvailability, endOfSupport, endOfLife, retention, frequency, timeOfAvailability, timeToDetect, timeToNotify, timeToRepair (C-S30).
- Data Contract Specification(datacontract.com)은 ODCS v3.1.0 발표와 함께 폐기, 2026년 말까지 도구 지원, 마지막 버전 1.2.1 (C-S33, C-S34).
- Andrew Jones, *Driving Data Quality with Data Contracts*, Packt, 2023-06 (서지만 확인) (C-S35).
- 충돌: ODCS v3.1.0을 "zero breaking changes"라고 한 공지(C-S31)와 같은 판 릴리스 노트의 "Breaking JSON Schema change" 표기(C-S26). 양쪽 기록.

### 5.5 스키마 진화 호환성

- Confluent Schema Registry 기본값은 BACKWARD (C-S37).

| 유형 | 정의 | 업그레이드 순서 |
| --- | --- | --- |
| BACKWARD | 새 스키마 X의 소비자가 X-1로 쓴 데이터를 읽는다 | 소비자 먼저 |
| BACKWARD_TRANSITIVE | 등록된 모든 이전 버전 데이터를 읽는다 | 소비자 먼저 |
| FORWARD | X로 쓴 데이터를 X-1 소비자가 읽는다 | 생산자 먼저 |
| FORWARD_TRANSITIVE | X로 쓴 데이터를 모든 이전 버전 소비자가 읽는다 | 생산자 먼저 |
| FULL | X와 X-1 사이에서 양쪽 다 | 독립적으로 |
| FULL_TRANSITIVE | 모든 버전 사이에서 양쪽 다 | 독립적으로 |
| NONE | 검사 안 함 | 주의 |

- 근거 문장: BACKWARD는 "consumers using the new schema can read data produced with the last schema" (C-S38). 업그레이드 순서 문장도 같은 문서 (C-S38).
- Avro/Protobuf에서 기본값이 있는 필드의 추가·삭제는 완전 호환 (C-S37). 필수 필드 추가·삭제의 칸은 원문 표를 다시 확인해야 함 (open question).
- JSON Schema(관대한 정책): 선택 필드 추가·삭제는 세 유형 모두 허용, 필수 필드 추가는 FORWARD만, 필수 필드 삭제는 BACKWARD만 (C-S37). 열린 모델(`additionalProperties` 기본 true)과 닫힌 모델(`false`)에 따라 판정이 달라짐 (C-S37, C-S39).
- Avro 해석 규칙(1.12.0): 필드는 이름으로 맞춘다. 읽는 쪽에 없는 필드의 값은 무시. 쓴 쪽에 없는 필드는 읽는 쪽 기본값을 쓰고, 기본값이 없으면 오류. 정수→더 넓은 수 타입 승격 허용 (C-S40).
- Protocol Buffers: 필드 번호가 와이어 형식의 정체성이며 바꾸면 안전하지 않다. 필드 추가·삭제는 안전하되 지운 번호는 재사용 금지, `reserved`로 번호와 이름을 막는다. 재사용하면 해독이 모호해지고 데이터 손상·개인정보 유출로 이어질 수 있다 (C-S41, C-S42). "Never re-use a tag number." (C-S42)
- JSON Schema 진화 판단이 어려운 이유: 구조 서술과 `allOf`/`oneOf`/`not`/`if` 같은 규칙 서술이 섞여 있음 (C-S39).

### 5.6 Postel 법칙, RFC 9413, Hyrum 법칙, Semver

- RFC 761(1980-01) §2.10 "be conservative in what you do, be liberal in what you accept from others." (C-S43). RFC 1122 §1.2.2 "Be liberal in what you accept, and conservative in what you send." (C-S44)
- RFC 9413 "Maintaining Robust Protocols"(M. Thomson, D. Schinazi, 2023-06, IAB, Informational): 잘못된 입력을 조용히 받아 주면 결함이 사실상 표준으로 굳는다("A flaw can become entrenched as a de facto standard."). 새 구현은 버그까지 맞춰야 한다. 처방은 명세를 발행 뒤에도 계속 유지하는 적극적 유지보수와, 명세가 뒷받침하는 비관용(명시되지 않은 조건에 치명적 오류를 내는 선택) (C-S45).
- Hyrum 법칙 원문 요지: API 이용자가 충분히 많으면 계약에 무엇을 약속했든 관찰 가능한 모든 동작에 누군가 기댄다. 짧은 인용 "all observable behaviors of your system will be depended on by somebody" (C-S46).
- Semantic Versioning 2.0.0: MAJOR는 호환되지 않는 API 변경, MINOR는 하위 호환 기능 추가, PATCH는 하위 호환 버그 수정. 공개 API를 선언해야 한다 (C-S47).

### 5.7 경계의 약속으로서 계약(DDD)

- Evans, *Domain-Driven Design Reference*(2015-03): Services — "Define a service contract, a set of assertions about interactions with the service." Open-host Service — 하위 시스템 접근을 서비스 집합 프로토콜로 정의하고 연다. Published Language — 잘 문서화된 공유 언어를 공통 매체로 쓴다. 기존 도메인 모델을 교환 언어로 그대로 쓰면 굳어 버린다는 이유. Anticorruption Layer — 하류가 상류 모델을 자기 용어로 번역하는 격리 계층 (C-S48).
- OpenAPI·AsyncAPI·JSON Schema·ODCS를 Published Language를 기계가 읽게 적는 수단으로 보는 것은 조사자의 해석이다. 계약과 ANSI/SPARC 외부 스키마를 직접 잇는 문헌은 찾지 못했다 (open question).

### 5.x 이 절의 open questions

- Meyer 1986 보고서 원문 미열람. Meyer 본인이 계약을 Hoare triple과 같다고 쓴 1차 문장 미확인.
- OpenAPI·AsyncAPI 전문 중 일부 미열람. 연산 단위 멱등성 표준 필드 존재 여부 미확인.
- Confluent의 Avro/Protobuf 변경 허용 표에서 필수 필드 칸 미확인.
- ODCS 연도(릴리스 페이지에 연도 없음), v3.1.0 호환성 서술 충돌.
- Jones 책의 데이터 계약 정의 문장 미확보.

### 5.y 소스

- C-S1. Meyer, "Applying 'Design by Contract'", IEEE Computer 25(10) — https://www.kth.se/social/files/59526bfb56be5b4f17000807/meyer-92-contracts.pdf (게시일: 1992-10, 조회일: 2026-11-17)
- C-S2. Eiffel Tutorial, Design by Contract, Assertions and Exceptions — https://www.eiffel.org/doc/eiffel/ET-_Design_by_Contract_%28tm%29%2C_Assertions_and_Exceptions (게시일: 미상, 조회일: 2026-11-17)
- C-S3. Eiffel Tutorial, Inheritance — https://www.eiffel.org/doc/eiffel/ET-_Inheritance (게시일: 미상, 조회일: 2026-11-17)
- C-S4. Wikipedia, Design by contract(2차, 서지 확인용) — https://en.wikipedia.org/wiki/Design_by_contract (게시일: 미상, 조회일: 2026-11-17)
- C-S5. Hoare, "An Axiomatic Basis for Computer Programming", CACM 12(10) — https://www.cs.cmu.edu/~crary/819-f09/Hoare69.pdf (게시일: 1969-10, 조회일: 2026-11-17)
- C-S6. OOSC 2판 서지(Wikipedia, 서점 목록) — https://en.wikipedia.org/wiki/Object-Oriented_Software_Construction (게시일: 미상, 조회일: 2026-11-17)
- C-S7. OpenAPI Specification v3.2.1 — https://spec.openapis.org/oas/latest.html (게시일: 2026-09-10, 조회일: 2026-11-17)
- C-S8. OAI/OpenAPI-Specification Releases — https://github.com/OAI/OpenAPI-Specification/releases (게시일: 연도 표시 없음, 조회일: 2026-11-17)
- C-S9. OpenAPI 3.2.0 릴리스 노트(Speakeasy) — https://speakeasy.com/openapi/release-notes (게시일: 2025-09-19, 조회일: 2026-11-17)
- C-S10. JSON Schema Specification — https://json-schema.org/specification (게시일: 미상, 조회일: 2026-11-17)
- C-S11. JSON Schema Core 2020-12 (draft-bhutton-json-schema-01) — https://json-schema.org/draft/2020-12/json-schema-core (게시일: 2022-06-16, 조회일: 2026-11-17)
- C-S12. JSON Schema 2020-12 released (Open Collective) — https://opencollective.com/json-schema/updates/json-schema-2020-12-released (게시일: 2020-12경, 조회일: 2026-11-17)
- C-S13. AsyncAPI Specification 3.0.0 — https://www.asyncapi.com/docs/reference/specification/v3.0.0 (게시일: 2023-12-05, 조회일: 2026-11-17)
- C-S14. AsyncAPI 3.0.0 Release Notes — https://www.asyncapi.com/blog/release-notes-3.0.0 (게시일: 2023-12-05, 조회일: 2026-11-17)
- C-S15. AsyncAPI 3.1.0 Release Notes — https://www.asyncapi.com/blog/release-notes-3.1.0 (게시일: 2026-01-31, 조회일: 2026-11-17)
- C-S16. Arazzo Specification v1.1.0 — https://spec.openapis.org/arazzo/latest.html (게시일: 2026-05-17, 조회일: 2026-11-17)
- C-S17. RFC 9110 HTTP Semantics — https://www.rfc-editor.org/rfc/rfc9110.html (게시일: 2022-06, 조회일: 2026-11-17)
- C-S18. Ian Robinson, Consumer-Driven Contracts — https://martinfowler.com/articles/consumerDrivenContracts.html (게시일: 2006-06-12, 조회일: 2026-11-17)
- C-S19. Martin Fowler, Tolerant Reader — https://martinfowler.com/bliki/TolerantReader.html (게시일: 2011-05-09, 조회일: 2026-11-17)
- C-S20. Pact Docs — https://docs.pact.io/ (게시일: 미상, 조회일: 2026-11-17)
- C-S21. Pact Docs, How Pact works — https://docs.pact.io/getting_started/how_pact_works (게시일: 미상, 조회일: 2026-11-17)
- C-S22. Pact Docs, Terminology — https://docs.pact.io/getting_started/terminology (게시일: 미상, 조회일: 2026-11-17)
- C-S23. Pact Docs, can-i-deploy — https://docs.pact.io/pact_broker/can_i_deploy (게시일: 미상, 조회일: 2026-11-17)
- C-S24. Pact Docs, Pending pacts — https://docs.pact.io/pact_broker/advanced_topics/pending_pacts (게시일: 미상, 조회일: 2026-11-17)
- C-S25. ODCS 문서 최신판 — https://bitol-io.github.io/open-data-contract-standard/latest/ (게시일: 미상, 조회일: 2026-11-17)
- C-S26. ODCS Releases — https://github.com/bitol-io/open-data-contract-standard/releases (게시일: 연도 표시 없음, 조회일: 2026-11-17)
- C-S27. ODCS Fundamentals — https://bitol-io.github.io/open-data-contract-standard/latest/fundamentals/ (게시일: 미상, 조회일: 2026-11-17)
- C-S28. ODCS Schema — https://bitol-io.github.io/open-data-contract-standard/latest/schema/ (게시일: 미상, 조회일: 2026-11-17)
- C-S29. ODCS Data Quality — https://bitol-io.github.io/open-data-contract-standard/latest/data-quality/ (게시일: 미상, 조회일: 2026-11-17)
- C-S30. ODCS Service-Level Agreement — https://bitol-io.github.io/open-data-contract-standard/latest/service-level-agreement/ (게시일: 미상, 조회일: 2026-11-17)
- C-S31. Bitol, ODCS v3.1.0 발표 — https://bitol.io/bitol-announces-odcs-v3-1-0-stronger-smarter-and-stricter/ (게시일: 2025-12-07, 조회일: 2026-11-17)
- C-S32. ODCS 저장소 — https://github.com/bitol-io/open-data-contract-standard (게시일: 미상, 조회일: 2026-11-17)
- C-S33. Data Contract Specification 저장소(폐기 공지) — https://github.com/datacontract/datacontract-specification (게시일: 미상, 조회일: 2026-11-17)
- C-S34. Data Contract CLI, Migrate DCS to ODCS — https://cli.datacontract.com/migrate-dcs-to-odcs (게시일: 미상, 조회일: 2026-11-17)
- C-S35. Andrew Jones, Driving Data Quality with Data Contracts — https://www.oreilly.com/library/view/driving-data-quality/9781837635009/ (게시일: 2023-06, 조회일: 2026-11-17)
- C-S36. BARC, ODCS 3.2 분석(2차) — https://barc.com/odcs-3-2-data-contract-standard/ (게시일: 2026-09경, 조회일: 2026-11-17)
- C-S37. Confluent, Schema Evolution and Compatibility — https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html (게시일: 미상, 조회일: 2026-11-17)
- C-S38. Confluent, Schema Evolution and Compatibility(6.1판) — https://docs.confluent.io/platform/6.1/schema-registry/avro.html (게시일: 미상, 조회일: 2026-11-17)
- C-S39. Robert Yokota, Understanding JSON Schema Compatibility — https://yokota.blog/2021/03/29/understanding-json-schema-compatibility/ (게시일: 2021-03-29, 조회일: 2026-11-17)
- C-S40. Apache Avro 1.12.0 Specification — https://avro.apache.org/docs/1.12.0/specification/ (게시일: 미상, 조회일: 2026-11-17)
- C-S41. Protocol Buffers Language Guide (proto 3) — https://protobuf.dev/programming-guides/proto3/ (게시일: 미상, 조회일: 2026-11-17)
- C-S42. Protocol Buffers Dos and Don'ts — https://protobuf.dev/best-practices/dos-donts/ (게시일: 미상, 조회일: 2026-11-17)
- C-S43. RFC 761 — https://www.rfc-editor.org/rfc/rfc761.txt (게시일: 1980-01, 조회일: 2026-11-17)
- C-S44. RFC 1122 — https://www.rfc-editor.org/rfc/rfc1122.txt (게시일: 1989-10, 조회일: 2026-11-17)
- C-S45. RFC 9413 Maintaining Robust Protocols — https://www.rfc-editor.org/rfc/rfc9413.html (게시일: 2023-06, 조회일: 2026-11-17)
- C-S46. Hyrum's Law — https://www.hyrumslaw.com/ (게시일: 미상, 조회일: 2026-11-17)
- C-S47. Semantic Versioning 2.0.0 — https://semver.org/ (게시일: 미상, 조회일: 2026-11-17)
- C-S48. Eric Evans, Domain-Driven Design Reference — https://domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf (게시일: 2015-03, 조회일: 2026-11-17)

# 패턴 확장 조사 — 2026-11-06

이 문서는 기존 목록에 없는 **독립 가이드 후보 56건**을 수집한 조사 기록이다. 모두를 새 가이드로 채택한다는 뜻은 아니다. 분산 시스템을 중심으로 메시징·영속성·애플리케이션 경계까지 조사했고, 구현 기법·참고 개념·아키텍처 형태도 종류를 구분해 후보에 포함했다. 세상에 존재하는 모든 패턴을 조사했다는 뜻은 아니다.

집필 순서와 실행 조건은 [집필 전략](pattern-expansion-strategy-2026-11-06.md)에 있다. 기존 [후보 보고서](candidates.md)는 당시 판단의 이력으로 보존한다.

## 1. 현재 기준선과 조사 방식

- `PATTERNS.md`와 `status: published` 가이드 파일을 대조한 결과: GoF 23편 + GoF 밖 3편 + 분석 11편 = **독립 가이드 37편**.
- 참고 문서는 **4개 개념군**이다. 옛 판본에도 published 표기가 남아 있어 파일 개수를 개념군 개수로 세지 않았다.
- `README.md`와 9월 후보 보고서의 33편 표기는 현행 인덱스보다 오래됐다. 현재 상태의 기준은 37편이다.
- 기존 9월 조사는 Event Sourcing을 Account 비교 절로, PoEAA 영속성·웹·분산 패턴을 범위 밖으로 처리했다. 따라서 이번 대상은 **미탐지 후보 + 단순 언급 + 기존 제외 후보의 재평가**다.
- 로컬 조사 범위: `PATTERNS.md`, `README.md`, `pattern-guide/**/*.md`, `KANBAN/**/*.md`, `docs/**/*.md`. 이번 산출물 생성 전 상태를 검색했다. HTML 중복과 바이너리, 의존성 코드는 제외했다.
- 외부 조사: 아래 저자·공식 카탈로그와 핵심 개별 페이지. 조회일은 모두 **2026-11-06**. 문서의 작성일과 조회일은 구분한다.
- 분류·우선순위·기존 가이드와의 비교 경계는 **이 프로젝트에 대한 편집 판단**이다. 원문의 채택 권고로 오해하지 않는다.

## 2. 첨부 이미지의 8개 항목

사진은 조사 출발점이며 집필 명세나 사실의 최종 근거로 사용하지 않았다. 여덟 항목 모두 독립 가이드는 없다.

| 항목 | 기존 상태 | 집필에서 바로잡거나 보충할 내용 |
| --- | --- | --- |
| API Gateway | 검색 범위에서 이름 미탐지 | 하나의 논리적 진입점이 물리 서버 한 대라는 뜻은 아니다. BFF·API Composition과 책임 비교. S05 |
| Service Mesh | 이름 미탐지 | Sidecar 필수라는 정의를 피한다. Istio는 ambient도 제공한다. S06 |
| Circuit Breaker | 이름 미탐지 | fallback은 별도 선택이다. 차단 임계값·복구 탐색·Retry와의 조합을 설명한다. S07 |
| Saga | 영문 이름 및 ‘사가 패턴’ 미탐지 | 보상은 DB rollback과 다르다. 동시 실행 격리와 보상 실패·수동 복구를 다룬다. S08 |
| CQRS | 구 Command 판본·리서치에서 언급 | 읽기·쓰기 모델 분리가 핵심이다. DB 두 개나 Event Sourcing은 필수가 아니다. S09 |
| Event Sourcing | 기존 조사에서 제외, 현행 Account에서 비교 | 선택한 모델의 상태 원천과 재생을 다룬다. 모든 시스템 데이터를 이벤트화하라는 뜻은 아니다. S10 |
| Strangler Fig | 구 Facade 판본에서 Strangler 언급 | 비율만 조정하는 배포와 기능 소유권을 옮겨 구 시스템을 없애는 이행을 구분한다. S11 |
| Sidecar | 이름 미탐지 | 같은 Pod는 구현 예다. 별도 프로세스/컨테이너와 앱의 수명주기가 핵심이다. S12 |

‘사가’만 부분 문자열로 검색하면 ‘검사가’ 등과 충돌하므로 Saga 판정에 사용하지 않았다.

## 3. 후보 카탈로그

**P0**: 첫 집필 묶음 권고, **P1**: 후속 확장, **P2**: 수집 유지·후순위, **기초**: 참고 문서 우선, **흡수**: 첫 판은 상위 편의 변형/비교로 수록. 모든 행은 현재 독립 가이드 미등록 상태다. 출처가 카탈로그 수준인 후보는 본문 집필 전 개별 자료 정독과 최소 조건 검증이 남아 있다.

### 사진의 8개 항목

| ID / 슬러그 | 후보 | 처분 | 출처 | 기존 편과의 경계 / 편집 방향 |
| --- | --- | --- | --- | --- |
| A01 `api-gateway` | API Gateway | P0 | S05 | 외부 진입 경계. Facade의 객체 인터페이스와 네트워크 경계를 구분 |
| A02 `service-mesh` | Service Mesh | P1 | S06 | 서비스 통신 정책과 운영 계층. Sidecar는 구현 선택지 |
| A03 `circuit-breaker` | Circuit Breaker | P0 | S07 | 실패 임계값에 따른 호출 차단. State는 구현 수단 |
| A04 `saga` | Saga | P0 | S08 | 로컬 거래와 보상 조정. 기존 회계 Transaction과 범위가 다름 |
| A05 `cqrs` | CQRS | P0 | S09 | 읽기·쓰기 모델의 책임 분리. GoF Command와 다른 수준 |
| A06 `event-sourcing` | Event Sourcing | P0 | S10 | 상태의 원천을 이벤트 이력에 둠. Account 비교 절에서 독립 후보로 재평가 |
| A07 `strangler-fig` | Strangler Fig | P0 | S11 | 기능을 점진적으로 대체하고 구 시스템을 퇴역. 단순 트래픽 분산과 구분 |
| A08 `sidecar` | Sidecar | P0 | S12 | 애플리케이션 곁의 별도 실행 단위. GoF Decorator와 배포 경계가 다름 |

### 회복 탄력성과 운영

| ID / 슬러그 | 후보 | 처분 | 출처 | 기존 편과의 경계 / 편집 방향 |
| --- | --- | --- | --- | --- |
| R01 `timeout-deadline` | Timeout / Deadline | 기초 | S13 | 대기 한도와 전체 요청 예산. Retry·Circuit Breaker의 선행 참고 문서 |
| R02 `retry` | Retry (Backoff · Jitter) | P0 | S13 | 한시적 실패 재시도. 재시도 예산·중복 부작용을 함께 설명 |
| R03 `bulkhead` | Bulkhead | P1 | S02 | 자원 풀을 나눠 장애 영향을 제한. 호출 차단과 구분 |
| R04 `rate-limiting` | Rate Limiting / Throttling | P1 | S02 | 허용 유입량 제한. Bulkhead의 동시 자원 격리와 비교 |
| R05 `cache-aside` | Cache-Aside | P0 | S02 | 필요할 때 읽어 채우는 캐시. Flyweight의 객체 공유와 구분 |
| R06 `queue-based-load-leveling` | Queue-Based Load Leveling | P1 | S02 | 큐로 수요 변동 완충. 무제한 적재와 구분 |
| R07 `health-check-api` | Health Check API | P1 | S01 | 서비스 상태를 외부에서 확인하는 계약 |
| R08 `externalized-configuration` | Externalized Configuration | P2 | S01 | 배포물 밖 설정 관리. DI의 객체 조립과 구분 |

### 데이터 소유권과 이벤트 일관성

| ID / 슬러그 | 후보 | 처분 | 출처 | 기존 편과의 경계 / 편집 방향 |
| --- | --- | --- | --- | --- |
| D01 `database-per-service` | Database per Service | P0 | S01 | 서비스별 데이터 소유권. 물리 서버 개수와 구분 |
| D02 `transactional-outbox` | Transactional Outbox | P0 | S14 | 업무 변경과 발행 의도를 함께 저장. 브로커 발행과 소비 보장은 별도 |
| D03 `idempotent-consumer` | Idempotent Consumer / Receiver | P0 | S01,S03 | 재전달에도 업무 효과 중복 방지. 메시지 ID와 업무 멱등 키를 구분 |
| D04 `api-composition` | API Composition | P1 | S01 | 여러 서비스 조회 결과 결합. CQRS의 사전 구축 조회와 비교 |
| D05 `materialized-view` | Materialized View | P1 | S02 | 조회용 파생 상태. CQRS 없이도 사용 가능 |
| D06 `polling-publisher` | Polling Publisher | 흡수 | S14 | Outbox 발행 구현의 한 갈래. 첫 판에서는 Outbox 안에서 비교 |
| D07 `transaction-log-tailing` | Transaction Log Tailing | 흡수 | S14 | 로그 기반 발행 갈래. 모든 CDC를 Outbox와 동의어로 취급하지 않음 |
| D08 `domain-event` | Domain Event | 기초 | S01 | 업무에서 일어난 사실의 표현. Observer 통지·통합 이벤트와 비교 |
| D09 `compensating-transaction` | Compensating Transaction | 흡수 | S02 | 이미 끝난 업무 효과의 보상. 첫 판은 Saga의 실패 시나리오에 포함 |
| D10 `choreography` | Choreography | 흡수 | S02 | 중앙 조정 없는 협력. 첫 판은 Saga Orchestration과 대비 |

### 메시징과 통합

| ID / 슬러그 | 후보 | 처분 | 출처 | 기존 편과의 경계 / 편집 방향 |
| --- | --- | --- | --- | --- |
| M01 `publish-subscribe-channel` | Publish-Subscribe Channel | P1 | S03 | 메시지를 구독자에게 분배. 프로세스 내부 Observer와 전달 조건 비교 |
| M02 `competing-consumers` | Competing Consumers | P1 | S03 | 여러 소비자가 작업을 나눔. 모든 구독자가 받는 모델과 구분 |
| M03 `dead-letter-channel` | Dead Letter Channel | P1 | S03 | 처리 불가 메시지를 격리. 재처리 책임도 설명 |
| M04 `correlation-identifier` | Correlation Identifier | 기초 | S03 | 응답과 요청의 대응 표식. 멱등 키와 별개 |
| M05 `content-based-router` | Content-Based Router | P2 | S03 | 내용에 따라 경로 선택. Chain of Responsibility와 비교 |
| M06 `splitter` | Splitter | P2 | S03 | 복합 메시지를 분할. Composite와 처리 단위 비교 |
| M07 `aggregator` | Aggregator | P1 | S03 | 관련 메시지를 완료 조건에 따라 결합. API Composition과 비교 |
| M08 `resequencer` | Resequencer | P2 | S03 | 메시지 순서 재구성. 전역 순서 보장으로 확대하지 않음 |
| M09 `claim-check` | Claim Check | P2 | S03 | 큰 본문 대신 참조 전달. 접근권·보존 기간도 설계 |
| M10 `process-manager` | Process Manager | P2 | S03 | 메시지 기반 절차 진행을 추적. Saga와 동일하다고 단정하지 않음 |

### 영속성과 엔터프라이즈 애플리케이션

| ID / 슬러그 | 후보 | 처분 | 출처 | 기존 편과의 경계 / 편집 방향 |
| --- | --- | --- | --- | --- |
| P01 `repository` | Repository | P1 | S04 | 도메인 객체 접근 경계. 기존 DDD 용어 정의에서 독립 구현 편으로 확장 |
| P02 `unit-of-work` | Unit of Work | P1 | S04 | 변경 집합과 쓰기 조정. 회계 Transaction과 구분 |
| P03 `data-mapper` | Data Mapper | P1 | S04 | 도메인과 저장 형식 분리. Adapter보다 영속성 책임이 구체적 |
| P04 `active-record` | Active Record | P1 | S04 | 레코드 객체에 저장 책임 결합. Data Mapper의 비교 쌍 |
| P05 `identity-map` | Identity Map | P2 | S04 | 조회 범위 안 객체 동일성 관리. Singleton의 전역 단일성과 구분 |
| P06 `lazy-load` | Lazy Load | P2 | S04 | 필요 시 데이터를 읽음. 과거 Lazy Initialization 묶음을 재검토 |
| P07 `transaction-script` | Transaction Script | P2 | S04 | 요청별 절차로 업무 로직 조직. 회계 거래 모델과 구분 |
| P08 `domain-model` | Domain Model | P2 | S04 | 데이터와 행위를 함께 모델링. DDD 전체의 동의어가 아님 |
| P09 `service-layer` | Service Layer | P1 | S04 | 애플리케이션 작업 경계. 마이크로서비스나 Domain Service와 구분 |
| P10 `data-transfer-object` | Data Transfer Object | P2 | S04 | 프로세스 간 전달 데이터. Value Object의 도메인 의미와 구분 |
| P11 `optimistic-offline-lock` | Optimistic Offline Lock | P1 | S04 | 버전 충돌을 검출해 변경 유실 방지. 단순 재시도와 비교 |
| P12 `pessimistic-offline-lock` | Pessimistic Offline Lock | P2 | S04 | 업무 거래 간 접근 선점. 잠금 범위·해제 실패를 명시 |

### 경계·분해·표현 구조

| ID / 슬러그 | 후보 | 처분 | 출처 | 기존 편과의 경계 / 편집 방향 |
| --- | --- | --- | --- | --- |
| B01 `hexagonal-architecture` | Hexagonal Architecture (Ports and Adapters) | P1 | S15 | 업무를 외부 입출력에서 분리. GoF Adapter·DI의 사용처와 연결 |
| B02 `decompose-by-business-capability` | Decompose by Business Capability | P1 | S01 | 업무 능력을 기준으로 서비스 경계 선택 |
| B03 `decompose-by-subdomain` | Decompose by Subdomain | P1 | S01 | 하위 도메인을 기준으로 분해. Aggregate마다 서비스 하나는 아님 |
| B04 `anti-corruption-layer` | Anti-Corruption Layer | P1 | S01,S02 | 외부 모델로부터 내부 의미 보호. Adapter와 목적 비교 |
| B05 `client-side-discovery` | Client-Side Discovery | P2 | S01 | 클라이언트가 인스턴스 선택. 서버 측 방식과 비교 |
| B06 `server-side-discovery` | Server-Side Discovery | P2 | S01 | 라우터가 인스턴스 선택. API Gateway와 책임 분리 |
| B07 `service-registry` | Service Registry | 기초 | S01 | 인스턴스 위치 목록. 발견 방식 두 편의 공통 개념 |
| B08 `model-view-controller` | Model View Controller | P2 | S04 | 표현 상호작용의 역할 분리. Observer와 동일 패턴이 아님 |

처분 집계: P0 12건, P1 21건, 기초 4건, P2 15건, 흡수 4건. **후보 수와 최종 가이드 수는 다르다.**

## 4. 중복·변형·제외 원칙

- API Gateway / BFF: 첫 판의 Gateway 안에서 클라이언트별 변형을 다룬다. 별도 편 분리는 독립된 운영·계약 시나리오가 확보될 때 한다.
- Saga / Choreography / Compensating Transaction: 관련 개념이지 동의어는 아니다. 첫 판은 Saga에서 비교하고, 독립적인 비-Saga 사례가 쌓이면 승격한다.
- Idempotent Consumer / EIP Idempotent Receiver: 공통 의도를 한 편에서 다루되 출처별 이름과 적용 범위를 설명한다. Outbox가 이 책임을 대신하지 않는다.
- Transaction Log Tailing / Polling Publisher: Outbox 발행 갈래로 먼저 비교한다. CDC 전체를 이 패턴으로 축소하지 않는다.
- Service Mesh / Sidecar: 독립 후보 유지. 플랫폼 수준 정책과 배치 구성은 같은 개념이 아니다.
- Lazy Initialization / Lazy Load: 과거 보고서의 묶음을 그대로 동의어로 계승하지 않는다. 객체 초기화와 영속 데이터 지연 조회의 경계를 본문 조사에서 확정한다.
- Account / Event Sourcing: 기존 회계 모델의 Entry 합산과 시스템 상태의 이벤트 원천은 별도 관심사다. Account 재집필을 선행 조건으로 만들지 않는다.
- Repository / Aggregate / Entity / Value Object: 현재 참고 문서가 있다는 이유만으로 구현 가이드까지 완성됐다고 보지 않는다. 다만 Entity·VO 자체의 별도 편은 이번 56건에서 중복 후보로 추가하지 않았다.
- CAP·합의·2PC·멱등성·전달 보장은 우선 사전 지식이다. Raft 같은 알고리즘과 Kafka·Redis·Kubernetes 같은 제품을 같은 패턴 목록에 섞어 편 수를 늘리지 않는다.

## 5. 범위의 한계와 다음 수집 대상

EIP 65종 전체나 PoEAA 전 항목을 전수 편입하지 않았다. 이번 56건은 기존 가이드와의 연결, 사진의 누락 보완, 장애 사례 재현 가능성을 기준으로 고른 편집 후보군이다. 보안 패턴, UI의 MVP/MVVM, 동시성 패턴, 데이터 웨어하우스·스트림 처리, 배포 방식, DDD 전략 패턴 전체는 별도 확장 조사 대상이다.

DDD Reference 소개 페이지는 이번 조회에서 403으로 본문을 확보하지 못했다. 과거 보고서의 인용을 새 검증 결과로 취급하지 않았다. Bounded Context 등은 기존 참고 문서의 내용을 재사용하되, 새 전략 DDD 편을 집필할 때 원전을 다시 확보해야 한다.

카탈로그의 짧은 소개만 확인한 행은 **발견 완료 / 집필 근거 미완료**다. 완성 가이드의 최소 조건·정확한 운영 보장을 이 자료만으로 확정하지 않는다. ‘이름 미탐지’는 위 검색 범위와 표기 기준에 한정되며, 동의어로 된 모든 개념 설명의 부재를 증명하지 않는다.

## 6. 확인한 출처

| ID | 1차 자료 / 공식 자료 | 이번에 확인한 범위 |
| --- | --- | --- |
| S01 | [Chris Richardson — Microservices pattern language](https://microservices.io/patterns/index.html) | 카탈로그의 패턴명·분류·요약 |
| S02 | [Microsoft — Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/) | 카탈로그의 패턴명·문제·요약 |
| S03 | [Hohpe / Woolf — Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/) | 저자 카탈로그의 명명·분류. 모든 개별 패턴 본문을 정독한 것은 아님 |
| S04 | [Fowler — PoEAA Catalog](https://martinfowler.com/eaaCatalog/) | 저자 공개 카탈로그의 짧은 정의. 책 본문 확인과 구분 |
| S05 | [Richardson — API Gateway / BFF](https://microservices.io/patterns/apigateway.html) | 개별 페이지의 문제·해법 |
| S06 | [Istio — Sidecar or ambient?](https://istio.io/latest/docs/overview/dataplane-modes/) | data/control plane, 두 배치 방식. 제품 구현 근거이며 보편적 원전은 아님 |
| S07 | [Microsoft — Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) | 차단·복구와 Retry의 차이 |
| S08 | [Richardson — Saga](https://microservices.io/patterns/data/saga.html) | 로컬 거래·보상·조정 방식·격리 제약 |
| S09 | [Fowler — CQRS](https://martinfowler.com/bliki/CQRS.html) | 모델 분리, 동일 DB 가능성, 적용 비용 |
| S10 | [Fowler — Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) | 이벤트 원천·재생·외부 효과. 저자 스스로 초안임을 명시 |
| S11 | [Microsoft — Strangler Fig](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig) | 기능 단위의 점진적 대체 |
| S12 | [Microsoft — Sidecar](https://learn.microsoft.com/en-us/azure/architecture/patterns/sidecar) | 별도 프로세스/컨테이너와 수명주기 |
| S13 | [AWS — Timeouts, retries, backoff and jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) | 호출 실패·대기 한도·재시도 부작용 |
| S14 | [Richardson — Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html) | 원자적 기록·relay 중복·두 발행 갈래 |
| S15 | [Cockburn — Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture) | 저자 원문, 입출력에서 독립된 애플리케이션 |

## 7. 로컬 이름 검색 증거

검색은 대소문자를 무시하되 영문 단어 경계를 적용했다. 발견 파일은 대표 두 개만 기록한다. 구판·검토 기록에서의 이름 발견도 포함하므로 **발행 가이드 보유 여부와 별개**다. 이 표 자체는 새 산출물 검색에 포함하지 않았다.

| ID | 발견 파일 수 | 대표 위치 |
| --- | --- | --- |
| A01 | 0 | 미탐지 |
| A02 | 0 | 미탐지 |
| A03 | 0 | 미탐지 |
| A04 | 0 | 미탐지 |
| A05 | 4 | [pattern-guide/research/analysis-patterns.md](../../pattern-guide/research/analysis-patterns.md) · [pattern-guide/research/gof-behavioral.md](../../pattern-guide/research/gof-behavioral.md) |
| A06 | 16 | [pattern-guide/research/analysis-patterns.md](../../pattern-guide/research/analysis-patterns.md) · [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) |
| A07 | 1 | [pattern-guide/design-pattern-guide/facade/facade-guide_v0.1.0.md](../../pattern-guide/design-pattern-guide/facade/facade-guide_v0.1.0.md) |
| A08 | 0 | 미탐지 |
| R01 | 3 | [pattern-guide/design-pattern-guide/proxy/proxy-guide_v0.1.0.md](../../pattern-guide/design-pattern-guide/proxy/proxy-guide_v0.1.0.md) · [pattern-guide/design-pattern-guide/builder/builder-guide_v1.0.0.md](../../pattern-guide/design-pattern-guide/builder/builder-guide_v1.0.0.md) |
| R02 | 12 | [pattern-guide/research/analysis-patterns.md](../../pattern-guide/research/analysis-patterns.md) · [pattern-guide/research/gof-behavioral.md](../../pattern-guide/research/gof-behavioral.md) |
| R03 | 0 | 미탐지 |
| R04 | 0 | 미탐지 |
| R05 | 0 | 미탐지 |
| R06 | 0 | 미탐지 |
| R07 | 0 | 미탐지 |
| R08 | 0 | 미탐지 |
| D01 | 0 | 미탐지 |
| D02 | 0 | 미탐지 |
| D03 | 0 | 미탐지 |
| D04 | 0 | 미탐지 |
| D05 | 0 | 미탐지 |
| D06 | 0 | 미탐지 |
| D07 | 0 | 미탐지 |
| D08 | 13 | [pattern-guide/research/analysis-patterns.md](../../pattern-guide/research/analysis-patterns.md) · [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) |
| D09 | 1 | [pattern-guide/design-pattern-guide/command/command-guide_v0.1.0.md](../../pattern-guide/design-pattern-guide/command/command-guide_v0.1.0.md) |
| D10 | 0 | 미탐지 |
| M01 | 3 | [pattern-guide/research/gof-behavioral.md](../../pattern-guide/research/gof-behavioral.md) · [pattern-guide/design-pattern-guide/observer/observer-guide_v1.0.0.md](../../pattern-guide/design-pattern-guide/observer/observer-guide_v1.0.0.md) |
| M02 | 0 | 미탐지 |
| M03 | 0 | 미탐지 |
| M04 | 0 | 미탐지 |
| M05 | 0 | 미탐지 |
| M06 | 0 | 미탐지 |
| M07 | 0 | 미탐지 |
| M08 | 0 | 미탐지 |
| M09 | 0 | 미탐지 |
| M10 | 0 | 미탐지 |
| P01 | 15 | [pattern-guide/research/analysis-patterns.md](../../pattern-guide/research/analysis-patterns.md) · [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) |
| P02 | 1 | [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) |
| P03 | 1 | [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) |
| P04 | 0 | 미탐지 |
| P05 | 1 | [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) |
| P06 | 2 | [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) · [pattern-guide/design-pattern-guide/singleton/singleton-guide_v0.1.0.md](../../pattern-guide/design-pattern-guide/singleton/singleton-guide_v0.1.0.md) |
| P07 | 0 | 미탐지 |
| P08 | 0 | 미탐지 |
| P09 | 0 | 미탐지 |
| P10 | 6 | [pattern-guide/research/candidates.md](../../pattern-guide/research/candidates.md) · [pattern-guide/research/gof-creational-structural.md](../../pattern-guide/research/gof-creational-structural.md) |
| P11 | 0 | 미탐지 |
| P12 | 0 | 미탐지 |
| B01 | 0 | 미탐지 |
| B02 | 0 | 미탐지 |
| B03 | 0 | 미탐지 |
| B04 | 2 | [pattern-guide/research/gof-creational-structural.md](../../pattern-guide/research/gof-creational-structural.md) · [pattern-guide/design-pattern-guide/adapter/adapter-guide_v0.1.0.md](../../pattern-guide/design-pattern-guide/adapter/adapter-guide_v0.1.0.md) |
| B05 | 0 | 미탐지 |
| B06 | 0 | 미탐지 |
| B07 | 0 | 미탐지 |
| B08 | 4 | [pattern-guide/research/gof-behavioral.md](../../pattern-guide/research/gof-behavioral.md) · [pattern-guide/research/gof-creational-structural.md](../../pattern-guide/research/gof-creational-structural.md) |

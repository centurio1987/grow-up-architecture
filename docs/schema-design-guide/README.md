# 시나리오에서 스키마와 구현까지 — 제2판

최종 산출물은 `index.html`입니다. 기존 HTML 경로를 유지해 전면 개정했습니다. 본문·완전한 명세·예제 코드·검색·다운로드·실습이 모두 내장되어 있어 이 파일 하나로 오프라인에서 읽을 수 있습니다.

## 교재 구성

서론과 24장으로 구성합니다. 8개 구체적인 시나리오, 12개 가정과 5개 한계, 3개 외부 관점, 12개 규칙을 바탕으로 각 변환의 입력·추가 판단·출력 형식·실제 결과·검증을 설명합니다.

- 제1~3장: 시간과 주체가 있는 시나리오, 가정/한계 등록부, 정보 요구 추출
- 제4~5장: 외부 스키마의 구조적 형식, 완성 명세와 실제 조회 결과, 페이지·갱신 의미
- 제6~8장: 관점 통합, 개념 스키마·실제 인스턴스, 불변식과 행위 명세
- 제9~14장: 관계형 모델, 내부 저장 정책, 전체 DDL, 실제 데이터 SQL, 조회·쓰기 프로토콜, 결정적 생성기
- 제15~18장: 도메인 책임과 집합체, 실행 코드와 복원, 여섯 API 연산의 전체 OpenAPI·HTTP 예
- 제19~24장: 전체 추적, 역공학의 논리적 한계, 요구 변경, 10개 문제와 종합 실습 풀이, 검증·작업지·용어

범위는 단일 매장의 주문 접수·조회·취소·확정입니다. 결제·재고 예약·배송·환불·실운영 보존 정책은 포함하지 않으며 그 결과와 재검토 조건을 명시합니다. 제1판의 상품 중복 허용 사례는 이번 판에서 명시적으로 '한 주문 내 상품 중복 거부' 정책으로 바뀌었습니다. 예제 전체를 같은 정책에 맞췄습니다.

## 주요 산출물

`artifacts/`에 모든 완성 명세가 있습니다. HTML에도 동일한 내용이 내장되어 있고 각 명세를 다운로드할 수 있습니다.

- `scenarios.json`, `assumptions.json`: 구체적 시나리오와 전제·한계
- `external-schema.json`, `sample-results.json`: 외부 구조와 실제 입력·응답
- `conceptual-schema.json`, `conceptual-instance.json`, `use-cases.json`: 개념·행위·인스턴스
- `relational-plan.json`, `storage-policy.json`: 사람이 확정한 논리 매핑과 내부 정책
- `schema.sql`, `scenario-data.sql`, `queries.sql`: 전체 초기 DDL·SC01 데이터·조회/쓰기 SQL
- `compiler.mjs`, `generation-trace.json`: 결정적 생성기와 출력·미강제 의무
- `domain-design.json`, `domain.mjs`: 도메인 설계와 실행 가능한 예제
- `openapi.json`: 여섯 HTTP 연산의 OpenAPI 3.1.1 명세
- `traceability.json`, `test-cases.json`: 규칙 추적과 검증 사례

기존의 `openapi.json`, `example.sql`, `domain-model.mjs`, `generator.mjs` 진입 파일도 제2판 결과를 가리키도록 갱신했습니다. 생성기 인터페이스는 `compile(plan, policy)`입니다. 제1판의 `generate()` API는 사용하지 않습니다.

## 재생성·검증

프로젝트 루트에서 실행합니다.

```sh
python3 docs/schema-design-guide/build_guide.py
node docs/schema-design-guide/verify.mjs
```

본문 소스는 `chapters/`의 다섯 파일이며, 구조화된 명세 작성 소스는 `build_artifacts.py`입니다. `build_guide.py`가 명세 생성·SQL 컴파일·단일 HTML 패키징·기존 진입 파일 동기화를 수행합니다.

브라우저 검증은 이 컴퓨터의 `/Users/centurio/resume/node_modules/playwright/index.mjs`를 사용합니다. 다른 컴퓨터에서는 설치한 Playwright 경로로 변경하세요. 완성 HTML을 읽는 데는 이 의존성이 필요하지 않습니다.

## 검증 범위

`verification/report.json`에 실제 결과를 기록합니다. 순수 도메인과 생성기, 시나리오/명세 참조, OpenAPI의 내부 참조 및 예제의 선택된 제약, Python/JavaScript 간 canonical fingerprint 일치, HTML 검색·명세 펼침·다운로드·실습·인쇄·1440/768/390px 표시를 확인합니다.

실제 PostgreSQL DDL 실행·두 세션 동시성·롤백·멱등 접수 통합 테스트는 실행하지 않았습니다. HTTP 서버와 인증·카탈로그 어댑터도 구현하지 않았습니다. OpenAPI 검사는 전체 규격 적합성 검증기를 대신하지 않습니다. 메모리의 조건부 저장 실험은 DB 통합 테스트가 아닙니다. 이 제한은 교재에도 명시되어 있습니다.

최초 요청의 `claude/concept-alignment-conceptual-schema.md`는 작업 공간에서 찾지 못했으므로 원문의 문장별 검토본은 아닙니다.

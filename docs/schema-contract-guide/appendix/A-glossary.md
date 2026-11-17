# 부록

## A. 용어집

이 가이드에서 쓴 낱말을 주제별로 모았습니다. 원전에서 온 말은 원어와 출처를 함께 적었고, 이 가이드가 교육용으로 만든 말은 출처 칸에 **이 가이드**라고 적었어요. "처음 나오는 장"은 그 낱말을 정의한 장입니다. 제3부·제4부의 낱말은 구성 설계서의 배치에 따라 부 단위로 적었습니다.

출처 칸의 확인 수준은 리서치 문서(`research/2026-11-17-three-schema-and-contract.md`)를 따릅니다. 원문을 직접 본 것은 그대로 적고, 2차 자료로만 확인한 것은 "(2차)"를 붙였어요.

### 세 층과 사상

| 낱말 | 이 가이드의 뜻 | 원어 | 출처 | 처음 나오는 장 |
| --- | --- | --- | --- | --- |
| 외부 스키마 | 한 이용자(사람·프로그램·다른 팀의 시스템)가 보는 정보의 내용과 모양. 개념 스키마에서 파생 규칙으로 만든다 | external schema | ANSI/X3/SPARC 보고서(1975, 1977/78), NBS IR 85-3173(1985), ISO/TR 9007(1987) | 1장, 3장 |
| 개념 스키마 | 고른 담화 세계에 관해 참이어야 하는 사실의 종류와 규칙의 기술. 표현·저장 방식은 담지 않는다 | conceptual schema | 같음 | 1장, 2장 |
| 내부 스키마 | 개념 스키마를 특정 DBMS에 기록하는 방법 전체. 이 가이드는 논리 구조(표·열·키·제약)와 물리 선택(인덱스·분할 등)을 함께 둔다 | internal schema | 원뜻은 같은 보고서. 테이블 구조를 내부 쪽에 둔 경계는 **이 가이드** | 1장, 4장 |
| 사상 | 한 층의 표현을 다른 층의 표현으로 옮기는 규칙. 외부-개념 사상(파생 규칙)과 개념-내부 사상(저장 규칙) | mapping | NBS IR 85-3173 | 0장, 1장 |
| 데이터 독립성 | 한 층이 바뀌어도 사상만 고쳐 위층을 그대로 두는 성질 | data independence | NBS IR 85-3173 | 1장 |
| 논리적 데이터 독립성 | 개념 스키마가 바뀌어도 외부 스키마와 그 위의 프로그램이 그대로인 성질 | logical data independence | 교재·백과사전(2차). ISO/TR 9007 요구 5가 같은 효과를 적음 | 1장 |
| 물리적 데이터 독립성 | 내부 스키마가 바뀌어도 개념·외부 스키마가 그대로인 성질 | physical data independence | 교재·백과사전(2차). ISO/TR 9007 요구 6 | 1장 |
| 하위 스키마 | CODASYL에서 응용 프로그램마다 보는 부분 스키마. 외부 스키마의 앞선 꼴 | subschema | CODASYL DBTG 1971(2차), Clemons 1979(초록) | 1장 |
| 씨앗 | 설계를 시작할 때 처음 받은 자료 | — | **이 가이드** | 0장 |

### 개념 스키마

| 낱말 | 이 가이드의 뜻 | 원어 | 출처 | 처음 나오는 장 |
| --- | --- | --- | --- | --- |
| 담화 세계 | 기술하기로 고른 실제 또는 가정된 세계의 부분. 있었던 것, 있는 것, 있을 것을 모두 포함 | universe of discourse | ISO/TR 9007 | 2장 |
| 정보 베이스 | 어느 시점·기간에 담화 세계에 실제로 있다고 인식된 대상과 상태의 기술. 지금의 사실들 | information base | ISO/TR 9007 | 2장 |
| 100% 원칙 | 담화 세계의 관련 있는 일반 규칙(정적·동적)을 모두 개념 스키마에 적어야 한다는 원칙 | 100 percent principle | ISO/TR 9007 | 2장 |
| 개념화 원칙 | 개념 스키마에는 개념적으로 관련 있는 것만 담고, 데이터 표현·물리 조직·메시지 형식은 뺀다는 원칙 | conceptualization principle | ISO/TR 9007 | 2장 |
| Helsinki 원칙 | 의미 있는 말 주고받기는 미리 합의한 의미·구문 규칙이 있어야 가능하다는 원칙. 실무에서는 용어집 | Helsinki principle | ISO/TR 9007 | 2장 |
| 개체 유형 | 따로 알아볼 수 있는 사물의 종류 | entity type (ER: entity set) | Halpin ORM 개요, Chen 1976 | 2장 |
| 값 유형 | 그 자체로 뜻이 정해진 값의 종류 | value type (ER: value set) | 같음 | 2장 |
| 참조 방식 | 개체 하나를 값으로 가리키는 방법. 시간이 지나도 바뀌지 않아야 함 | reference mode | Halpin ORM 개요 | 2장 |
| 사실 유형 | 개체·값에 관해 말할 수 있는 문장의 틀 | fact type | Halpin ORM 개요 | 2장 |
| 속성 | 개체 집합이나 관계 집합에서 값 집합으로 가는 함수 | attribute | Chen 1976 | 2장 |
| 제약 | 사실들이 지켜야 하는 규칙. 정적 규칙(한 순간의 상태)과 동적 규칙(상태가 바뀌는 방식) | constraint; static/dynamic aspects | ISO/TR 9007, Halpin | 2장 |
| 파생 규칙 | 다른 사실에서 계산되는 사실을 정하는 규칙 | derivation rule | Halpin ORM 개요 | 2장 |
| 경계 지어진 맥락 | 하나의 모델이 일관되게 통하는 범위. 이 가이드는 맥락 하나를 담화 세계 하나로 읽음 | bounded context | Fowler 2014(Evans 인용). 담화 세계와 잇는 해석은 **이 가이드** | 2장 |
| 기본 사실 | 뜻을 잃지 않고는 더 단순한 사실들의 "그리고"로 나눌 수 없는 사실 | elementary fact | Halpin ORM 개요 | 8장 |
| CSDP | 익숙한 예를 기본 사실로 바꾸고 제약을 하나씩 더하는 일곱 단계 절차 | Conceptual Schema Design Procedure | Halpin ORM 개요 | 8장 |
| 데이터 유스케이스 | 담당자에게 익숙한 정보 표본(보고서·화면·양식). CSDP 1단계의 입력 | data use case | Halpin 1999 | 8장 |
| 인구, 인구 검사 | 사실 유형을 채운 예제 값, 그 값으로 사실 유형의 틀과 제약을 시험하는 일 | population, population check | Halpin ORM 개요 | 8장 |
| 반례 인구 | 제약을 일부러 어기는 인구. 담당자에게 보여 가능한지 묻는다 | — (counterexample population) | Halpin 2000 | 8장 |
| 유일성 제약 | 역할 하나 이상에 같은 값 조합이 두 번 나오지 않는다는 선언 | uniqueness constraint | Halpin | 8장 |
| 필수 역할 제약 | 그 유형의 모든 객체가 그 역할을 한다는 선언 | mandatory role constraint | Halpin | 8장 |
| 값 제약, 집합 비교 제약 | 값을 열거·범위로 막음 / 역할 인구끼리 부분집합·같음·배타 | value constraint, set-comparison constraint | Halpin | 8장 |
| 하위 유형 | 특정 역할을 일부 객체만 할 때 두는 개체 유형의 갈래 | subtype | Halpin, Elmasri·Navathe | 8장, 12장 |

### 외부 스키마

| 낱말 | 이 가이드의 뜻 | 원어 | 출처 | 처음 나오는 장 |
| --- | --- | --- | --- | --- |
| 외부 스키마의 다섯 항목 | 이용자·내용·모양·파생 규칙·갱신 의미 | — | **이 가이드** | 3장 |
| 뷰 | 이름 붙여 저장한 질의. 데이터베이스 상태에서 뷰 상태로 가는 사상 | view | Bancilhon·Spyratos 1981 | 3장 |
| 뷰 갱신 문제 | 뷰에서 받은 변경을 데이터베이스 변경으로 옮길 때 가능한 번역이 여럿인 문제 | view update problem | Bancilhon·Spyratos 1981, Masunaga 1984 | 3장 |
| 보완 뷰 | 원래 뷰와 합치면 데이터베이스 전체를 다시 계산할 수 있는 뷰 | complement | Bancilhon·Spyratos 1981 | 3장 |
| 고정 보완 번역 | 보완 뷰를 그대로 둔 채 하는 번역. 번역기가 있을 필요충분조건 | translation under constant complement | Bancilhon·Spyratos 1981 | 3장 |
| 부수 효과 | 고치지 않은 행이 함께 바뀌는 일(잇기 뷰에서 흔함) | side effect | Guagliardo·Franconi 2012 | 3장 |
| WITH CHECK OPTION | 결과가 그 뷰에 보이지 않게 될 변경을 거부하는 뷰 옵션 | — | PostgreSQL CREATE VIEW 문서 | 3장 |
| 갱신 의미 | 외부 스키마의 모양으로 받은 변경을 개념 사실의 어떤 변경으로 옮기는가 | — | **이 가이드** | 3장, 9장 |
| 갱신 의미 결정표 | 외부 스키마의 꼴(고르기만, 뽑기, 잇기, 계산, 묶음)마다 쓰기를 받을지 정한 표 | — | **이 가이드** | 9장 |
| 가림 | 권한 없는 이용자에게서 사실을 빼거나 흐리는 외부 스키마의 항목 | — | Chamberlin·Gray·Traiger 1975(2차)의 뷰·권한 연결을 바탕으로 **이 가이드**가 이름 붙임 | 3장 |
| CQRS 읽기 모델 | 쓰기 모델과 따로 둔 읽기용 표현. 이 가이드는 읽기 전용 외부 스키마로 해석 | read model | Fowler 2011, Microsoft Learn. 외부 스키마로 보는 해석은 **이 가이드** | 3장 |
| BFF | 사용자 경험 하나마다 두는 백엔드 | Backends for Frontends | Sam Newman 2015 | 3장 |

### 내부 스키마

| 낱말 | 이 가이드의 뜻 | 원어 | 출처 | 처음 나오는 장 |
| --- | --- | --- | --- | --- |
| 작업 부하 | 중요한 질의와 갱신, 그 빈도와 성능 목표. 물리 선택의 입력 | workload | Ramakrishnan·Gehrke 3판 물리 설계 장 | 4장 |
| 보장 위치표 | 제약·파생·계약 조항마다 그것을 지키는 자리(DB·응용·질의·발행 과정)와 방법을 적은 표 | — | **이 가이드** | 4장 |
| 사상이 뜻을 지키는 네 조건 | 기록·식별·단일·보장 | — | **이 가이드**(ISO/TR 9007의 의미 보존 역할을 바탕으로) | 4장 |
| 배제 제약 | 두 행이 주어진 연산자로 모두 참이 되는 것을 막는 제약. 구간 겹침 금지에 씀 | exclusion constraint | PostgreSQL 문서 | 4장 |
| 갱신 이상 | 같은 사실이 여러 줄에 있어 한 곳만 고치면 어긋나는 일 | update anomaly | 교재(2차) | 4장 |
| 정규형 | 1NF(Codd 1970), 2NF·3NF(Codd 1971/72), BCNF(Boyce·Codd 1974), 4NF(Fagin 1977) | normal forms | Codd 1970 원문, 나머지는 2차 | 4장 |
| 비정규화 | 성능을 위해 같은 사실을 다시 저장하는 일. 맞추는 쪽을 보장 위치표에 적어야 함 | denormalization | Ramakrishnan·Gehrke | 4장 |
| 결정 기록 | 결정·근거(작업 부하 줄)·비용·다시 볼 조건을 적은 기록 | — | **이 가이드** | 4장, 12장 |
| 하위 유형 사상 네 방법 | 8A 상위·하위 각각, 8B 하위만, 8C 한 표 + 유형 속성, 8D 한 표 + 플래그 | — | Elmasri·Navathe 슬라이드 | 12장 |

### 계약

| 낱말 | 이 가이드의 뜻 | 원어 | 출처 | 처음 나오는 장 |
| --- | --- | --- | --- | --- |
| 계약 | 경계 하나에서 제공자가 소비자에게 하는 약속의 묶음 | contract | 정의는 **이 가이드**. 바탕은 Meyer 1992, Evans 2015 | 5장 |
| 사전조건 | 호출하기 전에 소비자가 참으로 만들어야 하는 것 | precondition (`require`) | Meyer 1992, Eiffel 문서 | 5장 |
| 사후조건 | 사전조건이 참이었다면 끝났을 때 제공자가 참으로 만드는 것 | postcondition (`ensure`) | 같음 | 5장 |
| 불변식 | 호출 전후에 언제나 참인 것 | class invariant | 같음 | 5장 |
| 업무 사전조건, 형식 사전조건 | 업무상 뜻이 없어지는 조건 / 요청을 해석할 수 없게 되는 조건. 경계에서는 둘 다 제공자가 검사 | — | **이 가이드**(Meyer의 틀을 경계에 맞춤) | 5장 |
| 최소 보장 | 어떻게 끝나든 성립하는 것 | minimal guarantee | Cockburn(2차 해설로 확인) | 5장 |
| 계약의 다섯 겹 | 구조·의미·행위·품질·진화 | — | **이 가이드** | 5장 |
| 실패표 | 실패마다 응답·상태 변화·다시 시도를 적은 표 | — | **이 가이드** | 11장 |
| 멱등성 | 같은 요청을 여러 번 보내도 한 번 보낸 것과 같은 효과 | idempotency | RFC 9110 §9.2.2 | 5장 |
| 제공자 계약 | 제공자가 내놓는 기능 전체. 닫혀 있고 하나이며 권위 있음 | provider contract | Robinson 2006 | 5장 |
| 소비자 계약 | 소비자 한 명이 제공자에게 기대하는 것 | consumer contract | 같음 | 5장 |
| 소비자 주도 계약 | 지금 있는 소비자 계약들의 합에서 나온 제공자 계약 | consumer-driven contract | 같음 | 5장 |
| Tolerant Reader | 필요한 필드만 읽고 나머지는 무시하는 소비자 | Tolerant Reader | Fowler 2011 | 5장 |
| 호환성 유형 | BACKWARD(새 소비자가 옛 데이터를 읽음), FORWARD(옛 소비자가 새 데이터를 읽음), FULL(둘 다), *_TRANSITIVE(모든 이전 버전과) | compatibility types | Confluent Schema Registry 문서 | 5장 |
| Postel 법칙 | 받을 때는 너그럽게, 보낼 때는 보수적으로 | robustness principle | RFC 761(1980), RFC 1122(1989) | 5장 |
| 적극적 유지보수 | 너그럽게 받기 대신 명세를 계속 고치고 명세 밖 입력에는 분명한 오류를 내라는 처방 | active protocol maintenance | RFC 9413(2023) | 5장 |
| Hyrum 법칙 | 이용자가 충분히 많으면 관찰 가능한 모든 동작에 누군가 기댄다 | Hyrum's Law | hyrumslaw.com | 5장 |
| 실제 계약 | 선언한 계약 + 관찰된 의존 | — | **이 가이드** | 5장 |
| 공개 API 선언 | 무엇이 계약에 들어가는지 밝히는 일. 버전 번호의 전제 | public API | Semantic Versioning 2.0.0 | 5장, 11장 |
| 데이터 계약 | 데이터 생산자와 소비자 사이의 계약. 스키마·품질·SLA 등 | data contract | ODCS(Bitol, LF AI & Data) | 5장 |
| Published Language, Open-host Service | 공통 매체로 쓰는 잘 문서화된 공유 언어 / 그 언어로 연 프로토콜 | — | Evans 2015 | 5장 |

### 설계 방법

| 낱말 | 이 가이드의 뜻 | 원어 | 출처 | 처음 나오는 장 |
| --- | --- | --- | --- | --- |
| 추출 원장 | 씨앗에서 뽑은 조각을 여섯 칸(T 용어, F 사실, V 보기 요구, C 연산, R 규칙, Q 미결 질문)에 한 줄씩 적는 표 | — | **이 가이드** | 0장, 7장 |
| 근거 수준 | 관찰(자료에서 보임), 진술(누군가 말함), 확인(책임자가 승인) | — | **이 가이드** | 0장, 7장 |
| 가정 | 미결 질문에 답을 받기 전에 설계를 진행하려고 둔 임시 답. 답이 다르면 바뀌는 곳을 함께 적음 | — | **이 가이드** | 13장 |
| 하향·상향·안쪽에서 바깥·혼합 | 개념 스키마를 어디서부터 그릴지 정하는 네 전략 | top-down, bottom-up, inside-out, mixed | Batini·Ceri·Navathe 계열(Atzeni 외 슬라이드, Batini 2015 강의록으로 확인) | 7장 |
| 뷰 통합 | 여러 이용자 관점의 부분 스키마를 하나로 합치는 일 | view integration | Batini·Lenzerini·Navathe 1986 | 10장 |
| 통합의 네 단계 | 사전 통합, 비교, 맞추기, 병합과 재구성 | preintegration, comparison, conforming, merging and restructuring | 같음 | 10장 |
| 동음이의어, 이음동의어 | 같은 이름이 다른 개념 / 같은 개념이 다른 이름 | homonym, synonym | 같음 | 10장 |
| 구조 충돌 | 유형 충돌, 종속 충돌, 키 충돌, 행위 충돌 | type, dependency, key, behavioral conflicts | 같음 | 10장 |
| 스키마 사이 관계 | 어느 구성 스키마에도 없다가 통합하며 발견되는 관계 | interschema properties | 같음 | 10장 |
| 완전성·적절성·정확성·최소성·이해 용이성 | 통합·설계 결과의 점검 기준. 문헌마다 목록이 다름 | completeness, pertinence, correctness, minimality, understandability | Batini·Lenzerini·Navathe 1986, Atzeni 외, Batini 2015 | 10장 |
| 구문·의미·화용 품질 | 모델과 언어 / 도메인 / 독자 이해의 일치 | syntactic, semantic, pragmatic quality | Lindland·Sindre·Sølvberg 1994(2차) | 10장 |
| 추적표 | 원장 한 줄이 네 산출물의 어디에 나타나는지 잇는 표 | — | **이 가이드** | 13장 |
| 인구 왕복 | 예제 데이터를 내부 스키마에 넣고 외부 스키마로 꺼내 손으로 낸 기대값과 견주는 검사 | — | **이 가이드** | 13장 |
| 반례 시험 | 규칙마다 어기는 데이터와 아슬아슬하게 지키는 데이터를 넣어, 지키는 자리가 기대대로 반응하는지 보는 검사 | — | **이 가이드**(Halpin의 반례 인구를 DB에 넣는 꼴) | 13장 |

### 제3부·제4부에서 쓰는 낱말

| 낱말 | 뜻 | 원어 | 출처 | 부 |
| --- | --- | --- | --- | --- |
| 유스케이스(fully dressed) | 주 행위자의 목표를 주 성공 시나리오와 확장으로 적은 형식. 사전조건·최소 보장·성공 보장을 가짐 | use case | Cockburn 2000(출간)/2001(저작권 표기) | 제3부 |
| 사용자 스토리, INVEST, 3C | "~로서, ~하고 싶다, ~하려고" 꼴의 요구 / 좋은 스토리의 여섯 성질 / 카드·대화·확인 | user story, INVEST, Card·Conversation·Confirmation | Cohn, Wake 2003, Jeffries 2001 | 제3부 |
| Gherkin, Examples 표 | Given·When·Then 시나리오 언어 / 같은 시나리오를 여러 값으로 되풀이하는 표 | Gherkin, Scenario Outline·Examples | Cucumber 문서 | 제3부 |
| 이벤트 스토밍 | 도메인 이벤트·명령·정책·읽기 모델 등을 붙임쪽지로 펼치는 워크숍. 색 범례는 원문(2013)과 관행이 다름 | EventStorming | Brandolini 2013, 관행 범례는 2차 | 제3부 |
| 도메인 스토리텔링 | 행위자·작업 객체·활동·순번으로 업무를 그리는 그림 언어 | Domain Storytelling | Hofer·Schwentner 2021 | 제3부 |
| EARS | 요구 문장의 다섯 기본 패턴(항상·사건·상태·원치 않는 동작·선택 기능)과 조합 | Easy Approach to Requirements Syntax | Mavin 외 2009 | 제3부 |
| 좋은 요구의 특성 | 필요함·모호하지 않음·검증 가능함 등 아홉 | — | ISO/IEC/IEEE 29148:2018(2차) | 제3부 |
| 양식 분석 | 업무 양식의 필드에서 개체·관계·제약을 뽑아 점진적으로 합치는 방법 | form analysis | Choobineh 외 1988 | 제3부 |
| 데이터 프로파일링 | 데이터베이스의 작지만 정보가 많은 요약을 만드는 일 | data profiling | Abedjan·Golab·Naumann 2015 | 제4부 |
| 유일 열 조합 | 값이 행을 유일하게 가리키는 열 집합. 키 후보 | unique column combination (UCC) | 같음 | 제4부 |
| 함수 종속, 근사 함수 종속 | 한 열 집합의 값이 다른 열의 값을 정함 / 몇 행을 빼면 성립하는 종속 | functional dependency, approximate FD | 같음, TANE(Huhtala 외 1999) | 제4부 |
| 포함 종속 | 한 열 집합의 값이 모두 다른 열 집합에 나타남. 외래 키 후보 | inclusion dependency (IND) | Abedjan·Golab·Naumann 2015 | 제4부 |
| 데이터베이스 역공학 | DBMS에 묶인 구조를 뽑은 뒤 개념으로 되돌리는 일 | database reverse engineering | Hainaut 외 1993, 1996 | 제4부 |
| 암묵 구조 | 선언되지 않고 코드나 화면 동작으로만 지켜지는 구조. 대표는 외래 키 | implicit structures | Hainaut 외 1996 | 제4부 |
| 스키마 추론 | 반정형 데이터 표본에서 스키마를 뽑는 일 | schema inference | Baazizi 외(요약), GenSON·quicktype 문서 | 제4부 |

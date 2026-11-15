from pathlib import Path
import base64, html

ROOT = Path(__file__).parent

SOURCES = [
 ('s1','Scott Ambler · Data Modeling 101','https://agiledata.org/essays/datamodeling101.html','개념·논리·물리 모델의 구분과 데이터 모델링 활동. 이 가이드의 단계 구성은 여러 자료를 종합한 제안이다.'),
 ('s2','Adam Dymitruk · Event Modeling: What is it?','https://eventmodeling.org/posts/what-is-event-modeling/','정보의 유입·이동·조회와 completeness check. 저장량의 수학적 최소성을 증명하는 절차로 해석하지 않는다.'),
 ('s3','Alberto Brandolini · EventStorming','https://www.eventstorming.com/','복잡한 업무를 함께 발견하는 워크숍. 화면·테이블 자동 변환 규칙이 아니다.'),
 ('s4','Cucumber · Example Mapping','https://cucumber.io/docs/bdd/example-mapping/','Story, Rule, Example, Question을 분리하여 모호성을 드러내는 방법.'),
 ('s5','Eric Evans · DDD Reference','https://www.domainlanguage.com/ddd/reference/','Ubiquitous Language, Bounded Context, Entity, Value Object, Aggregate의 후속 학습 진입점.'),
 ('s6','Terry Halpin · Object-Role Modeling','https://www.orm.net/resources','사실 기반 개념 모델링과 제약. 여기서 ORM은 객체-관계 매핑 라이브러리가 아니다.'),
 ('s7','OMG · BPMN','https://www.omg.org/bpmn/','참여자·업무 흐름·메시지·예외를 표현하는 표준 표기.'),
 ('s8','OMG · UML 2.5.1','https://www.omg.org/spec/UML/2.5.1','StateMachines 절을 통해 상태·전이·가드·효과의 의미를 학습.'),
 ('s9','Volere · Requirements Specification Template','https://www.volere.org/templates/volere-requirements-specification-template/','요구사항의 근거, 출처, 검증 가능성을 체계화하는 템플릿. 본 가이드의 양식은 별도로 작성했다.'),
 ('s10','CMU SEI · Quality Attribute Workshop Collection','https://www.sei.cmu.edu/library/quality-attribute-workshop-collection/','아키텍처 설계 전에 이해관계자의 품질 요구를 시나리오로 구체화하는 방법.'),
 ('s11','IBM · Database normalization','https://www.ibm.com/think/topics/database-normalization','함수 종속, 정규형, 갱신 이상을 학습하는 개요.'),
 ('s12','Martin Fowler · Temporal Patterns','https://martinfowler.com/eaaDev/timeNarrative.html','이력 요구의 종류와 Effectivity 등 시간 모델 패턴.'),
 ('s13','Martin Fowler · Bitemporal History','https://martinfowler.com/articles/bitemporal-history.html','업무상 유효한 시간과 시스템이 알게 된 시간을 분리하는 이유.'),
 ('s14','PostgreSQL 18 · Constraints','https://www.postgresql.org/docs/18/ddl-constraints.html','PK, FK, UNIQUE, NOT NULL, CHECK의 기능과 범위.'),
 ('s15','PostgreSQL 18 · Transaction Isolation','https://www.postgresql.org/docs/18/transaction-iso.html','격리 수준과 동시 실행 이상. Serializable 재시도도 함께 학습.'),
 ('s16','PostgreSQL 18 · Multicolumn Indexes','https://www.postgresql.org/docs/18/indexes-multicolumn.html','복합 인덱스와 접근 조건의 관계.'),
 ('s17','PostgreSQL 18 · Using EXPLAIN','https://www.postgresql.org/docs/18/using-explain.html','실행 계획과 실측으로 인덱스 가설을 검증하는 방법.'),
 ('s18','Martin Fowler · CQRS','https://martinfowler.com/bliki/CQRS.html','쓰기·읽기 모델 분리의 효용과 복잡성. 모든 시스템에 적용할 기본값은 아니다.'),
 ('s19','Martin Fowler · Event Sourcing','https://martinfowler.com/eaaDev/EventSourcing.html','이벤트를 상태 재구성의 기반으로 삼는 저장 방식. 이벤트 발견 기법과 구분.'),
 ('s20','Chris Richardson · Transactional Outbox','https://microservices.io/patterns/data/transactional-outbox.html','DB 변경과 메시지 발행의 이중 쓰기 문제, 릴레이와 중복 처리.'),
]

def cite(*ids):
    return '<span class="cite">근거·읽을거리: '+ ' · '.join(f'<a href="#{i}">[{i[1:]}]</a>' for i in ids)+'</span>'

def table(headers, rows):
    return '<div class="table-wrap"><table><thead><tr>'+''.join('<th scope="col">'+h+'</th>' for h in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+str(c)+'</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table></div>'

def diagram(name, alt, caption):
    data = base64.b64encode((ROOT/'assets'/f'{name}.png').read_bytes()).decode()
    return f'<figure><a href="data:image/png;base64,{data}" download="{name}.png" aria-label="{alt} 이미지 저장"><img src="data:image/png;base64,{data}" alt="{alt}"></a><figcaption>{caption} 그림을 누르면 원본을 저장할 수 있습니다.</figcaption></figure>'

sections=[]
def section(id, title, body): sections.append((id,title,body))

section('start','01. 설계의 완성은 ERD가 아니라 설명 가능한 결정이다', '''
<p class="lead">기획의 시나리오와 컨셉만으로 테이블을 바로 뽑기 어렵다면, 빠진 것은 대개 <strong>어떤 사실을, 누구의 책임으로, 어느 시점의 의미로, 얼마나 오래 남겨야 하는가</strong>에 대한 결정이다.</p>
<p>필요한 중간 산출물은 <strong>업무 규칙·구체 예시 → 정보 출처와 생명주기 → 영속화 결정표 → 정합성 명세</strong>다. 이것을 개념 모델과 결합하여 키·관계·정규화를 결정하고, 실제 조회·변경 부하를 보고 물리 스키마를 만든다. 마지막에는 원래 시나리오뿐 아니라 실패와 동시 실행도 재현한다.</p>
<div class="callout"><strong>이 가이드의 범위</strong><p>관계형 DB를 사용하는 업무 서비스의 OLTP 설계가 중심이다. PostgreSQL 18 예제를 사용하지만 분석 절차는 DBMS와 분리한다. 데이터 웨어하우스의 차원 모델링, 검색 인덱스, 문서형 DB는 별도 물리·분석 모델로 검토한다. 모든 방법론을 한 프로젝트에 도입하라는 뜻은 아니다.</p></div>
<p>설계는 한 번에 종료되는 발견 작업이 아니다. 이번 범위에서 중요한 질문이 해소되고, 남은 가정과 검증 계획이 명시되면 구현 가능한 설계 기준선이 된다. 작은 기능은 한 문서와 몇 개의 표로 충분하다. 아래 산출물은 파일 개수가 아니라 <em>답해야 할 질문의 묶음</em>이다.</p>
<div class="cards"><div><b>WHAT</b><h3>무엇을 기억할 것인가</h3><p>의미·출처·시점·보존 목적을 설명한다.</p></div><div><b>HOW</b><h3>어떻게 올바르게 유지할 것인가</h3><p>키·제약·트랜잭션·경합 처리를 정한다.</p></div><div><b>PROOF</b><h3>무엇으로 타당성을 확인할 것인가</h3><p>예시·반례·조회·운영 시나리오를 재현한다.</p></div></div>
'''+cite('s1'))

section('corrections','02. 제공된 설명에서 유지할 통찰과 고칠 단정',table(['주장','정확하게 다듬은 해석'],[
 ('기획은 흐름, 스키마는 상태다','출발점으로는 유용하지만 배타적 구분은 아니다. 요구사항에는 정적 사실·업무 규칙·감사·보존 요구도 포함될 수 있고, 스키마에는 사건·이력도 저장된다.'),
 ('영속화 여부는 기획이 결정할 수 없다','업무 담당자는 “가격이 바뀌어도 과거 주문 금액을 유지한다”를 결정한다. 기술 담당자는 스냅샷·버전 참조·이벤트 등 구현 대안을 결정한다. <strong>업무 의미와 기술 전략을 공동으로 구체화</strong>해야 한다.'),
 ('모든 읽기 필드는 앞선 이벤트로부터 유도되어야 한다','Event Modeling의 정보 완전성 점검은 출처와 목적지를 연결한다. 초기 데이터·외부 시스템·시간·권한 같은 입력도 모델에 포함해야 한다. 이벤트만으로 표현하지 않는 저장 구조에도 정보 추적 원리를 적용할 수 있다.'),
 ('이벤트 모델은 영속화 하한선을 증명한다','모델에 적힌 시나리오의 정보 누락을 발견하는 데 유용하다. 전체 요구의 완전성이나 저장량의 수학적 최소성은 증명하지 않는다. 재조회 가능성·장애·보존·계산 비용에 따라 저장 방식은 달라진다.'),
 ('Aggregate = 트랜잭션 = 스키마 경계','Aggregate는 도메인 불변식을 보호하는 설계 단위다. 한 Aggregate가 여러 테이블에 저장될 수 있고, 같은 DB의 유니크 제약은 여러 Aggregate 인스턴스에 걸칠 수 있다. 경계를 그대로 등치하지 않는다.'),
 ('C 없는 데이터와 R 없는 데이터는 잘못된 데이터다','발견 신호이지 삭제 판정이 아니다. 외부 수입·초기 적재·감사 조회·배치·보존 의무가 빠졌을 수 있다. 주체와 목적을 확인한 뒤 판단한다.'),
 ('화면을 이벤트로 재구성하려면 Event Sourcing이 필요하다','분석에 사건과 읽기 모델을 써도 구현은 현재 상태 테이블과 필요한 이력만으로 충분할 수 있다. Event Sourcing과 CQRS는 별도의 아키텍처 선택이다.'),
])+cite('s2','s5','s18','s19')+'''<p>아래의 주문 예제와 영속화 결정표, 완료 게이트는 이 가이드에서 구성한 교육용 종합안이다. 특정 방법론이 이 문서 전체를 그대로 규정한다고 해석하지 않는다.</p>''')

section('map','03. 전체 경로와 단계별 완료 기준',diagram('pipeline','요구 발견 → 사실과 변화 → 저장 판단 → 논리 모델 → 물리 모델 → 반례 검증의 순환','도식 1. 분석의 출발점과 검증에서 되돌아갈 위치.')+table(['단계','읽을 입력 → 만들 출력','핵심 활동','다음 단계로 넘어가는 기준'],[
 ('1 · 범위와 언어','컨셉·목표·이해관계자 → 범위/용어집','행위자, 외부 시스템, 성공 결과, 제외 범위를 합의','누가 어떤 결과를 얻는지 같은 뜻으로 말한다.'),
 ('2 · 실제 업무','범위/용어집 → 유스케이스·예시·규칙','정상·대안·실패를 실제 값으로 구체화','핵심 규칙마다 정상 예와 위반 예가 있다.'),
 ('3 · 사실과 변화','예시/규칙 → 개념 모델·상태/이벤트 모델','정체성·관계·전이·입력/출력의 출처를 교차 확인','각 사실의 생성·변경·조회 주체가 설명된다.'),
 ('4 · 영속화','위 모델 + 품질/보존 요구 → 결정표','참조/스냅샷, 저장/파생, 현재/이력, 소유권을 판단','필드마다 선택 이유와 미결정 사항의 담당자가 있다.'),
 ('5 · 정합성','규칙/결정표 → 트랜잭션·경합 명세','불변식을 제약·원자적 쓰기·비동기 정책으로 배정','두 요청이 동시에 와도 규칙을 지키는 방법이 있다.'),
 ('6 · 논리 설계','개념/결정/정합성 → 논리 ERD·데이터 사전','키, 함수 종속, 카디널리티, NULL, 정규화','예시를 저장하고 다시 읽어 원래 의미를 복원한다.'),
 ('7 · 물리 설계','논리 모델 + 워크로드 → DDL·인덱스·운영 계획','타입, 제약, 접근 경로, 마이그레이션을 명시','주요 쿼리와 데이터 규모에 대한 검증 계획이 있다.'),
 ('8 · 검증','전체 산출물 → 테스트 증거·결정 이력','시나리오 재현, 반례, 경합, 파기·복구 점검','실패한 규칙은 수정하거나 명시적으로 범위를 조정한다.'),
])+'''<p><strong>실행 순서는 왕복한다.</strong> 관계 모델을 먼저 그리다가 상태 질문이 생길 수도 있다. EventStorming을 선택했다면 사건에서 시작해 개념으로 이동해도 된다. 이 경로는 산출물 의존성을 보여 주는 기본 진행안이며 폭포수식 일회성 승인 절차가 아니다.</p>''')

ARTIFACTS = [
 ('A01','문제·범위·이해관계자 명세','컨셉, 기존 업무 자료, 사용자/운영자 인터뷰','① 달성할 결과와 실패 비용을 적는다. ② 사용자·운영·지원·외부 시스템을 나눈다. ③ 시스템 안팎의 책임과 제외 범위를 그린다. ④ 사실과 가정을 구분한다.','목표 / 행위자 / 현재 문제 / 성공 기준 / 시스템 경계 / 제외 / 가정 / 담당자','“주문 조회 가능”을 고객·상담원 중 누가, 언제까지 해야 하는지 말할 수 있다.','Requirements Engineering, stakeholder analysis, context diagram, Volere; 요구 도출 → 분석 → 명세 → 검증의 순환','s9'),
 ('A02','유비쿼터스 언어·정체성 사전','A01, 화면 문구, 계약/업무 양식','① 실제 표현을 수집한다. ② 정의·반례·동의어를 쓴다. ③ 문맥별로 다른 뜻을 분리한다. ④ 이름이 바뀌어도 같은 대상을 구분하는 식별 기준을 정한다.','용어 / 정의 / 문맥 / 예·반례 / 동의어 / 식별 기준 / 소유자','“고객”, “수령인”, “결제자”를 같은 엔티티로 볼지 이유를 설명한다.','DDD Ubiquitous Language·Bounded Context, entity/value object; 용어집은 고정 사전이 아니라 모델과 함께 수정','s5'),
 ('A03','유스케이스·업무 흐름','A01–02, 관찰, 기존 업무 절차','① 행위자의 목표와 트리거를 적는다. ② 사전·사후 조건을 정한다. ③ 정상 흐름을 쓴다. ④ 실패·취소·재시도·타임아웃을 추가한다. ⑤ 조직/시스템 간 인계를 표시한다.','목표 / 트리거 / 사전 조건 / 정상 흐름 / 대안 흐름 / 사후 조건 / 외부 의존','“성공”과 “요청 수신”을 구별하고 중간 실패 때 남을 상태를 안다.','Use Case Modeling, BPMN; 유스케이스는 목표·상호작용, BPMN은 참여자 간 프로세스에 초점','s7'),
 ('A04','규칙·구체 예시·질문 목록','A03, 실제 거래/서식의 비식별 예','① 스토리를 작은 규칙으로 나눈다. ② 정상 값·경계 값·반례를 만든다. ③ 예상 결과를 적는다. ④ 답이 없는 질문에 담당자와 기한을 붙인다.','규칙 ID / 자연어 규칙 / Given–When–Then 예시 / 반례 / 미결 질문 / 결정자','핵심 규칙의 해석이 실제 값에 대해 일치한다.','Specification by Example, Example Mapping, BDD; 예시는 설명의 도구이고 자동화 테스트는 그다음','s4'),
 ('A05','개념 모델·사실 문장','A02–04, 업무 양식과 데이터 예시','① “주문 O의 주문자는 고객 C다”처럼 사실을 쓴다. ② 개체와 값, 관계를 분리한다. ③ 양방향 수량과 선택성을 묻는다. ④ 0개·1개·여러 개의 반례로 검증한다.','개념 / 정체성 / 사실 유형 / 관계 / 최소·최대 개수 / 예 / 규칙 근거','“상품을 두 번 주문”할 때 같은 상품과 다른 거래 사실이 구별된다.','ER modeling, Object-Role Modeling(CSDP), fact-based modeling; ORM의 verbalization·uniqueness·mandatory role을 후속 학습','s6'),
 ('A06','이벤트·상태 전이 모델','A03–05, 규칙 목록','① 명령과 이미 발생한 사건을 나눈다. ② 객체별 상태를 열거한다. ③ 현재 상태 × 명령 × 가드 → 다음 상태/효과를 쓴다. ④ 금지 전이·중복·순서 역전을 점검한다.','대상 / 상태 / 명령 / 가드 / 다음 상태 / 효과 / 사건 / 실패 처리','“취소됨 다음 승인됨”이 가능한지와 늦게 온 콜백 처리 방법이 정해진다.','EventStorming은 발견 워크숍, UML State Machine은 개체 생명주기, Event Modeling은 정보 흐름; 서로 대체재만은 아니다','s3','s8','s2'),
 ('A07','읽기·쓰기 계약과 정보 출처표','A03–06, 화면/리포트/API/배치 정의','① 모든 소비자를 목록화한다. ② 출력 필드의 의미·시점·권한을 적는다. ③ 각 값의 입력·계산식·외부 원천을 거슬러 찾는다. ④ 초기 적재·마이그레이션·시간 입력을 포함한다.','소비자 / 필드 / 의미 / 생성 명령·외부 원천 / 변환식 / 시점 / 최신성 / 권한','출처 없는 출력, 목적 없는 입력을 설명하거나 요구를 보완한다.','Event Modeling information completeness, data lineage, query/command contract; 화면 외 소비자를 놓치지 않는다','s2'),
 ('A08','품질·워크로드·데이터 생명주기 요구','A01, 운영/보안/데이터 담당자, 예상 사용량','① 정상·피크 부하를 수치화한다. ② 장애 때 허용 손실·복구 시간을 묻는다. ③ 데이터 분류와 보존 목적·파기 조건을 정한다. ④ 로그·백업·복제본·외부 전달까지 추적한다.','품질 시나리오 / 규모·증가량 / 지연 목표 / 보존 시작점·기간 / 파기 방식 / 책임자','“빠르게” 대신 측정 가능한 목표가 있고 파기·감사의 충돌을 누가 결정하는지 안다.','QAW, quality attribute scenarios, data lifecycle management, data classification, RPO/RTO; 기간은 관할·계약을 확인해 별도로 확정','s10','s9'),
 ('A09','영속화 결정표','A04–08','① 후보 사실을 의미 단위로 나눈다. ② 원천·재구성 조건·시점·이력 질문에 답한다. ③ 저장·참조·파생·임시 중 선택한다. ④ 선택 근거와 대안 비용을 남긴다.','아래 §05의 표 전체: 근거 ID / 원천 / 저장 전략 / 시간 / 보존 / 정합성 / 검증 예','모든 저장 필드에 목적이 있고, 저장하지 않는 값도 복원 가능 조건을 설명한다.','Temporal data modeling, provenance, derived data, ADR; 이 표 자체는 본 가이드의 실무 종합 양식','s12','s13'),
 ('A10','불변식·트랜잭션·동시성 명세','A04, A06, A09','① 항상 참이어야 하는 명제를 적는다. ② 범위와 관측 시점을 정한다. ③ DB 제약·트랜잭션·잠금·버전 검사·비동기로 배정한다. ④ 두 요청의 실행 순서를 그려 반례를 찾는다.','불변식 / 범위 / 강제 위치 / 경합 시나리오 / 재시도 / 실패 복구 / 검증','단일 요청뿐 아니라 동시에 실행해도 규칙을 지킨다.','DDD Aggregate, ACID·isolation, optimistic/pessimistic concurrency, idempotency, saga/outbox(분산 효과가 있을 때)','s5','s15','s20'),
 ('A11','CRUD·책임·추적성 매트릭스','A03, A05, A07, A09–10','① 행에 사용자·배치·수입·파기를 둔다. ② 열에 의미 있는 엔티티를 둔다. ③ C/R/U/D와 소유자를 표시한다. ④ 규칙→필드→강제 방법→테스트를 연결한다.','프로세스 × 데이터 / 작업 종류 / 권한 / 원천 소유자 / 규칙·테스트 ID','고아 데이터를 무조건 지우지 않고 초기 적재·감사·운영 목적까지 확인한다.','CRUD matrix, responsibility matrix, requirements traceability; 본 가이드에서는 R을 화면 조회에 한정하지 않는다','s9'),
 ('A12','논리 ERD·데이터 사전','A05, A09–11','① 후보 키와 사업상 유일성을 정한다. ② 관계·선택성·M:N 연결을 표현한다. ③ 함수 종속을 적고 정규화한다. ④ 예시를 분해/조인해 정보가 보존되는지 확인한다.','엔티티 / 속성 의미 / 키 / 관계 / NULL 의미 / 도메인 / 함수 종속 / 규칙 ID','관계도와 사전이 일치하고 중복이 같은 사실인지 다른 시점의 사실인지 설명한다.','Relational model, candidate key, functional dependency, 1NF·2NF·3NF·BCNF, lossless join·dependency preservation','s1','s11'),
 ('A13','물리 DDL·쿼리·운영 설계','A08, A10, A12','① DBMS의 타입/제약을 선택한다. ② 주요 SQL을 작성한다. ③ 대표 데이터로 인덱스 가설을 측정한다. ④ 변경·백필·배포·복구·파기 절차를 설계한다.','DDL / 인덱스 근거 / 쿼리 / 실행 계획 / 데이터 규모 / 마이그레이션 / 권한·보존 작업','DDL이 실행되고 중요한 쿼리·경합·운영 요구의 검증 증거가 있다.','DBMS manuals, query optimization, expand-contract migration, backup/restore; 파티셔닝·역정규화는 측정과 운영 요구로 결정','s14','s16','s17'),
 ('A14','검증 시나리오·결정 기록','A01–13','① 정상 재현과 실패 반례를 돌린다. ② 상태·이력·조회가 일치하는지 본다. ③ 경쟁 요청과 재시도를 검사한다. ④ 결정 이유·남은 위험·변경 트리거를 기록한다.','규칙 ID / 입력 / 기대 결과 / 실행 결과 / 미해결 / 결정 / 대안 / 변경 조건','모든 중요한 규칙이 통과하거나, 수용한 제한과 담당자가 명시된다.','Acceptance testing, state-machine/model-based testing, property-based testing, ADR; 테스트 생성은 규칙과 위험에서 출발','s4','s15'),
]

artifact_body='''<p>산출물 하나마다 <strong>입력 → 작성 순서 → 최소 필드 → 완료 기준 → 후속 이론</strong>을 읽는다. 업무 담당자와 개발자가 함께 의미를 검증하고, 운영·보안 담당자는 수명과 장애 요구를 보완한다.</p><div class="tools"><label for="artifact-search">산출물 찾기</label><input id="artifact-search" type="search" placeholder="예: 이력, 정규화, 동시성, A09"><button id="expand-all" type="button">모두 펼치기</button><button id="collapse-all" type="button">모두 접기</button><span id="filter-count" aria-live="polite">14개</span></div><div id="artifact-list">'''
for id,title,inputs,steps,fields,done,theory,*refs in ARTIFACTS:
    artifact_body+=f'<details class="artifact" id="{id}" open><summary><span>{id}</span> {title}</summary><dl><dt>읽을 입력</dt><dd>{inputs}</dd><dt>만드는 순서</dt><dd>{steps}</dd><dt>최소 필드</dt><dd>{fields}</dd><dt>완료 기준</dt><dd>{done}</dd><dt>후속 학습</dt><dd>{theory}</dd></dl>{cite(*refs)}</details>'
artifact_body+='</div><p class="small">학습 중에는 산출물을 분리해 보되, 실무에서는 중복 정보를 복사하지 않고 ID나 링크로 연결한다. 예: A04의 규칙 R-01을 A09, A12, A14가 참조한다.</p>'
section('artifacts','04. 선행 산출물 14종: 만드는 법까지 역으로 추적하기',artifact_body)

section('decisions','05. 핵심 연결 고리: 영속화 결정표', '''
<p>“이 사건 뒤에 무엇이 남아야 하지?”는 유용한 질문이다. 여기에 <strong>다시 얻을 수 있는가, 같은 의미로 얻을 수 있는가, 필요한 때와 비용 안에 얻을 수 있는가</strong>를 더해야 저장 전략이 나온다. 필드명이 같아도 의미가 다르면 별도 행으로 적는다.</p>
'''+table(['판단 축','질문','결정에 미치는 영향'],[
 ('출처와 소유권','누가 이 사실을 만들고 수정할 권한을 갖는가? 외부 원천이 사라져도 되는가?','로컬 정본, 외부 참조, 로컬 복제 구분. 외부 ID의 범위와 동기화 지연 정의.'),
 ('시점 의미','지금 값인가, 거래 당시 합의 값인가? 과거 정정을 과거 사실과 구분해야 하는가?','현재 참조, 불변 스냅샷, 버전 FK, 유효 기간, 이중 시간 모델.'),
 ('재구성','입력·공식·반올림·규칙 버전이 남아 있는가? 같은 결과를 다시 얻는가?','읽을 때 계산, 물질화/캐시, 확정 결과 보존. 단순히 계산 가능하다는 이유로 삭제하지 않음.'),
 ('이력과 설명','상태만 필요한가, 전이 원인·주체도 필요한가, 과거 임의 시점도 조회해야 하는가?','현재 행, 변경 이력, 유효 기간 이력, 이벤트 정본을 구분.'),
 ('정합성과 경쟁','어떤 조건이 언제까지 참이어야 하는가? 두 요청이 경쟁하면 누가 이기는가?','제약, 원자적 쓰기, 버전, 잠금, 비동기 보정과 허용 지연.'),
 ('수명과 접근','왜 보존하며 언제 끝나는가? 누가 읽나? 삭제 후 복제·백업에서 되살아나나?','접근 통제, 마스킹, 분리 보관, 삭제/익명화 작업, 복원 후 재파기 절차.'),
])+'''<div class="callout"><strong>정본 / 파생 / 캐시를 섞지 않는다</strong><p>정본은 분쟁 때 믿을 업무 사실이다. 파생 값은 정본과 규칙으로 계산한 결과다. 캐시는 성능을 위한 복제다. 거래 시점에 확정한 금액은 계산으로 나왔더라도 독립적인 업무 사실이 될 수 있다. 캐시를 저장한다면 재생성 원천과 무효화 정책을 반드시 적는다.</p></div>
<h3>바로 복사해 쓸 수 있는 결정 기록</h3>
<pre><code>결정 ID / 사실·필드의 정확한 뜻 / 요구·규칙 ID
생성·변경 주체 / 원천 시스템 / 식별자 범위
사용처(화면·API·감사·배치) / 조회 시점 / 허용 지연
원본 변경 시 기대 동작 / 재계산 입력·공식·버전
선택: 참조 | 스냅샷 | 버전 참조 | 현재 상태 | 이력 | 파생 | 임시
트랜잭션·불변식 / 재시도·경합 처리
보존 목적·기산점·기간 / 파기·익명화 / 접근 권한
검토한 대안 / 선택 이유 / 남은 질문 / 결정자 / 검증 예</code></pre>
<h3>저장 방식 선택 도우미</h3><p>아래는 학습용 질문 안내다. 선택 하나로 스키마를 자동 확정하지 않는다.</p>
<div class="decision-tool"><label>과거의 의미를 보존해야 하는가?<select id="past"><option value="yes">예 — 거래 당시 값을 재현해야 함</option><option value="no">아니오 — 현재 값만 필요</option></select></label><label>같은 의미로 원천에서 다시 얻거나 계산할 수 있는가?<select id="rebuild"><option value="no">아니오 / 원천 수명을 보장할 수 없음</option><option value="yes">예 — 입력·규칙·버전·원천이 보장됨</option></select></label><label>재구성이 응답·가용성 요구를 만족하는가?<select id="cost"><option value="yes">예</option><option value="no">아니오</option></select></label><output id="decision-result" aria-live="polite"></output></div>
'''+cite('s12','s13'))

section('methods','06. 방법론은 어떤 빈칸을 메우는가',table(['막힌 지점','우선 사용할 방법','직접 얻는 것','여전히 별도 판단할 것'],[
 ('참여자마다 업무 설명이 다르다','인터뷰 + EventStorming Big Picture','사건 흐름, 경계 후보, 충돌·미지점','저장 구조와 정규화'),
 ('조직 간 인계·대기·예외가 많다','BPMN / 유스케이스','담당 주체, 정상·대안 흐름, 메시지','관계의 키와 역사 의미'),
 ('요구가 추상적이다','Example Mapping / Specification by Example','규칙·실제 값·미결 질문','예시 바깥의 범위와 비기능 요구'),
 ('무엇이 하나의 사실인지 모호하다','ER / Object-Role Modeling','정체성, 사실 유형, 수량·필수성','시간에 따른 변경과 트랜잭션'),
 ('입력과 출력의 연결이 끊긴다','Event Modeling / 정보 출처 추적','명령·사건·조회 필드의 출처','물리적 저장 형태와 보존 기간'),
 ('언제 어떤 변경이 가능한지 모른다','상태 전이표 / UML State Machine','허용·금지 전이와 가드','경합을 막는 실제 DB 실행 방식'),
 ('함께 바뀌어야 할 범위를 모른다','불변식 분석 + DDD 전술 모델링','일관성 책임과 Aggregate 후보','DBMS의 격리·제약·분산 실패'),
 ('테이블 중복과 갱신 이상이 의심된다','관계 모델 + 함수 종속 + 정규화','키에 맞는 사실 분해','읽기 성능과 의도적 파생 데이터'),
 ('빠르다·안전하다만 쓰여 있다','QAW / 품질 속성 시나리오','측정 가능한 품질 요구','구현 후 실제 성능·복구 검증'),
])+'''<p><strong>최소 경로:</strong> 단순 CRUD 업무라면 유스케이스·용어 → 구체 예시·규칙 → 개념 모델·결정표 → 논리/물리 모델 → 재현으로 시작한다. 역할·예외·변경 정책이 복잡해질 때 이벤트 워크숍과 상태 모델을 확장한다. 기법의 이름보다 질문에 답했는지가 중요하다.</p>'''+cite('s3','s4','s6','s7','s8','s10'))

section('example','07. 한 사례를 끝까지: “상품을 주문하고 나중에 조회한다”', '''
<div class="callout"><strong>예제의 합의된 범위</strong><p>회원 고객, KRW 정수 금액, 하나 이상의 항목, 접수 이후 항목/배송지 불변. 할인·세금·배송비·결제·재고·실제 배송은 제외한다. 접수→확정→취소의 단순 업무 상태만 다룬다. 확정은 결제 완료를 뜻하지 않는다. 아래 주소·연락처는 가상 예시다.</p></div>
<h3>1. 시나리오를 예시와 규칙으로 바꾸기</h3>
<p><b>U-01:</b> 고객 7이 상품 10 ‘노트’를 2개 주문한다. 접수 시 서버가 인정한 단가는 12,000원이다. 주문 1001이 생성된다. 다음 날 상품 현재 가격이 15,000원으로 바뀌어도 주문 상세에는 12,000원 × 2 = 24,000원이 보인다.</p>
'''+table(['규칙 ID','업무 규칙','예·반례로 결정할 내용'],[
 ('R-01','접수한 주문은 당시 상품명·단가·수량을 유지한다.','다음 날 상품명/가격 변경 → 주문은 그대로. 접수 중 가격 변경 → 서버가 확인한 확정 시점 정의.'),
 ('R-02','수량은 양의 정수이고 주문 항목은 최소 1개다.','수량 0·-1 거절, 빈 주문 거절, 같은 상품의 다른 항목 허용.'),
 ('R-03','주문 배송지는 접수 당시 수령 정보를 유지한다.','주소록 편집 후 기존 주문은 그대로. 이 예제는 접수 후 배송지 수정 기능을 제공하지 않음.'),
 ('R-04','같은 고객의 같은 요청 키는 주문을 중복 생성하지 않는다.','같은 키/같은 요청은 기존 결과. 같은 키/다른 내용은 충돌 오류.'),
 ('R-05','허용 전이만 실행되고 주체·사유가 기록된다.','placed→confirmed 또는 cancelled, confirmed→cancelled. cancelled는 종료.'),
 ('R-06','화면의 주문 합계는 확정 항목 단가 × 수량의 합이다.','24,000원이 정답. 현재 상품 가격으로 30,000원을 계산하면 실패.'),
])+'''<h3>2. 사건과 상태를 분리하기</h3>
<p>‘주문접수’는 명령, ‘주문이접수됨’은 발생 사실, <code>placed</code>는 현재 상태다. 사건을 발견했다고 모두 이벤트 저장소에 기록하지 않는다. 이 예제는 현재 상태와 필요한 상태 변경 이력을 저장한다.</p>
'''+table(['현재 상태','명령 / 가드','다음 상태','원자적으로 남길 것'],[
 ('없음','PlaceOrder / 유효한 항목·수령 정보·요청 키','placed','주문 + 항목 + 최초 이력(seq=1)'),
 ('placed','Confirm / 권한과 예상 버전 일치','confirmed','상태·버전 변경 + 이력'),
 ('placed 또는 confirmed','Cancel / 권한과 예상 버전 일치','cancelled','상태·버전 변경 + 이력'),
 ('cancelled','Confirm','변경 없음','업무 오류 반환. 거절 시도의 감사가 필요하면 별도 요구로 추가.'),
])+diagram('timeline','상품 현재 가격은 15000원으로 변해도 주문 확정 단가는 12000원이며 두 개의 합계는 24000원이다.','도식 2. 현재 상품 가격과 주문 확정 단가는 서로 다른 시간 의미를 가진다.')+'''
<h3>3. 읽기 요구를 원천까지 추적하기</h3>
'''+table(['출력','원천','작성 시점','빠졌을 때 생기는 문제'],[
 ('상품 현재 가격','product.current_price_krw','상품 관리 변경','현재 카탈로그 표시 불가'),
 ('주문 상품명·단가','order_item의 *_at_order / unit_price_krw','주문 접수','과거 표시가 상품 변경에 따라 흔들림'),
 ('주문 합계','SUM(확정 단가 × 수량)','조회 시','입력이 불변이 아니면 같은 합계를 재현하지 못함'),
 ('주문 수령 정보','sales_order의 recipient/address 필드','주문 접수','회원 주소록만 참조하면 과거 배송지가 사라짐'),
 ('현재 상태','sales_order.status','상태 전이','조회는 가능하지만 전이 원인을 설명하지 못함'),
 ('언제·누가·왜 변경했는가','order_status_history','접수/전이 트랜잭션','현재 상태만으로 감사 질문에 답할 수 없음'),
])+'''<p>상품의 초기 등록은 주문 사건보다 앞선 원천이다. 배송지 입력과 시스템 시각도 원천이다. “앞선 주문 이벤트만으로 모든 필드가 나온다”고 가정하면 이 출처들이 사라진다.</p>
<h3>4. 실제로 채운 영속화 결정표</h3>
'''+table(['사실 / 근거','선택과 정본','시점·파생·이력','정합성·수명 결정'],[
 ('상품 현재 가격 / 카탈로그 요구','product에 현재 값 저장','과거 조회 요구 없음. 이 예제에서는 상품 가격 이력 생략.','상품 관리자가 변경. 과거 카탈로그 증명 요구가 생기면 재검토.'),
 ('주문 확정 단가 / R-01','order_item에 스냅샷','product_id는 정체성 참조, unit_price는 거래 사실.','서버가 검증한 값만 기록. 주문 보존 기간과 함께 유지.'),
 ('주문 합계 / R-06','저장하지 않고 계산','입력이 불변이고 공식이 단순하다는 전제.','할인·세금·정산 확정액이 추가되면 계산 규칙/확정액 저장을 재설계.'),
 ('수령 정보 / R-03','sales_order에 스냅샷','주소록과 별개 사실. 변경 이력은 현재 범위에 없음.','개인정보 목적·파기 조건은 운영 전 확정. 주문 전체 수명과 다를 수 있음.'),
 ('상태 / R-05','현재 값 + 전이 이력','조회용 현재 값과 감사용 이력을 같은 트랜잭션으로 관리.','단독 이력 삽입/상태 수정 금지. 기간 정책은 별도 확정.'),
 ('요청 키 / R-04','고객별 키 + 요청 fingerprint 저장','동일 요청을 구분하는 기술적 사실. 클라이언트 재시도 창과 연결.','유니크 제약 + 기존 요청 내용 비교. 삭제 뒤 재시도 정책도 정해야 함.'),
 ('화면 선택 탭','브라우저 임시 상태','업무 기억 요구가 없으므로 DB 미저장.','기기 간 복원 요구가 생기면 새 요구로 판단.'),
])+'''<p class="small">보존 기간은 예제에서 임의 숫자로 확정하지 않았다. 실제 설계의 완료 조건에는 담당자가 합의한 목적·기산점·기간·파기 방식이 필요하다. 위 표는 이 빈칸을 숨기지 않는 방법을 보여 준다.</p>''')

section('consistency','08. “데이터가 맞다”를 실제 강제 방식으로 번역하기',diagram('boundary','주문·항목·상태 이력을 하나의 DB 트랜잭션으로 기록하고 외부 알림은 별도 전달 요구로 다룬다.','도식 3. 업무 불변식의 범위와 외부 효과의 경계.')+table(['불변식','적절한 강제 위치','주의할 반례'],[
 ('수량 > 0, 단가 ≥ 0','NOT NULL + CHECK','CHECK만 쓰면 NULL이 통과할 수 있다.'),
 ('동일 고객·요청 키는 하나의 주문','UNIQUE(customer_id, request_key)','SELECT로 존재 확인한 뒤 INSERT만 하면 두 요청이 경쟁한다.'),
 ('존재하는 주문·상품만 참조','FK','FK는 부모 주문에 항목이 적어도 하나 존재하는지 보장하지 않는다.'),
 ('주문·항목·최초 이력은 함께 생긴다','한 트랜잭션 + 단일 쓰기 경로 + 빈 항목 검사','항목 저장 실패 후 주문만 COMMIT하면 업무상 불완전한 주문이 된다.'),
 ('전이 순서와 현재 상태가 일치한다','현재 상태/버전 조건부 UPDATE 또는 행 잠금, 동일 트랜잭션 내 이력 삽입','단순 status 열거형은 cancelled→confirmed 같은 금지 전이를 막지 못한다.'),
 ('접수 후 가격·항목·수령 정보 불변','쓰기 서비스·DB 권한 또는 검증 트리거','화면 편집을 막아도 배치/관리 SQL이 우회할 수 있다.'),
 ('외부 효과의 빠짐·중복을 처리한다','필요 시 outbox + 릴레이 + 소비자 중복 방어','DB COMMIT 직후 프로세스가 죽으면 직접 보내던 알림을 잃을 수 있다.'),
])+'''<h3>두 요청을 시간 순으로 그려 보기</h3>
<p>상태가 <code>placed, version=1</code>일 때 A는 확정, B는 취소를 요청한다. 둘 다 먼저 읽고 나중에 무조건 UPDATE하면 한쪽의 판단이 오래된 상태에 근거할 수 있다. 다음과 같이 <strong>판단에 사용한 버전까지 UPDATE 조건에 포함</strong>하고 영향받은 행 수를 확인한다.</p>
<pre><code>BEGIN;
UPDATE sales_order
SET status = 'confirmed', version = version + 1
WHERE order_id = 1001 AND status = 'placed' AND version = 1
RETURNING version;
-- 반드시 1행인지 확인. 0행이면 이력을 쓰지 않고 충돌 처리.
-- 반환된 version을 seq로 사용해 같은 트랜잭션에서 이력 삽입.
COMMIT;</code></pre>
<p>충돌 후 무조건 재실행하지 않는다. 새 상태를 읽어 여전히 요청 의미가 유효한지 판단한다. 격리 수준을 올리는 선택도 있지만 Serializable에서는 트랜잭션 재시도가 필요할 수 있다. 잠금 순서·데드락·전체 트랜잭션 재실행 가능성을 같이 설계한다.</p>
<p>상태 이력의 한 행이 허용 전이인 것과 전체 이력의 연속성이 맞는 것은 다른 조건이다. <code>from_status = 직전 to_status</code>, 연속 seq, 현재 상태=최신 이력은 이 예제의 CHECK만으로 보장되지 않는다. 하나의 쓰기 경로와 동시성 제어가 필요하다.</p>
'''+cite('s14','s15','s20'))

section('logical','09. 개념에서 논리 모델로: 키·수량·함수 종속', '''
<p>개념 모델은 ‘주문이 고객에 속하고 항목을 포함한다’를 설명한다. 논리 모델은 <strong>어떤 사실이 어떤 키에 종속되는지</strong>를 분명히 한다. 물리 모델은 그 다음에 DBMS의 타입·인덱스·제약 구문으로 옮긴다.</p>
'''+diagram('relations','고객 1 대 주문 0..N, 주문 1 대 항목 1..N, 주문 1 대 이력 1..N, 상품 1 대 항목 0..N의 관계.','도식 4. 교육용 논리 관계도. 표기된 수량은 업무 규칙이며 DDL 강제 범위와 구별한다.')+table(['대상','키와 수량','판단 이유'],[
 ('customer','customer_id','이름은 동명이인이 있고 변경 가능하므로 식별자로 부적합.'),
 ('product','product_id','상품명·가격은 식별자가 아니라 변경 가능한 속성.'),
 ('sales_order','order_id; 대체 유일 조건(customer_id, request_key)','대리키가 있어도 업무상 중복 방지 조건은 별도로 필요.'),
 ('order_item','(order_id, line_no)','한 주문 안에서 같은 상품이 여러 항목에 있어도 된다는 예제 규칙. 상품별 1줄 정책이면 다른 유니크 규칙 필요.'),
 ('order_status_history','(order_id, seq)','동시에 같은 시각이 기록될 수 있으므로 timestamp만으로 순서를 식별하지 않음.'),
])+'''<h3>정규화가 답하는 질문과 답하지 않는 질문</h3>
<p>함수 종속 <code>X → Y</code>는 허용되는 모든 데이터 상태에서 X가 같으면 Y도 같다는 뜻이다. 샘플 데이터가 우연히 같다고 종속이 생기는 것은 아니다. 업무 규칙으로 판단한다. <code>product_id → 현재 상품명·현재 가격</code>, <code>(order_id, line_no) → 상품 ID·확정 상품명·확정 단가·수량</code>을 구분한다.</p>
<p>1NF에서는 반복 그룹과 한 칸에 몰아넣은 항목 목록을 분리하고, 2NF에서는 후보 키의 일부에만 종속되는 비주요 속성을 분리한다. 3NF의 정확한 검토는 각 비자명 함수 종속 X→A에서 X가 슈퍼키이거나 A가 후보 키의 구성 속성인지 확인하는 것이다. BCNF는 결정자 X가 슈퍼키여야 한다. 분해 시 <strong>무손실 조인과 종속 보존</strong>도 확인한다. 정규형 이름을 통과하는 것만으로 업무 의미가 맞아지지는 않는다.</p>
<p>주문 단가와 상품 현재 가격은 다른 사실이므로 함께 저장한다고 곧바로 정규화 위반이 되는 것은 아니다. 반면 주문 항목마다 고객의 <em>현재</em> 이름을 복사하면 이름 변경 시 갱신 이상이 생긴다. 고객의 거래 당시 이름을 보존해야 한다면 별도 시간 의미로 다시 정의한다.</p>
<p>NULL도 의미를 정한다. <code>address_line2</code>는 ‘상세주소 없음’을 허용한다. ‘아직 모름’, ‘해당 없음’, ‘파기됨’을 같은 NULL에 섞으면 업무 해석이 어려워진다. 필요하다면 사유·상태를 분리한다. 문자열 빈칸과 NULL이 같은 뜻인지도 검증한다.</p>
'''+cite('s1','s11'))

sql=html.escape((ROOT/'example.sql').read_text())
section('physical','10. 물리 스키마와 조회·운영 요구 연결하기', '''
<p>아래 예제는 분석 결과가 DDL로 연결되는 모습을 보여 준다. <strong>DDL만으로 모든 업무 규칙을 강제하는 완성 애플리케이션은 아니다.</strong> 상태 전이·불변 필드·최소 자식 수·요청 본문 비교는 앞 절의 쓰기 계약과 함께 구현해야 한다.</p>
'''+table(['물리 결정','근거','검증할 것'],[
 ('KRW 금액 bigint, 합산 시 numeric','원 단위 정수만 쓰는 예제. 부동소수점 반올림 회피.','실제 통화·소수 단위·최대 금액과 곱셈 범위. 다른 통화가 생기면 단위 설계 변경.'),
 ('시각 timestamptz','절대 시점을 기록하고 표시 시간대는 분리.','업무 날짜·현지 시간대 규칙은 별도 속성이 필요할 수 있음.'),
 ('우편번호·연락처 text','산술 대상이 아니고 선행 0을 보존.','형식·국가별 규칙, 공백 문자열, 최소 수집 여부.'),
 ('고객별 최근 주문 복합 인덱스','customer_id 필터 + placed_at, order_id 정렬','실제 분포·페이지 크기·데이터량에서 실행 계획·지연 측정.'),
 ('order_item(product_id) 인덱스','상품 참조 조사/변경 점검의 접근 경로 후보','쓰기 비용과 실제 상품별 조회 빈도. FK 선언이 참조 열 인덱스를 자동 생성한다고 가정하지 않음.'),
 ('기본 삭제 제한','주문이 참조하는 고객·상품을 실수로 삭제하지 않음.','탈퇴·익명화·보존 종료에 맞는 별도 절차 필요. 삭제 제한이 영구 보존의 근거는 아님.'),
])+'''<h3>워크로드 명세를 먼저 작성한다</h3>
<p>예를 들어 “고객별 최근 주문 20건, 고객당 최대 10만 건, 전체 1천만 건, 피크 초당 200회 조회, p95 200ms 이하”라고 쓴다. <strong>이 숫자는 측정된 결과가 아니라 연습용 가정</strong>이다. 조회 조건·정렬·반환 열·호출 빈도·경합·증가량을 적고 대표 데이터를 만든다.</p>
<pre><code>SELECT order_id, placed_at, status
FROM sales_order
WHERE customer_id = 7
ORDER BY placed_at DESC, order_id DESC
LIMIT 20;

-- 다음 페이지는 마지막 행의 시각과 ID를 커서로 사용한다.
-- WHERE customer_id = :id
--   AND (placed_at, order_id) &lt; (:last_time, :last_id)</code></pre>
<p>선택한 인덱스는 후보일 뿐이다. 대표 부하에서 <code>EXPLAIN (ANALYZE, BUFFERS)</code>와 지연·쓰기 비용을 확인한다. ANALYZE는 쿼리를 실제 실행하므로 쓰기 쿼리는 테스트 환경에서 수행한다. 성능 때문에 파생 테이블을 추가한다면 정본·재생성·지연·불일치 복구를 다시 결정표에 기록한다.</p>
<details><summary>PostgreSQL 예제 DDL·샘플 데이터 펼치기</summary><p class="small">전체 파일은 함께 제공한 example.sql과 같다. 생성·가격 변경·합계 조회를 포함한다.</p><pre><code>'''+sql+'''</code></pre></details>
<h3>운영 설계도 스키마 설계의 일부다</h3>
<p>새 필수 열은 추가→호환 쓰기→기존 행 백필→검증→제약 강화→구 코드 제거처럼 단계적으로 바꾼다. 재실행 가능한 백필, 실패 재개 지점, 이전/새 버전 앱의 공존, 데이터 손실이 있는 변경의 복구 방식을 기록한다. 보존 종료 작업은 인덱스·잠금·배치 크기와 복구된 백업에 대한 재파기 정책까지 고려한다.</p>
'''+cite('s14','s16','s17'))

section('trace','11. CRUD와 추적성으로 누락 찾기', '''
<p>CRUD는 데이터를 누가 다루는지 확인하는 표다. C/R/U/D가 모두 있어야 정상이라는 뜻은 아니다. 불변 주문 항목에는 U가 없을 수 있고, 감사 이력에는 보존 종료 전까지 D가 없을 수 있다.</p>
'''+table(['프로세스','고객','상품','주문','항목','상태 이력'],[
 ('고객·상품 초기 등록/수입','C','C','—','—','—'),
 ('상품 관리','—','R/U','—','—','—'),
 ('주문 접수','R','R','C','C','C'),
 ('주문 상세/합계','—','—','R','R','—'),
 ('주문 확정/취소','—','—','R/U','—','C'),
 ('감사/상담 조회','R','—','R','R','R'),
 ('보존 종료·비식별 처리','정책에 따른 U/D','정책에 따른 U/D','정책에 따른 U/D','정책에 따른 D','정책에 따른 D/비식별'),
])+'''<p>마지막 행을 쓰는 것으로 파기 설계가 끝나지는 않는다. 대상·보존 예외·참조 무결성·접근권한·백업/외부 전달을 실제 절차로 확정해야 한다. 이 예제는 아직 업무별 기간 정책이 없으므로 운영 완료 상태가 아니다.</p>
'''+table(['근거','설계 결정','구현/강제','검증'],[
 ('U-01 / R-01','D-01: 확정 단가 스냅샷','order_item.unit_price_krw + 불변 쓰기 계약','T-01: 현재 가격 변경 후 24,000원'),
 ('R-02','D-02: 양수 수량 + 항목 최소 1개','CHECK + 빈 항목 거절 + 원자적 생성','T-02: 0·음수·빈 주문 거절'),
 ('R-04','D-03: 고객별 요청 키','UNIQUE + 요청 fingerprint 비교','T-03: 중복/상이한 본문/동시 요청'),
 ('R-05','D-04: 상태와 이력 동기 갱신','조건부 UPDATE + 이력 INSERT + 동일 트랜잭션','T-04: 경합·금지 전이·중간 장애'),
 ('R-03 / 보존 요구','D-05: 수령 정보 스냅샷','주문 필드 + 정책별 비식별/파기 절차','T-05: 주소록 변경·보존 만료·복구 후 처리'),
])+'''<p>요구가 바뀌면 근거 ID를 시작점으로 영향을 따라간다. “주문 후 배송지 수정 허용”은 열 하나의 추가 문제가 아니다. 수정 가능 상태·권한·이력·실제 배송 시스템 전달·동시성·파기·검증 예까지 영향을 받는다.</p>''')

section('verify','12. 설계 검증: 정상 흐름보다 반례가 더 많은 것을 알려 준다', '''
<p>이 문서에서 ‘재현’은 시나리오를 데이터 조작과 조회로 다시 실행한다는 뜻이다. 이벤트 로그를 재생하는 Event Sourcing 구현을 전제하지 않는다.</p>
'''+table(['시험','실행','통과 조건','실패 시 돌아갈 곳'],[
 ('T-01 · 시간','주문 생성 → 상품명/가격 변경 → 조회','확정 상품명·단가는 유지, 합계 24,000원','시점 의미 / A09'),
 ('T-02 · 경계','수량 0·음수·NULL·빈 항목으로 생성 시도','부분 주문 없이 거절','규칙 / 제약 / 쓰기 계약'),
 ('T-03 · 재시도','같은 키 같은 본문을 순차·동시에 요청; 다른 본문도 요청','주문 1개; 같은 요청은 같은 결과; 다른 내용은 충돌','식별 범위 / 멱등성'),
 ('T-04 · 상태 경합','동일 버전으로 확정·취소 경쟁','정한 충돌 정책 적용; 상태와 최신 이력 일치','동시성 / 트랜잭션'),
 ('T-05 · 수명','주소록 변경, 보존 만료, 백업 복원 시나리오','과거 거래 의미 보존과 파기 정책을 동시에 충족','데이터 분류 / 보존 정책'),
 ('T-06 · 부분 실패','항목 저장 후 이력 저장 전에 예외 발생','주문·항목·이력 전체 롤백','트랜잭션 범위'),
 ('T-07 · 무결성 우회','직접 SQL/배치로 항목 변경·고아 FK·독립 이력 삽입 시도','권한/제약/쓰기 경로가 계약을 보호','DB 권한 / 강제 범위'),
 ('T-08 · 읽기 성능','대표 규모와 분포로 고객별 목록·상세 동시 조회','합의한 지연·처리량, 허용 가능한 쓰기 비용','워크로드 / 인덱스'),
 ('T-09 · 진화','이전 앱과 새 앱 공존 중 열 추가·백필·재시작','호환 읽기·쓰기와 재개 가능 백필','마이그레이션 명세'),
])+'''<div class="callout"><strong>샘플 데이터 연습의 가치와 한계</strong><p>한 주문을 INSERT/JSON으로 채우는 것만으로도 필드·키·시점의 빈칸이 잘 드러난다. 하지만 실제 값 한 건은 유일성, 모든 상태 전이, 동시성, 대량 데이터 성능의 증명이 아니다. 여러 반례와 경합 시나리오로 확장한다.</p></div>
<h3>완료 체크리스트</h3><p class="small">체크는 이 페이지를 읽는 동안만 유지됩니다. 통과했다는 뜻으로 자동 체크하지 않습니다.</p><div class="checklist">
'''+''.join(f'<label><input type="checkbox"> {x}</label>' for x in [
 '범위·용어·핵심 질문이 합의되어 있고 미결정 사항에 담당자가 있다.',
 '핵심 규칙마다 실제 값의 정상 예와 위반 예가 있다.',
 '조회·보고·배치·외부 연동의 모든 값에 출처가 있다.',
 '필드별 정본·시점·파생·이력·수명 결정을 설명할 수 있다.',
 '키·관계·NULL·함수 종속을 예시와 반례로 검토했다.',
 '불변식마다 실제 강제 위치와 우회 방지 방식이 있다.',
 '중복 요청·동시 변경·부분 실패가 검증되었다.',
 '대표 규모의 읽기·쓰기 성능과 마이그레이션을 검증했다.',
 '보존·파기·접근·복구의 책임과 절차가 확정되었다.',
 '요구→결정→스키마→테스트의 연결이 유지된다.',
])+'''</div><output id="check-progress" aria-live="polite">0 / 10 확인</output>
<p>이 가이드의 예제는 학습용 기준선이다. 운영 보존 기간·권한 정책·부하 측정과 실제 쓰기 서비스는 각자의 도메인에서 완성해야 한다. 문서 렌더링 검증과 DB의 업무/성능 검증은 서로 다르다.</p>''')

section('learning','13. 산출물을 직접 완성하는 학습 순서', '''
<p>학습은 방법론 이름을 차례로 읽기보다 <strong>같은 작은 업무를 서로 다른 관점으로 다시 모델링</strong>하는 방식이 효과적이다. 각 과제는 이전 결과를 입력으로 쓴다. 소요 시간은 정하지 않고 산출물과 평가 질문으로 끝을 정한다.</p>
'''+table(['순서','학습할 이론·단서','직접 만들 과제','스스로 설명할 질문'],[
 ('1 · 요구의 품질','Requirements Engineering, Volere, 유스케이스의 사전/사후 조건 [9]','예약 또는 주문의 범위·용어집·유스케이스 A01–03','요구 사실과 구현 가정을 어떻게 구분했는가?'),
 ('2 · 예시로 규칙 발견','Example Mapping, Specification by Example, BDD [4]','규칙 5개, 각 정상·경계·위반 예 A04','같은 문장을 읽고 서로 다른 기대 결과가 나오는 부분은 어디인가?'),
 ('3 · 구조와 시간','ER, ORM/CSDP, UML State Machine [6][8]','개념 관계도·양방향 수량·전이표 A05–06','정체성과 값, 사건과 상태, 필수와 선택을 어떻게 나눴는가?'),
 ('4 · 정보의 유입과 소비','EventStorming, Event Modeling, BPMN [2][3][7]','한 흐름의 입력→변경→출력과 외부 출처 A07','현재 모델에 기록되지 않은 정보가 갑자기 등장하는가?'),
 ('5 · 기억의 의미','Temporal Patterns, bitemporal data, lineage [12][13]','필드 15개 이상의 영속화 결정표 A09','과거 재현과 소급 정정은 같은 문제인가?'),
 ('6 · 정합성','DDD Aggregate, ACID, isolation, idempotency [5][15]','불변식 5개와 경쟁 요청 3쌍 A10','테이블 제약으로 막는 것과 트랜잭션으로 막는 것은 무엇인가?'),
 ('7 · 관계 이론','후보 키, 함수 종속, 3NF/BCNF, 무손실 분해 [1][11]','논리 모델·데이터 사전·정규화 전후 예 A12','스냅샷 중복과 갱신 이상을 만드는 중복은 어떻게 다른가?'),
 ('8 · 물리화와 검증','QAW, PostgreSQL 제약/인덱스/EXPLAIN [10][14–17]','DDL·쿼리·대표 데이터·마이그레이션·검증 A08/A13–14','설계 가설 중 무엇을 실행 결과로 검증했고 무엇이 남았는가?'),
])+'''<h3>필요해질 때 갈라지는 심화 주제</h3>
<p><b>복잡한 가격·정산:</b> money value object, rounding policy, ledger, reconciliation. <b>소급 정정:</b> valid time / transaction time과 bitemporal history. <b>분산 업무:</b> saga, outbox, delivery semantics, idempotent consumer. <b>독립적인 조회 모델:</b> CQRS와 projection rebuild. <b>이벤트를 정본으로 사용:</b> Event Sourcing의 스키마 진화·재생·개인정보 삭제 문제. <b>분석계:</b> dimensional modeling, grain, fact/dimension, slowly changing dimensions를 별도로 학습한다.</p>
<p>심화 기법을 도입하는 기준은 해결할 요구가 있는지다. 감사 이력 하나가 필요하다고 전체 이벤트 소싱이 필수인 것은 아니며, 보고서 하나가 있다고 운영 테이블을 바로 스타 스키마로 만들 필요도 없다.</p>'''+cite('s18','s19','s20'))

section('templates','14. 빈 문서에서 시작할 때의 작업 양식', '''
<p>다음 양식을 복사해 작은 기능 하나를 끝까지 완성한다. 대괄호는 반드시 답하거나, 미결정으로 표시하고 담당자를 둔다.</p>
<pre id="worksheet"><code>설계 범위: [업무 / 포함 / 제외 / 이해관계자]
목표와 성공 기준: [관측 가능한 결과]
용어: [정의 / 문맥 / 식별 기준 / 예·반례]

U-01 유스케이스
행위자·트리거: [...]
사전 조건 / 정상 흐름 / 실패·재시도 / 사후 조건: [...]

R-01 규칙
업무 문장: [...]
정상 예 / 경계 예 / 위반 예 / 기대 결과: [...]
미결 질문 / 결정자 / 결정 기한: [...]

F-01 사실과 생명주기
사실 문장 / 주체의 정체성 / 관계 최소·최대: [...]
생성 / 변경 / 조회 / 보존 종료 / 외부 원천: [...]
상태 / 명령 / 가드 / 다음 상태 / 효과 / 금지 전이: [...]

D-01 영속화 결정
근거 R-ID / 사용처 / 원천 / 시점 / 파생 가능 조건: [...]
저장·참조·스냅샷·이력·임시의 선택 / 대안 / 이유: [...]
보존 목적·기산점·기간 / 파기 / 권한 / 담당자: [...]

I-01 불변식
항상 참인 명제 / 범위 / DB 제약 / 원자적 쓰기: [...]
동시 요청 / 버전·잠금 / 중복·재시도 / 실패 복구: [...]

L-01 논리 모델
엔티티 / 후보 키 / 속성 의미 / NULL / 함수 종속: [...]
관계 / 수량 / 정규화 / 무손실 확인: [...]

P-01 물리 모델
DDL / 주요 쿼리 / 예상 규모·분포 / 품질 목표: [...]
인덱스 근거 / 실행 계획 / 권한 / 변경·백필·복구: [...]

T-01 검증
근거 R-ID·I-ID / 입력 / 기대 결과 / 실행 결과: [...]
정상 / 경계 / 중복 / 경합 / 부분 실패 / 파기 / 진화: [...]

완료 판단: [통과 / 남은 가정 / 수용한 제한 / 변경 트리거]</code></pre>
<button type="button" id="download-worksheet">작업 양식 .txt 저장</button><span id="download-status" role="status"></span>
<p class="closing">좋은 스키마는 명세에 있던 명사를 빠짐없이 테이블로 옮긴 결과가 아니다. 업무가 기억해야 하는 사실, 그 사실의 시간과 책임, 함께 지켜야 할 규칙을 검증 가능한 구조로 만든 결과다.</p>''')

source_body='''<p>조사일: <time datetime="2026-09-22">2026-09-22</time>. 창안자·표준화 기관·제품 공식 문서를 우선했다. 아래 링크는 원문이며, 본문은 직접 인용 대신 핵심을 요약하고 교육용 사례로 연결했다. 방법론 자료의 권고와 이 가이드의 합성 절차를 구분해서 읽는다.</p><ol class="sources">'''
for id,title,url,note in SOURCES:
    source_body+=f'<li id="{id}"><a href="{url}" target="_blank" rel="noopener noreferrer">{title}</a><p>{note}</p></li>'
source_body+='</ol><div class="colophon"><b>제작·검증 범위</b><p>도식은 ~/resume의 bbangto-ui-visualization 0.3.0, resumeVizStyleGuide, 공용 프레임 및 render-viz.ts로 렌더했다. HTML에는 PNG를 내장해 외부 연결 없이 본문과 도식을 읽을 수 있다. 인터랙션은 산출물 검색·펼침, 질문 도우미, 체크리스트, 작업 양식 저장이다. 출처 방문에는 인터넷 연결이 필요하다.</p><p>HTML 표시·인터랙션 검증과 PostgreSQL 예제의 실행 여부는 동봉한 README.md에 구분해서 기록한다. 성능 목표와 보존 기간은 운영 환경에서 별도 검증·확정해야 한다.</p></div>'
section('sources','15. 근거 자료와 다음 읽을거리',source_body)

css='''
:root{--paper:#FAF2DD;--card:#FFFCF2;--ink:#1C1B17;--muted:#625e54;--line:#ded4b8;--sage:#C2D3B4;--blue:#BBCCE0;--pink:#ECC3C8;--gold:#E9C766}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:28px}body{margin:0;background:var(--paper);color:var(--ink);font-family:"IBM Plex Sans KR",system-ui,-apple-system,sans-serif;line-height:1.9;font-size:16px}a{color:#27465A;text-underline-offset:4px}a:hover{color:#5A3A40}button,input,select{font:inherit}button{background:var(--card);border:1px solid var(--ink);padding:8px 14px;cursor:pointer;box-shadow:2px 2px 0 var(--ink)}button:hover{background:var(--sage)}button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #27465A;outline-offset:4px}header{max-width:1440px;margin:auto;padding:68px 58px 48px;border-bottom:3px solid var(--ink)}.eyebrow{font-family:monospace;letter-spacing:2px;font-size:12px;font-weight:700}.hero-grid{display:grid;grid-template-columns:1fr 240px;gap:45px;align-items:end}h1{font-size:clamp(34px,5vw,64px);line-height:1.25;letter-spacing:-2px;margin:23px 0}header p{max-width:820px;font-size:19px}.hero-note{border:1px solid var(--ink);padding:20px;background:var(--sage);box-shadow:6px 6px 0 var(--ink);font-size:14px}.hero-note b{display:block;font-size:30px}.layout{max-width:1440px;margin:auto;display:grid;grid-template-columns:240px minmax(0,1fr);gap:48px;padding:38px 58px}aside{position:sticky;top:20px;align-self:start;max-height:94vh;overflow:auto}nav a{display:block;padding:7px 0;font-size:13px;text-decoration:none;border-bottom:1px solid var(--line)}nav a:hover{background:var(--sage)}aside .eyebrow{margin-bottom:14px}main{min-width:0}section{padding:18px 0 48px;margin-bottom:28px;border-bottom:1px solid var(--line)}h2{font-size:28px;letter-spacing:-.7px;line-height:1.5;margin:12px 0 24px}h3{font-size:20px;margin-top:34px;line-height:1.6}p{margin:16px 0}.lead{font-size:21px;line-height:1.85}.callout{padding:20px 24px;background:#eee7cd;border-left:5px solid #2C4A3A;margin:26px 0}.callout p{margin:8px 0}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:30px}.cards>div{border:1px solid var(--ink);padding:20px;background:var(--card)}.cards h3{font-size:17px;margin:12px 0}.cards b{font:12px monospace;letter-spacing:1px}.cards p{font-size:14px}.table-wrap{overflow:auto;margin:22px 0;border:1px solid var(--line)}table{border-collapse:collapse;width:100%;font-size:14px;min-width:640px}th{background:var(--ink);color:var(--paper);text-align:left;font-weight:600}th,td{padding:13px 15px;vertical-align:top;border-bottom:1px solid var(--line)}tr:nth-child(even) td{background:#f2ebd7}td:first-child{font-weight:600;min-width:125px}figure{margin:30px 0}figure img{display:block;width:100%;height:auto;border:1px solid var(--line)}figcaption{font-size:12px;color:var(--muted);margin-top:10px}.cite{font-size:12px;color:var(--muted);display:block;margin:14px 0}.small{font-size:13px;color:var(--muted)}.tools{display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:18px;background:var(--blue);margin:20px 0}.tools label{font-weight:600}.tools input{min-width:160px;width:240px;padding:8px;border:1px solid var(--ink);background:var(--card)}.tools button{font-size:13px}.artifact{margin:15px 0;border:1px solid var(--ink);background:var(--card);padding:0 22px}.artifact summary{padding:18px 0;font-size:18px}.artifact summary span{font:12px monospace;background:var(--sage);padding:5px 8px;margin-right:8px}summary{cursor:pointer;font-weight:600}dl{display:grid;grid-template-columns:104px 1fr;gap:12px 20px;font-size:14px;margin:6px 0 22px}dt{font-weight:700}dd{margin:0}pre{background:#24241f;color:#f5edd8;padding:23px;overflow:auto;line-height:1.75;font-size:13px;border-left:4px solid var(--sage)}code{font-family:"IBM Plex Mono",monospace;font-size:.9em;overflow-wrap:anywhere}pre code{font-size:inherit;overflow-wrap:normal}details:not(.artifact){margin:24px 0}details:not(.artifact) summary{padding:14px;background:var(--sage)}.decision-tool{display:grid;gap:18px;background:var(--card);border:1px solid var(--ink);padding:25px}.decision-tool label{display:grid;gap:7px;font-weight:600}.decision-tool select{width:100%;padding:10px;border:1px solid var(--ink);background:var(--paper);font-size:14px}output{display:block;padding:16px;background:var(--sage);font-weight:600}.checklist{display:grid;gap:12px}.checklist label{display:flex;gap:12px;padding:12px;background:var(--card);border:1px solid var(--line)}.checklist input{width:19px;height:19px;flex-shrink:0;margin-top:6px;accent-color:#2C4A3A}#check-progress{margin-top:18px}.closing{font-size:21px;border-top:2px solid var(--ink);margin-top:35px;padding-top:25px}.sources{padding-left:28px}.sources li{padding:12px 0;border-bottom:1px solid var(--line);font-size:14px}.sources p{font-size:13px;color:var(--muted);margin:5px 0}.colophon{margin-top:30px;font-size:13px;background:var(--blue);padding:24px}footer{text-align:center;font-size:12px;padding:30px}.skip{position:absolute;left:-9999px}.skip:focus{left:15px;top:15px;background:white;padding:10px;z-index:2}[hidden]{display:none!important}@media(max-width:1050px){header{padding:40px 28px}.layout{grid-template-columns:190px minmax(0,1fr);padding:30px 28px;gap:28px}.hero-grid{grid-template-columns:1fr}.hero-note{max-width:600px}.hero-note b{display:inline;font-size:20px;margin-right:15px}.cards{grid-template-columns:1fr}}@media(max-width:760px){body{font-size:15px}.layout{display:block;padding:24px 18px}header{padding:35px 20px}.hero-grid{gap:16px}aside{position:static;max-height:none;margin-bottom:30px}nav{display:grid;grid-template-columns:1fr 1fr;gap:0 15px}h2{font-size:24px}dl{grid-template-columns:1fr;gap:4px}dd{margin-bottom:13px}.artifact{padding:0 16px}.lead{font-size:18px}.tools input{width:100%}.tools button{flex:1}.decision-tool{padding:18px}pre{font-size:12px}.hero-note{box-shadow:4px 4px 0 var(--ink)}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{body{background:white;font-size:10pt}header{padding:0 0 20px}.hero-grid{display:block}h1{font-size:30pt}.hero-note,aside,.tools,.decision-tool,button,.checklist,output,.skip{display:none!important}.layout{display:block;padding:0}section{break-before:auto;margin:0;padding:15px 0}h2,h3{break-after:avoid}figure{break-inside:avoid}table{min-width:0;font-size:8pt}th{background:#eee;color:#111}.table-wrap{overflow:visible}pre{white-space:pre-wrap;color:black;background:#eee;font-size:8pt}a{color:black}details{break-inside:auto}header p{font-size:12pt}.cards{display:block}.cards>div{break-inside:avoid}footer{padding:10px}.artifact summary{font-size:12pt}.artifact dl{font-size:10pt}}
'''

js='''
const search=document.getElementById('artifact-search');
const arts=[...document.querySelectorAll('.artifact')];
search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase();let n=0;arts.forEach(a=>{a.hidden=!a.textContent.toLocaleLowerCase().includes(q);if(!a.hidden){n++;if(q)a.open=true;}});document.getElementById('filter-count').textContent=n+'개';});
document.getElementById('expand-all').onclick=()=>arts.forEach(a=>a.open=true);
document.getElementById('collapse-all').onclick=()=>arts.forEach(a=>a.open=false);
function decide(){const p=document.getElementById('past').value==='yes',r=document.getElementById('rebuild').value==='yes',c=document.getElementById('cost').value==='yes';let t;if(p&&!r)t='검토 후보: 불변 스냅샷 또는 이력 저장. 거래 당시 의미를 원천에서 복원할 수 없으므로 필요한 사실을 남긴다. 수정·정정과 보존/파기 정책을 추가로 결정한다.';else if(p&&r)t='검토 후보: 보존이 보장되는 불변 버전 참조 또는 재구성. 입력·규칙·버전을 묶어 기록하고, 원천 보존 책임을 확인한다. '+(c?'스냅샷과의 복잡성·의존성 차이를 비교한다.':'응답 요구 때문에 스냅샷·물질화를 추가할 수 있다.');else if(!p&&r)t=c?'검토 후보: 현재 원천 참조 또는 조회 시 계산. 원천 장애·지연 허용 범위와 정본 소유권을 명시한다.':'검토 후보: 캐시·물질화·로컬 복제. 정본, 갱신·무효화, 허용 지연, 재생성 방법을 명시한다.';else t='검토 후보: 필요한 현재 사실을 로컬에 저장. 현재 값만 필요해도 원천에서 다시 얻을 수 없다면 기억이 필요하다. 업무 목적이 없는 값이라면 임시 처리 후 폐기도 검토한다.';document.getElementById('decision-result').textContent=t;}
['past','rebuild','cost'].forEach(id=>document.getElementById(id).addEventListener('change',decide));decide();
const checks=[...document.querySelectorAll('.checklist input')];checks.forEach(c=>c.onchange=()=>document.getElementById('check-progress').textContent=checks.filter(c=>c.checked).length+' / '+checks.length+' 확인');
document.getElementById('download-worksheet').onclick=()=>{const u=URL.createObjectURL(new Blob([document.getElementById('worksheet').textContent],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='db-schema-design-worksheet.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);document.getElementById('download-status').textContent=' 양식 저장을 요청했습니다.';};
let printState=[];window.addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('details')].map(d=>[d,d.open,d.hidden]);printState.forEach(([d])=>{d.open=true;d.hidden=false;});});window.addEventListener('afterprint',()=>printState.forEach(([d,o,h])=>{d.open=o;d.hidden=h;}));
'''

fonts=Path('/Users/centurio/resume/assets/fonts/fonts.css').read_text()
import re
for name in set(re.findall(r"url\('\./([^']+)'\)", fonts)):
    data=base64.b64encode((Path('/Users/centurio/resume/assets/fonts')/name).read_bytes()).decode()
    fonts=fonts.replace(f"url('./{name}')", f"url('data:font/woff2;base64,{data}')")

nav=''.join(f'<a href="#{id}">{title}</a>' for id,title,_ in sections)
body=''.join(f'<section id="{id}"><h2>{title}</h2>{body}</section>' for id,title,body in sections)
page=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="요구사항 산출물에서 영속화 결정, 논리·물리 스키마, 동시성 검증까지 이어지는 한국어 DB 설계 학습 가이드"><title>DB 스키마 설계 — 산출물에서 검증까지</title><style>{fonts}\n{css}</style></head><body><a class="skip" href="#start">본문 바로가기</a><header><div class="eyebrow">DATABASE DESIGN / FIELD GUIDE / 2026.09</div><div class="hero-grid"><div><h1>무엇을 기억할 것인가<br>DB 스키마 설계 가이드</h1><p>시나리오와 컨셉에서 출발해, 저장할 사실을 결정하고<br>검증 가능한 스키마로 완성하는 학습 경로.</p></div><div class="hero-note"><b>14 artifacts</b>각 산출물의 작성법과 이론<br><b>1 worked example</b>주문 사례를 끝까지 연결<br><b>20 sources</b>원전·표준·공식 문서</div></div></header><div class="layout"><aside><div class="eyebrow">READING MAP</div><nav aria-label="목차">{nav}</nav><p class="small">첫 독서: 01 → 03 → 05 → 07<br>직접 실습: 04 → 08–12 → 14</p><button onclick="window.print()" type="button">인쇄 / PDF 저장</button></aside><main>{body}</main></div><footer>DB Schema Design · 조사 및 작성 2026-09-22 · 도식: resume viz</footer><script>{js}</script></body></html>'''
(ROOT/'index.html').write_text(page)
print(f'Created {ROOT / "index.html"}: {len(page.encode()):,} bytes; {len(sections)} sections; {len(ARTIFACTS)} artifacts; {len(SOURCES)} sources')

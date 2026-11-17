## 6. 설계의 씨앗이 되는 입력 형식

표시: [요약]은 검색 결과 요약만 보고 본문을 열지 못한 출처입니다. 한 단계 약한 근거로 다룹니다.

### 6.1 유스케이스(Cockburn)

- Alistair Cockburn, *Writing Effective Use Cases*, Addison-Wesley, ISBN 978-0-201-70225-5. 2000년 10월 출간, 저작권 표기 2001 (D-S1, D-S3).
- 작성 12단계(책 샘플 "The Writing Process"): 범위와 경계 이름 붙이기 → 주 행위자 → 사용자 목표 목록 → 최외곽 요약 유스케이스 → 수정 → 하나를 골라 확장 → 이해관계자와 관심사·사전조건·보장 적기 → 주 성공 시나리오(3~9단계) → 확장 조건(시스템이 감지하고 처리해야 하는 것 전부) → 확장 처리 → 하위 유스케이스로 빼거나 합치기 → 전체 재조정 (D-S1, D-S2).
- fully dressed 템플릿 항목(책 p.120 근거, 2차): Title, Primary Actor, Goal in Context, Scope, Level, Stakeholders and Interests, Precondition, Minimal Guarantees, Success Guarantees, Trigger, Main Success Scenario, Extensions, Technology & Data Variations List (D-S4).
- 해설(저신뢰 3자 요약): 사전조건은 시스템이 참으로 보고 다시 검사하지 않는 것, 최소 보장은 실패를 포함한 모든 결과에서 성립하는 것(예: 시도가 기록된다), 성공 보장은 목표 달성 시 세계의 상태 (D-S5).
- 목표 수준: summary(+), user-goal(!), subfunction(-)이 기본. 기본 권장은 user-goal (D-S2, D-S4). 기호는 소스마다 다름.
- 데이터 정밀도 규칙(초안): 유스케이스 본문에는 정밀도 1단계(데이터 별칭)만 쓰고, 필드(2단계)와 타입·길이·검증(3단계)은 따로 둔다 (D-S2).

### 6.2 사용자 스토리

- Connextra 형식: Rachel Davies가 2000년대 초 Connextra에서 시작 (Cohn, D-S7). "so that" 절은 필수는 아니지만 거의 늘 쓴다고 Cohn이 밝힘 (D-S7). Mountain Goat 틀은 "생각 도구이지 의례가 아니다" (D-S8).
- Dan North, "Introducing BDD"(2006-09-20, Better Software 2006-03 선행 게재): As a [X] / I want [Y] / so that [Z] (D-S9).
- INVEST(Bill Wake, 2003-08-17): Independent, Negotiable("captures the essence, not the details"), Valuable, Estimable, Small, Testable(테스트를 쓸 수 있을 만큼 이해) (D-S10).
- 3C(Ron Jeffries, 2001-08-30): Card(요구를 나타내는 표), Conversation(대화, 가장 유용한 보조는 예시), Confirmation(인수 테스트) (D-S11).

### 6.3 Gherkin과 예시 명세

- Cucumber Gherkin 참조: Feature, Rule(하나의 업무 규칙을 보이는 시나리오 묶음), Example/Scenario, Given("describe the initial context of the system"), When("describe an event, or an action"), Then("describe an expected outcome, or result"), And/But, Background, Scenario Outline과 Examples(표의 각 행이 한 번의 실행) (D-S12).
- Given/When/Then의 기원은 Dan North 2006 (D-S9).
- Gojko Adzic, *Specification by Example*, Manning, 2011-06 (D-S13). 일곱 핵심 패턴 이름은 [요약].

### 6.4 이벤트 스토밍

- Alberto Brandolini, "Introducing Event Storming", 2013-11-18 블로그: 복잡한 업무 도메인을 빠르게 탐색하는 워크숍 형식. 2013년 원문의 색: 주황 도메인 이벤트(시간순), 파랑 명령, 보라 외부 시스템·시간 경과 트리거, 연노랑 페르소나(선택). 진행: 사람 초대 → 넓은 모델링 공간 → 이벤트 탐색 → 이벤트의 기원(명령·외부 트리거) → 집합체 찾기. 선택 목표로 하위 도메인, bounded context, 핵심 인수 테스트, 핵심 읽기 모델 스케치 (D-S14).
- 세 층위: Big Picture, Process Modelling, Software Design (D-S17, D-S18).
- 현재 흔한 범례(2차): 이벤트 주황, 명령 파랑, 행위자 작은 노랑, 정책 보라("When X, then Y"), 집합체 노란 직사각형, 읽기 모델 초록, 외부 시스템 분홍, 핫스팟 빨강 또는 진보라 (D-S19).
- 충돌: 보라색이 2013 원문에서는 외부·시간 트리거, 현재 범례에서는 정책 (D-S14 대 D-S19). 색은 워크숍마다 다르고 범례를 붙여 두는 관행이 중요.

### 6.5 도메인 스토리텔링

- Stefan Hofer, Henning Schwentner, *Domain Storytelling*, Addison-Wesley, 2021년 9월경 [출간일 요약 충돌].
- 그림 언어: 행위자(사람·역할, 막대 인물), 작업 객체(활동이 다루는 것), 활동(화살표와 동사), 순번, 주석. 문장 구조 예 "Cashier suggests available seats to moviegoer." 한 스토리에는 if·or가 없고 중요한 대안은 별도 스토리로 만든다 (D-S20).

### 6.6 요구사항 문장

- ISO/IEC/IEEE 29148:2018 개별 요구의 특성 아홉(2차): Appropriate, Complete, Conforming, Correct, Feasible, Necessary, Singular, Unambiguous, Verifiable (D-S22). 표준 원문은 유료라 미열람.
- 구문 지침 요약(2차): shall은 구속 요구, will은 사실·목적, should는 바람, may는 허용. 템플릿 [Condition] [Subject] [Action] [Object] [Constraint] (D-S23).
- EARS(Easy Approach to Requirements Syntax): Alistair Mavin 등, Rolls-Royce, IEEE RE'09(2009) 첫 발표 (D-S24, D-S25). 일반 구조 "While <precondition>, when <trigger>, the <system> shall <response>", 절 순서 고정. 기본 패턴 다섯과 조합형:
  - Ubiquitous: The <system> shall <response>.
  - Event-driven: When <trigger>, the <system> shall <response>.
  - State-driven: While <precondition>, the <system> shall <response>.
  - Unwanted behaviour: If <trigger>, then the <system> shall <response>.
  - Optional feature: Where <feature is included>, the <system> shall <response>.
  - Complex: 키워드 조합 (D-S24).

### 6.7 양식에서 스키마 뽑기

- Choobineh, Mannino, Nunamaker, Konsynski, "An Expert Database Design System Based on Analysis of Forms", *IEEE TSE* 14(2), 1988-02, pp.242–253: 폼 필드의 origin·hierarchy·cardinality를 잡고 관련 폼을 점진 병합해 개념 스키마를 만든다. 규칙 단계는 폼 선택 → 엔터티 식별 → 속성 부착 → 관계 식별 → 카디널리티 식별 → 무결성 제약 (D-S26).
- Choobineh, Venkatraman 1992, *Information Systems* 17(3): 업무 양식에서 함수 종속을 유도하는 방법 [요약].
- Batini·Ceri·Navathe의 양식 분석 장은 확인 못 함 (open question).

## 7. 자연어 문장에서 모델 뽑기

- Peter P. Chen, "English sentence structure and entity-relationship diagrams", *Information Sciences* 29(2–3), 1983, pp.127–149: 영어 구성 요소(명사·동사·형용사·부사·동명사·절)와 ER 도식의 대응, 번역 규칙 11개 [초록 요약, 본문 미열람] (D-S27).
- 문법–ER 대응표(Wikipedia, Chen 1997 출처로 표기): 보통 명사→개체 유형, 고유 명사→개체, 타동사→관계 유형, 자동사→속성 유형, 형용사→개체 속성, 부사→관계 속성 (D-S28). 1983 규칙 그대로인지 미확인.
- 규칙 일부(2차 발표 자료): 동명사는 관계를 개체 유형으로 바꾼 것, 절은 상위 개체 유형. 규칙들이 "hints and guidelines"에 가깝다는 평 [요약].
- 한계(Omar·Alsheky·Faiz 2021, JOPAS 20(2)): 규칙이 겹쳐 함께 쓰기 어렵고, 보통 명사가 모두 개체가 되지는 않는다. "a student has date of birth"의 date of birth는 개체가 아니다. 자기 데이터셋에서 잰 정확도라 일반화는 금물 (D-S29).
- Russell J. Abbott, "Program design by informal English descriptions", *CACM* 26(11), 1983-11, pp.882–894: 보통 명사→데이터 타입, 직접 참조→변수, 동사·속성→연산자 [초록 요약] (D-S27 서지 묶음). 동의어·암묵 정보를 Abbott의 한계로 직접 쓴 소스는 못 찾음 (open question).

## 8. 거친 자료에서 설계하기

### 8.1 데이터 프로파일링 [1차, 저자 원고]

- Abedjan, Golab, Naumann, "Profiling relational data: a survey", *The VLDB Journal* 24(4), 2015, pp.557–581 (D-S30).
- 정의(Johnson 인용): "Data profiling refers to the activity of creating small but informative summaries of a database."
- 분류: 단일 열(카디널리티, 값 분포, 패턴·자료형·도메인), 다중 열(상관·연관 규칙, 군집·이상치, 요약), 종속(유일성: 키 발견, 포함 종속: 외래 키 발견, 함수 종속; 각각 조건부·근사 변형).
- 유일 열 조합(UCC)은 "sets of columns whose values uniquely identify rows". 포함 종속은 한 열 집합의 값이 모두 다른 열 집합에 나타나는 것으로 외래 키의 전제. 함수 종속은 정규화에, 포함 종속은 조인 경로 제안에 쓰인다.
- 결정적 문장: 발견된 메타데이터는 주어진 인스턴스에 관한 것이라 값 도메인·기본 키·외래 키 같은 스키마 성질을 "with certainty" 도출할 수 없고 전문가 해석이 필요하다. "the chance existence of a dependency in the data at hand does not imply that this dependency is meaningful."
- 세 도전: 입력 관리, 계산, 출력 관리(결과 해석이 가장 어렵다).
- 실제 자료에는 규칙의 예외가 있으므로 조건부·부분·근사 변형을 둔다. 발견 결과를 제약으로 번역해 정제·통합 단계에서 강제할 수 있다.
- TANE(Huhtala, Kärkkäinen, Porkka, Toivonen, *The Computer Journal* 42(2), 1999): 속성 값으로 행을 분할해 함수 종속과 근사 종속을 찾고, 같은 분할로 오류·예외 행을 찾기 쉽다 (D-S31). Papenbrock 외 2015(PVLDB 8(10))가 일곱 알고리즘을 비교 (D-S32, 알고리즘 이름 목록 미확인).

### 8.2 데이터베이스 역공학

- Hainaut, Tonneau, Joris, Chandelon 1993, "Schema Transformation Techniques for Database Reverse Engineering"(ER'93, pp.353–372): 두 단계 — 특정 DBMS에 묶인 데이터 구조를 추출한 뒤 스키마 변환으로 의미를 복원(개념화). 최적화 구조 제거, 개념 정규화 등 (D-S33).
- Hainaut, Henrard, Roland, Englebert, Hick 1996, "Structure Elicitation in Database Reverse Engineering"(WCRE'96, pp.131–140): 구조와 제약은 흔히 선언되지 않고 절차 코드나 화면 동작으로 구현된다. 가장 흔한 암묵 구조인 외래 키를 이끌어 내는 기법 (D-S34).
- Chiang, Barron, Storey 1994, "Reverse engineering of relational databases: Extraction of an EER model from a relational database", *Data & Knowledge Engineering* 12(2), pp.107–142: 스키마 분석과 데이터 인스턴스 분석을 함께 써서 EER 모델을 뽑고 사람 입력이 필요한 곳을 표시 [요약].

### 8.3 JSON 스키마 추론

- Baazizi, Ben Lahmar, Colazzo, Ghelli, Sartiani, "Schema Inference for Massive JSON Datasets", EDBT 2017; 확장판 VLDB Journal 28(4), 2019: 항목마다 스키마를 뽑고 동치 관계로 합친다. 종류 동치(K)와 레이블 동치(L)가 간결함과 정밀함을 조절 [요약] (D-S35).
- quicktype: 샘플에서 JSON Schema를 추론하고, 검토·편집한 스키마를 커밋한 뒤 그 스키마로 코드를 만드는 흐름을 권함 (D-S36).
- GenSON: 같은 종류 객체는 속성을 합치고, 같은 키의 타입이 다르면 타입 목록으로 합친다. `required`는 모든 객체에 있었던 키만. 모든 입력이 출력 스키마에 맞아야 한다 (D-S37).

### 8.4 스프레드시트, 인터뷰·업무 기록

- Cunha, Saraiva, Visser, "From spreadsheets to relational databases and back", PEPM 2009: 데이터에서 함수 종속을 뽑아 관계 스키마를 만들고 되돌린다 [요약] (D-S38).
- Hermans, Pinzger, van Deursen, "Automatically Extracting Class Diagrams from Spreadsheets", ECOOP 2010: 시트의 반복 패턴으로 클래스 도식을 뽑는 도구 Gyro [요약] (D-S39).
- Wagner, Méndez Fernández, "Analysing Text in Software Projects", arXiv 1612.00164(2016): 소프트웨어 프로젝트의 텍스트를 수동 코딩·자동 방법·자연어 처리로 분석 (D-S40). 개방·축·선택 코딩과 포화 기준은 강의 자료 수준 [요약] (D-S41). 요구공학에서 정성 코딩으로 개념 스키마를 뽑은 1차 문헌은 못 찾음 (open question).

### 8.5 반례와 데이터 품질

- Rahm, Do, "Data Cleaning: Problems and Current Approaches", IEEE Data Engineering Bulletin, 2000-12: 품질 문제를 단일/다중 소스, 스키마/인스턴스 수준의 두 축으로 나눈다 [초록 + 요약] (D-S42).
- 거친 자료를 설계 결정으로 바꾸는 순서(조사자 종합, 단일 소스의 절차 아님): 프로파일링으로 후보 → 예외 행을 사람이 보고 오류인지 업무 예외인지 판단 → 제약으로 올림 / 정제 규칙 / 모델에서 허용 중 하나로 기록 → 올린 제약을 계약과 시나리오 표로 되돌려 적음.

### 6.x 이 절의 open questions

- Chen 1983 규칙 11개 원문, Batini·Ceri·Navathe 양식 분석 장, Hainaut 단계 세부, Chiang 1994 절차, 29148 원문, JSON 추론 논문 본문, Rahm·Do 본문은 미열람.
- 이벤트 스토밍 색 범례는 정본이 없음(원문과 관행 충돌).
- Cockburn 목표 수준 기호, Connextra 연도, Domain Storytelling 출간일은 소스마다 다름.

### 6.y 소스

- D-S1. Writing Effective Use Cases 샘플 장(Pearson) — https://ptgmedia.pearsoncmg.com/images/9780201702255/samplepages/0201702258.pdf (게시일: 미상, 조회일: 2026-11-17)
- D-S2. Writing Effective Use Cases 사전 출판 초안 발췌 — https://courses.cs.duke.edu/compsci308/spring23/readings/cockburn_use_cases.pdf (게시일: 2000-02-21, 조회일: 2026-11-17)
- D-S3. Writing Effective Use Cases(InformIT) — https://www.informit.com/store/writing-effective-use-cases-9780201702255 (게시일: 2000-10-05, 조회일: 2026-11-17)
- D-S4. Wikipedia, Use case — https://en.wikipedia.org/wiki/Use_case (게시일: 미상, 조회일: 2026-11-17)
- D-S5. Cockburn use case writing guide(3자 요약, 저신뢰) — https://cdn.jsdelivr.net/npm/usecases-skill@0.1.0/skills/usecases/use-case-guide.md (게시일: 미상, 조회일: 2026-11-17)
- D-S7. Mike Cohn, Why the Three-Part User Story Template Works So Well — https://www.mountaingoatsoftware.com/blog/why-the-three-part-user-story-template-works-so-well (게시일: 미상, 조회일: 2026-11-17)
- D-S8. Mountain Goat Software, User Stories — https://www.mountaingoatsoftware.com/agile/user-stories (게시일: 미상, 조회일: 2026-11-17)
- D-S9. Dan North, Introducing BDD — https://dannorth.net/blog/introducing-bdd/ (게시일: 2006-09-20, 조회일: 2026-11-17)
- D-S10. Bill Wake, INVEST in Good Stories, and SMART Tasks — https://xp123.com/invest-in-good-stories-and-smart-tasks/ (게시일: 2003-08-17, 조회일: 2026-11-17)
- D-S11. Ron Jeffries, Essential XP: Card, Conversation, Confirmation — https://ronjeffries.com/xprog/articles/expcardconversationconfirmation (게시일: 2001-08-30, 조회일: 2026-11-17)
- D-S12. Cucumber, Gherkin Reference — https://cucumber.io/docs/gherkin/reference/ (게시일: 미상, 조회일: 2026-11-17)
- D-S13. Gojko Adzic, Specification by Example(Manning) — https://manning.com/adzic (게시일: 2011-06, 조회일: 2026-11-17)
- D-S14. Alberto Brandolini, Introducing Event Storming — https://ziobrando.blogspot.com/2013/11/introducing-event-storming.html (게시일: 2013-11-18, 조회일: 2026-11-17)
- D-S16. Wikipedia, Event storming — https://en.wikipedia.org/wiki/Event_storming (게시일: 미상(최종 편집 2026-02-18), 조회일: 2026-11-17)
- D-S17. EventStorming Resources — https://www.eventstorming.com/resources/ (게시일: 미상, 조회일: 2026-11-17)
- D-S18. EventStorming 홈페이지 — https://www.eventstorming.com/ (게시일: 미상, 조회일: 2026-11-17)
- D-S19. SAP curated resources for DDD, EventStorming(2차) — https://github.com/SAP/curated-resources-for-domain-driven-design/blob/main/knowledgebase/tools/eventstorming.md (게시일: 미상, 조회일: 2026-11-17)
- D-S20. Domain Storytelling 발췌(InformIT) — https://www.informit.com/articles/article.aspx?p=3129449&seqNum=2 (게시일: 미상, 조회일: 2026-11-17)
- D-S22. Leveraging LLMs for the Quality Assurance of Software Requirements(29148 특성 2차) — https://arxiv.org/html/2408.10886 (게시일: 2024-08, 조회일: 2026-11-17)
- D-S23. Requirements fundamentals(SWEBOK 기반 교수 사이트, 2차) — https://sites.google.com/site/profvanselow/swebok/software-requirements-ch-1/1-2-requirements-fundamentals (게시일: 미상, 조회일: 2026-11-17)
- D-S24. Alistair Mavin, EARS — https://alistairmavin.com/ears/ (게시일: 미상, 조회일: 2026-11-17)
- D-S25. Wikipedia, Easy Approach to Requirements Syntax — https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax (게시일: 미상, 조회일: 2026-11-17)
- D-S26. Choobineh 외, An Expert Database Design System Based on Analysis of Forms — https://experts.arizona.edu/en/publications/an-expert-database-design-system-based-on-analysis-of-forms/ (게시일: 1988-02, 조회일: 2026-11-17)
- D-S27. Chen 1983 서지(Information Sciences 29) — https://www.sciencedirect.com/science/article/abs/pii/0020025583900142 (게시일: 1983, 조회일: 2026-11-17)
- D-S28. Wikipedia, Entity–relationship model — https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model (게시일: 미상, 조회일: 2026-11-17)
- D-S29. Omar 외, Novel rules for extracting the entities of entity relationship models, JOPAS 20(2) — https://sebhau.edu.ly/journal/jopas/article/download/1329/659/1710 (게시일: 2021, 조회일: 2026-11-17)
- D-S30. Abedjan·Golab·Naumann, Profiling Relational Data: A Survey(저자 원고) — https://hpi.de/oldsite/fileadmin/user_upload/fachgebiete/naumann/publications/2015/dataprofiling_main.pdf (게시일: 2015, 조회일: 2026-11-17)
- D-S31. TANE(Helsinki 대학) — https://www.cs.helsinki.fi/research/fdk/datamining/tane/ (게시일: 1999, 조회일: 2026-11-17)
- D-S32. Papenbrock 외, Functional Dependency Discovery: An Experimental Evaluation of Seven Algorithms — https://hpi.de/oldsite/fileadmin/user_upload/fachgebiete/naumann/publications/PDFs/2015_papenbrock_functional.pdf (게시일: 2015, 조회일: 2026-11-17)
- D-S33. Hainaut 외, Schema Transformation Techniques for Database Reverse Engineering — https://researchportal.unamur.be/en/publications/schema-transformation-techniques-for-database-reverse-engineering (게시일: 1993, 조회일: 2026-11-17)
- D-S34. Hainaut 외, Structure Elicitation in Database Reverse Engineering — https://researchportal.unamur.be/en/publications/structure-elicitation-in-database-reverse-engineering (게시일: 1996, 조회일: 2026-11-17)
- D-S35. Baazizi 외, Parametric schema inference for massive JSON datasets — https://researchportal.ip-paris.fr/en/publications/parametric-schema-inference-for-massive-json-datasets/ (게시일: 2019-08, 조회일: 2026-11-17)
- D-S36. quicktype — https://github.com/glideapps/quicktype (게시일: 미상, 조회일: 2026-11-17)
- D-S37. GenSON — https://github.com/wolverdude/GenSON (게시일: 미상, 조회일: 2026-11-17)
- D-S38. Cunha 외, From spreadsheets to relational databases and back — https://docentes.fct.unl.pt/jmc-cunha/publications/spreadsheets-relational-databases-and-back (게시일: 2009, 조회일: 2026-11-17)
- D-S39. Hermans 외, Automatically Extracting Class Diagrams from Spreadsheets — https://research.vu.nl/en/publications/automatically-extracting-class-diagrams-from-spreadsheets/ (게시일: 2010, 조회일: 2026-11-17)
- D-S40. Wagner·Méndez Fernández, Analysing Text in Software Projects — https://arxiv.org/abs/1612.00164 (게시일: 2016-12-01, 조회일: 2026-11-17)
- D-S41. 정성 코딩 강의 자료(2차) — https://third-bit.com/ds4se/grounded/ (게시일: 미상, 조회일: 2026-11-17)
- D-S42. Rahm·Do, Data Cleaning: Problems and Current Approaches — https://dbs.uni-leipzig.de/en/publication/title/data_cleaning_problems_and_current_approaches (게시일: 2000-12, 조회일: 2026-11-17)

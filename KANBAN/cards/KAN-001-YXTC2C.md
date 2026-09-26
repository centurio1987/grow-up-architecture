---
card: KAN-001-YXTC2C
title: 전체 가이드 재집필
created: 2026-09-17
scope: pattern-guide/**, .claude/**, .agents/**, scripts/**, KANBAN/batches/**, PATTERNS.md, README.md, Makefile, python/**, java/**, typescript/**, rust/**, analysis/**, 디자인 패턴 가이드 템플릿 작성을 위한 참조 문서.md
request_fp: 30fa12f6cd2e0b6602ce471d169d312ddf274b64
---

# KAN-001-YXTC2C — 전체 가이드 재집필

## 전략
<!-- 왜 이 접근인가 · 제약 · 버린 대안. 사람이 자유롭게 편집한다. -->
<!-- doc-init --from-request KANBAN/requests/backlog/KAN-001-YXTC2C.request.md — 헤딩 2단계 하향, 본문 무손실 -->
### KAN-001-YXTC2C 요청서 — 전체 가이드 재집필

#### 요청
<!-- 자유 형식입니다. `##` 절을 원하는 만큼 만들어 쓰세요 — 이름도 개수도 정해진 것이 없습니다. -->

- 현재 가이드의 구성이 충분한지 조사해 봐라. 추가할 패턴이 더 있다면 찾고 내용을 조사해라
- 항목에 대해 조사를 진행해라
- authoring-kit를 적용하고, "~/code_test"의 집필 가이드를 계승해라.
- 가이드 구성은 아래와 같다.
  - 패턴의 핵심을 직관적으로 이해할 수 있는 개요
  - 패턴의 상세 설명.
    - 등장하는 개념들을 빠짐없이 소개하고 정의한다.
    - 설명에 절차가 포함 된다면, 각 절차를 빠짐없이 설명한다. 필요하다면 왜 그렇게 하는지 이유를 포함한다.
  - 패턴은 여러 방식을 통해 구현될 수 있다. 따라서, 패턴의 경계, 불변식이 있다면, 설명하고, 비슷한 패턴이나 오해할 수 있는 안티패턴과 비교하여 차이점 위주로 설명
  - 실제 구현 예시를 통한 설명
    - 분석 패턴의 경우, 반드시 DDD 원칙을 준수해야 한다. 또한, 오해가 없도록, 구체적인 배경을 전제해야 한다. 예를 들어, transaction과 account 패턴을 설명할 때 entry는 transaction이 가지고 있을 수도 있고, account가 가질 수도 있으며 홀로 존재할 수도 있고, 혹은 별도 entity로 존재하나 account entity에 그에 대한 VO를 가지고 있을 수도 있다. 그래서 정확한 상황 설정이 중요하다.

### 왜 이 접근인가

33편은 같은 9섹션 템플릿으로 균질하지만 요청서 4요소 중 셋(개념 전수 정의 · 절차 전수 · 경계/불변식/차이 비교)을 담을 절이 없고, 분석 패턴 10편은 aggregate 경계를 정의하지 않은 채 경계를 암시하는 코드를 싣는다(`account-pattern.md`의 `Account { List<Entry> }`, `transaction-pattern.md`의 `e.account.post()`, `posting-rule-pattern.md`의 Account 객체 인자). 그래서 보강이 아니라 **골격 교체**이고, 규칙 정본을 SKILL.md 산문에서 authoring-kit spec으로 옮겨 33편이 같은 게이트를 지나게 한다. 순서는 code_test ORD-006 선례대로 **규약 → 파일럿 3편 → 회고 → 확장 30편**이다. 명세는 산출물로 검증되기 전엔 추정이라, 30편을 틀린 명세로 쓰는 것이 가장 큰 낭비다.

계승 대상(`~/code_test`)의 규율: "집필 규칙의 정본은 플러그인이다. 규칙을 스킬 문서에 다시 쓰지 않는다. 플러그인 없으면 명확히 실패한다." 글 종류마다 spec을 분리하고, 진입 스킬은 사전 확인 → 리서치 → `authoring-write` 위임 → 품질 게이트 → 발행만 한다(이해 게이트는 2026-09-20 유저 결정으로 빠졌다 — 판정이 실행마다 흔들려 통과를 막던 자리였고, 그 자리는 기계 검사와 품질 루브릭이 대신한다).

### 결정 11건

- **1. spec 2개 — `gof-guide` + `analysis-guide`** — 근거 · 버린 대안: 분석 패턴 전용 MUST(DDD 준수 + 배경 전제)를 한 spec에 넣으면 GoF 쪽에서 IF-APPLICABLE로 약화되고 워커가 "정당한 생략"을 스스로 판단한다. 최소 조건의 판정 기준도 다르다(코드 구조 vs 개념적 책임 분리). 공통 절 산문은 두 `spec.md`에 `shared:pattern-guide-common` 여는 주석과 `/shared` 닫는 주석으로 두 벌 두고 `check-guides --spec-shared`가 마커 존재·파일당 1쌍·내용 동일을 검사한다. 버림: spec 1개+조건부 절, spec 3개
- **2. 새 골격 — 아래 「새 골격」 목록** — 근거 · 버린 대안: 요청서 4요소를 `##`로, 세부를 `###`로. 절 제목은 제목만 읽고 내용을 알 수 있게
- **3. analyzer 계약 유지 — `디자인 패턴을 충족하는 최소 조건` 헤딩 문자열 유지, 레벨만 `###`** — 근거 · 버린 대안: analyzer SKILL.md의 경로("프로젝트 루트")·헤딩 레벨·"첫 3개 필수" 규칙을 `[필수]/[선택]` 표기로 교체하고 회귀 4건으로 검증
- **4. 같은 경로에 덮어쓴다, 기존 문서는 리서치 입력** — 근거 · 버린 대안: 파일명이 analyzer·인덱스의 키. 루트 워크트리에 격리돼 main에 혼재 노출 없음. 문장 복사는 안 함(voice가 바뀌므로 재작성)
- **5. consideration 2편은 심화 트랙 유지 + 회계 배경 확정안의 출처** — 근거 · 버린 대안: 두 문서는 서로 모순(문서1: Account가 `List<AccountLedger>` 소유 / 문서2: Entry 별도 aggregate + id 참조). .1 S4에서 배경 확정안 1건 — bounded context · aggregate 경계와 일관성 요구(균형 · 중복 전기 방지 · 취소/정정 · 동시 처리 · 파생 balance 지연 허용) · root/entity/VO 배정 · 참조 방식 — 을 만들어 회계 3편이 인용. 권고 초안: 복식부기, Transaction = root, Entry = 그 안의 불변 child, Account = id 참조 + 파생 balance. 유저가 .1 보고에서 확정
- **6. voice `ppangtolab-teacher` 그대로** — 근거 · 버린 대안: 요청이 code_test 계승. 단정체 → 존댓말 전환은 33편 톤 변경이므로 파일럿 .3 S2(Account) 완료 시 유저 승인 게이트
- **7. stale 정리 포함** — 근거 · 버린 대안: SKILL.md 2종·`.agents` → .2, PATTERNS.md(GoF 링크 23/23 깨짐)·README·DDD README·루트 참조 문서·4언어 하니스 처분 → .6
- **8. 추가 패턴 후보는 .1이 보고, 유저가 고르면 .7 신설** — 근거 · 버린 대안: GoF 계열(Null Object·Specification 등)과 분석 계열(Fowler 나머지 장·PoEAA Money 등) 둘 다 후보. DDD 전술 용어 기준선 1편 신설 여부도 같은 보고에
- **9. 집필 work = 가이드 1편, 착수마다 `resolve --frozen` 통과 전제** — 근거 · 버린 대안: code_test 실측(1세션 1가이드). 게이트 결과는 `pattern-guide/gate-results.jsonl`에 work마다 1줄(file · spec · 버전 · resolve 해시 · 라운드 · 외부 검토 · 날짜). `check-guides --gates`가 33건 존재 · verdict PASS · resolve 해시 = 현재 lock을 검사(낡은 PASS 검출)
- **10. 예시 코드: Java · TypeScript · Rust 세 언어, 블록마다 컴파일 검사(유저 결정). md는 나열, HTML 버전은 탭으로 묶는다** — 근거 · 버린 대안: 컴파일은 하한이지 정확성 검증이 아니다 — 옳음은 예시 코드 실행 대조와 품질 게이트 채점이 진다(실행 검증은 유저 결정으로 범위 밖). HTML은 md의 파생물이고 .3(파일럿 3편)·.6(33편)에서만 그린다
- **11. 기존 절 넷의 처분(유저 결정) — 「어떨 때 사용하나」→ 새 `## 사용 목적` 절, 「장점과 단점, 한계점」→ 비교 절로 흡수, 「정보 표」→ 삭제(활용성 별점은 근거 없는 수치), 「Class Diagram」→ 개념 정의 직후로 이동** — 근거 · 버린 대안: 「사용 목적」은 ds-guide의 `when.clue`("언제 이걸 꺼내야 하는가")를 계승

### 새 골격 (`gof-guide`)

- **title** — heading: `# {패턴} — {직관을 담은 부제}` / 필수: ✓
- **overview** — heading: `## 한눈에 보는 개요` / 필수: ✓ / 요청서 대응: 요소1. 문제→해결의 직관 + 그림 1. 분류·함께 쓰는 패턴 한 줄
- **detail.terms** — heading: `### 등장하는 개념과 정의` / 필수: ✓ / 요청서 대응: 요소2. participants 전부 정의, 직후 mermaid classDiagram
- **detail.procedure** — heading: `### 동작 절차` / 필수: ✓ / 요청서 대응: 요소2. collaborations를 단계별로, 각 단계에 "왜"
- **purpose** — heading: `## 사용 목적` / 필수: ✓ / 요청서 대응: 어떤 문제·단서가 보일 때 꺼내는가, 쓰지 말아야 할 경우
- **boundary.minimum** — heading: `### 디자인 패턴을 충족하는 최소 조건` / 필수: ✓ / 요청서 대응: 요소3. analyzer 계약 헤딩. 불변식은 여기 조건으로. 각 조건 `[필수]`/`[선택]`
- **boundary.compare** — heading: `### 비슷한 패턴·안티패턴과의 차이` / 필수: ✓ / 요청서 대응: 요소3. 대상 2개 이상, 차이점 위주, 오인 코드(`no-compile` 표식), 무엇을 얻고 무엇을 포기하는가
- **example.context** — heading: `### 상황 설정` / 필수: ✓ / 요청서 대응: 요소4. 도메인·요구 전제
- **example.impl** — heading: `### 구현` / 필수: ✓ / 요청서 대응: 요소4. 코드 블록 3개 고정 순서 `java` → `typescript` → `rust`, 각각 자기완결
- **example.realworld** — heading: `### 실제 라이브러리에서` / 필수: 조건부 / 요청서 대응: 출처 확인된 사용처가 있을 때만
- **selfcheck** — heading: `## 스스로 점검하기` / 필수: ✓ / 요청서 대응: voice 계승
- **refs** — heading: `## 참고 자료` / 필수: ✓ / 요청서 대응: L0 evidence

컨테이너 `##`: `## 패턴 자세히 들여다보기`(detail) · `## 패턴의 경계`(boundary) · `## 구현 예시`(example). `##` 순서: 개요 → 자세히 → 사용 목적 → 경계 → 구현 예시 → 스스로 점검하기 → 참고 자료.

**`analysis-guide` 차이**: `detail.terms`는 분석 층위 개념만 · `boundary.minimum` 판정 기준 = 개념적 책임 분리 + 모델 불변식 · `example.context`는 MUST 표(bounded context / 불변식의 위치 / root·entity·VO 배정 / 타 aggregate 참조 방식) — 값 객체 계열에서 공회전하는지 파일럿 Quantity로 실측 · `example.impl`은 표와 1:1, aggregate 간 객체 참조 0 · `### 상황이 달라지면`(조건부) — 요청서가 든 Entry 4가지 소속이 이 표의 행이 된다.

**코드 검사 계약(`check-guides --compile`)**: 대상은 `### 구현` 아래 펜스 세 개뿐. 다른 절의 펜스는 검사하지 않고 오인 코드는 펜스 첫 줄에 `java no-compile` 정보 문자열을 단다. 도구·버전 고정 — `javac`(JDK 21), `typescript/node_modules/.bin/tsc --noEmit -p typescript/tsconfig.json`(`npx` 안 씀), `rustc --edition <rust/Cargo.toml의 edition>`(임시 `main.rs` 래핑, 외부 crate 금지). 검사기가 세 도구 버전을 확인해 출력에 적고 하나라도 없으면 비영 종료(`make doctor`는 무엇이 없어도 0이라 게이트가 못 된다).

**HTML 버전**: `scripts/render-guides.py`가 md 하나를 **같은 폴더의 `<slug>-guide_v<semver>.html`** 로 낸다(2026-09-20 유저 결정 — 가이드 한 편이 폴더 하나이고 md·html·코드·도식이 함께 산다). `### 구현`의 세 언어 펜스를 탭 위젯 하나로(`role="tablist"/"tab"/"tabpanel"`, 키보드 좌우 — 2026-09-27 유저 승인), 상대 링크는 같은 트리의 `.md` → `.html`. **도식은 mermaid 가 아니라 `viz/` 체계다**(2026-09-20 유저 결정 — `diagrams/*.tsx` 를 Playwright 실제 마운트로 굽고 PNG 를 data URI 로 박는다. `mmdc`·로컬 Chrome 경로는 걷어냈다). 외부 요청 0건. 소스 지문 입력 = md + 렌더러 + CSS + 탭 JS 전부, `check-guides --derived`가 낡음 판정.

### 하위 카드 7장과 순서

.1 리서치와 후보 조사 → .2 authoring-kit 정착 → .3 파일럿 3편과 회고 → .4 GoF 22편 → .5 분석 패턴 8편 → .6 인덱스·stale 정리·최종 검증 → **.7 추가 패턴 4편**. 엄격 순차. 루트 배치 3건(batch1 = .1~.3, batch2 = .4~.6, batch3 = .7). `.7` 은 `.1` 검토 1번 항목이 승인한 자리(인덱스 정리 뒤)에 2026-09-27 신설했다 — 채택된 추가 패턴 넷이고, 넣으면 가이드가 33편에서 37편이 된다. 하위 .4·.5·.6의 배치 문서는 .3 S4 회고가 `batch_size_works`를 2로 확정한 뒤(2026-09-17) 만들었다.

### 수행안 두 가지의 규모

하위 카드별 work 수와 배치 수다. 원천은 각 하위 카드 실행 문서의 「실행 계획」·「전략」 절이고, 여기 합계를 둔다 — 계획 리포트는 루트 카드 문서만 읽기 때문이다. 배치 크기는 .3 S4 회고가 실측으로 확정한 work 2개 기준이다(.1~.3은 확정 전 크기로 이미 수행했다). 근거는 파일럿 세 편이 모두 3라운드를 소진한 것이다. 당시 함께 든 codex 한도 근거는 2026-09-20 외부 검토 제거로 사라졌고, 남은 제약은 세션 토큰 예산이다.

- **.1 리서치와 후보 조사** — work: 4 / 단일 에이전트(순차) 배치: 1 / 오케스트레이션(병렬) 배치 · 폭: 1 · 폭 4
- **.2 authoring-kit 정착** — work: 6 / 단일 에이전트(순차) 배치: 2 / 오케스트레이션(병렬) 배치 · 폭: 2 · 배치1 순차, 배치2 폭 3
- **.3 파일럿 3편과 회고** — work: 4 / 단일 에이전트(순차) 배치: 2 / 오케스트레이션(병렬) 배치 · 폭: 2 · 순차(실측이 목적)
- **.4 GoF 22편 재집필** — work: 22 / 단일 에이전트(순차) 배치: 11 / 오케스트레이션(병렬) 배치 · 폭: 11 · 폭 2
- **.5 분석 패턴 8편 재집필** — work: 9 / 단일 에이전트(순차) 배치: 5 / 오케스트레이션(병렬) 배치 · 폭: 5 · 폭 2
- **.6 인덱스·stale 정리·최종 검증** — work: 3 / 단일 에이전트(순차) 배치: 2 / 오케스트레이션(병렬) 배치 · 폭: 2 · 순차
- **합계** — work: **48** / 단일 에이전트(순차) 배치: **23** / 오케스트레이션(병렬) 배치 · 폭: **23**

- 병렬 폭은 하위 카드 **안**에서만 쓴다. 하위 카드 사이는 .1 → .6 엄격 순차다(.2의 분석 spec에 .1의 회계 확정안이 들어가고, .3은 .2의 파이프라인 위에서만, .4·.5는 .3이 고친 spec 1.1로 쓴다).
- 가이드 1편은 외부 모델 CLI 를 부르지 않는다(2026-09-20 정성 게이트·외부 검토 제거). 비용은 집필·채점 워커의 토큰과 컴파일·실행 시간뿐이다.
- 가이드 1편의 예시 코드는 Java · TypeScript · Rust 세 블록이라 옛 가이드(Java 1블록)보다 코드가 3배다. 크기 3이 무거우면 회고가 2로 내린다.
- 오케스트레이션에서 워커는 커밋하지 않는다. 메인이 work 순서대로 `doc-step done` → 커밋 → 태그를 남기고, 같은 파일을 두 워커가 만지지 않으며, 비교 쌍은 배치 끝에 메인이 교차 확인한다.

### 선행 조건 (착수 전)

1. 플러그인 프로젝트 스코프 설치(`claude plugin install authoring-kit@centurio87-plugins --scope project`) — 계획 리포트 집필에도 필요.
2. orca 브랜치 접두사 none — `orca worktree create` 반환의 `branch == refs/heads/KAN-001-YXTC2C` 확인.
3. 외부 CLI(codex · agy) 의존 없음 — 파이프라인이 부르지 않는다. 필요한 것은 세 언어 툴체인(JDK 21 · 로컬 tsc · rustc)과 도식 렌더용 Playwright 다.
4. 전역 principles 레포(my-claude-env)의 미커밋 변경 확인 — `lock` revision 안정성.
5. voice `used_by.projects`에 이 프로젝트 추가 — 전역 파일이라 카드 밖, 유저가 한다.

### 리스크

- **정성 게이트는 통과 조건이 아니다**(2026-09-20 유저 결정) — code_test 의 이해 게이트는 판정 문구가 수치 대조·실행값에 걸려 있는데, 패턴 가이드용으로 옮기며 그 자리를 "설명이 얇은가" 같은 정성 판단으로 바꿨다. 같은 파일·같은 모델에서도 판정이 흔들려(회고 3.1) 게이트 구실을 못 했다. 대응: 파이프라인에서 제거하고 통과는 기계 검사로만 가른다. 외부 검토는 "실행됐는가"만 게이트가 보고, 응답 내용은 집필 라운드의 입력이다.
- **외부 모델 비평은 쓰지 않는다**(2026-09-20 유저 결정) — 계승 원본도 경로 바인딩과 축 파일이 없어 실행하지 않는다. 사실 주장 검증은 품질 게이트 채점이 실행·원문 대조로 진다.
- **voice `max_prose_run=2`가 GoF 설명에 도식 강제** — 대응: mermaid·코드·표가 끊는 것으로 세어지는지 파일럿에서 확인
- **33편 × 3라운드 = 세션 다수** — 대응: `resume` 규율 + 배치 종료 3종(doc-step done·태그·커밋) 강제
- **파일럿 회고가 spec을 크게 바꿈** — 대응: .3 S4 완료 기준에 파일럿 3편 `--frozen` 재통과 + 재검사
- **세 언어 툴체인이 워크트리 환경에 없음** — 대응: `check-guides --compile`이 버전을 직접 확인하고 없으면 비영 종료
- **Rust 스니펫이 단독 컴파일 안 됨** — 대응: spec 원칙: 세 블록 전부 자기완결. 검사기가 임시 crate에 래핑. 외부 crate 금지
- **편당 코드 3배로 work 무게 증가 → 배치 크기 2** — 대응: 파일럿 .3 S4에서 `batch_size_works` 실측 확정

## 실행 계획
<!-- `S<n>`은 고정 id — 이름을 바꾸지 않는다. 체크 상태는 doc-step 이 갱신한다. -->
루트 work 하나 = 하위 카드 하나. 완료 기준은 그 하위 카드가 `완료`로 이동한 것이다. 순서는 엄격 순차.

- [x] `S1` KAN-001.1-P5N9NF 리서치와 후보 조사 — 노트 4건 + 후보 보고서 + 회계 배경 확정안, 유저 결정 접수
- [x] `S2` KAN-001.2-4NWK0T authoring-kit 정착 — spec 2종·lock·게이트·검사기·렌더러·진입 스킬, `validate --all` 통과
- [x] `S3` KAN-001.3-Q6FYKP 파일럿 3편과 회고 — Strategy·Account·Quantity PASS, spec 1.1, `batch_size_works` 확정, .4·.5·.6 배치 생성
- [ ] `S4` KAN-001.4-BJT8JD GoF 22편 재집필 — 22편 PASS + 검사 0
- [ ] `S5` KAN-001.5-6HF35H 분석 패턴 8편 재집필 — 8편 PASS + consideration 정합
- [ ] `S6` KAN-001.6-HB5NH9 인덱스·stale 정리·최종 검증 — 링크 0·HTML 33편 fresh·검토서
- [ ] `S7` KAN-001.7-4MRJ1B 추가 패턴 4편 집필 — Dependency Injection · Temporal Property · Null Object · Specification 이 게이트 PASS 로 발행되고 인덱스·검증 숫자가 37편(GoF 26 · 분석 11) 기준으로 갱신됨. KAN-001.1 검토 1번 항목이 승인한 순서대로 `S6` 뒤에 온다

## 검증
<!-- 무엇을 실행해 무엇이 나오면 이 카드가 끝난 것인가. -->
`PLUGIN=~/.claude/plugins/cache/centurio87-plugins/authoring-kit/0.3.0`, 루트 워크트리에서 실행.

**결정론적 — 전부 종료코드 0**

```
python3 $PLUGIN/scripts/authoring.py status
python3 $PLUGIN/scripts/authoring.py lock            # 검사만 — 드리프트 시 exit 1. --update는 .3 S4에서만
python3 $PLUGIN/scripts/authoring.py validate --all
python3 $PLUGIN/scripts/authoring.py resolve --voice ppangtolab-teacher --spec gof-guide --profile main --frozen
python3 $PLUGIN/scripts/authoring.py resolve --voice ppangtolab-teacher --spec analysis-guide --profile main --frozen
python3 scripts/check-guides.py --spec-shared  # 두 spec.md 공유 블록: 마커 존재·파일당 1쌍·내용 동일
python3 scripts/check-guides.py --all          # 33편: 헤딩 순서·placeholder(final 0)·scan_ai_style B+·mermaid·상대 링크·[필수]/[선택]
python3 scripts/check-guides.py --compile      # 구현 절 33×3 블록: javac(21) / 로컬 tsc --noEmit / rustc(edition 고정) 전부 0, 도구 버전 출력
python3 scripts/check-guides.py --gates        # gate-results.jsonl: 33건 존재 · verdict PASS · resolve 해시 = 현재 lock
python3 scripts/render-guides.py --all && python3 scripts/check-guides.py --derived   # html 33편 fresh
grep -l '^### 디자인 패턴을 충족하는 최소 조건' pattern-guide/design-pattern-guide/*.md | wc -l   # 23
python3 scripts/check-guides.py --links PATTERNS.md README.md pattern-guide/ddd-analysis-pattern-guide/README.md
diff -rq .claude/skills .agents/skills ; git status --porcelain ; git tag --list 'kan/KAN-001-YXTC2C/*' | wc -l
python3 ~/.claude/skills/manage-kanban/scripts/kanban.py validate .            # errors 0
python3 ~/.claude/skills/manage-kanban/scripts/kanban.py batch-status . --card <각 하위>
```

**work 단위로만 실행**(외부 모델 호출): `bash $PLUGIN/scripts/review-external.sh --axes scripts/review-axes-pattern.md <f>`. 결과는 `pattern-guide/gate-results.jsonl`에 남고 발행 카드는 `--gates`로 센다.

**사람만 판정할 것(검토서 판단 항목)**: ① 분석 10편의 상황 설정 표가 배경 확정안·DDD 원칙과 일치하는가 ② 비교 절의 대상 선정(PATTERNS.md "빠른 비교 페어" 전부 포함?) ③ 개요가 직관적인가(파일럿으로) ④ 존댓말 voice 승인 ⑤ 기존 절 넷 처분 ⑥ 추가 패턴 채택·문서1 처분·`.agents` 처분·4언어 하니스와 `analysis/` 처분(기본 유지) ⑦ analyzer 실행 시 기준 출처가 가이드 경로인가.

**완료 조건**: 하위 6장 전부 완료 + 위 결정론적 검증 전부 0 + 검토서 승인 → main 병합 → 워크트리·브랜치 정리.

## 수행 내역
<!-- KANBAN:LOG append-only — 아래로만 덧붙인다. 위를 고치지 않는다. -->
- 2026-09-17T09:18 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-17T09:18 · s:548f6b02 — `검증` 섹션 교체
- 2026-09-17T09:19 · s:548f6b02 — `실행 계획` 섹션 교체
- 2026-09-17T13:53 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-17T13:56 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-17T13:56 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-17T14:37 · s:548f6b02 — 결정: .2의 work를 .1과 병렬로 착수한다. .2(도구·spec)는 .1 산출물 내용에 기대지 않고 파일도 겹치지 않는다(.1=pattern-guide/research, .2=.claude·scripts). analysis-guide spec은 회계 배경 확정안을 경로(research/accounting-context.md)로만 참조한다. .3은 .1·.2가 모두 선 뒤에만 착수한다.
- 2026-09-17T17:04 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-20T17:16 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-20T17:16 · s:548f6b02 — `검증` 섹션 교체
- 2026-09-20T17:17 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-20T17:17 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-20T18:43 · s:548f6b02 — `전략` 섹션 교체
- 2026-09-27T02:09 · s:00758e49 · S1 done — KAN-001.1-P5N9NF 리서치와 후보 조사 — 완료로 이동. 검토서 10/10 승인(검토자가 §10 을 새로 세워 검증 절 「사람 판정」 문구 잔여를 잡았고 그것까지 닫음). 산출물: 리서치 노트 4건 + 후보 보고서 + 회계 배경 확정안, 유저 결정 8건은 검토 판단 항목으로 접수
- 2026-09-27T02:09 · s:00758e49 · S2 done — KAN-001.2-4NWK0T authoring-kit 정착 — 완료로 이동. 검토서 승인 9 · 철회 1 로 수렴. 유저 반려 두 건(가이드 한 편 = 폴더 하나 · mermaid 대신 ~/resume viz)이 실물로 뒤집힌 것을 검토자가 독립 확인했고, PG27 우회 차단과 상황 표 값 칸 검사는 변형 12건을 새로 만들어 재현 검증했다
- 2026-09-27T02:09 · s:00758e49 · S3 done — KAN-001.3-Q6FYKP 파일럿 3편과 회고 — 완료로 이동. 검토서 16/16 승인(철회 4 제외)으로 수렴. 명세 1.4.0 시나리오 골격으로 Strategy·Account·Quantity v1.1.0 과 참고 문서 4편 발행, 검사 8종 통과, 기준 예시 3건 등록. 유저 승인 게이트 3건(존댓말 문체 · 코드 탭 화면 · 값 객체 표 네 줄)을 유저가 실물 보고 직접 판정해 33편 전체 기준이 확정됐다. analyzer 스팟체크로 새 배치에서 기준 해소가 도는 것도 확인
- 2026-09-27T02:46 · s:00758e49 — `실행 계획` 섹션 교체
- 2026-09-27T04:29 · s:00758e49 — `전략` 섹션 교체
- 2026-09-27T04:30 · s:00758e49 — `전략` 섹션 교체

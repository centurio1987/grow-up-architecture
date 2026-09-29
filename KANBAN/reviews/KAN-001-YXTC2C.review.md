---
card: KAN-001-YXTC2C
title: 전체 가이드 재집필
created: 2026-09-30
branch: KAN-001-YXTC2C
worktree: /Users/centurio/orca/workspaces/design-pattern-guide/KAN-001-YXTC2C
base: b62d572
status: 검토 대기
---

# KAN-001-YXTC2C 검토 요청 — 전체 가이드 재집필

카드: [KAN-001-YXTC2C.md](../cards/KAN-001-YXTC2C.md)

> 이 문서는 **검토를 위한 산출물**이다. 수행 내역은 카드 실행 문서에 있고, 착수 전
> 계획은 배치 문서에 있다. 여기 있는 것은 "지금 이 브랜치를 무엇으로 판정하는가" 뿐이다.

## 1. 검토 대상

| 항목 | 값 |
|---|---|
| 브랜치 | `KAN-001-YXTC2C` |
| 워크트리 | `/Users/centurio/orca/workspaces/design-pattern-guide/KAN-001-YXTC2C` |
| 베이스 | `b62d572` |
| 변경 훑기 | `git diff b62d572...HEAD` |

**커밋 99건**

```text
ded973e kanban: KAN-001.6-HB5NH9 S8 — analyzer 계약에 경쟁 후보 대조를 넣는다
6447595 kanban: KAN-001.6-HB5NH9 S2 — stale 잔여 처분
5a383ed kanban: KAN-001.6-HB5NH9 S1 — 인덱스 정비와 검사기 다중 인덱스 지원
4e73214 kanban: KAN-001.6-HB5NH9/S4·S5 — serves 역방향 검사와 발행 후 제안 처분
b081ba5 kanban: KAN-001.6-HB5NH9/S6·S7 배치3 — PG27 재판정과 강제 지점
47bebce kanban: KAN-001.5-6HF35H 완료 — 분석 패턴 10편 전부 발행 (9/9)
a3c6139 kanban: KAN-001.5-6HF35H/S7·S8 배치4 — Range · Measurement v1.0.0
e9c49a5 kanban: KAN-001.5-6HF35H/S5·S6 배치3 — Accountability · Knowledge Level v1.0.0
736f526 kanban: KAN-001.5-6HF35H/S3·S4 배치2 — consideration 정합 · Party v1.0.0
50889ba kanban: KAN-001.5-6HF35H/S1·S2 배치1 — Transaction · Posting Rule v1.0.0
5d6a764 kanban: KAN-001.4-BJT8JD 완료 — GoF 22편 전부 발행 (22/22)
7dfac47 kanban: KAN-001.4-BJT8JD/S19·S20 배치10 완료 — Iterator · Memento v1.0.0
9a55cd3 kanban: KAN-001.4-BJT8JD/S17·S18 배치9 완료 — Template Method · CoR v1.0.0
95b87e2 kanban: KAN-001.4-BJT8JD/S16 State 편 v1.0.0 — 게이트 PASS(2R) · 배치8 완료
b0ec880 kanban: KAN-001.4-BJT8JD/S15 Command 편 v1.0.0 — 게이트 PASS(3R)
118ffc4 guide: Observer · Mediator v1.0.0 발행 — 배치7, 행위 패턴 시작
b7e5e24 kanban: 미뤄둔 제안 둘을 .6 S5 에 모으고 배치7 착수 판단 기록
47bacfd guide: Composite · Flyweight v1.0.0 발행 — 배치6, 예방책이 처음 효과를 냈다
86eaecb guide: Facade · Bridge v1.0.0 발행 — 배치5, 자기 채점의 한계가 드러났다
faccaf4 guide: Decorator · Proxy v1.0.0 발행 — 배치4, 셋이 한 기준으로 맞물렸다
2c11ef4 guide: Prototype · Adapter v1.0.0 발행 — 배치3, 22편 중 6편 완료
5d2cbe1 guide: Builder · Singleton v1.0.0 발행 — 배치2, 22편 중 4편 완료
727cc10 guide: Factory Method · Abstract Factory v1.0.0 발행 — 22편의 첫 배치
5675868 kanban: 제거된 절차를 아직 가리키던 문구 일괄 정정 — 워커 입력이 되는 자리다
9c0ae40 kanban: KAN-001.4 착수 — GoF 22편 재집필, 배치1(Factory Method · Abstract Factory)
adbf5ae lock --update: voice ppangtolab-teacher 가 이 프로젝트를 섬긴다고 기록
607b542 kanban: KAN-001.7 신설 — 승인만 된 채 보드 밖에 있던 추가 패턴 넷에 자리를 준다
5930ba4 kanban: 하위 세 카드 완료 — 33편 집필 기준이 사람 판정으로 확정됐다
88c3db1 kanban: 유저 결정 넷 반영 — 두 카드 수렴, .3 은 사람 판정 3건만 남는다
c0fcab6 kanban: fable 검토자 셋이 세 검토서를 항목까지 판정 — 새 항목 둘을 세웠다
b3353b2 kanban: 반려 12건 독립 대조 — 11건 닫힘, 1건만 사람 몫으로 남는다
ce98601 kanban: KAN-001.3 S12 완료 — 1.4.0 회고를 기준 예시·근거까지 정착
f333680 kanban: KAN-001.3 S10·S11 완료
790efc8 Account·Quantity v1.1.0 발행 — 파일럿 세 편이 모두 시나리오 골격으로 섰다
21b10de kanban: KAN-001.3 S9 완료
5dcd82c Strategy v1.1.0 발행 — 시나리오 골격의 첫 실물, 참고 문서와 함께 올린다
e2197b5 skill: 상호 참조하는 문서는 함께 발행한다 — 판올림이 서로를 튕기는 것을 막는다
4f4353a render-viz: 겹침 가드 — 엣지가 남의 상자 밑을 지나는 것을 잡는다
834dd42 kanban: KAN-001.3 S8 완료
5eafb15 참고 문서 4편 발행 — 가이드가 원서에 떠넘기던 사전 지식을 내부 문서로 옮긴다
29b974d render-viz: 잘림 가드와 캡처 폭 자동 맞춤 — 잘린 PNG 가 소리 없이 산출물이 되던 것을 막는다
fc38eb0 kanban: KAN-001.3 S7 완료
be21c1b spec 1.4.0: 시나리오 골격과 자립성 원칙 — 유저 지적 두 건(원서 의존 · 정적 나열)을 명세로 닫는다
3d206db kanban: KAN-001.3 배치 4–6 계획 — 명세 1.4.0·참고 문서 4편 / Strategy·Account v1.1.0 / Quantity v1.1.0·회고
9fff30b kanban: KAN-001.3 재사이클 2 — 유저 지적 두 건(원서 의존 · 정적 나열)을 검토 항목 18·19 로 기록, S7–S12 와 배치 4–6 등록
a8542d5 kanban: KAN-001.3 검토서 — 1.3.0 재심 결과 기록(세 편 PASS)·산출물 재렌더
98552ce gate: 파일럿 3편 명세 1.3.0 재심 통과 — 사실 검증을 채점이 흡수
5d151e3 gate: 외부 검토를 파이프라인에서 제거 — 계승 원본도 실행하지 않는다
dd45323 kanban: KAN-001.2·.3 검토 재상신 — 반려 항목별 닫는 작업 기록, 범위·검증 결과 갱신
e007f54 kanban: KAN-001.2·.3 work 정리 — 파일럿 세 편 통과로 S1~S6 닫힘
2a6af95 retro: 파일럿 재사이클 결과 기록, .3 카드에 리서치 종속 뒷정리 순서 명시
1f8cf70 gate: Quantity 파일럿 PASS — 세 편 모두 통과, 게이트 기록·채점 보고 보존
08aeb78 guide: KAN-001.3 S5 — Quantity 2라운드(환산 협력 위상·통화 자릿수와 반올림 분리·도식 재작성)
066cf16 gate: Strategy 파일럿 PASS — 발행 상태·기준 예시 등록·게이트 기록
c93b038 guide: KAN-001.3 S5 — Strategy 2라운드(조건 3 근거 축소·생성 위치 선택화·도식 단계·사실 주장 2건)
4f1c5a1 gate: Account 파일럿 PASS — 발행 상태·기준 예시 등록·게이트 기록
1e6c88f guide: KAN-001.3 S5 — Account 2라운드(시간 기준·통화 단정·id 참조 보장) 보완
e61f22b guide: KAN-001.3 S5 — Account 잔여 지적 3건(Event Sourcing 기준·aggregate 개수·불변식 범위) 반영
306e030 kanban: 검토 반려 두 건 반영 — GoF 카드 묶음 서술을 배치 크기 2에 맞춤, 리서치 S4 완료 기준을 검토서 상신으로 정정
25fd92b guide: KAN-001.3 S5 — Account·Quantity 보완 반영, HTML 재렌더, lock 갱신
85ace44 guide: KAN-001.3 S5 — Strategy 보완(원전 근거·조건 3 뒷절 삭제·출력 펜스), 출력 펜스 위치 규칙 정정
d2ffbb3 spec: KAN-001.2 S12 — 규약 반영(재사용 확인·인덱스 편별 등록·도식·버전)과 lock 갱신
52ac02b viz: KAN-001.2 S11 — 도식을 mermaid 에서 viz 컴포넌트로 교체
b9505bc run: KAN-001.2 S10 — 예시 코드를 실행 파일로 분리하고 실행·출력 대조 검사 추가
7111238 layout: KAN-001.2 S9 — 가이드 한 편 = 폴더 하나, 파일명 semver 버저닝
8fa2024 check: KAN-001.2 S8 — 필수 조건 근거 우회 4종 차단, 상황 설정 표 칸 값 검사
131b95c gate: KAN-001.2 S7 — 정성 게이트(이해 게이트) 파이프라인에서 제거
5404f71 kanban: KAN-001.2·.3 재착수 — 정성 게이트 제거·검사기 보강·버저닝/폴더 재편·코드 실행 검증·viz 도입 work 추가
ff809da review: 유저 결정 기록 — 이해 게이트 제거 · 가이드별 폴더 · viz 도입, 전제 사라진 4건 철회
86f8d7b review: KAN-001.2 유저 판정 — 승인 5 · 반려 5(HTML 폴더 구조, mermaid 도구)
54b895e kanban: 판정 반영해 보드 뷰·검토 리포트 3종 재렌더
3266f35 review: 검토자 2인 독립 검토 + 중재자 판정 — 36건(승인 24 · 반려 12)
8e862fe kanban: KAN-001-YXTC2C 전략 규모·계획 리포트 — 배치 크기 2 확정 반영(단일·병렬 모두 23배치)
6953a41 kanban: KAN-001.3-Q6FYKP 진행 중 → 검토 (검토서 판단 항목 9 — 파일럿 3편 보류, spec 1.1, 게이트 판정 방식)
52dbce8 kanban: KAN-001.3-Q6FYKP 범위 — lock 파일과 .4·.5·.6 카드 문서(배치 관점 갱신) 추가
9a674c1 kanban: KAN-001.3-Q6FYKP 목표 — exemplar 기준 정정(spec마다 1건)
8d14c49 retro: KAN-001.3 S4 — 파일럿 회고 문서, PG28 근거 인용 정정(lock 재갱신), S4 보류
35d1653 kanban: KAN-001.3 S4 — batch_size_works 2 확정, .4·.5·.6 배치 문서 18건
bf4aaa6 authoring: spec 1.1 — 파일럿 회고 되먹임, lock 갱신 (KAN-001.3 S4)
227a530 guide: KAN-001.3 S2 — Account 파일럿(analysis-guide) 3라운드 결과, 보류
db1975b guide: KAN-001.3 S3 — Quantity 파일럿(analysis-guide) 3라운드 결과, 보류
55c7d8a guide: KAN-001.3 S1 — Strategy 파일럿(gof-guide) 3라운드 결과, 보류
9bc076a kanban: KAN-001.3-Q6FYKP 백로그 → 진행 중 (.1·.2 검토 대기 중, 추천안을 잠정 적용해 파일럿 착수)
fc0c885 kanban: KAN-001.1-P5N9NF 진행 중 → 검토 (검토서 판단 항목 8)
2d6b55c research: KAN-001.1 S4 — 분석 패턴 10편 리서치 노트 + 회계 배경 확정안(잠정)
326f944 research: KAN-001.1 S3 — GoF 행위 11패턴 리서치 노트
ee89ee2 research: KAN-001.1 S2 — GoF 생성·구조 12패턴 리서치 노트
f428b42 kanban: KAN-001.2-4NWK0T 진행 중 → 검토 (검토서 판단 항목 7)
8dbb28b skills: KAN-001.2 S5 완료 — .agents/skills 사본 동기화
95a53ad kanban: KAN-001.2 S4 완료 — 실제 spec 과 검사기 대조 확인
a1486d7 authoring: KAN-001.2 S3 — analysis-guide spec 1.0.0 + 캔버스 · lock 초기 확정
9584d21 authoring: KAN-001.2 S2 — gof-guide spec 1.0.0 + 캔버스
3fc5a6c scripts: KAN-001.2 S6 — render-guides.py 가이드 HTML 렌더러
fd1c025 scripts: KAN-001.2 S4 — 이해 게이트 개작 · 외부 검토 축 · check-guides.py
f2ecd5e research: KAN-001.1 S1 — 추가 패턴 후보 보고서
6eedf4e skills: KAN-001.2 S5 — design-pattern-guide 진입 스킬 교체 · analyzer 계약 수정
4816b81 authoring: KAN-001.2 S1 — paths.json 바인딩 확장 + authoring.lock.json 생성
b931916 kanban: KAN-001.1-P5N9NF 백로그 → 진행 중
d64e679 kanban: KAN-001-YXTC2C 할 일 → 진행 중 (orca 워크트리 착수)
```

**변경 파일 574개 (+163971 −1441)**

| 파일 | 상태 | 추가 | 삭제 |
|---|:--:|---:|---:|
| `.agents/skills/design-pattern-analyzer/SKILL.md` | M | 129 | 16 |
| `.agents/skills/design-pattern-analyzer/checklist.md` | M | 6 | 2 |
| `.agents/skills/design-pattern-analyzer/report-template.md` | M | 21 | 4 |
| `.agents/skills/design-pattern-guide/SKILL.md` | M | 186 | 69 |
| `.agents/skills/design-pattern-guide/analysis-guide-canvas.md` | M | 111 | 0 |
| `.agents/skills/design-pattern-guide/gof-guide-canvas.md` | M | 88 | 0 |
| `.agents/skills/design-pattern-guide/reference-note-canvas.md` | M | 35 | 0 |
| `.agents/skills/design-pattern-guide/template.md` | M | 0 | 132 |
| `.claude/authoring.lock.json` | M | 38 | 0 |
| `.claude/authoring/paths.json` | M | 36 | 2 |
| `.claude/authoring/specs/analysis-guide/spec.json` | M | 489 | 0 |
| `.claude/authoring/specs/analysis-guide/spec.md` | M | 545 | 0 |
| `.claude/authoring/specs/analysis-guide/template.slots.json` | M | 115 | 0 |
| `.claude/authoring/specs/gof-guide/spec.json` | M | 430 | 0 |
| `.claude/authoring/specs/gof-guide/spec.md` | M | 447 | 0 |
| `.claude/authoring/specs/gof-guide/template.slots.json` | M | 75 | 0 |
| `.claude/authoring/specs/reference-note/spec.json` | M | 155 | 0 |
| `.claude/authoring/specs/reference-note/spec.md` | M | 118 | 0 |
| `.claude/authoring/specs/reference-note/template.slots.json` | M | 45 | 0 |
| `.claude/skills/design-pattern-analyzer/SKILL.md` | M | 129 | 16 |
| `.claude/skills/design-pattern-analyzer/checklist.md` | M | 6 | 2 |
| `.claude/skills/design-pattern-analyzer/report-template.md` | M | 21 | 4 |
| `.claude/skills/design-pattern-guide/SKILL.md` | M | 186 | 69 |
| `.claude/skills/design-pattern-guide/analysis-guide-canvas.md` | M | 111 | 0 |
| `.claude/skills/design-pattern-guide/gof-guide-canvas.md` | M | 88 | 0 |
| `.claude/skills/design-pattern-guide/reference-note-canvas.md` | M | 35 | 0 |
| `.claude/skills/design-pattern-guide/template.md` | M | 0 | 132 |
| `.gitignore` | M | 8 | 0 |
| `.kanban/log.md` | M | 22 | 0 |
| `.kanban/reviews/.gitkeep` | M | 0 | 0 |
| `.kanban/reviews/KAN-001.1-P5N9NF.events.jsonl` | M | 44 | 0 |
| `.kanban/reviews/KAN-001.1-P5N9NF.review.json` | M | 27 | 0 |
| `.kanban/reviews/KAN-001.2-4NWK0T.events.jsonl` | M | 74 | 0 |
| `.kanban/reviews/KAN-001.2-4NWK0T.review.json` | M | 27 | 0 |
| `.kanban/reviews/KAN-001.3-Q6FYKP.events.jsonl` | M | 114 | 0 |
| `.kanban/reviews/KAN-001.3-Q6FYKP.review.json` | M | 27 | 0 |
| `.kanban/state.json` | M | 302 | 26 |
| `.npmrc` | M | 2 | 0 |
| `KANBAN.board.html` | M | 28 | 5 |
| `KANBAN.md` | M | 60 | 43 |
| `KANBAN/batches/KAN-001-YXTC2C.batch3.md` | M | 31 | 0 |
| `KANBAN/batches/KAN-001.2-4NWK0T.batch3.md` | M | 35 | 0 |
| `KANBAN/batches/KAN-001.2-4NWK0T.batch4.md` | M | 35 | 0 |
| `KANBAN/batches/KAN-001.2-4NWK0T.batch5.md` | M | 35 | 0 |
| `KANBAN/batches/KAN-001.3-Q6FYKP.batch1.md` | M | 2 | 2 |
| `KANBAN/batches/KAN-001.3-Q6FYKP.batch2.md` | M | 1 | 1 |
| `KANBAN/batches/KAN-001.3-Q6FYKP.batch3.md` | M | 35 | 0 |
| `KANBAN/batches/KAN-001.3-Q6FYKP.batch4.md` | M | 65 | 0 |
| `KANBAN/batches/KAN-001.3-Q6FYKP.batch5.md` | M | 52 | 0 |
| `KANBAN/batches/KAN-001.3-Q6FYKP.batch6.md` | M | 48 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch1.md` | M | 59 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch10.md` | M | 76 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch11.md` | M | 80 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch2.md` | M | 55 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch3.md` | M | 54 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch4.md` | M | 62 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch5.md` | M | 56 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch6.md` | M | 60 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch7.md` | M | 60 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch8.md` | M | 58 | 0 |
| `KANBAN/batches/KAN-001.4-BJT8JD.batch9.md` | M | 79 | 0 |
| `KANBAN/batches/KAN-001.5-6HF35H.batch1.md` | M | 81 | 0 |
| `KANBAN/batches/KAN-001.5-6HF35H.batch2.md` | M | 87 | 0 |
| `KANBAN/batches/KAN-001.5-6HF35H.batch3.md` | M | 92 | 0 |
| `KANBAN/batches/KAN-001.5-6HF35H.batch4.md` | M | 92 | 0 |
| `KANBAN/batches/KAN-001.5-6HF35H.batch5.md` | M | 86 | 0 |
| `KANBAN/batches/KAN-001.6-HB5NH9.batch1.md` | M | 46 | 0 |
| `KANBAN/batches/KAN-001.6-HB5NH9.batch2.md` | M | 33 | 0 |
| `KANBAN/batches/KAN-001.6-HB5NH9.batch3.md` | M | 86 | 0 |
| `KANBAN/cards/KAN-001-YXTC2C.md` | M | 34 | 20 |
| `KANBAN/cards/KAN-001.1-P5N9NF.md` | M | 19 | 8 |
| `KANBAN/cards/KAN-001.2-4NWK0T.md` | M | 47 | 12 |
| `KANBAN/cards/KAN-001.3-Q6FYKP.md` | M | 77 | 11 |
| `KANBAN/cards/KAN-001.4-BJT8JD.md` | M | 286 | 32 |
| `KANBAN/cards/KAN-001.5-6HF35H.md` | M | 54 | 17 |
| `KANBAN/cards/KAN-001.6-HB5NH9.md` | M | 105 | 6 |
| `KANBAN/cards/KAN-001.7-4MRJ1B.md` | M | 62 | 0 |
| `KANBAN/reports/KAN-001-YXTC2C.report.draft.md` | M | 13 | 13 |
| `KANBAN/reports/KAN-001-YXTC2C.report.html` | M | 31 | 31 |
| `KANBAN/requests/doing/.gitkeep` | M | 0 | 0 |
| `KANBAN/requests/doing/KAN-001-YXTC2C.request.md` | R | 0 | 0 |
| `KANBAN/reviews/.gitkeep` | M | 0 | 0 |
| `KANBAN/reviews/KAN-001.1-P5N9NF.review.html` | M | 1282 | 0 |
| `KANBAN/reviews/KAN-001.1-P5N9NF.review.md` | M | 357 | 0 |
| `KANBAN/reviews/KAN-001.2-4NWK0T.review.html` | M | 1354 | 0 |
| `KANBAN/reviews/KAN-001.2-4NWK0T.review.md` | M | 658 | 0 |
| `KANBAN/reviews/KAN-001.3-Q6FYKP.review.html` | M | 1326 | 0 |
| `KANBAN/reviews/KAN-001.3-Q6FYKP.review.md` | M | 760 | 0 |
| `PATTERNS.html` | M | 695 | 0 |
| `PATTERNS.md` | M | 61 | 29 |
| `README.md` | M | 27 | 22 |
| `analysis/strategy-ShippingApp-20260926-2325.md` | M | 152 | 0 |
| `assets/fonts/fonts.css` | M | 58 | 0 |
| `assets/fonts/ibm-plex-mono-latin-400-normal.woff2` | B | 0 | 0 |
| `assets/fonts/ibm-plex-mono-latin-500-normal.woff2` | B | 0 | 0 |
| `assets/fonts/ibm-plex-mono-latin-700-normal.woff2` | B | 0 | 0 |
| `assets/fonts/ibm-plex-sans-kr-korean-400-normal.woff2` | B | 0 | 0 |
| `assets/fonts/ibm-plex-sans-kr-korean-500-normal.woff2` | B | 0 | 0 |
| `assets/fonts/ibm-plex-sans-kr-korean-700-normal.woff2` | B | 0 | 0 |
| `bun.lock` | M | 46 | 0 |
| `package.json` | M | 24 | 0 |
| `"pattern-guide/consideration/Account\354\231\200 Entry\354\235\230 \352\264\200\352\263\204 \354\204\244\352\263\204.md"` | M | 6 | 1 |
| `pattern-guide/consideration/account-transaction-entry-modeling.md` | M | 62 | 32 |
| `pattern-guide/ddd-analysis-pattern-guide/README.html` | M | 650 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/README.md` | M | 13 | 12 |
| `pattern-guide/ddd-analysis-pattern-guide/account-pattern.md` | M | 0 | 169 |
| `pattern-guide/ddd-analysis-pattern-guide/account/account-guide_v1.0.0.html` | M | 1802 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/account-guide_v1.0.0.md` | M | 1225 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/account-guide_v1.1.0.html` | M | 1802 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/account-guide_v1.1.0.md` | M | 1242 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/code/AccountExample.java` | M | 216 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/code/expected-output.txt` | M | 10 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/code/main.rs` | M | 241 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/code/main.ts` | M | 211 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/diagrams/AccountModel.tsx` | M | 47 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/account/diagrams/account-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/accountability-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/accountability-guide_v1.0.0.html` | M | 1816 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/accountability-guide_v1.0.0.md` | M | 1215 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/code/AccountabilityExample.java` | M | 249 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/code/expected-output.txt` | M | 12 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/code/main.rs` | M | 240 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/code/main.ts` | M | 237 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/diagrams/AccountabilityModel.tsx` | M | 49 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/accountability/diagrams/accountability-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/code/KnowledgeLevelExample.java` | M | 245 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/code/expected-output.txt` | M | 20 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/code/main.rs` | M | 248 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/code/main.ts` | M | 248 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/diagrams/KnowledgeLevelModel.tsx` | M | 69 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/diagrams/knowledge-level-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/knowledge-level-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/knowledge-level-guide_v1.0.0.html` | M | 1867 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/knowledge-level/knowledge-level-guide_v1.0.0.md` | M | 1280 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/code/Main.java` | M | 204 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/code/expected-output.txt` | M | 14 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/code/main.rs` | M | 246 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/code/main.ts` | M | 214 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/diagrams/MeasurementModel.tsx` | M | 51 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/diagrams/measurement-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/measurement-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/measurement-guide_v1.0.0.html` | M | 1671 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/measurement/measurement-guide_v1.0.0.md` | M | 1079 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/code/Main.java` | M | 248 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/code/expected-output.txt` | M | 22 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/code/main.rs` | M | 248 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/code/main.ts` | M | 245 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/diagrams/ObservationModel.tsx` | M | 64 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/diagrams/observation-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/observation-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/observation-guide_v1.0.0.html` | M | 1797 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/observation/observation-guide_v1.0.0.md` | M | 1192 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/code/PartyExample.java` | M | 224 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/code/expected-output.txt` | M | 11 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/code/main.rs` | M | 247 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/code/main.ts` | M | 242 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/diagrams/PartyModel.tsx` | M | 53 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/diagrams/party-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/party-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/party-guide_v1.0.0.html` | M | 1778 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/party/party-guide_v1.0.0.md` | M | 1167 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/code/PostingRuleExample.java` | M | 249 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/code/expected-output.txt` | M | 14 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/code/main.rs` | M | 249 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/code/main.ts` | M | 242 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/diagrams/PostingRuleModel.tsx` | M | 54 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/diagrams/posting-rule-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/posting-rule-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/posting-rule-guide_v1.0.0.html` | M | 1858 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/posting-rule/posting-rule-guide_v1.0.0.md` | M | 1273 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity-pattern.md` | M | 0 | 172 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/code/Main.java` | M | 174 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/code/expected-output.txt` | M | 11 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/code/main.rs` | M | 200 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/code/main.ts` | M | 183 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/diagrams/QuantityModel.tsx` | M | 47 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/diagrams/quantity-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/quantity-guide_v1.0.0.html` | M | 1576 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/quantity-guide_v1.0.0.md` | M | 981 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/quantity-guide_v1.1.0.html` | M | 1606 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/quantity/quantity-guide_v1.1.0.md` | M | 1023 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/code/Main.java` | M | 220 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/code/expected-output.txt` | M | 14 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/code/main.rs` | M | 218 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/code/main.ts` | M | 244 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/diagrams/RangeModel.tsx` | M | 54 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/diagrams/range-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/range-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/range-guide_v1.0.0.html` | M | 1735 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/range/range-guide_v1.0.0.md` | M | 1160 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/code/TransactionExample.java` | M | 230 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/code/expected-output.txt` | M | 12 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/code/main.rs` | M | 246 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/code/main.ts` | M | 213 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/diagrams/TransactionModel.tsx` | M | 48 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/diagrams/transaction-model.png` | B | 0 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/transaction-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/transaction-guide_v1.0.0.html` | M | 1773 | 0 |
| `pattern-guide/ddd-analysis-pattern-guide/transaction/transaction-guide_v1.0.0.md` | M | 1191 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/abstract-factory-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/abstract-factory-guide_v1.0.0.html` | M | 1595 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/abstract-factory-guide_v1.0.0.md` | M | 1032 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/code/ReportApp.java` | M | 197 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/code/expected-output.txt` | M | 18 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/code/main.rs` | M | 169 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/code/main.ts` | M | 142 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/diagrams/AbstractFactoryFlow.tsx` | M | 73 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/diagrams/AbstractFactoryStructure.tsx` | M | 38 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/diagrams/abstract-factory-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/abstract-factory/diagrams/abstract-factory-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/adapter/adapter-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/adapter/adapter-guide_v1.0.0.html` | M | 1615 | 0 |
| `pattern-guide/design-pattern-guide/adapter/adapter-guide_v1.0.0.md` | M | 1067 | 0 |
| `pattern-guide/design-pattern-guide/adapter/code/WarehouseDeskApp.java` | M | 180 | 0 |
| `pattern-guide/design-pattern-guide/adapter/code/expected-output.txt` | M | 8 | 0 |
| `pattern-guide/design-pattern-guide/adapter/code/main.rs` | M | 208 | 0 |
| `pattern-guide/design-pattern-guide/adapter/code/main.ts` | M | 145 | 0 |
| `pattern-guide/design-pattern-guide/adapter/diagrams/AdapterFlow.tsx` | M | 71 | 0 |
| `pattern-guide/design-pattern-guide/adapter/diagrams/AdapterStructure.tsx` | M | 35 | 0 |
| `pattern-guide/design-pattern-guide/adapter/diagrams/adapter-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/adapter/diagrams/adapter-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/bridge/bridge-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/bridge/bridge-guide_v1.0.0.html` | M | 1754 | 0 |
| `pattern-guide/design-pattern-guide/bridge/bridge-guide_v1.0.0.md` | M | 1254 | 0 |
| `pattern-guide/design-pattern-guide/bridge/code/ReceiptDeskApp.java` | M | 246 | 0 |
| `pattern-guide/design-pattern-guide/bridge/code/expected-output.txt` | M | 36 | 0 |
| `pattern-guide/design-pattern-guide/bridge/code/main.rs` | M | 248 | 0 |
| `pattern-guide/design-pattern-guide/bridge/code/main.ts` | M | 208 | 0 |
| `pattern-guide/design-pattern-guide/bridge/diagrams/BridgeFlow.tsx` | M | 81 | 0 |
| `pattern-guide/design-pattern-guide/bridge/diagrams/BridgeStructure.tsx` | M | 50 | 0 |
| `pattern-guide/design-pattern-guide/bridge/diagrams/bridge-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/bridge/diagrams/bridge-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/builder/builder-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/builder/builder-guide_v1.0.0.html` | M | 1625 | 0 |
| `pattern-guide/design-pattern-guide/builder/builder-guide_v1.0.0.md` | M | 1056 | 0 |
| `pattern-guide/design-pattern-guide/builder/code/OrderApp.java` | M | 210 | 0 |
| `pattern-guide/design-pattern-guide/builder/code/expected-output.txt` | M | 11 | 0 |
| `pattern-guide/design-pattern-guide/builder/code/main.rs` | M | 212 | 0 |
| `pattern-guide/design-pattern-guide/builder/code/main.ts` | M | 176 | 0 |
| `pattern-guide/design-pattern-guide/builder/diagrams/BuilderFlow.tsx` | M | 74 | 0 |
| `pattern-guide/design-pattern-guide/builder/diagrams/BuilderStructure.tsx` | M | 40 | 0 |
| `pattern-guide/design-pattern-guide/builder/diagrams/builder-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/builder/diagrams/builder-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/chain-of-responsibility-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/chain-of-responsibility-guide_v1.0.0.html` | M | 1440 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/chain-of-responsibility-guide_v1.0.0.md` | M | 862 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/code/ExpenseApp.java` | M | 113 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/code/expected-output.txt` | M | 5 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/code/main.rs` | M | 104 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/code/main.ts` | M | 85 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/diagrams/CoRFlow.tsx` | M | 92 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/diagrams/CoRStructure.tsx` | M | 34 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/diagrams/cor-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/chain-of-responsibility/diagrams/cor-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/command/code/MemoEditorApp.java` | M | 166 | 0 |
| `pattern-guide/design-pattern-guide/command/code/expected-output.txt` | M | 10 | 0 |
| `pattern-guide/design-pattern-guide/command/code/main.rs` | M | 174 | 0 |
| `pattern-guide/design-pattern-guide/command/code/main.ts` | M | 145 | 0 |
| `pattern-guide/design-pattern-guide/command/command-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/command/command-guide_v1.0.0.html` | M | 1552 | 0 |
| `pattern-guide/design-pattern-guide/command/command-guide_v1.0.0.md` | M | 1027 | 0 |
| `pattern-guide/design-pattern-guide/command/diagrams/CommandFlow.tsx` | M | 73 | 0 |
| `pattern-guide/design-pattern-guide/command/diagrams/CommandStructure.tsx` | M | 45 | 0 |
| `pattern-guide/design-pattern-guide/command/diagrams/command-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/command/diagrams/command-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/composite/code/ParcelShippingApp.java` | M | 164 | 0 |
| `pattern-guide/design-pattern-guide/composite/code/expected-output.txt` | M | 13 | 0 |
| `pattern-guide/design-pattern-guide/composite/code/main.rs` | M | 160 | 0 |
| `pattern-guide/design-pattern-guide/composite/code/main.ts` | M | 127 | 0 |
| `pattern-guide/design-pattern-guide/composite/composite-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/composite/composite-guide_v1.0.0.html` | M | 1568 | 0 |
| `pattern-guide/design-pattern-guide/composite/composite-guide_v1.0.0.md` | M | 1012 | 0 |
| `pattern-guide/design-pattern-guide/composite/diagrams/CompositeFlow.tsx` | M | 72 | 0 |
| `pattern-guide/design-pattern-guide/composite/diagrams/CompositeStructure.tsx` | M | 45 | 0 |
| `pattern-guide/design-pattern-guide/composite/diagrams/composite-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/composite/diagrams/composite-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/decorator/code/ShipmentNoticeApp.java` | M | 141 | 0 |
| `pattern-guide/design-pattern-guide/decorator/code/expected-output.txt` | M | 8 | 0 |
| `pattern-guide/design-pattern-guide/decorator/code/main.rs` | M | 164 | 0 |
| `pattern-guide/design-pattern-guide/decorator/code/main.ts` | M | 122 | 0 |
| `pattern-guide/design-pattern-guide/decorator/decorator-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/decorator/decorator-guide_v1.0.0.html` | M | 1534 | 0 |
| `pattern-guide/design-pattern-guide/decorator/decorator-guide_v1.0.0.md` | M | 996 | 0 |
| `pattern-guide/design-pattern-guide/decorator/diagrams/DecoratorFlow.tsx` | M | 74 | 0 |
| `pattern-guide/design-pattern-guide/decorator/diagrams/DecoratorStructure.tsx` | M | 38 | 0 |
| `pattern-guide/design-pattern-guide/decorator/diagrams/decorator-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/decorator/diagrams/decorator-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/facade/code/BookingDeskApp.java` | M | 159 | 0 |
| `pattern-guide/design-pattern-guide/facade/code/expected-output.txt` | M | 6 | 0 |
| `pattern-guide/design-pattern-guide/facade/code/main.rs` | M | 181 | 0 |
| `pattern-guide/design-pattern-guide/facade/code/main.ts` | M | 135 | 0 |
| `pattern-guide/design-pattern-guide/facade/diagrams/FacadeFlow.tsx` | M | 73 | 0 |
| `pattern-guide/design-pattern-guide/facade/diagrams/FacadeStructure.tsx` | M | 44 | 0 |
| `pattern-guide/design-pattern-guide/facade/diagrams/facade-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/facade/diagrams/facade-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/facade/facade-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/facade/facade-guide_v1.0.0.html` | M | 1536 | 0 |
| `pattern-guide/design-pattern-guide/facade/facade-guide_v1.0.0.md` | M | 995 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/code/PayrollApp.java` | M | 171 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/code/expected-output.txt` | M | 8 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/code/main.rs` | M | 169 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/code/main.ts` | M | 137 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/diagrams/FactoryMethodFlow.tsx` | M | 72 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/diagrams/FactoryMethodStructure.tsx` | M | 40 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/diagrams/factory-method-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/diagrams/factory-method-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/factory-method-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/factory-method-guide_v1.0.0.html` | M | 1588 | 0 |
| `pattern-guide/design-pattern-guide/factory-method/factory-method-guide_v1.0.0.md` | M | 1055 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/code/StockCountApp.java` | M | 170 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/code/expected-output.txt` | M | 8 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/code/main.rs` | M | 177 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/code/main.ts` | M | 147 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/diagrams/FlyweightFlow.tsx` | M | 72 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/diagrams/FlyweightStructure.tsx` | M | 39 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/diagrams/flyweight-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/diagrams/flyweight-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/flyweight-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/flyweight-guide_v1.0.0.html` | M | 1515 | 0 |
| `pattern-guide/design-pattern-guide/flyweight/flyweight-guide_v1.0.0.md` | M | 951 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/code/NotificationRules.java` | M | 165 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/code/expected-output.txt` | M | 12 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/code/main.rs` | M | 162 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/code/main.ts` | M | 138 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/diagrams/InterpreterFlow.tsx` | M | 76 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/diagrams/InterpreterStructure.tsx` | M | 60 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/diagrams/interpreter-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/diagrams/interpreter-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/interpreter-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/interpreter-guide_v1.0.0.html` | M | 1539 | 0 |
| `pattern-guide/design-pattern-guide/interpreter/interpreter-guide_v1.0.0.md` | M | 995 | 0 |
| `pattern-guide/design-pattern-guide/iterator/code/ScanLogApp.java` | M | 173 | 0 |
| `pattern-guide/design-pattern-guide/iterator/code/expected-output.txt` | M | 5 | 0 |
| `pattern-guide/design-pattern-guide/iterator/code/main.rs` | M | 191 | 0 |
| `pattern-guide/design-pattern-guide/iterator/code/main.ts` | M | 177 | 0 |
| `pattern-guide/design-pattern-guide/iterator/diagrams/IteratorFlow.tsx` | M | 75 | 0 |
| `pattern-guide/design-pattern-guide/iterator/diagrams/IteratorStructure.tsx` | M | 44 | 0 |
| `pattern-guide/design-pattern-guide/iterator/diagrams/iterator-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/iterator/diagrams/iterator-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/iterator/iterator-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/iterator/iterator-guide_v1.0.0.html` | M | 1691 | 0 |
| `pattern-guide/design-pattern-guide/iterator/iterator-guide_v1.0.0.md` | M | 1134 | 0 |
| `pattern-guide/design-pattern-guide/mediator/code/SeatFormApp.java` | M | 241 | 0 |
| `pattern-guide/design-pattern-guide/mediator/code/expected-output.txt` | M | 9 | 0 |
| `pattern-guide/design-pattern-guide/mediator/code/main.rs` | M | 247 | 0 |
| `pattern-guide/design-pattern-guide/mediator/code/main.ts` | M | 210 | 0 |
| `pattern-guide/design-pattern-guide/mediator/diagrams/MediatorFlow.tsx` | M | 72 | 0 |
| `pattern-guide/design-pattern-guide/mediator/diagrams/MediatorStructure.tsx` | M | 136 | 0 |
| `pattern-guide/design-pattern-guide/mediator/diagrams/mediator-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/mediator/diagrams/mediator-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/mediator/mediator-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/mediator/mediator-guide_v1.0.0.html` | M | 1877 | 0 |
| `pattern-guide/design-pattern-guide/mediator/mediator-guide_v1.0.0.md` | M | 1284 | 0 |
| `pattern-guide/design-pattern-guide/memento/code/SeatDeskApp.java` | M | 146 | 0 |
| `pattern-guide/design-pattern-guide/memento/code/expected-output.txt` | M | 7 | 0 |
| `pattern-guide/design-pattern-guide/memento/code/main.rs` | M | 137 | 0 |
| `pattern-guide/design-pattern-guide/memento/code/main.ts` | M | 132 | 0 |
| `pattern-guide/design-pattern-guide/memento/diagrams/MementoFlow.tsx` | M | 73 | 0 |
| `pattern-guide/design-pattern-guide/memento/diagrams/MementoStructure.tsx` | M | 43 | 0 |
| `pattern-guide/design-pattern-guide/memento/diagrams/memento-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/memento/diagrams/memento-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/memento/memento-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/memento/memento-guide_v1.0.0.html` | M | 1572 | 0 |
| `pattern-guide/design-pattern-guide/memento/memento-guide_v1.0.0.md` | M | 985 | 0 |
| `pattern-guide/design-pattern-guide/observer/code/StockroomApp.java` | M | 154 | 0 |
| `pattern-guide/design-pattern-guide/observer/code/expected-output.txt` | M | 14 | 0 |
| `pattern-guide/design-pattern-guide/observer/code/main.rs` | M | 177 | 0 |
| `pattern-guide/design-pattern-guide/observer/code/main.ts` | M | 133 | 0 |
| `pattern-guide/design-pattern-guide/observer/diagrams/ObserverFlow.tsx` | M | 71 | 0 |
| `pattern-guide/design-pattern-guide/observer/diagrams/ObserverStructure.tsx` | M | 40 | 0 |
| `pattern-guide/design-pattern-guide/observer/diagrams/observer-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/observer/diagrams/observer-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/observer/observer-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/observer/observer-guide_v1.0.0.html` | M | 1575 | 0 |
| `pattern-guide/design-pattern-guide/observer/observer-guide_v1.0.0.md` | M | 1034 | 0 |
| `pattern-guide/design-pattern-guide/prototype/code/ChecklistApp.java` | M | 233 | 0 |
| `pattern-guide/design-pattern-guide/prototype/code/expected-output.txt` | M | 8 | 0 |
| `pattern-guide/design-pattern-guide/prototype/code/main.rs` | M | 250 | 0 |
| `pattern-guide/design-pattern-guide/prototype/code/main.ts` | M | 192 | 0 |
| `pattern-guide/design-pattern-guide/prototype/diagrams/PrototypeFlow.tsx` | M | 77 | 0 |
| `pattern-guide/design-pattern-guide/prototype/diagrams/PrototypeStructure.tsx` | M | 47 | 0 |
| `pattern-guide/design-pattern-guide/prototype/diagrams/prototype-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/prototype/diagrams/prototype-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/prototype/prototype-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/prototype/prototype-guide_v1.0.0.html` | M | 1663 | 0 |
| `pattern-guide/design-pattern-guide/prototype/prototype-guide_v1.0.0.md` | M | 1115 | 0 |
| `pattern-guide/design-pattern-guide/proxy/code/ContractVaultApp.java` | M | 224 | 0 |
| `pattern-guide/design-pattern-guide/proxy/code/expected-output.txt` | M | 7 | 0 |
| `pattern-guide/design-pattern-guide/proxy/code/main.rs` | M | 223 | 0 |
| `pattern-guide/design-pattern-guide/proxy/code/main.ts` | M | 183 | 0 |
| `pattern-guide/design-pattern-guide/proxy/diagrams/ProxyFlow.tsx` | M | 70 | 0 |
| `pattern-guide/design-pattern-guide/proxy/diagrams/ProxyStructure.tsx` | M | 36 | 0 |
| `pattern-guide/design-pattern-guide/proxy/diagrams/proxy-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/proxy/diagrams/proxy-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/proxy/proxy-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/proxy/proxy-guide_v1.0.0.html` | M | 1692 | 0 |
| `pattern-guide/design-pattern-guide/proxy/proxy-guide_v1.0.0.md` | M | 1141 | 0 |
| `pattern-guide/design-pattern-guide/singleton/code/OrderDeskApp.java` | M | 77 | 0 |
| `pattern-guide/design-pattern-guide/singleton/code/expected-output.txt` | M | 6 | 0 |
| `pattern-guide/design-pattern-guide/singleton/code/main.rs` | M | 90 | 0 |
| `pattern-guide/design-pattern-guide/singleton/code/main.ts` | M | 68 | 0 |
| `pattern-guide/design-pattern-guide/singleton/diagrams/SingletonFlow.tsx` | M | 71 | 0 |
| `pattern-guide/design-pattern-guide/singleton/diagrams/SingletonStructure.tsx` | M | 38 | 0 |
| `pattern-guide/design-pattern-guide/singleton/diagrams/singleton-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/singleton/diagrams/singleton-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/singleton/singleton-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/singleton/singleton-guide_v1.0.0.html` | M | 1246 | 0 |
| `pattern-guide/design-pattern-guide/singleton/singleton-guide_v1.0.0.md` | M | 680 | 0 |
| `pattern-guide/design-pattern-guide/state/code/OrderApp.java` | M | 212 | 0 |
| `pattern-guide/design-pattern-guide/state/code/expected-output.txt` | M | 8 | 0 |
| `pattern-guide/design-pattern-guide/state/code/main.rs` | M | 208 | 0 |
| `pattern-guide/design-pattern-guide/state/code/main.ts` | M | 185 | 0 |
| `pattern-guide/design-pattern-guide/state/diagrams/StateFlow.tsx` | M | 70 | 0 |
| `pattern-guide/design-pattern-guide/state/diagrams/StateStructure.tsx` | M | 41 | 0 |
| `pattern-guide/design-pattern-guide/state/diagrams/state-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/state/diagrams/state-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/state/state-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/state/state-guide_v1.0.0.html` | M | 1740 | 0 |
| `pattern-guide/design-pattern-guide/state/state-guide_v1.0.0.md` | M | 1186 | 0 |
| `pattern-guide/design-pattern-guide/strategy-pattern.md` | M | 0 | 329 |
| `pattern-guide/design-pattern-guide/strategy/code/ShippingApp.java` | M | 99 | 0 |
| `pattern-guide/design-pattern-guide/strategy/code/expected-output.txt` | M | 3 | 0 |
| `pattern-guide/design-pattern-guide/strategy/code/main.rs` | M | 98 | 0 |
| `pattern-guide/design-pattern-guide/strategy/code/main.ts` | M | 80 | 0 |
| `pattern-guide/design-pattern-guide/strategy/diagrams/StrategyFlow.tsx` | M | 70 | 0 |
| `pattern-guide/design-pattern-guide/strategy/diagrams/StrategyStructure.tsx` | M | 39 | 0 |
| `pattern-guide/design-pattern-guide/strategy/diagrams/strategy-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/strategy/diagrams/strategy-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.0.0.html` | M | 1460 | 0 |
| `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.0.0.md` | M | 867 | 0 |
| `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.html` | M | 1481 | 0 |
| `pattern-guide/design-pattern-guide/strategy/strategy-guide_v1.1.0.md` | M | 908 | 0 |
| `pattern-guide/design-pattern-guide/template-method/code/ObservationApp.java` | M | 153 | 0 |
| `pattern-guide/design-pattern-guide/template-method/code/expected-output.txt` | M | 4 | 0 |
| `pattern-guide/design-pattern-guide/template-method/code/main.rs` | M | 174 | 0 |
| `pattern-guide/design-pattern-guide/template-method/code/main.ts` | M | 153 | 0 |
| `pattern-guide/design-pattern-guide/template-method/diagrams/TemplateMethodFlow.tsx` | M | 75 | 0 |
| `pattern-guide/design-pattern-guide/template-method/diagrams/TemplateMethodStructure.tsx` | M | 50 | 0 |
| `pattern-guide/design-pattern-guide/template-method/diagrams/template-method-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/template-method/diagrams/template-method-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/template-method/template-method-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/template-method/template-method-guide_v1.0.0.html` | M | 1613 | 0 |
| `pattern-guide/design-pattern-guide/template-method/template-method-guide_v1.0.0.md` | M | 1074 | 0 |
| `pattern-guide/design-pattern-guide/visitor/code/ParcelVisitorApp.java` | M | 248 | 0 |
| `pattern-guide/design-pattern-guide/visitor/code/expected-output.txt` | M | 12 | 0 |
| `pattern-guide/design-pattern-guide/visitor/code/main.rs` | M | 236 | 0 |
| `pattern-guide/design-pattern-guide/visitor/code/main.ts` | M | 181 | 0 |
| `pattern-guide/design-pattern-guide/visitor/diagrams/VisitorFlow.tsx` | M | 82 | 0 |
| `pattern-guide/design-pattern-guide/visitor/diagrams/VisitorStructure.tsx` | M | 62 | 0 |
| `pattern-guide/design-pattern-guide/visitor/diagrams/visitor-flow.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/visitor/diagrams/visitor-structure.png` | B | 0 | 0 |
| `pattern-guide/design-pattern-guide/visitor/visitor-guide_v0.1.0.md` | R | 9 | 0 |
| `pattern-guide/design-pattern-guide/visitor/visitor-guide_v1.0.0.html` | M | 1749 | 0 |
| `pattern-guide/design-pattern-guide/visitor/visitor-guide_v1.0.0.md` | M | 1194 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r1.external.txt` | M | 130 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r1.gate.txt` | M | 62 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r1.score.md` | M | 164 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r2.external.txt` | M | 113 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r2.gate.txt` | M | 62 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r2.score.md` | M | 96 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r3.external.txt` | M | 98 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r3.gate.txt` | M | 96 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r3.score-external.md` | M | 96 | 0 |
| `pattern-guide/gate-logs/account/account-pattern.r3.score.md` | M | 90 | 0 |
| `pattern-guide/gate-logs/account/account.r4.external.txt` | M | 44 | 0 |
| `pattern-guide/gate-logs/account/account.r4.score.md` | M | 71 | 0 |
| `pattern-guide/gate-logs/account/account.r5.score.md` | M | 39 | 0 |
| `pattern-guide/gate-logs/pilot-retrospective.md` | M | 190 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r1.external.txt` | M | 107 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r1.gate.txt` | M | 62 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r1.score.md` | M | 127 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r2.external.txt` | M | 99 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r2.gate.txt` | M | 65 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r2.score.md` | M | 89 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r3.external.txt` | M | 75 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r3.gate.txt` | M | 58 | 0 |
| `pattern-guide/gate-logs/quantity/quantity-pattern.r3.score.md` | M | 64 | 0 |
| `pattern-guide/gate-logs/quantity/quantity.r4.external.txt` | M | 30 | 0 |
| `pattern-guide/gate-logs/quantity/quantity.r4.score.md` | M | 64 | 0 |
| `pattern-guide/gate-logs/quantity/quantity.r5.score.md` | M | 37 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r1.external.txt` | M | 88 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r1.gate.txt` | M | 71 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r1.score.md` | M | 150 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r2.external.txt` | M | 91 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r2.gate.txt` | M | 84 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r2.score.md` | M | 66 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r3.external.txt` | M | 88 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r3.gate.txt` | M | 74 | 0 |
| `pattern-guide/gate-logs/strategy/strategy-pattern.r3.score.md` | M | 74 | 0 |
| `pattern-guide/gate-logs/strategy/strategy.r4.external.txt` | M | 27 | 0 |
| `pattern-guide/gate-logs/strategy/strategy.r4.score.md` | M | 62 | 0 |
| `pattern-guide/gate-logs/strategy/strategy.r5.score.md` | M | 31 | 0 |
| `pattern-guide/gate-results.jsonl` | M | 44 | 0 |
| `pattern-guide/reference/accounting-model/accounting-model-ref_v1.0.0.html` | M | 720 | 0 |
| `pattern-guide/reference/accounting-model/accounting-model-ref_v1.0.0.md` | M | 218 | 0 |
| `pattern-guide/reference/accounting-model/accounting-model-ref_v1.0.1.html` | M | 724 | 0 |
| `pattern-guide/reference/accounting-model/accounting-model-ref_v1.0.1.md` | M | 222 | 0 |
| `pattern-guide/reference/accounting-model/diagrams/AccountingModelMap.tsx` | M | 66 | 0 |
| `pattern-guide/reference/accounting-model/diagrams/accounting-model-map.png` | B | 0 | 0 |
| `pattern-guide/reference/ddd-tactical-terms/ddd-tactical-terms-ref_v1.0.0.html` | M | 707 | 0 |
| `pattern-guide/reference/ddd-tactical-terms/ddd-tactical-terms-ref_v1.0.0.md` | M | 190 | 0 |
| `pattern-guide/reference/ddd-tactical-terms/ddd-tactical-terms-ref_v1.0.1.html` | M | 708 | 0 |
| `pattern-guide/reference/ddd-tactical-terms/ddd-tactical-terms-ref_v1.0.1.md` | M | 191 | 0 |
| `pattern-guide/reference/ddd-tactical-terms/diagrams/DddTacticalMap.tsx` | M | 144 | 0 |
| `pattern-guide/reference/ddd-tactical-terms/diagrams/ddd-tactical-map.png` | B | 0 | 0 |
| `pattern-guide/reference/gof-vocabulary/diagrams/GofVocabularyMap.tsx` | M | 140 | 0 |
| `pattern-guide/reference/gof-vocabulary/diagrams/gof-vocabulary-map.png` | B | 0 | 0 |
| `pattern-guide/reference/gof-vocabulary/gof-vocabulary-ref_v1.0.0.html` | M | 735 | 0 |
| `pattern-guide/reference/gof-vocabulary/gof-vocabulary-ref_v1.0.0.md` | M | 193 | 0 |
| `pattern-guide/reference/gof-vocabulary/gof-vocabulary-ref_v1.0.1.html` | M | 753 | 0 |
| `pattern-guide/reference/gof-vocabulary/gof-vocabulary-ref_v1.0.1.md` | M | 211 | 0 |
| `pattern-guide/reference/observation-model/diagrams/ObservationModelMap.tsx` | M | 70 | 0 |
| `pattern-guide/reference/observation-model/diagrams/observation-model-map.png` | B | 0 | 0 |
| `pattern-guide/reference/observation-model/observation-model-ref_v1.0.0.html` | M | 698 | 0 |
| `pattern-guide/reference/observation-model/observation-model-ref_v1.0.0.md` | M | 188 | 0 |
| `pattern-guide/reference/observation-model/observation-model-ref_v1.0.1.html` | M | 701 | 0 |
| `pattern-guide/reference/observation-model/observation-model-ref_v1.0.1.md` | M | 191 | 0 |
| `pattern-guide/research/accounting-context.md` | M | 187 | 0 |
| `pattern-guide/research/analysis-patterns.md` | M | 1711 | 0 |
| `pattern-guide/research/candidates.md` | M | 422 | 0 |
| `pattern-guide/research/gof-behavioral.md` | M | 1395 | 0 |
| `pattern-guide/research/gof-creational-structural.md` | M | 1214 | 0 |
| `scripts/assets/guide-tabs.js` | M | 114 | 0 |
| `scripts/assets/guide.css` | M | 439 | 0 |
| `scripts/audit-rolebox.ts` | M | 108 | 0 |
| `scripts/check-guides.py` | M | 2041 | 0 |
| `scripts/fixtures/analyzer/README.md` | M | 89 | 0 |
| `scripts/fixtures/analyzer/case2-optional-missing.ts` | M | 33 | 0 |
| `scripts/fixtures/analyzer/case3-required-missing.ts` | M | 41 | 0 |
| `scripts/fixtures/analyzer/case4-no-guide.ts` | M | 20 | 0 |
| `scripts/fixtures/analyzer/guide-strategy.md` | M | 24 | 0 |
| `scripts/fixtures/check/bad-analysis.md` | M | 107 | 0 |
| `scripts/fixtures/check/bad-gof.md` | M | 62 | 0 |
| `scripts/fixtures/check/compile-error-gof.md` | M | 207 | 0 |
| `scripts/fixtures/check/context-blank-analysis.md` | M | 95 | 0 |
| `scripts/fixtures/check/dangling-section-analysis.md` | M | 97 | 0 |
| `scripts/fixtures/check/diagrams/sample.png` | B | 0 | 0 |
| `scripts/fixtures/check/good-analysis.md` | M | 102 | 0 |
| `scripts/fixtures/check/good-gof.md` | M | 197 | 0 |
| `scripts/fixtures/check/good-ref.md` | M | 38 | 0 |
| `scripts/fixtures/check/locator-gof.md` | M | 197 | 0 |
| `scripts/fixtures/check/min-basis-gof.md` | M | 189 | 0 |
| `scripts/fixtures/check/min-bypass-gof.md` | M | 192 | 0 |
| `scripts/fixtures/check/ref-locator.md` | M | 38 | 0 |
| `scripts/fixtures/check/ref-serves-missing.md` | M | 38 | 0 |
| `scripts/fixtures/check/scenario-ref-missing-gof.md` | M | 197 | 0 |
| `scripts/fixtures/check/scenario-short-gof.md` | M | 189 | 0 |
| `scripts/fixtures/check/shared-a.md` | M | 12 | 0 |
| `scripts/fixtures/check/shared-b-diff.md` | M | 12 | 0 |
| `scripts/fixtures/check/shared-b.md` | M | 12 | 0 |
| `scripts/fixtures/check/singleton-defect.md` | M | 223 | 0 |
| `scripts/fixtures/check/spec-analysis.json` | M | 136 | 0 |
| `scripts/fixtures/check/spec-gof.json` | M | 127 | 0 |
| `scripts/fixtures/check/spec-reference.json` | M | 62 | 0 |
| `scripts/fixtures/render/edge-cases.md` | M | 91 | 0 |
| `scripts/fixtures/render/sample-gof.md` | M | 195 | 0 |
| `scripts/lint-diagrams.ts` | M | 517 | 0 |
| `scripts/package-lock.json` | M | 2542 | 0 |
| `scripts/render-core.ts` | M | 358 | 0 |
| `scripts/render-guides.py` | M | 1081 | 0 |
| `scripts/render-viz.ts` | M | 208 | 0 |
| `viz/frame/domain-model.tsx` | M | 494 | 0 |
| `viz/frame/frame.tsx` | M | 651 | 0 |
| `viz/style-guide/audit.cli.ts` | M | 30 | 0 |
| `viz/style-guide/audit.test.ts` | M | 117 | 0 |
| `viz/style-guide/audit.ts` | M | 203 | 0 |
| `viz/style-guide/derive.ts` | M | 73 | 0 |
| `viz/style-guide/index.ts` | M | 13 | 0 |
| `viz/style-guide/oklch.ts` | M | 117 | 0 |
| `viz/style-guide/resume.ui.ts` | M | 286 | 0 |
| `viz/style-guide/resume.viz.tsx` | M | 498 | 0 |
| `viz/style-guide/text-metrics.ts` | M | 32 | 0 |
| `viz/style-guide/tokens.ts` | M | 140 | 0 |
| `"\353\224\224\354\236\220\354\235\270 \355\214\250\355\204\264 \352\260\200\354\235\264\353\223\234 \355\205\234\355\224\214\353\246\277 \354\236\221\354\204\261\354\235\204 \354\234\204\355\225\234 \354\260\270\354\241\260 \353\254\270\354\204\234.md"` | M | 9 | 0 |

**롤백 태그 4개**

```text
kan/KAN-001-YXTC2C/S1
kan/KAN-001-YXTC2C/S2
kan/KAN-001-YXTC2C/S3
kan/KAN-001-YXTC2C/batch1
```

## 2. 검증 — 기준과 실행 결과

<!-- 기준은 카드 실행 문서 「검증」 절의 사본이다. 정본은 KANBAN/cards/KAN-001-YXTC2C.md 이므로
     기준이 바뀌면 그쪽을 고치고 review-init --refresh 로 이 항만 다시 뜬다.
     결과는 착수한 쪽이 이미 돌린 것이다 — 검토자에게 다시 돌리라고 시키지 않는다.
     **다시 돌려 아래와 다르게 나오면 그 자체가 반려 사유다.** -->

**기준**

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
ls pattern-guide/design-pattern-guide/*/*-guide_v*.md | grep -v v0.1.0 | xargs grep -l '^### 디자인 패턴을 충족하는 최소 조건' | wc -l      # 24
ls pattern-guide/ddd-analysis-pattern-guide/*/*-guide_v*.md | grep -v v0.1.0 | xargs grep -l '^### 디자인 패턴을 충족하는 최소 조건' | wc -l  # 12
python3 scripts/check-guides.py --links PATTERNS.md README.md pattern-guide/ddd-analysis-pattern-guide/README.md
python3 scripts/check-guides.py --pointers     # 인덱스 셋이 가리키는 자리가 전부 최신 발행본인가 (2026-09-30 추가 — dirs.index 가 목록이 되기 전에는 분석 인덱스가 검사 밖이었다)
diff -rq .claude/skills .agents/skills ; git status --porcelain ; git tag --list 'kan/KAN-001-YXTC2C/*' | wc -l
python3 ~/.claude/skills/manage-kanban/scripts/kanban.py validate .            # errors 0
python3 ~/.claude/skills/manage-kanban/scripts/kanban.py batch-status . --card <각 하위>
```

> **위 두 줄의 기대값이 23·10 이 아닌 이유** (2026-09-30 실측). 한 편이 폴더 하나를 갖는 구조로 바뀌어 `design-pattern-guide/*.md` 는 이제 아무것도 매치하지 않는다 — 옛 명령은 실행조차 안 되고 `wc -l` 이 0 을 내므로 **통과로 오해된다.** 그리고 파일 수는 편 수보다 많다: 파일럿으로 먼저 쓴 v1.0.0 과 개정 v1.1.0 이 함께 남은 편이 GoF 에 하나(strategy), 분석 패턴에 둘(account·quantity)이다. 최신본만 세면 23·10 이 맞고, 위 명령은 **파일을 세므로** 24·12 다. 최신본이 무엇인지는 인덱스(`PATTERNS.md`)가 가리키는 판으로 확인한다.

**work 단위로만 실행**(외부 모델 호출): `bash $PLUGIN/scripts/review-external.sh --axes scripts/review-axes-pattern.md <f>`. 결과는 `pattern-guide/gate-results.jsonl`에 남고 발행 카드는 `--gates`로 센다.

**사람만 판정할 것(검토서 판단 항목)**: ① 분석 10편의 상황 설정 표가 배경 확정안·DDD 원칙과 일치하는가 ② 비교 절의 대상 선정(PATTERNS.md "빠른 비교 페어" 전부 포함?) ③ 개요가 직관적인가(파일럿으로) ④ 존댓말 voice 승인 ⑤ 기존 절 넷 처분 ⑥ 추가 패턴 채택·문서1 처분·`.agents` 처분·4언어 하니스와 `analysis/` 처분(기본 유지) ⑦ analyzer 실행 시 기준 출처가 가이드 경로인가.

**완료 조건**: 하위 6장 전부 완료 + 위 결정론적 검증 전부 0 + 검토서 승인 → main 병합 → 워크트리·브랜치 정리.

**실행 결과**

```text
착수 직전 커밋 b62d572 기준, 2026-09-30 에 메인이 워크트리에서 직접 실행한 결과다. 검토자가 같은 명령을 다시 돌릴 필요는 없다.

[authoring-kit 0.3.0]  네 명령 전부 종료코드 0
  status / lock(드리프트 없음) / validate --all("통과 — 갈래 위반 0 · waiver 타깃 정상 · 참조 해소 정상")
  resolve --frozen  gof-guide · analysis-guide 둘 다 0

[check-guides.py]  여덟 모드 전부 종료코드 0, 전부 "전체: 통과"
  --spec-shared   두 spec.md 공유 블록 동일
  --all           헤딩 순서 · placeholder 0 · scan_ai_style B+ · mermaid · 상대 링크 · [필수]/[선택]
  --compile       구현 절 3언어 블록 javac(21) / tsc --noEmit / rustc 전부 0
  --run           3언어 출력이 글자 단위로 동일
  --gates         gate-results.jsonl verdict PASS · resolve 해시 = 현재 lock
  --derived       HTML 전편 fresh
  --pointers      인덱스가 가리키는 자리가 전부 최신 발행본
  --links         PATTERNS.md · README.md · 분석 인덱스 깨짐 0

[구조]
  최소 조건 절 보유:  GoF 파일 24(= 23편 + strategy 파일럿 v1.0.0) · 분석 파일 12(= 10편 + account·quantity 파일럿)
  status: legacy 구본 33편 — analyzer 가 기준으로 쓰지 않는다
  diff -rq .claude/skills .agents/skills  출력 없음
  git tag kan/KAN-001-YXTC2C/*  4건
  kanban validate  errors 0 · warnings 3

[메인이 대신 확인한 판단 항목]  아래 3항의 ①②⑦ 에 결과를 붙였다.
```

## 3. 판단 항목 — 스크립트가 판정할 수 없는 것

<!-- 스크립트가 판정할 수 없는 것만 적는다 — 값의 진위, 선택지 중 하나를 고른 근거,
     범위를 그은 자리. 2항에서 이미 돌아간 검증을 여기 옮겨 적지 않는다.
     한 줄 형식: 체크박스 하나에 의견 하나 — "<주제> — <지금 고른 값과 그 근거>".
     **의견마다 상세가 따라붙고, 상세는 조각 둘이다** — `**배경**` 과 `**정할 것**` 이
     각각 단독 줄이다(없거나 하나뿐이면 종료코드 12). 검토자는 이 카드를 수행하지
     않았으므로 내부 기호(`L10`·`P5`·`S8`)만 던지면 판정할 재료가 없고, 재료가 있어도
     줄글 한 덩이면 필요한 부분만 골라 읽지 못한다.
       **배경** — 무엇이 문제인가. `- ` 목록으로, 항목 하나에 사실 하나. 기호를 풀어 쓰고
         항목 끝에 `원문: 파일:줄` 이나 링크를 건다. ①②… 로 늘어놓을 것은 항목으로 가른다.
         목록이 없으면 종료코드 12 — 줄글은 화면에서 한 문단으로 붙는다.
       **정할 것** — 정할 것 한 줄. 그 아래 갈래마다 대가와 결과를 표로 단다:
         | 선택지 | 대가 | 그러면 어떻게 되는가 |
       추천은 선택지 셀 맨 앞의 `**추천** ` 접두다. 고를 것이 없는 항목이면 표를 비운다.
     **올리기 전에 둘을 본다.** ① 이 의견이 카드 의도(원문·목적·이유·목표)와 이어지는가
     — 이어지지 않으면 올리지 않는다. 문제를 위한 문제는 판단 항목이 아니라 별도 카드다.
     ② 지시 원본보다 낮은 레이어로 내려가지 않았는가 — 유저가 제품 관점으로 지시했는데
     플래그 이름·함수 이름을 묻고 있으면 서술을 고칠 것이 아니라 올릴 것이 아니다.
     (SKILL.md 5.6 「판단 항목에 무엇을 올리는가」)
     비어 있으면 "기계가 다 판정했고 사람이 정할 것이 없다"는 뜻이다. 그 판단도
     착수한 쪽이 하는 것이지 검토자가 빈칸을 보고 추측할 일이 아니다.
     **승계 절(3-0)이 있으면 그것이 먼저 온다** — 다른 검토서에서 넘어온 의견이고,
     판정은 승계를 받은 이 문서 하나에서만 내려진다. -->

**의견마다 판정과 추가 의견이 따로 붙습니다.** 판정은 상태이고 추가 의견은 말입니다 — 승인/반려를 아직
안 정했어도 의견 하나에만 추가 의견을 달 수 있고, 반대로 의견 하나만 먼저 닫을 수도 있습니다.
`<번호>`는 의견 순서이고, 주제의 문구 일부로도 찾습니다.

```
# 판정 — 승인 · 반려 · 철회
python3 scripts/kanban.py review-judge <project-root> --card KAN-001-YXTC2C --item <번호> --verdict 승인
# 추가 의견
python3 scripts/kanban.py review-note <project-root> --card KAN-001-YXTC2C --item <번호> --text "<추가 의견>"
# 추가 의견을 반영하다 새 의견이 생겼으면 (맨 뒤에 붙어 앞 번호가 안 밀립니다)
python3 scripts/kanban.py review-item <project-root> --card KAN-001-YXTC2C --add "<주제>
  <상세>"
```

**전체 승인은 살아있는 항목이 전부 승인일 때만 섭니다**(철회는 분모에서 빠집니다). 하나라도
반려·추가 의견·미정이면 4항의 전체 승인도 `→ 완료` 이동도 종료코드 14로 거부됩니다.

- [ ] ① 회계 배경 확정안을 「유저 확정」으로 못 박을지
    - **배경**
      - 확정안에 의존하는 것은 `account`·`transaction`·`posting-rule` 세 편뿐이고 나머지 일곱 편은 회계가 아닌 다른 도메인이라 무관하다 (메인이 10편 전수 확인)
      - 세 편 모두 확정안을 근거로 인용하며 불변식을 `I1`~`I6` 번호로 쓴다 — 인용 횟수 account 4 · transaction 4 · posting-rule 6 (메인 실측)
      - 확정안 자신이 「이 문서 전체가 잠정인지 유저 확정인지는 위 기록 어긋남 그대로 남아 있다」고 적는다. 원문: pattern-guide/research/accounting-context.md 11절
      - `.1` 카드 수행 내역은 「회계 배경 확정안(잠정)」, `.5` 카드 전략 17행은 「유저 확정」이라 적어 둘이 어긋난다. 원문: KANBAN/cards/KAN-001.5-6HF35H.md:17
      - 발행된 `account-guide_v1.1.0.md`(게이트 PASS · `status: published`)가 이미 이 문서를 근거로 인용한다 — 실무상 확정으로 돌아가고 있고, 바뀌면 회계 3편이 함께 개정 대상이 된다
    - **정할 것**
      이 문서를 「유저 확정」으로 못 박습니까, 아니면 「잠정」으로 두고 회계 3편에 그 사실을 표기합니까.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] ② 「빠른 비교가 자주 필요한 페어」 다섯의 선정이 타당한가
    - **배경**
      - 페어는 다섯이다 — Factory Method↔Abstract Factory · Strategy↔State · Adapter↔Decorator↔Proxy · Builder↔Abstract Factory · Mediator↔Facade. 원문: PATTERNS.md:72
      - 양쪽 편이 서로를 비교 절에서 다루는지 14방향을 전수 대조했고 누락 0 이다 (메인 실측)
      - 이번에 그 다섯 쌍을 코드로 검증했더니 전부 동시 통과했다 — 두 패턴의 `[필수]` 를 모두 만족하는 코드가 실제로 컴파일되고 실행된다 (워커 셋이 지었고 메인이 12개를 독립 재실행)
      - Builder↔Abstract Factory 는 막는 조건이 하나도 없어 `[필수]` 만으로는 아예 갈라지지 않는다 (메인 실측)
      - 즉 이 다섯은 「헷갈린다」가 아니라 「조건만으로는 갈라지지 않는다」가 실측으로 확인된 쌍이다
    - **정할 것**
      이 다섯 말고 더 넣어야 할 페어가 있습니까. 알려 주시면 같은 방식으로 코드 검증을 붙이겠습니다.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] ③ 개요 절이 직관적인가
    - **배경**
      - 「직관적인가」는 기계가 못 재는 값이라 사람에게 남는 항목이다
      - 읽을 파일럿은 셋이다. 원문: pattern-guide/design-pattern-guide/singleton/singleton-guide_v1.0.0.md
      - 나머지 둘은 `account-guide_v1.1.0.md` 와 `quantity-guide_v1.1.0.md` 다. 원문: pattern-guide/ddd-analysis-pattern-guide/account/account-guide_v1.1.0.md
      - 보는 자리는 각 편의 첫 절(개요)이고, 기준은 「이 패턴이 무엇을 해결하는가」가 원전 용어 없이 한 번에 읽히는지다
    - **정할 것**
      그대로 갑니까, 아니면 개요 절의 기준을 명세에 더 적어 33편을 다시 손봅니까.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] ④ 존댓말 voice(`ppangtolab-teacher`) 승인
    - **배경**
      - 2026-09 세션에서 「문체: 존댓말, 섞어서」로 지시받아 33편 전부에 적용했다 — 합쇼체와 해요체를 섞어 쓴다
      - resolve 해시가 게이트 기록에 박혀 있다 — `gof-guide 64a1b7cbbe60b81f` · `analysis-guide adbe0518cf3c3222`. 원문: pattern-guide/gate-results.jsonl
      - 33편이 모두 이 voice 로 서 있어 바꾸면 전편 재집필이다
    - **정할 것**
      발행본을 한 편 읽고 이 문체로 확정합니까.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] ⑤ 구본 33편(`status: legacy`)의 처분
    - **배경**
      - 명세 1.2.0 이전의 구 9섹션 골격으로 쓰인 옛 판이고 최신본과 같은 폴더에 `*_v0.1.0.md` 로 남아 있다
      - 머리말에 `status: legacy` 가 붙은 파일이 33개다 (메인 실측)
      - analyzer 계약이 `status: legacy` 를 기준 문서로 쓰지 않는다. 원문: .claude/skills/design-pattern-analyzer/SKILL.md:25
      - 인덱스도 최신본만 가리키므로 지워도 기능은 안 바뀐다 (`--pointers` 통과로 확인)
      - 남겨 둔 이유는 루트 참조 문서가 어느 틀에서 나왔는지 읽을 자리가 필요해서다
    - **정할 것**
      지웁니까, `status: legacy` 인 채로 둡니까.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] ⑥ 추가 패턴 4편의 채택
    - **배경**
      - 후보는 Specification · Temporal Property · Dependency Injection · Null Object 넷이다
      - 후보마다 출처·기존 33편과의 경계·필요 spec 이 적혀 있다. 원문: pattern-guide/research/candidates.md
      - 카드 `KAN-001.7-4MRJ1B`(추가 패턴 4편)가 백로그에 서서 이 결정을 기다린다
      - 루트 완료 조건이 「하위 전부 완료」라, 채택하면 `.7` 을 착수하고 채택하지 않으면 `.7` 을 보관한 뒤 루트가 완료로 간다 — 이 검토서에서 가장 앞에 오는 결정이다
      - 같은 묶음의 나머지 셋은 끝났다 — 문서1 처분은 2026-09-29 에 「정정」으로 결정받았고, `.agents` 는 `diff` 0 이며, 하니스와 `analysis/` 는 유지하고 README 에 「가이드 예시 코드와 별개」를 명시했다
    - **정할 것**
      넷 전부 채택 / 일부만 채택(어느 것) / 채택하지 않음.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._

- [ ] ⑦ analyzer 를 실제로 한 번 돌려 볼지
    - **배경**
      - `SKILL.md` 2단계가 `pattern-guide/design-pattern-guide/<슬러그>/<슬러그>-guide_v<버전>.md` 를 1순위 기준으로 적는다. 원문: .claude/skills/design-pattern-analyzer/SKILL.md:23
      - 표본 셋(singleton · factory-method · chain-of-responsibility)으로 실제 파일이 그 경로에 잡히는 것을 확인했다 (메인 실측)
      - 확인 안 한 것이 있다 — analyzer 를 실제로 실행해 리포트 메타의 「평가 기준 출처」 줄을 눈으로 보지는 않았다
      - 이번 `S8` 에서 계약을 크게 고쳤다(경쟁 후보 대조 5단계 신설 · 검사 규칙 넷 추가) — 고친 계약이 실제로 도는지는 돌려 봐야 안다
    - **정할 것**
      실행 검증을 붙입니까. 붙인다면 대상 코드를 정해 주시면 제가 돌리고 결과를 이 검토서에 덧붙이겠습니다.

    > **판정** — _아직 없습니다._

    > **추가 의견** — _아직 없습니다._


## 4. 판정

<!-- 문서 하나에 대한 판정이다. **항목별로 갈리는 말은 여기 적지 않는다** — 3항 각 의견의
     「판정」과 「추가 의견」이 그 자리다. 여기 남는 것은 그 항목들이 전부 승인으로 닫혔다는
     사실 하나뿐이다.
     아래 「판정 이력」은 **덧붙기만 하는 이력**이다. 왕복이 돌면 줄이 쌓이고, 그것이 이 문서가
     무엇을 거쳐 승인에 닿았는지의 전부다 — 지우지 않는다. **판정에는 사유 칸이 없다** —
     승인은 대체로 덧붙일 말이 없고, 있다면 그것은 문서 전체가 아니라 그 항목에 대한
     말이라 3항의 「추가 의견」이 받는다.
     `review-judge --card KAN-001-YXTC2C --verdict 승인` 이 이 자리를 쓰고
     frontmatter 의 status 도 함께 고친다. 손으로 적어도 되지만, 그때는 수렴 검사를
     안 거치므로 `validate` 가 항목 판정과 어긋난 승인을 error 로 잡는다. -->

**판정**: (아직 없습니다)

**판정 이력**:

- 승인이면 → `apply --op move --id KAN-001-YXTC2C --to done` 뒤에 `main` 병합과 워크트리 정리(출력의 `cleanup`)
- 반려면 → `apply --op move --id KAN-001-YXTC2C --to doing` 뒤에 `doc-log --entry "<반려 사유>"`.
  요청서는 **지우지도 다시 뜨지도 않는다** — 고친 뒤 그 항목을 `review-judge --verdict 승인` 으로
  뒤집으면 같은 문서에서 수렴한다. 1·2항이 낡았으면 `review-init --refresh` 로 그 두 항만 간다.

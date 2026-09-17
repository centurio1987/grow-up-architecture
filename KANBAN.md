# KANBAN — design-pattern-guide

> hyper plan 보드. 앱 기능 백로그가 아니라 프로젝트 차원의 계획을 유저·AI가 공동 관리한다.
> 카드 메타(생성/최종/갱신)는 manage-kanban 스킬이 관리한다. 규칙은 스킬 SKILL.md를 따른다.

## 백로그
<!-- 아직 착수 결정 전. 우선순위 미정 후보 풀. 백로그→할 일 이동이 "할지 고민" → "하기로 확정" 전환점. -->
- `KAN-001-YXTC2C` 전체 가이드 재집필 — 생성:유저 · 최종:ai · 갱신:2026-09-17
  - 짧은 제목: 가이드 재집필
  - 목적: pattern-guide/ 아래 패턴 가이드 33편(GoF 23 + DDD 분석 패턴 10)을 처음부터 다시 쓴다
  - 이유: 현재 33편은 용어 정의 절이 없고 DDD 가이드가 aggregate 경계를 정의하지 않은 채 경계를 암시하는 코드를 실어 기준 문서로 쓸 수 없다
  - 목표: authoring-kit spec 2종으로 33편을 다시 써 게이트 PASS, analyzer·인덱스가 새 가이드를 가리킨다
  - 요청서: KANBAN/requests/backlog/KAN-001-YXTC2C.request.md (자유 형식 · 유저)
  - 실행 문서: KANBAN/cards/KAN-001-YXTC2C.md (0/1 · 최근 09-17)
  - 원문:
    ```text
    전체 가이드 재집필을 수행해라.
    ```
- `KAN-001.1-P5N9NF` 리서치와 후보 조사 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (백로그)
  - 짧은 제목: 리서치와 후보 조사
  - 목적: 33편 집필이 편마다 처음부터 검색하지 않도록 패턴군별 리서치 노트와 추가 패턴 후보 목록을 만든다
  - 이유: 워커가 편마다 같은 원전을 다시 뒤지면 33번 중복되고, 후보 채택은 유저 몫이라 먼저 물어야 한다
  - 목표: pattern-guide/research/ 노트 4건(주장·출처·원전 위치·미해결 질문) + 후보 보고서 + 회계 배경 확정안, 유저 결정 접수
- `KAN-001.2-4NWK0T` authoring-kit 정착 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (백로그)
  - 짧은 제목: authoring-kit 정착
  - 목적: spec 2종·paths·lock·이해 게이트·외부 검토 축·검사기·렌더러·진입 스킬을 세워 규칙 정본을 플러그인으로 옮긴다
  - 이유: 규칙이 SKILL.md 산문에 있으면 33편이 갈라지고, 게이트가 없으면 통과 기준이 없다
  - 목표: validate --all 통과, lock 고정, 두 spec resolve --frozen CONFLICT 0, check-guides·render-guides 동작, 이해 게이트가 결함 문서를 탈락시킴, analyzer 회귀 4건 통과

## 할 일

## 진행 중

## 검토

## 완료

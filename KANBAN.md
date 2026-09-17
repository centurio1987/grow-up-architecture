# KANBAN — design-pattern-guide

> hyper plan 보드. 앱 기능 백로그가 아니라 프로젝트 차원의 계획을 유저·AI가 공동 관리한다.
> 카드 메타(생성/최종/갱신)는 manage-kanban 스킬이 관리한다. 규칙은 스킬 SKILL.md를 따른다.

## 백로그
<!-- 아직 착수 결정 전. 우선순위 미정 후보 풀. 백로그→할 일 이동이 "할지 고민" → "하기로 확정" 전환점. -->
- `KAN-001.4-BJT8JD` GoF 22편 재집필 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (진행 중)
  - 짧은 제목: GoF 22편 재집필
  - 목적: 나머지 GoF 22편을 gof-guide spec으로 다시 쓴다
  - 이유: 요청서의 재집필 본체이고 analyzer가 읽는 최소 조건이 여기서 갱신된다
  - 목표: 22편 게이트 PASS, 헤딩·placeholder·mermaid·컴파일 검사 0 오류, analyzer 스팟체크 통과
  - 실행 문서: KANBAN/cards/KAN-001.4-BJT8JD.md (0/22 · 최근 09-17)
- `KAN-001.5-6HF35H` 분석 패턴 8편 재집필 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (진행 중)
  - 짧은 제목: 분석 패턴 8편 재집필
  - 목적: 나머지 8편을 analysis-guide spec으로 다시 쓰고 consideration 2편과 정합시킨다
  - 이유: 회계 3부작이 aggregate 경계 정의 없이 쓰여 독자를 오도한다
  - 목표: 8편 PASS, 회계 3부작 동일 배경 인용, consideration 교차 참조·모순 0
  - 실행 문서: KANBAN/cards/KAN-001.5-6HF35H.md (0/9 · 최근 09-17)
- `KAN-001.6-HB5NH9` 인덱스·stale 정리·최종 검증 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (진행 중)
  - 짧은 제목: 인덱스·stale 정리·최종 검증
  - 목적: 인덱스 3종과 README를 새 구조에 맞추고, 4언어 실행 하니스의 처분을 정해 반영하고, 전체 검증을 돌려 검토서를 만든다
  - 이유: 링크가 깨진 인덱스는 재집필을 보이지 않게 하고, README가 선언한 4언어 실습 환경과 세 언어 가이드가 어긋난 채 두면 다음 사람이 틀린 쪽을 따른다
  - 목표: 링크 깨짐 0, 33편 검사 0 오류, HTML 33편 fresh, 하니스·analysis/ 처분 반영(기본 유지 + README 표 개정), 검토서 승인
  - 실행 문서: KANBAN/cards/KAN-001.6-HB5NH9.md (0/3 · 최근 09-17)

## 할 일

## 진행 중
- `KAN-001-YXTC2C` 전체 가이드 재집필 — 생성:유저 · 최종:ai · 갱신:2026-09-17
  - 짧은 제목: 가이드 재집필
  - 목적: pattern-guide/ 아래 패턴 가이드 33편(GoF 23 + DDD 분석 패턴 10)을 처음부터 다시 쓴다
  - 이유: 현재 33편은 용어 정의 절이 없고 DDD 가이드가 aggregate 경계를 정의하지 않은 채 경계를 암시하는 코드를 실어 기준 문서로 쓸 수 없다
  - 목표: authoring-kit spec 2종으로 33편을 다시 써 게이트 PASS, analyzer·인덱스가 새 가이드를 가리킨다
  - 요청서: KANBAN/requests/doing/KAN-001-YXTC2C.request.md (자유 형식 · 유저)
  - 실행 문서: KANBAN/cards/KAN-001-YXTC2C.md (0/6 · 최근 09-17)
  - 계획 리포트: KANBAN/reports/KAN-001-YXTC2C.report.html (낡음)
  - 원문:
    ```text
    전체 가이드 재집필을 수행해라.
    ```
- `KAN-001.3-Q6FYKP` 파일럿 3편과 회고 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (진행 중)
  - 짧은 제목: 파일럿 3편과 회고
  - 목적: Strategy·Account·Quantity 1편씩(GoF / 회계 aggregate / 값 객체 계열) 전체 파이프라인을 통과시키고 spec·게이트·배치 크기를 개정한다
  - 이유: 명세는 산출물로 검증되기 전엔 추정이고, 30편을 틀린 명세로 쓰면 되돌리는 비용이 크다
  - 목표: 3편 PASS(H축 0) + HTML 탭 렌더, spec 1.1 + exemplar 3건 + batch_size_works 확정, 유저의 문체·HTML 화면 승인, .4·.5·.6 배치 문서 생성
  - 실행 문서: KANBAN/cards/KAN-001.3-Q6FYKP.md (0/1 · 보류 3 · 최근 09-17)

## 검토
- `KAN-001.2-4NWK0T` authoring-kit 정착 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (진행 중)
  - 짧은 제목: authoring-kit 정착
  - 목적: spec 2종·paths·lock·이해 게이트·외부 검토 축·검사기·렌더러·진입 스킬을 세워 규칙 정본을 플러그인으로 옮긴다
  - 이유: 규칙이 SKILL.md 산문에 있으면 33편이 갈라지고, 게이트가 없으면 통과 기준이 없다
  - 목표: 규칙 정본이 spec 2종으로 서고 게이트·검사기·렌더러가 동작해 파일럿을 받을 수 있다
  - 실행 문서: KANBAN/cards/KAN-001.2-4NWK0T.md (6/6 · 최근 09-17)
  - 검토 문서: KANBAN/reviews/KAN-001.2-4NWK0T.review.md (승인 0/7 · 검토 대기)
- `KAN-001.1-P5N9NF` 리서치와 후보 조사 — 생성:ai · 최종:ai · 갱신:2026-09-17
  - 상위: `KAN-001-YXTC2C` (진행 중)
  - 짧은 제목: 리서치와 후보 조사
  - 목적: 33편 집필이 편마다 처음부터 검색하지 않도록 패턴군별 리서치 노트와 추가 패턴 후보 목록을 만든다
  - 이유: 워커가 편마다 같은 원전을 다시 뒤지면 33번 중복되고, 후보 채택은 유저 몫이라 먼저 물어야 한다
  - 목표: pattern-guide/research/ 노트 4건(주장·출처·원전 위치·미해결 질문) + 후보 보고서 + 회계 배경 확정안, 유저 결정 접수
  - 실행 문서: KANBAN/cards/KAN-001.1-P5N9NF.md (4/4 · 최근 09-17)
  - 검토 문서: KANBAN/reviews/KAN-001.1-P5N9NF.review.md (승인 0/8 · 검토 대기)

## 완료

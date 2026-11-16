# 시스템 설계 사례 가이드 인덱스

문제(요구) 하나마다 그 문제를 가장 잘 푸는 시스템 구조를 한 편으로 보이는 가이드 모음입니다. 각 편은 명세 `system-design-guide`(`.claude/authoring/specs/system-design-guide/`)의 절 구성을 따라 시스템 개념도 · 시나리오 · 개념도에 든 기술의 설명 · 세 언어(Java · TypeScript · Rust) 구현 코드를 담습니다.

패턴 가이드가 해법 하나를 한 편으로 다룬다면, 이 계열은 요구 수치가 주어졌을 때 어떤 구조를 왜 고르는지를 한 편으로 다룹니다. 편마다 붙은 사례 번호(`RT-01` 등)와 계열 이름은 사례 목록 [system-design-cases-2026-11-13.md](../research/system-design-cases-2026-11-13.md) 2절의 것입니다.

> GoF 디자인 패턴 인덱스: [PATTERNS.md](../../PATTERNS.md) · 분석 패턴 인덱스: [README.md](../ddd-analysis-pattern-guide/README.md)

## RT 실시간 전달

같은 값이나 메시지를 많은 연결에 빠르게 보내야 하는 문제입니다.

| 사례 | 문제 | 고른 구조 | 가이드 |
| --- | --- | --- | --- |
| RT-01 | 라이브 동시 시청자 수 | 연결을 가진 에지가 세고, 합계는 1초에 한 번 모두에게 보냄 | [live-viewer-count-guide_v1.1.0.md](live-viewer-count/live-viewer-count-guide_v1.1.0.md) |

## CT 경합과 정합성

여러 요청이 같은 자원을 동시에 차지하려 하고, 결과가 한 건도 틀리면 안 되는 문제입니다.

| 사례 | 문제 | 고른 구조 | 가이드 |
| --- | --- | --- | --- |
| CT-01 | 선착순 쿠폰 발급 | 판정은 Redis 명령 하나씩, 기록은 큐 뒤에서, 마지막 확인은 DB 유니크 제약 | [first-come-coupon-guide_v1.1.0.md](first-come-coupon/first-come-coupon-guide_v1.1.0.md) |

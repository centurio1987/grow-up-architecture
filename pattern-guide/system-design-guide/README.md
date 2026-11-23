# 시스템 설계 사례 가이드 인덱스

문제(요구) 하나마다 그 문제를 가장 잘 푸는 시스템 구조를 한 편으로 보이는 가이드 모음입니다. 각 편은 명세 `system-design-guide`(`.claude/authoring/specs/system-design-guide/`)의 절 구성을 따라 시스템 개념도 · 시나리오 · 개념도에 든 기술의 설명 · 세 언어(Java · TypeScript · Rust) 구현 코드를 담습니다.

패턴 가이드가 해법 하나를 한 편으로 다룬다면, 이 계열은 요구 수치가 주어졌을 때 어떤 구조를 왜 고르는지를 한 편으로 다룹니다. 편마다 붙은 사례 번호(`RT-01` 등)와 계열 이름은 사례 목록 [system-design-cases-2026-11-13.md](../research/system-design-cases-2026-11-13.md) 2절의 것입니다.

> GoF 디자인 패턴 인덱스: [PATTERNS.md](../../PATTERNS.md) · 분석 패턴 인덱스: [README.md](../ddd-analysis-pattern-guide/README.md)

## RT 실시간 전달

같은 값이나 메시지를 많은 연결에 빠르게 보내야 하는 문제입니다.

| 사례 | 문제 | 고른 구조 | 가이드 |
| --- | --- | --- | --- |
| RT-01 | 라이브 동시 시청자 수 | 연결을 가진 에지가 세고, 합계는 1초에 한 번 모두에게 보냄 | [live-viewer-count-guide_v1.1.1.md](live-viewer-count/live-viewer-count-guide_v1.1.1.md) |
| RT-03 | 대형 그룹 채팅 | 방 프로세스 한 곳이 순번을 붙여 로그에 먼저 쓰고, 중계 서버는 그 방을 보고 있는 연결에만 보내며, 놓친 것은 마지막 순번 이후를 로그에서 읽음 | [large-group-chat-guide_v1.0.0.md](large-group-chat/large-group-chat-guide_v1.0.0.md) |

## CT 경합과 정합성

여러 요청이 같은 자원을 동시에 차지하려 하고, 결과가 한 건도 틀리면 안 되는 문제입니다.

| 사례 | 문제 | 고른 구조 | 가이드 |
| --- | --- | --- | --- |
| CT-01 | 선착순 쿠폰 발급 | 판정은 Redis 명령 하나씩, 기록은 큐 뒤에서, 마지막 확인은 DB 유니크 제약 | [first-come-coupon-guide_v1.1.1.md](first-come-coupon/first-come-coupon-guide_v1.1.1.md) |
| CT-03 | 티켓 예매와 좌석 선점 | 대기실이 입장 속도를 정하고, 좌석은 점유 번호와 만료 시각을 단 조건부 UPDATE 한 문장으로 붙잡음 | [ticket-seat-hold-guide_v1.0.0.md](ticket-seat-hold/ticket-seat-hold-guide_v1.0.0.md) |
| CT-05 | 결제 · 송금 중복 방지 | 멱등 키를 결제와 같은 트랜잭션에 쓰고, 결과를 모르는 결제는 실패 대신 「알 수 없음」으로 두어 같은 키로 다시 물음 | [payment-idempotency-guide_v1.0.0.md](payment-idempotency/payment-idempotency-guide_v1.0.0.md) |

## AG 집계와 근사

많은 이벤트를 모아 수를 내야 하고, 한 건도 틀리면 안 되는지 근사로 충분한지에 따라 구조가 갈리는 문제입니다.

| 사례 | 문제 | 고른 구조 | 가이드 |
| --- | --- | --- | --- |
| AG-03 | 광고 클릭 집계 | 클릭 ID 로 거른 뒤 클릭 시각 1분 창으로 세고, 결과는 (광고 ID, 분 시작) 을 결과 ID 로 삼아 체크포인트마다 트랜잭션으로 커밋해 결과 표가 덮어씀 | [ad-click-aggregation-guide_v1.0.0.md](ad-click-aggregation/ad-click-aggregation-guide_v1.0.0.md) |

## RD 읽기 증폭

읽기가 쓰기보다 훨씬 많아서, 보여 줄 결과를 읽을 때 모을지 쓸 때 미리 넣어 둘지에 따라 구조가 갈리는 문제입니다.

| 사례 | 문제 | 고른 구조 | 가이드 |
| --- | --- | --- | --- |
| RD-01 | 홈 타임라인 | 일반 계정의 글은 30일 안에 접속한 팔로워의 Redis 정렬 집합(글 ID, 최근 800개)에 미리 넣고, 큰 계정의 글은 읽을 때 섞으며, 페이지는 max_id · since_id 로 넘김 | [home-timeline-guide_v1.0.0.md](home-timeline/home-timeline-guide_v1.0.0.md) |

## IN 공통 부품

다른 문제들이 함께 쓰는 부품입니다. 부품 가운데 단독 문제로도 성립하는 것만 한 편으로 다룹니다.

| 사례 | 문제 | 고른 구조 | 가이드 |
| --- | --- | --- | --- |
| IN-01 | API 처리율 제한 | 리전마다 Redis 에서 Lua 한 번으로 근사 창을 세고, Redis 가 멈추면 서버마다 토큰 버킷으로 열어 둠 | [api-rate-limiting-guide_v1.0.0.md](api-rate-limiting/api-rate-limiting-guide_v1.0.0.md) |

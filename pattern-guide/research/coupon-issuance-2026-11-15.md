# 리서치 노트 — 선착순 쿠폰을 한정 수량만큼, 한 사람에 한 장씩 발급하기

- 조사일: 원재료 조사는 2026-11-13, 원문 대조는 2026-11-15 입니다. 원재료는 `.work/KAN-002.2-coupon-findings-2026-11-13.md`(커밋하지 않은 조사 보고)이고, 이 노트가 그것을 집필 입력으로 옮긴 정본입니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md)의 파일럿 2 편(`first-come-coupon`, 사례 목록 [CT-01](system-design-cases-2026-11-13.md)) 집필 입력입니다. 주장과 출처를 짝지어 두어 집필자가 같은 자료를 다시 찾지 않게 했습니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 원문 대조: 원재료는 대부분 요약 도구로 읽었습니다. 2026-11-15 에 출처 19곳의 원문 HTML 을 받아 본문에 실을 수치와 인용 문자열을 직접 찾았습니다. 출처마다의 대조 결과는 10절 표의 「원문 대조」 칸에 있고, 대조로 고친 것은 아래 「대조로 고친 것」에 모았습니다.
- 출처 번호는 `C` 로 시작합니다. 원재료의 `S1`~`S30` 과 번호가 같고 앞 글자만 바꿨습니다(칸반 단계 번호 `S1`~`S8` 과 헷갈리지 않게).

### 대조로 고친 것

1. **토스(C4)의 `INCR`** — 원재료는 토스가 `INCR` 로 선착순 상한을 센다고 적었습니다. 본문은 「Redis에서 지원하는 Increment 커맨드」라고만 쓰고, `INCR` 이라는 명령 이름은 독자 댓글에만 있습니다. 본문의 순서는 「지정된 Cap에 도달하였는지 체크 → 도달하지 못하였다면 리워드를 지급하고 Increment」입니다.
2. **SQS FIFO 고처리량 범위(C28)** — 원재료의 「리전별 4,500~70,000 TPS」는 아래 끝이 틀렸습니다. 원문은 London · São Paulo 가 4,500, 「All other AWS Regions」가 기본 2,400 TPS 입니다. 범위는 2,400~70,000 TPS 입니다.
3. **올리브영 TTL 버퍼(C3)** — 원재료의 「쿠폰 종료 + 버퍼」는 원문 코드에서 `couponEndTime.plusHours(1)`, 곧 쿠폰 종료 1시간 뒤입니다.
4. **올리브영 장애 지표(C8)** — 원재료의 「월 2~3회 → 0」「월 5~7건 → 0」은 원문 표기로 「월 평균 2-3회 → 0회」「월 평균 5-7건 Memory Critical 알람 → 0건」입니다. 원문에는 「평균 복구 시간 2시간 → 90초」도 있습니다.
5. **올리브영 일차별 미발급률(C3)** — 원재료는 최고 · 최저만 옮겼습니다. 원문은 7일 전부를 적었습니다(2절 표).

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.0.1) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 판정 · 4-2 중복 · 4-3 기록) |
| `detail.scenario` 시나리오 셋 | 5절(반례 여덟과 시나리오 배치) |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 정확도 행 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 10절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

선착순 쿠폰은 파일럿 1 의 시청자 수와 반대편에 있는 문제입니다. 시청자 수는 모두에게 같은 근삿값 하나를 자주 보내면 되지만, 쿠폰은 **틀리면 돈이나 신뢰가 바로 샙니다.** 한도를 넘겨 주면 회사 예산이 나가고(C5 「회사 예산을 사용하기 때문에 중복으로 제공하면 안 됩니다」), 성공이라고 답하고 실제로 주지 않으면 고객 문의로 이어집니다(C3). 그래서 요구사항의 정확도 행은 「과발급 0 · 미발급 0 · 한 사람 한 장」이 됩니다(판단 — 사례들이 실패로 다룬 셋을 요구로 옮긴 것).

공개 사례의 공통 해법은 **판정은 한 곳에서 원자적으로, 무거운 기록은 뒤로**입니다. 「아직 남았는가」와 「이 사람이 이미 받았는가」를 메모리 저장소(대부분 Redis)에서 한 번에 판정하고, DB 쓰기는 큐 뒤로 미뤄 속도를 조절합니다(C1 · C3 · C4 · C6). DB 의 유니크 제약은 마지막 방어선으로 남깁니다(판단, 근거 C19 · C21).

사례에서 되풀이되는 실패는 셋입니다. 확인과 차감을 두 명령으로 나눠 실행함(C3), 카운터를 복제본에서 읽음(C1), 잠금이 커밋보다 먼저 풀림(C2). 셋 다 코드가 멀쩡해 보이는데 동시에 들어온 요청 둘 사이에서만 틀린다는 점이 같습니다.

## 2. 요구사항 절에 쓸 근거 — "선착순"과 "정확히"를 숫자로

본문에 실을 수치는 이 표와 3절 표에서 고릅니다. 「원문 대조」가 「함」인 것만 본문에 인용합니다.

| 무엇 | 값 | 출신 | 원문 대조 |
| --- | --- | --- | --- |
| 배민 빼빼로데이 정원 · 혜택 | 선착순 1,111명 · 11,000원 할인쿠폰 | 출처 C1 | 함 |
| 배민 마감 시간 | 1.89초 | 출처 C1 | 함 |
| 배민 피크 배수 | 「이벤트 시스템이 받아낸 초당 트래픽은 평소 최대치의 100배」 | 출처 C1 | 함 |
| 배민 과발급 | 「1,111명보다 많은 수가 이벤트 당첨 기록에 남아 있었습니다」, 초과 인원은 글에 없음 | 출처 C1 | 함 |
| 올리브영 6월 세일 미발급률 | 7일간(05.31~06.06) 평균 약 0.014%(10,000건당 약 1.4건). 일차별 0.021 · 0.008 · 0.037 · 0.013 · 0.013 · 0.004 · 0.025% | 출처 C3 | 함 |
| 올리브영 부하 시험(한도 10,000건) | 개선 전 성공 응답 10,162건 · 미발급 162건(1.62%) → 개선 후 10,000건 · 0건(0%). 개발 환경이 운영보다 높은 부하라고 밝힘 | 출처 C3 | 함 |
| 올리브영 운영 검증 | 9월 세일 3일차까지 개선 기능을 끄고 4일차부터 켬 → 4일차부터 미발급 0건, 처리량 저하 없음 | 출처 C3 | 함 |
| 토스 요구 넷 | 중복 지급 금지 · 즉시 인지 · 원장 기록 · 선착순 탈락 시 미지급 | 출처 C4 | 함 |
| 카카오페이 중복 금지 이유 | 「회사 예산을 사용하기 때문에 중복으로 제공하면 안 됩니다」 | 출처 C5 | 함 |
| 응답 지연 목표 | 공개 수치 없음 | — | 확인 안 함 |

- 응답 지연을 수치로 약속한 공개 사례는 찾지 못했습니다(확인 안 함). 가이드는 응답 지연 목표를 (가정)으로 세우고 그렇다고 밝힙니다.
- 「선착순」의 뜻은 사례마다 조금씩 다릅니다. 토스는 로컬 카운팅 개선안을 두고 「Hard하게 Capping하는 방식은 아니어서 서비스에서 추구하는 선착순의 개념과 일치한지 확인해야 합니다」라고 적었습니다(C4). 가이드는 「한도 N 을 절대 넘지 않는다」를 하드 한도로 정의하고, 도착 순서와 발급 순서가 정확히 같아야 하는지는 다루지 않는 것에 둡니다(판단).
- 배민 2019 타임딜(C30)은 언론 보도라 **약한 근거**입니다. 배경으로만 쓰고 본문 근거로 쓰지 않습니다.

## 3. 규모 추정 절에 쓸 계산

| 무엇 | 값 | 출신 | 원문 대조 |
| --- | --- | --- | --- |
| 배민 평균 성공 속도 | 1,111명 ÷ 1.89초 ≈ 588건/초 | (계산) C1 | 입력 둘 다 함 |
| 배민 Node.js 한 대 | 「25,000 tps를 버틸 수 있는 것으로 알려져」, 글이 단순 조건이라고 밝힘 | 출처 C1 | 함 |
| 배민 구성 | Node.js 5대, Redis 마스터 1 + 복제본 2, 참여 기록 SQS, 후처리 EB Worker | 출처 C1 | 함 |
| 배민 부하 시험 | ELB 워밍업이 안 돼 50만 트래픽까지 주지 못함 | 출처 C1 | 함 |
| 토스 규모 | 피크 동시 접속 분당 수십만 명, 포인트 지급 API 초당 수십만 건, 그래프의 pod 100대 | 출처 C4 | 함 |
| 토스 API 묶기 | 셋을 `/view` 하나로 묶어 「피크 트래픽의 규모를 50%나」 줄임 | 출처 C4 | 함 |
| Redis 한 대(파이프라인 없음) | `SET` 180,180 req/s · 랜덤 키 100만 번 72,145 req/s | 출처 C16 예시 | 함 |
| Redis 한 대(파이프라인 16) | `SET` 1,536,098 req/s(MacBook Air 11") | 출처 C16 예시 | 함 |
| Redis 연결 수 | 연결 30,000 개면 100 개일 때 처리량의 절반 정도(경험칙) | 출처 C16 | 함 |
| SQS FIFO | 파티션당 300 TPS, 배치 쓰면 3,000 메시지/초, 고처리량 모드 리전별 2,400~70,000 TPS | 출처 C28 | 함(범위 정정) |
| 올리브영 2023 개선 | 3월 대비 6월 분당 최대 발급량 2.2배, 모든 쿠폰 1~2분 만에 소진 | 출처 C6 | 함 |
| 올리브영 대량 발급 | 약 1,500만 건 발급 중 브로커 정지, 새 브로커로 옮겨 약 30분 만에 정상화 | 출처 C8 | 함 |

- (계산) 배민의 588건/초는 **성공** 속도입니다. 요청은 그보다 훨씬 많았을 것이고, 요청 수 절대값은 글에 없습니다(확인 안 함).
- (가정 · 계산) 가이드의 규모 추정은 「정각에 사용자 P 명이 T 초 안에 누른다」에서 시작합니다. 예를 들어 P = 100만, T = 1초면 초당 100만 요청이고, 이는 파이프라인 없는 Redis 한 대 예시(`SET` 약 18만 req/s, C16)의 5배를 넘습니다. 벤치마크 조건이 달라 이 값을 한도로 쓰면 안 되지만, **쿠폰 하나가 키 하나라 나눠 받을 수 없다**는 점(핫 키)을 보이는 근거로는 쓸 수 있습니다(판단).
- (계산) 한도 N 을 넘는 요청은 모두 「소진」으로 끝납니다. 판정이 메모리에서 끝나면 소진된 뒤의 요청은 DB 까지 가지 않습니다(판단, 근거 C4 의 Kafka 비동기 기록).
- 토스 수치는 포인트 지급이라 쿠폰과 같지 않습니다(판단). 규모의 감을 주는 데만 씁니다.

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. "아직 남았는가"를 판정하는 법 — 원자 연산

- **`INCR`**: 1 을 더하고 더한 뒤의 값을 돌려줍니다. 키가 없으면 0 에서 시작하고, 64비트 부호 정수까지입니다. 문서가 카운터 패턴을 「atomic increment operations」로 소개합니다(C10, 원문 대조 함). 더한 값이 N 이하면 발급, 넘으면 소진으로 판정하면 확인과 차감이 한 명령이 됩니다(판단).
- **확인 후 차감의 경쟁**: 올리브영은 `GET` 으로 확인하고 `INCR` 로 올리는 두 명령 사이에서 경합이 생겼습니다. 「Redis GET과 INCR이 여전히 분리되어 수행되는 한, 경합 상태는 원천적으로 차단될 수 없었습니다」(C3, 대조 함). Redis 문서의 속도 제한 예제도 두 명령 사이의 「race condition」을 다룹니다(C10, 대조 함 — 그 예제의 경쟁은 `INCR` 과 `EXPIRE` 사이의 키 누수입니다).
- **Lua 스크립트**: 「While executing the script, all server activities are blocked during its entire runtime」(C12, 대조 함). 정확하지만 그동안 다른 요청이 모두 기다립니다. 올리브영은 Lua 로 미발급 · 과발급을 0 으로 만들었지만 「기존 대비 약 21% 정도의 성능 저하」로 기각했습니다(C3, 대조 함). 21% 가 어느 지표인지는 글에 없습니다(확인 안 함).
- **이중 카운터**: 올리브영의 최종안입니다. `C001-count` 는 최종 발급 수(DB 정합성 기준), `C001-countReq` 는 요청 수(경합 방지)입니다. 「요청 카운터가 먼저 증가하므로 동시 요청 차단」「실제 카운터는 통과된 요청만 증가」「Lua 스크립트 없이 2개 명령으로 해결」이고, 8% 성능 저하를 운영 스펙 대비 감당 가능하다고 판단했습니다(C3, 대조 함). 정확한 명령 순서와 롤백 조건은 흐름도 그림에만 있습니다(확인 안 함). 최종 선택은 수량 선차감(시도 1)과 이중 카운터(시도 3)의 조합입니다(C3, 대조 함).
- **`MULTI` / `EXEC`**: 명령을 끼어들기 없이 차례로 실행하지만 롤백은 없습니다(「Redis does not support rollbacks of transactions」, C15, 대조 함). 문서가 「Everything you can do with a Redis Transaction, you can also do with a script, and usually the script will be both simpler and faster」라고 적습니다(C15, 대조 함).
- **토스의 상한 확인**: 본문은 「Redis에서 지원하는 Increment 커맨드를 통해 리워드 지급 인원을 더하여 지정된 Cap에 도달하였는지 체크」하고, 도달하지 않았으면 「리워드를 지급하고 Increment」한다고 적습니다(C4, 대조 함). 이 문장 순서대로라면 확인과 증가가 갈린 모양이라 올리브영이 겪은 간극과 같습니다. 원문은 코드를 보이지 않아 실제 순서는 확인 안 함입니다.
- **단일 스레드**: Redis 는 「mostly, a single-threaded server from the POV of commands execution」입니다(C16, 대조 함). 명령 하나하나가 원자적인 이유이면서, 쿠폰 키 하나에 몰리면 한 대의 처리량이 상한이 되는 이유입니다(판단). 토스도 Increment 가 몰리면 「Redis의 Thread가 밀려 CPU가 상승」한다고 적었습니다(C4, 대조 함). 이 인용에는 voice 금지 어휘(「밀리다」)가 들어 있어 가이드 본문에 그대로 옮기면 검사기(`lexicon`)가 막습니다. 본문에서는 「명령이 쌓여 CPU 사용량이 오른다」처럼 풀어 씁니다.

### 4-2. "이 사람이 이미 받았는가"를 판정하는 법 — 중복 막기

- **DB 유니크 제약**: `(coupon_id, user_id)` 에 유니크 인덱스를 두면 같은 사람의 두 번째 INSERT 가 오류가 됩니다. MySQL 의 `UNIQUE` 와 `INSERT ... ON DUPLICATE KEY UPDATE`(영향 행 수 새 행 1 · 갱신 2 · 변화 없음 0)는 원재료 요약으로만 읽었습니다(C19 · C20, 원문 대조 안 함). PostgreSQL 은 「ON CONFLICT DO UPDATE guarantees an atomic INSERT or UPDATE outcome」이고 「even under high concurrency」라고 적습니다(C21, 대조 함). `DO NOTHING` 에 같은 문장이 있는지는 확인 안 함입니다.
- **Redis 단순 락**: `SET key value NX EX seconds` 는 키가 없을 때만 씁니다. 문서는 이 단순 락 패턴이 Redlock 쪽으로 「discouraged」라고 적고, `SETNX` · `SETEX` 는 앞으로 「deprecated」될 수 있다고 합니다(C11, 대조 함).
- **카카오페이의 연타 방어**: `setIfAbsent`(SETNX)로 키 `${quizId}:${userId}:earnReward` 를 TTL 3초로 잡습니다. 글은 「정확히는 스핀 락을 구현했는데요」라고 적었습니다(C5, 대조 함). 이 락은 버튼 연타로 같은 요청이 동시에 두 번 오는 것을 막는 용도이지 수량 한도용이 아닙니다(판단). TTL 3초의 근거와 락을 기다렸다 다시 시도하는지는 글에 없습니다(확인 안 함).
- **멱등성**: 카카오페이는 지급 이력(`EarnPayPointHistory`)을 먼저 조회해 있으면 저장된 이력으로 답하고, 없으면 외부 지급을 부른 뒤 성공 · 실패를 모두 이력에 남깁니다(C5, 대조 함). Stripe 의 멱등 키(같은 키 재시도에 첫 응답을 돌려줌)가 같은 설계입니다(C29, 원재료 요약으로만 읽음).
- **발급 사용자 집합**: Redis 집합에 받은 사람을 넣어 한 사람 한 장을 판정하는 모양은 여기어때 글(C9)이 쓴다고 요약에 나오지만 원문을 열지 못했습니다. **본문 근거로 쓰지 않습니다.** 가이드에 쓴다면 출처 없이 (판단)으로 둡니다.

### 4-3. 무거운 기록은 뒤로 — 큐 · 워커 · DB · 복제

- **배민 2016**: 참여 기록은 SQS 에 쌓고 후처리(당첨자 쿠폰 발급 · 안내)는 EB Worker 가 했습니다. 전면 Node.js 는 「값을 참조할 경우는 Read Replication을 참조」했습니다(C1, 대조 함).
- **올리브영의 큐 변천**: Redis Pub/Sub 은 워커를 고르는 신호로만 쓰고 데이터는 일련번호별 List 에 `RPush` → 워커가 `LPop` 해 DB 에 씁니다(C6, 대조 함). 그다음 RabbitMQ 를 들였고, Kafka(MSK)와 PoC 로 견주어 「확장 이후 축소가 불가한 Kafka의 파티션 정책은 저희와 맞지 않았습니다」라고 적었습니다(C7, 대조 함). 이어 Classic Queue 메모리 장애를 겪고 Quorum Queue 로 옮겼습니다(C8, 5절).
- **토스**: 지급 내역은 Redis 키 하나에 Append 해 즉시 인지하고, DB 에는 Kafka 로 비동기 INSERT 하면서 「Consumer에서 Throttling을 걸어 최대 QPS에 도달하지 않도록」 했습니다. 중복 요청은 「RedLock을 통해 API 요청에 대한 Distributed Lock」으로 막았습니다(C4, 대조 함).
- **Redis 복제는 비동기**: 「Redis uses by default asynchronous replication」(C13, 대조 함). `WAIT` 은 지정한 수의 복제본이 받았다는 것만 보장하고, 「it does not turn a set of Redis instances into a CP system with strong consistency: acknowledged writes can still be lost during a failover」입니다(C13, 대조 함). 복제본은 기본적으로 읽기 전용입니다(C13).
- **락과 페일오버**: 마스터가 락 쓰기를 복제하기 전에 죽으면 승격된 복제본에서 다른 클라이언트가 같은 락을 얻습니다 — 문서의 표현으로 「SAFETY VIOLATION!」입니다(C14, 대조 함). 같은 문서가 fencing token 을 구현하라고 하고, Redis 가 TTL 만료에 단조 시계를 쓰지 않는다고 주의합니다(C14, 대조 함).
- **DB 행 잠금**: 배민 2023 프로모션은 수량 행을 `SELECT ... FOR UPDATE`(`@Lock(PESSIMISTIC_WRITE)`)로 잠그고 줄였습니다. 「DB row에 Exclusive Lock 을 걸기에 속도가 많이 저하되는 문제가 있지만」 인프라를 늘리지 않으려고 골랐습니다(C2, 대조 함). MySQL 의 잠금 읽기 · 잠금 범위 설명(C17 · C18)은 원재료 요약으로만 읽었습니다.
- **PostgreSQL Read Committed 재평가**: `UPDATE` 가 동시에 고쳐진 행을 만나면 앞 트랜잭션을 기다린 뒤 「The search condition of the command (the WHERE clause) is re-evaluated to see if the updated version of the row still matches」입니다(C22, 대조 함). 그래서 `UPDATE coupon SET remaining = remaining - 1 WHERE id = ? AND remaining > 0` 이 남은 수량을 음수로 만들지 않는다고 읽을 수 있습니다. 이 문장 자체를 보장으로 적은 공식 문서는 못 찾았고, 재평가 동작에서의 해석입니다(판단).
- **복제 지연의 공식 근거**: PostgreSQL 핫 스탠바이의 「there will be a measurable delay between primary and standby」(C23), MySQL 의 「Replication is asynchronous by default」(C24), RDS 의 `ReplicaLag` 지표(C25)는 원재료 요약으로만 읽었습니다(원문 대조 안 함).

## 5. 시나리오 절에 쓸 반례와 장애

시나리오 셋(기본 흐름 · 부하가 몰릴 때 · 장애가 날 때)에 아래를 나눠 씁니다. 정합성이 걸린 문제라 장애 시나리오는 「틀린 값이 남는 경로」를 보여야 합니다(명세 SD9).

1. **확인과 차감을 따로 실행함** — 올리브영 1차 검사(`GET`)와 워커 재검사 사이 간극: T0 에 `GET` 이 count=99 라 통과하고, T1 MQ 발행(10ms) · T2 워커 수신(50ms)을 지나 T3 에 워커의 `GET` 이 count=101 이라 실패합니다. 사용자는 이미 성공 응답을 받은 상태입니다(C3, 대조 함). 부하 시험 10,162건 중 162건, 운영 6월 평균 0.014% 가 이 경로입니다.
2. **복제본에서 카운터 읽기** — 배민 2016: 「카운터 증가는 마스터 노드에 하고 참조는 리플리케이션 노드에서 수행」했고, 「마스터 노드에 증가된 카운터 값이 미처 리플리케이션 노드에 복제되기 전에」 다음 참여자가 통과했습니다(C1, 대조 함). 처리는 「일단 당첨은 당첨이니, 마케팅실과 협의하여 초과된 당첨에 대해서도 쿠폰은 발행」이었습니다(C1, 대조 함).
3. **잠금이 커밋보다 먼저 풀림** — `@Transactional` 메서드에 `synchronized` 를 걸면 메서드를 나가는 순간 락이 풀려 커밋 전에 다른 트랜잭션이 들어옵니다. 서버가 여러 대면 진입점도 여럿입니다(C2, 대조 함).
4. **Redis 와 DB 어긋남** — 성공 응답 뒤 워커 DB 실패, 페일오버 때 확인된 쓰기 손실(C13 · C14). 올리브영 운영안은 count 와 countReq 차이 감시 · 임계치 알람 · Redis 장애 시 DB 기반 Fallback · 불일치 때 자동 · 수동 보정입니다(C3, 대조 함).
5. **같은 메시지를 여럿이 받음** — 워커 4대가 같은 Topic 을 구독해 「1건의 쿠폰 발급 데이터가 publish 될 때마다 쿠폰 발급은 4회 실행」됐습니다(C6, 대조 함). 연타로 같은 API 가 동시에 두 번 오는 것도 같은 모양입니다(C5).
6. **락 TTL 보다 작업이 김** — 만료 뒤 남의 락을 지울 수 있어 토큰을 비교해 지우라고 문서가 권합니다(C11 · C14). 카카오페이가 이것을 어떻게 다뤘는지는 확인 안 함입니다(C5).
7. **브로커가 장애점** — 2025년 1월 약 1,500만 건 발급 중 RabbitMQ 가 멈췄습니다. 「메모리 부족 + 브로커 재시작 = Unsynchronized 상태」. 새 브로커로 옮겨 약 30분 만에 정상화했고, 3.11.28 → 3.12.14 업그레이드와 Quorum Queue 전환 뒤 장애가 월 평균 2-3회에서 0회, Memory Critical 알람이 월 평균 5-7건에서 0건, 평균 복구 시간이 2시간에서 90초가 됐습니다(C8, 대조 함). 지표의 측정 기간은 「전환 후 3개월」입니다(C8).
8. **부하 시험의 한계** — 배민은 ELB 워밍업이 안 돼 목표 부하를 못 줬고(C1), 올리브영은 개발 환경 부하가 운영보다 높다고 밝혔습니다(C3). 둘 다 대조 함.

- **시나리오 배치(판단)**: 시나리오 1 은 정각 오픈에 요청 하나가 원자 판정 → 발급 기록 → 큐 → DB 로 가는 길, 시나리오 2 는 정각 폭주에서 쿠폰 키 하나에 몰리는 요청과 소진 뒤 요청이 DB 까지 가지 않는 길, 시나리오 3 은 반례 1 · 2 가운데 하나로 「틀린 값이 남는 경로」를 보이고 고른 구조에서는 어디서 막히는지를 보입니다.

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 판정하는 곳 | 얻는 것 | 포기하는 것 |
| --- | --- | --- | --- |
| A. DB 조건부 UPDATE + 유니크 제약(Redis 없음) | DB 한 곳 | 저장소 하나라 어긋남이 없음, 커밋이 곧 확정(판단) | 수량 행 하나에 직렬화돼 DB 쓰기 속도가 상한(C2 「속도가 많이 저하」), 소진 뒤에도 요청이 DB 까지 감(판단) |
| B. Redis 원자 판정 + 큐 + DB 비동기 기록 | Redis | 소진 뒤 요청이 DB 까지 가지 않음, 소비자 속도로 DB 를 조절(C4) | 저장소 둘이라 롤백 · 보정 · 감시 · 폴백이 필요(C3), 페일오버 쓰기 손실(C13 · C14), 성공 응답 ~ DB 반영 사이 구간 |
| C. 큐 직렬 처리(Kafka 파티션 · SQS FIFO 그룹) | 큐의 소비자 하나 | 처리자가 하나라 경쟁이 구조적으로 없음(판단) | 접수와 결과가 갈려 「성공 응답 후 미발급」 간극(C3), SQS FIFO 파티션당 300 TPS(C28), Kafka 파티션 축소 불가(C7), 브로커가 장애점(C8) |
| D. 서버별 로컬 할당량 | 각 서버 메모리 | 왕복이 없고 핫 키를 피함(판단) | 분배가 고르지 않으면 하드 한도가 깨지고, 서버가 죽으면 몫이 사라지며, 한 사람 한 장은 따로 중앙 저장소가 필요(판단). 토스도 「Hard하게 Capping하는 방식은 아니어서」라고 단서를 닮(C4) |

- 근거: A 는 C2 · C19 · C21 · C22, B 는 C1 · C3 · C4 · C10 · C12 · C15, C 는 C3 · C7 · C8 · C26 · C27 · C28, D 는 C4 입니다. 「(판단)」으로 적지 않은 칸은 출처 문장이 있습니다.
- **같은 팀이 단계별로 고쳐 온 기록**: 올리브영은 ① 동기 처리 + 순번 제어(「DB Connection 등의 자원을 많이 점유」하고 사용자가 순서를 오래 기다림 — C6 이 앞 구조로 설명, 대조 함) → ② Redis Pub/Sub + List 워커(C6) → ③ RabbitMQ(C7) → ④ Classic Queue 장애와 Quorum Queue(C8) → ⑤ Redis 선차감 + 이중 카운터(C3) 순으로 바꿔 왔습니다. 명세가 「시간 순서로 쓴다」고 정한 경우에 맞습니다(명세 `alternatives.candidates`). 단계마다 무엇이 아팠는지가 후보를 가르는 기준이 됩니다.
- **집필 메모(판단)**: 파일럿 기본 구조로는 B 를 권합니다. 국내 공개 사례(C1 · C3 · C4)와 가장 많이 겹치고, 정확도를 지키는 자리가 「Redis 한 명령」과 「DB 유니크 제약」 두 곳으로 분명합니다. 판정은 확인과 차감을 한 명령으로 하는 `INCR`(더한 값이 N 이하인가)과 발급 기록(한 사람 한 장)으로 하고, 둘을 한 번에 하려면 Lua 하나로 묶는 길과 올리브영식 두 명령 길의 대가(21% 대 8%, C3)를 결정 절에서 견줍니다.
- **전환점(판단)**: 총 요청이 DB 한 대의 쓰기 속도 안이면 A 하나로 충분하고 Redis 는 과합니다. 쿠폰 하나에 초당 요청이 Redis 한 대를 넘으면 쿠폰을 여러 키로 나누는 길(D 의 변형 — 키마다 몫을 나눔)을 보되 하드 한도와 맞는지 따져야 합니다. 정확한 접수 순서가 돈과 연결되면(예: 순번 공개) C 를 앞에 둡니다.

## 7. 실제 사례 절에 쓸 대응표

| 사례 | 확인된 것 | 이 가이드 구조와의 대응 | 출처 |
| --- | --- | --- | --- |
| 우아한형제들 빼빼로데이(2016) | 별도 이벤트 시스템, Redis 마스터 1 + 복제본 2, SQS · EB Worker 후처리, 1.89초 마감, 복제본 읽기로 과발급 | 판정 저장소 · 큐 · 워커, 시나리오 3 의 반례 | C1 |
| 우아한형제들 프로모션(2023) | `synchronized` · 낙관적 락 · 비관적 락 비교, 비관적 락 채택과 속도 저하 인정 | 후보 A, 잠금이 커밋 전에 풀리는 반례 | C2 |
| CJ올리브영 미발급 0%(2025) | `GET`/`INCR` 간극, Lua 21% 기각, 이중 카운터 8% 채택, 부하 시험 · 운영 검증 수치, 감시 · 폴백 · 보정 운영안 | 후보 B 의 판정 방식, 시나리오 3, 결정 절의 대가 비교 | C3 |
| CJ올리브영 큐 변천(2023~2025) | Pub/Sub + List, RabbitMQ 도입과 Kafka 기각 이유, Classic Queue 장애와 Quorum Queue | 대안 비교의 시간 순서, 큐가 장애점이 되는 반례 | C6 · C7 · C8 |
| 토스 라이브 쇼핑(2024) | 요구 넷, RedLock 분산 락, Redis Append + Kafka 비동기 INSERT + 소비자 Throttling, Increment 로 Cap 확인, 로컬 카운팅의 한계 단서 | 후보 B 의 기록 경로, 후보 D 의 단서 | C4 |
| 카카오페이 퀴즈타임(2024) | 연타 중복 지급, SETNX 락 TTL 3초, 지급 이력으로 멱등 응답 | 한 사람 한 장 판정, 멱등성 | C5 |

- **본문 근거로 쓰지 않는 것 둘**: 여기어때 네고왕(C9)은 원문 열람 실패(HTTP 403)라 쓰지 않습니다. 배민 · 11번가 2019 타임딜(C30)은 언론 보도인 약한 근거라 배경으로만 둡니다.
- 대응표의 확인된 것은 모두 원문 대조를 거쳤습니다(10절).

## 8. 구현 코드 절에 쓸 메모

- 근거와 바로 이어지는 코드는 후보 B 의 판정(원자 카운터 + 발급 집합)과 기록(큐 → 워커 → 유니크 제약이 있는 테이블)입니다.
- 실행 검증용 코드는 메모리 대역과 가상 시계로 재현합니다(명세 SD26). Rust 표준 라이브러리에 비동기 실행기가 없으므로 스레드 없이 단일 스레드에서 사건을 시각 순으로 처리하고, 같은 시각의 사건은 사건 번호 순으로 처리합니다. 동시성 경쟁은 스레드가 아니라 **사건 순서를 끼워 넣어** 보입니다 — 요청 A 의 확인 → 요청 B 의 확인 → A 의 차감 → B 의 차감 순으로 처리하면 `GET` 후 `INCR` 의 과발급이 결정적으로 재현됩니다(판단).
- 출력에 고정할 값(판단): 발급 수 = N, 한 사람이 받은 장수의 최댓값 = 1, 성공 응답 수 = 실제 기록 수. 같은 사건열을 「확인 후 차감」 대역에 넣었을 때의 과발급 수를 함께 찍으면 시나리오 3 의 수치가 실행에서 나옵니다.
- 배포 조각(`no-compile`)으로는 Redis 명령(`INCR` · `SET ... NX EX` · `EVAL`)과 SQL(`UPDATE ... WHERE remaining > 0`, `(coupon_id, user_id)` 유니크 인덱스)이 근거 문서(C10 · C11 · C12 · C21 · C22)와 바로 이어집니다. 조건부 UPDATE 의 안전성은 재평가 동작에서의 해석이라 본문에도 그렇게 적습니다(4-3).

## 9. 미해결 질문

본문에서 단정하지 않습니다. 찾으면 이 절에 되먹입니다.

1. 여기어때 원문(C9, 403) — 구조 · 수치 · `MULTI`/`EXEC` 방식 · 게시일.
2. 무신사 · 쿠팡 · 11번가 · 당근 · 네이버의 공식 기술 글(원재료 조사에서 못 찾음).
3. 우아한테크 대기열(번호표) 발표 원본과 「처리 성능 3배」 주장.
4. 배민 2016 의 초과 당첨자 수(글에 없음).
5. 올리브영 이중 카운터의 정확한 명령 순서 · 롤백 조건(흐름도 그림에만 있음)과 21% · 8% 의 지표.
6. 카카오페이 락의 대기 재시도 여부 · TTL 3초의 근거 · 소유자 확인 없는 해제.
7. 토스 상한 확인의 실제 순서(본문 문장은 확인 → 지급 → Increment)와 로컬 카운팅의 서버 종료 손실(댓글에서만 제기).
8. 조건부 `UPDATE ... WHERE remaining > 0` 을 직접 보장으로 적은 공식 문장(지금은 C22 재평가에서의 해석).
9. PostgreSQL `ON CONFLICT DO NOTHING` 의 동시성 보장 문장.
10. MySQL 의 「복제본이 뒤처질 수 있다」 직접 문장(비동기 기본값만 확인, C24 는 원문 대조 안 함).
11. SQS FIFO 중복 제거 구간 길이(통상 5분이라는 말은 확인 안 함).
12. 단일 행 조건부 UPDATE 처리량 · Redis `INCR` 전용 처리량의 공식 수치.
13. 서버별 로컬 할당량을 하드 한도 선착순에 쓴 공개 사례.

## 10. 출처

「원문 대조」 칸: 「함」은 2026-11-15 에 원문 HTML 을 받아 이 노트가 인용한 수치 · 문자열을 찾은 것, 「원재료 때 전문」은 원재료 조사가 본문 전체를 읽은 것(이 노트에서 다시 찾지 않음), 「안 함」은 요약으로만 읽은 것입니다. 「안 함」인 출처의 수치는 본문에 실기 전에 대조합니다.

| ID | 출처 | 게시일 | 원문 대조 |
| --- | --- | --- | --- |
| C1 | [우아한형제들 — 누군가에게는 빼빼로데이](https://techblog.woowahan.com/2514/) | 2016-11-28 | 함 |
| C2 | [우아한형제들 — 프로모션 시스템 엿보기](https://techblog.woowahan.com/10795/) | 2023-03-21 | 함 |
| C3 | [CJ올리브영 — 올영세일 선착순 쿠폰, 미발급 0%를 향한 여정](https://oliveyoung.tech/2025-12-15/fcfs-coupon/) | 2025-12-15 | 함 |
| C4 | [토스 — 서버 증설 없이 처리하는 대규모 트래픽](https://toss.tech/article/monitoring-traffic) | 2024-05-13 | 함(`INCR` 은 댓글에만) |
| C5 | [카카오페이 — 유저향 서비스를 개발하며 마주쳤던 이슈와 해결 방안](https://tech.kakaopay.com/post/troubleshooting-logs-as-a-junior-developer/) | 2024-11-05 | 함 |
| C6 | [CJ올리브영 — Redis Pub/Sub을 활용한 쿠폰 발급 비동기 처리](https://oliveyoung.tech/2023-08-07/async-process-of-coupon-issuance-using-redis/) | 2023-08-07 | 함 |
| C7 | [CJ올리브영 — 쿠폰 발급 RabbitMQ 도입기](https://oliveyoung.tech/2023-09-18/oliveyoung-coupon-rabbit/) | 2023-09-18 | 함 |
| C8 | [CJ올리브영 — RabbitMQ Classic Queue 메모리 장애와 Quorum Queue 전환기](https://oliveyoung.tech/2025-10-28/coupon-mq-issue/) | 2025-10-28 | 함 |
| C9 | [여기어때 — Redis&Kafka를 활용한 선착순 쿠폰 이벤트 개발기 (feat. 네고왕)](https://techblog.gccompany.co.kr/redis-kafka%EB%A5%BC-%ED%99%9C%EC%9A%A9%ED%95%9C-%EC%84%A0%EC%B0%A9%EC%88%9C-%EC%BF%A0%ED%8F%B0-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EA%B0%9C%EB%B0%9C%EA%B8%B0-feat-%EB%84%A4%EA%B3%A0%EC%99%95-ec6682e39731) | 확인 안 함 | 열람 실패(403) — 본문 근거로 쓰지 않음 |
| C10 | [Redis — INCR](https://redis.io/docs/latest/commands/incr/) | 확인 안 함 | 함 |
| C11 | [Redis — SET](https://redis.io/docs/latest/commands/set/) | 확인 안 함 | 함 |
| C12 | [Redis — Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/) | 확인 안 함 | 함 |
| C13 | [Redis — Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/) | 확인 안 함 | 함 |
| C14 | [Redis — Distributed Locks with Redis](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) | 확인 안 함 | 함 |
| C15 | [Redis — Transactions](https://redis.io/docs/latest/develop/using-commands/transactions/) | 확인 안 함 | 함 |
| C16 | [Redis — benchmark](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/) | 확인 안 함 | 함 |
| C17 | [MySQL 8.4 — Locking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html) | 확인 안 함 | 안 함 |
| C18 | [MySQL 8.4 — Locks Set by Different SQL Statements](https://dev.mysql.com/doc/refman/8.4/en/innodb-locks-set.html) | 확인 안 함 | 안 함 |
| C19 | [MySQL 8.4 — CREATE INDEX](https://dev.mysql.com/doc/refman/8.4/en/create-index.html) | 확인 안 함 | 안 함 |
| C20 | [MySQL 8.4 — INSERT ... ON DUPLICATE KEY UPDATE](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html) | 확인 안 함 | 안 함 |
| C21 | [PostgreSQL — INSERT](https://www.postgresql.org/docs/current/sql-insert.html) | 확인 안 함 | 함 |
| C22 | [PostgreSQL — Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html) | 확인 안 함 | 함 |
| C23 | [PostgreSQL — Hot Standby](https://www.postgresql.org/docs/current/hot-standby.html) | 확인 안 함 | 안 함 |
| C24 | [MySQL 8.4 — Replication](https://dev.mysql.com/doc/refman/8.4/en/replication.html) | 확인 안 함 | 안 함 |
| C25 | [Amazon RDS — Monitoring read replication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_MySQL.Replication.ReadReplicas.Monitor.html) | 확인 안 함 | 안 함 |
| C26 | [Apache Kafka — Introduction](https://kafka.apache.org/intro) | 확인 안 함 | 안 함 |
| C27 | [Amazon SQS — FIFO delivery logic](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-understanding-logic.html) | 확인 안 함 | 함 |
| C28 | [Amazon SQS — Message quotas](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html) | 확인 안 함 | 함(범위 정정) |
| C29 | [Stripe — Idempotent requests](https://docs.stripe.com/api/idempotent_requests) | 확인 안 함 | 안 함 |
| C30 | [인사이트 — 배민 · 11번가 타임딜 보도](https://www.insight.co.kr/news/236493) | 2019-07-12 | 안 함 — 약한 근거, 배경으로만 |

참고만 하고 인용하지 않은 것(개인 블로그 · 개인 저장소, 원재료 7절): 수치가 계산 예시이거나 회사 사례 출처가 없어 쓰지 않습니다.

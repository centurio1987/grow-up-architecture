# 리서치 노트 — 티켓 예매와 좌석 선점: 같은 좌석을 두 번 팔지 않고, 결제하는 동안 잠시 붙잡아 둔다

- 조사일: 2026-11-17. 자료 조사는 조사 워커 둘이 했고(기업 기술 글과 대기실 제품 문서 · 저장소와 잠금 기법의 공식 문서), 본문에 실을 만한 인용과 수치는 같은 날 원문 페이지를 다시 받아 문자열을 맞췄습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 셋째 편(`ticket-seat-hold`, 사례 목록 [CT-03](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S8 의 산출물입니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `T` 로 시작합니다(앞 노트의 `V` · `C` · `L` · `P` 와 겹치지 않게). 사례 목록 CT-03 행의 C21 · C22 는 이 노트의 T1 · T4 입니다.
- 같은 계열의 앞 편 두 개를 이어 씁니다. 「마지막 확인은 DB 유일 제약」은 [선착순 쿠폰 발급](../system-design-guide/first-come-coupon/first-come-coupon-guide_v1.1.1.md), 「결제가 두 번 되지 않게」는 [결제 · 송금 중복 방지](../system-design-guide/payment-idempotency/payment-idempotency-guide_v1.0.0.md) 편이 이미 다뤘습니다. 이 편은 그 위에 **시간이 지나면 풀리는 점유**와 **몰려드는 사람을 줄 세우는 대기실**을 더합니다.

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 대기실 · 4-2 좌석 점유와 만료 · 4-3 판매 확정과 늦은 결제 · 4-4 마지막 확인 · 4-5 잠금 기법 비교 · 4-6 좌석 지도와 검색) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 요구 후보 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

티켓 예매가 어려운 이유는 둘입니다. 하나는 **사람이 한꺼번에 몰린다**는 것이고, 다른 하나는 **한 좌석을 산다는 일이 몇 분 걸린다**는 것입니다. 좌석을 고르고 결제를 마치기까지 시간이 걸리므로, 그 사이 같은 좌석을 다른 사람이 사지 못하게 잠시 붙잡아 둬야 합니다. 그런데 붙잡은 사람이 결제하지 않고 떠나면 좌석은 다시 풀려야 합니다. SeatGeek 발표는 이 흐름을 「a credit card could be denied or you realize that the ticket is so expensive, then you say, ok, then you give up and then the ticket becomes available again」이라고 말합니다(T1). 같은 발표는 동시에 같은 좌석을 고르는 문제를 「There are concurrency issues, like maybe two people are trying to reserve at the same time, how do you tiebreak?」라고 묻지만 답은 주지 않습니다(T1).

공개 사례가 밝힌 것은 주로 **앞단의 대기실**입니다.

1. **대기실과 입장 토큰** — SeatGeek(T1 · T3), Cloudflare(T4), AWS(T8), Queue-it(T9)이 모두 사용자를 먼저 줄 세우고, 차례가 오면 시간 제한이 있는 토큰을 줘 예매 경로에 들여보냅니다.
2. **입장 속도** — SeatGeek 은 보호 구간마다 「bucket … with different exit rates」를 두고(T1), Cloudflare 는 고객이 정한 활성 사용자 한도를 지킵니다(T4).
3. **순서** — SeatGeek 은 「first-in, first-out is the fair approach that we can use in our business」(T1), Cloudflare 는 분 단위 버킷에서 오래된 버킷부터(T4), Queue-it 은 판매 시작 전에 온 사람은 무작위, 그 뒤는 도착 순입니다(T9).

**좌석을 어떻게 붙잡고 이중 판매를 무엇으로 막는지는 1차 기업 글 어디에도 없습니다**(조사 워커 둘 다 확인). 그래서 이 부분은 저장소의 공식 문서(Redis T11 · T12, PostgreSQL T14~T16, DynamoDB T17)와 잠금의 안전성을 다룬 글(Kleppmann T13), 교육용 분석(Hello Interview T18)을 근거로 이 노트가 설계합니다(판단).

이 노트의 추천 구조(판단)는 **대기실로 입장 속도를 판매 속도에 맞추고, 좌석 점유는 DB 좌석 행 하나에 상태 · 점유자 · 점유 번호 · 만료 시각을 두어 조건부 UPDATE 한 문장으로, 판매 확정도 「아직 내 점유가 유효할 때만」 조건부로, 마지막 확인은 판매 표의 (공연, 좌석) 유일 제약으로, 좌석 지도는 캐시로 분리**입니다. 근거와 버린 후보는 6절에 있습니다.

## 2. 요구사항 절에 쓸 근거 — 「두 번 팔지 않는다」와 「몰려도 받는다」를 숫자로

공개된 규모 수치는 Ticketmaster 의 보도자료 하나에 모여 있습니다(T5, 회사가 2022-11-15 판매를 사후 설명한 글).

| 값 | 원문 | 대상 | 출처 |
| --- | --- | --- | --- |
| 사전 등록 350만 명 | 「Over 3.5 million people pre-registered for TaylorSwiftTix Presale powered by Verified Fan」 | 그 투어의 사전 판매 | T5 |
| 코드 받은 150만 명 | 「Around 1.5 million people were sent codes to join the onsale for all 52 show dates, including the 47 sold by Ticketmaster.」 | 같은 판매 | T5 |
| 시스템 요청 35억 건 | 봇 공격과 코드 없는 팬이 몰려 「resulting in 3.5 billion total system requests – 4x our previous peak」 | 같은 판매의 전체 요청 | T5 |
| 경기장 한 공연 판매 시간 | 「It usually takes us about an hour to sell through a stadium show」 | 평소(usually) | T5 |
| 그날 판매량 | 「Over 2 million tickets were sold on Ticketmaster for Taylor Swift \| The Eras Tour on Nov. 15」 | 그날 | T5 |
| 실제 구매 비율 · 1인 장수 | 「Historically, around 40% of invited fans actually show up and buy tickets, and most purchase an average of 3 tickets.」 | 과거 평균(Historically) | T5 |

- 점유 시간: Ticketmaster 의 결제 안내는 「we limit the amount of time a fan can hold tickets before completing their purchase」이고, 시간은 「We set the time length according to ticket demand, so it can differ depending on time of day or for different events.」입니다(T7). **고정 분 수는 공개하지 않습니다.** 같은 회사의 대기열 안내에 있는 「When it's your turn, your spot will be held for 10 minutes.」(T6)는 **대기열에서 차례가 온 자리**를 붙잡는 시간이지 좌석 점유 시간이 아닙니다. 둘을 섞지 않습니다.
- Hello Interview 의 분석(T18, 교육용)은 요구 예시로 「popular events (10 million users, one event)」, 「low latency search (< 500ms)」, 「read heavy … (100:1)」을 들고, 좌석을 Redis 잠금에 「with a TTL of 10 minutes (this is how long we will hold the ticket for)」로 둡니다. 이 값들은 면접용 예시이고 어느 회사의 운영값도 아닙니다. 사례 목록 CT-03 행의 「한 공연에 천만 명」도 이 예시에서 온 것입니다.
- 한국 예매처의 공개 규칙: 인터파크티켓은 2024년 8월 8일부터 「한 개의 계정으로 한 개의 대기열 순번만 받을 수 있습니다.」, 「여러 디바이스나 브라우저를 이용해서 동시에 대기열을 생성할 경우, 기존 대기열은 자동으로 종료됩니다.」로 바꿨습니다(T10, 예술의전당이 게시한 인터파크 안내). 구현 설명은 아닙니다.
- **요구 표 후보(가정)**: 스타디움 공연 한 회 좌석 5만 석, 판매 시작 순간 대기자 1천만 명(T18 예시를 가정으로 씀). 같은 좌석은 한 번만 팔린다(이중 판매 0건). 좌석을 고른 사람은 10분 동안 그 좌석을 붙잡는다(가정 — T18 예시, Ticketmaster 는 수요에 따라 바꿈). 10분 안에 결제하지 않으면 좌석은 다시 팔 수 있다. 만료 뒤에 도착한 결제는 판매로 이어지지 않는다. 판매 시작 순간 예매 경로가 받는 요청은 대기실이 정한 입장 속도 이하. 좌석 지도 조회는 몇 초 낡아도 되지만 점유 판정은 낡으면 안 된다.
- 위 요구 가운데 「만료 뒤에 도착한 결제는 판매로 이어지지 않는다」는 1차 출처가 아니라 4-3 의 Kleppmann 글(T13)과 Redis 문서(T12)가 짚는 문제에서 이 노트가 끌어낸 것입니다(판단). 가이드는 이것을 문제 쪽 요구(「붙잡은 시간이 끝났으면 다른 사람 차례」)로 쓰고, 고른 구조에 맞춰 바꾸지 않습니다.

## 3. 규모 추정 절에 쓸 계산

출처 수치는 Ticketmaster(T5)와 Hello Interview 예시(T18)뿐이고, 나머지는 가이드의 가정과 그 계산입니다.

1. 판매 속도: 좌석 5만 석(가정)을 Ticketmaster 의 「about an hour」(T5)에 판다면 5만 ÷ 3,600초 ≈ 초당 14석입니다(계산). 한 사람이 평균 3장을 산다면(T5 의 과거 평균) 초당 약 5명이 구매를 마칩니다(계산). **판매 자체는 느리고, 어려운 것은 몰려든 사람 수입니다.**
2. 몇 명이 사면 매진인가: 5만 석 ÷ 3장 ≈ 1만 7천 명(계산). 대기자 1천만 명(가정) 가운데 약 0.17% 입니다(계산). 나머지 99.8% 는 예매 경로에 들어와도 살 좌석이 없습니다.
3. 대기실이 없을 때: 1천만 명이 판매 시작 1분 안에 한 번씩만 좌석 지도를 열어도 초당 약 16만 7천 건입니다(계산, 1분은 가정). Ticketmaster 는 같은 판매에서 시스템 요청이 이전 최고치의 4배였다고 적습니다(T5) — 이 노트는 그 절대값을 초당 값으로 바꾸지 않습니다(판매 시간 길이가 글에 없어 계산할 수 없음).
4. 입장 속도: 예매 경로에 동시에 들어와 있는 사람을 좌석을 고르고 결제하는 데 걸리는 시간 × 구매 속도로 잡으면, 평균 5분(가정) × 초당 5명 ≈ 1,500명입니다(계산). 이탈을 감안해 두세 배를 들여도 수천 명이라, 1천만 명을 한꺼번에 받는 것과 차이가 수천 배입니다(계산).
5. 좌석 행: 5만 행. 점유 한 번은 좌석 행 하나를 조건부로 바꾸는 UPDATE 하나입니다(판단). 같은 좌석에 몰리는 경합은 인기 구역의 앞줄처럼 좁은 곳에 모입니다(판단).
6. 좌석 지도 조회: 읽기와 쓰기가 100:1(T18 예시)이면, 초당 점유 시도가 수백 건일 때 조회는 수만 건입니다(계산, 점유 시도 수는 가정). 조회를 점유와 같은 DB 행 잠금 경로에 두지 않을 이유입니다(판단).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 대기실 — 줄 세우기 · 입장 토큰 · 입장 속도 · 순서

- **흐름(SeatGeek)**: 「Then we create a visitor token, and then we route back the user to the queue page with that visitor token.」 주기적으로 실행되는 함수가 줄을 비웁니다 — 「Then we have exchanger function that is running in a certain period, draining that queue, that's basically exchanging visitor tokens to access tokens.」(T1). 모든 행사가 대기실 뒤에 있습니다 — 「All the events in the seatgeek.com are protected by the virtual waiting room by the Room.」(T1). 규모는 「we have over 2000 protected zones running now.」(T1).
- **토큰 수와 남은 좌석(SeatGeek · AWS 공동 글)**: 「the number of access tokens generated is equivalent to the number of available tickets.」 「Tokens are allocated when the customer is admitted to the waiting room and expire when tickets are purchased」(T3). 입장 토큰을 남은 표 수만큼만 만든다는 설명이고, 좌석 점유와 같은 장치는 아닙니다. 줄 밖의 사람은 「Those beyond that preconfigured number wait in a First-In-First-Out (FIFO) queue.」(T3).
- **입장 속도**: SeatGeek 은 「we have a bucket for each path, for each protected zone, it's a bucket with different exit rates.」(T1). Cloudflare 는 「Queueing users ensures that the total number of active users stays around the configured limit.」(T4). Queue-it 은 「At the throughput rate you configure, Queue-it then redirects the visitors who waited in line back to your website in the correct, sequential order.」(T9). AWS 는 「It admits new users as capacity becomes available.」(T8).
- **토큰의 모양**: Cloudflare 는 「Cloudflare issues a ticket to this user in the form of an encrypted cookie.」(T4). AWS 는 「After reaching the front of the line, the user can exchange the number and device ID for a secure session token.」(T8). 예매 API 는 이 토큰이 없거나 만료됐으면 받지 않습니다(판단 — 각 문서가 토큰으로 보호 구간을 지킨다고 적지만 예매 API 의 거절 동작을 적은 문장은 찾지 못함).
- **순서와 공정성**: SeatGeek 은 도착 순(「first-in, first-out is the fair approach that we can use in our business.」, T1). Cloudflare 는 「All the users who visited the waiting room between 19:51:00 and 19:51:59 are assigned to the bucketId 19:51:00.」, 그리고 「We achieve this by giving the eligible slots to the oldest buckets in the queue.」(T4) — 같은 분 안에서는 도착 순을 가르지 않습니다. Queue-it 은 판매 예정 시각 전에 온 방문자는 「visitors are randomized and assigned a place in line」, 그 뒤에 온 방문자는 「a first-come, first-served place in the queue」입니다(T9). Ticketmaster 는 「If you join the queue after the sale starts, you'll be at the back of the line.」(T6). 판매 시작 전 도착자를 무작위로 섞는 이유를 공식 문서가 적은 문장은 찾지 못했습니다(확인 안 함). 가이드는 「일찍 온 순서는 새로 고침 속도 경쟁이 되기 쉽다」는 이유를 판단으로 쓸 수 있습니다.
- **분산 구조(Cloudflare)**: 데이터센터마다 상태를 모아 전역으로 보냅니다 — 「The Data Center Durable Object sends the data center state to the Global Durable Object periodically.」(T4). 전역 한도를 지키면서 요청마다 한 곳에 묻지 않으려는 구조로, 앞 편 IN-01 의 「세는 곳을 나눈다」와 같은 문제입니다(판단).

### 4-2. 좌석 점유와 만료 — 「붙잡았다」를 한 문장으로

- **Redis 로 붙잡기**: `SET` 의 `NX` 는 「Only set the key if it does not already exist.」, `PX` 는 「Set the specified expire time, in milliseconds (a positive integer).」입니다(T11). Redis 의 분산 잠금 문서는 단일 인스턴스 잠금을 「SET resource_name my_random_value NX PX 30000」으로 보이고, 값은 「This value must be unique across all clients and all lock requests.」라고 적습니다(T12). 풀 때 값이 같은지 보는 이유는 「Using just DEL is not safe as a client may remove another client's lock.」입니다(T12).
- **Redis 문서가 스스로 적은 한계**: `SET` 문서의 잠금 패턴 절은 「The following pattern is discouraged in favor of the Redlock algorithm which is only a bit more complex to implement」로 시작합니다(T11). 분산 잠금 문서는 단일 인스턴스 방식을 「this is actually a viable solution in applications where a race condition from time to time is acceptable」이라고 적고, 복제본으로 넘어가는 구성은 「Redis replication is asynchronous.」 때문에 두 클라이언트가 같은 잠금을 가질 수 있다고 적습니다(T12). 정확성이 중요하면 「You should implement fencing tokens.」(T12). 만료는 「Redis is not using monotonic clock for TTL expiration mechanism.」, 「That means that a wall-clock shift may result in a lock being acquired by more than one process.」(T12). **두 문서(T11 · T12)는 단일 인스턴스 잠금에 대한 강조가 다릅니다** — 앞의 것은 Redlock 을 권하고 뒤의 것은 조건부로 쓸 만하다고 봅니다. 가이드가 한쪽만 인용하면 과장이 됩니다.
- **DB 로 붙잡기(이 노트의 추천, 판단)**: 좌석 행에 상태(available · held · sold) · 점유자 · 점유 번호 · 만료 시각을 두고, 점유를 조건부 UPDATE 한 문장으로 합니다 — `UPDATE seats SET status='held', holder=?, hold_no=hold_no+1, hold_until=? WHERE seat_id=? AND (status='available' OR (status='held' AND hold_until < now))`. 바뀐 행이 1이면 점유 성공, 0이면 다른 사람이 붙잡고 있습니다. 만료를 청소 작업이 아니라 **조건 안에서** 판정하므로 청소가 늦어도 판정은 틀리지 않습니다. Hello Interview 의 「Great Solution: Implicit Status with Status and Expiration Time」(T18, 교육용)이 같은 생각이고, 이유로 「PostgreSQL doesn't natively support row-level TTLs」를 듭니다.
- **행 잠금을 결제 동안 잡지 않는 이유**: PostgreSQL 의 행 잠금은 「Row-level locks are released at transaction end or during savepoint rollback, just like table-level locks.」(T14)이므로, `SELECT … FOR UPDATE` 로 좌석을 잠근 채 결제를 기다리면 트랜잭션을 몇 분 열어 둬야 합니다. Hello Interview 는 이것을 「Bad Solution: Long-Running Database Locks」로 두고 「database locks are meant to be used for short periods of time」이라고 적습니다(T18, 교육용). 연결 수와 잠금이 결제 시간만큼 묶인다는 것은 이 노트의 판단입니다.

### 4-3. 판매 확정과 늦은 결제 — 만료된 점유로 사지 못하게

- **문제**: 점유 시간이 지난 뒤에도 결제는 도착할 수 있습니다. 결제사가 느렸거나 사용자가 마지막 순간에 눌렀을 수 있습니다. 그 사이 다른 사람이 같은 좌석을 붙잡았다면, 늦은 결제가 판매로 이어지면 이중 판매입니다. Redis 분산 잠금 문서는 Redlock 알고리즘 절에서 상호 배제가 「guaranteed only as long as the client holding the lock terminates its work within the lock validity time」이라고 조건을 답니다(T12). 이 문장은 여러 인스턴스에 잠금을 거는 Redlock 의 단계 설명 안에 있으므로, 「잠금은 만료 시간 안에 일을 끝낼 때만 안전하다」는 일반 원리의 예로만 씁니다.
- **펜싱 토큰(Kleppmann)**: 「a fencing token is simply a number that increases (e.g. incremented by the lock service) every time a client acquires the lock」. 예시는 「Client 1 acquires the lease and gets a token of 33, but then it goes into a long pause and the lease expires.」이고, 저장소는 더 큰 토큰을 이미 처리했으므로 「it rejects the request with token 33」(T13). 이 글은 잠금의 목적을 둘로 나눕니다 — 「Taking a lock saves you from unnecessarily doing the same work twice」(효율)와 「Taking a lock prevents concurrent processes from stepping on each others' toes and messing up the state of your system.」(정확성). 결론은 「if you need locks for correctness, please don't use Redlock.」입니다(T13, 저자 견해 · Redis 원저자의 반론이 있음, 반론 글은 확인 안 함).
- **이 노트의 적용(판단)**: 좌석 행의 점유 번호(`hold_no`)가 펜싱 토큰 구실을 합니다. 점유할 때마다 1 씩 늘고, 판매 확정은 `UPDATE seats SET status='sold' WHERE seat_id=? AND status='held' AND hold_no=? AND hold_until >= now` 처럼 **내가 받은 번호가 아직 그대로이고 만료 전일 때만** 성공합니다. 0행이면 판매하지 않고 결제를 취소(환불)합니다. 결제를 두 번 하지 않는 일은 결제 편(CT-05)의 멱등 키가 맡습니다.
- **결제 전에 확정할지, 결제 뒤에 확정할지(판단)**: 결제 승인 뒤 확정이 실패하면 환불이 필요합니다. 결제 직전에 만료 시각을 한 번 더 확인해도 결제 도중 만료는 막지 못하므로, 확정 단계의 조건부 UPDATE 와 환불 경로가 함께 있어야 합니다.

### 4-4. 마지막 확인 — 판매 표의 유일 제약

- PostgreSQL: 「Unique constraints ensure that the data contained in a column, or a group of columns, is unique among all the rows in the table.」(T16), 「When an index is declared unique, multiple table rows with equal indexed values are not allowed.」(T16). 위반하면 오류 코드 `23505 unique_violation` 이 납니다(T16, 오류 코드 표). `INSERT … ON CONFLICT` 는 「The optional ON CONFLICT clause specifies an alternative action to raising a unique violation or exclusion constraint violation error.」(T16).
- 판매 표에 (공연, 좌석) 유일 제약을 두면, 4-2 · 4-3 의 조건부 UPDATE 를 코드에서 잘못 써도 같은 좌석의 두 번째 판매 행은 DB 가 받지 않습니다(판단). 앞 편 선착순 쿠폰의 「마지막 확인은 DB 유니크 제약」과 같은 자리입니다.
- 「일반 INSERT 가 중복이면 오류를 낸다」를 한 문장으로 적은 자리는 PostgreSQL 문서에서 찾지 못했습니다(확인 안 함). 위 정의 · 오류 코드 · ON CONFLICT 문장으로 씁니다.

### 4-5. 잠금 기법 비교 — 비관적 · 즉시 실패 · 건너뛰기 · 낙관적

- `FOR UPDATE`: 「FOR UPDATE causes the rows retrieved by the SELECT statement to be locked as though for update.」, 「This prevents them from being locked, modified or deleted by other transactions until the current transaction ends.」, 「Row-level locks do not affect data querying; they block only writers and lockers to the same row.」(T14).
- `NOWAIT` · `SKIP LOCKED`: 「With NOWAIT , the statement reports an error, rather than waiting, if a selected row cannot be locked immediately.」, 「With SKIP LOCKED , any selected rows that cannot be immediately locked are skipped.」(T15). 건너뛰기는 「Skipping locked rows provides an inconsistent view of the data, so this is not suitable for general purpose work, but can be used to avoid lock contention with multiple consumers accessing a queue-like table.」(T15). 좌석을 지정해 사는 예매에는 맞지 않고, 「아무 좌석이나 가장 좋은 자리 배정」처럼 좌석 묶음에서 하나를 꺼내는 경우에 쓸 수 있습니다(판단). MySQL InnoDB 문서에도 같은 옵션이 있다고 조사 워커가 보고했지만 원문 페이지가 403 이라 이 노트는 대조하지 못했습니다(확인 안 함).
- 낙관적 잠금(DynamoDB): 「Assumes conflicts are rare. It allows concurrent access and detects conflicts at write time using conditional writes.」, 「If a conflict is detected, the write fails and the application can retry.」(T17). 쓸 때는 「Conflicts are infrequent.」(T17). 버전 비교는 「You can update the item, but only if the version number on the server side has not changed.」, 실패는 「The update attempt fails, because you have a stale version of the item.」(T17). 인기 좌석처럼 경합이 몰리는 곳은 이 조건에 맞지 않으므로 재시도가 늘어납니다(판단). 4-2 의 조건부 UPDATE 도 넓게 보면 「읽지 않고 조건으로 쓰기」라 낙관적 쪽에 가깝지만, 버전을 먼저 읽어 오지 않고 상태 조건만으로 한 번에 판정한다는 점이 다릅니다(판단).

### 4-6. 좌석 지도와 검색 — 읽기를 점유 경로에서 떼어 낸다

- Hello Interview(T18, 교육용)는 읽기와 쓰기를 100:1 로 보고, 검색에는 「Add Elasticsearch or a similar full-text search engine.」, 좌석 지도에는 캐시와 실시간 갱신(SSE)을 듭니다. 같은 글은 「With popular events, the loaded seat map will go stale quickly.」라고 적습니다.
- 기업 1차 글 가운데 검색 · 좌석 지도를 예매 경로와 분리했다고 밝힌 곳은 찾지 못했습니다(확인 안 함). SeatGeek 의 캐시 이야기는 대기실 입구에 대한 것입니다 — 「We are using this edge dictionary as our primary cache.」(T1, Fastly 의 키-값 저장소).
- 가이드의 설계(판단): 좌석 지도는 캐시에서 몇 초 단위로 낡은 값을 보여 주고, 사용자가 좌석을 누르는 순간의 점유 UPDATE 가 진짜 판정입니다. 지도에서 「빈 좌석」으로 보였는데 점유가 실패하는 일이 생기며, 그때는 다른 좌석을 고르게 합니다.

## 5. 시나리오 절에 쓸 반례와 장애

시나리오 셋(기본 · 부하 · 장애)에 넣을 수 있는 상황입니다. 모두 가상 시계와 사건 순서로 재현할 수 있습니다(판단, 앞 편과 같은 방식).

1. **기본 — 한 사람이 좌석 하나를 사는 길**: 대기실에서 입장 토큰을 받고, 캐시된 좌석 지도를 보고, 좌석을 점유(조건부 UPDATE 1행, 만료 10분 뒤)하고, 결제한 뒤 판매를 확정합니다(조건부 UPDATE 1행 + 판매 행 INSERT). 요청은 하나의 흐름이고 부하도 장애도 없습니다.
2. **부하 — 같은 좌석을 여럿이 동시에**: 같은 좌석에 점유 요청이 동시에 여럿 오면 조건부 UPDATE 가 1행을 바꾸는 요청은 하나뿐이고, 나머지는 0행이라 바로 「이미 점유됨」을 받습니다. 기다리지 않으므로 행 잠금이 줄 서지 않습니다. 대기실은 판매 시작 순간의 1천만 명을 입장 속도만큼만 들여보내, 예매 경로의 동시 사용자가 일정합니다.
3. **부하의 반례 — 확인하고 쓰기를 두 번에 나눔**: `SELECT` 로 빈 좌석인지 보고 `UPDATE` 로 점유하면, 두 요청이 같은 빈 좌석을 보고 둘 다 점유합니다. 앞 편 선착순 쿠폰의 「확인과 차감을 두 명령으로 나눔」과 같은 실패입니다.
4. **장애 — 붙잡은 사람이 떠나거나 결제가 늦게 도착**: 사용자 A 가 점유한 뒤 결제하지 않고 떠나면 10분 뒤 좌석은 다시 점유 가능합니다(청소 작업 없이 조건이 판정). B 가 점유 번호 n+1 로 붙잡고, A 의 결제가 그 뒤에 도착하면 A 의 확정은 번호 n 이라 0행이고 결제는 취소됩니다. B 는 정상으로 삽니다.
5. **장애의 반례 — 좌석 행을 보지 않고 확정**: 결제가 끝났을 때 좌석 행의 점유 번호 · 만료를 확인하지 않고 판매 행만 INSERT 하면, 늦게 도착한 A 의 결제와 B 의 결제가 둘 다 같은 좌석의 판매 행을 만들려 합니다. 이때 막는 것은 판매 표의 유일 제약뿐이고, 유일 제약까지 없으면 이중 판매입니다(4-4). 점유자만 비교하는 확정(`holder=A`)은 B 가 점유한 경우는 막지만, A 가 만료 뒤 같은 좌석을 다시 점유한 경우처럼 점유자가 같아지는 경우를 가리지 못합니다 — 점유 번호를 비교하는 이유입니다(판단).
6. **장애의 반례 — Redis 잠금만 믿을 때**: 점유를 Redis `SET NX PX` 로만 하고 판매를 DB 에 따로 쓰면, Redis 주 노드가 복제 전에 멈춰 두 사람이 같은 잠금을 받는 경우(T12)나, 잠금 만료 뒤 늦은 쓰기(T13)를 DB 쪽이 모릅니다. 판매 표의 유일 제약이나 점유 번호 비교가 있어야 막힙니다.

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 점유를 두는 곳 | 같은 좌석 동시 점유 | 늦은 결제 | 대기실 없이 피크 | 근거 |
| --- | --- | --- | --- | --- | --- |
| A. `SELECT … FOR UPDATE` 로 좌석 행을 잠그고 결제 끝까지 트랜잭션 유지 | DB 행 잠금 | 뒤 요청이 기다림 | 트랜잭션이 열려 있는 동안은 막힘, 대신 연결 · 잠금이 결제 시간만큼 묶임 | — | T14 · T18 |
| B. Redis `SET NX PX` 로 점유, 판매는 DB | Redis 키 | 하나만 성공 | 만료 뒤 쓰기를 DB 가 모름, 복제 장애 시 두 사람 | — | T11 · T12 · T13 · T18 |
| C. DB 좌석 행의 상태 · 점유 번호 · 만료 시각 + 조건부 UPDATE, 판매 표 유일 제약 | DB 좌석 행 | 1행 바뀐 요청만 성공, 나머지 즉시 실패 | 점유 번호 · 만료 조건으로 확정 실패 → 환불 | — | T14 · T16 · T13 · T18(판단) |
| D. 버전 열 낙관적 잠금 | DB 좌석 행 | 버전 충돌 → 재시도 | 버전이 바뀌었으면 실패 | — | T17 |
| E. C 에 대기실 없음 | DB 좌석 행 | C 와 같음 | C 와 같음 | 판매 시작 순간 요청이 예매 경로로 그대로 | T5 · T1 |

- **추천 C(판단)**: 점유 · 만료 · 확정 · 마지막 확인이 한 DB 의 같은 행과 판매 표에서 끝나므로 두 저장소 사이 불일치가 없습니다. 만료를 조건 안에서 판정해 청소 작업이 정확성을 맡지 않습니다.
- **A 를 버리는 이유(판단)**: 행 잠금은 트랜잭션 끝에 풀리므로(T14) 결제 몇 분 동안 트랜잭션을 열어 둬야 합니다. 사용자가 떠나도 잠금은 트랜잭션 시간 제한이 올 때까지 남습니다.
- **B 를 버리는 이유(판단)**: Redis 문서 스스로 단일 인스턴스 잠금을 「a race condition from time to time is acceptable」한 곳에 쓸 만하다고 하고(T12), 정확성이 필요하면 펜싱 토큰을 요구합니다(T12 · T13). 결국 DB 쪽 확인이 다시 필요해, 점유 판정이 두 곳으로 나뉩니다. 다만 **DB 앞의 효율용 잠금**(같은 좌석으로 몰리는 요청을 DB 에 보내기 전에 줄이는 것)으로는 쓸 수 있습니다 — Kleppmann 의 효율 · 정확성 구분(T13).
- **D 를 버리는 이유(판단)**: DynamoDB 문서가 낙관적 잠금의 조건으로 「Conflicts are infrequent.」를 듭니다(T17). 인기 좌석은 반대입니다.
- **E 를 버리는 이유**: 판매 속도는 초당 십여 석인데(3절 1번, 계산) 몰리는 요청은 그 수천 배입니다(3절 3 · 4번, 계산). Ticketmaster 의 같은 판매에서 요청은 이전 최고치의 4배였습니다(T5).
- **전환점(판단)**: 좌석을 지정하지 않는 판매(구역만 고르고 자리는 배정)라면 `SKIP LOCKED` 로 좌석 묶음에서 하나씩 꺼내는 방식이 경합을 줄입니다(T15). 좌석 수가 DB 한 대의 쓰기 한계를 넘을 만큼 크면 공연별로 나눕니다 — 한 공연 안의 좌석은 같은 조각에 둡니다. 판매 시작 순간의 대기자가 적어 입장 속도가 예매 경로 처리량보다 낮으면 대기실을 끌 수 있습니다(SeatGeek 은 모든 행사를 대기실 뒤에 둠, T1).

## 7. 실제 사례 절에 쓸 대응표

| 회사 | 무엇을 했나 | 이 가이드의 어느 자리 | 출처 |
| --- | --- | --- | --- |
| SeatGeek | 자체 대기실(Room), 방문자 토큰 → 접근 토큰 교환, 보호 구간마다 다른 exit rate, 도착 순, 2,000개가 넘는 보호 구간. 접근 토큰 수를 남은 표 수와 같게 둠(AWS 공동 글) | 대기실 · 입장 속도 · 순서 | T1 · T3 |
| Cloudflare | 암호화한 쿠키 티켓, 활성 사용자 한도, 분 단위 버킷의 오래된 순, 데이터센터 상태를 전역으로 주기적 보고 | 대기실 · 순서 · 분산 구조 | T4 |
| Ticketmaster | 사전 등록 350만 · 코드 150만, 요청 35억 건(이전 최고의 4배), 경기장 한 공연은 보통 1시간, 결제 점유 시간은 수요에 따라 바꿈, 대기열 차례가 오면 그 자리를 10분 붙잡음 | 요구 · 규모 · 점유 시간 | T5 · T6 · T7 |
| AWS Virtual Waiting Room | 줄 번호를 받고, 앞에 오면 번호와 기기 ID 를 세션 토큰으로 교환, 용량이 나면 입장 | 대기실 | T8 |
| Queue-it | 판매 예정 시각 전 도착자는 무작위, 그 뒤는 도착 순, 설정한 처리 속도로 되돌려 보냄 | 순서 | T9 |
| 인터파크티켓 | 한 계정에 대기열 순번 하나, 여러 기기로 줄을 만들면 앞의 것은 종료(2024-08-08 부터) | 대기실의 규칙 | T10 |

- 좌석 점유 저장소와 이중 판매 방지 장치를 밝힌 기업 글은 찾지 못했습니다. 실제 사례 절은 대기실 쪽 사례로 채우고, 점유 쪽은 「공개 사례가 밝히지 않아 공식 문서로 설계했다」고 밝힙니다.
- 한국 예매처(인터파크 · NOL 티켓 · 멜론티켓 · YES24 · 티켓링크)의 좌석 선점 · 대기열 기술 글은 찾지 못했습니다. 임영웅 공연 예매의 「1분 만에 약 370만 트래픽」은 소속사 발언을 전한 보도(레이디경향, 2023-09-15)이고 단위(요청인지 사람인지)가 없어 쓰지 않습니다.

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 앞 편과 같은 틀입니다.
- DB 는 메모리 대역(좌석 표 · 판매 표)으로 두고, 조건부 UPDATE 는 「조건을 보고 바꾼 행 수(0 · 1)를 돌려주는 함수 하나」로 표현합니다. 판매 표의 유일 제약은 (공연, 좌석)이 이미 있으면 INSERT 가 실패하는 것으로 보입니다.
- 대기실은 줄(배열)과 입장 속도(가상 시각 1초마다 N 명)로 두고, 입장 토큰은 (사용자, 만료 시각) 쌍으로 둡니다. 판매 시작 전 도착자 섞기를 보이려면 정해진 씨앗의 의사 난수(세 언어에서 같은 수열이 나오는 정수 연산, 예: 선형 합동 생성기)를 씁니다(판단, 명세 SD26 결정성 규칙).
- 고정할 출력 후보: 같은 좌석 동시 점유 N 건 중 성공 1 · 실패 N-1, 확인하고 쓰기를 나눈 반례의 판매 2건, 만료 뒤 B 의 점유 번호와 A 의 확정 0행 · 환불, 만료 확인 없는 확정 반례의 이중 판매(유일 제약 없을 때) 또는 유일 제약 위반 1건, 대기실이 있을 때와 없을 때 예매 경로의 초당 요청 최대값, 매진까지 입장한 사람 수.
- 세 언어 출력의 글자 단위 일치를 위해 금액은 정수(원), 시각은 정수 밀리초로 찍습니다.

## 9. 미해결 질문

1. SeatGeek 슬라이드(PDF, 10MB 초과)는 열지 못했습니다. 좌석 점유 · 이중 판매 방지가 슬라이드에 있는지 확인 안 함입니다.
2. Ticketmaster 의 결제 점유 시간 실제 값은 공개되지 않았습니다(T7, 수요에 따라 바꿈). 대기열 안내의 10분(T6)과는 다른 값입니다.
3. Queue-it 이 판매 시작 전 도착자를 무작위로 섞는 이유를 적은 문장은 찾지 못했습니다.
4. AWS Virtual Waiting Room 구현 가이드(설정값 `QueuePositionExpiryPeriod` 900초 등)는 원문이 404 로 열리지 않았습니다. 쓰지 않습니다.
5. Redis 원저자의 Kleppmann 반론 글(antirez.com/news/101)은 열지 않았습니다.
6. MySQL InnoDB 잠금 읽기 문서는 403 으로 이 노트가 대조하지 못했습니다.
7. Hello Interview 페이지의 갱신일은 표시가 비어 있습니다(확인 안 함).
8. 3절의 좌석 5만 석 · 대기자 1천만 명 · 판매 시작 1분 · 평균 5분 · 점유 시도 수는 모두 가정입니다. 출처를 찾으면 그 값으로 바꿉니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-17 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트에서 문자열을 찾은 것이고(따옴표 모양 · 공백 · 코드 표시 백틱만 맞춤), 「조사 워커 원문」은 조사 워커가 원문에서 옮겼으나 이 노트가 다시 찾지 않은 것입니다. 인용 후보 92개를 대조했고 90개는 문자열이 바로 맞았으며, 2개(T1 의 「exchanger function」 · 「becomes available again」 문장)는 문장 끝 구두점만 달라 문맥으로 확인했습니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 같은 글 안의 다른 값 · 대상 · 동사 |
| --- | --- | --- | --- |
| T1 SeatGeek InfoQ 발표 | 글자 그대로 | 방문자 토큰 · 교환 함수 · 도착 순 · 보호 구간마다 exit rate · 2,000개 넘는 보호 구간 · 동시 예약 문제 제기 · 결제 실패 뒤 좌석이 다시 풀림 · 모든 행사가 대기실 뒤 | 무작위 선택은 일반 대안으로만 언급. exit rate 자동 조정은 계획 · 가능 서술. 점유 저장소 · 시간 · 이중 판매 방지는 없음. DynamoDB 한도 수치는 일반 설명 |
| T2 SeatGeek InfoQ 팟캐스트 | 글자 그대로(두 문장) | 좌석 예약 뒤 구매할 시간이 있음 · 도착 순으로 줄을 비움 | 녹취에 오기가 있다고 조사 워커가 경고. 예시 숫자(300 · 500 · 1000)는 쓰지 않음 |
| T3 SeatGeek · AWS 공동 글 | 글자 그대로 | FIFO 줄 · 접근 토큰 수 = 남은 표 수 · 구매하면 토큰 만료 · 자사 쿠키(first-party cookie)와 토큰 확인 권장 | 입장 속도 결정 방식 · 수치 없음 |
| T4 Cloudflare 대기실 | 글자 그대로 | 줄 세우기 · 활성 사용자 한도 · 암호화 쿠키 · 분 단위 버킷 · 오래된 버킷부터 · 데이터센터 → 전역 보고 | 좌석 · 재고 언급 없음. 250 · 200 은 서로 다른 설명용 예시. 고객 사례 수치는 고객 사이트의 값 |
| T5 Ticketmaster 보도자료 | 글자 그대로 | 350만 · 150만 · 35억 건 · 4배 · 보통 1시간 · 검증된 구매자만 줄에 · 그날 200만 장 이상 · 과거 40% · 평균 3장 | 40% · 3장은 과거 평균(Historically). 35억은 봇과 코드 없는 팬이 몰려 생긴 전체 요청 |
| T6 Ticketmaster 대기열 안내 | 글자 그대로 | 차례가 오면 그 자리를 10분 붙잡음 · 판매 시작 뒤 합류하면 맨 뒤 | 10분은 좌석 점유 시간이 아님. 게시일 확인 안 함 |
| T7 Ticketmaster 결제 시간 안내 | 글자 그대로 | 결제 전 붙잡는 시간을 제한 · 수요에 따라 길이를 바꿈 | 고정 분 수 없음 |
| T8 AWS Virtual Waiting Room 소개 | 글자 그대로 | 줄 번호 · 세션 토큰 교환 · 용량이 나면 입장 | 100명은 시험 예시. 구현 가이드 설정값은 원문 404 |
| T9 Queue-it | 글자 그대로 | 시작 전 무작위 · 그 뒤 도착 순 · 설정한 처리 속도 | 상시 보호 모드는 도착 순. 게시일 확인 안 함 |
| T10 예술의전당 게시 인터파크 안내 | 글자 그대로 | 한 계정 한 순번 · 여러 기기면 앞의 줄 종료 | 게시 기간 2024-09-03~2024-12-31, 변경일 8월 8일(연도는 게시 기간에서) |
| T11 Redis SET | 글자 그대로 | NX · PX · 성공한 SET 은 기존 TTL 을 지움 · 잠금 패턴은 Redlock 을 권함 · 무작위 토큰 · 값이 같을 때만 지우는 스크립트 | `IFEQ` 등은 8.4.0 부터. T12 와 강조가 다름 |
| T12 Redis 분산 잠금 | 글자 그대로 | `SET … NX PX 30000` · 값의 유일성 · DEL 만 쓰면 안전하지 않음 · 단일 인스턴스는 가끔의 경합을 받아들일 수 있는 곳에 · 비동기 복제 · 펜싱 토큰 권고 · 단조 시계가 아님 · DELEX 는 8.4 부터 | 상호 배제 조건 문장은 Redlock 절(단계 3)의 것이라 일반 원리의 예로만 씀. Redlock 알고리즘 자체는 노트에 옮기지 않음 |
| T13 Kleppmann | 글자 그대로 | 펜싱 토큰 정의 · 토큰 33 예시와 거절 · 효율 · 정확성 구분 · 정확성에는 Redlock 쓰지 말 것 · GC 멈춤이 만료보다 길 때 | 저자 견해. 2016-02-09 에 Redis 원저자의 반론 링크가 붙음(반론 미확인) |
| T14 PostgreSQL 18 명시적 잠금 | 글자 그대로 | FOR UPDATE 정의 · 트랜잭션 끝까지 막음 · 읽기는 막지 않음 · 트랜잭션 끝에 풀림 | 문서 판 18.7 |
| T15 PostgreSQL 18 SELECT | 글자 그대로 | NOWAIT · SKIP LOCKED 정의 · 건너뛰기는 일반 업무용이 아니고 큐 같은 표에 쓸 수 있음 | — |
| T16 PostgreSQL 18 제약 · 유일 색인 · 오류 코드 · INSERT | 글자 그대로 | 유일 제약 정의 · 유일 색인은 같은 값 행 불허 · 23505 unique_violation · 55P03 lock_not_available · ON CONFLICT | 「일반 INSERT 중복이면 오류」를 한 문장으로 적은 곳은 못 찾음 |
| T17 DynamoDB 동시 갱신 · 낙관적 잠금 | 글자 그대로 | 낙관적 잠금 정의 · 충돌하면 실패하고 재시도 · 충돌이 드물 때 · 버전이 그대로일 때만 갱신 · 낡은 버전이면 실패 | 뒤 문서는 Java SDK `DynamoDBMapper` 설명. 전역 테이블에서는 버전 확인이 기대대로 되지 않음 |
| T18 Hello Interview Ticketmaster | 글자 그대로 | 결제 동안 잠가야 함 · 10분 TTL 예시 · 긴 DB 잠금은 Bad · PostgreSQL 에 행 TTL 없음 · 예매 화면 전에 대기열 · 좌석 지도가 빨리 낡음 · 1천만 명 · 100:1 · 500ms | 교육용 면접 분석이고 회사 운영값이 아님. 점유 방식을 여럿(Good · Great) 제시. 갱신일 확인 안 함 |

## 11. 출처

조회일은 모두 2026-11-17 입니다.

- T1. [SeatGeek — High Demand Ticket On-Sales (InfoQ 발표)](https://www.infoq.com/presentations/ticketing-system-virtual-waiting-room/) — 2022-12-29
- T2. [InfoQ Podcast — Handling High Demand Ticket On-Sales](https://www.infoq.com/podcasts/handling-high-demand-ticket-on-sales-parra-pellegrino) — 2022-05-30
- T3. [AWS Architecture Blog — Build a Virtual Waiting Room with Amazon DynamoDB and AWS Lambda at SeatGeek](https://aws.amazon.com/blogs/architecture/build-a-virtual-waiting-room-with-amazon-dynamodb-and-aws-lambda-at-seatgeek/) — 2021-07-29
- T4. [Cloudflare — Building Waiting Room on Workers and Durable Objects](https://blog.cloudflare.com/building-waiting-room-on-workers-and-durable-objects) — 2021-06-16
- T5. [Ticketmaster — Taylor Swift | The Eras Tour Onsale Explained](https://business.ticketmaster.com/press-release/taylor-swift-the-eras-tour-onsale-explained/) — 2022-11-19
- T6. [Ticketmaster Help — What is the Ticketmaster Smart Queue?](https://help.ticketmaster.com/hc/en-us/articles/9781366115985-What-is-the-Ticketmaster-Smart-Queue-) — 게시일 확인 안 함
- T7. [Ticketmaster Help — Why is there a time limit for checking out?](https://help.ticketmaster.com/hc/en-us/articles/9642204793617-Why-is-there-a-time-limit-for-checking-out) — 게시일 확인 안 함
- T8. [AWS Compute Blog — Introducing AWS Virtual Waiting Room](https://aws.amazon.com/blogs/compute/introducing-aws-virtual-waiting-room/) — 2022-02-10
- T9. [Queue-it — How Queue-it works](https://queue-it.com/developers/how-queue-it-works) — 게시일 확인 안 함
- T10. [예술의전당 — 인터파크티켓 대기열 정책 변경 안내](https://www.sac.or.kr/site/main/board/sacnews/308445) — 게시 기간 2024-09-03 ~ 2024-12-31
- T11. [Redis — SET](https://redis.io/docs/latest/commands/set/) — 게시일 확인 안 함
- T12. [Redis — Distributed Locks with Redis](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) — 게시일 확인 안 함
- T13. [Martin Kleppmann — How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) — 2016-02-08
- T14. [PostgreSQL 18 — Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) — 게시일 확인 안 함(문서 판 18.7)
- T15. [PostgreSQL 18 — SELECT](https://www.postgresql.org/docs/current/sql-select.html) — 게시일 확인 안 함(문서 판 18.7)
- T16. [PostgreSQL 18 — Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) · [Unique Indexes](https://www.postgresql.org/docs/current/indexes-unique.html) · [Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html) · [INSERT](https://www.postgresql.org/docs/current/sql-insert.html) — 게시일 확인 안 함(문서 판 18.7)
- T17. [AWS DynamoDB — Best practices for handling concurrent updates](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/BestPractices_ImplementingVersionControl.html) · [Optimistic locking with version number](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBMapper.OptimisticLocking.html) — 게시일 확인 안 함
- T18. [Hello Interview — Design a Ticket Booking Site Like Ticketmaster](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster) — 갱신일 확인 안 함(교육용 분석)

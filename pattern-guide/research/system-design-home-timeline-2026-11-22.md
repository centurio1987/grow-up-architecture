# 리서치 노트 — 홈 타임라인: 미리 만들어 둘지, 읽을 때 모을지, 큰 계정은 어떻게

- 조사일: 2026-11-22. 자료 조사는 조사 워커 둘이 했고(기업 기술 글과 강연 · 공식 문서와 공개 코드), 본문에 실을 만한 인용과 수치는 같은 날 원문 페이지 · 슬라이드 PDF · Mastodon 코드를 다시 받아 문자열을 맞췄습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 여섯째 편(`home-timeline`, 사례 목록 [RD-01](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S14 의 산출물입니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `N` 으로 시작합니다(앞 노트의 `V` · `C` · `L` · `P` · `T` · `G` · `K` 와 겹치지 않게). 사례 목록 RD-01 행의 D1 은 이 노트의 N1 · N2, D2 는 N5 입니다. 같은 행의 XU1 · P · HI · GM · DG(교육용 분석)는 이 노트가 열어 보지 않았습니다.
- **사례마다 시점이 다릅니다.** Twitter 는 2012-11 강연(요약 글은 2013-07), Facebook 은 2012-06 슬라이드와 2015-03 글, Tumblr 는 2012-11 · 2013-05 인터뷰 정리 글, LinkedIn 은 2016-03, Mastodon 은 v4.7.6(2026-11-19 릴리스) 코드와 현재 문서입니다. 시점이 다른 사례를 한 흐름으로 잇지 않습니다.
- **Twitter 의 핵심 수치는 2차 자료입니다.** 강연 페이지(N1)에는 대본이 없고, 800 · 30일 · 「큰 계정은 읽을 때 섞는다」는 High Scalability 의 요약 글(N2)과 VMware 의 사례 글(N3)에서 왔습니다. 가이드는 「Twitter 가 말했다」가 아니라 「2012년 강연의 요약 글에 따르면」으로 씁니다.

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 쓰기 때 퍼뜨리기 · 4-2 읽을 때 모으기 · 4-3 큰 계정과 혼합 · 4-4 타임라인 캐시의 모양 · 4-5 비활성 사용자 · 4-6 순서와 커서 페이지) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 요구 후보 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

홈 타임라인은 「내가 팔로우한 사람들의 글을 모아 최근 것부터 보여 주는 목록」입니다. 2012년 Twitter 강연의 요약 글은 이것을 「A home timeline is a temporal merge of all the user timelines of the people are you are following.」(원문 문장 그대로)로 적습니다(N2, 절 Push Me Pull Me). 어려운 점은 읽기와 쓰기의 균형입니다. 같은 글은 읽기 초당 30만 건 대 쓰기 초당 6천 건을 적고(「300K requests per second for reading and 6000 RPS for writing.」, N2), 팔로워가 3,100만인 계정의 글 하나가 퍼지는 데 5분까지 걸린다고 적습니다(「it can take up to 5 minutes for a tweet to flow from Lady Gaga's fingers to her 31 million followers.」, N2).

공개 사례는 세 갈래입니다.

1. **쓰기 때 퍼뜨림(fan-out on write)** — 2012년 Twitter: 「Solution is a write based fanout approach.」(N2). 바로 앞 문장은 읽을 때 한꺼번에 조회하는 방식이 「It was tried and died」라고 적습니다. Mastodon 은 지금 코드에서 새 글을 팔로워마다 작업 큐에 넣어 각자의 홈 피드에 씁니다(N12, `FeedInsertWorker.push_bulk(followers)`).
2. **읽을 때 모음(fan-out on read)** — Facebook 2012: 「Multi-fetch and aggregate stories at read time」을 고르고 그 이유를 「Write amplification makes the storage needs expensive in Megafeed」 등 넷으로 듭니다(N6). LinkedIn 2016: 「the fan-out-on-read model is more efficient for our use case」(N5).
3. **혼합** — 2012년 Twitter 강연 요약 글의 「The Future」 절: 「For people like Taylor Swift don't bother with fanout anymore, instead merge in her timeline at read time.」(N2, 계획 단계). Tumblr 인터뷰 정리 글: 큰 계정은 「selectively materializing user feeds by their access model」(N8).

이 노트의 추천 구조(판단)는 이렇습니다. **새 글은 작업 큐를 거쳐, 최근에 접속한 팔로워들의 타임라인 캐시에 글 ID 만 넣습니다. 캐시는 사용자마다 글 ID 를 점수로 쓰는 정렬 집합이고 최근 800개만 남깁니다. 팔로워가 정해진 수를 넘는 큰 계정의 글은 퍼뜨리지 않고, 읽을 때 그 계정들의 최근 글을 캐시에 섞습니다. 오래 접속하지 않은 사용자는 퍼뜨리는 대상에서 빼고, 돌아오면 다시 만듭니다. 페이지는 오프셋이 아니라 시간순으로 커지는 글 ID 를 커서로 씁니다.** 근거와 버린 후보는 6절에 있습니다. 큰 계정의 기준(팔로워 수)은 어느 공개 자료에도 없어 가이드가 계산으로 정해야 합니다(4-3).

## 2. 요구사항 절에 쓸 근거 — 「빨리 보이게」와 「큰 계정」을 숫자로

| 값 | 원문 | 대상 · 시점 | 출처 |
| --- | --- | --- | --- |
| 전달 목표 | 「Goal is to have a message flow to a user in no more than 5 seconds.」 | Twitter, 2012-11 강연의 요약 | N2 절 Push Me Pull Me |
| 읽기 · 쓰기 | 「300K requests per second for reading and 6000 RPS for writing.」 | 같음 | N2 절 Search and Pull are Inverses |
| 1백만 명에게 전달 | 「3.5 seconds @ p50 (50th percentile) to deliver to 1m」 | 같음 | N2 절 Monitoring |
| 큰 계정의 전달 | 「it can take up to 5 minutes for a tweet to flow from Lady Gaga's fingers to her 31 million followers.」 | 같음 | N2 도입부 |
| 목표와 현실 | 「Fanout can be slow. Try to do it under 5 seconds but doesn't work sometimes.」 | 같음 | N2 절 The Future |
| 피드 조회 규모 | 슬라이드 7쪽 「10 billion / day」 · 「60 ms」 평균 지연 | Facebook, 2012-06 | N6 |
| 지연 | 「FollowFeed's p99 latency for the mobile news feed is around 140ms」 | LinkedIn, 2016 | N5 |
| 쓰기 대 읽기 | 「Dashboard runs at a million writes a second, 50K reads a second, and it is growing.」 | Tumblr, 2013 인터뷰 정리 | N9 |
| 한 번에 보는 양 | 「Defaults to 20 statuses. Max 40 statuses.」 | Mastodon 홈 타임라인 API | N11 |

- Twitter 의 쓰기 수치는 같은 강연이어도 출처마다 다릅니다. 요약 글(N2)은 초당 6천 건, 슬라이드의 제3자 사본은 하루 약 4억 건 · 평균 약 5천 · 피크 약 7천 · 큰 사건 때 1만 2천 이상이라고 조사 워커가 전했습니다(사본이라 이 노트는 대조하지 않음, 확인 안 함). 가이드는 N2 의 값만 쓰고 시점을 붙입니다.
- Tumblr 는 쓰기(초당 1백만)가 읽기(초당 5만)보다 많습니다. 받은편지함(inbox) 방식에서는 글 하나가 팔로워 수만큼 쓰기가 되기 때문이고, 같은 정리 글은 「Posts are only about 50GB a day. Follower list updates are 2.7TB a day.」라고 적습니다(N8). 「Follower list updates」가 정확히 무엇을 센 것인지 글이 풀지 않아 해석에 주의합니다(판단).
- **요구 표 후보(가정)**: 하루 활성 사용자 수 · 평균 팔로우 수 · 초당 새 글 · 초당 타임라인 읽기(Twitter 2012 요약의 읽기 대 쓰기 비율을 참고), 새 글이 팔로워 타임라인에 보이기까지 5초 안(N2 의 목표를 빌린 가정), 타임라인 첫 페이지 응답 수십 ms 안(가정), 팔로워가 매우 많은 계정(예: 1억 명)이 글을 써도 위 5초를 지킴(가정 — 문제의 어려운 점), 오래 쉬었다 돌아온 사용자도 첫 화면을 몇 초 안에 받음(가정), 페이지를 넘겨도 글이 빠지거나 두 번 나오지 않음(가정).
- 위 가운데 「큰 계정이 써도 5초」는 사례 목록 RD-01 행의 어려운 점(「팔로워 많은 계정의 쓰기 fan-out 폭증」)에서 나온 요구이고, 고른 구조에 맞춰 넣은 것이 아닙니다(판단). 큰 계정 기준은 요구가 아니라 구조의 설정값입니다.

## 3. 규모 추정 절에 쓸 계산

출처 수치는 Twitter 2012 요약(N2)과 Mastodon 코드(N12)이고, 나머지는 가이드의 가정과 그 계산입니다.

1. 쓰기 증폭: 새 글 하나가 팔로워 F 명의 캐시에 들어가면 쓰기 F 번입니다(계산). 평균 팔로워 200명(가정)이면 초당 새 글 6천 건(N2 의 값을 빌린 가정) × 200 = 초당 120만 번 캐시 쓰기입니다(계산).
2. 큰 계정 하나: 팔로워 3,100만 명(N2 의 예)에게 퍼뜨리면 글 하나가 쓰기 3,100만 번입니다. 초당 1백만 번 쓰는 퍼뜨리기 작업이면 31초입니다(계산 — 31,000,000 ÷ 1,000,000). 5초 요구를 지키려면 초당 620만 번 이상이 그 글 하나에 들어가야 합니다(계산).
3. 읽을 때 모으기: 팔로우 K 명의 최근 글을 읽을 때마다 모으면 읽기 하나가 K 곳 조회입니다. K = 200, 초당 읽기 30만 건(N2 의 값을 빌린 가정)이면 초당 6천만 번 조회입니다(계산). Facebook 은 한 번의 피드 조회에 「Do ~40 requests per feed query」라고 적었고(N6) 읽을 때 모으는 대상을 「bounded (<10k)」로 묶었습니다(N6).
4. 캐시 크기: 사용자마다 글 ID 800개(N2 · N12) × 8바이트(64비트 ID, N16) = 6,400 바이트이고, 활성 사용자 1억 명(가정)이면 약 640 GB 입니다(계산, 자료구조의 덧붙는 크기 제외). 비활성 사용자를 빼는 이유가 이 크기입니다(4-5).
5. 혼합의 읽기 비용: 큰 계정 B 개를 팔로우하는 사용자는 읽을 때 캐시 하나 + 큰 계정 B 곳을 조회합니다(계산). 큰 계정 기준이 낮을수록 B 가 커져 읽기가 늘고, 높을수록 2번의 쓰기 증폭이 커집니다 — 기준은 이 둘의 저울질입니다(판단).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 쓰기 때 퍼뜨리기 — 글이 팔로워의 캐시로 간다

- Twitter 2012(N2, 2차): 「Solution is a write based fanout approach.」, 바로 뒤 「Do a lot of processing when tweets arrive to figure out where tweets」…(이 노트가 원문에서 읽음). 퍼뜨릴 대상은 「Fanout queries the social graph service that is based on Flock.」, 한 번에 「Pipelined 4k destinations at a time」, 캐시 복제는 「Each tweet is replicated 3 times on 3 different machines.」(N2 절 High Level for Pull Based Timelines).
- Twitter 의 캐시 자료구조(N4, 2014 강연의 2차 요약): 「Redis drives Timeline, Twitter's most important service.」, 「Memcache didn't work as well as Redis for the timeline. The problem was dealing with fanout.」, 「Hybrid List is a linked list of ziplists.」 — 2012 강연과 시점이 다릅니다.
- Mastodon v4.7.6(N12, 공개 코드): `FanOutOnWriteService` 가 팔로워를 묶음으로 읽어 `FeedInsertWorker.push_bulk(followers)` 로 작업 큐(Sidekiq)에 넣고, 작업마다 `push_to_home` 이 그 팔로워의 홈 피드에 넣습니다. v4.7.6 의 `fan_out_on_write_service.rb` 에는 팔로워 수로 퍼뜨리기를 건너뛰는 분기가 없습니다. `deliver_to_all_followers!` 가 조건 없이 팔로워를 묶음으로 큐에 넣습니다(이 노트가 파일 전체에서 확인). 그 팔로워 목록(`followers_for_local_distribution`)이 무엇을 거르는지는 열어 보지 않았습니다(확인 안 함).
- Redis 파이프라인(N15): 「Redis pipelining is a technique for improving performance by issuing multiple commands at once without waiting for the response to each individual command.」 한 번에 너무 많이 보내지 말라는 권고 — 「it is better to send them as batches each containing a reasonable number, for instance 10k commands」. Twitter 의 「4k destinations at a time」(N2)과 같은 생각입니다(판단).

### 4-2. 읽을 때 모으기 — 읽는 순간 팔로우한 곳에서 가져온다

- Facebook 2012(N6, 슬라이드 직접 읽음): 9쪽 Megafeed 는 「Broadcast writes to your friends」, 10쪽 Multifeed 는 「Multi-fetch and aggregate stories at read time」. 11쪽 「Chose Multifeed」의 이유 넷 — 「Write amplification makes the storage needs expensive in Megafeed」, 「Developing with read-time aggregation is flexible」, 「Memory and network easier to engineer around」, 「Never have huge fan-out write to do, only bounded (<10k) fan-out read」. 16쪽 「Most natural data structure is a hashtable to a linked list」.
- Facebook 2015(N7): 「each aggregator fanned out the request to all the leaves to fetch data」 — **여기서 fan-out 은 요청을 여러 leaf 서버에 뿌린다는 뜻이고, 글을 팔로워에게 퍼뜨리는 fan-out 과 다릅니다.** 가이드에서 섞지 않습니다.
- LinkedIn 2016(N5): 두 모델을 「Pre-materialization or Fan-out-on-write model: Feed for each viewer is pre-computed, materialized and kept ready for retrieval」과 「Query on demand or Fan-out-on-read model: Feed for a viewer is constructed at read time」로 나누고 읽을 때 모으기를 골랐습니다. 이유: 「In the fan-out-on-write model, multiple copies of each content record are persisted resulting in an increase in data size.」 · 「data size with this model was 62 times greater than pull based architecture.」(LinkedIn 실험), 그리고 관련성 모델을 바꿔 시험하기 어렵다는 것(「This approach makes A/B testing of relevance models significantly harder」). 저장은 「For persistent storage, FollowFeed uses RocksDB」, 값은 「a list of content records in reverse chronological order.」.
- 주의(판단): Facebook 과 LinkedIn 은 피드를 관련성 점수로 정렬하는 서비스이고, 친구 수나 팔로우 대상이 묶여 있습니다(Facebook 의 「<10k」). 시간순 홈 타임라인과 같은 조건이라고 쓰지 않습니다.

### 4-3. 큰 계정과 혼합 — 퍼뜨리지 않고 읽을 때 섞는다

- Twitter 2012 강연의 요약 글(N2, 절 The Future): 「Trying to figure out how to merge the read and write paths.」, 「For people like Taylor Swift don't bother with fanout anymore, instead merge in her timeline at read time.」 — **계획 단계**의 서술이고 요약 글 작성자의 표현입니다. 「Twitter 가 팔로워 N 명 이상을 읽을 때 섞는다」로 쓰지 않습니다.
- Tumblr 2012 인터뷰 정리(N8, 2차): 「A user having millions of followers who are really active is handled by selectively materializing user feeds by their access model (see Feeding Frenzy ).」 — 원문이 가리키는 「Feeding Frenzy」 논문은 이 노트가 열어 보지 않았습니다(확인 안 함). 같은 글: 「An inbox is the opposite of scatter-gather.」, 「The current scatter-gather model for providing Dashboard functionality has very limited runway.」(그때의 방식에서 받은편지함으로 옮기려는 계획).
- **큰 계정의 기준(팔로워 수)은 N2 · N8 · N5 · N6 · N12 어디에도 없습니다.** 검색 결과에 보이는 「1만 · 10만 · 1백만」 같은 기준은 면접 대비 글이라 쓰지 않습니다. 가이드는 3절 2번과 5번의 저울질로 기준을 계산해 정합니다(판단).
- 혼합의 읽기 쪽(판단): 캐시에서 최근 글 ID 를 읽고, 팔로우한 큰 계정마다 최근 글 ID 를 읽어 하나의 순서로 합칩니다. 합치는 순서는 4-6 의 시간순 ID 로 정합니다.

### 4-4. 타임라인 캐시의 모양 — 글 ID 만, 최근 800개

- Twitter 2012(N2): 「Your home timeline sits in a Redis cluster and has a maximum of 800 entries.」(도입부)와 「Your home timeline sits in a Redis cluster and is 800 entries long.」(절 High Level for Pull Based Timelines) — 값은 같고 표현만 다릅니다. VMware 사례 글(N3, 강연을 출처로 밝힌 2차): 「the Twitter engineering team limits Redis to storing the last 800 tweet IDs for each home timeline.」, 「Redis doesn't store the 140 character tweet information itself」.
- Mastodon v4.7.6(N12): 상수 `MAX_ITEMS = 800`(주석 「# Maximum number of items stored in a single feed」), 넣기 `redis.zadd(timeline_key, status.id, status.id)` — **정렬 집합에 글 ID 를 점수와 멤버로 둘 다** 넣습니다. 자르기 `redis.zremrangebyrank(timeline_key, 0, -(FeedManager::MAX_ITEMS + 1))` — 점수가 낮은(오래된) 쪽을 지워 최근 800개만 남깁니다. Mastodon 의 800 은 Twitter 의 800 과 별개의 값입니다(판단).
- Redis 리스트로 최근 N 개만 남기는 쓰임(N13): 「A common use of LTRIM is to use it with LPUSH or RPUSH.」, 「This pair of commands will push a new element on the list, while making sure that the list will not grow larger than 100 elements.」, 그리고 「It is important to note that when used in this way LTRIM is an O(1) operation because in the average case just one element is removed from the tail of the list.」 데이터형 소개는 「Redis allows us to use lists as a capped collection, only remembering the latest N items and discarding all the oldest items using the LTRIM command.」, 쓰임으로 「Remember the latest updates posted by users into a social network.」.
- 정렬 집합(N14): 「Sorted sets are implemented via a dual-ported data structure containing both a skip list and a hash table」. 같은 멤버를 다시 넣으면 — 「If a specified member is already a member of the sorted set, the score is updated and the element reinserted at the right position to ensure the correct ordering.」 그래서 같은 글이 두 번 퍼져도 캐시에 한 번만 남습니다(판단 — 리스트는 두 번 남음). 최근 것부터 읽기 — 「Using the REV option reverses the sorted set, with index 0 as the element with the highest score.」(ZRANGE). 점수는 배정밀도 부동소수라 「This format precisely represents integers between -(2^53) and +(2^53), inclusive.」(ZADD) — 64비트 ID 는 이 범위를 넘을 수 있습니다(판단 — Mastodon 의 ID 설계가 이 범위에 드는지는 확인 안 함).
- 가이드가 쓸 말(판단): 리스트는 넣기 · 자르기에 드는 일이 적고 같은 글이 두 번 들어갈 수 있습니다. 정렬 집합은 넣기가 O(log N) 이지만 글 ID 로 중복이 없고 「이 ID 보다 작은 것」을 바로 읽을 수 있어 커서 페이지(4-6)와 큰 계정 섞기(4-3)에 맞습니다.

### 4-5. 비활성 사용자 — 퍼뜨리지 않고, 돌아오면 다시 만든다

- Twitter 2012(N2, 2차): 「If you are not an active user then the tweet does not go into the cache.」, 「Active user is someone who has logged into Twitter within 30 days, which can change depending on cache capacity or Twitter's usage.」. 돌아온 사용자를 어떻게 다시 만드는지는 이 글에 없습니다(확인 안 함). 같은 글: 「Every active user is stored in RAM to keep latencies down.」
- Mastodon(N10, 문서): 「Mastodon stores home feeds in RAM (specifically, in the Redis database).」, 「Mastodon periodically clears out home feeds of users who haven't been online in a while」, 「if they re-appear, it regenerates those home feeds from database data.」, 「By default, users are considered active if they have been online in the past 7 days.」, 그리고 「Regeneration of home feeds is computationally expensive」. 백업 문서는 「The home and list feeds are stored in Redis but can be regenerated with tootctl.」.
- Mastodon v4.7.6(N12, 코드): `ACTIVE_DURATION = ENV.fetch('USER_ACTIVE_DAYS', 7).to_i.days`. 퍼뜨릴 때 `push_to_home` 첫 줄이 `return false unless account.user&.signed_in_recently?` — 오래 접속하지 않은 팔로워의 홈 피드에는 넣지 않습니다. 다시 만들 때는 `PrecomputeFeedService` 가 `FeedManager.instance.populate_home(account)` 를 부르고, 다시 만드는 동안 홈 타임라인 API 는 206(부분 응답)을 돌려줍니다(N11, 조사 워커 원문).
- 가이드가 쓸 말(판단): 비활성 사용자를 빼면 3절 4번의 캐시 크기와 1번의 쓰기가 활성 비율만큼 줄어듭니다. 대가는 돌아온 사용자의 첫 화면이 다시 만들기를 기다리는 것이고, Twitter 의 30일(2012)과 Mastodon 의 7일(현재 기본값)은 그 저울질의 서로 다른 값입니다.

### 4-6. 순서와 커서 페이지 — 시간순으로 커지는 ID 를 커서로

- 시간순 ID(N17 · N16 · N18): Twitter 의 Snowflake 저장소 README(2010) — 「time - 41 bits (millisecond precision w/ a custom epoch gives us 69 years)」, 「configured machine id - 10 bits - gives us up to 1024 machines」, 「sequence number - 12 bits - rolls over every 4096 per machine (with protection to avoid rollover in the same ms)」. X 의 현재 문서 — 「X IDs are 64-bit unsigned integers」, 「This means IDs are roughly time-ordered: higher IDs generally represent newer objects.」(대략의 순서이지 엄밀한 보장이 아님). Discord — 「Discord utilizes Twitter's snowflake format for uniquely identifiable descriptors (IDs).」(비트 구성은 Discord 쪽이 다름, 조사 워커 원문).
- Mastodon API(N11): `max_id` — 「All results returned will be lesser than this ID. In effect, sets an upper bound on results.」, `since_id` — 「All results returned will be greater than this ID. In effect, sets a lower bound on results.」, `min_id` — 「Returns results immediately newer than this ID. In effect, sets a cursor at this ID and paginates forward.」. ID 는 「Always treat IDs as opaque strings」.
- Mastodon v4.7.6 의 읽기(N12, `Feed#get`): `zrevrangebyscore(key, "(#{max_id}", "(#{since_id}", limit: [0, limit], with_scores: true)` — 점수가 글 ID 이므로 「max_id 보다 작고 since_id 보다 큰」 것을 오프셋 0 으로 읽습니다. Redis 의 열린 구간 — 「It is possible to specify an open interval (exclusive) by prefixing the score with the character (.」(N14, ZRANGE). `ZREVRANGEBYSCORE` 는 6.2.0 부터 사용 중단(deprecated)으로 표시되고 `ZRANGE … BYSCORE REV` 가 대신합니다(N14, 이 노트가 원문에서 확인).
- 오프셋 방식의 비용(N14): 「Keep in mind that if <offset> is large, the sorted set needs to be traversed for <offset> elements before getting to the elements to return, which can add up to O(N) time complexity.」 리스트도 「LRANGE list 0 10 will return 11 elements, that is, the rightmost item is included.」처럼 위치로 읽습니다(N13).
- X API(N16): 「Pagination tokens are opaque strings」, 「For new data, use since_id instead of paginating repeatedly.」, 한도를 넘으면 「Requesting Posts beyond these limits returns a successful response with no data.」.
- **「오프셋 대신 ID 커서를 쓰는 이유」를 직접 적은 공식 문장은 Mastodon · X · Discord 문서에서 찾지 못했습니다(확인 안 함).** 가이드는 이유를 판단으로 씁니다: 새 글이 계속 앞에 붙으므로 오프셋으로 다음 페이지를 읽으면 그사이 붙은 글만큼 위치가 옮겨져 같은 글이 두 번 나오고, ID 경계로 읽으면 그렇지 않습니다(판단 — 이 노트의 설명이며 모형으로 보일 수 있음).

## 5. 시나리오 절에 쓸 반례와 장애

시나리오 셋(기본 · 부하 · 장애)에 넣을 수 있는 상황입니다. 모두 가상 시계와 사건 순서로 재현할 수 있습니다(판단, 앞 편과 같은 방식). SD9 에 따라 기본 흐름에는 부하도 장애도 없는 요청 하나만 둡니다.

1. **기본 — 글 하나가 팔로워의 타임라인에 보이는 길**: 팔로워가 몇 명인 보통 계정이 글을 쓰면 글 저장소에 쓰고, 퍼뜨리기 작업이 큐에서 꺼내 활성 팔로워의 캐시에 글 ID 를 넣습니다. 팔로워가 타임라인을 열면 캐시에서 최근 ID 를 읽고 글 저장소에서 본문을 채웁니다.
2. **부하 — 큰 계정이 글을 씀**: 팔로워가 매우 많은 계정이 쓴 글을 모두에게 퍼뜨리면 3절 2번의 쓰기가 그 글 하나에 몰려, 다른 글을 퍼뜨리는 일까지 늦어집니다. 혼합 방식이면 큰 계정의 글은 퍼뜨리지 않고, 팔로워가 읽을 때 섞습니다. 두 경우의 「글이 마지막 팔로워에게 보이기까지」와 읽기 비용을 비교합니다.
3. **부하의 반례 — 오프셋 페이지**: 사용자가 첫 페이지(20개)를 본 뒤 새 글 5개가 붙고 다음 페이지를 오프셋 20 으로 읽으면, 첫 페이지 끝의 5개가 두 번 나옵니다(판단, 모형으로 보일 수 있음). `max_id` 커서로 읽으면 두 번 나오지 않습니다.
4. **장애 — 타임라인 캐시 노드를 잃음**: 캐시가 비면 그 사용자들의 타임라인은 글 저장소와 팔로우 목록에서 다시 만들어야 합니다(Mastodon 의 다시 만들기와 같은 경로, N10 · N12). 다시 만드는 동안 응답(Mastodon 은 206)과 다시 만드는 양(최근 800개)을 봅니다.
5. **장애의 반례 — 비활성 사용자에게도 퍼뜨림**: 오래 접속하지 않은 사용자의 캐시까지 채우면 쓰기와 메모리가 늘지만 아무도 읽지 않습니다(4-5).
6. **반례 — 퍼뜨리기 작업이 같은 글을 두 번 넣음**: 작업이 재시도되면 리스트 캐시에는 같은 글 ID 가 두 번 들어가 타임라인에 두 번 보입니다. 정렬 집합은 같은 멤버를 한 번만 둡니다(N14).

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 쓰기 비용 | 읽기 비용 | 큰 계정 | 근거 |
| --- | --- | --- | --- | --- |
| A. 읽을 때 글 저장소에 한꺼번에 조회 | 글 하나 | 팔로우 전체를 한 번의 큰 조회로 | 문제 없음 | N2 「It was tried and died」 |
| B. 읽을 때 모으기(팔로우마다 최근 글을 가져와 합침) | 글 하나 | 팔로우 K 곳 | 문제 없음 | N6 · N5 |
| C. 쓰기 때 퍼뜨리기(모두에게) | 팔로워 F 번 | 캐시 하나 | 쓰기 폭증 · 늦은 전달 | N2(2012) · N12 |
| D. 혼합(큰 계정만 읽을 때 섞기) + 비활성 제외 + ID 커서 | 보통 계정은 F 번, 큰 계정은 글 하나 | 캐시 하나 + 큰 계정 B 곳 | 읽을 때 섞음 | N2(계획) · N8 · N10 · N12(판단) |

- **추천 D(판단)**: 대부분의 계정은 팔로워가 적어 퍼뜨리기 쓰기가 감당할 만하고, 읽기가 쓰기보다 훨씬 많으므로(N2 의 30만 대 6천) 읽기를 캐시 하나로 끝내는 쪽이 낫습니다. 큰 계정만 예외로 두어 C 의 쓰기 폭증을 피합니다.
- **A 를 버리는 이유**: Twitter 2012 요약 글이 같은 방식을 「It was tried and died」라고 적습니다(N2).
- **B 를 버리는 이유(판단)**: 읽기가 쓰기보다 수십 배 많은 시간순 타임라인에서 읽을 때마다 K 곳을 모으면 3절 3번의 조회가 듭니다. Facebook · LinkedIn 은 관련성 정렬과 팔로우 상한(<10k) 때문에 B 를 골랐습니다(N6 · N5). 그 조건이 맞는 서비스라면 B 가 낫습니다(전환점).
- **C 를 버리는 이유**: 팔로워 3,100만 계정의 글 하나가 5분까지 걸렸습니다(N2). 3절 2번의 계산도 5초 요구를 넘습니다.
- **전환점(판단)**: 피드를 관련성 점수로 정렬하고 자주 모델을 바꾼다면 읽을 때 모으기(B)가 낫습니다(N5 의 A/B 시험 이유). 팔로우 수에 작은 상한이 있으면 B 의 읽기 비용이 묶입니다(N6 의 <10k). 큰 계정 기준을 낮추면 읽기가, 높이면 쓰기가 늘어납니다(3절 5번). 활성 기준 기간을 줄이면 메모리가 줄지만 다시 만들기가 늘어납니다(N10 의 경고).

## 7. 실제 사례 절에 쓸 대응표

| 회사 · 프로젝트 | 무엇을 했나 | 이 가이드의 어느 자리 | 출처 |
| --- | --- | --- | --- |
| Twitter(2012 강연, 2차 요약) | 쓰기 때 퍼뜨리기, Redis 에 사용자마다 글 ID 800개, 3벌 복제, 4천 곳씩 파이프라인, 30일 안 활성 사용자만, 큰 계정은 읽을 때 섞는 방향을 검토 | 4-1 · 4-3 · 4-4 · 4-5 | N2 · N3 |
| Facebook(2012 슬라이드) | Megafeed(쓰기 때 퍼뜨리기) 대신 Multifeed(읽을 때 모으기)를 고름, 이유 넷, 한 조회에 약 40 요청 | 4-2 · 6절 B | N6 |
| LinkedIn(2016) | 읽을 때 모으기, 쓰기 때 만들면 데이터가 62배, RocksDB, p99 약 140ms | 4-2 · 6절 B | N5 |
| Tumblr(2012 · 2013 인터뷰 정리) | 모으기에서 받은편지함으로, 큰 계정은 접근 모형으로 선택적 미리 만들기, 쓰기 초당 1백만 대 읽기 5만 | 4-3 · 2절 | N8 · N9 |
| Mastodon(v4.7.6) | 쓰기 때 퍼뜨리기, Redis 정렬 집합에 글 ID 800개, 7일 비활성 건너뛰기와 다시 만들기, ID 커서 페이지 | 4-1 · 4-4 · 4-5 · 4-6 | N10 · N11 · N12 |

- Pinterest · Instagram · 현재 X 의 홈 피드 구조는 원문을 열지 못했거나(403) 1차 자료를 찾지 못해 쓰지 않습니다. X 의 2023 공개 저장소(`home-mixer`)는 퍼뜨리기와 캐시를 말하지 않아, 2012 구조가 지금도 그대로라고 쓸 근거가 없습니다.
- 한국 서비스의 타임라인 구조 기술 글은 찾지 못했습니다.

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 앞 편과 같은 틀입니다.
- 대역: 글 저장소(글 ID → 작성자 · 시각), 팔로우 그래프(작성자 → 팔로워 목록, 사용자 → 팔로우 목록), 사용자마다 타임라인 캐시(정렬 집합처럼 ID 로 정렬된 목록, 최대 800), 퍼뜨리기 작업 큐(묶음 크기 · 초당 처리량), 마지막 접속 시각.
- ID 는 시각 · 작업자 · 순번을 합친 64비트 정수로 만들어 시간순으로 커지게 합니다(N17 의 구성을 흉내). 세 언어에서 같은 값이 나오도록 정수 연산만 씁니다.
- 고정할 출력 후보: 보통 계정 글이 마지막 활성 팔로워에게 보인 시각, 큰 계정 글을 모두에게 퍼뜨렸을 때와 읽을 때 섞었을 때의 전달 시각 · 쓰기 수 · 읽기 조회 수, 비활성 팔로워를 건너뛴 수, 오프셋 페이지에서 두 번 나온 글 수와 커서 페이지에서 0, 캐시를 잃은 뒤 다시 만든 항목 수와 걸린 시각, 재시도된 퍼뜨리기에서 리스트와 정렬 집합의 중복 수.
- 세 언어 출력의 글자 단위 일치를 위해 시각은 정수 밀리초로 찍고, 무작위가 필요하면 정해진 씨앗의 정수 의사 난수를 씁니다(판단, 명세 SD26).

## 9. 미해결 질문

1. Twitter 강연은 대본이 없어, 800 · 30일 · 「큰 계정은 읽을 때 섞는다」가 강연자가 한 말인지 요약 글이 풀어 쓴 것인지 확정하지 못했습니다(N1 에 대본 없음).
2. 큰 계정의 기준(팔로워 수)과 Twitter 의 혼합 방식 실제 도입 여부는 공식 글(blog.x.com)이 403 이라 확인하지 못했습니다.
3. Tumblr 정리 글이 가리키는 「Feeding Frenzy」 논문(선택적으로 미리 만들기)은 열어 보지 않았습니다.
4. Mastodon 의 ID 가 정렬 집합 점수(배정밀도)의 정밀 범위(±2^53) 안에 드는지는 확인 안 함입니다.
5. 「오프셋 대신 ID 커서」의 이유를 직접 적은 공식 문장은 찾지 못했습니다.
6. Twitter 의 쓰기 처리량은 요약 글(초당 6천)과 슬라이드 사본(평균 약 5천 · 피크 약 7천)이 다르고, 사본은 이 노트가 대조하지 않았습니다.
7. Pinterest(2014 · 2018) · Instagram · 현재 X 의 홈 피드 구조는 원문을 확인하지 못했습니다.
8. 요구 표의 사용자 수 · 평균 팔로워 · 5초 · 큰 계정 1억 명은 가정입니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-22 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트에서 문자열을 찾은 것이고(따옴표 모양 · 공백 · 백틱 · 밑줄 · 합자만 맞춤), Facebook 슬라이드는 PDF 를 받아 글자층을 뽑았고, Mastodon 코드는 v4.7.6 태그의 원본 파일을 받았습니다. 「조사 워커 원문」은 조사 워커가 원문에서 옮겼으나 이 노트가 다시 찾지 않은 것입니다. 인용 후보 94개를 대조해 94개 모두 문자열이 맞았습니다. 바로잡은 것이 하나 있어요 — Tumblr 정리 글의 큰 계정 문장은 원문이 「…user feeds by their access model (see Feeding Frenzy ).」로 이어지는데, 조사 워커가 「feeds.」에서 끊어 옮겼습니다. 조사 워커가 확인하지 못했다고 한 두 가지(Mastodon v4.7.6 `push_to_home` 의 비활성 건너뛰기, `ZREVRANGEBYSCORE` 의 사용 중단)는 이 노트가 원문에서 확인했습니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 같은 글 안의 다른 값 · 대상 · 동사 |
| --- | --- | --- | --- |
| N1 InfoQ Timelines at Scale | 페이지만(대본 없음) | 강연의 존재 · 강연자 · 게시일 | 이 페이지에 800 · fan-out 같은 내용 없음 |
| N2 High Scalability, Twitter 150M | 글자 그대로 | 홈 타임라인 정의 · 5초 목표 · 30만 대 6천 · 800 두 표현 · 3벌 · 4k 파이프라인 · Flock · 비활성 30일 · RAM · 1m 에 3.5초 · Lady Gaga 5분 · 읽을 때 한꺼번에 조회는 「tried and died」 · 쓰기 때 퍼뜨리기 · The Future 의 혼합 계획 | 2차 요약(2012-11 강연). 혼합은 계획 단계. 800 은 도입부 「maximum of 800」과 본문 「is 800 entries long」 |
| N3 VMware Tanzu 사례 | 글자 그대로 | Redis 에 마지막 800 트윗 ID · 본문은 넣지 않음 | 2차(강연을 출처로 밝힘), 강연자 철자 오기 있음 |
| N4 High Scalability, Twitter Redis | 글자 그대로 | Timeline 은 Redis · 타임라인에는 Memcache 가 Redis 만큼 맞지 않았고 문제는 fanout · Hybrid List | 2014 강연의 2차 요약, 2012 와 시점 다름 |
| N5 LinkedIn FollowFeed | 글자 그대로 | 두 모델 정의 · 읽을 때 모으기 선택 · 62배 · A/B 시험이 어려움 · RocksDB · 역시간순 · p99 140ms · 다섯 배 감소 | 관련성 정렬 피드. 큰 계정 · 비활성 · 커서 없음 |
| N6 Facebook 2012 슬라이드 | 글자 그대로(PDF 글자층) | Megafeed · Multifeed · 이유 넷(<10k 포함) · 한 조회 약 40 요청 · 해시테이블에서 연결 리스트 | 관련성 순위 피드. 캐시 길이 · 비활성 · 커서 없음 |
| N7 Facebook Multifeed 2015 | 글자 그대로 | aggregator 가 leaf 들에 요청을 뿌림 | 여기서 fan-out 은 요청 분산의 뜻 |
| N8 · N9 High Scalability, Tumblr | 글자 그대로 | 받은편지함은 모으기의 반대 · 모으기의 한계 · 큰 계정은 선택적으로 미리 만들기 · 50GB 대 2.7TB · 쓰기 1백만 대 읽기 5만 · 대시보드는 Twitter 타임라인과 비슷 | 2차(인터뷰 정리), 계획 단계 서술 포함 |
| N10 Mastodon 문서(설정 · 백업 · 확장) | 글자 그대로 | 홈 피드는 Redis · 비활성 정리와 다시 만들기 · 기본 7일 · 다시 만들기는 비쌈 · tootctl 로 다시 만듦 | 설정 2026-10-08, 확장 2026-07-20, 백업 2025-11-21 갱신 |
| N11 Mastodon API 문서 | 글자 그대로 | max_id · since_id · min_id 정의 · 기본 20 최대 40 · ID 는 불투명 문자열 | 가이드라인 2025-11-23, 타임라인 2026-10-19 갱신. 206 응답은 조사 워커 원문 |
| N12 Mastodon v4.7.6 코드 | 글자 그대로(원본 파일) | MAX_ITEMS 800 · ZADD 로 글 ID · ZREMRANGEBYRANK 자르기 · 비활성 건너뛰기 · 7일 상수 · push_bulk · 커서 읽기 · populate_home | 공식 저장소 코드(문서 아님). 큰 계정 분기 없음 |
| N13 Redis 리스트 문서 | 글자 그대로 | LPUSH · LTRIM 짝으로 최근 N 개 · 평균 O(1) · capped collection · 소셜 네트워크의 최근 업데이트 · LRANGE 끝 포함 | 예시 값 100 은 문서 예시 |
| N14 Redis 정렬 집합 문서 | 글자 그대로 | 스킵 리스트 + 해시 테이블 · 같은 멤버는 점수만 갱신 · REV 로 최근부터 · 열린 구간 `(` · 큰 오프셋은 O(N) · ±2^53 정밀 · ZREVRANGEBYSCORE 사용 중단(6.2.0) | 게시일 표시 없음 |
| N15 Redis 파이프라인 문서 | 글자 그대로 | 여러 명령을 기다리지 않고 보냄 · 1만 개쯤의 묶음 권고 | 원자성은 파이프라인 문서에 없음(트랜잭션 문서 쪽) |
| N16 X API 문서 | 글자 그대로 | 64비트 · 대략 시간순 · 토큰은 불투명 · since_id 권고 · 한도를 넘으면 빈 응답 | 「roughly」— 엄밀한 보장 아님. v1.1 의 max_id 문서는 열지 못함 |
| N17 Twitter Snowflake README | 글자 그대로 | 41 · 10 · 12 비트 구성 | 보관(archive) 저장소, 지금의 X 가 같은 구성인지 확인 안 함 |
| N18 Discord 개발자 문서 | 글자 그대로 | Twitter 의 snowflake 형식을 씀 | 비트 구성은 Discord 쪽이 다름(조사 워커 원문) |

## 11. 출처

조회일은 모두 2026-11-22 입니다.

- N1. [InfoQ — Timelines at Scale (Raffi Krikorian, QCon SF 2012)](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/) — 게시 2013-04-03
- N2. [High Scalability — The Architecture Twitter Uses to Deal with 150M Active Users, 300K QPS, a 22 MB/S Firehose, and Send Tweets in Under 5 Seconds](https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/) — 2013-07-08(N1 강연의 2차 요약)
- N3. [VMware Tanzu — Case Study: Staple Yourself to a Tweet to Understand 30 Billion Redis Updates Per Day](https://blogs.vmware.com/tanzu/case-study-staple-yourself-to-a-tweet-to-understand-30-billion-redis-updates-per-day/) — 2013-08-07(2차)
- N4. [High Scalability — How Twitter Uses Redis to Scale - 105TB RAM, 39MM QPS, 10,000+ Instances](https://highscalability.com/how-twitter-uses-redis-to-scale-105tb-ram-39mm-qps-10000-ins/) — 2014-09-08(2차)
- N5. [LinkedIn Engineering — FollowFeed: LinkedIn's Feed Made Faster and Smarter](https://www.linkedin.com/blog/engineering/feed/followfeed-linkedin-s-feed-made-faster-and-smarter) — 2016-03-31
- N6. [Facebook — News Feed: Social data at scale (Serkan Piantino, QCon New York 2012 슬라이드)](https://qconnewyork.com/ny2016/ny2012/dl/qcon-newyork-2012/slides/facebook%20news-feed%20qcon%202012.pdf) — 2012-06-18(표지)
- N7. [Meta Engineering — Serving Facebook Multifeed: Efficiency, performance gains through redesign](https://engineering.fb.com/2015/03/10/production-engineering/serving-facebook-multifeed-efficiency-performance-gains-through-redesign/) — 2015-03-10
- N8. [High Scalability — Gone Fishin': Tumblr Architecture - 15 Billion Page Views A Month And Harder To Scale Than Twitter](https://highscalability.com/gone-fishin-tumblr-architecture-15-billion-page-views-a-mont/) — 2012-11-19(2차)
- N9. [High Scalability — The Tumblr Architecture Yahoo Bought for a Cool Billion Dollars](https://highscalability.com/the-tumblr-architecture-yahoo-bought-for-a-cool-billion-doll) — 2013-05-20(2차)
- N10. [Mastodon — Configuring your environment](https://docs.joinmastodon.org/admin/config/) · [Backing up your server](https://docs.joinmastodon.org/admin/backups/) · [Scaling up](https://docs.joinmastodon.org/admin/scaling/) — 갱신 2026-10-08 · 2025-11-21 · 2026-07-20(페이지 표기)
- N11. [Mastodon — API guidelines](https://docs.joinmastodon.org/api/guidelines/) · [Timelines API methods](https://docs.joinmastodon.org/methods/timelines/) — 갱신 2025-11-23 · 2026-10-19(페이지 표기)
- N12. [Mastodon v4.7.6 소스 코드](https://github.com/mastodon/mastodon/tree/v4.7.6)(`app/lib/feed_manager.rb` · `app/models/feed.rb` · `app/models/concerns/user/activity.rb` · `app/services/fan_out_on_write_service.rb` · `app/services/precompute_feed_service.rb` 등) — 릴리스 2026-11-19
- N13. [Redis — LPUSH](https://redis.io/docs/latest/commands/lpush/) · [LTRIM](https://redis.io/docs/latest/commands/ltrim/) · [LRANGE](https://redis.io/docs/latest/commands/lrange/) · [Lists](https://redis.io/docs/latest/develop/data-types/lists/) — 게시일 확인 안 함
- N14. [Redis — ZADD](https://redis.io/docs/latest/commands/zadd/) · [ZRANGE](https://redis.io/docs/latest/commands/zrange/) · [ZREVRANGEBYSCORE](https://redis.io/docs/latest/commands/zrevrangebyscore/) · [ZREMRANGEBYRANK](https://redis.io/docs/latest/commands/zremrangebyrank/) · [Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/) — 게시일 확인 안 함
- N15. [Redis — Pipelining](https://redis.io/docs/latest/develop/using-commands/pipelining/) · [Transactions](https://redis.io/docs/latest/develop/using-commands/transactions/) — 게시일 확인 안 함
- N16. [X API — Pagination](https://docs.x.com/x-api/fundamentals/pagination) · [Timelines](https://docs.x.com/x-api/posts/timelines/integrate) · [X IDs](https://docs.x.com/fundamentals/x-ids) — 게시일 확인 안 함
- N17. [Twitter — snowflake README (태그 snowflake-2010)](https://github.com/twitter-archive/snowflake/tree/snowflake-2010) — 2010(태그), 게시일 확인 안 함
- N18. [Discord Developer Docs — Reference](https://docs.discord.com/developers/reference) — 게시일 확인 안 함

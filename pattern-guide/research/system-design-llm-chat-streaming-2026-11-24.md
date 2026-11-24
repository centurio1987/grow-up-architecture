# 리서치 노트 — LLM 채팅 서비스: 첫 토큰을 빨리, 끊겨도 이어 받게

- 조사일: 2026-11-24. 자료 조사는 조사 워커 둘이 했고(기업 기술 글과 교육용 분석 · 공식 문서와 표준), 본문에 실을 만한 인용과 수치는 같은 날 원문 45편을 다시 받아 문자열을 맞췄습니다. 조사 워커의 도구는 본문을 요약해 돌려주는 방식이라, 워커가 옮긴 문장을 그대로 믿지 않고 모두 원문 텍스트에서 다시 찾았습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 여덟째 편(`llm-chat-streaming`, 사례 목록 [AI-01](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S18 의 산출물입니다.
- 표기: (계산)은 출처 수치로 이 노트가 계산한 값, (가정)은 가이드가 상황을 세우려고 정한 값, (판단)은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `Q` 로 시작합니다(앞 노트의 `V` · `C` · `L` · `P` · `T` · `G` · `K` · `N` · `M` 과 겹치지 않게). 사례 목록 AI-01 행의 HI chatgpt 는 이 노트의 Q1, D36 은 Q3(그 원 글이 Q2), D37 은 Q4, D39 는 Q5 · Q6, GM 은 Q41, XGAI 는 Q42 입니다.
- **사례마다 시점이 다릅니다.** Orca 논문은 2022-07, vLLM 블로그는 2023-06-20, Anyscale 은 2023-06-22, Character.AI 는 2024-06-20, Upstash 는 2025-04-14, Electric 은 2025-12-09, OpenAI 의 Postgres 글은 2026-01-22, InfoQ 요약은 2026-02-12, Hello Interview 는 2026-05-21, Ably 는 2026-06-30 입니다. API 문서와 표준은 조회일의 현재 판입니다. 시점이 다른 사례를 한 흐름으로 잇지 않습니다.
- **Hello Interview(Q1)는 교육용 분석이고 본문 대부분이 유료입니다.** 공개된 요구사항 절의 수치는 설계 대상으로 정한 추정이지 OpenAI 가 밝힌 값이 아닙니다. 깊이 들어가는 절은 제목만 보입니다.
- **ChatGPT 가 끊긴 응답을 실제로 어떻게 이어 주는지 적은 1차 자료는 찾지 못했습니다.** 이어 받기의 근거는 API 문서(OpenAI background mode)와 구현 문서 · 벤더 글(Vercel · Upstash · LibreChat · Electric · Ably)입니다. 가이드는 ChatGPT 가 이렇게 한다고 쓰지 않고, 이런 구조가 있다고 써야 합니다.
- **앞 편(S17)에서 되먹인 것.** RT-08 은 게이트가 9라운드까지 갔고, 지적의 절반이 보완 때 새로 넣은 문장에서 나왔습니다. 그래서 (1) 인용 둘레의 서술을 원문 한 줄 전체의 세기(must · should · could · may)와 조건(if · when · 「~하면」)에 맞춰 적었고(10절 「세기」 칸), (2) 정의할 낱말을 0절에서 한 뜻으로 정했으며, (3) 같은 수치가 같은 글에서 다른 동사나 대상으로 나오면 모두 적었습니다(Character.AI 의 「around」와 「more than」, OpenAI 의 「10x」 두 사건, vLLM 의 「up to 24x」와 「8.5x - 15x」).
- **조사 워커 주장 정정 다섯.** (1) Hello Interview 게시일을 워커는 「표시 없음」으로 적었으나 원문 메타데이터에 `datePublished` 2026-05-21 이 있습니다. (2) 기업 사례 워커는 OpenAI background 의 보관 기간 수치가 문서에 없다고 적었으나, 그 수치는 같은 회사의 다른 문서(Q16 Your data)에 조건과 함께 있습니다(4-2). (3) 공식 문서 워커는 TGI 가 넘칠 때의 응답을 「확인 안 함」으로 뒀으나 TGI 스트리밍 문서(Q28)에 「overloaded error type」 문장이 있습니다. 상태 코드 숫자는 그 문서에도 없습니다. (4) Upstash 의 두 문장(중복 · 누락 없음, 다시 연결 때 전체 전송)을 워커는 두 문장이 어떻게 맞물리는지 글에 없다고 적었으나, 바로 앞 문단이 「during an active stream, each message only contains the exact delta」와 「When reconnecting, the entire stream up to the current generation point is sent」를 나란히 적어 두 경우를 나눕니다(4-2). (5) Character.AI 기술 글 사본의 게시일은 페이지 표시가 2024-06-20, 메타데이터가 2024-06-21T00:13Z 입니다(시간대 차이로 판단).

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 0절 · 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 SSE 와 마지막 이벤트 ID · 4-2 실행과 토큰 기록 · 4-3 요청 대기열과 거절 · 4-4 GPU 작업자의 연속 배칭과 선점 · 4-5 대화 저장소 · 4-6 취소 · 4-7 시간 제한과 차단기 · 4-8 남는 한계) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 요구 후보 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 0. 낱말 — 한 뜻으로 정해 둘 것

앞 편들에서 같은 낱말을 두 뜻으로 써서 게이트에 걸렸습니다. 이 편에서 헷갈리기 쉬운 낱말은 아래 뜻으로만 씁니다(판단).

| 낱말 | 이 편의 뜻 | 쓰지 않는 뜻 |
| --- | --- | --- |
| 대화 이어 가기 | 지난 대화를 열어 앞 문맥과 함께 새 질문을 보내는 일. Q1 의 「resume a conversation」 | 끊긴 응답 스트림을 다시 받는 일 |
| 응답 이어 받기 | 끊긴 응답 스트림을 마지막으로 받은 순번 다음부터 다시 받는 일 | 대화 이어 가기 |
| 실행 | 질문 하나에 대한 응답 생성 작업 하나. OpenAI 문서의 response, Vercel 의 active stream 에 해당 | 사용자의 연결 |
| 토큰 기록 | 실행이 만든 토큰 조각을 순번과 함께 차례로 적어 두는 저장소 | 대화 저장소 |
| 순번 | 한 실행 안에서 토큰 조각마다 1 부터 붙이는 정수. SSE 의 `id` 로 보냄 | Redis Streams 의 자동 ID(시각-번호 문자열) |
| 첫 토큰 지연 | 질문을 받은 뒤 첫 토큰 조각이 사용자에게 가기까지 걸린 시간. Q31 의 TTFT(대기열 시간을 포함) | 응답 전체가 끝나는 시간 |
| 취소 | 사용자가 멈춤을 눌러 실행을 끝내고 GPU 자리를 돌려받는 일 | 연결이 끊기는 일(Q10: 연결을 닫는 것은 취소가 아님) |

## 1. 이 노트의 결론

LLM 채팅 서비스는 사용자가 질문을 보내면 모델이 답을 토큰 단위로 만들어 화면에 흘려보내는 서비스입니다. Hello Interview 는 이것을 「a conversational AI product where users send prompts in natural language and get responses streamed back from a large language model」로 적습니다(Q1, 절 What is ChatGPT?). 어려운 점은 셋입니다.

1. **첫 토큰이 늦으면 고장 난 것처럼 보임** — 「ChatGPT feels broken if you stare at a blank screen for a few seconds after hitting enter, so latency to the first token matters more than total completion time.」(Q1, 절 Non-Functional Requirements). NVIDIA 는 첫 토큰 지연에 대기열 시간이 들어간다고 적습니다: 「TTFT generally includes both request queuing time, prefill time, and network latency.」(Q31).
2. **GPU 가 모자람** — 「Because GPUs are limited and expensive, the system has to be deliberate about who gets compute and when.」(Q1). 요청이 처리 능력보다 많으면 대기열이 길어지고 첫 토큰 지연이 늘어납니다: 「you may see an increase in TTFT value due to the queueing effect of waiting for a slot to open up」(Q31).
3. **연결이 끊겨도 생성은 계속됨** — 사례 목록 AI-01 행의 어려운 점입니다. Ably 는 HTTP 스트리밍만으로는 이어 받을 위치가 없다고 적습니다: 「The client has no record of where the stream stopped: no offset, no sequence number, no reference it can use to resume.」(Q14, 벤더 글). 서버가 끊김을 늦게 알면 그동안 만든 토큰은 버려집니다(「burning inference cost with nothing to show for it」, Q14).

공개 자료가 보여 주는 방법은 세 갈래입니다.

1. **생성을 연결과 떼고 토큰을 기록해 두기** — OpenAI 의 background mode 는 끊기면 마지막 이벤트의 순번으로 이어 받게 합니다: 「If the connection drops, resume the stream by passing the last event’s sequence_number as starting_after.」(Q15). Upstash 의 예제는 생성기가 조각마다 Redis Stream 에 적습니다(「writes each chunk to a Redis stream」, Q9). Vercel AI SDK 는 저장을 앱의 몫으로 둡니다(「Stream resumption requires persistence for messages and active streams in your application.」, Q10).
2. **대기열로 몰림을 받되, 넘치면 거절하기** — Azure 의 대기열 패턴은 생산 속도가 소비 속도를 넘으면 대기열이 계속 길어진다고 적고 「Monitor queue depth and scale consumers within safe limits, or shed work at the producer.」를 권합니다(Q33). 같은 문서는 이 패턴이 맞지 않는 경우로 「The caller requires a low-latency, synchronous response.」를 듭니다. 채팅이 이 경우에 가까우므로 대기열은 짧게 두어야 합니다(판단). TGI 는 동시 요청 한도를 넘으면 기다리게 하지 않고 거절합니다(「Having a low limit will refuse clients requests instead of having them wait for too long」, Q29).
3. **GPU 안에서 요청을 차례마다 바꿔 넣기(연속 배칭)** — Orca 는 요청 단위가 아니라 반복(토큰 한 걸음) 단위로 실행을 짜는 방식을 제안합니다(「iteration-level scheduling」, Q8). vLLM 은 KV 캐시 메모리 낭비를 「under 4%」로 줄여 더 많은 요청을 한 배치에 넣습니다(Q4). KV 캐시가 모자라면 마지막에 들어온 요청을 빼서 대기열 맨 앞에 다시 넣습니다(Q25).

이 노트의 추천 구조(판단)는 이렇습니다. **채팅 API 는 질문을 받으면 사용자 메시지를 대화 저장소에 적고 실행 하나를 만들어 요청 대기열에 넣은 뒤, 실행 번호를 돌려줍니다. 대기열은 등급(유료 · 무료)마다 길이 한도를 두고, 한도를 넘거나 예상 대기가 길면 429 와 `Retry-After` 로 거절합니다. GPU 작업자는 배치에 빈자리가 생길 때마다 대기열에서 실행을 꺼내 넣고, 만든 토큰 조각을 순번과 함께 토큰 기록에 적습니다. 스트림 게이트웨이는 토큰 기록을 읽어 SSE 로 보내며 순번을 SSE `id` 로 붙입니다. 연결이 끊겨도 실행은 계속되고, 다시 연결한 브라우저가 보내는 `Last-Event-ID` 다음 순번부터 보냅니다. 실행이 끝나면 답을 대화 저장소에 적고, 토큰 기록은 정한 시간 뒤 지웁니다. 사용자가 멈춤을 누르면 따로 취소 요청을 받아 실행을 끝내고 GPU 자리를 돌려받습니다.**

**이 구조로도 남는 것**이 있습니다. (1) 토큰 기록을 Redis 로 두면 장애 조치 때 받았다고 답한 쓰기도 잃을 수 있습니다(「acknowledged writes can still be lost during a failover」, Q39). 끝난 답의 기준은 대화 저장소에 둡니다(판단). (2) GPU 작업자가 생성 중간에 멈추면 그때까지 보낸 토큰 뒤를 같은 글로 이어 만들 수 없습니다. Anthropic 의 오류 복구 안내는 부분 응답을 새 요청에 넣어 이어 쓰게 하는 방식이고(Q20), 이어진 글이 처음 생성과 같다는 보장은 문서에 없습니다(확인 안 함). (3) 대기열이 넘치면 거절된 사용자는 기다리지 못합니다. 이것은 첫 토큰 지연을 지키려고 고른 대가입니다(판단).

## 2. 요구사항 절에 쓸 근거 — 「첫 토큰」 · 「GPU 부족」 · 「끊김」을 숫자로

| 값 | 원문 | 대상 · 시점 | 출처 |
| --- | --- | --- | --- |
| 사용자 | 「ChatGPT serves a little over 200M daily active users at the time of writing.」 | 교육용 추정, 2026-05 | Q1 절 Non-Functional Requirements |
| 요청 | 「A few prompts each per day puts us somewhere around 20k prompts per second at peak,」 | 같음, **최대**(at peak) | Q1 같은 절 |
| 동시 스트리밍 | 「and since a response takes several seconds to generate, roughly 120k of them are streaming at any given moment.」 | 같음, **어느 순간이든**(at any given moment) | Q1 같은 절 |
| 첫 토큰 | 「latency to the first token matters more than total completion time」 | 같음, 수치 없음 | Q1 같은 절 |
| 깊이 들어가는 절 | 「How do we keep the stream alive across reconnects and deploys?」 · 「How do we route and schedule generation requests across GPU workers?」 · 「How do we keep heavy users from taking over the GPU pool while giving paid tiers a better experience?」 · 「Cancelling a run and reclaiming the GPU」 | 같음, **절 제목만**(본문 유료) | Q1 절 Potential Deep Dives |
| 실제 처리량 | 「Character.AI serves around 20,000 queries per second」 · 「Today we serve more than 20,000 inference queries per second.」 | Character.AI, 2024-06. 앞은 발표 글의 「around」, 뒤는 기술 글의 「more than」 | Q5 · Q6 |
| 대화 길이 | 「the average message has a dialogue history of 180 messages」 | Character.AI, 2024-06, **평균** | Q6 절 Stateful Caching |
| 데이터베이스 | 「to support millions of queries per second for 800 million users」 | OpenAI 의 PostgreSQL, 2026-01. 무엇을 적는 데이터베이스인지는 글에 없음(아래) | Q2 |
| 쓰기 한계 | 「With only one writer, a single-primary setup can’t scale writes.」 | 같음 | Q2 절 Reducing load on the primary |

- **OpenAI 의 Postgres 글(Q2)은 대화를 어디에 저장하는지 적지 않습니다.** 원문 텍스트에서 `conversation` · `message` 가 0번 나옵니다(10절). 가이드에 ChatGPT 의 대화가 Postgres 에 있다고 쓸 수 없습니다. OpenAI 의 핵심 제품을 떠받치는 PostgreSQL 은 쓰기를 주 서버 하나가 맡고, 쓰기가 많은 일은 샤딩된 저장소로 옮긴다는 데까지만 씁니다.
- Q2 의 「10x」는 두 번, 다른 대상으로 나옵니다. 「Over the past year, our PostgreSQL load has grown by more than 10x」(한 해 동안의 부하)와 「write traffic suddenly surged by more than 10x as over 100 million new users signed up within a week」(ChatGPT ImageGen 출시 때 일주일 동안의 쓰기)입니다.
- Hello Interview 의 120k 는 초당 20k 에 응답 몇 초를 곱한 값이고, 120,000 ÷ 20,000 = 평균 6초(계산)는 이 노트의 계산입니다. 글은 6초라고 적지 않습니다.
- **요구 표 후보(가정)**: 최대 초당 2만 질문(Q1 을 빌림), 동시 스트리밍 12만(Q1 을 빌림), 대기열이 비었을 때 질문을 받은 뒤 1초 안에 첫 토큰(가정), 몰릴 때 유료 사용자의 첫 토큰은 3초 안(가정 — Q1 의 깊이 들어가는 절 제목 「giving paid tiers a better experience」를 요구로 빌림), 연결이 끊겨도 실행은 계속되고 다시 연결하면 빠짐 · 겹침 없이 이어 받음, 받았다고 답한 질문은 잃지 않음, 사용자가 멈춤을 누르면 GPU 자리를 돌려받음, 대기열이 넘치면 기다리게 하지 않고 거절하며 다시 보낼 시간을 알려 줌. 1초 · 3초는 출처가 없는 가정입니다(9절).

## 3. 규모 추정 절에 쓸 계산

출처 수치는 Hello Interview(Q1, 교육용 추정) · Character.AI(Q6) · MDN(Q24) · OpenAI 문서(Q16)이고, 나머지는 가이드의 가정과 그 계산입니다.

1. **동시 스트리밍**: 초당 2만 질문 × 평균 6초 = 12만(계산 — 도착률 × 머무는 시간). Q1 은 「roughly 120k」라고 적습니다.
2. **토큰 기록 쓰기**: 스트림 하나가 초당 50 토큰(가정)을 만들고 토큰마다 적으면 12만 × 50 = 초당 600만 번 쓰기(계산)입니다. 100ms 마다 모아 적으면 12만 × 10 = 초당 120만 번(계산)으로 줄고, 사용자가 보는 지연은 최대 100ms 늘어납니다(계산). 모아 적는 간격이 첫 토큰 지연과 쓰기 양을 맞바꾸는 값입니다(판단).
3. **브라우저 연결 한도**: 「When not used over HTTP/2, SSE suffers from a limitation to the maximum number of open connections」, 한도는 「a very low number (6)」이고 브라우저와 도메인마다 셉니다(Q24). HTTP/2 에서는 동시 스트림 수를 서버와 협상하며 「(defaults to 100)」입니다(Q24). 채팅 탭을 여러 개 열면 HTTP/1.1 에서 일곱째 탭의 스트림이 막힐 수 있으므로 게이트웨이는 HTTP/2 로 둡니다(판단).
4. **대기열이 쌓이는 속도**: GPU 전체가 초당 1만 6천 실행을 새로 받을 수 있는데(가정) 초당 2만이 오면, 초당 4천씩 쌓여 1분 뒤 24만이 됩니다(계산 — (20,000 − 16,000) × 60). 그 뒤에 온 질문은 240,000 ÷ 16,000 = 15초(계산)를 기다려 2절의 3초를 넘깁니다. Azure 문서의 「If your average producer rate exceeds the consumer rate, the queue continues to grow and latency increases.」(Q33)가 이 모양입니다. 대기열 길이 한도를 3초 × 16,000 = 4만 8천(계산)으로 두면 그보다 긴 대기는 거절로 바뀝니다(판단).
5. **토큰 기록의 크기**: 실행이 끝난 뒤 이어 받기 창을 10분(가정)으로 두면 창 안의 실행은 초당 2만 × 600초 = 1,200만 개(계산)이고, 답 하나가 2KB(가정)면 24GB(계산)입니다. OpenAI 의 background 응답은 기본 처리 창에서 「roughly 10 minutes」 동안 디스크에 둡니다(Q16) — 다른 제품의 값이라 창 길이의 근거가 아니라 참고입니다.
6. **대화 저장소 쓰기**: 질문 하나에 사용자 메시지 1 + 답 1 이면 초당 4만 번 쓰기(계산 — 20,000 × 2)입니다. 토큰 기록과 달리 실행마다 두 번만 씁니다. Q2 는 쓰기가 많은 일을 샤딩된 저장소로 옮겼다고 적으므로(「we’ve migrated shardable, write-heavy workloads to sharded systems such as Azure CosmosDB」), 대화 저장소는 대화 번호로 나누는 저장소로 둡니다(판단).
7. **문맥 길이**: Character.AI 의 평균 대화 이력은 180 메시지입니다(Q6). 새 질문마다 앞 문맥을 다시 넣으면 그만큼 prefill(질문과 문맥을 처음 한 번 계산하는 단계)이 길어집니다. Character.AI 는 KV 캐시를 대화 사이에 호스트 메모리에 두고 같은 대화를 같은 서버로 보내 「a 95% cache rate」를 얻습니다(Q6). 95% 가 평균인지는 글에 없습니다(확인 안 함). 이 가이드는 KV 캐시를 모형에 넣지 않고 범위 밖으로 둡니다(판단).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. SSE 와 마지막 이벤트 ID — 브라우저가 다시 연결하며 어디까지 받았는지 알림

- 브라우저는 연결이 닫히면 다시 연결합니다: 「Clients will reconnect if the connection is closed; a client can be told to stop reconnecting using the HTTP 204 No Content response code.」(Q23 절 9.2.1). MDN 도 「By default, if the connection between the client and server closes, the connection is restarted.」로 적습니다(Q24).
- 다시 연결할 때의 머리: 「reports an EventSource object's last event ID string to the server when the user agent is to reestablish the connection」(Q23 절 9.2.4). 서버가 보낸 `id` 필드가 그 값을 정합니다(Q23 절 9.2.6, 「set the last event ID buffer to the field value」).
- **서버가 그 값을 받아 어디부터 보낼지는 표준이 정하지 않습니다.** 이 노트가 표준 텍스트에서 `resume` · `replay` 를 찾았고, 서버 쪽 다시 보내기를 정한 문장은 없습니다(10절). 이어 받기는 서버 설계의 몫입니다(판단).
- 다시 연결 간격: 처음 값은 「an implementation-defined value, probably in the region of a few seconds」(Q23 절 9.2.2)이고, 서버가 `retry` 필드로 바꿀 수 있습니다. 앞 시도가 실패했으면 브라우저가 늘려도 됩니다(「user agents might introduce an exponential backoff delay to avoid overloading a potentially already overloaded server」, Q23 절 9.2.3 — 세기는 might).
- 프록시 시간 제한: 「Legacy proxy servers are known to, in certain cases, drop HTTP connections after a short timeout.」 그래서 「authors can include a comment line (one starting with a ':' character) every 15 seconds or so」(Q23 절 9.2.7 — 세기는 can). 첫 토큰을 기다리는 동안이나 대기열에 있는 동안에도 주석 줄을 보냅니다(판단).
- API 도 SSE 를 씁니다. OpenAI: 「This guide focuses on HTTP streaming (stream=true) over server-sent events (SSE).」(Q17). Anthropic: 「Each server-sent event includes a named event type and associated JSON data.」(Q20). TGI: 「Under the hood, TGI uses Server-Sent Events (SSE).」(Q28).
- **스트림이 시작된 뒤의 오류는 상태 코드로 알 수 없습니다.** Anthropic: 「an error can occur after the API returns a 200 response. In that case, error handling doesn’t follow these standard mechanisms.」(Q21). 스트림 안에 오류 이벤트를 보냅니다. 예는 「you might receive an `overloaded_error`, which would normally correspond to an HTTP 529 in a non-streaming context」입니다(Q20 — 세기는 might).

### 4-2. 실행과 토큰 기록 — 생성을 연결에서 떼어 두기

- **OpenAI background mode(Q15).** 「If the connection drops, resume the stream by passing the last event’s sequence_number as starting_after.」 예제 코드는 `keepalive` 이벤트를 커서로 쓰지 않습니다(주석 「Keepalives use connection counters, not stored-event resume positions.」). 같은 절의 조건: 스트리밍은 기본 처리 창(`soonest`)에서만 되고, 「You can’t stream a response later if it was created without streaming.」 첫 토큰은 더 늦을 수 있습니다(「Time to first token can be higher for a background response than for a synchronous response.」).
- **보관 기간은 문서마다 조건이 다릅니다.** Q15 는 기간 없이 「Background mode temporarily stores response data even when you set store to false or use Zero Data Retention.」라고만 적습니다. Q16 은 「Background mode with the default completion window stores response data to disk for roughly 10 minutes」라고 적고, 이어서 기본 창의 background 응답은 「store=true」를 명시할 때만 표준 보관을 따르며 「If you omit store or set it to false, the response is deleted after the temporary retention period.」라고 적습니다. 「10분」을 쓸 때는 이 조건(기본 창, `store` 생략 또는 false)을 함께 적습니다.
- **Upstash 예제(Q9, 벤더 글).** 「The stream generator opens an LLM stream and writes each chunk to a Redis stream.」 생성은 연결과 따로 계속됩니다(「Clients can reconnect at any time-without interrupting the ongoing generation.」). 다시 보내는 범위는 두 경우로 나뉩니다: 「during an active stream, each message only contains the exact delta the client needs to see and not the entire stream. When reconnecting, the entire stream up to the current generation point is sent」. 보관 기간은 글에 없습니다(10절).
- **Vercel AI SDK(Q10 · Q11).** 화면이 열릴 때 활성 스트림을 찾고, 없으면 204 를 돌려줍니다(「Returns 204 (No Content) if no stream is active」, Q10). 저장은 앱 몫이고, 스트림은 정한 시간 뒤 사라집니다(「Streams in Redis expire after a set time (configurable in the resumable-stream package)」, Q10 — 기간 수치 없음). README 는 생산자가 원래 독자가 떠나도 끝까지 만든다고 적습니다(「The producer will always complete the stream, even if the reader of the original stream goes away.」, Q11).
- **LibreChat(Q12, 한국어 문서).** 「메시지를 보낼 때, LibreChat은 스트리밍되는 모든 델타를 기록하는 생성 작업을 생성합니다.」 다시 연결하면 「누락된 콘텐츠는 단일 동기화 이벤트로 전달됩니다.」 조각은 Redis Streams(`XADD`/`XRANGE`)에 두고 스트림이 끝나면 TTL 로 사라지며, 기간 값은 문서에 없습니다. 한계로 「콘텐츠가 중복되어 나타납니다. 이는 일반적으로 클라이언트 버전이 일치하지 않을 때 발생합니다.」를 적습니다.
- **Electric Durable Streams(Q13, 벤더 글).** 「Every position in a stream has an opaque, monotonic offset. Clients persist the last offset they've processed.」 쓰임으로 「resume token streams across refreshes and device switches instead of restarting generations」를 듭니다.
- **커서를 정수 순번으로 둘지, 저장소의 자동 ID 로 둘지.** Redis 의 자동 ID 는 「the first part is the Unix time in milliseconds」인 시각-번호 문자열이고, Redis 는 「IDs are always incremental」을 보장합니다(Q36). 단, 그 보장을 지키려고 시계가 뒤로 가면 맨 위 항목의 시각을 씁니다(같은 문단). 이 가이드는 실행마다 1 부터 붙이는 정수 순번을 따로 두고 SSE `id` 로 보냅니다(판단 — 브라우저가 다시 보내 오는 값을 저장소의 내부 ID 와 떼어 두려고).
- `XREAD` 는 「returning only entries with an ID greater than the last received ID reported by the caller」(Q37)입니다. `$` 는 첫 호출에만 써야 합니다(「you should use the $ ID only for the first call to XREAD. Later the ID should be the one of the last reported item in the stream, otherwise you could miss all the entries that are added in between.」, Q37). 다시 연결할 때 `$` 를 쓰면 끊긴 사이의 조각을 놓칩니다.
- 보관 한도: `MAXLEN ~` 로 자르면 정확히 N 이 아니라 「the stream may have a few tens of additional entries over the threshold」(Q38)입니다. 길이로 자르면 「얼마나 오래」를 정하지 못하므로 이 가이드는 실행이 끝난 시각으로 지웁니다(판단).

### 4-3. 요청 대기열과 거절 — 몰림을 받되 첫 토큰 지연을 지키게

- Azure 의 대기열 패턴(Q33): 「Use a queue that acts as a buffer between a task and the service that it invokes.」 이점으로 「you only need enough service instances to meet the requirements for an average load rather than the peak load」를 적고, 한계로 대기열이 계속 길어지는 경우와 「or shed work at the producer」를 적습니다. 같은 문서는 이 패턴이 맞지 않는 경우로 「The caller requires a low-latency, synchronous response.」를 듭니다. 이 문서가 채팅을 직접 말하지는 않습니다.
- 대기열이 가득 찼을 때 거절하라고 직접 적은 문장은 Q33 에 없습니다(공식 문서 워커가 `reject` · `full` · `backpressure` 를 찾음, 10절). 가장 가까운 것이 「shed work at the producer」입니다.
- TGI(Q29): `--max-concurrent-requests` 의 기본값은 128 이고 「Having a low limit will refuse clients requests instead of having them wait for too long and is usually good to handle backpressure correctly」. 넘쳤을 때(Q28): 「If there are too many requests at the same time, TGI returns an HTTP Error with an overloaded error type」 — 상태 코드 숫자는 문서에 없습니다. **TGI 는 지금 유지 보수 상태입니다**(「text-generation-inference is now in maintenance mode.」, Q30). 기본값과 동작의 예로만 쓰고 추천 서버로 쓰지 않습니다(판단).
- **429 와 `Retry-After`.** OpenAI 의 머리 설명은 「The minimum number of seconds to wait before retrying a temporary rate-limit error, when present.」(Q18)이고, 요청 속도가 너무 빨리 늘면 `slow_down` 429 를 줍니다(「Your request rate increased too quickly.」, Q18). Anthropic 은 「Not every 429 carries it; the spend-cap 429 never does」(Q22)입니다. 두 문서 모두 `Retry-After` 가 늘 오지는 않는다고 적으므로, 가이드는 이 서비스가 거절할 때 `Retry-After` 를 붙인다고(설계) 쓰고, 429 에는 `Retry-After` 가 온다고(일반) 쓰지 않습니다.
- 과부하의 다른 코드: OpenAI 503 `server_is_overloaded`(「The requested model is temporarily overloaded.」, Q19), Anthropic 529 `overloaded_error`(「The API is temporarily overloaded.」, Q21). 실패한 요청도 한도를 씁니다: 「Note that unsuccessful requests contribute to your per-minute limit, so continuously resending a request won’t work.」(Q18).
- **우선순위.** vLLM 은 FCFS 가 기본이고 우선순위 정책을 고를 수 있습니다(「FCFS (default): requests are scheduled first-come, first-served.」, Q25). 이 가이드의 등급별 대기열(유료 먼저)은 GPU 서버 앞의 대기열에서 정하고, 무료 등급이 오래 굶지 않게 꺼내는 비율을 정합니다(판단 — Q1 의 깊이 들어가는 절 제목이 이 문제를 듦).

### 4-4. GPU 작업자의 연속 배칭과 선점 — 배치가 끝나기를 기다리지 않게

- 정적 배칭의 문제(Q7): 「the GPU will be underutilized until the last sequence in the batch finishes generation」. Orca(Q8)의 문제 서술: 일찍 끝난 요청도 돌아가지 못하고 새 요청은 「have to wait until the current batch completely finishes」. 해법은 「iteration-level scheduling, a new scheduling mechanism that schedules execution at the granularity of iteration (instead of request)」입니다.
- 처리량 수치는 실험이고 조건이 붙습니다. vLLM 블로그(Q4): 출력 하나일 때 「vLLM achieves 14x - 24x higher throughput than HF and 2.2x - 2.5x higher throughput than TGI.」, 출력 셋일 때 「vLLM achieves 8.5x - 15x higher throughput than HF and 3.3x - 3.5x higher throughput than TGI.」 Anyscale(Q7): 「Up to 23x throughput improvement using continuous batching and continuous batching-specific memory optimizations (using vLLM).」 — 23배는 연속 배칭만의 효과가 아니고, 글도 「We have not analyzed what optimization contributes the most to vLLM performance」라고 적습니다. 실험은 요청을 한꺼번에 넣었습니다(「The benchmarking script submits all requests in burst fashion, so that the compute is saturated.」).
- 운영 수치(Q4): LMSYS 가 vLLM 으로 「cut the number of GPUs used for serving the above traffic by 50%」, 「an average of 30K requests daily and a peak of 60K」. 단위는 **하루 요청 수**이고 동시 요청 수가 아닙니다.
- 메모리(Q4): 「existing systems waste 60% – 80% of memory due to fragmentation and over-reservation」, PagedAttention 은 「with a mere waste of under 4%」.
- 선점(Q25): 「When a request cannot be allocated new KV cache blocks, the scheduler preempts running requests, chosen by the scheduling policy, until enough blocks are free」. 선점된 요청은 「Its progress is reset and it returns to the waiting queue. Under FCFS it goes to the front of the queue」이고 「When re-admitted, it is recomputed rather than swapped back from CPU memory.」 Q26: 「the default preemption mode is RECOMPUTE rather than SWAP」.
- **선점과 스트리밍.** 선점된 요청은 다시 계산되므로, 이미 보낸 토큰 뒤에서 이어지는지(같은 토큰을 다시 만드는지)는 vLLM 문서가 적지 않습니다(확인 안 함). 이 가이드의 모형은 선점된 실행이 이미 기록한 순번 다음부터만 새로 적는다고 둡니다(가정).
- 배치 크기와 첫 토큰 지연(Q26): `max_num_batched_tokens` 가 작으면 「better ITL」, 크면 「better time to first token (TTFT) as you can process more prefill tokens in a batch」. 같은 인자의 기본값은 문서마다 다릅니다 — SchedulerConfig 는 「The default value here is mainly for convenience when testing. In real usage, this should be set in EngineArgs.create_engine_config.」(Q27)라고 적습니다. 서버가 실제로 쓰는 값은 하드웨어에 따라 코드에서 정해지며(공식 문서 워커가 main 브랜치 코드에서 읽음), 이 노트는 릴리스 번호를 확인하지 않아 숫자를 쓰지 않습니다.

### 4-5. 대화 저장소 — 끝난 답의 기준

- 기능 요구(Q1): 「Users should be able to view past chats and resume a conversation, with the chat's prior context carried into the prompt.」 — 이 편의 낱말로는 「대화 이어 가기」입니다(0절).
- 쓰기는 실행마다 두 번(질문 · 끝난 답)이고, 토큰 조각은 대화 저장소에 쓰지 않습니다(판단 — 3절 2 · 6번).
- OpenAI 의 PostgreSQL 은 읽기를 복제본으로 넓힙니다(「nearly 50 read replicas spread over multiple regions globally」, Q2). 쓰기는 주 서버 하나이고 쓰기가 많은 일은 샤딩된 저장소로 옮깁니다(Q2). 결과로 「We consistently deliver low double-digit millisecond p99 client-side latency and five-nines availability in production.」를 적습니다. InfoQ 요약(Q3)은 같은 복제본을 「nearly 50 geo-distributed read replicas」로 적어 원 글과 낱말이 다릅니다. 가이드는 원 글(Q2)을 씁니다.
- Redis 를 토큰 기록으로 둘 때의 한계(Q39 · Q40): 복제는 비동기이고 「acknowledged writes can still be lost during a failover」, 기본 AOF 설정은 「you may lose 1 second of data if there is a disaster」. 그래서 끝난 답은 대화 저장소에 적고 그것을 기준으로 둡니다(판단).

### 4-6. 취소 — 연결을 닫는 것과 실행을 끝내는 것을 나누기

- Vercel(Q10): 「In a resumable stream setup, client-side aborts are treated as disconnects. Closing a tab, refreshing the page, or calling stop() only closes the current HTTP connection and should not cancel the underlying generation.」 멈추게 하려면 따로 끝점을 둡니다(「add a dedicated stop endpoint」).
- OpenAI(Q15): 「You can also cancel an in-flight response like this:」, 「Canceling twice is idempotent. Later calls return the final Response object.」, 동기 응답은 「For a synchronous response, close the connection instead.」
- Hello Interview(Q1)는 「Cancelling a run and reclaiming the GPU」를 따로 다룹니다(본문 유료).
- 이 가이드는 취소를 실행 번호에 대한 요청으로 받고, 두 번 받아도 같은 결과를 돌려주며, GPU 작업자는 다음 반복에서 그 실행을 배치에서 빼 자리를 돌려받는다고 둡니다(판단 — Q15 의 「idempotent」를 빌림).

### 4-7. 시간 제한과 차단기 — GPU 작업자가 멈출 때

- 시간 제한(Q35): 「A best practice in Amazon is to set a timeout on any remote call」. 값은 내려가는 서비스의 지연 분포에서 고릅니다(「we choose an acceptable rate of false timeouts (such as 0.1%). Then, we look at the corresponding latency percentile on the downstream service (p99.9 in this example).」). LLM 처럼 응답이 긴 호출에 이 방법을 어떻게 쓰는지는 글이 말하지 않습니다(10절). 이 가이드는 응답 전체가 아니라 **조각 사이의 침묵**에 시간 제한을 둡니다(판단 — 실행은 길어도 조각은 자주 오므로).
- Azure 차단기(Q34): 닫힘에서 실패가 기준을 넘으면 열림으로 가고 시간이 지나면 반열림, 반열림에서는 「A limited number of requests from the application are allowed to pass through and invoke the operation.」 주의: 「A circuit breaker might not fully protect applications from failures in external services that have long time-out periods.」 차단기를 GPU 서버 묶음마다 두면 한 묶음이 멈출 때 대기열의 실행을 다른 묶음으로 보냅니다(판단).
- Anthropic 의 긴 요청 안내(Q21): 「Some networks might drop idle connections after a variable period of time, which can cause the request to fail or time out without receiving a response from Anthropic.」 — 4-1 의 주석 줄과 같은 이유입니다.

### 4-8. 남는 한계 — 구조의 가정으로 적을 것

1. **토큰 기록을 잃는 경우.** Redis 장애 조치 때 받았다고 답한 쓰기도 잃을 수 있습니다(Q39). 그 사이의 조각은 다시 연결해도 받지 못합니다. 실행이 끝났으면 대화 저장소의 답으로 다시 보낼 수 있지만, 끝나기 전이면 빠집니다(판단).
2. **GPU 작업자가 생성 중간에 멈추는 경우.** 이미 보낸 조각 뒤를 같은 글로 이어 만들 수 없습니다. Anthropic 은 부분 응답을 새 요청에 넣어 이어 쓰게 하고(「Create a new API request that includes the partial assistant response as the beginning of a new assistant message.」, Q20 — Claude 4.5 이하), 4.6 이후는 「add a user message that instructs the model to continue from where it left off」로 바꿉니다. 「Tool use and thinking blocks cannot be partially recovered.」(Q20). 이 가이드는 그 실행을 「실패」로 적고 사용자가 다시 만들게 둡니다(판단).
3. **겹침.** LibreChat 은 클라이언트 판이 맞지 않으면 내용이 겹친다고 적습니다(Q12). 브라우저가 순번을 다시 보내 오고 서버가 그 다음부터만 보내면 겹침이 없다는 것은 이 구조의 주장이고, 브라우저가 순번을 잃은 경우(새로 고침)는 처음부터 다시 받습니다(Q9 의 「When reconnecting, the entire stream up to the current generation point is sent」와 같은 방식, 판단).
4. **대기열이 넘친 사용자.** 거절된 질문은 기다리지 못합니다. 이것은 첫 토큰 지연을 지키려고 고른 대가입니다(판단).

## 5. 시나리오 절에 쓸 반례와 장애

회고 8절의 판단대로 SSE 재개 커서는 파일럿 1 의 SSE 와 이어집니다(파일럿 회고 8절). GPU 대기열 수치는 출처 대조가 무거울 것이라는 판단도 그대로 맞았습니다 — 회사 운영 수치로 된 GPU 대기 시간은 찾지 못했고(9절), 대기열 수치는 가정과 계산으로 세웁니다.

1. **기본 흐름(대기열이 빔).** 질문 → 대화 저장소에 사용자 메시지 → 실행을 대기열에 넣음 → GPU 작업자가 다음 반복에 배치로 꺼냄 → prefill 뒤 첫 조각을 순번 1 로 토큰 기록에 적음 → 게이트웨이가 `id: 1` 로 보냄 → 끝나면 답을 대화 저장소에 적음. 첫 토큰 지연은 대기 + prefill + 전송입니다(Q31).
2. **몰림(대기열이 길어짐).** 출시 직후처럼 초당 질문이 GPU 의 처리 능력을 넘으면 대기열이 길어지고 첫 토큰 지연이 늘어납니다(3절 4번 · Q31 · Q33). 대기열이 하나면 유료 · 무료가 같은 줄에서 기다리고, 등급별 대기열과 길이 한도가 있으면 유료는 먼저 꺼내지고 한도를 넘은 질문은 429 와 `Retry-After` 로 거절됩니다. 비교 축은 등급마다의 첫 토큰 지연과 거절 수입니다.
3. **끊김과 다시 연결.** 사용자의 연결이 순번 40 에서 끊기고 5초 뒤 `Last-Event-ID: 40` 으로 다시 연결합니다. 그동안 실행은 계속되어 순번 41 부터 받은 조각이 쌓였고, 게이트웨이는 41 부터 보냅니다. 토큰 기록이 없는 구조(GPU 작업자가 연결에 바로 씀)면 끊긴 사이의 조각은 사라지고 실행은 버려지거나(「burning inference cost」, Q14) 처음부터 다시 만들어야 합니다.
4. **게이트웨이 배포(재시작).** 게이트웨이 한 대가 내려가면 그 연결이 모두 다시 연결합니다. 다른 게이트웨이가 같은 토큰 기록을 읽으므로 이어 받습니다(Q11 의 「without sticky load balancing」과 같은 방식). Q1 의 깊이 들어가는 절 제목이 「across reconnects and deploys」입니다.
5. **GPU 작업자가 생성 중간에 멈춤.** 조각 사이의 침묵이 시간 제한을 넘으면 실행을 「실패」로 적고 스트림에 오류 이벤트를 보냅니다(Q20 · Q21). 차단기가 그 GPU 묶음을 열어 대기열의 다음 실행은 다른 묶음으로 갑니다(Q34).
6. **취소.** 사용자가 순번 30 에서 멈춤을 누르면 취소 요청이 실행을 끝내고 GPU 자리를 돌려받습니다. 같은 취소가 두 번 와도 결과는 같습니다(Q15). 탭을 닫는 것은 취소가 아니므로 실행은 끝까지 갑니다(Q10).
7. **KV 캐시가 모자람(선점).** 긴 문맥 실행이 많이 들어와 KV 블록이 모자라면 마지막에 들어온 실행이 빠져 대기열 맨 앞으로 갑니다(Q25). 그 실행의 사용자는 조각이 잠시 멈춥니다. 모형에서는 이미 적은 순번 다음부터만 새로 적습니다(4-4, 가정).

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 핵심 | 얻는 것 | 잃는 것 · 맞지 않는 때 | 근거 |
| --- | --- | --- | --- | --- |
| A. 작업자가 연결에 바로 씀 | GPU 작업자가 SSE 연결에 토큰을 그대로 흘림 | 가장 단순하고 첫 토큰이 빠름 | 끊기면 이어 받을 위치가 없음(Q14), 서버가 끊김을 늦게 알면 만든 토큰을 버림 | Q14 |
| B. 토큰 기록 + 순번으로 이어 받기(추천) | 실행이 조각을 순번과 함께 기록하고 게이트웨이가 `Last-Event-ID` 다음부터 보냄 | 끊김 · 배포에도 이어 받음, 게이트웨이를 아무 곳으로나 보냄 | 토큰 기록의 쓰기 양(3절 2번)과 보관, Redis 를 쓰면 장애 조치 때 일부 조각을 잃음(Q39) | Q9 · Q10 · Q11 · Q12 · Q15 · Q23 · Q37 |
| C. 결과만 저장하고 끝나면 가져가기(폴링) | 실행이 끝난 답만 저장하고 브라우저가 상태를 물음 | 토큰 기록이 없음 | 첫 토큰을 흘려보내지 못함 — 요구의 첫 토큰 지연을 못 지킴 | Q15 의 「Keep polling while the status is queued or in_progress.」 |
| D. 관리형 지속 스트림 | 스트림 위치를 오프셋으로 주는 외부 서비스 | 직접 운영하지 않음, 기기를 바꿔도 이어 받음 | 외부 서비스 의존, 2025-12 시점의 계획 단계 서비스 포함 | Q13 · Q14(벤더) |
| 대기열 1. 대기열 없이 바로 거절 | GPU 자리가 없으면 즉시 429 | 대기 0 | 짧은 몰림도 모두 거절 | Q29 |
| 대기열 2. 길이 한도 없는 대기열 | 모두 받아 기다리게 함 | 거절 0 | 대기가 끝없이 길어져 첫 토큰 지연을 못 지킴 | Q33 |
| 대기열 3. 등급별 대기열 + 길이 한도(추천) | 유료 먼저, 한도를 넘으면 `Retry-After` 로 거절 | 첫 토큰 지연의 상한 | 거절된 사용자는 기다리지 못함 | Q1 · Q18 · Q33 |

- **전환점 후보(판단).** (1) 실행이 아주 짧아 끊김이 드물면 B 의 토큰 기록 비용이 이점보다 클 수 있습니다(Ably 는 「You’re paying to persist tokens for every conversation in order to support the small subset that drop.」라고 적음, Q14 — 벤더의 비판). (2) 응답이 분 단위로 길어지면(에이전트 실행) C 와 B 를 함께 씁니다 — OpenAI 의 background mode 가 그 모양입니다(Q15). (3) 브라우저 탭이 많고 HTTP/2 를 못 쓰면 연결 6개 한도에 걸립니다(Q24). (4) 대기열 한도를 정할 기준(GPU 처리 능력)이 크게 흔들리면 길이 대신 예상 대기 시간으로 거절합니다.

## 7. 실제 사례 절에 쓸 대응표

| 사례 | 무엇을 했나 | 가이드의 어느 부품 | 주의 |
| --- | --- | --- | --- |
| Hello Interview, 2026-05(Q1) | 2억 DAU · 최대 초당 2만 · 동시 12만을 설계 대상으로 정함, 깊이 들어가는 절 다섯과 취소 | 요구 · 규모 추정 | 교육용 추정, 본문 유료 |
| OpenAI, 2026-01(Q2) | PostgreSQL 주 서버 하나와 읽기 복제본 50 가까이, 쓰기가 많은 일은 샤딩된 저장소로, 여러 층의 속도 제한 | 대화 저장소 | 대화를 저장하는지는 글에 없음 |
| Character.AI, 2024-06(Q5 · Q6) | 초당 2만 넘는 질문, 대화 이력 평균 180, KV 캐시를 대화 사이에 호스트 메모리에 두고 같은 대화를 같은 서버로 보냄 | 규모 추정 · 범위 밖(KV 캐시) | 원래 기술 글 주소는 사라지고 블로그 사본 |
| vLLM / LMSYS, 2023-06(Q4) | PagedAttention 으로 메모리 낭비 4% 미만, GPU 50% 절감, 하루 평균 3만 · 최대 6만 요청 | GPU 작업자 | 처리량 배수는 실험 |
| Anyscale, 2023-06(Q7) | 연속 배칭과 메모리 최적화로 최대 23배 | GPU 작업자 | 요청을 한꺼번에 넣은 실험 |
| OpenAI API, 조회일 현재(Q15 · Q16) | background 실행, `sequence_number` · `starting_after` 로 이어 받기, 취소 두 번은 같은 결과 | 토큰 기록 · 이어 받기 · 취소 | API 문서이며 ChatGPT 앱 구조가 아님 |
| Vercel AI SDK, 조회일 현재(Q10 · Q11) | 활성 스트림을 Redis 에 두고 다시 연결하면 이어 받음, 탭 닫기는 취소가 아님 | 이어 받기 · 취소 | 보관 기간 수치 없음 |
| Upstash, 2025-04(Q9) · LibreChat(Q12) · Electric, 2025-12(Q13) | 조각을 Redis Stream 이나 오프셋 스트림에 적고 다시 연결 때 이어 줌 | 토큰 기록 | 벤더 글 · 오픈소스 문서 |

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 앞 편과 같은 틀입니다.
- 대역: 채팅 API(질문 → 사용자 메시지 적기 → 실행 만들기 → 대기열), 등급별 대기열(유료 · 무료, 길이 한도), GPU 작업자 G 개(배치 자리 수, prefill 시간 = 문맥 토큰 × 상수, 반복마다 실행마다 토큰 하나), 토큰 기록(실행마다 순번 · 조각 목록, 실행이 끝난 시각), 스트림 게이트웨이(연결마다 마지막으로 보낸 순번), 대화 저장소(대화마다 메시지 목록), 사용자 대역(연결 · 끊김 · `Last-Event-ID` 로 다시 연결 · 취소).
- 사건: 질문 도착, 배치 반복(토큰 하나), 조각 적기(모아 적는 간격), 게이트웨이 보내기, 연결 끊김, 다시 연결, 취소, 작업자 멈춤, 게이트웨이 재시작.
- 고정할 출력 후보는 이렇습니다.
  - 질문마다 첫 토큰 지연(대기열이 빌 때 · 몰릴 때, 유료 · 무료), 거절 수와 `Retry-After` 값
  - 끊긴 사용자가 받은 순번 목록에 빠짐 · 겹침이 없는지(받은 순번이 1 부터 끝까지 한 번씩)
  - 끊긴 동안 실행이 만든 조각 수, 토큰 기록이 없는 대안에서 버린 조각 수
  - 취소 뒤 GPU 자리가 돌아온 반복 번호, 두 번째 취소의 결과
  - 작업자가 멈춘 실행의 상태와 오류 이벤트, 차단기가 열린 시각
- 변형 실행 후보: 대기열 길이 한도를 없앰(첫 토큰 지연이 늘어남), 등급을 하나로(유료의 첫 토큰 지연이 무료와 같아짐), 토큰 기록 없이 바로 씀(끊긴 사이의 조각이 빠짐), 다시 연결 때 `Last-Event-ID` 대신 처음부터(겹침).
- 세 언어(Java · TypeScript · Rust)로 같은 출력을 내야 하므로 난수를 쓰지 않습니다. 모아 적는 간격 · prefill 상수 · 배치 자리 수는 상수로 둡니다.

## 9. 미해결 질문

1. ChatGPT 가 끊긴 응답을 실제로 어떻게 이어 주는지(토큰을 어디에 두는지, 커서 형태, 보관 기간)는 1차 자료를 찾지 못했습니다. Hello Interview 의 해당 본문은 유료입니다.
2. 회사 운영 수치로 된 GPU 대기 시간 · 429 비율 · 등급별 첫 토큰 지연은 찾지 못했습니다. 대기열 수치는 가정과 계산입니다(3절 4번).
3. 요구 표의 첫 토큰 1초 · 유료 3초는 출처가 없는 가정입니다. 채팅 TTFT 500ms 같은 값은 조사 워커가 2차 요약에서만 봤고 출처를 열지 않아 쓰지 않습니다.
4. 연결이 끊기는 비율을 적은 1차 자료는 찾지 못했습니다(Ably 의 「the small subset that drop」은 벤더의 표현이고 수치가 없음).
5. vLLM 이 선점 뒤 다시 계산할 때 이미 보낸 토큰과 같은 토큰을 만드는지는 문서에 없습니다.
6. TGI 가 넘칠 때 돌려주는 상태 코드 숫자는 문서에 없습니다.
7. OpenAI 스트리밍 이벤트 레퍼런스의 `sequence_number` 정의 문장은 확인 안 함입니다(공식 문서 워커가 레퍼런스 앞부분만 읽음). background 안내(Q15)의 이어 받기 문장과 예제 코드는 원문으로 확인했습니다.
8. Vercel · LibreChat · Upstash 의 토큰 기록 보관 기간 수치는 문서에 없습니다.
9. 국내(네이버 · 카카오 · 업스테이지 · 뤼튼)의 채팅 스트리밍 · 재접속 · 대기열 수치 글은 이번 검색에서 찾지 못했습니다. 네이버 CLOVA 의 서빙 글(2026-04)은 멀티모달 서빙의 라우팅 수치라 이 편에 쓰지 않습니다.
10. Educative(Q41)의 「Design a ChatGPT System」 레슨 본문과 ByteByteGo(Q42) 4장 본문은 열지 않았습니다(장 제목만).
11. Character.AI 의 원래 기술 글 주소(`research.character.ai/optimizing-inference/`)는 블로그 목록으로 넘어가 열리지 않아, 같은 제목의 블로그 사본(Q6)을 썼습니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-24 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트(Anthropic 문서는 같은 문서의 마크다운 판, vercel/resumable-stream 은 README 원본)에서 문자열을 찾은 것이고, 따옴표 모양 · 공백 · 줄바꿈 · 유니코드 정규화만 맞췄습니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 세기 · 같은 글 안의 다른 값 · 대상 · 「없음」을 확인한 낱말 |
| --- | --- | --- | --- |
| Q1 Hello Interview | 글자 그대로 | 문제 정의 · 2억 DAU · 최대 초당 2만 · 동시 12만 · 첫 토큰이 전체보다 중요 · GPU 부족 · 기능 요구 둘 · 범위 밖 다섯 · 깊이 들어가는 절 제목 다섯과 취소 | 수치는 「at the time of writing」 · 「somewhere around」 · 「roughly」의 추정. 20k 는 「at peak」, 120k 는 「at any given moment」. 본문의 SSE · WebSocket · queue · cursor 는 공개 부분에 없음(워커 확인). 게시일은 메타데이터 `datePublished` 2026-05-21(정정) |
| Q2 OpenAI, Scaling PostgreSQL | 글자 그대로 | 800M 사용자 · 초당 수백만 질의 · 주 서버 하나 · 읽기 복제본 50 가까이 · 쓰기 확장 불가 · 쓰기가 많은 일을 샤딩 · p99 두 자리 ms · five-nines · SEV-0 한 번 · 여러 층의 속도 제한 · 짧은 재시도 간격이 재시도 폭주를 부름 · 스키마 변경 5초 시간 제한 | 「10x」는 한 해 부하와 일주일 쓰기 두 사건. `conversation` · `message` 0개 — 대화 저장 서술 없음 |
| Q3 InfoQ | 글자 그대로 | 2차 요약의 존재 | 원 글의 「spread over multiple regions globally」를 「geo-distributed」로 적음. 가이드는 Q2 를 씀 |
| Q4 vLLM 블로그 | 글자 그대로 | 14 ~ 24배(HF) · 2.2 ~ 2.5배(TGI), 출력 셋일 때 8.5 ~ 15배 · 3.3 ~ 3.5배 · 메모리 낭비 60 ~ 80% 대 4% 미만 · LMSYS GPU 50% 절감 · 하루 평균 3만 최대 6만 | 처리량은 실험(「up to」). 하루 요청 수이며 동시 수 아님. `continuous batching` 낱말은 이 글에 없음(워커 확인) |
| Q5 Character.AI 발표 글 | 글자 그대로 | 초당 약 2만 질문(「around」) · 구글 검색의 약 20% | 기술 글(Q6)은 같은 수치를 「more than」으로 적음 |
| Q6 Character.AI 기술 글 사본 | 글자 그대로 | 초당 2만 넘음 · 대화 이력 평균 180 · 호스트 메모리 KV 캐시 · 같은 대화를 같은 서버로 · 캐시율 95% · KV 캐시 20배 넘게 줄임 | 95% 가 평균인지 없음. 원래 주소는 블로그 목록으로 넘어감. 게시일 표시 2024-06-20, 메타데이터 2024-06-21T00:13Z |
| Q7 Anyscale | 글자 그대로 | 최대 23배(연속 배칭 + 그에 맞춘 메모리 최적화) · 정적 배칭의 낭비 · 어느 최적화가 큰지 분석 안 함 · 한꺼번에 넣은 실험 | 23배는 연속 배칭만의 효과가 아님 |
| Q8 Orca(OSDI '22) | 글자 그대로(학회 페이지의 초록) | 반복 단위 스케줄링 · 선택적 배칭 · 요청 단위 배칭의 문제 | 본문 PDF 는 열지 않음 |
| Q9 Upstash | 글자 그대로 | 조각마다 Redis Stream 에 적음 · 다시 연결해도 생성 계속 · 활성 중에는 델타만, 다시 연결 때는 지금까지 전체 · 소비자 그룹이 겹침 · 빠짐을 막음 | 벤더 글. 보관 기간 · TTL 없음(워커 확인). 워커가 「맞물림이 없다」고 한 두 문장은 같은 문단이 두 경우를 나눔(정정) |
| Q10 Vercel AI SDK 문서 | 글자 그대로 | 저장은 앱 몫 · 활성 스트림 없으면 204 · Redis 의 스트림은 정한 시간 뒤 사라짐 · 탭 닫기와 `stop()` 은 연결만 닫음 · 멈춤은 따로 끝점 | 기간 수치 없음. 세기: 「should not cancel」 |
| Q11 vercel/resumable-stream README | 글자 그대로 | 고정 세션 없는 서버리스용 · 생산자는 독자가 떠나도 끝까지 만듦 · 다시 연결하면 쌓아 둔 조각부터 다시 보냄 · `resumeAt` | 기본 만료 시간은 README 에 없음(워커 확인) |
| Q12 LibreChat 문서(한국어) | 글자 그대로 | 모든 델타를 기록하는 생성 작업 · 누락분은 동기화 이벤트 하나 · Redis Streams · 완료 뒤 TTL · 판이 맞지 않으면 겹침 | TTL 기간 값 없음 |
| Q13 Electric | 글자 그대로 | 위치마다 불투명하고 늘어나기만 하는 오프셋 · 클라이언트가 마지막 오프셋을 저장 · 새로 고침과 기기 전환에도 이어 받음 · HTTP(긴 폴링이나 SSE) | 벤더 글, 날짜는 주소에서 읽음. 클라우드 판은 「early next year」 계획 |
| Q14 Ably | 글자 그대로 | HTTP 스트리밍에는 이어 받을 위치가 없음 · 끊김을 늦게 알면 추론 비용을 버림 · Vercel 방식 평가 · 모든 대화의 토큰을 저장하는 비용 | 자사 제품 홍보 글, 경쟁사 평가는 벤더 관점 |
| Q15 OpenAI Background mode | 글자 그대로 | 이어 받기(`sequence_number` → `starting_after`) · `keepalive` 는 커서 아님 · 스트리밍은 `soonest` 에서만 · 나중에 스트리밍 불가 · 첫 토큰이 더 늦을 수 있음 · 취소와 두 번 취소 · `queued` · `in_progress` 동안 폴링 · 임시 저장 | 보관 기간 수치 없음(Q16 에 있음). `2h` · `8h` 는 「targets」(목표) |
| Q16 OpenAI Your data | 글자 그대로 | 기본 창 background 는 디스크에 약 10분 · `store` 생략이나 false 면 임시 보관 뒤 지움 · Responses API 기본 30일 | 10분은 조건(기본 창, `store` 생략 · false) 아래의 값. 「store=true」를 명시하면 표준 보관 |
| Q17 OpenAI Streaming | 글자 그대로 | SSE 사용 · 자주 쓰는 이벤트 넷 | 이 문서에 `sequence_number` 없음(워커 확인) |
| Q18 OpenAI Rate limits | 글자 그대로 | `Retry-After` 는 「when present」 · `slow_down` 429 · 실패한 요청도 분당 한도를 씀 | 세기: 「when present」 — 늘 오지 않음 |
| Q19 OpenAI Error codes | 글자 그대로 | 503 `server_is_overloaded` | |
| Q20 Anthropic Streaming | 글자 그대로(마크다운 판) | 이벤트 순서 · `ping` · 스트림 안 `overloaded_error`(HTTP 529 에 해당) · 오류 복구(4.5 이하 · 4.6 이후) · 도구 · 생각 블록은 부분 복구 불가 | 오류 이벤트의 세기는 「might occasionally」. 서버 쪽 커서 · `Last-Event-ID` 지원 문장 없음(워커 확인) |
| Q21 Anthropic Errors | 글자 그대로(마크다운 판) | 200 뒤 오류는 일반 처리와 다름 · 529 · 쉬는 연결이 끊길 수 있음 | 529 에 `retry-after` 를 말하는 문장 없음(워커 확인) |
| Q22 Anthropic Rate limits | 글자 그대로(마크다운 판) | `retry-after` 는 모든 429 에 오지 않음 · 토큰 버킷 | 세기: 「Not every 429 carries it」 |
| Q23 HTML 표준 SSE | 글자 그대로 | 다시 연결 · 204 로 멈춤 · `Last-Event-ID` · `id` · `retry` · 다시 연결 간격 몇 초 · 지수 백오프는 might · 15초쯤 주석 줄은 can | 서버가 어디부터 보낼지는 정하지 않음 — `resume` · `replay` 없음(이 노트가 텍스트에서 셈). 5xx 를 따로 다루는 문장 없음(워커 확인) |
| Q24 MDN SSE | 글자 그대로 | 끊기면 다시 연결 · HTTP/2 가 아니면 브라우저 · 도메인마다 6개 · HTTP/2 기본 100 | `Last-Event-ID` 는 이 페이지에 없음(워커 확인) |
| Q25 vLLM Architecture Overview | 글자 그대로 | 스케줄러 · FCFS 기본 · 우선순위 · 선점과 대기열 맨 앞 · 다시 계산 | `continuous batching` · `max_num_seqs` 없음(워커 확인) |
| Q26 vLLM Optimization | 글자 그대로 | 선점 기본 RECOMPUTE · 배치 토큰 수와 ITL · TTFT | |
| Q27 vLLM SchedulerConfig | 글자 그대로 | 기본값은 「mainly for convenience when testing」 | 실제 값은 하드웨어별로 코드에서 정함 — 이 노트는 릴리스를 확인하지 않아 숫자를 쓰지 않음 |
| Q28 TGI Streaming | 글자 그대로 | SSE · 넘치면 `overloaded` 오류 · 클라이언트는 바쁨 표시나 다시 보내기 | 상태 코드 숫자 없음. 세기: 「could display」 |
| Q29 TGI Launcher | 글자 그대로 | `--max-concurrent-requests` 기본 128 · 낮은 한도는 기다리게 하지 않고 거절 | |
| Q30 TGI 첫 페이지 | 글자 그대로 | 유지 보수 상태 | 추천 서버로 쓰지 않음 |
| Q31 NVIDIA | 글자 그대로 | TTFT 에 대기열 시간 포함 · 용량을 넘으면 대기열 때문에 TTFT 증가 | 운영 수치 없음 |
| Q32 Andes(arXiv) | 글자 그대로(초록) | QoE 평균 최대 4.7배 · GPU 최대 61% 절감 | 연구 실험. 본문 PDF 는 열지 않음 |
| Q33 Azure 대기열 패턴 | 글자 그대로 | 버퍼 · 평균 부하 기준 · 생산이 소비를 넘으면 길어짐 · 생산 쪽에서 덜어냄 · 적어도 한 번 · 순서 보장 없음 · 낮은 지연의 동기 응답에는 맞지 않을 수 있음 | 가득 차면 거절하라는 문장 없음 — `reject` · `full` · `backpressure`(워커 확인) |
| Q34 Azure 차단기 패턴 | 글자 그대로 | 닫힘 · 열림 · 반열림 · 긴 시간 제한의 외부 서비스는 다 막지 못함 | |
| Q35 AWS Builders' Library | 글자 그대로 | 모든 원격 호출에 시간 제한 · 거짓 시간 초과 0.1% 와 p99.9 · 재시도가 과부하를 키움 · 지터 | LLM · 스트리밍 문장 없음(워커 확인) |
| Q36 Redis XADD | 글자 그대로 | 자동 ID 는 밀리초 시각-번호 · 늘 늘어남 보장과 시계가 뒤로 갈 때의 처리 | |
| Q37 Redis XREAD | 글자 그대로 | 마지막 ID 보다 큰 것만 · `$` 는 첫 호출에만 | 8.10 의 `MAXCOUNT` · `MAXSIZE` 는 쓰지 않음 |
| Q38 Redis XTRIM | 글자 그대로 | `~` 는 기준보다 수십 개 더 남을 수 있음 | |
| Q39 Redis 복제 | 글자 그대로 | 비동기 복제 · 받았다고 답한 쓰기도 장애 조치 때 잃을 수 있음 | |
| Q40 Redis 지속성 | 글자 그대로 | `everysec` 는 1초를 잃을 수 있음 | |
| Q41 Educative | 장 제목만 | 「Design a ChatGPT System」 2 레슨 | 본문 열지 않음 |
| Q42 ByteByteGo | 장 제목만 | 4장 「ChatGPT: Personal Assistant Chatbot」 | 본문 열지 않음 |

- **인용 대조 결과.** 이 노트 안의 「…」 인용 148개를 모두 뽑아 원문 텍스트 45편 전체에서 찾았고, 148개가 모두 글자 그대로 있었습니다(2026-11-24). 처음 초안에서는 이 노트가 쓴 말에 「」를 붙인 9곳과 Anthropic 문서의 링크 표기 때문에 글자가 어긋난 1곳이 걸려, 앞의 9곳은 따옴표를 풀고 뒤의 1곳은 원문의 다른 문장으로 바꿨습니다.

## 11. 출처

조회일은 모두 2026-11-24 입니다.

- Q1. [Hello Interview — ChatGPT](https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt) — 2026-05-21(페이지 메타데이터), 교육용 분석, 본문 대부분 유료
- Q2. [OpenAI — Scaling PostgreSQL to power 800 million ChatGPT users](https://openai.com/index/scaling-postgresql/) — 2026-01-22
- Q3. [InfoQ — OpenAI Scales Single Primary PostgreSQL Instance to Millions of Queries per Second for ChatGPT](https://www.infoq.com/news/2026/02/openai-runs-chatgpt-postgres) — 2026-02-12(Q2 의 2차 요약)
- Q4. [vLLM — vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention](https://vllm.ai/blog/2023-06-20-vllm) — 2023-06-20
- Q5. [Character.AI — Optimizing AI Inference at Character.AI](https://blog.character.ai/optimizing-ai-inference-at-character-ai/) — 2024-06-20(발표 글)
- Q6. [Character.AI — Optimizing AI Inference at Character.AI(기술 글)](https://blog.character.ai/optimizing-ai-inference-at-character-ai-2/) — 2024-06-20(페이지 표시). 원래 주소 `research.character.ai/optimizing-inference/` 는 블로그 목록으로 넘어감
- Q7. [Anyscale — How continuous batching enables 23x throughput in LLM inference while reducing p50 latency](https://www.anyscale.com/blog/continuous-batching-llm-inference) — 2023-06-22
- Q8. [Yu et al. — Orca: A Distributed Serving System for Transformer-Based Generative Models (OSDI '22)](https://www.usenix.org/conference/osdi22/presentation/yu) — 2022-07
- Q9. [Upstash — How to Build LLM Streams That Survive Reconnects, Refreshes, and Crashes](https://upstash.com/blog/resumable-llm-streams) — 2025-04-14(벤더 글)
- Q10. [Vercel AI SDK — Chatbot Resume Streams](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams) — 날짜 표시 없음
- Q11. [vercel/resumable-stream — README](https://github.com/vercel/resumable-stream) — 날짜 표시 없음
- Q12. [LibreChat — 재개 가능한 스트림](https://www.librechat.ai/ko/docs/features/resumable_streams) — 날짜 표시 없음
- Q13. [Electric — Announcing Durable Streams](https://electric.ax/blog/2025/12/09/announcing-durable-streams) — 2025-12-09(주소에서 읽음, 벤더 글)
- Q14. [Ably — AI chat stream resumption](https://ably.com/blog/ai-chat-stream-resumption) — 2026-06-30(벤더 글)
- Q15. [OpenAI API — Background mode](https://developers.openai.com/api/docs/guides/background) — 날짜 표시 없음
- Q16. [OpenAI API — Your data](https://developers.openai.com/api/docs/guides/your-data) — 날짜 표시 없음
- Q17. [OpenAI API — Streaming API responses](https://developers.openai.com/api/docs/guides/streaming-responses) — 날짜 표시 없음
- Q18. [OpenAI API — Rate limits](https://developers.openai.com/api/docs/guides/rate-limits) — 날짜 표시 없음
- Q19. [OpenAI API — Error codes](https://developers.openai.com/api/docs/guides/error-codes) — 날짜 표시 없음
- Q20. [Anthropic — Streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming) — 날짜 표시 없음
- Q21. [Anthropic — Claude API errors](https://platform.claude.com/docs/en/api/errors) — 날짜 표시 없음
- Q22. [Anthropic — Rate limits](https://platform.claude.com/docs/en/api/rate-limits) — 날짜 표시 없음
- Q23. [WHATWG — HTML Living Standard, 9.2 Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) — Living Standard(조회일 판)
- Q24. [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — 2026-09-03(페이지 수정 시각)
- Q25. [vLLM 문서 — Architecture Overview](https://docs.vllm.ai/en/stable/design/arch_overview.html) — stable 판
- Q26. [vLLM 문서 — Optimization and Tuning](https://docs.vllm.ai/en/stable/configuration/optimization.html) — stable 판
- Q27. [vLLM 문서 — SchedulerConfig](https://docs.vllm.ai/en/stable/api/vllm/config/scheduler.html) — stable 판
- Q28. [Hugging Face TGI — Streaming](https://huggingface.co/docs/text-generation-inference/conceptual/streaming) — 날짜 표시 없음
- Q29. [Hugging Face TGI — Text-generation-launcher arguments](https://huggingface.co/docs/text-generation-inference/en/basic_tutorials/launcher) — 날짜 표시 없음
- Q30. [Hugging Face TGI — Text Generation Inference](https://huggingface.co/docs/text-generation-inference/en/index) — 날짜 표시 없음(유지 보수 상태 안내)
- Q31. [NVIDIA — LLM Inference Benchmarking: Fundamental Concepts](https://developer.nvidia.com/blog/llm-benchmarking-fundamental-concepts) — 2025-04-02
- Q32. [Andes: Defining and Enhancing Quality-of-Experience in LLM-Based Text Streaming Services (arXiv 2404.16283)](https://arxiv.org/abs/2404.16283) — v1 2024-04-25, v2 2024-12-13
- Q33. [Microsoft Azure Architecture Center — Queue-Based Load Leveling pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling) — 조회일 판
- Q34. [Microsoft Azure Architecture Center — Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) — 조회일 판
- Q35. [AWS Builders' Library — Timeouts, retries, and backoff with jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter) — 2019-12-05
- Q36. [Redis — XADD](https://redis.io/docs/latest/commands/xadd/) — latest
- Q37. [Redis — XREAD](https://redis.io/docs/latest/commands/xread/) — latest
- Q38. [Redis — XTRIM](https://redis.io/docs/latest/commands/xtrim/) — latest
- Q39. [Redis — Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/) — latest
- Q40. [Redis — Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) — latest
- Q41. [Educative — Grokking Modern System Design Interview](https://www.educative.io/courses/grokking-modern-system-design-interview) — 장 제목만
- Q42. [ByteByteGo — Generative AI System Design Interview](https://bytebytego.com/courses/genai-system-design-interview/introduction-and-overview) — 장 제목만

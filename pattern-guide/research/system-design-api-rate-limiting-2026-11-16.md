# 리서치 노트 — API 처리율 제한: 한 사용자의 폭주를 막고, 여러 리전에서 함께 센다

- 조사일: 2026-11-16. 자료 조사는 조사 워커 둘이 했고(1차 기술 글 셋과 Redis 문서 · 표준과 그 밖의 사례), 본문에 실을 만한 인용과 수치는 같은 날 원문을 다시 열어 글자 그대로 맞췄습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 첫 편(`api-rate-limiting`, 사례 목록 [IN-01](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S4 의 산출물입니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `L` 로 시작합니다(파일럿 노트의 `V` · `C` 와 겹치지 않게).

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 세는 법 · 4-2 원자성과 만료 · 4-3 어디서 세는가 · 4-4 응답 형식 · 4-5 고장 났을 때) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 표 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

처리율 제한은 「한 사용자가 정해진 시간에 보낼 수 있는 요청 수」를 세고, 넘으면 거절하는 일입니다. 어렵게 만드는 것은 셈 자체가 아니라 **어디서, 얼마나 정확하게 세는가**입니다. 요청마다 중앙 저장소에 물으면 정확하지만 그 왕복이 모든 요청의 지연에 더해지고, 저장소가 고장 나면 API 전체가 멈출 수 있습니다. 서버마다 따로 세면 빠르지만 같은 사용자가 여러 서버로 들어오면 한도의 몇 배가 통과합니다.

공개 사례는 세 갈래입니다.

1. **중앙 저장소(Redis)에서 요청마다 원자적으로 판정** — Stripe(L1) · GitHub(L3) · Envoy 전역 제한(L14). 판정 로직을 Lua 스크립트 하나로 묶어 원자성을 얻습니다(L3 · L6).
2. **데이터센터(PoP)마다 따로 세기** — Cloudflare(L2). 애니캐스트로 한 사용자의 요청이 대체로 한 PoP 로 가므로 PoP 안에서만 세고, 슬라이딩 윈도 근사로 카운터 둘만 둡니다.
3. **로컬에서 세고 주기적으로 맞추기** — LaunchDarkly Floodgate(L17) · Monzo(L18) · Uber GRL(L16). 요청 경로에서 중앙 저장소를 부르지 않고, 몫이나 총계를 주기적으로 받아 옵니다. 대신 동기화 사이에 오차가 생깁니다.

고장 났을 때의 기본값은 공개 사례 대부분이 **열어 두기(fail open)**입니다. Stripe 는 제한기의 버그나 Redis 장애가 요청에 영향을 주지 않게 하라고 권하고(L1), Envoy 는 기본이 허용이며(L14, 요약기 경유), Uber 는 컨트롤 플레인이 내려가면 클라이언트가 열어 둡니다(L16). LaunchDarkly 는 같은 동작을 「It fails dangerously」라고 불렀습니다(L17). 그래서 가이드는 열어 두되 그 대가를 시나리오로 보이는 쪽이 맞습니다(판단).

이 노트의 추천 구조(판단)는 **리전마다 Redis 하나에 사용자별 카운터를 두고, 판정은 Lua 스크립트 한 번으로, 셈은 슬라이딩 윈도 근사로**입니다. 리전 사이에는 한도를 나눠 배정하고(LINE 의 인스턴스별 분할, L15), Redis 가 응답하지 않으면 그 서버의 로컬 토큰 버킷으로 내려가 열어 둡니다(Envoy 의 로컬 + 전역 병용, L14). 결정은 집필에서 대안 비교로 내립니다.

## 2. 요구사항 절에 쓸 근거 — 「폭주를 막는다」를 숫자로

공개 API 의 한도는 서비스마다 크기와 창 길이가 다릅니다. 가이드의 요구 수치를 정할 때 기준으로 삼을 수 있는 값입니다.

| 서비스 | 한도 | 창 · 방식 | 출처 |
| --- | --- | --- | --- |
| GitHub REST | 비인증 60건, 인증 사용자 5,000건 | 1시간 | L11 |
| Shopify REST Admin | 앱 · 스토어마다 40건, 초당 2건씩 다시 참 | 누수 버킷, Plus 는 10배 | L12 |
| Discord | 봇마다 초당 50건(전역) | 경로별 버킷이 따로 있음 | L13 |
| Discord(잘못된 요청) | 10분에 10,000건 | 401 · 403 · 429 를 받은 요청 | L13 |

- 위 값은 각 서비스의 정책이지 구조의 한계가 아닙니다. 가이드는 자기 상황의 한도를 가정으로 세우고, 위 값은 「이 정도 크기가 흔하다」는 근거로만 씁니다(판단).
- **요구 표 후보(가정)**: 사용자(API 키)마다 1분에 600건, 순간 몰림은 100건까지 허용, 판정이 요청 지연에 더하는 시간은 같은 리전 안 왕복 한 번 이내, 한도를 넘긴 요청 비율 오차 1% 이내, 제한기가 고장 나도 API 는 계속 응답. 마지막 행의 근거는 L1 의 권고이고, 오차 행의 비교 기준은 Cloudflare 의 0.003%(L2)입니다.
- 응답은 HTTP 429 입니다. RFC 6585 는 429 를 「too many requests in a given amount of time」로 정의하고, Retry-After 는 넣을 수 있다(MAY)고만 적습니다(L8). 같은 절은 서버가 사용자를 어떻게 알아보는지 · 요청을 어떻게 세는지 정의하지 않는다고 밝힙니다. 그래서 세는 방법은 전부 설계자의 몫입니다.

## 3. 규모 추정 절에 쓸 계산

규모 가정과 계산입니다. 출처 수치는 Redis 처리량 하나뿐이고, 나머지는 가이드의 가정입니다.

1. 전체 API 요청: 초당 10만 건(가정), 리전 셋에 고르게 나뉜다고 보면 리전마다 초당 약 3만 3천 건(계산).
2. 판정 한 건이 Redis 명령 하나(Lua 스크립트 한 번)이면 리전 Redis 가 받는 명령도 초당 약 3만 3천 건입니다(계산). 파일럿 1 노트가 인용한 Redis 벤치마크 예시는 파이프라인 없는 `SET` 초당 180,180건입니다(`live-viewer-count-2026-11-13.md` 의 Redis benchmark 출처). 벤치마크는 그 문서의 기계와 조건에서 잰 값이라 한도로 쓰지 않고, 「리전마다 노드 하나로 시작할 수 있다」는 판단의 근거로만 씁니다(판단).
3. 저장 크기: 슬라이딩 윈도 근사는 카운터 하나에 숫자 둘을 둡니다(L2 「only two numbers per counter」). 한 시간 안에 요청한 사용자가 100만 명이고 키 하나가 100바이트라면(가정) 리전마다 약 200MB 입니다(100만 × 2 × 100바이트, 계산). 요청 하나하나의 시각을 모두 저장하는 슬라이딩 로그는 사용자마다 한도만큼의 시각을 두므로 같은 조건에서 600배(1분 한도 600건)가 됩니다(계산).
4. 리전 사이 왕복: 리전 간 네트워크 왕복을 100ms 로 가정합니다(가정). 요청마다 다른 리전의 중앙 저장소에 물으면 그만큼이 지연에 더해집니다. 이 값은 출처가 없으므로 본문에서 가정으로 밝힙니다.
5. 고정 창의 경계 몰림: 1분 창에서 한 창의 마지막 1초에 600건, 다음 창의 첫 1초에 600건을 보내면 2초 사이에 1,200건이 통과합니다(계산). 한도의 2배입니다.

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 세는 법 — 고정 창 · 슬라이딩 로그 · 슬라이딩 윈도 근사 · 토큰 버킷 · 누수 버킷

- **고정 창**: 창마다 카운터 하나. Cloudflare 는 이 방식의 문제를 「the counter will be arbitrarily reset at regular intervals」로 적었습니다(L2). 경계 몰림은 3절 5번의 계산입니다.
- **슬라이딩 로그**: 요청 시각을 모두 저장. Cloudflare 는 「This is more accurate, but has huge processing and memory requirements.」로 적었습니다(L2). 「sliding log」라는 이름은 그 글에 없습니다.
- **슬라이딩 윈도 근사**: 이전 창의 개수에 이전 창이 지금 창과 겹치는 비율을 곱해 현재 창 개수에 더합니다. Cloudflare 의 예시는 이전 1분에 42건, 현재 1분에 18건, 현재 분이 15초 지났을 때 `rate = 42 * ((60-15)/60) + 18 = 49.5 requests` 입니다(L2). 이 방식은 「assumes a constant rate of requests during the previous sampling period」(L2), 곧 이전 창 안에서 요청이 고르게 왔다고 가정합니다. 정확도는 4억 건 · 27만 출처를 분석한 결과 「0.003% of requests have been wrongly allowed or rate limited」, 실제 비율과의 평균 차이 6%, 한도를 조금 넘었는데 허용된 출처 3곳(실제 비율이 한도보다 15% 미만 높음)입니다(L2). 0.003% 는 잘못 허용된 것과 잘못 제한된 것을 합친 값입니다.
- **토큰 버킷**: Stripe 는 「We use the token bucket algorithm to do rate limiting.」, 사용자마다 버킷이 있고 요청마다 토큰을 하나 빼며 버킷이 비면 거절한다고 적었습니다(L1). Envoy 의 로컬 처리율 제한 필터도 토큰 버킷이고, 기본은 Envoy 프로세스마다 따로 셉니다(L14, 「By default the rate limits are applied per Envoy process.」, 요약기 경유).
- **누수 버킷**: Shopify 는 「Most Shopify rate limits are enforced with a leaky bucket algorithm.」(L20, 요약기 경유). Cloudflare 는 누수 버킷을 버린 이유로 매개변수 둘(평균 속도 · 몰림 크기)을 맞추기 어렵고, 원자적으로 할 수 없는 연산 여럿이 필요하다고 적었습니다(L2).

### 4-2. 원자성과 만료 — Redis 에서 「확인하고 늘리기」를 한 번에

- Redis `INCR` 문서에는 처리율 제한 패턴이 두 가지 있습니다(L4). 첫째는 IP 와 초를 합친 키에 `MULTI`/`EXEC` 로 `INCR` 와 `EXPIRE` 를 함께 보내는 방식이고, 둘째는 카운터 하나를 쓰는 방식입니다. 문서는 둘째에 대해 「In the above code there is a race condition」라고 쓰고, `INCR` 뒤에 `EXPIRE` 가 실행되지 않으면 키가 남는다고 설명합니다. 해법으로 `INCR` 와 조건부 `EXPIRE` 를 Lua 스크립트로 묶어 `EVAL` 로 보내라고 합니다. 예제의 한도(IP 당 초당 10건)는 예제 값입니다.
- Lua 스크립트의 원자성: 「Redis guarantees the script's atomic execution.」, 실행 중에는 서버의 다른 작업이 모두 막힙니다(L6). 이 보장은 Redis 서버 한 대 안의 것입니다. 스크립트가 접근하는 키는 모두 키 인자로 넘겨야 하고(L5), 그래야 클러스터에서도 올바르게 실행됩니다. 스크립트 캐시는 「always volatile」이라 재시작 · 장애 조치 뒤 `EVALSHA` 가 `NOSCRIPT` 를 낼 수 있습니다(L6). 파일럿 2 노트에도 같은 내용이 있습니다.
- `EXPIRE`: `INCR` 같은 값 변경은 TTL 을 건드리지 않습니다(L7 「…are all operations that will leave the timeout untouched.」). 만료는 접근할 때와 주기적 무작위 표본 검사 두 방식이고, **복제본은 스스로 만료시키지 않고 주 노드가 보내는 `DEL` 을 기다립니다**(L7 「the replicas connected to a master will not expire keys independently」).
- GitHub 는 바로 이 성질 때문에 문제를 겪었습니다(L3). 확인 단계를 복제본에서 읽었더니 복제본이 지난 창의 정보를 돌려줘 요청이 거절됐고, 이어진 증가 단계는 주 노드에서 새 창을 열었습니다. 그래서 클라이언트는 「X-RateLimit-Remaining: 5000」이 붙은 거절을 받았습니다. 고친 방법은 애플리케이션이 만료를 직접 관리해 복제본의 낡은 값을 무시하는 것입니다(「The application should be prepared to read stale data from replicas, then ignore it.」). 이 글은 「replication lag」라는 말을 쓰지 않습니다.
- GitHub 의 다른 문제는 초기화 시각이 요청마다 1초씩 흔들린 것(「wobble」)입니다. Redis 의 TTL 을 읽어 Ruby 의 현재 시각에 더한 것이 원인이었고, 「reset at」 시각을 애플리케이션이 저장하고 키의 TTL 은 그보다 1초 뒤로 두어 고쳤습니다(L3).

### 4-3. 어디서 세는가 — 중앙 · 데이터센터별 · 로컬 + 동기화

- **중앙(요청마다 저장소 왕복)**: Stripe 는 「We implement our rate limiters using Redis.」(L1). GitHub 는 애플리케이션이 키마다 Redis 클러스터를 고르는 샤딩(「Shard inside the application」), 클러스터마다 쓰기용 주 노드 하나와 읽기용 복제본 여럿, 원자성을 위한 Lua 를 제안했고(L3 「The proposed solution」 절), 최종 스크립트를 Lua 로 실었습니다(「The final scripts」 절). 이전 저장소는 다른 캐시와 함께 쓰던 Memcached 였고, 아직 쓰이는 처리율 데이터가 캐시에서 지워져 클라이언트가 받으면 안 되는 새 창을 받은 일이 있었습니다(L3). Envoy 의 전역 처리율 제한은 Envoy 가 외부 gRPC 서비스를 부르는 방식이고, 참조 구현은 Go 와 Redis 입니다(L14). 이 서비스는 「in production use at Lyft for over 2 years」라고 README 가 적습니다(L14).
- **데이터센터(PoP)별**: Cloudflare 는 PoP 마다 Twemproxy 클러스터를 두고 Twemcache(Memcached 포크)에 셉니다(L2 「we can actually create an isolated counting system inside each PoP」). 근거는 「All the traffic going to our edge servers is anycast traffic.」입니다. 증가는 요청을 늦추지 않으려고 비동기로 하고, 요청 처리 중에는 「완화 시작」 표시 하나만 확인합니다(L2). Cloudflare 의 `INCR` · `GET` 은 Memcached 명령이므로 본문에서 Redis 명령처럼 쓰지 않습니다.
- **로컬 + 동기화**:
  - LaunchDarkly 의 Floodgate 는 요청 처리 중에 중앙 저장소와 통신하지 않고, 「we periodically synchronize a node count, and an overall count from centralized storage」(L17). 동기화 주기는 글에 없고 「periodically」뿐입니다.
  - Monzo 는 각 클라이언트가 메모리 안의 제한기로 자기 몫을 집행하고, 몫(총량을 클라이언트 수로 나눈 값)과 리스를 주기적으로 받아 옵니다(L18, 요약기 경유). 예시 값(총 100을 넷으로 나눠 25, 리스 5분, 폴링 10초)은 설명용입니다.
  - Uber GRL 은 로컬 토큰 버킷을 버리고(「fully deprecated the token-bucket mechanism in favor of a control plane driven probabilistic dropping model」), 집계기와 컨트롤러가 내려보내는 버림 비율로 판단합니다(L16). 이유는 토큰 버킷이 용량을 공정하게 나누지 못하고, 몰림이 있는 호스트가 너무 일찍 버리기 시작했기 때문입니다(L16, 요약기 경유). 집행은 「can lag by up to 2 to 3 seconds」입니다(L16).
  - LINE 은 소비자 쪽(내부 서비스로 보내는 요청) 제한기를 고정 창으로 만들고, 공급자의 총 한도를 소비자 인스턴스 수로 나눠 각자에게 배정했습니다(L15). 중앙 Redis 방식의 단점으로 「having a single node handling all rate limiter counting becomes a single point of failure」를 들었습니다(L15). 이 글은 API 를 받는 쪽이 아니라 보내는 쪽 제한기라는 점을 본문에서 구분합니다.
- Envoy 문서는 로컬 제한을 전역 제한과 함께 써서 전역 서비스의 부하를 줄일 수 있다고 적습니다(L14 「Local rate limiting can be used in conjunction with global rate limiting…」, 요약기 경유, 동사 can).

### 4-4. 응답 형식 — 429 · Retry-After · 남은 양 헤더

- 429 는 캐시에 저장하면 안 됩니다(L8 「MUST NOT be stored by a cache」). Retry-After 는 HTTP 날짜나 정수 초입니다(L9, `delay-seconds = 1*DIGIT`, 요약기 경유).
- 서비스마다 헤더가 다릅니다. GitHub 는 `x-ratelimit-limit` · `-remaining` · `-used` · `-reset` · `-resource`(L11), Discord 는 `X-RateLimit-*` 에 소수 초인 `Reset-After` 를 더하고(L13), Shopify REST 는 `X-Shopify-Shop-Api-Call-Limit` 와 `Retry-After: 2.0` 예시를 둡니다(L12). Shopify 의 `2.0` 은 RFC 9110 의 정수 초 형식과 다릅니다(판단, 형식 비교).
- GitHub 는 한도를 넘으면 「a `403` or `429` response」를 돌려준다고 적습니다(L11). 「GitHub 는 429 를 쓴다」로 단정하지 않습니다.
- 표준화 중인 헤더: IETF httpapi 작업반 초안 `draft-ietf-httpapi-ratelimit-headers` 최신 판은 -11(2026-05-23)이고, `RateLimit-Policy` 와 `RateLimit` 두 필드를 정의합니다(L10, 요약기 경유). 아직 RFC 가 아니고, 만료일은 2026-11-24 입니다. 본문에서 쓰려면 집필 날 판 번호를 다시 확인합니다. 초안은 클라이언트가 남은 양을 「service level agreement」로 여기면 안 된다고 적습니다(L10).

### 4-5. 고장 났을 때 — 열어 두기와 닫아 두기

- Stripe: 「Make sure that if there were bugs in the rate limiting code (or if Redis were to go down), requests wouldn't be affected.」, 모든 층에서 예외를 잡아 「fail open」하라는 권고입니다(L1). 동사는 권고(Make sure)이고, Stripe 구현이 실제로 그렇게 동작한다는 결과 문장은 확인하지 못했습니다.
- Envoy: Redis 장애 시 「Envoy then applies its failure mode right away (allow by default, or deny with `failure_mode_deny`)」(L14, 요약기 경유 — README 원문이 길어 글자 그대로는 확인하지 못함). `failure_mode_deny` 가 참이면 호출 실패 때 500 을 돌려준다고 필터 문서가 적습니다(요약기 경유).
- Uber: 「If the control plane became unavailable, clients failed open, allowing traffic to continue rather than risk self-inflicted outages.」(L16).
- LaunchDarkly: 중앙 제한기를 두고 「It fails dangerously: when Redis is unavailable and we cannot check the rates, all traffic is allowed.」(L17). Floodgate 는 「approximate and fails safe」라고만 적고 그 뜻(허용인지 거절인지)은 글에 없습니다(L17). 본문에서 「안전하게 닫는다」로 옮기지 않습니다.
- 정리(판단): 공개 사례는 대부분 열어 둡니다. 열어 두면 제한기가 고장 난 동안 한도가 지켜지지 않고, 닫아 두면 제한기 고장이 API 고장이 됩니다. 시나리오 3 이 이 맞바꿈을 보입니다.

### 4-6. 도입 방법

- Stripe 는 새 제한기를 「Dark launch」해 막을 트래픽을 먼저 관찰하고, 잘못 작동할 때 끌 수 있는 kill switch 를 두라고 권합니다(L1).
- GitHub 는 기능 플래그로 새 저장소를 쓰는 클라이언트 비율을 점점 늘렸고, 배포 없이 비율을 바꿀 수 있어 문제가 생기면 옛 구현으로 바로 되돌릴 수 있었다고 적습니다(L3).

## 5. 시나리오 절에 쓸 반례와 장애

시나리오 셋(기본 · 부하 · 장애)에 넣을 수 있는 상황입니다. 모두 가상 시계와 사건 순서로 재현할 수 있습니다(판단, S2 집필 전 확인과 같은 방식).

1. **기본 — 한도 안의 요청과 한도를 넘는 요청**: 사용자 하나가 1분 한도 600건 안에서 보내면 모두 통과하고 남은 양이 헤더로 나갑니다. 601번째에서 429 와 Retry-After 가 나갑니다.
2. **부하 — 고정 창의 경계 몰림**: 3절 5번 계산처럼 창 경계 2초에 1,200건이 고정 창은 모두 통과하고, 슬라이딩 윈도 근사는 한도 근처에서 거절합니다. 두 방식을 한 실행에서 나란히 보일 수 있습니다(파일럿 2 의 「확인 뒤 차감 대 원자 판정」과 같은 꼴, 판단).
3. **부하 — 여러 리전으로 들어오는 한 사용자**: 리전 셋이 각자 600건 한도로 세면 한 사용자가 1분에 1,800건까지 통과합니다(계산). 리전마다 한도를 셋으로 나눠 배정하면 몰린 리전에서 일찍 거절됩니다. 이 맞바꿈이 LINE 글이 스스로 적은 한계(인스턴스 사이 부하가 고르지 않으면 재분배가 필요)와 같습니다(L15, 영어판 대조 안 함).
4. **장애 — 리전 Redis 가 응답하지 않음**: 열어 두면 그동안 한도가 지켜지지 않고(LaunchDarkly 의 「fails dangerously」), 닫아 두면 API 가 모두 거절합니다. 로컬 토큰 버킷으로 내려가면 서버 수만큼의 한도가 통과합니다(계산, 서버 수 가정).
5. **장애 — 복제본의 낡은 만료**: GitHub 의 「남은 양 5000 인데 거절」 버그(L3)를 그대로 재현할 수 있습니다. 확인을 복제본에서, 증가를 주 노드에서 하면 생깁니다.
6. **반례 — `INCR` 와 `EXPIRE` 를 따로 보냄**: 사이에서 실패하면 TTL 없는 키가 남습니다(L4).

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 세는 곳 | 판정 비용 | 정확도 | 고장 났을 때 | 근거 |
| --- | --- | --- | --- | --- | --- |
| A. 중앙 Redis · 고정 창 `INCR` | 전 세계 한 곳 | 요청마다 리전 간 왕복(가정 100ms) | 경계에서 최대 2배 | 열거나 닫아야 함 | L4 |
| B. 중앙 Redis · 토큰 버킷(Lua) | 전 세계 한 곳 | 같음 | 높음 | 같음 | L1 · L3 |
| C. 리전별 Redis · 슬라이딩 윈도 근사(Lua), 리전마다 한도를 나눔 | 리전 | 리전 안 왕복 한 번 | 근사 오차(L2 의 0.003%), 리전 사이 몫이 고르지 않을 때 일찍 거절 | 로컬 토큰 버킷으로 내려가 열어 둠 | L2 · L14 · L15 |
| D. 로컬 토큰 버킷 + 주기 동기화 | 서버 | 왕복 없음 | 동기화 사이 오차 | 마지막 몫으로 계속 | L17 · L18 |
| E. 확률적 버림(컨트롤 플레인) | 서버 + 집계기 | 왕복 없음 | 최대 2~3초 늦음 | 열어 둠 | L16 |

- **전환점(판단)**: 리전이 하나뿐이면 A · B 가 가장 단순합니다. 리전이 여럿이고 리전 간 왕복이 요청 지연 예산을 넘으면 C 로 갑니다. 요청 규모가 리전 Redis 한 노드로 감당하지 못할 만큼 커지면 GitHub 처럼 키로 샤딩하거나, 왕복 자체를 없애는 D · E 로 갑니다. Uber 는 초당 약 8,000만 건 · 서비스 1,100개 이상 규모에서 E 를 씁니다(L16).
- 버린 이유에 쓸 근거: A 의 경계 몰림(3절 5번), 중앙 방식의 단일 장애 지점(L15), D 의 동기화 사이 drift(L17 「node counts and overall counts may drift between polls」, 요약기 경유), E 의 집행 지연(L16).

## 7. 실제 사례 절에 쓸 대응표

| 회사 | 무엇을 했나 | 이 가이드의 어느 자리 | 출처 |
| --- | --- | --- | --- |
| Stripe | 토큰 버킷 요청 제한기 · 동시 요청 제한기 · 부하 차단기 둘, Redis, 열어 두기 권고, 다크 런치 | 세는 법 · 고장 났을 때 · 도입 | L1 |
| Cloudflare | PoP 별 슬라이딩 윈도 근사, Twemcache, 비동기 증가, 오차 0.003% | 세는 법 · 어디서 세는가 | L2 |
| GitHub | 애플리케이션 샤딩 Redis, 주 노드 · 복제본, Lua, 복제본 만료 버그와 「reset at」 저장 | 원자성과 만료 · 시나리오 5 | L3 |
| Lyft · Envoy | Go/gRPC 전역 제한 서비스, Redis, 기본 허용, 로컬 제한과 병용 | 어디서 세는가 · 고장 났을 때 | L14 |
| Uber | 토큰 버킷을 버리고 확률적 버림, 2~3초 지연, 열어 두기 | 대안 E · 전환점 | L16 |
| LaunchDarkly | 중앙 Redis 제한기(「fails dangerously」)에서 Floodgate(로컬 + 주기 동기화)로 | 대안 D · 고장 났을 때 | L17 |
| Monzo | 클라이언트별 몫과 리스, 안전 용량으로 되돌림 | 대안 D | L18 |
| LINE | 소비자 쪽 고정 창 제한기, 인스턴스별 한도 분할, 초당 30만 건 이상 목표 | 리전별 한도 분할 | L15 |
| 토스페이먼츠 | 비정상적으로 많거나 반복되는 요청에 429 를 돌려 남용을 막음 | 요구사항의 동기(구조 설명 없음) | L19 |

- 한국 회사의 서버 쪽 API 처리율 제한 설계 글(알고리즘 · 저장소 · 고장 처리까지)은 이번 조사에서 찾지 못했습니다. LINE(L15)은 소비자 쪽, 토스증권(해외주식 서비스 안정화 글)은 외부 브로커로 보내는 주문 TPS 제어라 이 가이드의 문제와 다릅니다.
- Cloudflare 의 「several billion requests per day」와 「400,000 requests per second to a single domain」(L2)은 그 시점(2017)의 값입니다. Stripe 의 「12,000 requests this month」(동시 요청 제한기 작동) · 「Only 100 requests were rejected this month」(워커 활용 부하 차단기)도 2017-03 기준이고, 예시 설정(동시 20개, 예약 20%)은 실제 운영값이 아닙니다(L1).

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 파일럿 2 · 집필 전 확인과 같은 틀입니다.
- Redis 는 메모리 대역(`Map` + 가상 시각 기준 만료)으로 두고, Lua 스크립트는 「대역 안에서 한 번에 실행되는 함수 하나」로 표현합니다. 원자성은 사건 순서로 보입니다 — 두 요청의 「확인」과 「증가」 사이에 다른 요청이 끼어드는 경우를 사건으로 넣습니다.
- 슬라이딩 윈도 근사 계산은 L2 의 49.5 예시를 출력 한 줄로 재현해 독자가 원문과 맞춰 볼 수 있게 합니다(판단).
- 고정할 출력 후보: 고정 창과 근사의 경계 몰림 통과 수, 리전 셋 따로 세기의 통과 수(1,800 대 600 안팎), 열어 두기 · 닫아 두기 · 로컬 내려가기의 통과 · 거절 수, 복제본 버그의 「remaining 600 인데 거절」 한 줄.
- 세 언어 출력의 글자 단위 일치를 위해 비율 계산은 정수 연산(밀리초 × 건수)으로 하고, 소수가 필요한 출력은 고정 자릿수로 찍습니다(명세 SD26 결정성 규칙).

## 9. 미해결 질문

1. Envoy README 의 고장 모드 문장(「allow by default, or deny with `failure_mode_deny`」)은 요약기 경유입니다. README 가 길어 글자 그대로 확인하지 못했습니다. 본문에 인용하려면 필터 문서에서 다시 확인합니다.
2. IETF 초안 -11 이 만료(2026-11-24)되거나 -12 가 나왔는지는 집필 날 확인합니다. 옛 세 필드(`RateLimit-Limit` · `-Remaining` · `-Reset`)가 어느 판에서 두 필드로 바뀌었는지는 확인 안 함입니다.
3. Cloudflare 정확도 분석의 조건(기간 · 규칙)과 「잘못 차단은 없었다」는 문장은 확인 안 함입니다.
4. Stripe 글의 「가장 중요한 제한기」 표현 · 플릿 부하 차단기의 Redis 사용 · 시험 모드 요청부터 줄이는 순서는 직접 인용을 받지 못했습니다.
5. LaunchDarkly Floodgate 의 「fails safe」가 허용인지 거절인지는 글에 없습니다.
6. RFC 9110 의 Retry-After 절과 Shopify GraphQL 비용 한도(요금제별 초당 포인트 100 · 200 · 1000 · 2000, 단일 쿼리 1,000포인트)는 요약기 경유입니다. Shopify 문서 안에서 `throttleStatus` 예시(`maximumAvailable: 1000.0`, `restoreRate: 50.0`)가 요금제 표와 다른 값이라 둘 다 쓰지 않는 것이 안전합니다.
7. 리전 간 왕복 100ms 는 가정입니다. 출처를 찾으면 그 값으로 바꿉니다.
8. Uber 글은 규모를 도입부에서 「hundreds of millions of RPCs … per second across thousands of services」, 본문에서 「around 80 million requests per second across more than 1,100 services」로 다르게 적습니다(L16). 범위가 다른지 글이 밝히지 않으므로, 쓸 때는 본문 쪽 값을 그 문장의 자리(「Improved Reliability and Incident Response」 절)와 함께 씁니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-16 입니다. 「글자 그대로」는 원문 문장을 다시 받아 문자열을 맞춘 것이고, 「요약기 경유」는 페이지를 읽은 도구의 요약 안에 따옴표로 들어 있던 문장이라 글자 단위 일치를 확인하지 못한 것입니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 같은 글 안의 다른 값 · 대상 · 동사 |
| --- | --- | --- | --- |
| L1 Stripe | 글자 그대로(본문 두 번 열람) | 토큰 버킷 · 사용자별 버킷 · 「We implement our rate limiters using Redis.」 · 열어 두기 권고 · 이번 달 수치 | 열어 두기는 권고(Make sure), 결과 아님. 20개 · 20% 는 예시. ElastiCache 는 선택지 제시이지 Stripe 가 쓴다는 말 아님 |
| L2 Cloudflare | 글자 그대로(두 번 열람) | 근사 공식과 49.5 · 0.003% · 6% · 3곳 · 카운터당 숫자 둘 · PoP 별 계산 · 애니캐스트 · 비동기 증가 | 페이지 제목은 「How we built rate limiting capable of scaling to millions of domains」(URL 은 counting-things…). 「millions of domains」는 문제 크기 설명이지 운영 수치 아님. 저장소는 Memcached 계열 |
| L3 GitHub | 글자 그대로(두 번째 열람에서 확인) | 이전 Memcached 문제 · 애플리케이션 샤딩 · 주 노드 쓰기 / 복제본 읽기 · Lua · wobble · 「reset at」 저장과 TTL +1초 · 복제본 버그와 고친 방법 · 기능 플래그 도입 | 샤딩 · 주 노드 / 복제본 · Lua 는 「proposed solution」 절의 문장이고, Lua 는 「final scripts」 절이 결과로 확인. 처리량 · 지연 · 클러스터 수는 글에 없음. 게시 2021-04-05, 갱신 2023-03-23 |
| L4~L7 Redis 문서 | 글자 그대로 | 두 패턴과 경쟁 상태 · Lua 원자성 · 키 인자 · 캐시 휘발성 · TTL 유지 · 복제본 만료 | 예제 한도(초당 10건)는 예제 값. 원자성은 서버 한 대 안. `INCR` 문서 원문에 「used of」 오타가 있음(인용하면 그대로 둠) |
| L8 RFC 6585 | 글자 그대로 | 429 정의 · Retry-After MAY · 세는 법 정의 안 함 · 캐시 금지 | — |
| L9 RFC 9110 | 요약기 경유 | Retry-After 형식(HTTP 날짜 / 정수 초) | 10.2.3절 일부 구간만 열람 |
| L10 IETF 초안 -11 | 요약기 경유 | 필드 이름 둘 · 초안 상태 · 판 날짜 | 만료 2026-11-24, 집필 날 재확인 |
| L11 GitHub REST 문서 | 글자 그대로 | 60 · 5,000 /시간 · 「a `403` or `429` response」 | 날짜 표시 없음 |
| L12 Shopify REST 문서 | 글자 그대로 | 40건 · 초당 2건 · Plus 10배 · 429 와 Retry-After · `Retry-After: 2.0` 예시 | REST Admin API 는 2024-10-01 부터 legacy. 날짜 표시 없음 |
| L13 Discord 문서 | 글자 그대로 | 초당 50건 · 10분 10,000건 | 날짜 표시 없음 |
| L14 Envoy | 일부 글자 그대로(Lyft 운영 2년), 나머지 요약기 경유 | Lyft 운영 · Redis · 기본 허용 · 로컬과 병용 | 고장 모드 문장 · 「uses Redis as its caching layer」는 요약기 경유(원문 개요는 「talks to the Redis cache」) |
| L15 LINE | 글자 그대로(영어판) | 30만 건 목표 · 고정 창 · 단일 장애 지점 문장 | 소비자 쪽 제한기. 한국어판 게시일(2020-06-17로 보고됨)은 확인 안 함, 영어판 2020-05-14 |
| L16 Uber | 글자 그대로 | 8,000만 건 · 1,100개 이상 · 2~3초 · 열어 두기 · 토큰 버킷 폐기 | 도입부 「hundreds of millions … thousands of services」와 다름(9절 8번) |
| L17 LaunchDarkly | 글자 그대로 | 「It fails dangerously…」 · Floodgate 주기 동기화 | 「fails safe」의 뜻은 글에 없음. 동기화 주기 없음 |
| L18 Monzo | 요약기 경유 | 클라이언트별 몫 · 리스 · 안전 용량 | 예시 값(25 · 5분 · 10초)은 설명용 |
| L19 토스페이먼츠 | 요약기 경유 | 429 로 남용 차단 | 구조 설명 없음 |
| L20 Shopify 한도 개요 · GraphQL | 요약기 경유 | 누수 버킷 · 비용 기반 한도 | 같은 사이트 안에서 버킷 예시 값이 요금제 표와 다름(9절 6번) |

## 11. 출처

조회일은 모두 2026-11-16 입니다.

- L1. [Stripe — Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters) — 2017-03-30
- L2. [Cloudflare — How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/) — 2017-06-07
- L3. [GitHub — How we scaled the GitHub API with a sharded, replicated rate limiter in Redis](https://github.blog/engineering/infrastructure/how-we-scaled-github-api-sharded-replicated-rate-limiter-redis/) — 2021-04-05(갱신 2023-03-23)
- L4. [Redis — INCR (Pattern: rate limiter)](https://redis.io/docs/latest/commands/incr/) — 게시일 확인 안 함
- L5. [Redis — EVAL](https://redis.io/docs/latest/commands/eval/) — 게시일 확인 안 함
- L6. [Redis — Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/) — 게시일 확인 안 함
- L7. [Redis — EXPIRE](https://redis.io/docs/latest/commands/expire/) — 게시일 확인 안 함
- L8. [RFC 6585 — Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585.html) — 2012-04
- L9. [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) — 2022-06
- L10. [draft-ietf-httpapi-ratelimit-headers-11](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers-11) — 2026-05-23(초안, 만료 2026-11-24)
- L11. [GitHub Docs — Rate limits for the REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) — 게시일 확인 안 함
- L12. [Shopify — REST Admin API reference](https://shopify.dev/docs/api/admin-rest) — 게시일 확인 안 함(API 버전 2026-10 표시)
- L13. [Discord — Rate Limits](https://docs.discord.com/developers/topics/rate-limits) — 게시일 확인 안 함
- L14. [envoyproxy/ratelimit README](https://github.com/envoyproxy/ratelimit) · [Envoy — Global rate limiting](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting) · [Envoy — Local rate limit filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/local_rate_limit_filter) — 게시일 확인 안 함
- L15. [LINE — High-throughput distributed rate limiter](https://engineering.linecorp.com/en/blog/high-throughput-distributed-rate-limiter/) — 2020-05-14
- L16. [Uber — Uber's Rate Limiting System](https://www.uber.com/en-GB/blog/ubers-rate-limiting-system/) — 2026-02-12
- L17. [LaunchDarkly — A tale of three rate limiters](https://launchdarkly.com/docs/blog/rate-limiters) — 2025-08-27
- L18. [Monzo — Enabling horizontal autoscaling with co-operative distributed rate limiting](https://monzo.com/blog/enabling-horizontal-autoscaling-with-co-operative-distributed-rate-limiting) — 2024-09-30
- L19. [토스페이먼츠 — 토스페이먼츠의 Open API 생태계](https://toss.tech/article/42679) — 2025-11-28
- L20. [Shopify — API rate limits](https://shopify.dev/docs/api/usage/rate-limits) · [Shopify — GraphQL Admin API rate limits](https://shopify.dev/docs/apps/build/apis/graphql-admin/rate-limits) — 게시일 확인 안 함

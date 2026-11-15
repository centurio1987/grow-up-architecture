# 리서치 노트 — 라이브 동시 시청자 수를 모든 시청자 화면에 실시간으로 보여 주기

- 조사일: 2026-11-13. 아래 웹 출처의 조회일은 모두 이 날짜입니다. 게시일은 출처 목록에 따로 적었습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md)의 파일럿 1 편 집필 입력입니다. 집필자가 같은 자료를 다시 찾지 않도록 주장과 출처를 짝지어 두었습니다.
- 표기: 「(계산)」은 출처의 수치로 이 노트가 계산한 값이고, 「(판단)」은 출처로 확정된 사실이 아니라 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 한계: 웹 페이지는 대부분 요약 도구로 읽었습니다. 원문을 직접 읽은 것은 Bladerunner 논문(V6)의 1~4쪽뿐입니다. 본문에 수치를 인용하기 전에 원문과 한 번 대조합니다.

## 1. 이 노트의 결론

시청자 수는 **같은 방송을 보는 모든 사람에게 같은 값 하나**입니다. 그래서 입장·이탈이 생길 때마다 그 사건을 모든 시청자에게 보내지 않고, 서버에서 값을 모아 **정해진 주기로 한 번씩** 보내는 것이 공개 사례들의 공통 해법입니다(V16 · V6 · V19).

"지연 없이"는 두 가지 지연으로 나눠 수치를 정해야 합니다. 입장·이탈이 숫자에 반영되기까지의 측정 지연과, 바뀐 숫자가 화면에 닿기까지의 전달 지연입니다.
정확한 수를 약속하는 공개 사례는 찾지 못했습니다. 오히려 정확도를 보장하지 않는다고 밝힌 자료가 있습니다(V21 · V11). 가이드는 허용 오차를 요구사항에 숫자로 적는 쪽이 근거에 맞습니다.

## 2. 요구사항 절에 쓸 근거 — "지연 없이"를 숫자로

| 지연의 종류 | 공개된 값 | 출처 |
| --- | --- | --- |
| 측정 지연(입장) | 재생 시작 후 15초 이내에 집계에 나타남 | AWS IVS `viewerCount` 정의(V18) |
| 측정 지연(이탈) | 재생 종료 후 1분 이내에 집계에서 빠짐 | AWS IVS(V18) |
| 측정 지연(이탈) | 하트비트 예시 30초, 1분 넘게 끊기면 오프라인 | LinkedIn 실시간 플랫폼(V4) |
| 전달 지연 | 상태 변화의 종단 간 전달 p99 200ms 미만 | LinkedIn presence(V1) |
| 전달 지연 | 디스패처에서 클라이언트까지 p90 약 75ms | LinkedIn 라이브 반응(V2) |
| 전달 주기 | 연결당 초당 1건으로 설계 | Hotstar PubSub(V16) |
| 전달 주기 | 시청자당 초당 최대 1건으로 제한 | Facebook Bladerunner(V6) |

- AWS IVS 가 입장(15초)과 이탈(1분)의 허용 지연을 다르게 둔 것은 설계 힌트입니다. 이탈은 하트비트가 끊긴 것을 보고 추론하기 때문에 입장보다 늦을 수밖에 없습니다(판단).
- 사람이 느끼는 응답 시간의 한계로 0.1초 · 1초 · 10초가 자주 인용됩니다(V35). 이것은 조작에 대한 응답 시간 기준이지 숫자 갱신 주기의 기준이 아닙니다. "시청자 수가 몇 초 안에 바뀌면 지연이 없다고 느끼는가"를 다룬 연구는 찾지 못했습니다(확인 안 함). 그래서 갱신 주기는 지각 연구가 아니라 부하와 체감의 균형으로 고른 값이라고 적는 편이 정직합니다.
- Twitch API 의 시청자 수가 캐시 때문에 몇 분씩 늦는다는 말은 역할을 알 수 없는 개발자 포럼 사용자의 증언뿐입니다(V13). 공식 설명은 없습니다.

## 3. 규모 추정 절에 쓸 계산

아래 계산은 가이드의 규모 추정 절과 시나리오 2(부하가 몰릴 때)의 재료입니다.

- (계산) 시청자 V 명이 차례로 들어와 V 명이 될 때, 입장마다 전원에게 방송하면 보내는 메시지는 약 V²/2 건입니다. V = 100만이면 약 5×10¹¹ 건입니다.
- (계산) Hotstar 슬라이드의 동시 접속 증가율 "분당 50만"(V15)은 초당 약 8,300 명 입장입니다. 시청자 1,000만 명에게 입장마다 방송하면 초당 약 8.3×10¹⁰ 건이 됩니다. 1초 주기로 값 하나를 보내면 초당 1,000만 건이고, 이 수는 입장 속도와 상관이 없습니다.
- (계산) 시청자 1,000만 명이 30초마다 하트비트를 보내면 평균 초당 약 33만 건의 쓰기가 생깁니다. Redis 공식 벤치마크의 파이프라인 없는 단일 인스턴스 예시(SET 초당 약 18만 안팎, V29)를 넘습니다. 벤치마크 조건이 제각각이라 이 값을 한도로 쓰면 안 되지만, 방송 하나라도 키를 나눠야 한다는 근거로는 쓸 수 있습니다.
- (계산) LinkedIn 은 프런트엔드 1대가 연결 약 10만 개를 맡았고(V2 · V5), 최고 시청자 1,800만 명 행사에 프런트엔드 약 180대를 추정했습니다(V2).
- LinkedIn presence 노드 하나는 약 1.8K QPS 를 처리했습니다(V1).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. "지금 보고 있다"를 판정하는 법 — 하트비트와 만료

- LinkedIn 은 지속 연결이 열려 있으면 온라인으로 봅니다(V1). 플랫폼이 d초마다 하트비트를 보내고, 서비스는 분산 키-값 저장소에 d+ε초 만료로 항목을 씁니다. 멤버마다 d+2ε초 뒤에 울리는 지연 타이머가 있고 하트비트가 오면 다시 맞춥니다. 타이머가 울렸을 때 항목이 만료돼 있으면 오프라인으로 판정합니다(V1).
- 연결이 끊긴 것을 직접 감지하지 않고 하트비트가 없다는 사실에서 추론하기 때문에, d 안에 다시 연결하면 온라인이 유지돼 상태가 깜빡이지 않습니다(V1 · V4). d 가 작으면 부하가 늘고 크면 이탈 감지가 늦어지는 맞바꿈입니다(V1). 실제 d · ε 값은 공개하지 않았습니다.
- PubNub 은 연결이 끊기면 기본적으로 leave 가 아니라 timeout 이벤트를 냅니다. presence 만료 기본값은 300초입니다(V19).
- 브라우저 쪽 함정이 있습니다. Chrome 88(2021-01)부터 백그라운드 탭의 타이머는 초당 1회로 제한되고, 5분 넘게 숨겨진 탭은 조건에 따라 분당 1회까지 줄어듭니다(V36). 클라이언트의 `setInterval` 하트비트에 기대면 하트비트가 최대 1분 가까이 밀릴 수 있으니 만료 시간을 넉넉히 잡거나 서버가 연결 상태를 직접 봐야 합니다(판단).
- 부하 분산기의 유휴 타임아웃도 걸립니다. AWS ALB 는 유휴 연결을 기본 60초에 끊습니다(V37). SSE 연결을 살려 두는 주석 줄(`:`)은 그보다 짧은 주기로 보내야 합니다(V32 · V9).

### 4-2. 세는 법 — 저장소와 자료구조

- **Redis 정렬 집합**: 점수에 마지막 하트비트 시각을 넣고 `ZREMRANGEBYSCORE` 로 오래된 멤버를 지운 뒤 개수를 셉니다(V28, 복잡도 O(log N + M)). 집합 키 하나에 TTL 을 걸면 멤버마다 만료되지 않는다는 점이 함정입니다(V27). 한 튜토리얼(V39)이 바로 그 실수를 합니다. 이 튜토리얼은 반례로만 인용하고 코드는 가져오지 않습니다.
- **Redis 만료의 정밀도**: 키는 접근할 때와 주기적인 표본 검사 때 만료되고, 오차는 Redis 2.6부터 0~1ms 입니다(V27).
- **샤딩 카운터**: Firestore 문서는 카운터 하나를 여러 샤드로 나누면 쓰기 처리량이 샤드 수에 비례해 늘고, 대신 읽기 비용도 샤드 수만큼 는다고 설명합니다(V30). Redis 에 같은 원리를 적용하는 것은 판단입니다.
- **HyperLogLog**: Redis 구현은 표준 오차 0.81%, 최대 12KB 입니다(V24 · V25). 요소를 저장하지 않고 상태만 가지므로 빼기가 안 됩니다(V24 설명에서의 추론, 판단). "현재 보고 있는 사람"을 세려면 짧은 시간 구간마다 HLL 을 두고 최근 몇 구간을 `PFMERGE` 로 합칩니다(판단). 같은 사용자 ID 를 넣으면 여러 탭·재접속이 한 사람으로 묶이는 장점이 있습니다(판단).
- **스트림 처리**: Flink 는 텀블링 · 슬라이딩 · 세션 윈도를 제공하고, 늦게 온 요소는 허용 지연 기본값 0 이라 버려집니다(V31). 세션 윈도는 활동이 끊긴 간격으로 닫혀 시청 세션을 모델링하기 좋습니다(V31).

### 4-3. 보내는 법 — SSE · WebSocket · 롱 폴링, 그리고 fan-out

- **SSE(Server-Sent Events)**: 서버에서 브라우저로 한 방향으로만 흐르는 스트림입니다. 끊기면 브라우저가 알아서 다시 연결하고, `retry` 필드로 재연결 대기 시간을 서버가 정합니다(V32). HTTP/1.1 에서는 브라우저·도메인당 연결 6개 제한이 있고 HTTP/2 에서는 협상된 스트림 수로 늘어납니다(V32).
  LinkedIn 은 SSE 로 노드당 약 10만 연결을 운영했고(V2 · V5), WebSocket 보다 방화벽에서 덜 막힌다는 이유를 댔습니다(V2). Facebook 공개 API 도 라이브 댓글·반응을 SSE 로 줍니다(V9).
- **WebSocket**: 양방향이고 Ping/Pong 프레임으로 연결 확인을 합니다(V34). 시청자 수만 보낼 때는 양방향이 필요 없습니다(판단).
- **롱 폴링**: 요청마다 HTTP 헤더 전체가 붙어 작은 메시지에서는 헤더가 데이터보다 커질 수 있고, 지연이 최대 왕복 세 번 이상까지 늘어납니다(V33).
- **Redis Pub/Sub**: 한 번 보내고 끝나는 at-most-once 전달이라 구독자가 끊기면 메시지가 사라집니다. 클러스터에서는 일반 pub/sub 이 모든 노드로 퍼지고, 7.0 의 샤드 pub/sub(`SPUBLISH`)은 샤드 안으로 범위를 줄입니다(V26). 시청자 수는 최신값 하나만 의미가 있어서 하나를 잃어도 다음 주기 값이 메웁니다(판단).
- **계층형 fan-out**: Twitch 채팅의 Edge + PubSub(V12), LinkedIn 의 프런트엔드 + 디스패처(V2), Facebook 의 Pylon + BRASS(V6)가 같은 모양입니다. 중앙은 에지 노드 수만큼만 보내고, 에지가 자기 연결들에 나눠 보냅니다. LinkedIn 디스패처는 "어느 프런트엔드가 이 방송의 구독자를 갖는가"를 공유 저장소에서 찾아 그 노드에만 보냅니다(V2).

## 5. 시나리오 절에 쓸 반례와 장애

- **N² 폭증** — Discord 는 서버 크기가 커지면 처리할 일이 제곱으로 는다고 밝혔습니다. 온라인 1,000명이 한 마디씩 하면 알림 약 100만 건, 10만 명이면 약 100억 건입니다(V22). 보고 있지 않은 연결을 수동(passive)으로 돌려 fan-out 작업을 약 90% 줄였습니다(V22).
- **보지 않는 것까지 받기** — Slack 은 팀의 모든 이벤트를 받던 클라이언트를 보는 화면 기준 구독으로 바꿔 presence 이벤트 수신을 5분의 1로 줄였습니다(V23).
- **폴링의 낭비** — Bladerunner 논문은 폴링 질의의 80%가 새 데이터를 받지 못했고, 1~2초 폴링이 초당 10억 건 규모의 질의를 만들었다고 보고합니다. 푸시로 바꾸자 CPU 부하와 질의 수가 10분의 1이 됐습니다(V6). 이 근거는 시청자마다 다른 데이터(댓글)에 대한 것입니다. 모두에게 같은 값이면 에지 캐시를 둔 폴링은 계산이 달라집니다(판단).
- **핫 키** — 영상 하나의 댓글 색인이 한 샤드에 몰리면 복제본을 늘려도 풀리지 않아 색인을 여러 샤드로 나눴습니다(V6 각주).
- **재접속 폭주** — 배포나 장애 뒤 모든 클라이언트가 한꺼번에 다시 붙습니다. 지수 백오프만으로는 호출이 뭉치므로 지터를 더해야 합니다(V38). Slack 도 재연결 폭주를 문제로 꼽았습니다(V23).
- **에지 요청 병합** — Facebook Live 는 PoP(에지 거점)에 영상 조각이 없을 때 데이터센터에 한 번만 요청하고 나머지 요청은 기다리게 했습니다(V8 · V7). 같은 값을 많은 사람이 동시에 원할 때 쓰는 원리입니다.

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 세는 곳 | 중앙 쓰기가 비례하는 것 | 얻는 것 | 포기하는 것 |
| --- | --- | --- | --- | --- |
| A. 하트비트 + Redis 정렬 집합 + 주기 SSE | 중앙 저장소 | 시청자 수 × 하트비트 빈도 | 구현과 설명이 단순, 이탈 지연이 만료 시간으로 명시됨 | 쓰기가 시청자 수에 비례해 핫 키 발생, 백그라운드 탭 하트비트 지연 |
| B. 에지 노드가 연결 수를 세고 중앙이 합산 | 에지 노드 메모리 | 에지 노드 수 × 보고 주기 | 하트비트 트래픽이 없음, 연결 해제를 바로 앎 | 연결만 열고 안 보는 사람 구분이 어려움, 여러 탭 중복 제거가 어려움 |
| C. 시간 구간별 HyperLogLog | 중앙 저장소 | 시청자 수 × 하트비트 빈도(쓰기는 O(1)) | 메모리 일정(키당 12KB 안팎), 중복 탭이 자동으로 묶임 | 표준 오차 0.81%, 이탈이 구간 길이만큼 늦게 반영 |
| D. 이벤트 → Kafka → Flink 윈도 집계 | 스트림 처리기 | 이벤트 수 | 정산·분석용 지표와 파이프라인 공유 | 윈도·워터마크 때문에 지연이 초~수십 초, 시청자 수만 위해서는 과함 |

- 근거: A 는 V1 · V4 · V19 · V27 · V28 · V26 · V32, B 는 V1 · V2 · V4 · V5, C 는 V24 · V25, D 는 V31 · V15 · V17 입니다. 표의 「얻는 것 · 포기하는 것」 가운데 출처 문장이 없는 칸은 판단입니다.
- 변형: 클라이언트가 3~5초마다 시청자 수를 폴링하고 CDN 이 그 응답을 몇 초 캐시하는 방식도 있습니다(판단). Instagram 앱이 하트비트와 시청자 수 조회를 한 호출로 묶는다는 제3자 보고(V21)와 결이 같습니다.
- **집필 메모(판단)**: 파일럿 가이드의 기본 구조로는 B 와 A 를 섞은 모양을 권합니다. 화면 전달용 SSE 연결이 어차피 에지에 있으니 에지가 연결 수를 세고(B), "영상을 실제로 재생 중인가"는 재생 상태 신호에 만료 시간을 걸어 걸러 냅니다(A 의 판정 방식). 중앙은 에지 노드별 최신 값을 합산해 1초 주기로 다시 에지에 보내고, 에지는 자기 연결에 보냅니다.
  표시 문자열(예: "1.2만 명")이 바뀌지 않으면 보내지 않는 규칙을 더하면 전달 건수가 더 줄어듭니다. 이 규칙을 쓴 공개 사례는 찾지 못했습니다(확인 안 함).
- **전환점(판단)**: 시청자 1천 명 규모의 방송이면 A 하나로 충분하고 에지 합산은 과합니다. 시청자 수가 커져 하트비트 쓰기가 저장소 한 대의 처리량을 넘는 지점에서 B 로 넘어갑니다. 정산·광고 정산처럼 고유 시청자 수가 돈과 연결되면 D 를 별도 경로로 둡니다. 실시간 표시값과 정산값을 다르게 두는 것은 YouTube 도 그렇습니다(V10 · V11).

## 7. 실제 사례 절에 쓸 대응표

| 사례 | 확인된 것 | 이 가이드 구조와의 대응 | 출처 |
| --- | --- | --- | --- |
| LinkedIn presence · Live | 하트비트 + 만료 판정, 멤버 해시 라우팅, SSE 전달, LinkedIn Live 의 동시 시청자 수가 같은 플랫폼 위 | 판정 방식, 에지 연결, 계층 fan-out | V1 · V2 · V4 · V5 |
| Facebook Bladerunner | 폴링 → 푸시 정량 비교, 시청자당 초당 1건 제한, 최선 노력 전달 | 주기 전달, 폴링 대안의 반례 | V6 |
| Hotstar | IPL 동시 1,000만+, 분당 +50만 증가, 자동 확장 90초라 사전 확장, PubSub 연결당 1 msg/s, 이모지 2초 마이크로배치 | 규모 추정 수치, 주기 전달 | V15 · V16 · V17 |
| AWS IVS | 입장 15초 · 이탈 1분의 공식 정의 | 요구사항 수치의 선례 | V18 |
| YouTube Live | 실시간 동시 시청자 값과 스팸을 걸러 낸 분석 값이 다름 | 표시용 · 정산용 분리 | V10 · V11 |
| Discord · Slack | N² 증가와 수동 연결, 보는 화면 기준 구독 | 시나리오 2 의 반례 | V22 · V23 |
| 토스증권 | 사내 실시간 동시 접속자 대시보드. 초당 수만 건 로그를 Kafka 와 ksqlDB 로 받아 30초 텀블링 윈도의 `COUNT_DISTINCT` 로 셈. Spark Streaming 은 잡이 늘면 운영 자원이 많이 들어 제외 | 대안 D(스트림 처리형)의 국내 사례. 사용자 화면이 아니라 내부 대시보드용이라는 점은 구분해서 씀 | V40 |

- 인용 주의: Hotstar 가 동시 시청자를 어떻게 세는지는 공식 근거가 없습니다. Hotstar 는 확장 수치와 소셜 기능 전달 구조의 사례로만 씁니다. Twitch 의 "영상을 실제로 받아야 시청자로 센다"는 말은 2014년 포럼 사용자 증언입니다(V13).

## 8. 구현 코드 절에 쓸 메모

- 근거와 바로 이어지는 코드는 A 의 판정(정렬 집합에 시각 기록 → 만료 멤버 삭제 → 개수)과 주기 전달(1초마다 방송별 값을 모아 에지에 발행 → 에지가 자기 연결에 SSE 로 보냄)입니다.
- 실행 검증용 코드는 메모리 대역과 가상 시계로 이 흐름을 재현할 수 있습니다. 하트비트 끊김 · 노드 하나 정지 · 입장 폭주를 가상 시계로 일으키고 출력을 고정하면, 본문의 수치를 실행에서 가져올 수 있습니다(판단).
- 실제 배포 조각으로는 Redis 명령(`ZADD` · `ZREMRANGEBYSCORE` · `ZCARD` · `SPUBLISH`)과 SSE 응답 헤더(`Content-Type: text/event-stream`, 주석 keepalive, `retry`)가 근거 문서(V28 · V26 · V32)와 바로 이어집니다.

## 9. 미해결 질문

본문에서 단정하지 않습니다. 찾으면 이 절에 되먹입니다.

1. Hotstar · YouTube Live · Facebook Live · Instagram Live · LinkedIn Live 가 시청자 수를 몇 초마다 갱신하는지, 근사치인지.
2. Twitch 의 시청자 수 계산과 캐시에 대한 공식 설명.
3. 국내 플랫폼(SOOP · 치지직 · 네이버 쇼핑라이브)의 집계 · 전달 방식에 대한 공개 기술 자료. 국내 사례로는 사내 대시보드용인 토스증권(V40)만 확인했습니다.
4. 숫자 표시가 몇 초 안에 바뀌면 지연이 없다고 느끼는지에 대한 직접 연구.
5. 여러 탭 · 여러 기기 중복을 다룬 공개 사례.
6. HyperLogLog 가 빼기를 지원하지 않는다고 직접 적은 공식 문장(지금은 V24 설명에서의 추론).
7. Hotstar 가 MQTT 를 고른 이유. 2차 요약만 있고 원문은 열지 못했습니다.
8. LinkedIn 발표 영상(V2)의 게시 연도. QCon London 2022 세션 페이지(V3)를 기준으로 적었습니다.
9. 한 글 안에서 수치가 충돌하는 곳: Twitch 채팅 규모 "하루 100억 건 이상"과 "하루 수천억 건"(V12), LinkedIn 같은 행사의 동시 시청자 1,800만 명과 8,000만 명(V2 요약본). 어느 쪽이 맞는지 판단할 근거가 없어 인용하지 않습니다.

## 9-1. 원문 대조 (2026-11-15, 카드 `KAN-002.2-4E05GD` S4)

본문에 실을 수치를 집필 전에 원문과 대조했습니다(명세 SD40). 원문 HTML 이나 PDF 를 받아 수치 · 인용 문자열을 직접 찾았습니다. **본문은 아래 「맞음」 행의 수치만 출처 수치로 씁니다.** 표에 없는 출처의 수치는 쓰기 전에 같은 방식으로 대조합니다.

| ID | 대조한 것 | 결과 |
| --- | --- | --- |
| V1 | d초 하트비트 · d+ε 만료 · 지연 타이머, 「less than 200ms at p99」, 노드당 「approximately 1.8K QPS」 | 맞음 |
| V2 | 「100,000 connections on the same machine」, 로열 웨딩 최고 「18 million viewers」를 「180 machines」로, 「75 milliseconds at p90」, WebSocket 이 방화벽에 막히는 일 | 문자열은 맞음. **다만 같은 발표가 앞에서 같은 행사를 「more than 80 million viewers concurrently」라고도 말합니다**(9절 미해결 질문 9 의 충돌). 1,800만 명은 단독으로 인용하지 않고, 「한 대 10만 연결 × 180대」 계산만 쓰거나 두 값을 함께 적습니다(1차 게이트에서 채점 워커가 찾음) |
| V4 | 하트비트 「every 30 seconds」 예시, 「more than a minute」 끊기면 오프라인 | 맞음 |
| V5 | 「hundreds of thousands of concurrent persistent connections」, SSE 사용 | 맞음. 「노드당 약 10만」은 V5 가 아니라 V2 의 문장입니다 |
| V6 | 폴링 질의의 「80%」가 새 데이터 없음, 1~2초 폴링이 「on the order of a billion queries per second」, 푸시 전환 뒤 CPU · QPS 「decreased by a factor of 10」, 시청자당 「at most one highly ranked comment … per second」, 최선 노력 전달 | 맞음(PDF 1~6쪽) |
| V15 | 동시 1,000만+, 분당 50만 증가 | **열람 실패** — 봇 검사 페이지가 떠서 원문을 못 읽었습니다(우회하지 않음). 본문에 출처 수치로 쓰지 않습니다. 3절의 분당 50만 계산은 본문에서 (가정) 수치로 바꿉니다 |
| V16 | 연결당 초당 1건 | **고침** — 원문은 「50M peak concurrent connections with 1rps messages sent rate」이고 대회 기간 「250 Billion+ messages」입니다. 「연결당」은 원문에 없는 해석이라 본문에서는 원문 표현대로 씁니다 |
| V17 | 이모지를 「a batch of 2 seconds」로 집계 | 맞음 |
| V18 | 입장 「within 15 seconds」, 이탈 「within 1 minute」 | 맞음 |
| V19 | `presenceTimeout` 기본 「300 seconds」 | 맞음 |
| V22 | 온라인 1000명이 한 마디씩이면 「1 million notifications」, 10,000명 「100 million」, 100,000명 「10 billion」, 대형 서버 연결의 「around 90%」가 수동 | 맞음 |
| V23 | presence 이벤트 수신이 「reduced by a factor of 5」 | 맞음 |
| V24 | 「up to 12 KB of memory」, 「standard error rate of 0.81%」 | 맞음 |
| V27 | 「Since Redis 2.6 the expire error is from 0 to 1 milliseconds」, 수동 · 능동 만료 | 맞음 |
| V29 | `SET` 180,180 req/s(파이프라인 없음) | 맞음(쿠폰 노트 C16 과 같은 문서) |
| V32 | HTTP/2 가 아니면 브라우저당 연결 「6」개 제한, HTTP/2 동시 스트림 기본 100, `retry` 필드, `:` 주석 줄 | 맞음 |
| V36 | Chrome 88 부터 숨은 탭 타이머 「once per second」, 조건이 맞으면 「once per minute」, 「5 minutes」 넘게 숨겨진 페이지 | 맞음 |
| V37 | ALB 유휴 타임아웃 기본 「60 seconds」 | 맞음 |
| V38 | 지수 백오프만으로는 「clusters of calls」가 남아 지터를 더함, 2015-03-04 | 맞음 |
| V40 | `WINDOW TUMBLING (SIZE 30 SECONDS)` · `COUNT_DISTINCT`, Spark Streaming 대신 ksqlDB | 맞음 |

대조하지 않은 출처(V3 · V7~V14 · V20 · V21 · V25 · V26 · V28 · V30 · V31 · V33~V35 · V39)는 수치를 본문에 싣지 않거나, 실을 때 먼저 대조합니다.

## 10. 출처

| ID | 출처 | 게시일 |
| --- | --- | --- |
| V1 | [LinkedIn — Now You See Me, Now You Don't: Real-Time Presence Platform](https://www.linkedin.com/blog/engineering/product-design/now-you-see-me-now-you-dont-linkedins-real-time-presence-platf) | 2018-01-12 |
| V2 | [Akhilesh Gupta — Streaming a Million Likes/Second (InfoQ)](https://www.infoq.com/presentations/linkedin-play-akka-distributed-systems) | 확인 안 함 |
| V3 | [QCon London 2022 세션 페이지](https://archive.qconlondon.com/node/112704) | 2022-04 행사 |
| V4 | [InfoQ 팟캐스트 — LinkedIn real-time messaging architecture](https://www.infoq.com/podcasts/linkedin-realtime-messaging-architecture) | 확인 안 함 |
| V5 | [LinkedIn — Instant Messaging: Hundreds of Thousands of Persistent Connections on One Machine](https://www.linkedin.com/blog/engineering/archive/instant-messaging-at-linkedin-scaling-to-hundreds-of-thousands-) | 2016-10-24 |
| V6 | [Barber 외 — Bladerunner (SOSP '21)](https://www.eecg.utoronto.ca/~stumm/Papers/Barber-sosp-21.pdf) | 2021-10 |
| V7 | [Meta — How we scale Live streaming for millions of viewers simultaneously](https://engineering.fb.com/video-engineering/live-streaming/) | 2020-10-22 |
| V8 | [InfoQ — How Facebook Live Scales](https://www.infoq.com/news/2018/02/facebook-live-scaling) | 2018-02 |
| V9 | [Facebook Live Video API — Interacting with Viewers](https://developers.facebook.com/docs/live-video-api/interact-with-viewers) | 확인 안 함 |
| V10 | [YouTube Data API — Videos resource](https://developers.google.com/youtube/v3/docs/videos) | 확인 안 함 |
| V11 | [YouTube 도움말 — 실시간 스트림 측정항목](https://support.google.com/youtube/answer/2853833) | 확인 안 함 |
| V12 | [Twitch Engineering: An Introduction and Overview](https://blog.twitch.tv/en/2015/12/18/twitch-engineering-an-introduction-and-overview-a23917b71a25) | 2015-12-18 |
| V13 | Twitch 개발자 포럼 사용자 글: [43387](https://discuss.dev.twitch.com/t/how-long-is-the-dalay-of-get-streams/43387) · [20645](https://discuss.dev.twitch.com/t/getting-stream-viewer-count-webhook-notifications/20645) · [29688](https://discuss.dev.twitch.com/t/live-viewer-count-cache-interval-legal-chatter-data/29688) · [1085](https://discuss.dev.twitch.com/t/how-does-twitch-count-views/1085) | 2014~2023 |
| V14 | [Twitch API — Get Streams](https://dev.twitch.tv/docs/api/reference/streams) | 확인 안 함 |
| V15 | [Hotstar — Scaling Hotstar.com for 10Mn concurrency (슬라이드)](https://www.slideshare.net/hotstar-engineering/scaling-hotstarcom-for-10mn-concurrency) | 확인 안 함 |
| V16 | [Hotstar PubSub (Rootconf Delhi 2020 소개)](https://hasgeek.com/rootconf/2020-delhi/sub/pubsub-realtime-messaging-service-hotstar-LP7A7b7ZVu6ibfgYFAcvXZ) | 소개 글 제출 2019-11-26, 행사 2020-01-18(2026-11-15 원문 확인) |
| V17 | [High Scalability — Capturing A Billion Emo(j)i-ons (Hotstar 글 재게시)](https://highscalability.com/capturing-a-billion-emo-j-i-ons/) | 2024-03-26 |
| V18 | [Amazon IVS API — Stream (`viewerCount`)](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/API_Stream.html) | 확인 안 함 |
| V19 | [PubNub — Presence events](https://www.pubnub.com/docs/general/presence/presence-events) | 확인 안 함 |
| V20 | [Ably — Occupancy](https://ably.com/docs/presence-occupancy/occupancy) | 확인 안 함 |
| V21 | [Instagram 앱 시청자 수 보안 보고서(제3자)](https://feed.bugs.xdavidhu.me/bugs/0015) | 2022-09-02 공개 |
| V22 | [Discord — Maxjourney: a Million+ Online Users in a Single Server](https://discord.com/blog/maxjourney-pushing-discords-limits-with-a-million-plus-online-users-in-a-single-server) | 2023-10-25 |
| V23 | [Slack — Flannel: An Application-Level Edge Cache](https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/) | 2017-05-31 |
| V24 | [Redis — HyperLogLog](https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/) | 확인 안 함 |
| V25 | [antirez — Redis new data structure: the HyperLogLog](http://antirez.com/news/75) | 확인 안 함 |
| V26 | [Redis — Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) | 확인 안 함 |
| V27 | [Redis — EXPIRE](https://redis.io/docs/latest/commands/expire/) | 확인 안 함 |
| V28 | [Redis — ZREMRANGEBYSCORE](https://redis.io/docs/latest/commands/zremrangebyscore/) | 확인 안 함 |
| V29 | [Redis — benchmark](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/) | 확인 안 함 |
| V30 | [Firestore — Distributed counters](https://docs.cloud.google.com/firestore/docs/solutions/counters) | 확인 안 함 |
| V31 | [Apache Flink — Windows (v2.3.0)](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/operators/windows/) | 확인 안 함 |
| V32 | [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) | 확인 안 함 |
| V33 | [RFC 6202 — Long Polling and Streaming](https://www.rfc-editor.org/rfc/rfc6202) | 2011-04 |
| V34 | [RFC 6455 §5.5.2 — WebSocket Ping](https://www.rfc-editor.org/rfc/rfc6455#section-5.5.2) | 2011-12 |
| V35 | [Nielsen Norman Group — Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/) | 1993 |
| V36 | [Chrome — Heavy throttling of chained JS timers (Chrome 88)](https://developer.chrome.com/blog/timer-throttling-in-chrome-88) | 2021-01 |
| V37 | [AWS ALB — 연결 유휴 타임아웃](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html) | 확인 안 함 |
| V38 | [AWS Architecture Blog — Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) | 2015-03-04 |
| V39 | [oneuptime — Redis Live Video Viewer Counter (튜토리얼, 반례로만)](https://oneuptime.com/blog/post/2026-03-31-redis-live-video-viewer-counter/markdown) | 2026-03-31 |
| V40 | [토스 — ksqlDB를 활용한 증권사의 실시간 데이터 처리하기](https://toss.tech/article/ksqldb-realtime-data) | 2024-07-17 |

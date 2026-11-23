# 리서치 노트 — 알림 대량 발송: 몰릴 때 무엇을 먼저 보내고, 발송사가 멈추면 어떻게

- 조사일: 2026-11-23. 자료 조사는 조사 워커 둘이 했고(기업 기술 글 · 공식 문서와 표준), 본문에 실을 만한 인용과 수치는 같은 날 원문 33편을 다시 받아 문자열을 맞췄습니다. 조사 워커의 도구는 본문을 요약해 돌려주는 방식이라, 워커가 옮긴 문장을 그대로 믿지 않고 모두 원문 텍스트에서 다시 찾았습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 일곱째 편(`notification-fanout`, 사례 목록 [RT-08](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S16 의 산출물입니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `M` 으로 시작합니다(앞 노트의 `V` · `C` · `L` · `P` · `T` · `G` · `K` · `N` 과 겹치지 않게). 사례 목록 RT-08 행의 B16 은 이 노트의 M1, B19 는 M3(그 원 글이 M2), B26 은 M4, D31 은 M6, D32 는 M7, HI 는 M10 입니다. 같은 행의 XU1(책)은 이 노트가 열어 보지 않았습니다.
- **사례마다 시점이 다릅니다.** Discord 는 2016-12, LinkedIn 은 2018-03, LINE 의 연말 대비 글은 2020-04(그 안의 사고는 2019 년 새해), 우아한형제들의 SMS 이중화 글은 2022-03(사고는 2021-06 · 2021-10)과 SSE 글은 2025-10, Uber 는 2022-08, Netflix 는 2024-09, LY(LINE) 의 Pushsphere 글은 2025-11, Hello Interview 는 2026-07 입니다. 공식 문서는 조회일의 현재 판입니다. 시점이 다른 사례를 한 흐름으로 잇지 않습니다.
- **Hello Interview(M10)는 교육용 분석이고 본문 대부분이 유료입니다.** 공개된 요구사항 절의 수치는 「설계 대상으로 정한 가정」이지 어느 회사의 값이 아닙니다. 깊이 들어가는 절은 제목만 보입니다.
- **앞 편(S15)에서 되먹인 것.** (1) 같은 수치가 같은 글에서 다른 동사나 대상으로 나오면 모두 적었습니다(Netflix 의 초당 30만 건과 평균 16만 · 5만, 99.999% 의 세 표현). (2) 「이 글에 없음」은 원문 텍스트에서 낱말을 직접 센 뒤에만 적고 찾은 낱말을 함께 남겼습니다(10절). 이 과정에서 워커가 「확인 안 함」으로 둔 두 가지가 원문에 있었습니다(APNs 오류 표의 400 · 403 행, Resilience4j 의 반열림에서 닫힘으로 가는 문장). (3) 보장을 말하는 문장은 그 한계 구절과 함께 옮겼습니다. (4) 고른 구조의 부품이 잃을 수 있는 것은 요구 범위로 빼지 않고 구조의 가정과 한계로 적었습니다(4-6, 6절). (5) 같은 낱말을 두 뜻으로 쓰지 않게 이름표를 미리 만들었습니다(8절).

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 받은 알림 먼저 적기와 중복 방지 키 · 4-2 우선순위 큐 · 4-3 작업자와 큐의 전달 규칙 · 4-4 발송사 응답 가르기와 재시도 · 4-5 발송사 이중화와 차단기 · 4-6 남는 중복과 유실의 한계 · 4-7 장기 연결) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 요구 후보 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

알림 시스템은 다른 서비스가 「누구에게 무엇을」만 넘기면 푸시 · SMS · 이메일로 실제 전달을 맡는 사내 플랫폼입니다. Hello Interview 는 이것을 「Product services hand it a message and a recipient, and the platform takes care of actually delivering it.」(원문 문장 그대로)로 적습니다(M10, 절 What is a Notification System?). 어려운 점은 셋입니다.

1. **몰림** — LY 의 Pushsphere 글: 많은 사용자가 짧은 시간에 같은 일을 겪으면 「평소의 수배에서 수십배까지」 발송량이 치솟고, 그 예로 지진을 듭니다(M5). Hello Interview 는 평시 초당 약 100건에 50배인 초당 5,000건을 설계 대상으로 정합니다(M10, 가정).
2. **빠짐과 겹침** — Hello Interview 의 깊이 들어가는 절 제목이 「How do we guarantee an accepted notification is never dropped?」와 「How do we prevent duplicate notifications on top of at-least-once delivery?」입니다(M10, 본문은 유료). 우아한형제들 SSE 글: 「중요한 이벤트가 유실되거나 중복으로 전송된다면 사용자 경험을 크게 해치게 됩니다.」(M7).
3. **외부 발송사가 멈춤** — 우아한형제들: 2021-06-18 「SMS를 발송하는 외부 시스템의 장애가 발생하였고, 이로 인해 우아한형제들의 서비스 전역에서 SMS를 발송하지 못했습니다.」(M6). LY: Firebase 의 한 리전 장애로 재시도가 몰려 할당량을 넘겼고 「전체 푸시 요청이 일시적으로 '429 too many request' 응답을 받았었습니다.」(M5).

공개 사례가 고른 방법은 세 갈래입니다.

1. **큐를 나누고 순서를 정하기** — LinkedIn: 「For messaging, we use high-priority Kafka topics to prioritize member messages.」(M8). LINE 은 2019 년 새해에 「The push queue in messaging servers became full, losing pushes.」를 겪은 뒤 「Segregate notification queues by roles to minimize the impact of failures arising from a specific component」와 차단기 도입을 조치로 적습니다(M4).
2. **발송사 이중화와 차단기** — 우아한형제들은 SMS 발송사 둘을 두고, 하나가 멈추면 다른 쪽으로 트래픽을 100% 넘겼습니다. 다만 판단은 사람이 합니다(M6). LY 의 Pushsphere 는 실패가 쌓여 차단기가 열리면 그 엔드포인트를 풀에서 빼고, 재시도 전에 남은 할당량을 확인합니다(M5).
3. **앱이 열려 있을 때의 장기 연결** — Netflix Pushy 는 WebSocket 연결 수억 개를 유지합니다(M2). Uber 는 SSE 를 gRPC 양방향 스트림으로 바꿨습니다(M1). 우아한형제들은 SSE 와 `Last-Event-ID` 로 끊긴 동안의 메시지를 다시 보냅니다(M7).

이 노트의 추천 구조(판단)는 이렇습니다. **알림 API 는 요청한 서비스가 붙인 중복 방지 키와 함께 알림을 알림 저장소에 먼저 적고, 같은 키가 다시 오면 처음 결과를 돌려줍니다. 적은 뒤에 우선순위 큐에 넣고 받았다고 답합니다. 큐는 급한 것(인증번호 등) · 보통 · 캠페인으로 나누고, 채널 작업자는 급한 큐를 먼저 비웁니다. 발송사 응답은 셋으로 가릅니다. 성공은 기록합니다. 다시 보내도 되는 실패(429 · 5xx)는 지수 백오프와 지터만큼 기다리게 해 큐에 다시 넣습니다. 다시 보내면 안 되는 실패(410 등)는 토큰을 지우고 끝냅니다. 정한 횟수를 넘긴 알림은 실패 큐로 보냅니다. 재시도는 발송사 할당량 가운데 정해 둔 몫 안에서만 합니다. SMS 는 발송사 둘에 차단기를 두어 열리면 다른 쪽으로 넘깁니다. 앱이 열려 있으면 장기 연결(SSE)로 먼저 보냅니다. 같은 알림은 같은 접기 ID 로 보내 기기에서 하나로 합칩니다.** 근거와 버린 후보는 6절에 있습니다.

**이 구조로도 남는 것**이 있습니다. 발송사로 나가는 호출은 정확히 한 번이 될 수 없습니다. Kafka 설계 문서: 「Exactly-once delivery for other destination systems generally requires cooperation with such systems」(M23). 그래서 작업자가 발송사의 응답을 받은 뒤 기록하기 전에 멈추면 같은 알림이 한 번 더 갑니다. 푸시는 접기 ID 로 기기 화면에서 합칠 수 있지만, SMS 에는 그런 장치가 없습니다(판단, 4-6). 가이드는 이 창을 요구 범위에서 빼지 말고 고른 구조의 한계로 적어야 합니다(앞 편 S15 의 SD18 지적).

## 2. 요구사항 절에 쓸 근거 — 「몰림」 · 「빠짐과 겹침」 · 「발송사 장애」를 숫자로

| 값 | 원문 | 대상 · 시점 | 출처 |
| --- | --- | --- | --- |
| 평시 | 「Say we deliver 10M notifications a day. Spread evenly, that's about 100 per second which is honestly almost nothing.」 | 교육용 가정, 2026-07 | M10 절 Non-Functional Requirements |
| 캠페인 하나 | 「Delivering 1M inside 5 minutes works out to over 3,000 per second, and that's a single campaign.」 | 같음 | M10 같은 절 |
| 몰림 | 「So we'll design for surges of 5,000 notifications per second or roughly 50x our sustained rate.」 | 같음 | M10 같은 절 |
| 급한 알림 | 「How do we deliver high priority notifications within 5 seconds, even during a campaign blast?」 | 같음, 절 제목만(본문 유료) | M10 절 Potential Deep Dives |
| 실제 몰림 | 「평소의 수배에서 수십배까지」 치솟음, 예는 지진 | LINE 메신저 푸시, 2025-11 글 | M5 |
| 처리량 요구 | 「L7 로드 밸런서는 Pushsphere 요구 사항인 40만 QPS를 처리할 수 없기 때문에 해결책이 될 수 없었습니다.」 | 같음, **요구 사항**(운영 평균 아님) | M5 |
| 장기 연결 처리량 | 「it regularly reaches 300,000 messages sent per second」 · 「direct messages averaged around 160,000 messages per second and indirect averaged at around 50,000 messages per second」 | Netflix Pushy, 2024-09. 앞은 **도달값**, 뒤는 **어느 24시간의 평균** | M2 절 Growth · Shift towards direct push |
| 하루 처리량 | 「일평균 약 4천만 건의 이벤트를 안정적으로 처리」 | 우아한형제들 SSE, 2025-10, **일평균** | M7 절 마치며 |
| 하루 처리량 | 「currently processes over a billion requests per day」 | LinkedIn ATC, 2018-03 | M8 절 Conclusion |
| 유효 시간 | 「A lot of critical messages like offers sent to drivers have a validity of 30 seconds.」 | Uber, 2022-08 | M1 절 Limitations of RAMEN SSE |
| 발송사 장애 | 2021-06-18 오후 5시 SMS 외부 시스템 장애로 서비스 전역 SMS 발송 불가. 「인증 문자 메시지를 발송할 수 없어」 라이더가 로그인하지 못함 | 우아한형제들, 2022-03 글 | M6 |

- Netflix 의 신뢰도 99.999% 는 같은 글에서 세 번, 세 동사로 나옵니다. 머리말 「maintains a steady 99.999% message delivery reliability rate」, 절 Growth 「with Pushy successfully maintaining 99.999% reliability for message delivery over the last few months」, 다른 절 「regularly average 5 9s of message delivery reliability」입니다. 무엇을 나눠 센 값인지는 글에 없어(원문에서 정의 문장을 찾지 못함) 가이드는 이 값을 요구의 근거로 쓰지 않습니다(판단).
- 초당 30만 건(도달)과 평균 16만 · 5만 건은 다른 값입니다. 둘을 더해 「평균 21만」이라 적는 것은 이 노트의 계산이고, 30만이 그 둘의 최대인지는 글에 없습니다(확인 안 함).
- **요구 표 후보(가정)**: 평시 초당 약 100건(하루 1천만 건, M10 을 빌림), 몰릴 때 초당 5,000건(50배, M10 을 빌림), 급한 알림(인증번호)은 캠페인이 진행 중이어도 받은 뒤 5초 안에 발송사에 넘김(M10 의 절 제목을 빌린 가정), 받았다고 답한 알림은 빠지지 않음, 같은 요청 키는 한 번만 받음, SMS 발송사 하나가 멈춰도 SMS 는 정한 시간 안에 다른 발송사로 나감, 앱이 열려 있는 사용자에게는 1초 안(가정).
- **「두 번 0」은 문제 쪽 말로 좁혀 적습니다(판단).** 사례 목록 RT-08 행의 어려운 점은 「중복·유실 금지」입니다. 그런데 발송사로 나가는 호출은 정확히 한 번이 될 수 없으므로(M23), 요구를 「같은 요청은 한 번만 받는다」와 「발송사로 두 번 나가는 경우를 정해진 경우로 묶고 그 수를 센다」로 나눠 적고, 남는 창은 고른 구조의 한계로 밝힙니다. 요구를 구조에 맞춰 줄이는 것이 아니라, 문제의 「금지」가 외부 호출에는 성립할 수 없다는 사실을 요구 절에서 먼저 말하는 것입니다.

## 3. 규모 추정 절에 쓸 계산

출처 수치는 Hello Interview(M10, 교육용 가정) · FCM 문서(M13 · M14 · M15) · Netflix(M2)이고, 나머지는 가이드의 가정과 그 계산입니다.

1. 평시: 하루 1천만 건 ÷ 86,400초 ≈ 초당 115.7건(계산). M10 은 「about 100」이라고 적습니다.
2. 캠페인 하나: 1백만 건 ÷ 300초 ≈ 초당 3,333건(계산). M10 은 「over 3,000」이라고 적습니다.
3. FCM 할당량: 기본값 「The default quota of 600k messages per minute covers over 99% of FCM developers」(M15) → 초당 1만 건(계산 — 600,000 ÷ 60). 같은 회사의 다른 문서는 이 값을 「the HTTP v1 API allots 600K Quota Tokens for each 1-minute Token Bucket」로 적어(M14) 단위가 「메시지」와 「토큰」으로 다릅니다. 두 문서의 관계를 문서가 직접 풀지 않습니다(확인 안 함). 또 「Quotas are per-minute, but these minutes are not aligned to the clock.」(M15).
4. 할당량 안의 캠페인: 1천만 명에게 보내면 1,000만 ÷ 60만 ≈ 16.7분(계산). 그동안 캠페인이 할당량을 모두 쓰면 급한 알림이 들어갈 몫이 없습니다. 할당량에서 급한 알림의 몫을 먼저 떼어 두는 이유가 이것입니다(판단).
5. 재시도가 할당량을 쓰는 양: 발송사가 모든 요청을 실패시키고 작업자가 요청마다 3번까지 다시 보내면 할당량을 최대 4배로 씁니다(계산 — 처음 1 + 재시도 3). 평소 할당량의 30%(가정)를 쓰던 시스템도 120% 가 되어 넘칩니다(계산). M5 의 사건이 이 모양입니다(「최대 가능한 재시도 횟수 = 3」이 하드코딩돼 있었고, 리전 장애로 재시도가 몰려 할당량을 넘김).
6. 기기 하나의 한도: 「For Android, you can send up to 240 messages per minute and 5,000 messages per hour to a single device.」(M15). 접기 메시지는 「We limit collapsible messages to a burst of 20 messages per app per device, with a refill of 1 message every 3 minutes.」(M15).
7. 장기 연결 서버: 동시 접속 1천만(가정) ÷ 서버 한 대 평균 20만(M2) = 50대(계산). 한 대가 멈추면 그 20만 대가 곧바로 다시 연결합니다(계산 — 「When a Pushy instance goes down, the devices that were connected to it will immediately try to reconnect.」, M2). Netflix 가 든 「a thundering herd of a million devices reconnecting at the same time」은 「We could have a million connections per instance, but」로 시작하는 **가정 문장**입니다(M2). 실제 운영 값으로 옮기지 않습니다.
8. 재시도 간격: FCM 은 「Wait at least 10 seconds before retrying a failed request.」 · 「If no retry-after header is set, default to 60 seconds.」(M14), 할당량 초과는 「exponential backoff with a minimum initial delay of 1 minute」(M13). APNs 는 「After 15 minutes, you can retry JSON payloads that receive response status codes that begin with 5XX.」(M12).
9. 큐의 가시성 시간과 겹침: SQS 의 기본값은 「The default visibility timeout for a queue is 30 seconds」(M19)입니다. FCM 은 발송 요청에 10초 이상의 타임아웃을 권합니다(「Set at least a 10 second timeout on send requests before retrying.」, M14). 작업자가 한 메시지를 붙잡은 채 10초 타임아웃으로 3번 다시 보내면 30초가 지나 다른 작업자도 같은 메시지를 받습니다(계산 — 10 × 3 = 30). 재시도를 작업자 안에서 붙잡고 하지 않고 큐에 다시 넣는 이유가 이것입니다(판단).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 받은 알림 먼저 적기와 중복 방지 키 — 받았다고 답한 것은 잃지 않게

- 받았다고 답하기 전에 저장소에 적는 것은 이 노트의 판단입니다. 근거로 삼을 공개 본문은 찾지 못했고, 같은 질문을 M10 이 절 제목으로만 던집니다(「How do we guarantee an accepted notification is never dropped?」).
- 이미 처리한 요청을 버리는 사례: LinkedIn ATC 「ATC handles the duplicated requests by dropping any request it has already processed」(M8). 무엇을 키로 삼는지와 얼마나 기억하는지는 글에 없습니다(원문에서 `dedup` · `idempot` 을 찾아 0개).
- 큐가 해 주는 중복 제거의 범위: SQS FIFO 큐는 「Unlike standard queues, FIFO queues don't introduce duplicate messages.」이지만 그 범위는 「If you retry the `SendMessage` action within the 5-minute deduplication interval, Amazon SQS doesn't introduce any duplicates into the queue.」입니다(M22). 5분이 지난 뒤 같은 키로 다시 보내면 이 보장 밖입니다. 또 「Amazon SQS continues tracking the deduplication ID even after the message has been received and deleted.」(M22). 표준 큐 문서에는 중복 제거 기능이 없습니다(원문에서 `deduplication` 0개).
- Kafka 의 멱등 생산자: 「the Kafka producer also supports an idempotent delivery option which guarantees that resending will not result in duplicate entries in the log.」(M23). 보장의 대상은 **로그 안**입니다.
- **APNs 의 `apns-id` 는 중복 방지 키가 아닙니다.** 문서는 「A canonical UUID that's the unique ID for the notification.」로 정의하고, 오류를 보고할 때 이 값을 함께 준다고 적습니다(M11). 원문에서 `dedup` · `duplicate` · `idempot` 을 찾아 0개입니다. 가이드는 중복 방지 키를 알림 API 의 장치로 설계하고 APNs 문서를 근거로 들지 않습니다.
- 설계 판단: 중복 방지 키는 요청한 서비스가 만듭니다. 알림 저장소는 키와 처음 결과를 함께 적고, 그 기억 기간은 요청한 서비스가 다시 보낼 수 있는 기간보다 길게 둡니다(판단).

### 4-2. 우선순위 큐 — 급한 알림이 캠페인 뒤에서 기다리지 않게

- LinkedIn: 「For messaging, we use high-priority Kafka topics to prioritize member messages.」(M8, 절 Traffic patterns, latency, and throughput). 같은 글: 「ATC will rate-limit upstream applications to prevent them from accidentally spamming members.」(M8).
- LINE 2019 사고 뒤 조치: 「Segregate notification queues by roles to minimize the impact of failures arising from a specific component」(M4). 우선순위라는 말은 없고 역할별 분리입니다(원문에서 `priority` 0개).
- 받는 쪽이 감당할 만큼만 가져가기: Discord 「The Push Collector never sends a request to a Pusher unless the Pusher asks for one.」, 그 이유는 「Firebase requires that each XMPP connection has no more than 100 pending requests at a time.」(M9). 2016 년의 XMPP 연결 이야기라 지금의 FCM HTTP v1 에 그대로 옮기지 않습니다.
- **발송사가 정하는 긴급도는 우리 큐에서 꺼내는 순서와 다릅니다.** APNs 의 `apns-priority` 는 10 이 「to send the notification immediately」, 5 는 기기의 전력 사정을 따른다는 뜻이고(M11), FCM 의 `high` 는 「FCM attempts to deliver high priority messages immediately」(M17)입니다. 둘 다 기기에서 언제 깨워 보여 줄지를 정하는 값이며, 우리 큐에서 무엇을 먼저 꺼낼지와 상관없습니다(판단). FCM 은 오용하면 「your messages may be deprioritized to normal priority」라고 적습니다(M17). 이름표는 8절에 있습니다.

### 4-3. 작업자와 큐의 전달 규칙 — 적어도 한 번, 가시성 시간, 실패 큐

- SQS 표준 큐: 「Standard queues ensure at-least-once message delivery, but due to the highly distributed architecture, more than one copy of a message might be delivered, and messages may occasionally arrive out of order.」(M20).
- 가시성 시간: 「If you don't delete it before the timeout expires, the message becomes visible again in the queue and can be retrieved by another consumer.」(M19). 기본 30초, 최대는 「the visibility timeout has a maximum limit of 12 hours from when the message is first received」(M19). 한계: 「there's no absolute guarantee that a message won't be delivered more than once during the visibility timeout period」(M19).
- 실패 큐: `maxReceiveCount` 는 「the number of times a consumer can receive a message from a source queue before it is moved to a dead-letter queue.」(M21, 개발자 안내서). API 문서는 같은 값을 「Default: 10」으로 적고 옮기는 조건을 「When the ReceiveCount for a message exceeds the maxReceiveCount for a queue, Amazon SQS moves the message to the dead-letter-queue.」로 적습니다(M21, CreateQueue). 두 문장이 경계(이르면 · 넘으면)를 똑같이 말하지 않아, 정확히 몇 번째 받기에서 옮겨지는지는 이 문서들로 확정하지 못했습니다(확인 안 함).
- Kafka: 「Messages are never lost but may be redelivered.」가 at-least-once 의 정의이고(M23), 「Kafka guarantees at-least-once delivery by default」(M23).
- 설계 판단: 작업자는 받은 메시지를 발송사에 넘긴 뒤 결과를 알림 저장소에 적고 나서 큐에서 지웁니다. 다시 보낼 실패는 붙잡고 기다리지 않고 지연을 두어 큐에 다시 넣습니다(3절 9번).

### 4-4. 발송사 응답 가르기와 재시도 — 다시 보낼 것과 버릴 것

- APNs(M12). 상태 코드 표에서 410 은 「The device token is no longer active for the topic.」, 429 는 「The server received too many requests for the same device token.」입니다. 사유 문자열 표는 400 행에 `BadDeviceToken` · `DeviceTokenNotForTopic` 등, 403 행에 `Forbidden` 등을 둡니다(원문 표 확인). 재시도 규칙은 「After 15 minutes, you can retry JSON payloads that receive response status codes that begin with 5XX.」, 「Don't retry notification responses with the error code BadDeviceToken, DeviceTokenNotForTopic, Forbidden, ExpiredToken, Unregistered, or PayloadTooLarge.」, 「You can retry with a delay, if you get the error code TooManyRequests.」입니다. 또 같은 문서는 `BadDeviceToken` 같은 오류가 잦으면 APNs 가 연결을 더 빨리 끊는다고 적습니다.
- FCM(M14 「Handling retries」 절): 「For 400, 401, 403, 404 errors: abort, and do not retry.」, 「For 500 errors: retry with exponential backoff.」, 「To avoid retry amplification, implement exponential back-off with jittering for retrying requests.」, 「Set a maximum interval for dropping requests that are no longer timely, instead of retrying indefinitely.」. 오류 코드 문서(M13)는 `UNAVAILABLE` 에 「Honor the Retry-After header if it is included in the response from the FCM Connection Server.」 · 「Implement exponential backoff in your retry mechanism.」을 요구하고, `UNREGISTERED` 는 「remove this registration token from the app server and stop using it to send messages」입니다.
- **같은 429 에 FCM 의 두 문서가 다른 안내를 줍니다.** M13 은 할당량 초과에 「exponential backoff with a minimum initial delay of 1 minute」, M14 는 「For 429 errors: retry after waiting for the duration set in the retry-after header.」와 헤더가 없으면 60초입니다. 가이드는 둘을 출처를 갈라 함께 적습니다. 어느 쪽이 우선인지 문서가 정하지 않습니다(확인 안 함).
- 재시도가 과부하를 키움: 「When failures are caused by overload, retries that increase load can make matters significantly worse.」, 지터의 이유는 「If all the failed calls back off to the same time, they cause contention or overload again when they are retried.」 · 「Jitter adds some amount of randomness to the backoff to spread the retries around in time.」(M26). 같은 글은 재시도를 토큰 버킷으로 제한하는 방법을 적습니다(「We have found that we can mitigate this risk by limiting retries locally using a token bucket」).
- 할당량을 보고 재시도: 「이 문제를 해결하기 위해서 재시도하기 전에 현재 할당량이 얼마나 남아 있는지 확인하는 로직을 추가했습니다.」, 「트래픽이 너무 많을 때에는 실패한 요청을 재시도하는 것보다는 제한된 할당량 안에서 새로운 요청을 처리하는 것이 더 합리적인 선택일 것입니다.」(M5). 재시도 간격의 숫자는 글에 없습니다(원문에서 `재시도 간격` · `백오프` 0개).
- 유효 시간이 지나면 다시 보내지 않음: Uber 의 배차 제안은 30초만 유효하고, 옛 구조에서는 「This prevents us from resending critical push messages like driver offers.」(M1). APNs 의 `apns-expiration` 은 0 이면 「APNs attempts to deliver the notification only once and doesn't store it.」이고 보장은 「APNs uses best efforts to honor the expiry date without any guarantee.」(M11). FCM 의 TTL 은 「The value must be a duration from 0 to 2,419,200 seconds (28 days)」(M16).

### 4-5. 발송사 이중화와 차단기 — 하나가 멈추면 다른 쪽으로

- 우아한형제들(M6): 요구로 「A 외부 시스템 장애 상황 시에는 B 외부 시스템로만 요청이 가도록 해야 합니다.」와 「A 외부 시스템에서 처리할 수 있는 동시 처리량을 넘어서는 경우에는 B 외부 시스템에 트래픽을 50:50으로 분산할 수 있어야 합니다.」를 적고, 배포 없이 비율을 바꾸려고 설정 서버를 10초마다 읽습니다(「message-platform-router 모듈에서 10초 주기로 Config Server에」, 비율 예시 A: 51). 2021-10-19 22:30 무렵 두 번째 장애 때 「장애를 인지함과 동시에 안정적으로 SMS를 발송할 수 있는 외부 시스템으로 트래픽을 100% 전환하였습니다.」. 판단은 사람이 합니다: 「현재는 알람이나 제보를 통해 사람이 장애를 인지하고 판단하여 트래픽을 전환하고 있습니다.」, 그 이유는 「장애라고 판단할 수 있는 기준을 정하기 어렵기 때문이었습니다.」. 자동 전환은 계획입니다. 이 글에는 차단기 · 중복 · 유실 · 큐가 없습니다(원문에서 `서킷` · `circuit` · `중복` · `유실` · `큐` 0개). 알람에서 전환까지 걸린 시간도 적혀 있지 않습니다.
- LY 의 Pushsphere(M5): 「만약 실패가 누적돼 특정 임계치를 넘어서서 서킷 브레이커가 작동한다면 이 사실이 엔드포인트 매니저로 전달됩니다.」, 「엔드포인트 매니저는 문제가 발생한 엔드포인트를 엔드포인트 풀에서 즉시 제거하고」 후보에서 새 엔드포인트를 채웁니다. **같은 발송사 안의 엔드포인트를 바꾸는 것이지 발송사를 바꾸는 것이 아닙니다.** 결과: 연간 30건 이상이던 알람이 「2025년도에 단 4건의 알람만 받았습니다」, 「최종 메시지 전송 실패율은 0에 가까웠습니다.」.
- LINE 2019 사고 뒤 조치: 「Introduce circuit breaker to automatically block requests and isolate failures」(M4).
- 차단기의 상태(Resilience4j 문서, M27): 실패율이 기준 이상이면 닫힘에서 열림(「The state of the CircuitBreaker changes from CLOSED to OPEN when the failure rate is equal or greater」), 열려 있으면 호출을 거절, 기다린 뒤 반열림(「After a wait time duration has elapsed, the CircuitBreaker state changes from OPEN to HALF_OPEN」), 반열림에서 시험 호출의 실패율이 기준 아래면 닫힘(「If the failure rate and slow call rate is below the threshold, the state changes back to CLOSED.」), 기준 이상이면 다시 열림. 조사 워커는 마지막 둘을 「확인 안 함」으로 남겼지만 원문에 있습니다.
- 차단기의 단점: AWS Builders' Library 「circuit breakers introduce modal behavior into systems that can be difficult to test」(M26, 문장 중간의 구절. 앞에 「Unfortunately,」가 있음 — 조사 워커는 이 구절을 문장 머리로 옮겼음).
- **푸시를 다른 발송사로 넘기는 1차 사례는 찾지 못했습니다.** APNs 와 FCM 사이의 자동 전환을 숫자와 함께 적은 글이 없고, 기기 토큰이 발송사마다 따로 있다는 점에서 SMS 처럼 넘기기 어렵다고 봅니다(판단, 문서 문장으로 확인하지 않음). 푸시의 대안은 같은 발송사 안의 엔드포인트 교체(M5)와 장기 연결(4-7)입니다.

### 4-6. 남는 중복과 유실의 한계 — 구조의 가정으로 적을 것

- 외부 호출에는 정확히 한 번이 없음(M23, 1절). Uber 의 옛 구조는 확인 응답을 30초마다 묶어 보내서 「The delivery state of a message is unknown for up to 30 seconds after it is written to a RAMEN connection.」였습니다(M1). 확인이 늦으면 다시 보낼지 정할 수 없다는 예입니다.
- 기기에서 합치기: APNs `apns-collapse-id` 는 「When sending the same notification more than once, use the same value in this header to merge the requests.」(M11). FCM `collapse_key` 는 「An identifier of a group of messages that can be collapsed, so that only the last message gets sent」(M18). 접기 메시지에는 3절 6번의 기기당 한도가 따로 걸립니다(M15). SMS · 이메일에서 같은 장치를 적은 문서는 이번에 보지 않았습니다(확인 안 함).
- 발송사 뒤의 전달은 발송사의 best-effort: 「As a best-effort service, APNs may reorder notifications you send to the same device token.」, 「Your notifications may also get throttled, saved in storage, and in some cases, not delivered.」(M11). FCM 도 「Our goal is to always deliver every message sent using FCM.」 바로 뒤에 「However, delivering every message sometimes results in a poor overall user experience.」를 둡니다(M15). 그래서 가이드의 「유실 0」은 「받았다고 답한 알림이 발송사에 넘겨졌거나 실패 큐에 기록됨」까지로 범위를 정하고, 그 뒤는 발송사의 보장이라고 밝힙니다(판단).
- **큐와 알림 저장소의 보존은 고른 구조의 가정입니다.** LINE 2019: 「The push queue in messaging servers became full, losing pushes.」(M4). 원인은 0시에 연결이 한꺼번에 몰려 푸시 부품의 힙이 급히 늘고 full GC 가 난 것입니다(「leading to full GC (garbage collection) due to a sharp increase in the heap memory of the push component」). 큐가 꽉 찼을 때의 규칙(받기를 거절하고 요청한 서비스가 다시 보내게 함 등)을 설계에 두어야 합니다(판단). 앞 편(S15)은 고른 구조에만 있는 큐의 보존을 요구 범위로 빼서 게이트에서 지적받았습니다.

### 4-7. 장기 연결 — 앱이 열려 있을 때 발송사를 거치지 않고

- 우아한형제들 SSE(M7, PC 클라이언트에 적용, 모바일 앱은 향후 과제): 한계를 먼저 인정합니다 — 브로커에 따라 「메시지 순서가 역전되거나 유실이 생길 수 있습니다」. 조치는 「파트너별로 파티션을 분리하여 메시지 순서를 보장」, 「SSE 연결이 끊어진 경우를 대비하여 메시지 이력을 일정 기간 보관」, 「Last-Event-ID를 통해 재연결 시 놓친 메시지를 차례대로 재전송」, 「메시지 전송 실패 시 재시도 메커니즘 구현」입니다. 이력을 며칠 보관하는지는 글에 없습니다(원문에서 `보관 기간` · `TTL` 0개). 중요 이벤트는 받았다는 호출을 따로 받습니다(「서버는 해당 URL이 호출되면 디바이스가 이벤트를 수신한 것으로 인지하고 DB에 마킹합니다.」). 서버를 다시 띄울 때 한꺼번에 다시 접속하는 문제는 「각 세션 지속 시간을 random의 jitter 시간을 설정해 골고루 분포되도록 하였습니다.」로 풉니다. 브로커를 한 번 거쳐 「네트워크 홉이 증가하고 수십ms단위의 레이턴시가 증가하지만, 정확성과 안정성이 더 중요하므로 허용 가능한 수준이었습니다.」. WebSocket 대신 SSE 를 고른 이유는 「WebSocket의 양방향 통신은 오버엔지니어링이 될 수 있습니다」입니다.
- HTML 표준의 SSE(M24): 「The Last-Event-ID HTTP request header reports an EventSource object's last event ID string to the server」, 다시 연결까지 기다리는 시간은 구현이 정하고 「probably in the region of a few seconds」, 서버는 「a client can be told to stop reconnecting using the HTTP 204 No Content response code」. `Last-Event-ID` 는 마지막으로 받은 ID 를 알려 주는 헤더일 뿐이고, 놓친 것을 다시 보내는 일은 서버의 설계입니다(판단).
- Netflix Pushy(M2): 서버 한 대 평균 연결이 6만이던 시절이 있었고(「we would add new instances when the average number of connections reached 60,000 connections per instance」), 지금은 「we ended up with instances that handle an average of 200,000 connections per node, with breathing room to go up to 400,000 connections if we had to」입니다(40만은 최대가 아니라 **여유 한도**). 기기는 「devices will reconnect every 30 minutes or so, with some staggering」. 큐를 거치는 간접 전달은 「best-effort」였고, 직접 전달은 상태 코드로 결과를 돌려줘 「letting them retry if a device they're targeting has gone offline」. 지연은 「we reduced median latency to less than a millisecond, with the 99th percentile of latency at less than 4ms」.
- Uber(M1): 옛 SSE 구조에서 서버는 「Ramen Server also sends a heartbeat message to the mobile side every 4 seconds.」, 앱은 「The mobile client assumes that the connection is broken and reconnects if it sees no heartbeat or messages up to 7 seconds.」. 새 gRPC 구조의 응답 모델은 5초마다 heartbeat 를 보냅니다(「Heartbeats are sent out to indicate that the connection is healthy every 5 seconds.」) — 4초와 5초는 **다른 구조의 값**입니다. gRPC 에서는 「The acknowledgement can be sent over the same stream instantly without extra networking calls from the mobile client.」, 문제가 생기면 「We invested in building tooling on the mobile side for quickly falling back from gRPC to the SSE protocol.」. 결과는 「Push success rates have increased by a minimum of 1-2% across all apps」(측정 조건은 글에 없음). 이 글에는 중복 방지 · 전달 보장 등급 · 재시도 · `Last-Event-ID` 가 없습니다(원문에서 `duplicate` · `at least once` · `idempot` · `retry` · `Last-Event-ID` 0개).
- 장기 연결은 앱이 꺼져 있으면 쓸 수 없으므로 푸시를 대신하지 않고 앞에 놓는 길입니다(판단). 연결이 없거나 정한 시간 안에 받았다는 응답이 없으면 푸시로 넘깁니다(판단).

## 5. 시나리오 절에 쓸 반례와 장애

회고 8절의 판단대로 외부 발송사의 장애 · 재시도는 사건으로 재현할 수 있습니다(파일럿 회고 8절, 「외부 발송사 장애 · 재시도는 사건으로 재현 가능」).

1. **캠페인과 인증번호가 겹침(급한 알림의 반례).** 큐가 하나면 캠페인 1백만 건이 먼저 들어간 뒤의 인증번호는 그 뒤에서 기다립니다. 처리가 초당 5,000건(가정)이면 200초(계산 — 1,000,000 ÷ 5,000)로 5초 요구를 넘깁니다. 우선순위 큐면 작업자가 다음 꺼낼 때 바로 가져갑니다.
2. **SMS 발송사 A 가 멈춤.** 우아한형제들의 2021 년 두 사건(M6)을 모형으로: 차단기가 실패율로 열리고 B 로 넘기며, 기다린 뒤 반열림에서 시험 호출로 A 의 회복을 확인합니다. 사람이 판단할 때와 견줄 값(알람에서 전환까지의 시간)은 M6 에 없으므로 가정으로 둡니다.
3. **푸시 발송사의 리전 장애와 재시도 폭주(M5).** 재시도 횟수만 정해 두면 실패한 요청의 재시도가 할당량을 다 써서 새 요청까지 429 를 받습니다(3절 5번). 할당량의 몫 안에서만 재시도하면 새 요청이 먼저 나갑니다.
4. **작업자가 발송사 호출 뒤 기록 전에 멈춤.** 가시성 시간이 지나 다른 작업자가 같은 알림을 다시 보냅니다(M19 · M20). 푸시는 같은 접기 ID 로 기기에서 하나로 합쳐지고, SMS 는 두 번 갑니다. 가이드는 이 한 건을 출력으로 세고 한계로 적습니다.
5. **더는 쓸 수 없는 토큰.** 410 `Unregistered` · FCM `UNREGISTERED` 는 재시도하지 않고 토큰을 지웁니다(M12 · M13). 재시도하면 할당량만 씁니다(판단).
6. **유효 시간이 지난 알림.** 30초짜리 배차 제안(M1)처럼 유효 시간이 지난 재시도는 보내지 않고 버립니다(M14 「Set a maximum interval for dropping requests that are no longer timely」).
7. **장기 연결 서버 하나가 멈춤.** 그 서버의 연결이 곧바로 다시 연결합니다(M2). 지터 없이 같은 간격이면 한 순간에 몰리고, 지터를 두면 흩어집니다(M7). 다시 연결한 앱은 `Last-Event-ID` 로 놓친 것만 받습니다(M7 · M24).

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 얻는 것 | 잃는 것 | 근거 |
| --- | --- | --- | --- |
| A. 요청한 서비스가 발송사를 바로 호출 | 부품이 적고 지연이 짧음 | 몰림을 받아 줄 곳이 없고 발송사의 지연 · 장애가 호출한 서비스로 번짐. 재시도도 서비스마다 따로 | LINE 2019(M4): 0시의 연결 몰림이 푸시 부품의 full GC 로 이어져 큐가 차고 푸시를 잃음 |
| B. 큐 하나 + 작업자 + 횟수만 정한 재시도 | 몰림을 큐가 받음, 실패를 다시 시도 | 캠페인 뒤에서 급한 알림이 기다림(5절 1번), 재시도가 할당량을 다 씀(5절 3번) | M10 절 제목, M5 사건 |
| C. 우선순위 큐 + 응답별 재시도 · 실패 큐 + 할당량 몫 + SMS 이중화와 차단기 + 중복 방지 키 + 장기 연결(추천) | A · B 의 빈틈 | 부품이 많음, 큐 · 알림 저장소의 보존은 가정, 발송사 호출의 중복 창이 남음(4-6), 차단기는 시험하기 어려움(M26) | M8 · M4 · M6 · M5 · M7 |
| D. 정확히 한 번(발송사 호출까지 한 트랜잭션) | 겹침 0 | 외부 시스템이 협력해야 함 — 발송사가 그런 장치를 주지 않음(판단) | M23 |
| E. 장기 연결만 | 발송사 할당량을 쓰지 않고 지연이 짧음 | 앱이 꺼져 있으면 받지 못함, 연결 서버를 따로 운영 | M2 · M7(모바일 앱은 아직 SSE 도입 전) |

- 전환점 후보(판단): 캠페인 크기가 할당량 안에서 정한 시간을 넘길 때(3절 4번) — 할당량 증설 요청이나 캠페인 시간 분산. 발송사 장애가 잦아 사람의 판단이 늦을 때 — 자동 전환(M6 의 계획). 장기 연결 사용자가 많아질 때 — 서버 한 대당 연결과 재연결 몰림의 저울질(M2). 요청한 서비스의 재시도 기간이 길어질 때 — 중복 방지 키의 기억 기간.
- FCM 할당량을 늘려 달라는 요청의 상한(검색 요약에는 +25%)은 원문에서 확인하지 못했습니다(확인 안 함).

## 7. 실제 사례 절에 쓸 대응표

| 사례(시점) | 고른 것 | 숫자 | 본문에 쓸 때 주의 |
| --- | --- | --- | --- |
| Uber(2022-08) | SSE 에서 gRPC 양방향 스트림으로, 같은 스트림으로 즉시 확인 응답, 문제 시 SSE 로 되돌림 | 옛 구조 확인 응답 30초 묶음 · heartbeat 4초 · 재연결 7초, 새 구조 heartbeat 5초, 성공률 최소 1 ~ 2% 상승 | 앱과 Uber 서버 사이의 연결이지 APNs · FCM 폴백이 아님 |
| Netflix Pushy(2024-09) | WebSocket 연결 유지, 직접 전달은 상태 코드로 결과를 돌려줌 | 평균 20만 연결 · 여유 40만 · 옛 6만, 초당 30만 도달 · 평균 16만 + 5만, 99.999% | 99.999% 의 정의 없음, 백만 대 재연결은 가정 문장 |
| LINE(2020-04 글, 2019 사고) | 차단기, 역할별 알림 큐 분리 | 숫자 없음(원문에 TPS 라는 말만) | 푸시 전용 글이 아니라 메시징 서버 전체의 연말 대비 |
| LY Pushsphere(2025-11) | 재시도할 때 실패한 엔드포인트를 피함, 할당량을 보고 재시도, 차단기와 엔드포인트 교체 | 요구 40만 QPS, 알람 연 30건 이상에서 2025 년 4건 | 발송사 간 전환이 아님 |
| 우아한형제들 SMS(2022-03) | SMS 발송사 둘, 설정 서버로 비율 바꾸기, 사람이 판단해 전환 | 설정 읽기 10초, 비율 예시 51:49, 전환 100% | 차단기 · 큐 · 중복 방지 없음, 자동 전환은 계획 |
| 우아한형제들 SSE(2025-10) | SSE + Kafka, 파트너별 파티션, 이력 보관과 `Last-Event-ID`, 중요 이벤트 확인 | 일평균 약 4천만 건 | PC 클라이언트에만 적용, 보관 기간 없음 |
| LinkedIn ATC(2018-03) | 높은 우선순위 Kafka 토픽, 이미 처리한 요청 버리기, 위쪽 서비스 속도 제한 | 하루 10억 건 넘게 | 중복 판단 키 · 기억 기간 없음 |
| Discord(2016-12) | 받는 쪽이 요청할 때만 넘김, 넘치면 버림 | FCM XMPP 연결당 대기 100 | 「Obviously a few notifications were dropped.」 — 버림을 인정. 지금의 FCM 과 연결 방식이 다름 |
| Hello Interview(2026-07, 교육용) | 공개 부분은 요구와 질문만 | 하루 1천만 · 초당 100 · 5,000(50배) · 1백만을 5분 | 회사 값이 아님, 본문 유료 |

- 이 사례들이 가이드의 선택을 대신 정당화하지 않습니다. 각 선택의 이유는 규모 추정과 시나리오 출력이 댑니다(판단, 앞 편과 같은 원칙).

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 앞 편과 같은 틀입니다.
- 대역: 알림 API(중복 방지 키 → 처음 결과), 알림 저장소(알림마다 상태 — 받음 · 보냄 · 실패 큐), 우선순위 큐(급함 · 보통 · 캠페인), 채널 작업자 W 개, 발송사 대역(초당 처리량, 분 단위 할당량 토큰, 실패 구간, 응답 200 · 429 · 500 · 410), SMS 발송사 둘, 차단기(실패율 기준 · 열림 대기 시간 · 반열림 시험 수), 실패 큐, 장기 연결 서버(연결 수 · 이벤트 이력 · `Last-Event-ID`).
- 고정할 출력 후보는 이렇습니다.
  - 급한 알림이 발송사에 넘겨지기까지 걸린 시간(큐 하나 대 우선순위 큐)과 캠페인이 끝난 시각
  - 재시도 몫이 있을 때와 없을 때 받은 429 수, 새 요청이 성공한 수
  - 차단기가 열리고 반열리고 닫힌 시각, A · B 로 보낸 수
  - 작업자가 멈춘 뒤 두 번 나간 수와 그 가운데 기기에서 합쳐진 수, 실패 큐로 간 수, 지운 토큰 수
  - 연결 서버가 멈춘 뒤 다시 연결한 시각의 분포(지터 유무), `Last-Event-ID` 로 다시 보낸 수
- 세 언어 출력의 글자 단위 일치를 위해 시각은 정수 밀리초로 찍고, 지터는 정해진 씨앗의 정수 의사 난수로 만듭니다(명세 SD26).
- **이름표(앞 편에서 되먹임).** S15 는 「표시」라는 낱말을 두 뜻으로 써서 4라운드에 지적받았습니다. 이 편은 처음부터 이름을 가릅니다(판단).

| 이름 | 뜻 | 헷갈리기 쉬운 것 |
| --- | --- | --- |
| 우선순위 | 우리 큐에서 무엇을 먼저 꺼낼지 | 발송사 긴급도(`apns-priority` · FCM `priority`) |
| 발송사 긴급도 | 기기에서 언제 깨워 보여 줄지(발송사의 값) | 우선순위 |
| 중복 방지 키 | 요청한 서비스가 만든 키, 알림 API 가 같은 요청을 한 번만 받게 함 | 접기 ID, 알림 ID |
| 접기 ID | `apns-collapse-id` · `collapse_key`, 기기에서 같은 알림을 하나로 합침 | 중복 방지 키 |
| 알림 ID | `apns-id`, 추적용 | 중복 방지 키 |
| 재시도 | 작업자가 발송사에 다시 보냄 | 다시 연결(장기 연결) |
| 실패 큐 | 정한 횟수를 넘긴 알림이 가는 곳 | 재시도 대기(지연을 두고 큐에 다시 넣은 것) |
| 발송사 | APNs · FCM · SMS 대행사 · 이메일 발송사 | 엔드포인트(한 발송사 안의 주소) |

- 「(판단)」 문장은 변형 실행으로 확인할 수 있게 설정값(재시도 몫 · 차단기 기준 · 가시성 시간 · 지터 폭)을 상수로 둡니다. 앞 편에서 판단 문장이 같은 글의 변형 실행과 반대로 말해 게이트에서 지적받았습니다.

## 9. 미해결 질문

1. 사례 목록의 XU1(책)은 열어 보지 않았습니다.
2. Hello Interview 의 본문(받은 알림을 잃지 않는 방법, 캠페인 중 급한 알림 5초, 적어도 한 번 위의 중복 방지)은 유료라 보지 못했습니다.
3. SMS 발송사 사이의 자동 전환 기준을 숫자로 적은 1차 글을 찾지 못했습니다(M6 은 계획).
4. 이메일 발송사의 장애와 이중화를 다룬 1차 글을 찾지 못했습니다.
5. 중복 방지 키의 저장소와 기억 기간을 적은 기업 글을 찾지 못했습니다(M8 도 키를 적지 않음).
6. Netflix 99.999% 의 정의와 측정 기간은 글에 없습니다.
7. FCM 429 에 대한 두 문서(M13 · M14)의 안내 가운데 어느 쪽이 우선인지 문서가 정하지 않습니다.
8. SQS 실패 큐로 옮겨지는 경계(받은 횟수가 `maxReceiveCount` 에 이르면인지 넘으면인지)는 두 문서의 문장이 다릅니다.
9. FCM HTTP v1 의 `high` · `normal` 이 APNs 의 `apns-priority` 에 어떻게 대응하는지는 확인하지 못했습니다.
10. AWS Architecture Blog 의 「Exponential Backoff And Jitter」 원문은 열리지 않았습니다.
11. 국내(토스 · 카카오 · 당근 · 쿠팡 · 네이버)의 대량 푸시 발송 1차 글은 이번 검색에서 찾지 못했습니다.
12. 요구 표의 하루 1천만 건 · 50배 · 급한 알림 5초 · 앱이 열려 있을 때 1초 · 동시 접속 1천만은 가정입니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-23 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트(Apple 문서는 같은 문서의 JSON 데이터, FCM 문서는 같은 문서의 마크다운 판, RFC 는 텍스트 판)에서 문자열을 찾은 것이고, 따옴표 모양 · 공백 · 백틱 · 밑줄 · 줄표 · 합자만 맞췄습니다. 「조사 워커 원문」은 조사 워커가 원문에서 옮겼으나 이 노트가 다시 찾지 않은 것입니다. 대조는 두 번 했습니다. 먼저 조사 워커가 옮긴 인용 후보 109개를 대조해 108개가 맞았고, 맞지 않은 하나(AWS 의 차단기 문장)는 원문에서 문장 중간의 구절이라 범위를 바로잡았습니다(4-5). 노트를 쓴 뒤에는 노트 안의 「…」 가운데 12자 이상인 서로 다른 143개를 모두 뽑아 원문 33편 전체에서 찾았고 136개가 맞았습니다. 나머지 7개는 원문 인용이 아닌 자리입니다(이 노트가 묶어 쓴 말 넷, 파일럿 회고 노트의 문장 하나, 열리지 않은 글의 제목 하나, 그리고 조사 워커가 전한 InfoQ 의 동사 「regularly handles」 — 마지막 것은 원문에 없어 M3 행을 정정함). 「글에 없음」은 원문 텍스트에서 낱말을 세어 0개일 때만 적었습니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 같은 글 안의 다른 값 · 대상 · 동사 · 「없음」을 확인한 낱말 |
| --- | --- | --- | --- |
| M1 Uber | 글자 그대로 | 30초 동안 전달 상태 모름 · 배차 제안 30초 유효 · 다시 보낼 수 없음 · heartbeat 4초 · 재연결 7초 · 확인 응답 30초 묶음 · gRPC 즉시 확인 · SSE 로 되돌림 · 성공률 최소 1 ~ 2% | heartbeat 4초(옛 SSE)와 5초(gRPC 응답 모델)는 다른 구조. 우선순위는 계획(「We would like to prioritize」). `duplicate` · `at least once` · `idempot` · `retry` · `Last-Event-ID` 0개 |
| M2 Netflix Pushy(Medium 의 원 글) | 글자 그대로 | 연결 수억 · 초당 30만 도달 · 평균 16만 + 5만 · 평균 20만 연결과 여유 40만 · 옛 6만 · 30분쯤마다 재연결 · 멈춘 서버의 기기는 곧바로 재연결 · 직접 전달의 상태 코드 · 지연 중앙값 1ms 아래 p99 4ms 아래 | 99.999% 가 세 동사(「steady」 · 「over the last few months」 · 「regularly average」). 백만 대 재연결은 「We could have a million connections per instance, but」의 가정. `retries` · `duplicate` 0개 |
| M3 InfoQ, Netflix Pushy | 글자 그대로 | 2차 요약의 존재 | 원 글의 문장 「it regularly reaches 300,000 messages sent per second」를 그대로 인용함. 조사 워커는 InfoQ 가 동사를 「handles」로 바꿨다고 전했으나 본문에 그런 문장이 없음(정정 2026-11-23 — 「handles」는 제목의 연결 수 쪽에만 있음). 본문은 M2 를 씀 |
| M4 LINE 연말 대비 | 글자 그대로 | 짧은 시간의 지수적 증가 · 2019 푸시 큐가 차서 잃음 · 원인(0시 연결 몰림 · full GC) · 차단기 · 역할별 큐 분리 · 여러 경로로 다시 시도해 잃지 않게 설계 | 숫자 없음. `duplicate` · `priority` · `rate limit` · `Kafka` 0개 |
| M5 LY Pushsphere | 글자 그대로(유니코드 정규화 뒤) | 수배 ~ 수십배 · 지진 · 40만 QPS 요구 · 할당량 · 재시도 3 하드코딩과 리전 장애 사건 · 할당량을 보고 재시도 · 차단기와 엔드포인트 교체 · 알람 30건 이상에서 4건 · 실패율 0에 가까움 | 40만은 요구 사항. 원문이 한글 분해형이라 정규화가 필요했음. `중복` · `우선순위` · `재시도 간격` · `백오프` 0개 |
| M6 우아한형제들 SMS 이중화 | 글자 그대로 | 2021-06-18 · 2021-10-19 장애 · A 장애 시 B 로만 · 동시 처리량을 넘으면 50:50 · 설정 10초 읽기 · 100% 전환 · 사람이 판단 · 기준을 정하기 어려움 | 50:50 은 요구로 적은 문장. `서킷` · `circuit` · `중복` · `유실` · `큐` 0개. 「재시도」 1개는 설정 서버 방식 비교 문장 |
| M7 우아한형제들 SSE | 글자 그대로 | 순서 역전 · 유실 가능성 인정 · 파트너별 파티션 · 이력 보관 · `Last-Event-ID` 재전송 · 재시도 · 받음 확인 · 지터 · 수십 ms 증가 허용 · WebSocket 대신 SSE · 일평균 약 4천만 | 일평균(최대 아님). `멱등` · `보관 기간` · `TTL` · `우선순위` 0개. Redis 는 검토한 다른 방식의 단점에만 나옴 |
| M8 LinkedIn ATC | 글자 그대로 | 위쪽 서비스 속도 제한 · 높은 우선순위 Kafka 토픽 · 이미 처리한 요청 버리기 · 하루 10억 건 넘게 | `throttl` · `frequency cap` · `dedup` · `idempot` 0개 |
| M9 Discord | 글자 그대로 | FCM XMPP 연결당 대기 100 · 받는 쪽이 요청할 때만 넘김 · 일부 알림을 버림 | 2016 년, 지금의 FCM 과 연결 방식이 다름. `dedup` · `duplicate` 0개 |
| M10 Hello Interview | 글자 그대로(공개 부분) | 플랫폼의 정의 · 하루 1천만 · 초당 약 100 · 1백만을 5분 · 초당 5,000(50배) · 깊이 들어가는 절 제목 셋 | 교육용 가정, 본문 유료 |
| M11 · M12 APNs 문서 | 글자 그대로(JSON 데이터) | `apns-id` 정의 · 접기 ID · 긴급도 10 · best-effort 순서 바뀜 · 제한 · 저장 · 전달 안 될 수 있음 · 만료는 보장 없음 · 연결 재사용 · 상태 코드 표 · 사유 문자열 표(400 · 403 행 포함) · 재시도 규칙 | 조사 워커는 400 · 403 행을 「확인 안 함」으로 뒀으나 원문 표에 있음. `dedup` · `duplicate` · `idempot` 0개 |
| M13 FCM 오류 코드 | 글자 그대로(마크다운 판) | `UNAVAILABLE` 세 요구 · 할당량 초과 1분 · `UNREGISTERED` 토큰 지우기 | M14 와 429 안내가 다름 |
| M14 FCM 대규모 발송 권고 | 글자 그대로(마크다운 판) | 몰림이 혼잡의 가장 큰 원인 · 오류별 처리 · 최소 10초 · 기본 60초 · 10초 타임아웃 · 지터 · 오래된 요청은 버림 · 할당량 토큰 | 갱신 2026-11-18. `503` 0개(503 은 M13 에만) |
| M15 FCM 제한과 할당량 | 글자 그대로(마크다운 판) | 기본 분당 60만 · 분은 시계와 맞지 않음 · 기기당 분 240 · 시간 5,000 · 접기 20 과 3분에 1 · 모두 전달이 목표이나 늘 좋은 경험은 아님 | M14 의 「Quota Tokens」와 단위 표현이 다름 |
| M16 · M17 · M18 FCM 수명 · 긴급도 · REST 문서 | 글자 그대로 | TTL 0 ~ 28일 · `high` 는 즉시 시도 · 오용 시 낮춰짐 · `collapse_key` 는 마지막 것만 | REST 문서 갱신 2026-10-28 |
| M19 ~ M22 SQS 문서 | 글자 그대로 | 가시성 시간 기본 30초 · 최대 12시간 · 다시 보임 · 절대적 보장 없음 · 표준 큐 적어도 한 번 · 실패 큐 기본 10 · FIFO 5분 중복 제거 · 지운 뒤에도 ID 추적 | 실패 큐 경계 문장이 두 문서에서 다름. 표준 큐 문서에 `deduplication` 0개 |
| M23 Kafka 설계 4.4 | 글자 그대로 | 적어도 한 번의 정의와 기본값 · 멱등 생산자는 로그 안 · 외부 시스템은 협력 필요 | 4.1 판도 같은 정의(조사 워커 원문) |
| M24 HTML 표준 SSE | 글자 그대로 | `Last-Event-ID` 헤더 · 다시 연결은 몇 초쯤(구현이 정함) · 204 로 멈춤 | Living Standard(조사 워커가 본 갱신일 2026-11-22) |
| M25 RFC 6455 | 조사 워커 원문 | 양방향 통신 정의 | 본문에 쓰면 다시 대조 |
| M26 AWS Builders' Library | 글자 그대로 | 과부하 때 재시도가 악화 · 지터의 이유 · 차단기의 단점 · 토큰 버킷으로 재시도 제한 | 차단기 문장은 「Unfortunately,」 뒤의 구절 |
| M27 Resilience4j 차단기 | 글자 그대로 | 닫힘에서 열림 · 열림에서 반열림 · 반열림에서 닫힘(기준 아래) · 다시 열림(기준 이상) | 조사 워커는 반열림 뒤의 전이를 「확인 안 함」으로 뒀으나 원문에 있음 |

## 11. 출처

조회일은 모두 2026-11-23 입니다.

- M1. [Uber — Uber's Next Gen Push Platform on gRPC](https://www.uber.com/blog/ubers-next-gen-push-platform-on-grpc/) — 2022-08-16
- M2. [Netflix Technology Blog — Pushy to the Limit: Evolving Netflix's WebSocket proxy for the future](https://netflixtechblog.com/pushy-to-the-limit-evolving-netflixs-websocket-proxy-for-the-future-b468bc0ff658) — 2024-09-10(이 주소는 403 이라 같은 글의 Medium 주소 `medium.com/netflix-techblog/…` 로 받음)
- M3. [InfoQ — Netflix's Pushy: Evolution of Scalable WebSocket Platform That Handles 100Ms Concurrent Connections](https://www.infoq.com/news/2024/09/netflix-pushy-websocket) — 2024-09-23(M2 의 2차 요약)
- M4. [LINE Engineering — How LINE messaging servers prepare for New Year's traffic](https://engineering.linecorp.com/en/blog/how-line-messaging-servers-prepare-for-new-years-traffic/) — 2020-04-14
- M5. [LY Corporation Tech Blog — Pushsphere: LINE 메신저의 빠르고 신뢰할 수 있는 대량 푸시 알림 비법](https://techblog.lycorp.co.jp/ko/pushsphere-reliable-and-prompt-high-volume-push-notification) — 2025-11-13(페이지 메타데이터)
- M6. [우아한형제들 기술블로그 — 메시지 발송 이중화 여정기](https://techblog.woowahan.com/7724/) — 2022-03-16
- M7. [우아한형제들 기술블로그 — Server-Sent Events로 실시간 알림 전달하기](https://techblog.woowahan.com/23199/) — 2025-10-24
- M8. [LinkedIn Engineering — Air Traffic Controller: Member-First Notifications at LinkedIn](https://www.linkedin.com/blog/engineering/messaging-notifications/air-traffic-controller-member-first-notifications-at-linkedin) — 2018-03-01
- M9. [Discord — How Discord handles push request bursts of over a million per minute with Elixir's GenStage](https://discord.com/blog/how-discord-handles-push-request-bursts-of-over-a-million-per-minute-with-elixirs-genstage) — 2016-12-12
- M10. [Hello Interview — Notification System](https://www.hellointerview.com/learn/system-design/problem-breakdowns/notification-system) — 2026-07-28(페이지 메타데이터, 교육용 분석, 본문 일부 유료)
- M11. [Apple — Sending notification requests to APNs](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns) — 날짜 표시 없음
- M12. [Apple — Handling notification responses from APNs](https://developer.apple.com/documentation/usernotifications/handling-notification-responses-from-apns) — 날짜 표시 없음
- M13. [Firebase Cloud Messaging 문서 — REST error codes for the HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/error-codes) — 날짜는 마크다운 판에 없음
- M14. [Firebase Cloud Messaging 문서 — 대규모 발송 권고(scale-fcm)](https://firebase.google.com/docs/cloud-messaging/scale-fcm) — 갱신 2026-11-18
- M15. [Firebase Cloud Messaging 문서 — 제한과 할당량(throttling-and-quotas)](https://firebase.google.com/docs/cloud-messaging/throttling-and-quotas) — 날짜는 마크다운 판에 없음
- M16. [Firebase Cloud Messaging 문서 — 메시지 수명(setting-message-lifespan)](https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-lifespan) — 날짜는 마크다운 판에 없음
- M17. [Firebase Cloud Messaging 문서 — Android 메시지 긴급도(android-message-priority)](https://firebase.google.com/docs/cloud-messaging/android-message-priority) — 날짜는 마크다운 판에 없음
- M18. [Firebase — REST Resource: projects.messages](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages) — 갱신 2026-10-28
- M19. [Amazon SQS — Visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) — 날짜 표시 없음
- M20. [Amazon SQS — Standard queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html) — 날짜 표시 없음
- M21. [Amazon SQS — Using dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) · [CreateQueue API](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_CreateQueue.html) — 날짜 표시 없음
- M22. [Amazon SQS — Exactly-once processing](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html) · [Message deduplication ID](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/using-messagededuplicationid-property.html) — 날짜 표시 없음
- M23. [Apache Kafka 4.4 — Design, Message Delivery Semantics](https://kafka.apache.org/44/design/design/) — 날짜 표시 없음
- M24. [WHATWG HTML Standard — Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) — Living Standard
- M25. [RFC 6455 — The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455) — 2011-12
- M26. [AWS Builders' Library — Timeouts, retries, and backoff with jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter) — 2019-12-05
- M27. [Resilience4j — CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker) — 날짜 표시 없음

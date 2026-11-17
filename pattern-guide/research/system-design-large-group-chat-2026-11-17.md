# 리서치 노트 — 대형 그룹 채팅: 한 방의 메시지를 수십만 연결에, 같은 순서로, 놓치지 않게

- 조사일: 2026-11-17. 자료 조사는 조사 워커 둘이 했고(기업 기술 글과 제품 문서 · 런타임과 메시징의 공식 문서), 본문에 실을 만한 인용과 수치는 같은 날 원문 페이지를 다시 받아 문자열을 맞췄습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 넷째 편(`large-group-chat`, 사례 목록 [RT-03](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S10 의 산출물입니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `G` 로 시작합니다(앞 노트의 `V` · `C` · `L` · `P` · `T` 와 겹치지 않게). 사례 목록 RT-03 행의 B2 · B3 · B4 · B11 은 이 노트의 G1 · G2 · G6 · G7 입니다.
- 같은 계열의 앞 편 [라이브 동시 시청자 수](../system-design-guide/live-viewer-count/live-viewer-count-guide_v1.1.1.md)(RT-01)가 Discord 의 N² 수치와 수동 연결 비율을 이미 인용했습니다(그 노트의 V22). 이 편은 같은 글에서 **방 프로세스 · relay · 수동 연결**의 구조를 꺼내고, 시청자 수 편에 없던 **방 단위 순서와 놓친 메시지 따라잡기**를 더합니다.
- 인용마다 원문의 절 이름을 적었습니다. 한 글의 서로 다른 절을 한 흐름으로 잇지 않기 위해서입니다(앞 노트 CT-05 의 교훈).

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 방 프로세스 · 4-2 중계 계층 · 4-3 수동 연결 · 4-4 방 단위 순서 · 4-5 놓친 메시지 따라잡기 · 4-6 전달 보장과 저장) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 요구 후보 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

한 방의 인원이 커지면 메시지 하나를 모두에게 보내는 일이 인원에 비례해 늘고, 모두가 말하면 제곱으로 늡니다. Discord 는 이것을 「If a server has 1000 people online, and they all were to say "I love jello" once, that's 1 million notifications.」, 「The same thing with 10,000 people is 100 million notifications.」, 「With 100,000 people that's 10 billion notifications to deliver!」로 적습니다(G1, 절 Elixir as a fanout system). 같은 글의 도입부는 Midjourney 서버를 「over 10 million members, of whom over 1 million are online」이라고 소개합니다(G1).

공개 사례가 보인 해법은 넷입니다.

1. **방마다 순서를 정하는 한 곳** — Discord 는 「We use a single Elixir process per guild as a central routing point for everything happening on that server」(G1, 절 Elixir as a fanout system), Slack 은 채널마다 담당 서버를 일관 해싱으로 정합니다(G6, 절 Server overview).
2. **fan-out 을 중간 계층으로 나눔** — Discord 의 relay(「We handle up to 15,000 connected sessions per relay.」, G1 절 Relays), Slack 의 Channel Server → Gateway Server(G6), Twitch 의 Pubsub → Edge(G7 · G9).
3. **보고 있지 않은 연결에는 덜 보냄** — Discord 의 수동(passive) 연결, 큰 서버 연결의 약 90%(G1, 절 Passive sessions).
4. **순번과 따라잡기** — Discord 게이트웨이의 시퀀스 번호와 재개(G5), Telegram 채널의 `pts` 와 `getChannelDifference`(G11). 전달 경로는 최대 한 번이므로(Phoenix G15 · Redis Pub/Sub G16) 놓친 것은 저장한 이력에서 다시 읽습니다.

이 노트의 추천 구조(판단)는 **방마다 프로세스 하나가 메시지에 방 단위 순번을 붙여 방 로그에 쓴 뒤 relay 들에만 보내고, relay 가 연결된 세션 가운데 보고 있는(active) 세션에만 보내며, 보고 있지 않은(passive) 세션과 끊겼던 세션은 마지막으로 받은 순번 이후를 방 로그에서 읽어 따라잡는다**입니다. 근거와 버린 후보는 6절에 있습니다.

## 2. 요구사항 절에 쓸 근거 — 「큰 방」과 「빨리 · 같은 순서로」를 숫자로

| 값 | 원문 | 대상 · 시점 | 출처 |
| --- | --- | --- | --- |
| 한 서버 온라인 100만 명 이상 | 「Midjourney, which has over 10 million members, of whom over 1 million are online」 | Discord 의 Midjourney 서버, 2023 | G1 도입부 |
| relay 하나가 맡는 세션 | 「We handle up to 15,000 connected sessions per relay.」 | Discord, 2023 | G1 절 Relays |
| relay 로 다룬 규모 | 「handling communities in the hundreds of thousands of members」 | relay 도입 직후(같은 글 도입부의 100만 명과 다른 문맥, 설명 없음) | G1 절 Relays |
| 수동 연결 비율 | 「around 90% of user-guild connections in large servers were passive, resulting in the fanout work being 90% less expensive!」 | Discord 큰 서버 | G1 절 Passive sessions |
| 수동 연결의 효과 | 「a 10x reduction in work gives us a ~3x win in maximum community size」 | 같은 절 | G1 |
| relay 이전 지연 | 「publishing an event from a large guild could take anywhere from 900ms to 2.1s!」 · 「up to 30,000 concurrent users」 | Discord 2017, 피크 시간 | G2 절 Message Fanout |
| 세계 전달 지연 | 「our system delivers messages across the world in 500ms.」 | Slack | G6 절 What's next |
| 그룹 인원 상한 | 「Telegram groups can have up to 200,000 members each」 · 채널은 「a channel can have an unlimited number of subscribers」 | Telegram 제품 사양 | G10 |
| 오픈채팅 인원 | 「グループトークには最大5,000人まで参加が可能です」, 메인 토크룸 5,000명 → 10,000명 확장 신청 | LINE 오픈채팅 | G12 |

- WhatsApp 의 그룹 1,024명 · 커뮤니티 2,000명은 조사 워커가 공식 도움말에서 봤지만 이 노트는 원문 페이지를 받지 못했습니다(HTTP 400). 직접 인용하지 않습니다.
- 카카오톡 오픈채팅의 상한을 규정한 공식 문장은 찾지 못했습니다(확인 안 함).
- Discord 는 순서 요구를 「Discord clients depend on linearizability of events.」라고 적습니다(G2, 절 Message Fanout). 순서를 어떻게 지키는지는 그 글에 없습니다.
- **요구 표 후보(가정)**: 한 방 온라인 100만 명(G1 의 Midjourney 를 근거로 한 가정), 방 전체 메시지는 피크에 초당 20건(가정). 보고 있는 사람에게는 메시지가 1초 안에 도착(가정 — Slack 의 「500ms」와 Discord 2017 의 900ms~2.1s 사이). 같은 방의 메시지는 모든 사람에게 같은 순서로 보인다. 연결이 끊겼다 돌아온 사람과 방을 다시 연 사람은 놓친 메시지를 빠짐없이 순서대로 받는다. 방 하나의 처리가 한 기계(한 코어)의 한계에 묶이지 않는다.
- 위 가운데 「놓친 메시지를 빠짐없이」는 전달 경로가 최대 한 번이라는 문서(G15 · G16)에서 나오는 문제 쪽 요구이고, 고른 구조에 맞춰 넣은 것이 아닙니다(판단). 가이드는 요구 표를 결정 전에 고정합니다.

## 3. 규모 추정 절에 쓸 계산

출처 수치는 Discord(G1 · G2)와 Slack(G6)이고, 나머지는 가이드의 가정과 그 계산입니다.

1. 제곱 증가: 온라인 N 명이 한 번씩 말하면 전달은 N × N 건입니다(G1 의 1,000명 → 100만 건을 일반화, 계산). 100만 명이면 1조 건입니다(계산).
2. 방 메시지 초당 20건(가정) × 온라인 100만 명 = 초당 2,000만 전달입니다(계산). 방 프로세스 하나가 연결마다 직접 보내면 이 2,000만 번의 전송을 한 프로세스가 합니다(계산).
3. relay 수: 100만 ÷ 15,000(G1) ≈ 67개(계산). 방 프로세스는 메시지 하나에 relay 67곳으로만 보내므로 초당 20 × 67 = 1,340 번입니다(계산).
4. 수동 연결: 90%(G1) 가 수동이면 보고 있는 사람은 10만 명이고, relay 들이 실제로 보내는 것은 초당 20 × 10만 = 200만 건입니다(계산). relay 하나는 초당 약 3만 건입니다(200만 ÷ 67, 계산).
5. 따라잡기 양: 방을 1시간 열지 않은 사람이 들어오면 20 × 3,600 = 72,000 건이 쌓여 있습니다(계산). 방 로그 길이를 정하는 근거입니다 — 로그가 그보다 짧으면 앞부분은 이력 저장소에서 읽어야 합니다(판단).
6. 재연결 몰림: Discord 2017 글은 재연결이 한꺼번에 몰릴 때 문제가 생겼다고 적습니다(G2, 절 Fast Access Shared Data — 조사 워커 원문, 이 노트가 다시 찾지 않음). relay 하나가 멈추면 그 relay 의 15,000 세션이 한꺼번에 다시 붙습니다(계산).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 방 프로세스 — 방마다 하나, 순서를 정하는 자리

- Discord(G1, 절 Elixir as a fanout system): 「We use a single Elixir process per guild as a central routing point for everything happening on that server」, 「The guild process keeps track of the sessions for users who are members of that guild」. 같은 절은 서버마다 프로세스를 여럿 두지 않는 이유로 전체를 봐야 하는 일(음성 채널 사람 목록, 채널 멤버 목록)을 듭니다. 2026년 글도 「Every guild runs as an Elixir process that uses message passing to fan out actions to all connected」라고 적어 같은 구조를 말합니다(G3, 절 Elixir, and How it Powers Discord).
- Slack(G6, 절 Server overview): 「Channel Servers (CS) are stateful and in-memory, holding some amount of history of channels.」, 「Every CS is mapped to a subset of channels based on consistent hashing.」 — 방마다 프로세스가 아니라 채널을 해시로 서버에 나눠 맡깁니다.
- 프로세스가 가벼운 이유(G14, Elixir 문서 Processes): 「Processes in Elixir are extremely lightweight in terms of memory and CPU」, 그래서 「it is not uncommon to have tens or even hundreds of thousands of processes running simultaneously.」 메시지는 「When a message is sent to a process, the message is stored in the process mailbox.」
- **방 프로세스 하나의 한계(판단)**: 방 프로세스는 한 번에 메시지 하나씩 처리하므로 방 하나의 처리량은 코어 하나에 묶입니다. Discord 가 relay 절을 「One of the standard techniques for extending a single core throughput limit is to split the work across multiple threads (or processes, to use the Elixir term).」로 시작하는 이유입니다(G1, 절 Relays — 이 노트가 원문에서 읽음).

### 4-2. 중계 계층 — fan-out 을 여러 기계로 나눈다

- Discord(G1, 절 Relays): 「This idea led us to build a system called "relays" which sits between guilds and the users' sessions.」, 「Relays maintain connections to the sessions instead of the guild, and are responsible for doing fanout with permission checks.」, 「We handle up to 15,000 connected sessions per relay.」 relay 이전(2017)에는 「When anything is published in a guild, it is fanned out to every session connected to it.」였고(G2, 절 Message Fanout), 큰 서버에서 이벤트 하나에 900ms~2.1s 가 걸렸습니다(G2).
- 2017년의 다른 해법(G2, 절 Message Fanout): 자체 라이브러리 Manifold 는 보낼 대상을 노드별로 묶어 「the sending processes at most only calls send/2 equal to the number of involved remote nodes」 — 보내는 프로세스의 전송 횟수를 원격 노드 수로 줄입니다. 노드 안에서는 「groups them by number of cores, and sends them to child workers」. relay 와 같은 생각(보내는 쪽 전송 수를 연결 수가 아니라 계층 수로)입니다(판단).
- Slack(G6): 연결을 가진 Gateway Server 는 「Gateway Servers (GS) are stateful and in-memory. They hold users' information and websocket channel subscriptions.」이고 「Unlike all other servers, GSs are deployed across multiple geographical regions.」 채널 메시지는 담당 CS 가 구독 중인 GS 들에 보내고 「Each GS that receives that message sends it to every connected client subscribed to that channel id.」(절 Send a message to a million clients in real time). 연결 때 「GS then subscribes to all the channel servers that hold those channels based on consistent hashing asynchronously.」(절 Slack client set up).
- Twitch(G7, 2015, 절 Chat): 「Pubsub and Edge combine to form a hierarchical message distribution system which executes massive fanout.」 2023년 글은 Pubsub Broker 가 「it fans the message out to all edges with a subscription to the message's topic.」라고 적습니다(G9). 그 앞 시절은 「At the time, our chat system ran on a set of 8 machines, with chat channels randomly distributed across those machines.」, 큰 채널은 「Big channels would get the (then) unheard of amount of 20,000 viewers!」(G8, 절 Performance Bottlenecks).
- 세 회사 모두 「방 담당 한 곳 → 연결을 가진 여러 곳 → 연결」의 두 단계입니다. 단계 수와 단계마다의 대수는 Discord 의 relay 당 15,000 세션 말고는 공개되지 않았습니다(확인 안 함).

### 4-3. 수동 연결 — 보고 있지 않은 방에는 보내지 않는다

- Discord(G1, 절 Passive sessions): 원래는 「every user receives every action which they're allowed to see in all of their guilds」였고, 「What if we didn't send them everything until they clicked in?」라는 물음에서 「We called this a "passive" connection, and kept it in a separate list from the "active" connections that should receive all of the data.」가 나왔습니다. 결과는 「around 90% of user-guild connections in large servers were passive, resulting in the fanout work being 90% less expensive!」, 그리고 「a 10x reduction in work gives us a ~3x win in maximum community size」.
- 수동 연결을 어떻게 판정하는지, 수동 연결이 무엇을(예: 읽지 않음 표시)는 받는지는 글에 없습니다(확인 안 함). 가이드는 「클릭해 들어오기 전에는 메시지를 보내지 않고, 들어오는 순간 4-5 의 따라잡기로 받는다」로 설계합니다(판단).
- 비슷해 보이지만 다른 것: Slack 의 「A Slack client receives presence notifications only for a subset of users that are visible in the app screen at any moment.」(G6, 절 Server overview)는 접속 상태 알림 이야기입니다. Telegram API 문서의 「passively」는 「소켓으로 저절로 전달된다」는 뜻입니다(G11). 둘 다 Discord 의 수동 연결과 같은 개념으로 묶지 않습니다.

### 4-4. 방 단위 순서 — 누가 순서를 정하는가

- Erlang 의 순서 보장(G13, Erlang 참조 설명서 Processes, 절 Signals > Delivery of Signals): 「The only signal ordering guarantee given is the following:」 — 「if an entity sends multiple signals to the same destination entity, the order is preserved;」. 예시는 A 가 B 에게 S1 · S2 를 차례로 보내면 「S1 is guaranteed not to arrive after S2」. 노드 사이에서는 「When communicating over the distribution, signals can be lost if the distribution channel goes down.」 **서로 다른 송신자 사이의 순서는 보장 목록에 없습니다** — 「보장하지 않는다」를 직접 적은 문장은 없고, 「유일한 보장」에서 읽어 냅니다.
- 그래서(판단): 방 프로세스 → relay → 세션의 각 단계가 「한 송신자 → 한 수신자」이면 순서는 끝까지 유지됩니다. 메시지를 방 프로세스 하나가 먼저 받아 순번을 붙이는 것이 그 전제를 만듭니다. 두 사람이 동시에 보낸 메시지의 순서는 방 프로세스에 도착한 순서로 정해집니다.
- Kafka(G19, 4.4 Introduction, 절 Main Concepts and Terminology): 같은 키의 이벤트는 같은 파티션에 쓰이고, 「Kafka guarantees that any consumer of a given topic-partition will always read that partition's events in exactly the same order as they were written.」 — 방 id 를 키로 쓰면 방 안의 순서가 됩니다(판단). 「파티션 사이에는 순서가 없다」는 문장은 4.4 문서에서 찾지 못했습니다(확인 안 함).
- Redis Streams(G17, `XADD` 문서): 「Redis guarantees that IDs are always incremental: the ID of any entry you insert will be greater than any previous ID, so entries are totally ordered inside a stream.」
- Redis Pub/Sub(G16): 「Subscribers receive the messages in the order that the messages are published.」
- WebSocket(G18, RFC 6455 §5.4): 「Message fragments MUST be delivered to the recipient in the order sent by the sender.」 — 한 메시지의 조각 순서입니다. 「한 연결 안의 메시지 순서」를 적은 문장은 찾지 못했고, TCP 위의 프로토콜이라는 설명에서 읽는 해석입니다(조사 워커 보고, 판단).
- 순번의 실제 예: Discord 게이트웨이(G5)는 이벤트의 `s` 필드를 「the sequence number of the event, which is the relative order in which it occurred」로 정의합니다. Telegram(G11)은 채널마다 `pts` 를 둡니다. Hello Interview(G20, 교육용)는 「Each message gets a monotonically increasing sequence number per chat.」, 「Clients track the last sequence number they've seen.」
- 주의: Discord 게이트웨이 문서는 **봇 · 앱이 따르는 공개 프로토콜**입니다. Discord 내부 방 프로세스가 순번을 어떻게 붙이는지 설명한 글이 아닙니다. 가이드는 「Discord 는 내부에서 이렇게 한다」로 쓰지 않습니다.

### 4-5. 놓친 메시지 따라잡기 — 마지막 순번 이후를 다시 읽는다

- Discord 게이트웨이(G5): 끊긴 앱은 재개 요청으로 「replay any lost events starting from the last sequence number it received」를 할 수 있고, 성공하면 「the Gateway will send the missed events in order, finishing with a Resumed event」.
- Telegram(G11): 「To fetch the updates difference of a channel, updates.getChannelDifference is used.」 큰 채널에는 「in some cases the API may stop sending updates (or send fewer updates) for some channels/supergroups」 — 그때는 클라이언트가 차이를 직접 묻습니다. 어떤 조건에서 줄이는지(인원 기준 등)는 문서에서 확인하지 못했습니다(확인 안 함).
- Redis Streams(G17, `XREAD` 문서): 「Read data from one or more streams, returning only entries with an ID greater than the last received ID reported by the caller.」 그리고 「stream entries are not removed from the stream when clients are served」. 길이 제한은 `MAXLEN` 으로, 「Redis enforces this by removing the oldest entries」(`XTRIM` 문서) — 잘린 앞부분은 스트림에서 읽을 수 없습니다(판단, 이것을 직접 적은 문장은 찾지 못함).
- Phoenix(G15, Channels 가이드, 절 Fault Tolerance and Reliability Guarantees): 「Phoenix uses an at-most-once strategy when sending messages to clients.」, 「If the client is offline and misses the message, Phoenix won't resend it.」, 해법으로 「Common approaches involve persisting messages on the server and having clients request missing messages.」
- Hello Interview(G20, 교육용): 마지막으로 본 순번을 기억하다가 #5 를 받았는데 마지막이 #3 이면 #4 를 놓친 것을 안다는 「gap detection」을 들고, 그것만으로는 다음 메시지가 와야 알 수 있다는 한계도 적습니다(조사 워커 원문). 이 글은 그룹을 100명으로 제한합니다 — 「We also explicitly put a limit on the number of participants per chat to 100.」 — 그래서 수십만 명 방을 직접 다루지 않습니다.
- WebSocket(G18, RFC 6455 §7.2.3): 재연결은 「The first reconnect attempt SHOULD be delayed by a random amount of time.」 — 재연결이 한꺼번에 몰리지 않게 하는 권고이고, 놓친 메시지를 다시 받는 규정은 표준에 없습니다(조사 워커가 읽은 구간 기준, 판단).

### 4-6. 전달 보장과 저장 — 빠른 길은 최대 한 번, 정확성은 로그로

- Redis Pub/Sub(G16, 절 Delivery semantics): 「Redis' Pub/Sub exhibits at-most-once message delivery semantics.」, 「If the subscriber is unable to handle the message (for example, due to an error or a network disconnect) the message is forever lost.」 더 강한 보장이 필요하면 Streams 를 권하고 「Messages in streams are persisted, and support both at-most-once as well as at-least-once delivery semantics.」 클러스터에서는 「Sharded Pub/Sub helps to scale the usage of Pub/Sub in cluster mode.」(절 Sharded Pub/Sub, Redis 7.0 부터).
- Phoenix(G15): 위 4-5 의 최대 한 번. 클러스터 전체 방송은 「Broadcasts message on given topic across the whole cluster.」(Phoenix.PubSub `broadcast/3`), 연결마다 「One channel server lightweight process is created per client, per topic.」(Channels 가이드, 절 The Moving Parts > Overview).
- 이 노트의 설계(판단): 방 프로세스는 메시지를 **방 로그에 먼저 쓰고**(순번 확정) 그다음 relay 로 보냅니다. relay → 세션 경로에서 잃은 메시지는 세션이 다음 메시지의 순번에서 빈자리를 보거나 재연결 · 방 열기 때 로그에서 다시 읽어 채웁니다. 전달 경로를 최대 한 번으로 두는 대신 정확성은 로그와 순번이 맡습니다.

## 5. 시나리오 절에 쓸 반례와 장애

시나리오 셋(기본 · 부하 · 장애)에 넣을 수 있는 상황입니다. 모두 가상 시계와 사건 순서로 재현할 수 있습니다(판단, 앞 편과 같은 방식). SD9 에 따라 기본 흐름에는 부하도 장애도 없는 요청 하나만 둡니다.

1. **기본 — 메시지 하나가 보고 있는 사람에게 가는 길**: 사용자 A 가 메시지를 보내면 방 프로세스가 순번 n 을 붙여 방 로그에 쓰고 relay 들에 보냅니다. relay 는 그 방을 보고 있는 세션에만 보냅니다. 받는 사람은 순번 n 을 마지막 받은 순번으로 기억합니다.
2. **부하 — 큰 방에서 모두가 말할 때**: 온라인 N 명이 한 번씩 말하는 경우를 작게 줄여(예: 방 인원 수천 명, relay 여럿) 실행하면, 방 프로세스가 직접 보낼 때와 relay 로 나눌 때 방 프로세스의 전송 횟수와 마지막 전달 시각이 다르게 나옵니다. 수동 연결 비율 90% 를 넣으면 실제 전송이 10분의 1로 줄어듭니다(G1 의 비율을 모형에 넣은 것).
3. **부하의 반례 — 순서를 relay 마다 정할 때**: 메시지가 방 프로세스를 거치지 않고 각 relay 에 직접 들어가 relay 마다 순번을 붙이면, relay 가 다른 두 사람이 같은 두 메시지를 다른 순서로 봅니다(판단 — G13 의 「한 송신자 → 한 수신자」 밖).
4. **장애 — relay 하나가 멈췄다 돌아옴**: relay 가 멈춘 동안 그 relay 의 세션들은 메시지를 받지 못합니다. 세션이 다른 relay 로 다시 붙을 때 마지막 순번 이후를 방 로그에서 읽어 빠짐없이 순서대로 채웁니다. 재연결 시각을 무작위로 흩으면(G18 §7.2.3) 방 로그를 읽는 요청이 한꺼번에 몰리지 않습니다.
5. **장애의 반례 — 로그 없이 Pub/Sub 만 쓸 때**: 끊긴 동안의 메시지는 「forever lost」(G16)이고, 돌아온 세션은 무엇을 놓쳤는지조차 모릅니다(다음 메시지가 와야 빈자리를 알 수 있음, G20 의 한계).
6. **수동에서 보는 상태로 — 방을 다시 열 때**: 수동 연결이던 사람이 방을 열면 마지막 순번 이후를 로그에서 읽습니다. 1시간을 비웠으면 3절 5번의 72,000 건이 쌓여 있으므로, 로그 길이를 넘으면 최근 일부만 보여 주고 나머지는 이력 조회로 넘깁니다(판단).

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 순서를 정하는 곳 | fan-out 을 하는 곳 | 끊긴 뒤 | 근거 |
| --- | --- | --- | --- | --- |
| A. 방 프로세스가 연결마다 직접 보냄 | 방 프로세스 | 방 프로세스 하나 | 다루지 않음 | G2(900ms~2.1s) |
| B. 사용자마다 수신함(채널)에 쓰기 | 쓰는 쪽 | 보낼 때 N 곳에 씀 | 수신함에서 읽음 | G20(교육용, 100명 그룹) |
| C. 방 단위 Pub/Sub 토픽(브로커) + 게이트웨이 | 브로커 · 토픽 | 브로커 → 게이트웨이 → 연결 | 최대 한 번이라 잃음 | G6 · G7 · G9 · G16 · G15 |
| D. 방 프로세스(순번 · 로그) + relay + 수동 연결 + 로그 따라잡기 | 방 프로세스 | relay | 마지막 순번 이후를 로그에서 | G1 · G5 · G11 · G17 · G15(판단) |
| E. 클라이언트가 주기적으로 로그를 읽음(폴링) | 로그 | 없음(각자 읽음) | 다음 폴링에서 | G20(교육용, 마지막 안전장치로) |

- **추천 D(판단)**: 순서는 방 프로세스 한 곳이 정하고(4-4), fan-out 은 relay 수만큼 나뉘며(4-2), 보지 않는 연결에는 보내지 않고(4-3), 잃은 것은 로그에서 채웁니다(4-5 · 4-6).
- **A 를 버리는 이유**: Discord 가 relay 를 만든 이유 그대로입니다 — 방 프로세스 하나가 연결 수만큼 보내 30,000명 방에서 이벤트 하나에 900ms~2.1s(G2), 3절 2번의 초당 2,000만 전송(계산).
- **B 를 버리는 이유(판단)**: 메시지 하나에 수신함 N 곳을 쓰므로 쓰기가 인원에 비례합니다. Hello Interview 는 사용자별 채널로 나누면 100명 그룹에서 「the server has to publish to 99 channels」이고 큰 그룹에서는 부담이라고 적습니다(G20, 교육용 · 조사 워커 원문). 100만 명 방에는 맞지 않습니다.
- **C 와 D 의 차이(판단)**: C 도 D 처럼 두 단계 fan-out 입니다(Slack · Twitch 가 이쪽). 다른 점은 순서와 보장입니다 — 브로커의 Pub/Sub 은 최대 한 번이라(G16) 따라잡기용 로그가 따로 필요하고, 순서를 정하는 한 곳이 브로커 안에 있어야 합니다. 가이드는 D 를 「방 프로세스가 브로커 노릇까지 하는 C」로 설명할 수 있습니다. 이미 브로커를 운영하는 곳이면 C + 로그가 같은 결과를 냅니다(전환점).
- **E 를 버리는 이유(판단)**: 폴링 주기만큼 늦고(요구의 1초를 지키려면 1초마다 100만 명이 읽음), 보지 않는 사람도 계속 읽습니다. 마지막 안전장치로는 둘 수 있습니다(G20 이 그렇게 씀).
- **전환점(판단)**: 방 인원이 relay 하나가 맡는 수(15,000, G1)보다 작으면 relay 없이 A 로 충분합니다(Discord 2017 의 「groups of 25 of less」(원문 철자 그대로)에서 출발해 큰 방이 생기며 바꿈, G2). 방 하나의 메시지가 코어 하나의 처리량을 넘으면(4-1) 방 프로세스도 나눠야 하는데, 그러면 순서를 정하는 한 곳이 사라지므로 방을 하위 채널로 나누는 제품 결정이 함께 필요합니다. 이미 Kafka 같은 로그를 운영하면 방 id 를 파티션 키로 써서 로그와 순번을 그쪽에 맡길 수 있습니다(G19).

## 7. 실제 사례 절에 쓸 대응표

| 회사 | 무엇을 했나 | 이 가이드의 어느 자리 | 출처 |
| --- | --- | --- | --- |
| Discord | 서버(길드)마다 Elixir 프로세스 하나, relay 가 세션과 연결 · 권한 확인 · fan-out(relay 당 15,000), 수동 연결 약 90%, 온라인 100만 명 서버 | 방 프로세스 · 중계 · 수동 연결 | G1 · G3 |
| Discord(2017) | 길드가 모든 세션에 직접 fan-out, 30,000명에서 900ms~2.1s, Manifold 로 원격 노드 수만큼만 send, 클라이언트는 이벤트의 선형성에 의존 | 대안 A · 순서 요구 | G2 |
| Discord 게이트웨이(공개 프로토콜) | 이벤트마다 시퀀스 번호, 마지막 번호부터 재개하면 놓친 이벤트를 순서대로 다시 보냄 | 따라잡기 | G5 |
| Slack | 채널을 일관 해싱으로 Channel Server 에, 지역별 Gateway Server 가 구독해 연결에 전달, 세계 500ms | 대안 C · 중계 | G6 |
| Twitch | Pubsub 과 Edge 의 계층 fan-out, 하루 메시지 「over 10 billion」(2015 같은 글의 다른 절은 「hundreds of billions」), 8대에 채널을 무작위로 나누던 시절 | 대안 C · 중계 | G7 · G8 · G9 |
| Telegram | 그룹 20만 명 · 채널 무제한, 채널마다 `pts`, `getChannelDifference` 로 차이 조회, 큰 채널은 업데이트를 줄일 수 있음 | 요구 · 따라잡기 | G10 · G11 |
| LINE | 오픈채팅 5,000명, 메인 토크룸 10,000명 확장 신청 | 요구 | G12 |

- Twitch 2015 글은 하루 메시지 수를 절마다 다르게 적습니다 — 절 Engineering at Scale 은 「Our chat service delivers over 10 billion messages a day.」, 절 Chat 은 「It delivers hundreds of billions of messages per day to users who are watching video via our own protocols」. 설명 문장이 없으므로 둘 다 적거나 쓰지 않습니다.
- Slack 은 호스트당 채널 수를 절 Server overview 에서 「At peak times, about 16 million channels are served per host.」, 절 What's next 에서 「Our servers serve tens of millions of channels per host」로 다르게 적습니다.
- 한국 메신저(카카오톡 · LINE 한국)의 대형 방 fan-out 기술 글은 찾지 못했습니다.

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 앞 편과 같은 틀입니다.
- 방 프로세스 · relay · 세션은 각자 사건 큐(메일박스)를 가진 대역으로 두고, 「한 송신자 → 한 수신자」 사이의 메시지는 보낸 순서대로 도착하게 합니다(G13 의 보장을 모형에 넣음). 서로 다른 relay 로 가는 지연은 relay 마다 다르게 줘서 도착 시각이 갈리게 합니다.
- 방 로그는 (순번, 메시지) 배열과 최대 길이로 두고, 따라잡기는 「마지막 순번 이후를 읽는 함수」 하나로 둡니다(G17 의 `XREAD` 와 같은 모양).
- 수동 연결은 세션의 상태(active · passive) 하나로 두고, relay 는 active 세션에만 보냅니다.
- 고정할 출력 후보: 방 프로세스의 전송 횟수(직접 vs relay), 마지막 전달 시각, 수동 90% 일 때 실제 전송 수, relay 마다 순번을 붙인 반례에서 두 사람이 본 순서, relay 장애 뒤 따라잡은 개수와 빠진 순번 0, Pub/Sub 만 쓴 반례에서 잃은 개수.
- 세 언어 출력의 글자 단위 일치를 위해 시각은 정수 밀리초로 찍고, 무작위가 필요하면 정해진 씨앗의 정수 의사 난수를 씁니다(판단, 명세 SD26).

## 9. 미해결 질문

1. Discord 가 수동 연결을 어떻게 판정하는지, 수동 연결이 무엇을(읽지 않음 표시 등) 받는지는 글에 없습니다.
2. Discord relay 의 대수와 방 하나에 relay 가 몇 개인지는 공개되지 않았습니다. 3절 3번의 67개는 15,000 으로 나눈 계산입니다.
3. Discord 내부에서 방 단위 순번을 어떻게 붙이는지는 공개 글에 없습니다. 게이트웨이 문서(G5)는 공개 프로토콜입니다.
4. Telegram 이 큰 채널에서 업데이트를 줄이는 조건은 확인 안 함입니다.
5. Kafka 4.4 문서에서 「파티션 사이에는 순서가 없다」는 문장은 찾지 못했습니다.
6. WhatsApp 공식 도움말(그룹 1,024명 등)은 HTTP 400 으로 이 노트가 받지 못했습니다. 카카오톡 오픈채팅 상한의 공식 문장은 찾지 못했습니다.
7. Discord 2023 글의 도입부(온라인 100만 명)와 relay 절(수십만 명)의 차이를 설명하는 문장은 없습니다.
8. 3절의 방 메시지 초당 20건 · 1시간 비움은 가정입니다. 출처를 찾으면 그 값으로 바꿉니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-17 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트에서 문자열을 찾은 것이고(따옴표 모양 · 공백 · 백틱 · 밑줄 강조만 맞춤), 「조사 워커 원문」은 조사 워커가 원문에서 옮겼으나 이 노트가 다시 찾지 않은 것입니다. 인용 후보 80개를 대조해 80개 모두 문자열이 맞았고, Discord 의 수동 연결 절과 relay 절은 이 노트가 원문을 직접 읽어 앞뒤 문장을 확인했습니다. Twitch 세 페이지는 처음 받을 때 압축된 채로 받아 대조가 틀렸고, 압축을 풀어 다시 받은 뒤 맞췄습니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 같은 글 안의 다른 값 · 대상 · 동사 |
| --- | --- | --- | --- |
| G1 Discord Maxjourney | 글자 그대로(수동 · relay · fanout 절은 원문 직접 읽음) | 길드마다 프로세스 하나 · 세션 추적 · N² 세 수치 · Midjourney 1천만 · 100만 온라인 · relay 정의 · relay 당 15,000 · 수동 연결 정의와 90% · 10배 → 약 3배 · 단일 코어 한계 | 도입부 「100만 명 이상 온라인」과 relay 절 「수십만 명」(설명 없음). relay 를 큰 서버에서만 켠다는 말은 2차 요약이라 쓰지 않음. 순서 · 따라잡기는 이 글에 없음 |
| G2 Discord Elixir 5M | 글자 그대로 | 길드가 모든 세션에 fan-out · 선형성 의존 · 25명 이하 · 30,000명 · 900ms~2.1s · Manifold | 2017년 구조(relay · 수동 없음). 두 글을 한 시점처럼 합치지 않음. 「of less」는 원문 철자 |
| G3 Discord Tracing | 글자 그대로 | 길드마다 Elixir 프로세스(2026) · 100만 온라인 길드 예 | CPU · 지연 수치는 조사 워커 요약이라 쓰지 않음 |
| G5 Discord 게이트웨이 문서 | 글자 그대로 | 시퀀스 번호 정의 · 마지막 번호부터 재생 · 놓친 이벤트를 순서대로 | 앱 · 봇용 공개 프로토콜이지 내부 구조 아님 |
| G6 Slack Real-time Messaging | 글자 그대로 | CS · GS 정의 · 일관 해싱 · GS 지역 배치 · GS 가 구독 클라이언트에 전송 · 500ms · 16 million | 같은 글의 「tens of millions」(다른 절). 보이는 사용자만 받는 것은 접속 상태 알림 |
| G7 Twitch 2015 | 글자 그대로(압축 해제 후) | Pubsub · Edge 계층 fan-out · IRC 를 TCP · WebSocket 으로 · 하루 메시지 | 절마다 「over 10 billion」 · 「hundreds of billions」 |
| G8 Twitch 2022 | 글자 그대로(압축 해제 후) | 8대 · 무작위 배치 · 2만 명 채널 | 그 시절의 연도는 글에서 확인 안 함 |
| G9 Twitch 2023 | 글자 그대로(압축 해제 후) | Broker 가 구독 중인 모든 Edge 로 · hundreds of billions | — |
| G10 Telegram FAQ | 글자 그대로(영어판으로 다시 받음) | 그룹 20만 · 채널 무제한 | 제품 사양 |
| G11 Telegram API Updates | 글자 그대로 | `getChannelDifference` · 큰 채널에 업데이트를 멈추거나 줄일 수 있음 | 「passively」는 Discord 의 수동과 다른 뜻 |
| G12 LINE 오픈채팅 | 글자 그대로 | 5,000명 · 10,000명 확장 | 안내 UPDATE 2023.05.30, 확장 안내 2023.12.26 |
| G13 Erlang Processes | 글자 그대로 | 유일한 순서 보장 · 같은 수신자 순서 유지 · S1/S2 · 분산에서 잃을 수 있음 · 대량 동시성 | 「다른 송신자 사이 보장 없음」 문장은 없음. priority 메시지 예외도 보장을 어기지 않음(조사 워커 원문). OTP 29.1.2 |
| G14 Elixir Processes | 글자 그대로 | 가벼움 · 수십만 개 · 메일박스 | v1.20.5 |
| G15 Phoenix Channels · PubSub | 글자 그대로 | 최대 한 번 · 다시 보내지 않음 · 저장 후 요청 권고 · 클라이언트 · 토픽마다 프로세스 · 여러 노드 방송 · 클러스터 방송 | Phoenix v1.8.16, phoenix_pubsub v2.4.1 |
| G16 Redis Pub/Sub | 글자 그대로 | 발행 순서대로 받음 · 최대 한 번 · 끊기면 영원히 잃음 · Streams 는 저장 · 샤드 Pub/Sub | 샤드 Pub/Sub 은 7.0 부터. 「구독자가 없으면 사라진다」를 그대로 적은 문장은 없음 |
| G17 Redis Streams(XREAD · XADD · XTRIM) | 글자 그대로 | 마지막 ID 보다 큰 것만 읽음 · 읽어도 지우지 않음 · ID 단조 증가와 전체 순서 · 오래된 것부터 지움 | `MAXCOUNT` · `MAXSIZE` 는 8.10 추가 |
| G18 RFC 6455 | 글자 그대로 | 조각 순서 MUST · 첫 재연결은 무작위 지연 SHOULD | 한 연결 안 메시지 순서는 해석. 재전송 규정 없음은 조사 워커가 읽은 구간 기준 |
| G19 Kafka 4.4 Introduction | 글자 그대로 | 파티션 안 읽기 순서 보장 | 「파티션 사이 순서 없음」 문장은 못 찾음 |
| G20 Hello Interview WhatsApp | 글자 그대로(세 문장), 나머지 조사 워커 원문 | 그룹 100명 제한 · 채팅마다 증가하는 순번 · 마지막 순번 기억 | 교육용 분석. 순서를 도착 시각으로 찍는다는 절과 순번 절이 함께 있음 |

## 11. 출처

조회일은 모두 2026-11-17 입니다.

- G1. [Discord — Maxjourney: Pushing Discord's limits with a million+ online users in a single server](https://discord.com/blog/maxjourney-pushing-discords-limits-with-a-million-plus-online-users-in-a-single-server) — 2023-10-25
- G2. [Discord — How Discord Scaled Elixir to 5,000,000 Concurrent Users](https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users) — 2017-07-06
- G3. [Discord — Tracing Discord's Elixir Systems (Without Melting Everything)](https://discord.com/blog/tracing-discords-elixir-systems-without-melting-everything) — 2026-03-04
- G5. [Discord Developer Docs — Gateway](https://docs.discord.com/developers/events/gateway) — 게시일 확인 안 함
- G6. [Slack — Real-time Messaging](https://slack.engineering/real-time-messaging/) — 2023-04-11
- G7. [Twitch — Twitch Engineering: An Introduction and Overview](https://blog.twitch.tv/en/2015/12/18/twitch-engineering-an-introduction-and-overview-a23917b71a25) — 2015-12-18
- G8. [Twitch — Breaking the Monolith at Twitch](https://blog.twitch.tv/en/2022/03/30/breaking-the-monolith-at-twitch) — 2022-03-30
- G9. [Twitch — State of Engineering 2023](https://blog.twitch.tv/en/2023/09/28/twitch-state-of-engineering-2023/) — 2023-09-28
- G10. [Telegram — FAQ](https://telegram.org/faq) — 게시일 확인 안 함
- G11. [Telegram API — Working with Updates](https://core.telegram.org/api/updates) — 게시일 확인 안 함
- G12. [LINE — オープンチャット](https://guide.line.me/ja/services/openchat.html) · [メイントークルーム定員数拡張](https://openchat-jp.line.me/admin/megachat/) — 2023-05-30 · 2023-12-26
- G13. [Erlang Reference Manual — Processes](https://www.erlang.org/doc/system/ref_man_processes.html) — 게시일 확인 안 함(OTP 29.1.2)
- G14. [Elixir — Processes](https://elixir.hexdocs.pm/processes.html) — 게시일 확인 안 함(v1.20.5)
- G15. [Phoenix — Channels](https://phoenix.hexdocs.pm/channels.html) · [Phoenix.PubSub](https://phoenix-pubsub.hexdocs.pm/Phoenix.PubSub.html) — 게시일 확인 안 함(Phoenix v1.8.16 · phoenix_pubsub v2.4.1)
- G16. [Redis — Pub/Sub](https://redis.io/docs/latest/develop/pubsub/) — 게시일 확인 안 함
- G17. [Redis — XREAD](https://redis.io/docs/latest/commands/xread/) · [XADD](https://redis.io/docs/latest/commands/xadd/) · [XTRIM](https://redis.io/docs/latest/commands/xtrim/) — 게시일 확인 안 함
- G18. [RFC 6455 — The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455) — 2011-12
- G19. [Apache Kafka 4.4 — Introduction](https://kafka.apache.org/44/getting-started/introduction/) — 최종 수정 2026-10-22(페이지 표기, 조사 워커 확인)
- G20. [Hello Interview — Design a Messaging App Like WhatsApp](https://www.hellointerview.com/learn/system-design/problem-breakdowns/whatsapp) — 갱신일 확인 안 함(교육용 분석)

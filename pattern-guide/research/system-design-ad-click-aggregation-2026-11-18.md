# 리서치 노트 — 광고 클릭 집계: 분 단위로 세되, 잃지도 두 번 세지도 않게

- 조사일: 2026-11-18. 자료 조사는 조사 워커 둘이 했고(기업 기술 글과 논문 · 스트림 처리와 저장소의 공식 문서), 본문에 실을 만한 인용과 수치는 같은 날 원문 페이지와 논문 PDF 를 다시 받아 문자열을 맞췄습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 다섯째 편(`ad-click-aggregation`, 사례 목록 [AG-03](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S12 의 산출물입니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `K` 로 시작합니다(앞 노트의 `V` · `C` · `L` · `P` · `T` · `G` 와 겹치지 않게). 사례 목록 AG-03 행의 D11 은 이 노트의 K1, HI ad-click-aggregator 는 K5 입니다. 같은 행의 XU2(Alex Xu 2권)는 이 노트가 열어 보지 않았습니다.
- 인용마다 원문의 절 이름을 적었습니다. 한 글의 서로 다른 절을 한 흐름으로 잇지 않기 위해서입니다(CT-05 노트의 교훈). 특히 K1 Uber 글은 레코드 ID 를 절마다 다르게 적으므로 4-6 에서 따로 다룹니다.
- 같은 계열의 앞 편 [결제 · 송금 중복 방지](../system-design-guide/payment-idempotency/payment-idempotency-guide_v1.0.0.md)(CT-05)는 요청 하나의 재시도를 멱등 키로 막았습니다. 이 편은 **이벤트 흐름 전체**에서 같은 클릭을 한 번만 세는 문제이고, 시간 창 · 늦게 온 이벤트 · 한 광고에 몰리는 클릭이 더해집니다.

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 클릭 ID 와 중복 제거 · 4-2 전달 의미와 정확히 한 번의 범위 · 4-3 트랜잭션 쓰기와 체크포인트 · 4-4 이벤트 시각 창과 늦은 클릭 · 4-5 한 광고에 몰리는 클릭 · 4-6 결과 저장과 결과 ID) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 요구 후보 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

광고 클릭은 돈입니다. Google 은 클릭과 검색 질의를 붙이는 시스템 Photon 의 요구를 「Photon must guarantee that a single click is never processed twice, since this leads to double-charging the advertisers.」와 「Google loses money for every click which is not processed by Photon.」로 적습니다(K2, §1.2 System Challenges). Uber 는 「our ad attribution must be 100% accurate.」, 「We can’t afford to overcount events.」라고 적습니다(K1, 절 Problem Statement). 두 문장 모두 요구이고, 달성한 정확도 수치는 아닙니다.

공개 사례가 보인 해법은 다섯 갈래입니다.

1. **클릭마다 고유 ID 를 붙이고 그 ID 로 거름** — Photon 의 `event_id`(서버 IP · 프로세스 ID · 시각, K2 §3.1)와 IdRegistry(K2 §2), Delivery Hero 의 30시간 중복 제거 상태(K4), Uber 의 키 상태 중복 제거(K1, 절 Data Cleansing), Hello Interview 의 노출 ID(K5, 교육용).
2. **전송은 최소 한 번이어도 결과에는 한 번** — Delivery Hero 는 「Billing is therefore effectively exactly-once, even though the transport underneath it is at-least-once.」(K4, 절 Solution architecture). Photon 은 출력에 중복이 없는 것을 늘 보장하고 정확히 한 번은 「eventually」로 적습니다(K2, Abstract).
3. **집계 결과를 트랜잭션으로 내보냄** — Uber 는 1분 창의 결과를 Kafka 에 커밋하지 않은 채 보내고, 2분마다 체크포인트 때 두 단계 커밋으로 커밋합니다(K1, 절 Exactly-Once). 소비자는 커밋된 것만 읽습니다.
4. **이벤트 시각으로 분 단위 창** — Uber 는 광고 ID 와 분 단위 시각을 합친 키로 1분 텀블링 창을 씁니다(K1, 절 Aggregation). Delivery Hero 의 옛 시스템은 처리 시각으로 묶어서 틀린 창에 넣었습니다(K4, 절 Challenges with the legacy system).
5. **결과 저장소에서 같은 ID 는 덮어씀** — Uber 는 Pinot 의 upsert 로 같은 레코드 ID 를 두 번 넣지 않습니다(K1, 절 Exactly-Once).

이 노트의 추천 구조(판단)는 이렇습니다. **광고 서버가 클릭마다 결정적인 클릭 ID 를 붙여 Kafka 에 씁니다. 스트림 처리는 클릭 ID 로 거른 뒤 이벤트 시각 1분 창으로 셉니다. 한 광고에 몰린 클릭은 키를 나눠 부분합을 낸 뒤 합칩니다. 창 결과는 (광고 ID, 창 시작) 을 결과 ID 로 삼아 체크포인트마다 트랜잭션으로 커밋하고, 저장소는 그 ID 로 덮어씁니다.** 늦게 온 클릭은 허용 지연 안이면 같은 창을 다시 내보내 덮어쓰고, 그보다 늦으면 따로 세어 둡니다. 근거와 버린 후보는 6절에 있습니다.

## 2. 요구사항 절에 쓸 근거 — 「돈이 걸린 수」를 숫자로

| 값 | 원문 | 대상 · 시점 | 출처 |
| --- | --- | --- | --- |
| 두 번 세지 않음 · 잃지 않음 | 「Photon must guarantee that a single click is never processed twice, since this leads to double-charging the advertisers.」 · 「Google loses money for every click which is not processed by Photon.」 | Google Photon, 2013, 요구 | K2 §1.2 |
| 100% 정확 · 많이 세지 않음 | 「our ad attribution must be 100% accurate.」 · 「We can’t afford to overcount events.」 | Uber Eats 광고, 2021, 요구 | K1 절 Problem Statement |
| 몇 초 안에 거의 전부 · 몇 시간 안에 전부 | 「we require Photon to join 99.9999% events within a few seconds, and 100% events within a few hours.」 | Photon, 요구 | K2 §1.2 |
| 실제 지연 | 「processes millions of events per minute at peak with an average end-to-end latency of less than 10 seconds.」 · 「90% of the events were joined in less than 7 seconds.」 | Photon, 결과(평균과 90분위수로 지표가 다름) | K2 Abstract · §4.1 |
| 실제 지연 | 「dropped from 61 minutes to 1.2 seconds.」 | Delivery Hero, 발행부터 기록까지 평균, 결과 | K4 절 Processing latency |
| 피크 처리량 | 「The pipeline sustains 20,000 messages per second at peak」 | Delivery Hero, 결과 | K4 절 System reliability |
| 처리량 | 「this system is processing hundreds of millions of ad events per week」 | Uber, 글 작성 시점 | K1 절 Parting Thoughts |
| 저장소 규모 | 「Mesa handles petabytes of data, processes millions of row updates per second, and serves billions of queries that fetch trillions of rows per day.」 | Google Mesa, 2014 | K3 Abstract |
| 창 크기 | 「we put the events into a Tumbling window of one minute in length.」 | Uber | K1 절 Aggregation |
| 설계 조건(교육용) | 「We are going to design for a system that has 10M active ads and a peak of 10k clicks per second.」 | Hello Interview 의 가정 | K5 절 Understanding the Problem |

- 부분 반영을 보이면 안 된다는 요구: Mesa 는 「It must not be possible to query the system in a state where only some of the updates have been applied.」(K3 §1)와 「For business and legal reasons, this system must return consistent and correct data.」(K3 §1)를 적습니다. 광고 측정 데이터 저장소의 요구이고, 클릭 집계 파이프라인 자체의 설명은 아닙니다.
- Uber 는 1분을 고른 이유를 셋 적습니다 — 의존하는 쪽이 받아들일 만큼 작고, 분석 단위로 작으며(1시간 · 6시간으로 올려 합칠 수 있음), 데이터베이스에 쓰기가 몰리지 않을 만큼 큽니다(K1, 절 Aggregation, 이 노트가 원문에서 읽음).
- **요구 표 후보(가정)**: 피크에 초당 클릭 1만 건(K5 의 가정을 빌림), 활성 광고 1천만 개(K5), 광고마다 1분 단위 클릭 수(K1 의 창), 창이 닫힌 뒤 결과가 조회되기까지 수십 초 안(가정 — Photon 의 평균 10초 미만과 Uber 의 2분 커밋 사이), 정확도는 허용 오차 0(K1 · K2 의 요구 문장), 늦게 온 클릭은 정해진 시간까지 제 창에 넣음(가정), 클릭이 한 광고에 몰려도 처리가 한 곳에 막히지 않음(가정 — 「핫 샤드」는 사례 목록 AG-03 행의 어려운 점).
- 위 가운데 「허용 오차 0」은 과금이라는 문제에서 나오는 요구이고(K1 · K2), 고른 구조에 맞춰 넣은 것이 아닙니다(판단). 「늦게 온 클릭을 언제까지 받는가」는 가이드가 결정 전에 수치로 고정해야 합니다. 그 값이 중복 제거 상태를 얼마나 오래 둘지와 결과가 얼마나 늦게 확정되는지를 함께 정하기 때문입니다(판단).

## 3. 규모 추정 절에 쓸 계산

출처 수치는 Hello Interview 의 가정(K5), Delivery Hero(K4), Uber(K1)이고, 나머지는 가이드의 가정과 그 계산입니다.

1. 하루 클릭: 초당 1만 건(가정) × 86,400 = 하루 8억 6,400만 건(계산). 분당 60만 건입니다(계산).
2. 창 결과 행: 1분 창 하나에 광고마다 한 행이므로 분당 행 수는 「클릭이 있었던 광고 수」이고, 분당 클릭 60만 건보다 많을 수 없습니다(계산). 활성 광고 1천만 개(K5)가 모두 1분마다 클릭을 받지는 않습니다.
3. 중복 제거 상태: 클릭 ID 를 T 시간 기억하면 초당 1만 × 3,600 × T 개입니다(계산). T = 1 이면 3,600만 개이고, ID 하나에 32바이트(가정)면 약 1.15 GB 입니다(계산). Delivery Hero 는 30시간에 약 20 GB 라고 적습니다(K4, 절 Solution architecture).
4. 한 광고에 몰림: 피크 클릭의 30% 가 광고 하나에 몰리면(가정) 초당 3,000 건이 같은 키로 갑니다(계산). Kafka 는 같은 키를 같은 파티션에 보내므로(K6, 절 Load balancing) 그 키를 맡은 처리 작업 하나가 3,000 건을 받습니다(계산). Hello Interview 는 Kinesis 샤드 하나의 한도를 「Kinesis, for example, has a limit of 1MB/s or 1000 records/s per shard」로 적습니다(K5 — 교육용 글의 인용이고 AWS 문서를 이 노트가 확인하지 않음).
5. 결과가 보이는 때: 창 끝 + 워터마크 지연 + 다음 체크포인트까지의 시간입니다(계산). Uber 는 1분 창에 2분 체크포인트라 「it’s not exactly “real-time” but it’s good enough」라고 적고(K1, 절 Union and Load Job), Flink 의 Kafka 싱크 문서는 정확히 한 번 모드가 「this delays record visibility effectively until a checkpoint is written」이라고 적습니다(K11).
6. 다시 읽을 여유: Uber 는 Kafka 토픽 보관 기간을 3일로 둡니다 — 「We have a 3 day retention period on our Kafka topics」(K1, 절 Union and Load Job). 원시 클릭을 그 기간 다시 읽을 수 있어야 재처리와 보정이 됩니다(판단).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 클릭 ID 와 중복 제거 — 같은 클릭을 알아보는 값

- Photon(K2 §3.1 Unique Event_Id Generation): 「An event_id consists of three fields: ServerIP, ProcessID and Timestamp.」 — 이벤트를 만든 서버가 그 자리에서 ID 를 정합니다. 시계 오차는 TrueTime 으로 묶습니다(조사 워커 원문).
- Photon 의 등록 규칙(K2 §2): 「The worker must successfully insert the event_id into the IdRegistry before it can write the joined event to output the logs.」 — 출력하기 전에 ID 를 먼저 등록하고, 이미 있으면 쓰지 않습니다. IdRegistry 는 Paxos 로 여러 데이터센터에 복제한 키-값 저장소입니다(조사 워커 원문). 기억 기간은 N 일이고, N 일보다 늦은 이벤트는 버립니다 — 「the system should always discard events delayed by N days」(K2 §2). 운영 그림 설명은 「event_ids that are older than 3 days」를 지운다고 적습니다(K2 §4.3).
- Photon 의 샤딩(K2 §2.2.2): 「The shard number is computed using a deterministic hash of the event_id, modulo the total number of shards.」 — 고유한 ID 의 해시라서 한 광고에 몰리는 문제와는 다릅니다(판단).
- Delivery Hero(K4, 절 Solution architecture): 「The pipeline keys events on a composite of entity, ad, event, and customer identifiers.」, 「Flink’s RocksDB state tracks seen events over a 30-hour window (approximately 20 GB of state)」.
- Uber(K1, 절 Data Cleansing): 「We leverage Flink’s keyed state in the deduplication mapper function to keep track of previously seen events.」 같은 절은 Filter 로 이벤트의 나이(age)도 검사한다고 적습니다(이 노트가 원문에서 읽음). 중복 제거에 쓰는 키 필드와 기억 기간은 글에 없습니다(확인 안 함).
- Hello Interview(K5, 교육용): 광고를 내보낼 때 노출 ID 를 만들어 브라우저에 보냅니다. 「This impression ID would be sent to the browser along with the ad and will serve as an idempotency key.」 위조를 막으려고 노출 ID 와 광고 ID 를 HMAC 으로 서명한다고 적습니다(조사 워커 원문). 같은 글은 「We won't be able to do this easily in Flink because we need to dedup across aggregation windows.」라며 캐시(Redis Cluster)를 씁니다 — Uber 의 Flink 키 상태 중복 제거와 다른 판단입니다. 이 노트는 둘을 비교해 판정하지 않습니다.
- Pinot 의 수집 중 중복 제거(K16, Stream Ingestion with Dedup): 「While ingesting a record, if its primary key is found to be already present, the record will be dropped.」, 기억 기간은 TTL 로 — 「The TTL should be set long enough so that new records can be deduplicated before the primary keys gets removed.」
- Kafka 의 멱등 프로듀서는 범위가 다릅니다(K6, 절 Message Delivery Semantics): 「the Kafka producer also supports an idempotent delivery option which guarantees that resending will not result in duplicate entries in the log.」 — 프로듀서가 브로커에 다시 보낼 때 로그에 두 번 쓰이지 않게 하는 것이고, 앱이 같은 클릭을 두 번 보낸 것은 거르지 못합니다(판단). 기본값은 켜짐입니다 — 「Idempotence is enabled by default if no conflicting configurations are set.」(K7, Producer Configs `enable.idempotence`).

### 4-2. 전달 의미와 정확히 한 번의 범위 — 어디서 어디까지인가

- Kafka 의 정의(K6, 절 Message Delivery Semantics): 「At most once –Messages may be lost but are never redelivered.」, 「At least once –Messages are never lost but may be redelivered.」, 「Exactly once –Each message is processed once and only once.」 기본은 최소 한 번입니다(조사 워커 원문, 같은 절).
- Kafka 가 말하는 범위(K6, 같은 절): 「the transactional producer and the consumer using read-committed isolation level can be used generally to provide exactly-once delivery when reading, processing and writing data on Kafka topics.」 Kafka 밖은 — 「Exactly-once delivery for other destination systems generally requires cooperation with such systems, but Kafka provides the primitives which makes implementing this feasible」. 「범위 밖」이라는 말은 쓰지 않습니다.
- Kafka Streams 의 범위(K9, Core Concepts, 절 Processing Guarantees): 「it guarantees that for any record read from the source Kafka topics, its processing results will be reflected exactly once in the output Kafka topic as well as in the state stores for stateful operations.」 — 원천 토픽에서 출력 토픽과 상태 저장소까지입니다.
- Flink 의 범위(K10, Learn Flink Fault Tolerance, 절 Exactly Once End-to-end): 「To achieve exactly once end-to-end, so that every event from the sources affects the sinks exactly once, the following must be true:」 — 「your sources must be replayable, and」 「your sinks must be transactional (or idempotent)」. Flink 안의 상태는 「every event will affect the state being managed by Flink exactly once」(같은 페이지, 절 Exactly Once Guarantees).
- Photon 의 범위(K2, Abstract): 「Photon guarantees that there will be no duplicates in the joined output (at-most-once semantics) at any point in time」, 이어서 「most joinable events will be present in the output in real-time (near-exact semantics), and exactly-once semantics eventually.」 읽는 쪽은 실패하면 다시 보내 「This guarantees at-least-once semantics for every event with minimum losses.」(K2 §3.2.1)입니다. 즉 **최소 한 번 읽기 + 등록부로 거르기 = 출력에는 늘 최대 한 번, 시간이 지나면 정확히 한 번**입니다(판단 — 논문 문장들을 이 노트가 묶은 것).
- Delivery Hero(K4, 절 Solution architecture): 「Kinesis Data Streams and the upstream sources deliver at-least-once, and the deduplication stage in step 2 drops」 — 그래서 「Billing is therefore effectively exactly-once, even though the transport underneath it is at-least-once.」
- Uber(K1, 절 Exactly-Once): 정확히 한 번을 시스템 전체의 제약으로 두고 「It is one of the hardest problems in distributed systems」라고 적습니다(이 노트가 원문에서 읽음). 전체 범위를 한 문장으로 정한 곳은 없고, 맺음은 「Through a mix of exactly-once semantics and idempotency on Kafka/Flink and upsert on Pinot」입니다(K1).
- 가이드가 쓸 말(판단): 「정확히 한 번」은 전송이 아니라 **집계 결과**가 갖는 성질로 씁니다. 전송은 최소 한 번이고, 중복 제거 · 트랜잭션 · 덮어쓰기가 합쳐져 결과에 각 클릭이 한 번씩 반영됩니다. 어느 구간을 무엇이 맡는지를 개념도에 표시합니다.

### 4-3. 트랜잭션 쓰기와 체크포인트 — 결과와 읽은 위치를 함께 커밋

- Kafka 트랜잭션(K6, 절 Message Delivery Semantics): 「the producer supports the ability to send messages atomically to multiple topic partitions using transactions, so that either all messages are successfully written or none of them are.」 소비 위치를 출력과 같은 곳에 두는 생각 — 「This can be handled more simply and generally by letting the consumer store its offset in the same place as its output.」 절 Using Transactions 는 「The producer uses transactions so that all the records it produces, and any offsets it updates on behalf of the consumer, are performed atomically.」
- 소비자 쪽(K6): 「in "read_committed" isolation level, the consumer will only return messages from transactions which were committed (and any messages which were not part of a transaction).」 기본값은 `read_uncommitted` 입니다(K7, Consumer Configs). `read_committed` 는 열린 트랜잭션 앞까지만 읽습니다 — 「which is the one less than the offset of the first open transaction.」(K7). KafkaProducer 문서는 「the consumers must be configured to read only committed messages as well.」라고 적습니다(K8).
- 오프셋을 트랜잭션에 넣는 메서드(K8, `sendOffsetsToTransaction`): 「These offsets will be considered committed only if the transaction is committed successfully.」
- Flink 체크포인트(K10, Stateful Stream Processing, 절 Checkpointing): 「The central part of Flink’s fault tolerance mechanism is drawing consistent snapshots of the distributed data stream and operator state.」 소스는 「needs to be able to rewind the stream to a defined recent point.」(같은 페이지). 체크포인트는 기본으로 꺼져 있습니다 — 「By default, checkpointing is disabled.」(K10, Checkpointing).
- Flink 의 Kafka 싱크(K11, 절 Kafka Sink > Fault Tolerance): 정확히 한 번 모드는 「In this mode, the KafkaSink will write all messages in a Kafka transaction that will be committed to Kafka on a checkpoint.」, 그래서 커밋된 것만 읽으면 「no duplicates will be seen in case of a Flink restart.」 대가는 「However, this delays record visibility effectively until a checkpoint is written, so adjust the checkpoint duration accordingly.」 트랜잭션 시간 한도가 짧으면 — 「or data loss may happen when Kafka expires an uncommitted transaction.」 최소 한 번 모드는 Flink 가 재시작하며 옛 입력을 다시 처리해 중복이 생길 수 있다고 적습니다(조사 워커 원문, 같은 절). Kafka 소스는 브로커에 커밋한 오프셋에 기대지 않습니다 — 「Note that Kafka source does NOT rely on committed offsets for fault tolerance.」(K11).
- 두 단계 커밋(K12, Data Sinks, 절 SupportsCommitter): 「is used to indicate that the sink supports exactly-once semantics using a two-phase commit protocol.」 2018 블로그(K15)는 「The starting of a checkpoint represents the “pre-commit” phase of our two-phase commit protocol.」, 외부 시스템은 「the external system must provide support for transactions that integrates with a two-phase commit protocol.」, 커밋은 「It is our responsibility to implement a commit in an idempotent way.」 — 오래된 글이라 배경 설명으로만 씁니다.
- Uber(K1, 절 Exactly-Once): 「Every minute the tumbling window triggers sending aggregated results to a Kafka sink in an “uncommitted”」 상태로 보내고, 「When the next checkpointing triggers (every 2 minutes), the messages are converted to the “committed” state」 — 두 단계 커밋입니다. 소비자는 커밋된 것만 읽고(「Flink uses a KafkaConsumer with “read_committed” mode enabled, where it will only read transactional messages.」), Flink 가 실패하면 커밋되지 않은 결과는 무시되고 복구 뒤 다시 처리해 새 결과를 커밋합니다(이 노트가 원문에서 읽음).
- Kafka Streams 는 정확히 한 번이면 커밋 간격 기본값이 짧아집니다(K7, Kafka Streams Configs `commit.interval.ms`): 「if processing.guarantee is set to exactly_once_v2, the default value is 100, otherwise the default value is 30000」.

### 4-4. 이벤트 시각 창과 늦은 클릭 — 언제 일어났는지로 묶는다

- 이벤트 시각(K13, Timely Stream Processing): 「Event time is the time that each individual event occurred on its producing device.」 늦은 원소는 「Late elements are elements that arrive after the system’s event time clock (as signaled by the watermarks) has already passed the time of the late element’s timestamp.」 입력이 여럿이면 「Such an operator’s current event time is the minimum of its input streams’ event times.」 — 클릭이 끊긴 파티션 하나가 전체 워터마크를 붙잡을 수 있고, 그래서 유휴 입력을 표시합니다 — 「To deal with this, you can use a WatermarkStrategy that will detect idleness and mark an input as idle.」(K13, Generating Watermarks).
- 텀블링 창(K13, Windows): 「A tumbling windows assigner assigns each element to a window of a specified window size.」 Kafka Streams 도 「Since tumbling windows never overlap, a data record will belong to one and only one window.」(K9, DSL 가이드).
- 허용 지연(K13, Windows, 절 Allowed Lateness): 「By default, the allowed lateness is set to 0.」 — 「That is, elements that arrive behind the watermark will be dropped.」 허용 지연을 주면 「Elements that arrive after the watermark has passed the end of the window but before it passes the end of the window plus the allowed lateness, are still added to the window.」, 그리고 「Depending on the trigger used, a late but not dropped element may cause the window to fire again.」 — 같은 창이 결과를 여러 번 냅니다. 그보다 늦은 것은 `sideOutputLateData` 로 따로 받을 수 있습니다(조사 워커 원문, 같은 절).
- Kafka Streams 의 유예 기간(K9, Core Concepts, 절 Windowing): 「This grace period controls how long Kafka Streams will wait for out-of-order data records for a given window.」, 「If a record arrives after the grace period of a window has passed, the record is discarded and will not be processed in that window.」 `TimeWindows` 문서는 창이 닫히는 때를 「is defined as windowEnd + afterWindowEnd」로 적고, 유예 없이 만들면 「Using this method implicitly sets the grace period to zero, which means that any out-of-order records arriving after the window ends are considered late and will be dropped.」(K9, `ofSizeWithNoGrace`). 창 결과는 계속 갱신됩니다 — 「In Kafka Streams, windowed computations update their results continuously.」(K9, DSL 가이드).
- Delivery Hero 의 옛 시스템(K4, 절 Challenges with the legacy system): 「The pipeline bucketed events by the time it processed them rather than the time they occurred」. 새 시스템 쪽 문장 「Its event-time watermark model helps place out-of-order events in the correct time window even when they arrive late.」(절 Why Amazon Managed Service for Apache Flink)는 Flink 의 일반 능력 설명이고, 이 파이프라인의 워터마크 설정이나 허용 지연은 글에 없습니다.
- Uber(K1, 절 Aggregation): 광고 ID 와 분 단위 시각 버킷을 합친 키로 묶어 「regardless of late arrival」 제 시간대에 넣는다고 적습니다(문장 앞부분 「we first key the events based on a combination of an ad identifier and the minute time bucket」). 시각 버킷은 메시지의 시각 필드를 분 단위로 자른 값입니다(「truncating a timestamp field of the message to a minute」, 절 Exactly-Once). 워터마크 · 허용 지연 · 사후 보정은 글에 없습니다.
- 가이드가 쓸 말(판단): 같은 창이 늦은 클릭 때문에 다시 결과를 내므로, 받는 쪽은 결과를 더하지 않고 **덮어써야** 합니다. 이것이 4-6 의 결정적 결과 ID 가 필요한 이유입니다. 이 해석은 문서가 직접 말한 것이 아닙니다.

### 4-5. 한 광고에 몰리는 클릭 — 키를 나눠 부분합을 낸 뒤 합친다

- Kafka 는 같은 키를 같은 파티션에 보냅니다(K6, 절 The Producer > Load balancing): 「The client controls which partition it publishes messages to.」, 「For example if the key chosen was a user id then all data for a given user would be sent to the same partition.」 한 키에 몰리는 문제를 직접 다룬 문장은 Kafka 문서에서 찾지 못했습니다.
- Flink 의 공식 해법은 Table/SQL 쪽에 있습니다(K14, Performance Tuning, 절 Local-Global Aggregation): 「Local-Global is proposed to solve data skew problem by dividing a group aggregation into two stages」, 그리고 「The global aggregation will only receive the reduced accumulators instead of large number of raw inputs.」 같은 페이지의 Split Distinct Aggregation 은 버킷 키를 더해 나눕니다 — 「The bucket key plays the role of an additional group key to share the burden of hotspot in group key.」 이것은 `COUNT(DISTINCT …)` 용입니다. DataStream API 에서 키에 소금을 쳐 두 단계로 합치는 공식 설명은 찾지 못했습니다(확인 안 함).
- Hello Interview(K5, 교육용, 절 Hot Shards): 「One popular approach is to update the partition key by appending a random number to the AdId.」, 「the partition key becomes AdId:0-N where N is the number of additional partitions for that AdId.」
- K1 Uber · K2 Photon · K4 Delivery Hero 는 한 광고에 몰리는 클릭을 다루지 않습니다. 가이드는 기업 사례로 쓰지 않습니다.
- 가이드가 쓸 말(판단): 클릭 수는 더하기라서 나눠 센 부분합을 합쳐도 같은 값입니다. 다만 나눈 키마다 창이 따로 닫히므로, 합치는 단계는 같은 창의 부분합이 모두 올 때까지(워터마크로) 기다려야 하고, 늦은 발화로 부분합이 바뀌면 합계도 다시 냅니다.

### 4-6. 결과 저장과 결과 ID — 같은 창의 결과는 덮어쓴다

- Uber(K1, 절 Exactly-Once): 「Secondly, we generate unique identifiers for every record produced by the Aggregation job」 — 「The identifiers are used for idempotency and deduplication purposes in the downstream consumers.」 쓰는 곳은 셋입니다 — 「A record UUID is used as an idempotency key in ad-budget service.」, Hive 의 중복 제거, 「In Pinot, we leverage the upsert feature to ensure that we never duplicate records with the same identifier.」
- **Uber 글의 레코드 ID 는 작업마다 다르게 적혀 있습니다.** Aggregation 쪽(절 Exactly-Once)은 「At this step, we also generate a random unique identifier (record UUID) for every aggregated result.」이고, Attribution 쪽(절 Attribution Job)은 「Then a unique and deterministic record UUID is generated for idempotency for Pinot and Hive.」입니다. 두 문장은 서로 다른 작업의 설명이라 한 흐름으로 잇지 않습니다. 결정적 ID 를 무엇으로 만드는지는 글에 없습니다(확인 안 함).
- Aggregation 쪽 ID 가 무작위여도 되는 이유를 Uber 는 트랜잭션에서 찾습니다(K1, 절 Record UUID Generation, 이 노트가 원문에서 읽음): 정확히 한 번이 켜져 있으니 목적지 토픽에 커밋된 메시지라면 그 UUID 로 Hive 에서 거르고 Pinot 에서 덮어쓸 수 있다는 것입니다. 커밋되지 않은 결과는 소비자가 읽지 않고, 복구 뒤 새 UUID 로 한 번만 커밋됩니다(같은 글 절 Exactly-Once).
- 이 노트의 판단: 가이드는 결과 ID 를 **(광고 ID, 창 시작)** 으로 정합니다. 이렇게 하면 재처리나 늦은 발화로 같은 창의 결과가 다시 와도 같은 행을 덮어써, 저장소가 트랜잭션에 참여하지 않아도 같은 결과가 됩니다. Uber 의 무작위 UUID 와 다른 선택이므로 「Uber 가 이렇게 한다」로 쓰지 않습니다.
- Pinot upsert(K16, Stream Ingestion with Upsert): 「Pinot provides native upsert support during ingestion.」 같은 기본 키면 「the record with the greater comparison value (timeColumn by default) is used.」 조건이 있습니다 — 「An important requirement for the Pinot upsert table is to partition the input stream by the primary key.」 조회와 수집이 겹치면 수가 잠깐 어긋날 수 있습니다 — 「the query may occasionally return a count slightly above or below 1 million.」(같은 페이지, 절 Data consistency when queries and upserts happen concurrently). 기본 일관성 모드는 NONE 입니다(조사 워커 원문).
- ClickHouse ReplacingMergeTree(K17): 「Data deduplication occurs only during a merge.」, 「Merging occurs in the background at an unknown time, so you can't plan for it.」, 그래서 「it does not guarantee the absence of duplicates.」 — 덮어쓰기가 나중에 일어나므로 조회 때 `FINAL` 로 맞춰야 합니다(조사 워커 원문). 넣기 재시도의 중복은 다른 장치입니다 — 「If the same block_id is found in the deduplication log, the block is considered a duplicate and isn't inserted into the table.」(K17, Deduplicating inserts on retries).
- 가이드가 쓸 말(판단): 덮어쓰기가 **넣을 때** 정해지는 저장소(Pinot upsert)와 **나중에 합칠 때** 정해지는 저장소(ClickHouse ReplacingMergeTree)는 과금 조회에서 다르게 보입니다. 저장소를 특정하지 않고 「결과 ID 로 덮어쓰는 표」로 두되, 이 차이를 설정값 표에 적습니다.

## 5. 시나리오 절에 쓸 반례와 장애

시나리오 셋(기본 · 부하 · 장애)에 넣을 수 있는 상황입니다. 모두 가상 시계와 사건 순서로 재현할 수 있습니다(판단, 앞 편과 같은 방식). SD9 에 따라 기본 흐름에는 부하도 장애도 없는 요청 하나만 둡니다.

1. **기본 — 클릭 하나가 결과 행 하나가 되는 길**: 광고 서버가 클릭 ID 를 붙여 클릭을 Kafka 에 씁니다. 처리 작업이 클릭 ID 를 처음 보므로 통과시키고, 이벤트 시각으로 1분 창에 넣습니다. 워터마크가 창 끝을 지나면 (광고 ID, 창 시작) 행의 수 1 을 트랜잭션으로 내보내고, 다음 체크포인트에 커밋되면 저장소가 그 행을 씁니다.
2. **부하 — 피크에 한 광고로 몰림**: 초당 1만 건 가운데 30% 가 광고 하나로 갈 때(가정), 키를 나누지 않으면 그 키를 맡은 작업 하나가 초당 3,000 건을 받습니다(3절 4번). 키를 k 개로 나눠 부분합을 낸 뒤 합치면 작업마다 3,000 ÷ k 건입니다(계산). 결과 수는 두 경우가 같아야 합니다.
3. **부하 — 늦게 온 클릭**: 허용 지연 안에 온 클릭은 같은 창을 다시 발화해 같은 결과 ID 의 행을 새 수로 덮어씁니다. 허용 지연보다 늦은 클릭은 창에 들어가지 않고 따로 세어집니다(K13 의 사이드 출력).
4. **장애 — 처리 작업이 체크포인트 사이에 멈춤**: 창 결과를 커밋하지 않은 채 내보낸 뒤 다음 체크포인트 전에 작업이 멈추면, 그 트랜잭션은 커밋되지 않아 소비자가 읽지 않습니다(K6 · K11). 작업은 마지막 체크포인트의 상태와 읽은 위치로 돌아가 그 뒤 클릭을 다시 읽어 같은 창을 다시 내고, 이번에 커밋됩니다. 결과 수는 멈추지 않은 경우와 같습니다.
5. **장애의 반례 — 최소 한 번 싱크**: 같은 멈춤에서 싱크가 최소 한 번이면 멈추기 전에 보낸 결과가 이미 보이고, 다시 처리한 결과가 한 번 더 옵니다(K11 의 최소 한 번 설명). 받는 쪽이 더하면 두 번 세고, 결과 ID 로 덮어쓰면 한 번입니다(판단).
6. **반례 — 앱이 같은 클릭을 두 번 보냄**: 응답을 못 받은 앱이 같은 클릭을 다시 보내면 Kafka 에는 두 건이 쓰입니다(멱등 프로듀서는 프로듀서 재전송만 거름, 4-1). 클릭 ID 로 거르지 않으면 두 번 셉니다.
7. **반례 — 처리 시각으로 묶음**: 처리가 늦어진 동안 쌓인 클릭을 처리 시각으로 묶으면 다른 분으로 셉니다(K4 의 옛 시스템).

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 두 번 세지 않는 방법 | 결과가 보이는 때 | 한 광고에 몰릴 때 | 근거 |
| --- | --- | --- | --- | --- |
| A. 클릭마다 DB 의 카운터를 1 올림 | 없음(재시도면 두 번) | 바로 | 그 행 하나에 쓰기가 몰림 | 판단 · 3절 4번 |
| B. 원시 클릭을 쌓고 주기 배치로 집계 | 배치에서 클릭 ID 로 거름 | 배치 주기 뒤 | 배치가 나눠 셈 | K5 의 Good Solution(교육용) |
| C. 스트림 집계, 최소 한 번(거르기 · 트랜잭션 없음) | 없음 | 창 끝 뒤 바로 | 키를 나눌 수 있음 | K11 의 최소 한 번 |
| D. 클릭 ID 거르기 + 이벤트 시각 창 + 키 나누기 + 트랜잭션 커밋 + 결과 ID 덮어쓰기 | 클릭 ID 와 결과 ID | 창 끝 + 워터마크 지연 + 체크포인트 | 키를 나눠 부분합 | K1 · K2 · K4 · K6 · K10 · K11 · K14 · K16(판단) |
| E. 스트림 + 배치 보정(두 갈래) | 배치가 맞춤 | 스트림 값은 바로, 확정은 배치 뒤 | 두 갈래 모두 | K5(교육용) |

- **추천 D(판단)**: 전송은 최소 한 번으로 두고, 같은 클릭은 클릭 ID 로(4-1), 같은 창의 결과는 결과 ID 로(4-6) 거릅니다. 트랜잭션은 결과와 읽은 위치를 함께 커밋해(4-3) 멈췄다 다시 시작해도 같은 결과가 됩니다.
- **A 를 버리는 이유(판단)**: 앱이나 수집 서버가 다시 보내면 두 번 올라갑니다. 한 광고에 초당 3,000 건이면 한 행에 초당 3,000 번 쓰기입니다(3절 4번, 계산).
- **B 를 버리는 이유**: Hello Interview 는 5분마다 배치를 하면 초당 1만 건에서 배치마다 300만 건이라고 적습니다(K5, 절 Good Solution — 조사 워커 원문). 결과가 배치 주기만큼 늦어 요구의 「수십 초 안」을 지키지 못합니다(판단).
- **C 를 버리는 이유**: 처리 작업이 다시 시작하면 옛 입력을 다시 처리해 결과가 두 번 나옵니다(K11). 5절 5번이 그 반례입니다.
- **E 를 버리는 이유(판단)**: 같은 계산을 두 갈래 코드로 유지해야 합니다. Hello Interview 는 「The batch layer acts as a source of truth that periodically corrects any inaccuracies from the speed layer.」(K5, 절 Reconciliation)라고 권하지만, Delivery Hero 는 「There is no bespoke backfill job and no reconciliation against external systems.」(K4, 절 System reliability)라고 적습니다. 앞은 교육용 글이고 뒤는 기업 글이라 맥락이 달라 서로의 반박으로 잇지 않습니다. Photon 의 검증 · 복구 절차는 드문 실패를 위한 보험이라고 적습니다(K2 §3.3.3, 조사 워커 원문).
- **전환점(판단)**: 결과를 몇 초 안에 봐야 하면 체크포인트 간격이 그 아래로 내려가야 하고 체크포인트 비용이 늘어납니다(K11 의 보이는 시점). 늦게 오는 클릭을 더 오래 받아야 하면 중복 제거 상태와 창 상태가 그만큼 커집니다(3절 3번). 결과 저장소가 결과 ID 로 덮어쓰지 못하면(나중에 합치는 저장소) 조회 때 맞추거나 트랜잭션에 참여하는 저장소가 필요합니다(K17). 광고 하나에 몰리는 비율이 낮으면 키 나누기를 빼도 됩니다.

## 7. 실제 사례 절에 쓸 대응표

| 회사 | 무엇을 했나 | 이 가이드의 어느 자리 | 출처 |
| --- | --- | --- | --- |
| Uber | Flink 작업 셋과 Kafka, 키 상태로 중복 제거, 광고 ID + 분 버킷으로 1분 텀블링 창, 2분 체크포인트의 두 단계 커밋, `read_committed` 소비, 레코드 UUID 로 Hive 중복 제거와 Pinot upsert, 두 리전 | 4-1 · 4-3 · 4-4 · 4-6 | K1 |
| Google Photon | 클릭마다 서버가 만든 `event_id`, 출력 전에 IdRegistry 에 먼저 등록, N 일(운영 3일) 기억, 출력은 늘 최대 한 번 · 결국 정확히 한 번, 평균 10초 미만 | 4-1 · 4-2 | K2 |
| Google Mesa | 광고 측정 저장소, 부분 반영을 보이지 않을 것 · 일관되고 맞는 값 | 2절 요구 · 4-6 | K3 |
| Delivery Hero | 엔티티 · 광고 · 이벤트 · 고객 ID 로 30시간 중복 제거(약 20 GB), 전송은 최소 한 번 · 과금은 사실상 정확히 한 번, 5분마다 보고 DB 에 일괄 upsert, 지연 61분 → 1.2초, 피크 초당 2만 건, 별도 보정 없음 | 4-1 · 4-2 · 6절 E | K4 |

- Delivery Hero 글은 AWS 블로그에 회사 엔지니어가 함께 쓴 글이라 AWS 서비스 소개가 섞여 있습니다. 회사의 운영 사실(키 · 30시간 · 지연 · 처리량)만 씁니다.
- Pinterest 의 광고 실시간 스트리밍 글은 열리지 않아(HTTP 403) 쓰지 않습니다. 광고 과금 Kafka Streams 글(ShouQianBa)은 재게시 사이트의 요약이라 쓰지 않습니다.
- 한국 기업(카카오 · 네이버 · 쿠팡)의 광고 클릭 집계 기술 글은 찾지 못했습니다.

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 앞 편과 같은 틀입니다.
- 대역: Kafka 는 파티션마다 (오프셋, 레코드) 배열과 커밋된 끝 위치(트랜잭션), 처리 작업은 클릭 ID 집합(기억 기간 포함) · 창마다 부분합 · 워터마크 · 체크포인트(상태 사본과 읽은 위치), 결과 저장소는 결과 ID 를 키로 한 표(덮어쓰기)로 둡니다.
- 멈춤은 「체크포인트 사이에서 작업이 멈추고 마지막 체크포인트로 돌아가 다시 읽는다」로 두고, 커밋되지 않은 결과는 소비자에게 보이지 않게 합니다(K6 · K11 의 동작을 모형에 넣음).
- 고정할 출력 후보: 결과 행의 수 합계와 입력 클릭 수(중복 제외)의 일치, 앱 재전송 클릭을 거른 수, 최소 한 번 싱크 반례에서 두 번 센 수, 키를 나눴을 때 작업마다 받은 클릭 수의 최대, 늦은 클릭 가운데 창에 들어간 수와 따로 센 수, 창 결과가 보인 시각(창 끝 + 워터마크 지연 + 체크포인트).
- 세 언어 출력의 글자 단위 일치를 위해 시각은 정수 밀리초로 찍고, 무작위가 필요하면 정해진 씨앗의 정수 의사 난수를 씁니다(판단, 명세 SD26).

## 9. 미해결 질문

1. Uber 가 중복 제거에 쓰는 키 필드와 기억 기간, 워터마크와 늦은 이벤트의 허용 기간, 한 광고에 몰리는 클릭의 처리는 글에 없습니다.
2. Uber 의 결정적 레코드 UUID(Attribution 쪽)를 무엇으로 만드는지는 글에 없습니다.
3. Flink DataStream API 에서 키에 소금을 쳐 두 단계로 합치는 공식 설명은 찾지 못했습니다. Table/SQL 의 Local-Global 과 Split Distinct 만 공식입니다.
4. Kafka 문서에서 「Kafka 밖 저장소는 범위 밖」을 그 표현으로 쓴 문장은 없습니다. 「requires cooperation with such systems」가 가장 가깝습니다.
5. Flink 2.3 문서에서 「체크포인트가 끝나면 커밋한다」는 문장은 Kafka 싱크 페이지의 「committed to Kafka on a checkpoint」 말고는 찾지 못했습니다.
6. Kinesis 샤드 한도(초당 1,000 레코드)는 Hello Interview 의 인용이고 AWS 문서를 이 노트가 확인하지 않았습니다.
7. Mesa 논문은 1 ~ 2쪽 근처만 읽었습니다. Mesa 가 중복을 어떻게 막는지는 확인 안 함입니다.
8. 요구 표의 초당 1만 건 · 한 광고 30% · 결과 지연 · 늦은 클릭의 허용 범위는 가정입니다. 출처를 찾으면 그 값으로 바꿉니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-18 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트에서 문자열을 찾은 것이고(따옴표 모양 · 공백 · 백틱 · 밑줄 · 합자만 맞춤), 논문 두 편은 PDF 를 받아 글자층을 읽기 순서대로 뽑아 맞췄습니다. 「조사 워커 원문」은 조사 워커가 원문에서 옮겼으나 이 노트가 다시 찾지 않은 것입니다. 인용 후보 142개(기업 · 논문 73, 공식 문서 69)를 대조해 142개 모두 문자열이 맞았습니다. 그 과정에서 바로잡은 것은 셋이에요. Photon 의 등록 문장은 원문이 「to output the logs」입니다(조사 워커는 「the」를 빠뜨림). 「garbage-collects」는 줄 끝 하이픈이라 글자를 확정할 수 없어 뒤 구절만 인용 후보로 두었어요. Kafka 의 세 정의는 원문이 「At most once –Messages …」처럼 띄어 쓴 en 대시였습니다. Uber 페이지는 첫 요청이 HTTP 406 이어서, 브라우저와 같은 Accept 헤더를 붙여 다시 받았어요. Uber 의 Exactly-Once · Aggregation · Data Cleansing · Record UUID Generation · Attribution Job 절은 이 노트가 원문을 직접 읽어 앞뒤 문장을 확인했습니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 같은 글 안의 다른 값 · 대상 · 동사 |
| --- | --- | --- | --- |
| K1 Uber | 글자 그대로(다섯 절은 원문 직접 읽음) | Flink 작업 셋 · 두 리전 · 트랜잭션 쓰기 · `read_committed` · 1분 창과 2분 체크포인트의 두 단계 커밋 · 레코드 UUID 의 세 쓰임 · Pinot upsert · 키 상태 중복 제거 · 광고 ID + 분 버킷 · 3일 보관 · 주당 수억 건 · 100% 정확 요구 | 레코드 UUID 가 Aggregation 절은 random, Attribution 절은 deterministic. 「100% accurate」는 요구(달성 수치 없음). 워터마크 · 허용 지연 · 핫 키 없음 |
| K2 Photon | 글자 그대로(PDF 글자층) | 두 번 처리 금지 · 잃으면 손해 · 출력 최대 한 번과 결국 정확히 한 번 · 최소 한 번 읽기 · `event_id` 세 필드 · 출력 전 등록 · N 일 · 3일 · 결정적 해시 샤딩 · 99.9999% 요구 · 평균 10초 미만 · 90% 7초 · 0.0001% 미만 손실 | 평균 10초와 90분위수 7초는 다른 지표. 99.9999% 는 요구. 시간 창 집계가 아니라 조인. 「garbage-collects」는 하이픈 확인 불가 |
| K3 Mesa | 글자 그대로(PDF 글자층) | 광고 측정 저장소 · 부분 반영 금지 · 일관되고 맞는 값 · 규모 | 클릭 집계 파이프라인의 설명이 아님. 3쪽 이후는 읽지 않음 |
| K4 Delivery Hero | 글자 그대로 | 체크포인트를 S3 에 · 최소 한 번 전송과 중복 제거 · 사실상 정확히 한 번 · 복합 키 · 30시간 약 20 GB · 옛 시스템은 처리 시각 · 5분 일괄 upsert · 별도 보정 없음 · 61분 → 1.2초 · 피크 2만 건 | AWS 블로그의 공저 글. 워터마크 문장은 Flink 일반 능력 설명. 게시일 24 SEP 2026 |
| K5 Hello Interview | 글자 그대로(아홉 문장), 나머지 조사 워커 원문 | 1천만 광고 · 초당 1만 건(가정) · Kafka/Kinesis 에 바로 씀 · 워터마크 · 노출 ID 를 멱등 키로 · Flink 에서 창을 넘는 중복 제거가 어렵다는 판단 · AdId 에 무작위 숫자 · Kinesis 샤드 한도 인용 · 배치 보정 권고 | 교육용 분석. 기업 운영 사실 아님 |
| K6 Kafka Design | 글자 그대로 | 세 전달 의미 정의 · 멱등 프로듀서 · 트랜잭션 원자성 · 오프셋을 출력과 같은 곳에 · `read_committed` · Kafka 토픽 안의 정확히 한 번 · 다른 시스템은 협조 필요 · 같은 키는 같은 파티션 | 4.4.X, 최종 수정 2026-10-26. 「범위 밖」 표현 없음 |
| K7 Kafka Configs | 글자 그대로 | `enable.idempotence` 는 메시지마다 정확히 한 부 · 기본 켜짐 · `transactional.id` 없으면 멱등까지만 · `isolation.level` 커밋된 것만 · LSO · Streams `commit.interval.ms` 100 대 30000 | 4.4.X, 최종 수정 2026-10-22. `isolation.level` 기본은 `read_uncommitted` |
| K8 KafkaProducer javadoc | 글자 그대로 | 멱등 프로듀서가 최소 한 번을 정확히 한 번으로 · 오프셋은 트랜잭션이 커밋될 때만 · 소비자도 커밋된 것만 읽어야 | 4.4. 읽기-처리-쓰기 코드 예제는 없음(조사 워커 보고) |
| K9 Kafka Streams | 글자 그대로 | 원천 토픽 → 출력 토픽 · 상태 저장소의 정확히 한 번 · 유예 기간 · 유예 뒤 버림 · 창 닫힘 = 창 끝 + 유예 · 유예 0 · 텀블링 창 · 결과가 계속 갱신 | 4.4.X, Core Concepts · DSL 최종 수정 2026-10-26 |
| K10 Flink 장애 허용 | 글자 그대로 | 끝에서 끝까지 조건(재생 가능한 소스 · 트랜잭션 또는 멱등 싱크) · 상태에 한 번 · 일관된 스냅샷 · 되감기 · 체크포인트 기본 꺼짐 · 정확히 한 번 권장 | v2.3.0 |
| K11 Flink Kafka 커넥터 | 글자 그대로 | 체크포인트에 커밋 · 재시작에도 중복 없음 · 보이는 시점이 늦어짐 · 트랜잭션 만료면 잃을 수 있음 · 커밋 오프셋에 기대지 않음 | v2.3.0 |
| K12 Flink Data Sinks | 글자 그대로 | 두 단계 커밋으로 정확히 한 번(`SupportsCommitter`) | v2.3.0. 커밋 시점 문장은 없음 |
| K13 Flink 시간 · 창 · 워터마크 | 글자 그대로 | 이벤트 시각 · 늦은 원소 · 입력 중 최솟값 · 유휴 입력 · 텀블링 창 · 허용 지연 기본 0 · 늦은 것 버림 · 허용 지연 안이면 넣음 · 다시 발화 | v2.3.0. 시각 값(20초 · 1분 · 5초)은 문서 예시 |
| K14 Flink Table 튜닝 | 글자 그대로 | Local-Global 두 단계 집계 · 줄인 누산기만 받음 · 버킷 키로 핫스팟 나눔 | v2.3.0. Split Distinct 는 `COUNT(DISTINCT)` 용 |
| K15 Flink 2018 블로그 | 글자 그대로 | 외부 시스템의 트랜잭션 · 체크포인트 시작이 사전 커밋 · 커밋은 멱등하게 | 2018-02-28, 배경 설명으로만 |
| K16 Pinot upsert · dedup | 글자 그대로 | 수집 중 upsert · 비교 값이 큰 것 · 기본 키로 파티션 · 조회 중 수 어긋남 · dedup 은 있으면 버림 · TTL | 날짜 · 판 표기 없음 |
| K17 ClickHouse | 글자 그대로 | 병합 때만 중복 제거 · 시점 알 수 없음 · 중복 없음 보장 안 함 · 넣기 재시도는 `block_id` 로 거름 | 날짜 표기 없음, insert 중복 제거 문서는 26.2 언급 |

## 11. 출처

조회일은 모두 2026-11-18 입니다.

- K1. [Uber — Real-Time Exactly-Once Ad Event Processing with Apache Flink, Kafka, and Pinot](https://www.uber.com/blog/real-time-exactly-once-ad-event-processing/) — 2021-09-23
- K2. [Google — Photon: Fault-tolerant and Scalable Joining of Continuous Data Streams](https://research.google/pubs/pub41318/) — SIGMOD '13(2013-06-22 ~ 27). 본문은 [PDF 사본](https://www.cs.albany.edu/~jhh/courses/readings/ananthanarayanan.sigmod13.ha.pdf)으로 읽음
- K3. [Google — Mesa: Geo-Replicated, Near Real-Time, Scalable Data Warehousing](https://research.google/pubs/pub42851/) — VLDB 2014(Vol. 7 No. 12). 본문은 [PDF 사본](https://www.cs.princeton.edu/courses/archive/spring16/cos598F/mesa-google.pdf)으로 읽음
- K4. [AWS Big Data Blog — How Delivery Hero rebuilt real-time ad measurement with Apache Flink](https://aws.amazon.com/blogs/big-data/how-delivery-hero-rebuilt-real-time-ad-measurement-with-apache-flink/) — 2026-09-24
- K5. [Hello Interview — Ad Click Aggregator](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator) — 갱신일 확인 안 함(교육용 분석)
- K6. [Apache Kafka 4.4 — Design](https://kafka.apache.org/44/design/design/) — 최종 수정 2026-10-26(페이지 표기)
- K7. [Apache Kafka 4.4 — Producer Configs](https://kafka.apache.org/44/configuration/producer-configs/) · [Consumer Configs](https://kafka.apache.org/44/configuration/consumer-configs/) · [Kafka Streams Configs](https://kafka.apache.org/44/configuration/kafka-streams-configs/) — 최종 수정 2026-10-22(페이지 표기)
- K8. [Apache Kafka 4.4 — KafkaProducer javadoc](https://kafka.apache.org/44/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html) — 게시일 확인 안 함(4.4)
- K9. [Apache Kafka 4.4 — Kafka Streams Core Concepts](https://kafka.apache.org/44/streams/core-concepts/) · [DSL API](https://kafka.apache.org/44/streams/developer-guide/dsl-api/) · [TimeWindows javadoc](https://kafka.apache.org/44/javadoc/org/apache/kafka/streams/kstream/TimeWindows.html) — 최종 수정 2026-10-26(Core Concepts · DSL 페이지 표기)
- K10. [Apache Flink 2.3 — Fault Tolerance via State Snapshots](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/learn-flink/fault_tolerance/) · [Stateful Stream Processing](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/concepts/stateful-stream-processing/) · [Checkpointing](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/dev/datastream/fault-tolerance/checkpointing/) — v2.3.0, 게시일 확인 안 함
- K11. [Apache Flink 2.3 — Apache Kafka Connector](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/connectors/datastream/kafka/) — v2.3.0, 게시일 확인 안 함
- K12. [Apache Flink 2.3 — Data Sinks](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/internals/sinks/) — v2.3.0, 게시일 확인 안 함
- K13. [Apache Flink 2.3 — Timely Stream Processing](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/concepts/time/) · [Generating Watermarks](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/dev/datastream/event-time/generating_watermarks/) · [Windows](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/dev/datastream/operators/windows/) — v2.3.0, 게시일 확인 안 함
- K14. [Apache Flink 2.3 — Performance Tuning (Table API & SQL)](https://nightlies.apache.org/flink/flink-docs-release-2.3/docs/dev/table/tuning/) — v2.3.0, 게시일 확인 안 함
- K15. [Apache Flink — An Overview of End-to-End Exactly-Once Processing in Apache Flink (with Apache Kafka, too!)](https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/) — 2018-02-28
- K16. [Apache Pinot — Stream Ingestion with Upsert](https://docs.pinot.apache.org/basics/data-import/upsert) · [Stream Ingestion with Dedup](https://docs.pinot.apache.org/basics/data-import/dedup) — 게시일 확인 안 함
- K17. [ClickHouse — ReplacingMergeTree](https://clickhouse.com/docs/engines/table-engines/mergetree-family/replacingmergetree) · [Deduplicating inserts on retries](https://clickhouse.com/docs/guides/developer/deduplicating-inserts-on-retries) — 게시일 확인 안 함

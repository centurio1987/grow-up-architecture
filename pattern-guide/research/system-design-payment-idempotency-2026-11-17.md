# 리서치 노트 — 결제 · 송금 중복 방지: 응답을 잃은 재시도가 두 번 결제되지 않게 한다

- 조사일: 2026-11-17. 자료 조사는 조사 워커 둘이 했고(기업 기술 글 · 표준과 결제사 공식 문서), 본문에 실을 만한 인용과 수치는 같은 날 원문 페이지를 다시 받아 문자열을 맞췄습니다. 출처마다의 대조 결과는 10절 표에 있습니다.
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 둘째 편(`payment-idempotency`, 사례 목록 [CT-05](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S6 의 산출물입니다.
- 표기: 「(계산)」은 출처 수치로 이 노트가 계산한 값, 「(가정)」은 가이드가 상황을 세우려고 정한 값, 「(판단)」은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `P` 로 시작합니다(앞 노트의 `V` · `C` · `L` 과 겹치지 않게). 사례 목록 CT-05 행의 C1~C5 는 이 노트의 P1 · P6 · P7 · P10 · P11 입니다.

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 멱등 키 · 4-2 같은 키가 또 왔을 때 · 4-3 결과를 모르는 상태 · 4-4 결제사 쪽 멱등 키 · 4-5 기록과 이벤트를 한 번에 · 4-6 대사) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 표 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 1. 이 노트의 결론

결제가 두 번 되는 것은 대개 코드가 같은 요청을 두 번 받아서가 아니라 **응답 하나를 잃어서**입니다. 서버는 결제를 마쳤는데 응답이 클라이언트에 도착하기 전에 연결이 끊기면, 클라이언트는 성공인지 실패인지 모릅니다. 다시 보내면 두 번 결제될 수 있고, 안 보내면 결제가 됐는지 모르는 채로 남습니다. RFC 9110 은 이 사정을 「Idempotent methods are distinguished because the request can be repeated automatically if a communication failure occurs before the client is able to read the server's response.」라고 적고, POST 같은 멱등하지 않은 메서드는 「A client SHOULD NOT automatically retry a request with a non-idempotent method unless it has some means to know that the request semantics are actually idempotent」라고 적습니다(P16). 결제 API 는 POST 이므로 **그 「some means」를 서버가 만들어 줘야** 합니다.

공개 사례가 만든 수단은 세 겹입니다.

1. **멱등 키** — 클라이언트가 결제 시도마다 고유한 값을 만들어 헤더에 싣고, 서버는 그 키로 첫 응답을 저장해 두었다가 재시도에 같은 응답을 돌려줍니다. Stripe(P1 · P2 · P3) · 토스페이먼츠(P7 · P8) · 포트원(P12) · Adyen(P13) · PayPal(P14)이 모두 이 방식이고, IETF 가 같은 이름의 헤더를 초안으로 다룹니다(P15).
2. **결과를 모르는 상태를 따로 둔다** — 서버가 외부 결제사를 부를 때도 같은 일이 생깁니다. 카카오페이 상품권 서버는 결과를 성공 · 실패 · 「알 수 없음(Unknown)」 셋으로 나누고, 알 수 없음은 저장해 두었다가 다시 처리합니다(P10). Stripe 는 500 응답을 「indeterminate」로 다루라고 적습니다(P3).
3. **대사(reconciliation)** — 마지막 확인은 결제사의 기록과 내부 기록을 맞춰 보는 일입니다. Shopify 는 「With reconciliation we make sure that our records are consistent with those of our financial partners.」라고 적고, 맞지 않으면 그 건을 DB 에 기록합니다(P6).

이 노트의 추천 구조(판단)는 **결제 DB 안에 멱등 키 표를 두고 결제 행과 같은 트랜잭션으로 쓰기, 결제 상태에 「알 수 없음」을 두기, 결제사를 부를 때는 우리 결제 id 를 결제사 쪽 멱등 키로 보내기, 하루 한 번 결제사 거래 내역과 대사하기**입니다. 근거와 버린 후보는 6절에 있습니다.

## 2. 요구사항 절에 쓸 근거 — 「두 번 결제되지 않는다」를 숫자로

결제사마다 멱등 키의 규칙이 다릅니다. 가이드의 요구 수치를 정할 때 기준으로 삼을 수 있는 값입니다.

| 결제사 · 표준 | 키 길이 | 보관 | 처리 중에 같은 키 | 같은 키에 다른 본문 | 출처 |
| --- | --- | --- | --- | --- | --- |
| IETF 초안 -08 | 문자열(MUST), 상한 없음 | 수치 없음, 만료 정책을 정해 문서에 공개(SHOULD) | 409(SHOULD) | 422(SHOULD) | P15 |
| Stripe API v1 | 255자까지 | 적어도 24시간, 그 뒤 지울 수 있음 | 409, 결과를 저장하지 않음 | 오류(코드는 확인 안 함) | P2 · P3 |
| 토스페이먼츠 | 300자까지 | 처음 요청한 날부터 15일 | 409 `IDEMPOTENT_REQUEST_PROCESSING` | 확인 안 함 | P8 |
| 포트원 V2 | 확인 안 함 | 3시간(「추후 변경 가능」) | 409 `IDEMPOTENCY_OUTSTANDING_REQUEST` | 「해서는 안 됩니다」, 응답은 확인 안 함 | P12 |
| Adyen | 64자까지 | 처음 보낸 뒤 7~14일 | 첫 요청이 끝나기 전의 중복에 422 또는 409, 오류 코드 704. 이미 처리한 요청의 재시도에는 첫 응답 | 확인 안 함 | P13 |
| PayPal Orders | UUID(38자 안) 권장 | 6시간, 72시간까지 늘릴 수 있음 | 확인 안 함 | 확인 안 함 | P14 |

- 위 값은 각 결제사의 정책입니다. 보관 기간이 3시간부터 15일까지 퍼져 있으므로 하나로 묶지 않습니다. 가이드는 자기 API 의 보관 기간을 가정으로 정하고, 결제사를 부를 때는 그 결제사의 값을 따른다고 씁니다(판단).
- 「같은 키에 다른 본문」을 오류로 돌려주는 상태 코드를 문서로 밝힌 곳은 IETF 초안(422)뿐입니다. Adyen 의 422 · 409 는 첫 요청이 끝나기 전에 온 중복에 대한 것입니다(P13). 토스페이먼츠 블로그는 422 를 「보내줘야 해요」라고 적지만(P7) 이는 일반 설명이고, 토스페이먼츠 API 가 실제로 422 를 돌려준다는 문장은 개발자센터에서 찾지 못했습니다(P8, 확인 안 함).
- **요구 표 후보(가정)**: 하루 결제 시도 500만 건, 피크는 평균의 10배. 같은 결제 시도(같은 멱등 키)는 몇 번 재시도해도 결제사 승인이 한 건이고, 재시도는 첫 응답과 같은 상태 코드와 본문을 받는다. 처리 중인 키는 409, 같은 키에 다른 본문은 422. 결제사 응답을 받지 못한 건은 실패로 확정하지 않고, 하루 안에 성공이나 실패로 확정한다. 멱등 확인이 결제 요청에 더하는 지연은 결제 DB 왕복 한 번 이내. 멱등 키는 24시간 보관.
- 보관 24시간은 Stripe v1 의 「at least 24 hours」(P3)와 Shopify 의 「typically 24 hours or less」(P6)에 맞춘 가정입니다. Shopify 문장은 보관 정책이 아니라 「An idempotency key needs to be unique for the time we want the request to be retryable」이라는, 재시도를 받아 줄 기간 동안 키가 유일해야 한다는 요건입니다.
- 결제사 호출의 읽기 타임아웃은 출처끼리 값이 크게 다릅니다. 포트원은 「최소 60초의 읽기 타임아웃 시간을 설정하도록 권장합니다」(P12, 결제사 응답 지연 때문), Shopify 는 일반 원격 호출에 「an open timeout of one second with a write and read or query timeout of five seconds is a decent starting point」라고 적습니다(P6). 두 글이 서로를 비교하지 않으므로, 가이드가 값을 고르려면 「짧게 잡으면 알 수 없음이 늘고, 길게 잡으면 연결을 오래 붙잡는다」는 맞바꿈을 가정과 함께 밝힙니다(판단).

## 3. 규모 추정 절에 쓸 계산

출처 수치는 없고 모두 가이드의 가정과 그 계산입니다.

1. 결제 시도: 하루 500만 건(가정) ÷ 86,400초 ≈ 초당 58건, 피크는 평균의 10배(가정)라 초당 약 580건(계산).
2. 멱등 키 표의 크기: 24시간 보관이면 표에 남는 행은 하루치 500만 행입니다(계산). 행 하나가 키 · 요청 지문 · 상태 · 저장한 응답 본문으로 1KB 라면(가정) 약 5GB 입니다(계산). 보관을 토스페이먼츠처럼 15일로 늘리면 75GB 가 됩니다(계산).
3. 결제 한 건이 DB 에 쓰는 트랜잭션: 시작(멱등 행 · 결제 행 「처리 중」)과 끝(결제 상태 · 응답 저장 · 아웃박스 행) 두 번이면 피크에 초당 약 1,160 트랜잭션입니다(계산). DB 한 대가 감당하는지는 하드웨어에 달려 있어 이 노트는 판단하지 않습니다(확인 안 함).
4. 「알 수 없음」의 양: Shopify 는 「At Shopify's scale, a once in a million chance of something unreliable occurring during payment processing means it's happening many times a day.」라고 적습니다(P6). 하루 500만 건에 100만 분의 1 이면 하루 5건입니다(계산). 결제사 호출 타임아웃 비율을 0.05% 로 두면(가정) 하루 2,500건이 확정을 기다립니다(계산). 가이드는 이 양이 「사람이 손으로 확인할 수 없는 크기」라는 데 쓸 수 있습니다(판단).
5. 재시도가 다시 겹치는 양: 클라이언트가 지수 백오프로 재시도하면 첫 실패 뒤 대기가 1초 · 2초 · 4초로 늘어납니다(가정). 지터가 없으면 같은 순간에 실패한 요청들이 같은 순간에 다시 옵니다. Stripe 는 이를 「We can address thundering herd by adding some amount of random "jitter" to each client's wait time.」로 적습니다(P1).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 멱등 키 — 누가 만들고, 무엇을 저장하는가

- **클라이언트가 만듭니다.** Stripe 블로그: 「When performing a request, a client generates a unique ID to identify just that operation and sends it up to the server」(P1). 키가 가리키는 것은 주문이 아니라 **한 번의 결제 시도(operation)** 입니다(판단, 근거는 이 문장의 「just that operation」).
- **형식**: Stripe 는 「we suggest using V4 UUIDs, or another random string with enough entropy to avoid collisions」(P2), IETF 초안은 「It is RECOMMENDED that a UUID [RFC9562] or a similar random identifier be used as an idempotency key.」(P15). Shopify 는 ULID 를 씁니다. 「We prefer using an Universally Unique Lexicographically Sortable Identifier (ULID) for these idempotency keys instead of a random version 4 UUID.」 이유는 시각 순으로 정렬돼 B-tree 색인에 유리하다는 것이고, 「In one high-throughput system at Shopify we've seen a 50 percent decrease in INSERT statement duration by switching from UUIDv4 to ULID for idempotency keys.」라고 적습니다(P6). Stripe 는 키에 이메일 같은 개인 정보를 쓰지 말라고 적습니다(P2, 조사 워커가 원문 마크다운으로 받음).
- **무엇을 저장하는가**: Stripe v1 은 「Stripe saves the status code and body of the first request made with a given idempotency key after endpoint execution begins. Retries with the same key return the saved response, including `500` errors.」(P2). 첫 응답을 그대로 저장해 돌려주는 방식입니다. PayPal 은 다르게 「PayPal returns the latest status of the previous request that used that same header.」(P14) — 첫 응답이 아니라 그 시점의 상태를 돌려줍니다. 가이드는 둘 중 하나를 고르고 이유를 적어야 합니다(판단, 추천은 첫 응답 저장 — 재시도가 받은 응답과 첫 응답이 같아야 클라이언트 로직이 단순해짐).
- **같은 요청인지 무엇으로 아는가**: 토스페이먼츠는 「토스페이먼츠 서버에서는 멱등한 요청인지 식별하기 위해 API 요청 헤더로 보낸 멱등키와 API 키, API 주소, HTTP 메서드 조합을 확인해요.」(P7). 개발자센터에는 「API 키, API 주소, HTTP 메서드가 다르다면 같은 멱등키를 사용해도 괜찮습니다.」(P8). 키만이 아니라 호출한 쪽과 엔드포인트를 함께 묶는다는 점을 가이드의 표 설계(유일 제약의 열)에 쓸 수 있습니다(판단).
- **어디에 저장하는가**: 공개 1차 글 가운데 저장소를 밝힌 것은 토스페이먼츠 블로그의 「멱등키 DB」(P7, 종류는 밝히지 않음)뿐입니다. Brandur 의 개인 글(P21)은 Postgres 표와 `locked_at` 열을 쓰는 설계를 보이지만 Stripe 공식 글이 아니므로 Stripe 시스템으로 인용하지 않습니다.

### 4-2. 같은 키가 또 왔을 때 — 끝난 뒤 · 처리 중 · 다른 본문

IETF 초안은 경우를 셋으로 나눕니다(P15, 2.6 · 2.7절).

- **끝난 뒤의 재시도**: 「The resource SHOULD respond with a response consistent with the request being completed according to the user's intent.」 Stripe 는 재생한 응답에 `Idempotent-Replayed: true` 헤더를 붙입니다(P3).
- **처리 중의 재시도**: 「If the request is retried, while the original request is still being processed, the resource SHOULD reply with an HTTP 409 status code with body containing problem description.」 Stripe 의 안내는 「If a `409` indicates that another request with the same key is still executing, wait and retry with that key and the same parameters.」(P3). Stripe 는 이 경우 결과를 저장하지 않습니다 — 「or the request conflicts with another request that's executing concurrently, we don't save the idempotent result」(P2).
- **다른 본문**: 「If there is an attempt to reuse an idempotency key with a different request payload, the resource SHOULD reply with an HTTP 422 status code」(P15). Stripe 는 「The idempotency layer compares incoming parameters to those of the original request and errors if they're not the same to prevent accidental misuse.」(P2).
- 셋 다 SHOULD 입니다. 가이드는 「초안이 권한다」로 쓰고 「표준이 요구한다」로 쓰지 않습니다. 초안은 아직 RFC 가 아니고(P15, -08 · 2026-10-22 · 만료 2027-04-25), 부록에 「Adopted the proposed text for the Retry case (#48); still open for discussion」이라고 재시도 문구가 아직 논의 중임을 적습니다.
- **처리 중을 어떻게 아는가(판단)**: 멱등 행을 「처리 중」으로 먼저 INSERT 하고, 키 열의 유일 제약으로 둘째 INSERT 를 막으면 동시에 온 두 요청 가운데 하나만 처리합니다. 파일럿 2(선착순 쿠폰)의 「마지막 확인은 DB 유니크 제약」과 같은 도구입니다.

### 4-3. 결과를 모르는 상태 — 성공 · 실패 · 알 수 없음

- 카카오페이 상품권 서버: 「대표적으로 타임아웃과 같은 상황은 요청에 대한 성공 응답을 받지 못했지만, 트랜잭션의 결과가 성공했는지 실패했는지 명확하게 판단하기 어려운 경우입니다.」 「이런 상황을 쉽게 실패로 간주하면 꽤나 난감한 상황이 벌어질 수 있습니다.」(P10). 결과는 「성공(Success), 실패(Failure) 그리고 '알 수 없음(Unknown)'으로 나뉘어질 수 있고」, 고객 응답 전 후처리가 실패하면 「'알 수 없는 상태(Unknown)'로 저장 후 사용자에게는 재시도 안내와 함께 응답을 하게 됩니다.」 고객이 다시 시도하면 「해당 결제건이 알수없음으로 저장된 트랜잭션인지 확인하고 후처리를 다시 진행」합니다. 그래도 실패하면 「다른 장치들로 데이터를 보정하고 있습니다」 — 그 장치가 무엇인지는 글에 없습니다(확인 안 함).
- 같은 글은 결과를 모를 때의 선택지로 즉시 재요청 · 일정 시간 뒤 재시도 · 성공 여부 확인 뒤 재시도 · 결제 취소(보상 트랜잭션) · 수기 처리를 나열하고, 「결제 서버에서 트랜잭션 결과를 확인할 수 있는 API 또는, 결제 취소(무효화) API 등을 제공해야 할 필요도 있습니다」라고 적습니다(P10, 조사 워커 요약 — 목록 항목은 재대조 안 함). 카카오페이가 그중 무엇을 썼는지는 글에 없습니다.
- Stripe: 「Treat the outcome of a request that returns `500` as indeterminate: the operation might have produced side effects even though you received an error.」(P3). 24시간 창이 지나도 모르면 「If the outcome is still unknown after that window, don't retry with either the old key or a new one.」 대신 객체를 조회하고 웹훅으로 맞추라고 적습니다(P3).
- **결제 상태 이름**: Stripe PaymentIntent 는 `requires_payment_method` · `requires_confirmation` · `requires_action` · `processing` · `requires_capture` · `canceled` · `succeeded` 일곱이고(P5), 결제 시도가 실패하면 「the PaymentIntent's status returns to `requires_payment_method` so that the payment can be retried」(P4). 토스페이먼츠 결제 객체는 `READY` · `IN_PROGRESS` · `WAITING_FOR_DEPOSIT` · `DONE` · `CANCELED` · `PARTIAL_CANCELED` · `ABORTED` · `EXPIRED` 이고 `ABORTED` 는 「결제 승인이 실패한 상태입니다」(P9). 둘 다 **결제사가 보는 상태**라 「알 수 없음」이 없습니다. 알 수 없음은 결제사를 부르는 **우리 쪽**에만 생기는 상태입니다(판단).
- 공개 1차 글 가운데 「시작 · 처리 중 · 성공 · 실패 · 알 수 없음」의 상태와 전이를 한 글에서 모두 보인 것은 찾지 못했습니다. 가이드의 상태 기계는 위 근거를 묶은 이 노트의 설계(판단)로 밝혀 씁니다.

### 4-4. 결제사 쪽 멱등 키 — 우리가 클라이언트가 될 때

- 결제 API 서버도 결제사 앞에서는 클라이언트입니다. 결제사 호출이 타임아웃 나면 4-3 의 「알 수 없음」이 됩니다. 이때 같은 멱등 키로 다시 부르면 결제사가 한 번만 승인합니다. 토스페이먼츠: 「네트워크 이슈나 타임아웃 문제로 응답을 받지 못했을 때도 안전하게 같은 요청을 다시 보낼 수 있습니다.」(P8). 포트원은 「서버에서 요청 처리 중에 클라이언트 측에서 연결을 끊은 경우에도 요청이 취소되지 않습니다」에 이어 「같은 멱등 키로 같은 요청을 재시도하면 결과를 확인할 수 있습니다」라고 적습니다(P12, 앞 문장은 조사 워커 요약에만 있고 뒤 문장은 원문 대조 함).
- **조회 API**: 토스페이먼츠는 승인된 결제를 `paymentKey` 나 `orderId` 로 조회하는 API 를 둡니다(P9, 조사 워커 요약). 승인 응답을 못 받았을 때 「조회하라」고 적은 문장은 찾지 못했습니다(확인 안 함). 가이드에서 「같은 키로 재요청하거나 조회해 확정한다」는 이 노트의 설계(판단)로 씁니다.
- **결제사 키의 보관 기간이 우리 재시도 창보다 길어야 합니다(판단).** 토스페이먼츠 15일(P8), 포트원 3시간(P12)처럼 결제사마다 다르고, 결제사 키가 지워진 뒤 같은 키로 부르면 Stripe 처럼 「We generate a new request if a key is reused after the original is pruned.」(P2) — 새 요청이 됩니다.
- **승인 만료**: 토스페이먼츠는 「결제 인증이 유효한 10분 안에 상점에서 결제 승인 API를 호출하지 않으면 해당 결제는 만료됩니다」라고 적고, 같은 문서의 `EXPIRED` 정의는 「유효 시간 30분이 지나 거래가 취소된 상태입니다」입니다(P9). 두 시간이 어느 시점부터인지는 문서에서 가리지 못했습니다(확인 안 함). 가이드에 결제사 이름을 붙여 쓰지 않는다면 이 값은 쓰지 않습니다(판단).

### 4-5. 기록과 이벤트를 한 번에 — 아웃박스

- 결제가 성공하면 주문 서비스 같은 다른 서비스에 알려야 합니다. 결제 DB 에 「성공」을 쓰는 것과 메시지를 보내는 것이 따로면, 둘 사이에서 멈출 때 한쪽만 남습니다. 트랜잭셔널 아웃박스는 이 문제를 「How to atomically update the database and send messages to a message broker?」로 묻고, 메시지를 먼저 같은 DB 의 표에 쓰는 것으로 풉니다. 결과는 「Messages are guaranteed to be sent if and only if the database transaction commits」입니다(P17). 2단계 커밋은 「2PC is not an option.」이라고 배제합니다(P17).
- 이 글은 결제를 특정하지 않은 일반 정의입니다. 결제에 쓰는 것은 가이드의 적용입니다(판단).
- **멱등 행도 같은 이유로 결제 DB 안에 둡니다(판단).** 멱등 키를 Redis 에 두고 결제 행을 DB 에 두면 둘 사이에서 멈출 때 「키는 끝났다고 저장됐는데 결제 행이 없음」이나 그 반대가 생깁니다. 아웃박스가 풀려는 것과 같은 두 저장소 쓰기 문제입니다(판단, 근거 P17 의 문제 문장).

### 4-6. 대사 — 결제사 기록과 우리 기록을 맞춘다

- Shopify: 「With reconciliation we make sure that our records are consistent with those of our financial partners.」 「In case of a mismatch, we record the anomaly in our database.」 자동 보정을 시도하고, 보정에 기대기보다 「preferring solutions that prevent anomalies from being created in the first place」라고 적습니다(P6, 세 문장 모두 대조 함). 주기는 글에 없습니다.
- 결제사가 대사용 기록을 줍니다. Stripe Payout reconciliation 보고서는 「helps you match the payouts you receive in your bank account with the batches of payments and other transactions that they relate to」(P18), Adyen Settlement details report 는 거래 단위 대사에 쓰고 상점이 결제 요청에 넣은 `Merchant Reference` 가 열에 있습니다(P19). 토스페이먼츠는 기록을 둘로 나눕니다. 정산 조회 API 는 「정산 기록은 결제가 일어난 다음 날부터 조회됩니다」이고, 거래 조회 API(`GET /v1/transactions`)는 「거래 기록은 거래가 처리된 시점( transactionAt )을 기준으로 조회합니다」, 「거래가 일어난 당일부터 거래 기록을 조회할 수 있습니다」입니다. 같은 문서는 「거래 기록을 비교하는 일을 '거래 대사'라고 부르기도 합니다」라고 적습니다(P9). 이 가이드의 대사가 맞추는 것은 거래 기록이므로, 「다음 날」은 거래 대사의 근거가 아닙니다.
- 대사의 키: 결제사 기록에 **우리가 보낸 값**(주문 id · Merchant Reference · 메타데이터)이 남아야 우리 행과 짝을 지을 수 있습니다(판단, 근거 P18 의 `payment_metadata` 열 · P19 의 `Merchant Reference`).
- 대사 결과 분류: 포트원 블로그는 대사일치 · 대사불일치 · 대사불능 · 수집전거래로 나눕니다(P20, 솔루션 업체 글 · 조사 워커 요약). 가이드는 이 분류 이름을 쓰지 않고 「양쪽 다 있고 맞음 · 양쪽 다 있는데 다름 · 한쪽에만 있음」으로 풀어 씁니다(판단).
- 한국 PG 사 · 핀테크가 직접 쓴 대사 기술 글은 이번 조사에서 찾지 못했습니다.

## 5. 시나리오 절에 쓸 반례와 장애

시나리오 셋(기본 · 부하 · 장애)에 넣을 수 있는 상황입니다. 모두 가상 시계와 사건 순서로 재현할 수 있습니다(판단, 앞 편과 같은 방식).

1. **기본 — 응답이 사라진 재시도**: 결제가 성공하고 응답이 클라이언트로 가는 길에서 사라집니다. 클라이언트가 같은 키로 다시 보내면 저장한 응답이 나가고 결제사 승인은 한 번뿐입니다. 키가 없으면 같은 재시도가 두 번째 승인이 됩니다(반례, 한 실행에서 나란히 보일 수 있음).
2. **부하 — 같은 키가 동시에 둘**: 버튼을 두 번 누르거나 클라이언트가 너무 빨리 재시도하면 처리 중인 키가 또 옵니다. 유일 제약으로 하나만 처리하고 다른 하나는 409 를 받은 뒤 기다렸다 다시 보내 저장한 응답을 받습니다. 같은 키에 금액만 다른 요청은 422 입니다.
3. **부하의 반례 — 짧은 잠금만 쓸 때**: 카카오페이 혜택 서버의 글(P11)에는 서로 다른 두 일이 있습니다. 하나는 퀴즈 보상의 중복 클릭(「따닥 이슈」)을 Redis 분산 락으로 막은 일이고 「이때 TTL(Time To Live)은 3초로 설정했습니다」. 다른 하나는 매일모으기 서비스를 옮길 때, 중복 요청에 실패 응답을 주던 구현을 두고 「하지만 이는 멱등성이 지켜지지 않는다고 판단되어, 플랫폼과 논의 후에 멱등성을 지키기 위한 로직을 추가하기로 결정했습니다」라고 적은 일입니다. 둘은 다른 절의 다른 문제라, 잠금을 쓰다가 멱등성 로직으로 옮겼다고 잇지 않습니다. 앞의 것은 대안 B 의 선례로, 뒤의 것은 「중복 요청에 실패가 아니라 첫 결과를 돌려준다」는 응답 저장의 선례로 씁니다. 잠금이 풀린 뒤(3초 뒤) 온 재시도가 다시 처리된다는 것은 실행으로 보일 수 있습니다(판단). 이 글의 대상은 결제가 아니라 「페이포인트 리워드」 지급입니다.
4. **장애 — 결제사가 승인했는데 응답이 타임아웃**: 결제 행을 「알 수 없음」으로 두고 클라이언트에는 확정되지 않았다는 응답을 줍니다. 다음 재시도나 확정 작업이 결제사에 같은 키로 다시 묻거나 조회해 「성공」으로 확정합니다. 결제사도 응답하지 않으면 알 수 없음으로 남고, 하루 대사가 결제사 거래 내역과 맞춰 확정합니다.
5. **장애의 반례 — 타임아웃을 실패로 확정**: 알 수 없음을 실패로 처리하고 사용자가 새로 결제하면, 결제사에는 첫 승인과 새 승인이 둘 다 남습니다(이중 결제). 카카오페이의 「쉽게 실패로 간주하면」(P10)을 그대로 보이는 반례입니다.
6. **장애의 반례 — 새 키로 다시 부름**: 결제사 호출을 재시도할 때마다 새 키를 만들면 결제사 쪽 멱등 키가 소용없어 두 번 승인됩니다. Stripe 의 「don't retry with either the old key or a new one」(P3)은 창이 지난 뒤의 규칙이지만, 새 키가 새 결제가 된다는 같은 사실 위에 있습니다(판단).

## 6. 대안 비교 절에 쓸 후보 구조

| 후보 | 중복을 막는 곳 | 응답 유실 뒤 재시도 | 결과를 모를 때 | 근거 |
| --- | --- | --- | --- | --- |
| A. 멱등 키 없음, 클라이언트는 재시도하지 않음 | 없음 | 사용자가 다시 누르면 이중 결제, 안 누르면 결과 모름 | 실패로 보거나 사람이 확인 | P16 의 SHOULD NOT · P10 |
| B. 화면 중복 클릭 방지 + Redis 잠금(TTL 수 초) | 잠금이 살아 있는 동안만 | 잠금이 풀린 뒤의 재시도는 다시 처리, 저장한 응답 없음 | 다루지 않음 | P11 |
| C. 멱등 키와 응답을 Redis 에, 결제는 DB 에 | Redis | 저장한 응답 재생 | 두 저장소 사이 불일치가 새로 생김 | P17 의 문제 문장(판단) |
| D. 결제 DB 안 멱등 표(같은 트랜잭션) + 「알 수 없음」 상태 + 결제사 멱등 키 + 하루 대사 | DB 유일 제약 | 저장한 응답 재생, 결제사 승인 한 번 | 같은 키로 재요청 · 조회 · 대사로 확정 | P2 · P3 · P8 · P10 · P6 · P17 |
| E. 주문 id 유일 제약(주문당 결제 한 건) | DB 유일 제약 | 같은 주문의 재시도는 막음 | 다루지 않음 | P4(판단) |

- **E 를 버리는 이유(판단)**: 실패한 결제를 다른 카드로 다시 하는 것도 같은 주문의 두 번째 결제입니다. Stripe 는 실패하면 `requires_payment_method` 로 돌아가 「so that the payment can be retried」라고 적습니다(P4). 주문을 키로 쓰면 이 재결제를 막거나, 막지 않으려고 예외를 두게 됩니다. 멱등 키는 주문이 아니라 시도를 가리킵니다(4-1).
- **C 를 버리는 이유(판단)**: 4-5 의 두 저장소 쓰기 문제입니다. Redis 쪽이 빠르다는 이점은 3절 3번의 트랜잭션 수가 DB 한 대에 무리일 때만 의미가 있고, 그 판단은 이 노트가 하지 않습니다.
- **전환점(판단)**: 결제사가 멱등 키를 지원하지 않으면 재요청 전에 반드시 조회합니다. 결제 시도가 DB 한 대의 쓰기 한계를 넘으면 멱등 표와 결제 표를 같은 키로 함께 나눕니다(같은 트랜잭션을 지키려면 같은 조각에 있어야 함). 클라이언트의 재시도 창이 24시간보다 길어지면 보관 기간을 늘리고 3절 2번의 크기를 다시 계산합니다.
- **사례 목록과 다른 점**: 사례 목록 CT-05 행의 핵심 기술은 「멱등 키, 결제 상태 기계, 대사」이고, 이 노트는 여기에 결제사 쪽 멱등 키와 아웃박스를 더했습니다. 둘 다 위 출처(P8 · P12 · P17)에서 나온 것입니다.

## 7. 실제 사례 절에 쓸 대응표

| 회사 | 무엇을 했나 | 이 가이드의 어느 자리 | 출처 |
| --- | --- | --- | --- |
| Stripe | 클라이언트가 만든 `Idempotency-Key`, 첫 응답(500 포함) 저장, 255자, 적어도 24시간, 처리 중 409, 다른 매개변수는 오류, `Idempotent-Replayed`, 500 은 불확정, 지수 백오프와 지터 | 멱등 키 · 같은 키가 또 왔을 때 · 결과를 모르는 상태 | P1 · P2 · P3 |
| Shopify | ULID 키(INSERT 시간 50% 감소), 「typically 24 hours or less」, 결제사에 한 번만 보냄, 낮은 타임아웃, 대사와 anomaly 기록 | 멱등 키 · 대사 · 타임아웃 맞바꿈 | P6 |
| 토스페이먼츠 | `Idempotency-Key` 300자 · 15일, 키 + API 키 + 주소 + 메서드 조합으로 식별, 처리 중 409, 결제 상태 8개, 정산 조회 | 멱등 키 · 결제사 쪽 멱등 키 · 대사 | P7 · P8 · P9 |
| 카카오페이(상품권) | 성공 · 실패 · 알 수 없음 셋, 알 수 없음 저장 뒤 재시도 안내, 거래마다 유니크 키(`tx_key`) | 결과를 모르는 상태 · 시나리오 4 · 5 | P10 |
| 카카오페이(혜택) | 퀴즈 보상의 중복 클릭을 Redis 분산 락 TTL 3초로 막음. 다른 서비스(매일모으기)를 옮길 때는 중복 요청에 실패를 주던 구현을 멱등성 로직으로 바꿈(서로 다른 절의 일) | 대안 B · 응답 저장 | P11 |
| 포트원 | 3시간 보장, 처리 중 409, 읽기 타임아웃 최소 60초 권장, 같은 키 재시도로 결과 확인 | 결제사 쪽 멱등 키 · 타임아웃 맞바꿈 | P12 |
| Adyen | 64자 · 7~14일, 첫 요청이 끝나기 전의 중복에 422 또는 409(704), 이미 처리한 요청의 재시도에는 첫 응답 | 요구 표의 비교 | P13 |
| PayPal | `PayPal-Request-Id`, 첫 응답이 아니라 현재 상태를 돌려줌, Orders 6시간(72시간까지) | 무엇을 저장하는가의 대비 | P14 |

- Airbnb 의 이중 결제 방지 글(Orpheus, 2019 무렵)은 원문이 열리지 않아(Medium 403) 이 노트에 넣지 않았습니다. 2차 요약 글의 문장은 Airbnb 문장으로 인용하지 않습니다.
- 송금(계좌 이체) 사례의 기업 기술 글은 찾지 못했습니다. 가이드의 상황은 카드 결제로 세우고, 송금은 같은 구조가 쓰이는 자리로만 언급합니다(판단).
- 「망취소」를 다룬 기업 기술 글은 찾지 못했습니다. 카카오페이는 결제 취소를 「보상 트랜잭션」으로 적습니다(P10).

## 8. 구현 코드 절에 쓸 메모

- 시나리오는 가상 시계(밀리초)와 (시각, 등록 순서)로 정렬한 사건으로 재현합니다. 앞 편과 같은 틀입니다.
- 결제 DB 는 메모리 대역(`Map` 셋: 멱등 표 · 결제 표 · 아웃박스)으로 두고, 트랜잭션은 「한 사건 안에서 세 표를 함께 바꾸거나 하나도 안 바꾸는 함수」로 표현합니다. 유일 제약은 멱등 표에 키가 이미 있으면 INSERT 가 실패하는 것으로 보입니다.
- 결제사는 대역 하나로 두고, 자기 멱등 표(키 → 승인 결과)와 장애 주입(승인은 하고 응답을 잃음 · 응답 없음)을 둡니다. 승인 횟수를 세어 「결제사 승인 N건」을 출력합니다.
- 요청 지문은 본문 문자열의 간단한 해시(세 언어에서 같은 값이 나오는 정수 해시)로 둡니다. 암호 해시는 세 언어 표준 라이브러리 차이를 만들 수 있어 쓰지 않습니다(판단, 명세 SD26 결정성 규칙).
- 고정할 출력 후보: 키 없는 재시도의 결제사 승인 2건 대 키 있는 재시도 1건, 처리 중 409 와 재시도 뒤 재생(`replayed=true`), 다른 본문 422, 잠금 TTL 3초 뒤 재시도의 승인 2건, 타임아웃을 실패로 확정했을 때의 승인 2건 대 알 수 없음으로 둔 뒤 확정한 1건, 대사가 찾은 불일치 수와 확정한 건수.
- 세 언어 출력의 글자 단위 일치를 위해 금액은 정수(원)로 다루고, 시각은 정수 밀리초로 찍습니다.

## 9. 미해결 질문

1. Stripe 가 같은 키에 다른 매개변수일 때 돌려주는 상태 코드와 오류 코드는 확인 안 함입니다. 오류 문서의 상태 표에는 「409 Conflict The request conflicts with another request, potentially due to using the same idempotent key.」만 있습니다(P3).
2. 토스페이먼츠 API 가 같은 키에 다른 본문일 때 무엇을 돌려주는지는 개발자센터에서 찾지 못했습니다. 블로그의 422 는 일반 설명입니다(P7).
3. Adyen 의 704 가 422 와 409 가운데 언제 무엇인지는 원문이 「returns an HTTP 422 – Unprocessable Entity or HTTP 409 - Conflict status」라고만 적습니다(P13).
4. 토스페이먼츠의 승인 10분과 `EXPIRED` 30분의 기준 시점은 확인 안 함입니다(P9).
5. Airbnb Orpheus 원문(Medium)은 403 으로 열리지 않았습니다. 다른 환경에서 열리면 「외부 호출 앞 · 호출 · 뒤」 세 단계 설계를 대안이나 실제 사례에 더할 수 있습니다.
6. 사례 목록 CT-05 행의 근거 XU2(Alex Xu 2권 결제 시스템 장)와 Hello Interview 결제 시스템 분석은 이번에 내용을 열어 보지 않았습니다. 가이드 본문에는 쓰지 않습니다.
7. IETF 초안 -08 의 재시도 문구(#48)는 논의 중입니다. 집필 날 -09 가 나왔는지 다시 확인합니다.
8. 3절의 하루 500만 건 · 피크 10배 · 행 1KB · 타임아웃 0.05% 는 모두 가정입니다. 출처를 찾으면 그 값으로 바꿉니다.

## 10. 원문 대조

대조 날짜는 모두 2026-11-17 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트에서 문자열을 찾은 것이고(따옴표 모양 · 공백만 맞춤), 「조사 워커 원문」은 조사 워커가 원문 마크다운으로 받았으나 이 노트가 다시 찾지 않은 것, 「요약기 경유」는 페이지를 읽은 도구의 요약 안에 따옴표로 들어 있던 문장이라 글자 단위로 확정하지 못한 것입니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 같은 글 안의 다른 값 · 대상 · 동사 |
| --- | --- | --- | --- |
| P1 Stripe 블로그 | 글자 그대로 | 클라이언트가 키를 만듦 · 같은 ID 로 재시도 · 캐시한 결과 응답 · 지수 백오프 · 지터 | 보관 기간 · 저장소 · 상태 기계는 이 글에 없음. 원칙 서술(권고) |
| P2 Stripe 멱등 요청 문서 | 글자 그대로 | 첫 응답(500 포함) 저장 · 255자 · 24시간 뒤 지울 수 있음 · 매개변수 비교 · 동시 충돌은 저장 안 함 · 지운 뒤 같은 키는 새 요청 | 「you can remove … at least 24 hours old」 — 24시간 뒤 반드시 지운다는 뜻 아님. v2 는 동작이 다름(조사 워커 원문) |
| P3 Stripe 오류 처리 문서 | 글자 그대로 | 500 은 불확정 · 24시간 보관 · 창이 지나면 옛 키도 새 키도 쓰지 말 것 · `Idempotent-Replayed: true` · 409 면 같은 키 · 같은 매개변수로 기다렸다 재시도 · 상태 표의 409 | v1 안내이고 v2 는 「30-day window」 |
| P4 Stripe PaymentIntent 수명 | 글자 그대로 | 실패하면 `requires_payment_method` 로 돌아가 재시도 · 취소는 되돌릴 수 없음 | 일부 결제 수단은 `processing` 에서도 취소 가능(조사 워커 원문) |
| P5 Stripe PaymentIntent 객체 | 조사 워커 원문 | 상태 일곱 | — |
| P6 Shopify | 글자 그대로 | 「typically 24 hours or less」 · ULID 와 50% · 결제사에 한 번 · 타임아웃 1초/5초 · 타임아웃 난 결제 호출은 안전하게 재시도 · 100만 분의 1 · 대사 세 문장 | 24시간은 보관 정책이 아니라 유일해야 하는 기간. 타임아웃 값은 「decent starting point」(제안). 대사 주기 없음. 키를 누가 만드는지 명시 없음 |
| P7 토스페이먼츠 블로그 | 글자 그대로 | 키 + API 키 + 주소 + 메서드 조합 · 422 · 409 · UUID v4 | 422 · 409 는 일반 설명(「보내줘야 해요」). 원문은 「UUID v4 와」로 띄어 씀 |
| P8 토스페이먼츠 멱등키 문서 | 글자 그대로 | 15일 · 300자 · `IDEMPOTENT_REQUEST_PROCESSING` · 다른 키 · 주소 · 메서드면 같은 키 가능 · 타임아웃 뒤 같은 요청 재전송 | 같은 키 다른 본문의 응답은 없음 |
| P9 토스페이먼츠 코어 API | 글자 그대로 | 결제 상태 이름 · `ABORTED` 정의 · 승인 10분 · `EXPIRED` 30분 · 정산 기록은 다음 날부터 · 거래 기록은 거래 시점 기준이고 당일부터 · 「거래 대사」 | 10분과 30분의 기준 시점이 다름(9절 4번). 결제 조회 API 는 조사 워커 요약 |
| P10 카카오페이 상품권 | 글자 그대로 | 결과를 모르는 경우의 정의 · 「쉽게 실패로 간주하면」 · 성공 · 실패 · 알 수 없음 · 알 수 없음 저장 뒤 재시도 안내 · 유니크 값 · 다른 장치로 보정 | 후처리 선택지 목록은 조사 워커 요약. 재시도 1회는 조사 워커가 코드에서 읽은 해석이라 쓰지 않음 |
| P11 카카오페이 혜택 | 글자 그대로 | 분산 락 TTL 3초(퀴즈 보상 중복 클릭 절) · 멱등성이 지켜지지 않는다고 판단해 로직 추가(매일모으기 이관 절) · 대상은 페이포인트 리워드 | 결제 · 송금이 아님. 두 문장은 다른 절의 다른 문제라 한 흐름으로 잇지 않음 |
| P12 포트원 V2 개요 | 글자 그대로 | 3시간 · 다른 요청에 같은 키 금지 · `IDEMPOTENCY_OUTSTANDING_REQUEST` · 읽기 타임아웃 최소 60초 권장 · 같은 키 재시도로 결과 확인 | 「추후 변경 가능」. 연결을 끊어도 취소되지 않는다는 앞 문장은 조사 워커 요약 |
| P13 Adyen 멱등 문서 | 글자 그대로 | 64자 · 7~14일 · 첫 요청이 끝나기 전의 중복에 422 또는 409 와 704 · 「the response to the first attempt will be returned without duplication」 | 다른 본문은 다루지 않음 |
| P14 PayPal | 글자 그대로 | 현재 상태를 돌려줌 · 38자 · 모든 API 가 지원하지 않음 · Orders 6시간 · 72시간 | 환불 예시의 45일은 요약기 경유. 문서 안에서 API 마다 값이 다름 |
| P15 IETF 초안 -08 | 글자 그대로(텍스트판) | 2.2 유일성 MUST · UUID RECOMMENDED · 2.3 만료 정책 공개 SHOULD · 2.6 경우 셋 · 2.7 의 400 · 422 · 409 SHOULD · 판 날짜와 만료 · 부록의 #48 | RFC 아님. 보관 기간 수치 없음 |
| P16 RFC 9110 | 글자 그대로(텍스트판) | 9.2.2 멱등 정의 · 통신 실패 뒤 자동 재시도 · 멱등하지 않은 메서드는 자동 재시도 SHOULD NOT | — |
| P17 microservices.io 아웃박스 | 글자 그대로 | 문제 문장 · 「if and only if the database transaction commits」 · 「2PC is not an option.」 | 결제를 특정하지 않은 일반 정의. 게시일 없음 |
| P18 Stripe 보고서 | 조사 워커 원문 | Payout reconciliation 의 용도 문장 · 항목 열 | — |
| P19 Adyen Settlement details | 요약기 경유 | 거래 단위 대사 · `Merchant Reference` | — |
| P20 포트원 블로그 | 요약기 경유 | 대사 결과 네 분류 | 솔루션 업체 글. 본문에는 분류 이름을 쓰지 않음 |
| P21 Brandur | 요약기 경유 | Postgres 표 · `locked_at` · 잠긴 키에 409 | Stripe 공식 글 아님 |

## 11. 출처

조회일은 모두 2026-11-17 입니다.

- P1. [Stripe — Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency) — 2017-02-22
- P2. [Stripe API Reference — Idempotent requests](https://docs.stripe.com/api/idempotent_requests) — 게시일 확인 안 함
- P3. [Stripe — Advanced error handling](https://docs.stripe.com/error-low-level) — 게시일 확인 안 함
- P4. [Stripe — How PaymentIntents and SetupIntents work](https://docs.stripe.com/payments/paymentintents/lifecycle) — 게시일 확인 안 함
- P5. [Stripe API Reference — The PaymentIntent object](https://docs.stripe.com/api/payment_intents/object) — 게시일 확인 안 함
- P6. [Shopify — Building Resilient Payment Systems](https://shopify.engineering/building-resilient-payment-systems) — 2022-07-28
- P7. [토스페이먼츠 — 멱등성이 뭔가요?](https://www.tosspayments.com/blog/articles/dev-1) — 2023-01-11
- P8. [토스페이먼츠 개발자센터 — 멱등키](https://docs.tosspayments.com/reference/using-api/idempotency-key) — 게시일 확인 안 함
- P9. [토스페이먼츠 개발자센터 — 코어 API](https://docs.tosspayments.com/reference) — 게시일 확인 안 함
- P10. [카카오페이 — MSA 환경에서 네트워크 예외를 잘 다루는 방법](https://tech.kakaopay.com/post/msa-transaction/) — 2022-05-25
- P11. [카카오페이 — 유저향 서비스를 개발하며 마주쳤던 이슈와 해결 방안](https://tech.kakaopay.com/post/troubleshooting-logs-as-a-junior-developer/) — 2024-11-05
- P12. [포트원 개발자센터 — REST API V2 개요](https://developers.portone.io/api/rest-v2/overview) — 게시일 확인 안 함
- P13. [Adyen — API idempotency](https://docs.adyen.com/development-resources/api-idempotency) — 게시일 확인 안 함
- P14. [PayPal — Idempotency](https://developer.paypal.com/api/rest/reference/idempotency/) · [PayPal — Orders API use cases](https://developer.paypal.com/api/rest/integration/orders-api/api-use-cases/advanced) — 최종 수정 2026-10-02(페이지 표기, 조사 워커 확인)
- P15. [draft-ietf-httpapi-idempotency-key-header-08](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-08) — 2026-10-22(초안, 만료 2027-04-25)
- P16. [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) — 2022-06
- P17. [Chris Richardson — Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) — 게시일 확인 안 함
- P18. [Stripe — Payout reconciliation report](https://docs.stripe.com/reports/payout-reconciliation) · [Stripe — Balance summary report](https://docs.stripe.com/reports/balance) — 게시일 확인 안 함
- P19. [Adyen — Settlement details report](https://docs.adyen.com/reporting/settlement-reconciliation/transaction-level/settlement-details-report) — 게시일 확인 안 함
- P20. [포트원 블로그 — PG 거래대사란?](https://blog.portone.io/opi_reconciliation/) — 2024-12-19
- P21. [Brandur Leach — Implementing Stripe-like Idempotency Keys in Postgres](https://brandur.org/idempotency-keys) — 2017-10-27

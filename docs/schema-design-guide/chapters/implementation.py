def build(B):
 s,p,h,t,c,a,n=B
 s('domain-derivation','제15장','개념에서 도메인 모델로: 클래스를 복사하지 않고 책임을 정한다',
 p('개념 스키마에 Order와 OrderLine이 있다고 해서 곧바로 ORM 클래스 두 개를 만들면 도메인 모델이 완성되는 것은 아니다. 실행 가능한 도메인 모델은 데이터가 허용되지 않는 방식으로 바뀌는 것을 막고, 업무 행위에 이름을 부여하며, 한 번에 일관성을 유지할 범위를 정해야 한다. 여기서 추가되는 판단이 집합체 경계와 책임 배치다.')+
 h('입력·추가 판단·결과를 분리한다')+
 t(['개념·행위 입력','추가 설계 판단','도메인 산출물'],[
 ['Order의 독립 동일성','Order를 집합체 루트로 선택','외부는 Order를 통해 상태 변경'],
 ['항목 1..20, 접수 후 불변','항목 전체를 함께 생성하고 고정','AcceptedLine 배열, 방어적 복사·freeze'],
 ['총액은 항목의 합','파생 계산의 책임을 Order에 배치','totalKrw getter'],
 ['PLACED에서만 취소·확정','setter 대신 의도 메서드 제공','cancel(expectedVersion), confirm(expectedVersion)'],
 ['상품 현재값은 외부 경계','도메인 객체 안에서 카탈로그 호출하지 않음','응용 서비스가 스냅샷을 전달'],
 ['기존 기록도 읽어야 함','생성과 복원을 구별','place와 rehydrate'],
 ['소유권·판매자 역할','요청 주체와 저장을 응용 계층에서 조정','인증 정책·repository 계약']])+
 h('왜 OrderLine을 독립 집합체로 만들지 않았는가')+
 p('OrderLine이 독립적으로 저장되고 수정된다면 빈 주문 방지, 접수 후 수량 불변, 총액의 의미를 여러 쓰기 경로가 공유해야 한다. 이 사례는 최대 20항목이고 접수 후 항목 편집도 없으므로 하나의 Order가 전체를 만들고 보존하는 것이 단순하다. 항목이 대량이고 독립 출고·부분 취소를 한다면 다른 경계를 검토할 수 있다. 지금의 경계는 FK를 보고 자동으로 정한 것이 아니라 일관성 요구와 크기 제한을 근거로 선택했다.')+
 h('엔터티와 값의 차이를 구현에 반영한다')+
 p('Order는 상태가 바뀌어도 같은 id로 같은 주문이다. 접수 항목의 이름·단가·수량은 그 주문의 불변 상태 일부다. 이 구현은 항목마다 mutable 객체를 노출하지 않고 검증한 값의 복사본을 동결한다. Quantity와 UnitPrice를 독립 클래스로 만들 수도 있지만 작은 예제에서는 검증 함수로 표현했다. 값 객체라는 개념을 이해하는 데 반드시 클래스 이름이 있어야 하는 것은 아니다. 값의 범위·동등성·불변성이 일관되게 구현되어야 한다.')+
 h('도메인 모델의 구조적 형식')+
 c('''DomainDesign = {
  context,
  aggregate: {root, identity, members, boundaryReason, externalReferences, notMembers},
  values: [{name, invariant}],
  operations: [{name, input, ruleIds, result}],
  applicationResponsibilities,
  repositoryContract,
  limitations
}''','교육용 도메인 설계 명세')+
 a('domain-design.json','완성된 도메인 설계 명세')+
 p('이 명세에는 클래스 이름보다 결정의 근거가 더 중요하다. “Order가 root다”라는 선언만으로는 왜 그런지 설명되지 않는다. boundaryReason이 R01·R03·R06과 제한된 항목 수를 참조함으로써 요구가 바뀌었을 때 경계를 재검토할 근거가 생긴다. 데이터와 행위를 함께 다루는 객체 모델이라는 용법은 <a href="https://martinfowler.com/eaaCatalog/domainModel.html">Fowler의 Domain Model</a> 정의를 참고했다.'))

 s('domain-code','제16장','도메인 모델의 실제 코드와 복원·동시성의 경계',
 p('다음 코드는 설명용 메서드 시그니처만 있는 골격이 아니다. 유효한 주문 생성, 과거 스냅샷 보존, 기존 상태 복원, 금지 전이 거부, 상세 투영과 금액 계산을 실행할 수 있다. DB·HTTP·인증 서버와 연결한 완성 애플리케이션은 아니며, 그 연결의 계약은 앞 장과 다음 장에서 별도로 정의한다.')+
 a('domain.mjs','실행 가능한 도메인 모델 전체',True)+
 h('생성 예를 줄 단위로 따라가기')+
 c('''const order = Order.place({
  id: ids.order,
  buyerId: ids.buyerA,
  placedAt: '2026-10-15T01:00:01.000Z',
  items: [
    {productId: ids.bread, quantity: 2, expectedOfferRevision: 'p1-r7'},
    {productId: ids.scone, quantity: 1, expectedOfferRevision: 'p2-r3'}
  ],
  offers: [
    {productId: ids.bread, name: '우유식빵', unitPriceKrw: 3000,
     offerRevision: 'p1-r7', offerable: true},
    {productId: ids.scone, name: '버터스콘', unitPriceKrw: 2000,
     offerRevision: 'p2-r3', offerable: true}
  ]
});
order.totalKrw;                 // 8000
order.buyerView(ids.buyerA);      // E01의 실제 구조
order.cancel(1);
order.snapshot.state;           // CANCELLED
order.snapshot.version;         // 2
order.acceptanceReceipt();       // 여전히 최초 접수의 8000원
order.confirm(1);               // throws CONFLICT''','완성된 예제 값으로 실행')+
 p('canonicalRequest는 요청 항목을 명시된 배열 튜플로 표준화한다. 객체 프로퍼티의 입력 순서가 달라도 같은 의미의 요청을 같은 문자열로 만든다. 항목 배열 순서는 lineNo를 결정하므로 의미 있는 차이로 유지한다. UUID는 소문자로 통일한다. 이 문자열의 SHA-256을 응용 어댑터가 계산한다. 해시 충돌 가능성이 사실상 무시할 만큼 작다는 기술 전제를 사용하며, 원문 완전 동일성의 수학적 증명이라고 표현하지 않는다.')+
 h('복원은 새 주문 생성과 다르다')+
 p('저장된 CANCELLED v2 주문을 읽을 때 place를 다시 호출하면 PLACED v1이 되어 버린다. 현재 카탈로그를 조회해 다시 단가를 채우면 과거 가격도 바뀐다. rehydrate는 저장 스냅샷의 구조·범위·상태 조합을 검증하되 현재 카탈로그를 참조하지 않는다. 저장값이 잘못되면 조용히 고치지 않고 오류를 내야 데이터 손상을 알아차릴 수 있다. 외부 요청에서 arbitrary snapshot을 받아 rehydrate에 넣는 경로는 제공하지 않는다.')+
 h('동결이 DB 불변성을 보장하지는 않는다')+
 p('snapshot과 내부 lines는 동결되어 있으므로 호출자가 quantity를 바꾸어 객체의 규칙을 우회할 수 없다. 하지만 DB 관리자가 SQL로 값을 바꾸는 것은 이 객체가 막을 수 없다. 메모리 안의 불변성, 응용 쓰기 경로의 불변성, 저장소 전체의 불변성을 구분해야 한다. 이 책은 앞의 둘을 설계하고, 세 번째는 A08에 의존하는 제한을 명시한다.')+
 h('책임을 분리한 취소 흐름')+
 c('''HTTP adapter:
  validate request shape -> authenticate -> require BUYER
Application service:
  load owned order snapshot (missing or not-owned -> NotFound)
  order = Order.rehydrate(snapshot)
  originalVersion = snapshot.version
  order.cancel(request.expectedVersion)
Repository:
  UPDATE ... WHERE id=? AND buyer_id=?
    AND state='PLACED' AND version=request.expectedVersion
  if affectedRows != 1: return Conflict/NotFound policy
Application service:
  only after commit -> return {orderId, state:'CANCELLED', version:2}

메모리 전이 성공은 저장 성공의 증거가 아니다.
저장 실패한 객체를 성공 응답·캐시·이벤트에 사용하지 않는다.''','계층별 실행 계약')+
 p('pendingView와 buyerView는 실행 실습을 위해 같은 파일에 둔 투영 도우미다. 큰 시스템에서는 외부 DTO 조립을 응용 계층 mapper로 분리할 수 있다. 핵심은 저장 필드 전체를 그대로 내보내지 않고 정의한 E01·E02의 구조를 명시적으로 만드는 것이다. pendingView를 호출했다고 SELLER 인증이 수행되지는 않는다. 역할 검사는 응용 계층의 책임이다.'))

 s('api-derivation','제17장','외부 관점·행위·개념을 API 계약으로 바꾸는 과정',
 p('API를 만들 때 입력은 개념 스키마 하나가 아니다. 개념 스키마는 값과 관계의 의미를 제공하고, 외부 스키마는 누가 무엇을 보아야 하는지 제공하며, 행위 명세는 무엇을 요청하고 어떤 결과를 받아야 하는지 제공한다. 여기에 HTTP 경로·상태 코드·인증 방식·재시도 규약이라는 전송 결정을 추가한다. 같은 업무 의미도 HTTP가 아닌 메시지나 CLI로 제공할 수 있으므로 전송 형식은 별도 선택이다.')+
 t(['입력','변환 결정','실제 API 산출물'],[
 ['E00 상품 선택','읽기 연산, BUYER 역할','GET /offers'],
 ['U01 접수','명령; 키를 헤더로; receipt를 응답으로','POST /orders'],
 ['E01 본인 상세','주문 ID를 경로 매개변수로','GET /orders/{orderId}'],
 ['U02 취소','상태 setter가 아닌 의도 연산','POST /orders/{orderId}/cancellations'],
 ['U03 확정','SELLER 역할의 의도 연산','POST /orders/{orderId}/confirmations'],
 ['E02 대기 목록','keyset cursor·limit를 query로','GET /seller/orders']])+
 h('요청 DTO를 만드는 실제 추론')+
 p('U01은 사용자 선택을 받으므로 productId·quantity를 입력에 넣는다. 사용자가 본 조건을 확인해야 하므로 expectedOfferRevision을 추가한다. buyerId는 인증에서 가져오므로 제외한다. productName·unitPriceKrw는 서버 스냅샷에서 가져오므로 제외한다. totalKrw와 state는 서버가 산출하므로 제외한다. 이런 식으로 각 필드의 입력 권한을 판정하면 “테이블에 있으니 요청에도 있다”는 잘못된 복사를 피할 수 있다.')+
 t(['필드','요청에 있는가?','이유'],[
 ['productId, quantity','예','사용자가 선택한 의도'],
 ['expectedOfferRevision','예','사용자가 동의한 조건 확인'],
 ['requestKey','헤더에 있음','전송 재시도 식별 정책'],
 ['buyerId, role','아니오','인증 결과만 신뢰'],
 ['productName, unitPriceKrw','아니오','카탈로그의 서버 확인값'],
 ['state, version, totalKrw','아니오','최초 상태·변경 토큰·계산 결과'],
 ['expectedVersion','취소·확정 요청에 있음','오래된 판단을 검출하는 조건']])+
 h('응답 구조를 고르는 실제 추론')+
 p('최초 접수 응답은 주문의 현재 상태 전체가 아니라 역사적 접수 영수증이다. orderId·acceptedAt·acceptedTotalKrw만 포함한다. SC06에서 주문이 이미 확정된 뒤 재시도하더라도 영수증은 변하지 않는다. 현재 상태는 GET 상세로 확인한다. 만약 최초 PLACED 상태 전체를 재생한다면 그 값이 과거 상태임을 응답 의미에 명확히 표시해야 한다. 이 책은 혼동을 줄이기 위해 영수증을 분리했다.')+
 h('오류 의미를 먼저 정하고 상태 코드에 매핑한다')+
 t(['업무/프로토콜 실패','HTTP 선택','중요한 차이'],[
 ['인증 없음·유효하지 않음','401','로그인은 되었으나 역할이 다른 403과 구분'],
 ['구매자가 판매자 연산 호출','403','역할을 주문 조회 전에 확인'],
 ['주문 없음 또는 타인 소유','404','소유 여부 정보를 응답에서 숨김; 타이밍 비노출까지 자동 보장하지는 않음'],
 ['상태·버전 충돌','409 CONFLICT','클라이언트가 다시 읽고 판단'],
 ['기대 상품 조건과 현재 스냅샷 불일치','409 OFFER_CHANGED','가격 조건을 확인하고 새 키로 접수'],
 ['같은 키에 다른 본문','409 IDEMPOTENCY_KEY_REUSED','기존 성공을 덮어쓰지 않음'],
 ['필드·범위·중복 상품 오류','422 INVALID_INPUT','서버 실패가 아닌 입력 계약 위반'],
 ['잘못된 JSON·cursor 문법','400 BAD_REQUEST','파싱 가능한 값의 의미 오류와 구분'],
 ['카탈로그 가용성 실패','503 DEPENDENCY_UNAVAILABLE','가격을 추측해 주문을 만들지 않음']])+
 p('상태 코드 선택은 이 API의 정책이다. 동일한 개념 모델에서 다른 오류 표현을 선택할 수도 있다. 중요한 것은 클라이언트가 무엇을 수정하거나 재시도해야 하는지 구별할 수 있고, 서버가 실제로 이 계약을 구현하는 것이다. security 선언이나 description 문구는 권한 검사 코드의 대체물이 아니다.')+
 h('API Spec의 구조적 형식')+
 p('이번 산출물은 임의 JSON 양식이 아니라 OpenAPI 3.1.1을 사용한다. info는 계약의 이름과 버전을, paths는 연산을, parameters·requestBody는 입력을, responses는 결과를, components.schemas는 구조를 정의한다. x-source-ids는 표준 확장 필드를 이용한 추적 정보다. OpenAPI 문법이 표현하지 못하거나 자동 검증하지 않는 교차 필드 규칙은 설명과 서버 검증에 남긴다. <a href="https://spec.openapis.org/oas/v3.1.1.html">공식 명세</a>를 기준으로 작성했다.'))

 s('api-result','제18장','완전한 API 명세와 실제 HTTP 대화',
 p('아래 OpenAPI에는 앞 장의 여섯 연산이 모두 들어 있다. 주문 생성·상세·취소·확정·대기 목록·상품 선택 중 한 연산만 보여주고 나머지를 독자에게 추측하게 하지 않는다. 인증과 카탈로그 구현은 명시된 외부 의존이며 HTTP 서버 자체는 이 문서의 실행 산출물에 포함하지 않는다.')+
 a('openapi.json','여섯 연산의 전체 OpenAPI 3.1.1 명세')+
 h('SC01: 실제 접수 요청과 응답')+
 c('''POST /orders HTTP/1.1
Authorization: Bearer <검증된 구매자 토큰>
Content-Type: application/json
Idempotency-Key: 40000000-0000-4000-8000-000000000001

{
  "items": [
    {"productId":"20000000-0000-4000-8000-000000000001",
     "quantity":2,"expectedOfferRevision":"p1-r7"},
    {"productId":"20000000-0000-4000-8000-000000000002",
     "quantity":1,"expectedOfferRevision":"p2-r3"}
  ]
}

HTTP/1.1 201 Created
Location: /orders/30000000-0000-4000-8000-000000000001
Idempotent-Replay: false
Content-Type: application/json

{
  "orderId":"30000000-0000-4000-8000-000000000001",
  "acceptedAt":"2026-10-15T01:00:01.000Z",
  "acceptedTotalKrw":8000
}''','HTTP 예제 · token은 자리표시자')+
 h('SC06: 같은 접수 확인')+
 p('같은 키와 같은 항목으로 다시 보내면 201과 같은 body를 반환하고 Idempotent-Replay: true를 표시한다. status=201을 재생에서도 사용하는 것은 이 계약의 선택이다. 응답이 현재 주문 상태를 나타낸다고 설명하지 않았으므로 이미 확정됐어도 모순이 없다. 같은 키로 quantity를 3으로 바꾸면 409 IDEMPOTENCY_KEY_REUSED이며 원래 주문은 수정하지 않는다. 입력 항목 순서를 바꾸는 것도 lineNo를 바꾸는 의미이므로 다른 요청이다.')+
 h('SC03: 취소 요청과 성공')+
 c('''POST /orders/30000000-0000-4000-8000-000000000001/cancellations HTTP/1.1
Authorization: Bearer <구매자 토큰>
Content-Type: application/json

{"expectedVersion":1}

HTTP/1.1 200 OK
Content-Type: application/json

{"orderId":"30000000-0000-4000-8000-000000000001",
 "state":"CANCELLED","version":2}''','취소 계약')+
 h('SC05: 판매자가 먼저 확정한 대안 분기')+
 c('''HTTP/1.1 409 Conflict
Content-Type: application/json

{"code":"CONFLICT",
 "message":"주문 상태가 변경되었습니다. 다시 조회하세요.",
 "traceId":"trace-sc05"}

// 이후 GET 상세 결과: CONFIRMED, version=2, canCancel=false
// 이 분기는 위의 취소 성공 분기와 동시에 일어난 결과가 아니다.''','경쟁 실패 응답')+
 h('명세만으로 자동 검사되지 않는 것')+
 p('items에 uniqueItems=true를 넣는 것만으로 productId 유일성을 보장하지 못한다. 같은 상품에 quantity만 다르면 두 객체는 서로 다르기 때문이다. 따라서 productId별 유일성은 명시적 서버 검증이 필요하다. 마찬가지로 OrderDetail.totalKrw와 lines 합계가 일치하는지, state에 따라 canCancel이 맞는지, bearer 주체가 소유자인지는 일반적인 구조 검사만으로 해결되지 않는다. 이 관계를 행위 테스트와 계약 테스트에 연결한다.')+
 p('OpenAPI는 API 구현의 입력으로 사용하거나 구현에서 추출할 수 있지만, 어느 방향이든 의미 검증이 필요하다. 경로·스키마가 생성되었다는 사실만으로 서비스가 이 명세대로 동작한다고 말할 수 없다. 이 책은 명세와 예제 구조를 검증하고 실제 서버·DB 통합 검증은 따로 남긴다.'))

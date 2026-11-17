## 12장 내부 스키마 설계: 사상·정규화·작업 부하

이 장을 마치면 개념 스키마를 관계형 표로 옮기는 사상 규칙을 적용하고, 하위 유형을 옮기는 네 가지 방법 가운데 하나를 근거를 들어 고를 수 있어요. 작업 부하 표로 접근 경로를 정하고, 보장 위치표를 완성해 「틈」의 내부 스키마 전체를 써 봅니다.

### 절차 한눈에

```text
1. 사상 규칙 적용     개체 → 표, 1:N → 외래 키, M:N·다항 → 연결 표, 하위 유형 → 네 방법 중 하나
2. 정규형 점검        기본 사실로 만들었다면 대개 이미 맞음. 확인만
3. 작업 부하 표 완성   외부 스키마의 질의(9장)와 연산(11장)에 빈도를 붙임
4. 접근 경로          인덱스 종류와 열
5. 분할·실체화·비정규화  조건이 맞을 때만, 결정 기록과 함께
6. 보장 위치표 완성    모든 제약·파생·계약 조항에 지키는 자리
7. 결정 기록          근거 · 비용 · 다시 볼 조건
```

### 1단계: 사상 규칙

ER 모델에서 관계형 표로 옮기는 규칙은 교재마다 비슷하게 정리되어 있습니다. Elmasri·Navathe의 『Fundamentals of Database Systems』 강의 슬라이드(5판)는 다음 순서로 적어요. 「틈」의 예를 옆에 붙였습니다.

| 단계 | 개념 쪽 | 표로 옮기는 방법 | 「틈」 |
| --- | --- | --- | --- |
| 1 | 강한 개체 유형 | 표 하나, 키 하나를 기본 키로 | `member`, `room`, `booking`, `grade` |
| 2 | 약한 개체 유형 | 소유자 키를 외래 키로, 기본 키는 소유자 키 + 부분 키 | (없음) |
| 3 | 1:1 관계 | 외래 키(전체 참여 쪽에), 표 합치기, 연결 표 중 하나 | (없음) |
| 4 | 1:N 관계 | N 쪽 표에 1 쪽 기본 키를 외래 키로 | `booking.member_id`, `booking.room_code` |
| 5 | M:N 관계 | 연결 표, 두 키의 조합이 기본 키 | (없음) |
| 6 | 다중값 속성 | 따로 표, 속성 + 소유 개체 키 | `booking_guest` (손님 이름 여럿) |
| 7 | n항 관계 | 연결 표, 참여 개체 키 n개 | (없음) |
| 8 | 하위 유형 | 아래 네 방법 중 하나 | 상주 회원의 지정석 |

ORM 쪽에서는 Halpin이 더 짧은 규칙을 줍니다. 같은 개체 유형에 붙은 사실 유형 가운데 단순 키(그 개체 하나로 유일)를 가진 것들은 한 표로 묶고, 복합 키를 가진 사실 유형은 각각 따로 표를 만들라는 거예요. 그리고 사실 유형이 기본 사실이면 이렇게 묶은 결과에 중복이 생기지 않는다고 합니다. 「틈」의 사실 유형에 이 규칙을 적용해 볼게요.

```text
회원에 붙은 단순 키 사실   F1 이름, 이메일, 상태          → member
회의실에 붙은 단순 키 사실  F3 정원                       → room
등급에 붙은 단순 키 사실   F8 무료 분, 초과 단가           → grade
예약에 붙은 단순 키 사실   F4 회원, F5 회의실, F6 시작·끝,
                          F7 상태, F9 취소 시각          → booking
복합 키 사실              F2' 회원·기간 → 등급            → member_grade_period
                          F11 예약 → 손님 이름(여럿)      → booking_guest
```

### 하위 유형을 옮기는 네 방법

매니저가 "상주 회원은 지정석 번호가 있다"고 했던 것(8장 점검 문제)을 하위 유형으로 본다면, 슬라이드가 드는 네 방법 가운데 하나로 옮깁니다.

| 방법 | 표 | 쓸 수 있는 경우(슬라이드) | 「틈」에서 |
| --- | --- | --- | --- |
| 8A 상위·하위 각각 | `member`, `resident_member(member_id, seat_no)` | 어떤 하위 유형에도 | 가능 |
| 8B 하위만 | `regular_member`, `resident_member` (상위 속성을 각자 가짐) | 모든 상위 객체가 하위 중 하나에 속할 때 | 가능하지만 회원 목록 조회가 둘을 합쳐야 함 |
| 8C 한 표 + 유형 속성 | `member(..., kind, seat_no)` | 슬라이드 예는 배타적 하위 유형 | 가능. seat_no 는 상주일 때만 값 |
| 8D 한 표 + 불 플래그 여럿 | `member(..., is_resident, ...)` | 슬라이드 예는 겹치는 하위 유형 | 하위 유형이 하나라 의미 없음 |

그런데 「틈」에는 네 방법 모두에 걸리는 사정이 하나 있어요. 9장에서 등급에 **이력**이 생겼습니다. 회원이 11월 15일에 상주로 바뀌었다면, "상주 회원"이라는 하위 유형에 속하는지가 날짜에 따라 다릅니다. 8A로 옮기면 등급이 바뀔 때마다 `resident_member` 행을 넣고 지워야 하고, 과거 어느 날의 소속은 알 수 없게 돼요.

그래서 이 경우는 하위 유형으로 옮기지 않고, 지정석을 기간이 있는 사실로 따로 둡니다. `seat_assignment(member_id, seat_no, valid_from, valid_to)`처럼요. 그리고 "지정석은 그 기간에 상주 등급인 회원만 가진다"는 규칙을 보장 위치표에 올립니다. 하위 유형 사상 규칙은 하위 유형 소속이 바뀌지 않을 때 가장 잘 맞아요. 8장에서 "취소된 예약"을 하위 유형으로 두지 않은 것도 같은 이유였습니다.

### 2단계: 정규형 점검

8장에서 사실 유형을 기본 사실로 쪼갰으므로, 위의 묶음은 정규형을 따로 손보지 않아도 함수 종속 문제가 없는 것이 보통입니다. 그래도 표마다 확인은 합니다. `booking`의 열을 보면 키는 `booking_id`이고, 나머지 열은 모두 예약 하나에 딸린 값이에요. `member_id`가 정해지면 회원 이름도 정해지지만 회원 이름은 이 표에 없으므로 4장에서 본 갱신 이상은 생기지 않습니다.

점검에서 흔히 걸리는 것은 **계산된 값을 열로 둔 경우**예요. `booking`에 `minutes`(예약 길이) 열을 두면 `starts_at`, `ends_at`에서 계산되는 값을 또 저장하는 셈입니다. 둘이 어긋날 수 있으니 두지 않거나, 둔다면 DB가 계산하게 해야 해요. PostgreSQL이라면 생성 열(`GENERATED ALWAYS AS ... STORED`)이 그런 장치입니다.

### 3~5단계: 작업 부하와 접근 경로

4장에서 W1~W4를 적었습니다. 9장과 11장에서 늘어난 질의와 연산을 더해 표를 완성해요. 빈도와 목표는 설명을 위해 가정한 값입니다.

| 번호 | 무엇 | 빈도(가정) | 조건·순서 | 결정 |
| --- | --- | --- | --- | --- |
| W1 | V1 다가오는 내 예약 | 하루 300회 | `member_id = ? AND starts_at >= now()` 시작순 | IX1 (member_id, starts_at) |
| W2 | O1 예약하기 | 하루 60회 | 겹침 검사 + 멱등 키 조회 | IX2(배제 제약), IX4(멱등 키 기본 키) |
| W3 | V2 오늘 일정표 | 하루 50회 | 오늘 시작, 확정 | IX3 없음(작은 표) |
| W4 | V3 월 청구 명세 | 월 1회 | 한 달 예약 전부, 회원별 합 | 없음 |
| W5 | V4 회의실 현황 | 하루 200회 | 날짜 하나, 회의실별 확정 구간 | IX2 를 씀 |
| W6 | E1~E3 발행 | 하루 80회 | 아직 안 보낸 이벤트, 오래된 순 | IX5 부분 인덱스 (sent_at IS NULL) |

W6에 부분 인덱스를 고른 이유가 있어요. 이벤트 표(아래의 `outbox`)는 보낸 행이 계속 쌓이는데, 발행 과정이 찾는 것은 아직 안 보낸 몇 줄뿐입니다. PostgreSQL 문서는 부분 인덱스의 쓰임으로 거의 찾지 않는 행을 인덱스에서 빼는 경우를 들어요. 다만 같은 문서가 부분 인덱스의 이점은 대개 작다고도 경고하므로, 결정 기록에 다시 볼 조건을 붙입니다.

```text
[결정] IX5 부분 인덱스 outbox(created_at) WHERE sent_at IS NULL
  근거   W6: 발행 과정은 안 보낸 행만 오래된 순으로 찾음. 보낸 행은 계속 늘어남
  비용   이벤트를 넣고 보냄 표시할 때 인덱스 갱신 (하루 80회 수준)
  재검토  outbox 를 주기적으로 비운다면 일반 인덱스나 인덱스 없음으로 충분

[결정] PT2 outbox 를 분할하지 않음
  근거   하루 80행이면 한 해 3만여 행. 분할의 경험칙(서버 메모리보다 큰 테이블)에 한참 못 미침
  재검토  보존 기간 정책이 생겨 오래된 이벤트를 한꺼번에 지울 때 (그때는 월 단위 분할을 검토)
```

비정규화 후보도 하나 있었습니다. W4 청구 명세에서 회원 이름을 매번 잇지 말고 예약 표에 넣자는 생각이에요. W4는 한 달에 한 번이고 잇는 비용이 작으므로 비정규화하지 않습니다. 대신 9장에서 본 "발행된 청구서는 나중에 바뀌면 안 된다"는 요구는 비정규화가 아니라 **새 사실**로 다룹니다. 청구서를 낼 때의 회원 이름·등급·금액을 `billing_statement` 표에 기록하는 것은 중복 저장이 아니라 "이 청구서에 이렇게 적혀 나갔다"는 다른 사실이에요.

### 6단계: 보장 위치표 완성

4장에서 시작한 보장 위치표를 끝까지 채웁니다. 개념 스키마의 제약, 파생 규칙, 계약 조항이 모두 들어가요.

| 항목 | 지키는 자리 | 방법 |
| --- | --- | --- |
| 유일·필수(각 사실 유형) | DB | 기본 키, `NOT NULL`, 외래 키 |
| R2 길이·30분 경계 | DB | `CHECK` |
| R3 / inv1 겹침 금지 | DB | `EXCLUDE ... WHERE status = 'confirmed'` |
| R4 상태 전이 | DB 트리거 + 예약 서비스 단일 쓰기 경로 | 전이 전 상태가 확정인지 검사 |
| R5 늦은 취소 | 질의 | D1 계산에서 `cancelled_at`과 `starts_at` 비교 |
| R6 취소 시각 ↔ 취소 상태 | DB | `CHECK` |
| R8 등급 기간 겹침 금지 | DB | `EXCLUDE (member_id WITH =, daterange(...) WITH &&)` |
| 지정석은 상주 기간에만 | 예약 서비스 | 지정석을 배정·해제할 때 등급 기간 확인. 월 1회 감시 질의 |
| D1~D4 | 질의(뷰) | 청구용 뷰 |
| O1 멱등성 | DB | `idempotency(key)` 기본 키 + 예약과 같은 트랜잭션 |
| post2 이벤트 정확히 한 번 발행 예약 | DB + 발행 과정 | 예약과 같은 트랜잭션에서 `outbox`에 행을 넣고, 발행 과정이 보냄 |
| E1 전달 적어도 한 번 | 발행 과정 | 보냈다는 표시 전에 장애가 나면 다시 보냄 |

"지정석은 상주 기간에만"의 자리에 "월 1회 감시 질의"를 함께 적었습니다. DB 제약으로 걸기 어려운 규칙을 응용에 맡길 때는, 응용이 놓친 경우를 찾아내는 감시 질의를 같이 두는 편이 좋아요. 7장의 근거 수준에서 관찰만 있는 규칙을 감시로 지켜본다고 했던 것과 같은 방식입니다.

### 「틈」의 내부 스키마

지금까지의 결정을 모은 DDL입니다. PostgreSQL 문법이고, 이 저장소 환경에는 PostgreSQL이 없어 실행해 보지 못했어요. 배제 제약·부분 인덱스·생성 열은 PostgreSQL 공식 문서를 근거로 썼습니다. 같은 구조를 SQLite에서 실행할 수 있게 고친 판(배제 제약 대신 트리거)은 13장에서 실제로 실행해 봅니다.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE grade (
  grade_name        text PRIMARY KEY,                    -- '일반', '상주'
  free_minutes      integer NOT NULL CHECK (free_minutes >= 0),
  overage_won_per30 integer NOT NULL CHECK (overage_won_per30 >= 0)
);

CREATE TABLE member (
  member_id  text PRIMARY KEY,
  name       text,                                      -- 탈퇴하면 지움 (10장)
  email      text,
  status     text NOT NULL CHECK (status IN ('active', 'left'))
);

CREATE TABLE member_grade_period (                      -- F2'
  member_id  text NOT NULL REFERENCES member(member_id),
  grade_name text NOT NULL REFERENCES grade(grade_name),
  valid_from date NOT NULL,
  valid_to   date,                                      -- NULL = 아직 진행 중
  PRIMARY KEY (member_id, valid_from),
  CHECK (valid_to IS NULL OR valid_to > valid_from),
  EXCLUDE USING gist (member_id WITH =,
                      daterange(valid_from, valid_to) WITH &&)   -- R8
);

CREATE TABLE room (
  room_code text PRIMARY KEY,
  capacity  integer CHECK (capacity BETWEEN 1 AND 20)   -- F3, 필수 아님
);

CREATE TABLE booking (
  booking_id   text PRIMARY KEY,
  member_id    text NOT NULL REFERENCES member(member_id),
  room_code    text NOT NULL REFERENCES room(room_code),
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  status       text NOT NULL CHECK (status IN ('confirmed','cancelled','used','no_show')),
  cancelled_at timestamptz,
  CHECK (ends_at > starts_at AND ends_at - starts_at <= interval '4 hours'),     -- R2
  CHECK (extract(epoch FROM starts_at)::bigint % 1800 = 0
         AND extract(epoch FROM ends_at)::bigint % 1800 = 0),                    -- R2
  CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL)),                   -- R6
  EXCLUDE USING gist (room_code WITH =, tstzrange(starts_at, ends_at) WITH &&)
    WHERE (status = 'confirmed')                                                 -- R3
);
CREATE INDEX ix1_booking_member_start ON booking (member_id, starts_at);        -- IX1

CREATE TABLE booking_guest (                                                   -- F11
  booking_id text NOT NULL REFERENCES booking(booking_id),
  guest_name text NOT NULL,
  PRIMARY KEY (booking_id, guest_name)
);

CREATE TABLE idempotency (                                                     -- IX4
  idem_key      text PRIMARY KEY,
  request_hash  text NOT NULL,
  response_body jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outbox (                                                          -- post2
  event_id   text PRIMARY KEY,
  event_type text NOT NULL,
  payload    jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at    timestamptz
);
CREATE INDEX ix5_outbox_unsent ON outbox (created_at) WHERE sent_at IS NULL;   -- IX5
```

여기서 가장 중요한 줄은 `PRIMARY KEY (member_id, valid_from)`과 그 아래 배제 제약의 짝입니다. 기본 키만 있으면 같은 날 시작하는 기간 둘은 막지만, 11월 1일~20일과 11월 15일~30일처럼 시작일이 다르면서 겹치는 기간은 막지 못해요. 그러면 11월 17일의 등급이 둘이 되고, D4(어느 날의 등급)가 답을 하나로 낼 수 없습니다. 배제 제약이 그 경우를 막아요.

### 헷갈리기 쉬운 곳

1. 사상 규칙을 기계적으로 적용하면 시간이 빠집니다. 규칙은 "지금의 상태"를 옮기는 데 맞춰져 있어서, 9장처럼 외부 스키마가 과거를 물으면 개념 스키마와 내부 스키마 모두에 기간이 들어가야 해요.
2. `outbox`나 `idempotency`는 개념 스키마에 없는 표입니다. 담화 세계의 사실이 아니라 계약을 지키기 위한 장치이니까요. 개념화 원칙대로 개념 스키마에 넣지 않고, 보장 위치표에서 어느 계약 조항을 지키는지로 정당화합니다.
3. 결정 기록의 "재검토" 줄을 비워 두면 그 결정은 영원히 남습니다. 작업 부하는 바뀌므로, 어떤 숫자가 바뀌면 다시 볼지 적어 두세요.

### 잠깐 확인

`member.name`을 `NOT NULL`로 두지 않은 이유는 무엇일까요? 2장의 개념 스키마에서는 회원마다 이름이 정확히 하나였습니다.

10장의 행위 충돌을 맞추면서 탈퇴한 회원의 이름을 지우기로 했기 때문이에요. 개념 스키마도 그에 맞춰 "활동 중인 회원은 이름을 정확히 하나 가진다"로 바뀌어야 합니다. 그러면 내부에는 `CHECK (status = 'left' OR name IS NOT NULL)`을 더하는 것이 맞아요. 위 DDL은 그 검사를 빠뜨렸습니다. 이런 빠짐을 찾는 것이 13장 추적표의 일입니다.

### 스스로 점검하기

1. 위 DDL에 빠진 `CHECK (status = 'left' OR name IS NOT NULL)`을 넣고, 이 검사가 지키는 개념 규칙을 R 번호를 새로 붙여 적어 보세요.
2. 지정석을 8C 방법(한 표 + 유형 속성)으로 옮겼다고 가정합시다. 등급이 일반으로 바뀐 회원의 지정석은 어떻게 처리해야 하고, 과거 어느 날 누가 어느 자리를 썼는지 알 수 있을까요?
3. W5 회의실 현황이 하루 200회에서 2만 회로 늘었습니다. 결정 기록 형식으로 새 결정을 하나 적어 보세요.

#### 풀이

1. `[제약] R9 활동 중인 회원은 이름을 정확히 하나 가진다`. 내부에는 `ALTER TABLE member ADD CHECK (status = 'left' OR name IS NOT NULL);`를 더하고, 보장 위치표에 `R9 · DB · CHECK`를 적습니다. 2장의 R1(회원마다 이름 하나)은 R9로 대체되었다는 것도 추적표에 남깁니다.
2. 등급이 바뀔 때 `seat_no`를 비우고 `kind`를 바꿔야 합니다. 그러면 지난 지정석 정보가 사라지므로 과거 어느 날 누가 어느 자리를 썼는지는 알 수 없습니다. 과거가 필요하면 `seat_assignment`처럼 기간을 가진 표가 필요하고, 그것이 본문에서 하위 유형 사상을 쓰지 않은 이유입니다.
3. 예: `[결정] MV2 회의실별 날짜별 확정 구간을 담는 실체화 뷰 · 근거: W5 하루 2만 회, 대부분 오늘~7일 뒤 조회 · 비용: 예약이 바뀔 때마다 갱신해야 최신. REFRESH 주기를 1분으로 하면 현황이 최대 1분 늦음 → 계약의 품질 겹(V4 신선도 1분)에 적음 · 재검토: 갱신 비용이 커지면 캐시 계층으로`. 실체화 뷰 대신 IX2를 그대로 쓰고 응답을 캐시하는 방법도 있습니다. 어느 쪽이든 V4가 얼마나 늦어도 되는지가 계약에 들어가야 합니다.

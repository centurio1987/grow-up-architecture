## P13 운동 기록 앱의 이벤트 — 버전이 섞인 JSON 로그에서

| 난이도 | 씨앗 형식 | 중심 산출물 | 연결 장 |
| --- | --- | --- | --- |
| 상 | JSON 줄 로그(jsonl) | 모양 분석·계약 진화 이력·정제 규칙·내부 스키마 | 5, 21, 25 |

### 상황

달리기·자전거·수영 기록 앱이 운동이 끝날 때마다 서버로 이벤트를 보냅니다. 앱은 1.x, 2.x, 3.x로 바뀌어 왔는데, 사용자마다 앱을 업데이트하는 시기가 달라서 서버에는 세 세대의 이벤트가 함께 들어와요. 분석팀이 "월간 운동 리포트"를 만들려고 두 달 치 로그를 받았습니다. 문서는 3.x의 것뿐이고, 1.x·2.x의 모양은 아무도 정리해 두지 않았습니다.

### 주어진 자료

`problems/data/p13-workout-events.jsonl`의 전문입니다(11줄). 줄 번호는 설명하려고 붙였어요.

```text
L1  {"type":"run_end","user":"u-17","ts":"2026-09-01T07:12:03+09:00","dur":1810,"dist":5.02}
L2  {"type":"run_end","user":"u-22","ts":"2026-09-01T19:40:11+09:00","dur":2405,"dist":6.5}
L3  {"type":"run_end","user":"u-17","ts":"2026-09-03T07:05:47+09:00","dur":1755,"dist":5.0,"memo":"비 옴"}
L4  {"event":"workout_end","app":"2.0.1","user_id":"u-17","at":"2026-09-10T07:10:00+09:00","kind":"run","duration_sec":1800,"distance_km":5.1}
L5  {"event":"workout_end","app":"2.0.1","user_id":"u-31","at":"2026-09-10T20:00:30+09:00","kind":"cycle","duration_sec":3600,"distance_km":21.4}
L6  {"event":"workout_end","app":"2.0.3","user_id":"u-22","at":"2026-09-11T06:55:02+09:00","kind":"swim","duration_sec":2700,"distance_km":null}
L7  {"event":"workout_end","app":"2.0.3","user_id":"u-22","at":"2026-09-12T06:58:40+09:00","kind":"swim","duration_sec":2650,"laps":40,"pool_m":25}
L8  {"event":"workout.ended","event_id":"e-9f10","app":"3.0.0","user_id":"u-17","at":"2026-10-01T07:08:15+09:00","kind":"run","duration":{"value":31,"unit":"min"},"distance":{"value":5.2,"unit":"km"}}
L9  {"event":"workout.ended","event_id":"e-9f10","app":"3.0.0","user_id":"u-17","at":"2026-10-01T07:08:15+09:00","kind":"run","duration":{"value":31,"unit":"min"},"distance":{"value":5.2,"unit":"km"}}
L10 {"event":"workout.ended","event_id":"e-a201","app":"3.0.0","user_id":"u-31","at":"2026-10-01T11:10:00Z","kind":"cycle","duration":{"value":1.1,"unit":"h"},"distance":{"value":24000,"unit":"m"}}
L11 {"event":"workout.ended","event_id":"e-a3c7","app":"3.0.1","user_id":"u-22","at":"2026-10-02T06:50:00+09:00","kind":"swim","duration":{"value":45,"unit":"min"},"laps":[{"n":1,"sec":62},{"n":2,"sec":65}],"pool_m":25}
```

### 과제

1. 줄을 모양(최상위 필드 이름의 집합)으로 묶고, 모양마다 앱 세대(1.x·2.x·3.x)를 추정하세요. 필드마다 몇 줄에 나오는지와 타입을 세어 표로 냅니다.
2. 세대 사이에서 같은 뜻으로 보이는 필드를 대응시키고, 대응이 관찰일 뿐인 곳을 질문으로 남기세요.
3. 타입이 섞인 필드, `null`과 없음, 시간대, 단위, 중복 줄을 찾아 각각의 뜻을 정하세요.
4. 1.x→2.x, 2.x→3.x 변화를 5장의 호환성 유형(BACKWARD·FORWARD)과 Semver로 판정하세요. 호환되게 바꾸려면 어떻게 했어야 했는지도 적습니다.
5. 리포트가 읽을 정본 모양(내부 스키마)과 정제 규칙을 쓰고, 11줄을 옮겨 넣은 결과를 SQLite로 확인하세요.

### 실마리

- 어느 필드도 열한 줄 모두에 나오지 않습니다(25장의 GenSON 이야기).
- `laps`는 두 번 나오는데 타입이 다릅니다.
- L8과 L9를 글자 단위로 견줘 보세요.
- 3.x는 값에 단위를 붙였고, 그 단위가 줄마다 다릅니다.

### 풀이

숫자를 옮겨 온 곳은 셋입니다.

```text
모양과 필드 수          verification/p13-json-profile.json   (json_profile.py 의 출력)
시간대 · 단위 · 중복     verification/p11-p13-p14-result.json
옮겨 넣은 결과          verification/part4-ddl-result.json
```

#### 1. 모양과 세대

모양은 여섯 가지가 나옵니다.

| 모양 | 필드 | 줄 수 | 줄 | 추정 세대 |
| --- | --- | --- | --- | --- |
| A | type, user, ts, dur, dist | 2 | L1, L2 | 1.x (`app` 필드 없음) |
| A' | A + memo | 1 | L3 | 1.x |
| B | event, app, user_id, at, kind, duration_sec, distance_km | 3 | L4, L5, L6 | 2.x (`app` = 2.0.x) |
| B' | event, app, user_id, at, kind, duration_sec, laps, pool_m | 1 | L7 | 2.x |
| C | event, event_id, app, user_id, at, kind, duration, distance | 3 | L8, L9, L10 | 3.x |
| C' | event, event_id, app, user_id, at, kind, duration, laps, pool_m | 1 | L11 | 3.x |

세대별로 세면 1.x 3줄, 2.x 4줄, 3.x 4줄입니다. 1.x에는 `app` 필드가 없어서 세대를 필드 이름(`type`)으로 추정했어요. 관찰에 기댄 추정이라 원장에 근거 수준을 관찰로 둡니다.

필드마다 센 결과는 이렇습니다.

```text
필드          나온 줄 / 없는 줄   타입
type             3 / 8            string 3
user             3 / 8            string 3
ts               3 / 8            string 3
dur              3 / 8            integer 3
dist             3 / 8            number 3
memo             1 / 10           string 1
event            8 / 3            string 8
app              8 / 3            string 8
user_id          8 / 3            string 8
at               8 / 3            string 8
kind             8 / 3            string 8
duration_sec     4 / 7            integer 4
distance_km      3 / 8            number 2, null 1
laps             2 / 9            integer 1, array 1
pool_m           2 / 9            integer 2
event_id         4 / 7            string 4
duration         4 / 7            object 4
distance         3 / 8            object 3
```

`event`·`app`·`user_id`·`at`·`kind`도 8줄(2.x와 3.x)에만 나오고 1.x 3줄에는 없습니다. 열한 줄 모두에 나오는 필드는 하나도 없어요. 25장에서 본 대로, 이 로그를 모양 구분 없이 스키마 하나로 합치면 필수 필드가 없는 스키마가 나옵니다.

#### 2. 필드 대응

```text
1.x        2.x            3.x                    대응의 근거
type       event          event                  값: run_end → workout_end → workout.ended
user       user_id        user_id                값의 꼴이 같음 (u-17 …)
ts         at             at                     ISO 8601 시각
dur        duration_sec   duration{value,unit}   1.x·2.x 는 초로 보임, 3.x 는 단위가 붙음
dist       distance_km    distance{value,unit}   1.x 는 km 로 보임 (5.02, 6.5)
(없음)     kind           kind                   1.x 는 type 이 run_end 뿐
(없음)     (없음)          event_id               3.x 부터
memo       (없음)          (없음)                 1.x 에만
(없음)     laps(정수)      laps(배열)              이름은 같고 모양이 다름
(없음)     pool_m          pool_m                 수영의 수영장 길이(m)
```

값과 이름이 비슷하다는 대응은 모두 **관찰**입니다. 확인이 필요한 곳을 질문으로 남겨요.

| 질문 | 왜 |
| --- | --- |
| 1.x의 `ts`는 운동이 끝난 시각인가요, 이벤트를 보낸 시각인가요? | `type`이 run_end라 끝난 시각으로 보이지만, 보낸 시각이라면 월간 리포트의 날짜가 어긋날 수 있음 |
| 1.x의 `dist`는 km인가요? | 값(5.02, 6.5, 5.0)이 달리기 km로 그럴듯하지만, 단위가 적혀 있지 않음 |
| 1.x는 달리기만 보냈나요? | `type`이 run_end뿐. 자전거·수영 기록이 1.x에서는 아예 안 올라왔다면 리포트에서 1.x 사용자의 운동량이 적게 나옴 |
| 2.x의 `laps`(정수)와 3.x의 `laps`(배열)는 같은 것인가요? | 아래 3번 |

#### 3. 타입·null·시간대·단위·중복

**타입이 섞인 필드는 둘입니다.** `laps`는 정수 1줄(L7: 40)과 배열 1줄(L11)이고, `distance_km`는 숫자 2줄과 `null` 1줄(L6)이에요.

`laps`가 까다롭습니다. L7의 `40`은 바퀴 수로 보이고, L11의 배열은 바퀴마다의 기록(`n`, `sec`)으로 보여요. 그런데 L11은 45분 수영인데 배열에 두 바퀴뿐입니다. 배열이 전체 기록인지 일부인지 알 수 없어요. 그래서 배열의 길이를 바퀴 수로 읽지 않습니다. 정본에서는 2.x의 정수를 `lap_count`로, 3.x의 배열을 바퀴별 기록 표로 따로 옮기고, 질문을 남깁니다.

```text
q  3.x 의 laps 배열은 모든 바퀴인가요, 앞의 몇 바퀴만인가요? 바퀴 수는 어디서 알 수 있나요?
```

**`null`과 없음.** 수영 기록 세 줄의 거리 칸이 모두 다릅니다.

```text
L6   distance_km: null      필드는 있는데 값이 null   → 앱이 거리를 몰랐다? (2.0.3)
L7   distance_km 없음        필드 자체가 없음           → 같은 2.0.3 인데 왜 다른가? laps 가 있을 때는 거리를 안 보냄?
L11  distance 없음           3.x 의 수영                → 3.x 수영은 거리를 안 보냄
```

같은 앱 버전(2.0.3)에서 L6과 L7이 다르다는 점이 질문거리예요. 정본에서는 셋 모두 거리 "모름"(`NULL`)으로 옮기되, L7처럼 바퀴 수와 수영장 길이가 있으면 거리를 40 × 25 = 1,000m로 계산할 수 있는지 묻습니다. 계산할 수 있다고 해서 계산해 넣지는 않아요. 앱이 일부러 거리를 안 보낸 이유(예: 바퀴를 다 못 셌을 때)가 있을 수 있으니까요.

**시간대.** 열한 줄 가운데 열 줄은 `+09:00`, 한 줄(L10)은 `Z`입니다. L10의 `2026-10-01T11:10:00Z`는 한국 시간 20:10이에요. 같은 순간을 다르게 적은 것일 뿐이니, 정본에서는 모두 UTC로 바꿔 저장합니다. 다만 월간 리포트는 날짜를 한국 시간 기준으로 나눠야 하므로, 리포트(외부 스키마)에서 다시 한국 시간으로 바꿔요. 저장과 표시의 시간대를 나누는 결정입니다.

**단위.** 3.x의 `duration` 단위는 `min` 3줄, `h` 1줄이고, `distance` 단위는 `km` 2줄, `m` 1줄입니다. 정본은 초와 미터로 맞춥니다.

```text
L8   31 min  → 31 × 60   = 1,860초      5.2 km  → 5,200m
L10  1.1 h   → 1.1 × 3600 = 3,960초     24000 m → 24,000m
L11  45 min  → 45 × 60   = 2,700초      (거리 없음)
```

`1.1 h`는 반올림된 값일 수 있습니다. 1시간 6분을 1.1로 적었다면 3,960초가 맞지만, 1시간 5분을 1.1로 반올림했다면 3,900초예요. 단위가 붙은 값이 오히려 정밀도를 잃을 수 있다는 점을 질문으로 남깁니다.

**중복.** L8과 L9는 글자 단위로 같은 줄이고 `event_id`가 `e-9f10`으로 같습니다. 11장에서 본 "적어도 한 번" 전달이라면 같은 이벤트가 두 번 오는 것은 정상이고, 소비자가 `event_id`로 걸러야 해요. 1.x·2.x에는 `event_id`가 없어서 중복을 거를 키가 없습니다. 정본에서는 (사용자, 끝난 시각)을 키로 대신 쓰고, 이 대체가 맞는지 질문합니다. 같은 사용자가 같은 초에 두 운동을 끝낼 일은 드물지만, 앱이 재전송하면서 시각을 다시 찍는다면 이 키로는 중복을 못 거릅니다.

#### 4. 호환성 판정

판정의 기준은 "필드 이름으로 읽는 소비자"입니다(25장).

| 변화 | 무엇이 바뀌었나 | FORWARD (옛 소비자가 새 줄) | BACKWARD (새 소비자가 옛 줄) | Semver |
| --- | --- | --- | --- | --- |
| 1.x → 2.x | 필드 이름 전부 변경, `kind`·`app` 추가, `memo` 없어짐 | 실패 | 실패 | MAJOR |
| 2.x → 3.x | `duration_sec` → `duration{value,unit}`, `distance_km` → `distance{…}`, `event` 값 변경, `event_id` 추가, `laps` 모양 변경 | 실패 | 실패 | MAJOR |

두 변화 모두 양쪽으로 호환되지 않습니다. 특히 2.x → 3.x의 `laps`는 이름은 그대로 두고 모양만 바꿔서, 옛 소비자가 오류 없이 엉뚱한 값을 읽을 수 있어요. 이름이 바뀐 필드는 "없음"으로 실패하니 차라리 알아채기 쉽지만, 이름이 같은 채 모양이 바뀐 필드는 조용히 틀립니다.

호환되게 바꾸려면 이렇게 했어야 해요.

```text
2.x → 3.x 를 호환으로 만드는 길 (병행)
  duration_sec 를 지우지 않고 duration 을 더함      → 옛 소비자는 duration_sec, 새 소비자는 duration
  laps 의 뜻을 바꾸지 않고 새 이름(lap_records)을 씀  → 이름이 같은 채 모양을 바꾸지 않음
  event 값 workout_end 를 유지, 새 값은 다른 필드로
  모든 소비자가 옮긴 뒤 옛 필드를 지움              → 이때 MAJOR (11장 진화 절차)
```

`laps`처럼 같은 이름의 뜻이나 모양을 바꾸는 것은 5장에서 본 의미 겹의 변경이에요. 한번 쓴 필드 이름은 같은 뜻으로만 쓴다는 규칙은, Protocol Buffers가 지운 필드 번호를 다시 쓰지 말라고 하는 것과 같은 생각입니다.

#### 5. 정본 모양, 정제 규칙, 옮겨 넣기

```sql
CREATE TABLE workout (
  workout_key TEXT PRIMARY KEY,           -- 3.x 는 event_id, 1.x·2.x 는 사용자|끝난 시각(UTC)
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('run','cycle','swim')),
  ended_at_utc TEXT NOT NULL,
  duration_sec INTEGER NOT NULL CHECK (duration_sec > 0),
  distance_m INTEGER CHECK (distance_m IS NULL OR distance_m >= 0),   -- NULL = 모름
  lap_count INTEGER,                      -- 2.x 의 laps(정수)
  pool_m INTEGER,
  source_shape TEXT NOT NULL CHECK (source_shape IN ('v1','v2','v3')),
  source_app TEXT
);
CREATE TABLE workout_lap (                 -- 3.x 의 laps(배열)
  workout_key TEXT NOT NULL REFERENCES workout(workout_key),
  n INTEGER NOT NULL,
  sec INTEGER NOT NULL,
  PRIMARY KEY (workout_key, n)
);
```

정제 규칙입니다. 가정에는 표시를 했어요.

```text
1.x   kind = run (type 이 run_end 뿐이라서, 가정) · ts = 끝난 시각 (가정)
      dur → duration_sec · dist(km, 가정) × 1000 → distance_m · memo 는 버림 (리포트에 안 씀)
2.x   duration_sec 그대로 · distance_km × 1000 → distance_m, null 이거나 없으면 NULL
      laps(정수) → lap_count
3.x   duration: min × 60, h × 3600 → duration_sec · distance: km × 1000, m 그대로 → distance_m
      laps(배열) → workout_lap
공통  시각은 UTC 로 · 같은 workout_key 는 한 번만
```

SQLite(3.53.0)에 옮겨 넣은 결과입니다.

```text
입력 11줄 → 운동 10행 (L9 가 L8 과 같은 키 e-9f10 이라 건너뜀)
거리 모름(NULL) 3행: L6, L7, L11 (모두 수영)
바퀴별 기록 2행: L11
예: e-a201 → duration_sec 3,960 · distance_m 24,000 · ended_at_utc 2026-10-01T11:10:00Z
    L1     → ended_at_utc 2026-08-31T22:12:03Z (한국 시간 9월 1일 07:12)
```

마지막 줄을 눈여겨보세요. L1은 한국 시간으로 9월 1일 아침 운동인데, UTC로는 8월 31일입니다. 리포트가 UTC 날짜로 월을 나누면 이 운동은 8월에 들어가요. 그래서 3번에서 정한 대로 저장은 UTC, 리포트의 날짜 나누기는 한국 시간으로 합니다. 이 결정은 리포트 외부 스키마의 "시점" 항목(9장)에 적어요.

#### 다른 답이 가능한 곳

- 정본을 이벤트 그대로(3.x 모양) 두고, 1.x·2.x 줄을 3.x 모양으로 바꿔 저장하는 설계도 가능합니다. 그러면 정본이 곧 계약 E가 되고, 리포트는 그 위의 외부 스키마가 됩니다.
- `memo`를 버리지 않고 보관할 수도 있습니다. 리포트에는 안 쓰지만 사용자에게 보여 줄 기능이 생길 수 있다면, 버리는 것은 되돌릴 수 없는 결정입니다.
- 1.x·2.x의 중복 제거 키를 (사용자, 끝난 시각, 종류)로 넓힐 수도 있습니다.

#### 흔한 실수

- 열한 줄을 스키마 하나로 추론해서 모든 필드를 선택으로 두는 것. 아무 줄이나 통과하는 스키마가 됩니다.
- `laps`의 정수와 배열을 하나의 칸에 섞어 넣는 것. 같은 이름의 다른 뜻을 하나로 만들면 리포트가 조용히 틀립니다.
- L6의 `null`을 0으로 바꾸는 것. 거리 0m와 거리 모름은 다릅니다.
- `1.1 h`를 그대로 1.1시간으로 믿는 것. 정밀도가 줄어든 값일 수 있습니다.
- 시각을 문자열 그대로 비교해 날짜를 나누는 것. `Z`와 `+09:00`이 섞여 있어 같은 날의 운동이 다른 날로 갈 수 있습니다.

#### 채점 기준

| 항목 | 기준 |
| --- | --- |
| 모양 분석 | 여섯 모양과 세대(3·4·4줄)를 맞게 묶고, 필드 출현을 셈 |
| 대응과 질문 | 세대 사이 필드를 대응시키되, `ts`·`dist`·1.x의 `kind`를 관찰로 두고 물음 |
| 값의 뜻 | `laps` 충돌, `null`과 없음, `Z` 한 줄, 단위 섞임, 중복 `e-9f10`을 모두 찾음 |
| 호환성 | 두 변화를 양쪽 비호환·MAJOR로 판정하고, 병행으로 호환되게 하는 길을 적음 |
| 정본 | DDL이 실행되고 11줄 → 10행, 중복 1, 거리 NULL 3, 바퀴 기록 2가 맞음. 저장과 표시의 시간대를 나눔 |

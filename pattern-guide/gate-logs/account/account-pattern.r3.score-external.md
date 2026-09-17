Account 3라운드 외부 검토 반영 판정: FAIL입니다. 외부 검토 지적 중 참이 6건이고, 모두 공통 루브릭 E1·E2 미흡으로 반영했습니다(명세 원칙 PG·AG는 전부 충족).

```
판정 요약
MUST          통과 33 / 전체 33   (명세 원칙 PG·AG 전부 충족. 바뀌지 않은 절은 이전 라운드 충족 승계)
SHOULD        미흡 0개            (PG20·PG26 충족 — PG26 은 문제가 "있음"으로 충족, 풀이 정확성은 E1 로 반영)
IF-APPLICABLE 충족 3 (PG10·AG10·AG12) / 해당없음 0 / 미흡 0
공통 루브릭    A 충족 · E 미흡(E1 3건, E2 3건) · F 충족 · V 충족(max_prose_run 2, 금지어 0, V4 메인 합산)
잠정 결론      FAIL — 공통 MUST 7 / 9, 합산 40 / 42. 이해 게이트 5/5 PASS 는 H축이라 이 판정과 별개
```

## 새 미흡 목록

### E2 사실 정확성 — 3건

**E2-a. 조건 3 [필수]가 원문 근거를 넘습니다.** (두 외부 모델과 채점 워커의 판단이 같음)
- 인용: 211 "[필수] 확정된 Entry 를 고치거나 지워서 정정하지 않습니다 … (근거: … eaaDev Accounting Entry 의 확정 뒤 변경 금지 규칙 …)" / 212 "변경 이력이 없으니 Temporal Property 나 필드와 다를 것이 없습니다."
- 원문 대조(WebFetch)
  - eaaDev Account: "There are two essential qualities to the account pattern: keeping a collection of entries and providing summarizing information over those entries."
  - eaaDev Accounting Entry: "Often there are specific rules for when an entry can be changed … not … when they are closed, or booked." 확정 뒤 불변은 흔한 규칙이지 필수 성질이 아닙니다.
  - Entry를 고쳐 정정하는 모델도 Entry를 더해 잔액을 얻으므로 212의 반례 문장도 틀렸습니다.
- 고칠 곳(추천)
  - 조건 3을 `[선택]`으로 내리고, 근거를 "Fowler 가 흔한 규칙으로 적음 · 과거 시점 보고와 감사가 요구이면 필요 · 이 가이드는 역분개로 따름"으로 적습니다.
  - 212는 "빠지면 잃는 것: 과거 시점 잔액의 재현, 수정 전 값"으로 바꿉니다.
  - 연쇄 수정: 개요 22 "확정된 기록은 고치지 않고"를 "이 글에서는"으로 좁히고, 점검 1(1168, 1188)은 E1-b와 함께 고칩니다.

**E2-b. 1091 "계정은 closeAccount 로만 닫힌다"가 Java·TypeScript에서 거짓입니다.** (codex 3-1)
- 인용: 1091 "계정은 저장소의 `closeAccount`(Rust `close_account`)가 root 의 `close()` 를 부르는 길로만 닫히고"
- 재현: Java·TS에서 `ledger.account(rent).close()` 가 컴파일·실행되고 이후 임대료 전기가 거절됩니다. Rust는 `error[E0596]: cannot borrow data in a & reference as mutable` 로 컴파일 실패합니다.
- 변경은 여전히 root의 `close()` 를 거치므로 AG8은 충족이고, 미흡은 해설 문장입니다.
- 고칠 곳: 1091을 "계정 상태는 root 의 `close()` 로만 바뀌어요. Rust 는 조회가 `&Account` 라 `close_account` 경로뿐이고, Java·TypeScript 는 `ledger.account(id).close()` 로도 부를 수 있습니다"로 고칩니다. 또는 Java·TS의 `account()` 가 읽기 전용 뷰를 돌려주게 바꿉니다.

**E2-c. Event Sourcing 구분 기준이 원문과 어긋납니다.** (codex 2-1)
- 인용: 229 "현재 상태는 그대로 저장하고 금액 결과만 Entry 로 모아 더하면 Account" / 254~255 "확인할 곳 — Account 의 현재 상태를 저장하는 테이블이나 필드가 있는가 / 없고 이벤트만 있으면 Event Sourcing"
- 원문 대조(WebFetch, eaaDev Event Sourcing): "a faster alternative is to store the current application state and if someone wants the special features that Event Sourcing offers then that additional capability is built on top." / "started at the beginning of the day from an overnight snapshot". 현재 상태 저장과 스냅숏이 Event Sourcing 안에 있으므로 상태 테이블 유무는 구분 기준이 되지 못합니다.
- 고칠 곳: 229를 "대상 상태의 변경이 모두 이벤트로 저장되고 재생으로 그 상태를 다시 만들 수 있는가(상태 테이블·스냅숏이 있어도 원천이 이벤트면 Event Sourcing) / 계정별 금액 결과를 Entry 로 모아 합으로 정의하는가"로, 254~255를 "상태 테이블을 버리고 이벤트로 다시 만들 수 있는가"로 바꿉니다(295의 AccountBalance 논리와 같음).

### E1 모순 없음 — 3건

**E1-a. ④-a의 aggregate 개수가 본문 안에서 다릅니다.** (codex 3-3)
- 인용: 1120 "Account 와 Transaction 두 aggregate 를 함께 고치는 것 — 트랜잭션 하나에서 aggregate 인스턴스 하나만 고친다는 Vernon 규칙의 예외" / 1147 "(aggregate 둘)" / 1135 "Transaction · 임대료 Account · 현금 Account 셋을 고쳐"
- 1120이 인스턴스 규칙을 들고 있으므로 "둘"은 과소 계수입니다. 직전 보고에서는 관찰로 두었지만 이 맥락을 다시 읽고 미흡으로 올립니다.
- 고칠 곳: 1120과 1147을 "Transaction 과 Account 두 종류, T2 에서는 인스턴스 셋(Transaction · 임대료 · 현금)"으로 맞춥니다.

**E1-b. 점검 1 풀이가 본문의 판정 기준과 어긋납니다.** (agy 2-4)
- 인용: 1188 "조건 1 도 지금 시점만 보면 지켜져요 … 갈리는 곳은 조건 3 입니다 … 취소를 부호가 반대인 내역 추가로 바꾸면 조건 3 을 충족합니다." / 295 "`adjust` 가 로그를 남기도록 고치는 것만으로는 부족해요 … 기록으로 필드를 다시 계산한다는 규칙까지 두면 … Account 패턴이 됩니다." / 207 "계산해 둔 값이 있어도 기준은 이 합"
- 문제: PointWallet은 원천이 `points` 필드이고 `history` 로 다시 계산하는 규칙이 없어, 본문 기준(226 첫 행, 295)으로는 조건 1에서 이미 필드가 원천인 잔액 모델입니다.
- 고칠 곳: 풀이의 갈림을 조건 1로 옮기고, "Account 가 되려면 취소를 역방향 내역 추가로 바꾸고, points 를 history 합의 캐시로 두어 어긋나면 history 로 다시 계산해야" 한다고 적습니다(1라운드 풀이 형태). 조건 3을 [선택]으로 내리면 이 수정이 함께 필요합니다.

**E1-c. 표 ②의 문구와 그 반례 행이 서로 다른 불변식을 다룹니다.** (codex 4-2)
- 인용: 338 ② "전기된 Entry 는 불변 → Transaction root …" / 1130(② 행) "각 Entry 는 스스로 바뀌지 않아도, T2 라는 묶음이 닫혔다는 것을 지킬 root 가 없어" / 확정안 I2(48행) "전기된 Transaction 과 그 Entry 는 수정·삭제하지 않는다"
- 문제: 반례는 거래 구성 불변을 보이는데 표 ②는 Entry 불변만 적어 확정안 I2보다 좁습니다.
- 고칠 곳: 표 ②를 "전기된 Transaction 의 Entry 구성과 각 Entry 는 불변(확정안 I2)"으로 넓히고 1130 행 라벨을 맞춥니다.

## 외부 검토 지적별 판정

| 지적 | 판정 | 근거 한 줄 |
| --- | --- | --- |
| codex 1-1 · agy 1-4 조건 3 [필수] | 참 → E2-a | 원문의 필수 성질은 둘, 불변은 "Often". 단 agy의 "역분개를 필수로 규정"은 거짓(211이 정책으로 표기) |
| codex 1-2 · agy 1-3 whenCharged/whenBooked 축약 | 부분 참, 관찰 · 원서 의미는 확인 안 함 | 58·135가 축약과 뒤늦은 전기 한계를 밝힘. 두 시각의 정의는 노트 미해결 질문 7. 개요 16·20의 "마감 보고서 재현" 범위를 135에 맞춰 좁히기 권장 |
| codex 1-3 "통화를 정해야" | 부분 참, 관찰 | 노트 924는 "보통 계정당 하나". 50을 "보통 하나, 여러 통화면 Money Bag(213)"으로. "최초 Entry 로 정한다"는 확인 안 함 |
| codex 2-1 Event Sourcing 기준 | 참 → E2-c | eaaDev Event Sourcing의 현재 상태 저장·스냅숏 문장 |
| agy 2-1 Event Sourcing 범주 오류 | 거짓(결함 아님) | Fowler는 "work very well with Event Sourcing"(노트 983)이지 "Account 가 곧 Event Sourcing"이 아님. 231이 겹침을 밝힘 |
| codex 2-2 Temporal Property를 코드로 가르면 오판 | 부분 참, 관찰 | 191·237 "조회가 기록을 더하는가"는 조건 8 캐시에서 빗나감. 227 정의 기준은 맞음 |
| codex 2-3 조회수 | 거짓(결함 아님) | 166이 비용으로 서술해 PG7 형식에 맞음. 191 "합을 물을 과거가 없고"만 다듬기 권장 |
| codex 2-4 id 참조 효과 과장 | 부분 참, 관찰 | 360·375 전제와 384 "객체 참조가 곧 규칙 위반은 아니지만"이 있음. 384 "새로 읽어야"는 저장소 캐시가 있으면 보장 안 됨. Vernon Part II의 해당 예제는 확인 안 함 |
| codex 3-1 closeAccount 우회 | 참 → E2-b | Java·TS 우회 실행 성공, Rust E0596 |
| codex 3-2 balance() 와 조건 8 | 부분 참, 관찰 | 138·329가 "전기 순번 기준, 날짜와 무관"을 밝힘. 조건 8·329 명칭을 "전기분 누계"로 권장 |
| codex 3-3 aggregate 둘/셋 | 참 → E1-a | 1120·1147 대 1135 |
| codex 3-4 · agy 3-3 Entry equals 범위 | 동작은 참, 결함 아님 | 서로 다른 거래의 Entry #1끼리 equals가 true. 하지만 Entry는 root 밖으로 나가지 않고(484·692·923) 표 339가 "같은 거래 안에서는 seq 로 비교". TS sameAs가 쓰이지 않는 것은 사실 |
| agy 4-1 Entry 식별자와 코드 불일치 | 거짓 | 식별자 = 소속 거래 id + seq, 339·1096이 같은 뜻 |
| codex 4-1 · agy 4-4 ③ 경합 | 거짓(결함 아님) | 338 ③ "(계정 닫기와 같은 순간에 일어난 전기의 경합은 허용)" = 확정안 I5, 1132도 설명 |
| codex 4-2 ② Entry 불변 대 거래 구성 불변 | 참 → E1-c | 338 ② 대 1130, 확정안 I2 |
| codex 4-3 "Entry 홀로면 지킬 root 없음"의 전제 | 부분 참, 관찰 | 1130 "막을 곳이 없음"을 "root 로는(저장소 제약을 따로 두지 않으면)"으로 좁히기 권장 |
| agy 1-1 · 4-2 Account 빈 껍데기 · 빈약한 모델 | 거짓(결함 아님) | AG2가 컬렉션 소유를 조건으로 삼지 못하게 하고 확정안 4절이 "Entry 컬렉션 없음"을 정함. 47·50·1088이 개념 책임을 코드의 누가 맡는지 밝힘 |
| agy 1-2 Transaction 결합 오인 | 거짓 | 56·59·61이 선택임을 밝히고 조건 1~4는 Transaction을 요구하지 않음 |
| agy 2-2 비교표 비대칭 | 거짓 | PG13이 "이 패턴을 고르면 얻고 포기하는 것"을 요구 |
| agy 2-3 Transaction을 비교표에 배치 | 거짓 | PG11이 같은 단서의 패턴을 허용하고, 228이 "(함께 쓰는 짝) … 대체 관계가 아니라" 명시 |
| agy 2-4 PointWallet 판정 | 참 → E1-b | 1188 대 295·226·207 |
| agy 3-1 classDiagram과 코드 괴리 | 거짓 | AG1이 개념 모델을 요구하고 101이 차이를 설명 |
| agy 3-2 중복·없는 원 거래 역분개 | 동작은 참, 결함 아님 | T2 두 번째 역분개(T21) 통과로 현금 4/6 = 105000, 전기 안 된 T99의 역분개(T22)도 통과. 본문·표 ②·확정안 I2 어디에도 유일성·존재 검사 약속이 없음(I2는 "정정됨 표시를 쓰지 않고 역분개 거래 유무로 파생"만 정함) |
| agy 3-4 TS·Rust 날짜 문자열 | 거짓(결함 아님) | 662·889 주석과 1096 "형식 검사는 하지 않아요"로 밝힘 |
| agy 4-3 읽기 모델 통화를 이벤트에서 취함 | 거짓 | 전기 전 checkPostable이 줄 통화 = 계정 통화를 보장(529·738·972) |

## 재현 결과

- **기본 실행**: Java·TS·Rust 모두 10줄, 서로 diff 0. 공식 `check-guides.py --compile` PASS, `golden.py measure` 는 max_prose_run 2 · 평서체 종결 0 · 등급 A.
- **직전 보고의 수치**: 건너뛰기 줄 삭제 시 현금 175000(false), 다시 만들면 75000 / 역순 전달 시 읽기 모델 −30000 · Entry 합 70000 / 확인을 저장 뒤로 옮기면 가수금 −50000, 올바른 순서의 역분개 거절. 모두 일치.
- **외부 검토 확인용 추가 실행**
  - `ledger.account(rent).close()`: Java·TS 실행되고 이후 전기 거절, Rust는 E0596 컴파일 실패
  - T2 두 번째 역분개(T21): 통과, 현금 4/6 = 105000 KRW
  - 전기 안 된 T99의 역분개(T22): 통과, reverses=T99
  - `new Entry(1, 현금 5).equals(new Entry(1, 매출 −7))`: true
- **원문 대조**: eaaDev Account("two essential qualities", Audit Log, 통합 Entry), eaaDev Accounting Entry("Often … booked"), eaaDev Event Sourcing(현재 상태 저장·스냅숏), DDD Reference Domain Events("typically contains … identity of entities involved").

(임시 파일은 scratchpad의 acct/r3/ 에만 두었고, 채점 대상 파일과 git은 건드리지 않았습니다.)
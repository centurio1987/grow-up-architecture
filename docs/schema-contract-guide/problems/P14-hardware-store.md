## P14 철물점 재고 — 오래된 DB에서

| 난이도 | 씨앗 형식 | 중심 산출물 | 연결 장 |
| --- | --- | --- | --- |
| 상 | 오래된 DB의 스키마와 행 + 질의 기록 | 역공학·실제 계약·개념 스키마·호환 뷰 | 5, 21, 24, 26 |

### 상황

동네 철물점이 2009년에 납품받은 재고 프로그램을 새 앱으로 바꾸려 합니다. 프로그램을 만든 업체와는 연락이 되지 않고 문서도 없어요. 사장님은 매장 프로그램(가격표·재고 조회·출고 입력)을 새 앱으로 바꿀 생각이에요. 그런데 세무사 사무실이 쓰는 **회계 프로그램**은 바꿀 수 없다고 합니다. 회계 프로그램은 매일 밤 재고 DB에 직접 붙어 그날 출고를 읽어 가요.

### 주어진 자료

두 파일의 전문입니다. `problems/data/p14-hardware-store.sql`은 스키마와 일부 행, `problems/data/p14-query-log.txt`는 10일간의 질의 기록이에요.

```sql
-- 철물점 재고 프로그램(2009년 납품)의 DB에서 뽑은 스키마와 일부 행입니다.
-- 외래 키 선언은 원래 DB에도 없습니다.
CREATE TABLE TB_ITEM (
  ITEM_CD  CHAR(8) PRIMARY KEY,
  ITEM_NM  VARCHAR(60),
  CAT1     CHAR(2),
  CAT2     CHAR(2),
  UNIT     VARCHAR(10),
  PRICE1   INTEGER,
  PRICE2   INTEGER,
  PRICE3   INTEGER,
  CUST_CD  CHAR(5),
  MEMO     VARCHAR(200),
  USE_YN   CHAR(1)
);
CREATE TABLE TB_STOCK (
  ITEM_CD  CHAR(8),
  WH_CD    CHAR(2),
  QTY      INTEGER,
  UPD_DT   CHAR(8)
);
CREATE TABLE TB_INOUT (
  SEQ      INTEGER PRIMARY KEY,
  DT       CHAR(8),
  ITEM_CD  CHAR(8),
  IO_GB    CHAR(1),
  QTY      INTEGER,
  WH_CD    CHAR(2),
  CUST_CD  CHAR(5),
  REMARK   VARCHAR(100)
);
CREATE TABLE TB_CUST (
  CUST_CD  CHAR(5) PRIMARY KEY,
  CUST_NM  VARCHAR(60),
  TEL      VARCHAR(20),
  CUST_GB  CHAR(1)
);
CREATE TABLE TB_CODE (
  GRP_CD   VARCHAR(10),
  CD       VARCHAR(10),
  CD_NM    VARCHAR(40),
  SORT     INTEGER
);

INSERT INTO TB_CODE VALUES ('CAT1','HD','공구',1),('CAT1','PL','배관',2),('CAT1','EL','전기',3),
 ('IO_GB','I','입고',1),('IO_GB','O','출고',2),('IO_GB','R','반품',3),('IO_GB','A','재고조정',4),
 ('WH','01','본점',1),('WH','02','창고',2),
 ('CUST_GB','S','매입처',1),('CUST_GB','C','거래처',2);

INSERT INTO TB_CUST VALUES ('S0001','대성공구','02-811-1000','S'),('S0002','한일배관','02-822-2000','S'),
 ('S0003','빛전기','02-833-3000','S'),('C0001','우리인테리어','010-4000-1111','C'),('C0002','동네설비','010-5000-2222','C');

INSERT INTO TB_ITEM VALUES
 ('HD010023','망치 450g','HD','01','개',12000,10000,9000,'S0001','','Y'),
 ('HD020007','십자드라이버 2번','HD','02','개',4500,3800,3500,'S0001','','Y'),
 ('PL010101','PVC 엘보 25A','PL','01','개',800,600,550,'S0002','','Y'),
 ('PL030015','실리콘 투명','PL','03','통',5500,4500,4200,'S0002','단종예정 / 대체: PL030016','Y'),
 ('PL030016','실리콘 투명(신)','PL','03','통',5800,4700,4400,'S0002','','Y'),
 ('EL010002','멀티탭 4구 3m','EL','01','개',15000,12500,12000,'S0003','납품처 010-2222-3333 김사장','N'),
 ('EL020010','LED 전구 10W','EL','02','개',3000,2500,2300,'','','Y'),
 ('HD990001','기타(전기)','EL','99','개',1000,1000,1000,'','','Y');

INSERT INTO TB_STOCK VALUES
 ('HD010023','01',14,'20261010'),('HD010023','02',30,'20261001'),('HD020007','01',22,'20261007'),
 ('PL010101','01',120,'20261009'),('PL010101','02',375,'20261004'),('PL030015','01',3,'20261006'),
 ('PL030016','01',24,'20260930'),('EL010002','01',0,'20261005'),('EL020010','01',55,'20261008'),
 ('HD990001','01',7,'20260801'),('PL010199','02',10,'20250312');

INSERT INTO TB_INOUT VALUES
 (1,'20261001','HD010023','I',20,'01','S0001',''),
 (2,'20261002','HD010023','O',3,'01','C0001',''),
 (3,'20261003','PL010101','O',50,'02','C0002','현장: 상도동'),
 (4,'20261004','PL010101','R',5,'02','C0002','반품'),
 (5,'20261005','EL010002','O',2,'01','','현금판매'),
 (6,'20261006','PL030015','A',-2,'01','','파손'),
 (7,'20261007','HD020007','O',1,'01','',''),
 (8,'20261008','EL020010','I',60,'01','S0003',''),
 (9,'20261009','PL010101','O',30,'01','C0001',''),
 (10,'20261010','HD010023','O',2,'01','C0003','');
```

```text
# 매장 프로그램과 외부 프로그램이 보낸 질의(2026-10-01 ~ 10-10, 같은 꼴은 한 번만 적고 횟수를 붙임)
[매장/가격표]   412회  SELECT ITEM_CD, ITEM_NM, PRICE1 FROM TB_ITEM WHERE USE_YN = 'Y' AND CAT1 = ? ORDER BY ITEM_NM
[매장/거래처가] 57회   SELECT I.ITEM_CD, I.ITEM_NM, I.PRICE2 FROM TB_ITEM I, TB_CUST C WHERE C.CUST_CD = ? AND C.CUST_GB = 'C'
[매장/재고]     389회  SELECT SUM(QTY) FROM TB_STOCK WHERE ITEM_CD = ?
[매장/출고]     96회   INSERT INTO TB_INOUT VALUES (?, ?, ?, 'O', ?, ?, ?, ?)
[매장/출고]     96회   UPDATE TB_STOCK SET QTY = QTY - ?, UPD_DT = ? WHERE ITEM_CD = ? AND WH_CD = ?
[매장/일보]     10회   SELECT * FROM TB_INOUT WHERE DT = ? ORDER BY SEQ
[회계프로그램]  10회   SELECT DT, ITEM_CD, QTY, CUST_CD FROM TB_INOUT WHERE IO_GB = 'O' AND DT = ?
```

### 과제

1. 선언된 구조를 읽고, 26장의 목록에 따라 암묵 구조를 찾아 표로 정리하세요. 찾을 때 쓴 질의와 그 결과도 적습니다.
2. 자료 검사로 고아 값, 빈 값, 부호, 가격 순서를 확인하고, 재고 표와 입출고 기록이 서로 맞는지 검산하세요.
3. 질의 기록을 읽고 두 가지를 나눠 적으세요. (가) 매장 프로그램이 하는 일로 알 수 있는 업무 규칙, (나) 회계 프로그램의 실제 계약.
4. 개념 스키마를 쓰세요(26장의 개념화). 옛 구조의 편의와 최적화를 걷어 냅니다.
5. 새 내부 스키마와 회계 프로그램을 위한 호환 뷰를 쓰고, 옛 DB와 같은 결과를 내는지 SQLite로 확인하세요.
6. 사장님과 세무사 사무실에 보낼 질문 목록을 만드세요.

### 실마리

- `TB_CODE` 하나에 여러 코드 묶음이 들어 있습니다.
- 품목 코드 앞 두 글자와 `CAT1`을 견줘 보세요.
- `MEMO`에는 서로 다른 종류의 정보가 들어 있습니다.
- `[매장/거래처가]` 질의의 조인 조건을 잘 읽어 보세요.
- `[매장/일보]`는 `SELECT *`입니다.

### 풀이

자료 검사의 숫자는 `verification/check_p11_p13_p14.py`의 출력(`verification/p11-p13-p14-result.json`)과 `verification/check_p14_stock.py`의 출력(`verification/p14-stock-reconcile.json`), 호환 뷰 확인은 `verification/check_part4_ddl.py`의 출력(`verification/part4-ddl-result.json`)에서 옮겼습니다.

#### 1. 선언된 구조와 암묵 구조

선언된 것은 표 다섯 개와 기본 키 세 개(`TB_ITEM.ITEM_CD`, `TB_INOUT.SEQ`, `TB_CUST.CUST_CD`)뿐입니다. `TB_STOCK`과 `TB_CODE`에는 기본 키도 없어요. 나머지는 모두 암묵 구조입니다.

| 암묵 구조 | 무엇 | 찾은 근거 |
| --- | --- | --- |
| 선언 안 된 외래 키 | `TB_STOCK.ITEM_CD`·`TB_INOUT.ITEM_CD` → `TB_ITEM`, `TB_INOUT.CUST_CD`·`TB_ITEM.CUST_CD` → `TB_CUST`, `WH_CD` → `TB_CODE`(WH) | 이름이 같은 열 + 포함 종속 검사(2번) |
| 코드 표 하나에 여러 묶음 | `TB_CODE`에 CAT1·IO_GB·WH·CUST_GB 네 묶음 | `GRP_CD`의 값 |
| 기본 키 후보 | `TB_STOCK`의 (품목, 창고) | 겹치는 조합 없음(관찰). `UPDATE … WHERE ITEM_CD = ? AND WH_CD = ?`가 한 행을 가정 |
| 반복 열 | `PRICE1`·`PRICE2`·`PRICE3` | 질의 기록: PRICE1은 가격표, PRICE2는 거래처가. PRICE3은 어떤 질의도 안 씀 |
| 여러 용도의 칸 | `MEMO`: 대체 품목(`대체: PL030016`), 납품처 연락처(`납품처 010-… 김사장`) | 빈칸이 아닌 MEMO 두 줄 |
| 코드에 박은 뜻 | `ITEM_CD` 앞 두 글자 = 대분류, 3~4번째 = 소분류로 보임 | 앞 두 글자와 `CAT1`이 같은 품목 8개 중 7개, 3~4번째와 `CAT2`가 같은 품목 8개 중 8개 |
| 논리 삭제 | `USE_YN = 'N'` (EL010002) | 가격표 질의가 `USE_YN = 'Y'`로 거름 |
| 부호에 박은 뜻 | `IO_GB = 'A'`는 수량이 음수(−2), 나머지는 양수 | `IO_GB`별 수량 최소·최대 |
| 형식에 박은 뜻 | `DT`·`UPD_DT`는 `YYYYMMDD` 여덟 글자 | 회계 질의가 `DT = ?`로 비교 |

품목 코드의 앞 두 글자가 대분류와 맞지 않는 품목은 `HD990001`(이름 "기타(전기)", `CAT1` = EL) 하나입니다. 26장에서 본 대로, 코드에 박힌 뜻은 언젠가 사실과 어긋나요. 여기서는 이미 어긋나 있습니다. 새 설계에서는 대분류를 코드에서 읽지 않고 `CAT1` 값을 따로 둡니다.

#### 2. 자료 검사

```text
포함 종속(외래 키 후보)
  TB_STOCK 에만 있는 품목       PL010199 (창고 02, 수량 10, 갱신 20250312)
  TB_INOUT 에만 있는 거래처      SEQ 10 의 C0003
  TB_INOUT 의 빈 거래처          SEQ 5(O, 현금판매) · SEQ 6(A, 파손) · SEQ 7(O, 비고 없음)
  TB_ITEM.CUST_CD 의 거래처 구분  빈값 2, S0001 2, S0002 3, S0003 1 → 모두 매입처(S)

부호와 구분
  IO_GB  A 1행(-2) · I 2행(20~60) · O 6행(1~50) · R 1행(5)

가격
  PRICE1 ≥ PRICE2 ≥ PRICE3 인 품목  8개 중 8개      (관찰. 규칙인지는 q)
```

`TB_ITEM.CUST_CD`가 모두 매입처라는 관찰에서, 이 칸은 "주 매입처"로 보입니다. 빈 거래처 세 행 가운데 둘은 출고(현금판매, 비고 없음)라서 "거래처 없는 판매"가 정상 업무로 보이고, 하나는 재고 조정이라 거래처가 없는 것이 자연스러워요.

재고 표와 입출고 기록을 맞춰 보면 문제가 하나 나옵니다. 지금 재고에서 기간 순증감(입고·반품은 더하고 출고는 빼고 조정은 부호대로)을 빼서 10월 1일의 재고를 거꾸로 계산하면, 두 행이 음수예요.

```text
품목 · 창고       지금 재고  기간 순증감  기간 시작 재고(역산)
EL020010 · 01      55         +60          -5     ← 음수
HD010023 · 01      14         +15          -1     ← 음수
PL010101 · 01     120         -30         150
PL010101 · 02     375         -45         420
(나머지 7행은 역산이 0 이상)
```

재고가 음수에서 시작할 수는 없으니, 재고 표와 입출고 기록 가운데 적어도 하나가 사실과 맞지 않습니다. 질의 기록을 보면 이유를 짐작할 수 있어요. 매장 프로그램은 출고 때 `INSERT INTO TB_INOUT`과 `UPDATE TB_STOCK`을 따로 보내고, 입고에 대해서는 기록에 질의가 없습니다. 입고 때 재고를 고치지 않았거나, 재고를 손으로 고친 적이 있을 수 있어요. 어느 쪽인지는 자료가 말하지 않으므로 질문으로 남깁니다. 이 관찰은 개념 스키마의 결정(4번)에 직접 영향을 줘요.

#### 3. 질의 기록 읽기

(가) **매장 프로그램이 하는 일로 알 수 있는 업무 규칙**입니다. 매장 프로그램은 새 앱으로 바뀌므로 지킬 계약은 아니지만, 새 앱이 같은 업무를 하려면 알아야 해요.

| 질의 | 드러나는 것 | 근거 수준 |
| --- | --- | --- |
| 가격표(412회) | 매장 가격 = PRICE1. 사용하지 않는 품목(USE_YN = 'N')은 가격표에서 뺌. 대분류는 `CAT1` 칸으로 거름 | 관찰 |
| 거래처가(57회) | 조인 조건이 없어 품목 전체 × 그 거래처 한 행 → **모든 품목**의 PRICE2를 보여 줌. 거래처마다 가격이 다르지 않고, 거래처면 누구나 PRICE2. USE_YN으로 거르지 않아 쓰지 않는 품목도 나옴 | 관찰(버그일 수 있음) |
| 재고(389회) | 매장은 창고를 나누지 않고 품목별 합계 재고를 봄 | 관찰 |
| 출고(96회 + 96회) | 출고 기록과 재고 차감을 따로 보냄. 같은 트랜잭션인지 알 수 없음. `INSERT … VALUES`에 열 목록이 없어 열 순서에 기댐 | 관찰 |
| 일보(10회) | 하루 입출고를 `SEQ` 순서로 봄 → `SEQ`가 시간 순서라고 가정 | 관찰 |

(나) **회계 프로그램의 실제 계약**입니다. 이것은 바꿀 수 없는 바깥 이용자의 것이라 그대로 지켜야 해요.

```text
SELECT DT, ITEM_CD, QTY, CUST_CD FROM TB_INOUT WHERE IO_GB = 'O' AND DT = ?

지킬 것
  표와 열 이름     TB_INOUT · DT · ITEM_CD · QTY · CUST_CD · IO_GB
  값의 꼴         DT 는 'YYYYMMDD' · 출고의 QTY 는 양수 · 거래처가 없으면 CUST_CD 는 빈 문자열('')
  코드값의 뜻      IO_GB 'O' = 출고
  고르는 범위      출고만. 반품(R)은 회계로 가지 않음
```

마지막 줄은 질문거리입니다. 반품이 회계 질의에 잡히지 않으니, 반품된 물건의 매출은 회계 쪽에서 줄어들지 않아요. 26장에서 본 것처럼 질의 기록이 업무 규칙의 빈틈을 보여 준 경우입니다.

빈 거래처가 `NULL`이 아니라 빈 문자열이라는 것도 계약의 일부예요. 옛 DB가 빈 문자열을 써 왔으니, 회계 프로그램이 `CUST_CD = ''`로 현금판매를 가려내고 있을 수 있습니다. 5장의 Hyrum 법칙대로, 관찰된 동작은 누군가 기대고 있다고 보고 지킵니다.

#### 4. 개념 스키마

```text
[개체] 품목(품목 코드) · 거래 상대(코드) · 창고(코드) · 대분류(코드) · 입출고(번호)
[값]   거래 상대 역할{매입처, 거래처, 확인 대기} · 입출고 종류{입고, 출고, 반품, 조정}
       · 가격 종류{매장가, 거래처가, 가격3(뜻 모름)}

[사실] F1 품목 은 이름, 단위, 대분류, 소분류, 사용 여부 를 가진다
[사실] F2 품목 은 주 매입처 를 가진다 (선택)
[사실] F3 품목 은 가격 종류 마다 가격 을 가진다                         ← PRICE1~3 을 세로로
[사실] F4 품목 은 대체 품목 을 가진다 (선택)                            ← MEMO 의 "대체:"
[사실] F5 거래 상대 는 이름, 전화, 역할 을 가진다
[사실] F6 품목 은 창고 마다 재고 수량 과 갱신일 을 가진다
[사실] F7 입출고 는 일자, 품목, 종류, 수량 변화, 창고, 거래 상대(선택), 비고 를 가진다

[제약] R1 (품목, 창고) 마다 재고 하나
[제약] R2 수량 변화의 부호: 입고·반품 +, 출고 −, 조정은 ±         (반품 방향은 q)
[미결] 재고 수량(F6)을 사실로 둘지, 입출고(F7)에서 계산할지      (2번의 역산 음수)
       납품처 연락처(EL010002 의 MEMO)는 거래 상대인가, 품목의 메모인가
```

가장 큰 결정은 마지막 미결입니다. 4장의 단일 조건으로 보면, 재고는 입출고에서 계산되는 값이라 따로 저장하면 두 곳이 어긋날 수 있어요. 2번의 역산 음수가 바로 어긋난 증거입니다. 그런데 기초 재고(처음 재고)가 기록에 없어서, 지금 당장은 입출고만으로 재고를 계산할 수 없어요. 그래서 새 설계는 이렇게 갑니다. 한 번 실사로 기초 재고를 정해 "조정" 입출고로 기록하고, 그 뒤로는 재고를 입출고에서 계산하거나, 재고를 저장하더라도 입출고와 같은 트랜잭션에서만 바꿉니다. 어느 쪽을 고르든 사장님의 확인이 필요해요.

#### 5. 새 내부 스키마와 호환 뷰

```sql
CREATE TABLE party (
  party_code TEXT PRIMARY KEY, name TEXT NOT NULL, tel TEXT,
  role TEXT NOT NULL CHECK (role IN ('supplier','customer','unverified'))
);
CREATE TABLE warehouse (wh_code TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE category (cat1 TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE item (
  item_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cat1 TEXT REFERENCES category(cat1),
  cat2 TEXT,
  unit TEXT NOT NULL,
  main_supplier TEXT REFERENCES party(party_code),
  in_use INTEGER NOT NULL CHECK (in_use IN (0,1)),
  unverified INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE item_price (
  item_code TEXT NOT NULL REFERENCES item(item_code),
  price_kind TEXT NOT NULL CHECK (price_kind IN ('retail','trade','price3_unknown')),
  won INTEGER NOT NULL CHECK (won >= 0),
  PRIMARY KEY (item_code, price_kind)
);
CREATE TABLE item_replacement (
  item_code TEXT NOT NULL REFERENCES item(item_code),
  replaced_by TEXT NOT NULL REFERENCES item(item_code),
  PRIMARY KEY (item_code)
);
CREATE TABLE stock (
  item_code TEXT NOT NULL REFERENCES item(item_code),
  wh_code TEXT NOT NULL REFERENCES warehouse(wh_code),
  qty INTEGER NOT NULL,
  updated_on TEXT NOT NULL,
  PRIMARY KEY (item_code, wh_code)
);
CREATE TABLE stock_move (
  seq INTEGER PRIMARY KEY,
  moved_on TEXT NOT NULL,
  item_code TEXT NOT NULL REFERENCES item(item_code),
  kind TEXT NOT NULL CHECK (kind IN ('in','out','return','adjust')),
  qty_change INTEGER NOT NULL,
  wh_code TEXT NOT NULL REFERENCES warehouse(wh_code),
  party_code TEXT REFERENCES party(party_code),
  remark TEXT
);
-- 회계 프로그램이 읽던 모양을 그대로 내주는 호환 뷰 (이름도 그대로)
CREATE VIEW TB_INOUT AS
SELECT seq AS SEQ,
       replace(moved_on, '-', '') AS DT,
       item_code AS ITEM_CD,
       CASE kind WHEN 'in' THEN 'I' WHEN 'out' THEN 'O' WHEN 'return' THEN 'R' ELSE 'A' END AS IO_GB,
       CASE kind WHEN 'out' THEN -qty_change ELSE qty_change END AS QTY,
       wh_code AS WH_CD,
       COALESCE(party_code, '') AS CUST_CD,
       COALESCE(remark, '') AS REMARK
FROM stock_move;
```

호환 뷰에서 가장 중요한 줄은 `COALESCE(party_code, '') AS CUST_CD`입니다. 새 구조는 "거래 상대 없음"을 `NULL`로 두지만, 회계 프로그램에는 옛 DB처럼 빈 문자열을 내줘요. 3번 (나)의 "값의 꼴"을 지키는 줄입니다. 그다음으로 중요한 줄은 출고의 `QTY`를 양수로 되돌리는 `CASE`예요. 새 구조는 수량 변화를 부호로 담지만, 회계 프로그램은 출고 수량을 양수로 받아 왔습니다.

옛 DB의 자료를 정제 규칙(가격을 세로로, MEMO의 대체 품목을 따로, 목록에 없는 품목·거래처는 "확인 대기"로 넣어 지우지 않음)대로 옮겨 넣고, 외래 키를 켠 SQLite(3.53.0)에서 확인한 결과입니다.

```text
확인 대기로 넣은 것   품목 PL010199 · 거래 상대 C0003
품목 9행(8 + 확인 대기 1) · 가격 24행 · 재고 11행 · 입출고 10행 · 대체 품목 1행(PL030015 → PL030016)
회계 질의 결과가 옛 DB 와 같은가     날짜 10개 모두 같음
일보 질의(SELECT *) 결과가 같은가    같음 (열 순서까지)
예: 2026-10-02 회계 질의 → (20261002, HD010023, 3, C0001)
```

일보 질의까지 같은지 확인한 이유는 `SELECT *` 때문이에요. 열 이름이 아니라 **열 순서**에 기대는 질의이므로, 호환 뷰의 열 순서도 옛 표와 같아야 합니다. 매장 프로그램은 새 앱으로 바뀌지만, 바뀌기 전 병행 기간에는 옛 일보 화면도 돌아가야 하니까요.

이 호환 뷰는 읽기만 지킵니다. 옛 매장 프로그램의 `INSERT INTO TB_INOUT VALUES (…)`는 뷰에 쓸 수 없어서, 병행 기간에 옛 매장 프로그램을 계속 쓰려면 INSTEAD OF 트리거가 필요합니다. 이 풀이는 매장 프로그램을 새 앱으로 한 번에 바꾼다고 가정했어요.

#### 6. 질문 목록

| 받는 사람 | 질문 | 바뀌는 것 |
| --- | --- | --- |
| 사장님 | PRICE3은 무슨 가격인가요? 아무 화면에서도 쓰지 않는 것 같습니다 | 가격 종류 값 |
| 사장님 | 거래처가는 거래처마다 같은가요? 지금 프로그램은 거래처면 누구에게나 같은 가격(PRICE2)을 보여 줍니다 | 가격 사실의 꼴(품목별 / 품목 × 거래처별) |
| 사장님 | 반품(R)은 손님이 돌려준 것만인가요, 매입처에 돌려보낸 것도 있나요? | R2의 부호 |
| 사장님 | 입고할 때 재고 수량도 바꾸셨나요? 10월 1일 재고가 음수로 계산되는 품목이 둘(EL020010, HD010023) 있습니다 | 재고를 저장할지 계산할지, 기초 재고 실사 |
| 사장님 | PL010199는 무슨 품목인가요? 재고 표에만 있고 품목 목록에 없습니다(마지막 갱신 2025-03-12) | 확인 대기 품목 처리 |
| 사장님 | C0003은 어느 거래처인가요? | 확인 대기 거래 상대 처리 |
| 사장님 | "기타(전기)" HD990001의 코드가 HD로 시작하는데 전기 분류입니다. 코드 앞 글자로 분류하는 화면이 있나요? | 코드에 박은 뜻을 버려도 되는지 |
| 사장님 | EL010002 메모의 "납품처 김사장"은 매입처 목록에 넣어야 하나요? | MEMO의 두 번째 용도 |
| 세무사 사무실 | 반품은 회계 프로그램에 어떻게 반영하시나요? 지금 질의는 출고(O)만 읽습니다 | 회계 계약에 반품을 넣을지 |
| 세무사 사무실 | 거래처가 없는 출고(현금판매)를 빈 거래처 코드로 구분하시나요? | 호환 뷰의 빈 문자열을 계속 지킬지 |
| 세무사 사무실 | 회계 프로그램을 바꾸실 계획이 있나요? 있다면 새 경계(파일이나 API)를 함께 정할 수 있을까요? | 호환 뷰의 기한(11장 진화 절차) |

#### 다른 답이 가능한 곳

- 거래 상대를 매입처와 거래처 두 표로 나눌 수도 있습니다. 한 상대가 두 역할을 함께 하는 일이 없다면 단순하고, 함께 한다면 지금처럼 역할을 값으로 두는 편이 낫습니다.
- 가격을 세로로 펴지 않고 `retail_price`, `trade_price` 두 열로 둘 수도 있습니다. 가격 종류가 늘어날 일이 없고 PRICE3을 버리기로 확인되면 이쪽이 단순합니다.
- 재고 표를 없애고 입출고에서 계산하는 설계도 가능합니다. 기초 재고를 조정 입출고로 넣은 뒤라면 4장의 단일 조건에 가장 잘 맞습니다.

#### 흔한 실수

- 옛 표를 이름만 바꿔 그대로 옮기는 것. 반복 열, 여러 용도의 MEMO, 코드에 박은 뜻이 새 앱에도 남습니다.
- 품목 코드 앞 두 글자로 대분류를 계산하는 것. HD990001 하나가 이미 어긋나 있습니다.
- 고아 재고 PL010199와 고아 거래처 C0003을 지우는 것. 재고 10개와 출고 기록 하나가 사라집니다.
- 호환 뷰에서 빈 거래처를 `NULL`로 내주는 것. 회계 프로그램이 빈 문자열에 기대고 있을 수 있습니다.
- 질의 기록의 거래처가 질의를 "올바른 동작"으로 옮기는 것. 조인 조건이 없는 질의는 버그일 수 있으니, 새 앱에 옮기기 전에 사장님께 확인합니다.

#### 채점 기준

| 항목 | 기준 |
| --- | --- |
| 암묵 구조 | 외래 키, 코드 표 묶음, 반복 열, MEMO의 두 용도, 코드에 박은 뜻(7/8), 논리 삭제, 부호를 찾음 |
| 자료 검사 | 고아 값 둘(PL010199, C0003), 빈 거래처 셋, 재고 역산 음수 둘을 찾음 |
| 질의 기록 | 매장 동작과 회계의 실제 계약을 나눔. 빈 문자열·양수 수량·출고만이라는 꼴까지 적음 |
| 개념 스키마 | 가격을 종류별 사실로, 대체 품목을 따로 둠. 재고를 저장할지 계산할지를 미결로 남김 |
| 호환 뷰 | 회계 질의 10개 날짜, 일보 질의 결과가 옛 DB와 같음을 실행으로 확인 |
| 질문 | 받는 사람별로 나누고, 질문마다 바뀌는 설계 요소를 적음 |

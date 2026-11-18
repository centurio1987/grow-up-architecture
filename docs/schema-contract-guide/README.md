# 세 층 스키마와 계약

외부 스키마·개념 스키마·내부 스키마(ANSI/SPARC 세 층)에 계약을 더한 네 산출물을 정의하고, 형식이 있는 자료와 거친 자료에서 그 넷을 설계하는 방법을 다루는 장편 가이드입니다. 원고 48개 파일(서론과 26장, 실습 안내와 문제 15개, 부록 5개), 약 40만 자입니다. `index.html`을 브라우저에서 열면 됩니다. 본문·서체가 한 파일에 들어 있어 오프라인에서 읽을 수 있습니다.

## 구성

| 부 | 내용 | 원고 |
| --- | --- | --- |
| 서론 | 네 산출물의 지도, 읽는 경로, 표기 약속, 이어지는 예(공유 오피스 「틈」의 회의실 예약) | `chapters/00-intro.md` |
| 제1부 이론 | 데이터 독립성, 개념·외부·내부 스키마, 계약, 사상과 추적 (1~6장) | `chapters/01~06` |
| 제2부 설계 방법 | 추출 원장, CSDP, 외부 스키마 설계, 관점 통합, 계약 설계, 내부 스키마 설계, 검증 (7~13장) | `chapters/07~13` |
| 제3부 형식이 있는 씨앗 | 씨앗 형식 지도, 서사·도메인 스토리, 유스케이스·사용자 스토리, Gherkin, 이벤트 스토밍, 요구사항 문장, 양식 (14~20장) | `chapters/14~20` |
| 제4부 거친 자료 | 거친 자료의 원칙, 대화, 스프레드시트, 프로파일링, JSON 로그, 오래된 DB 역공학 (21~26장) | `chapters/21~26` |
| 제5부 실습 | 실습 안내와 문제 15개(풀이 포함) | `problems/` |
| 부록 | 용어집, 원장 양식, 계약 양식, 설계 검사표, 참고 문헌 | `appendix/` |

## 파일

- `index.html`: 완성 HTML. `tools/build.py`가 만드는 파생물이라 손으로 고치지 않습니다.
- `visual.html`: 도해판. 장마다 정의·표·「틈」 예를 그림과 손으로 만지는 장치(분류 놀이, 원문↔원장 연결, 겹침 시험대, 인구 왕복 계산, 덤프 프로파일링 등)로 옮긴 동반 판입니다. 「본문에서 읽기」는 `index.html`의 같은 절로 이어집니다. `tools/build_visual.py`가 `visual/`의 원본(뼈대·모양·`data-*.js` 내용·`sec-*.js` 그림)을 구운 파생물이라 손으로 고치지 않습니다. 원고를 고치면 `visual/data-*.js`도 함께 고칩니다.
- `guide.md`: 원고를 한 파일로 모은 것. 역시 파생물입니다.
- `chapters/`, `problems/`, `appendix/`: 원고(정본).
- `problems/data/`: 실습 자료. P10 메신저 대화, P11 회비 장부, P12 배송 기록·기사 목록, P13 운동 앱 로그, P14 철물점 DB·질의 기록, P15 주문 엑셀, 그리고 제4부 본문용 「틈」 예약 덤프·회원·이벤트 로그.
- `design/structure.md`: 가이드 구성 설계서. `design/writing-rules.md`: 집필 규칙(번호 체계, 금지 글자·어휘, 검사 명령).
- `research/2026-11-17-three-schema-and-contract.md`: 집필 전에 모은 리서치 문서(소스 140개, 확인 수준 표시). `research/parts/`는 조사 갈래별 조각이고 `research/merge.py`가 합칩니다.
- `verification/`: 검증 스크립트와 결과.
- `tools/`: 빌드·검사 스크립트.

## 다시 만들기

이 폴더에서 실행합니다.

```sh
python3 tools/build.py          # 원고 모으기 + 굽기 가드 글자 검사 + 본문 계산 예 검사 + publish-report 로 index.html 굽기
python3 verification/check_body_numbers.py   # 본문 계산 예(1장 글자 위치, 어림수, 검산)를 다시 셈해 원고 문장과 맞춤
python3 tools/style_report.py   # 원고마다 박자 등급과 어휘 규약 결과 → verification/style-report.json
node tools/screenshot.mjs       # 데스크톱·휴대폰 폭 화면과 가로 넘침 → verification/screens.json
python3 verification/tum_roundtrip.py      # 13장 인구 왕복(SQLite)
python3 verification/profile.py <csv>      # 실습 자료 프로파일
python3 verification/check_p11_p13_p14.py  # P11·P13·P14 풀이 수치
python3 verification/check_part4_ddl.py     # P11~P14 재설계 DDL 을 SQLite 에서 실행
python3 verification/check_p15.py           # P15 인구 왕복·반례 시험
python3 verification/p02-dates.py           # P02~P08 풀이 수치(p03-slots.py … p08-academy.py 도 같은 꼴)
python3 tools/build_visual.py   # 도해판 visual.html 굽기(쓰인 글자만 남긴 서체를 넣어 바깥 요청 0)
node tools/check_visual.mjs map c13 c24   # 도해판을 1440px·390px, 밝은·어두운 주제로 열어 오류·넘침 → verification/visual/
```

HTML 굽기는 `~/.claude/skills/publish-report`(bun, Playwright)를 씁니다. 화면 찍기도 그 스킬에 설치된 Playwright를 씁니다. 다른 컴퓨터에서는 `tools/screenshot.mjs`의 경로를 바꿉니다.

## 검증 범위

실행해서 확인한 것과 하지 않은 것을 나눠 적습니다. 결과 파일은 모두 `verification/`에 있습니다.

| 검사 | 결과 | 근거 |
| --- | --- | --- |
| 13장 인구 왕복(일정표 V2, 11월 청구 V3) | 손으로 계산한 기대값과 같음 | `tum-roundtrip-result.json` (Python `sqlite3`, SQLite 3.53.0, 외래 키 검사 켬) |
| 13장 반례 시험 10건 | 모두 기대대로 거부·받아들임 | 같은 파일 |
| 실습 풀이 수치(P02~P08) | 날짜·요금·환불·정원·저장 규모·합계를 스크립트로 계산해 풀이와 맞춤 | `p02-dates.json` ~ `p08-academy.json` |
| 실습 자료 프로파일·계산(P11~P14) | 풀이 수치의 출처 | `p12-profile.json`, `p11-p13-p14-result.json`, `p12-fee-rule.json`, `p14-stock-reconcile.json` 외 |
| 실습 재설계 DDL(P11~P14) | SQLite 3.53.0에서 실행, 원래 자료를 정제 규칙대로 옮겨 넣음 | `part4-ddl-result.json` |
| P15 종합 문제 | 인구 왕복(구독 27개, 합계 1,947,000원)과 반례 8건이 기대대로 | `p15-result.json` (SQLite 3.53.0) |
| 제4부 본문 예(「틈」 덤프·로그) | 프로파일과 필드 출현 수 | `tum-profile.json`, `tum-events-profile.json` 외 |
| 원고 문체 48개 | 박자 등급 A 44개·B 4개. 어휘 규약 통과 44개, 알려진 오탐만 남음 4개 | `style-report.json` |
| 굽기 가드 | 바깥 요청 0, 넘침 0, 375px 넘침 경고 없음 (index.html 2,187,834바이트) | `build-log.txt` |
| 화면 | 1440px·390px에서 가로 넘침 없음. 제목 수 h1 8·h2 54가 구성과 같음 | `screens.json`, `*.png` |
| 본문 계산 예 9건 | 1장 글자 위치(15~22번째 = `11710001`), 4·12장 어림수, 8·9·13·21·24장 검산이 원고 문장과 같음 | `body-numbers.json`. 2026-11-18 1장·12장 오기를 고치며 더함 |
| 도해판 화면 | 32개 도면 모두 그려짐, 콘솔 오류 0, 1440px·390px 가로 넘침 없음, 바깥 요청 0 | `verification/visual/report.json`, `*.png` |
| 도해판 계산 | 반례 시험 10건 기대대로, 인구 왕복 V3(김하나 월말 0원·월초 21,000원), 덤프 근사 종속 오차 0.1667과 M44 포함 종속이 원고 수치와 같음 | 페이지 안에서 다시 셈. 정본은 위 결과 파일 |
| PostgreSQL DDL(4·12장, P06·P07, 26장 호환 뷰) | **실행 안 함** | 이 환경에 PostgreSQL 없음. 문법은 공식 문서 근거 |
| OpenAPI·AsyncAPI 조각(11장) | YAML로 읽히는지만 확인. 명세 검증기는 안 돌림 | — |
| 계약 시험(Pact 등) | **실행 안 함** | HTTP 서버·브로커 없음 |

## 알려진 한계

- 굽기 가드에 걸리는 글자(상자 선 문자, `⊆ ∪ ⊂ ⋈ ∧ ∨ ∈ ∉`, 한자)는 원고에 쓰지 않습니다. `tools/check_glyphs.py`가 빌드 전에 막습니다.
- 난이도 표시는 별표 대신 `하·중·상`으로 씁니다. 별표가 박자 검사에서 이모지로 걸리기 때문입니다.
- 글자 도식(```text 블록)의 한글은 고정폭 서체에 없어 다른 서체로 그려지므로, 상자 테두리가 몇 픽셀씩 어긋나 보일 수 있습니다.
- 어휘 검사(`scan_lexicon.py`)의 양태부사 분류가 명사 `사실`(fact)을 부사로 셉니다. 이 오탐만 남은 원고는 `style-report.json`에 따로 표시했습니다.
- 몇몇 원전(ANSI/SPARC 1975·1977 보고서 원문, Batini·Ceri·Navathe 1992 책 본문, Chen 1983 본문 등)은 직접 보지 못하고 2차 자료로 확인했습니다. 본문에서 그렇다고 밝혔고, 목록은 리서치 문서의 Open questions에 있습니다.
- 리서치 저장 위치 설정(`~/.config/web-research/config.json`)은 다른 프로젝트에도 영향을 주므로 만들지 않았고, 이번 조사 결과는 이 폴더의 `research/`에 두었습니다.

조사·작성: 2026-11-17.

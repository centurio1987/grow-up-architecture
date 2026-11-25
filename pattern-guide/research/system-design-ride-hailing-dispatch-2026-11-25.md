# 리서치 노트 — 승차 공유 배차 매칭: 움직이는 기사를 빨리 찾고, 한 기사를 두 손님에게 주지 않게

- 조사일: 2026-11-25. 자료 조사는 조사 워커 넷이 했습니다(문제와 규모 · 위치 인덱스 · 이중 배정 막기 · 위치 수집과 장애). 조사 워커의 도구는 본문을 요약해 돌려주는 방식이라, 워커가 옮긴 문장을 그대로 믿지 않고 같은 날 원문 54편을 다시 받아 문자열을 맞췄습니다(10절).
- 쓰임: [시스템 설계 사례 가이드](system-design-guide-plan-2026-11-13.md) 1차 묶음의 아홉째 편(`ride-hailing-dispatch`, 사례 목록 [GE-02](system-design-cases-2026-11-13.md)) 집필 입력입니다. 카드 `KAN-002.3-8DTJ6W` S20 의 산출물입니다.
- 표기: (계산)은 출처 수치로 이 노트가 계산한 값, (가정)은 가이드가 상황을 정하려고 둔 값, (판단)은 출처로 확정되지 않은 이 노트의 추정입니다. 확인하지 못한 것은 「확인 안 함」으로 적었습니다.
- 출처 번호는 `U` 로 시작합니다(앞 노트의 `V` · `C` · `L` · `P` · `T` · `G` · `K` · `N` · `M` · `Q` 와 겹치지 않게). 사례 목록 GE-02 행의 HI uber 는 이 노트의 U1, GM 은 U42, DG 는 U43, C25 는 U9, C26 은 U13 입니다.
- **사례마다 시점이 다릅니다.** Uber 의 Matt Ranney 발표는 2015 년이고 이 노트는 그 발표를 옮긴 2차 기록(U2 · U3)으로만 봤습니다. Ringpop 글은 2016-02-04, Lyft 발표는 2017-06, H3 글은 2018-06-27, Grab Pharos 는 2020-12-22, Uber 풀필먼트 재설계는 2021-07-27 · 2021-09-29, Uber 공항 글은 2025-08-19, Hello Interview 는 2024-07-18(고침 2026-02-15)입니다. API 문서와 라이브러리 문서는 조회일의 현재 판입니다. 2015 년 값을 지금 값처럼 쓰지 않습니다.
- **Hello Interview(U1)는 교육용 분석입니다.** 「초당 200만」은 기사 약 1천만 명이 약 5초마다 보낸다는 전제를 곱한 값이고 회사가 밝힌 값이 아닙니다. Uber 가 밝힌 값은 2015 년 발표의 4초 주기와 초당 100만 쓰기 설계 목표뿐이고, 그것도 2차 기록입니다.
- **회사가 만료 시간이 있는 점유 잠금을 쓴다고 밝힌 1차 글은 찾지 못했습니다.** U1 의 Redis TTL 잠금은 교육용 설계입니다. Uber 는 옛 구조가 일관성보다 가용성을 택해 동시 쓰기로 불일치를 겪었다고 적고(U5), 2021 년 재설계에서 트랜잭션을 주는 데이터베이스로 옮겼습니다(U6). 이 노트의 추천은 이 두 사실과 잠금 문서들(U23 · U25)에서 끌어낸 판단입니다.
- **앞 편(S19)에서 되먹인 것.** AI-01 은 게이트가 5라운드까지 갔습니다. 3라운드 뒤 권고를 한꺼번에 넣자 새 문장에서 넷이 나왔고, 걸린 종류는 정의보다 먼저 쓴 낱말 · 한 자리에만 적은 한계 · 인용 둘레에서 빠진 세기 낱말(「대개」 · 「아마」) · 정점과 상한을 같은 낱말로 쓴 것이었습니다. 그래서 (1) 0절에 「최대」 · 「상한」 · 「받은 뒤」를 한 뜻으로 정했고, (2) 한계는 4-8 에 목록 하나로 적었으며, (3) 인용 둘레의 세기를 10절 「세기」 칸에 원문 한 줄 전체로 적었습니다.
- **조사 워커 주장 정정 다섯.** (1) Hello Interview 게시일을 워커는 「확인 못 함」으로 적었으나 원문 메타데이터에 `datePublished` 2024-07-18, `dateModified` 2026-02-15 가 있습니다. (2) Lyft 발표 날짜를 워커는 「2017-06 추정」으로 적었으나 두 사본의 메타데이터가 `datePublished` 2017-06-05(U13) · 2017-06-19(U14)입니다(슬라이드를 올린 날이고 발표일은 확인 안 함). (3) 워커는 Uber 의 S2 level 12 셀을 3.31 ~ 6.38 km² 라는 한 범위로 옮겼는데, 이것은 2015 년 발표의 2차 기록(U2)이고 지금 S2 문서의 통계는 level 12 최소 3.04 · 최대 6.38 · 평균 5.07 km² 입니다(U22). 하한이 다르므로 둘을 따로 적습니다. InfoQ(U3)는 같은 셀을 「3,31 km2」로 적습니다(표기 그대로). (4) 워커는 Kleppmann 의 효율 목적 문장을 마침표로 끝난 한 문장으로 옮겼으나 원문은 괄호 예시로 이어지는 문장의 앞부분입니다(4-4 에서 그 범위로 인용). (5) 워커는 Uber 풀필먼트 글에서 도시를 포드에 나눴다는 문장을 줄여 옮겼으나 원문은 「Cities were sharded among one of the available pods」입니다.

### 명세 절과 이 노트의 대응

| 명세 절(`system-design-guide` 1.1.2) | 이 노트에서 읽을 곳 |
| --- | --- |
| `requirements` 문제와 요구사항 | 0절 · 1절 · 2절 |
| `estimation` 규모 추정 | 3절 |
| `diagram` 개념도 · `tech.item` 기술 상세 설명 | 4절(4-1 위치 갱신과 오래된 위치 · 4-2 위치 인덱스와 이웃 셀 · 4-3 셀로 나누기와 몰리는 셀 · 4-4 제안과 점유 · 4-5 수락 시간과 다음 후보 · 4-6 요청 중복 막기 · 4-7 일괄 매칭 · 4-8 남는 한계) |
| `detail.scenario` 시나리오 셋 | 5절 |
| `alternatives` 후보 · 결정 · 전환점 | 6절 |
| `example.context` · `example.impl` 구현 코드 | 8절 |
| `fit` 요구 충족 확인 | 2절의 요구 후보 · 8절의 출력에 고정할 값 |
| `example.realworld` 실제 사례 | 7절 |
| `selfcheck` 스스로 점검하기 | 5절의 반례 · 6절의 전환점 |
| `refs` 참고 자료 | 11절(본문이 쓴 출처만 옮김) |

## 0. 낱말 — 한 뜻으로 정해 둘 것

앞 편들에서 같은 낱말을 두 뜻으로 써서 게이트에 걸렸습니다. 이 편에서 헷갈리기 쉬운 낱말은 아래 뜻으로만 씁니다(판단). 가이드는 이 낱말들을 처음 나오는 자리(개념도와 그 대체 텍스트, 문제 절 포함)에서 풀어야 합니다.

| 낱말 | 이 편의 뜻 | 쓰지 않는 뜻(그때 쓸 말) |
| --- | --- | --- |
| 위치 갱신 | 기사 앱이 몇 초마다 보내는 현재 위치 한 건 | 인덱스를 고치는 일(→ 인덱스에 적기) |
| 위치 인덱스 | 셀마다 그 셀에 있는 기사와 마지막 갱신 시각을 담는 메모리 저장소 | 기사의 상태를 정하는 저장소(→ 기사 기록) |
| 기사 기록 | 기사의 상태(대기 · 제안 중 · 운행 중)와 점유를 적는 기준 저장소 | 위치 인덱스 |
| 셀 | 지구 표면을 나눈 칸 하나(지오해시 · S2 · H3 의 칸) | 셀 여럿을 맡은 서버(→ 인덱스 노드) |
| 후보 | 요청 지점 둘레 셀에서 읽은, 정한 시간 안에 갱신된 기사 | 배정된 기사 |
| 제안 | 배차 서비스가 한 기사에게 한 요청을 보내 수락을 묻는 것 | 배정 |
| 점유 | 제안한 동안 그 기사를 다른 요청에 내주지 않는 표시. 만료 시각이 있음 | 배정, 잠금 일반(→ 잠금은 Redis 잠금처럼 출처의 장치를 가리킬 때만) |
| 수락 시간 | 제안부터 기사가 답해야 하는 시간. 점유의 만료와 같은 값 | 매칭에 걸리는 전체 시간 |
| 배정 | 기사가 수락해 그 요청의 기사로 확정된 상태 | 제안 |
| 받은 뒤 | 배차 서비스가 손님 요청을 받은 시각부터 잰 시간 | 기사 앱이 제안을 받은 시각(→ 제안한 뒤) |
| 최대 | 가장 몰리는 때의 값(정점) 또는 측정한 가장 큰 값 | 계산으로 넘을 수 없다고 정한 값(→ 상한) |
| 상한 | 그 이상이 될 수 없다고 계산한 값 | 정점 |
| 어김 | 요구를 지키지 못함 | 제안 실패 · 요청 실패 같은 결과 이름 |

## 1. 이 노트의 결론

이 문제를 어렵게 만드는 것은 둘입니다. 기사 위치는 쉬지 않고 바뀌어 쓰기가 아주 많고(U1 의 전제로 초당 200만), 그 위치로 찾은 기사 한 명을 동시에 들어온 두 요청이 함께 고를 수 있습니다. U1 은 이 둘을 각각 비기능 요구로 둡니다(2절).

이 노트의 추천 구조(판단)는 이렇습니다. **기사 앱은 5초마다 위치를 보냅니다(가정 — U1 · U13). 위치 수집 서비스는 받은 위치를 셀 ID 로 나눠, 그 셀을 맡은 위치 인덱스 노드에 적습니다. 셀을 노드에 나누는 키는 셀 ID 이고 일관 해싱으로 노드를 정합니다(U2 · U13). 위치 인덱스는 셀마다 기사와 마지막 갱신 시각을 정렬 집합으로 두고, 30초보다 오래된 기사는 지웁니다(U13 · U1). 배차 서비스는 요청 지점의 셀과 이웃 셀을 읽어 30초 안에 갱신된 기사를 거리순으로 고르고, 한 번에 한 기사에게만 제안합니다(U1). 제안할 때는 기사 기록에 조건부 쓰기 하나로 점유를 잡습니다. 기사가 대기이거나 앞 점유의 만료 시각이 지났을 때만 제안 중으로 바꾸고 요청 ID 와 만료 시각을 적습니다. 수락은 제안 중이고 요청 ID 가 같고 만료 전일 때만 운행 중으로 바꾸는 조건부 쓰기입니다. 수락 시간은 15초이고(U31), 지나면 다음 후보에게 제안하며, 받은 뒤 1분이 되면 손님에게 실패를 알립니다(U1). 손님 앱은 요청마다 멱등 키를 붙이고, 배차 서비스는 같은 키의 요청을 한 번만 받습니다(U39).**

이 구조를 고른 이유는 셋입니다.

1. **위치 갱신은 기준 저장소에 적지 않습니다.** U1 은 초당 200만 건을 DynamoDB 에 적으면 하루 20만 달러가 넘는다고 계산하고(3절 [10]), 같은 글은 갱신을 메모리 인덱스에 두어 새 위치가 앞 위치를 덮게 합니다. 기사 기록에 적는 것은 제안과 수락뿐이라 쓰기가 요청 수의 몇 배에 그칩니다(3절 [9]).
2. **이중 배정을 막는 기준을 잠금 저장소가 아니라 기사 기록의 조건부 쓰기에 둡니다.** Redis 문서는 단일 인스턴스 잠금이 비동기 복제 때문에 장애 조치 중 상호 배제를 지키지 못한다고 적고, 펜싱 토큰을 쓰라고 권합니다(4-4). Kleppmann 은 정확성을 위한 잠금이면 펜싱 토큰이 필요하다고 적습니다(4-4). 점유를 기사 기록의 조건부 쓰기로 두면 요청 ID 가 펜싱 토큰 구실을 해, 늦게 온 수락이나 만료 뒤의 수락을 기록이 거절합니다(판단).
3. **셀은 몰림과 질의 범위의 맞바꿈입니다.** Lyft 는 지역을 해시 키로 썼다가 몰리는 샤드를 겪었고(U13), Uber 2015 기록은 셀이 작을수록 질의가 읽을 셀이 늘어난다고 적습니다(U2). 가이드는 이 맞바꿈을 수치로 보여야 합니다(3절 [4] · [5]).

**이 구조로도 남는 것**이 있습니다. 목록은 4-8 하나로 적고 가이드의 모든 자리에서 같은 글자로 옮깁니다. 요약하면 위치 인덱스는 메모리라 노드를 잃으면 다음 갱신까지 그 셀의 기사가 후보에서 빠지고, GPS 오차가 도심에서 50 m 이상이라 거리순이 실제 도착 순서와 다를 수 있으며, 기사 기록 저장소가 멈추면 제안과 수락이 모두 멈춥니다(이때도 이중 배정은 없음, 판단). 한 번에 한 기사씩 제안하는 방식은 도시 전체의 대기 시간을 최소로 만들지 않습니다(4-7).

## 2. 요구사항 절에 쓸 근거 — 「잦은 위치 갱신」 · 「1분」 · 「이중 배정 금지」를 숫자로

| 요구 | 근거 문장 | 성격과 세기 |
| --- | --- | --- |
| 위치 갱신 규모 | 「Given we have around 10 million drivers, sending locations roughly every 5 seconds, that's about 2 million updates a second!」(U1) | 교육용 전제. around · roughly · about. 평균인지 정점인지 글에 구분 없음 |
| 위치 갱신 규모(회사) | 「Design goal is to handle a million writes per second.」 · 「The write rate is derived from drivers that send update every 4 seconds as they move around.」(U2) | 2015 년 발표의 설계 목표, 2차 기록. 측정값 아님 |
| 갱신 주기(회사) | 「the driver's phones post location updates to the server every four seconds」(U3) | Uber 2015, 2차 기록. Lyft 는 슬라이드에 `PUT /v1/locations` 와 「5 sec loop」(U13) |
| 매칭 시간 | 「The system should prioritize low latency matching (< 1 minutes to match or failure)」(U1) | 교육용 요구. 원문 문법 그대로(「minutes」) |
| 이중 배정 금지 | 「The system should ensure strong consistency in ride matching to prevent any driver from being assigned multiple rides simultaneously」(U1) | 교육용 요구 |
| 한 번에 하나 | 「This means that we only request one driver at a time for a given ride request AND that each driver only receives one ride request at a time.」(U1) | 교육용 설계(앞 요구에서 끌어낸 것) |
| 수락 시간(회사) | 「Tap the flashing blue button quickly, within 15 seconds, to accept the trip.」(U31) | Uber 기사용 도움말. 무응답 때의 처리는 이 페이지에 없음 |
| 수락 시간(회사, 배달) | 「The Uber app typically gives you 15 seconds to accept it」 · 「If you don’t respond within this time frame, the request will go to another delivery partner」(U32) | 배달 요청. typically |
| 수락 시간(교육용) | 「That driver would then have 10 seconds to accept or deny the request before we move on to the next driver if necessary.」(U1) | 교육용 값 10초. U31 의 15초와 다름 — 둘 다 적음 |
| 몰림 | 「The system should be able to handle high throughput, especially during peak hours or special events (100k requests from same location)」(U1) | 교육용. 100k 가 초당인지 총량인지 단위 없음 |
| 오래된 위치 | 「removes drivers whose last update timestamp exceeds a threshold (e.g., 30 seconds)」(U1) | 예시(e.g.). Lyft 코드도 `now_seconds() - 30` 보다 오래된 항목을 지움(U13) |
| GPS 오차 | 「GPS-enabled smartphones are typically accurate to within a 4.9 m (16 ft.) radius under open sky」(U37) · 「can be wildly inaccurate (with a margin of error of 50 meters or more)」(U38) | 조건이 다른 두 값(탁 트인 하늘 · 도심). 합치지 않음 |

요구 후보(가정, 가이드가 정할 값):

1. 기사 위치 갱신은 최대 초당 200만 건을 받는다(U1 의 전제를 빌림).
2. 받은 위치 갱신은 1초 안에 검색에 보인다(가정).
3. 배차 요청은 최대 초당 1만 건(가정 — 1차 자료에 요청 수가 없음, 3절 [9]).
4. 요청은 받은 뒤 1분 안에 배정되거나, 배정되지 못한 사실이 손님에게 간다(U1).
5. 한 기사는 동시에 두 요청에 배정되지 않는다. 허용 0(U1).
6. 한 기사에게는 한 번에 한 요청만 제안한다(U1).
7. 기사는 제안한 뒤 15초 안에 답한다. 답이 없으면 점유가 풀려 다른 요청에 제안될 수 있다(U31 · 판단).
8. 점유가 풀린 뒤에 온 수락은 배정을 만들지 않는다. 허용 0(판단).
9. 30초 넘게 위치를 보내지 않은 기사는 후보가 되지 않는다(U1 의 예시 값 · U13).
10. 같은 요청이 두 번 와도 배정은 하나다. 허용 0(가정 — 4-6).
11. 한 장소에 요청이 몰려도 다른 장소의 요청은 4행 그대로(가정).

## 3. 규모 추정 절에 쓸 계산

```text
입력
  기사 수                      10,000,000       U1 의 전제(around)
  위치 갱신 주기               5 초             U1(roughly) · U13 「5 sec loop」. Uber 2015 은 4 초(U2 · U3)
  위치 갱신 한 건 크기         100 B            U1 의 비용 계산에 쓴 예시 크기
  기사 하나의 인덱스 크기      200 B            가정(셀 멤버 + 기사 위치 문자열)
  오래된 기준                  30 초            U1 의 예시 · U13
  수락 시간                    15 초            U31(Uber 기사용 도움말). U1 은 10 초
  매칭 한도                    60 초            U1 「< 1 minutes」
  배차 요청                    최대 초당 10,000  가정

[1] 위치 갱신          10,000,000 ÷ 5 = 초당 2,000,000 건(계산 — U1 의 문장과 같은 값)
                       Uber 2015 의 4 초면 초당 2,500,000 건(계산). Uber 의 설계 목표는 초당 1,000,000 쓰기(U2)
[2] 들어오는 양        2,000,000 × 100 B = 초당 200 MB(계산)
[3] 인덱스 크기        10,000,000 × 200 B = 2 GB(계산) — 메모리 한 대에도 들어가는 크기이고, 나누는 이유는 크기가 아니라 [1] 의 쓰기
[4] 셀 크기            H3 해상도 7 평균 5.161293360 km², 해상도 8 평균 0.737327598 km²(U10)
                       S2 level 12 평균 5.07 km²(최소 3.04 · 최대 6.38, U22). 지오해시 5 자리 ±2.4 km, 6 자리 ±0.61 km(U20)
[5] 검색이 읽는 셀     지오해시 · Redis GEO 는 자기 칸과 이웃 8 칸, 9 칸(U15 「1+8 areas」)
                       H3 는 k 칸 안의 셀 3k(k+1) + 1 개 — k = 1 이면 7, k = 2 이면 19(계산)
[6] 한 노드의 쓰기     노드 N 대에 셀이 고르게 나뉘면 2,000,000 ÷ N. N = 50 이면 초당 40,000(계산)
                       한 셀에 몰리면 그 셀을 맡은 노드 하나가 그만큼을 받음(4-3)
[7] 제안 횟수 상한     60 ÷ 15 = 4 번(계산). U1 의 10 초면 6 번
[8] 놓친 갱신          30 ÷ 5 = 6 번 연달아 놓치면 후보에서 빠짐(계산)
[9] 기사 기록 쓰기     제안 최대 4 번 × 초당 10,000 + 수락 10,000 = 상한 초당 50,000(계산)
                       위치 갱신 [1] 의 40 분의 1. 위치 갱신은 기사 기록에 적지 않음
[10] DB 에 바로 적을 때 2,000,000 × 86,400 = 하루 172,800,000,000 번 × 1 WRU($1.25 / 1,000,000 WRU) = 하루 216,000 달러(계산)
                       U1 「would cost you over $200k a day」와 같은 꼴. 단가가 지금도 같은지는 확인 안 함
```

- [1] 의 200만은 U1 의 전제를 곱한 교육용 값입니다. 가이드는 「Uber 의 값」이라고 쓰지 않습니다. 평균인지 정점인지 U1 에 구분이 없으므로, 가이드가 정점으로 쓰려면 가정이라고 밝힙니다.
- [4] 의 셀 넓이는 모두 평균입니다. H3 문서는 「The area of an H3 cell varies based on its position relative to the icosahedron vertices.」라고 적고(U10), S2 통계도 최소와 최대가 두 배 넘게 다릅니다(U22).
- [6] 의 N = 50 은 Lyft 가 2017 년에 클러스터 50 개(인스턴스 750 개)를 썼다는 슬라이드 값을 빌린 예입니다(U13 「2017: 50 clusters with a total of 750 instances」). 노드 하나의 처리량은 확인 안 함입니다.
- [9] 의 요청 수는 가정입니다. Uber 는 「billions of trips per year」라고만 적습니다(U5).

## 4. 개념도와 기술 설명 절에 쓸 근거

### 4-1. 위치 갱신과 오래된 위치 — 쓰기는 덮어쓰고, 오래된 것은 시각으로 지우기

- U1 은 메모리 인덱스의 장점으로 덮어쓰기를 적습니다: 「Since each GEOADD command overwrites the previous location for a given driver, we always have the most recent position.」 오래된 기사는 주기적인 정리로 지우는 예를 적습니다(2절).
- Lyft(U13)는 두 세대를 거쳤습니다. 1세대는 지역마다 해시를 30초 구간으로 나누고 키에 만료를 걸었으며, 문제로 「Bulk expiration blocks Redis for longer than expected」를 적습니다. 2세대는 위치마다 5 자리 지오해시를 계산해(`compute_geohash(loc['lat'], loc['lng'], level=5)`) 그 지오해시 키의 정렬 집합에 기사를 넣고 점수를 시각으로 둔 뒤, `pipeline.zremrangebyscore(geohash, -inf, now_seconds() - 30) # expire!` 로 30초보다 오래된 항목을 지웁니다. 15초(1세대 키 만료)와 30초(2세대)는 같은 발표 안의 다른 설계 값입니다.
- Redis 의 만료는 키 단위입니다: 「After the timeout has expired, the key will automatically be deleted.」(U18). 정렬 집합의 멤버마다 만료를 거는 문장은 문서에서 찾지 못했습니다(확인 안 함). 그래서 시각을 점수로 두고 구간 삭제를 씁니다. 비용은 「O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements removed by the operation.」(U17).
- Grab Pharos(U34)는 지우지 않고 읽을 때 거릅니다: 「During the nearby search, drivers with an expired timestamp are filtered.」 · 「Pharos does not delete drivers actively.」 지우는 일은 밤마다 다시 만드는 방식이라고 적습니다.
- GPS 오차는 위치 갱신 자체의 한계입니다(2절). Uber 는 도심의 반사 신호 때문에 「can lead to errors in position estimates that can be 50 meters or more in urban canyons」라고 적습니다(U38).

### 4-2. 위치 인덱스와 이웃 셀 — 경계에 있는 기사를 놓치지 않게

- **Redis GEO.** 「Data is stored into the key as a sorted set, in a way that makes it possible to query the items with the GEOSEARCH command.」 · 「Latitude and Longitude bits are interleaved to form a unique 52-bit integer.」 · 「there is no GEODEL command because you can use ZREM to remove elements. The Geo index structure is just a sorted set.」(U15). 넣기는 「O(log(N)) for each item added, where N is the number of elements in the sorted set.」(U15).
- 이웃 셀을 함께 보는 이유: Redis 는 「This format allows for bounding box and radius querying by checking the 1+8 areas needed to cover the whole shape and discarding elements outside it.」라고 적습니다(U15). 지오해시 문서는 「Two close locations on either side of the Equator (or Greenwich meridian) will not have a long common prefix」라고 적습니다(U20). 가까운 두 점이 다른 셀에 들어갈 수 있으므로, 요청 지점의 셀만 읽으면 경계 너머의 가까운 기사를 놓칩니다(판단).
- Redis GEO 의 거리 오차: 「in the worst case, the error may be up to 0.5%, so you may want to consider other systems for error-critical applications.」(U15). 바로 앞 문장이 지구를 구로 보는 Haversine 계산을 오차의 원인으로 적습니다 — 셀 경계의 오차가 아닙니다.
- **Lyft 가 Redis GEO 를 쓰지 않은 이유**(U13, 슬라이드 항목): 「Uses geohashing and a sorted set under-the-hood」 · 「No expiration or sharding」 · 「No metadata storage」 · 「Great for prototyping」.
- **S2.** 「The S2 curve is based on the Hilbert curve.」 · 「Cells levels range from 0 to 30.」 · 「Each cell is uniquely identified by a 64-bit S2CellId.」(U21). Uber 2015 기록: 「Uber uses a level 12 cell, which are 3.31 km(2) to 6.38 km(2), depending on where on earth you are.」(U2) — 지금 S2 통계의 level 12 하한은 3.04 km² 입니다(U22).
- **H3.** 「H3 supports sixteen resolutions.」 · 「Each finer resolution has cells with one seventh the area of the coarser resolution.」 · 「The kRing function provides grid cells within grid distance k of an origin index.」(U9). 육각형을 고른 이유는 「Hexagons were an important choice because people in a city are often in motion」입니다(U9). 다만 **U9 는 H3 를 분석과 최적화의 격자로 소개하고**(「We use H3 as the grid system for analysis and optimization throughout our marketplaces.」), 기사를 실시간으로 찾는 인덱스라고 적지 않습니다. 가이드에 Uber 가 H3 로 기사를 찾는다고 쓰지 않습니다.
- 오각형: 「Elements of the output array may be left as zero, which can happen when crossing a pentagon.」(U11). 해상도마다 오각형이 12 개 있습니다(U12).
- 가이드의 모형은 평면의 정사각 격자로 충분합니다(판단). 지오해시와 같은 원리이고, 세 언어에서 같은 정수 계산으로 셀 ID 를 만들 수 있습니다(8절).

### 4-3. 셀로 나누기와 몰리는 셀 — 셀 ID 를 키로, 노드는 일관 해싱으로

- Uber 2015: 「Since each cell has an ID the ID is used as a sharding key.」(U2). 같은 기록의 한계: 「A limitation is the cell size is fixed at the level 12 size.」 · 「There’s a tradeoff as the smaller the cell size the greater the fanout for queries.」(U2).
- Ringpop: 「The hash ring algorithm lets you assign objects to intervals rather than to specific workers.」 · 「Ringpop will forward the request to the appropriate destination within the ring.」(U7). README 는 「(This project is no longer under active development.)」(U8) — 가이드는 당시의 방식으로 씁니다. Uber 2015 기록은 「In CAP terminology ringpop is an AP system, trading consistency for availability.」라고 적습니다(U2).
- Lyft: 「Ketama provides consistent hashing!」와 노드를 잃으면 그 몫만 잃는다는 항목, 그리고 「Region is a poor hash key (hot shards)」 · 「Balancing scattered gets and hot shards with geohash level」(U13). 지역처럼 큰 키는 몰리고, 지오해시를 작게 하면 한 질의가 여러 키를 읽어야 합니다.
- Grab Pharos 는 셀이 아니라 도시와 차종으로 나눕니다: 「the graph is partitioned by cities and verticals」 · 「each model has two replicas and they are stored on different instances and different availability zones.」(U34). 지연은 「P99 latency time of 10ms for driver update and 50ms for driver nearby」입니다(U34, P99 — 평균 아님).
- 요청이 한꺼번에 몰릴 때 U1 은 요청을 대기열에 넣고 짝을 찾은 뒤에 오프셋을 커밋하는 방식을 적습니다: 「We could use a distributed message queue system like Kafka, which allows us to commit the offset of the message in the queue only after we have successfully found a match.」 같은 글은 지역으로 대기열을 나눌 수 있다고도 적습니다(「We can also partition the queues based on geographic regions to further improve efficiency.」).
- 몰리는 장소의 사례: 공항(U36 「In over-availability scenarios at airports, drivers entering airport FIFO queues often waited a long time before receiving a trip offer」 — 기사가 몰린 쪽). 행사 · 비 오는 퇴근길처럼 요청이 몰린 셀을 어떻게 나누는지 적은 1차 자료는 찾지 못했습니다(확인 안 함).

### 4-4. 제안과 점유 — 이중 배정을 무엇으로 막는가

- **U1 의 세 풀이(교육용).** 나쁜 풀이(서비스 안의 잠금과 타임아웃)는 「there's no centralized coordination, leading to potential race conditions」. 괜찮은 풀이(데이터베이스 상태 + 서비스 메모리의 타임아웃)는 「If the Ride Service crashes or is restarted, the timeout will be lost and the lock will remain indefinitely.」 좋은 풀이(Redis TTL 잠금)는 「a lock is created with a unique identifier (e.g., driverId) and a TTL set to the acceptance window duration of 10 seconds」 · 「If the driver does not accept the ride within the TTL window, the lock in Redis expires automatically.」이고, 남는 문제로 「The main challenge with this approach is the system's reliance on the availability and performance of the in-memory data store for locking.」를 적습니다. U1 이 펜싱이나 시계 문제를 다룬 문장은 찾지 못했습니다(확인 안 함).
- **Redis 잠금 문서(U23).** 명령은 `SET resource_name my_random_value NX PX 30000` 이고 「This value must be unique across all clients and all lock requests.」 해제는 값을 맞춰 봐야 합니다: 「Using just `DEL` is not safe as a client may remove another client's lock.」 단일 인스턴스 방식은 「this is actually a viable solution in applications where a race condition from time to time is acceptable」. 복제본으로 넘기면 「By doing so we can’t implement our safety property of mutual exclusion, because Redis replication is asynchronous.」 같은 문서의 일관성 절: 「You should implement fencing tokens. This is especially important for processes that can take significant time and applies to any distributed locking system.」 · 「Redis is not using monotonic clock for TTL expiration mechanism. That means that a wall-clock shift may result in a lock being acquired by more than one process.」 SET 문서도 단순 잠금 패턴을 「The following pattern is discouraged in favor of the Redlock algorithm which is only a bit more complex to implement, but offers better guarantees and is fault tolerant.」로 적습니다(U24).
- **Kleppmann(U25).** 잠금의 두 목적을 가릅니다. 효율은 「Taking a lock saves you from unnecessarily doing the same work twice」(괄호 예시로 이어지는 문장의 앞부분), 정확성은 「Taking a lock prevents concurrent processes from stepping on each others’ toes and messing up the state of your system.」 펜싱: 「you need to include a fencing token with every write request to the storage service」 · 「a fencing token is simply a number that increases」. 결론: 「if you need locks for correctness, please don’t use Redlock.」
- **antirez(U26).** 고유한 무작위 토큰으로 확인 후 쓰기(check and set)를 할 수 있다고 반론합니다: 「What do you do with a unique token? For example you can implement Check and Set.」 단조 시계는 인정합니다: 「I think Martin is right that Redis and Redlock implementations should switch to the monotonic time API」 두 글의 쟁점(멈춤 · 펜싱)은 이 노트가 판정하지 않습니다.
- **조건부 쓰기.** DynamoDB: 「To perform a conditional update, you use an `UpdateItem` operation with a condition expression. The condition expression must evaluate to true in order for the operation to succeed; otherwise, the operation fails.」(U27). DynamoDB 의 TTL 삭제는 만료를 맞추는 데 쓸 수 없습니다: 「DynamoDB automatically deletes expired items within a few days of their expiration time, without consuming write throughput.」(U28) — 만료 시각은 속성으로 적고 조건에서 비교해야 합니다(판단). PostgreSQL Read Committed: 「The search condition of the command (the `WHERE` clause) is re-evaluated to see if the updated version of the row still matches the search condition.」(U29). `SKIP LOCKED` 는 「Skipping locked rows provides an inconsistent view of the data, so this is not suitable for general purpose work, but can be used to avoid lock contention with multiple consumers accessing a queue-like table.」(U30).
- **Uber 의 사례.** 「The previous architecture prioritized availability over consistency.」 · 동시 쓰기의 예 「For example, a driver trying to go offline and a matching system trying to link a new trip offer to the driver」 · 「inconsistencies could occur due to concurrent writes, which could end up overwriting each other」(U5). 새 구조의 데이터베이스는 「Cloud Spanner supports multi-row, multi-table transactions, with external consistency.」 · 「These transactions rely on pessimistic locking or 2-phase commits, if necessary.」(U6). 두 글 모두 같은 기사를 두 요청에 주지 않는 방법을 직접 설명하지는 않습니다.
- **이 노트의 판단.** 점유를 기사 기록의 조건부 쓰기로 둡니다. 제안은 상태가 대기이거나, 제안 중이지만 만료 시각이 지났을 때만 제안 중으로 바꾸고 요청 ID · 만료 시각을 적음. 수락은 제안 중이고 요청 ID 가 같고 만료 시각 전일 때만 운행 중으로 바꿈. 요청 ID 가 펜싱 토큰 구실을 하므로(U25 의 증가하는 번호 대신 U26 의 고유 값으로 확인 후 쓰기), 만료 뒤에 같은 기사가 다른 요청에 제안된 다음 늦게 온 앞 수락은 0행을 바꾸고 끝납니다. Redis 잠금을 앞에 두는 것은 효율용(같은 기사에게 두 제안을 보내는 일을 줄임)으로만 둘 수 있고, 정확성은 조건부 쓰기가 맡습니다.

### 4-5. 수락 시간과 다음 후보 — 15초씩, 1분 안에

- 수락 시간은 U31 의 15초를 씁니다. U1 의 10초는 교육용 값입니다. 15초면 1분 안에 제안은 최대 4번입니다(3절 [7]).
- 거절은 다른 기사에게 넘어갑니다: 「This will pass the request to another driver-partner」(U31). 무응답일 때의 처리는 배달 도움말에만 있습니다(U32, 2절).
- U1 은 무응답을 따로 묻습니다: 「Ideally we'd want the system to move on to the next driver if the current driver doesn't respond in a timely manner.」 그리고 사람이 끼는 여러 단계의 처리로 보고 durable execution 을 가리킵니다: 「In fact, Uber is the original author of the open source project Cadence which gave birth to the leading durable execution framework Temporal, built specifically for use-cases like this one.」 그 뒤 풀이는 공개 부분에 없습니다(확인 안 함). 가이드의 모형은 배차 서비스가 가상 시계로 만료를 확인하는 방식이면 충분합니다(판단).

### 4-6. 요청 중복 막기 — 멱등 키

- Stripe 문서: 「The API supports idempotency for safely retrying requests without accidentally performing the same operation twice.」 · 「A client generates an idempotency key, which is a unique key that the server uses to recognize subsequent retries of the same request.」 · 「you can remove keys from the system automatically after they’re at least 24 hours old.」(U39).
- 다시 보내는 이유: 「The call could succeed, but the connection break before the server can tell its client about it.」(U40).
- Uber 2015 기록의 원칙: 「At Uber, everything has to be retryable, thus, idempotent and killable, including databases.」(U3). 승차 공유 회사가 배차 요청에 멱등 키를 쓴다고 밝힌 1차 글은 찾지 못했습니다(확인 안 함). 가이드는 결제 API 의 일반 근거로 쓰고 회사의 구조로 쓰지 않습니다.

### 4-7. 일괄 매칭 — 몇 초 모아 한꺼번에 짝짓기

- Uber: 「To help keep rides reliable, we evaluate nearby drivers and riders in one batch.」 · 「But if we wait just a few seconds after a request, it can make a big difference.」 · 「It’s enough time for a batch of potential rider-driver matches to accumulate.」(U33, 초 수 없음).
- Grab: 「Finding the optimal assignment is known as solving the minimum weight bipartite matching problem (also known as the assignment problem).」 · 「This problem is often solved using a technique called the Kuhn-Munkres (KM) algorithm」(U35). 이 글은 연구 실험이고 운영 창의 초 수는 없습니다.
- 가이드의 고른 구조는 요청이 오는 대로 가장 가까운 기사에게 제안합니다. 일괄 매칭은 전환점으로 둡니다(6절).

### 4-8. 남는 한계 — 구조의 가정으로 적을 것

가이드는 아래 목록을 한 자리에서 정하고 기술 상세 · 결정 · 요구 충족 표 · 스스로 점검하기에서 같은 글자로 씁니다(판단).

1. 위치 인덱스 노드를 잃으면 그 노드가 맡은 셀의 기사는 다음 위치 갱신(5초)이 다른 노드에 적힐 때까지 후보에서 빠집니다(판단). 2 · 4행 쪽 지연입니다.
2. GPS 오차가 도심에서 50 m 이상이라(U38) 거리순과 실제 도착 순서가 다를 수 있습니다. 반경 검색의 경계 근처 기사를 넣거나 빼는 판단이 바뀔 수 있습니다.
3. 기사 기록 저장소가 멈추면 제안과 수락이 모두 멈춥니다. 이중 배정은 생기지 않지만 4행(1분)을 어깁니다(판단).
4. 기사 기록 저장소를 잃으면(복제본에 아직 가지 않은 쓰기) 점유나 배정이 사라질 수 있어 5 · 8행을 어길 수 있습니다(판단 — 저장소의 지속성 설정에 따름).
5. 한 셀에 요청이나 기사가 몰리면 그 셀을 맡은 노드 하나가 몰림을 받습니다(U13 「hot shards」).
6. 한 번에 한 기사씩 제안하면 도시 전체의 대기 시간이 최소가 되지 않습니다(U33 · U35).
7. 기사 앱 시계와 서버 시계가 다르면 갱신 시각이 어긋납니다. 이 구조는 서버가 받은 시각을 씁니다(판단 — Lyft 1세대가 앞뒤 구간을 함께 읽어 시계 차이를 다뤘다는 워커 보고, 원문 확인 안 함).

## 5. 시나리오 절에 쓸 반례와 장애

1. **요청 하나(부하 · 장애 없음).** 손님 요청 → 셀과 이웃 셀에서 30초 안에 갱신된 후보 → 가장 가까운 기사에게 제안(조건부 쓰기 성공) → 수락(조건부 쓰기 성공) → 배정. 받은 뒤 걸린 시간을 출력에 찍습니다.
2. **두 요청이 같은 기사를 고름.** 같은 순간 두 요청의 가장 가까운 후보가 같은 기사입니다. 제안의 조건부 쓰기는 하나만 성공하고 다른 요청은 다음 후보로 갑니다. 변형: 점유를 Redis 잠금 하나로만 두고 장애 조치 때 잠금을 잃게 하면 두 제안이 같은 기사에게 가고, 수락의 조건부 쓰기 없이 기록하면 배정이 둘이 됩니다(U23 의 비동기 복제 문장을 모형으로).
3. **기사가 답하지 않음.** 15초가 지나 점유가 만료되고 다음 후보에게 제안합니다. 만료 뒤에 앞 기사의 수락이 오면 요청 ID 가 맞지 않거나 만료 시각이 지나 0행 — 배정은 만들어지지 않습니다.
4. **기사 앱이 끊김.** 위치가 30초 넘게 오지 않은 기사는 후보에서 빠집니다(6번 놓친 갱신, 3절 [8]).
5. **한 셀에 요청이 몰림.** 후보가 모자라 일부 요청은 1분 안에 배정되지 못하고 실패가 알려집니다. 큰 셀 하나로 나누면 그 셀을 맡은 노드가 몰림을 받습니다.
6. **같은 요청이 두 번 옴.** 손님 앱이 응답을 잃고 다시 보내도 같은 멱등 키라 처음 결과를 돌려줍니다.
7. **인덱스 노드 하나가 멈춤.** 그 노드의 셀은 다른 노드로 넘어가고, 다음 갱신이 올 때까지 후보가 비어 있습니다.

## 6. 대안 비교 절에 쓸 후보 구조

위치를 어디에 둘지:

| 후보 | 근거 | 이 문제에서 |
| --- | --- | --- |
| A. 위치 갱신마다 데이터베이스에 바로 적고 공간 질의 | U1 의 나쁜 풀이 · 3절 [10] | 초당 200만 쓰기 · 하루 20만 달러 넘는 비용(U1 의 계산) |
| B. 몇 초 모아 공간 데이터베이스에 적기(PostGIS 등) | U1 「updates are aggregated over a short interval and then batch-processed」 | 모으는 동안의 위치가 늦음 — U1 「the location data in the database may not reflect the drivers' most current positions」 |
| C. Redis GEO 키 하나 | U15 · U13 「No expiration or sharding」 | 만료 · 나누기를 따로 만들어야 함 |
| D. 셀 키마다 정렬 집합(점수 = 시각) + 셀 ID 로 노드 나누기(추천) | U13 2세대 · U2 · U17 | 만료는 구간 삭제, 나누기는 셀 ID |

점유를 어디에 둘지:

| 후보 | 근거 | 이 문제에서 |
| --- | --- | --- |
| 1. 배차 서비스 안의 잠금 | U1 나쁜 풀이 | 인스턴스가 여럿이면 경합 |
| 2. 데이터베이스 상태 + 서비스 메모리의 타임아웃 | U1 괜찮은 풀이 | 서비스가 다시 뜨면 타임아웃을 잃어 기사가 계속 제안 중 |
| 3. Redis TTL 잠금만 | U1 좋은 풀이 · U23 · U25 | 장애 조치 · 시계 변화 · 멈춤 때 두 요청이 같은 기사를 잡을 수 있음 |
| 4. 기사 기록의 조건부 쓰기 + 만료 시각(추천) | U27 · U29 · U25 · U26 | 요청 ID 로 늦은 수락을 거절. 기사 기록 쓰기는 상한 초당 5만(3절 [9]) |

어떻게 짝지을지:

| 후보 | 근거 | 이 문제에서 |
| --- | --- | --- |
| 가. 오는 대로 가장 가까운 기사에게 하나씩(추천) | U1 · U2 「Sort by ETA then send it back to supply to offer it to a driver.」 | 단순하고 모형으로 재기 쉬움. 전체 대기 시간은 최소가 아님 |
| 나. 몇 초 모아 일괄 매칭 | U33 · U35 | 몇 초를 더 기다리는 대신 전체 대기 시간을 줄임 |

전환점(판단):

1. 기사 기록 쓰기가 저장소 한계에 가까워지면(요청이 [9] 의 가정보다 몇 배 늘면) Redis 점유를 앞에 두어 같은 기사에게 두 제안이 가는 일을 줄이고, 정확성은 그대로 조건부 쓰기에 둡니다.
2. 요청이 한 장소에 몰리는 일이 잦아지면 그 장소만 작은 셀로 나누거나(U2 의 고정 셀 한계), 셀 대신 도시 · 차종으로 나눕니다(U34).
3. 도시 전체의 대기 시간이 요구가 되면 일괄 매칭으로 옮깁니다(U33 · U35).
4. 도로 위 거리(실제 도착 시간)가 직선거리와 크게 다르면 도로망 기반 근접 검색으로 옮깁니다(U34 — Pharos 는 도로망에서 찾음).

## 7. 실제 사례 절에 쓸 대응표

| 사례 | 시점 | 이 편의 무엇과 같은가 | 다른 점 |
| --- | --- | --- | --- |
| Uber 2015(DISCO · S2 · Ringpop) | 2015, 2차 기록(U2 · U3) | 셀 ID 를 샤딩 키로, 4초 갱신, 일관 해싱 | level 12 고정 셀. Ringpop 은 AP. 지금 구조는 확인 안 함 |
| Uber 풀필먼트 재설계 | 2021(U5 · U6) | 동시 쓰기를 트랜잭션으로 막음 | Spanner 트랜잭션. 위치 인덱스 이야기는 아님 |
| Lyft 위치 인덱스 | 2017(U13) | 지오해시 키의 정렬 집합, 점수 = 시각, 30초 삭제, ketama | 「15 Million QPS」는 제목에만 있고 무엇의 합인지 확인 안 함 |
| Grab Pharos | 2020(U34) | 오래된 기사는 시각으로 거름 | 셀이 아니라 도로망 · 도시와 차종으로 나눔 |
| Uber 일괄 매칭 | 날짜 없음(U33) | 전환점 3 | 몇 초 모아 짝지음, 초 수 없음 |
| Uber 기사용 도움말 | 날짜 없음(U31) | 수락 시간 15초 | 무응답 처리는 페이지에 없음 |

## 8. 구현 코드 절에 쓸 메모

- 모형은 평면 격자입니다. 도시를 정사각 셀(예: 한 변 1,000 m)로 나누고, 셀 ID 는 정수 좌표에서 만듭니다(판단). 세 언어가 같은 정수 계산을 쓰도록 실수 거리 대신 제곱 거리의 정수 비교를 씁니다.
- 시계는 가상 시계(사건을 시각과 등록 순서로 처리)로 둡니다. 앞 편들과 같습니다.
- 위치 인덱스: 셀 ID → (기사 ID → 마지막 갱신 시각) 사전. 30초보다 오래된 항목은 읽을 때 거르고, 정해 둔 주기마다 지웁니다.
- 기사 기록: 기사마다 상태 · 요청 ID · 만료 시각. 제안과 수락은 조건을 확인하고 바꾸는 함수 하나씩이고, 바꾼 행 수(0 또는 1)를 돌려줍니다 — 조건부 쓰기의 흉내입니다. 모형은 데이터베이스를 쓰지 않으므로 「이 모형에서는」을 붙여 씁니다.
- 출력에 고정할 값(판단): 요청마다 받은 뒤 배정까지 걸린 시간, 제안 횟수, 거절된 수락 수(0행), 이중 배정 수(고른 구조에서 0), 몰린 셀의 노드가 받은 쓰기 수. 변형 실행으로 Redis 잠금만 쓸 때의 이중 배정, 수락 시간 10초 · 15초, 셀 크기 차이를 보입니다.
- 난수는 정해진 씨앗의 선형 합동 생성기로 만듭니다(명세 SD26).

## 9. 미해결 질문

1. 지금 Uber · Lyft · Grab 의 위치 갱신 주기와 초당 갱신 수: 1차 자료 없음(확인 안 함). 2015 년 4초 · 2017 년 5초가 마지막 공개 값입니다.
2. Lyft 슬라이드 제목의 「15 Million QPS」가 무엇의 합인지: 확인 안 함.
3. 회사가 배차 요청에 멱등 키를 쓴다고 밝힌 1차 글: 찾지 못함.
4. 회사가 점유를 무엇으로 구현하는지(잠금 저장소 · 트랜잭션): 찾지 못함. Uber 는 2021 년 재설계에서 Spanner 트랜잭션을 쓴다고만 밝힘.
5. 한 장소에 요청이 몰릴 때 셀을 어떻게 나누는지: 1차 자료 없음.
6. 기사가 수락 시간 안에 답하지 않았을 때 Uber 승차 쪽의 처리: 도움말 페이지에 없음(배달 쪽만 있음).
7. U1 의 무응답 처리(durable execution)의 자세한 풀이: 공개 부분에 없음(확인 안 함). 잠금 TTL 10초는 원문에 있음(4-4).
8. Uber 2015 의 「초당 100만 쓰기」가 측정값인지 목표인지: 기록은 「Design goal」이라 적음 — 측정값은 확인 안 함.
9. 이동 객체 전용 색인(TPR-tree · Bx-tree 등) 논문: 본문을 열지 못해 쓰지 않음.

## 10. 원문 대조

대조 날짜는 모두 2026-11-25 입니다. 「글자 그대로」는 원문 페이지를 다시 받아 태그를 벗긴 텍스트(Redis 문서는 저장소의 마크다운 원본, 슬라이드는 SlideShare 페이지의 글자 추출)에서 문자열을 찾은 것이고, 따옴표 모양 · 공백 · 백틱 · 밑줄 · 줄표 · 마크다운 링크 표기만 맞췄습니다. 슬라이드 글자 추출은 낱말 사이 공백이 빠진 곳이 있어(「apoor」) 공백을 뺀 꼴로도 찾았습니다. 조사 워커가 옮긴 인용 204개를 먼저 대조해 192개가 글자 그대로, 3개가 공백만 다르게 맞았습니다. 맞지 않은 9개는 문장 중간에서 끊었거나 마침표를 덧붙였거나 낱말을 줄인 것이고(4-4 의 Kleppmann · 머리말의 Uber 풀필먼트 등), 노트에는 원문 범위로 다시 옮기거나 쓰지 않았습니다. 노트를 쓴 뒤 노트 안의 「…」 가운데 12자 이상인 인용을 모두 다시 뽑아 원문 54편 전체에서 찾았습니다. 115개 가운데 114개가 글자 그대로 맞았고, 1개(U13 의 「Region is a poor hash key (hot shards)」)는 슬라이드 글자 추출에서 빠진 공백만 다르게 맞았습니다.

| 출처 | 대조 방법 | 본문에 쓸 수 있는 것 | 세기 · 같은 글 안의 다른 값 · 대상 · 「없음」을 확인한 낱말 |
| --- | --- | --- | --- |
| U1 Hello Interview | 글자 그대로 | 기능 · 비기능 요구, 200만(전제의 곱), 1분, 이중 배정 금지, 한 번에 하나, 10초, 100k, 30초(예), 세 풀이, DynamoDB 비용, 덮어쓰기 | around · roughly · about · e.g. 교육용. 게시일 `datePublished` 2024-07-18 · `dateModified` 2026-02-15(정정). `quadtree` 0개 |
| U2 High Scalability | 글자 그대로 | 4초, 초당 100만 쓰기 설계 목표, 셀 ID 샤딩 키, level 12, 셀 크기 맞바꿈, Ringpop AP, ETA 순 제안 | 2015 발표의 2차 기록. 「Design goal」 — 측정값 아님. level 12 「3.31 km(2) to 6.38 km(2)」는 U22 하한(3.04)과 다름 |
| U3 InfoQ | 글자 그대로 | 4초, 「3,31 km2」, 재시도 · 멱등 원칙 | 2차 기록. 셀 넓이를 한 값으로 적음 |
| U5 · U6 Uber 풀필먼트 | 글자 그대로 | 옛 구조의 가용성 우선, 동시 쓰기의 예, Spanner 트랜잭션 | 「billions of trips per year」 — 초당 요청 수 없음. 이중 배정을 직접 다루는 문장 없음 |
| U7 · U8 Ringpop | 글자 그대로 | 해시 링, 요청 넘김, 더는 개발하지 않음 | 운영 노드 수 없음 |
| U9 ~ U12 H3 | 글자 그대로 | 16 해상도, 1/7 넓이, kRing, 해상도별 평균 넓이, 오각형 | U9 는 분석 · 최적화의 격자라고 적음 — 실시간 기사 검색이라는 문장 없음 |
| U13 · U14 Lyft 발표 | 글자 그대로(공백 차 셋) | 5초, 지오해시 5 자리, 시각 점수, 30초 삭제, GEO 를 안 쓴 이유, ketama, 몰리는 샤드, 2017 년 클러스터 50 · 인스턴스 750 | 15초(1세대)와 30초(2세대) 두 값. 「15 Million QPS」는 제목에만. 업로드 2017-06-05 · 2017-06-19(정정) |
| U15 ~ U19 Redis 문서 | 글자 그대로(마크다운 원본) | GEO 의 정렬 집합 · 52비트 · 1+8 칸 · 0.5% · 복잡도, 구간 삭제, 키 단위 만료 | 0.5% 는 「in the worst case」 · 「may」, 원인은 Haversine |
| U20 지오해시 · U21 · U22 S2 | 글자 그대로 | 공통 접두사의 한계, 자리별 오차, Hilbert 곡선, 30 레벨, level 12 최소 · 최대 · 평균 | U22 의 level 12 하한 3.04 km² |
| U23 · U24 Redis 잠금 · SET | 글자 그대로(마크다운 원본) | `SET NX PX`, 고유 값, DEL 위험, 비동기 복제, 펜싱 권고, 시계 | 「should implement」 · 「from time to time is acceptable」 · 「discouraged」 |
| U25 Kleppmann · U26 antirez | 글자 그대로 | 효율 · 정확성, 펜싱 토큰, Redlock 결론, 확인 후 쓰기, 단조 시계 | 효율 문장은 괄호 예시로 이어지는 문장의 앞부분. antirez 글 날짜는 페이지에 없음(확인 안 함) |
| U27 · U28 DynamoDB | 글자 그대로 | 조건부 갱신, TTL 삭제가 며칠 걸림 | 「within a few days」 · 「might」 |
| U29 · U30 PostgreSQL | 글자 그대로 | Read Committed 의 WHERE 재평가, `SKIP LOCKED` 경고 | Read Committed 의 동작. 다른 격리 수준은 보지 않음 |
| U31 · U32 Uber 도움말 | 글자 그대로 | 15초, 거절은 다른 기사에게 | U32 는 배달 · typically |
| U33 Uber 매칭 · U35 Grab | 글자 그대로 | 몇 초 모아 일괄 매칭, 이분 매칭 · KM | 초 수 없음. U35 는 연구 실험 |
| U34 Grab Pharos | 글자 그대로 | 도시 · 차종 분할, 복제 둘, 시각으로 거름, P99 10ms · 50ms | P99. 지우는 것은 밤마다 다시 만들기 |
| U36 Uber 공항 | 글자 그대로 | 공항 FIFO 에서 기사가 오래 기다림 | 기사가 몰린 쪽의 사례 |
| U37 GPS.gov · U38 Uber GPS | 글자 그대로 | 4.9 m(탁 트인 하늘), 50 m 이상(도심) | typically · 「can be」 |
| U39 ~ U41 Stripe · brandur | 글자 그대로 | 멱등 키의 정의, 24시간 뒤 지우기, 다시 보내는 이유 | 결제 API — 승차 공유의 구조 아님 |
| U42 Educative · U43 DesignGurus | 글자 그대로(열린 부분) | 기사 좌표를 주기적으로 추적(U42), 「every few seconds」(U43) | 규모 절은 열리지 않음 |

## 11. 출처

- U1. Evan King, Design a Ride-Sharing Service Like Uber (Hello Interview) — https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber (게시 2024-07-18, 고침 2026-02-15, 조회 2026-11-25) — 교육용
- U2. High Scalability, How Uber Scales Their Real-time Market Platform — https://highscalability.com/how-uber-scales-their-real-time-market-platform/ (2015-09-14, 조회 2026-11-25) — 2차 기록
- U3. João Miranda, Uber Unveils its Realtime Market Platform (InfoQ) — https://www.infoq.com/news/2015/03/uber-realtime-market-platform (2015-03-15, 조회 2026-11-25) — 2차 기록
- U4. Yan Cui, QCon London 2015 — Takeaways from Scaling Uber's realtime market platform — https://theburningmonk.com/2015/03/qcon-london-2015takeaways-from-scaling-ubers-realtime-market-platform/ (2015-03, 날짜 확인 안 함, 조회 2026-11-25) — 2차 기록
- U5. Ashwin Neerabail · Kamran Massoudi · Ankit Srivastava, Uber's Fulfillment Platform: Ground-up Re-architecture — https://www.uber.com/blog/fulfillment-platform-rearchitecture/ (2021-07-27, 조회 2026-11-25)
- U6. Uber Engineering, Building Uber's Fulfillment Platform for Planet-Scale using Google Cloud Spanner — https://www.uber.com/blog/building-ubers-fulfillment-platform/ (2021-09-29, 조회 2026-11-25)
- U7. Lucie Lozinski, Ringpop (Uber Engineering) — https://www.uber.com/en-CA/blog/ringpop-open-source-nodejs-library/ (2016-02-04, 조회 2026-11-25)
- U8. uber/ringpop-go README — https://github.com/uber/ringpop-go (조회 2026-11-25)
- U9. Isaac Brodsky, H3: Uber's Hexagonal Hierarchical Spatial Index — https://www.uber.com/blog/h3/ (2018-06-27, 조회 2026-11-25)
- U10. H3 문서, Resolution table — https://h3geo.org/docs/core-library/restable (조회 2026-11-25)
- U11. H3 문서, Traversal — https://h3geo.org/docs/api/traversal (조회 2026-11-25)
- U12. H3 문서, Overview — https://h3geo.org/docs/core-library/overview (조회 2026-11-25)
- U13. Daniel Hochman, Geospatial Indexing at Scale: The 15 Million QPS Redis Architecture Powering Lyft (RedisConf17) — https://www.slideshare.net/slideshow/geospatial-indexing-at-scale-the-15-million-qps-redis-architecture-powering-lyft/76662828 (업로드 2017-06-05, 조회 2026-11-25)
- U14. 같은 발표의 다른 사본 — https://www.slideshare.net/slideshow/redisconf17-lyft-geospatial-at-scale-daniel-hochman/77087313 (업로드 2017-06-19, 조회 2026-11-25)
- U15. Redis 문서, GEOADD — https://redis.io/docs/latest/commands/geoadd/ (조회 2026-11-25)
- U16. Redis 문서, GEOSEARCH — https://redis.io/docs/latest/commands/geosearch/ (조회 2026-11-25)
- U17. Redis 문서, ZREMRANGEBYSCORE — https://redis.io/docs/latest/commands/zremrangebyscore/ (조회 2026-11-25)
- U18. Redis 문서, EXPIRE — https://redis.io/docs/latest/commands/expire/ (조회 2026-11-25)
- U19. Redis 문서, Sorted sets — https://redis.io/docs/latest/develop/data-types/sorted-sets/ (조회 2026-11-25)
- U20. Wikipedia, Geohash — https://en.wikipedia.org/wiki/Geohash (조회 2026-11-25)
- U21. S2 Geometry, S2 Cell Hierarchy — https://s2geometry.io/devguide/s2cell_hierarchy (조회 2026-11-25)
- U22. S2 Geometry, S2 Cell Statistics — https://s2geometry.io/resources/s2cell_statistics (조회 2026-11-25)
- U23. Redis 문서, Distributed Locks with Redis — https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/ (조회 2026-11-25)
- U24. Redis 문서, SET — https://redis.io/docs/latest/commands/set/ (조회 2026-11-25)
- U25. Martin Kleppmann, How to do distributed locking — https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html (2016-02-08, 조회 2026-11-25)
- U26. Salvatore Sanfilippo, Is Redlock safe? — http://antirez.com/news/101 (날짜 확인 안 함, 조회 2026-11-25)
- U27. AWS, DynamoDB condition expression CLI example — https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html (조회 2026-11-25)
- U28. AWS, Using time to live (TTL) in DynamoDB — https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/howitworks-ttl.html (조회 2026-11-25)
- U29. PostgreSQL 문서, Transaction Isolation — https://www.postgresql.org/docs/current/transaction-iso.html (조회 2026-11-25)
- U30. PostgreSQL 문서, SELECT — https://www.postgresql.org/docs/current/sql-select.html (조회 2026-11-25)
- U31. Uber 도움말, Getting a trip request — https://help.uber.com/driving-and-delivering/article/getting-a-trip-request?nodeId=e7228ac8-7c7f-4ad6-b120-086d39f2c94c (날짜 없음, 조회 2026-11-25)
- U32. Uber 도움말, Accepting delivery requests — https://help.uber.com/en-GB/driving-and-delivering/article/how-long-do-i-have-to-accept-a-delivery-request?nodeId=fe04b64d-24ad-4664-8c8b-2233c1b9b0a7 (날짜 없음, 조회 2026-11-25)
- U33. Uber, How does Uber match riders with drivers? — https://www.uber.com/us/en/marketplace/matching/ (날짜 없음, 조회 2026-11-25)
- U34. Hao Wu 외, Pharos — Searching Nearby Drivers on Road Network at Scale (Grab Engineering) — https://engineering.grab.com/pharos-searching-nearby-drivers-on-road-network-at-scale (2020-12-22, 조회 2026-11-25)
- U35. Tenindra Abeywickrama · Victor Liang · Kian-Lee Tan, Using real-world patterns to improve matching in theory and practice (Grab Engineering) — https://engineering.grab.com/using-real-world-patterns-to-improve-matching (2021-11-22, 조회 2026-11-25)
- U36. Dhruv Ghulati 외, Forecasting Models to Improve Driver Availability at Airports (Uber Engineering) — https://www.uber.com/blog/forecasting-models-to-improve-availability-at-airports/ (2025-08-19, 조회 2026-11-25)
- U37. GPS.gov, GPS Accuracy(보관 사본) — https://archive.gps.gov/systems/gps/performance/accuracy/ (마지막 수정 2022-03-03 — 워커 보고, 조회 2026-11-25)
- U38. Andrew Irish 외, Rethinking GPS: Engineering Next-Gen Location at Uber — https://www.uber.com/blog/rethinking-gps/ (2018-04-19, 조회 2026-11-25)
- U39. Stripe 문서, Idempotent requests — https://docs.stripe.com/api/idempotent_requests (조회 2026-11-25)
- U40. Brandur Leach, Designing robust and predictable APIs with idempotency (Stripe) — https://stripe.com/blog/idempotency (2017-02-22, 조회 2026-11-25)
- U41. Brandur, Implementing Stripe-like Idempotency Keys in Postgres — https://brandur.org/idempotency-keys (2017-10-27 — 워커 보고, 조회 2026-11-25)
- U42. Educative, Requirements of Uber's Design — https://www.educative.io/courses/grokking-the-system-design-interview/requirements-of-ubers-design (날짜 확인 안 함, 조회 2026-11-25) — 사례 목록의 GM
- U43. Arslan Ahmad, Ride sharing service (DesignGurus) — https://www.designgurus.io/blog/ride-sharing-service (2026-04-19, 조회 2026-11-25) — 사례 목록의 DG

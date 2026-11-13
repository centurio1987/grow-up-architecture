# 시스템 설계 사례 목록 — 2026-11-13

- 조사일: 2026-11-13. 웹 출처의 조회일은 모두 이 날짜입니다. 게시일은 8절 출처표에 적었습니다.
- 쓰임: [시스템 설계 사례 가이드 준비안](system-design-guide-plan-2026-11-13.md)이 고를 **가이드 후보(문제 하나 = 가이드 한 편)** 목록입니다. 파일럿 1 편의 근거는 [리서치 노트](live-viewer-count-2026-11-13.md)에 따로 모았습니다.
- 조사 방식: 웹 조사 다섯 갈래(설계 문제 카탈로그 · 실시간과 협업 · 거래와 커머스와 위치 · 데이터와 검색과 미디어와 인프라와 AI · 시청자 수 심층)에 이 문서가 직접 떠올린 문제를 더했습니다.
- 한계: 웹 페이지 대부분은 요약 도구로 읽었습니다. 표의 수치는 그 요약에서 옮긴 것이라, 가이드 본문에 쓰기 전에 원문과 한 번 대조합니다. 원문을 열지 못한 자료는 근거로 쓰지 않고 7절에 따로 모았습니다.

## 요약

가이드 후보는 **75건**입니다. 이 문제를 무엇이 어렵게 만드는가를 기준으로 11개 분류에 나눴습니다.
후보마다 근거를 둘 중 하나 이상으로 댔습니다. 하나는 설계 문제 카탈로그(책·강의·공개 저장소)이고, 다른 하나는 기업과 저자가 공개한 글·발표·논문입니다(105건, 그중 국내 기업 20건). 근거 없이 이 문서가 떠올린 후보는 9건이고 「자체」로 표시했습니다.

| 처분 | 건수 | 뜻 |
| --- | --- | --- |
| 파일럿 | 2 | 명세를 검증하는 첫 두 편. RT-01 라이브 동시 시청자 수, CT-01 선착순 쿠폰 발급 |
| 1차 | 12 | 파일럿 회고 뒤 첫 묶음 |
| 후속 | 53 | 1차 이후 차례로 씁니다 |
| 기초 | 1 | 다른 편보다 먼저 읽히는 입문편 후보 |
| 부품 | 7 | 단독 편보다 다른 편의 기술 설명 절이나 패턴 가이드로 다루기를 권합니다 |

1차 12건을 고른 기준은 셋입니다. 카탈로그와 기업 자료를 합쳐 근거가 세 건 이상일 것, 한 분류에 몰리지 않을 것, 파일럿 두 편과 같은 문제를 되풀이하지 않을 것입니다.

## 1. 분류 기준 — 무엇이 이 문제를 어렵게 만드는가

업종(스트리밍 · 커머스 · 금융)으로 나누지 않고 **난제**로 나눴습니다. 같은 라이브 스트리밍 업종 안에서도 시청자 수 표시는 "같은 값을 많은 화면에 뿌리는" 문제이고, 영상 전달은 "큰 데이터를 멀리 보내는" 문제라 쓰는 기술이 전혀 다릅니다.
난제로 묶으면 한 분류 안의 가이드들이 같은 기술을 서로 다른 수치에서 쓰는 모습을 보여 줄 수 있습니다. 독자가 자기 문제를 처음 보는 업종이라도 분류에서 출발할 수 있다는 장점도 있습니다(판단).

| 코드 | 분류 | 이 분류의 문제를 어렵게 만드는 것 |
| --- | --- | --- |
| RT | 실시간 전달 | 같은 값이나 사건을 많은 연결에 짧은 시간 안에 보내야 함 |
| CT | 경합과 정합성 | 여러 요청이 같은 자원을 동시에 원하고, 값이 하나라도 틀리면 돈이나 신뢰를 잃음 |
| AG | 집계와 근사 | 쏟아지는 사건을 세거나 순위를 매겨야 하고, 정확도와 비용을 맞바꿀 수 있는지가 갈림 |
| RD | 읽기 증폭 | 한 번 쓴 데이터가 아주 많이 읽혀서, 미리 만들어 둘지 읽을 때 만들지가 갈림 |
| SR | 검색과 추천 | 큰 데이터에서 맞는 것을 수십 ms 안에 골라야 함 |
| GE | 위치와 매칭 | 움직이는 대상의 위치를 계속 갱신하며 가까운 것끼리 짝지어야 함 |
| MD | 대용량 전달·저장 | 큰 파일이나 영상을 올리고 저장하고 멀리 보내야 함 |
| SY | 협업과 동기화 | 여러 곳에서 같은 데이터를 동시에 고치고 결국 같은 결과로 맞춰야 함 |
| WF | 긴 작업과 워크플로 | 오래 걸리거나 정해진 때 도는 작업을 빠짐없이 한 번만 해야 함 |
| IN | 공통 부품 | 위 문제들이 함께 쓰는 부품. 단독 문제로 서는 것은 일부뿐 |
| AI | AI 서비스 | 비싸고 느린 모델 추론을 많은 사용자에게 나눠 줘야 함 |

## 2. 가이드 후보 목록

표의 「근거」 칸은 두 종류입니다. `XU1` 같은 대문자 약어는 설계 문제 카탈로그이고(8-1), `B12` 같은 번호는 기업 엔지니어링 글입니다(8-2~8-4). `V` 는 파일럿 리서치 노트의 출처 번호입니다.

### RT 실시간 전달

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| RT-01 | 라이브 동시 시청자 수를 모든 시청자 화면에 실시간 표시 | 같은 값을 수백만 연결에 보냄. 입장·이탈마다 보내면 메시지가 시청자 수의 제곱으로 늘어남 | 하트비트와 만료, 에지 집계, 주기 SSE | 리서치 노트 V1~V40, HI fb-live-comments(인접 문제), GM 샤딩 카운터, D16 | 파일럿 |
| RT-02 | 라이브 방송 실시간 댓글·반응 | 방송당 초당 수천 건, 시청자별 필터링, 초대형 방송 | SSE, pub/sub 파티션, 샘플링, 마이크로배치 집계 | HI fb-live-comments; B7 · B18 · B20 · B21 | 후속 |
| RT-03 | 대형 그룹 채팅(한 방에 수만~수백만 명) | 방 크기에 따라 fan-out 이 제곱으로 늚 | 방별 프로세스, 수동 연결, relay, 계층 fan-out | XU1 · P · HI whatsapp · GM · DG; B2 · B3 · B4 · B11 | 1차 |
| RT-04 | 메신저의 순서 보장과 오프라인 수신 | 끊기는 모바일 망, 메시지 순서, 수조 건 저장 | 스냅샷과 델타, 순서 큐, 저장 후 전달 | XU1 · HI whatsapp; B1 · B10 | 후속 |
| RT-05 | 접속 상태(온라인 표시) | 연결이 자주 끊겨 상태가 깜빡임 | 하트비트, 만료, 지연 타이머, 보는 화면 기준 구독 | B4 · B5 · B6 | 후속 |
| RT-06 | 단체 채팅방 메시지별 "안 읽은 사람 수" | 메시지 수 × 참여자 수만큼의 상태, 읽음 이벤트 폭주 | 사람별 읽은 위치 저장, 범위 계산 | 자체 | 후속 |
| RT-07 | 주식·채권 시세 실시간 전달 | 초당 여러 번 바뀌는 값을 화면 갱신 속도에 맞춰 솎아 보냄 | 최신값만 보내기(conflation), 샤드 pub/sub, WebSocket | HI robinhood; B29 · D43 | 후속 |
| RT-08 | 알림 대량 발송(푸시 · SMS · 이메일) | 평시 대비 수십 배 급증, 중복·유실 금지, 외부 발송사 장애 | 우선순위 큐, 발송사 이중화, 장기 연결 푸시 | XU1 · HI notification-system; B16 · B19 · B26 · D31 · D32 | 1차 |
| RT-09 | 실시간 게임 리더보드 | 내 순위와 주변 순위를 정확히, 점수 갱신 급증 | Redis 정렬 집합, 샤딩 | XU2 · HI leetcode | 후속(기업 근거 없음) |
| RT-10 | 대기 순번 실시간 표시(병원 · 식당) | 순번 변화를 대기자 각자에게 전파 | 순서 큐, 구독 | 자체 | 후속 |

### CT 경합과 정합성

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| CT-01 | 선착순 쿠폰 발급(한정 수량, 한 사람 한 장) | 몇 초 만에 끝나는 폭주, 수량 초과·중복 발급 금지 | 원자적 차감, 중복 키, 선차감 후 보정 | C5 · C13 · C14 · C15 · C16 | 파일럿 |
| CT-02 | 플래시 세일 재고 차감과 결제 중 점유 | 초과 판매 금지, 결제하는 동안 재고 점유와 만료 해제 | 재고 단위 행 풀, `SKIP LOCKED`, 점유 만료 | HI flash-sale; C12 · C17 · C20 | 후속 |
| CT-03 | 티켓 예매와 좌석 선점 | 한 공연에 천만 명, 좌석 이중 판매 금지, 좌석 임시 점유 | 좌석 점유 만료, 가상 대기실, 검색 분리 | HI ticketmaster · DG; C21 · C22 | 1차 |
| CT-04 | 정각 오픈 접속 폭주와 가상 대기실(수강신청 · 티켓 오픈) | 자동 확장보다 빠른 폭주, 순서 공정성 | 에지 차단, 대기열 토큰, 입장 속도 제어 | C13 · C21 · C22; 자체(수강신청) | 후속 |
| CT-05 | 결제·송금 중복 방지 | 응답 유실 뒤 재시도가 이중 결제가 됨, 성공 여부를 모르는 상태 | 멱등 키, 결제 상태 기계, 대사(reconciliation) | XU2 · HI payment-system; C1 · C2 · C3 · C4 · C5 | 1차 |
| CT-06 | 잔액·포인트 원장 | 돈이 맞아야 하고 감사가 가능해야 함, 수조 건 이력 | 불변 복식부기, 합계 0 검사, 인덱스 일관성 분리 | XU2 지갑; C6 · C7 · C8 · C9 · C10 · C11 | 후속(기존 분석 패턴 Account · Transaction 편과 연결) |
| CT-07 | 포인트 적립과 유효기간 만료 | 먼저 쌓인 포인트부터 차감, 만료 배치 | 적립 건별 잔액, 배치 | 자체 | 후속(CT-06 흡수 검토) |
| CT-08 | 호텔·숙박 예약 중복 방지 | 날짜 범위 재고, 초과 예약 허용 정책 | 날짜별 재고 행, 트랜잭션 | XU2 | 후속(기업 근거 없음) |
| CT-09 | 실시간 경매 입찰 | 최고가 판정의 강한 일관성, 마감 직전 몰림 | 경매별 순서 기록, 서버 시각 | HI online-auction; 자체(마감 직전 몰림) | 후속 |
| CT-10 | 증권 거래소 주문 매칭 | 서브밀리초 응답, 결정적 순서 | 단일 스레드 인메모리, 이벤트 소싱, 링 버퍼 | XU2 · P; C23 · C24 | 후속 |
| CT-11 | 여러 서비스에 걸친 주문 처리 | 서비스마다 로컬 트랜잭션만 있음, 중간 실패 | Saga, Outbox, 보상 | C27 · C28 · C29 · C30 · C31 · C32 | 후속 |
| CT-12 | 광고 예산 소진 조절 | 분산 카운터의 초과 지출 허용 오차 | 서버별 할당량, 주기 동기화 | 자체 | 후속 |
| CT-13 | 라이브 커머스 한정 판매와 남은 수량 표시 | 정확해야 하는 차감과 근사로 충분한 화면 표시를 한 서비스에서 분리 | 원자적 차감, 표시값 스로틀링 | 자체(RT-01 · CT-01 의 결합) | 후속 |

### AG 집계와 근사

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| AG-01 | 조회수·좋아요 수 카운터 | 인기 글 한 키에 쓰기가 몰림 | 샤드 카운터, 쓰기 합치기, HyperLogLog | GM 샤딩 카운터; 리서치 노트 V30 | 후속 |
| AG-02 | 실시간 인기 순위 Top-K(인기 검색어 · 트렌딩) | 하루 수백억 이벤트, 기간별 순위, 순위 조작 | 윈도 집계, 근사 빈도 자료구조, 계층 집계 | HI top-k · P trending · P sales_rank; 자체(인기 검색어) | 후속(기업 근거 없음) |
| AG-03 | 광고 클릭 집계(정확히 한 번) | 유실·중복 금지, 핫 샤드 | 스트림 윈도, Kafka 트랜잭션, 결정적 ID | XU2 · HI ad-click-aggregator; D11 | 1차 |
| AG-04 | 지표 수집 · 모니터링 · 알림 | 초당 수백만 지표, 늦게 온 데이터 | 시계열 저장소, 롤업, 계층 질의 | XU2 · HI metrics-monitoring · GM; D12 · D13 | 후속 |
| AG-05 | 로그 파이프라인과 실시간 분석 대시보드 | 피크와 새벽의 10배 변동, 저장 비용 | Kafka, 컬럼 저장소의 적재 시점 집계, 자동 확장 | GM; B22 · D14 · D15 | 후속 |
| AG-06 | IoT 센서 시계열 수집 | 쓰기 위주, 오래된 데이터 다운샘플링 | 시계열 저장소, 배치 적재 | 자체 | 후속 |
| AG-07 | 선거 개표·실시간 투표 결과 | 정확한 집계와 대량 조회가 동시에 | 단계 집계, 캐시와 CDN | 자체 | 후속 |

### RD 읽기 증폭

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| RD-01 | 홈 타임라인·뉴스피드 | 팔로워 많은 계정의 쓰기 fan-out 폭증, 미리 만들지 읽을 때 만들지 | fan-out on write · on read, 혼합 | XU1 · P · HI · GM · DG; D1 · D2 | 1차 |
| RD-02 | 읽기가 몰리는 데이터의 캐시 설계 | 동시 만료 폭주(캐시 스탬피드), 무효화 일관성 | look-aside, 확률적 조기 만료, 삭제로 무효화, 다단 캐시 | HI distributed-cache · P query_cache; D5 · D25 · D26 | 후속 |
| RD-03 | URL 단축 | 고유 코드 생성, 피크 초당 60만 읽기 | 키 생성, 캐시, 리다이렉트 | XU1 · P · HI · GM · DG | 후속(기업 근거 없음, 입문용) |
| RD-04 | 사용자 1명에서 1천만 명까지 단계 확장 | 단계마다 병목이 바뀜 | 수직·수평 확장, 캐시, 복제, 샤딩 | P scaling_aws · XU1 1장; D36 | 기초 |

### SR 검색과 추천

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| SR-01 | 검색어 자동완성 | 글자마다 질의, 수십 ms 안에 응답 | 트라이, 접두사 캐시 | XU1 · GM · DG | 후속 |
| SR-02 | 게시물·메시지 검색 색인 | 새 글 1분 안 검색, 흔한 키워드의 목록 폭증 | 역색인, 앱 계층 샤딩, 지연 색인 | HI fb-post-search · P · DG; D8 · D9 · D10 | 후속 |
| SR-03 | 추천 서빙(후보 생성 → 랭킹) | 큰 후보 집합에서 수십 ms 안에 개인화 | 2단계 구조, 벡터 검색, 피처 저장소 | XML · P; D3 · D4 · D5 · D6 · D7 | 후속 |
| SR-04 | 웹 크롤러 | 100억 페이지, 도메인별 예절, 중복 | URL 대기열, 도메인 파티션 | XU1 · P · HI · GM · DG; D30 | 후속 |
| SR-05 | 소셜 그래프 탐색 | 간선 50억 개, 한 대에 안 들어감 | 그래프 샤딩, 그래프 캐시 | P social_graph · XML; D26 | 후속 |

### GE 위치와 매칭

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| GE-01 | 근처 가게·장소 검색 | 위치와 조건을 함께 거는 질의 | 지오해시, 쿼드트리, H3 | XU2 · HI yelp · GM · DG; C25 | 후속 |
| GE-02 | 승차 공유 배차 매칭 | 기사 위치 초당 200만 건, 한 기사 이중 배정 금지 | 위치 인덱스, 점유 만료 잠금 | HI uber · GM · DG; C25 · C26 | 1차 |
| GE-03 | 실시간 위치 공유(라이더 · 주변 친구) | 쓰기는 잦고 구독자는 소수 | 최신값 저장, 구독, 샘플링 | XU2 · DG · HI strava; C26 | 후속 |
| GE-04 | 배달 배차와 실거리 계산 | 초당 약 2만 건의 경로 계산 | 경로 엔진, 지역 파티션 | HI gopuff; D33 | 후속 |
| GE-05 | 지도와 경로 탐색 | 지도 조각 전달, 도착 시각 예측 | 타일 CDN, 그래프 탐색 | XU2 · GM | 후속 |
| GE-06 | 매치메이킹(게임 · 데이팅) | 대기 시간과 매칭 품질의 맞바꿈, 상호 좋아요 동시 감지 | 버킷 큐, 기준 완화 | HI online-chess · HI tinder; 자체 | 후속 |

### MD 대용량 전달·저장

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| MD-01 | 동영상 업로드 · 인코딩 · VOD 전달 | 큰 파일 분할 업로드, 트랜스코딩, 전 세계 전달 | 분할 업로드, DAG 트랜스코딩, 적응형 비트레이트, CDN | XU1 · HI youtube · GM · DG; D18 | 1차 |
| MD-02 | 라이브 방송 영상 전달(저지연) | 한 방송에 수백만 명, 2~3초 지연 목표 | RTMP 인제스트, HLS 세그먼트, 에지 요청 합치기 | D17; 리서치 노트 V7 · V8 · V15 | 후속 |
| MD-03 | 파일 동기화 | 50GB 파일, 기기 간 충돌, 바뀐 부분만 동기화 | 청크, rolling hash, 결정적 동기화 엔진 | XU1 · P · HI dropbox · DG; D19 | 후속 |
| MD-04 | 이미지 업로드와 썸네일·압축 처리 | 비동기 처리, 실패 재처리 | 객체 저장소 이벤트, 작업 큐 | D20; 자체 | 후속 |

### SY 협업과 동기화

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| SY-01 | 실시간 공동 편집(문서 · 디자인) | 동시 수정 충돌, 결과 수렴, 오프라인 편집 | OT, CRDT, 중앙 서버의 속성 단위 LWW | P · HI google-docs · GM; B13 · B25 · B27 · B28 | 1차 |
| SY-02 | 오프라인 우선 앱 동기화 | 오프라인 중 변경, 다시 연결될 때 병합 | 로컬 DB, 전역 순번, 델타 | B15 · B24; 자체(매장 POS) | 후속 |
| SY-03 | 공유 캔버스 대규모 동시 참여(r/place) | 동시 15만 명, 쓰기 초당 18만 목표 | Redis BITFIELD, CDN 1초 캐시 | B12 | 후속 |
| SY-04 | 실시간 게임 상태 동기화 | 128Hz 틱, 지연 보상 | 서버 권위, 클라이언트 예측 | B17 · HI online-chess | 후속 |
| SY-05 | 여러 지역 동시 쓰기(active-active) | 지역 간 쓰기 충돌 | 벡터 시계, 충돌 해결 규칙 | P; D27 | 후속 |
| SY-06 | DB 변경을 화면에 바로 반영하는 구독 | 쓰기와 알림의 순서가 어긋남 | 복제 스트림 위의 live query | B14 · B21 | 후속 |

### WF 긴 작업과 워크플로

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| WF-01 | 분산 작업 스케줄러 | 예정 시각 2초 안에 실행, 이중 실행 금지 | 리더 선출, 합의 로그, 이중 실행보다 건너뜀 | HI job-scheduler · GM; D29 | 후속 |
| WF-02 | 웹훅 전달 보장 | 수신자 장애, 재시도, 순서 | Outbox, 백오프, DLQ, 서명 | C32; 자체 | 후속 |
| WF-03 | 일일 정산과 대사 | 다시 돌려도 결과가 같아야 함 | 멱등 배치, 마감 시각, 대사 | C9 · C10; 자체 | 후속 |
| WF-04 | 대용량 내보내기와 진행률 표시 | 긴 작업과 실시간 진행률 | 작업 큐, 진행 상태 저장, SSE | 자체 | 후속 |
| WF-05 | 원격 기기 명령 전달(공유 킥보드 잠금 해제) | 불안정한 망에서 명령 도달 확인 | 명령 ID, ack, 재전송 | 자체 | 후속 |
| WF-06 | 신뢰할 수 없는 코드 실행(채점 서버) | 격리, 동시 1만 건 제출 | 샌드박스, 작업 큐 | HI leetcode · GM | 후속 |

### IN 공통 부품

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| IN-01 | API 처리율 제한 | 한 사용자의 폭주, 전 세계 에지에서 세기 | 토큰 버킷, 슬라이딩 윈도 근사, 샤딩 Redis | XU1 · P · HI · GM · DG; D21 · D22 · D23 | 1차(부품이지만 단독 문제로도 성립) |
| IN-02 | 분산 고유 ID 생성 | 시계 역행, 기계 번호 배정 | 시간 + 기계 + 순번 비트 | XU1 · P · GM; D24 | 부품 |
| IN-03 | 분산 키-값 저장소 | 노드 장애 중에도 쓰기 가능 | 일관 해시, 쿼럼, 벡터 시계 | XU1 · HI · GM; D27 | 부품 |
| IN-04 | 분산 캐시 | 초당 수십억 요청, 무효화 | look-aside, 라우터, 계층 풀 | HI · P; D25 · D26 | 부품(RD-02 와 함께) |
| IN-05 | 메시지 큐와 pub/sub | 파티션, 순서, 구독자 대역폭 | 파티션, 컨슈머 그룹, 이벤트 경량화 | XU2 · GM; B23 | 부품 |
| IN-06 | 일관 해싱 | 노드 증감 시 재배치 최소화 | 해시 링, 가상 노드 | XU1 | 부품 |
| IN-07 | 분산 잠금 | 효율용과 정확성용 잠금의 안전성 차이 | 펜싱 토큰, 커밋 뒤 잠금 해제 | D28; C18 · C19 | 부품 |
| IN-08 | 장기 연결 게이트웨이 | 서버당 수십만~200만 연결, 재연결 폭주 | 커널 한도 조정, pub/sub 샤딩, 점진 연결 해제 | B5 · B8 · B9 · B19 · B25 · B26 | 부품 |
| IN-09 | 설정·피처 플래그 전파 | 모든 서버에 빠르게, 전파 경로가 고장 나도 바꿀 수 있어야 함 | 폴링, 스트리밍 구독, 기본값 | D31; 자체 | 후속 |

### AI AI 서비스

| ID | 문제 | 어렵게 만드는 것 | 핵심 기술 | 근거 | 처분 |
| --- | --- | --- | --- | --- | --- |
| AI-01 | LLM 채팅 서비스(토큰 스트리밍 · 끊긴 응답 이어 받기) | GPU 부족, 동시 스트리밍 12만, 첫 토큰 지연, 재접속 중에도 생성은 계속됨 | SSE, 요청 큐, 대화 저장, 재개 커서 | HI chatgpt · GM · XGAI; D36 · D37 · D39 | 1차 |
| AI-02 | 문서 검색 증강 생성(RAG) | 조각난 문서의 맥락 손실, 사용자마다 볼 수 있는 문서가 다름 | 하이브리드 검색, 재순위, 조각에 맥락 붙이기, 권한 필터 | XGAI; D6 · D41; 자체(권한 필터) | 1차 |
| AI-03 | LLM 추론 서빙 효율 | KV 캐시 메모리 낭비, GPU 활용률 | 연속 배칭, 페이지 단위 KV 캐시, 접두사 캐시 | D37 · D38 · D39 · D42 | 후속 |
| AI-04 | 멀티 에이전트 실행 인프라 | 채팅의 약 15배 토큰, 긴 실행 중 장애 | 오케스트레이터와 워커, 중간부터 재개 | D40 | 후속 |
| AI-05 | 실시간 자막·번역 스트리밍 | 부분 결과를 고쳐 쓰며 갱신 | 스트리밍 추론, 확정 구간과 잠정 구간 | XGAI; 자체 | 후속 |

## 3. 파일럿 두 편을 이렇게 고른 이유

**RT-01 라이브 동시 시청자 수**는 요청하신 예시이고, 근사값이 허용되며 같은 값 하나를 많은 화면에 뿌리는 문제입니다.
**CT-01 선착순 쿠폰 발급**은 그 반대 성격입니다. 값이 하나라도 틀리면 안 되고, 같은 자원(남은 수량)을 두고 요청이 경합합니다.

CT-01 을 같은 계열의 플래시 세일(CT-02)이나 티켓 예매(CT-03)보다 먼저 두는 이유는 둘입니다.

1. 문제가 더 작습니다. 결제하는 동안 재고를 붙잡아 두는 만료 처리가 없어서, 파일럿에서는 "정확한 차감과 중복 방지"라는 핵심만 검증할 수 있습니다.
2. 국내 근거가 두껍고 실패 사례까지 있습니다. 배민은 카운터를 복제본에서 읽다가 복제 지연 때문에 정원 1,111명을 넘는 당첨자가 나왔고(C13), 올리브영은 1차 검증을 통과한 요청이 2차에서 실패해 쿠폰이 안 나가는 문제를 고쳤습니다(C15).
   배민 프로모션은 `synchronized` · 낙관적 락 · Redis 전역 락을 각각 버린 이유를 적었습니다(C14). 시나리오 3(장애가 날 때)과 대안 비교 절을 바로 채울 수 있는 재료입니다.

## 4. 1차 묶음과 패턴 후보의 연결

사례 가이드의 기술 설명 절은 11월 6일 [패턴 확장 조사](pattern-expansion-research-2026-11-06.md)의 후보들을 부품으로 씁니다. 아래 표는 파일럿과 1차 묶음이 어느 패턴 후보에 기대는지를 짝지은 것입니다(판단).
패턴 편이 먼저 발행돼 있으면 사례 가이드는 그 편을 링크하고 이 사례에 필요한 만큼만 설명합니다. 아직 없으면 사례 가이드가 본문에서 풉니다.

| 사례 | 기대는 패턴 후보(11-06 조사의 ID) |
| --- | --- |
| RT-01 시청자 수 | M01 Publish-Subscribe Channel, R02 Retry(재연결 지터) |
| CT-01 선착순 쿠폰 | P11 · P12 낙관적·비관적 잠금, D03 Idempotent Consumer, R06 Queue-Based Load Leveling |
| RT-03 대형 그룹 채팅 | M01 Publish-Subscribe Channel, R03 Bulkhead |
| RT-08 알림 발송 | M02 Competing Consumers, M03 Dead Letter Channel, R02 Retry, A03 Circuit Breaker |
| CT-03 티켓 예매 | P12 비관적 잠금(좌석 점유), R04 Rate Limiting, R06 Queue-Based Load Leveling |
| CT-05 결제 중복 방지 | D03 Idempotent Consumer, D02 Transactional Outbox, R01 Timeout, R02 Retry, A03 Circuit Breaker |
| AG-03 클릭 집계 | D05 Materialized View, D03 Idempotent Consumer |
| RD-01 타임라인 | R05 Cache-Aside, D05 Materialized View |
| IN-01 처리율 제한 | R04 Rate Limiting |
| AI-01 LLM 채팅 | R06 Queue-Based Load Leveling, R01 Timeout, A03 Circuit Breaker |

GE-02 · MD-01 · SY-01 · AI-02 는 11-06 조사의 후보 목록에 직접 대응하는 패턴이 없습니다. 이 넷은 사례 가이드가 기술 설명을 처음부터 맡습니다.

## 5. 목록에서 뺀 것

카탈로그에 있었지만 후보로 세우지 않은 문제와 그 이유입니다.

| 문제 | 뺀 이유 |
| --- | --- |
| 가비지 컬렉션 시스템(P) | 서비스 아키텍처가 아니라 언어 런타임 설계라 이 가이드의 범위 밖 |
| Instagram 사진 공유(HI · GM · DG · P) | 피드는 RD-01, 미디어 저장은 MD-01 · MD-04 에 흡수 |
| 멀티플레이 카드 게임(P) | SY-04 실시간 게임 상태 동기화에 흡수 |
| Q&A · 캘린더 · 뉴스 수집 · 가격 추적 · 자산 관리(GM · HI · P) | 앞 후보들의 조합으로 풀린다고 판단. 카탈로그 본문의 제약도 확인하지 못함 |
| 배포 시스템 · 데이터 인프라(GM) | 범위가 넓어 문제 하나로 서지 않음 |
| ML 설계 장들(XML: 유해 콘텐츠 탐지 · 광고 클릭 예측 등) | 모델 설계가 중심이라 시스템 아키텍처 가이드 범위 밖. 서빙 구조는 SR-03 에서 다룸 |
| 이미지·영상 생성 장들(XGAI) | 모델 설계가 중심. 서빙은 AI-03 에서 다룸 |
| 판타지 스포츠 대량 트래픽(B30 Dream11) | 공개 글 본문에 구조 설명이 없음 |

## 6. 인용할 때 주의할 수치

한 글 안에서, 또는 출처끼리 수치가 어긋나는 곳입니다. 어느 쪽이 맞는지 판단할 근거가 없어 본문에서는 인용하지 않거나 두 값을 함께 적습니다.

- Slack 실시간 메시징(B4): 호스트당 채널 수를 "약 1,600만"과 "수천만"으로 다르게 적습니다.
- Twitch 채팅(B11): 하루 메시지를 "100억 건 이상"과 "수천억 건"으로 다르게 적습니다.
- LinkedIn 라이브(B7): 같은 행사의 동시 시청자를 1,800만 명과 8,000만 명으로 말합니다. 발표 요약본 기준입니다.
- Character.AI(D39): 기법별 효과 수치가 2차 요약마다 다르고 원문 기술 글은 열지 못했습니다.
- Redlock(D28): Redis 공식 문서와 Kleppmann 의 입장이 충돌합니다. 가이드에 둘 다 싣고 어느 쪽이 옳다고 단정하지 않습니다.
- Bitpanda(C29): 게시일 표기 "06.11.2025"가 6월 11일인지 11월 6일인지 확인 안 함입니다.
- Uber LedgerStore(C7): 절감액은 인덱스 글이 연 600만 달러 이상이라고 쓰고, 이전 글에서는 금액을 확인하지 못했습니다.

## 7. 확인하지 못한 것

원문을 열지 못했거나 1차 자료를 찾지 못한 주제입니다. 해당 후보를 쓸 때 다시 찾습니다.

- 국내 티켓팅·대기실(인터파크 · 멜론티켓 · 티켓링크), 숙박 중복 예약(Airbnb · Booking.com), 배달 배차(DoorDash · Uber Eats · 배민 라이더)의 1차 기술 글.
- 열지 못한 글: Airbnb 이중 결제 방지(403), DoorDash 주문 워크플로(403), Tinder 위치 샤딩, Alibaba 쌍11 재고(429), 여기어때 쿠폰(403), Instacart 자동완성(403), Reddit 조회수 집계, Netflix 기술 블로그(403), OpenAI PostgreSQL 원문(403, InfoQ 요약만 확인), 카카오 캐시 팜(본문 없음).
- 실시간 리더보드 · HQ Trivia · WeChat 설 홍바오 · Coinbase 시세 전달의 1차 자료.
- URL 단축 · 이메일 대량 발송 · 대용량 업로드의 기업 1차 글. 카탈로그 근거만 있습니다.
- 카탈로그 쪽: Alex Xu 1·2권의 권 구분은 목차 페이지가 직접 밝히지 않아 조사자가 대조해 나눴습니다. Hello Interview 일부(Strava · Google Docs · 온라인 경매)는 유료라 수치가 없고, 처리율 제한기 페이지는 열리지 않았습니다. DDIA 2판 목차는 출판사 페이지가 403 이라 2차 정리로만 봤습니다.
- 2차 자료로만 확인한 근거: D1 Twitter(강연 요약), D18 Netflix Open Connect(APNIC 기고), D36 OpenAI(InfoQ), D43 토스증권 시세(기사), B18 Hotstar 이모지(재게시), B19 Netflix Pushy(InfoQ). 가이드 본문에서는 2차 자료라고 밝히고 씁니다.

## 8. 출처

### 8-1. 설계 문제 카탈로그

| 약어 | 카탈로그 | 비고 |
| --- | --- | --- |
| XU1 · XU2 | [Alex Xu, 『System Design Interview』 1·2권 (ByteByteGo 코스 목차)](https://bytebytego.com/courses/system-design-interview) | 권 구분은 조사자 대조 결과 |
| P | [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 풀이 8건 + 추가 질문 목록. 풀이 경로는 `solutions/system_design/<이름>/` |
| HI | [Hello Interview — Problem Breakdowns](https://www.hellointerview.com/learn/system-design/problem-breakdowns/overview) | 개별 문제는 `/problem-breakdowns/<이름>` |
| GM | [Educative — Grokking Modern System Design Interview](https://www.educative.io/courses/grokking-modern-system-design-interview) | |
| DG | [DesignGurus — Grokking the System Design Interview](https://www.designgurus.io/course/grokking-the-system-design-interview) | |
| XGAI | [ByteByteGo — Generative AI System Design Interview](https://bytebytego.com/courses/genai-system-design-interview/introduction-and-overview) | 장 제목만 확인 |
| XML | [ByteByteGo — Machine Learning System Design Interview](https://bytebytego.com/courses/machine-learning-system-design-interview) | 장 제목만 확인 |
| — | [Xu — 호텔 예약](https://bytebytego.com/courses/system-design-interview/hotel-reservation-system) · [Xu — 실시간 게임 리더보드](https://bytebytego.com/courses/system-design-interview/real-time-gaming-leaderboard) | CT-08 · RT-09 의 수치 |

### 8-2. 실시간 전달 · 협업 (B)

| ID | 회사 · 글 | 게시일 |
| --- | --- | --- |
| B1 | [Discord — How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages) | 2023-03-06 |
| B2 | [Discord — Maxjourney: a Million+ Online Users in a Single Server](https://discord.com/blog/maxjourney-pushing-discords-limits-with-a-million-plus-online-users-in-a-single-server) | 2023-10-25 |
| B3 | [Discord — How Discord Scaled Elixir to 5,000,000 Concurrent Users](https://discord.com/blog/how-discord-scaled-elixir-to-5-000-000-concurrent-users) | 2017-07-06 |
| B4 | [Slack — Real-time Messaging](https://slack.engineering/real-time-messaging/) | 2023-04-11 |
| B5 | [Slack — Flannel: An Application-Level Edge Cache](https://slack.engineering/flannel-an-application-level-edge-cache-to-make-slack-scale/) | 2017-05-31 |
| B6 | [LinkedIn — Real-Time Presence Platform](https://www.linkedin.com/blog/engineering/product-design/now-you-see-me-now-you-dont-linkedins-real-time-presence-platf) | 2018-01-12 |
| B7 | [LinkedIn — Streaming a Million Likes/Second (InfoQ 발표)](https://www.infoq.com/presentations/linkedin-play-akka-distributed-systems) | 확인 안 함(QCon 2022) |
| B8 | [Phoenix — The Road to 2 Million Websocket Connections](https://phoenixframework.org/blog/the-road-to-2-million-websocket-connections) | 2015-11-03 |
| B9 | [WhatsApp — 1 million is so 2011](https://blog.whatsapp.com/1-million-is-so-2011) | 2012-01-06 |
| B10 | [Facebook — Building Mobile-First Infrastructure for Messenger](https://engineering.fb.com/2014/10/09/production-engineering/building-mobile-first-infrastructure-for-messenger/) | 2014-10-09 |
| B11 | [Twitch Engineering: An Introduction and Overview](https://blog.twitch.tv/en/2015/12/18/twitch-engineering-an-introduction-and-overview-a23917b71a25) | 2015-12-18 |
| B12 | [Fastly — Reddit on building and scaling r/place](https://www.fastly.com/blog/reddit-on-building-scaling-rplace) | 2017-09-06 |
| B13 | [Figma — How Figma's multiplayer technology works](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) | 2019-10-16 |
| B14 | [Figma — LiveGraph: real-time data fetching](https://www.figma.com/blog/livegraph-real-time-data-fetching-at-figma/) | 2021-10-14 |
| B15 | [Linear — Scaling the Linear Sync Engine](https://linear.app/now/scaling-the-linear-sync-engine) · 구조는 [비공식 분석](https://github.com/wzhudev/reverse-linear-sync-engine) | 2023-06-29 |
| B16 | [Uber — Next Gen Push Platform on gRPC](https://www.uber.com/blog/ubers-next-gen-push-platform-on-grpc/) | 2022-08-16 |
| B17 | [Riot Games — Peeking into VALORANT's Netcode](https://www.riotgames.com/en/news/peeking-valorants-netcode) | 2020-07-28 |
| B18 | [High Scalability — Capturing A Billion Emo(j)i-ons (Hotstar 글 재게시)](https://highscalability.com/capturing-a-billion-emo-j-i-ons/) | 2024-03-26 |
| B19 | [InfoQ — Netflix Pushy (2차 요약)](https://www.infoq.com/news/2024/09/netflix-pushy-websocket) | 2024-09-23 |
| B20 | [Facebook — Live Commenting: Behind the Scenes](https://engineering.fb.com/2011/02/07/core-infra/live-commenting-behind-the-scenes/) | 2011-02-07 |
| B21 | [Barber 외 — Bladerunner (SOSP '21)](https://www.eecg.utoronto.ca/~stumm/Papers/Barber-sosp-21.pdf) | 2021-10 |
| B22 | [Shopify — Server-Sent Events Data Streaming](https://shopify.engineering/server-sent-events-data-streaming) | 2022-11-30 |
| B23 | [Jaz — Jetstream: Shrinking the AT Protocol Firehose](https://jazco.dev/2024/09/24/jetstream/) | 2024-09-24 |
| B24 | [Notion — How we made Notion available offline](https://notion.com/blog/how-we-made-notion-available-offline) | 2025-12-11 |
| B25 | [Canva — Enabling real-time collaboration with RSocket](https://www.canva.dev/blog/engineering/enabling-real-time-collaboration-with-rsocket/) | 2021-05-27 |
| B26 | [LINE — How LINE messaging servers prepare for New Year's traffic](https://engineering.linecorp.com/en/blog/how-line-messaging-servers-prepare-for-new-years-traffic/) | 2020-04-14 |
| B27 | [Zed — How CRDTs make multiplayer text editing part of Zed's DNA](https://zed.dev/blog/crdts) | 2022-12-01 |
| B28 | [Google Wave — Operational Transformation 백서](https://apache.googlesource.com/incubator-retired-wave/+/refs/tags/wave-0.4-rc1/whitepapers/operational-transform/operational-transform.html) | 2010-07 |
| B29 | [Trade Republic — Real-Time Bond Yield to Maturity](https://traderepublic.substack.com/p/real-time-bond-yield-to-maturity) | 2025-01-27 |
| B30 | [AWS — Scaling fantasy sports platform (Dream11)](https://aws.amazon.com/blogs/architecture/scaling-fantasy-sports-platform) | 2020-09-01 |

### 8-3. 거래 · 커머스 · 위치 (C)

| ID | 회사 · 글 | 게시일 |
| --- | --- | --- |
| C1 | [Stripe — Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency) | 2017-02-22 |
| C2 | [Shopify — Building Resilient Payment Systems](https://shopify.engineering/building-resilient-payment-systems) | 2022-07-28 |
| C3 | [토스페이먼츠 — 멱등성이 뭔가요?](https://www.tosspayments.com/blog/articles/dev-1) | 2023-01-11 |
| C4 | [카카오페이 — MSA 환경에서 네트워크 예외를 잘 다루는 방법](https://tech.kakaopay.com/post/msa-transaction/) | 2022-05-25 |
| C5 | [카카오페이 — 유저향 서비스를 개발하며 마주쳤던 이슈와 해결 방안](https://tech.kakaopay.com/post/troubleshooting-logs-as-a-junior-developer/) | 2024-11-05 |
| C6 | [Uber — Uber's Payments Platform](https://www.uber.com/blog/ubers-payments-platform) | 2026-08-06 |
| C7 | [Uber — How LedgerStore Supports Trillions of Indexes](https://www.uber.com/blog/how-ledgerstore-supports-trillions-of-indexes/) · [Migrating from DynamoDB to LedgerStore](https://www.uber.com/blog/migrating-from-dynamodb-to-ledgerstore/) | 2024-04-04 · 2024-04-11 |
| C8 | [Square — Books, an immutable double-entry accounting database service](https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/) | 2019-10-16 |
| C9 | [Stripe — Ledger: tracking and validating money movement](https://stripe.dev/blog/ledger-stripe-system-for-tracking-and-validating-money-movement) | 2024-02-16 |
| C10 | [토스페이먼츠 — 레거시 결제 원장을 확장 가능한 시스템으로](https://toss.tech/article/payments-legacy-5) | 2025-12-01 |
| C11 | [Modern Treasury — How to Scale a Ledger, Part I (제품 회사 글, 개념용)](https://www.moderntreasury.com/journal/how-to-scale-a-ledger-part-i) | 2022-11-10 |
| C12 | [Shopify — Scaling inventory reservations](https://shopify.engineering/scaling-inventory-reservations) | 2026-05-12 |
| C13 | [우아한형제들 — 누군가에게는 빼빼로데이](https://techblog.woowahan.com/2514/) | 2016-11-28 |
| C14 | [우아한형제들 — 프로모션 시스템 엿보기](https://techblog.woowahan.com/10795/) | 2023-03-21 |
| C15 | [CJ올리브영 — 올영세일 선착순 쿠폰, 미발급 0%를 향한 여정](https://oliveyoung.tech/2025-12-15/fcfs-coupon/) | 2025-12-15 |
| C16 | [토스 — 서버 증설 없이 처리하는 대규모 트래픽](https://toss.tech/article/monitoring-traffic) | 2024-05-13 |
| C17 | [인프랩 — 2022년 1월 100% 할인 이벤트 장애 부검](https://tech.inflab.com/202201-event-postmortem/) | 2022-02-01 |
| C18 | [컬리 — 풀필먼트 입고 서비스팀에서 분산락을 사용하는 방법](https://helloworld.kurly.com/blog/distributed-redisson-lock/) | 2023-05-18 |
| C19 | [우아한형제들 — WMS 재고 이관을 위한 분산 락 사용기](https://techblog.woowahan.com/17416/) | 2024-05-28 |
| C20 | [CJ올리브영 — 신규 재고 시스템 구축을 위한 개발 여정](https://oliveyoung.tech/2023-10-04/inventory-project/) | 2023-10-04 |
| C21 | [SeatGeek — High Demand Ticket On-Sales (InfoQ 발표)](https://www.infoq.com/presentations/ticketing-system-virtual-waiting-room/) | 2022-12-29 |
| C22 | [Cloudflare — Building Waiting Room on Workers and Durable Objects](https://blog.cloudflare.com/building-waiting-room-on-workers-and-durable-objects) | 2021-06-16 |
| C23 | [Martin Fowler — The LMAX Architecture](https://martinfowler.com/articles/lmax.html) · [LMAX Disruptor 논문](https://lmax-exchange.github.io/disruptor/disruptor.html) | 2011-07-12 |
| C24 | [Coinbase — How to Build an Exchange (InfoQ 발표)](https://www.infoq.com/presentations/exchange-systems-cloud) | 2026-04-23 기록 |
| C25 | [Uber — H3: Hexagonal Hierarchical Spatial Index](https://www.uber.com/blog/h3/) | 2018-06-27 |
| C26 | [Lyft — Geospatial Indexing at Scale (RedisConf17 슬라이드)](https://www.slideshare.net/slideshow/redisconf17-lyft-geospatial-at-scale-daniel-hochman/77087313) | 2017 |
| C27 | [Uber — Fulfillment Platform Rearchitecture](https://www.uber.com/blog/fulfillment-platform-rearchitecture) | 2021-07-27 |
| C28 | [Mercari — Order Management in Mercari Global Marketplace](https://engineering.mercari.com/en/blog/entry/20251010-order-management-in-mercari-global-marketplace/) | 2025-10-10 |
| C29 | [Bitpanda — Coordinated custom Saga pattern](https://blog.bitpanda.com/en/bitpandas-new-trade-engine-part-4-coordinated-custom-saga-pattern-atomic-trade-booking) | 확인 안 함 |
| C30 | [Mercari — Cloud Spanner와 Pub/Sub로 구현하는 Transactional outbox(일본어)](https://engineering.mercari.com/blog/entry/20211221-transactional-outbox/) | 2021-12-21 |
| C31 | [Zalando — Transactional outbox with DynamoDB and Lambda](https://engineering.zalando.com/posts/2022/02/transactional-outbox-with-aws-lambda-and-dynamodb.html) | 2022-02-03 |
| C32 | [Shopify — High Availability by Offloading Work Into the Background](https://shopify.engineering/high-availability-background-jobs) | 2021-07-08 |
| C33 | [Debezium — Outbox Pattern (튜토리얼, 회사 사례 아님)](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/) | 2019-02-19 |

### 8-4. 데이터 · 검색 · 미디어 · 인프라 · AI (D)

| ID | 회사 · 글 | 게시일 |
| --- | --- | --- |
| D1 | [High Scalability — Twitter 타임라인 구조(강연 요약, 2차)](https://highscalability.com/the-architecture-twitter-uses-to-deal-with-150m-active-users/) · [InfoQ — Timelines at Scale](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/) | 2013 |
| D2 | [LinkedIn — FollowFeed](https://www.linkedin.com/blog/engineering/feed/followfeed-linkedin-s-feed-made-faster-and-smarter) | 2016-03-31 |
| D3 | [Pinterest — Pixie (arXiv, 초록만)](https://arxiv.org/abs/1711.07601) | 2017-11-21 |
| D4 | [Google — Deep Neural Networks for YouTube Recommendations (초록만)](https://research.google/pubs/deep-neural-networks-for-youtube-recommendations/) | 2016 |
| D5 | [AWS — How Karrot built a feature platform, Part 1 (당근)](https://aws.amazon.com/blogs/architecture/how-karrot-built-a-feature-platform-on-aws-part-1-motivation-and-feature-serving/) | 2025-08-14 |
| D6 | [토스 — 토스증권 추천과 검색은 어떻게 진화하고 있을까?](https://toss.tech/article/52627) | 2026-08-26 |
| D7 | [Spotify — Introducing Voyager](https://engineering.atspotify.com/2023/10/introducing-voyager-spotifys-new-nearest-neighbor-search-library) | 2023-10-25 |
| D8 | [Discord — How Discord Indexes Billions of Messages](https://discord.com/blog/how-discord-indexes-billions-of-messages) | 2017-03-16 |
| D9 | [Uber — Evolution of Uber's search platform](https://uber.com/blog/evolution-of-ubers-search-platform) | 2025-06-20 |
| D10 | [LY — 일본어 상품 검색 정확도 높이기](https://techblog.lycorp.co.jp/ko/japanese-search-kuromoji-to-sudachi) | 확인 안 함 |
| D11 | [Uber — Real-time Exactly-Once Ad Event Processing](https://uber.com/blog/real-time-exactly-once-ad-event-processing/) | 2021-09-23 |
| D12 | [Uber — M3](https://www.uber.com/blog/m3/) | 2018-08-07 |
| D13 | [Netflix — Atlas 문서](https://netflix.github.io/atlas-docs/overview/) | 확인 안 함 |
| D14 | [Cloudflare — HTTP Analytics for 6M requests per second using ClickHouse](https://blog.cloudflare.com/http-analytics-for-6m-requests-per-second-using-clickhouse/) | 2018-03-06 |
| D15 | [우아한형제들 — 100만 TPS 로그 시스템, KEDA를 이용한 오토스케일링](https://techblog.woowahan.com/24405/) | 2025-11-27 |
| D16 | [토스 — ksqlDB를 활용한 증권사의 실시간 데이터 처리하기](https://toss.tech/article/ksqldb-realtime-data) | 2024-07-17 |
| D17 | [Meta — Broadcasting live video to millions](https://engineering.fb.com/2015/12/03/ios/under-the-hood-broadcasting-live-video-to-millions/) | 2015-12-03 |
| D18 | [APNIC — Netflix content distribution through Open Connect (2차)](https://blog.apnic.net/2018/06/20/netflix-content-distribution-through-open-connect/) | 2018-06-20 |
| D19 | [Dropbox — Rewriting the heart of our sync engine](https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine) | 2020-03-09 |
| D20 | [Dropbox — Lepton image compression](https://dropbox.tech/infrastructure/lepton-image-compression-saving-22-losslessly-from-images-at-15mbs) | 2016-07-14 |
| D21 | [Stripe — Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters) | 2017-03-30 |
| D22 | [Cloudflare — Counting things, a lot of different things](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/) | 2017-06-07 |
| D23 | [GitHub — Sharded, replicated rate limiter in Redis](https://github.blog/engineering/infrastructure/how-we-scaled-github-api-sharded-replicated-rate-limiter-redis/) | 2021-04-05 |
| D24 | [Twitter — Snowflake README](https://github.com/twitter-archive/snowflake/tree/snowflake-2010) | 확인 안 함 |
| D25 | [Facebook — Scaling Memcache at Facebook](https://engineering.fb.com/2013/04/15/core-infra/scaling-memcache-at-facebook/) · [NSDI '13 논문](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf) | 2013-04 |
| D26 | [Bronson 외 — TAO (USENIX ATC '13)](https://files.usenix.org/s3fs-public/cdn/atc13-bronson.pdf) | 2013 |
| D27 | [Werner Vogels — Amazon's Dynamo](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html) | 2007-10-02 |
| D28 | [Redis — Distributed Locks](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) · [Kleppmann — How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) | 확인 안 함 · 2016-02-08 |
| D29 | [Google SRE Book — Distributed Periodic Scheduling with Cron](https://sre.google/sre-book/distributed-periodic-scheduling/) | 확인 안 함 |
| D30 | [Zyte — Distributed Frontera](https://www.zyte.com/blog/distributed-frontera-web-crawling-at-large-scale/) | 2015-08-06 |
| D31 | [우아한형제들 — 메시지 발송 이중화 여정기](https://techblog.woowahan.com/7724/) | 2022-03-16 |
| D32 | [우아한형제들 — Server-Sent Events로 실시간 알림 전달하기](https://techblog.woowahan.com/23199/) | 2025-10-24 |
| D33 | [우아한형제들 — 배차 정확도를 높이는 실거리 시스템 구축하기](https://techblog.woowahan.com/22396/) | 2025-06-26 |
| D35 | [LY — 대규모 Redis를 운영하며 살아남기](https://techblog.lycorp.co.jp/ko/running-redis-at-scale) | 확인 안 함 |
| D36 | [InfoQ — OpenAI runs ChatGPT on Postgres (2차 요약)](https://www.infoq.com/news/2026/02/openai-runs-chatgpt-postgres) | 2026-02-12 |
| D37 | [vLLM — PagedAttention 블로그](https://vllm.ai/blog/2023-06-20-vllm) | 2023-06-20 |
| D38 | [Cloudflare — Infire inference engine](https://blog.cloudflare.com/cloudflares-most-efficient-ai-inference-engine/) | 2025-08-27 |
| D39 | [Character.AI — Optimizing AI Inference](https://blog.character.ai/optimizing-ai-inference-at-character-ai/) | 2024-06-20 |
| D40 | [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | 2025-06-13 |
| D41 | [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) | 2024-09-19 |
| D42 | [Anthropic — Prompt caching 문서](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | 확인 안 함 |
| D43 | [바이라인네트워크 — 토스증권 시스템 아키텍처(2차)](https://byline.network/2022/06/10-234/) | 2022-06-12 |

D34 는 B26 과 같은 글이라 번호만 비워 두었습니다.

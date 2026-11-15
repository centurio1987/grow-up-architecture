# DB 스키마 설계 학습 가이드

`index.html`을 브라우저에서 열면 됩니다. 본문, 폰트, 도식이 내장되어 오프라인에서도 읽을 수 있습니다. 출처 링크는 인터넷 연결이 필요합니다.

- 15개 절, 선행 산출물 14종의 작성 절차·완료 기준·후속 학습 단서
- 영속화 결정표, 주문 사례, 정합성·정규화·물리 설계·검증
- 원전·표준·공식 문서 중심의 출처 20개
- 산출물 검색, 저장 판단 질문 도우미, 체크리스트, 작업 양식 다운로드

## 파일

- `index.html`: 완성 HTML. 이 파일 하나로 공유할 수 있습니다.
- `example.sql`: PostgreSQL 18 교육용 DDL과 샘플 데이터.
- `diagrams.tsx`: `~/resume`의 실제 viz 컴포넌트·스타일·프레임을 이용하는 도식 소스.
- `assets/*.png`: `~/resume/scripts/render-viz.ts`로 생성한 도식 4개.
- `build_guide.py`: HTML 재생성 소스. 이 컴퓨터의 resume 폰트·도식을 읽습니다.
- `verify.mjs`: HTML 표시와 인터랙션 검증.
- `verification/`: 검증 기록과 화면 캡처.

## 재생성

프로젝트 루트에서 실행합니다. 도식은 기존 resume 렌더러가 resume/.work 임시 번들을 작성하고 브라우저를 실행합니다. 렌더러의 Bun 번들 경로가 실패하는 환경에서는 기존 esbuild 폴백을 사용합니다. 외부 폰트 차단 경고가 있어도 로컬 IBM Plex 폰트와 페인트·기하 검사가 통과한 결과를 사용했습니다.

```sh
bun /Users/centurio/resume/scripts/render-viz.ts --module "$PWD/docs/db-schema-guide/diagrams.tsx" --name Pipeline --out "$PWD/docs/db-schema-guide/assets/pipeline.png" --width 1100
bun /Users/centurio/resume/scripts/render-viz.ts --module "$PWD/docs/db-schema-guide/diagrams.tsx" --name Timeline --out "$PWD/docs/db-schema-guide/assets/timeline.png" --width 1100
bun /Users/centurio/resume/scripts/render-viz.ts --module "$PWD/docs/db-schema-guide/diagrams.tsx" --name Boundary --out "$PWD/docs/db-schema-guide/assets/boundary.png" --width 1100
bun /Users/centurio/resume/scripts/render-viz.ts --module "$PWD/docs/db-schema-guide/diagrams.tsx" --name Relations --out "$PWD/docs/db-schema-guide/assets/relations.png" --width 1100
python3 docs/db-schema-guide/build_guide.py
bun docs/db-schema-guide/verify.mjs
```

## 검증 범위

HTML 검증 결과는 `verification/report.json`에 기록됩니다. 데스크톱·모바일 가로 넘침, 이미지 4개 로딩, 내부 링크, ID 중복, 검색·펼침·판단 도우미 8조합·체크·작업 양식 저장·인쇄 시 상세 펼침, 실행 오류와 외부 요청을 확인합니다. 도식 4개와 주요 페이지 화면을 육안 점검합니다.

PostgreSQL 실행 파일이 이 환경에 없어 `example.sql`은 DB에서 실행하지 않았습니다. DDL은 상태 전이 연속성·주문 항목 최소 개수·불변 필드 등을 단독으로 강제하지 않으며, 본문에 설명한 트랜잭션과 단일 쓰기 경로가 필요합니다. 운영 보존 기간·접근권한·부하 성능·마이그레이션은 교육용 예제 밖에서 확정하고 검증해야 합니다.

조사·작성: 2026-09-22.

# Design Pattern Guide — 연습 환경

GoF 디자인 패턴 23편과 Fowler 분석 패턴 10편의 **한국어 가이드**를 쓰고, 그 예시 코드를 **Java / TypeScript / Rust** 세 언어로 돌려 대조하는 작업 공간이다.

가이드의 구현 절은 **세 언어**가 **글자 단위로 같은 출력**을 내는 것을 검사로 강제한다(`scripts/check-guides.py --run`). `python/` 은 그 셋에 들지 않는 **연습용 하니스**이고 가이드 예시 코드에는 쓰이지 않는다.

## 디렉토리 구조

```
.
├── pattern-guide/                 # 가이드 정본 — 한 편이 폴더 하나
│   ├── design-pattern-guide/<슬러그>/      # GoF 23편
│   ├── ddd-analysis-pattern-guide/<슬러그>/ # 분석 패턴 10편 + 인덱스 README
│   ├── reference/<슬러그>/                  # 참고 문서(주제 밖 사전 지식)
│   ├── research/                            # 리서치 노트 · 회계 배경 확정안
│   ├── consideration/                       # 심화 검토 문서
│   ├── gate-results.jsonl                   # 편마다 게이트 판정 한 줄
│   └── gate-logs/                           # 채점 산출물
├── .claude/authoring/specs/       # 집필 명세(gof-guide · analysis-guide · …) — 골격의 정본
├── .claude/skills/                # 진입 스킬(가이드 집필 · 코드 부합도 분석)
├── scripts/                       # check-guides.py · render-guides.py · render-viz.ts
├── KANBAN.md · KANBAN/            # 보드와 카드·배치·검토 문서
├── analysis/                      # 코드 부합도 분석 결과
├── python/ typescript/ rust/ java/  # 연습 하니스(가이드 예시 코드와 별개)
├── Makefile                       # 연습 하니스의 통합 진입점
└── PATTERNS.md · README.md
```

## 사전 준비 (macOS, 한 번만)

Homebrew는 이미 설치되어 있다고 가정한다.

```bash
# 1. Python 패키지 매니저 uv
brew install uv

# 2. Node는 이미 설치되어 있다고 가정 (없다면 brew install node)

# 3. Rust 툴체인
#    최신 brew `rustup` 포뮬러는 keg-only 이며 `rustup-init` 을 더 이상 제공하지 않는다.
brew install rustup
echo 'export PATH="/opt/homebrew/opt/rustup/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
rustup default stable    # cargo / rustc 설치

# 4. Java (JDK 21 LTS) + Gradle
brew install openjdk@21 gradle
# brew가 안내하는 sudo ln -sfn ... 명령으로 JDK를 시스템에 등록한다.
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc

# 첫 셋업 시 1회만: Gradle Wrapper 생성 (이후로는 ./gradlew 사용 가능)
cd java && gradle wrapper --gradle-version 8.10 && cd ..
```

설치 상태 점검:

```bash
make doctor
```

## 연습 하니스 — 의존성 동기화

```bash
make setup        # 네 언어 모두
# 또는 개별로
make setup-py
make setup-ts
make setup-rs
make setup-java
```

## 연습 하니스 — 실행

아래 `make` 진입점과 표는 전부 **연습 하니스**(`python/` · `typescript/` · `rust/` · `java/`)의 것이다. **가이드 예시 코드와는 별개**다 — 가이드의 코드는 편마다 그 폴더(`pattern-guide/<계열>/<슬러그>/`) 안에 놓이고, `scripts/check-guides.py --compile --run` 이 따로 돌린다.

네 언어 모두에 `Singleton` 샘플이 들어 있다. 동작 확인:

```bash
make py   PATTERN=singleton
make ts   PATTERN=singleton
make rs   PATTERN=singleton
make java PATTERN=Singleton     # Java는 클래스명이므로 PascalCase
```

하니스에 새 패턴 코드를 추가할 때는 언어별 컨벤션을 따른다.

| 언어 | 추가 위치 | 파일명 컨벤션 | 실행 |
| --- | --- | --- | --- |
| Python | `python/patterns/` | `factory_method.py` (snake_case) | `make py PATTERN=factory_method` |
| TypeScript | `typescript/src/` | `factory-method.ts` (kebab-case) | `make ts PATTERN=factory-method` |
| Rust | `rust/examples/` | `factory_method.rs` (snake_case) | `make rs PATTERN=factory_method` |
| Java | `java/src/main/java/patterns/` | `FactoryMethod.java` (PascalCase) | `make java PATTERN=FactoryMethod` |

## 패턴 가이드 문서

GoF 23개 패턴과 분석 패턴 10개의 한국어 가이드가 `pattern-guide/<계열>/<패턴>/<패턴>-guide_v<버전>.md` 형태로 있다. 가이드 한 편이 폴더 하나를 갖고, 같은 폴더에 렌더된 HTML·예시 코드·도식이 함께 놓인다. 최신은 버전이 가장 높은 파일이다. 전체 목록과 한 줄 요약은 [PATTERNS.md](PATTERNS.md) 참조.

새 가이드 추가나 기존 가이드 보강은 `.claude/skills/design-pattern-guide/` skill 이 담당한다. "X 패턴 가이드 작성" 처럼 요청하면 트리거된다. 집필 규칙은 그 skill 이 아니라 **명세**(`.claude/authoring/specs/`)와 **voice**(`ppangtolab-teacher`)에 있고, skill 은 어느 명세로 쓸지 고르고 게이트와 발행을 끌고 가는 일만 한다.

## 코드 부합도 분석

작성한 코드가 특정 디자인 패턴의 최소 조건을 충족하는지 검사하는 `.claude/skills/design-pattern-analyzer/` skill 이 있다. "이 코드가 Observer 패턴 맞는지 분석" 같이 요청하면 정적 분석 리포트가 `analysis/` 폴더에 생성된다. 평가 기준은 (1) 같은 이름의 `<pattern>-pattern.md` 가이드의 "최소 조건" 섹션을 우선 사용하고, (2) 없으면 skill 내장 `checklist.md` 를 fallback 으로 쓴다.

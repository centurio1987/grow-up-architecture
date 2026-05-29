# Design Pattern Guide — 연습 환경

GoF/소프트웨어 디자인 패턴을 **Python / TypeScript / Rust / Java** 네 언어로 직접 구현하며 비교 학습하기 위한 로컬 작업 공간이다.

## 디렉토리 구조

```
.
├── .claude/skills/design-pattern-guide/   # 디자인 패턴 가이드 문서 작성용 skill
├── python/                        # Python 연습 (uv)
│   └── patterns/
│       └── singleton.py
├── typescript/                    # TypeScript 연습 (tsx)
│   └── src/
│       └── singleton.ts
├── rust/                          # Rust 연습 (cargo workspace, examples 기반)
│   └── examples/
│       └── singleton.rs
├── java/                          # Java 연습 (Gradle)
│   └── src/main/java/patterns/
│       └── Singleton.java
├── Makefile                       # 통합 진입점
└── README.md
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

## 의존성 동기화

```bash
make setup        # 네 언어 모두
# 또는 개별로
make setup-py
make setup-ts
make setup-rs
make setup-java
```

## 실행

각 언어마다 `Singleton` 패턴 샘플이 이미 들어 있다. 동작 확인:

```bash
make py   PATTERN=singleton
make ts   PATTERN=singleton
make rs   PATTERN=singleton
make java PATTERN=Singleton     # Java는 클래스명이므로 PascalCase
```

새 패턴을 추가할 때는 언어별 컨벤션을 따른다.

| 언어 | 추가 위치 | 파일명 컨벤션 | 실행 |
| --- | --- | --- | --- |
| Python | `python/patterns/` | `factory_method.py` (snake_case) | `make py PATTERN=factory_method` |
| TypeScript | `typescript/src/` | `factory-method.ts` (kebab-case) | `make ts PATTERN=factory-method` |
| Rust | `rust/examples/` | `factory_method.rs` (snake_case) | `make rs PATTERN=factory_method` |
| Java | `java/src/main/java/patterns/` | `FactoryMethod.java` (PascalCase) | `make java PATTERN=FactoryMethod` |

## 패턴 가이드 문서

GoF 23개 패턴의 한국어 가이드가 `pattern-guide/` 폴더에 `<pattern>-pattern.md` 형태로 모두 작성되어 있다. 전체 목록과 한 줄 요약은 [PATTERNS.md](PATTERNS.md) 참조.

새 가이드 추가나 기존 가이드 보강은 `.claude/skills/design-pattern-guide/` skill 이 담당한다. Cowork 에서 "X 패턴 가이드 작성" 처럼 요청하면 트리거된다.

## 코드 부합도 분석

작성한 코드가 특정 디자인 패턴의 최소 조건을 충족하는지 검사하는 `.claude/skills/design-pattern-analyzer/` skill 이 있다. "이 코드가 Observer 패턴 맞는지 분석" 같이 요청하면 정적 분석 리포트가 `analysis/` 폴더에 생성된다. 평가 기준은 (1) 같은 이름의 `<pattern>-pattern.md` 가이드의 "최소 조건" 섹션을 우선 사용하고, (2) 없으면 skill 내장 `checklist.md` 를 fallback 으로 쓴다.

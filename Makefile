# 디자인 패턴 연습용 통합 Makefile
# 사용법:
#   make py PATTERN=singleton       # python/patterns/singleton.py 실행
#   make ts PATTERN=singleton       # typescript/src/singleton.ts 실행
#   make rs PATTERN=singleton       # rust/examples/singleton.rs 실행
#   make java PATTERN=Singleton     # Java Singleton 클래스 실행 (PascalCase)
#   make setup                      # 각 언어 의존성 설치
#   make doctor                     # 도구 설치 상태 점검

PATTERN ?= singleton

.PHONY: help py ts rs java setup setup-py setup-ts setup-rs setup-java doctor clean

help:
	@echo "Targets:"
	@echo "  make py    PATTERN=singleton        Run Python pattern"
	@echo "  make ts    PATTERN=singleton        Run TypeScript pattern"
	@echo "  make rs    PATTERN=singleton        Run Rust pattern (cargo example)"
	@echo "  make java  PATTERN=Singleton        Run Java pattern (PascalCase class name)"
	@echo "  make setup                          Install per-language deps"
	@echo "  make doctor                         Check tool availability"

# ---- Run ----
py:
	cd python && uv run python -m patterns.$(PATTERN)

ts:
	cd typescript && npx tsx src/$(PATTERN).ts

rs:
	cd rust && cargo run --example $(PATTERN)

java:
	cd java && $(GRADLE) run -PmainClass=patterns.$(PATTERN) -q

# 우선 ./gradlew 가 있으면 사용, 없으면 시스템 gradle 호출
GRADLE := $(shell test -x java/gradlew && echo ./gradlew || echo gradle)

# ---- Setup ----
setup:
	-$(MAKE) setup-py
	-$(MAKE) setup-ts
	-$(MAKE) setup-rs
	-$(MAKE) setup-java
	@echo "All setup steps attempted. See 'make doctor' for missing tools."

setup-py:
	cd python && uv sync

setup-ts:
	cd typescript && npm install

setup-rs:
	cd rust && cargo build

setup-java:
	cd java && $(GRADLE) wrapper --gradle-version 8.10 -q && ./gradlew build -q || true

# ---- Doctor ----
# 각 도구는 "실제로 실행해서 정상 종료하는지" 로 판정한다.
# macOS의 /usr/bin/javac 는 JDK 가 없으면 더미 안내만 띄우므로 command -v 만으로는 부족.
doctor:
	@echo "=== Python ===" ; uv --version 2>/dev/null \
	  || echo "uv: NOT INSTALLED  -> brew install uv"
	@echo "=== Node ===" ; node --version 2>/dev/null \
	  || echo "node: NOT INSTALLED  -> brew install node"
	@echo "=== Rust ===" ; cargo --version 2>/dev/null \
	  || echo "cargo: NOT INSTALLED  -> brew install rustup; export PATH=\"/opt/homebrew/opt/rustup/bin:\$$PATH\"; rustup default stable"
	@echo "=== Java ===" ; javac --version 2>/dev/null \
	  || echo "javac: NOT INSTALLED (or macOS stub)  -> brew install openjdk@21; sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk; export PATH=\"/opt/homebrew/opt/openjdk@21/bin:\$$PATH\""
	@echo "=== Gradle (optional) ===" ; gradle --version 2>/dev/null | head -1 \
	  || echo "gradle: not on PATH (OK, wrapper will be used after setup-java)"

clean:
	rm -rf python/.venv python/**/__pycache__
	rm -rf typescript/node_modules typescript/dist
	rm -rf rust/target
	rm -rf java/.gradle java/build

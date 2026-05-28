# Singleton 패턴 부합도 분석

| 항목 | 값 |
| --- | --- |
| 분석 대상 | `python/patterns/singleton.py` |
| 언어 | Python |
| 분석 일시 | 2026-05-29 17:30 |
| 평가 기준 출처 | 내장 `.claude/skills/design-pattern-analyzer/checklist.md` (가이드 문서 미존재) |
| 코드 라인 수 | 35 |

## 종합 판정

**변형 패턴 (Pythonic Singleton)**

`__new__` 오버라이드로 단일 인스턴스 반환을 보장하고 `__init__` 재초기화도 가드되어 있어 핵심 효과(조건 2)는 명확히 충족된다. 다만 외부 생성 차단(조건 1)과 전역 접근점(조건 3) 은 Java/TS 식의 "명시적 차단 + getInstance" 가 아니라 "어떻게 불러도 같은 객체" 라는 Python 관용구로 대체된 형태라 정통 GoF 형태에서는 살짝 벗어난다. 스레드 안전(선택 조건) 은 보장되지 않는다.

---

## 조건별 평가

### 조건 1. 외부 생성 차단 — 외부 코드가 생성자 직접 호출로 새 인스턴스를 만들 수 없어야 한다
**판정**: ⚠️ 부분 충족

**근거**: `python/patterns/singleton.py:12-15`

```python
def __new__(cls) -> "Singleton":
    if cls._instance is None:
        cls._instance = super().__new__(cls)
    return cls._instance
```

**해설**: `Singleton()` 호출 자체는 외부에서 자유롭게 가능하다. 그러나 `__new__` 가 이미 만들어진 `cls._instance` 를 그대로 돌려주므로 "새 인스턴스가 생성된다" 라는 결과는 차단된다. Java 의 `private constructor` 처럼 호출을 막는 형태는 아니지만, Python 에서는 이 방식이 관용으로 받아들여진다. 정통 형태로 가려면 `__init_subclass__` 활용이나 메타클래스를 통한 방어, 또는 모듈 단위 단일체로 전환을 고려할 수 있다.

---

### 조건 2. 단일 인스턴스 보장 — 어떤 경로로 접근하더라도 동일 객체를 반환
**판정**: ✅ 충족

**근거**: `python/patterns/singleton.py:10-15, 27-30`

```python
class Singleton:
    _instance: "Singleton | None" = None

    def __new__(cls) -> "Singleton":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

```python
a = Singleton()
b = Singleton()
print(f"a is b: {a is b}")
print(f"id(a)={id(a)}, id(b)={id(b)}")
```

**해설**: 클래스 변수 `_instance` 에 단일 객체를 보관하고 `__new__` 가 항상 그것을 반환한다. 또한 `__init__` 에서 `_initialized` 플래그로 재초기화를 막아 상태가 덮어써지는 부작용도 방지했다. 실행 검증에서도 `a is b: True` 와 `id(a) == id(b)` 가 확인된다.

---

### 조건 3. 전역 접근점 제공 — `getInstance()` 류의 단일 진입점이 존재
**판정**: ⚠️ 부분 충족

**근거**: `python/patterns/singleton.py:9, 27-28`

```python
class Singleton:
    ...
```

```python
a = Singleton()
b = Singleton()
```

**해설**: 명시적 `getInstance()` 메서드는 없다. 진입점은 클래스 호출 `Singleton()` 그 자체이다. Python 관용에서는 이를 자연스럽게 받아들이지만, GoF 정통 시그니처를 엄격히 보면 "전역 접근점이 메서드 형태로 노출되었는가" 라는 질문에는 No 에 가깝다. 가독성을 위해 `Singleton.instance()` 같은 클래스 메서드를 추가하는 것을 권장한다.

---

### 조건 4 (선택). 스레드 안전 — 멀티스레드 환경에서 동시 초기화 보호
**판정**: ❌ 미충족

**근거**: `python/patterns/singleton.py:12-15`

```python
def __new__(cls) -> "Singleton":
    if cls._instance is None:
        cls._instance = super().__new__(cls)
    return cls._instance
```

**해설**: `_instance is None` 확인과 할당 사이에 어떤 동기화도 없다. 두 스레드가 거의 동시에 `Singleton()` 을 호출하면 두 개의 인스턴스가 만들어진 뒤 한쪽이 다른 한쪽을 덮어쓰는 경합 상태가 발생할 수 있다. CPython 의 GIL 이 우연히 막아주는 경우가 많지만, 의도된 안전성은 아니다. 멀티스레드 사용을 가정한다면 `threading.Lock` 을 도입해야 한다.

---

## 언어 관용구 측면

Python 에서는 GoF Singleton 의 의도(전역 단일 객체)를 다음 세 방식으로 자주 표현한다.

1. **모듈 자체를 단일체로** — Python 모듈은 인터프리터 수명 동안 1번만 import 되어 자연스럽게 Singleton 이 된다. 클래스/메서드 없이 모듈 변수와 함수만으로 충분한 경우 최단 경로다.
2. **클래스 + 클래스 메서드** — `Singleton.instance()` 식의 명시적 진입점을 제공해 GoF 형태에 가까이 맞춘다.
3. **메타클래스** — 메타클래스의 `__call__` 에서 인스턴스 캐싱을 처리해 여러 클래스에 재사용 가능한 Singleton 메커니즘을 만든다.

현재 코드는 4번째 방식인 `__new__` 오버라이드인데, 짧고 명확하지만 호출이 `Singleton()` 형태라 "한 번만 만들어진다" 라는 의도가 호출 측에서 즉시 드러나지 않는다는 약점이 있다.

## 테스트 / 동작 검증

- 실행 명령: `cd python && python3 -m patterns.singleton`
- 출력:

```
a is b: True
id(a)=276121594151120, id(b)=276121594151120
created_at: first-init
```

- 결론: 조건 2(단일 인스턴스 보장) 가 런타임에서 명시적으로 입증되었다. 동일 id, `is` 비교 True, 그리고 `created_at` 이 첫 초기화 값으로 유지됨.

## 권장 조치 (우선순위 순)

1. **명시적 진입점 추가 (조건 3 보강)** — 클래스 메서드 `instance()` 를 추가해 의도를 코드에 드러낸다. `__new__` 의 동작은 그대로 두어 잘못된 직접 호출도 안전.

   ```python
   # before
   class Singleton:
       _instance: "Singleton | None" = None
       def __new__(cls) -> "Singleton":
           ...

   # after
   class Singleton:
       _instance: "Singleton | None" = None

       @classmethod
       def instance(cls) -> "Singleton":
           if cls._instance is None:
               cls._instance = cls()
           return cls._instance

       def __new__(cls) -> "Singleton":
           if cls._instance is None:
               cls._instance = super().__new__(cls)
           return cls._instance
   ```

2. **스레드 안전 보강 (조건 4)** — `threading.Lock` 으로 더블 체크.

   ```python
   import threading

   class Singleton:
       _instance: "Singleton | None" = None
       _lock = threading.Lock()

       def __new__(cls) -> "Singleton":
           if cls._instance is None:
               with cls._lock:
                   if cls._instance is None:
                       cls._instance = super().__new__(cls)
           return cls._instance
   ```

3. **(선택) 직접 생성 차단 시그널** — 외부에서 `Singleton()` 호출을 금하고 싶다면 명시적 가드를 둘 수 있다. 다만 Python 에서는 강제력이 약하므로 문서화로 끝내는 것이 일반적.

   ```python
   class Singleton:
       _instance: "Singleton | None" = None
       _allow_init = False  # only instance() may flip this

       @classmethod
       def instance(cls) -> "Singleton":
           if cls._instance is None:
               cls._allow_init = True
               cls._instance = cls()
               cls._allow_init = False
           return cls._instance

       def __init__(self) -> None:
           if not type(self)._allow_init and type(self)._instance is not None:
               raise RuntimeError("Use Singleton.instance() instead of direct construction.")
   ```

## 추가 코멘트

- **테스트 용이성**: 클래스 상태(`_instance`)가 전역이라 테스트 간 격리가 어렵다. 테스트마다 `Singleton._instance = None` 으로 리셋하는 fixture 를 두어야 한다.
- **직렬화/리플렉션 우회**: pickle 등으로 직렬화/역직렬화 시 새 인스턴스가 만들어질 수 있다. 운영용이라면 `__reduce__` 정의를 검토.
- **`_initialized` 가드**: `__init__` 의 재초기화 방지는 잘 구현되어 있다. 다만 서브클래싱 시 `_initialized` 가 부모와 충돌할 수 있으니, `__init_subclass__` 사용을 고려.

---

## 참고

- 평가 기준 원문: `.claude/skills/design-pattern-analyzer/checklist.md` (Singleton 섹션)
- 분석 skill: `.claude/skills/design-pattern-analyzer/`

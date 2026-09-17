# 렌더러 경계 사례

<!--
여러 줄 주석 — 출력되면 안 된다.
-->

문단 안의 <!-- 인라인 주석 --> 주석은 사라지고, 원시 HTML <div class="x"> 과 제네릭 `List<Entry>` 는 글자로 보입니다. 기호 A&B · &lt;이미 이스케이프&gt; · 3 * 4 * 5 · snake_case_name · ~~취소~~ · 줄 끝 역슬래시\
다음 줄.

## 링크

- 앵커: [최소 조건](#구현)
- 외부: [GoF](https://example.com/gof "제목")
- 렌더 대상 + 앵커: [Account](../../../pattern-guide/ddd-analysis-pattern-guide/account-pattern.md#개요)
- 렌더 대상 아님(가이드 트리): [연구 노트](../../../pattern-guide/research/notes.md)
- 가이드 트리 밖: [README](../../../README.md)

## 목록

1. 첫째
  - 두 칸만 들여 쓴 하위 목록
  - 둘째 하위
2. 둘째

3. 빈 줄 뒤 셋째(loose)

5) 다른 구분자 — 새 목록, start=5
6) 여섯째

- 게으른 연속 줄
이어지는 줄
- 코드가 든 항목

  ```text
  <!-- 목록 안 펜스의 주석은 보존 -->
  ```

## 표

| 이름 | 설명 |
|------|-----:|
| 이스케이프 | a \| b |
| 코드 | `x || y` |
| 모자란 칸 |

## 구현 예시

### 구현

```java
class A {}
```

Java 판은 위와 같고, 아래는 TypeScript 판입니다(산문이 끼어 탭으로 묶이지 않아야 함).

```ts
const a = 1;
```

```rust no-compile
fn broken(
```

```ts
// <!-- 코드 안 주석은 보존 -->
export const b = 2;
```

```rust
fn main() {}
```

#### 하위 헤딩도 구현 절 안

```java
class C {}
```

```typescript
class C {}
```

## 구현 절 밖

```java
class D {}
```

```typescript
class D {}
```

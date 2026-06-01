# DDD 분석 패턴 가이드 인덱스

Martin Fowler의 『Analysis Patterns: Reusable Object Models』(1997)에서 제시한 핵심 분석 패턴(Analysis Pattern)의 한국어 가이드 모음. 각 문서는 GoF 가이드와 동일하게 `.claude/skills/design-pattern-guide/template.md` 표준 양식을 따른다.

분석 패턴은 GoF의 구현 설계 패턴과 달리, 도메인을 개념적으로 모델링하는 단계에서 반복적으로 등장하는 객체 모델의 추상이다. 사람·조직·관계·측정·회계처럼 업무 시스템의 뼈대가 되는 구조를 다룬다.

> GoF 디자인 패턴 인덱스: [../PATTERNS.md](../PATTERNS.md)

## 기반 추상 (Foundational)

행위 주체와 그 관계를 모델링하는 가장 기초적인 추상.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Party (당사자) | 사람·조직을 행위 주체라는 공통 추상으로 묶음 | [party-pattern.md](party-pattern.md) |
| Accountability (책임 관계) | 두 Party 사이의 책임·권한 관계를 객체로 명시화 | [accountability-pattern.md](accountability-pattern.md) |
| Knowledge Level (지식 수준) | 운영 사실과 그 규칙·분류를 두 계층으로 분리 | [knowledge-level-pattern.md](knowledge-level-pattern.md) |

## 값 모델링 (Value)

단위·구간을 가진 값을 안전하게 다루는 값 객체 패턴.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Quantity (수량) | 값과 단위를 묶어 단위 안전 연산 제공 | [quantity-pattern.md](quantity-pattern.md) |
| Range (범위) | 시작·끝 구간을 값 객체로 캡슐화 | [range-pattern.md](range-pattern.md) |

## 관찰/측정 (Observation)

대상에 대한 정량·정성 사실을 통일된 구조로 기록.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Measurement (측정) | 정량적 사실을 대상·항목·Quantity로 객체화 | [measurement-pattern.md](measurement-pattern.md) |
| Observation (관찰) | 정성적(범주형) 사실을 현상 분류로 객체화 | [observation-pattern.md](observation-pattern.md) |

## 회계/거래 (Accounting)

금액·가치의 누적과 이동을 무결성 있게 표현.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Account (계정) | 잔액을 항목(Entry)의 합으로 도출 | [account-pattern.md](account-pattern.md) |
| Transaction (거래) | 합 0 균형으로 가치 보존을 보장하는 복식부기 거래 | [transaction-pattern.md](transaction-pattern.md) |
| Posting Rule (전기 규칙) | 사건을 거래로 변환하는 회계 규칙을 객체화 | [posting-rule-pattern.md](posting-rule-pattern.md) |

## 패턴 간 의존 관계

분석 패턴은 서로 층층이 쌓인다. 아래는 대표적인 의존 흐름이다.

- Party → Accountability: 행위 주체(Party) 위에 관계(Accountability)를 세운다.
- Knowledge Level은 Accountability(타입), Measurement/Observation(현상 유형), Posting Rule(규칙)에 두루 결합된다.
- Quantity → Measurement: 측정값은 단위를 가진 Quantity로 표현된다.
- Range는 Accountability 유효 기간, Measurement 정상 범위, Posting Rule 적용 기간 등에 쓰인다.
- Account → Transaction → Posting Rule: 잔액(Account) 위에 균형 거래(Transaction)를, 그 위에 규칙(Posting Rule)을 얹어 회계 도메인을 완성한다.

## 비고

분석 패턴은 분석/모델링 단계의 개념 추상이므로, 구현 시에는 상속·인터페이스·값 객체·규칙 엔진 등 다양한 형태로 실현된다. 따라서 각 가이드의 "최소 조건"은 코드 구조보다 개념적 책임 분리를 기준으로 판정한다.

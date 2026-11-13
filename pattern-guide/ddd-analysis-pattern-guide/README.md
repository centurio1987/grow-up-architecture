# DDD 분석 패턴 가이드 인덱스

Martin Fowler의 『Analysis Patterns: Reusable Object Models』(1997)에서 제시한 핵심 분석 패턴(Analysis Pattern)의 한국어 가이드 모음. 각 문서는 명세 `analysis-guide`(`.claude/authoring/specs/analysis-guide/`)의 절 구성을 따른다. 구본(`*_v0.1.0.md`)은 명세 이전의 구 9섹션 골격이고 `status: legacy` 다.

분석 패턴은 GoF의 구현 설계 패턴과 달리, 도메인을 개념적으로 모델링하는 단계에서 반복적으로 등장하는 객체 모델의 추상이다. 사람·조직·관계·측정·회계처럼 업무 시스템의 뼈대가 되는 구조를 다룬다.

> GoF 디자인 패턴 인덱스: [../PATTERNS.md](../../PATTERNS.md)

## 기반 추상 (Foundational)

행위 주체와 그 관계를 모델링하는 가장 기초적인 추상.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Party (당사자) | 사람과 조직을 한 이름으로 받아 공통인 것을 그 한 자리에 모음 | [party-guide_v1.0.1.md](party/party-guide_v1.0.1.md) |
| Accountability (책임 관계) | 두 당사자를 잇는 관계를 칸이 아니라 개념으로 세워 종류·기간을 닮 | [accountability-guide_v1.0.1.md](accountability/accountability-guide_v1.0.1.md) |
| Knowledge Level (지식 수준) | 사실을 해석하는 규칙을 사실과 다른 층에 인스턴스로 세움 | [knowledge-level-guide_v1.0.1.md](knowledge-level/knowledge-level-guide_v1.0.1.md) |

## 값 모델링 (Value)

단위·구간을 가진 값을 안전하게 다루는 값 객체 패턴. Temporal Property 는 그 구간을 **부품으로 써서** 속성 값의 이력을 조회하는 쪽이라 Range 와 경쟁하지 않고 포개진다.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Quantity (수량) | 값과 단위를 묶어 단위 안전 연산 제공 | [quantity-guide_v1.1.1.md](quantity/quantity-guide_v1.1.1.md) |
| Range (범위) | 두 끝과 「그 끝을 포함하는가」를 한 값에 담아 경계 판정을 한 곳에 모음 | [range-guide_v1.0.1.md](range/range-guide_v1.0.1.md) |
| Temporal Property (시간 속성) | 시간에 따라 바뀌는 속성을 유효 기간이 붙은 값들의 이력으로 두고, 시점을 인자로 받는 접근자로 조회 | [temporal-property-guide_v1.0.1.md](temporal-property/temporal-property-guide_v1.0.1.md) |

## 관찰/측정 (Observation)

대상에 대한 정량·정성 사실을 통일된 구조로 기록.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Measurement (측정) | 값 하나를 대상·항목과 묶어 기록 한 건으로 세운다 | [measurement-guide_v1.0.1.md](measurement/measurement-guide_v1.0.1.md) |
| Observation (관찰) | 대상에 대한 사실을 값의 종류와 상관없이 한 층으로 다룬다 | [observation-guide_v1.0.1.md](observation/observation-guide_v1.0.1.md) |

## 회계/거래 (Accounting)

금액·가치의 누적과 이동을 무결성 있게 표현.

| 패턴 | 한 줄 요약 | 가이드 |
| --- | --- | --- |
| Account (계정) | 잔액을 항목(Entry)의 합으로 도출 | [account-guide_v1.1.1.md](account/account-guide_v1.1.1.md) |
| Transaction (거래) | 함께 적어야 할 기록을 한 묶음으로 만들고, 만드는 자리에서 합을 0 으로 맞춤 | [transaction-guide_v1.0.1.md](transaction/transaction-guide_v1.0.1.md) |
| Posting Rule (전기 규칙) | 무엇에 반응해 얼마를 어느 계정에 적을지를 규칙 하나가 쥔다 | [posting-rule-guide_v1.0.1.md](posting-rule/posting-rule-guide_v1.0.1.md) |
| 심화: 객체 모델링 | Transaction과 Account의 관계 및 Entry 소속 딜레마 해소 가이드 | [account-transaction-entry-modeling.md](../consideration/account-transaction-entry-modeling.md) |
| 심화: Account–Entry 경계 | Entry 를 Account 안에 둘지 세 시나리오로 가른 aggregate 경계 검토 — 회계 배경 확정안과 정합 | [Account와 Entry의 관계 설계.md](<../consideration/Account와 Entry의 관계 설계.md>) |

## 패턴 간 의존 관계

분석 패턴은 서로 층층이 쌓인다. 아래는 대표적인 의존 흐름이다.

- Party → Accountability: 행위 주체(Party) 위에 관계(Accountability)를 세운다.
- Knowledge Level은 Accountability(타입), Measurement/Observation(현상 유형), Posting Rule(규칙)에 두루 결합된다.
- Quantity → Measurement: 측정값은 단위를 가진 Quantity로 표현된다.
- Range는 Accountability 유효 기간, Measurement 정상 범위, Posting Rule 적용 기간 등에 쓰인다.
- Account → Transaction → Posting Rule: 잔액(Account) 위에 균형 거래(Transaction)를, 그 위에 규칙(Posting Rule)을 얹어 회계 도메인을 완성한다.

## 비고

분석 패턴은 분석/모델링 단계의 개념 추상이므로, 구현 시에는 상속·인터페이스·값 객체·규칙 엔진 등 다양한 형태로 실현된다. 따라서 각 가이드의 "최소 조건"은 코드 구조보다 개념적 책임 분리를 기준으로 판정한다.

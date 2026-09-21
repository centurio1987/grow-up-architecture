---
title: Bounded Context
slug: bounded-context
spec: reference-note
spec_version: 0.0.0-fixture
version: 1.0.0
status: published
date: 2026-09-21
serves: [account, quantity]
---

# Bounded Context — 한 모델이 같은 뜻으로 통하는 범위

## 이 문서가 답하는 것

Account 가이드와 Quantity 가이드는 상황 설정 표 첫 줄에 "bounded context" 를 적어요. 그 줄이 무엇을 정하는지, 왜 한 줄로 끝내도 되는지를 여기서 답합니다. 가이드 본문은 이 문서를 읽었다고 가정하지 않아요. 표 첫 줄이 낯설 때만 들르면 됩니다.

## 개념

### Bounded Context

모델 하나가 같은 뜻으로 통하는 범위예요. 가계부 회계 안에서 "계정" 은 돈이 오가는 이름표이고, 같은 회사의 고객 관리 안에서 "계정" 은 로그인 주체예요. 두 뜻을 한 클래스에 욱여넣으면 어느 쪽 규칙도 온전히 지킬 수 없으니, 범위를 먼저 긋고 그 안에서만 이름을 정합니다.

### Ubiquitous Language

그 범위 안에서 개발자와 도메인 전문가가 같은 낱말을 같은 뜻으로 쓰기로 한 약속이에요. 가이드의 상황 설정 표가 "가계부 회계" 라고 적는 순간, 그 아래 나오는 Entry · Account 는 전부 가계부 회계의 뜻으로 읽습니다.

## 개념 사이의 관계

Bounded Context 가 범위를 긋고, Ubiquitous Language 가 그 범위 안의 낱말을 고정해요. 범위가 다르면 같은 낱말이 다른 클래스가 되는 것이 정상이고, 그것을 억지로 합치는 순간 두 범위의 규칙이 서로를 깨기 시작합니다. 가이드의 상황 설정 표가 첫 줄에 범위를 적는 이유는 그 아래 모든 배정이 이 범위를 전제로 하기 때문이에요.

## 가이드로 돌아가기

- [Account 가이드](good-analysis.md) 의 상황 설정 표 첫 줄 — "가계부 회계" 가 이 문서의 범위 하나에 해당해요.

## 참고 자료

- Eric Evans, *Domain-Driven Design*, Addison-Wesley, 2003 — Part IV "Strategic Design", Bounded Context 절.

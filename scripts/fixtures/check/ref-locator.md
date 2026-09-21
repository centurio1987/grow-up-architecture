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

Account 가이드와 Quantity 가이드는 상황 설정 표 첫 줄에 "bounded context" 를 적어요. 그 줄이 무엇을 정하는지, 왜 한 줄로 끝내도 되는지를 여기서 답합니다.

## 개념

### Bounded Context

모델 하나가 같은 뜻으로 통하는 범위예요. 자세한 정의는 원서 §14 의 첫 문단을 읽어 보면 알 수 있어요.

### Ubiquitous Language

그 범위 안에서 개발자와 도메인 전문가가 같은 낱말을 같은 뜻으로 쓰기로 한 약속이에요. 원서의 Context Map 설명이 이 낱말을 어떻게 다루는지도 함께 보세요.

## 개념 사이의 관계

Bounded Context 가 범위를 긋고, Ubiquitous Language 가 그 범위 안의 낱말을 고정해요. Figure 14.1 의 그림이 그 관계를 보여 줍니다.

## 가이드로 돌아가기

- [Account 가이드](good-analysis.md) 의 상황 설정 표 첫 줄.

## 참고 자료

- Eric Evans, *Domain-Driven Design*, Addison-Wesley, 2003 — Part IV "Strategic Design", Bounded Context 절.

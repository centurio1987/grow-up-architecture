/**
 * style guide 회귀 게이트.
 *
 * 여기서 잡는 것: ① 대비 행렬 M1~M6 ② 구조 검사 M7 ③ 파생톤 드리프트
 * ④ upstream `auditContrast`의 over-claim ⑤ 토큰 SSOT 위반(리터럴 hex 유출).
 */

import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { auditContrast } from '@centurio1987/bbangto-ui-style-guide-catalog';
import { contrastRatio } from '@centurio1987/bbangto-ui-tokens';
import { auditResumeStyleGuides, auditVizStructure, CONTRAST_MATRIX, EXEMPT } from './audit';
import { checkDrift } from './derive';
import { resumeStyleGuide } from './resume.ui';
import { resumeVizStyleGuide } from './resume.viz';
import * as T from './tokens';

describe('대비 행렬', () => {
  test('M1~M6 위반 0건', () => {
    expect(auditResumeStyleGuides()).toEqual([]);
  });

  test('행렬이 비어 있지 않다 — 게이트가 조용히 무력화되지 않게', () => {
    expect(CONTRAST_MATRIX.length).toBeGreaterThan(20);
    for (const rule of ['M1', 'M2', 'M3', 'M4', 'M5', 'M6']) {
      expect(CONTRAST_MATRIX.some((r) => r.rule === rule)).toBe(true);
    }
  });

  test('EXEMPT는 여전히 저대비다 — 값이 올라갔으면 게이트로 승격할 때다', () => {
    for (const e of EXEMPT) {
      const m = contrastRatio(e.fg, e.bg);
      expect(m).not.toBeNull();
      expect(m!).toBeLessThan(4.5);
    }
  });
});

describe('구조 검사 M7', () => {
  test('viz의 모든 텍스트·키라인이 순잉크다', () => {
    expect(auditVizStructure()).toEqual([]);
  });
});

describe('파생톤', () => {
  test('tokens.ts의 12종이 derive 규칙과 일치한다', async () => {
    expect(await checkDrift()).toBeNull();
  });
});

describe('upstream 감사', () => {
  test('auditContrast — contrastIntent over-claim 없음(전 preset)', () => {
    expect(auditContrast([resumeStyleGuide])).toEqual([]);
  });

  test('본문 쌍이 선언한 등급을 실제로 넘는다', () => {
    const s = resumeStyleGuide.foundations.semantic;
    expect(contrastRatio(s.foreground.base, s.background.base)!).toBeGreaterThanOrEqual(7);
  });
});

describe('style guide 계약', () => {
  test('UI·viz가 같은 preset 축(print 기본)을 쓴다', () => {
    expect(resumeStyleGuide.defaultFoundationKey).toBe('print');
    expect(resumeVizStyleGuide.defaultFoundationKey).toBe('print');
    expect(resumeStyleGuide.foundationPresets?.[0].foundations).toBe(resumeStyleGuide.foundations);
    expect(resumeVizStyleGuide.foundationPresets?.[0].foundations).toBe(resumeVizStyleGuide.foundations);
  });

  test('radius는 full만 예외로 두고 나머지는 0이다', () => {
    const { full, ...rest } = resumeStyleGuide.foundations.radius;
    for (const v of Object.values(rest)) expect(v).toBe('0px');
    // full은 Spinner·Avatar·Switch의 원형을 살리기 위한 유일한 예외다(T1.3).
    expect(full).toBe('9999px');
  });

  test('섀도가 블러 없는 잉크 오프셋이다', () => {
    const sh = resumeStyleGuide.foundations.shadow;
    for (const [k, v] of Object.entries(sh)) {
      if (k === 'none') continue;
      expect(v).toMatch(/^\d+px \d+px 0 #1C1B17$/);
    }
  });

  test('wrapperComponents 키가 visualMotif.components 에 그대로 있다', () => {
    // 등록만 하고 명세를 안 적으면 `docs/STYLE_GUIDE.pdf` 가 그 컴포넌트를 통째로 빠뜨린다.
    // 반대로 명세만 있고 등록이 없으면 문서가 실제로 안 쓰이는 paint 를 설명한다.
    // 지금까지 셋이 우연히 맞춰져 있었을 뿐 기계가 보지 않았다(KAN-026-QM5VAW 검증 8).
    const wrappers = Object.keys(resumeVizStyleGuide.wrapperComponents ?? {}).sort();
    const documented = Object.keys(resumeVizStyleGuide.visualMotif?.components ?? {}).sort();
    expect(documented).toEqual(wrappers);
  });

  test('의미색 4종이 액센트에 1:1로 묶여 있다', () => {
    const fills = Object.values(T.SEMANTIC).map((s) => s.surface);
    expect(new Set(fills).size).toBe(4);
    expect(fills.sort()).toEqual([T.BLUE, T.PINK, T.SAGE, T.YELLOW].sort());
  });
});

describe('토큰 SSOT', () => {
  test('tokens.ts 밖의 style guide 파일이 색을 정의하지 않는다', async () => {
    // 색을 **정의**하는 자리 = 단독 문자열 리터럴('#RRGGBB'). guidelines·visualMotif 산문에
    // 섞인 hex는 사람·AI가 읽는 설명이지 정의가 아니므로 대상이 아니다.
    const DEFINITION = /(['"`])#[0-9A-Fa-f]{6}\1/g;
    for (const f of ['resume.ui.ts', 'resume.viz.tsx']) {
      const src = await readFile(new URL(f, import.meta.url), 'utf-8');
      const body = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect({ file: f, found: body.match(DEFINITION) ?? [] }).toEqual({ file: f, found: [] });
    }
  });

  test('tokens.ts만이 색 정의를 갖는다 — 정의 개수가 0이 아님을 함께 확인', async () => {
    const src = await readFile(new URL('tokens.ts', import.meta.url), 'utf-8');
    expect((src.match(/(['"`])#[0-9A-Fa-f]{6}\1/g) ?? []).length).toBeGreaterThan(20);
  });
});

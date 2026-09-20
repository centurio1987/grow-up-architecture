#!/usr/bin/env bun
/**
 * 파생톤 생성기 — `tokens.ts`의 `<derived:begin>…<derived:end>` 블록을 굽는다.
 *
 * 값은 **리터럴로** 파일에 들어간다. 런타임 계산이 아니라 빌드타임 생성인 이유:
 * tokens.ts를 "리터럴 hex의 유일한 소재지"로 유지하면서도(SSOT) 생성 규칙을 코드에 두어
 * 드리프트를 막기 위해서다. 규칙 자체는 `oklch.ts`에 있다.
 *
 *   bun run design/style-guide/derive.ts --write   # 블록 재작성
 *   bun run design/style-guide/derive.ts --check   # 재계산값과 파일 값 일치 검사 (exit 1 on drift)
 *   bun run design/style-guide/derive.ts           # 계산 결과만 출력
 *
 * 이 파일은 `node:fs`를 쓰므로 `index.ts`가 재export하지 않는다 — 브라우저 번들이 깨진다.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveAll } from './oklch';

const BEGIN = '// <derived:begin>';
const END = '// <derived:end>';
const TOKENS_PATH = join(dirname(fileURLToPath(import.meta.url)), 'tokens.ts');

function renderBlock(derived: Record<string, string>): string {
  return Object.entries(derived)
    .map(([k, v]) => `export const ${k} = '${v}';`)
    .join('\n');
}

async function readBlock(): Promise<{ src: string; body: string }> {
  const src = await readFile(TOKENS_PATH, 'utf-8');
  const i = src.indexOf(BEGIN);
  const j = src.indexOf(END);
  if (i < 0 || j < 0 || j < i) throw new Error('tokens.ts에서 derived 마커를 찾지 못했다');
  return { src, body: src.slice(i + BEGIN.length, j).trim() };
}

/**
 * tokens.ts의 derived 블록이 현재 규칙과 일치하는가. 불일치면 사람이 읽을 diff 문자열,
 * 일치하면 null. `audit.test.ts`가 이걸로 드리프트를 잡는다.
 */
export async function checkDrift(): Promise<string | null> {
  const { body } = await readBlock();
  const expected = renderBlock(deriveAll());
  if (body === expected) return null;
  return `tokens.ts의 파생톤이 derive 규칙과 다르다. \`--write\`로 재생성하라.\n--- 파일 ---\n${body}\n--- 규칙 ---\n${expected}`;
}

/** derived 블록을 현재 규칙으로 다시 굽는다. */
export async function writeBlock(): Promise<string> {
  const { src } = await readBlock();
  const expected = renderBlock(deriveAll());
  const i = src.indexOf(BEGIN);
  const j = src.indexOf(END);
  await writeFile(TOKENS_PATH, `${src.slice(0, i + BEGIN.length)}\n${expected}\n${src.slice(j)}`);
  return expected;
}

if (import.meta.main) {
  if (process.argv.includes('--write')) {
    console.log(`파생톤 12종을 tokens.ts에 기록했다.\n${await writeBlock()}`);
  } else if (process.argv.includes('--check')) {
    const drift = await checkDrift();
    if (drift) {
      console.error(`[drift] ${drift}`);
      process.exit(1);
    }
    console.log('ok — 파생톤 12종이 규칙과 일치한다.');
  } else {
    console.log(renderBlock(deriveAll()));
  }
}

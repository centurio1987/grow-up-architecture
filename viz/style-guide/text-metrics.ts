/**
 * 글자 폭 근사 — 이 style guide 가 고정한 서체(IBM Plex Sans · Mono)의 성질이다.
 *
 * **왜 여기 있나.** 상류 `estimateWidth` 는 `글자수 × 0.55em + 1em` 이라 **스크립트를 보지 않는다**
 * (`docs/viz-upstream-issues.md` P5). 한글은 전각이라 그 식이 과소평가하고, **넘침 가드가
 * 과소평가하면 가드가 아니다.** 그래서 우리가 따로 센다.
 *
 * 원래 `diagrams/_frame.tsx` 안의 모듈 사설 함수였는데, `resume.viz.tsx` 의 wrapper 폭 가드가
 * 같은 계산을 필요로 하면서 자리를 옮겼다. 사본을 두면 두 가드가 서로 다른 폭을 재고 언젠가
 * 한쪽만 고쳐진다 — 그러면 도식은 통과하고 wrapper 는 죽거나, 그 반대가 된다.
 * `diagrams/` → `design/style-guide/` 방향으로만 의존이 흐르므로(그 반대가 아니라) 여기가 맞다.
 */

/** 전각으로 세는 스크립트 — 한글 자모·완성형, 가나, 한자. */
const WIDE = /[ᄀ-ᇿ　-ヿ㄰-㆏가-힯一-鿿]/;

/**
 * `s` 를 `size` px 로 그렸을 때의 가로 폭(px) 근사.
 *
 * 브라우저 밖에서는 실측할 수 없으므로 근사이고, **가드로 쓰기 위해 과대평가 쪽으로 기운다.**
 */
export function textWidth(s: string, size: number, mono: boolean): number {
  let em = 0;
  for (const ch of s) {
    // mono 는 공백도 같은 폭이다. sans 는 공백이 평균 글자의 절반 남짓이라 따로 센다 —
    // 공백을 글자 취급하면 한글 라벨에서 과대평가가 쌓여 멀쩡한 도식이 가드에 걸린다.
    if (mono) em += 0.6;
    else if (WIDE.test(ch)) em += 1;
    else em += ch === ' ' ? 0.28 : 0.52;
  }
  return em * size;
}

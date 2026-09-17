#!/usr/bin/env bash
# comprehension-gate.sh 종료코드 회귀 테스트 — 실제 모델을 부르지 않는다.
# scripts/fixtures/gate/ 의 가짜 codex·agy 를 PATH 앞에 두고 응답 조합마다 종료코드를 확인한다.
# 사용: bash scripts/test-comprehension-gate.sh   (전부 기대대로면 0)
set -u
here="$(cd "$(dirname "$0")" && pwd)"
guide="$here/fixtures/check/good-gof.md"
fail=0; n=0; tmp="$(mktemp)"
check() {  # <codex> <agy> <기대 종료코드> <설명>
  n=$((n + 1))
  FAKE_CODEX="$1" FAKE_AGY="$2" PATH="$here/fixtures/gate:$PATH" \
    bash "$here/comprehension-gate.sh" "$guide" >"$tmp" 2>&1
  local rc=$?
  if [ "$rc" -eq "$3" ]; then printf 'PASS %s — exit %s\n' "$4" "$rc"
  else printf 'FAIL %s — exit %s (기대 %s)\n' "$4" "$rc" "$3"; tail -3 "$tmp"; fail=$((fail + 1)); fi
}
check pass  pass 0 "두 모델 PASS"
check limit pass 2 "codex 사용량 한도 + agy PASS 는 미완료"
check pass  skip 2 "agy 인증 실패 + codex PASS 는 미완료"
check limit fail 3 "codex 한도 + agy FAIL 은 미통과"
check fail  pass 3 "한 모델 FAIL 은 미통과"
check limit skip 2 "두 모델 모두 응답 없음"
FAKE_CODEX=limit FAKE_AGY=pass PATH="$here/fixtures/gate:$PATH" bash "$here/comprehension-gate.sh" "$guide" 2>&1 | grep -q '사용량 한도' \
  && printf 'PASS 사용량 한도를 인증 문제로 오진하지 않음\n' || { printf 'FAIL 사용량 한도 진단 문구 없음\n'; fail=$((fail + 1)); }
n=$((n + 1))
rm -f "$tmp"
printf -- '-- 결과: %s건 중 실패 %s건\n' "$n" "$fail"
[ "$fail" -eq 0 ]

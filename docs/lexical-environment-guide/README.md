# 렉시컬 환경으로 읽는 화살표 함수와 function 함수

`index.html`을 브라우저에서 열면 됩니다. 본문·도식·동작이 한 파일에 들어 있어 오프라인에서 읽을 수 있습니다. 출처 링크는 인터넷 연결이 필요합니다.

- 렉시컬 환경(환경 레코드와 `[[OuterEnv]]`)의 구조와 이름 찾기
- 화살표 함수와 function 함수가 환경을 기억하는 방식(같음)과 `this`·`arguments`·`new` 등에서 갈라지는 곳(명세 단계 대조)
- 전역 화살표 함수가 변수를 많이 참조해도 GC가 정상 동작하는 이유와, 실제로 값이 남는 경우
- 그림 6개: 이름 찾기, 11단계 실행 화면, 부르는 방식별 `this`, 표시하고 쓸기, 전역 화살표 함수, 컨텍스트 공유

## 파일

- `index.html`: 완성 가이드. 손으로 쓴 파일이라 이 파일을 직접 고칩니다.
- `gc-lab.mjs`: 8~10절의 실측 값을 내는 실험. 사례마다 새 `node` 프로세스를 띄웁니다.
- `verification/gc-lab-result.json`: 실험 결과 원본(사례 11개).

## 다시 재기

프로젝트 루트에서 실행합니다.

```sh
node --expose-gc docs/lexical-environment-guide/gc-lab.mjs > docs/lexical-environment-guide/verification/gc-lab-result.json
```

## 검증 범위

- 실측 환경: Node v22.22.3, V8 12.4.254.21-node.56, macOS arm64. 두 번 실행해 결과가 같은지 비교했습니다.
- `this` 예제 1~5번은 Node, 6번(이벤트 리스너)은 브라우저에서 실행해 확인했습니다.
- 화면은 데스크톱 폭과 휴대폰 폭(375px), 밝은·어두운 테마에서 가로 넘침과 그림 동작을 확인했습니다.
- 다른 Node 버전과 Firefox(SpiderMonkey), Safari(JavaScriptCore)의 GC 동작은 확인하지 않았습니다. `WeakRef`가 비는 시점은 명세가 보장하지 않으므로 실측 표는 이 버전의 V8에서 관찰한 기록입니다.

조사·작성: 2026-10-28.

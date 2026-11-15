// 렉시컬 환경과 GC 실험 — 가이드 8~10절의 실측 값은 이 파일이 낸다.
// 실행: node --expose-gc docs/lexical-environment-guide/gc-lab.mjs
// 사례마다 새 node 프로세스를 띄워 서로의 힙이 섞이지 않게 한다.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const SELF = fileURLToPath(import.meta.url);
const tick = () => new Promise((r) => setTimeout(r, 0));
const MB = (n) => Math.round((n / 1024 / 1024) * 10) / 10;

// 약 8MB 짜리 배열. 회수됐는지는 WeakRef 로, 얼마나 남았는지는 heapUsed 로 잰다.
const makeBig = () => Array.from({ length: 1_000_000 }, (_, i) => i);

// WeakRef 는 만든 작업(job)이 끝날 때까지 대상을 붙잡아 두므로, 한 틱 넘긴 뒤 gc 를 부른다.
async function collected(ref) {
  await tick();
  globalThis.gc();
  await tick();
  globalThis.gc();
  return ref.deref() === undefined;
}

const heap = () => {
  globalThis.gc();
  return process.memoryUsage().heapUsed;
};

const CASES = {
  // 1. 전역 화살표 함수가 전역 변수를 참조해도, 변수에 새 값을 넣으면 옛 값은 회수된다.
  async globalRebind() {
    globalThis.__makeBig = makeBig;
    vm.runInThisContext(`
      let big = __makeBig();
      globalThis.__ref = new WeakRef(big);
      const read = () => big === null ? 0 : big.length;
      globalThis.__read = read;
    `);
    const before = globalThis.__read();
    vm.runInThisContext('big = null;');
    const gone = await collected(globalThis.__ref);
    return { before, after: globalThis.__read(), oldValueCollected: gone, closureStillAlive: typeof globalThis.__read === 'function' };
  },

  // 2. 클로저 하나의 크기는 참조하는 변수 개수와 상관없다(전역 변수 1개 vs 50개).
  async closureSize() {
    const names = Array.from({ length: 50 }, (_, i) => `g${i}`);
    vm.runInThisContext(names.map((n, i) => `let ${n} = ${i};`).join('\n'));
    const N = 200_000;
    const measure = (body) => {
      const factory = vm.runInThisContext(`(() => () => ${body})`);
      const fns = new Array(N);
      const h0 = heap();
      for (let i = 0; i < N; i++) fns[i] = factory();
      const h1 = heap();
      fns.length = 0;
      return Math.round((h1 - h0) / N);
    };
    return { bytesPerClosure_ref1: measure('g0'), bytesPerClosure_ref50: measure(names.join(' + ')) };
  },

  // 3. 함수 안에서 어떤 클로저도 쓰지 않는 변수는 컨텍스트에 실리지 않는다.
  async unreferencedLocal() {
    let ref;
    function outer() {
      const big = makeBig();
      ref = new WeakRef(big);
      const small = big.length;
      return () => small;
    }
    const keep = outer();
    const gone = await collected(ref);
    return { closureResult: keep(), bigCollected: gone };
  },

  // 4. 같은 스코프의 클로저들은 컨텍스트 하나를 함께 쓴다.
  //    버린 클로저가 big 을 참조했으면, 남은 클로저가 big 을 끌고 간다.
  async sharedContext() {
    let ref;
    function outer() {
      const big = makeBig();
      ref = new WeakRef(big);
      const small = 1;
      const unused = () => big.length; // 만들기만 하고 버린다
      void unused;
      return () => small;
    }
    const h0 = heap();
    const keep = outer();
    const gone = await collected(ref);
    const retainedMB = MB(heap() - h0);
    return { closureResult: keep(), bigCollected: gone, retainedMB };
  },

  // 5. 4번에서 big 을 끊어 주면 같은 구조에서도 회수된다.
  async sharedContextCleared() {
    let ref;
    function outer() {
      let big = makeBig();
      ref = new WeakRef(big);
      const small = big.length;
      const unused = () => big.length;
      void unused;
      big = null; // 결과를 다 썼으면 끊는다
      return () => small;
    }
    const keep = outer();
    const gone = await collected(ref);
    return { closureResult: keep(), bigCollected: gone };
  },

  // 5-2. 4번을 function 키워드로 바꿔도 결과가 같다. 붙잡는 방식은 함수 종류와 무관하다.
  async sharedContextFunctionKeyword() {
    let ref;
    function outer() {
      const big = makeBig();
      ref = new WeakRef(big);
      const small = 1;
      function unused() { return big.length; }
      void unused;
      return function keep() { return small; };
    }
    const keep = outer();
    return { closureResult: keep(), bigCollected: await collected(ref) };
  },

  // 5-2b. 아무 변수도 쓰지 않는 콜백도, 같은 스코프에 big 을 쓰는 클로저가 있으면 big 을 끌고 간다.
  async sharedContextNoRefs() {
    let ref;
    let timer;
    (function setup() {
      const big = makeBig();
      ref = new WeakRef(big);
      const unused = () => big.length;
      void unused;
      timer = setInterval(() => 1, 60_000);
    })();
    const whileRegistered = !(await collected(ref));
    clearInterval(timer);
    timer = null;
    return { retainedWhileRegistered: whileRegistered, collectedAfterClear: await collected(ref) };
  },

  // 5-3. 화살표 함수가 this 를 쓰면 바깥 함수의 this(받는 객체)를 붙잡는다. 안 쓰면 붙잡지 않는다.
  async arrowThis() {
    let refUses, refNot, usesThis, noThis;
    const makeUses = function () { return () => this.n; };
    const makeNot = function () { return () => 0; };
    (() => {
      const a = { n: 1, big: makeBig() };
      refUses = new WeakRef(a);
      usesThis = makeUses.call(a);
      const b = { n: 2, big: makeBig() };
      refNot = new WeakRef(b);
      noThis = makeNot.call(b);
    })();
    return {
      usesThisResult: usesThis(),
      receiverRetainedWhenThisUsed: !(await collected(refUses)),
      receiverCollectedWhenThisUnused: await collected(refNot),
      noThisResult: noThis(),
    };
  },

  // 6. 직접 eval 이 있으면 엔진은 어떤 변수가 쓰일지 몰라 전부 컨텍스트에 싣는다.
  async directEval() {
    let ref;
    function outer() {
      const big = makeBig();
      ref = new WeakRef(big);
      return (code) => eval(code);
    }
    const keep = outer();
    const gone = await collected(ref);
    return { evalCanSeeBig: keep('big.length'), bigCollected: gone };
  },

  // 7. 오래 사는 콜백(타이머·리스너)이 big 을 참조하면, 콜백을 떼어 낼 때까지 회수되지 않는다.
  async longLivedCallback() {
    let ref;
    let timer;
    (() => {
      const big = makeBig();
      ref = new WeakRef(big);
      timer = setInterval(() => big.length, 60_000);
    })();
    const whileRegistered = !(await collected(ref));
    clearInterval(timer);
    timer = null;
    const afterClear = await collected(ref);
    return { retainedWhileRegistered: whileRegistered, collectedAfterClear: afterClear };
  },

  // 8. 클로저와 환경이 서로를 가리키는 순환도, 뿌리에서 닿지 않으면 회수된다.
  async cycle() {
    let ref;
    (() => {
      const box = { big: makeBig() };
      box.self = () => box; // box → 함수 → 환경 → box
      ref = new WeakRef(box);
    })();
    return { cycleCollected: await collected(ref) };
  },
};

if (process.argv[2]) {
  const out = await CASES[process.argv[2]]();
  process.stdout.write(JSON.stringify(out));
} else {
  if (typeof globalThis.gc !== 'function') {
    console.error('node --expose-gc 로 실행합니다.');
    process.exit(1);
  }
  const result = { node: process.version, v8: process.versions.v8, platform: `${process.platform}-${process.arch}`, cases: {} };
  for (const name of Object.keys(CASES)) {
    const run = spawnSync(process.execPath, ['--expose-gc', SELF, name], { encoding: 'utf8', timeout: 60_000 });
    result.cases[name] = run.status === 0 ? JSON.parse(run.stdout) : { error: run.stderr.trim() || `exit ${run.status}` };
  }
  console.log(JSON.stringify(result, null, 2));
}

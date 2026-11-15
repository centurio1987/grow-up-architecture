/**
 * 가이드 37편 × 문제 네 가지 격자.
 * 주장: GoF 는 풀이 없음·앞선 참조가 거의 모든 편에 걸리고, 분석 트랙은 틀 제목이 주로 걸린다.
 * 출처: 2026-11-13 집계 — 각 편 최신판(md)에서 스크립트로 셌다.
 *   풀이 없음 = 「스스로 점검하기」 절에 `풀이 —` 블록이 없음
 *   갈래 = 시나리오 절 안의 `- 갈래` 항목 수
 *   틀 제목 = 시나리오 3 제목에 `규칙을 어기` · `구조를 어기` 가 들어 있음
 *   앞선 참조 = `## 구현 예시` 앞, 펜스 밖 줄 가운데 구현 절·구현 해설·정본 코드·실행 출력·구현 예시의·펜스 n·n행 이 든 줄 수
 */
import { Cell, Figure, FigureHeader, Label, useInk } from 'publish-report/compose';

type Row = { name: string; noAnswer: boolean; branches: number; genericTitle: boolean; forwardRefs: number };

const GOF: Row[] = [
  { name: 'Abstract Factory', noAnswer: true, branches: 1, genericTitle: false, forwardRefs: 1 },
  { name: 'Adapter', noAnswer: true, branches: 1, genericTitle: false, forwardRefs: 3 },
  { name: 'Bridge', noAnswer: true, branches: 1, genericTitle: false, forwardRefs: 13 },
  { name: 'Builder', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 1 },
  { name: 'Chain of Responsibility', noAnswer: true, branches: 2, genericTitle: true, forwardRefs: 8 },
  { name: 'Command', noAnswer: true, branches: 1, genericTitle: false, forwardRefs: 6 },
  { name: 'Composite', noAnswer: true, branches: 0, genericTitle: true, forwardRefs: 11 },
  { name: 'Decorator', noAnswer: true, branches: 0, genericTitle: true, forwardRefs: 9 },
  { name: 'Dependency Injection', noAnswer: true, branches: 0, genericTitle: true, forwardRefs: 3 },
  { name: 'Facade', noAnswer: true, branches: 0, genericTitle: true, forwardRefs: 6 },
  { name: 'Factory Method', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 4 },
  { name: 'Flyweight', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 3 },
  { name: 'Interpreter', noAnswer: true, branches: 1, genericTitle: false, forwardRefs: 5 },
  { name: 'Iterator', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 8 },
  { name: 'Mediator', noAnswer: true, branches: 3, genericTitle: false, forwardRefs: 10 },
  { name: 'Memento', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 3 },
  { name: 'Null Object', noAnswer: true, branches: 0, genericTitle: true, forwardRefs: 11 },
  { name: 'Observer', noAnswer: true, branches: 2, genericTitle: false, forwardRefs: 4 },
  { name: 'Prototype', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 3 },
  { name: 'Proxy', noAnswer: true, branches: 1, genericTitle: true, forwardRefs: 6 },
  { name: 'Singleton', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 4 },
  { name: 'Specification', noAnswer: true, branches: 0, genericTitle: true, forwardRefs: 10 },
  { name: 'State', noAnswer: true, branches: 4, genericTitle: false, forwardRefs: 6 },
  { name: 'Strategy', noAnswer: true, branches: 5, genericTitle: false, forwardRefs: 9 },
  { name: 'Template Method', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 3 },
  { name: 'Visitor', noAnswer: true, branches: 0, genericTitle: false, forwardRefs: 10 },
];

const ANALYSIS: Row[] = [
  { name: 'Account', noAnswer: false, branches: 0, genericTitle: true, forwardRefs: 0 },
  { name: 'Accountability', noAnswer: false, branches: 0, genericTitle: true, forwardRefs: 1 },
  { name: 'Knowledge Level', noAnswer: false, branches: 0, genericTitle: true, forwardRefs: 1 },
  { name: 'Measurement', noAnswer: false, branches: 0, genericTitle: false, forwardRefs: 0 },
  { name: 'Observation', noAnswer: false, branches: 0, genericTitle: false, forwardRefs: 0 },
  { name: 'Party', noAnswer: false, branches: 0, genericTitle: true, forwardRefs: 0 },
  { name: 'Posting Rule', noAnswer: false, branches: 0, genericTitle: true, forwardRefs: 1 },
  { name: 'Quantity', noAnswer: false, branches: 0, genericTitle: false, forwardRefs: 8 },
  { name: 'Range', noAnswer: false, branches: 0, genericTitle: false, forwardRefs: 6 },
  { name: 'Temporal Property', noAnswer: true, branches: 0, genericTitle: true, forwardRefs: 0 },
  { name: 'Transaction', noAnswer: false, branches: 0, genericTitle: true, forwardRefs: 0 },
];

const ROW_H = 24;
const CELL_H = 18;
const NAME_X = 24;
const COLS = [280, 410, 540];
const CELL_W = 100;
const BAR_X = 670;
const BAR_MAX = 200;
const MAX_REFS = 13;
const GOF_TOP = 170;
const ANALYSIS_TOP = GOF_TOP + GOF.length * ROW_H + 34;
const HEIGHT = ANALYSIS_TOP + ANALYSIS.length * ROW_H + 24;

function Rows({ rows, top }: { rows: Row[]; top: number }) {
  const k = useInk();
  return (
    <g>
      {rows.map((r, i) => {
        const y = top + i * ROW_H;
        const bar = (r.forwardRefs / MAX_REFS) * BAR_MAX;
        return (
          <g key={r.name}>
            <Label x={NAME_X} y={y + 14}>{r.name}</Label>
            <Cell x={COLS[0]} y={y} width={CELL_W} height={CELL_H} filled={r.noAnswer} />
            <Cell x={COLS[1]} y={y} width={CELL_W} height={CELL_H} filled={r.branches > 0} label={r.branches > 0 ? String(r.branches) : undefined} />
            <Cell x={COLS[2]} y={y} width={CELL_W} height={CELL_H} filled={r.genericTitle} />
            {bar > 0 && <rect x={BAR_X} y={y + 2} width={bar} height={CELL_H - 4} fill={k.accent} />}
            <Label x={BAR_X + bar + 8} y={y + 14} size={13}>{String(r.forwardRefs)}</Label>
          </g>
        );
      })}
    </g>
  );
}

export default function IssueMatrix() {
  return (
    <Figure height={HEIGHT} title="가이드 37편 × 문제 네 가지">
      <FigureHeader eyebrow="편별 해당 여부" title="편마다 걸리는 문제 — 채운 칸이 해당" />
      <Label x={COLS[0] + CELL_W / 2} y={112} bold size={13} anchor="middle">풀이 없음</Label>
      <Label x={COLS[0] + CELL_W / 2} y={130} size={12} dim anchor="middle">1-1</Label>
      <Label x={COLS[1] + CELL_W / 2} y={112} bold size={13} anchor="middle">시나리오 갈래</Label>
      <Label x={COLS[1] + CELL_W / 2} y={130} size={12} dim anchor="middle">3-1 · 칸 안은 개수</Label>
      <Label x={COLS[2] + CELL_W / 2} y={112} bold size={13} anchor="middle">시나리오 3 틀 제목</Label>
      <Label x={COLS[2] + CELL_W / 2} y={130} size={12} dim anchor="middle">3-6</Label>
      <Label x={BAR_X} y={112} bold size={13}>앞선 참조 줄 수</Label>
      <Label x={BAR_X} y={130} size={12} dim>2-1</Label>
      <Label x={NAME_X} y={GOF_TOP - 10} bold dim size={13}>GoF 26편</Label>
      <Rows rows={GOF} top={GOF_TOP} />
      <Label x={NAME_X} y={ANALYSIS_TOP - 10} bold dim size={13}>분석 패턴 11편</Label>
      <Rows rows={ANALYSIS} top={ANALYSIS_TOP} />
    </Figure>
  );
}

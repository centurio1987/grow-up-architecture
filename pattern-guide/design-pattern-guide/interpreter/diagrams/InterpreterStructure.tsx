// @relation relate
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 패턴의 참여 역할이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 Interpreter — Structure · Participants
//
// 주장: 계층은 하나인데 그 계층이 자기를 다시 담는다. 비단말은 하위 표현식을
// AbstractExpression 타입으로 보유하므로 어떤 규칙이든 하위 자리에 올 수 있고,
// 단말은 하위를 들지 않아 트리가 거기서 끝난다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 760;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'client', name: 'Client' },
    {
      id: 'abstract',
      name: 'AbstractExpression',
      stereotype: 'abstract',
      methods: ['interpret(Context) : 모든 노드 공통'],
    },
    {
      id: 'terminal',
      name: 'TerminalExpression',
      methods: ['interpret(Context) : 재귀의 기저'],
    },
    {
      id: 'nonterminal',
      name: 'NonterminalExpression',
      attributes: ['R1..Rn : AbstractExpression'],
      methods: ['interpret(Context) : 하위 해석을 합성'],
    },
    {
      id: 'context',
      name: 'Context',
      methods: ['전역 정보를 내준다', '인터프리터 상태를 적어 둔다'],
    },
  ],
  relations: [
    { from: 'terminal', to: 'abstract', kind: 'inheritance' },
    { from: 'nonterminal', to: 'abstract', kind: 'inheritance' },
    { from: 'nonterminal', to: 'abstract', kind: 'aggregation', toCard: '1..n' },
    { from: 'client', to: 'abstract', kind: 'dependency' },
    { from: 'abstract', to: 'context', kind: 'dependency' },
  ],
};

export default function InterpreterStructure() {
  return (
    <Canvas width={W} height={352}>
      <DiagramHeader
        eyebrow="Interpreter structure"
        title="계층 하나가 자기를 다시 담는다 — 비단말이 가진 하위도 같은 타입이다"
      />
      <DomainModel spec={SPEC} origin={{ x: GUTTER, y: 104 }} />
    </Canvas>
  );
}

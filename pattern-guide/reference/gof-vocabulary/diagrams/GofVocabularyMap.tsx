// @relation relate
// @viz-type VT-302
// 역할 규약: **면제 ③(서술형 패널)** — 칸이 실행 단위가 아니라 개념 정의를 담는 글의 그릇이다(viz/frame/frame.tsx §역할 규약).
// 출처: GoF 원서 1장 §1.5 Organizing the Catalog(클래스 패턴·객체 패턴) · §1.6 How Design Patterns Solve Design
//       Problems(Program to an interface · Inheritance versus Composition · Delegation · Inheritance versus
//       Parameterized Types) · 4장 Flyweight Motivation(내재·외재 상태) · 5장 Command Participants(Invoker·Receiver)
//
// 주장: 여섯 어휘는 한 줄로 이어진다. 인터페이스에 프로그래밍한다는 원칙을 코드로 옮기는 수단이 위임이고,
// 위임으로 맺은 관계가 객체 패턴, 상속으로 맺은 관계가 클래스 패턴이다. 관계를 맺는 방식이 결합 시점을
// 대개 정하며, 위임받는 객체를 여럿이 공유하려면 상태를 내재·외재로 가르고, 위임받는 것이 요청 하나이면
// 역할이 Invoker · Receiver · Command 객체 셋으로 갈린다.
import { Canvas, Edge, useVizFoundation } from '@centurio1987/bbangto-ui-visualization';
import { DiagramHeader, GUTTER, Panel } from '../../../../viz/frame/frame';

const W = 912;
const LEFT_X = GUTTER;
const LEFT_W = 360;
const RIGHT_X = GUTTER + 480;
const RIGHT_W = 340; // 오른쪽 끝 844 + 그림자 4 — render-viz 기본 뷰포트(900 − 패딩 32 = 868) 안에 든다
const PANEL_H = 88;
const ROW1 = 104;
const ROW2 = 232;
const ROW3 = 364;
const ROW4 = 496;

export default function GofVocabularyMap() {
  const f = useVizFoundation();
  const ink = f.node.process.tagColor;
  const label = (x: number, y: number, text: string, anchor: 'start' | 'end' = 'start') => (
    <text x={x} y={y} textAnchor={anchor} fontFamily={f.typography.bodyFont} fontSize={12} fill={ink}>
      {text}
    </text>
  );
  return (
    <Canvas width={W} height={620}>
      <DiagramHeader eyebrow="GoF vocabulary" title="여섯 어휘는 위임을 가운데 두고 이어진다" />

      <Panel
        x={LEFT_X}
        y={ROW1}
        width={LEFT_W}
        height={PANEL_H}
        tone="info"
        title="인터페이스에 프로그래밍한다"
        lines={['변수를 구체 클래스가 아니라 인터페이스 타입으로 선언한다', '그래야 그 타입을 따르는 구현을 바꿔 끼울 수 있다']}
      />
      <Panel
        x={LEFT_X}
        y={ROW2}
        width={LEFT_W}
        height={PANEL_H}
        tone="solution"
        title="위임(delegation)"
        lines={['요청받은 객체가 인터페이스 타입으로 든 협력자에게 일을 넘긴다', '협력자는 별개의 객체라 실행 중에 바꿀 수 있다']}
      />
      <Panel
        x={RIGHT_X}
        y={ROW2}
        width={RIGHT_W}
        height={PANEL_H}
        title="클래스 패턴과 객체 패턴"
        lines={['상속으로 맺은 관계는 컴파일 시점에 고정 = 클래스 패턴', '위임으로 맺은 관계는 실행 중에 바뀜 = 객체 패턴']}
      />
      <Panel
        x={RIGHT_X}
        y={ROW3}
        width={RIGHT_W}
        height={PANEL_H}
        title="컴파일 시점 결합과 실행 시점 결합"
        lines={['정적 디스패치: 컴파일러가 부를 메서드를 미리 안다', '동적 디스패치: 객체의 실제 타입이 실행 중에 정한다']}
      />
      <Panel
        x={LEFT_X}
        y={ROW3}
        width={300}
        height={PANEL_H}
        title="내재 상태와 외재 상태"
        lines={['내재: 객체 안에 두는, 쓰는 자리와 무관한 값', '외재: 자리마다 달라 호출할 때 넘기는 값']}
      />
      <Panel
        x={LEFT_X}
        y={ROW4}
        width={LEFT_W}
        height={PANEL_H}
        title="Invoker · Receiver · Command 객체"
        lines={['Command 객체가 요청을 담고 Receiver 가 일을 한다', 'Invoker 는 무슨 요청인지 모른 채 실행만 시킨다']}
      />

      {/* 원칙 → 위임 */}
      <Edge
        from={{ x: LEFT_X + 216, y: ROW1 + PANEL_H }}
        to={{ x: LEFT_X + 216, y: ROW2 }}
        routing="orthogonal"
        markerEnd="arrow"
        stroke={ink}
      />
      {label(LEFT_X + 228, ROW1 + PANEL_H + 26, '원칙을 코드로 옮기는 수단')}

      {/* 위임 → 클래스 패턴과 객체 패턴 */}
      <Edge
        from={{ x: LEFT_X + LEFT_W, y: ROW2 + 44 }}
        to={{ x: RIGHT_X, y: ROW2 + 44 }}
        routing="orthogonal"
        markerEnd="arrow"
        stroke={ink}
      />
      {label((LEFT_X + LEFT_W + RIGHT_X) / 2 - 54, ROW2 + 34, '관계를 맺는 방식')}

      {/* 클래스 패턴과 객체 패턴 → 결합 시점 */}
      <Edge
        from={{ x: RIGHT_X + 192, y: ROW2 + PANEL_H }}
        to={{ x: RIGHT_X + 192, y: ROW3 }}
        routing="orthogonal"
        markerEnd="arrow"
        stroke={ink}
      />
      {label(RIGHT_X + 180, ROW2 + PANEL_H + 26, '맺는 방식이 결합 시점을 대개 정한다', 'end')}

      {/* 위임 → 내재 상태와 외재 상태 */}
      <Edge
        from={{ x: LEFT_X + 124, y: ROW2 + PANEL_H }}
        to={{ x: LEFT_X + 124, y: ROW3 }}
        routing="orthogonal"
        markerEnd="arrow"
        stroke={ink}
      />
      {label(LEFT_X + 136, ROW2 + PANEL_H + 26, '협력자 하나를 여럿이 공유하려면')}

      {/* 위임 → Invoker · Receiver · Command 객체 */}
      <Edge
        from={{ x: LEFT_X + 340, y: ROW2 + PANEL_H }}
        to={{ x: LEFT_X + 340, y: ROW4 }}
        routing="orthogonal"
        markerEnd="arrow"
        stroke={ink}
      />
      {label(LEFT_X + 352, ROW3 + PANEL_H + 26, '협력자에게 넘기는 것이 요청 하나이면')}
    </Canvas>
  );
}

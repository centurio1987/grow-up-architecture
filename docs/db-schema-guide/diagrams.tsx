// Resume viz pipeline. Narrative panels represent artifacts, not runtime nodes.
import React from '/Users/centurio/resume/node_modules/react/index.js';
import { Canvas, Edge, useVizFoundation } from '/Users/centurio/resume/node_modules/@centurio1987/bbangto-ui-visualization/dist/index.js';
import { DiagramHeader, Panel, Callout, RoleBox, Frame } from '/Users/centurio/resume/diagrams/_frame';

// Compatibility with the resume renderer’s classic-JSX fallback.
(globalThis as any).React = React;
function Text({x,y,children}:{x:number;y:number;children:React.ReactNode}) {
  const f=useVizFoundation(); return <text x={x} y={y} fontFamily={f.typography.titleFont} fontSize={13} fill={f.node.process.tagColor}>{children}</text>;
}
export function Pipeline(){
 const names=[['01 · 요구 발견','시나리오 · 용어 · 실제 예'],['02 · 사실과 변화','개념 관계 · 이벤트 · 상태'],['03 · 저장 판단','출처 · 시점 · 이력 · 경계'],['04 · 논리 모델','키 · 카디널리티 · 정규화'],['05 · 물리 모델','타입 · 제약 · 인덱스'],['06 · 반례 검증','재시도 · 경합 · 변경 · 파기']];
 return <Canvas viewBox="0 0 960 460" title="요구사항에서 스키마까지의 검증 순환" desc="요구 발견, 사실과 변화, 저장 판단, 논리 모델, 물리 모델, 반례 검증을 거치고 검증에서 요구 발견으로 되돌아간다." accessible="img">
 <DiagramHeader eyebrow="Evidence to schema" title="명세를 옮기지 말고, 저장할 사실의 근거를 연결한다"/>
 {names.map(([title,note],i)=>{const x=24+(i%3)*312,y=i<3?100:240;return <g key={title}><Panel x={x} y={y} width={288} height={95} title={title} tone={i===2?'solution':'sunken'}/><Text x={x+16} y={y+66}>{note}</Text></g>})}
 <Edge from={{x:312,y:146}} to={{x:336,y:146}}/><Edge from={{x:624,y:146}} to={{x:648,y:146}}/>
 <Edge from={{x:792,y:195}} to={{x:168,y:240}} waypoints={[{x:792,y:218},{x:168,y:218}]}/>
 <Edge from={{x:312,y:286}} to={{x:336,y:286}}/><Edge from={{x:624,y:286}} to={{x:648,y:286}}/>
 <Callout x={24} y={365} width={912} label="Feedback" lines={['검증에서 발견한 누락은 요구·예시·규칙까지 돌아가 수정한다. ERD만 고치면 근거가 끊긴다.']} tone="warn"/>
 </Canvas>;
}
export function Timeline(){return <Canvas viewBox="0 0 960 450" title="현재 상품 가격과 주문 확정 가격의 시간 의미" desc="주문 당시 12000원인 상품이 다음 날 15000원이 되어도 주문 항목의 확정 단가는 12000원이며 수량 2개의 합계는 24000원이다." accessible="img">
 <DiagramHeader eyebrow="Temporal meaning" title="같은 가격처럼 보여도, 서로 다른 사실이다"/>
 <Panel x={24} y={100} width={430} height={206} title="9월 22일 · 주문 접수" tone="sunken"/>
 <Panel x={506} y={100} width={430} height={206} title="9월 23일 · 상품 가격 변경" tone="sunken"/>
 <RoleBox x={44} y={157} w={390} role="database" name="상품 현재 가격 = 12,000원"/>
 <RoleBox x={526} y={157} w={390} role="database" name="상품 현재 가격 = 15,000원"/>
 <Text x={44} y={265}>주문 항목 단가 = 12,000원 · 수량 = 2</Text>
 <Text x={526} y={265}>주문 항목 단가 = 12,000원 · 수량 = 2</Text>
 <Edge from={{x:454,y:202}} to={{x:506,y:202}}/>
 <Callout x={24} y={337} width={912} label="Business fact" lines={['상품 ID는 정체성을 연결한다. 확정 단가는 거래 당시 합의한 값을 보존한다.','이 예제의 합계는 불변인 단가 × 수량으로 계산한다. 할인·세금이 생기면 규칙을 다시 정한다.']} tone="solution"/>
 </Canvas>}
export function Boundary(){return <Canvas viewBox="0 0 960 472" title="주문 트랜잭션과 외부 알림 경계" desc="주문, 주문 항목, 최초 상태 이력은 하나의 DB 트랜잭션으로 기록한다. 외부 알림까지 원자성을 가정하지 않는다. 필요하면 outbox를 같은 트랜잭션에 추가하고 중복을 견디는 별도 전달을 설계한다." accessible="img">
 <DiagramHeader eyebrow="Consistency boundaries" title="함께 참이어야 하는 조건과 외부 효과를 구분한다"/>
 <Frame x={24} y={115} width={560} height={220} label="ONE DATABASE TRANSACTION">
 <RoleBox x={44} y={140} w={240} role="database" name="주문 + 항목" note="최소 1개 항목"/>
 <RoleBox x={314} y={140} w={248} role="database" name="상태 이력" note="최초 접수 이력"/>
 <Text x={44} y={285}>실패하면 전체 롤백 · 확정 금액과 항목은 불변</Text>
 </Frame>
 <RoleBox x={650} y={150} w={286} role="external" name="외부 알림 서비스" note="별도 실패·재시도 가능"/>
 <Edge from={{x:584,y:208}} to={{x:650,y:208}} strokeDasharray="6 4"/>
 <Text x={650} y={292}>필요 시 outbox + 중복 방어</Text>
 <Callout x={24} y={365} width={912} label="Not an identity" lines={['Aggregate는 도메인 정합성 설계 단위다. 테이블 하나나 DB 전체의 제약 범위와 같지 않다.','외부 효과까지 보장하려면 전달·재시도·보상 요구를 별도로 설계해야 한다.']} tone="warn"/>
 </Canvas>}
export function Relations(){return <Canvas viewBox="0 0 960 510" title="주문 예제의 논리 관계" desc="고객 하나는 주문 0개 이상을 가진다. 접수된 주문은 항목 1개 이상과 상태 이력 1개 이상을 가진다. 상품 하나는 주문 항목 0개 이상에 참조된다. FK만으로 주문의 최소 자식 개수는 강제되지 않는다." accessible="img">
 <DiagramHeader eyebrow="Logical relationships" title="관계의 수량과 불변식까지 읽을 수 있는 모델"/>
 <Panel x={24} y={115} width={235} height={108} title="고객 customer" tone="sunken"/><Text x={40} y={178}>PK customer_id</Text>
 <Panel x={352} y={115} width={250} height={108} title="주문 sales_order" tone="info"/><Text x={368} y={178}>PK order_id · FK customer_id</Text>
 <Panel x={699} y={115} width={237} height={108} title="상태 이력" tone="sunken"/><Text x={715} y={178}>PK (order_id, seq)</Text>
 <Panel x={352} y={315} width={250} height={108} title="주문 항목 order_item" tone="solution"/><Text x={368} y={379}>PK (order_id, line_no)</Text>
 <Panel x={24} y={315} width={235} height={108} title="상품 product" tone="sunken"/><Text x={40} y={379}>PK product_id</Text>
 <Edge from={{x:259,y:205}} to={{x:352,y:205}} markerEnd="none"/><Text x={269} y={187}>1 : 0..N</Text>
 <Edge from={{x:602,y:205}} to={{x:699,y:205}} markerEnd="none"/><Text x={614} y={187}>1 : 1..N</Text>
 <Edge from={{x:475,y:223}} to={{x:475,y:315}} markerEnd="none"/><Text x={487} y={272}>1 : 1..N</Text>
 <Edge from={{x:259,y:397}} to={{x:352,y:397}} markerEnd="none"/><Text x={269} y={379}>1 : 0..N</Text>
 <Text x={24} y={477}>접수된 주문 기준의 업무 관계다. 자식 최소 1개는 FK만으로 보장되지 않는다.</Text>
 </Canvas>}

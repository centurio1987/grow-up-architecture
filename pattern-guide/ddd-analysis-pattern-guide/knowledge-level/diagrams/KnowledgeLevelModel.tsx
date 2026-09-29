// @relation layered
// @viz-type VT-101
// 역할 규약: **면제 ④(모델형)** — 칸이 분석 층위의 개념이다.
// 출처: Fowler Analysis Patterns 2장 그림 2.9 · 2.10(apchap2.pdf 의 knowledge · operational 구분선과 OCL 제약) ·
//       Organization Structures 개정 초안(accountability.pdf) 「Knowledge Level (32)」 의 그림 0.14 와 연결 규칙 그림 0.10 ·
//       DDD Reference 「Knowledge Level」
//
// 주장: 두 층이다. 아래층은 매일 생기는 사실(설비 · 점검)이고 위층은 그 사실을 규정하는
// 종류와 규칙(설비 종류 · 점검 종류)이다. 참조는 아래에서 위로만 가고, 위층끼리의 연관이
// 아래층 사실의 허용 조합을 가른다.
import { Canvas } from '@centurio1987/bbangto-ui-visualization';
import { Callout, DiagramHeader, GUTTER } from '../../../../viz/frame/frame';
import { DomainModel, type DomainModelSpec } from '../../../../viz/frame/domain-model';

const W = 900;
/** 경계와 칸 사이 여백. AccountingModelMap 과 같은 값으로 두어 카디널리티 라벨이 점선 위에 앉지 않게 한다. */
const PAD = 10;

const SPEC: DomainModelSpec = {
  entities: [
    { id: 'etype', name: 'EquipmentType', attributes: ['이름'] },
    {
      id: 'itype',
      name: 'InspectionType',
      attributes: ['이름', '재는 항목', '단위', '정상 범위'],
    },
    { id: 'equipment', name: 'Equipment', attributes: ['식별자', '이름'] },
    {
      id: 'inspection',
      name: 'Inspection',
      attributes: ['점검 시점', '측정값', '판정'],
    },
  ],
  relations: [
    // 운영 → 지식. 연관이라 계층으로 안 세므로 어느 쪽이 위인지만 말한다.
    { from: 'inspection', to: 'itype', kind: 'association', fromCard: '*', toCard: '1', above: 'to' },
    { from: 'equipment', to: 'etype', kind: 'association', fromCard: '*', toCard: '1', above: 'to' },
    // 같은 층 안 — 점검 종류가 허용하는 설비 종류. 이 연관이 아래층의 허용 조합을 가른다.
    // 두 칸 사이 통로가 56px 뿐이라 `1..*` 라벨이 칸에 덮인다(실측). 다중도는 아래 콜아웃과 본문이 말로 쓴다.
    { from: 'itype', to: 'etype', kind: 'association' },
    // 같은 층 안 — 점검 한 건의 대상 설비.
    { from: 'inspection', to: 'equipment', kind: 'association', fromCard: '*', toCard: '1' },
  ],
  groups: [
    { id: 'knowledge', label: '지식 층위', members: ['etype', 'itype'] },
    { id: 'operational', label: '운영 층위', members: ['equipment', 'inspection'] },
  ],
};

export default function KnowledgeLevelModel() {
  return (
    <Canvas width={W} height={640}>
      <DiagramHeader eyebrow="Knowledge level" title="사실은 아래층에, 종류와 규칙은 위층에 산다" />
      <DomainModel spec={SPEC} origin={{ x: GUTTER + PAD, y: 104 + PAD + 8 }} groupPad={PAD} />
      <Callout
        x={GUTTER}
        y={500}
        width={W - GUTTER * 2}
        label="세 규칙"
        lines={[
          '참조는 아래에서 위로만 간다 — 점검 종류는 자기로 기록된 점검이 몇 건인지 모른다',
          '점검의 판정은 InspectionType 의 정상 범위가 정한다. 점검은 그 범위를 값으로 베껴 들고 태어난다',
          'InspectionType 하나는 EquipmentType 을 하나 이상 허용 목록으로 가리키고,',
          'Inspection 은 대상 설비의 EquipmentType 이 그 목록에 있을 때만 만들어진다',
        ]}
      />
    </Canvas>
  );
}

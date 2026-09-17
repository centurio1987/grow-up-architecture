---
title: Account와 Entry의 관계 설계
user: 유저
ai: Claude
created: 2026-06-30
updated: 2026-06-30
summary: |
  Account와 Entry를 어떤 aggregate 경계로 묶을지 세 가지 시나리오(① Composite Association value, ② 별도 Aggregate, ③ Aggregated Association value)를 검토했다. 결정 기준은 영속성 편의나 관계의 직관성이 아니라 "불변식이 어디에 있는가"이며, Vernon의 aggregate 4원칙(진짜 불변식만 한 경계에·작은 aggregate·id 참조·경계 밖은 결과적 일관성)이 기준선이다.

  결론: 기본값은 시나리오 2(Entry를 별도 aggregate로 두고 Account를 id 참조). 시나리오 1은 무한히 커지는 Entry를 id 없는 value로 두어 영속화·동시성 문제를 일으키므로 지양. 시나리오 3은 불변식으로 뒷받침되지 않는 Entry 컬렉션을 Account에 매달아 "불필요한 코드"가 되므로 지양. 단, "잔액 음수 금지"처럼 Account 단위 불변식이 동기적으로 필요하면 시나리오 2에 파생 value(balance)만 더한 하이브리드를 쓴다 — 이는 컬렉션이 아니라 요약값만 들고 있다는 점에서 시나리오 3과 다르다. 이중부기라면 불변식은 보통 Transaction 수준에 있으므로 경계도 그에 맞춰 달라진다.
---

# 문제 설정: 결정 기준은 불변식의 위치
> 결정 기준은 영속성 편의·직관성이 아니라 불변식의 위치. Aggregate는 작게, 다른 aggregate는 id로 참조한다.

## @user
account, 패턴을 구현한다고 하자. 이때 설계 컨셉에 따라서 발생하는 문제점을 발견하고 어떻게 해결할지 고민해 볼 것이다. 아래 의견을 보고 어떻게 생각하는지 너의 의견을 말 해봐라.

Account-Entry 관계를 어떤 aggregate 경계로 모델링할지 세 가지 시나리오를 두고 고민한다.

## @ai
먼저 결정 기준을 못 박자. 세 시나리오의 우열은 "영속성 편의"나 "관계의 직관성"이 아니라 불변식(invariant)이 어디에 있는가로 갈린다. Aggregate 경계는 본질적으로 "한 트랜잭션 안에서 함께 일관성을 지켜야 하는 것들의 묶음"이다.

Vaughn Vernon의 aggregate 설계 4원칙을 기준선으로 쓰자.
1. 진짜 불변식만 하나의 일관성 경계 안에 둔다.
2. Aggregate는 작게 설계한다.
3. 다른 aggregate는 객체 참조가 아니라 식별자(id)로 참조한다.
4. 경계 밖의 일관성은 결과적 일관성(eventual consistency)으로 맞춘다.

그래서 모든 결정은 한 질문으로 환원된다 — "Account와 Entry가 한 트랜잭션에서 원자적으로 지켜야 하는 규칙이 실제로 존재하는가?"

여기서 사용자가 1번 시나리오에서 짚은 "Entry는 필연적으로 방대해진다"는 관찰은 단순한 영속화 불편이 아니라 강한 설계 신호다. 무한히 커지는 컬렉션을 aggregate 안에 두는 것은 2번 원칙(작은 aggregate)과 정면으로 충돌한다.

# 시나리오 1 — Composite Association 밸류
> Entry를 id 없는 value로 두면 생기는 영속화·동시성 문제는 잘못된 경계의 증상. Entry는 무한히 커지는 entity라 비추천.

## @user
\# 1. Entry가 Account Aggregate의 Composite Association 관계 밸류인 경우

entry는 account aggregate 불변식 대상에 속하기 때문에 해당 aggregate의 value로 볼 수 있다. 하지만 entry는 필연적으로 방대해 지고, 영속성 데이터로 변환 할 때는, 별도의 테이블을 별도로 만들 것이다. account aggregate가 entry를 value로 가지고 있다면, entry는 id를 갖지 않는다. 그렇다면 entry가 추가, 삭제 될 경우, 영속 데이터에 반영하기 위해서는 응용 서비스에서 까다로운 로직을 수행해야 한다.

## @ai
이 구조에서 사용자가 발견한 문제들 — id가 없다, 추가/삭제 시 응용 서비스가 까다로운 영속화 로직을 떠안는다 — 은 우연한 불편이 아니라 잘못된 경계가 드러내는 증상이다.

세 가지로 정리한다.

(1) Entry는 사실상 entity처럼 행동한다. 개별적으로 추가·삭제·조회·참조되는 대상이기 때문이다. 그런데 이걸 id 없는 value 컬렉션으로 욱여넣으면, ORM은 컬렉션 전체를 delete-and-reinsert 하거나 수동 diff 로직을 짜야 한다. 사용자가 말한 "까다로운 로직"의 정체가 바로 이것이고, 이는 모델이 도메인의 실체(Entry는 식별자를 가진 entity)와 어긋났다는 신호다.

(2) 더 치명적인 건 동시성과 성능이다. Entry 하나를 추가하려고 Account aggregate 전체(수만 건의 entry)를 로드·재구성해야 하고, 그 거대한 aggregate에 락이 걸린다. 같은 계좌에 동시에 두 건이 기입되면 충돌·재시도가 빈발한다.

(3) 도메인 관점에서도 Account는 보통 "기입을 담는 컨테이너"가 아니라 "기입의 스트림"이다. 은행 계좌가 자기 거래내역 전부를 물리적으로 "소유"하지 않는 것과 같다.

결론: 비추천. 영속화 불편 때문이 아니라, Entry가 무한히 커지는 entity라는 본질과 충돌하기 때문이다.

# 시나리오 2 — 별도 Aggregate
> DDD 정석. 작은 aggregate·id 참조로 확장성을 얻는다. "직관성 저하"는 도메인 진실의 반영. 동기적 불변식만 예외.

## @user
\# 2. Entry가 별도의 Aggregate인 경우

Entry 추가/삭제는 도메인 시나리오 안에서는 나타나지 않게 된다. 그렇다면 Account는 Entry와의 관련성이 시나리오에서 사라지며, value로 entry의 흔적을 포함할 필요가 없다. 로직은 깔끔하다. Entry의 명세를 보면 Account가 나타나겠지만, Account는 아마 entry를 모를 것이다. 관계성에 대한 직관적 이해가 떨어지는 패턴이다.

## @ai
DDD 정석에 가장 부합하는 안이다. Entry를 별도 aggregate로 두고 Account를 id로만 참조하면 — aggregate가 작아지고, Entry 추가/삭제가 Account 로드 없이 가능해지며, 계좌 단위 락 경합이 사라진다. 사용자 말대로 로직도 깔끔하다.

사용자가 단점으로 지적한 "관계성에 대한 직관적 이해가 떨어진다"는 점은 다시 볼 필요가 있다. 이건 단점이라기보다 도메인의 진실을 그대로 반영한 것에 가깝다. Account는 자기 역사를 "소유"하지 않는다. Entry가 Account를 향해 기록될 뿐이다(Entry → Account 방향의 단방향 참조). 은행 원장 모델과 정확히 일치한다. 객체 그래프 상의 직관(Account 안에 entry가 보여야 친숙하다)을 포기하는 대신, 트랜잭션 경계의 정확성과 확장성을 얻는다.

다만 한 가지 단서: 정말로 "Account 단위 불변식"이 동기적으로 강제되어야 한다면(예: 잔액이 음수가 되면 안 됨) 이 순수한 형태만으로는 부족할 수 있다. 그 처리는 종합 의견에서 다룬다.

# 시나리오 3 — Aggregated Association 밸류
> 불변식으로 뒷받침되지 않는 Account의 Entry 컬렉션은 불필요한 코드. 정당화되려면 컬렉션이 아닌 요약값(잔액)만 노출해야 한다.

## @user
\# 3. Entry가 Account Aggregate의 Aggregated Association 관계 밸류인 경우

Entry는 별도의 aggregate기도 하고, Account의 value에 드러나는 개념이기도 하다. 이 시나리오에서도 역시, Entry 추가/삭제는 도메인 시나리오 상에는 드러나지 않는다. Account는 Entry와의 관련성을 드러내게 된다. 하지만, entry가 account aggregate 불변식에 영향을 미치지 않는다면, 불필요한 코드일 뿐이다.

## @ai
먼저 사용자가 "Account가 Entry와의 관련성을 드러낸다"고 할 때 두 가지로 읽을 수 있다 — (a) Entry 컬렉션을 통째로 노출, (b) 불변식 검증에 필요한 파생 요약값(잔액)만 노출. 무한히 커지는 Entry를 다 안고 가는 (a)는 앞 시나리오에서 이미 접은 선택지이므로, 사용자의 의도는 (b)로 읽는 게 자연스럽다. 그리고 (b)라면 이건 시나리오 3이라기보다 '시나리오 2 + 파생 value 하이브리드'이며, 종합 의견에서 따로 구분한다.

문제가 되는 건 (a)로 읽었을 때다. 사용자가 스스로 "불변식에 영향을 미치지 않으면 불필요한 코드"라 결론 냈는데, 그 컬렉션이 불변식으로 뒷받침되지 않는 한 정확히 맞는 말이다. 동의한다. (a)의 숨은 비용을 더 짚자면:
- 그 컬렉션은 lazy-load 유혹을 만든다. account.getEntries()가 있으면 누군가는 반드시 호출하고, 결국 시나리오 1의 "전체 로드" 문제가 뒷문으로 돌아온다.
- 별도 aggregate인 Entry와 Account 안의 그 흔적 사이에 중복 상태 동기화 부담이 생긴다.
- "이 컬렉션은 무한 entry를 다 들고 오는가, 일부만인가?"라는 경계 혼란이 생긴다.

정리: (a) 컬렉션 노출은 지양, (b) 파생 요약값만 노출이면 그건 시나리오 3이 아니라 하이브리드로 부른다. 어느 쪽이든 'Account가 Entry 컬렉션을 소유'하는 형태는 답이 아니다.

# 종합 의견 및 권고
> 권고: 시나리오 2 기본, 동기 불변식이 있으면 파생 value 하이브리드. 시나리오 1·3은 지양. 불변식 위치를 먼저 확정하라.

## @ai
권고 순위를 명확히 한다 — 기본은 시나리오 2, 동기적 불변식이 있으면 "시나리오 2 + 파생 value" 하이브리드, 시나리오 1과 3은 지양.

판단 플로우는 단 하나의 질문에서 갈린다: "Account와 Entry를 한 트랜잭션에서 원자적으로 지켜야 할 규칙이 있는가?"

A. 없다 → 순수 시나리오 2. Entry는 별도 aggregate, Account를 id로 참조. 끝.

B. 있다(예: "잔액이 음수가 되면 안 됨") → 그 불변식을 지키는 데 필요한 것은 '모든 entry'가 아니라 '현재 잔액'이다. 그러니 Account에는 balance 같은 파생 value object만 두고, Entry는 여전히 별도 aggregate로 둔다. 응용 서비스는 한 트랜잭션 안에서: Account 로드 → balance로 불변식 검사 → Entry 생성 → Account.balance 갱신. 이러면 무한 컬렉션을 끌어안지 않고도 불변식을 동기적으로 강제할 수 있다.

이 B안은 시나리오 3과 명확히 다르다. 시나리오 3은 entry "컬렉션"을 Account에 들고 있고, 하이브리드는 불변식에 꼭 필요한 "요약값(잔액)"만 들고 있다. 들고 있는 것의 크기와 목적이 다르다.

마지막으로 한 가지 더: 이게 이중부기(double-entry) 회계라면, 핵심 불변식(차변 합 = 대변 합)은 보통 Account가 아니라 Transaction 수준에 있다. 그 경우 Entry들을 묶는 aggregate는 Transaction이 되고, Account는 또 다른 id 참조 대상이 된다. 그래서 어떤 시나리오든 출발점은 똑같다 — "불변식이 어디에 있는지"를 먼저 확정하라. 그게 정해지면 경계는 거의 자동으로 따라온다.

# 후속 논의 — Entry의 Aggregate 자격과 가이드 정합성
> Entry는 불변 Entity이며 trivial aggregate 자격은 있으나, 복식부기면 진짜 root는 Transaction. account-pattern 스니펫은 DDD 전술로 보면 시나리오 1이라 실제로 충돌 — 개념(잔액=불변 Entry 합)은 유지하되 코드 경계는 고친다.

## @user
1. 내가 애기한 3안에서의 aggregated value는 파생 value임을 함축하고 있다. 따라서, 너의 의견에 동의 한다. 추가적으로, Entry는 전역 식별성이 있지만, 수정 시나리오는 없어서 연속성은 없다. 또한 불변식도 존재하지 않는다. aggregate으로써 충분히 자격이 있는지 논의해보고 싶다.
2. 니가 작성한 가이드 "ddd-analysis-pattern-guide/account-pattern"는 entry는 composite association value다. 이에 대한 너의 입장 정리가 필요하다.

## @ai
두 지점 다 핵심을 정확히 짚었다. 하나씩 정리한다.

**1. Entry는 aggregate 자격이 있는가 — 불변식이 없어도 된다**

먼저 섞여 있는 두 질문을 분리하자: (a) Entry는 Entity인가 Value인가, (b) Entry는 Aggregate(root)인가.

(a) Entity다. 기준은 '가변성'이 아니라 '식별성이 의미를 갖는가'다. 금액·시각·계정이 똑같은 두 Entry도 서로 다른 두 개의 사실(posting)이다 — 같은 1000원을 두 번 입금하면 별개 사건이고, 역분개는 특정 원본 Entry를 id로 가리킨다. 속성이 같아도 구별된다 → 정체성이 load-bearing → Entity. '불변이라 Value 아니냐', '수정이 없어 연속성이 없으니 Value 아니냐'는 성립하지 않는다. Evans의 '연속성(thread of continuity)'은 Entity의 흔한 표지일 뿐 정의가 아니다. 변경이 없으면 연속성이 degenerate(늘 자기 자신)할 뿐, 정체성이 사라지는 게 아니다. 이벤트 소싱의 도메인 이벤트가 바로 '불변 + 식별성 있는 Entity'의 표준 사례다. → Entry는 불변(immutable) Entity다.

(b) '불변식이 없다'는 것은 aggregate 자격의 결격 사유가 아니다. Aggregate는 '풍부한 불변식을 가진 것'이 아니라 '한 트랜잭션의 일관성·변경 단위이자 외부에서 id로 참조되는 단위'다. Vernon은 오히려 aggregate를 작게(이상적으로 단일 entity) 두라 한다. 식별성을 갖고 원자적으로 생성·참조되면 내부 불변식이 빈약/부재여도 'trivial(크기 1) aggregate'로서 자격은 충분하다. 그러니 '불변식이 없으니 aggregate가 못 된다'도 틀렸다.

진짜 분기점은 그 다음이다 — 자격이 있다 ≠ Entry를 root로 삼아야 한다. 다시 '불변식이 어디 있는가'다. 네가 'Entry에 불변식이 없다'고 한 건 단일 Entry를 떼어놓고 보면 맞다 — posting 하나엔 자체적으로 지켜야 할 내부 규칙이 없다. 다만 시야를 복식부기로 넓히면 생성 시점 불변식이 분명히 드러난다: 차변 합 = 대변 합(한 거래에 속한 Entry들의 합이 0). 이 불변식은 단일 Entry에도, Account에도 없고 여러 Entry를 묶는 Transaction에 있다. 그러면:
- 진짜 aggregate root는 Transaction. 자기 Entry들을 불변 child entity로 소유하고 균형 불변식을 원자적으로 강제한다.
- Entry는 'Transaction aggregate의 불변 child entity' — 전역 식별성은 갖되(역분개·감사가 id로 참조) 독립적으로 생성/수정되지 않는다.
- Account는 또 다른 id 참조 대상, 필요 시 파생 balance value만 보유(앞의 하이브리드).

정리: 정말로 Entry끼리 묶는 생성 불변식이 없다면 → Entry를 trivial aggregate로 둬도 자격 있음(불변식 없음은 문제 아님). 복식부기처럼 균형 불변식이 있다면 → root는 Transaction, Entry는 그 child. 어느 쪽이든 'Entry를 Account 안의 value로'(시나리오 1/3)는 답이 아니다 — 결론은 그대로다.

**2. account-pattern 가이드와의 정합성 — 모순이 맞다. 개념은 살리고 경계는 고친다**

지적이 옳다. 먼저 분명히 하자: 이건 모순이 맞다. account-pattern.md의 `class Account { List<Entry> entries; ... }` 는 Entry를 id 없는 불변 항목으로 Account 안에 넣는다 — DDD 전술로 읽으면 정확히 시나리오 1이고, 이 문서가 '지양'으로 결론낸 바로 그 구조다. "층위가 달라서 모순이 아니다"라는 말로 덮지 않겠다. 층위가 다르다는 변호가 성립하려면 그 스니펫이 aggregate 경계를 *주장하지 않음*을 입증해야 하는데, `List<Entry>` 필드는 그 자체로 경계를 암시한다. 그러니 그 변호는 절반만 성립한다 — 어느 절반인지 갈라서 책임을 묻는다.

- **개념(분석 패턴) 층위 — 무죄, 유지.** account-pattern.md가 진짜로 말하려는 명제는 '잔액은 저장된 숫자가 아니라 불변 Entry들의 합'이다. 이건 *파생 관계*에 대한 진술이지 aggregate 경계에 대한 진술이 아니다. 경계를 어디에 긋든 참이다. 이 부분은 옳고 손대지 않는다.
- **코드 스니펫 층위 — 유죄, 수정 대상.** 그 개념을 `List<Entry>` 필드로 표현한 순간, 스니펫은 의도와 무관하게 '전술 경계'를 침범해 DDD 원칙과 충돌한다. '교육용 예시라서 괜찮다'는 면죄부는 발급하지 않는다 — 독자는 코드를 설계 권고로 읽기 때문이다. 이 스니펫은 그대로면 틀렸다.

가이드 자신도 이미 증상을 자백하고 있다: 단점·한계에서 '항목 많으면 매번 합산 부담 → 스냅샷/캐시', '동시 입출금 정합성(락·버전) 별도 보장', 'Transaction 결합 필수'를 적었고, 클래스 다이어그램도 composition(`*--`)이 아니라 `o--`(aggregation)으로 '소유'보다 약한 관계를 그린다. 가이드는 경계가 불편하다는 걸 무의식적으로 이미 알고 있다.

결론 — 개념은 살리고 경계는 고친다.
- 분석 패턴의 명제('잔액 = 불변 Entry 집합의 합')는 그대로 둔다.
- 코드 스니펫은 고친다. '이건 개념 예시일 뿐'이라는 면피 주석을 다는 선에서 그치지 말고, (복식부기면) Entry는 Transaction의 불변 child, Account는 id 참조 + 파생 balance value인 형태 — 이 문서의 시나리오 2 / 하이브리드 — 를 정상 경계로 함께 보여야 한다. 개념 예시를 남기더라도 'aggregate 경계 권고가 아니며 구현 경계는 이 문서를 따른다'는 교차참조를, 예시 자체가 오해를 부르지 않을 만큼 분명히 단다.
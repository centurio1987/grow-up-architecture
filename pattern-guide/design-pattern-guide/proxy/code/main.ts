/** Subject — 계약서 한 건에 물을 수 있는 연산 모양. Client 는 이 타입으로만 계약서를 다룬다. */
interface Contract {
  id(): string;
  title(): string;
  pageCount(): number;
  page(n: number): string;
  digest(): string;
}

/** RealSubject — 스캔 원본. 만들어지는 순간 원본을 전부 읽으므로 만드는 일 자체에 품이 많이 든다. */
class ScannedContract implements Contract {
  private readonly pages: string[] = [];

  constructor(
    private readonly docId: string,
    private readonly docTitle: string,
    pageCount: number,
    body: string,
    loadLog: string[],
  ) {
    for (let n = 1; n <= pageCount; n++) {
      this.pages.push(`[${docId} p${n}] ${body}`);
    }
    loadLog.push(docId);
  }

  id(): string {
    return this.docId;
  }

  title(): string {
    return this.docTitle;
  }

  pageCount(): number {
    return this.pages.length;
  }

  page(n: number): string {
    return this.pages[n - 1]!;
  }

  digest(): string {
    const first = this.page(1);           // 자기 호출 — 바깥의 프록시를 거치지 않는다
    return first.slice(0, 26) + "...";
  }
}

/** Proxy(지연 생성) — 목록 메타데이터로 버티다가 본문이 필요할 때 RealSubject 를 만든다. */
class LazyContract implements Contract {
  private realSubject: Contract | null = null;

  constructor(
    private readonly docId: string,
    private readonly docTitle: string,
    private readonly pages: number,
    private readonly factory: () => Contract,
  ) {}

  private real(): Contract {
    if (this.realSubject === null) {
      this.realSubject = this.factory();
    }
    return this.realSubject;
  }

  id(): string {
    return this.docId;
  }

  title(): string {
    return this.docTitle;
  }

  pageCount(): number {
    return this.pages;
  }

  page(n: number): string {
    return this.real().page(n);
  }

  digest(): string {
    return this.real().digest();
  }
}

/** Proxy(권한 검사) — 열람 등급이 모자라면 본문 요청을 전달하지 않는다. */
class GuardedContract implements Contract {
  constructor(
    private readonly inner: Contract,
    private readonly required: number,
    private readonly clearance: number,
  ) {}

  id(): string {
    return this.inner.id();
  }

  title(): string {
    return this.inner.title();
  }

  pageCount(): number {
    return this.inner.pageCount();
  }

  page(n: number): string {
    if (this.clearance < this.required) {
      return `[denied] ${this.inner.id()} p${n} needs clearance ${this.required}`;
    }
    return this.inner.page(n);
  }

  digest(): string {
    return this.inner.digest();
  }
}

/** Client — 선반에 꽂힌 것이 대리자인지 원본인지 모른 채 Subject 연산만 부른다. */
class ContractDesk {
  constructor(private readonly shelf: readonly Contract[]) {}

  listing(): string {
    return this.shelf.map((c) => `${c.id()} ${c.title()} ${c.pageCount()}p`).join(" · ");
  }

  private find(id: string): Contract {
    const found = this.shelf.find((c) => c.id() === id);
    if (found === undefined) {
      throw new Error(`no such contract: ${id}`);
    }
    return found;
  }

  open(id: string, n: number): string {
    return this.find(id).page(n);
  }

  digestOf(id: string): string {
    return this.find(id).digest();
  }
}

const NDA_BODY = "비밀정보는 서면으로 표시한 것에 한정한다";
const MNA_BODY = "양수인은 잔금일에 지분 전부를 인수한다";

function shelfFor(clearance: number, vault: Map<string, Contract>): Contract[] {
  return [
    new GuardedContract(vault.get("NDA-2031")!, 1, clearance),
    new GuardedContract(vault.get("MNA-0079")!, 3, clearance),
  ];
}

const loadLog: string[] = [];
const vault = new Map<string, Contract>();
vault.set(
  "NDA-2031",
  new LazyContract("NDA-2031", "비밀유지계약", 4,
    () => new ScannedContract("NDA-2031", "비밀유지계약", 4, NDA_BODY, loadLog)),
);
vault.set(
  "MNA-0079",
  new LazyContract("MNA-0079", "지분양수도계약", 12,
    () => new ScannedContract("MNA-0079", "지분양수도계약", 12, MNA_BODY, loadLog)),
);

const legal = new ContractDesk(shelfFor(3, vault));
const intern = new ContractDesk(shelfFor(1, vault));

console.log(`1) shelf: ${legal.listing()} | scans loaded ${loadLog.length}`);
console.log(`2) legal opens NDA-2031 p2: ${legal.open("NDA-2031", 2)} | scans loaded ${loadLog.length}`);
console.log(`3) legal opens NDA-2031 p3: ${legal.open("NDA-2031", 3)} | scans loaded ${loadLog.length}`);
console.log(`4) intern opens MNA-0079 p2: ${intern.open("MNA-0079", 2)} | scans loaded ${loadLog.length}`);
console.log(`5) intern reads MNA-0079 digest: ${intern.digestOf("MNA-0079")} | scans loaded ${loadLog.length}`);
console.log(`6) legal opens MNA-0079 p2: ${legal.open("MNA-0079", 2)} | scans loaded ${loadLog.length}`);

const directLog: string[] = [];
const noProxy = new ContractDesk([
  new ScannedContract("NDA-2031", "비밀유지계약", 4, NDA_BODY, directLog),
  new ScannedContract("MNA-0079", "지분양수도계약", 12, MNA_BODY, directLog),
]);
console.log(`7) no proxy, listing only: ${noProxy.listing()} | scans loaded ${directLog.length}`);

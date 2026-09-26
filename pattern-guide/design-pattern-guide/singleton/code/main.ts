class ShopConfig {
  private static code = "";

  private constructor() {}

  static setBranchCode(code: string): void {
    ShopConfig.code = code;
  }

  static branchCode(): string {
    return ShopConfig.code;
  }
}

class OrderNumberIssuer {
  private static uniqueInstance: OrderNumberIssuer | null = null;

  private readonly prefix: string;
  private issued = 0;

  private constructor() {
    this.prefix = ShopConfig.branchCode();
  }

  static instance(): OrderNumberIssuer {
    if (OrderNumberIssuer.uniqueInstance === null) {
      OrderNumberIssuer.uniqueInstance = new OrderNumberIssuer();
    }
    return OrderNumberIssuer.uniqueInstance;
  }

  next(): string {
    this.issued += 1;
    return `${this.prefix}-${String(this.issued).padStart(4, "0")}`;
  }

  issuedCount(): number {
    return this.issued;
  }
}

class OrderDesk {
  readonly issuer: OrderNumberIssuer;

  private readonly channel: string;

  constructor(channel: string) {
    this.channel = channel;
    this.issuer = OrderNumberIssuer.instance();
  }

  accept(): string {
    return `${this.channel} ${this.issuer.next()}`;
  }
}

ShopConfig.setBranchCode("B");
console.log(`branch=${ShopConfig.branchCode()}`);

const web = new OrderDesk("web");
const phone = new OrderDesk("phone");
const mobile = new OrderDesk("mobile");

console.log(`same-instance=${web.issuer === phone.issuer}`);
console.log(web.accept());
console.log(phone.accept());
console.log(mobile.accept());
console.log(`issued=${OrderNumberIssuer.instance().issuedCount()}`);

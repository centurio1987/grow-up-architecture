/**
 * Singleton 패턴 샘플.
 *
 * 모듈 스코프 변수로 인스턴스를 보관하고, getInstance 정적 메서드를 통해서만
 * 접근 가능하도록 한다. private 생성자로 외부 new 호출을 차단한다.
 */
class Singleton {
  private static instance: Singleton | null = null;
  public readonly createdAt: string;

  private constructor() {
    this.createdAt = "first-init";
  }

  public static getInstance(): Singleton {
    if (Singleton.instance === null) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}

function main(): void {
  const a = Singleton.getInstance();
  const b = Singleton.getInstance();
  console.log(`a === b: ${a === b}`);
  console.log(`createdAt: ${a.createdAt}`);
}

main();

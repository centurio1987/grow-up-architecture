// analyzer 회귀 픽스처 case4. 기대 결과는 README.md

class AppConfig {
  private static readonly values = new Map<string, string>();

  get(key: string): string | undefined {
    return AppConfig.values.get(key);
  }

  set(key: string, value: string): void {
    AppConfig.values.set(key, value);
  }
}

const a = new AppConfig();
const b = new AppConfig();
a.set("region", "ap-northeast-2");
console.log(a === b, b.get("region"));

export {};

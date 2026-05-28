package patterns;

/**
 * Singleton 패턴 샘플.
 *
 * Initialization-on-demand holder idiom 사용:
 * - JVM 의 클래스 로딩 메커니즘에 의해 스레드 안전이 자동 보장된다.
 * - 첫 접근 시점에만 초기화된다 (lazy).
 *
 * 실행: ./gradlew run -PmainClass=patterns.Singleton
 */
public final class Singleton {
    private final String createdAt;

    private Singleton() {
        this.createdAt = "first-init";
    }

    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public static void main(String[] args) {
        Singleton a = Singleton.getInstance();
        Singleton b = Singleton.getInstance();
        System.out.println("a == b: " + (a == b));
        System.out.println("a hash: " + System.identityHashCode(a) +
                           ", b hash: " + System.identityHashCode(b));
        System.out.println("createdAt: " + a.getCreatedAt());
    }
}

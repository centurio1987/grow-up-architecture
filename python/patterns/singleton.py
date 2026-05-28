"""Singleton 패턴 샘플.

같은 클래스에 대한 모든 생성 호출이 동일한 인스턴스를 반환하는지 확인한다.
"""

from __future__ import annotations


class Singleton:
    _instance: "Singleton | None" = None

    def __new__(cls) -> "Singleton":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        # __new__ 가 같은 객체를 돌려주더라도 __init__ 은 매번 호출되므로
        # 초기화는 1회만 수행되도록 가드한다.
        if getattr(self, "_initialized", False):
            return
        self.created_at = "first-init"
        self._initialized = True


def main() -> None:
    a = Singleton()
    b = Singleton()
    print(f"a is b: {a is b}")
    print(f"id(a)={id(a)}, id(b)={id(b)}")
    print(f"created_at: {a.created_at}")


if __name__ == "__main__":
    main()

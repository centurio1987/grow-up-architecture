//! Singleton 패턴 샘플.
//!
//! Rust 에서 "전역 단일 인스턴스" 는 보통 `OnceLock` 으로 표현한다.
//! - 스레드 안전
//! - 첫 접근 시점에 1회만 초기화 (lazy)
//!
//! 실행: `cargo run --example singleton`

use std::sync::OnceLock;

#[derive(Debug)]
struct Singleton {
    created_at: &'static str,
}

impl Singleton {
    fn instance() -> &'static Singleton {
        static INSTANCE: OnceLock<Singleton> = OnceLock::new();
        INSTANCE.get_or_init(|| Singleton {
            created_at: "first-init",
        })
    }
}

fn main() {
    let a = Singleton::instance();
    let b = Singleton::instance();

    // 같은 인스턴스인지 포인터 동등성으로 확인
    let same = std::ptr::eq(a, b);
    println!("a is b: {}", same);
    println!("a addr: {:p}, b addr: {:p}", a, b);
    println!("created_at: {}", a.created_at);
}

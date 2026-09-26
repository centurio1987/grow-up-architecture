mod config {
    use std::sync::{Mutex, OnceLock};

    pub struct ShopConfig;

    fn slot() -> &'static Mutex<String> {
        static SLOT: OnceLock<Mutex<String>> = OnceLock::new();
        SLOT.get_or_init(|| Mutex::new(String::new()))
    }

    impl ShopConfig {
        pub fn set_branch_code(code: &str) {
            *slot().lock().unwrap() = code.to_string();
        }

        pub fn branch_code() -> String {
            slot().lock().unwrap().clone()
        }
    }
}

mod issuer {
    use crate::config::ShopConfig;
    use std::sync::{Mutex, OnceLock};

    pub struct OrderNumberIssuer {
        prefix: String,
        issued: Mutex<u64>,
    }

    impl OrderNumberIssuer {
        fn new() -> OrderNumberIssuer {
            OrderNumberIssuer {
                prefix: ShopConfig::branch_code(),
                issued: Mutex::new(0),
            }
        }

        pub fn instance() -> &'static OrderNumberIssuer {
            static UNIQUE: OnceLock<OrderNumberIssuer> = OnceLock::new();
            UNIQUE.get_or_init(OrderNumberIssuer::new)
        }

        pub fn next(&self) -> String {
            let mut issued = self.issued.lock().unwrap();
            *issued += 1;
            format!("{}-{:04}", self.prefix, *issued)
        }

        pub fn issued_count(&self) -> u64 {
            *self.issued.lock().unwrap()
        }
    }
}

use config::ShopConfig;
use issuer::OrderNumberIssuer;

struct OrderDesk {
    issuer: &'static OrderNumberIssuer,
    channel: &'static str,
}

impl OrderDesk {
    fn new(channel: &'static str) -> OrderDesk {
        OrderDesk {
            issuer: OrderNumberIssuer::instance(),
            channel,
        }
    }

    fn accept(&self) -> String {
        format!("{} {}", self.channel, self.issuer.next())
    }
}

fn main() {
    ShopConfig::set_branch_code("B");
    println!("branch={}", ShopConfig::branch_code());

    let web = OrderDesk::new("web");
    let phone = OrderDesk::new("phone");
    let mobile = OrderDesk::new("mobile");

    println!("same-instance={}", std::ptr::eq(web.issuer, phone.issuer));
    println!("{}", web.accept());
    println!("{}", phone.accept());
    println!("{}", mobile.accept());
    println!("issued={}", OrderNumberIssuer::instance().issued_count());
}

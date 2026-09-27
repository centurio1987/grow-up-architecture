use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

/// Subject — 계약서 한 건에 물을 수 있는 연산 모양. Client 는 이 타입으로만 계약서를 다룬다.
trait Contract {
    fn id(&self) -> String;
    fn title(&self) -> String;
    fn page_count(&self) -> usize;
    fn page(&self, n: usize) -> String;
    fn digest(&self) -> String;
}

/// RealSubject — 스캔 원본. 만들어지는 순간 원본을 전부 읽으므로 만드는 일 자체에 품이 많이 든다.
struct ScannedContract {
    doc_id: String,
    doc_title: String,
    pages: Vec<String>,
}

impl ScannedContract {
    fn new(id: &str, title: &str, page_count: usize, body: &str, load_log: &Rc<RefCell<Vec<String>>>) -> Self {
        let mut pages = Vec::new();
        for n in 1..=page_count {
            pages.push(format!("[{} p{}] {}", id, n, body));
        }
        load_log.borrow_mut().push(id.to_string());
        Self { doc_id: id.to_string(), doc_title: title.to_string(), pages }
    }
}

impl Contract for ScannedContract {
    fn id(&self) -> String {
        self.doc_id.clone()
    }

    fn title(&self) -> String {
        self.doc_title.clone()
    }

    fn page_count(&self) -> usize {
        self.pages.len()
    }

    fn page(&self, n: usize) -> String {
        self.pages[n - 1].clone()
    }

    fn digest(&self) -> String {
        let first = self.page(1); // 자기 호출 — 바깥의 프록시를 거치지 않는다
        let head: String = first.chars().take(26).collect();
        format!("{}...", head)
    }
}

/// Proxy(지연 생성) — 목록 메타데이터로 버티다가 본문이 필요할 때 RealSubject 를 만든다.
struct LazyContract {
    doc_id: String,
    doc_title: String,
    pages: usize,
    factory: Box<dyn Fn() -> Rc<dyn Contract>>,
    real: RefCell<Option<Rc<dyn Contract>>>,
}

impl LazyContract {
    fn new(id: &str, title: &str, pages: usize, factory: Box<dyn Fn() -> Rc<dyn Contract>>) -> Self {
        Self {
            doc_id: id.to_string(),
            doc_title: title.to_string(),
            pages,
            factory,
            real: RefCell::new(None),
        }
    }

    fn real(&self) -> Rc<dyn Contract> {
        let mut slot = self.real.borrow_mut();
        if slot.is_none() {
            *slot = Some((self.factory)());
        }
        Rc::clone(slot.as_ref().expect("just filled"))
    }
}

impl Contract for LazyContract {
    fn id(&self) -> String {
        self.doc_id.clone()
    }

    fn title(&self) -> String {
        self.doc_title.clone()
    }

    fn page_count(&self) -> usize {
        self.pages
    }

    fn page(&self, n: usize) -> String {
        self.real().page(n)
    }

    fn digest(&self) -> String {
        self.real().digest()
    }
}

/// Proxy(권한 검사) — 열람 등급이 모자라면 본문 요청을 전달하지 않는다.
struct GuardedContract {
    inner: Rc<dyn Contract>,
    required: u32,
    clearance: u32,
}

impl Contract for GuardedContract {
    fn id(&self) -> String {
        self.inner.id()
    }

    fn title(&self) -> String {
        self.inner.title()
    }

    fn page_count(&self) -> usize {
        self.inner.page_count()
    }

    fn page(&self, n: usize) -> String {
        if self.clearance < self.required {
            return format!("[denied] {} p{} needs clearance {}", self.inner.id(), n, self.required);
        }
        self.inner.page(n)
    }

    fn digest(&self) -> String {
        self.inner.digest()
    }
}

/// Client — 선반에 꽂힌 것이 대리자인지 원본인지 모른 채 Subject 연산만 부른다.
struct ContractDesk {
    shelf: Vec<Rc<dyn Contract>>,
}

impl ContractDesk {
    fn new(shelf: Vec<Rc<dyn Contract>>) -> Self {
        Self { shelf }
    }

    fn listing(&self) -> String {
        self.shelf
            .iter()
            .map(|c| format!("{} {} {}p", c.id(), c.title(), c.page_count()))
            .collect::<Vec<String>>()
            .join(" · ")
    }

    fn find(&self, id: &str) -> &Rc<dyn Contract> {
        self.shelf.iter().find(|c| c.id() == id).expect("no such contract")
    }

    fn open(&self, id: &str, n: usize) -> String {
        self.find(id).page(n)
    }

    fn digest_of(&self, id: &str) -> String {
        self.find(id).digest()
    }
}

const NDA_BODY: &str = "비밀정보는 서면으로 표시한 것에 한정한다";
const MNA_BODY: &str = "양수인은 잔금일에 지분 전부를 인수한다";

fn shelf_for(clearance: u32, vault: &HashMap<String, Rc<dyn Contract>>) -> Vec<Rc<dyn Contract>> {
    vec![
        Rc::new(GuardedContract {
            inner: Rc::clone(&vault["NDA-2031"]),
            required: 1,
            clearance,
        }) as Rc<dyn Contract>,
        Rc::new(GuardedContract {
            inner: Rc::clone(&vault["MNA-0079"]),
            required: 3,
            clearance,
        }) as Rc<dyn Contract>,
    ]
}

fn main() {
    let load_log: Rc<RefCell<Vec<String>>> = Rc::new(RefCell::new(Vec::new()));
    let mut vault: HashMap<String, Rc<dyn Contract>> = HashMap::new();

    let nda_log = Rc::clone(&load_log);
    vault.insert(
        "NDA-2031".to_string(),
        Rc::new(LazyContract::new("NDA-2031", "비밀유지계약", 4, Box::new(move || {
            Rc::new(ScannedContract::new("NDA-2031", "비밀유지계약", 4, NDA_BODY, &nda_log)) as Rc<dyn Contract>
        }))) as Rc<dyn Contract>,
    );
    let mna_log = Rc::clone(&load_log);
    vault.insert(
        "MNA-0079".to_string(),
        Rc::new(LazyContract::new("MNA-0079", "지분양수도계약", 12, Box::new(move || {
            Rc::new(ScannedContract::new("MNA-0079", "지분양수도계약", 12, MNA_BODY, &mna_log)) as Rc<dyn Contract>
        }))) as Rc<dyn Contract>,
    );

    let legal = ContractDesk::new(shelf_for(3, &vault));
    let intern = ContractDesk::new(shelf_for(1, &vault));

    println!("1) shelf: {} | scans loaded {}", legal.listing(), load_log.borrow().len());
    println!("2) legal opens NDA-2031 p2: {} | scans loaded {}", legal.open("NDA-2031", 2), load_log.borrow().len());
    println!("3) legal opens NDA-2031 p3: {} | scans loaded {}", legal.open("NDA-2031", 3), load_log.borrow().len());
    println!("4) intern opens MNA-0079 p2: {} | scans loaded {}", intern.open("MNA-0079", 2), load_log.borrow().len());
    println!("5) intern reads MNA-0079 digest: {} | scans loaded {}", intern.digest_of("MNA-0079"), load_log.borrow().len());
    println!("6) legal opens MNA-0079 p2: {} | scans loaded {}", legal.open("MNA-0079", 2), load_log.borrow().len());

    let direct_log: Rc<RefCell<Vec<String>>> = Rc::new(RefCell::new(Vec::new()));
    let no_proxy = ContractDesk::new(vec![
        Rc::new(ScannedContract::new("NDA-2031", "비밀유지계약", 4, NDA_BODY, &direct_log)) as Rc<dyn Contract>,
        Rc::new(ScannedContract::new("MNA-0079", "지분양수도계약", 12, MNA_BODY, &direct_log)) as Rc<dyn Contract>,
    ]);
    println!("7) no proxy, listing only: {} | scans loaded {}", no_proxy.listing(), direct_log.borrow().len());
}

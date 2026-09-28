/// Component — 배송 데스크가 보는 단 하나의 타입.
trait Parcel {
    fn weight_in_grams(&self) -> u32;

    fn lines(&self, indent: &str) -> Vec<String>;
}

/// Leaf — 자식을 들지 않는다. 요청이 여기서 끝난다.
struct Item {
    name: String,
    grams: u32,
}

impl Item {
    fn new(name: &str, grams: u32) -> Self {
        Item { name: name.to_string(), grams }
    }
}

impl Parcel for Item {
    fn weight_in_grams(&self) -> u32 {
        self.grams
    }

    fn lines(&self, indent: &str) -> Vec<String> {
        vec![format!("{}- {} {} g", indent, self.name, self.grams)]
    }
}

/// Leaf — 나중에 더해진 새 종류. Parcel 만 구현하면 기존 코드는 그대로다.
struct GiftCard {
    message: String,
}

impl GiftCard {
    const GRAMS: u32 = 5;

    fn new(message: &str) -> Self {
        GiftCard { message: message.to_string() }
    }
}

impl Parcel for GiftCard {
    fn weight_in_grams(&self) -> u32 {
        GiftCard::GRAMS
    }

    fn lines(&self, indent: &str) -> Vec<String> {
        vec![format!("{}- card \"{}\" {} g", indent, self.message, GiftCard::GRAMS)]
    }
}

/// Composite — Parcel 자식을 0개 이상 들고, 자기 몫을 더해 전체를 만든다.
struct GiftBox {
    name: String,
    wrap_grams: u32,
    children: Vec<Box<dyn Parcel>>,
}

impl GiftBox {
    fn new(name: &str, wrap_grams: u32) -> Self {
        GiftBox { name: name.to_string(), wrap_grams, children: Vec::new() }
    }

    fn add(&mut self, child: Box<dyn Parcel>) {
        self.children.push(child);
    }
}

impl Parcel for GiftBox {
    fn weight_in_grams(&self) -> u32 {
        let mut total = self.wrap_grams;
        for child in &self.children {
            total += child.weight_in_grams();
        }
        total
    }

    fn lines(&self, indent: &str) -> Vec<String> {
        let mut out = vec![format!("{}[box] {} +{} g wrap", indent, self.name, self.wrap_grams)];
        let deeper = format!("{}  ", indent);
        for child in &self.children {
            out.extend(child.lines(&deeper));
        }
        out
    }
}

/// 비교용 데코레이터 — Parcel 하나를 감싼다. 자식 집합이 아니다.
struct ChilledWrap {
    inner: Box<dyn Parcel>,
    coolant_grams: u32,
}

impl ChilledWrap {
    fn new(inner: Box<dyn Parcel>, coolant_grams: u32) -> Self {
        ChilledWrap { inner, coolant_grams }
    }
}

impl Parcel for ChilledWrap {
    fn weight_in_grams(&self) -> u32 {
        self.inner.weight_in_grams() + self.coolant_grams
    }

    fn lines(&self, indent: &str) -> Vec<String> {
        let mut out = vec![format!("{}(chilled +{} g)", indent, self.coolant_grams)];
        out.extend(self.inner.lines(&format!("{}  ", indent)));
        out
    }
}

/// Client — Parcel 타입만 본다. 낱개인지 묶음인지 묻지 않는다.
struct ShippingDesk;

impl ShippingDesk {
    fn quote(&self, parcel: &dyn Parcel) -> String {
        format!("{} g", parcel.weight_in_grams())
    }

    fn manifest(&self, parcel: &dyn Parcel) -> String {
        parcel.lines("").join("\n")
    }
}

fn main() {
    let desk = ShippingDesk;

    let mug = Item::new("mug", 320);
    println!("1) mug alone: {}", desk.quote(&mug));

    let mut extras = GiftBox::new("extras", 45);
    extras.add(Box::new(Item::new("tea bags", 60)));
    extras.add(Box::new(Item::new("postcard", 15)));

    let mut gift_box = GiftBox::new("GIFT-301", 120);
    gift_box.add(Box::new(mug));
    gift_box.add(Box::new(extras));
    println!("2) gift box GIFT-301: {}", desk.quote(&gift_box));

    println!("3) contents of GIFT-301:");
    println!("{}", desk.manifest(&gift_box));

    let mut freebie = GiftBox::new("freebie", 30);
    freebie.add(Box::new(Item::new("sample pouch", 55)));
    gift_box.add(Box::new(freebie));
    println!("4) freebie box added: {}", desk.quote(&gift_box));

    gift_box.add(Box::new(GiftCard::new("thank you")));
    println!("5) gift card added: {}", desk.quote(&gift_box));

    let chilled = ChilledWrap::new(Box::new(gift_box), 250);
    println!("6) chilled wrap around GIFT-301: {}", desk.quote(&chilled));

    let mut cooler = GiftBox::new("cooler", 20);
    cooler.add(Box::new(ChilledWrap::new(Box::new(Item::new("mug", 320)), 250)));
    println!("7) box holding a chilled mug: {}", desk.quote(&cooler));

    println!("8) empty box: {}", desk.quote(&GiftBox::new("empty", 10)));
}

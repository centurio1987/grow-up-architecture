trait ParcelVisitor {
    fn visit_item(&mut self, item: &Item);
    fn visit_gift_card(&mut self, card: &GiftCard);
    fn visit_gift_box(&mut self, gift_box: &GiftBox);
    fn visit_chilled_wrap(&mut self, wrap: &ChilledWrap);
}

trait Parcel {
    fn accept(&self, visitor: &mut dyn ParcelVisitor);
}

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
    fn accept(&self, visitor: &mut dyn ParcelVisitor) {
        visitor.visit_item(self);
    }
}

struct GiftCard {
    message: String,
    grams: u32,
}

impl GiftCard {
    fn new(message: &str, grams: u32) -> Self {
        GiftCard { message: message.to_string(), grams }
    }
}

impl Parcel for GiftCard {
    fn accept(&self, visitor: &mut dyn ParcelVisitor) {
        visitor.visit_gift_card(self);
    }
}

struct GiftBox {
    label: String,
    wrap_grams: u32,
    children: Vec<Box<dyn Parcel>>,
}

impl GiftBox {
    fn new(label: &str, wrap_grams: u32) -> Self {
        GiftBox { label: label.to_string(), wrap_grams, children: Vec::new() }
    }

    fn add(&mut self, child: Box<dyn Parcel>) {
        self.children.push(child);
    }
}

impl Parcel for GiftBox {
    fn accept(&self, visitor: &mut dyn ParcelVisitor) {
        visitor.visit_gift_box(self);
        for child in &self.children {
            child.accept(visitor);
        }
    }
}

struct ChilledWrap {
    coolant_grams: u32,
    inner: Box<dyn Parcel>,
}

impl ChilledWrap {
    fn new(coolant_grams: u32, inner: Box<dyn Parcel>) -> Self {
        ChilledWrap { coolant_grams, inner }
    }
}

impl Parcel for ChilledWrap {
    fn accept(&self, visitor: &mut dyn ParcelVisitor) {
        visitor.visit_chilled_wrap(self);
        self.inner.accept(visitor);
    }
}

struct ShippingDesk {
    parcels: Vec<Box<dyn Parcel>>,
}

impl ShippingDesk {
    fn new() -> Self {
        ShippingDesk { parcels: Vec::new() }
    }

    fn add(&mut self, parcel: Box<dyn Parcel>) {
        self.parcels.push(parcel);
    }

    fn accept(&self, visitor: &mut dyn ParcelVisitor) {
        for parcel in &self.parcels {
            parcel.accept(visitor);
        }
    }
}

struct WeighVisitor {
    total: u32,
}

impl WeighVisitor {
    fn new() -> Self {
        WeighVisitor { total: 0 }
    }

    fn grams(&self) -> u32 {
        self.total
    }
}

impl ParcelVisitor for WeighVisitor {
    fn visit_item(&mut self, item: &Item) {
        self.total += item.grams;
    }

    fn visit_gift_card(&mut self, card: &GiftCard) {
        self.total += card.grams;
    }

    fn visit_gift_box(&mut self, gift_box: &GiftBox) {
        self.total += gift_box.wrap_grams;
    }

    fn visit_chilled_wrap(&mut self, wrap: &ChilledWrap) {
        self.total += wrap.coolant_grams;
    }
}

struct ListVisitor {
    collected: Vec<String>,
}

impl ListVisitor {
    fn new() -> Self {
        ListVisitor { collected: Vec::new() }
    }

    fn lines(&self) -> &[String] {
        &self.collected
    }
}

impl ParcelVisitor for ListVisitor {
    fn visit_item(&mut self, item: &Item) {
        self.collected.push(format!("[item] {} {} g", item.name, item.grams));
    }

    fn visit_gift_card(&mut self, card: &GiftCard) {
        self.collected.push(format!("[card] {} {} g", card.message, card.grams));
    }

    fn visit_gift_box(&mut self, gift_box: &GiftBox) {
        self.collected.push(format!("[box] {} wrap {} g", gift_box.label, gift_box.wrap_grams));
    }

    fn visit_chilled_wrap(&mut self, wrap: &ChilledWrap) {
        self.collected.push(format!("[cold] coolant {} g", wrap.coolant_grams));
    }
}

struct CountVisitor {
    total: u32,
}

impl CountVisitor {
    fn new() -> Self {
        CountVisitor { total: 0 }
    }

    fn items(&self) -> u32 {
        self.total
    }
}

impl ParcelVisitor for CountVisitor {
    fn visit_item(&mut self, _item: &Item) {
        self.total += 1;
    }

    fn visit_gift_card(&mut self, _card: &GiftCard) {
        self.total += 1;
    }

    fn visit_gift_box(&mut self, _gift_box: &GiftBox) {}

    fn visit_chilled_wrap(&mut self, _wrap: &ChilledWrap) {}
}

fn main() {
    let mut extras = GiftBox::new("extras", 45);
    extras.add(Box::new(Item::new("tea bags", 60)));
    extras.add(Box::new(Item::new("postcard", 15)));

    let mut gift = GiftBox::new("GIFT-301", 120);
    gift.add(Box::new(Item::new("mug", 320)));
    gift.add(Box::new(extras));
    gift.add(Box::new(GiftCard::new("thank-you", 5)));
    gift.add(Box::new(ChilledWrap::new(250, Box::new(Item::new("chocolate", 180)))));

    let mut desk = ShippingDesk::new();
    desk.add(Box::new(gift));

    let mut weigh = WeighVisitor::new();
    desk.accept(&mut weigh);
    println!("1) total weight: {} g", weigh.grams());

    let mut list = ListVisitor::new();
    desk.accept(&mut list);
    println!("2) contents list:");
    for line in list.lines() {
        println!("{}", line);
    }

    let mut count = CountVisitor::new();
    desk.accept(&mut count);
    println!("3) contents count: {}", count.items());

    desk.add(Box::new(Item::new("mug", 320)));
    let mut both_weigh = WeighVisitor::new();
    let mut both_count = CountVisitor::new();
    desk.accept(&mut both_weigh);
    desk.accept(&mut both_count);
    println!("4) desk with two parcels: {} g, count {}", both_weigh.grams(), both_count.items());
}

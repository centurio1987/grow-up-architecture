import java.util.ArrayList;
import java.util.List;

public class ParcelVisitorApp {
    public static void main(String[] args) {
        GiftBox extras = new GiftBox("extras", 45);
        extras.add(new Item("tea bags", 60));
        extras.add(new Item("postcard", 15));

        GiftBox gift = new GiftBox("GIFT-301", 120);
        gift.add(new Item("mug", 320));
        gift.add(extras);
        gift.add(new GiftCard("thank-you", 5));
        gift.add(new ChilledWrap(250, new Item("chocolate", 180)));

        ShippingDesk desk = new ShippingDesk();
        desk.add(gift);

        WeighVisitor weigh = new WeighVisitor();
        desk.accept(weigh);
        System.out.println("1) total weight: " + weigh.grams() + " g");

        ListVisitor list = new ListVisitor();
        desk.accept(list);
        System.out.println("2) contents list:");
        for (String line : list.lines()) {
            System.out.println(line);
        }

        CountVisitor count = new CountVisitor();
        desk.accept(count);
        System.out.println("3) contents count: " + count.items());

        desk.add(new Item("mug", 320));
        WeighVisitor bothWeigh = new WeighVisitor();
        CountVisitor bothCount = new CountVisitor();
        desk.accept(bothWeigh);
        desk.accept(bothCount);
        System.out.println("4) desk with two parcels: " + bothWeigh.grams() + " g, count " + bothCount.items());
    }
}

interface ParcelVisitor {
    void visitItem(Item item);

    void visitGiftCard(GiftCard card);

    void visitGiftBox(GiftBox box);

    void visitChilledWrap(ChilledWrap wrap);
}

interface Parcel {
    void accept(ParcelVisitor visitor);
}

final class Item implements Parcel {
    private final String name;
    private final int grams;

    Item(String name, int grams) {
        this.name = name;
        this.grams = grams;
    }

    String name() {
        return name;
    }

    int grams() {
        return grams;
    }

    @Override
    public void accept(ParcelVisitor visitor) {
        visitor.visitItem(this);
    }
}

final class GiftCard implements Parcel {
    private final String message;
    private final int grams;

    GiftCard(String message, int grams) {
        this.message = message;
        this.grams = grams;
    }

    String message() {
        return message;
    }

    int grams() {
        return grams;
    }

    @Override
    public void accept(ParcelVisitor visitor) {
        visitor.visitGiftCard(this);
    }
}

final class GiftBox implements Parcel {
    private final String label;
    private final int wrapGrams;
    private final List<Parcel> children = new ArrayList<>();

    GiftBox(String label, int wrapGrams) {
        this.label = label;
        this.wrapGrams = wrapGrams;
    }

    void add(Parcel child) {
        children.add(child);
    }

    String label() {
        return label;
    }

    int wrapGrams() {
        return wrapGrams;
    }

    @Override
    public void accept(ParcelVisitor visitor) {
        visitor.visitGiftBox(this);
        for (Parcel child : children) {
            child.accept(visitor);
        }
    }
}

final class ChilledWrap implements Parcel {
    private final int coolantGrams;
    private final Parcel inner;

    ChilledWrap(int coolantGrams, Parcel inner) {
        this.coolantGrams = coolantGrams;
        this.inner = inner;
    }

    int coolantGrams() {
        return coolantGrams;
    }

    @Override
    public void accept(ParcelVisitor visitor) {
        visitor.visitChilledWrap(this);
        inner.accept(visitor);
    }
}

final class ShippingDesk {
    private final List<Parcel> parcels = new ArrayList<>();

    void add(Parcel parcel) {
        parcels.add(parcel);
    }

    void accept(ParcelVisitor visitor) {
        for (Parcel parcel : parcels) {
            parcel.accept(visitor);
        }
    }
}

final class WeighVisitor implements ParcelVisitor {
    private int total = 0;

    int grams() {
        return total;
    }

    @Override
    public void visitItem(Item item) {
        total += item.grams();
    }

    @Override
    public void visitGiftCard(GiftCard card) {
        total += card.grams();
    }

    @Override
    public void visitGiftBox(GiftBox box) {
        total += box.wrapGrams();
    }

    @Override
    public void visitChilledWrap(ChilledWrap wrap) {
        total += wrap.coolantGrams();
    }
}

final class ListVisitor implements ParcelVisitor {
    private final List<String> lines = new ArrayList<>();

    List<String> lines() {
        return lines;
    }

    @Override
    public void visitItem(Item item) {
        lines.add("[item] " + item.name() + " " + item.grams() + " g");
    }

    @Override
    public void visitGiftCard(GiftCard card) {
        lines.add("[card] " + card.message() + " " + card.grams() + " g");
    }

    @Override
    public void visitGiftBox(GiftBox box) {
        lines.add("[box] " + box.label() + " wrap " + box.wrapGrams() + " g");
    }

    @Override
    public void visitChilledWrap(ChilledWrap wrap) {
        lines.add("[cold] coolant " + wrap.coolantGrams() + " g");
    }
}

final class CountVisitor implements ParcelVisitor {
    private int items = 0;

    int items() {
        return items;
    }

    @Override
    public void visitItem(Item item) {
        items += 1;
    }

    @Override
    public void visitGiftCard(GiftCard card) {
        items += 1;
    }

    @Override
    public void visitGiftBox(GiftBox box) {
    }

    @Override
    public void visitChilledWrap(ChilledWrap wrap) {
    }
}

import java.util.ArrayList;
import java.util.List;

/** 낱개와 묶음을 같은 타입으로 다루는 배송 포장 예시. */
public class ParcelShippingApp {

    public static void main(String[] args) {
        ShippingDesk desk = new ShippingDesk();

        Item mug = new Item("mug", 320);
        System.out.println("1) mug alone: " + desk.quote(mug));

        GiftBox extras = new GiftBox("extras", 45);
        extras.add(new Item("tea bags", 60));
        extras.add(new Item("postcard", 15));

        GiftBox giftBox = new GiftBox("GIFT-301", 120);
        giftBox.add(mug);
        giftBox.add(extras);
        System.out.println("2) gift box GIFT-301: " + desk.quote(giftBox));

        System.out.println("3) contents of GIFT-301:");
        System.out.println(desk.manifest(giftBox));

        GiftBox freebie = new GiftBox("freebie", 30);
        freebie.add(new Item("sample pouch", 55));
        giftBox.add(freebie);
        System.out.println("4) freebie box added: " + desk.quote(giftBox));

        giftBox.add(new GiftCard("thank you"));
        System.out.println("5) gift card added: " + desk.quote(giftBox));

        ChilledWrap chilled = new ChilledWrap(giftBox, 250);
        System.out.println("6) chilled wrap around GIFT-301: " + desk.quote(chilled));

        GiftBox cooler = new GiftBox("cooler", 20);
        cooler.add(new ChilledWrap(new Item("mug", 320), 250));
        System.out.println("7) box holding a chilled mug: " + desk.quote(cooler));

        System.out.println("8) empty box: " + desk.quote(new GiftBox("empty", 10)));
    }
}

/** Component — 배송 데스크가 보는 단 하나의 타입. */
interface Parcel {
    int weightInGrams();

    List<String> lines(String indent);
}

/** Leaf — 자식을 들지 않는다. 요청이 여기서 끝난다. */
final class Item implements Parcel {
    private final String name;
    private final int grams;

    Item(String name, int grams) {
        this.name = name;
        this.grams = grams;
    }

    @Override
    public int weightInGrams() {
        return grams;
    }

    @Override
    public List<String> lines(String indent) {
        List<String> out = new ArrayList<>();
        out.add(indent + "- " + name + " " + grams + " g");
        return out;
    }
}

/** Leaf — 나중에 더해진 새 종류. Parcel 만 구현하면 기존 코드는 그대로다. */
final class GiftCard implements Parcel {
    private static final int GRAMS = 5;
    private final String message;

    GiftCard(String message) {
        this.message = message;
    }

    @Override
    public int weightInGrams() {
        return GRAMS;
    }

    @Override
    public List<String> lines(String indent) {
        List<String> out = new ArrayList<>();
        out.add(indent + "- card \"" + message + "\" " + GRAMS + " g");
        return out;
    }
}

/** Composite — Parcel 자식을 0개 이상 들고, 자기 몫을 더해 전체를 만든다. */
final class GiftBox implements Parcel {
    private final String name;
    private final int wrapGrams;
    private final List<Parcel> children = new ArrayList<>();

    GiftBox(String name, int wrapGrams) {
        this.name = name;
        this.wrapGrams = wrapGrams;
    }

    void add(Parcel child) {
        children.add(child);
    }

    @Override
    public int weightInGrams() {
        int total = wrapGrams;
        for (Parcel child : children) {
            total += child.weightInGrams();
        }
        return total;
    }

    @Override
    public List<String> lines(String indent) {
        List<String> out = new ArrayList<>();
        out.add(indent + "[box] " + name + " +" + wrapGrams + " g wrap");
        for (Parcel child : children) {
            out.addAll(child.lines(indent + "  "));
        }
        return out;
    }
}

/** 비교용 데코레이터 — Parcel 하나를 감싼다. 자식 집합이 아니다. */
final class ChilledWrap implements Parcel {
    private final Parcel inner;
    private final int coolantGrams;

    ChilledWrap(Parcel inner, int coolantGrams) {
        this.inner = inner;
        this.coolantGrams = coolantGrams;
    }

    @Override
    public int weightInGrams() {
        return inner.weightInGrams() + coolantGrams;
    }

    @Override
    public List<String> lines(String indent) {
        List<String> out = new ArrayList<>();
        out.add(indent + "(chilled +" + coolantGrams + " g)");
        out.addAll(inner.lines(indent + "  "));
        return out;
    }
}

/** Client — Parcel 타입만 본다. 낱개인지 묶음인지 묻지 않는다. */
final class ShippingDesk {
    String quote(Parcel parcel) {
        return parcel.weightInGrams() + " g";
    }

    String manifest(Parcel parcel) {
        return String.join("\n", parcel.lines(""));
    }
}

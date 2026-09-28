import java.util.List;

enum FormEvent { CABIN_SELECTED, SEAT_TYPED, MILEAGE_TOGGLED, ISSUE_CLICKED }

interface SeatFormMediator {
    void changed(FormEvent event);
}

final class CabinList {
    private final SeatFormMediator mediator;
    private final List<String> options = List.of("business", "economy");
    private String selected = "";

    CabinList(SeatFormMediator mediator) {
        this.mediator = mediator;
    }

    void select(String cabin) {
        if (!options.contains(cabin) || cabin.equals(selected)) {
            return;
        }
        selected = cabin;
        mediator.changed(FormEvent.CABIN_SELECTED);
    }

    String selected() {
        return selected;
    }
}

final class SeatField {
    private final SeatFormMediator mediator;
    private String text = "";

    SeatField(SeatFormMediator mediator) {
        this.mediator = mediator;
    }

    void fill(String value) {
        text = value;
    }

    void typeIn(String value) {
        text = value;
        mediator.changed(FormEvent.SEAT_TYPED);
    }

    String text() {
        return text;
    }
}

final class MileageToggle {
    private final SeatFormMediator mediator;
    private boolean enabled = false;
    private boolean on = false;

    MileageToggle(SeatFormMediator mediator) {
        this.mediator = mediator;
    }

    void enable(boolean value) {
        enabled = value;
        if (!value) {
            on = false;
        }
    }

    void toggle() {
        if (!enabled) {
            return;
        }
        on = !on;
        mediator.changed(FormEvent.MILEAGE_TOGGLED);
    }

    boolean on() {
        return on;
    }

    boolean enabled() {
        return enabled;
    }
}

final class IssueButton {
    private final SeatFormMediator mediator;
    private boolean enabled = false;

    IssueButton(SeatFormMediator mediator) {
        this.mediator = mediator;
    }

    void enable(boolean value) {
        enabled = value;
    }

    void click() {
        if (!enabled) {
            return;
        }
        mediator.changed(FormEvent.ISSUE_CLICKED);
    }

    boolean enabled() {
        return enabled;
    }
}

final class SeatForm implements SeatFormMediator {
    private static final List<String> BUSINESS = List.of("1A", "1B", "2A", "2B");
    private static final List<String> ECONOMY = List.of("10A", "10B", "11A", "11B");
    private static final List<String> SOLD = List.of("1A", "10A");

    private final String record;
    private final CabinList cabinList;
    private final SeatField seatField;
    private final MileageToggle mileageToggle;
    private final IssueButton issueButton;
    private String result = "";

    SeatForm(String record) {
        this.record = record;
        this.cabinList = new CabinList(this);
        this.seatField = new SeatField(this);
        this.mileageToggle = new MileageToggle(this);
        this.issueButton = new IssueButton(this);
    }

    @Override
    public void changed(FormEvent event) {
        switch (event) {
            case CABIN_SELECTED -> {
                String cabin = cabinList.selected();
                seatField.fill(firstFree(cabin));
                mileageToggle.enable(cabin.equals("economy"));
                refreshIssue();
            }
            case SEAT_TYPED, MILEAGE_TOGGLED -> refreshIssue();
            case ISSUE_CLICKED -> result = ticket();
        }
    }

    private void refreshIssue() {
        issueButton.enable(free(cabinList.selected()).contains(seatField.text()));
    }

    private String ticket() {
        String cabin = cabinList.selected();
        long fare = cabin.equals("business") ? 480_000 : 180_000;
        long discount = mileageToggle.on() ? 30_000 : 0;
        return "ticket " + record + " " + cabin + " " + seatField.text()
                + " fare=" + fare + " discount=" + discount + " pay=" + (fare - discount);
    }

    private static List<String> free(String cabin) {
        List<String> all = cabin.equals("business") ? BUSINESS : cabin.equals("economy") ? ECONOMY : List.of();
        return all.stream().filter(seat -> !SOLD.contains(seat)).toList();
    }

    private static String firstFree(String cabin) {
        List<String> open = free(cabin);
        return open.isEmpty() ? "" : open.get(0);
    }

    CabinList cabinList() {
        return cabinList;
    }

    SeatField seatField() {
        return seatField;
    }

    MileageToggle mileageToggle() {
        return mileageToggle;
    }

    IssueButton issueButton() {
        return issueButton;
    }

    String state() {
        return "cabin=" + blank(cabinList.selected()) + " seat=" + blank(seatField.text())
                + " mileage=" + (mileageToggle.on() ? "on" : "off")
                + "/" + (mileageToggle.enabled() ? "free" : "locked")
                + " issue=" + (issueButton.enabled() ? "on" : "off");
    }

    String takeResult() {
        String taken = result;
        result = "";
        return taken;
    }

    private static String blank(String value) {
        return value.isEmpty() ? "-" : value;
    }
}

public class SeatFormApp {
    public static void main(String[] args) {
        SeatForm form = new SeatForm("QR4821");
        CabinList cabin = form.cabinList();
        SeatField seat = form.seatField();
        MileageToggle mileage = form.mileageToggle();
        IssueButton issue = form.issueButton();

        cabin.select("economy");
        print(1, "select economy", form);
        seat.typeIn("11A");
        print(2, "type 11A", form);
        issue.click();
        print(3, "click issue", form);
        mileage.toggle();
        print(4, "toggle mileage", form);
        issue.click();
        print(5, "click issue", form);
        cabin.select("business");
        print(6, "select business", form);
        issue.click();
        print(7, "click issue", form);
        seat.typeIn("1A");
        print(8, "type 1A", form);
        issue.click();
        print(9, "click issue", form);
    }

    private static void print(int step, String action, SeatForm form) {
        String result = form.takeResult();
        System.out.println(step + ") " + pad(action) + " | " + form.state()
                + (result.isEmpty() ? "" : " | " + result));
    }

    private static String pad(String action) {
        StringBuilder padded = new StringBuilder(action);
        while (padded.length() < 15) {
            padded.append(' ');
        }
        return padded.toString();
    }
}

type FormEvent = 'CABIN_SELECTED' | 'SEAT_TYPED' | 'MILEAGE_TOGGLED' | 'ISSUE_CLICKED';

interface SeatFormMediator {
  changed(event: FormEvent): void;
}

class CabinList {
  private readonly options = ['business', 'economy'];
  private selectedCabin = '';

  constructor(private readonly mediator: SeatFormMediator) {}

  select(cabin: string): void {
    if (!this.options.includes(cabin) || cabin === this.selectedCabin) {
      return;
    }
    this.selectedCabin = cabin;
    this.mediator.changed('CABIN_SELECTED');
  }

  selected(): string {
    return this.selectedCabin;
  }
}

class SeatField {
  private value = '';

  constructor(private readonly mediator: SeatFormMediator) {}

  fill(seat: string): void {
    this.value = seat;
  }

  typeIn(seat: string): void {
    this.value = seat;
    this.mediator.changed('SEAT_TYPED');
  }

  text(): string {
    return this.value;
  }
}

class MileageToggle {
  private isEnabled = false;
  private isOn = false;

  constructor(private readonly mediator: SeatFormMediator) {}

  enable(value: boolean): void {
    this.isEnabled = value;
    if (!value) {
      this.isOn = false;
    }
  }

  toggle(): void {
    if (!this.isEnabled) {
      return;
    }
    this.isOn = !this.isOn;
    this.mediator.changed('MILEAGE_TOGGLED');
  }

  on(): boolean {
    return this.isOn;
  }

  enabled(): boolean {
    return this.isEnabled;
  }
}

class IssueButton {
  private isEnabled = false;

  constructor(private readonly mediator: SeatFormMediator) {}

  enable(value: boolean): void {
    this.isEnabled = value;
  }

  click(): void {
    if (!this.isEnabled) {
      return;
    }
    this.mediator.changed('ISSUE_CLICKED');
  }

  enabled(): boolean {
    return this.isEnabled;
  }
}

const BUSINESS = ['1A', '1B', '2A', '2B'];
const ECONOMY = ['10A', '10B', '11A', '11B'];
const SOLD = ['1A', '10A'];

function free(cabin: string): string[] {
  const all = cabin === 'business' ? BUSINESS : cabin === 'economy' ? ECONOMY : [];
  return all.filter((seat) => !SOLD.includes(seat));
}

function firstFree(cabin: string): string {
  const open = free(cabin);
  return open[0] ?? '';
}

function blank(value: string): string {
  return value === '' ? '-' : value;
}

class SeatForm implements SeatFormMediator {
  private readonly cabin: CabinList;
  private readonly seat: SeatField;
  private readonly mileage: MileageToggle;
  private readonly issue: IssueButton;
  private result = '';

  constructor(private readonly record: string) {
    this.cabin = new CabinList(this);
    this.seat = new SeatField(this);
    this.mileage = new MileageToggle(this);
    this.issue = new IssueButton(this);
  }

  changed(event: FormEvent): void {
    if (event === 'CABIN_SELECTED') {
      const cabin = this.cabin.selected();
      this.seat.fill(firstFree(cabin));
      this.mileage.enable(cabin === 'economy');
      this.refreshIssue();
    } else if (event === 'SEAT_TYPED' || event === 'MILEAGE_TOGGLED') {
      this.refreshIssue();
    } else {
      this.result = this.ticket();
    }
  }

  private refreshIssue(): void {
    this.issue.enable(free(this.cabin.selected()).includes(this.seat.text()));
  }

  private ticket(): string {
    const cabin = this.cabin.selected();
    const fare = cabin === 'business' ? 480000 : 180000;
    const discount = this.mileage.on() ? 30000 : 0;
    return `ticket ${this.record} ${cabin} ${this.seat.text()}`
      + ` fare=${fare} discount=${discount} pay=${fare - discount}`;
  }

  cabinList(): CabinList {
    return this.cabin;
  }

  seatField(): SeatField {
    return this.seat;
  }

  mileageToggle(): MileageToggle {
    return this.mileage;
  }

  issueButton(): IssueButton {
    return this.issue;
  }

  state(): string {
    return `cabin=${blank(this.cabin.selected())} seat=${blank(this.seat.text())}`
      + ` mileage=${this.mileage.on() ? 'on' : 'off'}/${this.mileage.enabled() ? 'free' : 'locked'}`
      + ` issue=${this.issue.enabled() ? 'on' : 'off'}`;
  }

  takeResult(): string {
    const taken = this.result;
    this.result = '';
    return taken;
  }
}

function print(step: number, action: string, form: SeatForm): void {
  const result = form.takeResult();
  console.log(`${step}) ${action.padEnd(15)} | ${form.state()}${result === '' ? '' : ` | ${result}`}`);
}

const form = new SeatForm('QR4821');
const cabin = form.cabinList();
const seat = form.seatField();
const mileage = form.mileageToggle();
const issue = form.issueButton();

cabin.select('economy');
print(1, 'select economy', form);
seat.typeIn('11A');
print(2, 'type 11A', form);
issue.click();
print(3, 'click issue', form);
mileage.toggle();
print(4, 'toggle mileage', form);
issue.click();
print(5, 'click issue', form);
cabin.select('business');
print(6, 'select business', form);
issue.click();
print(7, 'click issue', form);
seat.typeIn('1A');
print(8, 'type 1A', form);
issue.click();
print(9, 'click issue', form);

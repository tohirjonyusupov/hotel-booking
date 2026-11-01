// P03 · Hotel booking, first version: one file, everything kept in memory.
// node hotel-booking.js          -> the normal demo
// node hotel-booking.js --race   -> two guests book the same room at the same moment

// The stay: check-in day included, check-out day excluded (half-open).
class DateRange {
  constructor(checkIn, checkOut) {
    this.checkIn = checkIn;
    this.checkOut = checkOut;
  }

  isValid() {
    return this.checkOut > this.checkIn;
  }

  // Two stays overlap when they share at least one night.
  overlaps(other) {
    return this.checkIn < other.checkOut && other.checkIn < this.checkOut;
  }
}

class Guest {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}

class Room {
  constructor(number, type) {
    this.number = number;
    this.type = type;
  }

  // JavaScript compares objects by identity, so Room says when two values mean the same room.
  equals(other) {
    return this.number === other.number && this.type === other.type;
  }
}

// JavaScript has no enum keyword: a frozen object with two values does the same job.
const ReservationStatus = Object.freeze({ Confirmed: 'Confirmed', Cancelled: 'Cancelled' });

class Reservation {
  constructor(id, guest, room, stay) {
    this.id = id;
    this.guest = guest;
    this.room = room;
    this.stay = stay;
    this.status = ReservationStatus.Confirmed;
  }

  // A reservation blocks a request when it is still Confirmed for the same room and shares a night.
  blocks(room, stay) {
    return this.status === ReservationStatus.Confirmed && this.room.equals(room) && this.stay.overlaps(stay);
  }

  cancel() {
    if (this.status === ReservationStatus.Cancelled) return false;
    this.status = ReservationStatus.Cancelled;
    return true;
  }
}

// Keeps reservations in a list. A later practice replaces it with a database.
class ReservationStore {
  #rows = [];

  get count() {
    return this.#rows.length;
  }

  hasOverlap(room, stay) {
    return this.#rows.some(row => row.blocks(room, stay));
  }

  save(reservation) {
    this.#rows.push(reservation);
  }

  // Returns null when no reservation has that id.
  find(id) {
    return this.#rows.find(row => row.id === id) ?? null;
  }

  countConfirmed(room, stay) {
    return this.#rows.filter(row => row.blocks(room, stay)).length;
  }
}

// Simulated: sends nothing and needs no network. P04 moves this dependency behind an interface.
class EmailSender {
  sent = 0;

  sendConfirmation(reservation) {
    this.sent += 1;
  }
}

class BookingResult {
  constructor(outcome, reservationId = null) {
    this.outcome = outcome;
    this.reservationId = reservationId;
  }

  // Putting a BookingResult in a `${...}` slot uses this method, the way ToString does in C#.
  toString() {
    return this.reservationId === null ? this.outcome : `${this.outcome} ${this.reservationId}`;
  }
}

// A pause that lets other requests run while this one waits.
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

class BookingService {
  constructor(rooms, store, email, slowStepMs = 0) {
    this.rooms = rooms;
    this.store = store;
    this.email = email;
    this.slowStepMs = slowStepMs;
  }

  findFreeRooms(stay) {
    return this.rooms.filter(room => !this.store.hasOverlap(room, stay));
  }

  async reserve(guest, room, stay) {
    if (!stay.isValid()) return new BookingResult('InvalidDates');
    if (this.store.hasOverlap(room, stay)) return new BookingResult('Unavailable');

    await wait(this.slowStepMs); // zero normally; the race demo makes this step slow

    const reservation = new Reservation(`R${101 + this.store.count}`, guest, room, stay);
    this.store.save(reservation);
    this.email.sendConfirmation(reservation);
    return new BookingResult('Accepted', reservation.id);
  }

  cancel(reservationId) {
    return this.store.find(reservationId)?.cancel() ?? false;
  }
}

const r7 = new Room('R7', 'Standard');
const r8 = new Room('R8', 'Deluxe');
const maya = new Guest('Maya', 'maya@example.com');
const omar = new Guest('Omar', 'omar@example.com');
const nora = new Guest('Nora', 'nora@example.com');

const nov = (checkIn, checkOut) =>
  new DateRange(new Date(Date.UTC(2026, 10, checkIn)), new Date(Date.UTC(2026, 10, checkOut)));

const names = rooms => rooms.map(room => room.number).join(', ');

// JavaScript prints booleans as true/false; the course output says True, so the demo spells it out.
const boolText = value => (value ? 'True' : 'False');

async function runDemo() {
  const store = new ReservationStore();
  const email = new EmailSender();
  const service = new BookingService([r7, r8], store, email);

  console.log(`Free rooms 12-14 Nov: ${names(service.findFreeRooms(nov(12, 14)))}`);
  console.log(`Maya books R7 12-14 Nov: ${await service.reserve(maya, r7, nov(12, 14))}`);
  console.log(`Omar books R7 13-15 Nov: ${await service.reserve(omar, r7, nov(13, 15))}`);
  console.log(`Nora books R7 14-16 Nov: ${await service.reserve(nora, r7, nov(14, 16))}`);
  console.log(`Omar books R8 15-15 Nov: ${await service.reserve(omar, r8, nov(15, 15))}`);
  console.log(`Free rooms 12-14 Nov: ${names(service.findFreeRooms(nov(12, 14)))}`);
  console.log(`Maya cancels R101: ${boolText(service.cancel('R101'))}`);
  console.log(`Free rooms 12-14 Nov: ${names(service.findFreeRooms(nov(12, 14)))}`);
  console.log(`Confirmation emails sent: ${email.sent}`);
}

async function runRace() {
  const store = new ReservationStore();
  // Each request now spends half a second between checking and saving.
  const service = new BookingService([r7, r8], store, new EmailSender(), 500);
  const stay = nov(12, 14);

  console.log('Maya and Omar both book R7 for 12-14 Nov at the same moment...');
  const mayaRequest = service.reserve(maya, r7, stay);
  await wait(100); // Omar clicks a moment after Maya
  const omarRequest = service.reserve(omar, r7, stay);
  const [mayaResult, omarResult] = await Promise.all([mayaRequest, omarRequest]);

  console.log(`Maya: ${mayaResult}`);
  console.log(`Omar: ${omarResult}`);
  const confirmed = store.countConfirmed(r7, stay);
  console.log(`Confirmed reservations for R7 on 12-14 Nov: ${confirmed}`);
  console.log(confirmed > 1
    ? 'Double booking! Both requests checked before either one saved.'
    : 'Only one guest has R7.');
}

if (process.argv.includes('--race')) runRace(); else runDemo();

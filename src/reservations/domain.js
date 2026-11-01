import { Room } from '../rooms/index.js';

// The stay: check-in day included, check-out day excluded (half-open).
export class DateRange {
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

export class Guest {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}

// JavaScript has no enum keyword: a frozen object with two values does the same job.
export const ReservationStatus = Object.freeze({ Confirmed: 'Confirmed', Cancelled: 'Cancelled' });

export class Reservation {
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

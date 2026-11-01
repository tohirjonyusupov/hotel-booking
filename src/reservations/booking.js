import { Confirmation } from '../notifications/index.js';
import { Reservation } from './domain.js';

// A pause that lets other requests run while this one waits.
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export class BookingResult {
  constructor(outcome, reservationId = null, notificationFailed = false) {
    this.outcome = outcome;
    this.reservationId = reservationId;
    this.notificationFailed = notificationFailed;
  }

  toString() {
    return this.reservationId === null ? this.outcome : `${this.outcome} ${this.reservationId}`;
  }
}

// Owns the booking rule. Uses only the public contracts of Rooms and Notifications.
export class BookingService {
  constructor(rooms, store, notifications, slowStepMs = 0) {
    this.rooms = rooms;
    this.store = store;
    this.notifications = notifications;
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
    try {
      // Notifications gets its own message: the five fields it needs, not the Reservation.
      this.notifications.sendConfirmation(
        new Confirmation(reservation.id, guest.email, room.number, stay.checkIn, stay.checkOut));
    } catch {
      // R6: the booking is already saved, so a failed message must not undo or hide it.
      return new BookingResult('Accepted', reservation.id, true);
    }
    return new BookingResult('Accepted', reservation.id);
  }

  cancel(reservationId) {
    return this.store.find(reservationId)?.cancel() ?? false;
  }
}

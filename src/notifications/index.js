// Notifications: telling guests what happened. This file is the module's public contract.
//
// A notification sender keeps one promise (JavaScript has no interface keyword):
//
//   sendConfirmation(confirmation)   tell this guest their booking is confirmed,
//                                    or throw when the message cannot be sent

// Notifications' own message: it no longer needs the Reservation class.
export class Confirmation {
  constructor(reservationId, guestEmail, roomNumber, checkIn, checkOut) {
    Object.assign(this, { reservationId, guestEmail, roomNumber, checkIn, checkOut });
    Object.freeze(this);
  }
}

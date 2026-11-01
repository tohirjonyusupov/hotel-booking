// What BookingService needs from storage. JavaScript has no interface keyword, so the
// contract is written down here and every store keeps to it:
//
//   count                       how many reservations are saved
//   hasOverlap(room, stay)      is a Confirmed reservation already using those nights?
//   save(reservation)           keep this reservation
//   find(id)                    the reservation with that id, or null
//   countConfirmed(room, stay)  how many Confirmed reservations use those nights
//
// Today a list in memory; from P07 a database with the same five members.
export class InMemoryReservationStore {
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

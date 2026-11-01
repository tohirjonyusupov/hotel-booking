// Rooms: which rooms the hotel sells. This file is the module's public contract.
//
// A room catalog keeps one promise (JavaScript has no interface keyword):
//
//   all()   every room the hotel sells
//
// From P07 the rooms come from a database.
export class Room {
  constructor(number, type) {
    this.number = number;
    this.type = type;
  }

  // JavaScript compares objects by identity, so Room says when two values mean the same room.
  equals(other) {
    return this.number === other.number && this.type === other.type;
  }
}

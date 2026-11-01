import { Room } from '../index.js';

// Keeps the hotel's rooms in a list. Only main.js creates it.
export class InMemoryRoomCatalog {
  #rooms;

  constructor(rooms) {
    this.#rooms = rooms.map(room => new Room(room.number, room.type));
  }

  all() {
    return [...this.#rooms];
  }
}

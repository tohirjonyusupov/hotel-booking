// Tests for the booking service after the P06 move into modules.
// Run them from the hotel-booking folder:  node --test
import assert from 'node:assert/strict';
import test from 'node:test';

import { SmsNotificationSender } from '../src/notifications/internal/sms.js';
import { BookingService, DateRange, Guest } from '../src/reservations/index.js';
import { InMemoryReservationStore } from '../src/reservations/internal/store.js';
import { Room } from '../src/rooms/index.js';

const r7 = new Room('R7', 'Standard');
const r8 = new Room('R8', 'Deluxe');
const maya = new Guest('Maya', 'maya@example.com');
const omar = new Guest('Omar', 'omar@example.com');
const nora = new Guest('Nora', 'nora@example.com');

const nov = (checkIn, checkOut) =>
  new DateRange(new Date(Date.UTC(2026, 10, checkIn)), new Date(Date.UTC(2026, 10, checkOut)));

// A stand-in sender for tests: remembers what it would send, or fails on purpose.
class FakeNotificationSender {
  constructor(fail = false) {
    this.fail = fail;
    this.sent = [];
  }

  sendConfirmation(confirmation) {
    if (this.fail) throw new Error('The mail server is down.');
    this.sent.push(confirmation.reservationId);
  }
}

// The only place that builds the service: after the refactoring it takes any sender.
function newService(failingSender = false) {
  const store = new InMemoryReservationStore();
  const sender = new FakeNotificationSender(failingSender);
  return { service: new BookingService([r7, r8], store, sender), store, sender };
}

test('Maya gets R7 when it is free', async () => {
  const { service } = newService();
  assert.equal(String(await service.reserve(maya, r7, nov(12, 14))), 'Accepted R101');
});

test('Omar is refused when a night is shared', async () => {
  const { service, store } = newService();
  await service.reserve(maya, r7, nov(12, 14));
  assert.equal(String(await service.reserve(omar, r7, nov(13, 15))), 'Unavailable');
  assert.equal(store.count, 1);
});

test('Nora can arrive on the day Maya leaves', async () => {
  const { service } = newService();
  await service.reserve(maya, r7, nov(12, 14));
  assert.equal(String(await service.reserve(nora, r7, nov(14, 16))), 'Accepted R102');
});

test('check-out must be after check-in', async () => {
  const { service, store } = newService();
  assert.equal(String(await service.reserve(omar, r8, nov(15, 15))), 'InvalidDates');
  assert.equal(store.count, 0);
});

test('cancelling frees the room again', async () => {
  const { service } = newService();
  await service.reserve(maya, r7, nov(12, 14));
  assert.equal(service.cancel('R101'), true);
  assert.ok(service.findFreeRooms(nov(12, 14)).some(room => room.equals(r7)));
});

test('one confirmation per accepted booking', async () => {
  const { service, sender } = newService();
  await service.reserve(maya, r7, nov(12, 14));
  await service.reserve(omar, r7, nov(13, 15));
  await service.reserve(nora, r7, nov(14, 16));
  assert.deepEqual(sender.sent, ['R101', 'R102']);
});

test('a failed confirmation keeps the booking', async () => {
  const { service, store } = newService(true);
  const result = await service.reserve(maya, r7, nov(12, 14));
  assert.equal(String(result), 'Accepted R101');
  assert.equal(result.notificationFailed, true);
  assert.equal(store.count, 1);
});

test('SMS confirmations need no change to BookingService', async () => {
  const sms = new SmsNotificationSender();
  const service = new BookingService([r7, r8], new InMemoryReservationStore(), sms);
  await service.reserve(maya, r7, nov(12, 14));
  assert.equal(sms.sent, 1);
});

// P06 · Hotel booking: the P04 app as a modular monolith with four modules.
// node main.js          -> the normal demo
// node main.js --race   -> two guests book the same room at the same moment
import { EmailNotificationSender } from './src/notifications/internal/email.js';
import { BookingService, DateRange, Guest } from './src/reservations/index.js';
import { InMemoryReservationStore } from './src/reservations/internal/store.js';
import { Room } from './src/rooms/index.js';
import { InMemoryRoomCatalog } from './src/rooms/internal/catalog.js';

const r7 = new Room('R7', 'Standard');
const r8 = new Room('R8', 'Deluxe');
const maya = new Guest('Maya', 'maya@example.com');
const omar = new Guest('Omar', 'omar@example.com');
const nora = new Guest('Nora', 'nora@example.com');

// The wiring: the only app code that imports the internal files of the modules.
const catalog = new InMemoryRoomCatalog([r7, r8]);

const nov = (checkIn, checkOut) =>
  new DateRange(new Date(Date.UTC(2026, 10, checkIn)), new Date(Date.UTC(2026, 10, checkOut)));

const names = rooms => rooms.map(room => room.number).join(', ');

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

// JavaScript prints booleans as true/false; the course output says True, so the demo spells it out.
const boolText = value => (value ? 'True' : 'False');

async function runDemo() {
  const store = new InMemoryReservationStore();
  const email = new EmailNotificationSender();
  const service = new BookingService(catalog.all(), store, email);

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
  const store = new InMemoryReservationStore();
  // Each request now spends half a second between checking and saving.
  const service = new BookingService(catalog.all(), store, new EmailNotificationSender(), 500);
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

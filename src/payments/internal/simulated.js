import { PaymentStatus } from '../index.js';

// Simulated: no card and no network. A positive amount is Paid; anything else is Declined.
export class SimulatedPaymentService {
  takeDeposit(reservationId, amount) {
    return amount > 0 ? PaymentStatus.Paid : PaymentStatus.Declined;
  }
}

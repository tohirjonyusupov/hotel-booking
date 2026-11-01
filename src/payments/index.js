// Payments: deposits and whether they were paid. This file is the module's public contract.
//
// A payment service keeps one promise (JavaScript has no interface keyword):
//
//   takeDeposit(reservationId, amount)   returns PaymentStatus.Paid or PaymentStatus.Declined
//
// Booking does not call it yet: the booking saga uses it in P17.
export const PaymentStatus = Object.freeze({ Paid: 'Paid', Declined: 'Declined' });

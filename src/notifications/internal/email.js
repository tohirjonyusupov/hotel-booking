// Simulated: counts the messages it would send and needs no network.
export class EmailNotificationSender {
  sent = 0;

  sendConfirmation(confirmation) {
    this.sent += 1;
  }
}

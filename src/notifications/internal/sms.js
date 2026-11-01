// Simulated, like the email sender.
export class SmsNotificationSender {
  sent = 0;

  sendConfirmation(confirmation) {
    this.sent += 1;
  }
}

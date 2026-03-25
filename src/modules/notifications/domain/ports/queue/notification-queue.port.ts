export type EnqueueNotificationPayload = {
  notificationId: string;
  ticketId: string;
  ticketTitle: string;
  userId: string;
  recipient: string;
};

export abstract class NotificationQueuePort {
  abstract enqueueTicketCreated(
    payload: EnqueueNotificationPayload,
  ): Promise<void>;
}

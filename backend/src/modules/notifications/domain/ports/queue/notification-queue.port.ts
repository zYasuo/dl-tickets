export type EnqueueNotificationPayload = {
  notificationId: string;
  ticketId: string;
  ticketTitle: string;
  userId: string;
  recipient: string;
};

export type EnqueuePasswordResetPayload = {
  userId: string;
  email: string;
  resetToken: string;
};

export abstract class NotificationQueuePort {
  abstract enqueueTicketCreated(payload: EnqueueNotificationPayload): Promise<void>;
  abstract enqueuePasswordReset(payload: EnqueuePasswordResetPayload): Promise<void>;
}

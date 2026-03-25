export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
}

export type TNotificationEntity = {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  ticketId: string;
  userId: string;
  sentAt: Date | null;
  createdAt: Date;
};

export class NotificationEntity {
  constructor(private readonly params: TNotificationEntity) {}

  get id(): string {
    return this.params.id;
  }

  get channel(): NotificationChannel {
    return this.params.channel;
  }

  get recipient(): string {
    return this.params.recipient;
  }

  get subject(): string {
    return this.params.subject;
  }

  get body(): string {
    return this.params.body;
  }

  get status(): NotificationStatus {
    return this.params.status;
  }

  get ticketId(): string {
    return this.params.ticketId;
  }

  get userId(): string {
    return this.params.userId;
  }

  get sentAt(): Date | null {
    return this.params.sentAt;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  markAsSent(): NotificationEntity {
    return new NotificationEntity({
      ...this.params,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  markAsFailed(): NotificationEntity {
    return new NotificationEntity({
      ...this.params,
      status: NotificationStatus.FAILED,
    });
  }

  static create(input: TNotificationEntity): NotificationEntity {
    return new NotificationEntity(input);
  }
}

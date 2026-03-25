import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationQueuePort,
  type EnqueueNotificationPayload,
} from 'src/modules/notifications/domain/ports/queue/notification-queue.port';

const QUEUE_NAME = 'notifications';

export enum NotificationJobName {
  TICKET_CREATED = 'ticket.created',
}

@Injectable()
export class NotificationQueueAdapter extends NotificationQueuePort {
  private readonly logger = new Logger(NotificationQueueAdapter.name);

  constructor(@InjectQueue(QUEUE_NAME) private readonly queue: Queue) {
    super();
  }

  async enqueueTicketCreated(
    payload: EnqueueNotificationPayload,
  ): Promise<void> {
    const job = await this.queue.add(
      NotificationJobName.TICKET_CREATED,
      payload,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Job ${job.id} enqueued [${NotificationJobName.TICKET_CREATED}] for notification ${payload.notificationId}`,
    );
  }
}

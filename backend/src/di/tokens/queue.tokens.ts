import type { InjectionToken } from '@nestjs/common';
import type { NotificationQueuePort } from 'src/modules/notifications/domain/ports/queue/notification-queue.port';

export const NOTIFICATION_QUEUE_PORT: InjectionToken<NotificationQueuePort> =
  Symbol('NOTIFICATION_QUEUE_PORT');

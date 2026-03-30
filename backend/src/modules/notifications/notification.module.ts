import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationRepository } from './infrastructure/outbound/persistence/repositories/notification.repository';
import { NotificationQueueAdapter } from './infrastructure/outbound/queue/notification-queue.adapter';
import { NotificationConsumer } from './infrastructure/outbound/queue/notification.consumer';
import { SendNotificationUseCase } from './application/use-case/send-notification.use-case';
import { SendPasswordResetEmailUseCase } from './application/use-case/send-password-reset-email.use-case';
import { NOTIFICATION_QUEUE_PORT, NOTIFICATION_REPOSITORY } from 'src/di/tokens';

const QUEUE_NAME = 'notifications';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAME })],
  providers: [
    SendNotificationUseCase,
    SendPasswordResetEmailUseCase,
    NotificationConsumer,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
    {
      provide: NOTIFICATION_QUEUE_PORT,
      useClass: NotificationQueueAdapter,
    },
  ],
  exports: [NOTIFICATION_REPOSITORY, NOTIFICATION_QUEUE_PORT],
})
export class NotificationModule {}

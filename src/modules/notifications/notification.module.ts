import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationRepositoryPort } from './domain/ports/repository/notification.repository.port';
import { NotificationRepository } from './infrastructure/outbound/persistence/repositories/notification.repository';
import { NotificationQueuePort } from './domain/ports/queue/notification-queue.port';
import { NotificationQueueAdapter } from './infrastructure/outbound/queue/notification-queue.adapter';
import { NotificationConsumer } from './infrastructure/outbound/queue/notification.consumer';
import { SendNotificationUseCase } from './application/use-case/send-notification.use-case';

const QUEUE_NAME = 'notifications';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAME })],
  providers: [
    SendNotificationUseCase,
    NotificationConsumer,
    {
      provide: NotificationRepositoryPort,
      useClass: NotificationRepository,
    },
    {
      provide: NotificationQueuePort,
      useClass: NotificationQueueAdapter,
    },
  ],
  exports: [NotificationRepositoryPort, NotificationQueuePort],
})
export class NotificationModule {}

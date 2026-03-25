import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import { Description } from '../../domain/vo/description.vo';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { ticketCacheKey } from '../cache/ticket-cache.key';
import { NotificationRepositoryPort } from 'src/modules/notifications/domain/ports/repository/notification.repository.port';
import { NotificationQueuePort } from 'src/modules/notifications/domain/ports/queue/notification-queue.port';
import {
  NotificationEntity,
  NotificationChannel,
  NotificationStatus,
} from 'src/modules/notifications/domain/entities/notification.entity';
import type { TCreateTicket } from '../dto/create-ticket.dto';

@Injectable()
export class CreateTicketUseCase {
  private readonly CACHE_TTL_SECONDS = 60 * 5;

  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly cachePort: CachePort,
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly notificationQueue: NotificationQueuePort,
  ) {}

  async execute(input: TCreateTicket): Promise<TicketEntity> {
    const { title, description, userId } = input;
    const now = new Date();

    const ticket = await this.ticketRepository.create(
      TicketEntity.create({
        id: randomUUID(),
        title,
        description: Description.create(description),
        status: TicketStatus.OPEN,
        createdAt: now,
        updatedAt: now,
        userId,
      }),
    );

    await this.cachePort.setJson(
      ticketCacheKey(ticket.id),
      ticket,
      this.CACHE_TTL_SECONDS,
    );

    const notification = await this.notificationRepository.create(
      NotificationEntity.create({
        id: randomUUID(),
        channel: NotificationChannel.EMAIL,
        recipient: userId,
        subject: `Ticket created: ${ticket.title}`,
        body: `Your ticket "${ticket.title}" has been created successfully.`,
        status: NotificationStatus.PENDING,
        ticketId: ticket.id,
        userId,
        sentAt: null,
        createdAt: now,
      }),
    );

    await this.notificationQueue.enqueueTicketCreated({
      notificationId: notification.id,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      userId,
      recipient: notification.recipient,
    });

    return ticket;
  }
}

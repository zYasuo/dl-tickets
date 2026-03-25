import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import { Description } from '../../domain/vo/description.vo';
import { CachePort } from 'src/common/ports/cache/cache.ports';
import { encodeTicketRow } from '../mappers/ticket-cache.codec';
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
  private readonly LIST_VERSION_KEY = 'tickets:all:version';

  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly cachePort: CachePort,
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly notificationQueue: NotificationQueuePort,
  ) {}

  async execute(input: TCreateTicket): Promise<TicketEntity> {
    const { title, description, userId } = input;
    const now = new Date();

    const ticket = TicketEntity.create({
      id: randomUUID(),
      title,
      description: Description.create(description),
      status: TicketStatus.OPEN,
      createdAt: now,
      updatedAt: now,
      userId,
    });

    const createdTicket = await this.ticketRepository.create(ticket);

    await this.cachePort.incr(this.LIST_VERSION_KEY);

    await this.cachePort.setJson(
      ticketCacheKey(createdTicket.id),
      encodeTicketRow(createdTicket),
      this.CACHE_TTL_SECONDS,
    );

    const message = `Your ticket "${createdTicket.title}" has been created successfully.`;

    const notification = await this.notificationRepository.create(
      NotificationEntity.create({
        id: randomUUID(),
        channel: NotificationChannel.EMAIL,
        recipient: userId,
        subject: `Ticket created: ${createdTicket.title}`,
        body: message,
        status: NotificationStatus.PENDING,
        ticketId: createdTicket.id,
        userId,
        sentAt: null,
        createdAt: now,
      }),
    );

    await this.notificationQueue.enqueueTicketCreated({
      notificationId: notification.id,
      ticketId: createdTicket.id,
      ticketTitle: createdTicket.title,
      userId,
      recipient: notification.recipient,
    });

    return createdTicket;
  }
}

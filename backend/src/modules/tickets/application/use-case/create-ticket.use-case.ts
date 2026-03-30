import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CACHE_PORT,
  NOTIFICATION_QUEUE_PORT,
  NOTIFICATION_REPOSITORY,
  TICKET_REPOSITORY,
  USER_REPOSITORY,
} from 'src/di/tokens';
import type { TicketRepositoryPort } from '../../domain/ports/repository/ticket.repository.port';
import { TicketEntity, TicketStatus } from '../../domain/entities/ticket.entity';
import { Description } from '../../domain/vo/description.vo';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { encodeTicketRow } from '../mappers/ticket-cache.codec';
import { ticketUserListVersionKey } from '../cache/ticket-key-builder.cache';
import { ticketCacheKey } from '../cache/ticket-cache.key';
import type { NotificationRepositoryPort } from 'src/modules/notifications/domain/ports/repository/notification.repository.port';
import type { NotificationQueuePort } from 'src/modules/notifications/domain/ports/queue/notification-queue.port';
import type { UserRepositoryPort } from 'src/modules/users/domain/ports/repository/user.repository.port';
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
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepositoryPort,
    @Inject(CACHE_PORT) private readonly cachePort: CachePort,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
    @Inject(NOTIFICATION_QUEUE_PORT)
    private readonly notificationQueue: NotificationQueuePort,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: TCreateTicket, userUuid: string): Promise<TicketEntity> {
    const user = await this.userRepository.findByUuid(userUuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { title, description } = input;
    const now = new Date();

    const ticket = TicketEntity.create({
      id: randomUUID(),
      title,
      description: Description.create(description),
      status: TicketStatus.OPEN,
      createdAt: now,
      updatedAt: now,
      userId: userUuid,
    });

    const createdTicket = await this.ticketRepository.create(ticket);

    await this.cachePort.incr(ticketUserListVersionKey(userUuid));

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
        recipient: user.email.value,
        subject: `Ticket created: ${createdTicket.title}`,
        body: message,
        status: NotificationStatus.PENDING,
        ticketId: createdTicket.id,
        userId: userUuid,
        sentAt: null,
        createdAt: now,
      }),
    );

    await this.notificationQueue.enqueueTicketCreated({
      notificationId: notification.id,
      ticketId: createdTicket.id,
      ticketTitle: createdTicket.title,
      userId: userUuid,
      recipient: notification.recipient,
    });

    return createdTicket;
  }
}

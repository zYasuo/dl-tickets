import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  NotificationEntity,
  NotificationStatus,
  NotificationChannel,
} from 'src/modules/notifications/domain/entities/notification.entity';
import { NotificationRepositoryPort } from 'src/modules/notifications/domain/ports/repository/notification.repository.port';

@Injectable()
export class NotificationRepository extends NotificationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(notification: NotificationEntity): Promise<NotificationEntity> {
    const row = await this.prisma.notification.create({
      data: {
        id: notification.id,
        channel: notification.channel,
        recipient: notification.recipient,
        subject: notification.subject,
        body: notification.body,
        status: notification.status,
        ticketId: notification.ticketId,
        userId: notification.userId,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt,
      },
    });

    return this.toDomain(row);
  }

  async updateStatus(notification: NotificationEntity): Promise<NotificationEntity> {
    const row = await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: notification.status,
        sentAt: notification.sentAt,
      },
    });

    return this.toDomain(row);
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: string;
    channel: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    ticketId: string;
    userId: string;
    sentAt: Date | null;
    createdAt: Date;
  }): NotificationEntity {
    return NotificationEntity.create({
      id: row.id,
      channel: row.channel as NotificationChannel,
      recipient: row.recipient,
      subject: row.subject,
      body: row.body,
      status: row.status as NotificationStatus,
      ticketId: row.ticketId,
      userId: row.userId,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
    });
  }
}

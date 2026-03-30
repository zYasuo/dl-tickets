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
    const ticket = await this.prisma.tickets.findUniqueOrThrow({
      where: { uuid: notification.ticketId },
      select: { id: true },
    });
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { uuid: notification.userId },
      select: { id: true },
    });

    const row = await this.prisma.notification.create({
      data: {
        uuid: notification.id,
        channel: notification.channel,
        recipient: notification.recipient,
        subject: notification.subject,
        body: notification.body,
        status: notification.status,
        ticketId: ticket.id,
        userId: user.id,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt,
      },
      include: {
        ticket: { select: { uuid: true } },
        user: { select: { uuid: true } },
      },
    });

    return this.toDomain(row);
  }

  async updateStatus(notification: NotificationEntity): Promise<NotificationEntity> {
    const row = await this.prisma.notification.update({
      where: { uuid: notification.id },
      data: {
        status: notification.status,
        sentAt: notification.sentAt,
      },
      include: {
        ticket: { select: { uuid: true } },
        user: { select: { uuid: true } },
      },
    });

    return this.toDomain(row);
  }

  async findById(uuid: string): Promise<NotificationEntity | null> {
    const row = await this.prisma.notification.findUnique({
      where: { uuid },
      include: {
        ticket: { select: { uuid: true } },
        user: { select: { uuid: true } },
      },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  private toDomain(row: {
    id: number;
    uuid: string;
    channel: string;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    ticketId: number;
    userId: number;
    sentAt: Date | null;
    createdAt: Date;
    ticket: { uuid: string };
    user: { uuid: string };
  }): NotificationEntity {
    return NotificationEntity.create({
      id: row.uuid,
      channel: row.channel as NotificationChannel,
      recipient: row.recipient,
      subject: row.subject,
      body: row.body,
      status: row.status as NotificationStatus,
      ticketId: row.ticket.uuid,
      userId: row.user.uuid,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
    });
  }
}

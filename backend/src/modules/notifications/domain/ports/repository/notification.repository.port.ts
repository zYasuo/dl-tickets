import { NotificationEntity } from '../../entities/notification.entity';

export abstract class NotificationRepositoryPort {
  abstract create(notification: NotificationEntity): Promise<NotificationEntity>;
  abstract updateStatus(notification: NotificationEntity): Promise<NotificationEntity>;
  abstract findById(id: string): Promise<NotificationEntity | null>;
}

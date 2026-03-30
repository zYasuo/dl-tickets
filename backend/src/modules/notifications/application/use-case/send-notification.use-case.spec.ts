import {
  NotificationChannel,
  NotificationEntity,
  NotificationStatus,
} from '../../domain/entities/notification.entity';
import { NotificationRepositoryPort } from '../../domain/ports/repository/notification.repository.port';
import { SendNotificationUseCase } from './send-notification.use-case';

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;
  let repository: jest.Mocked<Pick<NotificationRepositoryPort, 'findById' | 'updateStatus'>>;

  const base = {
    channel: NotificationChannel.EMAIL,
    recipient: 'user-1',
    subject: 'Hi',
    body: 'Hello',
    status: NotificationStatus.PENDING,
    ticketId: 'ticket-1',
    userId: 'user-1',
    sentAt: null as Date | null,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new SendNotificationUseCase(repository as unknown as NotificationRepositoryPort);
  });

  it('returns early when notification is missing', async () => {
    repository.findById.mockResolvedValue(null);

    await useCase.execute('missing-id');

    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it('marks notification as sent on success', async () => {
    const n = NotificationEntity.create({ id: 'n1', ...base });
    repository.findById.mockResolvedValue(n);
    repository.updateStatus.mockImplementation(async (x) => x);

    await useCase.execute('n1');

    expect(repository.updateStatus).toHaveBeenCalled();
    const updated = repository.updateStatus.mock.calls[0][0];
    expect(updated.status).toBe(NotificationStatus.SENT);
    expect(updated.sentAt).not.toBeNull();
  });

  it('marks notification as failed when updateStatus throws', async () => {
    const n = NotificationEntity.create({ id: 'n2', ...base });
    repository.findById.mockResolvedValue(n);
    repository.updateStatus
      .mockRejectedValueOnce(new Error('smtp down'))
      .mockImplementationOnce(async (x: NotificationEntity) => x);

    await useCase.execute('n2');

    expect(repository.updateStatus).toHaveBeenCalledTimes(2);
    const failed = repository.updateStatus.mock.calls[1][0];
    expect(failed.status).toBe(NotificationStatus.FAILED);
  });
});

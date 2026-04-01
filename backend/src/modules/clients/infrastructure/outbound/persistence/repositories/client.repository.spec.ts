import { PrismaService } from 'nestjs-prisma';
import { ClientRepository } from './client.repository';

describe('ClientRepository', () => {
  let repository: ClientRepository;
  let prisma: {
    client: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      client: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    repository = new ClientRepository(prisma as unknown as PrismaService);
  });

  it('applies cursor only to findMany; count uses business filters only', async () => {
    prisma.client.count.mockResolvedValue(100);

    await repository.findAll({
      page: 1,
      limit: 10,
      cursor: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      sortBy: 'name',
      sortOrder: 'asc',
      name: '  Acme  ',
    });

    expect(prisma.client.count).toHaveBeenCalledWith({
      where: {
        AND: [{ name: { contains: 'Acme', mode: 'insensitive' } }],
      },
    });

    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { name: { contains: 'Acme', mode: 'insensitive' } },
            { uuid: { gt: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' } },
          ],
        },
      }),
    );
  });

  it('uses empty where for count when only cursor is set (no business filters)', async () => {
    await repository.findAll({
      page: 1,
      limit: 5,
      cursor: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(prisma.client.count).toHaveBeenCalledWith({ where: {} });
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ uuid: { gt: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' } }],
        },
      }),
    );
  });
});

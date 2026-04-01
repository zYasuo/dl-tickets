import { randomUUID } from 'node:crypto';
import { ConcurrencyError } from 'src/common/errors/concurrency.error';
import { PrismaService } from 'nestjs-prisma';
import {
  ClientContractEntity,
  ClientContractStatus,
} from 'src/modules/client-contracts/domain/entities/client-contract.entity';
import { ClientContractRepository } from './client-contract.repository';

describe('ClientContractRepository', () => {
  let repository: ClientContractRepository;
  let prisma: {
    client: { findUniqueOrThrow: jest.Mock };
    clientContract: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };

  const clientUuid = randomUUID();
  const now = new Date('2025-06-01T12:00:00.000Z');

  function prismaContractRow(uuid: string, overrides: Record<string, unknown> = {}) {
    return {
      id: 1,
      uuid,
      contractNumber: 'CTR-1',
      clientId: 99,
      useClientAddress: true,
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      state: null,
      zipCode: null,
      startDate: now,
      endDate: null,
      status: ClientContractStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      client: { uuid: clientUuid },
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      client: { findUniqueOrThrow: jest.fn() },
      clientContract: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    repository = new ClientContractRepository(prisma as unknown as PrismaService);
  });

  it('create resolves client FK and returns entity with client uuid', async () => {
    const entity = ClientContractEntity.create({
      id: randomUUID(),
      contractNumber: 'CTR-1',
      clientId: clientUuid,
      useClientAddress: true,
      startDate: now,
      status: ClientContractStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    prisma.client.findUniqueOrThrow.mockResolvedValue({ id: 99 });
    const row = prismaContractRow(entity.id);
    prisma.clientContract.create.mockResolvedValue(row);

    const out = await repository.create(entity);

    expect(prisma.client.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { uuid: clientUuid },
      select: { id: true },
    });
    expect(prisma.clientContract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        include: { client: { select: { uuid: true } } },
        data: expect.objectContaining({
          uuid: entity.id,
          contractNumber: 'CTR-1',
          client: { connect: { id: 99 } },
        }),
      }),
    );
    expect(out.id).toBe(entity.id);
    expect(out.clientId).toBe(clientUuid);
  });

  it('findAll applies cursor only to findMany; count uses business filters only', async () => {
    prisma.clientContract.count.mockResolvedValue(50);

    await repository.findAll({
      page: 1,
      limit: 10,
      cursor: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      sortBy: 'contractNumber',
      sortOrder: 'asc',
      clientId: `  ${clientUuid}  `,
      status: ClientContractStatus.ACTIVE,
    });

    expect(prisma.clientContract.count).toHaveBeenCalledWith({
      where: {
        AND: [{ client: { uuid: clientUuid } }, { status: ClientContractStatus.ACTIVE }],
      },
    });

    expect(prisma.clientContract.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { client: { uuid: clientUuid } },
            { status: ClientContractStatus.ACTIVE },
            { uuid: { gt: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' } },
          ],
        },
        include: { client: { select: { uuid: true } } },
      }),
    );
  });

  it('findById returns null when missing', async () => {
    prisma.clientContract.findUnique.mockResolvedValue(null);
    const out = await repository.findById(randomUUID());
    expect(out).toBeNull();
  });

  it('findById maps row with include', async () => {
    const id = randomUUID();
    prisma.clientContract.findUnique.mockResolvedValue(prismaContractRow(id));

    const out = await repository.findById(id);

    expect(out?.id).toBe(id);
    expect(prisma.clientContract.findUnique).toHaveBeenCalledWith({
      where: { uuid: id },
      include: { client: { select: { uuid: true } } },
    });
  });

  it('update throws ConcurrencyError when updateMany matches no row', async () => {
    const entity = ClientContractEntity.restore({
      id: randomUUID(),
      contractNumber: 'CTR-1',
      clientId: clientUuid,
      useClientAddress: true,
      startDate: now,
      status: ClientContractStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    prisma.clientContract.updateMany.mockResolvedValue({ count: 0 });

    await expect(repository.update(entity)).rejects.toBeInstanceOf(ConcurrencyError);
    expect(prisma.clientContract.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('update refetches after successful updateMany', async () => {
    const entity = ClientContractEntity.restore({
      id: randomUUID(),
      contractNumber: 'CTR-2',
      clientId: clientUuid,
      useClientAddress: true,
      startDate: now,
      status: ClientContractStatus.EXPIRED,
      createdAt: now,
      updatedAt: now,
    });

    prisma.clientContract.updateMany.mockResolvedValue({ count: 1 });
    const refreshed = prismaContractRow(entity.id, {
      contractNumber: 'CTR-2',
      status: ClientContractStatus.EXPIRED,
    });
    prisma.clientContract.findUniqueOrThrow.mockResolvedValue(refreshed);

    const out = await repository.update(entity);

    expect(prisma.clientContract.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { uuid: entity.id, updatedAt: entity.updatedAt },
      }),
    );
    expect(out.contractNumber).toBe('CTR-2');
    expect(out.status).toBe(ClientContractStatus.EXPIRED);
  });
});

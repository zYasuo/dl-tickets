import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { DeleteStateUseCase } from './delete-state.use-case';

describe('DeleteStateUseCase', () => {
  const existing = StateEntity.create({
    id: randomUUID(),
    name: 'S',
    code: null,
    countryId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws NotFound when missing', async () => {
    const states = { findByUuid: jest.fn().mockResolvedValue(null), deleteByUuid: jest.fn() };
    const useCase = new DeleteStateUseCase(states as unknown as StateRepositoryPort);

    await expect(useCase.execute('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Conflict on P2003', async () => {
    const states = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      deleteByUuid: jest.fn().mockRejectedValue({ code: 'P2003' }),
    };
    const useCase = new DeleteStateUseCase(states as unknown as StateRepositoryPort);

    await expect(useCase.execute(existing.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes when ok', async () => {
    const states = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      deleteByUuid: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new DeleteStateUseCase(states as unknown as StateRepositoryPort);

    await expect(useCase.execute(existing.id)).resolves.toBeUndefined();
  });
});

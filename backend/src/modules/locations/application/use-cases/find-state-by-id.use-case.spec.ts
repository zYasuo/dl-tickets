import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { FindStateByIdUseCase } from './find-state-by-id.use-case';

describe('FindStateByIdUseCase', () => {
  const row = StateEntity.create({
    id: randomUUID(),
    name: 'S',
    code: 'SP',
    countryId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws when not found', async () => {
    const states = { findByUuid: jest.fn().mockResolvedValue(null) };
    const useCase = new FindStateByIdUseCase(states as unknown as StateRepositoryPort);

    await expect(useCase.execute('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns row when found', async () => {
    const states = { findByUuid: jest.fn().mockResolvedValue(row) };
    const useCase = new FindStateByIdUseCase(states as unknown as StateRepositoryPort);

    await expect(useCase.execute(row.id)).resolves.toBe(row);
  });
});

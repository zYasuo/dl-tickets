import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { UpdateStateUseCase } from './update-state.use-case';

describe('UpdateStateUseCase', () => {
  const cid = randomUUID();
  const existing = StateEntity.create({
    id: randomUUID(),
    name: 'Old',
    code: 'OL',
    countryId: cid,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
  });

  it('throws when missing', async () => {
    const states = { findByUuid: jest.fn().mockResolvedValue(null), update: jest.fn() };
    const useCase = new UpdateStateUseCase(states as unknown as StateRepositoryPort);

    await expect(useCase.execute('x', { name: 'N' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates name and normalizes code when provided', async () => {
    const updated = StateEntity.create({
      id: existing.id,
      name: 'New',
      code: 'NW',
      countryId: cid,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    const states = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue(updated),
    };
    const useCase = new UpdateStateUseCase(states as unknown as StateRepositoryPort);

    const result = await useCase.execute(existing.id, { name: '  New  ', code: 'nw' });

    expect(result).toBe(updated);
    expect(states.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New', code: 'NW' }),
    );
  });

  it('sets code to null when body.code is null', async () => {
    const updated = StateEntity.create({
      id: existing.id,
      name: 'X',
      code: null,
      countryId: cid,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    const states = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue(updated),
    };
    const useCase = new UpdateStateUseCase(states as unknown as StateRepositoryPort);

    await useCase.execute(existing.id, { name: 'X', code: null });

    expect(states.update).toHaveBeenCalledWith(expect.objectContaining({ code: null }));
  });
});

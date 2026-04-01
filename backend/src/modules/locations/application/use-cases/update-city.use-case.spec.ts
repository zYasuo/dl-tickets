import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';
import { UpdateCityUseCase } from './update-city.use-case';

describe('UpdateCityUseCase', () => {
  const sid = randomUUID();
  const existing = CityEntity.create({
    id: randomUUID(),
    name: 'Old',
    stateId: sid,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
  });

  it('throws when missing', async () => {
    const cities = { findByUuid: jest.fn().mockResolvedValue(null), update: jest.fn() };
    const useCase = new UpdateCityUseCase(cities as unknown as CityRepositoryPort);

    await expect(useCase.execute('x', { name: 'N' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates trimmed name', async () => {
    const updated = CityEntity.create({
      id: existing.id,
      name: 'New',
      stateId: sid,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    const cities = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue(updated),
    };
    const useCase = new UpdateCityUseCase(cities as unknown as CityRepositoryPort);

    const result = await useCase.execute(existing.id, { name: '  New  ' });

    expect(result).toBe(updated);
    expect(cities.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New', stateId: sid }),
    );
  });
});

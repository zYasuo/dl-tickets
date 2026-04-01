import { ConflictException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';
import { DeleteCityUseCase } from './delete-city.use-case';

describe('DeleteCityUseCase', () => {
  const existing = CityEntity.create({
    id: randomUUID(),
    name: 'C',
    stateId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws NotFound when missing', async () => {
    const cities = { findByUuid: jest.fn().mockResolvedValue(null), deleteByUuid: jest.fn() };
    const useCase = new DeleteCityUseCase(cities as unknown as CityRepositoryPort);

    await expect(useCase.execute('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Conflict on P2003', async () => {
    const cities = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      deleteByUuid: jest.fn().mockRejectedValue({ code: 'P2003' }),
    };
    const useCase = new DeleteCityUseCase(cities as unknown as CityRepositoryPort);

    await expect(useCase.execute(existing.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes when ok', async () => {
    const cities = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      deleteByUuid: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new DeleteCityUseCase(cities as unknown as CityRepositoryPort);

    await expect(useCase.execute(existing.id)).resolves.toBeUndefined();
  });
});

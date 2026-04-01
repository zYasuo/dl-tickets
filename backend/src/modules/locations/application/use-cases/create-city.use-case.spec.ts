import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';
import { CreateCityUseCase } from './create-city.use-case';

describe('CreateCityUseCase', () => {
  const stateUuid = randomUUID();
  const state = StateEntity.create({
    id: stateUuid,
    name: 'SP',
    code: 'SP',
    countryId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws when state not found', async () => {
    const states = { findByUuid: jest.fn().mockResolvedValue(null) };
    const cities = { create: jest.fn() };
    const useCase = new CreateCityUseCase(
      states as unknown as StateRepositoryPort,
      cities as unknown as CityRepositoryPort,
    );

    await expect(useCase.execute({ stateUuid, name: 'Campinas' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(cities.create).not.toHaveBeenCalled();
  });

  it('trims name and creates city', async () => {
    const created = CityEntity.create({
      id: randomUUID(),
      name: 'Campinas',
      stateId: stateUuid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const states = { findByUuid: jest.fn().mockResolvedValue(state) };
    const cities = { create: jest.fn().mockResolvedValue(created) };
    const useCase = new CreateCityUseCase(
      states as unknown as StateRepositoryPort,
      cities as unknown as CityRepositoryPort,
    );

    const result = await useCase.execute({ stateUuid, name: '  Campinas  ' });

    expect(result).toBe(created);
    expect(cities.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Campinas', stateId: stateUuid }),
    );
  });
});

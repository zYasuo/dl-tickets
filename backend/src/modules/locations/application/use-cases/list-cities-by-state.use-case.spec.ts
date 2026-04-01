import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';
import { ListCitiesByStateUseCase } from './list-cities-by-state.use-case';

describe('ListCitiesByStateUseCase', () => {
  const stateUuid = randomUUID();
  const state = StateEntity.create({
    id: stateUuid,
    name: 'S',
    code: null,
    countryId: randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws when state missing', async () => {
    const states = { findByUuid: jest.fn().mockResolvedValue(null) };
    const cities = { findByStateUuid: jest.fn() };
    const useCase = new ListCitiesByStateUseCase(
      states as unknown as StateRepositoryPort,
      cities as unknown as CityRepositoryPort,
    );

    await expect(useCase.execute({ stateUuid })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns cities', async () => {
    const list = [
      CityEntity.create({
        id: randomUUID(),
        name: 'C',
        stateId: stateUuid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];
    const states = { findByUuid: jest.fn().mockResolvedValue(state) };
    const cities = { findByStateUuid: jest.fn().mockResolvedValue(list) };
    const useCase = new ListCitiesByStateUseCase(
      states as unknown as StateRepositoryPort,
      cities as unknown as CityRepositoryPort,
    );

    await expect(useCase.execute({ stateUuid })).resolves.toBe(list);
    expect(cities.findByStateUuid).toHaveBeenCalledWith(stateUuid);
  });
});

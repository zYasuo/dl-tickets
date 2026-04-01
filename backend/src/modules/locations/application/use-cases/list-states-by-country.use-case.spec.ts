import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { ListStatesByCountryUseCase } from './list-states-by-country.use-case';

describe('ListStatesByCountryUseCase', () => {
  const countryUuid = randomUUID();
  const country = CountryEntity.create({
    id: countryUuid,
    name: 'B',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws when country missing', async () => {
    const countries = { findByUuid: jest.fn().mockResolvedValue(null) };
    const states = { findByCountryUuid: jest.fn() };
    const useCase = new ListStatesByCountryUseCase(
      countries as unknown as CountryRepositoryPort,
      states as unknown as StateRepositoryPort,
    );

    await expect(useCase.execute({ countryUuid })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns states for country', async () => {
    const list = [
      StateEntity.create({
        id: randomUUID(),
        name: 'S',
        code: null,
        countryId: countryUuid,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];
    const countries = { findByUuid: jest.fn().mockResolvedValue(country) };
    const states = { findByCountryUuid: jest.fn().mockResolvedValue(list) };
    const useCase = new ListStatesByCountryUseCase(
      countries as unknown as CountryRepositoryPort,
      states as unknown as StateRepositoryPort,
    );

    await expect(useCase.execute({ countryUuid })).resolves.toBe(list);
    expect(states.findByCountryUuid).toHaveBeenCalledWith(countryUuid);
  });
});

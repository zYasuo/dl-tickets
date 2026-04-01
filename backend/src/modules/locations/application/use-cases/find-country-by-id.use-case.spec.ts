import { NotFoundException } from '@nestjs/common';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { FindCountryByIdUseCase } from './find-country-by-id.use-case';

describe('FindCountryByIdUseCase', () => {
  const row = CountryEntity.create({
    id: 'u1',
    name: 'X',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws when not found', async () => {
    const countries = { findByUuid: jest.fn().mockResolvedValue(null) };
    const useCase = new FindCountryByIdUseCase(countries as unknown as CountryRepositoryPort);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns entity when found', async () => {
    const countries = { findByUuid: jest.fn().mockResolvedValue(row) };
    const useCase = new FindCountryByIdUseCase(countries as unknown as CountryRepositoryPort);

    await expect(useCase.execute('u1')).resolves.toBe(row);
  });
});

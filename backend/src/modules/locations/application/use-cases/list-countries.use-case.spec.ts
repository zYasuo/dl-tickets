import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { ListCountriesUseCase } from './list-countries.use-case';

describe('ListCountriesUseCase', () => {
  it('returns findAll from repository', async () => {
    const rows = [
      CountryEntity.create({
        id: '1',
        name: 'A',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];
    const countries = { findAll: jest.fn().mockResolvedValue(rows) };
    const useCase = new ListCountriesUseCase(countries as unknown as CountryRepositoryPort);

    await expect(useCase.execute()).resolves.toBe(rows);
    expect(countries.findAll).toHaveBeenCalled();
  });
});

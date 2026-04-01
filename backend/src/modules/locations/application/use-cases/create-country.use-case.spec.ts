import { randomUUID } from 'node:crypto';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { CreateCountryUseCase } from './create-country.use-case';

describe('CreateCountryUseCase', () => {
  it('trims name and delegates to repository', async () => {
    const countries = { create: jest.fn() };
    const useCase = new CreateCountryUseCase(countries as unknown as CountryRepositoryPort);
    const created = CountryEntity.create({
      id: randomUUID(),
      name: 'Brasil',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    countries.create.mockResolvedValue(created);

    const result = await useCase.execute({ name: '  Brasil  ' });

    expect(result).toBe(created);
    expect(countries.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Brasil' }));
  });
});

import { NotFoundException } from '@nestjs/common';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { UpdateCountryUseCase } from './update-country.use-case';

describe('UpdateCountryUseCase', () => {
  const existing = CountryEntity.create({
    id: 'u1',
    name: 'Old',
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
  });

  it('throws when country missing', async () => {
    const countries = { findByUuid: jest.fn().mockResolvedValue(null), update: jest.fn() };
    const useCase = new UpdateCountryUseCase(countries as unknown as CountryRepositoryPort);

    await expect(useCase.execute('x', { name: 'N' })).rejects.toBeInstanceOf(NotFoundException);
    expect(countries.update).not.toHaveBeenCalled();
  });

  it('updates with trimmed name', async () => {
    const updated = CountryEntity.create({
      id: 'u1',
      name: 'New',
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });
    const countries = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockResolvedValue(updated),
    };
    const useCase = new UpdateCountryUseCase(countries as unknown as CountryRepositoryPort);

    const result = await useCase.execute('u1', { name: '  New  ' });

    expect(result).toBe(updated);
    expect(countries.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1', name: 'New' }),
    );
  });
});

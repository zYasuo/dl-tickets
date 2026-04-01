import { ConflictException, NotFoundException } from '@nestjs/common';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { DeleteCountryUseCase } from './delete-country.use-case';

describe('DeleteCountryUseCase', () => {
  const existing = CountryEntity.create({
    id: 'u1',
    name: 'C',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws NotFound when missing', async () => {
    const countries = { findByUuid: jest.fn().mockResolvedValue(null), deleteByUuid: jest.fn() };
    const useCase = new DeleteCountryUseCase(countries as unknown as CountryRepositoryPort);

    await expect(useCase.execute('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Conflict on Prisma P2003', async () => {
    const countries = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      deleteByUuid: jest.fn().mockRejectedValue({ code: 'P2003' }),
    };
    const useCase = new DeleteCountryUseCase(countries as unknown as CountryRepositoryPort);

    await expect(useCase.execute('u1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes when ok', async () => {
    const countries = {
      findByUuid: jest.fn().mockResolvedValue(existing),
      deleteByUuid: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new DeleteCountryUseCase(countries as unknown as CountryRepositoryPort);

    await expect(useCase.execute('u1')).resolves.toBeUndefined();
    expect(countries.deleteByUuid).toHaveBeenCalledWith('u1');
  });
});

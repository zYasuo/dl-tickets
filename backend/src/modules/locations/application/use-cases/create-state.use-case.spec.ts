import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import { CreateStateUseCase } from './create-state.use-case';

describe('CreateStateUseCase', () => {
  const countryUuid = randomUUID();
  const country = CountryEntity.create({
    id: countryUuid,
    name: 'Brasil',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('throws when country not found', async () => {
    const countries = { findByUuid: jest.fn().mockResolvedValue(null) };
    const states = { create: jest.fn() };
    const useCase = new CreateStateUseCase(
      countries as unknown as CountryRepositoryPort,
      states as unknown as StateRepositoryPort,
    );

    await expect(useCase.execute({ countryUuid, name: 'SP', code: 'sp' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(states.create).not.toHaveBeenCalled();
  });

  it('uppercases code and trims name', async () => {
    const created = StateEntity.create({
      id: randomUUID(),
      name: 'São Paulo',
      code: 'SP',
      countryId: countryUuid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const countries = { findByUuid: jest.fn().mockResolvedValue(country) };
    const states = { create: jest.fn().mockResolvedValue(created) };
    const useCase = new CreateStateUseCase(
      countries as unknown as CountryRepositoryPort,
      states as unknown as StateRepositoryPort,
    );

    const result = await useCase.execute({
      countryUuid,
      name: '  São Paulo  ',
      code: ' sp ',
    });

    expect(result).toBe(created);
    expect(states.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'São Paulo', code: 'SP' }),
    );
  });

  it('sets code null when omitted or blank', async () => {
    const created = StateEntity.create({
      id: randomUUID(),
      name: 'X',
      code: null,
      countryId: countryUuid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const countries = { findByUuid: jest.fn().mockResolvedValue(country) };
    const states = { create: jest.fn().mockResolvedValue(created) };
    const useCase = new CreateStateUseCase(
      countries as unknown as CountryRepositoryPort,
      states as unknown as StateRepositoryPort,
    );

    await useCase.execute({ countryUuid, name: 'X', code: '   ' });

    expect(states.create).toHaveBeenCalledWith(expect.objectContaining({ code: null }));
  });
});

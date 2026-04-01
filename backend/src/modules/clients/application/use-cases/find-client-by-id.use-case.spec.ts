import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { CACHE_PORT } from 'src/modules/cache/di.tokens';
import type { CachePort } from 'src/common/ports/cache/cache.ports';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import { ClientEntity } from '../../domain/entities/client.entity';
import { Cpf } from '../../domain/vo/cpf.vo';
import { Address } from 'src/common/vo/address.vo';
import { ClientCacheKeyBuilder } from '../cache/client-cache-key-builder';
import { FindClientByIdUseCase } from './find-client-by-id.use-case';

describe('FindClientByIdUseCase', () => {
  let useCase: FindClientByIdUseCase;
  let repo: jest.Mocked<Pick<ClientRepositoryPort, 'findById'>>;
  let cache: jest.Mocked<Pick<CachePort, 'getJson' | 'setJson'>>;
  let keyBuilder: jest.Mocked<Pick<ClientCacheKeyBuilder, 'buildDetailKey'>>;

  beforeEach(async () => {
    repo = { findById: jest.fn() };
    cache = { getJson: jest.fn(), setJson: jest.fn().mockResolvedValue(undefined) };
    keyBuilder = { buildDetailKey: jest.fn().mockResolvedValue('k') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindClientByIdUseCase,
        { provide: CLIENT_REPOSITORY, useValue: repo },
        { provide: CACHE_PORT, useValue: cache },
        { provide: ClientCacheKeyBuilder, useValue: keyBuilder },
      ],
    }).compile();
    useCase = module.get(FindClientByIdUseCase);
  });

  it('throws when missing', async () => {
    cache.getJson.mockResolvedValue(null);
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(randomUUID())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns client from repository and sets cache on miss', async () => {
    const id = randomUUID();
    const entity = ClientEntity.create({
      id,
      name: 'X',
      cpf: Cpf.create('52998224725'),
      address: Address.createLegacy({
        street: 'A',
        number: '1',
        neighborhood: 'N',
        city: 'C',
        state: 'SP',
        zipCode: '01310100',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    cache.getJson.mockResolvedValue(null);
    repo.findById.mockResolvedValue(entity);
    await expect(useCase.execute(id)).resolves.toBe(entity);
    expect(cache.setJson).toHaveBeenCalled();
  });

  it('returns client from cache on hit', async () => {
    const id = randomUUID();
    const entity = ClientEntity.create({
      id,
      name: 'X',
      cpf: Cpf.create('52998224725'),
      address: Address.createLegacy({
        street: 'A',
        number: '1',
        neighborhood: 'N',
        city: 'C',
        state: 'SP',
        zipCode: '01310100',
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    cache.getJson.mockResolvedValue({
      id,
      name: 'X',
      cpf: '52998224725',
      cnpj: null,
      address: {
        street: 'A',
        number: '1',
        neighborhood: 'N',
        city: 'C',
        state: 'SP',
        zipCode: '01310100',
      },
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    });
    await expect(useCase.execute(id)).resolves.toMatchObject({ id, name: 'X' });
    expect(repo.findById).not.toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import { ClientEntity } from '../../domain/entities/client.entity';
import { Cpf } from '../../domain/vo/cpf.vo';
import { Address } from 'src/common/vo/address.vo';
import { SearchClientsUseCase } from './search-clients.use-case';

describe('SearchClientsUseCase', () => {
  let useCase: SearchClientsUseCase;
  let repo: jest.Mocked<ClientRepositoryPort>;

  const address = {
    street: 'Rua das Flores',
    number: '100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310100',
  };

  const baseEntity = (overrides: Partial<{ id: string; name: string }> = {}) =>
    ClientEntity.create({
      id: overrides.id ?? randomUUID(),
      name: overrides.name ?? 'Cliente',
      cpf: Cpf.create('52998224725'),
      address: Address.createLegacy(address),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByInternalId: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn(),
      searchByAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchClientsUseCase, { provide: CLIENT_REPOSITORY, useValue: repo }],
    }).compile();

    useCase = module.get(SearchClientsUseCase);
  });

  it('resolves masked CPF to exact cpf match', async () => {
    const entity = baseEntity();
    repo.findByCpf.mockResolvedValue(entity);

    const result = await useCase.execute({ q: '529.982.247-25', page: 1, limit: 20 }, 'user-uuid');

    expect(repo.findByCpf).toHaveBeenCalledWith('52998224725');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.match).toEqual({ kind: 'cpf', confidence: 'exact' });
  });

  it('resolves numeric internal id when term is digits only', async () => {
    const entity = baseEntity();
    repo.findByInternalId.mockResolvedValue(entity);

    const result = await useCase.execute({ q: '42', page: 1, limit: 20 }, 'user-uuid');

    expect(repo.findByInternalId).toHaveBeenCalledWith(42);
    expect(result.data[0]?.match).toEqual({ kind: 'id', confidence: 'exact' });
  });

  it('when CPF-shaped query misses CPF, skips internal id (11 digits exceed int PK) and searches address', async () => {
    repo.findByCpf.mockResolvedValue(null);
    repo.searchByAddress.mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    });

    await useCase.execute({ q: '52998224725', page: 1, limit: 20 }, 'user-uuid');

    expect(repo.findByCpf).toHaveBeenCalledWith('52998224725');
    expect(repo.findByInternalId).not.toHaveBeenCalled();
    expect(repo.searchByAddress).toHaveBeenCalledWith({
      term: '52998224725',
      page: 1,
      limit: 20,
    });
  });

  it('falls back to address search when id not found', async () => {
    repo.findByInternalId.mockResolvedValue(null);
    repo.searchByAddress.mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    });

    await useCase.execute({ q: '99', page: 1, limit: 20 }, 'user-uuid');

    expect(repo.searchByAddress).toHaveBeenCalledWith({
      term: '99',
      page: 1,
      limit: 20,
    });
  });

  it('uses address search for text with letters', async () => {
    repo.searchByAddress.mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    });

    await useCase.execute({ q: '  Flores  ', page: 1, limit: 20 }, 'user-uuid');

    expect(repo.searchByAddress).toHaveBeenCalledWith({
      term: 'Flores',
      page: 1,
      limit: 20,
    });
  });
});

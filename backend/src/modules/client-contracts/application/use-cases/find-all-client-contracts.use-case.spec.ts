import { Test, TestingModule } from '@nestjs/testing';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import { FindAllClientContractsUseCase } from './find-all-client-contracts.use-case';

describe('FindAllClientContractsUseCase', () => {
  let useCase: FindAllClientContractsUseCase;
  let repo: jest.Mocked<Pick<ClientContractRepositoryPort, 'findAll'>>;

  beforeEach(async () => {
    repo = { findAll: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllClientContractsUseCase,
        { provide: CLIENT_CONTRACT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(FindAllClientContractsUseCase);
  });

  it('delegates to repository', async () => {
    const empty = {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    };
    repo.findAll.mockResolvedValue(empty);
    const q = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };
    await expect(useCase.execute(q)).resolves.toBe(empty);
  });
});

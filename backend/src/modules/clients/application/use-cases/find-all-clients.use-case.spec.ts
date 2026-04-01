import { Test, TestingModule } from '@nestjs/testing';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import { FindAllClientsUseCase } from './find-all-clients.use-case';

describe('FindAllClientsUseCase', () => {
  let useCase: FindAllClientsUseCase;
  let repo: jest.Mocked<Pick<ClientRepositoryPort, 'findAll'>>;

  beforeEach(async () => {
    repo = { findAll: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [FindAllClientsUseCase, { provide: CLIENT_REPOSITORY, useValue: repo }],
    }).compile();
    useCase = module.get(FindAllClientsUseCase);
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
    expect(repo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, name: undefined }),
    );
  });
});

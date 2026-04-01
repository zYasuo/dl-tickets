import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import {
  ClientContractEntity,
  ClientContractStatus,
} from '../../domain/entities/client-contract.entity';
import { FindClientContractByIdUseCase } from './find-client-contract-by-id.use-case';

describe('FindClientContractByIdUseCase', () => {
  let useCase: FindClientContractByIdUseCase;
  let repo: jest.Mocked<Pick<ClientContractRepositoryPort, 'findById'>>;

  beforeEach(async () => {
    repo = { findById: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindClientContractByIdUseCase,
        { provide: CLIENT_CONTRACT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(FindClientContractByIdUseCase);
  });

  it('throws when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(randomUUID())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns contract', async () => {
    const e = ClientContractEntity.create({
      id: randomUUID(),
      contractNumber: 'C',
      clientId: randomUUID(),
      useClientAddress: true,
      startDate: new Date(),
      status: ClientContractStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    repo.findById.mockResolvedValue(e);
    await expect(useCase.execute(e.id)).resolves.toBe(e);
  });
});

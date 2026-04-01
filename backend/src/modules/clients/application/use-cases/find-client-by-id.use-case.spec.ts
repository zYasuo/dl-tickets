import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import { ClientEntity } from '../../domain/entities/client.entity';
import { Cpf } from '../../domain/vo/cpf.vo';
import { Address } from 'src/common/vo/address.vo';
import { FindClientByIdUseCase } from './find-client-by-id.use-case';

describe('FindClientByIdUseCase', () => {
  let useCase: FindClientByIdUseCase;
  let repo: jest.Mocked<Pick<ClientRepositoryPort, 'findById'>>;

  beforeEach(async () => {
    repo = { findById: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindClientByIdUseCase,
        { provide: CLIENT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    useCase = module.get(FindClientByIdUseCase);
  });

  it('throws when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute(randomUUID())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns client', async () => {
    const id = randomUUID();
    const entity = ClientEntity.create({
      id,
      name: 'X',
      cpf: Cpf.create('52998224725'),
      address: Address.create({
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
    repo.findById.mockResolvedValue(entity);
    await expect(useCase.execute(id)).resolves.toBe(entity);
  });
});

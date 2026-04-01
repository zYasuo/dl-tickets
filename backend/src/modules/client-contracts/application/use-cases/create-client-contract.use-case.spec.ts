import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { CLIENT_REPOSITORY } from 'src/modules/clients/di.tokens';
import type { ClientRepositoryPort } from 'src/modules/clients/domain/ports/repository/client.repository.port';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import { Cpf } from 'src/modules/clients/domain/vo/cpf.vo';
import { Address } from 'src/common/vo/address.vo';
import { ValidateAddressGeoUseCase } from 'src/modules/locations/application/use-cases/validate-address-geo.use-case';
import { CreateClientContractUseCase } from './create-client-contract.use-case';

describe('CreateClientContractUseCase', () => {
  let useCase: CreateClientContractUseCase;
  let contractRepo: jest.Mocked<Pick<ClientContractRepositoryPort, 'create'>>;
  let clientRepo: jest.Mocked<Pick<ClientRepositoryPort, 'findById'>>;

  const clientId = randomUUID();
  const client = ClientEntity.create({
    id: clientId,
    name: 'C',
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

  beforeEach(async () => {
    contractRepo = { create: jest.fn() };
    clientRepo = { findById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateClientContractUseCase,
        { provide: CLIENT_CONTRACT_REPOSITORY, useValue: contractRepo },
        { provide: CLIENT_REPOSITORY, useValue: clientRepo },
        {
          provide: ValidateAddressGeoUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(CreateClientContractUseCase);
  });

  it('throws when client missing', async () => {
    clientRepo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({
        contractNumber: 'X',
        clientId,
        useClientAddress: true,
        startDate: '2025-01-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates contract', async () => {
    clientRepo.findById.mockResolvedValue(client);
    contractRepo.create.mockImplementation(async (c) => c);

    const row = await useCase.execute({
      contractNumber: 'CTR-9',
      clientId,
      useClientAddress: true,
      startDate: '2025-01-01',
    });

    expect(row.contractNumber).toBe('CTR-9');
    expect(contractRepo.create).toHaveBeenCalled();
  });
});

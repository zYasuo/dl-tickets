import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import {
  ClientContractEntity,
  ClientContractStatus,
} from '../../domain/entities/client-contract.entity';
import { ValidateAddressGeoUseCase } from 'src/modules/locations/application/use-cases/validate-address-geo.use-case';
import { UpdateClientContractUseCase } from './update-client-contract.use-case';

const RJ_STATE = '00000000-0000-4000-8000-000000000011';
const RIO_CITY = '00000000-0000-4000-8000-000000000022';

describe('UpdateClientContractUseCase', () => {
  let useCase: UpdateClientContractUseCase;
  let repo: jest.Mocked<Pick<ClientContractRepositoryPort, 'findById' | 'update'>>;

  const existing = ClientContractEntity.create({
    id: randomUUID(),
    contractNumber: 'C1',
    clientId: randomUUID(),
    useClientAddress: true,
    startDate: new Date('2025-01-01T00:00:00.000Z'),
    status: ClientContractStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    repo = { findById: jest.fn(), update: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateClientContractUseCase,
        { provide: CLIENT_CONTRACT_REPOSITORY, useValue: repo },
        {
          provide: ValidateAddressGeoUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              stateUuid: RJ_STATE,
              cityUuid: RIO_CITY,
              cityName: 'Rio de Janeiro',
              stateCode: 'RJ',
            }),
          },
        },
      ],
    }).compile();
    useCase = module.get(UpdateClientContractUseCase);
  });

  it('throws when contract missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(randomUUID(), { status: ClientContractStatus.CANCELLED }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects useClientAddress false without address on contract', async () => {
    repo.findById.mockResolvedValue(existing);
    await expect(useCase.execute(existing.id, { useClientAddress: false })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('updates status', async () => {
    repo.findById.mockResolvedValue(existing);
    repo.update.mockImplementation(async (c) => c);

    const out = await useCase.execute(existing.id, {
      status: ClientContractStatus.EXPIRED,
    });

    expect(out.status).toBe(ClientContractStatus.EXPIRED);
    expect(repo.update).toHaveBeenCalled();
  });

  it('sets own address when switching off client address', async () => {
    repo.findById.mockResolvedValue(existing);
    repo.update.mockImplementation(async (c) => c);

    const out = await useCase.execute(existing.id, {
      useClientAddress: false,
      address: {
        street: 'B',
        number: '2',
        neighborhood: 'N',
        zipCode: '20000000',
        stateUuid: RJ_STATE,
        cityUuid: RIO_CITY,
      },
    });

    expect(out.useClientAddress).toBe(false);
    expect(out.address?.street).toBe('B');
    expect(out.address?.zipCode).toBe('20000000');
  });
});

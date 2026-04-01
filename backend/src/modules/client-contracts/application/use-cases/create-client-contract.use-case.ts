import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainError } from 'src/common/errors/domain.error';
import { Address } from 'src/common/vo/address.vo';
import { CLIENT_REPOSITORY } from 'src/modules/clients/di.tokens';
import type { ClientRepositoryPort } from 'src/modules/clients/domain/ports/repository/client.repository.port';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import {
  ClientContractEntity,
  ClientContractStatus,
} from '../../domain/entities/client-contract.entity';
import type { TCreateClientContract } from '../dto/create-client-contract.dto';

function atStartOfUtcDay(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

@Injectable()
export class CreateClientContractUseCase {
  constructor(
    @Inject(CLIENT_CONTRACT_REPOSITORY)
    private readonly contractRepository: ClientContractRepositoryPort,
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: ClientRepositoryPort,
  ) {}

  async execute(input: TCreateClientContract): Promise<ClientContractEntity> {
    const client = await this.clientRepository.findById(input.clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const startDate = atStartOfUtcDay(input.startDate);
    const endDate = input.endDate ? atStartOfUtcDay(input.endDate) : undefined;

    const address =
      !input.useClientAddress && input.address
        ? Address.create(input.address)
        : undefined;

    const now = new Date();
    let entity: ClientContractEntity;
    try {
      entity = ClientContractEntity.create({
        id: randomUUID(),
        contractNumber: input.contractNumber,
        clientId: input.clientId,
        useClientAddress: input.useClientAddress,
        address,
        startDate,
        endDate,
        status: ClientContractStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      if (e instanceof DomainError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }

    try {
      return await this.contractRepository.create(entity);
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2003'
      ) {
        throw new NotFoundException('Client not found');
      }
      throw e;
    }
  }
}

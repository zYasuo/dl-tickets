import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import type { ClientContractListCriteria } from '../../domain/criteria/client-contract-list.criteria';
import {
  ClientContractEntity,
  ClientContractStatus,
} from '../../domain/entities/client-contract.entity';
import type { TFindAllClientContracts } from '../dto/find-all-client-contracts.dto';

@Injectable()
export class FindAllClientContractsUseCase {
  constructor(
    @Inject(CLIENT_CONTRACT_REPOSITORY)
    private readonly contractRepository: ClientContractRepositoryPort,
  ) {}

  async execute(
    query: TFindAllClientContracts,
  ): Promise<PaginatedResult<ClientContractEntity>> {
    const criteria: ClientContractListCriteria = {
      page: query.page,
      limit: query.limit,
      cursor: query.cursor,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      clientId: query.clientId,
      status: query.status as ClientContractStatus | undefined,
    };
    return this.contractRepository.findAll(criteria);
  }
}

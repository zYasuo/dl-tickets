import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import type { ClientContractListCriteria } from '../../criteria/client-contract-list.criteria';
import { ClientContractEntity } from '../../entities/client-contract.entity';

export abstract class ClientContractRepositoryPort {
  abstract create(contract: ClientContractEntity): Promise<ClientContractEntity>;
  abstract findAll(
    criteria: ClientContractListCriteria,
  ): Promise<PaginatedResult<ClientContractEntity>>;
  abstract findById(uuid: string): Promise<ClientContractEntity | null>;
  abstract update(contract: ClientContractEntity): Promise<ClientContractEntity>;
}

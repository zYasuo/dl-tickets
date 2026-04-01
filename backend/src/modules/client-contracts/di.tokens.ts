import type { InjectionToken } from '@nestjs/common';
import type { ClientContractRepositoryPort } from 'src/modules/client-contracts/domain/ports/repository/client-contract.repository.port';

export const CLIENT_CONTRACT_REPOSITORY: InjectionToken<ClientContractRepositoryPort> =
  Symbol('CLIENT_CONTRACT_REPOSITORY');

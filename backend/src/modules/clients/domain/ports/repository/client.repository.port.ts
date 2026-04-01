import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import type { ClientListCriteria } from '../../criteria/client-list.criteria';
import { ClientEntity } from '../../entities/client.entity';

export abstract class ClientRepositoryPort {
  abstract create(client: ClientEntity): Promise<ClientEntity>;
  abstract findAll(criteria: ClientListCriteria): Promise<PaginatedResult<ClientEntity>>;
  abstract findById(uuid: string): Promise<ClientEntity | null>;
  abstract findByCpf(digits: string): Promise<ClientEntity | null>;
  abstract findByCnpj(digits: string): Promise<ClientEntity | null>;
}

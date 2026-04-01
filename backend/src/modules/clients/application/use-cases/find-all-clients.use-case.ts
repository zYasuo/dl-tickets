import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import type { ClientListCriteria } from '../../domain/criteria/client-list.criteria';
import { ClientEntity } from '../../domain/entities/client.entity';
import type { TFindAllClients } from '../dto/find-all-clients.dto';

@Injectable()
export class FindAllClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: ClientRepositoryPort,
  ) {}

  async execute(query: TFindAllClients): Promise<PaginatedResult<ClientEntity>> {
    const criteria: ClientListCriteria = {
      page: query.page,
      limit: query.limit,
      cursor: query.cursor,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      name: query.name,
    };
    return this.clientRepository.findAll(criteria);
  }
}

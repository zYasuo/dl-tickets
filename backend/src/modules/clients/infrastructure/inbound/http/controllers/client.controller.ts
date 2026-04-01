import { Body, Controller, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  CurrentUser,
  type AuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';
import { CreateClientUseCase } from 'src/modules/clients/application/use-cases/create-client.use-case';
import { FindAllClientsUseCase } from 'src/modules/clients/application/use-cases/find-all-clients.use-case';
import { FindClientByIdUseCase } from 'src/modules/clients/application/use-cases/find-client-by-id.use-case';
import { SearchClientsUseCase } from 'src/modules/clients/application/use-cases/search-clients.use-case';
import {
  SCreateClient,
  type CreateClientBody,
} from 'src/modules/clients/application/dto/create-client.dto';
import {
  SFindAllClients,
  type FindAllClientsQuery,
} from 'src/modules/clients/application/dto/find-all-clients.dto';
import {
  SSearchClients,
  type SearchClientsQuery,
} from 'src/modules/clients/application/dto/search-clients.dto';
import { ApiClients, ClientDoc } from '../docs/client-doc.decorator';
import {
  toClientPublicHttp,
  toClientSearchRowHttp,
  type ClientPublicHttp,
  type ClientSearchRowHttp,
} from '../mappers/client-http.mapper';

@Controller('clients')
@ApiClients()
export class ClientController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly findAllClientsUseCase: FindAllClientsUseCase,
    private readonly findClientByIdUseCase: FindClientByIdUseCase,
    private readonly searchClientsUseCase: SearchClientsUseCase,
  ) {}

  @RateLimitEndpoint('clients-search')
  @ClientDoc.Search()
  async search(
    @Query(new ZodValidationPipe(SSearchClients)) query: SearchClientsQuery,
    @CurrentUser() user: AuthUser,
  ): Promise<PaginatedResult<ClientSearchRowHttp>> {
    const result = await this.searchClientsUseCase.execute(query, user.sub);
    return {
      data: result.data.map(toClientSearchRowHttp),
      meta: result.meta,
    };
  }

  @RateLimitEndpoint('clients-list')
  @ClientDoc.List()
  async findAll(
    @Query(new ZodValidationPipe(SFindAllClients)) query: FindAllClientsQuery,
    @CurrentUser() _user: AuthUser,
  ): Promise<PaginatedResult<ClientPublicHttp>> {
    const result = await this.findAllClientsUseCase.execute(query);
    return {
      data: result.data.map(toClientPublicHttp),
      meta: result.meta,
    };
  }

  @RateLimitEndpoint('clients-get-by-id')
  @ClientDoc.FindById()
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<ClientPublicHttp> {
    const client = await this.findClientByIdUseCase.execute(id);
    return toClientPublicHttp(client);
  }

  @RateLimitEndpoint('clients-create')
  @ClientDoc.Create()
  async create(
    @Body(new ZodValidationPipe(SCreateClient)) dto: CreateClientBody,
    @CurrentUser() _user: AuthUser,
  ): Promise<ClientPublicHttp> {
    const client = await this.createClientUseCase.execute(dto);
    return toClientPublicHttp(client);
  }
}

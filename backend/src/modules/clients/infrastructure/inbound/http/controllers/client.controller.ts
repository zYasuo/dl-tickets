import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  CurrentUser,
  type TAuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';
import { CreateClientUseCase } from 'src/modules/clients/application/use-cases/create-client.use-case';
import { FindAllClientsUseCase } from 'src/modules/clients/application/use-cases/find-all-clients.use-case';
import { FindClientByIdUseCase } from 'src/modules/clients/application/use-cases/find-client-by-id.use-case';
import {
  SCreateClient,
  type TCreateClient,
} from 'src/modules/clients/application/dto/create-client.dto';
import {
  SFindAllClients,
  type TFindAllClients,
} from 'src/modules/clients/application/dto/find-all-clients.dto';
import { ApiClients, ClientDoc } from '../docs/client-doc.decorator';
import { toClientPublicHttp, type ClientPublicHttp } from '../mappers/client-http.mapper';

/** All routes require a valid JWT (global JwtAuthGuard on the app). */
@Controller('clients')
@ApiClients()
export class ClientController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly findAllClientsUseCase: FindAllClientsUseCase,
    private readonly findClientByIdUseCase: FindClientByIdUseCase,
  ) {}

  @RateLimitEndpoint('clients-list')
  @ClientDoc.List()
  async findAll(
    @Query(new ZodValidationPipe(SFindAllClients)) query: TFindAllClients,
    @CurrentUser() _user: TAuthUser,
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
    @CurrentUser() _user: TAuthUser,
  ): Promise<ClientPublicHttp> {
    const client = await this.findClientByIdUseCase.execute(id);
    return toClientPublicHttp(client);
  }

  @RateLimitEndpoint('clients-create')
  @ClientDoc.Create()
  async create(
    @Body(new ZodValidationPipe(SCreateClient)) dto: TCreateClient,
    @CurrentUser() _user: TAuthUser,
  ): Promise<ClientPublicHttp> {
    const client = await this.createClientUseCase.execute(dto);
    return toClientPublicHttp(client);
  }
}

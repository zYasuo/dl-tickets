import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { PaginatedResult } from 'src/common/pagination/pagination.types';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  CurrentUser,
  type TAuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';
import { CreateClientContractUseCase } from 'src/modules/client-contracts/application/use-cases/create-client-contract.use-case';
import { FindAllClientContractsUseCase } from 'src/modules/client-contracts/application/use-cases/find-all-client-contracts.use-case';
import { FindClientContractByIdUseCase } from 'src/modules/client-contracts/application/use-cases/find-client-contract-by-id.use-case';
import { UpdateClientContractUseCase } from 'src/modules/client-contracts/application/use-cases/update-client-contract.use-case';
import {
  SCreateClientContract,
  type TCreateClientContract,
} from 'src/modules/client-contracts/application/dto/create-client-contract.dto';
import {
  SFindAllClientContracts,
  type TFindAllClientContracts,
} from 'src/modules/client-contracts/application/dto/find-all-client-contracts.dto';
import {
  SUpdateClientContract,
  type TUpdateClientContract,
} from 'src/modules/client-contracts/application/dto/update-client-contract.dto';
import {
  ApiClientContracts,
  ClientContractDoc,
} from '../docs/client-contract-doc.decorator';
import {
  toClientContractPublicHttp,
  type ClientContractPublicHttp,
} from '../mappers/client-contract-http.mapper';

/** All routes require a valid JWT (global JwtAuthGuard on the app). */
@Controller('client-contracts')
@ApiClientContracts()
export class ClientContractController {
  constructor(
    private readonly createClientContractUseCase: CreateClientContractUseCase,
    private readonly findAllClientContractsUseCase: FindAllClientContractsUseCase,
    private readonly findClientContractByIdUseCase: FindClientContractByIdUseCase,
    private readonly updateClientContractUseCase: UpdateClientContractUseCase,
  ) {}

  @RateLimitEndpoint('client-contracts-list')
  @ClientContractDoc.List()
  async findAll(
    @Query(new ZodValidationPipe(SFindAllClientContracts)) query: TFindAllClientContracts,
    @CurrentUser() _user: TAuthUser,
  ): Promise<PaginatedResult<ClientContractPublicHttp>> {
    const result = await this.findAllClientContractsUseCase.execute(query);
    return {
      data: result.data.map(toClientContractPublicHttp),
      meta: result.meta,
    };
  }

  @RateLimitEndpoint('client-contracts-get-by-id')
  @ClientContractDoc.FindById()
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: TAuthUser,
  ): Promise<ClientContractPublicHttp> {
    const row = await this.findClientContractByIdUseCase.execute(id);
    return toClientContractPublicHttp(row);
  }

  @RateLimitEndpoint('client-contracts-create')
  @ClientContractDoc.Create()
  async create(
    @Body(new ZodValidationPipe(SCreateClientContract)) dto: TCreateClientContract,
    @CurrentUser() _user: TAuthUser,
  ): Promise<ClientContractPublicHttp> {
    const row = await this.createClientContractUseCase.execute(dto);
    return toClientContractPublicHttp(row);
  }

  @RateLimitEndpoint('client-contracts-update')
  @ClientContractDoc.Update()
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(SUpdateClientContract)) dto: TUpdateClientContract,
    @CurrentUser() _user: TAuthUser,
  ): Promise<ClientContractPublicHttp> {
    const row = await this.updateClientContractUseCase.execute(id, dto);
    return toClientContractPublicHttp(row);
  }
}

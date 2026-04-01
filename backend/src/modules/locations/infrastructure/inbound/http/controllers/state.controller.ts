import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  CurrentUser,
  type AuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';
import {
  SCreateState,
  SListStatesQuery,
  SUpdateState,
  type CreateStateBody,
  type ListStatesQuery,
  type UpdateStateBody,
} from 'src/modules/locations/application/dto/state.dto';
import { CreateStateUseCase } from 'src/modules/locations/application/use-cases/create-state.use-case';
import { DeleteStateUseCase } from 'src/modules/locations/application/use-cases/delete-state.use-case';
import { FindStateByIdUseCase } from 'src/modules/locations/application/use-cases/find-state-by-id.use-case';
import { ListStatesByCountryUseCase } from 'src/modules/locations/application/use-cases/list-states-by-country.use-case';
import { UpdateStateUseCase } from 'src/modules/locations/application/use-cases/update-state.use-case';
import { ApiLocationsStates, StateDoc } from '../docs/location-docs.decorator';
import { toStatePublicHttp, type StatePublicHttp } from '../mappers/location-http.mapper';

@Controller('states')
@ApiLocationsStates()
export class StateController {
  constructor(
    private readonly listStates: ListStatesByCountryUseCase,
    private readonly findStateById: FindStateByIdUseCase,
    private readonly createState: CreateStateUseCase,
    private readonly updateState: UpdateStateUseCase,
    private readonly deleteState: DeleteStateUseCase,
  ) {}

  @RateLimitEndpoint('locations-states-list')
  @StateDoc.List()
  @Get()
  async list(
    @Query(new ZodValidationPipe(SListStatesQuery)) query: ListStatesQuery,
    @CurrentUser() _user: AuthUser,
  ): Promise<StatePublicHttp[]> {
    const rows = await this.listStates.execute(query);
    return rows.map(toStatePublicHttp);
  }

  @RateLimitEndpoint('locations-states-get')
  @StateDoc.FindById()
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<StatePublicHttp> {
    const row = await this.findStateById.execute(id);
    return toStatePublicHttp(row);
  }

  @RateLimitEndpoint('locations-states-create')
  @StateDoc.Create()
  @Post()
  async create(
    @Body(new ZodValidationPipe(SCreateState)) body: CreateStateBody,
    @CurrentUser() _user: AuthUser,
  ): Promise<StatePublicHttp> {
    const row = await this.createState.execute(body);
    return toStatePublicHttp(row);
  }

  @RateLimitEndpoint('locations-states-update')
  @StateDoc.Update()
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(SUpdateState)) body: UpdateStateBody,
    @CurrentUser() _user: AuthUser,
  ): Promise<StatePublicHttp> {
    const row = await this.updateState.execute(id, body);
    return toStatePublicHttp(row);
  }

  @RateLimitEndpoint('locations-states-delete')
  @StateDoc.Delete()
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<void> {
    await this.deleteState.execute(id);
  }
}

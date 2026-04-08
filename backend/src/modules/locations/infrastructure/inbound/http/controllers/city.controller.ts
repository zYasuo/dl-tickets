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
import {
  CurrentUser,
  type AuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';
import {
  CreateCityBodyDto,
  ListCitiesQueryDto,
  UpdateCityBodyDto,
} from 'src/modules/locations/application/dto/city.dto';
import { CreateCityUseCase } from 'src/modules/locations/application/use-cases/create-city.use-case';
import { DeleteCityUseCase } from 'src/modules/locations/application/use-cases/delete-city.use-case';
import { FindCityByIdUseCase } from 'src/modules/locations/application/use-cases/find-city-by-id.use-case';
import { ListCitiesByStateUseCase } from 'src/modules/locations/application/use-cases/list-cities-by-state.use-case';
import { UpdateCityUseCase } from 'src/modules/locations/application/use-cases/update-city.use-case';
import { ApiLocationsCities, CityDoc } from '../docs/location-docs.decorator';
import { toCityPublicHttp, type CityPublicHttp } from '../mappers/location-http.mapper';

@Controller('cities')
@ApiLocationsCities()
export class CityController {
  constructor(
    private readonly listCities: ListCitiesByStateUseCase,
    private readonly findCityById: FindCityByIdUseCase,
    private readonly createCity: CreateCityUseCase,
    private readonly updateCity: UpdateCityUseCase,
    private readonly deleteCity: DeleteCityUseCase,
  ) {}

  @RateLimitEndpoint('locations-cities-list')
  @CityDoc.List()
  @Get()
  async list(
    @Query() query: ListCitiesQueryDto,
    @CurrentUser() _user: AuthUser,
  ): Promise<CityPublicHttp[]> {
    const rows = await this.listCities.execute(query);
    return rows.map(toCityPublicHttp);
  }

  @RateLimitEndpoint('locations-cities-get')
  @CityDoc.FindById()
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<CityPublicHttp> {
    const row = await this.findCityById.execute(id);
    return toCityPublicHttp(row);
  }

  @RateLimitEndpoint('locations-cities-create')
  @CityDoc.Create()
  @Post()
  async create(
    @Body() body: CreateCityBodyDto,
    @CurrentUser() _user: AuthUser,
  ): Promise<CityPublicHttp> {
    const row = await this.createCity.execute(body);
    return toCityPublicHttp(row);
  }

  @RateLimitEndpoint('locations-cities-update')
  @CityDoc.Update()
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateCityBodyDto,
    @CurrentUser() _user: AuthUser,
  ): Promise<CityPublicHttp> {
    const row = await this.updateCity.execute(id, body);
    return toCityPublicHttp(row);
  }

  @RateLimitEndpoint('locations-cities-delete')
  @CityDoc.Delete()
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<void> {
    await this.deleteCity.execute(id);
  }
}

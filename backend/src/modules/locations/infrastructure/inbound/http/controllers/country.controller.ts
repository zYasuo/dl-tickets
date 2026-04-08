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
} from '@nestjs/common';
import { RateLimitEndpoint } from 'src/common/rate-limit/rate-limit-endpoint.decorator';
import {
  CurrentUser,
  type AuthUser,
} from 'src/modules/auth/infrastructure/inbound/http/decorators/current-user.decorator';
import { CreateCountryUseCase } from 'src/modules/locations/application/use-cases/create-country.use-case';
import { DeleteCountryUseCase } from 'src/modules/locations/application/use-cases/delete-country.use-case';
import { FindCountryByIdUseCase } from 'src/modules/locations/application/use-cases/find-country-by-id.use-case';
import { ListCountriesUseCase } from 'src/modules/locations/application/use-cases/list-countries.use-case';
import { UpdateCountryUseCase } from 'src/modules/locations/application/use-cases/update-country.use-case';
import {
  CreateCountryBodyDto,
  UpdateCountryBodyDto,
} from 'src/modules/locations/application/dto/country.dto';
import { ApiLocationsCountries, CountryDoc } from '../docs/location-docs.decorator';
import { toCountryPublicHttp, type CountryPublicHttp } from '../mappers/location-http.mapper';

@Controller('countries')
@ApiLocationsCountries()
export class CountryController {
  constructor(
    private readonly listCountries: ListCountriesUseCase,
    private readonly findCountryById: FindCountryByIdUseCase,
    private readonly createCountry: CreateCountryUseCase,
    private readonly updateCountry: UpdateCountryUseCase,
    private readonly deleteCountry: DeleteCountryUseCase,
  ) {}

  @RateLimitEndpoint('locations-countries-list')
  @CountryDoc.List()
  @Get()
  async list(@CurrentUser() _user: AuthUser): Promise<CountryPublicHttp[]> {
    const rows = await this.listCountries.execute();
    return rows.map(toCountryPublicHttp);
  }

  @RateLimitEndpoint('locations-countries-get')
  @CountryDoc.FindById()
  @Get(':id')
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<CountryPublicHttp> {
    const row = await this.findCountryById.execute(id);
    return toCountryPublicHttp(row);
  }

  @RateLimitEndpoint('locations-countries-create')
  @CountryDoc.Create()
  @Post()
  async create(
    @Body() body: CreateCountryBodyDto,
    @CurrentUser() _user: AuthUser,
  ): Promise<CountryPublicHttp> {
    const row = await this.createCountry.execute(body);
    return toCountryPublicHttp(row);
  }

  @RateLimitEndpoint('locations-countries-update')
  @CountryDoc.Update()
  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateCountryBodyDto,
    @CurrentUser() _user: AuthUser,
  ): Promise<CountryPublicHttp> {
    const row = await this.updateCountry.execute(id, body);
    return toCountryPublicHttp(row);
  }

  @RateLimitEndpoint('locations-countries-delete')
  @CountryDoc.Delete()
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() _user: AuthUser,
  ): Promise<void> {
    await this.deleteCountry.execute(id);
  }
}

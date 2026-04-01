import { Module } from '@nestjs/common';
import { CreateCityUseCase } from './application/use-cases/create-city.use-case';
import { CreateCountryUseCase } from './application/use-cases/create-country.use-case';
import { CreateStateUseCase } from './application/use-cases/create-state.use-case';
import { DeleteCityUseCase } from './application/use-cases/delete-city.use-case';
import { DeleteCountryUseCase } from './application/use-cases/delete-country.use-case';
import { DeleteStateUseCase } from './application/use-cases/delete-state.use-case';
import { FindCityByIdUseCase } from './application/use-cases/find-city-by-id.use-case';
import { FindCountryByIdUseCase } from './application/use-cases/find-country-by-id.use-case';
import { FindStateByIdUseCase } from './application/use-cases/find-state-by-id.use-case';
import { ListCitiesByStateUseCase } from './application/use-cases/list-cities-by-state.use-case';
import { ListCountriesUseCase } from './application/use-cases/list-countries.use-case';
import { ListStatesByCountryUseCase } from './application/use-cases/list-states-by-country.use-case';
import { UpdateCityUseCase } from './application/use-cases/update-city.use-case';
import { UpdateCountryUseCase } from './application/use-cases/update-country.use-case';
import { UpdateStateUseCase } from './application/use-cases/update-state.use-case';
import { ValidateAddressGeoUseCase } from './application/use-cases/validate-address-geo.use-case';
import { CITY_REPOSITORY, COUNTRY_REPOSITORY, STATE_REPOSITORY } from './di.tokens';
import { CityController } from './infrastructure/inbound/http/controllers/city.controller';
import { CountryController } from './infrastructure/inbound/http/controllers/country.controller';
import { StateController } from './infrastructure/inbound/http/controllers/state.controller';
import { CityRepository } from './infrastructure/outbound/persistence/repositories/city.repository';
import { CountryRepository } from './infrastructure/outbound/persistence/repositories/country.repository';
import { StateRepository } from './infrastructure/outbound/persistence/repositories/state.repository';

@Module({
  controllers: [CountryController, StateController, CityController],
  providers: [
    ValidateAddressGeoUseCase,
    ListCountriesUseCase,
    FindCountryByIdUseCase,
    CreateCountryUseCase,
    UpdateCountryUseCase,
    DeleteCountryUseCase,
    ListStatesByCountryUseCase,
    FindStateByIdUseCase,
    CreateStateUseCase,
    UpdateStateUseCase,
    DeleteStateUseCase,
    ListCitiesByStateUseCase,
    FindCityByIdUseCase,
    CreateCityUseCase,
    UpdateCityUseCase,
    DeleteCityUseCase,
    { provide: COUNTRY_REPOSITORY, useClass: CountryRepository },
    { provide: STATE_REPOSITORY, useClass: StateRepository },
    { provide: CITY_REPOSITORY, useClass: CityRepository },
  ],
  exports: [ValidateAddressGeoUseCase],
})
export class LocationsModule {}

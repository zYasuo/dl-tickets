import type { InjectionToken } from '@nestjs/common';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';

export const COUNTRY_REPOSITORY: InjectionToken<CountryRepositoryPort> =
  Symbol('COUNTRY_REPOSITORY');
export const STATE_REPOSITORY: InjectionToken<StateRepositoryPort> = Symbol('STATE_REPOSITORY');
export const CITY_REPOSITORY: InjectionToken<CityRepositoryPort> = Symbol('CITY_REPOSITORY');

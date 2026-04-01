import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';

export type CountryPublicHttp = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type StatePublicHttp = {
  id: string;
  name: string;
  code: string | null;
  countryId: string;
  createdAt: string;
  updatedAt: string;
};

export type CityPublicHttp = {
  id: string;
  name: string;
  stateId: string;
  createdAt: string;
  updatedAt: string;
};

export function toCountryPublicHttp(e: CountryEntity): CountryPublicHttp {
  return {
    id: e.id,
    name: e.name,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export function toStatePublicHttp(e: StateEntity): StatePublicHttp {
  return {
    id: e.id,
    name: e.name,
    code: e.code,
    countryId: e.countryId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export function toCityPublicHttp(e: CityEntity): CityPublicHttp {
  return {
    id: e.id,
    name: e.name,
    stateId: e.stateId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

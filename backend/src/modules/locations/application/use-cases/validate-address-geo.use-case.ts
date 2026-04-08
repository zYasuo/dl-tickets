import { Inject, Injectable } from '@nestjs/common';
import { ApplicationException } from 'src/common/errors/application';
import type { AddressGeoResolved } from 'src/common/vo/address.vo';
import { CITY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import { LOCATION_API_ERROR_CODES } from '../errors';

@Injectable()
export class ValidateAddressGeoUseCase {
  constructor(@Inject(CITY_REPOSITORY) private readonly cityRepository: CityRepositoryPort) {}

  async execute(stateUuid: string, cityUuid: string): Promise<AddressGeoResolved> {
    const city = await this.cityRepository.findByUuidWithState(cityUuid);
    if (!city) {
      throw new ApplicationException(LOCATION_API_ERROR_CODES.GEO_CITY_NOT_FOUND, 'City not found');
    }
    if (city.state.uuid !== stateUuid) {
      throw new ApplicationException(
        LOCATION_API_ERROR_CODES.GEO_CITY_STATE_MISMATCH,
        'City does not belong to the given state',
      );
    }
    const code = city.state.code?.trim().toUpperCase() ?? '';
    if (code.length !== 2 || !/^[A-Z]{2}$/u.test(code)) {
      throw new ApplicationException(
        LOCATION_API_ERROR_CODES.GEO_STATE_CODE_REQUIRED,
        'State must have a 2-letter code for client addresses',
      );
    }
    return {
      stateUuid,
      cityUuid,
      cityName: city.name,
      stateCode: code,
    };
  }
}

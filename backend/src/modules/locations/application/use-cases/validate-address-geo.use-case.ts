import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AddressGeoResolved } from 'src/common/vo/address.vo';
import { CITY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';

@Injectable()
export class ValidateAddressGeoUseCase {
  constructor(@Inject(CITY_REPOSITORY) private readonly cityRepository: CityRepositoryPort) {}

  async execute(stateUuid: string, cityUuid: string): Promise<AddressGeoResolved> {
    const city = await this.cityRepository.findByUuidWithState(cityUuid);
    if (!city) {
      throw new BadRequestException('City not found');
    }
    if (city.state.uuid !== stateUuid) {
      throw new BadRequestException('City does not belong to the given state');
    }
    const code = city.state.code?.trim().toUpperCase() ?? '';
    if (code.length !== 2 || !/^[A-Z]{2}$/u.test(code)) {
      throw new BadRequestException('State must have a 2-letter code for client addresses');
    }
    return {
      stateUuid,
      cityUuid,
      cityName: city.name,
      stateCode: code,
    };
  }
}

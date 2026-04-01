import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CITY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';

@Injectable()
export class FindCityByIdUseCase {
  constructor(@Inject(CITY_REPOSITORY) private readonly cities: CityRepositoryPort) {}

  async execute(uuid: string): Promise<CityEntity> {
    const row = await this.cities.findByUuid(uuid);
    if (!row) {
      throw new NotFoundException('City not found');
    }
    return row;
  }
}

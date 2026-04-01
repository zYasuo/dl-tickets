import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COUNTRY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';

@Injectable()
export class FindCountryByIdUseCase {
  constructor(@Inject(COUNTRY_REPOSITORY) private readonly countries: CountryRepositoryPort) {}

  async execute(uuid: string): Promise<CountryEntity> {
    const row = await this.countries.findByUuid(uuid);
    if (!row) {
      throw new NotFoundException('Country not found');
    }
    return row;
  }
}

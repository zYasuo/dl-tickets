import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { COUNTRY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import type { CreateCountryBody } from '../dto/country.dto';

@Injectable()
export class CreateCountryUseCase {
  constructor(@Inject(COUNTRY_REPOSITORY) private readonly countries: CountryRepositoryPort) {}

  async execute(body: CreateCountryBody): Promise<CountryEntity> {
    const now = new Date();
    return this.countries.create(
      CountryEntity.create({
        id: randomUUID(),
        name: body.name.trim(),
        createdAt: now,
        updatedAt: now,
      }),
    );
  }
}

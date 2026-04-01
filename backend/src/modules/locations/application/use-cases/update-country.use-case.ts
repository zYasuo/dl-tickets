import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COUNTRY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import { CountryEntity } from 'src/modules/locations/domain/entities/country.entity';
import type { UpdateCountryBody } from '../dto/country.dto';

@Injectable()
export class UpdateCountryUseCase {
  constructor(@Inject(COUNTRY_REPOSITORY) private readonly countries: CountryRepositoryPort) {}

  async execute(uuid: string, body: UpdateCountryBody): Promise<CountryEntity> {
    const existing = await this.countries.findByUuid(uuid);
    if (!existing) {
      throw new NotFoundException('Country not found');
    }
    const now = new Date();
    return this.countries.update(
      CountryEntity.create({
        id: existing.id,
        name: body.name.trim(),
        createdAt: existing.createdAt,
        updatedAt: now,
      }),
    );
  }
}

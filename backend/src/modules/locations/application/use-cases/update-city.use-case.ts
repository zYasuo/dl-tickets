import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CITY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';
import { CityEntity } from 'src/modules/locations/domain/entities/city.entity';
import type { UpdateCityBody } from '../dto/city.dto';

@Injectable()
export class UpdateCityUseCase {
  constructor(@Inject(CITY_REPOSITORY) private readonly cities: CityRepositoryPort) {}

  async execute(uuid: string, body: UpdateCityBody): Promise<CityEntity> {
    const existing = await this.cities.findByUuid(uuid);
    if (!existing) {
      throw new NotFoundException('City not found');
    }
    const now = new Date();
    return this.cities.update(
      CityEntity.create({
        id: existing.id,
        name: body.name.trim(),
        stateId: existing.stateId,
        createdAt: existing.createdAt,
        updatedAt: now,
      }),
    );
  }
}

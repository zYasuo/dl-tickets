import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CITY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CityRepositoryPort } from 'src/modules/locations/domain/ports/repository/city.repository.port';

@Injectable()
export class DeleteCityUseCase {
  constructor(@Inject(CITY_REPOSITORY) private readonly cities: CityRepositoryPort) {}

  async execute(uuid: string): Promise<void> {
    const existing = await this.cities.findByUuid(uuid);
    if (!existing) {
      throw new NotFoundException('City not found');
    }
    try {
      await this.cities.deleteByUuid(uuid);
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2003') {
        throw new ConflictException('City is referenced by clients or contracts');
      }
      throw e;
    }
  }
}

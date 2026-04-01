import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COUNTRY_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';

@Injectable()
export class DeleteCountryUseCase {
  constructor(@Inject(COUNTRY_REPOSITORY) private readonly countries: CountryRepositoryPort) {}

  async execute(uuid: string): Promise<void> {
    const existing = await this.countries.findByUuid(uuid);
    if (!existing) {
      throw new NotFoundException('Country not found');
    }
    try {
      await this.countries.deleteByUuid(uuid);
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2003') {
        throw new ConflictException('Country is referenced by states or other records');
      }
      throw e;
    }
  }
}

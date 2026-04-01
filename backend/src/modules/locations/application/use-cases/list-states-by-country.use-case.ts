import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { COUNTRY_REPOSITORY, STATE_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import type { ListStatesQuery } from '../dto/state.dto';

@Injectable()
export class ListStatesByCountryUseCase {
  constructor(
    @Inject(COUNTRY_REPOSITORY) private readonly countries: CountryRepositoryPort,
    @Inject(STATE_REPOSITORY) private readonly states: StateRepositoryPort,
  ) {}

  async execute(query: ListStatesQuery): Promise<StateEntity[]> {
    const country = await this.countries.findByUuid(query.countryUuid);
    if (!country) {
      throw new BadRequestException('Country not found');
    }
    return this.states.findByCountryUuid(query.countryUuid);
  }
}

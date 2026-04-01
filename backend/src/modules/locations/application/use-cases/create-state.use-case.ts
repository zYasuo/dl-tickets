import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { COUNTRY_REPOSITORY, STATE_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { CountryRepositoryPort } from 'src/modules/locations/domain/ports/repository/country.repository.port';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import type { CreateStateBody } from '../dto/state.dto';

@Injectable()
export class CreateStateUseCase {
  constructor(
    @Inject(COUNTRY_REPOSITORY) private readonly countries: CountryRepositoryPort,
    @Inject(STATE_REPOSITORY) private readonly states: StateRepositoryPort,
  ) {}

  async execute(body: CreateStateBody): Promise<StateEntity> {
    const country = await this.countries.findByUuid(body.countryUuid);
    if (!country) {
      throw new BadRequestException('Country not found');
    }
    const now = new Date();
    const code = body.code?.trim() ? body.code.trim().toUpperCase() : null;
    return this.states.create(
      StateEntity.create({
        id: randomUUID(),
        name: body.name.trim(),
        code,
        countryId: body.countryUuid,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }
}

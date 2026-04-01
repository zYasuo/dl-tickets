import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { STATE_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';

@Injectable()
export class FindStateByIdUseCase {
  constructor(@Inject(STATE_REPOSITORY) private readonly states: StateRepositoryPort) {}

  async execute(uuid: string): Promise<StateEntity> {
    const row = await this.states.findByUuid(uuid);
    if (!row) {
      throw new NotFoundException('State not found');
    }
    return row;
  }
}

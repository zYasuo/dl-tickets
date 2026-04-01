import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { STATE_REPOSITORY } from 'src/modules/locations/di.tokens';
import type { StateRepositoryPort } from 'src/modules/locations/domain/ports/repository/state.repository.port';
import { StateEntity } from 'src/modules/locations/domain/entities/state.entity';
import type { UpdateStateBody } from '../dto/state.dto';

@Injectable()
export class UpdateStateUseCase {
  constructor(@Inject(STATE_REPOSITORY) private readonly states: StateRepositoryPort) {}

  async execute(uuid: string, body: UpdateStateBody): Promise<StateEntity> {
    const existing = await this.states.findByUuid(uuid);
    if (!existing) {
      throw new NotFoundException('State not found');
    }
    const now = new Date();
    let code = existing.code;
    if (body.code !== undefined) {
      code = body.code === null ? null : body.code.trim().toUpperCase();
    }
    return this.states.update(
      StateEntity.create({
        id: existing.id,
        name: body.name.trim(),
        code,
        countryId: existing.countryId,
        createdAt: existing.createdAt,
        updatedAt: now,
      }),
    );
  }
}

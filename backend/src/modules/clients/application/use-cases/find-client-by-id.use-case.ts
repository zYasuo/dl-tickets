import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import { ClientEntity } from '../../domain/entities/client.entity';

@Injectable()
export class FindClientByIdUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: ClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<ClientEntity> {
    const client = await this.clientRepository.findById(id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }
}

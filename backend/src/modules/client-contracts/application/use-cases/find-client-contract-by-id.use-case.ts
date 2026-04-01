import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLIENT_CONTRACT_REPOSITORY } from '../../di.tokens';
import type { ClientContractRepositoryPort } from '../../domain/ports/repository/client-contract.repository.port';
import { ClientContractEntity } from '../../domain/entities/client-contract.entity';

@Injectable()
export class FindClientContractByIdUseCase {
  constructor(
    @Inject(CLIENT_CONTRACT_REPOSITORY)
    private readonly contractRepository: ClientContractRepositoryPort,
  ) {}

  async execute(id: string): Promise<ClientContractEntity> {
    const row = await this.contractRepository.findById(id);
    if (!row) {
      throw new NotFoundException('Contract not found');
    }
    return row;
  }
}

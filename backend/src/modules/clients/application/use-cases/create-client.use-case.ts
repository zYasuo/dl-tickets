import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DomainError } from 'src/common/errors/domain.error';
import { Address } from 'src/common/vo/address.vo';
import { CLIENT_REPOSITORY } from '../../di.tokens';
import type { ClientRepositoryPort } from '../../domain/ports/repository/client.repository.port';
import { ClientEntity } from '../../domain/entities/client.entity';
import { Cnpj } from '../../domain/vo/cnpj.vo';
import { Cpf } from '../../domain/vo/cpf.vo';
import type { TCreateClient } from '../dto/create-client.dto';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly clientRepository: ClientRepositoryPort,
  ) {}

  async execute(input: TCreateClient): Promise<ClientEntity> {
    const cpf = input.cpf?.trim() ? Cpf.create(input.cpf) : undefined;
    const cnpj = input.cnpj?.trim() ? Cnpj.create(input.cnpj) : undefined;

    if (cpf) {
      const existing = await this.clientRepository.findByCpf(cpf.value);
      if (existing) {
        throw new ConflictException('CPF already registered');
      }
    }
    if (cnpj) {
      const existing = await this.clientRepository.findByCnpj(cnpj.value);
      if (existing) {
        throw new ConflictException('CNPJ already registered');
      }
    }

    const now = new Date();
    let entity: ClientEntity;
    try {
      entity = ClientEntity.create({
        id: randomUUID(),
        name: input.name,
        cpf,
        cnpj,
        address: Address.create(input.address),
        createdAt: now,
        updatedAt: now,
      });
    } catch (e) {
      if (e instanceof DomainError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }

    try {
      return await this.clientRepository.create(entity);
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('Duplicate document');
      }
      throw e;
    }
  }
}

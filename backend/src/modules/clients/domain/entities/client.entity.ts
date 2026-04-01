import { DomainError } from 'src/common/errors/domain.error';
import { Address } from 'src/common/vo/address.vo';
import { Cnpj } from '../vo/cnpj.vo';
import { Cpf } from '../vo/cpf.vo';

export type ClientEntityProps = {
  id: string;
  name: string;
  cpf?: Cpf;
  cnpj?: Cnpj;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
};

export class ClientEntity {
  constructor(private readonly params: ClientEntityProps) {}

  get id(): string {
    return this.params.id;
  }

  get name(): string {
    return this.params.name;
  }

  get cpf(): Cpf | undefined {
    return this.params.cpf;
  }

  get cnpj(): Cnpj | undefined {
    return this.params.cnpj;
  }

  get address(): Address {
    return this.params.address;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  get updatedAt(): Date {
    return this.params.updatedAt;
  }

  static create(input: ClientEntityProps): ClientEntity {
    if (!input.cpf && !input.cnpj) {
      throw new DomainError('Client must have at least CPF or CNPJ');
    }
    if (!input.id?.trim()) {
      throw new DomainError('Id is required');
    }
    if (!input.name?.trim()) {
      throw new DomainError('Name is required');
    }
    return new ClientEntity({ ...input, address: input.address });
  }

  /** Load from DB/cache without enforcing CPF/CNPJ (legacy or partial rows). */
  static reconstitute(input: ClientEntityProps): ClientEntity {
    if (!input.id?.trim()) {
      throw new DomainError('Id is required');
    }
    if (!input.name?.trim()) {
      throw new DomainError('Name is required');
    }
    return new ClientEntity({ ...input, address: input.address });
  }
}

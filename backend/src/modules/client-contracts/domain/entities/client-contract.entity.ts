import { DomainError } from 'src/common/errors/domain.error';
import { Address } from 'src/common/vo/address.vo';

export enum ClientContractStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export type ClientContractEntityProps = {
  id: string;
  contractNumber: string;
  clientId: string;
  useClientAddress: boolean;
  address?: Address;
  startDate: Date;
  endDate?: Date;
  status: ClientContractStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class ClientContractEntity {
  private constructor(private readonly params: ClientContractEntityProps) {}

  get id(): string {
    return this.params.id;
  }

  get contractNumber(): string {
    return this.params.contractNumber;
  }

  get clientId(): string {
    return this.params.clientId;
  }

  get useClientAddress(): boolean {
    return this.params.useClientAddress;
  }

  get address(): Address | undefined {
    return this.params.address;
  }

  get startDate(): Date {
    return this.params.startDate;
  }

  get endDate(): Date | undefined {
    return this.params.endDate;
  }

  get status(): ClientContractStatus {
    return this.params.status;
  }

  get createdAt(): Date {
    return this.params.createdAt;
  }

  get updatedAt(): Date {
    return this.params.updatedAt;
  }

  private assertInvariants(): void {
    if (this.params.endDate && this.params.startDate >= this.params.endDate) {
      throw new DomainError('endDate must be after startDate');
    }
    if (!this.params.useClientAddress && !this.params.address) {
      throw new DomainError('Contract address is required when not using client address');
    }
  }

  static create(input: ClientContractEntityProps): ClientContractEntity {
    if (!input.id?.trim()) {
      throw new DomainError('Id is required');
    }
    if (!input.contractNumber?.trim()) {
      throw new DomainError('Contract number is required');
    }
    if (!input.clientId?.trim()) {
      throw new DomainError('Client id is required');
    }
    const entity = new ClientContractEntity({ ...input });
    entity.assertInvariants();
    return entity;
  }

  static restore(params: ClientContractEntityProps): ClientContractEntity {
    return new ClientContractEntity(params);
  }

  validate(): void {
    this.assertInvariants();
  }

  toParams(): ClientContractEntityProps {
    return { ...this.params };
  }

  withPatch(patch: {
    contractNumber?: string;
    useClientAddress?: boolean;
    address?: Address | null;
    startDate?: Date;
    endDate?: Date | null;
    status?: ClientContractStatus;
    updatedAt?: Date;
  }): ClientContractEntity {
    const next: ClientContractEntityProps = {
      ...this.params,
      ...(patch.contractNumber !== undefined ? { contractNumber: patch.contractNumber } : {}),
      ...(patch.useClientAddress !== undefined ? { useClientAddress: patch.useClientAddress } : {}),
      ...(patch.address !== undefined ? { address: patch.address ?? undefined } : {}),
      ...(patch.startDate !== undefined ? { startDate: patch.startDate } : {}),
      ...(patch.endDate !== undefined ? { endDate: patch.endDate ?? undefined } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      updatedAt: patch.updatedAt ?? new Date(),
    };

    if (next.useClientAddress) {
      next.address = undefined;
    }

    const entity = new ClientContractEntity(next);
    entity.assertInvariants();
    return entity;
  }
}

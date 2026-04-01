import type { Prisma } from '@prisma/client';
import { Address } from 'src/common/vo/address.vo';
import {
  ClientContractEntity,
  ClientContractStatus,
} from 'src/modules/client-contracts/domain/entities/client-contract.entity';

export type ClientContractWithClient = Prisma.ClientContractGetPayload<{
  include: { client: { select: { uuid: true } } };
}>;

export function toDomain(row: ClientContractWithClient): ClientContractEntity {
  const address =
    !row.useClientAddress &&
    row.street != null &&
    row.number != null &&
    row.neighborhood != null &&
    row.city != null &&
    row.state != null &&
    row.zipCode != null
      ? Address.create({
          street: row.street,
          number: row.number,
          complement: row.complement ?? undefined,
          neighborhood: row.neighborhood,
          city: row.city,
          state: row.state,
          zipCode: row.zipCode,
        })
      : undefined;

  return ClientContractEntity.restore({
    id: row.uuid,
    contractNumber: row.contractNumber,
    clientId: row.client.uuid,
    useClientAddress: row.useClientAddress,
    address,
    startDate: row.startDate,
    endDate: row.endDate ?? undefined,
    status: row.status as ClientContractStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toPrismaCreate(
  entity: ClientContractEntity,
  clientInternalId: number,
): Prisma.ClientContractCreateInput {
  const a = entity.address;
  return {
    uuid: entity.id,
    contractNumber: entity.contractNumber,
    client: { connect: { id: clientInternalId } },
    useClientAddress: entity.useClientAddress,
    street: entity.useClientAddress ? null : a?.street ?? null,
    number: entity.useClientAddress ? null : a?.number ?? null,
    complement: entity.useClientAddress ? null : a?.complement ?? null,
    neighborhood: entity.useClientAddress ? null : a?.neighborhood ?? null,
    city: entity.useClientAddress ? null : a?.city ?? null,
    state: entity.useClientAddress ? null : a?.state ?? null,
    zipCode: entity.useClientAddress ? null : a?.zipCode ?? null,
    startDate: entity.startDate,
    endDate: entity.endDate ?? null,
    status: entity.status,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export function toPrismaUpdate(entity: ClientContractEntity): Prisma.ClientContractUpdateInput {
  const a = entity.address;
  return {
    contractNumber: entity.contractNumber,
    useClientAddress: entity.useClientAddress,
    street: entity.useClientAddress ? null : a?.street ?? null,
    number: entity.useClientAddress ? null : a?.number ?? null,
    complement: entity.useClientAddress ? null : a?.complement ?? null,
    neighborhood: entity.useClientAddress ? null : a?.neighborhood ?? null,
    city: entity.useClientAddress ? null : a?.city ?? null,
    state: entity.useClientAddress ? null : a?.state ?? null,
    zipCode: entity.useClientAddress ? null : a?.zipCode ?? null,
    startDate: entity.startDate,
    endDate: entity.endDate ?? null,
    status: entity.status,
  };
}

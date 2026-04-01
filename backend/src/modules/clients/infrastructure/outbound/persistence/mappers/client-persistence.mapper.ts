import type { Client, Prisma } from '@prisma/client';
import { Address } from 'src/common/vo/address.vo';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import { Cnpj } from 'src/modules/clients/domain/vo/cnpj.vo';
import { Cpf } from 'src/modules/clients/domain/vo/cpf.vo';

export function toDomain(row: Client): ClientEntity {
  return ClientEntity.create({
    id: row.uuid,
    name: row.name,
    cpf: row.cpf ? Cpf.create(row.cpf) : undefined,
    cnpj: row.cnpj ? Cnpj.create(row.cnpj) : undefined,
    address: Address.create({
      street: row.street,
      number: row.number,
      complement: row.complement ?? undefined,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
    }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toPrismaCreate(entity: ClientEntity): Prisma.ClientCreateInput {
  return {
    uuid: entity.id,
    name: entity.name,
    cpf: entity.cpf?.value ?? null,
    cnpj: entity.cnpj?.value ?? null,
    street: entity.address.street,
    number: entity.address.number,
    complement: entity.address.complement ?? null,
    neighborhood: entity.address.neighborhood,
    city: entity.address.city,
    state: entity.address.state,
    zipCode: entity.address.zipCode,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

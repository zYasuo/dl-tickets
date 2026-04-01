import type { Client, Prisma } from '@prisma/client';
import { Address } from 'src/common/vo/address.vo';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';
import { Cnpj } from 'src/modules/clients/domain/vo/cnpj.vo';
import { Cpf } from 'src/modules/clients/domain/vo/cpf.vo';

export const clientPersistenceInclude = {
  addressState: true,
  addressCity: true,
} as const;

export type ClientPersistenceRow = Prisma.ClientGetPayload<{
  include: typeof clientPersistenceInclude;
}>;

const PLACEHOLDER_CITY = '(não informado)';
const PLACEHOLDER_STATE = 'NI';

function isTwoLetterUf(value: string): boolean {
  return value.length === 2 && /^[A-Z]{2}$/u.test(value);
}

function resolveCityLabel(row: ClientPersistenceRow): string {
  const fromCol = row.city?.trim();
  if (fromCol) return fromCol;
  const fromRel = row.addressCity?.name?.trim();
  if (fromRel) return fromRel;
  return PLACEHOLDER_CITY;
}

function resolveStateLabel(row: ClientPersistenceRow): string {
  const fromCol = row.state?.trim().toUpperCase();
  if (fromCol && isTwoLetterUf(fromCol)) return fromCol;
  const fromCode = row.addressState?.code?.trim().toUpperCase();
  if (fromCode && isTwoLetterUf(fromCode)) return fromCode;
  return PLACEHOLDER_STATE;
}

function addressFromRow(row: ClientPersistenceRow): Address {
  const addrState = row.addressState;
  const addrCity = row.addressCity;
  const hasGeo = row.stateId != null && row.cityId != null && addrState != null && addrCity != null;

  if (hasGeo) {
    return Address.fromPersistence({
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      zipCode: row.zipCode,
      city: resolveCityLabel(row),
      state: resolveStateLabel(row),
      stateUuid: addrState.uuid,
      cityUuid: addrCity.uuid,
    });
  }

  const city = row.city?.trim();
  const stateRaw = row.state?.trim().toUpperCase() ?? '';
  const state = isTwoLetterUf(stateRaw) ? stateRaw : PLACEHOLDER_STATE;

  return Address.createLegacy({
    street: row.street,
    number: row.number,
    complement: row.complement ?? undefined,
    neighborhood: row.neighborhood,
    city: city || PLACEHOLDER_CITY,
    state,
    zipCode: row.zipCode,
  });
}

export function toDomain(row: ClientPersistenceRow): ClientEntity {
  return ClientEntity.reconstitute({
    id: row.uuid,
    name: row.name,
    cpf: row.cpf ? Cpf.create(row.cpf) : undefined,
    cnpj: row.cnpj ? Cnpj.create(row.cnpj) : undefined,
    address: addressFromRow(row),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toDomainFromScalar(row: Client): ClientEntity {
  const city = row.city?.trim() || PLACEHOLDER_CITY;
  const stateRaw = row.state?.trim().toUpperCase() ?? '';
  const state = isTwoLetterUf(stateRaw) ? stateRaw : PLACEHOLDER_STATE;

  return ClientEntity.reconstitute({
    id: row.uuid,
    name: row.name,
    cpf: row.cpf ? Cpf.create(row.cpf) : undefined,
    cnpj: row.cnpj ? Cnpj.create(row.cnpj) : undefined,
    address: Address.createLegacy({
      street: row.street,
      number: row.number,
      complement: row.complement ?? undefined,
      neighborhood: row.neighborhood,
      city,
      state,
      zipCode: row.zipCode,
    }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toPrismaCreate(entity: ClientEntity): Prisma.ClientCreateInput {
  const a = entity.address;
  const geo =
    a.stateUuid && a.cityUuid
      ? {
          addressState: { connect: { uuid: a.stateUuid } },
          addressCity: { connect: { uuid: a.cityUuid } },
        }
      : {};
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
    ...geo,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

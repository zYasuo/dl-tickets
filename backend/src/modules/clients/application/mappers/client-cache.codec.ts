import { Address } from 'src/common/vo/address.vo';
import { ClientEntity } from '../../domain/entities/client.entity';
import { Cnpj } from '../../domain/vo/cnpj.vo';
import { Cpf } from '../../domain/vo/cpf.vo';

export type CachedClientDetail = {
  id: string;
  name: string;
  cpf: string | null;
  cnpj: string | null;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    stateUuid?: string | null;
    cityUuid?: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export function encodeClientDetail(entity: ClientEntity): CachedClientDetail {
  const a = entity.address;
  return {
    id: entity.id,
    name: entity.name,
    cpf: entity.cpf?.value ?? null,
    cnpj: entity.cnpj?.value ?? null,
    address: {
      street: a.street,
      number: a.number,
      ...(a.complement ? { complement: a.complement } : {}),
      neighborhood: a.neighborhood,
      city: a.city,
      state: a.state,
      zipCode: a.zipCode,
      ...(a.stateUuid ? { stateUuid: a.stateUuid } : {}),
      ...(a.cityUuid ? { cityUuid: a.cityUuid } : {}),
    },
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

export function decodeClientDetail(row: CachedClientDetail): ClientEntity {
  return ClientEntity.reconstitute({
    id: row.id,
    name: row.name,
    cpf: row.cpf ? Cpf.create(row.cpf) : undefined,
    cnpj: row.cnpj ? Cnpj.create(row.cnpj) : undefined,
    address: Address.fromPersistence({
      street: row.address.street,
      number: row.address.number,
      complement: row.address.complement,
      neighborhood: row.address.neighborhood,
      zipCode: row.address.zipCode,
      city: row.address.city,
      state: row.address.state,
      stateUuid: row.address.stateUuid ?? null,
      cityUuid: row.address.cityUuid ?? null,
    }),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}

function isCachedClientDetail(v: unknown): v is CachedClientDetail {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.name !== 'string') return false;
  if (!o.address || typeof o.address !== 'object') return false;
  const a = o.address as Record<string, unknown>;
  return (
    typeof a.street === 'string' &&
    typeof a.number === 'string' &&
    typeof a.neighborhood === 'string' &&
    typeof a.city === 'string' &&
    typeof a.state === 'string' &&
    typeof a.zipCode === 'string' &&
    (a.stateUuid === undefined || a.stateUuid === null || typeof a.stateUuid === 'string') &&
    (a.cityUuid === undefined || a.cityUuid === null || typeof a.cityUuid === 'string') &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  );
}

export function tryDecodeClientDetailCache(raw: unknown): ClientEntity | null {
  if (!isCachedClientDetail(raw)) return null;
  try {
    return decodeClientDetail(raw);
  } catch {
    return null;
  }
}

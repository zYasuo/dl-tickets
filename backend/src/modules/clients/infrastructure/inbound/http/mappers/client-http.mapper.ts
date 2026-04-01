import type { ClientSearchItem } from 'src/modules/clients/application/use-cases/search-clients.use-case';
import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';

export type ClientAddressPublicHttp = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  stateUuid: string | null;
  cityUuid: string | null;
};

export type ClientPublicHttp = {
  id: string;
  name: string;
  cpf: string | null;
  cnpj: string | null;
  address: ClientAddressPublicHttp;
  createdAt: string;
  updatedAt: string;
};

export type ClientSearchMatchHttp = {
  kind: 'cpf' | 'id' | 'address';
  confidence: 'exact' | 'partial';
};

export type ClientSearchRowHttp = {
  client: ClientPublicHttp;
  match: ClientSearchMatchHttp;
};

export function toClientSearchRowHttp(row: ClientSearchItem): ClientSearchRowHttp {
  return {
    client: toClientPublicHttp(row.client),
    match: row.match,
  };
}

export function toClientPublicHttp(client: ClientEntity): ClientPublicHttp {
  const a = client.address;
  return {
    id: client.id,
    name: client.name,
    cpf: client.cpf?.value ?? null,
    cnpj: client.cnpj?.value ?? null,
    address: {
      street: a.street,
      number: a.number,
      ...(a.complement ? { complement: a.complement } : {}),
      neighborhood: a.neighborhood,
      city: a.city,
      state: a.state,
      zipCode: a.zipCode,
      stateUuid: a.stateUuid,
      cityUuid: a.cityUuid,
    },
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

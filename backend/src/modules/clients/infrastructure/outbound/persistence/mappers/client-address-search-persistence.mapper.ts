import type { Client } from '@prisma/client';

export type ClientAddressSearchRow = {
  id: number;
  uuid: string;
  name: string;
  cpf: string | null;
  cnpj: string | null;
  street: string;
  address_number: string;
  complement: string | null;
  neighborhood: string;
  city: string | null;
  state: string | null;
  zip_code: string;
  created_at: Date;
  updated_at: Date;
};

export function addressSearchRowToPrismaClient(row: ClientAddressSearchRow): Client {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    cpf: row.cpf,
    cnpj: row.cnpj,
    street: row.street,
    number: row.address_number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    stateId: null,
    cityId: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function escapeIlikePattern(term: string): string {
  return term.replace(/\\/gu, '\\\\').replace(/%/gu, '\\%').replace(/_/gu, '\\_');
}

import { ClientEntity } from 'src/modules/clients/domain/entities/client.entity';

export type ClientAddressPublicHttp = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
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
    },
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

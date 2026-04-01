import type { ClientAddressPublicHttp } from 'src/modules/clients/infrastructure/inbound/http/mappers/client-http.mapper';
import { ClientContractEntity } from 'src/modules/client-contracts/domain/entities/client-contract.entity';

export type ClientContractPublicHttp = {
  id: string;
  contractNumber: string;
  clientId: string;
  useClientAddress: boolean;
  address: ClientAddressPublicHttp | null;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function addressToHttp(
  entity: ClientContractEntity,
): ClientAddressPublicHttp | null {
  if (entity.useClientAddress || !entity.address) {
    return null;
  }
  const a = entity.address;
  return {
    street: a.street,
    number: a.number,
    ...(a.complement ? { complement: a.complement } : {}),
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    zipCode: a.zipCode,
  };
}

export function toClientContractPublicHttp(
  entity: ClientContractEntity,
): ClientContractPublicHttp {
  return {
    id: entity.id,
    contractNumber: entity.contractNumber,
    clientId: entity.clientId,
    useClientAddress: entity.useClientAddress,
    address: addressToHttp(entity),
    startDate: entity.startDate.toISOString().slice(0, 10),
    endDate: entity.endDate ? entity.endDate.toISOString().slice(0, 10) : null,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

import type { ClientContractStatus } from '../entities/client-contract.entity';

export type ClientContractListSortField =
  | 'contractNumber'
  | 'startDate'
  | 'createdAt'
  | 'updatedAt';
export type ClientContractListSortDirection = 'asc' | 'desc';

export type ClientContractListCriteria = {
  page: number;
  limit: number;
  cursor?: string;
  sortBy: ClientContractListSortField;
  sortOrder: ClientContractListSortDirection;
  clientId?: string;
  status?: ClientContractStatus;
};

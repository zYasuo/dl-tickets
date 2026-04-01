export type ClientListSortField = 'name' | 'createdAt' | 'updatedAt';
export type ClientListSortDirection = 'asc' | 'desc';

export type ClientListCriteria = {
  page: number;
  limit: number;
  cursor?: string;
  sortBy: ClientListSortField;
  sortOrder: ClientListSortDirection;
  name?: string;
};

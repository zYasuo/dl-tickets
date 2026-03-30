import type { components } from "@/lib/api/v1";

export type TicketListDateFilter = {
  createdFrom: string;
  createdTo: string;
};

export type TicketListSortBy =
  | "title"
  | "status"
  | "updatedAt"
  | "createdAt";

export type TicketListSortOrder = "asc" | "desc";

export type TicketListStatusFilter = components["schemas"]["TicketStatus"];

export type TicketListOptions = {
  date?: TicketListDateFilter;
  sortBy?: TicketListSortBy;
  sortOrder?: TicketListSortOrder;
  status?: TicketListStatusFilter;
};

export const ticketQueryKeys = {
  all: ["tickets"] as const,
  list: (page: number, limit: number, options?: TicketListOptions) =>
    [
      ...ticketQueryKeys.all,
      "list",
      {
        page,
        limit,
        date: options?.date,
        sortBy: options?.sortBy,
        sortOrder: options?.sortOrder,
        status: options?.status,
      },
    ] as const,
  detail: (id: string) => [...ticketQueryKeys.all, "detail", id] as const,
};

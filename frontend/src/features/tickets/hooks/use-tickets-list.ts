"use client";

import { useQuery } from "@tanstack/react-query";
import { AFetchTicketsPage } from "@/features/tickets/actions";
import {
  ticketQueryKeys,
  type TicketListOptions,
} from "./ticket-query-keys";

export function useTicketsList(
  page: number,
  limit: number,
  options?: TicketListOptions,
) {
  const { date, sortBy, sortOrder, status } = options ?? {};

  return useQuery({
    queryKey: ticketQueryKeys.list(page, limit, options),
    queryFn: () =>
      AFetchTicketsPage({
        page,
        limit,
        ...(date
          ? { createdFrom: date.createdFrom, createdTo: date.createdTo }
          : {}),
        sortBy,
        sortOrder,
        ...(status ? { status } : {}),
      }),
  });
}

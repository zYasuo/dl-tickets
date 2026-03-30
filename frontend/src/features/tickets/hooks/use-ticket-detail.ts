"use client";

import { useQuery } from "@tanstack/react-query";
import { findTicketById } from "@/lib/api/tickets-api";
import { ticketQueryKeys } from "./ticket-query-keys";

export function useTicketDetail(
  id: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ticketQueryKeys.detail(id),
    queryFn: () => findTicketById(id),
    enabled: Boolean(id) && enabled,
  });
}

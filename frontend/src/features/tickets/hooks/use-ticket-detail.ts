"use client";

import { useQuery } from "@tanstack/react-query";
import { AFindTicketById } from "@/features/tickets/actions";
import { ticketQueryKeys } from "./ticket-query-keys";

export function useTicketDetail(
  id: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ticketQueryKeys.detail(id),
    queryFn: () => AFindTicketById(id),
    enabled: Boolean(id) && enabled,
  });
}

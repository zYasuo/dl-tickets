"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AUpdateTicket } from "@/features/tickets/actions";
import type { TicketListInner, UpdateTicketBody } from "@/lib/api/tickets-api";
import { ticketQueryKeys } from "./ticket-query-keys";

function isTicketListInner(value: unknown): value is TicketListInner {
  return (
    value != null &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as TicketListInner).data)
  );
}

export function useUpdateTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTicketBody) =>
      AUpdateTicket(ticketId, body),
    onSuccess: (data) => {
      queryClient.setQueryData(ticketQueryKeys.detail(ticketId), data);
      queryClient.setQueriesData(
        { queryKey: ticketQueryKeys.all, predicate: (q) => q.queryKey[1] === "list" },
        (old) => {
          if (!isTicketListInner(old)) return old;
          const idx = old.data.findIndex((t) => t.id === ticketId);
          if (idx === -1) return old;
          const nextData = [...old.data];
          nextData[idx] = data;
          return { ...old, data: nextData };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
    },
  });
}

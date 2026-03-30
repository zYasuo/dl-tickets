"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTicket } from "@/lib/api/tickets-api";
import type { UpdateTicketBody } from "@/lib/api/tickets-api";
import { ticketQueryKeys } from "./ticket-query-keys";

export function useUpdateTicket(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateTicketBody) => updateTicket(ticketId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
    },
  });
}

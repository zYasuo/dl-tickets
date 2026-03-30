"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ACreateTicket } from "@/features/tickets/actions";
import type { CreateTicketBody } from "@/lib/api/tickets-api";
import { ticketQueryKeys } from "./ticket-query-keys";

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTicketBody) => ACreateTicket(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
    },
  });
}

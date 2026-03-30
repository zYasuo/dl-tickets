"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "@/lib/api/tickets-api";
import type { CreateTicketBody } from "@/lib/api/tickets-api";
import { ticketQueryKeys } from "./ticket-query-keys";

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateTicketBody) => createTicket(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketQueryKeys.all });
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ACreateClient } from "@/features/clients/actions";
import type { CreateClientBody } from "@/features/clients/actions";
import { clientQueryKeys } from "@/features/clients/query-keys";

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateClientBody) => ACreateClient(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

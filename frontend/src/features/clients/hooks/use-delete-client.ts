"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientQueryKeys } from "@/features/clients/query-keys";

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<never> => {
      void id;
      throw new Error("Indisponível — API em evolução");
    },
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
    },
  });
}

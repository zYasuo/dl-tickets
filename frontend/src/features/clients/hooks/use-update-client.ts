"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientQueryKeys } from "@/features/clients/query-keys";

type UpdateArgs = { id: string; body: unknown };

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: UpdateArgs): Promise<never> => {
      void _args;
      throw new Error("Indisponível — API em evolução");
    },
    retry: 0,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
    },
  });
}

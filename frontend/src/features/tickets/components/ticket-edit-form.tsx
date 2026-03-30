"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTicketDetail } from "@/features/tickets/hooks/use-ticket-detail";
import { useUpdateTicket } from "@/features/tickets/hooks/use-update-ticket";
import {
  updateTicketFormSchema,
  type UpdateTicketFormValues,
} from "@/features/tickets/schemas/ticket.schema";
import type { TicketPublic } from "@/lib/api/tickets-api";
import { ErrorAlert } from "@/shared/components/error-alert";
import { EmptyState } from "@/shared/components/empty-state";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TicketStatusField } from "@/features/tickets/components/ticket-status-field";

export type TicketEditFormProps = {
  ticketId: string;
  initialTicket?: TicketPublic;
  layout?: "page" | "plain";
  onSaved?: (ticket: TicketPublic) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function TicketEditForm({
  ticketId,
  initialTicket,
  layout = "page",
  onSaved,
  onSuccess,
  onCancel,
}: TicketEditFormProps) {
  const router = useRouter();
  const skipListScan = Boolean(
    initialTicket && initialTicket.id === ticketId,
  );
  const detail = useTicketDetail(ticketId, { enabled: !skipListScan });
  const mutation = useUpdateTicket(ticketId);

  const resolved = useMemo(() => {
    if (skipListScan && initialTicket) return initialTicket;
    return detail.data ?? undefined;
  }, [skipListScan, initialTicket, detail.data]);

  const isLoading = !skipListScan && detail.isPending;
  const isError = !skipListScan && detail.isError;
  const isNotFound =
    !skipListScan && detail.isSuccess && detail.data === null;

  const form = useForm<UpdateTicketFormValues>({
    resolver: zodResolver(updateTicketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "OPEN",
      updatedAt: "",
    },
  });

  useEffect(() => {
    if (resolved) {
      form.reset({
        title: resolved.title,
        description: resolved.description,
        status: resolved.status,
        updatedAt: resolved.updatedAt,
      });
    }
  }, [resolved, form]);

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    else void router.push("/tickets");
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else void router.push("/tickets");
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorAlert error={detail.error} />;
  }

  if (isNotFound) {
    return (
      <EmptyState
        title="Ticket não encontrado"
        description="Não foi possível localizar este ticket ao percorrer a listagem paginada. Confirma o ID ou cria um ticket novo."
      >
        <Link href="/tickets" className={cn(buttonVariants())}>
          Voltar à lista
        </Link>
      </EmptyState>
    );
  }

  const formBody = (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        mutation.mutate(values, {
          onSuccess: (saved) => {
            onSaved?.(saved);
            handleSuccess();
          },
        });
      })}
    >
      {mutation.isError ? <ErrorAlert error={mutation.error} /> : null}

      <FormField
        label="Título"
        htmlFor="edit-title"
        required
        error={form.formState.errors.title?.message}
      >
        <Input id="edit-title" {...form.register("title")} />
      </FormField>

      <FormField
        label="Descrição"
        htmlFor="edit-description"
        required
        error={form.formState.errors.description?.message}
      >
        <Input id="edit-description" {...form.register("description")} />
      </FormField>

      <FormField
        label="Estado"
        htmlFor="edit-status"
        required
        error={form.formState.errors.status?.message}
      >
        <TicketStatusField
          control={form.control}
          name="status"
          id="edit-status"
          disabled={mutation.isPending}
        />
      </FormField>

      <input type="hidden" {...form.register("updatedAt")} />

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "A guardar…" : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );

  if (layout === "plain") {
    return formBody;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar ticket</CardTitle>
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
}

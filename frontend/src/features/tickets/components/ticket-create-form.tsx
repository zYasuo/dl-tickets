"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useCreateTicket } from "@/features/tickets/hooks/use-create-ticket";
import {
  createTicketFormSchema,
  type CreateTicketFormValues,
} from "@/features/tickets/schemas/ticket.schema";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { TicketStatusField } from "@/features/tickets/components/ticket-status-field";

export type TicketCreateFormProps = {
  layout?: "page" | "plain";
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function TicketCreateForm({
  layout = "page",
  onSuccess,
  onCancel,
}: TicketCreateFormProps) {
  const router = useRouter();
  const mutation = useCreateTicket();

  const form = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketFormSchema),
    defaultValues: {
      userId: process.env.NEXT_PUBLIC_DEV_USER_ID ?? "",
      title: "",
      description: "",
      status: "OPEN",
    },
  });

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    else void router.push("/tickets");
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else void router.push("/tickets");
  };

  const formBody = (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        mutation.mutate(values, {
          onSuccess: handleSuccess,
        });
      })}
    >
      {mutation.isError ? <ErrorAlert error={mutation.error} /> : null}

      <FormField
        label="ID do utilizador"
        htmlFor="userId"
        required
        error={form.formState.errors.userId?.message}
      >
        <Input id="userId" {...form.register("userId")} />
      </FormField>

      <FormField
        label="Título"
        htmlFor="title"
        required
        error={form.formState.errors.title?.message}
      >
        <Input id="title" {...form.register("title")} />
      </FormField>

      <FormField
        label="Descrição"
        htmlFor="description"
        required
        error={form.formState.errors.description?.message}
      >
        <Input id="description" {...form.register("description")} />
      </FormField>

      <FormField
        label="Estado"
        htmlFor="status"
        required
        error={form.formState.errors.status?.message}
      >
        <TicketStatusField
          control={form.control}
          name="status"
          id="status"
          disabled={mutation.isPending}
        />
      </FormField>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "A guardar…" : "Criar"}
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
        <CardTitle>Novo ticket</CardTitle>
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
}

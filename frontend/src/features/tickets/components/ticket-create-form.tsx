"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useCreateTicket } from "@/features/tickets/hooks/use-create-ticket";
import {
  buildSCreateTicket,
  type CreateTicketFormBody,
} from "@/features/tickets/schemas/ticket.schema";
import { ErrorAlert } from "@/shared/components/error-alert";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

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
  const tVal = useTranslations("validation");

  const ticketSchema = useMemo(
    () =>
      buildSCreateTicket({
        titleRequired: tVal("ticketTitleRequired"),
        descriptionRequired: tVal("ticketDescriptionRequired"),
        descriptionMax: tVal("ticketDescriptionMax"),
      }),
    [tVal],
  );

  const form = useForm<CreateTicketFormBody>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    else void router.push("/dashboard/tickets");
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else void router.push("/dashboard/tickets");
  };

  const formBody = (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        mutation.mutate(
          { title: values.title, description: values.description },
          {
            onSuccess: handleSuccess,
          },
        );
      })}
    >
      {mutation.isError ? <ErrorAlert error={mutation.error} /> : null}

      <FormField
        label="Título"
        htmlFor="title"
        required
        error={form.formState.errors.title?.message}
      >
        <Input id="title" autoFocus {...form.register("title")} />
      </FormField>

      <FormField
        label="Descrição"
        htmlFor="description"
        required
        error={form.formState.errors.description?.message}
      >
        <Textarea
          id="description"
          rows={5}
          className="min-h-30 resize-y"
          {...form.register("description")}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 border-t border-border/80 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "A criar…" : "Criar chamado"}
        </Button>
      </div>
    </form>
  );

  if (layout === "plain") {
    return formBody;
  }

  return (
    <Card
      className="gap-0 border-border/80 shadow-sm ring-1 ring-foreground/6"
      size="sm"
    >
      <CardHeader className="border-b border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
        <CardTitle className="text-base">Dados do chamado</CardTitle>
        <CardDescription>
          Campos obrigatórios marcados com asterisco.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:px-5">{formBody}</CardContent>
    </Card>
  );
}

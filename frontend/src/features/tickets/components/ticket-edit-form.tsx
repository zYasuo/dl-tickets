"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboardIcon, ListIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTicketDetail } from "@/features/tickets/hooks/use-ticket-detail";
import { useUpdateTicket } from "@/features/tickets/hooks/use-update-ticket";
import {
  buildSUpdateTicket,
  type UpdateTicketFormBody,
} from "@/features/tickets/schemas/ticket.schema";
import type { TicketPublic } from "@/lib/api/tickets-api";
import { ticketCode } from "@/features/tickets/lib/ticket-code";
import { ErrorAlert } from "@/shared/components/error-alert";
import { EmptyState } from "@/shared/components/empty-state";
import { FormField } from "@/shared/components/form-field";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TicketStatusField } from "@/features/tickets/components/ticket-status-field";

export type TicketEditFormProps = {
  ticketId: string;
  initialTicket?: TicketPublic;
  layout?: "page" | "plain";
  onSaved?: (ticket: TicketPublic) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function formatDateTimePt(iso: string): string {
  const d = new Date(iso);
  if (!isValid(d)) return "—";
  return `${format(d, "d MMM yyyy", { locale: ptBR })} · ${format(d, "HH:mm", { locale: ptBR })}`;
}

function TicketEditSidePanel({ ticket }: { ticket: TicketPublic }) {
  const t = useTranslations("tickets.edit");
  return (
    <div className="flex flex-col gap-4 lg:max-w-none">
      <Card
        className="gap-0 border-border/80 shadow-sm ring-1 ring-foreground/6"
        size="sm"
      >
        <CardHeader className="border-b border-border/80 bg-muted/20 px-4 py-3 sm:px-4">
          <CardTitle className="text-sm font-medium">{t("sideInfoTitle")}</CardTitle>
          <CardDescription className="text-xs">
            {t("sideInfoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 py-4">
          <dl className="grid gap-3 text-sm">
            <div className="grid gap-0.5">
              <dt className="text-xs font-medium text-muted-foreground">{t("fieldCode")}</dt>
              <dd className="font-mono text-xs tracking-tight text-foreground">
                {ticketCode(ticket.id)}
              </dd>
            </div>
          </dl>
          <div className="space-y-3 border-t border-border/70 pt-3">
            <dl className="grid gap-3 text-sm">
              <div className="grid gap-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{t("fieldCreated")}</dt>
                <dd className="tabular-nums text-foreground">
                  {formatDateTimePt(ticket.createdAt)}
                </dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("fieldUpdated")}
                </dt>
                <dd className="tabular-nums text-foreground">
                  {formatDateTimePt(ticket.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("concurrencyNote")}
          </p>
        </CardContent>
      </Card>

      <Card
        className="gap-0 border-border/80 shadow-sm ring-1 ring-foreground/6"
        size="sm"
      >
        <CardHeader className="border-b border-border/80 bg-muted/20 px-4 py-3">
          <CardTitle className="text-sm font-medium">{t("navTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 p-2">
          <Link
            href="/dashboard/tickets"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start gap-2 text-muted-foreground hover:text-foreground",
            )}
          >
            <ListIcon className="size-4 shrink-0 opacity-70" aria-hidden />
            {t("navTicketList")}
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start gap-2 text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutDashboardIcon className="size-4 shrink-0 opacity-70" aria-hidden />
            {t("navOverview")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export function TicketEditForm({
  ticketId,
  initialTicket,
  layout = "page",
  onSaved,
  onSuccess,
  onCancel,
}: TicketEditFormProps) {
  const router = useRouter();
  const tTickets = useTranslations("tickets");
  const tVal = useTranslations("validation");
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

  const updateTicketSchema = useMemo(
    () =>
      buildSUpdateTicket({
        titleRequired: tVal("ticketTitleRequired"),
        descriptionRequired: tVal("ticketDescriptionRequired"),
        descriptionMax: tVal("ticketDescriptionMax"),
        updatedAtRequired: tVal("ticketUpdatedAtRequired"),
      }),
    [tVal],
  );

  const form = useForm<UpdateTicketFormBody>({
    resolver: zodResolver(updateTicketSchema),
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
    else void router.push("/dashboard/tickets");
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else void router.push("/dashboard/tickets");
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_19rem]">
        <Card
          className="gap-0 border-border/80 shadow-sm ring-1 ring-foreground/6"
          size="sm"
        >
          <CardHeader className="space-y-2 border-b border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-28" />
          </CardHeader>
          <CardContent className="space-y-4 px-4 py-5 sm:px-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card
            className="gap-0 border-border/80 shadow-sm ring-1 ring-foreground/6"
            size="sm"
          >
            <CardHeader className="border-b border-border/80 bg-muted/20 px-4 py-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3 w-full" />
            </CardHeader>
            <CardContent className="space-y-3 px-4 py-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorAlert error={detail.error} />;
  }

  if (isNotFound) {
    return (
      <EmptyState
        title={tTickets("notFoundTitle")}
        description={tTickets("notFoundDescription")}
      >
        <Link href="/dashboard/tickets" className={cn(buttonVariants())}>
          {tTickets("backToTickets")}
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
        <Textarea
          id="edit-description"
          rows={7}
          className="min-h-40 resize-y"
          {...form.register("description")}
        />
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

      <div className="flex flex-col-reverse gap-2 border-t border-border/80 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "A guardar…" : "Guardar alterações"}
        </Button>
      </div>
    </form>
  );

  if (layout === "plain") {
    return formBody;
  }

  if (!resolved) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_19rem]">
      <Card
        className="gap-0 border-border/80 shadow-sm ring-1 ring-foreground/6"
        size="sm"
      >
        <CardHeader className="border-b border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
          <CardTitle className="text-base">Formulário</CardTitle>
          <CardDescription>
            <span className="font-mono text-xs tracking-tight text-muted-foreground">
              {ticketCode(ticketId)}
            </span>
            <span className="mt-1 block text-[13px] leading-snug">
              Campos editáveis deste chamado.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:px-5">{formBody}</CardContent>
      </Card>

      <TicketEditSidePanel ticket={resolved} />
    </div>
  );
}

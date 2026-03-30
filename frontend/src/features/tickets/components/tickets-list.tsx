"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { TicketCreateForm } from "@/features/tickets/components/ticket-create-form";
import { TicketEditForm } from "@/features/tickets/components/ticket-edit-form";
import { TicketsDataTable } from "@/features/tickets/components/tickets-data-table";
import { ticketCode } from "@/features/tickets/lib/ticket-code";
import { useTicketsList } from "@/features/tickets/hooks/use-tickets-list";
import type {
  TicketListDateFilter,
  TicketListSortBy,
  TicketListSortOrder,
  TicketListStatusFilter,
} from "@/features/tickets/hooks/ticket-query-keys";
import { formatDateOnlyLocal } from "@/features/tickets/lib/date-only-local";
import { buildPaginationItems } from "@/features/tickets/lib/pagination-page-items";
import { cn } from "@/lib/utils";
import { ErrorAlert } from "@/shared/components/error-alert";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { TicketPublic } from "@/lib/api/tickets-api";

const DEFAULT_LIMIT = 10;

function parseDateOnlyLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function TicketsList() {
  const [page, setPage] = useState(1);
  const [dayFilter, setDayFilter] = useState<string | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<TicketListSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<TicketListSortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<
    TicketListStatusFilter | undefined
  >();
  const [editTicket, setEditTicket] = useState<TicketPublic | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const listOptions = useMemo(() => {
    const date: TicketListDateFilter | undefined =
      dayFilter !== undefined
        ? { createdFrom: dayFilter, createdTo: dayFilter }
        : undefined;
    return {
      date,
      sortBy,
      sortOrder,
      status: statusFilter,
    };
  }, [dayFilter, sortBy, sortOrder, statusFilter]);

  const { data, isPending, isError, error, isFetching } = useTicketsList(
    page,
    DEFAULT_LIMIT,
    listOptions,
  );

  const handleSort = (by: TicketListSortBy, order: TicketListSortOrder) => {
    setSortBy(by);
    setSortOrder(order);
    setPage(1);
  };

  const handleStatusFilter = (s: TicketListStatusFilter | undefined) => {
    setStatusFilter(s);
    setPage(1);
  };

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorAlert error={error} />;
  }

  const rows = data?.data ?? [];
  const meta = data?.meta;

  if (rows.length === 0) {
    const hasDay = Boolean(dayFilter);
    const hasStatus = Boolean(statusFilter);
    const emptyTitle =
      hasDay && hasStatus
        ? "Nenhum ticket com estes filtros"
        : hasDay
          ? "Nenhum ticket neste dia"
          : hasStatus
            ? "Nenhum ticket neste estado"
            : "Sem tickets";
    const emptyDescription =
      hasDay && hasStatus
        ? "Altera a data, o estado ou remove os filtros."
        : hasDay
          ? "Tenta outra data ou remove o filtro."
          : hasStatus
            ? "Escolhe outro estado ou remove o filtro."
            : "Ainda não existem tickets nesta página.";

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FilterCalendarControl
              dayFilter={dayFilter}
              calendarOpen={calendarOpen}
              onOpenChange={setCalendarOpen}
              onSelectDay={(d) => {
                setDayFilter(formatDateOnlyLocal(d));
                setPage(1);
                setCalendarOpen(false);
              }}
              onClear={() => {
                setDayFilter(undefined);
                setPage(1);
              }}
            />
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="gap-2"
            >
              <PlusIcon className="size-4 shrink-0" />
              Novo ticket
            </Button>
          </div>
        </div>
        <EmptyState title={emptyTitle} description={emptyDescription}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasStatus ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatusFilter(undefined);
                  setPage(1);
                }}
              >
                Limpar filtro de estado
              </Button>
            ) : null}
            {hasDay ? (
              <Button type="button" variant="outline" onClick={() => setDayFilter(undefined)}>
                Limpar filtro de data
              </Button>
            ) : null}
            {!hasDay && !hasStatus ? (
              <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
                <PlusIcon className="size-4 shrink-0" />
                Criar ticket
              </Button>
            ) : null}
          </div>
        </EmptyState>
        <TicketsListDialogs
          editTicket={editTicket}
          onEditOpenChange={(open) => {
            if (!open) setEditTicket(null);
          }}
          onEditTicketSaved={setEditTicket}
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
        />
      </div>
    );
  }

  const pageItems =
    meta && meta.totalPages > 0
      ? buildPaginationItems(meta.page, meta.totalPages)
      : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterCalendarControl
            dayFilter={dayFilter}
            calendarOpen={calendarOpen}
            onOpenChange={setCalendarOpen}
            onSelectDay={(d) => {
              setDayFilter(formatDateOnlyLocal(d));
              setPage(1);
              setCalendarOpen(false);
            }}
            onClear={() => {
              setDayFilter(undefined);
              setPage(1);
            }}
          />
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="gap-2"
          >
            <PlusIcon className="size-4 shrink-0" />
            Novo ticket
          </Button>
        </div>
        {isFetching ? (
          <p className="text-xs text-muted-foreground sm:text-end">A atualizar…</p>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <TicketsDataTable
          data={rows}
          sortBy={sortBy}
          sortOrder={sortOrder}
          statusFilter={statusFilter}
          onSort={handleSort}
          onStatusFilter={handleStatusFilter}
          onRowOpenTicket={setEditTicket}
        />
      </div>

      {meta && meta.totalPages > 0 ? (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground sm:text-start">
            Página {meta.page} de {meta.totalPages} · {meta.total} tickets
          </p>
          <Pagination className="mx-0 w-full justify-center sm:justify-end">
            <PaginationContent className="flex-wrap justify-center">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text="Anterior"
                  className={cn(!meta.hasPreviousPage && "pointer-events-none opacity-40")}
                  onClick={(e) => {
                    e.preventDefault();
                    if (meta.hasPreviousPage) setPage((p) => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>
              {pageItems.map((item, i) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === meta.page}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(item);
                      }}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text="Seguinte"
                  className={cn(!meta.hasNextPage && "pointer-events-none opacity-40")}
                  onClick={(e) => {
                    e.preventDefault();
                    if (meta.hasNextPage) setPage((p) => p + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}

      <TicketsListDialogs
        editTicket={editTicket}
        onEditOpenChange={(open) => {
          if (!open) setEditTicket(null);
        }}
        onEditTicketSaved={setEditTicket}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
      />
    </div>
  );
}

function TicketsListDialogs({
  editTicket,
  onEditOpenChange,
  onEditTicketSaved,
  createOpen,
  onCreateOpenChange,
}: {
  editTicket: TicketPublic | null;
  onEditOpenChange: (open: boolean) => void;
  onEditTicketSaved: (ticket: TicketPublic) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <Dialog open={editTicket !== null} onOpenChange={onEditOpenChange}>
        <DialogContent className="max-h-[min(90vh,44rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8">
              {editTicket ? (
                <>
                  <span className="block font-mono text-sm font-normal text-muted-foreground">
                    {ticketCode(editTicket.id)}
                  </span>
                  <span className="mt-1 block max-w-full truncate font-heading text-lg leading-snug font-medium">
                    {editTicket.title}
                  </span>
                </>
              ) : null}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Editar título, descrição e estado do ticket.
            </DialogDescription>
          </DialogHeader>
          {editTicket ? (
            <TicketEditForm
              ticketId={editTicket.id}
              initialTicket={editTicket}
              layout="plain"
              onSaved={onEditTicketSaved}
              onSuccess={() => onEditOpenChange(false)}
              onCancel={() => onEditOpenChange(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={onCreateOpenChange}>
        <DialogContent className="max-h-[min(90vh,44rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo ticket</DialogTitle>
            <DialogDescription className="sr-only">
              Cria um ticket com título, descrição e estado.
            </DialogDescription>
          </DialogHeader>
          {createOpen ? (
            <TicketCreateForm
              layout="plain"
              onSuccess={() => onCreateOpenChange(false)}
              onCancel={() => onCreateOpenChange(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilterCalendarControl({
  dayFilter,
  calendarOpen,
  onOpenChange,
  onSelectDay,
  onClear,
}: {
  dayFilter: string | undefined;
  calendarOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDay: (d: Date) => void;
  onClear: () => void;
}) {
  const label =
    dayFilter !== undefined
      ? format(parseDateOnlyLocal(dayFilter), "d MMM yyyy", { locale: ptBR })
      : "Filtrar por data";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={calendarOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !dayFilter && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {label}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dayFilter ? parseDateOnlyLocal(dayFilter) : undefined}
            onSelect={(d) => {
              if (d) onSelectDay(d);
            }}
            defaultMonth={dayFilter ? parseDateOnlyLocal(dayFilter) : undefined}
          />
        </PopoverContent>
      </Popover>
      {dayFilter !== undefined ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Limpar data
        </Button>
      ) : null}
    </div>
  );
}

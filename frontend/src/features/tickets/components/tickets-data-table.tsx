"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  CheckCircle2Icon,
  CheckIcon,
  CircleDotIcon,
  CircleIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TicketPublic } from "@/lib/api/tickets-api";
import { ticketCode } from "@/features/tickets/lib/ticket-code";
import { ticketStatusLabel } from "@/features/tickets/lib/status-label";
import type {
  TicketListSortBy,
  TicketListSortOrder,
  TicketListStatusFilter,
} from "@/features/tickets/hooks/ticket-query-keys";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

type TicketStatus = TicketPublic["status"];

function StatusIcon({ status }: { status: TicketStatus }) {
  const cls = "size-4 shrink-0 text-muted-foreground";
  switch (status) {
    case "OPEN":
      return <CircleIcon className={cls} aria-hidden />;
    case "IN_PROGRESS":
      return <CircleDotIcon className={cls} aria-hidden />;
    case "DONE":
      return <CheckCircle2Icon className={cn(cls, "text-primary")} aria-hidden />;
    default:
      return <CircleIcon className={cls} aria-hidden />;
  }
}

type TicketsDataTableProps = {
  data: TicketPublic[];
  sortBy: TicketListSortBy;
  sortOrder: TicketListSortOrder;
  statusFilter?: TicketListStatusFilter;
  onSort: (by: TicketListSortBy, order: TicketListSortOrder) => void;
  onStatusFilter: (status: TicketListStatusFilter | undefined) => void;
  onRowOpenTicket: (ticket: TicketPublic) => void;
};

export function TicketsDataTable({
  data,
  sortBy,
  sortOrder,
  statusFilter,
  onSort,
  onStatusFilter,
  onRowOpenTicket,
}: TicketsDataTableProps) {
  const columns = useMemo<ColumnDef<TicketPublic>[]>(
    () => [
      {
        id: "code",
        accessorFn: (row) => row.id,
        header: () => (
          <span className="text-muted-foreground">Ticket</span>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {ticketCode(row.original.id)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "title",
        header: () => (
          <ColumnHeaderMenu
            label="Título"
            sortBy={sortBy}
            sortOrder={sortOrder}
            columnSortId="title"
            onSort={onSort}
          />
        ),
        cell: ({ row }) => (
          <div className="flex max-w-[min(100vw-8rem,28rem)] flex-wrap items-center gap-2 sm:max-w-md">
            <Badge variant="outline" className="shrink-0 font-normal">
              Ticket
            </Badge>
            <span className="min-w-0 font-medium leading-snug wrap-break-word">
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <StatusColumnHeader
            sortBy={sortBy}
            sortOrder={sortOrder}
            statusFilter={statusFilter}
            onSort={onSort}
            onStatusFilter={onStatusFilter}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StatusIcon status={row.original.status} />
            <span>{ticketStatusLabel(row.original.status)}</span>
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: () => (
          <ColumnHeaderMenu
            label="Atualizado"
            sortBy={sortBy}
            sortOrder={sortOrder}
            columnSortId="updatedAt"
            onSort={onSort}
          />
        ),
        cell: ({ row }) => {
          const d = new Date(row.original.updatedAt);
          return (
            <span className="text-muted-foreground">
              {isValid(d)
                ? format(d, "d MMM yyyy, HH:mm", { locale: ptBR })
                : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => (
          <RowActionsMenu
            ticket={row.original}
            onOpenEdit={onRowOpenTicket}
          />
        ),
        enableSorting: false,
      },
    ],
    [sortBy, sortOrder, statusFilter, onSort, onStatusFilter, onRowOpenTicket],
  );

  const sortingState =
    sortBy === "createdAt"
      ? []
      : [{ id: sortBy, desc: sortOrder === "desc" }];

  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable; ordenação vem da API
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting: sortingState,
    },
    manualSorting: true,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => (
                <TableHead key={h.id} className="whitespace-nowrap">
                  {h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="cursor-pointer"
                onClick={() => onRowOpenTicket(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Sem resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ColumnHeaderMenu({
  label,
  columnSortId,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  columnSortId: TicketListSortBy;
  sortBy: TicketListSortBy;
  sortOrder: TicketListSortOrder;
  onSort: (by: TicketListSortBy, order: TicketListSortOrder) => void;
}) {
  const active = sortBy === columnSortId;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-2 flex h-8 items-center gap-1 rounded-md px-2 text-left text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
          active && "text-primary",
        )}
      >
        {label}
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUpIcon className="size-4 opacity-80" />
          ) : (
            <ArrowDownIcon className="size-4 opacity-80" />
          )
        ) : (
          <ArrowUpDownIcon className="size-4 opacity-50" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={() => onSort(columnSortId, "asc")}>
          <ArrowUpIcon className="size-4" />
          Ascendente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort(columnSortId, "desc")}>
          <ArrowDownIcon className="size-4" />
          Descendente
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onSort("createdAt", "desc");
          }}
        >
          Ordenação padrão (criado)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusFilterItem({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onClick={onSelect}>
      <span className="flex w-full items-center gap-2">
        <span className="flex size-4 items-center justify-center">
          {selected ? <CheckIcon className="size-4" /> : null}
        </span>
        {label}
      </span>
    </DropdownMenuItem>
  );
}

function StatusColumnHeader({
  sortBy,
  sortOrder,
  statusFilter,
  onSort,
  onStatusFilter,
}: {
  sortBy: TicketListSortBy;
  sortOrder: TicketListSortOrder;
  statusFilter?: TicketListStatusFilter;
  onSort: (by: TicketListSortBy, order: TicketListSortOrder) => void;
  onStatusFilter: (status: TicketListStatusFilter | undefined) => void;
}) {
  const active = sortBy === "status";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-2 flex h-8 items-center gap-1 rounded-md px-2 text-left text-sm font-medium outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
          active && "text-primary",
        )}
      >
        Estado
        {active ? (
          sortOrder === "asc" ? (
            <ArrowUpIcon className="size-4 opacity-80" />
          ) : (
            <ArrowDownIcon className="size-4 opacity-80" />
          )
        ) : (
          <ArrowUpDownIcon className="size-4 opacity-50" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onSort("status", "asc")}>
          <ArrowUpIcon className="size-4" />
          Ascendente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort("status", "desc")}>
          <ArrowDownIcon className="size-4" />
          Descendente
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
          <StatusFilterItem
            label="Todos"
            selected={statusFilter === undefined}
            onSelect={() => onStatusFilter(undefined)}
          />
          <StatusFilterItem
            label="Aberto"
            selected={statusFilter === "OPEN"}
            onSelect={() => onStatusFilter("OPEN")}
          />
          <StatusFilterItem
            label="Em progresso"
            selected={statusFilter === "IN_PROGRESS"}
            onSelect={() => onStatusFilter("IN_PROGRESS")}
          />
          <StatusFilterItem
            label="Concluído"
            selected={statusFilter === "DONE"}
            onSelect={() => onStatusFilter("DONE")}
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowActionsMenu({
  ticket,
  onOpenEdit,
}: {
  ticket: TicketPublic;
  onOpenEdit: (t: TicketPublic) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-8 text-muted-foreground",
        )}
        aria-label="Abrir menu de ações"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onOpenEdit(ticket);
          }}
        >
          <PencilIcon className="size-4 shrink-0 opacity-70" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            void navigator.clipboard?.writeText(ticket.id);
          }}
        >
          <CopyIcon className="size-4 shrink-0 opacity-70" />
          Copiar ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

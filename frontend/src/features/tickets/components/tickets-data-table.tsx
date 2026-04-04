"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowUpDownIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  HashIcon,
  InboxIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TimerIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Separator } from "@/shared/components/ui/separator";
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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    expandedTicketId: string | null;
  }
}

function expandedTicketPanelDomId(ticketId: string): string {
  return `ticket-expanded-${ticketId}`;
}

type TicketStatus = TicketPublic["status"];

function statusIconConfig(status: TicketStatus): {
  Icon: LucideIcon;
  iconClass: string;
  wrapClass: string;
} {
  switch (status) {
    case "OPEN":
      return {
        Icon: InboxIcon,
        iconClass: "size-4 text-muted-foreground",
        wrapClass: "bg-muted/80 ring-1 ring-border",
      };
    case "IN_PROGRESS":
      return {
        Icon: TimerIcon,
        iconClass: "size-4 text-primary",
        wrapClass: "bg-primary/15 ring-1 ring-primary/35",
      };
    case "DONE":
      return {
        Icon: CheckCircle2Icon,
        iconClass: "size-4 text-chart-3",
        wrapClass: "bg-secondary ring-1 ring-border",
      };
    default:
      return {
        Icon: InboxIcon,
        iconClass: "size-4 text-muted-foreground",
        wrapClass: "bg-muted ring-1 ring-border",
      };
  }
}

function StatusBadgeCompact({ status }: { status: TicketStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 font-normal",
        status === "OPEN" && "border-border bg-muted/50 text-muted-foreground",
        status === "IN_PROGRESS" &&
          "border-primary/35 bg-primary/10 text-primary",
        status === "DONE" &&
          "border-border bg-secondary/90 text-secondary-foreground",
      )}
    >
      {ticketStatusLabel(status)}
    </Badge>
  );
}

function StatusBadgeCell({ status }: { status: TicketStatus }) {
  const { Icon, iconClass, wrapClass } = statusIconConfig(status);
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          wrapClass,
        )}
        aria-hidden
      >
        <Icon className={iconClass} strokeWidth={2} />
      </span>
      <Badge
        variant="outline"
        className={cn(
          "font-normal",
          status === "OPEN" && "border-border bg-muted/40 text-muted-foreground",
          status === "IN_PROGRESS" &&
            "border-primary/30 bg-primary/10 text-primary",
          status === "DONE" &&
            "border-border bg-secondary text-secondary-foreground",
        )}
      >
        {ticketStatusLabel(status)}
      </Badge>
    </div>
  );
}


type TicketsDataTableProps = {
  data: TicketPublic[];
  sortBy: TicketListSortBy;
  sortOrder: TicketListSortOrder;
  statusFilter?: TicketListStatusFilter;
  onSort: (by: TicketListSortBy, order: TicketListSortOrder) => void;
  onStatusFilter: (status: TicketListStatusFilter | undefined) => void;
  onRowOpenTicket: (ticket: TicketPublic) => void;
  embedded?: boolean;
};

export function TicketsDataTable({
  data,
  sortBy,
  sortOrder,
  statusFilter,
  onSort,
  onStatusFilter,
  onRowOpenTicket,
  embedded = false,
}: TicketsDataTableProps) {
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (
      expandedTicketId &&
      !data.some((t) => t.id === expandedTicketId)
    ) {
      setExpandedTicketId(null);
    }
  }, [data, expandedTicketId]);

  const columns = useMemo<ColumnDef<TicketPublic>[]>(
    () => [
      {
        id: "code",
        accessorFn: (row) => row.id,
        header: () => (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <HashIcon className="size-3.5 opacity-70" aria-hidden />
            Código
          </span>
        ),
        cell: ({ row, table }) => {
          const open =
            table.options.meta?.expandedTicketId === row.original.id;
          return (
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground tabular-nums">
              <ChevronRightIcon
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  open && "rotate-90",
                )}
                aria-hidden
              />
              <HashIcon className="size-3 shrink-0 opacity-50" aria-hidden />
              {ticketCode(row.original.id)}
            </span>
          );
        },
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
          <span className="block min-w-32 max-w-[min(100vw-10rem,22rem)] font-medium leading-snug wrap-break-word sm:max-w-xs md:max-w-sm">
            {row.original.title}
          </span>
        ),
      },
      {
        id: "description",
        accessorFn: (row) => row.description,
        header: () => (
          <span className="text-muted-foreground">Descrição</span>
        ),
        cell: ({ row }) => {
          const raw = row.original.description?.trim() ?? "";
          return (
            <p
              className="max-w-[min(100vw-8rem,20rem)] text-sm leading-relaxed text-muted-foreground sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl"
              title={raw || undefined}
            >
              {raw ? (
                <span className="line-clamp-2 whitespace-pre-wrap wrap-break-word">
                  {raw}
                </span>
              ) : (
                <span className="italic opacity-60">Sem descrição</span>
              )}
            </p>
          );
        },
        enableSorting: false,
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
        cell: ({ row }) => <StatusBadgeCell status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: () => (
          <ColumnHeaderMenu
            label="Criado"
            sortBy={sortBy}
            sortOrder={sortOrder}
            columnSortId="createdAt"
            onSort={onSort}
          />
        ),
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return (
            <div className="flex flex-col gap-0.5 text-xs tabular-nums">
              <span className="text-foreground">
                {isValid(d)
                  ? format(d, "d MMM yyyy", { locale: ptBR })
                  : "—"}
              </span>
              <span className="text-muted-foreground">
                {isValid(d) ? format(d, "HH:mm", { locale: ptBR }) : ""}
              </span>
            </div>
          );
        },
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
            <div className="flex flex-col gap-0.5 text-xs tabular-nums">
              <span className="text-foreground">
                {isValid(d)
                  ? format(d, "d MMM yyyy", { locale: ptBR })
                  : "—"}
              </span>
              <span className="text-muted-foreground">
                {isValid(d) ? format(d, "HH:mm", { locale: ptBR }) : ""}
              </span>
            </div>
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
    [
      sortBy,
      sortOrder,
      statusFilter,
      onSort,
      onStatusFilter,
      onRowOpenTicket,
    ],
  );

  const sortingState = [{ id: sortBy, desc: sortOrder === "desc" }];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: { expandedTicketId },
    state: {
      sorting: sortingState,
    },
    manualSorting: true,
  });

  return (
    <div
      className={cn(
        embedded
          ? "rounded-none border-0 shadow-none"
          : "rounded-lg border border-border shadow-sm",
      )}
    >
      <Table className="min-w-[880px]">
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
            table.getRowModel().rows.map((row) => {
              const ticket = row.original;
              const isExpanded = expandedTicketId === ticket.id;
              return (
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    aria-controls={
                      isExpanded
                        ? expandedTicketPanelDomId(ticket.id)
                        : undefined
                    }
                    aria-label={
                      isExpanded
                        ? `Recolher detalhes do chamado ${ticketCode(ticket.id)}`
                        : `Expandir detalhes do chamado ${ticketCode(ticket.id)}`
                    }
                    className={cn(
                      "cursor-pointer border-border/60 transition-colors hover:bg-muted/40",
                      isExpanded && "bg-muted/30 hover:bg-muted/35",
                    )}
                    onClick={() =>
                      setExpandedTicketId((cur) =>
                        cur === ticket.id ? null : ticket.id,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedTicketId((cur) =>
                          cur === ticket.id ? null : ticket.id,
                        );
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="border-b border-border/80 hover:bg-transparent">
                      <TableCell
                        colSpan={columns.length}
                        className="p-0 align-top"
                      >
                        <ExpandedTicketPanel
                          ticket={ticket}
                          onEdit={() => onRowOpenTicket(ticket)}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
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

function formatTicketDateLabel(iso: string): string {
  const d = new Date(iso);
  if (!isValid(d)) return "—";
  return `${format(d, "d MMM yyyy", { locale: ptBR })} · ${format(d, "HH:mm", { locale: ptBR })}`;
}

function ExpandedTicketPanel({
  ticket,
  onEdit,
}: {
  ticket: TicketPublic;
  onEdit: () => void;
}) {
  const desc = ticket.description?.trim() ?? "";

  return (
    <div
      id={expandedTicketPanelDomId(ticket.id)}
      className="animate-in fade-in-0 border-t border-border bg-card duration-150"
      role="region"
      aria-label={`Detalhes: ${ticket.title}`}
    >
      <div className="flex flex-col gap-2 border-b border-border/80 bg-muted/35 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-xs font-medium tracking-tight text-muted-foreground tabular-nums">
            {ticketCode(ticket.id)}
          </span>
          <StatusBadgeCompact status={ticket.status} />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-[55%] sm:text-end">
          <span className="text-muted-foreground/65">Criado</span>{" "}
          <span className="text-foreground/90">
            {formatTicketDateLabel(ticket.createdAt)}
          </span>
          <span className="mx-2 text-border" aria-hidden>
            ·
          </span>
          <span className="text-muted-foreground/65">Atualizado</span>{" "}
          <span className="text-foreground/90">
            {formatTicketDateLabel(ticket.updatedAt)}
          </span>
        </p>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground">
          {ticket.title}
        </h3>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Descrição
          </p>
          {desc ? (
            <p className="max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {desc}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Sem descrição registada.
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-col-reverse gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-5">
        <Link
          href={`/dashboard/tickets/${encodeURIComponent(ticket.id)}/edit`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-9 text-muted-foreground hover:text-foreground",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          Abrir página de edição
        </Link>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <PencilIcon className="size-4 opacity-80" />
          Editar
        </Button>
      </div>
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
  icon: Icon,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <DropdownMenuItem onClick={onSelect}>
      <span className="flex w-full items-center gap-2">
        <span className="flex size-4 shrink-0 items-center justify-center">
          {selected ? (
            <CheckIcon className="size-4 text-primary" aria-hidden />
          ) : Icon ? (
            <Icon className="size-4 opacity-50" aria-hidden />
          ) : null}
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
            icon={InboxIcon}
          />
          <StatusFilterItem
            label="Em progresso"
            selected={statusFilter === "IN_PROGRESS"}
            onSelect={() => onStatusFilter("IN_PROGRESS")}
            icon={TimerIcon}
          />
          <StatusFilterItem
            label="Concluído"
            selected={statusFilter === "DONE"}
            onSelect={() => onStatusFilter("DONE")}
            icon={CheckCircle2Icon}
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
          onClick={async (e) => {
            e.stopPropagation();
            try {
              if (!navigator.clipboard?.writeText) {
                toast.error("Cópia não disponível neste navegador.");
                return;
              }
              await navigator.clipboard.writeText(ticket.id);
              toast.success("ID copiado.");
            } catch {
              toast.error("Não foi possível copiar o ID.");
            }
          }}
        >
          <CopyIcon className="size-4 shrink-0 opacity-70" />
          Copiar ID (UUID)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={async (e) => {
            e.stopPropagation();
            try {
              if (!navigator.clipboard?.writeText) {
                toast.error("Cópia não disponível neste navegador.");
                return;
              }
              await navigator.clipboard.writeText(ticketCode(ticket.id));
              toast.success("Código copiado.");
            } catch {
              toast.error("Não foi possível copiar o código.");
            }
          }}
        >
          <HashIcon className="size-4 shrink-0 opacity-70" />
          Copiar código
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

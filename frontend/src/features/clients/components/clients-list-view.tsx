"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useClientsList } from "@/features/clients/hooks/use-clients-list";
import { clientDocumentLabel } from "@/features/clients/lib/display";
import { formatClientAddress } from "@/features/clients/lib/format-address";
import { buildPaginationItems } from "@/features/tickets/lib/pagination-page-items";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ClientModal } from "@/features/clients/components/client-modal/client-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const DEFAULT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;
const API_DISABLED_TITLE = "Indisponível — API em evolução";

type ClientsListCardProps = {
  searchInput: string;
  setSearchInput: (value: string) => void;
  nameFilter: string | undefined;
};

export function ClientsListView() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const nameFilter =
    debouncedSearch.trim().length > 0 ? debouncedSearch.trim() : undefined;

  return (
    <div className="flex w-full flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-4 md:px-5">
      <PageHeader title="Clientes" />
      <ClientsListCard
        key={debouncedSearch}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        nameFilter={nameFilter}
      />
    </div>
  );
}

function ClientsListCard({
  searchInput,
  setSearchInput,
  nameFilter,
}: ClientsListCardProps) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [modalClientId, setModalClientId] = useState<string | null>(null);
  const [clientModalSession, setClientModalSession] = useState(0);

  const updatePage = (next: number | ((p: number) => number)) => {
    setSelectedId(null);
    setPage(next);
  };

  const listOptions = useMemo(
    () => ({
      sortBy: "updatedAt" as const,
      sortOrder: "desc" as const,
      ...(nameFilter ? { name: nameFilter } : {}),
    }),
    [nameFilter],
  );

  const { data, isPending, isError, isFetching, refetch } = useClientsList(
    page,
    DEFAULT_LIMIT,
    listOptions,
  );

  const clients = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 0;

  const rangeLabel = useMemo(() => {
    if (isPending) return "A carregar…";
    if (isError) return "Indisponível";
    if (!meta) return "—";
    if (meta.total === 0) return "0 registos";
    if (clients.length === 0) return `Sem registos nesta página · ${meta.total.toLocaleString("pt-PT")} no total`;
    const from = (meta.page - 1) * meta.limit + 1;
    const to = from + clients.length - 1;
    return `${from.toLocaleString("pt-PT")} – ${to.toLocaleString("pt-PT")} de ${meta.total.toLocaleString("pt-PT")}`;
  }, [meta, isPending, isError, clients.length]);

  const openCreateModal = () => {
    setModalClientId(null);
    setClientModalSession((s) => s + 1);
    setClientModalOpen(true);
  };

  const openEditModal = (id: string) => {
    setSelectedId(id);
    setModalClientId(id);
    setClientModalSession((s) => s + 1);
    setClientModalOpen(true);
  };

  return (
    <>
      <ClientModal
        key={clientModalSession}
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        clientId={modalClientId}
      />
      <Card
        className="gap-0 overflow-hidden border-border/80 shadow-sm ring-1 ring-foreground/6"
        size="sm"
      >
        <CardHeader className="space-y-4 border-b border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">Registo de clientes</CardTitle>
              <CardDescription>{rangeLabel}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/clients/new"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "inline-flex gap-1.5",
                )}
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                Novo
              </Link>
              <Button
                type="button"
                variant="secondary"
                className="gap-1.5"
                onClick={openCreateModal}
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                Novo (modal)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                disabled={!selectedId}
                title={
                  selectedId ? "Editar no modal" : "Seleccione uma linha na tabela"
                }
                onClick={() => selectedId && openEditModal(selectedId)}
              >
                <Pencil className="size-4 shrink-0" aria-hidden />
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                disabled
                title={API_DISABLED_TITLE}
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                Deletar
              </Button>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Pesquisar por nome…"
              aria-label="Pesquisar clientes por nome"
              className="h-9 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          {isPending ? (
            <div className="px-4 py-6">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : isError ? (
            <div className="px-4 py-10">
              <EmptyState
                title="Não foi possível carregar"
                description="Verifica a ligação ao servidor e tenta outra vez."
              >
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  {isFetching ? "A carregar…" : "Tentar novamente"}
                </Button>
              </EmptyState>
            </div>
          ) : clients.length === 0 ? (
            <div className="px-4 py-10">
              <EmptyState
                title={nameFilter ? "Nenhum resultado" : "Sem clientes"}
                description={
                  nameFilter
                    ? "Tenta outro termo ou limpa a pesquisa."
                    : "Cria o primeiro cliente com o botão Novo."
                }
              >
                {nameFilter ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSearchInput("")}
                  >
                    Limpar pesquisa
                  </Button>
                ) : null}
              </EmptyState>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Documento</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                  <TableHead className="hidden xl:table-cell">Morada</TableHead>
                  <TableHead className="hidden md:table-cell">Actualizado</TableHead>
                  <TableHead className="w-[100px] text-end">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => {
                  const shortAddr = `${c.address.street}, ${c.address.number}`;
                  return (
                    <TableRow
                      key={c.id}
                      data-state={selectedId === c.id ? "selected" : undefined}
                      className={cn(
                        "cursor-pointer even:bg-muted/25",
                        selectedId === c.id && "bg-muted/50",
                      )}
                      aria-selected={selectedId === c.id}
                      onClick={() => openEditModal(c.id)}
                    >
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {clientDocumentLabel(c) ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {c.address.city}
                      </TableCell>
                      <TableCell
                        className="hidden max-w-[220px] truncate text-muted-foreground xl:table-cell"
                        title={formatClientAddress(c.address)}
                      >
                        {shortAddr}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatDistanceToNow(new Date(c.updatedAt), {
                          addSuffix: true,
                          locale: pt,
                        })}
                      </TableCell>
                      <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/dashboard/clients/${encodeURIComponent(c.id)}`}
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Detalhe
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!isPending && totalPages > 1 ? (
            <div className="flex justify-center border-t border-border px-2 py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        updatePage((p) => Math.max(1, p - 1));
                      }}
                      aria-disabled={page <= 1}
                      className={cn(page <= 1 && "pointer-events-none opacity-50")}
                    />
                  </PaginationItem>
                  {buildPaginationItems(page, totalPages).map((item, i) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`e-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          onClick={(e) => {
                            e.preventDefault();
                            updatePage(item);
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
                      onClick={(e) => {
                        e.preventDefault();
                        updatePage((p) => Math.min(totalPages, p + 1));
                      }}
                      aria-disabled={page >= totalPages}
                      className={cn(
                        page >= totalPages && "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}

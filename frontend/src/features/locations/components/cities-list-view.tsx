"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useCitiesQuery,
  useStatesQuery,
  useCountrySelectionForLists,
} from "@/features/locations/hooks/use-locations";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

function stateCodeLabel(code: unknown): string {
  if (code == null || typeof code === "object") return "";
  const s = String(code).trim();
  return s.length > 0 ? s : "";
}

export function CitiesListView() {
  const { countriesQuery, countries, countryUuid, setCountryUuid } =
    useCountrySelectionForLists();
  const statesQuery = useStatesQuery(countryUuid.trim() || undefined);
  const states = useMemo(
    () => [...(statesQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [statesQuery.data],
  );

  const [stateUuid, setStateUuid] = useState("");

  useEffect(() => {
    setStateUuid("");
  }, [countryUuid]);

  useEffect(() => {
    if (states.length === 0) return;
    queueMicrotask(() => {
      setStateUuid((prev) => {
        if (prev && states.some((s) => s.id === prev)) return prev;
        return states[0]?.id ?? "";
      });
    });
  }, [states]);

  const selectItems = useMemo(
    () =>
      Object.fromEntries(
        states.map((s) => {
          const code = stateCodeLabel(s.code);
          const label = code ? `${code} — ${s.name}` : s.name;
          return [s.id, label] as const;
        }),
      ),
    [states],
  );

  const citiesQuery = useCitiesQuery(stateUuid.trim() || undefined);

  const countrySelectItems = Object.fromEntries(
    countries.map((c) => [c.id, c.name] as const),
  );

  return (
    <div className="flex w-full flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-4 md:px-5">
      <PageHeader title="Cidades" />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-foreground">País</span>
          {countriesQuery.isPending ? (
            <Skeleton className="h-10 w-full max-w-md" />
          ) : countriesQuery.isError ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar os países.
            </p>
          ) : countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum país cadastrado.</p>
          ) : (
            <Select
              items={countrySelectItems}
              value={countryUuid}
              onValueChange={(v) => setCountryUuid(v ?? "")}
              modal={false}
            >
              <SelectTrigger className="h-10 w-full max-w-md" size="default">
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start">
                <SelectGroup>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Estado</span>
          {!countryUuid.trim() ? (
            <p className="text-sm text-muted-foreground">Seleccione um país.</p>
          ) : statesQuery.isPending ? (
            <Skeleton className="h-10 w-full max-w-md" />
          ) : statesQuery.isError ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar os estados.
            </p>
          ) : states.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum estado disponível.</p>
          ) : (
            <Select
              items={selectItems}
              value={stateUuid}
              onValueChange={(v) => setStateUuid(v ?? "")}
              modal={false}
            >
              <SelectTrigger className="h-10 w-full max-w-md" size="default">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start">
                <SelectGroup>
                  {states.map((s) => {
                    const code = stateCodeLabel(s.code);
                    const label = code ? `${code} — ${s.name}` : s.name;
                    return (
                      <SelectItem key={s.id} value={s.id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-0">
          {!stateUuid.trim() ? (
            <p className="p-4 text-sm text-muted-foreground">
              Seleccione um estado para listar as cidades.
            </p>
          ) : citiesQuery.isPending ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : citiesQuery.isError ? (
            <p className="p-4 text-sm text-destructive">
              Não foi possível carregar as cidades deste estado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden font-mono text-xs md:table-cell">
                    UUID
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(citiesQuery.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="hidden max-w-[min(28rem,40vw)] truncate font-mono text-xs text-muted-foreground md:table-cell">
                      {row.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

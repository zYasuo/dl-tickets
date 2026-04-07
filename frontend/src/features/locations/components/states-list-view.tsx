"use client";

import { useStatesQuery, useCountrySelectionForLists } from "@/features/locations/hooks/use-locations";
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
  if (code == null || typeof code === "object") return "—";
  const s = String(code).trim();
  return s.length > 0 ? s : "—";
}

export function StatesListView() {
  const { countriesQuery, countries, countryUuid, setCountryUuid } =
    useCountrySelectionForLists();
  const query = useStatesQuery(countryUuid.trim() || undefined);

  const countrySelectItems = Object.fromEntries(
    countries.map((c) => [c.id, c.name] as const),
  );

  return (
    <div className="flex w-full flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-4 md:px-5">
      <PageHeader title="Estados" />
      <div className="flex flex-col gap-2">
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
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-0">
          {!countryUuid.trim() ? (
            <p className="p-4 text-sm text-muted-foreground">
              Seleccione um país para listar os estados.
            </p>
          ) : query.isPending ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : query.isError ? (
            <p className="p-4 text-sm text-destructive">
              Não foi possível carregar os estados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">UF / código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden font-mono text-xs md:table-cell">
                    UUID
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm">
                      {stateCodeLabel(row.code)}
                    </TableCell>
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

"use client";

import { useStatesQuery } from "@/features/locations/hooks/use-locations";
import { DEFAULT_COUNTRY_UUID_BR } from "@/features/locations/constants";
import { PageHeader } from "@/shared/components/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
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
  const query = useStatesQuery(DEFAULT_COUNTRY_UUID_BR);

  return (
    <div className="flex w-full flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-4 md:px-5">
      <PageHeader title="Estados" />
      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-0">
          {query.isPending ? (
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

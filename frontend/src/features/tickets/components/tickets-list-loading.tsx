import { Skeleton } from "@/shared/components/ui/skeleton";

export function TicketsListLoading() {
  return (
    <div className="space-y-3" aria-busy aria-label="A carregar chamados">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-52 w-full rounded-lg" />
    </div>
  );
}

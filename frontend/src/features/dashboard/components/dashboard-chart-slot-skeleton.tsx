import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function DashboardChartSlotSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col gap-3 rounded-xl border border-border/80 bg-card/30 p-4 shadow-sm",
        className,
      )}
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="min-h-[200px] flex-1 rounded-lg" />
    </div>
  );
}

export function DashboardRecentSlotSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col gap-3 rounded-xl border border-border/80 bg-card/30 p-4 shadow-sm",
        className,
      )}
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full max-w-xs" />
      <div className="mt-2 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

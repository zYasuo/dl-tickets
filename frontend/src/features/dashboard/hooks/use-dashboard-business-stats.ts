"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AFetchDashboardBusinessStatsBundle } from "@/features/dashboard/actions";
import { dashboardQueryKeys } from "./dashboard-query-keys";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function aggregateCreatedAtByDay(
  createdAts: string[],
): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const iso of createdAts) {
    const d = new Date(iso);
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateCreatedAtByMonth(
  createdAts: string[],
): { month: string; count: number }[] {
  const map = new Map<string, number>();
  for (const iso of createdAts) {
    const d = new Date(iso);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function countCreatedInLastDays(createdAts: string[], days: number): number {
  const cutoff = Date.now() - days * MS_PER_DAY;
  let n = 0;
  for (const iso of createdAts) {
    if (new Date(iso).getTime() >= cutoff) n += 1;
  }
  return n;
}

export function useDashboardBusinessStats() {
  const bundleQuery = useQuery({
    queryKey: dashboardQueryKeys.businessStatsBundle(),
    queryFn: () => AFetchDashboardBusinessStatsBundle(),
  });

  const stats = useMemo(() => {
    const b = bundleQuery.data;
    if (!b) {
      return {
        totalClients: 0,
        activeContracts: 0,
        expiredContracts: 0,
        cancelledContracts: 0,
        clientsTimeline: [] as { date: string; count: number }[],
        contractsMonthly: [] as { month: string; count: number }[],
        clientsInLast30d: 0,
        clientsSampleSize: 0,
        contractsInLast30d: 0,
        contractsSampleSize: 0,
      };
    }
    const clientRows = b.clientsSampleCreatedAts;
    const contractRows = b.contractsSampleCreatedAts;
    return {
      totalClients: b.totalClients,
      activeContracts: b.activeContracts,
      expiredContracts: b.expiredContracts,
      cancelledContracts: b.cancelledContracts,
      clientsTimeline: aggregateCreatedAtByDay(clientRows),
      contractsMonthly: aggregateCreatedAtByMonth(contractRows),
      clientsInLast30d: countCreatedInLastDays(clientRows, 30),
      clientsSampleSize: clientRows.length,
      contractsInLast30d: countCreatedInLastDays(contractRows, 30),
      contractsSampleSize: contractRows.length,
    };
  }, [bundleQuery.data]);

  return {
    ...stats,
    isLoading: bundleQuery.isPending,
    isError: bundleQuery.isError,
  };
}

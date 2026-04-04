"use client";

import dynamic from "next/dynamic";
import { useDashboardBusinessStats } from "@/features/dashboard/hooks/use-dashboard-business-stats";
import {
  DashboardChartSlotSkeleton,
  DashboardRecentSlotSkeleton,
} from "@/features/dashboard/components/dashboard-chart-slot-skeleton";
import { DashboardClientSearch } from "@/features/dashboard/components/dashboard-client-search";
import { DashboardKpiCards } from "@/features/dashboard/components/dashboard-kpi-cards";

const DashboardContractsDonutChart = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-contracts-donut-chart").then(
      (m) => ({ default: m.DashboardContractsDonutChart }),
    ),
  { loading: () => <DashboardChartSlotSkeleton /> },
);

const DashboardContractsHorizontalBarChart = dynamic(
  () =>
    import(
      "@/features/dashboard/components/dashboard-contracts-horizontal-bar-chart"
    ).then((m) => ({ default: m.DashboardContractsHorizontalBarChart })),
  { loading: () => <DashboardChartSlotSkeleton /> },
);

const DashboardActivityRadials = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-activity-radials").then(
      (m) => ({ default: m.DashboardActivityRadials }),
    ),
  { loading: () => <DashboardChartSlotSkeleton /> },
);

const DashboardClientsLineChart = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-clients-line-chart").then(
      (m) => ({ default: m.DashboardClientsLineChart }),
    ),
  { loading: () => <DashboardChartSlotSkeleton /> },
);

const DashboardContractsMonthlyLineChart = dynamic(
  () =>
    import(
      "@/features/dashboard/components/dashboard-contracts-monthly-line-chart"
    ).then((m) => ({ default: m.DashboardContractsMonthlyLineChart })),
  { loading: () => <DashboardChartSlotSkeleton /> },
);

const DashboardRecentClients = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-recent-clients").then(
      (m) => ({ default: m.DashboardRecentClients }),
    ),
  { loading: () => <DashboardRecentSlotSkeleton /> },
);

const DashboardRecentContracts = dynamic(
  () =>
    import("@/features/dashboard/components/dashboard-recent-contracts").then(
      (m) => ({ default: m.DashboardRecentContracts }),
    ),
  { loading: () => <DashboardRecentSlotSkeleton /> },
);

export function DashboardOverview() {
  const {
    totalClients,
    activeContracts,
    expiredContracts,
    cancelledContracts,
    clientsTimeline,
    contractsMonthly,
    clientsInLast30d,
    clientsSampleSize,
    contractsInLast30d,
    contractsSampleSize,
    isLoading,
  } = useDashboardBusinessStats();

  const kpiItems = [
    { title: "Total de clientes", value: totalClients },
    { title: "Contratos ativos", value: activeContracts },
    { title: "Contratos expirados", value: expiredContracts },
    { title: "Contratos cancelados", value: cancelledContracts },
  ] as const;

  return (
    <div className="flex w-full flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 md:px-5">
      <DashboardClientSearch />

      <DashboardKpiCards items={[...kpiItems]} isLoading={isLoading} />

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <DashboardContractsDonutChart
          active={activeContracts}
          expired={expiredContracts}
          cancelled={cancelledContracts}
        />
        <DashboardContractsHorizontalBarChart
          active={activeContracts}
          expired={expiredContracts}
          cancelled={cancelledContracts}
        />
        <DashboardActivityRadials
          clientsInLast30d={clientsInLast30d}
          clientsSampleSize={clientsSampleSize}
          contractsInLast30d={contractsInLast30d}
          contractsSampleSize={contractsSampleSize}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardClientsLineChart data={clientsTimeline} />
        <DashboardContractsMonthlyLineChart data={contractsMonthly} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardRecentClients />
        <DashboardRecentContracts />
      </div>
    </div>
  );
}

"use server";

import { AFetchClientContractsPage } from "@/features/client-contracts/actions";
import { AFetchClientsPage } from "@/features/clients/actions";

export type DashboardBusinessStatsBundle = {
  totalClients: number;
  activeContracts: number;
  expiredContracts: number;
  cancelledContracts: number;
  clientsSampleCreatedAts: string[];
  contractsSampleCreatedAts: string[];
};

export async function AFetchDashboardBusinessStatsBundle(): Promise<DashboardBusinessStatsBundle> {
  const [
    totalClientsPage,
    activeContractsPage,
    expiredContractsPage,
    cancelledContractsPage,
    clientsSamplePage,
    contractsSamplePage,
  ] = await Promise.all([
    AFetchClientsPage({ page: 1, limit: 1 }),
    AFetchClientContractsPage({
      page: 1,
      limit: 1,
      status: "ACTIVE",
    }),
    AFetchClientContractsPage({
      page: 1,
      limit: 1,
      status: "EXPIRED",
    }),
    AFetchClientContractsPage({
      page: 1,
      limit: 1,
      status: "CANCELLED",
    }),
    AFetchClientsPage({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    AFetchClientContractsPage({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
  ]);

  return {
    totalClients: totalClientsPage.meta.total,
    activeContracts: activeContractsPage.meta.total,
    expiredContracts: expiredContractsPage.meta.total,
    cancelledContracts: cancelledContractsPage.meta.total,
    clientsSampleCreatedAts: clientsSamplePage.data.map((r) => r.createdAt),
    contractsSampleCreatedAts: contractsSamplePage.data.map((r) => r.createdAt),
  };
}

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  businessStatsBundle: () =>
    [...dashboardQueryKeys.all, "business-stats-bundle"] as const,
  recentClientsPreview: () =>
    [...dashboardQueryKeys.all, "recent-clients-preview"] as const,
  recentContractsPreview: () =>
    [...dashboardQueryKeys.all, "recent-contracts-preview"] as const,
};

export type DashboardMetrics = {
  leadsToday: number;
  leadsThisMonth: number;
  topProduct: string | null;
  topCategory: string | null;
  trafficSources: readonly {
    source: string;
    count: number;
  }[];
};

export type AuthSessionResponse = {
  accessToken: string;
  role: "general" | "premium";
};

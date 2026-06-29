"use client";

import { MetricsCard } from "@/features/admin/components/MetricsCard";
import { TrafficPanel } from "@/features/admin/components/TrafficPanel";
import { useDashboard } from "@/features/admin/hooks/useDashboard";

export function AdminDashboard() {
  const { metrics, loading, error } = useDashboard();

  if (loading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Loading metrics...
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Lead and traffic metrics for general admin access.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricsCard label="Today's Leads" value={String(metrics.leadsToday)} />
        <MetricsCard
          label="This Month"
          value={String(metrics.leadsThisMonth)}
        />
        <MetricsCard
          label="Top Product"
          value={metrics.topProduct ?? "No data"}
        />
        <MetricsCard
          label="Top Category"
          value={metrics.topCategory ?? "No data"}
        />
      </div>

      <TrafficPanel trafficSources={metrics.trafficSources} />
    </section>
  );
}

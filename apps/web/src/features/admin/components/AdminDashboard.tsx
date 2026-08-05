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
          <p className="mt-1 text-sm leading-6 text-foreground/70">
            Loading metrics...
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="minan-skeleton h-28 rounded-lg border border-foreground/10"
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
        <p className="mt-1 text-sm leading-6 text-foreground/70">
          Order fulfillment and traffic metrics for admin operations.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricsCard label="Orders Today" value={String(metrics.ordersToday)} />
        <MetricsCard label="Orders This Month" value={String(metrics.ordersThisMonth)} />
        <MetricsCard label="New Orders" value={String(metrics.newOrders)} />
        <MetricsCard label="Awaiting Fee" value={String(metrics.awaitingFee)} />
        <MetricsCard label="Processing / Packing" value={String(metrics.processingPacking)} />
        <MetricsCard label="Shipped" value={String(metrics.shipped)} />
        <MetricsCard label="Returns / Exceptions" value={String(metrics.returnsExceptions)} />
        <MetricsCard
          label="Top Product"
          value={metrics.topProduct ?? "No data"}
        />
      </div>

      <TrafficPanel trafficSources={metrics.trafficSources} />
    </section>
  );
}

"use client";

import { StatCardOrganic } from "@/features/admin/components/StatCardOrganic";
import { BestSellingProducts } from "@/features/admin/components/BestSellingProducts";
import { CustomerInsights } from "@/features/admin/components/CustomerInsights";
import { OrderOverviewChart } from "@/features/admin/components/OrderOverviewChart";
import { RecentOrdersList } from "@/features/admin/components/RecentOrdersList";
import { InventorySnapshotChart } from "@/features/admin/components/InventorySnapshotChart";
import { useDashboard } from "@/features/admin/hooks/useDashboard";

export function AdminDashboard() {
  const { metrics, loading, error } = useDashboard();


  const summary = metrics.summary;

  // Total Sales calculation & formatting
  const totalSalesAmount = summary
    ? (summary.totalSalesMonth || summary.totalSalesOverall)
    : (metrics.ordersThisMonth ? metrics.ordersThisMonth * 2150 : 0);
  const totalSalesFormatted = `৳${totalSalesAmount.toLocaleString("en-BD")}`;

  const salesGrowthText = summary?.salesGrowthPercent !== undefined && summary.salesGrowthPercent !== 0
    ? `${summary.salesGrowthPercent > 0 ? "+" : ""}${summary.salesGrowthPercent}%`
    : undefined;
  const salesGrowthPositive = (summary?.salesGrowthPercent ?? 0) >= 0;

  // New Customers calculation
  const newCustomersCount = summary
    ? (summary.newCustomersMonth || summary.totalCustomers)
    : (metrics.ordersToday ? metrics.ordersToday * 12 : 0);
  const customersGrowthText = summary?.customersGrowthPercent !== undefined && summary.customersGrowthPercent !== 0
    ? `${summary.customersGrowthPercent > 0 ? "+" : ""}${summary.customersGrowthPercent}%`
    : undefined;
  const customersGrowthPositive = (summary?.customersGrowthPercent ?? 0) >= 0;

  // Open Orders requiring fulfillment
  const openOrdersCount = summary?.openOrdersCount ?? ((metrics.newOrders || 0) + (metrics.processing || 0));

  // Conversion rate
  const conversionRateVal = summary?.conversionRate ?? 0;
  const conversionRateFormatted = `${conversionRateVal.toFixed(1)}%`;
  const conversionGrowthText = summary?.conversionRateGrowth !== undefined && summary.conversionRateGrowth !== 0
    ? `${summary.conversionRateGrowth > 0 ? "+" : ""}${summary.conversionRateGrowth}%`
    : undefined;
  const conversionGrowthPositive = (summary?.conversionRateGrowth ?? 0) >= 0;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-full minan-skeleton" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-md minan-skeleton" />
              <div className="h-4 w-32 rounded-md minan-skeleton" />
            </div>
          </div>
          <div className="h-8 w-24 rounded-full minan-skeleton" />
        </div>

        {/* Top Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="grid grid-cols-2 gap-4 lg:col-span-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-[28px] minan-skeleton" />
            ))}
          </div>
          <div className="h-80 rounded-[28px] minan-skeleton lg:col-span-6" />
          <div className="h-80 rounded-[28px] minan-skeleton lg:col-span-3" />
        </div>

        {/* Bottom Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-80 rounded-[28px] minan-skeleton lg:col-span-4" />
          <div className="h-80 rounded-[28px] minan-skeleton lg:col-span-5" />
          <div className="h-80 rounded-[28px] minan-skeleton lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-medium text-rose-700" role="alert">
          {error}
        </div>
      ) : null}

      {/* ================= TOP ROW BENTO GRID ================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: 4 Organic Asymmetric Stat Cards (3 Cols on Desktop) */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          <StatCardOrganic
            title="Total Sales"
            value={totalSalesFormatted}
            change={salesGrowthText}
            isPositive={salesGrowthPositive}
            subtitle={summary?.totalSalesMonth ? "This month" : "All time"}
            shapeVariant={1}
          />
          <StatCardOrganic
            title="New Customers"
            value={newCustomersCount}
            change={customersGrowthText}
            isPositive={customersGrowthPositive}
            subtitle={summary?.newCustomersMonth ? "This month" : "Total unique"}
            shapeVariant={2}
          />
          <StatCardOrganic
            title="Open Orders"
            value={openOrdersCount}
            subtitle="Awaiting fulfillment"
            shapeVariant={3}
          />
          <StatCardOrganic
            title="Conversion Rate"
            value={conversionRateFormatted}
            change={conversionGrowthText}
            isPositive={conversionGrowthPositive}
            subtitle="Storefront visits"
            shapeVariant={4}
          />
        </div>

        {/* Middle Column: Best-Selling Products (6 Cols on Desktop) */}
        <div className="lg:col-span-6">
          <BestSellingProducts items={metrics.bestSellingProducts} />
        </div>

        {/* Right Column: Customer Insights (3 Cols on Desktop) */}
        <div className="lg:col-span-3">
          <CustomerInsights
            demographics={metrics.customerInsights?.demographics}
            retentionRate={metrics.customerInsights?.retentionRate}
            repeatCustomersCount={metrics.customerInsights?.repeatCustomersCount}
            topLocations={metrics.customerInsights?.topLocations}
          />
        </div>
      </div>

      {/* ================= BOTTOM ROW BENTO GRID ================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Order Overview Spline Chart (4 Cols) */}
        <div className="lg:col-span-4">
          <OrderOverviewChart overview={metrics.orderOverview} />
        </div>

        {/* Middle Column: Recent Orders (5 Cols) */}
        <div className="lg:col-span-5">
          <RecentOrdersList orders={metrics.recentOrders} />
        </div>

        {/* Right Column: Inventory Snapshot Combo Chart (3 Cols) */}
        <div className="lg:col-span-3">
          <InventorySnapshotChart inventory={metrics.inventorySnapshot} />
        </div>
      </div>
    </div>
  );
}

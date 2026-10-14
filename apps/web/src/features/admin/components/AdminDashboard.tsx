"use client";

import { Banknote, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { AdminDashboardSkeleton } from "@/features/admin/components/AdminSkeleton";
import { StatCard } from "@/features/admin/components/StatCardOrganic";
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
    : 0;
  const totalSalesFormatted = `৳${totalSalesAmount.toLocaleString("en-BD")}`;

  const salesGrowthText = summary?.salesGrowthPercent !== undefined && summary.salesGrowthPercent !== 0
    ? `${summary.salesGrowthPercent > 0 ? "+" : ""}${summary.salesGrowthPercent}%`
    : undefined;
  const salesGrowthPositive = (summary?.salesGrowthPercent ?? 0) >= 0;

  // New Customers calculation
  const newCustomersCount = summary
    ? (summary.newCustomersMonth || summary.totalCustomers)
    : 0;
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
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-medium text-rose-700" role="alert">
          {error}
        </div>
      ) : null}

      {/* ================= 1. KEY PERFORMANCE METRICS ROW ================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={totalSalesFormatted}
          change={salesGrowthText}
          isPositive={salesGrowthPositive}
          subtitle={summary?.totalSalesMonth ? "This month" : "All time"}
          colorVariant="red"
          icon={<Banknote className="size-4" />}
        />
        <StatCard
          title="New Customers"
          value={newCustomersCount}
          change={customersGrowthText}
          isPositive={customersGrowthPositive}
          subtitle={summary?.newCustomersMonth ? "This month" : "Total unique"}
          colorVariant="blue"
          icon={<Users className="size-4" />}
        />
        <StatCard
          title="Open Orders"
          value={openOrdersCount}
          subtitle="Awaiting fulfillment"
          colorVariant="purple"
          icon={<ShoppingBag className="size-4" />}
        />
        <StatCard
          title="Conversion Rate"
          value={conversionRateFormatted}
          change={conversionGrowthText}
          isPositive={conversionGrowthPositive}
          subtitle="Storefront visits"
          colorVariant="green"
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      {/* ================= 2. SALES CHART & RECENT ORDERS ROW ================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <OrderOverviewChart overview={metrics.orderOverview} />
        </div>
        <div className="lg:col-span-4">
          <RecentOrdersList orders={metrics.recentOrders} />
        </div>
      </div>

      {/* ================= 3. BEST-SELLING PRODUCTS SHOWCASE ================= */}
      <div>
        <BestSellingProducts items={metrics.bestSellingProducts} />
      </div>

      {/* ================= 4. INVENTORY & CUSTOMER INSIGHTS ROW ================= */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="flex flex-col lg:col-span-6">
          <InventorySnapshotChart
            inventory={metrics.inventorySnapshot}
            className="h-full"
          />
        </div>
        <div className="flex flex-col lg:col-span-6">
          <CustomerInsights
            demographics={metrics.customerInsights?.demographics}
            retentionRate={metrics.customerInsights?.retentionRate}
            repeatCustomersCount={metrics.customerInsights?.repeatCustomersCount}
            topLocations={metrics.customerInsights?.topLocations}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}


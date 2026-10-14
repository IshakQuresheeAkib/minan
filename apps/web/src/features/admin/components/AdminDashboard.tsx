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
  const adminName = metrics.adminProfile?.displayName || "Admin";

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
      {/* ================= GREETING HEADER ================= */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-secondary/15 to-white/90 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(245,184,54,0.12)]">
        {/* Soft Ambient Brand Glows */}
        <div className="pointer-events-none absolute -right-6 -top-6 size-40 rounded-full bg-gradient-to-br from-primary/20 via-secondary/25 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute right-24 -bottom-8 size-28 rounded-full bg-secondary/20 blur-xl" />

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 px-3 py-1 text-[11px] font-bold text-amber-900 shadow-xs backdrop-blur-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <span>MINAN Live Store Operations</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#1A1715] sm:text-3xl">
              Welcome back, {adminName}!
            </h1>
            <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
              Here&apos;s an overview of your store performance, orders, and inventory.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur-xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Sylhet Hub Active</span>
            </div>
          </div>
        </div>
      </div>

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
          colorVariant="primary"
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
          colorVariant="secondary"
          icon={<ShoppingBag className="size-4" />}
        />
        <StatCard
          title="Conversion Rate"
          value={conversionRateFormatted}
          change={conversionGrowthText}
          isPositive={conversionGrowthPositive}
          subtitle="Storefront visits"
          colorVariant="red"
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


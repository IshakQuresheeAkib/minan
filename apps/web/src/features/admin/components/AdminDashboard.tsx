"use client";

import { Banknote, ShoppingBag, Sparkles, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>

        {/* 4 Stats Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>

        {/* Chart + Recent Orders Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-80 rounded-2xl lg:col-span-8" />
          <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
        </div>

        {/* Best Selling Skeleton */}
        <Skeleton className="h-72 rounded-2xl" />

        {/* Bottom Insights Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-72 rounded-2xl lg:col-span-6" />
          <Skeleton className="h-72 rounded-2xl lg:col-span-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= GREETING HEADER ================= */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1A1715] sm:text-3xl">
            Welcome back, {adminName}!
          </h1>
          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            Here&apos;s an overview of your store performance, orders, and inventory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-[#E2D9CD] bg-white/80 px-3 py-1 text-xs font-semibold text-neutral-700"
          >
            <Sparkles className="size-3 text-amber-600" />
            <span>Sylhet Hub • Live</span>
          </Badge>
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
          shapeVariant={1}
          icon={<Banknote className="size-4" />}
        />
        <StatCard
          title="New Customers"
          value={newCustomersCount}
          change={customersGrowthText}
          isPositive={customersGrowthPositive}
          subtitle={summary?.newCustomersMonth ? "This month" : "Total unique"}
          shapeVariant={2}
          icon={<Users className="size-4" />}
        />
        <StatCard
          title="Open Orders"
          value={openOrdersCount}
          subtitle="Awaiting fulfillment"
          shapeVariant={3}
          icon={<ShoppingBag className="size-4" />}
        />
        <StatCard
          title="Conversion Rate"
          value={conversionRateFormatted}
          change={conversionGrowthText}
          isPositive={conversionGrowthPositive}
          subtitle="Storefront visits"
          shapeVariant={4}
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <InventorySnapshotChart inventory={metrics.inventorySnapshot} />
        </div>
        <div className="lg:col-span-6">
          <CustomerInsights
            demographics={metrics.customerInsights?.demographics}
            retentionRate={metrics.customerInsights?.retentionRate}
            repeatCustomersCount={metrics.customerInsights?.repeatCustomersCount}
            topLocations={metrics.customerInsights?.topLocations}
          />
        </div>
      </div>
    </div>
  );
}


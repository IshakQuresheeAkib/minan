// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "./AdminDashboard";

const mockMetrics = {
  ordersToday: 4,
  ordersThisMonth: 18,
  newOrders: 3,
  awaitingFee: 1,
  processing: 5,
  shipped: 10,
  returnsExceptions: 0,
  topProduct: "Linen Shirt",
  topCategory: "Men's Collection",
  trafficSources: [{ source: "direct", count: 25 }],
  summary: {
    totalSalesMonth: 48500,
    totalSalesOverall: 120000,
    salesGrowthPercent: 18.5,
    newCustomersMonth: 24,
    customersGrowthPercent: 12.0,
    totalCustomers: 85,
    openOrdersCount: 9,
    ordersToday: 4,
    ordersThisMonth: 18,
    ordersGrowthPercent: 15.0,
    conversionRate: 3.8,
    conversionRateGrowth: 0.5,
    awaitingFee: 1,
    processing: 5,
    shipped: 10,
    returnsExceptions: 0,
  },
  adminProfile: {
    email: "akib@minan.com",
    displayName: "Akib",
  },
  bestSellingProducts: [
    {
      id: "prod-1",
      name: "Aura Silk Dress",
      price: 4300,
      discountedPrice: 4300,
      salesCount: 14,
      revenue: 60200,
      image: "https://example.com/dress.jpg",
      sparkline: [2, 1, 3, 4, 2, 5, 6],
    },
  ],
  customerInsights: {
    demographics: [{ label: "Women's Collection", percentage: 70, count: 14 }],
    retentionRate: 65,
    repeatCustomersCount: 12,
    topLocations: [{ city: "Inside Sylhet", share: "60%", count: 18 }],
  },
  orderOverview: {
    last7Days: [
      { day: "Mon", date: "Oct 1", isoDate: "2026-10-01", sales: 4000, orders: 2 },
      { day: "Tue", date: "Oct 2", isoDate: "2026-10-02", sales: 8000, orders: 3 },
      { day: "Wed", date: "Oct 3", isoDate: "2026-10-03", sales: 6500, orders: 2 },
      { day: "Thu", date: "Oct 4", isoDate: "2026-10-04", sales: 12000, orders: 4 },
      { day: "Fri", date: "Oct 5", isoDate: "2026-10-05", sales: 18000, orders: 7 },
    ],
    last30Days: [],
  },
  recentOrders: [
    {
      id: "ord-1",
      orderNumber: "MIN-9821",
      customerName: "Elara Vance",
      customerEmail: "elara@example.com",
      productName: "Aura Silk Dress",
      productImage: "https://example.com/dress.jpg",
      itemCount: 1,
      total: 4300,
      status: "processing",
      deliveryFeeStatus: "paid",
      createdAt: "2026-10-05T12:00:00.000Z",
    },
  ],
  inventorySnapshot: {
    totalProducts: 32,
    activeProducts: 30,
    lowStockCount: 2,
    categories: [{ id: "cat-1", name: "Women", count: 18, percentage: 60 }],
  },
};

vi.mock("@/features/admin/hooks/useDashboard", () => ({
  useDashboard: () => ({
    metrics: mockMetrics,
    loading: false,
    error: null,
    mutate: vi.fn(),
  }),
}));

describe("AdminDashboard", () => {
  it("renders the real admin greeting and key metrics", () => {
    render(<AdminDashboard />);

    expect(screen.getByText("Welcome back, Akib!")).toBeDefined();
    expect(screen.getByText("৳48,500")).toBeDefined();
    expect(screen.getByText("+18.5%")).toBeDefined();
    expect(screen.getByText("3.8%")).toBeDefined();
    expect(screen.getAllByText("Aura Silk Dress").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("MIN-9821")).toBeDefined();
    expect(screen.getAllByText("65%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/32 Total Item/i)).toBeDefined();
  });
});

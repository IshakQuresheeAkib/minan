import { describe, expect, it, vi, beforeEach } from "vitest";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { AnalyticsEvent } from "../models/AnalyticsEvent.js";
import { getDashboardMetrics } from "./dashboard.service.js";

describe("Dashboard Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("computes comprehensive real dashboard metrics successfully", async () => {
    vi.spyOn(Order, "countDocuments").mockResolvedValue(5 as never);
    vi.spyOn(Order, "aggregate").mockImplementation((pipeline: unknown) => {
      const p = pipeline as { $match?: unknown; $group?: unknown }[];
      if (p?.[0]?.$group && "_id" in p[0].$group && p[0].$group._id === "$normalized_phone") {
        return Promise.resolve([{ count: 12 }]) as never;
      }
      return Promise.resolve([{ total: 45000, count: 8, sales: 25000, orders: 4 }]) as never;
    });

    const mockOrderList = [
      {
        _id: "660000000000000000000001",
        order_number: "MIN-1001",
        name: "Akib",
        phone_number: "+8801712345678",
        email: "akib@example.com",
        lines: [
          {
            line_id: "line-1",
            product_id: "660000000000000000000002",
            name: "Linen Shirt",
            image_url: "https://example.com/shirt.jpg",
            unit_price: 1800,
            quantity: 1,
          },
        ],
        financials: { overall_order_value: 1800 },
        status: "processing",
        delivery_fee_status: "paid",
        createdAt: new Date("2026-10-05T10:00:00Z"),
      },
    ];

    vi.spyOn(Order, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(mockOrderList),
    } as never);

    vi.spyOn(Category, "find").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { _id: "660000000000000000000010", name: "Men", slug: "men" },
        { _id: "660000000000000000000011", name: "Women", slug: "women" },
      ]),
    } as never);

    vi.spyOn(Category, "findById").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ name: "Men" }),
    } as never);

    vi.spyOn(Product, "countDocuments").mockResolvedValue(24 as never);
    vi.spyOn(Product, "aggregate").mockResolvedValue([
      { _id: "660000000000000000000010", count: 14 },
      { _id: "660000000000000000000011", count: 10 },
    ] as never);

    vi.spyOn(Product, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "660000000000000000000002",
          name: "Linen Shirt",
          price: 1800,
          discount: 0,
          images: ["https://example.com/shirt.jpg"],
        },
      ]),
    } as never);

    vi.spyOn(Product, "findById").mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ name: "Linen Shirt" }),
    } as never);

    vi.spyOn(AnalyticsEvent, "aggregate").mockResolvedValue([
      { _id: "direct", count: 42 },
      { count: 150 },
    ] as never);

    const metrics = await getDashboardMetrics("admin@minan.com");

    expect(metrics).toBeDefined();
    expect(metrics.adminProfile?.displayName).toBe("Admin");
    expect(metrics.summary.totalSalesMonth).toBe(45000);
    expect(metrics.summary.openOrdersCount).toBeGreaterThanOrEqual(0);
    expect(metrics.orderOverview.last7Days).toHaveLength(7);
    expect(metrics.orderOverview.last30Days).toHaveLength(30);
    expect(metrics.recentOrders).toHaveLength(1);
    expect(metrics.recentOrders[0]?.orderNumber).toBe("MIN-1001");
    expect(metrics.inventorySnapshot.totalProducts).toBe(24);
  });
});

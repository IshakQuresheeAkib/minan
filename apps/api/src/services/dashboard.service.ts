import { AnalyticsEvent } from "../models/AnalyticsEvent.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

const BANGLADESH_UTC_OFFSET_MS = 6 * 60 * 60 * 1000;

export type DashboardMetrics = {
  ordersToday: number;
  ordersThisMonth: number;
  newOrders: number;
  awaitingFee: number;
  processing: number;
  shipped: number;
  returnsExceptions: number;
  topProduct: string | null;
  topCategory: string | null;
  trafficSources: {
    source: string;
    count: number;
  }[];
};

type CountResult<TId> = {
  _id: TId;
  count: number;
};

function getBangladeshDayRange(now = new Date()) {
  const bdNow = new Date(now.getTime() + BANGLADESH_UTC_OFFSET_MS);
  const year = bdNow.getUTCFullYear();
  const month = bdNow.getUTCMonth();
  const day = bdNow.getUTCDate();

  return {
    start: new Date(Date.UTC(year, month, day) - BANGLADESH_UTC_OFFSET_MS),
    end: new Date(Date.UTC(year, month, day + 1) - BANGLADESH_UTC_OFFSET_MS),
  };
}

function getBangladeshMonthRange(now = new Date()) {
  const bdNow = new Date(now.getTime() + BANGLADESH_UTC_OFFSET_MS);
  const year = bdNow.getUTCFullYear();
  const month = bdNow.getUTCMonth();

  return {
    start: new Date(Date.UTC(year, month, 1) - BANGLADESH_UTC_OFFSET_MS),
    end: new Date(Date.UTC(year, month + 1, 1) - BANGLADESH_UTC_OFFSET_MS),
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = getBangladeshDayRange();
  const month = getBangladeshMonthRange();

  const [
    ordersToday,
    ordersThisMonth,
    newOrders,
    awaitingFee,
    processing,
    shipped,
    returnsExceptions,
    topProductResults,
    topCategoryResults,
    trafficSourceResults,
  ] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: today.start, $lt: today.end } }),
    Order.countDocuments({ createdAt: { $gte: month.start, $lt: month.end } }),
    Order.countDocuments({ status: "new" }),
    Order.countDocuments({ delivery_fee_status: { $in: ["awaiting", "failed", "verification_pending", "expired"] } }),
    Order.countDocuments({ status: "processing" }),
    Order.countDocuments({ status: "shipped" }),
    Order.countDocuments({ $or: [{ status: { $in: ["returned", "exchanged", "on_hold"] } }, { financial_review_required: true }] }),
    AnalyticsEvent.aggregate<CountResult<unknown>>([
      { $match: { event_type: "product_view", product_id: { $exists: true } } },
      { $group: { _id: "$product_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    AnalyticsEvent.aggregate<CountResult<unknown>>([
      { $match: { event_type: "product_view", category_id: { $exists: true } } },
      { $group: { _id: "$category_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    AnalyticsEvent.aggregate<CountResult<string | null>>([
      { $group: { _id: "$utm_source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const topProductId = topProductResults[0]?._id;
  const topCategoryId = topCategoryResults[0]?._id;

  const [topProduct, topCategory] = await Promise.all([
    topProductId ? Product.findById(topProductId).select("name").lean() : null,
    topCategoryId
      ? Category.findById(topCategoryId).select("name").lean()
      : null,
  ]);

  return {
    ordersToday,
    ordersThisMonth,
    newOrders,
    awaitingFee,
    processing,
    shipped,
    returnsExceptions,
    topProduct: topProduct?.name ?? null,
    topCategory: topCategory?.name ?? null,
    trafficSources: trafficSourceResults.map((item) => ({
      source: item._id?.trim() || "direct",
      count: item.count,
    })),
  };
}

import { normalizeEmail } from "../lib/normalizeEmail.js";

export type OrderTrackingMigrationSource<Id = unknown> = {
  _id: Id;
  email?: unknown;
  normalized_email?: unknown;
  guest_access_version?: unknown;
};

export type OrderTrackingMigrationChange<Id = unknown> = {
  _id: Id;
  match: {
    email: string;
    normalized_email?: unknown;
    guest_access_version?: unknown;
  };
  set: {
    normalized_email?: string;
    guest_access_version?: number;
  };
};

export type OrderTrackingMigrationPlan<Id = unknown> = {
  changes: OrderTrackingMigrationChange<Id>[];
  unresolved: { _id: Id; reason: string }[];
};

function hasGuestAccessVersion(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

export function planOrderTrackingMigration<Id>(
  orders: readonly OrderTrackingMigrationSource<Id>[],
): OrderTrackingMigrationPlan<Id> {
  const changes: OrderTrackingMigrationChange<Id>[] = [];
  const unresolved: { _id: Id; reason: string }[] = [];

  for (const order of orders) {
    if (typeof order.email !== "string" || normalizeEmail(order.email).length === 0) {
      unresolved.push({ _id: order._id, reason: "Order has no usable email snapshot" });
      continue;
    }

    const normalizedEmail = normalizeEmail(order.email);
    const set: OrderTrackingMigrationChange<Id>["set"] = {};
    const match: OrderTrackingMigrationChange<Id>["match"] = {
      email: order.email,
    };
    if (order.normalized_email !== normalizedEmail) {
      set.normalized_email = normalizedEmail;
      match.normalized_email = order.normalized_email === undefined
        ? { $exists: false }
        : order.normalized_email;
    }
    if (!hasGuestAccessVersion(order.guest_access_version)) {
      set.guest_access_version = 1;
      match.guest_access_version = order.guest_access_version === undefined
        ? { $exists: false }
        : order.guest_access_version;
    }
    if (Object.keys(set).length > 0) {
      changes.push({ _id: order._id, match, set });
    }
  }

  return { changes, unresolved };
}

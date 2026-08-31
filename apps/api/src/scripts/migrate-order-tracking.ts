import "../config/env.js";

import { pathToFileURL } from "node:url";

import { connectDB, disconnectDB } from "../config/db.js";
import { Order } from "../models/Order.js";
import { planOrderTrackingMigration } from "./orderTrackingMigration.js";

export type OrderTrackingMigrationSummary = {
  planned: number;
  unresolved: number;
  modified: number;
};

export type OrderTrackingMigrationLogger = Pick<Console, "log" | "error">;

export async function migrateOrderTracking(
  applyChanges = false,
  logger: OrderTrackingMigrationLogger = console,
): Promise<OrderTrackingMigrationSummary> {
  await connectDB();
  const orders = await Order.collection.find(
    {},
    {
      projection: {
        _id: 1,
        email: 1,
        normalized_email: 1,
        guest_access_version: 1,
      },
    },
  ).toArray();
  const plan = planOrderTrackingMigration(orders);

  logger.log(
    `${applyChanges ? "APPLY" : "DRY RUN"}: ${plan.changes.length} Orders to backfill, ${plan.unresolved.length} unresolved.`,
  );

  for (const unresolved of plan.unresolved) {
    logger.error(`Unresolved Order ${String(unresolved._id)}: ${unresolved.reason}`);
  }

  if (plan.unresolved.length > 0 && applyChanges) {
    throw new Error("Order tracking migration refused because unresolved Orders remain");
  }

  if (!applyChanges || plan.changes.length === 0) {
    if (!applyChanges) {
      logger.log("No records changed. Re-run with --apply after reviewing the dry run.");
    }
    return {
      planned: plan.changes.length,
      unresolved: plan.unresolved.length,
      modified: 0,
    };
  }

  const result = await Order.collection.bulkWrite(
    plan.changes.map((change) => ({
      updateOne: {
        filter: { _id: change._id, ...change.match },
        update: { $set: change.set },
      },
    })),
    { ordered: false },
  );

  const concurrentChanges = plan.changes.length - result.matchedCount;
  if (concurrentChanges > 0) {
    throw new Error(
      `Order tracking migration detected ${concurrentChanges} concurrent ${concurrentChanges === 1 ? "change" : "changes"}; re-run the dry run`,
    );
  }

  logger.log(`Order tracking migration complete: ${result.modifiedCount} Orders updated.`);
  return {
    planned: plan.changes.length,
    unresolved: plan.unresolved.length,
    modified: result.modifiedCount,
  };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  migrateOrderTracking(process.argv.includes("--apply"))
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error("Order tracking migration failed:", error);
      await disconnectDB();
      process.exit(1);
    });
}

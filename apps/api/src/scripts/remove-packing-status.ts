import "../config/env.js";

import { pathToFileURL } from "node:url";

import { connectDB, disconnectDB } from "../config/db.js";
import { Order } from "../models/Order.js";

const apply = process.argv.includes("--apply");

export async function removePackingStatus(applyChanges = apply): Promise<void> {
  await connectDB();

  const filter = { $or: [{ status: "packing" }, { held_from_status: "packing" }] };
  const affected = await Order.collection.countDocuments(filter);
  console.log(`${applyChanges ? "APPLY" : "DRY RUN"}: ${affected} Orders require the Packing-to-Processing migration.`);

  if (affected === 0) return;
  if (!applyChanges) {
    console.log("No records changed. Re-run with --apply after reviewing the count.");
    return;
  }

  const migratedAt = new Date();
  const result = await Order.collection.updateMany(filter, [
    {
      $set: {
        status: { $cond: [{ $eq: ["$status", "packing"] }, "processing", "$status"] },
        held_from_status: { $cond: [{ $eq: ["$held_from_status", "packing"] }, "processing", "$held_from_status"] },
        updatedAt: migratedAt,
        activity: {
          $concatArrays: [
            { $ifNull: ["$activity", []] },
            [{
              actor_type: "migration",
              event: "packing_status_merged_into_processing",
              metadata: { packing_status_merged: true },
              created_at: migratedAt,
            }],
          ],
        },
      },
    },
  ]);
  console.log(`Migrated ${result.modifiedCount} Orders from Packing to Processing.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  removePackingStatus()
    .then(async () => { await disconnectDB(); process.exit(0); })
    .catch(async (error: unknown) => { console.error("Packing-status migration failed:", error); await disconnectDB(); process.exit(1); });
}

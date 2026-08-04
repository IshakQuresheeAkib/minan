import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { Lead } from "../models/Lead.js";
import { leadCheckoutMigrationOperations } from "./leadCheckoutMigration.js";

const apply = process.argv.includes("--apply");

async function migrateLeadCheckout(): Promise<void> {
  await connectDB();
  const collection = Lead.collection;
  const [legacyPaymentField, legacyStatus, missingDelivery, missingSource] = await Promise.all([
    collection.countDocuments({ bkash_txn_id: { $exists: true } }),
    collection.countDocuments({ status: { $exists: true } }),
    collection.countDocuments({ delivery_status: { $exists: false } }),
    collection.countDocuments({ checkout_source: { $exists: false } }),
  ]);

  console.log(
    `${apply ? "APPLY" : "DRY RUN"}: ${legacyPaymentField} legacy payment fields, ` +
      `${legacyStatus} legacy statuses, ${missingDelivery} missing delivery statuses, ` +
      `${missingSource} missing checkout sources.`,
  );
  if (!apply) {
    console.log("No records changed. Re-run with --apply after reviewing these counts.");
    return;
  }

  const result = await collection.bulkWrite(leadCheckoutMigrationOperations());
  console.log(`Migration complete: ${result.modifiedCount} document updates applied.`);
}

migrateLeadCheckout()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Lead checkout migration failed:", error);
    await disconnectDB();
    process.exit(1);
  });

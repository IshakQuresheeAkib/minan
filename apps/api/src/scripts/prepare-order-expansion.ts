import "../config/env.js";

import { connectDB, disconnectDB } from "../config/db.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";

const apply = process.argv.includes("--apply");

async function prepare(): Promise<void> {
  await connectDB();
  const indexes = await PaymentAttempt.collection.indexes();
  const legacyFullIndex = indexes.find((index) =>
    index.unique === true &&
    index.key.lead_id === 1 &&
    index.key.sequence === 1 &&
    !index.partialFilterExpression,
  );
  console.log(`${apply ? "APPLY" : "DRY RUN"}: legacy full relationship index ${legacyFullIndex ? legacyFullIndex.name : "not present"}.`);
  if (!apply) {
    console.log("No indexes changed. Re-run with --apply before deploying Order-based payment creation.");
    return;
  }
  if (legacyFullIndex?.name) await PaymentAttempt.collection.dropIndex(legacyFullIndex.name);
  await Promise.all([
    PaymentAttempt.collection.createIndex(
      { lead_id: 1, sequence: 1 },
      { name: "lead_sequence_partial_unique", unique: true, partialFilterExpression: { lead_id: { $type: "objectId" } } },
    ),
    PaymentAttempt.collection.createIndex(
      { order_id: 1, sequence: 1 },
      { name: "order_sequence_partial_unique", unique: true, partialFilterExpression: { order_id: { $type: "objectId" } } },
    ),
    PaymentAttempt.collection.createIndex(
      { order_id: 1 },
      { name: "order_relationship_partial", partialFilterExpression: { order_id: { $type: "objectId" } } },
    ),
  ]);
  console.log("Payment-attempt compatibility indexes are ready.");
}

prepare()
  .then(async () => { await disconnectDB(); process.exit(0); })
  .catch(async (error: unknown) => { console.error("Order expansion preparation failed:", error); await disconnectDB(); process.exit(1); });

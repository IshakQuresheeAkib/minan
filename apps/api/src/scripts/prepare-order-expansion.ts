import "../config/env.js";

import { pathToFileURL } from "node:url";

import { connectDB, disconnectDB } from "../config/db.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";

const apply = process.argv.includes("--apply");

type PaymentAttemptIndex = {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
  partialFilterExpression?: Record<string, unknown>;
};

type IndexDefinition = {
  key: Record<string, 1>;
  unique?: boolean;
  partialFilterExpression?: Record<string, unknown>;
  name: string;
};

function sameDocument(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);
  return leftEntries.length === rightEntries.length && leftEntries.every(
    ([key, value]) => right[key] === value,
  );
}

export function hasCompatibleIndex(
  indexes: PaymentAttemptIndex[],
  expected: IndexDefinition,
): boolean {
  return indexes.some((index) =>
    sameDocument(index.key, expected.key) &&
    Boolean(index.unique) === Boolean(expected.unique) &&
    JSON.stringify(index.partialFilterExpression ?? null) ===
      JSON.stringify(expected.partialFilterExpression ?? null),
  );
}

async function ensureIndex(
  indexes: PaymentAttemptIndex[],
  expected: IndexDefinition,
): Promise<void> {
  if (hasCompatibleIndex(indexes, expected)) {
    console.log(`Compatible index already exists for ${expected.name}.`);
    return;
  }
  const sameKeyIndexes = indexes.filter((index) => sameDocument(index.key, expected.key));
  if (sameKeyIndexes.length > 0) {
    throw new Error(
      `Cannot create ${expected.name}: incompatible index already exists (${sameKeyIndexes.map((index) => index.name ?? "unnamed").join(", ")}).`,
    );
  }
  await PaymentAttempt.collection.createIndex(expected.key, {
    name: expected.name,
    unique: expected.unique,
    partialFilterExpression: expected.partialFilterExpression,
  });
}

export async function prepare(applyChanges = apply): Promise<void> {
  await connectDB();
  let indexes = await PaymentAttempt.collection.indexes() as PaymentAttemptIndex[];
  const legacyFullIndex = indexes.find((index) =>
    index.unique === true &&
    index.key.lead_id === 1 &&
    index.key.sequence === 1 &&
    !index.partialFilterExpression,
  );
  console.log(`${applyChanges ? "APPLY" : "DRY RUN"}: legacy full relationship index ${legacyFullIndex ? legacyFullIndex.name : "not present"}.`);
  if (!applyChanges) {
    console.log("No indexes changed. Re-run with --apply before deploying Order-based payment creation.");
    return;
  }
  if (legacyFullIndex?.name) {
    await PaymentAttempt.collection.dropIndex(legacyFullIndex.name);
    indexes = await PaymentAttempt.collection.indexes() as PaymentAttemptIndex[];
  }
  await ensureIndex(indexes, {
    key: { lead_id: 1, sequence: 1 },
    name: "lead_sequence_partial_unique",
    unique: true,
    partialFilterExpression: { lead_id: { $type: "objectId" } },
  });
  await ensureIndex(indexes, {
    key: { order_id: 1, sequence: 1 },
    name: "order_sequence_partial_unique",
    unique: true,
    partialFilterExpression: { order_id: { $type: "objectId" } },
  });
  await ensureIndex(indexes, {
    key: { order_id: 1 },
    name: "order_relationship_partial",
    partialFilterExpression: { order_id: { $type: "objectId" } },
  });
  console.log("Payment-attempt compatibility indexes are ready.");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  prepare()
    .then(async () => { await disconnectDB(); process.exit(0); })
    .catch(async (error: unknown) => { console.error("Order expansion preparation failed:", error); await disconnectDB(); process.exit(1); });
}

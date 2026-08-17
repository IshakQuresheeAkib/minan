import "../config/env.js";

import { pathToFileURL } from "node:url";
import type { Document, Filter } from "mongodb";

import { connectDB, disconnectDB } from "../config/db.js";
import { AdminUser } from "../models/AdminUser.js";

const apply = process.argv.includes("--apply");

const riskyInactiveAdminFilter: Filter<Document> = {
  is_active: false,
  $or: [
    { session_version: { $exists: false } },
    { session_version: 0 },
    { refresh_token_hash: { $type: "string" } },
    { previous_refresh_token_hash: { $type: "string" } },
  ],
};

export async function cleanupInactiveAdminSessions(
  applyChanges = apply,
): Promise<void> {
  await connectDB();

  const affected = await AdminUser.collection.countDocuments(
    riskyInactiveAdminFilter,
  );
  console.log(
    `${applyChanges ? "APPLY" : "DRY RUN"}: ${affected} inactive admin account(s) require session cleanup.`,
  );

  if (affected === 0) {
    return;
  }

  if (!applyChanges) {
    console.log(
      "No records changed. Re-run with --apply after reviewing the count.",
    );
    return;
  }

  const result = await AdminUser.collection.updateMany(
    riskyInactiveAdminFilter,
    {
      $set: {
        refresh_token_hash: null,
        previous_refresh_token_hash: null,
      },
      $inc: { session_version: 1 },
    },
  );
  console.log(
    `Cleaned sessions for ${result.modifiedCount} inactive admin account(s).`,
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  cleanupInactiveAdminSessions()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (error: unknown) => {
      console.error("Inactive admin session cleanup failed:", error);
      await disconnectDB();
      process.exit(1);
    });
}

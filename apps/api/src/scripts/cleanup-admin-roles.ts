import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { AdminUser } from "../models/AdminUser.js";

async function cleanupAdminRoles(): Promise<void> {
  await connectDB();

  const result = await AdminUser.collection.updateMany(
    { role: { $exists: true } },
    { $unset: { role: "" } },
  );

  console.log(
    `Removed legacy role field from ${result.modifiedCount} admin user(s).`,
  );
}

cleanupAdminRoles()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Admin role cleanup failed:", error);
    await disconnectDB();
    process.exit(1);
  });

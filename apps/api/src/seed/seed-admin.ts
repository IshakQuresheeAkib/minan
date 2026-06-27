import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { AdminUser } from "../models/AdminUser.js";
import type { AdminRole } from "../types/auth.types.js";

function isAdminRole(value: string): value is AdminRole {
  return value === "general" || value === "premium";
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const roleValue = process.env.ADMIN_ROLE?.trim() ?? "general";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment",
    );
  }

  if (!isAdminRole(roleValue)) {
    throw new Error('ADMIN_ROLE must be "general" or "premium"');
  }

  await connectDB();

  const existing = await AdminUser.findOne({ email });

  if (existing) {
    existing.password = password;
    existing.role = roleValue;
    existing.is_active = true;
    await existing.save();
    console.log(`Updated admin user: ${email} (${roleValue})`);
  } else {
    await AdminUser.create({
      email,
      password,
      role: roleValue,
      is_active: true,
    });
    console.log(`Created admin user: ${email} (${roleValue})`);
  }
}

seedAdmin()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("Admin seed failed:", error);
    await disconnectDB();
    process.exit(1);
  });

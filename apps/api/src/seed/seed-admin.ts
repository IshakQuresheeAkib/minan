import "dotenv/config";

import { connectDB, disconnectDB } from "../config/db.js";
import { AdminUser } from "../models/AdminUser.js";

export async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password || password.trim().length === 0) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment",
    );
  }

  if (
    process.env.NODE_ENV === "production" &&
    password === "replace_with_secure_admin_password"
  ) {
    throw new Error(
      "Refusing to seed admin with template placeholder password in production",
    );
  }

  await connectDB();

  const existing = await AdminUser.findOne({ email });

  if (existing) {
    existing.password = password;
    existing.is_active = true;
    await existing.save();
    console.log(`Updated admin user: ${email}`);
  } else {
    await AdminUser.create({
      email,
      password,
      is_active: true,
    });
    console.log(`Created admin user: ${email}`);
  }
}

if (process.argv[1] && process.argv[1].includes("seed-admin")) {
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
}

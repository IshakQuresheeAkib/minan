import { Types } from "mongoose";

import { AppError } from "../lib/errors.js";
import { throwIfDuplicateKey } from "../lib/mongoErrors.js";
import { AdminUser } from "../models/AdminUser.js";
import type {
  AdminCreateInput,
  AdminUpdateInput,
} from "../schemas/admin.schemas.js";
import type { AdminUserListResponse } from "../types/admin.types.js";
import { serializeAdmin } from "../utils/serializeAdmin.js";

function assertSelfModificationAllowed(
  actorId: string,
  targetId: string,
  input: AdminUpdateInput,
  currentRole: "general" | "premium",
): void {
  if (actorId !== targetId) {
    return;
  }

  if (input.role !== undefined && input.role !== currentRole) {
    throw new AppError("You cannot change your own role", 400);
  }

  if (input.is_active === false) {
    throw new AppError("You cannot deactivate your own account", 400);
  }
}

export async function listAdminUsers(): Promise<AdminUserListResponse> {
  const admins = await AdminUser.find().sort({ createdAt: -1 });

  return {
    data: admins.map(serializeAdmin),
    total: admins.length,
  };
}

export async function createAdminUser(input: AdminCreateInput) {
  try {
    const admin = await AdminUser.create({
      email: input.email.toLowerCase().trim(),
      password: input.password,
      role: input.role,
      is_active: true,
    });

    return serializeAdmin(admin);
  } catch (error) {
    throwIfDuplicateKey(error, "Admin email already exists");
  }
}

export async function updateAdminUser(
  actorId: string,
  id: string,
  input: AdminUpdateInput,
) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid admin id", 400);
  }

  const admin = await AdminUser.findById(id);
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  assertSelfModificationAllowed(actorId, id, input, admin.role);

  if (input.email !== undefined) {
    admin.email = input.email.toLowerCase().trim();
  }

  if (input.role !== undefined) {
    admin.role = input.role;
  }

  if (input.is_active !== undefined) {
    admin.is_active = input.is_active;
  }

  try {
    await admin.save();
    return serializeAdmin(admin);
  } catch (error) {
    throwIfDuplicateKey(error, "Admin email already exists");
  }
}

export async function deactivateAdminUser(actorId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid admin id", 400);
  }

  if (actorId === id) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  const admin = await AdminUser.findById(id);
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  admin.is_active = false;
  await admin.save();
  return serializeAdmin(admin);
}

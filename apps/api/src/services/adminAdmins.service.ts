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

function deactivateAndRevokeSessions(admin: {
  is_active: boolean;
  session_version: number;
  refresh_token_hash: string | null;
  previous_refresh_token_hash: string | null;
}): void {
  if (!admin.is_active) {
    return;
  }

  admin.is_active = false;
  admin.session_version += 1;
  admin.refresh_token_hash = null;
  admin.previous_refresh_token_hash = null;
}

function assertSelfDeactivationAllowed(
  actorId: string,
  targetId: string,
  input: AdminUpdateInput,
): void {
  if (actorId !== targetId) {
    return;
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

  assertSelfDeactivationAllowed(actorId, id, input);

  if (input.email !== undefined) {
    admin.email = input.email.toLowerCase().trim();
  }

  if (input.is_active !== undefined) {
    if (input.is_active) {
      admin.is_active = true;
    } else {
      deactivateAndRevokeSessions(admin);
    }
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

  deactivateAndRevokeSessions(admin);
  await admin.save();
  return serializeAdmin(admin);
}

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

function sessionVersionFilter(sessionVersion: number) {
  return sessionVersion === 0
    ? {
        $or: [
          { session_version: 0 },
          { session_version: { $exists: false } },
        ],
      }
    : { session_version: sessionVersion };
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

  if (input.is_active === false && admin.is_active) {
    try {
      const deactivated = await AdminUser.findOneAndUpdate(
        {
          _id: admin._id,
          is_active: true,
          ...sessionVersionFilter(admin.session_version),
        },
        {
          $set: {
            ...(input.email !== undefined
              ? { email: input.email.toLowerCase().trim() }
              : {}),
            is_active: false,
            refresh_token_hash: null,
            previous_refresh_token_hash: null,
          },
          $inc: { session_version: 1 },
        },
        { returnDocument: "after", runValidators: true },
      );

      if (!deactivated) {
        throw new AppError(
          "Admin status changed while updating; try again",
          409,
        );
      }

      return serializeAdmin(deactivated);
    } catch (error) {
      throwIfDuplicateKey(error, "Admin email already exists");
    }
  }

  if (input.is_active === true && !admin.is_active) {
    try {
      const reactivated = await AdminUser.findOneAndUpdate(
        { _id: admin._id, is_active: false },
        {
          $set: {
            ...(input.email !== undefined
              ? { email: input.email.toLowerCase().trim() }
              : {}),
            is_active: true,
            refresh_token_hash: null,
            previous_refresh_token_hash: null,
          },
          $inc: { session_version: 1 },
        },
        { returnDocument: "after", runValidators: true },
      );

      if (!reactivated) {
        throw new AppError(
          "Admin status changed while updating; try again",
          409,
        );
      }

      return serializeAdmin(reactivated);
    } catch (error) {
      throwIfDuplicateKey(error, "Admin email already exists");
    }
  }

  if (input.email !== undefined) {
    admin.email = input.email.toLowerCase().trim();
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

  const deactivated = await AdminUser.findOneAndUpdate(
    { _id: id, is_active: true },
    {
      $set: {
        is_active: false,
        refresh_token_hash: null,
        previous_refresh_token_hash: null,
      },
      $inc: { session_version: 1 },
    },
    { returnDocument: "after" },
  );

  if (deactivated) {
    return serializeAdmin(deactivated);
  }

  const admin = await AdminUser.findById(id);
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  return serializeAdmin(admin);
}

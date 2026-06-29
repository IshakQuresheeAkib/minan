import type { AdminUserDocument } from "../models/AdminUser.js";
import type { AdminUserResponse } from "../types/admin.types.js";

export function serializeAdmin(admin: AdminUserDocument): AdminUserResponse {
  return {
    _id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
    is_active: admin.is_active,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  };
}

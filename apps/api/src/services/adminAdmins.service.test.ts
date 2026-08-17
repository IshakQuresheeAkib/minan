import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminUser } from "../models/AdminUser.js";
import {
  deactivateAdminUser,
  updateAdminUser,
} from "./adminAdmins.service.js";

function activeAdmin() {
  return {
    _id: new Types.ObjectId(),
    email: "admin@example.com",
    is_active: true,
    session_version: 3,
    refresh_token_hash: "current-refresh-hash",
    previous_refresh_token_hash: "previous-refresh-hash",
    createdAt: new Date("2026-08-17T00:00:00.000Z"),
    updatedAt: new Date("2026-08-17T00:00:00.000Z"),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe("admin deactivation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("revokes every persisted refresh session and invalidates existing JWTs", async () => {
    const admin = activeAdmin();
    vi.spyOn(AdminUser, "findById").mockResolvedValue(admin as never);

    await deactivateAdminUser(new Types.ObjectId().toString(), admin._id.toString());

    expect(admin).toMatchObject({
      is_active: false,
      session_version: 4,
      refresh_token_hash: null,
      previous_refresh_token_hash: null,
    });
    expect(admin.save).toHaveBeenCalledOnce();
  });

  it("does not let refresh sessions revive when the generic endpoint reactivates an admin", async () => {
    const admin = activeAdmin();
    vi.spyOn(AdminUser, "findById").mockResolvedValue(admin as never);

    await updateAdminUser(
      new Types.ObjectId().toString(),
      admin._id.toString(),
      { is_active: false },
    );
    await updateAdminUser(
      new Types.ObjectId().toString(),
      admin._id.toString(),
      { is_active: true },
    );

    expect(admin).toMatchObject({
      is_active: true,
      session_version: 4,
      refresh_token_hash: null,
      previous_refresh_token_hash: null,
    });
  });
});

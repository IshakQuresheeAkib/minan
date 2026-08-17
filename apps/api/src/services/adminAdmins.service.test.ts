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

  it("atomically revokes every persisted refresh session and invalidates existing JWTs", async () => {
    const admin = activeAdmin();
    vi.spyOn(AdminUser, "findById").mockResolvedValue(admin as never);
    const deactivated = {
      ...admin,
      is_active: false,
      session_version: 4,
      refresh_token_hash: null,
      previous_refresh_token_hash: null,
    };
    const atomicUpdate = vi
      .spyOn(AdminUser, "findOneAndUpdate")
      .mockResolvedValue(deactivated as never);
    const targetId = admin._id.toString();

    await deactivateAdminUser(new Types.ObjectId().toString(), targetId);

    expect(atomicUpdate).toHaveBeenCalledWith(
      { _id: targetId, is_active: true },
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
    expect(admin.save).not.toHaveBeenCalled();
  });

  it("atomically deactivates through the generic update endpoint", async () => {
    const admin = activeAdmin();
    const deactivated = {
      ...admin,
      email: "updated@example.com",
      is_active: false,
      session_version: 4,
      refresh_token_hash: null,
      previous_refresh_token_hash: null,
    };
    vi.spyOn(AdminUser, "findById").mockResolvedValue(admin as never);
    const atomicUpdate = vi
      .spyOn(AdminUser, "findOneAndUpdate")
      .mockResolvedValue(deactivated as never);

    await updateAdminUser(
      new Types.ObjectId().toString(),
      admin._id.toString(),
      { email: "updated@example.com", is_active: false },
    );

    expect(atomicUpdate).toHaveBeenCalledWith(
      {
        _id: admin._id,
        is_active: true,
        session_version: 3,
      },
      {
        $set: {
          email: "updated@example.com",
          is_active: false,
          refresh_token_hash: null,
          previous_refresh_token_hash: null,
        },
        $inc: { session_version: 1 },
      },
      { returnDocument: "after", runValidators: true },
    );
    expect(admin.save).not.toHaveBeenCalled();
  });

  it("does not let refresh sessions revive when the generic endpoint reactivates an admin", async () => {
    const admin = activeAdmin();
    vi.spyOn(AdminUser, "findById").mockResolvedValue(admin as never);
    vi.spyOn(AdminUser, "findOneAndUpdate").mockImplementation(
      async (...args) => {
        const update = args[1] as {
          $set: {
            is_active: boolean;
            refresh_token_hash: null;
            previous_refresh_token_hash: null;
          };
          $inc: { session_version: number };
        };

        admin.is_active = update.$set.is_active;
        admin.session_version += update.$inc.session_version;
        admin.refresh_token_hash = update.$set.refresh_token_hash;
        admin.previous_refresh_token_hash =
          update.$set.previous_refresh_token_hash;
        return admin as never;
      },
    );

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
      session_version: 5,
      refresh_token_hash: null,
      previous_refresh_token_hash: null,
    });
  });

  it("reactivates an unversioned inactive admin with one atomic credential revocation", async () => {
    const admin = {
      ...activeAdmin(),
      is_active: false,
      session_version: undefined,
    };
    const reactivated = {
      ...admin,
      is_active: true,
      session_version: 1,
      refresh_token_hash: null,
      previous_refresh_token_hash: null,
    };
    vi.spyOn(AdminUser, "findById").mockResolvedValue(admin as never);
    const atomicUpdate = vi
      .spyOn(AdminUser, "findOneAndUpdate")
      .mockResolvedValue(reactivated as never);

    await updateAdminUser(
      new Types.ObjectId().toString(),
      admin._id.toString(),
      { is_active: true },
    );

    expect(atomicUpdate).toHaveBeenCalledWith(
      { _id: admin._id, is_active: false },
      {
        $set: {
          is_active: true,
          refresh_token_hash: null,
          previous_refresh_token_hash: null,
        },
        $inc: { session_version: 1 },
      },
      { returnDocument: "after", runValidators: true },
    );
    expect(admin.save).not.toHaveBeenCalled();
  });
});

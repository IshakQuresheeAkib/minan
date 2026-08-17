import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  argonHash: vi.fn(),
  argonVerify: vi.fn(),
  adminFindById: vi.fn(),
  adminFindOne: vi.fn(),
  adminFindOneAndUpdate: vi.fn(),
  adminUpdateOne: vi.fn(),
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyAdminPassword: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock("argon2", () => ({
  default: {
    hash: mocks.argonHash,
    verify: mocks.argonVerify,
  },
}));

vi.mock("../models/AdminUser.js", () => ({
  AdminUser: {
    findById: mocks.adminFindById,
    findOne: mocks.adminFindOne,
    findOneAndUpdate: mocks.adminFindOneAndUpdate,
    updateOne: mocks.adminUpdateOne,
  },
  verifyAdminPassword: mocks.verifyAdminPassword,
}));

vi.mock("../lib/tokens.js", () => ({
  signAccessToken: mocks.signAccessToken,
  signRefreshToken: mocks.signRefreshToken,
  verifyRefreshToken: mocks.verifyRefreshToken,
}));

import { AuthError, loginAdmin, rotateTokens } from "./auth.service.js";

const ADMIN_ID = "66f000000000000000000001";

function adminId() {
  return { toString: () => ADMIN_ID };
}

describe("admin session concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signAccessToken.mockReturnValue("access-token");
    mocks.signRefreshToken.mockReturnValue("refresh-token");
  });

  it("does not restore a refresh session when deactivation wins during login", async () => {
    const persisted = {
      is_active: true,
      session_version: 3,
      refresh_token_hash: "existing-hash" as string | null,
      previous_refresh_token_hash: "previous-hash" as string | null,
    };
    const admin = {
      _id: adminId(),
      email: "admin@example.com",
      password: "password-hash",
      is_active: true,
      session_version: 3,
      refresh_token_hash: persisted.refresh_token_hash,
      previous_refresh_token_hash: persisted.previous_refresh_token_hash,
      save: vi.fn(async () => {
        persisted.refresh_token_hash = admin.refresh_token_hash;
        persisted.previous_refresh_token_hash =
          admin.previous_refresh_token_hash;
      }),
    };

    mocks.adminFindOne.mockResolvedValue(admin);
    mocks.verifyAdminPassword.mockResolvedValue(true);
    mocks.argonHash.mockImplementation(async () => {
      persisted.is_active = false;
      persisted.session_version = 4;
      persisted.refresh_token_hash = null;
      persisted.previous_refresh_token_hash = null;
      return "stale-login-hash";
    });
    mocks.adminFindOneAndUpdate.mockImplementation(
      async (filter: Record<string, unknown>) => {
        if (
          filter._id !== admin._id ||
          filter.is_active !== persisted.is_active ||
          filter.session_version !== persisted.session_version
        ) {
          return null;
        }

        persisted.refresh_token_hash = "stale-login-hash";
        return admin;
      },
    );

    await expect(
      loginAdmin("admin@example.com", "correct-password"),
    ).rejects.toBeInstanceOf(AuthError);
    expect(persisted).toMatchObject({
      is_active: false,
      session_version: 4,
      refresh_token_hash: null,
      previous_refresh_token_hash: null,
    });
    expect(mocks.adminFindOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: admin._id,
        email: admin.email,
        is_active: true,
        session_version: 3,
      },
      {
        $set: {
          refresh_token_hash: "stale-login-hash",
          previous_refresh_token_hash: null,
        },
      },
    );
  });

  it("rejects a stale-version refresh token after reactivation", async () => {
    const admin = {
      _id: adminId(),
      email: "admin@example.com",
      is_active: true,
      session_version: 5,
      refresh_token_hash: "stale-login-hash",
    };

    mocks.verifyRefreshToken.mockReturnValue({
      id: ADMIN_ID,
      email: admin.email,
      session_version: 3,
    });
    mocks.adminFindOne.mockImplementation(
      (filter: Record<string, unknown>) => ({
        select: vi.fn().mockResolvedValue(
          "session_version" in filter &&
            filter.session_version !== admin.session_version
            ? null
            : admin,
        ),
      }),
    );
    mocks.argonVerify.mockResolvedValue(true);
    mocks.argonHash.mockResolvedValue("next-refresh-hash");
    mocks.adminFindOneAndUpdate.mockResolvedValue(admin);

    await expect(rotateTokens("stale-refresh-token")).rejects.toBeInstanceOf(
      AuthError,
    );
    expect(mocks.adminFindOne).toHaveBeenCalledWith({
      _id: ADMIN_ID,
      email: admin.email,
      is_active: true,
      session_version: 3,
    });
    expect(mocks.argonVerify).not.toHaveBeenCalled();
  });

  it("does not rotate when deactivation and reactivation win after refresh verification", async () => {
    const persisted = {
      is_active: true,
      session_version: 3,
      refresh_token_hash: "current-refresh-hash" as string | null,
    };
    const admin = {
      _id: adminId(),
      email: "admin@example.com",
      is_active: true,
      session_version: 3,
      refresh_token_hash: persisted.refresh_token_hash,
    };

    mocks.verifyRefreshToken.mockReturnValue({
      id: ADMIN_ID,
      email: admin.email,
      session_version: 3,
    });
    mocks.adminFindOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(admin),
    });
    mocks.argonVerify.mockResolvedValue(true);
    mocks.argonHash.mockImplementation(async () => {
      persisted.is_active = true;
      persisted.session_version = 5;
      persisted.refresh_token_hash = "current-refresh-hash";
      return "next-refresh-hash";
    });
    mocks.adminFindOneAndUpdate.mockImplementation(
      async (filter: Record<string, unknown>) => {
        if (
          filter.refresh_token_hash !== persisted.refresh_token_hash ||
          ("is_active" in filter &&
            filter.is_active !== persisted.is_active) ||
          ("session_version" in filter &&
            filter.session_version !== persisted.session_version)
        ) {
          return null;
        }

        persisted.refresh_token_hash = "next-refresh-hash";
        return admin;
      },
    );
    mocks.adminFindById.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await expect(rotateTokens("current-refresh-token")).rejects.toBeInstanceOf(
      AuthError,
    );
    expect(persisted).toMatchObject({
      is_active: true,
      session_version: 5,
      refresh_token_hash: "current-refresh-hash",
    });
    expect(mocks.adminFindOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: admin._id,
        email: admin.email,
        is_active: true,
        session_version: 3,
        refresh_token_hash: "current-refresh-hash",
      },
      {
        refresh_token_hash: "next-refresh-hash",
        previous_refresh_token_hash: "current-refresh-hash",
      },
    );
  });
});

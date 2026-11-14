import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connectDB: vi.fn(),
  disconnectDB: vi.fn(),
  adminUserFindOne: vi.fn(),
  adminUserCreate: vi.fn(),
}));

vi.mock("../config/db.js", () => ({
  connectDB: mocks.connectDB,
  disconnectDB: mocks.disconnectDB,
}));

vi.mock("../models/AdminUser.js", () => ({
  AdminUser: {
    findOne: mocks.adminUserFindOne,
    create: mocks.adminUserCreate,
  },
}));

import { seedAdmin } from "./seed-admin.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalEmail = process.env.ADMIN_EMAIL;
const originalPassword = process.env.ADMIN_PASSWORD;

describe("seedAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = originalEmail;

    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("throws when ADMIN_EMAIL is missing", async () => {
    process.env.ADMIN_PASSWORD = "ValidPassword123!";
    await expect(seedAdmin()).rejects.toThrow(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment",
    );
  });

  it("throws when ADMIN_PASSWORD is missing or whitespace", async () => {
    process.env.ADMIN_EMAIL = "admin@minan.com";
    process.env.ADMIN_PASSWORD = "   ";
    await expect(seedAdmin()).rejects.toThrow(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment",
    );
  });

  it("rejects template placeholder password in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.ADMIN_EMAIL = "admin@minan.com";
    process.env.ADMIN_PASSWORD = "replace_with_secure_admin_password";

    await expect(seedAdmin()).rejects.toThrow(
      "Refusing to seed admin with template placeholder password in production",
    );
  });

  it("creates a new admin user if account does not exist", async () => {
    process.env.NODE_ENV = "development";
    process.env.ADMIN_EMAIL = "admin@minan.com";
    process.env.ADMIN_PASSWORD = "replace_with_secure_admin_password";

    mocks.adminUserFindOne.mockResolvedValue(null);
    mocks.adminUserCreate.mockResolvedValue({
      email: "admin@minan.com",
      is_active: true,
    });

    await seedAdmin();

    expect(mocks.connectDB).toHaveBeenCalledTimes(1);
    expect(mocks.adminUserFindOne).toHaveBeenCalledWith({ email: "admin@minan.com" });
    expect(mocks.adminUserCreate).toHaveBeenCalledWith({
      email: "admin@minan.com",
      password: "replace_with_secure_admin_password",
      is_active: true,
    });
  });

  it("updates existing admin user password and active status", async () => {
    process.env.NODE_ENV = "development";
    process.env.ADMIN_EMAIL = "Admin@Minan.com";
    process.env.ADMIN_PASSWORD = "new_secure_password";

    const mockExistingDoc = {
      email: "admin@minan.com",
      password: "old_password",
      is_active: false,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mocks.adminUserFindOne.mockResolvedValue(mockExistingDoc);

    await seedAdmin();

    expect(mocks.connectDB).toHaveBeenCalledTimes(1);
    expect(mocks.adminUserFindOne).toHaveBeenCalledWith({ email: "admin@minan.com" });
    expect(mockExistingDoc.password).toBe("new_secure_password");
    expect(mockExistingDoc.is_active).toBe(true);
    expect(mockExistingDoc.save).toHaveBeenCalledTimes(1);
    expect(mocks.adminUserCreate).not.toHaveBeenCalled();
  });
});

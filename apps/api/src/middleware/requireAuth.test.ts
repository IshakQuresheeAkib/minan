import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adminExists: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

vi.mock("../lib/tokens.js", () => ({
  verifyAccessToken: mocks.verifyAccessToken,
}));

vi.mock("../models/AdminUser.js", () => ({
  AdminUser: { exists: mocks.adminExists },
}));

import { requireAuth } from "./requireAuth.js";

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyAccessToken.mockReturnValue({
      id: "66f000000000000000000001",
      email: "admin@example.com",
      session_version: 3,
    });
  });

  it("rejects an otherwise valid token after its admin is deactivated", async () => {
    mocks.adminExists.mockResolvedValue(null);
    const status = vi.fn(() => ({ json: vi.fn() }));
    const next = vi.fn();
    const req = {
      get: vi.fn(() => "Bearer valid-token"),
    } as unknown as Request;

    await requireAuth(req, { status } as unknown as Response, next as NextFunction);

    expect(mocks.adminExists).toHaveBeenCalledWith({
      _id: "66f000000000000000000001",
      email: "admin@example.com",
      is_active: true,
      session_version: 3,
    });
    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a token only for the current active admin session", async () => {
    mocks.adminExists.mockResolvedValue({ _id: "66f000000000000000000001" });
    const next = vi.fn();
    const req = {
      get: vi.fn(() => "Bearer valid-token"),
    } as unknown as Request;

    await requireAuth(
      req,
      { status: vi.fn() } as unknown as Response,
      next as NextFunction,
    );

    expect(req.admin).toEqual({
      id: "66f000000000000000000001",
      email: "admin@example.com",
      session_version: 3,
    });
    expect(next).toHaveBeenCalledOnce();
  });

  it("accepts a legacy version-zero token for an unversioned admin record", async () => {
    mocks.verifyAccessToken.mockReturnValue({
      id: "66f000000000000000000001",
      email: "admin@example.com",
      session_version: 0,
    });
    mocks.adminExists.mockResolvedValue({ _id: "66f000000000000000000001" });
    const next = vi.fn();
    const req = {
      get: vi.fn(() => "Bearer legacy-token"),
    } as unknown as Request;

    await requireAuth(
      req,
      { status: vi.fn() } as unknown as Response,
      next as NextFunction,
    );

    expect(mocks.adminExists).toHaveBeenCalledWith({
      _id: "66f000000000000000000001",
      email: "admin@example.com",
      is_active: true,
      $or: [
        { session_version: 0 },
        { session_version: { $exists: false } },
      ],
    });
    expect(req.admin).toEqual({
      id: "66f000000000000000000001",
      email: "admin@example.com",
      session_version: 0,
    });
    expect(next).toHaveBeenCalledOnce();
  });
});

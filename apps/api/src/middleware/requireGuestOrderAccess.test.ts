import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  challengeExists: vi.fn(),
  orderExists: vi.fn(),
  verifyGuestToken: vi.fn(),
}));

vi.mock("../lib/guestOrderTokens.js", () => ({
  verifyGuestOrderAccessToken: mocks.verifyGuestToken,
}));

vi.mock("../models/Order.js", () => ({
  Order: { exists: mocks.orderExists },
}));

vi.mock("../models/VerificationChallenge.js", () => ({
  VerificationChallenge: { exists: mocks.challengeExists },
}));

import { requireGuestOrderAccess } from "./requireGuestOrderAccess.js";

const payload = {
  order_id: "66f000000000000000000001",
  order_number: "MN-20260831-0001",
  normalized_email: "guest@example.com",
  guest_access_version: 1,
  challenge_id: "66f000000000000000000002",
};

function response() {
  const json = vi.fn();
  return {
    json,
    status: vi.fn(() => ({ json })),
  } as unknown as Response;
}

describe("requireGuestOrderAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyGuestToken.mockReturnValue(payload);
    mocks.challengeExists.mockResolvedValue({ _id: payload.challenge_id });
    mocks.orderExists.mockResolvedValue({ _id: payload.order_id });
  });

  it("attaches a guest proof only when its redeemed challenge and Order version remain valid", async () => {
    const req = {
      get: vi.fn(() => "Bearer guest-order-token"),
      cookies: {},
    } as unknown as Request;
    const next = vi.fn();

    await requireGuestOrderAccess(req, response(), next as NextFunction);

    expect(mocks.challengeExists).toHaveBeenCalledWith({
      _id: payload.challenge_id,
      order_id: payload.order_id,
      normalized_email: payload.normalized_email,
      purpose: "guest_order_access",
      consumed_at: { $ne: null },
      revoked_at: null,
      expires_at: { $gt: expect.any(Date) },
    });
    expect(mocks.orderExists).toHaveBeenCalledWith({
      _id: payload.order_id,
      order_number: payload.order_number,
      normalized_email: payload.normalized_email,
      guest_access_version: payload.guest_access_version,
    });
    expect(req.guestOrder).toEqual(payload);
    expect(next).toHaveBeenCalledOnce();
  });

  it("checks the redeemed challenge and proof-bound Order concurrently", async () => {
    let releaseChallenge: (value: { _id: string }) => void = () => undefined;
    const challenge = new Promise<{ _id: string }>((resolve) => {
      releaseChallenge = resolve;
    });
    mocks.challengeExists.mockReturnValue(challenge);
    const req = {
      get: vi.fn(() => "Bearer guest-order-token"),
      cookies: {},
    } as unknown as Request;
    const next = vi.fn();

    const pending = requireGuestOrderAccess(req, response(), next as NextFunction);

    await Promise.resolve();
    try {
      expect(mocks.orderExists).toHaveBeenCalledOnce();
    } finally {
      releaseChallenge({ _id: payload.challenge_id });
    }
    await pending;
  });

  it("uses the guest proof cookie when customer authentication already consumed the bearer header", async () => {
    const req = {
      customer: {
        id: "66f000000000000000000003",
        email: "customer@example.com",
        session_id: "66f000000000000000000004",
        session_version: 1,
      },
      get: vi.fn(() => "Bearer customer-access-token"),
      cookies: { guest_order_access_token: "guest-order-token" },
    } as unknown as Request;
    const next = vi.fn();

    await requireGuestOrderAccess(req, response(), next as NextFunction);

    expect(mocks.verifyGuestToken).toHaveBeenCalledWith("guest-order-token");
    expect(req.guestOrder).toEqual(payload);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a revoked challenge or invalidated guest access version", async () => {
    mocks.challengeExists.mockResolvedValue(null);
    const req = {
      get: vi.fn(() => undefined),
      cookies: { guest_order_access_token: "guest-order-token" },
    } as unknown as Request;
    const res = response();
    const next = vi.fn();

    await requireGuestOrderAccess(req, res, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.orderExists).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });
});

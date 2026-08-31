import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  customerExists: vi.fn(),
  sessionExists: vi.fn(),
  verifyCustomerAccessToken: vi.fn(),
}));

vi.mock("../lib/customerTokens.js", () => ({
  verifyCustomerAccessToken: mocks.verifyCustomerAccessToken,
}));

vi.mock("../models/Customer.js", () => ({
  Customer: { exists: mocks.customerExists },
}));

vi.mock("../models/CustomerSession.js", () => ({
  CustomerSession: { exists: mocks.sessionExists },
}));

import { requireCustomerAuth } from "./requireCustomerAuth.js";

const payload = {
  id: "66f000000000000000000002",
  email: "customer@example.com",
  session_version: 4,
  session_id: "66f000000000000000000003",
};

function response() {
  const json = vi.fn();
  return {
    json,
    status: vi.fn(() => ({ json })),
  } as unknown as Response;
}

describe("requireCustomerAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyCustomerAccessToken.mockReturnValue(payload);
    mocks.customerExists.mockResolvedValue({ _id: payload.id });
    mocks.sessionExists.mockResolvedValue({ _id: payload.session_id });
  });

  it("attaches only an active customer with an unrevoked unexpired session", async () => {
    const req = {
      get: vi.fn(() => "Bearer customer-access-token"),
      cookies: {},
    } as unknown as Request;
    const next = vi.fn();

    await requireCustomerAuth(req, response(), next as NextFunction);

    expect(mocks.customerExists).toHaveBeenCalledWith({
      _id: payload.id,
      normalized_email: payload.email,
      is_active: true,
      session_version: payload.session_version,
    });
    expect(mocks.sessionExists).toHaveBeenCalledWith({
      _id: payload.session_id,
      customer_id: payload.id,
      session_version: payload.session_version,
      revoked_at: null,
      expires_at: { $gt: expect.any(Date) },
    });
    expect(req.customer).toEqual(payload);
    expect(next).toHaveBeenCalledOnce();
  });

  it.each([
    ["inactive customer", null, { _id: payload.session_id }],
    ["revoked session", { _id: payload.id }, null],
  ])("rejects an access token for an %s", async (_label, customer, session) => {
    mocks.customerExists.mockResolvedValue(customer);
    mocks.sessionExists.mockResolvedValue(session);
    const req = {
      get: vi.fn(() => "Bearer customer-access-token"),
      cookies: {},
    } as unknown as Request;
    const res = response();
    const next = vi.fn();

    await requireCustomerAuth(req, res, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

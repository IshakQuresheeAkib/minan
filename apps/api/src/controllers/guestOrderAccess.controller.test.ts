import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  customerRead: vi.fn(),
  guestRead: vi.fn(),
  request: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("../config/resend.js", () => ({
  getResendConfig: vi.fn(() => ({ apiKey: "re_test", from: "MINAN <orders@example.com>" })),
}));

vi.mock("../services/transactionalEmail.service.js", () => ({
  createResendEmailAdapter: vi.fn(() => ({ send: vi.fn() })),
}));

vi.mock("../services/guestOrderAccess.service.js", () => ({
  GuestOrderAccessError: class GuestOrderAccessError extends Error {
    status: number;
    constructor(message: string, status = 401) {
      super(message);
      this.status = status;
    }
  },
  claimGuestOrder: mocks.claim,
  getCustomerOrder: mocks.customerRead,
  getGuestOrder: mocks.guestRead,
  requestGuestOrderOtp: mocks.request,
  verifyGuestOrderOtp: mocks.verify,
}));

import {
  customerOrderReadHandler,
  guestOrderClaimHandler,
  guestOrderOtpRequestHandler,
  guestOrderOtpVerifyHandler,
  guestOrderReadHandler,
} from "./guestOrderAccess.controller.js";

const proof = {
  order_id: "66f000000000000000000001",
  order_number: "MN-20260831-0001",
  normalized_email: "guest@example.com",
  guest_access_version: 1,
  challenge_id: "66f000000000000000000002",
};

function response() {
  const res = {
    cookie: vi.fn(),
    json: vi.fn(),
    status: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

describe("guest Order access controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({ accepted: true });
    mocks.verify.mockResolvedValue({ guest_access_token: "guest-order-token" });
    mocks.guestRead.mockResolvedValue({ order_id: proof.order_number });
    mocks.claim.mockResolvedValue({ claim_status: "claimed", order: { order_id: proof.order_number } });
    mocks.customerRead.mockResolvedValue({ order_id: proof.order_number });
  });

  it("returns the generic OTP request response without disclosing whether the Order exists", async () => {
    const req = {
      body: { order_number: proof.order_number, email: "Guest@Example.com" },
    } as Request;
    const res = response();

    await guestOrderOtpRequestHandler(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ accepted: true });
  });

  it("sets only the dedicated guest cookie after successful OTP verification", async () => {
    const req = {
      body: { order_number: proof.order_number, email: proof.normalized_email, otp: "123456" },
    } as Request;
    const res = response();

    await guestOrderOtpVerifyHandler(req, res, vi.fn());

    expect(res.cookie).toHaveBeenCalledWith(
      "guest_order_access_token",
      "guest-order-token",
      expect.objectContaining({ httpOnly: true, maxAge: expect.any(Number) }),
    );
    expect(res.json).toHaveBeenCalledWith({ verified: true });
  });

  it("passes only middleware-authenticated identity and proof into a one-Order claim", async () => {
    const req = {
      customer: { id: "66f000000000000000000003" },
      guestOrder: proof,
      params: { orderNumber: proof.order_number },
    } as unknown as Request;
    const res = response();

    await guestOrderClaimHandler(req, res, vi.fn());

    expect(mocks.claim).toHaveBeenCalledWith(
      proof.order_number,
      "66f000000000000000000003",
      proof,
    );
    expect(res.json).toHaveBeenCalledWith({
      claim_status: "claimed",
      order: { order_id: proof.order_number },
    });
  });

  it("uses the dedicated customer-safe reads for both guest and customer paths", async () => {
    const guestReq = {
      guestOrder: proof,
      params: { orderNumber: proof.order_number },
    } as unknown as Request;
    const customerReq = {
      customer: { id: "66f000000000000000000003" },
      params: { orderNumber: proof.order_number },
    } as unknown as Request;

    await guestOrderReadHandler(guestReq, response(), vi.fn());
    await customerOrderReadHandler(customerReq, response(), vi.fn());

    expect(mocks.guestRead).toHaveBeenCalledWith(proof.order_number, proof);
    expect(mocks.customerRead).toHaveBeenCalledWith(
      "66f000000000000000000003",
      proof.order_number,
    );
  });
});

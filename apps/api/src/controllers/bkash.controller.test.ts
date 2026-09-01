import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ resolveCustomer: vi.fn(), start: vi.fn() }));
vi.mock("../middleware/requireCustomerAuth.js", () => ({ resolveCustomerSession: mocks.resolveCustomer }));
vi.mock("../services/bkashPayments.service.js", () => ({
  handleBkashCallback: vi.fn(), resolvePaymentResult: vi.fn(), retryBkashPayment: vi.fn(), startBkashPayment: mocks.start,
}));

import { createBkashPaymentHandler } from "./bkash.controller.js";

function response() {
  const res = { json: vi.fn(), status: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

const input = {
  name: "MINAN Customer", phone_number: "01700000000", email: "customer@example.com", address: "Sylhet, Bangladesh",
  checkout_identity_mode: "customer", checkout_source: "cart", payment_method: "cod",
  cart_snapshot: { items: [{ product_id: "507f1f77bcf86cd799439011", name: "Shirt", price: 1200, size: "M", color: "Black", quantity: 1 }], total: 1200 },
};

describe("checkout ownership controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.start.mockResolvedValue({ state: "completed" });
  });

  it("requires a valid customer session before customer-mode Order creation", async () => {
    mocks.resolveCustomer.mockResolvedValue(null);
    const next = vi.fn();

    await createBkashPaymentHandler({ body: input, get: vi.fn(() => "x".repeat(16)) } as unknown as Request, response(), next);

    expect(mocks.start).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it("passes only resolved customer identity into customer-mode creation", async () => {
    mocks.resolveCustomer.mockResolvedValue({ id: "66f000000000000000000003" });
    const res = response();

    await createBkashPaymentHandler({ body: input, get: vi.fn(() => "x".repeat(16)) } as unknown as Request, res, vi.fn());

    expect(mocks.start).toHaveBeenCalledWith(
      expect.objectContaining({ checkout_identity_mode: "customer" }),
      "x".repeat(16),
      { mode: "customer", customerId: "66f000000000000000000003" },
    );
  });

  it("ignores ambient customer sessions for explicit guest-mode checkout", async () => {
    const res = response();

    await createBkashPaymentHandler({
      body: { ...input, checkout_identity_mode: "guest" },
      get: vi.fn(() => "x".repeat(16)),
    } as unknown as Request, res, vi.fn());

    expect(mocks.resolveCustomer).not.toHaveBeenCalled();
    expect(mocks.start).toHaveBeenCalledWith(expect.anything(), "x".repeat(16), { mode: "guest" });
  });
});

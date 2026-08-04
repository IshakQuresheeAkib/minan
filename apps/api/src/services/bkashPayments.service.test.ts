import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const bkashMocks = vi.hoisted(() => ({
  createPayment: vi.fn(),
  executePayment: vi.fn(),
  queryPayment: vi.fn(),
  verifyCart: vi.fn(),
}));

vi.mock("./bkashClient.service.js", () => ({
  createBkashPayment: bkashMocks.createPayment,
  executeBkashPayment: bkashMocks.executePayment,
  queryBkashPayment: bkashMocks.queryPayment,
}));

vi.mock("./checkoutCart.service.js", () => ({
  buildVerifiedCartSnapshot: bkashMocks.verifyCart,
}));

import { Lead } from "../models/Lead.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import { bkashCallbackSchema } from "../schemas/bkash.schemas.js";
import {
  handleBkashCallback,
  paymentResponseIsCompleted,
  recheckPendingPayment,
  retryBkashPayment,
  startBkashPayment,
} from "./bkashPayments.service.js";

function chainResult<T>(value: T) {
  const promise = Promise.resolve(value);
  return {
    select: vi.fn(() => promise),
    sort: vi.fn(function sort() {
      return this;
    }),
    then: promise.then.bind(promise),
  };
}

function persistable<T extends { save: () => Promise<unknown> }>(document: T): T {
  vi.spyOn(document, "save").mockResolvedValue(document);
  return document;
}

function attempt() {
  return new PaymentAttempt({
    lead_id: "507f1f77bcf86cd799439011",
    sequence: 1,
    status: "initiated",
    merchant_invoice_number: "MINAN-507f1f77bcf86cd799439011-1",
    expected_amount: "1200.00",
    currency: "BDT",
    payment_id: "TR001",
  });
}

describe("bKash payment verification", () => {
  const completed = {
    statusCode: "0000",
    transactionStatus: "Completed",
    paymentID: "TR001",
    trxID: "AJH7ABC123",
    amount: "1200.00",
    currency: "BDT",
    merchantInvoiceNumber: "MINAN-507f1f77bcf86cd799439011-1",
  };

  it("accepts only a completed response matching the stored payment invariants", () => {
    expect(paymentResponseIsCompleted(completed, attempt())).toBe(true);
    expect(paymentResponseIsCompleted({ ...completed, amount: "1199.00" }, attempt())).toBe(false);
    expect(paymentResponseIsCompleted({ ...completed, paymentID: "different" }, attempt())).toBe(false);
    expect(paymentResponseIsCompleted({ ...completed, merchantInvoiceNumber: "different" }, attempt())).toBe(false);
  });

  it("allows an undocumented optional callback signature but rejects unknown statuses", () => {
    expect(bkashCallbackSchema.safeParse({ paymentID: "TR001", status: "success" }).success).toBe(true);
    expect(bkashCallbackSchema.safeParse({ paymentID: "TR001", status: "unknown" }).success).toBe(false);
  });
});

describe("bKash payment recovery and checkout invariants", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("moves a claimed callback into a recoverable verification state", async () => {
    const current = persistable(attempt());
    const claimed = persistable(attempt());
    claimed.status = "verification_pending";

    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(current) as never);
    const claim = vi
      .spyOn(PaymentAttempt, "findOneAndUpdate")
      .mockResolvedValue(claimed);
    bkashMocks.executePayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Completed",
      paymentID: "TR001",
      trxID: "RECOVERED1",
      amount: "1200.00",
      currency: "BDT",
      merchantInvoiceNumber: current.merchant_invoice_number,
    });

    await handleBkashCallback({ paymentID: "TR001", status: "success" });

    expect(claim).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $set: expect.objectContaining({ status: "verification_pending" }),
      }),
      expect.any(Object),
    );
  });

  it("rechecks a pending callback through execute-or-query recovery", async () => {
    const pending = persistable(attempt());
    pending.status = "verification_pending";
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    bkashMocks.executePayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Completed",
      paymentID: "TR001",
      trxID: "RECOVERED2",
      amount: "1200.00",
      currency: "BDT",
      merchantInvoiceNumber: pending.merchant_invoice_number,
    });

    await recheckPendingPayment(pending.lead_id.toString());

    expect(bkashMocks.executePayment).toHaveBeenCalledWith("TR001");
  });

  it("queries after Execute reports that a payment may already be completed", async () => {
    const pending = persistable(attempt());
    pending.status = "verification_pending";
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    bkashMocks.executePayment.mockResolvedValue({
      statusCode: "2062",
      statusMessage: "Payment has already been completed",
    });
    bkashMocks.queryPayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Completed",
      paymentID: "TR001",
      trxID: "RECOVERED3",
      amount: "1200.00",
      currency: "BDT",
      merchantInvoiceNumber: pending.merchant_invoice_number,
    });

    await recheckPendingPayment(pending.lead_id.toString());

    expect(bkashMocks.queryPayment).toHaveBeenCalledWith("TR001");
    expect(pending.status).toBe("completed");
  });

  it("rejects an idempotency key reused with different customer details", async () => {
    const existingLead = {
      _id: new Types.ObjectId(),
      name: "Old Name",
      phone_number: "01700000000",
      email: "old@example.com",
      address: "Old delivery address",
      notes: "",
      checkout_source: "cart",
      cart_snapshot: {
        items: [{
          product_id: new Types.ObjectId().toString(),
          name: "Shirt",
          price: 1200,
          size: "M",
          color: "Black",
          quantity: 1,
        }],
        total: 1200,
      },
    };
    vi.spyOn(Lead, "findOne").mockResolvedValue(existingLead as never);
    const existingAttempt = persistable(attempt());
    existingAttempt.status = "failed";
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(
      chainResult(existingAttempt) as never,
    );

    await expect(
      startBkashPayment(
        {
          name: "New Name",
          phone_number: "01700000000",
          email: "new@example.com",
          address: "Corrected delivery address",
          notes: "",
          checkout_source: "cart",
          cart_snapshot: existingLead.cart_snapshot,
        },
        "same-idempotency-key",
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("requires confirmation again when the total changes after a quote", async () => {
    const failedAttempt = persistable(attempt());
    failedAttempt.status = "failed";
    failedAttempt.retry_token_hash = "stored-token";
    const lead = {
      _id: failedAttempt.lead_id,
      cart_snapshot: {
        items: [{
          product_id: new Types.ObjectId().toString(),
          name: "Shirt",
          price: 1000,
          size: "M",
          color: "Black",
          quantity: 1,
        }],
        total: 1000,
      },
      save: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(PaymentAttempt, "findOneAndUpdate").mockResolvedValue(failedAttempt);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(failedAttempt) as never);
    vi.spyOn(Lead, "findById").mockResolvedValue(lead as never);
    bkashMocks.verifyCart.mockResolvedValue({
      ...lead.cart_snapshot,
      total: 1200,
    });
    const nextAttempt = persistable(attempt());
    nextAttempt.sequence = 2;
    nextAttempt.status = "creating";
    const createAttempt = vi
      .spyOn(PaymentAttempt, "create")
      .mockResolvedValue(nextAttempt as never);

    const result = await retryBkashPayment({
      retry_token: "x".repeat(32),
      accepted_total: 1000,
    });

    expect(result).toMatchObject({ state: "price_changed", total: 1200 });
    expect(createAttempt).not.toHaveBeenCalled();
  });
});

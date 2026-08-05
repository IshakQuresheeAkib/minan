import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPayment: vi.fn(),
  executePayment: vi.fn(),
  queryPayment: vi.fn(),
  createOrLoadOrder: vi.fn(),
  matchesOrder: vi.fn(() => true),
}));

vi.mock("../config/bkash.js", () => ({
  getBkashConfig: () => ({
    baseUrl: "https://tokenized.sandbox.bka.sh",
    appKey: "key", appSecret: "secret", username: "user", password: "password",
    apiPublicUrl: "https://api.example.com", frontendUrl: "https://shop.example.com",
    deliveryFeeBdt: 100,
  }),
}));
vi.mock("./bkashClient.service.js", () => ({
  createBkashPayment: mocks.createPayment,
  executeBkashPayment: mocks.executePayment,
  queryBkashPayment: mocks.queryPayment,
}));
vi.mock("./orders.service.js", () => ({
  createOrLoadCheckoutOrder: mocks.createOrLoadOrder,
  checkoutRequestMatchesOrder: mocks.matchesOrder,
}));

import { Order } from "../models/Order.js";
import { PaymentAttempt, type PaymentAttemptDocument } from "../models/PaymentAttempt.js";
import { bkashCallbackSchema } from "../schemas/bkash.schemas.js";
import {
  handleBkashCallback,
  paymentResponseIsCompleted,
  recheckPendingPayment,
  resolvePaymentResult,
  retryBkashPayment,
  startBkashPayment,
} from "./bkashPayments.service.js";

function chainResult<T>(value: T) {
  const promise = Promise.resolve(value);
  const chain = { select: vi.fn(() => promise), sort: vi.fn(), then: promise.then.bind(promise) };
  chain.sort.mockReturnValue(chain);
  return chain;
}

function persistable(document: PaymentAttemptDocument): PaymentAttemptDocument {
  vi.spyOn(document, "save").mockResolvedValue(document);
  return document;
}

function attempt(status: PaymentAttemptDocument["status"] = "initiated") {
  const document = new PaymentAttempt({
    order_id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    payment_purpose: "delivery_fee",
    sequence: 1,
    status,
    merchant_invoice_number: "MN-20260805-0001-01",
    expected_amount: "100.00",
    currency: "BDT",
    payment_id: "TR001",
  });
  document.createdAt = new Date();
  document.updatedAt = new Date();
  return persistable(document);
}

function order() {
  const id = new Types.ObjectId("507f1f77bcf86cd799439011");
  return {
    _id: id,
    order_number: "MN-20260805-0001",
    name: "MINAN Customer",
    phone_number: "01700000000",
    normalized_phone: "01700000000",
    email: "customer@example.com",
    address: "Dhaka",
    customer_notes: "",
    checkout_source: "cart",
    lines: [{ product_id: new Types.ObjectId().toString(), size: "M", color: "Black", quantity: 1 }],
    financials: { delivery_fee: 100, cod_due: 1200 },
  };
}

const input = {
  name: "MINAN Customer",
  phone_number: "01700000000",
  email: "customer@example.com",
  address: "Dhaka",
  notes: "",
  checkout_source: "cart" as const,
  cart_snapshot: {
    items: [{ product_id: new Types.ObjectId().toString(), name: "Shirt", price: 1200, size: "M", color: "Black", quantity: 1 }],
    total: 1200,
  },
};

describe("bKash delivery-fee verification", () => {
  const completed = {
    statusCode: "0000", transactionStatus: "Completed", paymentID: "TR001",
    trxID: "AJH7ABC123", amount: "100.00", currency: "BDT",
    merchantInvoiceNumber: "MN-20260805-0001-01",
  };

  it("accepts only a completed response matching every frozen gateway invariant", () => {
    expect(paymentResponseIsCompleted(completed, attempt())).toBe(true);
    expect(paymentResponseIsCompleted({ ...completed, amount: "99.00" }, attempt())).toBe(false);
    expect(paymentResponseIsCompleted({ ...completed, paymentID: "different" }, attempt())).toBe(false);
    expect(paymentResponseIsCompleted({ ...completed, merchantInvoiceNumber: "different" }, attempt())).toBe(false);
    expect(paymentResponseIsCompleted({ ...completed, currency: "USD" }, attempt())).toBe(false);
  });

  it("allows an optional callback signature but rejects unknown statuses", () => {
    expect(bkashCallbackSchema.safeParse({ paymentID: "TR001", status: "success" }).success).toBe(true);
    expect(bkashCallbackSchema.safeParse({ paymentID: "TR001", status: "unknown" }).success).toBe(false);
  });
});

describe("bKash Order lifecycle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    delete process.env.CHECKOUT_MAINTENANCE_MODE;
    mocks.matchesOrder.mockReturnValue(true);
    vi.spyOn(PaymentAttempt, "updateOne").mockResolvedValue({ matchedCount: 1 } as never);
    vi.spyOn(Order, "updateOne").mockResolvedValue({ modifiedCount: 1 } as never);
  });

  it("creates a fee-only attempt with an Order-number invoice", async () => {
    const checkoutOrder = order();
    mocks.createOrLoadOrder.mockResolvedValue(checkoutOrder);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(null) as never);
    const created = attempt("creating");
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(created as never);
    mocks.createPayment.mockResolvedValue({ statusCode: "0000", paymentID: "TR001", bkashURL: "https://sandbox.bka.sh/pay" });

    const result = await startBkashPayment(input, "idempotency-key-with-safe-length");

    expect(result).toEqual({ state: "redirect", bkash_url: "https://sandbox.bka.sh/pay" });
    expect(PaymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      order_id: checkoutOrder._id,
      payment_purpose: "delivery_fee",
      expected_amount: "100.00",
      merchant_invoice_number: "MN-20260805-0001-01",
    }));
    expect(mocks.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: "100.00", payerReference: checkoutOrder.order_number }));
  });

  it("rejects an idempotency key reused for different checkout data", async () => {
    mocks.createOrLoadOrder.mockResolvedValue(order());
    mocks.matchesOrder.mockReturnValue(false);
    await expect(startBkashPayment({ ...input, name: "Different" }, "idempotency-key-with-safe-length"))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it("returns the existing active attempt without repricing merchandise", async () => {
    mocks.createOrLoadOrder.mockResolvedValue(order());
    const active = attempt();
    active.bkash_url = "https://sandbox.bka.sh/existing";
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(active) as never);

    const result = await startBkashPayment(input, "idempotency-key-with-safe-length");

    expect(result).toEqual({ state: "redirect", bkash_url: active.bkash_url });
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });

  it("retries the same frozen Tk 100 Order without product validation", async () => {
    const failed = attempt("failed");
    const checkoutOrder = order();
    vi.spyOn(PaymentAttempt, "findOneAndUpdate").mockResolvedValue(failed);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(failed) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(checkoutOrder as never);
    const next = attempt("creating");
    next.sequence = 2;
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(next as never);
    mocks.createPayment.mockResolvedValue({ statusCode: "0000", paymentID: "TR002", bkashURL: "https://sandbox.bka.sh/retry" });

    const result = await retryBkashPayment({ retry_token: "x".repeat(43) });

    expect(result.state).toBe("redirect");
    expect(PaymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ expected_amount: "100.00", sequence: 2 }));
    expect(mocks.createOrLoadOrder).not.toHaveBeenCalled();
  });

  it("reconciles a valid late completion after local expiry", async () => {
    const expired = attempt("expired");
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(expired) as never);
    vi.spyOn(PaymentAttempt, "findById").mockResolvedValue(expired);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "0000", transactionStatus: "Completed", paymentID: "TR001",
      trxID: "LATE123", amount: "100.00", currency: "BDT",
      merchantInvoiceNumber: expired.merchant_invoice_number,
    });

    await handleBkashCallback({ paymentID: "TR001", status: "success" });

    expect(expired.status).toBe("completed");
    expect(expired.bkash_trx_id).toBe("LATE123");
    expect(Order.updateOne).toHaveBeenCalledWith(expect.objectContaining({ _id: expired.order_id }), expect.objectContaining({ $set: { delivery_fee_status: "paid" } }));
  });

  it("recovers verification-pending payments through Execute then query", async () => {
    const pending = attempt("verification_pending");
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    mocks.executePayment.mockResolvedValue({ statusCode: "2062", statusMessage: "Already completed" });
    mocks.queryPayment.mockResolvedValue({ statusCode: "0000", transactionStatus: "Initiated", paymentID: "TR001" });

    await recheckPendingPayment(pending.order_id!.toString());

    expect(mocks.executePayment).toHaveBeenCalledWith("TR001");
    expect(mocks.queryPayment).toHaveBeenCalledWith("TR001");
    expect(pending.status).toBe("initiated");
  });

  it("resolves a completed result to Order number, fee paid and frozen COD", async () => {
    const completed = attempt("completed");
    completed.result_token_hash = "stored";
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(completed) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(order() as never);

    const result = await resolvePaymentResult("r".repeat(43));

    expect(result).toMatchObject({ state: "completed", order_number: "MN-20260805-0001", fee_paid: 100, cod_due: 1200 });
    expect(result).not.toHaveProperty("amount");
  });

  it("blocks payment creation and retry during checkout maintenance", async () => {
    process.env.CHECKOUT_MAINTENANCE_MODE = "true";
    await expect(startBkashPayment(input, "idempotency-key-with-safe-length")).rejects.toMatchObject({ statusCode: 503 });
    await expect(retryBkashPayment({ retry_token: "x".repeat(43) })).rejects.toMatchObject({ statusCode: 503 });
  });
});

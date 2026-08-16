import { createHash } from "node:crypto";

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

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function attempt(
  status: PaymentAttemptDocument["status"] = "initiated",
  expectedAmount = "60.00",
  purpose: PaymentAttemptDocument["payment_purpose"] = "delivery_fee",
) {
  const document = new PaymentAttempt({
    order_id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    payment_purpose: purpose,
    sequence: 1,
    status,
    merchant_invoice_number: "MN-20260805-0001-01",
    expected_amount: expectedAmount,
    currency: "BDT",
    payment_id: "TR001",
  });
  document.createdAt = new Date();
  document.updatedAt = new Date();
  return persistable(document);
}

function order(
  deliveryFee = 60,
  shippingZone: "inside_sylhet" | "outside_sylhet" = "inside_sylhet",
) {
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
    shipping_zone: shippingZone,
    payment_method: "cod" as const,
    revision: 1,
    lines: [{ product_id: new Types.ObjectId().toString(), size: "M", color: "Black", quantity: 1 }],
    financials: {
      merchandise_total: 1200,
      overall_order_value: 1200 + deliveryFee,
      merchandise_paid_online: 0,
      exchange_credit_applied: 0,
      delivery_fee: deliveryFee,
      cod_due: 1200,
    },
  };
}

const input = {
  name: "MINAN Customer",
  phone_number: "01700000000",
  email: "customer@example.com",
  address: "Dhaka",
  notes: "",
  checkout_source: "cart" as const,
  shipping_zone: "inside_sylhet" as const,
  payment_method: "cod" as const,
  cart_snapshot: {
    items: [{ product_id: new Types.ObjectId().toString(), name: "Shirt", price: 1200, size: "M", color: "Black", quantity: 1 }],
    total: 1200,
  },
};

describe("bKash delivery-fee verification", () => {
  const completed = {
    statusCode: "0000", transactionStatus: "Completed", paymentID: "TR001",
    trxID: "AJH7ABC123", amount: "60.00", currency: "BDT",
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
    vi.spyOn(PaymentAttempt, "updateMany").mockResolvedValue({ modifiedCount: 1 } as never);
    vi.spyOn(PaymentAttempt, "exists").mockResolvedValue(null);
    vi.spyOn(Order, "updateOne").mockResolvedValue({ modifiedCount: 1 } as never);
    vi.spyOn(Order, "findOneAndUpdate").mockImplementation((async () => {
      const checkoutOrder = order();
      const lockedRevision = checkoutOrder.revision + 1;
      return {
        ...checkoutOrder,
        payment_method: "bkash_full",
        full_payment_locked_revision: lockedRevision,
        revision: lockedRevision,
      };
    }) as never);
  });

  it("creates a fee-only attempt with an Order-number invoice", async () => {
    const checkoutOrder = order();
    mocks.createOrLoadOrder.mockResolvedValue(checkoutOrder);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(null) as never);
    const created = attempt("creating");
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(created as never);
    mocks.createPayment.mockResolvedValue({ statusCode: "0000", paymentID: "TR001", bkashURL: "https://sandbox.bka.sh/pay" });

    const result = await startBkashPayment(input, "idempotency-key-with-safe-length");

    expect(result).toMatchObject({
      state: "redirect",
      bkash_url: "https://sandbox.bka.sh/pay",
      payment_contract_version: 2,
      payment_method: "cod",
      pay_now_amount: 60,
    });
    expect(PaymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      order_id: checkoutOrder._id,
      payment_purpose: "delivery_fee",
      expected_amount: "60.00",
      merchant_invoice_number: "MN-20260805-0001-01",
    }));
    expect(mocks.createPayment).toHaveBeenCalledWith(expect.objectContaining({ amount: "60.00", payerReference: checkoutOrder.order_number }));
  });

  it("creates a full-payment attempt from the frozen overall Order value", async () => {
    const checkoutOrder = order();
    mocks.createOrLoadOrder.mockResolvedValue(checkoutOrder);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(null) as never);
    const created = attempt("creating", "1260.00", "order_total");
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(created as never);
    mocks.createPayment.mockResolvedValue({
      statusCode: "0000",
      paymentID: "TR001",
      bkashURL: "https://sandbox.bka.sh/full",
    });

    const result = await startBkashPayment(
      { ...input, payment_method: "bkash_full" },
      "idempotency-key-with-safe-length",
    );

    expect(result).toMatchObject({
      state: "redirect",
      payment_method: "bkash_full",
      pay_now_amount: 1260,
    });
    expect(PaymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      payment_purpose: "order_total",
      expected_amount: "1260.00",
      order_revision: 2,
    }));
    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: checkoutOrder._id,
        revision: 1,
        full_payment_locked_revision: { $exists: false },
      }),
      expect.objectContaining({
        $set: expect.objectContaining({ full_payment_locked_revision: 2 }),
        $inc: { revision: 1 },
      }),
      expect.objectContaining({ new: true }),
    );
    expect(mocks.createPayment).toHaveBeenCalledWith(expect.objectContaining({
      amount: "1260.00",
    }));
  });

  it("recovers a full-payment Order lock when the first attempt was not recorded", async () => {
    const checkoutOrder = {
      ...order(),
      payment_method: "bkash_full" as const,
      full_payment_locked_revision: 2,
      revision: 2,
    };
    mocks.createOrLoadOrder.mockResolvedValue(checkoutOrder);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(null) as never);
    vi.mocked(Order.findOneAndUpdate).mockResolvedValue(null);
    vi.spyOn(Order, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue({ revision: 2 }),
    } as never);
    const created = attempt("creating", "1260.00", "order_total");
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(created as never);
    mocks.createPayment.mockResolvedValue({
      statusCode: "0000",
      paymentID: "TR001",
      bkashURL: "https://sandbox.bka.sh/full",
    });

    const result = await startBkashPayment(
      { ...input, payment_method: "bkash_full" },
      "idempotency-key-with-safe-length",
    );

    expect(result).toMatchObject({
      state: "redirect",
      payment_method: "bkash_full",
      pay_now_amount: 1260,
    });
    expect(PaymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      payment_purpose: "order_total",
      expected_amount: "1260.00",
      order_revision: 2,
    }));
    expect(Order.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("switches methods on the same Order only after the prior attempt is terminal", async () => {
    const checkoutOrder = order();
    const failed = attempt("cancelled");
    failed.terminal_confirmed_at = new Date();
    mocks.createOrLoadOrder.mockResolvedValue(checkoutOrder);
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { status?: unknown }) =>
      filter.status === "completed" ? chainResult(null) : chainResult(failed)
    ) as never);
    const created = attempt("creating", "1260.00", "order_total");
    created.sequence = 2;
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(created as never);
    mocks.createPayment.mockResolvedValue({
      statusCode: "0000",
      paymentID: "TR002",
      bkashURL: "https://sandbox.bka.sh/full",
    });

    const result = await startBkashPayment(
      { ...input, payment_method: "bkash_full" },
      "idempotency-key-with-safe-length",
    );

    expect(result).toMatchObject({ state: "redirect", payment_method: "bkash_full" });
    expect(PaymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      sequence: 2,
      payment_purpose: "order_total",
    }));
  });

  it("blocks a method switch while the prior gateway attempt is active", async () => {
    mocks.createOrLoadOrder.mockResolvedValue(order());
    const active = attempt("verification_pending");
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { status?: unknown }) =>
      filter.status === "completed" ? chainResult(null) : chainResult(active)
    ) as never);
    vi.spyOn(PaymentAttempt, "create").mockRejectedValue(new Error("Payment creation should not run"));

    await expect(startBkashPayment(
      { ...input, payment_method: "bkash_full" },
      "idempotency-key-with-safe-length",
    )).rejects.toMatchObject({ statusCode: 409 });
    expect(PaymentAttempt.create).not.toHaveBeenCalled();
  });

  it("blocks a different amount when local expiry is not provider-confirmed", async () => {
    mocks.createOrLoadOrder.mockResolvedValue(order());
    const expired = attempt("expired");
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { status?: unknown }) =>
      filter.status === "completed" ? chainResult(null) : chainResult(expired)
    ) as never);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Initiated",
      paymentID: "TR001",
    });
    vi.spyOn(PaymentAttempt, "create").mockRejectedValue(new Error("Payment creation should not run"));

    await expect(startBkashPayment(
      { ...input, payment_method: "bkash_full" },
      "idempotency-key-with-safe-length",
    )).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.queryPayment).toHaveBeenCalledWith("TR001");
    expect(PaymentAttempt.create).not.toHaveBeenCalled();
  });

  it("keeps ambiguous gateway errors from unlocking a method switch", async () => {
    mocks.createOrLoadOrder.mockResolvedValue(order());
    const failed = attempt("failed");
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { status?: unknown }) =>
      filter.status === "completed" ? chainResult(null) : chainResult(failed)
    ) as never);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "2054",
      statusMessage: "Could not resolve payment status",
    });
    vi.spyOn(PaymentAttempt, "create").mockRejectedValue(new Error("Payment creation should not run"));

    await expect(startBkashPayment(
      { ...input, payment_method: "bkash_full" },
      "idempotency-key-with-safe-length",
    )).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.queryPayment).toHaveBeenCalledWith("TR001");
    expect(failed.status).toBe("verification_pending");
    expect(failed.terminal_confirmed_at).toBeUndefined();
    expect(PaymentAttempt.create).not.toHaveBeenCalled();
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

    expect(result).toMatchObject({ state: "redirect", bkash_url: active.bkash_url });
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });

  it("returns the recorded settlement attempt instead of a later duplicate completion", async () => {
    const settled = attempt("completed");
    settled.bkash_trx_id = "SETTLED123";
    const duplicate = attempt("completed", "1260.00", "order_total");
    duplicate.sequence = 2;
    duplicate.payment_id = "TR002";
    duplicate.bkash_trx_id = "DUPLICATE123";
    const checkoutOrder = {
      ...order(),
      delivery_fee_status: "paid",
      settled_payment_attempt_id: settled._id,
    };
    mocks.createOrLoadOrder.mockResolvedValue(checkoutOrder);
    vi.spyOn(Order, "findById").mockResolvedValue(checkoutOrder as never);
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { _id?: Types.ObjectId; status?: unknown }) => {
      if (filter._id?.toString() === settled._id.toString()) return chainResult(settled);
      if (filter.status === "completed") return chainResult(duplicate);
      return chainResult(null);
    }) as never);

    const result = await startBkashPayment(input, "idempotency-key-with-safe-length");

    expect(result).toMatchObject({
      state: "completed",
      payment_method: "cod",
      pay_now_amount: 60,
    });
    expect(settled.save).toHaveBeenCalled();
    expect(duplicate.save).not.toHaveBeenCalled();
    expect(PaymentAttempt.findOne).toHaveBeenCalledWith(expect.objectContaining({
      _id: settled._id,
      order_id: checkoutOrder._id,
      status: "completed",
    }));
  });

  it("retries the same frozen Tk 120 outside-Sylhet Order without product validation", async () => {
    const failed = attempt("failed", "120.00");
    const checkoutOrder = order(120, "outside_sylhet");
    vi.spyOn(PaymentAttempt, "findOneAndUpdate").mockResolvedValue(failed);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(failed) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(checkoutOrder as never);
    const next = attempt("creating", "120.00");
    next.sequence = 2;
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(next as never);
    mocks.createPayment.mockResolvedValue({ statusCode: "0000", paymentID: "TR002", bkashURL: "https://sandbox.bka.sh/retry" });

    const result = await retryBkashPayment({ retry_token: "x".repeat(43) });

    expect(result.state).toBe("redirect");
    expect(PaymentAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ expected_amount: "120.00", sequence: 2 }));
    expect(mocks.createOrLoadOrder).not.toHaveBeenCalled();
  });

  it("rejects a retry when an earlier payment attempt already completed", async () => {
    const failed = attempt("failed");
    const paid = attempt("completed");
    const checkoutOrder = order();
    vi.spyOn(PaymentAttempt, "findOneAndUpdate").mockResolvedValue(failed);
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { status?: unknown }) =>
      filter.status === "completed" ? chainResult(paid) : chainResult(failed)
    ) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(checkoutOrder as never);
    const next = attempt("creating");
    next.sequence = 2;
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(next as never);
    mocks.createPayment.mockResolvedValue({ statusCode: "0000", paymentID: "TR002", bkashURL: "https://sandbox.bka.sh/retry" });

    await expect(
      retryBkashPayment({ retry_token: "x".repeat(43) }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(PaymentAttempt.create).not.toHaveBeenCalled();
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });

  it("withholds a retry URL when an earlier attempt completes during retry creation", async () => {
    const failed = attempt("failed");
    const paid = attempt("completed");
    const checkoutOrder = order();
    vi.spyOn(PaymentAttempt, "findOneAndUpdate").mockResolvedValue(failed);
    let completedLookupCount = 0;
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { status?: unknown }) => {
      if (filter.status !== "completed") return chainResult(failed);
      completedLookupCount += 1;
      return chainResult(completedLookupCount < 3 ? null : paid);
    }) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(checkoutOrder as never);
    const next = attempt("creating");
    next.sequence = 2;
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(next as never);
    mocks.createPayment.mockResolvedValue({ statusCode: "0000", paymentID: "TR002", bkashURL: "https://sandbox.bka.sh/retry" });

    const result = await retryBkashPayment({ retry_token: "x".repeat(43) });

    expect(result.state).toBe("completed");
    expect(mocks.createPayment).toHaveBeenCalledTimes(1);
  });

  it("reconciles an earlier completion before creating a retry", async () => {
    const failed = attempt("failed");
    const paid = attempt("completed");
    const checkoutOrder = order();
    vi.spyOn(PaymentAttempt, "findOneAndUpdate").mockResolvedValue(failed);
    vi.spyOn(PaymentAttempt, "findOne").mockImplementation(((filter: { status?: unknown }) =>
      filter.status === "completed" ? chainResult(paid) : chainResult(failed)
    ) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(checkoutOrder as never);

    await expect(
      retryBkashPayment({ retry_token: "x".repeat(43) }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(Order.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: checkoutOrder._id }),
      expect.objectContaining({
        $set: expect.objectContaining({ delivery_fee_status: "paid" }),
      }),
    );
    expect(mocks.createPayment).not.toHaveBeenCalled();
  });

  it("atomically refuses to overwrite a concurrently paid Order with retry processing", async () => {
    const failed = attempt("failed");
    const checkoutOrder = order();
    vi.spyOn(PaymentAttempt, "findOneAndUpdate").mockResolvedValue(failed);
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(failed) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(checkoutOrder as never);
    const retry = attempt("creating");
    retry.sequence = 2;
    retry.payment_id = "TR002";
    vi.spyOn(PaymentAttempt, "create").mockResolvedValue(retry as never);
    mocks.createPayment.mockResolvedValue({
      statusCode: "0000",
      paymentID: "TR002",
      bkashURL: "https://sandbox.bka.sh/retry",
    });

    await retryBkashPayment({ retry_token: "x".repeat(43) });

    expect(Order.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: checkoutOrder._id,
        delivery_fee_status: { $nin: ["paid", "processing"] },
      }),
      expect.objectContaining({ $set: { delivery_fee_status: "processing" } }),
    );
  });

  it("reconciles a valid late completion after local expiry", async () => {
    const expired = attempt("expired");
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(expired) as never);
    vi.spyOn(PaymentAttempt, "findById").mockResolvedValue(expired);
    vi.spyOn(Order, "findById").mockResolvedValue(order() as never);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "0000", transactionStatus: "Completed", paymentID: "TR001",
      trxID: "LATE123", amount: "60.00", currency: "BDT",
      merchantInvoiceNumber: expired.merchant_invoice_number,
    });

    await handleBkashCallback({ paymentID: "TR001", status: "success" });

    expect(expired.status).toBe("completed");
    expect(expired.bkash_trx_id).toBe("LATE123");
    expect(Order.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: expired.order_id }),
      expect.objectContaining({
        $set: expect.objectContaining({ delivery_fee_status: "paid" }),
      }),
    );
  });

  it("reconciles full payment to paid merchandise and zero COD", async () => {
    const pending = attempt("verification_pending", "1260.00", "order_total");
    pending.order_revision = 2;
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    vi.spyOn(Order, "findById").mockResolvedValue({
      ...order(),
      full_payment_locked_revision: 2,
      revision: 3,
    } as never);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Completed",
      paymentID: "TR001",
      trxID: "FULL123",
      amount: "1260.00",
      currency: "BDT",
      merchantInvoiceNumber: pending.merchant_invoice_number,
    });

    await handleBkashCallback({ paymentID: "TR001", status: "success" });

    expect(Order.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: pending.order_id,
        full_payment_locked_revision: 2,
        "financials.overall_order_value": 1260,
        "financials.cod_collected": 0,
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          payment_method: "bkash_full",
          delivery_fee_status: "paid",
          "financials.merchandise_paid_online": 1200,
          "financials.cod_due": 0,
          cod_status: "not_required",
        }),
      }),
    );
  });

  it("flags a COD-first/full-payment settlement interleaving instead of double collecting", async () => {
    const pending = attempt("verification_pending", "1260.00", "order_total");
    pending.order_revision = 2;
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    vi.spyOn(Order, "findById").mockResolvedValue({
      ...order(),
      full_payment_locked_revision: 2,
      revision: 3,
      financials: {
        ...order().financials,
        cod_collected: 1200,
      },
    } as never);
    vi.spyOn(Order, "exists").mockResolvedValue(null);
    const update = vi.spyOn(Order, "updateOne").mockImplementation((async (filter: Record<string, unknown>) => {
      if ("financials.cod_collected" in filter) return { modifiedCount: 0 };
      return { modifiedCount: 1 };
    }) as never);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Completed",
      paymentID: "TR001",
      trxID: "CODFIRST123",
      amount: "1260.00",
      currency: "BDT",
      merchantInvoiceNumber: pending.merchant_invoice_number,
    });

    await handleBkashCallback({ paymentID: "TR001", status: "success" });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: pending.order_id,
        "financials.cod_collected": 0,
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          "financials.merchandise_paid_online": 1200,
          "financials.cod_due": 0,
        }),
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: pending.order_id,
        financial_review_required: { $ne: true },
      }),
      expect.objectContaining({
        $set: { financial_review_required: true },
        $push: expect.objectContaining({
          activity: expect.objectContaining({ event: "payment_order_version_mismatch" }),
        }),
      }),
    );
  });

  it("does not credit a full payment when its Order lock version no longer matches", async () => {
    const pending = attempt("verification_pending", "1260.00", "order_total");
    pending.order_revision = 2;
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    vi.spyOn(Order, "findById").mockResolvedValue({
      ...order(),
      full_payment_locked_revision: 3,
      revision: 4,
      financials: {
        ...order().financials,
        merchandise_total: 1500,
        overall_order_value: 1560,
      },
    } as never);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Completed",
      paymentID: "TR001",
      trxID: "STALEFULL",
      amount: "1260.00",
      currency: "BDT",
      merchantInvoiceNumber: pending.merchant_invoice_number,
    });

    await handleBkashCallback({ paymentID: "TR001", status: "success" });

    expect(Order.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: pending.order_id,
        financial_review_required: { $ne: true },
      }),
      expect.objectContaining({
        $set: { financial_review_required: true },
        $push: expect.objectContaining({
          activity: expect.objectContaining({
            event: "payment_order_version_mismatch",
          }),
        }),
      }),
    );
    expect(Order.updateOne).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({
          "financials.merchandise_paid_online": expect.any(Number),
        }),
      }),
    );
  });

  it("flags a late cross-purpose completion instead of overwriting the first settlement", async () => {
    const pending = attempt("verification_pending", "1260.00", "order_total");
    const settledOrder = {
      ...order(),
      settled_payment_attempt_id: new Types.ObjectId(),
    };
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(settledOrder as never);
    mocks.queryPayment.mockResolvedValue({
      statusCode: "0000",
      transactionStatus: "Completed",
      paymentID: "TR001",
      trxID: "LATEFULL",
      amount: "1260.00",
      currency: "BDT",
      merchantInvoiceNumber: pending.merchant_invoice_number,
    });

    await handleBkashCallback({ paymentID: "TR001", status: "success" });

    expect(Order.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: settledOrder._id,
        financial_review_required: { $ne: true },
      }),
      expect.objectContaining({
        $set: { financial_review_required: true },
      }),
    );
    expect(Order.updateOne).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({
          "financials.merchandise_paid_online": 1200,
        }),
      }),
    );
  });

  it.each([
    ["failure", "failure_signature_hash"],
    ["cancel", "cancel_signature_hash"],
  ] as const)("syncs the Order fee status after a signed %s callback", async (status, signatureField) => {
    const pending = attempt("initiated");
    pending[signatureField] = hash("signed-callback");
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);

    await handleBkashCallback({
      paymentID: "TR001",
      status,
      signature: "signed-callback",
    });

    expect(pending.status).toBe(status === "cancel" ? "cancelled" : "failed");
    expect(Order.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: pending.order_id,
        delivery_fee_status: { $nin: ["paid", "failed"] },
      }),
      expect.objectContaining({ $set: { delivery_fee_status: "failed" } }),
    );
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

  it("keeps ambiguous gateway errors verification-pending", async () => {
    const pending = attempt("verification_pending");
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(pending) as never);
    mocks.executePayment.mockResolvedValue({ statusCode: "2062", statusMessage: "Already completed" });
    mocks.queryPayment.mockResolvedValue({
      statusCode: "2054",
      statusMessage: "Could not resolve payment status",
    });

    await recheckPendingPayment(pending.order_id!.toString());

    expect(pending.status).toBe("verification_pending");
    expect(pending.terminal_confirmed_at).toBeUndefined();
  });

  it("resolves a completed result to Order number, fee paid and frozen COD", async () => {
    const completed = attempt("completed");
    completed.result_token_hash = "stored";
    vi.spyOn(PaymentAttempt, "findOne").mockReturnValue(chainResult(completed) as never);
    vi.spyOn(Order, "findById").mockResolvedValue(order() as never);

    const result = await resolvePaymentResult("r".repeat(43));

    expect(result).toMatchObject({ state: "completed", order_number: "MN-20260805-0001", fee_paid: 60, cod_due: 1200 });
    expect(result).not.toHaveProperty("amount");
  });

  it("blocks payment creation and retry during checkout maintenance", async () => {
    process.env.CHECKOUT_MAINTENANCE_MODE = "true";
    await expect(startBkashPayment(input, "idempotency-key-with-safe-length")).rejects.toMatchObject({ statusCode: 503 });
    await expect(retryBkashPayment({ retry_token: "x".repeat(43) })).rejects.toMatchObject({ statusCode: 503 });
  });
});

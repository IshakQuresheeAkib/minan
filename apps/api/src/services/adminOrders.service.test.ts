import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildVerifiedCartSnapshot: vi.fn(),
}));

vi.mock("./checkoutCart.service.js", () => ({
  buildVerifiedCartSnapshot: mocks.buildVerifiedCartSnapshot,
}));

import { Order } from "../models/Order.js";
import { OrderCounter } from "../models/OrderCounter.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import { orderTransitionSchema } from "../schemas/order.schemas.js";
import {
  createOrderExchange,
  escapeCsvCell,
  exportAdminOrdersCsv,
  recordOrderCod,
  transitionOrder,
  updateOrderCustomer,
  updateOrderItems,
} from "./adminOrders.service.js";

function chainResult<T>(value: T) {
  const promise = Promise.resolve(value);
  const chain = {
    limit: vi.fn(() => promise),
    select: vi.fn(() => promise),
    skip: vi.fn(() => chain),
    sort: vi.fn(() => chain),
    then: promise.then.bind(promise),
  };
  return chain;
}

describe("Order CSV security", () => {
  it("quotes embedded delimiters and neutralizes spreadsheet formulas", () => {
    expect(escapeCsvCell('Shirt, "Black"')).toBe('"Shirt, ""Black"""');
    expect(escapeCsvCell("=HYPERLINK(\"https://bad.example\")")).toBe('"\'=HYPERLINK(""https://bad.example"")"');
    expect(escapeCsvCell("+8801700000000")).toBe('"\'+8801700000000"');
  });

  it("exports the settled transaction and lists duplicate completed transactions separately", async () => {
    const orderId = new Types.ObjectId();
    const settledAttemptId = new Types.ObjectId();
    const now = new Date("2026-08-12T06:00:00.000Z");
    vi.spyOn(Order, "find").mockReturnValue(chainResult([{
      _id: orderId,
      order_number: "MN-20260812-0001",
      createdAt: now,
      status: "new",
      payment_method: "cod",
      delivery_fee_status: "paid",
      cod_status: "due",
      name: "MINAN Customer",
      phone_number: "01700000000",
      email: "customer@example.com",
      address: "Sylhet",
      shipping_zone: "inside_sylhet",
      lines: [{
        name: "Shirt",
        size: "M",
        color: "Black",
        quantity: 1,
      }],
      financials: {
        merchandise_subtotal: 1200,
        order_discount: 0,
        merchandise_total: 1200,
        merchandise_paid_online: 0,
        delivery_fee: 60,
        cod_due: 1200,
        cod_collected: 0,
        merchandise_refunded: 0,
      },
      courier_name: "",
      tracking_number: "",
      settled_payment_attempt_id: settledAttemptId,
    }]) as never);
    vi.spyOn(PaymentAttempt, "find").mockReturnValue(chainResult([
      {
        _id: new Types.ObjectId(),
        order_id: orderId,
        sequence: 2,
        bkash_trx_id: "DUPLICATE123",
      },
      {
        _id: settledAttemptId,
        order_id: orderId,
        sequence: 1,
        bkash_trx_id: "SETTLED123",
      },
    ]) as never);

    const csv = await exportAdminOrdersCsv({});

    expect(csv).toContain('"bKash transaction","Duplicate bKash transactions"');
    expect(csv).toContain('"SETTLED123","DUPLICATE123"');
    expect(csv).not.toContain('"DUPLICATE123","SETTLED123"');
  });
});

describe("Order workflow integrity", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(PaymentAttempt, "exists").mockResolvedValue(null);
  });

  it("rejects generic transitions to returned or exchanged", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue({
      _id: new Types.ObjectId(),
      status: "delivered",
      delivery_fee_status: "paid",
    } as never);

    const admin = { id: new Types.ObjectId().toString(), email: "admin@example.com" };
    const input = { expected_revision: 1, status: "exchanged" as const };

    await expect(
      transitionOrder(new Types.ObjectId().toString(), input, admin),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("does not accept the retired packing status", () => {
    expect(orderTransitionSchema.safeParse({ status: "packing", expected_revision: 1 }).success).toBe(false);
    expect(orderTransitionSchema.safeParse({ status: "shipped", expected_revision: 1 }).success).toBe(true);
  });

  it("collects the outstanding COD without an action selector", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue({
      financials: { cod_due: 1200, cod_collected: 0 },
      cod_status: "due",
    } as never);
    const persistenceReached = new Error("COD mutation reached persistence");
    const update = vi.spyOn(Order, "findOneAndUpdate").mockRejectedValue(persistenceReached);

    await expect(
      recordOrderCod(
        new Types.ObjectId().toString(),
        { expected_revision: 1 },
        { id: new Types.ObjectId().toString(), email: "admin@example.com" },
      ),
    ).rejects.toBe(persistenceReached);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        revision: 1,
        "financials.merchandise_paid_online": 0,
      }),
      expect.objectContaining({
        $set: { "financials.cod_collected": 1200, cod_status: "collected" },
        $push: expect.objectContaining({
          activity: expect.objectContaining({ event: "cod_collected", metadata: { amount: 1200 } }),
        }),
      }),
      expect.objectContaining({ new: true, runValidators: true }),
    );
  });

  it("does not let an item edit reduce the Order below collected COD", async () => {
    const lineId = "d8322e7a-5585-4b84-9a8a-152b1bcf25e8";
    const productId = new Types.ObjectId().toString();
    const replacementProductId = new Types.ObjectId().toString();
    vi.spyOn(Order, "findById").mockResolvedValue({
      status: "new",
      lines: [{
        line_id: lineId,
        product_id: productId,
        name: "Shirt",
        unit_price: 1200,
        original_price: 1200,
        product_discount: 0,
        size: "M",
        color: "Black",
        quantity: 1,
        allocated_order_discount: 0,
        returned_quantity: 0,
        credited_amount: 0,
      }],
      financials: {
        delivery_fee: 100,
        merchandise_paid_online: 0,
        exchange_credit_applied: 0,
        cod_collected: 1200,
        merchandise_refunded: 0,
        exchange_credit_issued: 0,
      },
      cod_status: "collected",
    } as never);
    mocks.buildVerifiedCartSnapshot.mockResolvedValue({
      items: [{
        product_id: replacementProductId,
        name: "Shirt",
        price: 1000,
        original_price: 1000,
        discount: 0,
        size: "M",
        color: "Black",
        quantity: 1,
      }],
      total: 1000,
    });
    vi.spyOn(Order, "findOneAndUpdate").mockRejectedValue(new Error("Item mutation reached persistence"));

    await expect(
      updateOrderItems(
        new Types.ObjectId().toString(),
        {
          items: [{ product_id: replacementProductId, size: "M", color: "Black", quantity: 1 }],
          order_discount: 0,
          customer_confirmed: true,
          expected_revision: 1,
          reason: "Customer approved a lower-price replacement",
        },
        { id: new Types.ObjectId().toString(), email: "admin@example.com" },
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("locks item edits after a full-payment attempt exists", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue({
      _id: new Types.ObjectId(),
      status: "new",
      cod_status: "due",
    } as never);
    vi.mocked(PaymentAttempt.exists).mockResolvedValue({ _id: new Types.ObjectId() } as never);

    await expect(
      updateOrderItems(
        new Types.ObjectId().toString(),
        {
          items: [{ product_id: new Types.ObjectId().toString(), size: "M", color: "Black", quantity: 1 }],
          order_discount: 0,
          customer_confirmed: true,
          expected_revision: 1,
          reason: "Customer requested a change",
        },
        { id: new Types.ObjectId().toString(), email: "admin@example.com" },
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.buildVerifiedCartSnapshot).not.toHaveBeenCalled();
  });

  it("keeps the full-payment lock in the atomic item-update predicate", async () => {
    const orderId = new Types.ObjectId();
    const productId = new Types.ObjectId().toString();
    const now = new Date();
    const current = {
      _id: orderId,
      order_number: "MN-20260805-0001",
      name: "MINAN Customer",
      phone_number: "01700000000",
      email: "customer@example.com",
      address: "Dhaka",
      checkout_source: "cart",
      shipping_zone: "inside_sylhet",
      revision: 2,
      status: "new",
      delivery_fee_status: "paid",
      cod_status: "due",
      lines: [],
      financials: {
        merchandise_subtotal: 0,
        order_discount: 0,
        merchandise_total: 0,
        delivery_fee: 100,
        overall_order_value: 100,
        merchandise_paid_online: 0,
        exchange_credit_applied: 0,
        cod_due: 0,
        cod_collected: 0,
        merchandise_refunded: 0,
        exchange_credit_issued: 0,
      },
      duplicate_order_ids: [],
      duplicate_review_state: "none",
      financial_review_required: false,
      activity: [],
      refunds: [],
      createdAt: now,
      updatedAt: now,
    };
    vi.spyOn(Order, "findById").mockResolvedValue(current as never);
    mocks.buildVerifiedCartSnapshot.mockResolvedValue({
      items: [{
        product_id: productId,
        name: "Shirt",
        price: 1200,
        original_price: 1200,
        discount: 0,
        size: "M",
        color: "Black",
        quantity: 1,
      }],
      total: 1200,
    });
    vi.spyOn(Order, "findOneAndUpdate").mockResolvedValue({
      ...current,
      revision: 3,
    } as never);

    await updateOrderItems(
      orderId.toString(),
      {
        items: [{ product_id: productId, size: "M", color: "Black", quantity: 1 }],
        order_discount: 0,
        customer_confirmed: true,
        expected_revision: 2,
        reason: "Customer requested a change",
      },
      { id: new Types.ObjectId().toString(), email: "admin@example.com" },
    );

    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: orderId.toString(),
        revision: 2,
        full_payment_locked_revision: { $exists: false },
      }),
      expect.anything(),
      expect.anything(),
    );
  });

  it("updates normalized email with an admin customer email correction", async () => {
    const orderId = new Types.ObjectId();
    vi.spyOn(Order, "findById").mockResolvedValue({ status: "new" } as never);
    const persistenceReached = new Error("customer update reached persistence");
    const update = vi.spyOn(Order, "findOneAndUpdate").mockRejectedValue(persistenceReached);

    await expect(updateOrderCustomer(
      orderId.toString(),
      {
        email: "Corrected@Example.COM",
        expected_revision: 2,
        reason: "Customer corrected their email address",
      },
      { id: new Types.ObjectId().toString(), email: "admin@example.com" },
    )).rejects.toBe(persistenceReached);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ _id: orderId.toString(), revision: 2 }),
      expect.objectContaining({
        $set: {
          email: "Corrected@Example.COM",
          normalized_email: "corrected@example.com",
        },
      }),
      expect.objectContaining({ new: true, runValidators: true }),
    );
  });

  it("inherits customer ownership and normalized email for exchange replacements", async () => {
    const sourceId = new Types.ObjectId();
    const customerId = new Types.ObjectId();
    const lineId = "d8322e7a-5585-4b84-9a8a-152b1bcf25e8";
    vi.spyOn(Order, "findById").mockResolvedValue({
      _id: sourceId,
      order_number: "MN-20260830-0001",
      customer_id: customerId,
      name: "Test Customer",
      phone_number: "01700000000",
      normalized_phone: "01700000000",
      email: "Customer@Example.com",
      normalized_email: "customer@example.com",
      address: "Sylhet, Bangladesh",
      status: "delivered",
      lines: [{
        line_id: lineId,
        product_id: new Types.ObjectId().toString(),
        name: "Original Shirt",
        unit_price: 1200,
        original_price: 1200,
        product_discount: 0,
        size: "M",
        color: "Black",
        quantity: 1,
        allocated_order_discount: 0,
        returned_quantity: 0,
        credited_amount: 0,
      }],
      financials: { exchange_credit_issued: 0 },
    } as never);
    mocks.buildVerifiedCartSnapshot.mockResolvedValue({
      items: [{
        product_id: new Types.ObjectId().toString(),
        name: "Replacement Shirt",
        image_url: "https://res.cloudinary.com/minan/image/upload/replacement.webp",
        price: 1300,
        original_price: 1300,
        discount: 0,
        size: "L",
        color: "Blue",
        quantity: 1,
      }],
      total: 1300,
    });
    vi.spyOn(OrderCounter, "findOneAndUpdate").mockResolvedValue({ sequence: 2 } as never);
    const persistenceReached = new Error("replacement reached persistence");
    const create = vi.spyOn(Order, "create").mockRejectedValue(persistenceReached);

    await expect(createOrderExchange(
      sourceId.toString(),
      {
        returned_lines: [{ line_id: lineId, quantity: 1 }],
        replacement_items: [{
          product_id: new Types.ObjectId().toString(),
          size: "L",
          color: "Blue",
          quantity: 1,
        }],
        expected_revision: 1,
        reason: "Customer requested a replacement",
      },
      { id: new Types.ObjectId().toString(), email: "admin@example.com" },
    )).rejects.toBe(persistenceReached);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      customer_id: customerId,
      normalized_email: "customer@example.com",
      guest_access_version: 1,
      lines: [expect.objectContaining({
        image_url: "https://res.cloudinary.com/minan/image/upload/replacement.webp",
      })],
    }));
  });
});

import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  buildVerifiedCartSnapshot: vi.fn(),
}));

vi.mock("./checkoutCart.service.js", () => ({
  buildVerifiedCartSnapshot: mocks.buildVerifiedCartSnapshot,
}));

import { Order } from "../models/Order.js";
import {
  escapeCsvCell,
  recordOrderCod,
  transitionOrder,
  updateOrderItems,
} from "./adminOrders.service.js";

describe("Order CSV security", () => {
  it("quotes embedded delimiters and neutralizes spreadsheet formulas", () => {
    expect(escapeCsvCell('Shirt, "Black"')).toBe('"Shirt, ""Black"""');
    expect(escapeCsvCell("=HYPERLINK(\"https://bad.example\")")).toBe('"\'=HYPERLINK(""https://bad.example"")"');
    expect(escapeCsvCell("+8801700000000")).toBe('"\'+8801700000000"');
  });
});

describe("Order workflow integrity", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
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

  it("does not collect COD after the balance was waived", async () => {
    vi.spyOn(Order, "findById").mockResolvedValue({
      financials: { cod_due: 1200, cod_collected: 0 },
      cod_status: "waived",
    } as never);
    vi.spyOn(Order, "findOneAndUpdate").mockRejectedValue(new Error("COD mutation reached persistence"));

    await expect(
      recordOrderCod(
        new Types.ObjectId().toString(),
        { action: "collect", amount: 1200, expected_revision: 1 },
        { id: new Types.ObjectId().toString(), email: "admin@example.com" },
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
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
});

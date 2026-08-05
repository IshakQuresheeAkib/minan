import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Order } from "../models/Order.js";
import { escapeCsvCell } from "./adminOrders.service.js";
import { transitionOrder } from "./adminOrders.service.js";

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
});

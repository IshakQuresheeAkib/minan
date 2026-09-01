import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ search: vi.fn() }));

vi.mock("../services/publicOrderTracking.service.js", () => ({
  PublicOrderTrackingError: class PublicOrderTrackingError extends Error {
    status: number;
    constructor(message: string, status: number) { super(message); this.status = status; }
  },
  searchPublicOrders: mocks.search,
}));

import { publicOrderSearchHandler } from "./publicOrderTracking.controller.js";

function response() {
  const res = { json: vi.fn(), set: vi.fn(), status: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

describe("public order tracking controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.search.mockResolvedValue({ kind: "order", order: { order_id: "MN-20260901-0001" } });
  });

  it("parses a bounded request and prevents public lookup responses from caching", async () => {
    const res = response();

    await publicOrderSearchHandler({ body: { query: "MN-20260901-0001" } } as Request, res, vi.fn());

    expect(mocks.search).toHaveBeenCalledWith({ query: "MN-20260901-0001", limit: 10 });
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.json).toHaveBeenCalledWith({
      data: { kind: "order", order: { order_id: "MN-20260901-0001" } },
    });
  });

  it("returns the same generic 400 response for malformed public input", async () => {
    const res = response();

    await publicOrderSearchHandler({ body: { query: 1 } } as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid request" });
  });
});

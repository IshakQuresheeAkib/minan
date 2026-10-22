import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveCustomer: vi.fn(),
}));

vi.mock("../middleware/requireCustomerAuth.js", () => ({
  resolveCustomerSession: mocks.resolveCustomer,
}));

import { getCheckoutConfigHandler } from "./checkout.controller.js";

function mockResponse() {
  const headers: Record<string, string> = {};
  let body: unknown;
  let statusCode = 200;

  const res = {
    set: vi.fn((keyOrObj: string | Record<string, string>, val?: string) => {
      if (typeof keyOrObj === "string" && val) {
        headers[keyOrObj] = val;
      } else if (typeof keyOrObj === "object") {
        Object.assign(headers, keyOrObj);
      }
      return res;
    }),
    status: vi.fn((code: number) => {
      statusCode = code;
      return res;
    }),
    json: vi.fn((data: unknown) => {
      body = data;
      return res;
    }),
    end: vi.fn(() => res),
    getHeader: (key: string) => headers[key],
    getBody: () => body,
    getStatusCode: () => statusCode,
  };
  return res as unknown as Response & {
    getHeader: (key: string) => string | undefined;
    getBody: () => { data: { payment_contract?: unknown } };
    getStatusCode: () => number;
  };
}

const originalFees = {
  DELIVERY_FEE_INSIDE_SYLHET_BDT: process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT,
  DELIVERY_FEE_OUTSIDE_SYLHET_BDT: process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT,
};

describe("getCheckoutConfigHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT = "60";
    process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT = "120";
    delete process.env.BKASH_RESTRICT_ACCESS;
    delete process.env.BKASH_UAT_ALLOWED_EMAILS;
  });

  afterEach(() => {
    process.env.DELIVERY_FEE_INSIDE_SYLHET_BDT = originalFees.DELIVERY_FEE_INSIDE_SYLHET_BDT;
    process.env.DELIVERY_FEE_OUTSIDE_SYLHET_BDT = originalFees.DELIVERY_FEE_OUTSIDE_SYLHET_BDT;
    delete process.env.BKASH_RESTRICT_ACCESS;
    delete process.env.BKASH_UAT_ALLOWED_EMAILS;
  });

  it("returns payment_contract when bKash is unrestricted", async () => {
    const req = { get: vi.fn(() => undefined) } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn();

    await getCheckoutConfigHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = res.getBody();
    expect(body.data.payment_contract).toEqual({
      version: 2,
      methods: ["bkash_full", "cod"],
    });
    expect(res.getHeader("Cache-Control")).toContain("public");
  });

  it("omits payment_contract for unauthenticated visitors when restricted", async () => {
    process.env.BKASH_RESTRICT_ACCESS = "true";
    mocks.resolveCustomer.mockResolvedValue(null);

    const req = { get: vi.fn(() => undefined) } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn();

    await getCheckoutConfigHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = res.getBody();
    expect(body.data.payment_contract).toBeUndefined();
    expect(res.getHeader("Cache-Control")).toBe("private, no-cache");
  });

  it("omits payment_contract for general customers when restricted", async () => {
    process.env.BKASH_RESTRICT_ACCESS = "true";
    process.env.BKASH_UAT_ALLOWED_EMAILS = "bkash-uat@minan.com";
    mocks.resolveCustomer.mockResolvedValue({ id: "cust-1", email: "general@example.com" });

    const req = { get: vi.fn(() => undefined) } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn();

    await getCheckoutConfigHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = res.getBody();
    expect(body.data.payment_contract).toBeUndefined();
  });

  it("includes payment_contract for authorized UAT customers when restricted", async () => {
    process.env.BKASH_RESTRICT_ACCESS = "true";
    process.env.BKASH_UAT_ALLOWED_EMAILS = "bkash-uat@minan.com";
    mocks.resolveCustomer.mockResolvedValue({ id: "cust-1", email: "bkash-uat@minan.com" });

    const req = { get: vi.fn(() => undefined) } as unknown as Request;
    const res = mockResponse();
    const next = vi.fn();

    await getCheckoutConfigHandler(req, res, next);

    expect(next).not.toHaveBeenCalled();
    const body = res.getBody();
    expect(body.data.payment_contract).toEqual({
      version: 2,
      methods: ["bkash_full", "cod"],
    });
    expect(res.getHeader("Cache-Control")).toBe("private, no-cache");
  });
});

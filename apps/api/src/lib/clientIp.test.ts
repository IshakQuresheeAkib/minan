import type { Request } from "express";
import { describe, expect, it } from "vitest";

import { getAttributionIp } from "./clientIp.js";

describe("getAttributionIp", () => {
  it("extracts the first public client IP from X-Forwarded-For chain", () => {
    const req = {
      headers: {
        "x-forwarded-for": "203.0.113.195, 76.76.21.21", // client, vercel proxy
      },
      ip: "10.0.0.1",
    } as unknown as Request;

    expect(getAttributionIp(req)).toBe("203.0.113.195");
  });

  it("falls back to x-real-ip if x-forwarded-for is missing", () => {
    const req = {
      headers: {
        "x-real-ip": "198.51.100.5",
      },
      ip: "10.0.0.1",
    } as unknown as Request;

    expect(getAttributionIp(req)).toBe("198.51.100.5");
  });

  it("falls back to req.ip when forwarded headers are missing", () => {
    const req = {
      headers: {},
      ip: "127.0.0.1",
    } as unknown as Request;

    expect(getAttributionIp(req)).toBe("127.0.0.1");
  });
});

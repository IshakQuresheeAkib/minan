import type { Server } from "node:http";
import cookieParser from "cookie-parser";
import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ok: (_req: unknown, res: { status: (code: number) => { send: () => void } }) => {
    res.status(204).send();
  },
}));

vi.mock("../controllers/guestOrderAccess.controller.js", () => ({
  customerOrderReadHandler: mocks.ok,
  guestOrderClaimHandler: mocks.ok,
  guestOrderOtpRequestHandler: mocks.ok,
  guestOrderOtpVerifyHandler: mocks.ok,
  guestOrderReadHandler: mocks.ok,
}));

vi.mock("../middleware/requireCustomerAuth.js", () => ({
  requireCustomerAuth: mocks.ok,
}));

vi.mock("../middleware/requireGuestOrderAccess.js", () => ({
  requireGuestOrderAccess: mocks.ok,
}));

import {
  createCustomerOrdersRouter,
  createGuestOrderAccessRouter,
} from "./guestOrderAccess.routes.js";

let server: Server | undefined;

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => error ? reject(error) : resolve());
    });
    server = undefined;
  }
});

async function startApp(): Promise<string> {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/guest-order-access", createGuestOrderAccessRouter());
  app.use("/api/customer-orders", createCustomerOrdersRouter());
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to TCP");
  }
  return `http://127.0.0.1:${address.port}`;
}

describe("guest Order access route protections", () => {
  it("requires CSRF protection for OTP requests, verification, and claiming", async () => {
    const baseUrl = await startApp();

    for (const path of ["otp/request", "otp/verify", "orders/MN-20260831-0001/claim"]) {
      const response = await fetch(`${baseUrl}/api/guest-order-access/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      expect(response.status, path).toBe(403);
    }
  });

  it("rate limits repeated OTP requests while leaving a generic handler response", async () => {
    const baseUrl = await startApp();
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/guest-order-access/otp/request`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest",
        },
        body: "{}",
      });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 5)).toEqual(Array(5).fill(204));
    expect(statuses.at(-1)).toBe(429);
  });

  it("rate limits repeated OTP verification attempts", async () => {
    const baseUrl = await startApp();
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/guest-order-access/otp/verify`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest",
        },
        body: "{}",
      });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(204));
    expect(statuses.at(-1)).toBe(429);
  });

  it("keeps customer Order reads in a separate authenticated namespace", async () => {
    const baseUrl = await startApp();
    const response = await fetch(`${baseUrl}/api/customer-orders/MN-20260831-0001`);

    expect(response.status).toBe(204);
  });
});

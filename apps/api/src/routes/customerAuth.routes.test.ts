import type { Server } from "node:http";
import cookieParser from "cookie-parser";
import express, { type RequestHandler } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../controllers/customerAuth.controller.js", () => {
  const ok: RequestHandler = (_req, res) => {
    res.status(204).send();
  };
  return {
    customerLoginHandler: ok,
    customerLogoutHandler: ok,
    customerMeHandler: ok,
    customerRefreshHandler: ok,
    customerSignupHandler: ok,
  };
});

import { createCustomerAuthRouter } from "./customerAuth.routes.js";

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
  app.use("/api/customer-auth", createCustomerAuthRouter());
  server = app.listen(0);
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to TCP");
  }
  return `http://127.0.0.1:${address.port}`;
}

describe("customer auth route protections", () => {
  it("requires the CSRF header on every state-changing endpoint", async () => {
    const baseUrl = await startApp();

    for (const path of ["signup", "login", "refresh", "logout"]) {
      const response = await fetch(`${baseUrl}/api/customer-auth/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      expect(response.status, path).toBe(403);
    }
  });

  it("rate limits repeated customer login attempts", async () => {
    const baseUrl = await startApp();
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 11; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/customer-auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-requested-with": "XMLHttpRequest",
        },
        body: JSON.stringify({
          email: "customer@example.com",
          password: "wrong-password",
        }),
      });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(204));
    expect(statuses.at(-1)).toBe(429);
  });
});

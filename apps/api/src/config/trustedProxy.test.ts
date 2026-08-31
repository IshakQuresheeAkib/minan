import type { Server } from "node:http";

import express, { type Request } from "express";
import rateLimit from "express-rate-limit";
import { afterEach, describe, expect, it } from "vitest";

import { configureTrustedProxy } from "./trustedProxy.js";

let server: Server | undefined;

afterEach(async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => error ? reject(error) : resolve());
  });
  server = undefined;
});

async function startApp(): Promise<string> {
  const app = express();
  configureTrustedProxy(app, "production");
  app.get(
    "/limited",
    rateLimit({ windowMs: 60_000, limit: 1 }),
    (req, res) => {
      res.json({ ip: req.ip });
    },
  );

  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server?.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to TCP");
  }

  return `http://127.0.0.1:${address.port}`;
}

describe("trusted proxy configuration", () => {
  it("gives independent trusted client addresses independent limiter buckets", async () => {
    const baseUrl = await startApp();
    const first = await fetch(`${baseUrl}/limited`, {
      headers: { "x-forwarded-for": "198.51.100.10" },
    });
    const second = await fetch(`${baseUrl}/limited`, {
      headers: { "x-forwarded-for": "198.51.100.11" },
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ ip: "198.51.100.10" });
    await expect(second.json()).resolves.toEqual({ ip: "198.51.100.11" });
  });

  it("stops at the nearest untrusted address instead of accepting a spoofed prefix", async () => {
    const baseUrl = await startApp();
    const response = await fetch(`${baseUrl}/limited`, {
      headers: {
        "x-forwarded-for": "203.0.113.250, 198.51.100.20",
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ip: "198.51.100.20" });
  });

  it("ignores a spoofed forwarded address from an untrusted socket peer", () => {
    const app = express();
    configureTrustedProxy(app, "production");
    const request = Object.assign(Object.create(express.request) as Request, {
      app,
      headers: { "x-forwarded-for": "203.0.113.250" },
      socket: { remoteAddress: "198.51.100.30" },
    });

    expect(request.ip).toBe("198.51.100.30");
  });

  it("does not trust forwarded addresses outside production", () => {
    const app = express();
    configureTrustedProxy(app, "development");

    expect(app.get("trust proxy")).toBe(false);
  });
});

import { once } from "node:events";

import express, { type Request, type Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

const controllerMocks = vi.hoisted(() => ({
  callback: vi.fn((_req: Request, res: Response) => res.sendStatus(204)),
  create: vi.fn((_req: Request, res: Response) => res.json({ data: {} })),
  resolve: vi.fn((_req: Request, res: Response) => res.json({ data: {} })),
  retry: vi.fn((_req: Request, res: Response) => res.json({ data: {} })),
}));

vi.mock("../controllers/bkash.controller.js", () => ({
  bkashCallbackHandler: controllerMocks.callback,
  createBkashPaymentHandler: controllerMocks.create,
  resolveBkashResultHandler: controllerMocks.resolve,
  retryBkashPaymentHandler: controllerMocks.retry,
}));

import { Order } from "../models/Order.js";
import { bkashRouter } from "./bkash.routes.js";

async function withServer(run: (origin: string) => Promise<void>): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use("/api/bkash", bkashRouter);
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to TCP");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

const xhrHeaders = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

describe("bKash route rate-limit boundaries", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("caps idempotency lookups by IP before the key-aware limiter", async () => {
    const exists = vi.spyOn(Order, "exists").mockResolvedValue(null);

    await withServer(async (origin) => {
      for (let index = 0; index < 25; index += 1) {
        await fetch(`${origin}/api/bkash/payments`, {
          method: "POST",
          headers: {
            ...xhrHeaders,
            "Idempotency-Key": `checkout-attempt-${index.toString().padStart(16, "0")}`,
          },
          body: "{}",
        });
      }
    });

    expect(exists).toHaveBeenCalledTimes(20);
  });

  it("caps rotating result references by IP", async () => {
    await withServer(async (origin) => {
      for (let index = 0; index < 125; index += 1) {
        await fetch(`${origin}/api/bkash/results/resolve`, {
          method: "POST",
          headers: xhrHeaders,
          body: JSON.stringify({ reference: `${index}`.padEnd(43, "r") }),
        });
      }
    });

    expect(controllerMocks.resolve).toHaveBeenCalledTimes(120);
  });
});

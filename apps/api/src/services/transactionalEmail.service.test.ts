import { describe, expect, it, vi } from "vitest";

import {
  EmailDeliveryError,
  createResendEmailAdapter,
  type TransactionalEmailTransport,
} from "./transactionalEmail.service.js";

describe("Resend transactional email adapter", () => {
  it("delivers through an injected transport without contacting Resend", async () => {
    const send = vi.fn(async () => ({ id: "email_123" }));
    const transport: TransactionalEmailTransport = { send };
    const adapter = createResendEmailAdapter(
      { apiKey: "re_test_123", from: "MINAN <orders@minan.com>" },
      transport,
    );

    await expect(adapter.send({
      to: "customer@example.com",
      subject: "Your MINAN update",
      html: "<p>Your order is confirmed.</p>",
      text: "Your order is confirmed.",
      idempotency_key: "order-1:status_confirmed:7",
    })).resolves.toEqual({ id: "email_123" });
    expect(send).toHaveBeenCalledWith({
      from: "MINAN <orders@minan.com>",
      to: ["customer@example.com"],
      subject: "Your MINAN update",
      html: "<p>Your order is confirmed.</p>",
      text: "Your order is confirmed.",
    }, { idempotencyKey: "order-1:status_confirmed:7" });
  });

  it("converts provider failures to a stable delivery error", async () => {
    const transport: TransactionalEmailTransport = {
      send: vi.fn(async () => {
        throw new Error("provider diagnostic must remain internal");
      }),
    };
    const adapter = createResendEmailAdapter(
      { apiKey: "re_test_123", from: "orders@minan.com" },
      transport,
    );

    await expect(adapter.send({
      to: "customer@example.com",
      subject: "Subject",
      html: "<p>Body</p>",
    })).rejects.toEqual(new EmailDeliveryError("Email delivery failed"));
  });
});

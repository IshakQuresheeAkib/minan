import { Resend } from "resend";

import type { ResendConfig } from "../config/resend.js";

export type TransactionalEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type ProviderEmailInput = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
};

export type TransactionalEmailTransport = {
  send(input: ProviderEmailInput): Promise<{ id: string }>;
};

export type TransactionalEmailAdapter = {
  send(input: TransactionalEmailInput): Promise<{ id: string }>;
};

export class EmailDeliveryError extends Error {
  constructor(message = "Email delivery failed") {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function createResendTransport(apiKey: string): TransactionalEmailTransport {
  const resend = new Resend(apiKey);
  return {
    async send(input) {
      const { data, error } = await resend.emails.send(input);
      if (error || !data) {
        throw new Error("Resend rejected the email");
      }
      return { id: data.id };
    },
  };
}

export function createResendEmailAdapter(
  config: ResendConfig,
  transport: TransactionalEmailTransport = createResendTransport(config.apiKey),
): TransactionalEmailAdapter {
  return {
    async send(input) {
      try {
        return await transport.send({
          from: config.from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          ...(input.text === undefined ? {} : { text: input.text }),
        });
      } catch {
        throw new EmailDeliveryError();
      }
    },
  };
}

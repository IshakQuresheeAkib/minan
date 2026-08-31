import { z } from "zod";

export type ResendConfig = {
  apiKey: string;
  from: string;
};

function isValidSender(value: string): boolean {
  const friendlyMatch = value.match(/^[^<>]+<([^<>]+)>$/);
  const address = friendlyMatch?.[1]?.trim() ?? value;
  return z.string().email().safeParse(address).success;
}

export function getResendConfig(
  env: Record<string, string | undefined> = process.env,
): ResendConfig {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey?.startsWith("re_")) {
    throw new Error("RESEND_API_KEY must be a valid Resend API key");
  }

  const from = env.RESEND_FROM?.trim();
  if (!from || !isValidSender(from)) {
    throw new Error("RESEND_FROM must contain a valid sender email");
  }

  return { apiKey, from };
}

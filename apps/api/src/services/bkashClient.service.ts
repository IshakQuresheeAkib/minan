import { z } from "zod";

import { getBkashConfig } from "../config/bkash.js";
import { AppError } from "../lib/errors.js";
import { BkashToken } from "../models/BkashToken.js";

const tokenResponseSchema = z.object({
  id_token: z.string().min(1),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.coerce.number().positive().optional(),
});

const createResponseSchema = z.object({
  paymentID: z.string().min(1).optional(),
  bkashURL: z.url().optional(),
  callbackURL: z.string().optional(),
  successCallbackURL: z.string().optional(),
  failureCallbackURL: z.string().optional(),
  cancelledCallbackURL: z.string().optional(),
  statusCode: z.coerce.string(),
  statusMessage: z.string().optional(),
});

const paymentResponseSchema = z.object({
  paymentID: z.string().optional(),
  trxID: z.string().optional(),
  transactionStatus: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional(),
  merchantInvoiceNumber: z.string().optional(),
  merchantInvoice: z.string().optional(),
  statusCode: z.coerce.string(),
  statusMessage: z.string().optional(),
});

export type BkashCreateResponse = z.infer<typeof createResponseSchema>;
export type BkashPaymentResponse = z.infer<typeof paymentResponseSchema>;

type CachedToken = { idToken: string; refreshToken?: string; expiresAt: Date };
let tokenCache: CachedToken | null = null;
let tokenPromise: Promise<string> | null = null;
const REFRESH_SKEW_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AppError("bKash returned an invalid response", 502);
  }
}

async function requestToken(): Promise<string> {
  const config = getBkashConfig();
  const stored = await BkashToken.findOne({ key: "checkout-url" })
    .select("+id_token +refresh_token");
  const now = Date.now();

  if (stored && stored.expires_at.getTime() - REFRESH_SKEW_MS > now) {
    tokenCache = {
      idToken: stored.id_token,
      refreshToken: stored.refresh_token,
      expiresAt: stored.expires_at,
    };
    return stored.id_token;
  }

  const refreshToken = tokenCache?.refreshToken ?? stored?.refresh_token;
  const endpoint = refreshToken
    ? "/tokenized/checkout/token/refresh"
    : "/tokenized/checkout/token/grant";
  const tokenRequest = (path: string, token?: string) => fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      username: config.username,
      password: config.password,
    },
    body: JSON.stringify({
      app_key: config.appKey,
      app_secret: config.appSecret,
      ...(token ? { refresh_token: token } : {}),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  let response = await tokenRequest(endpoint, refreshToken);
  if (!response.ok && refreshToken) {
    response = await tokenRequest("/tokenized/checkout/token/grant");
  }
  if (!response.ok) throw new AppError("Unable to authenticate with bKash", 502);
  const parsed = tokenResponseSchema.safeParse(await parseJson(response));
  if (!parsed.success) throw new AppError("bKash token response was incomplete", 502);

  const expiresAt = new Date(now + (parsed.data.expires_in ?? 3600) * 1000);
  const nextRefreshToken = parsed.data.refresh_token ?? refreshToken;
  await BkashToken.findOneAndUpdate(
    { key: "checkout-url" },
    {
      $set: {
        id_token: parsed.data.id_token,
        expires_at: expiresAt,
        ...(nextRefreshToken ? { refresh_token: nextRefreshToken } : {}),
      },
    },
    { upsert: true, new: true },
  );
  tokenCache = { idToken: parsed.data.id_token, refreshToken: nextRefreshToken, expiresAt };
  return parsed.data.id_token;
}

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt.getTime() - REFRESH_SKEW_MS > Date.now()) {
    return tokenCache.idToken;
  }
  tokenPromise ??= requestToken().finally(() => {
    tokenPromise = null;
  });
  return tokenPromise;
}

async function paymentRequest(path: string, body: object, retryAuth = true): Promise<unknown> {
  const config = getBkashConfig();
  const token = await getToken();
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token,
        "X-App-Key": config.appKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new AppError("bKash request timed out", 504);
    }
    throw new AppError("Unable to reach bKash", 502);
  }

  if (response.status === 401 && retryAuth) {
    tokenCache = null;
    await BkashToken.deleteOne({ key: "checkout-url" });
    return paymentRequest(path, body, false);
  }
  if (!response.ok) throw new AppError("bKash request failed", 502);
  return parseJson(response);
}

export async function createBkashPayment(input: {
  amount: string;
  payerReference: string;
  callbackURL: string;
  merchantInvoiceNumber: string;
}): Promise<BkashCreateResponse> {
  const result = createResponseSchema.safeParse(
    await paymentRequest("/tokenized/checkout/create", {
      mode: "0011",
      payerReference: input.payerReference,
      callbackURL: input.callbackURL,
      amount: input.amount,
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: input.merchantInvoiceNumber,
    }),
  );
  if (!result.success) throw new AppError("bKash create response was incomplete", 502);
  return result.data;
}

export async function executeBkashPayment(paymentID: string): Promise<BkashPaymentResponse> {
  const result = paymentResponseSchema.safeParse(
    await paymentRequest("/tokenized/checkout/execute", { paymentID }),
  );
  if (!result.success) throw new AppError("bKash execute response was incomplete", 502);
  return result.data;
}

export async function queryBkashPayment(paymentID: string): Promise<BkashPaymentResponse> {
  const result = paymentResponseSchema.safeParse(
    await paymentRequest("/tokenized/checkout/payment/status", { paymentID }),
  );
  if (!result.success) throw new AppError("bKash query response was incomplete", 502);
  return result.data;
}

export function clearBkashTokenCacheForTests(): void {
  tokenCache = null;
  tokenPromise = null;
}

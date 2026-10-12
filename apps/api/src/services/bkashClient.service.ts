import { z } from "zod";

import { getBkashConfig } from "../config/bkash.js";
import { AppError } from "../lib/errors.js";
import { BkashToken } from "../models/BkashToken.js";

const tokenResponseSchema = z.object({
  id_token: z.string().min(1).optional(),
  refresh_token: z.string().min(1).optional(),
  expires_in: z.coerce.number().positive().optional(),
  token_type: z.string().optional(),
  statusCode: z.coerce.string().optional(),
  statusMessage: z.string().optional(),
  errorMessageEn: z.string().optional(),
});

const createResponseSchema = z.object({
  paymentID: z.string().min(1).optional(),
  paymentId: z.string().min(1).optional(),
  bkashURL: z.url().optional(),
  callbackURL: z.string().optional(),
  successCallbackURL: z.string().optional(),
  failureCallbackURL: z.string().optional(),
  cancelledCallbackURL: z.string().optional(),
  signature: z.string().optional(),
  transactionStatus: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional(),
  intent: z.string().optional(),
  merchantInvoiceNumber: z.string().optional(),
  statusCode: z.coerce.string().optional(),
  statusMessage: z.string().optional(),
  externalCode: z.string().optional(),
  errorMessageEn: z.string().optional(),
}).transform((data) => {
  const paymentID = data.paymentID ?? data.paymentId;
  const isSuccess = Boolean(paymentID && data.bkashURL);
  return {
    ...data,
    paymentID,
    paymentId: paymentID,
    statusCode: data.statusCode ?? (isSuccess ? "0000" : (data.externalCode ?? "9999")),
    statusMessage: data.statusMessage ?? data.errorMessageEn ?? (data.transactionStatus ? `Status: ${data.transactionStatus}` : undefined),
  };
});

const paymentResponseSchema = z.object({
  paymentID: z.string().optional(),
  paymentId: z.string().optional(),
  trxID: z.string().optional(),
  trxId: z.string().optional(),
  transactionStatus: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional(),
  intent: z.string().optional(),
  merchantInvoiceNumber: z.string().optional(),
  merchantInvoice: z.string().optional(),
  payerAccount: z.string().optional(),
  payerReference: z.string().optional(),
  payerType: z.string().optional(),
  statusCode: z.coerce.string().optional(),
  statusMessage: z.string().optional(),
  externalCode: z.string().optional(),
  errorMessageEn: z.string().optional(),
}).transform((data) => {
  const paymentID = data.paymentID ?? data.paymentId;
  const trxID = data.trxID ?? data.trxId;
  const invoice = data.merchantInvoiceNumber ?? data.merchantInvoice;
  const isCompleted = data.transactionStatus === "Completed";
  return {
    ...data,
    paymentID,
    paymentId: paymentID,
    trxID,
    trxId: trxID,
    merchantInvoiceNumber: invoice,
    merchantInvoice: invoice,
    statusCode: data.statusCode ?? (isCompleted ? "0000" : (data.externalCode ?? "9999")),
    statusMessage: data.statusMessage ?? data.errorMessageEn ?? (data.transactionStatus ? `Status: ${data.transactionStatus}` : undefined),
  };
});

const searchResponseSchema = z.object({
  trxId: z.string().optional(),
  trxID: z.string().optional(),
  transactionType: z.string().optional(),
  initiationTime: z.string().optional(),
  completedTime: z.string().optional(),
  transactionStatus: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional(),
  payerAccount: z.string().optional(),
  organizationAccount: z.string().optional(),
  serviceFee: z.string().optional(),
  payerType: z.string().optional(),
  creditedAmount: z.string().optional(),
  couponAmount: z.string().optional(),
  merchantShareAmount: z.string().optional(),
  maxRefundableAmount: z.union([z.string(), z.number()]).optional(),
  statusCode: z.coerce.string().optional(),
  statusMessage: z.string().optional(),
  externalCode: z.string().optional(),
  errorMessageEn: z.string().optional(),
}).transform((data) => {
  const trxId = data.trxId ?? data.trxID;
  const isCompleted = data.transactionStatus === "Completed";
  return {
    ...data,
    trxId,
    trxID: trxId,
    statusCode: data.statusCode ?? (isCompleted ? "0000" : (data.externalCode ?? "9999")),
    statusMessage: data.statusMessage ?? data.errorMessageEn ?? (data.transactionStatus ? `Status: ${data.transactionStatus}` : undefined),
  };
});

const refundResponseSchema = z.object({
  originalTrxId: z.string().optional(),
  refundTrxId: z.string().optional(),
  refundTransactionStatus: z.string().optional(),
  originalTrxAmount: z.union([z.string(), z.number()]).optional(),
  refundAmount: z.union([z.string(), z.number()]).optional(),
  currency: z.string().optional(),
  completedTime: z.string().optional(),
  sku: z.string().optional(),
  reason: z.string().optional(),
  statusCode: z.coerce.string().optional(),
  statusMessage: z.string().optional(),
  externalCode: z.string().optional(),
  errorMessageEn: z.string().optional(),
}).transform((data) => {
  const isCompleted = data.refundTransactionStatus === "Completed";
  return {
    ...data,
    statusCode: data.statusCode ?? (isCompleted ? "0000" : (data.externalCode ?? "9999")),
    statusMessage: data.statusMessage ?? data.errorMessageEn ?? (data.refundTransactionStatus ? `Status: ${data.refundTransactionStatus}` : undefined),
  };
});

const refundStatusResponseSchema = z.object({
  originalTrxId: z.string().optional(),
  originalTrxAmount: z.union([z.string(), z.number()]).optional(),
  originalTrxCompletedTime: z.string().optional(),
  refundTransactions: z.array(
    z.object({
      refundTrxId: z.string().optional(),
      refundTransactionStatus: z.string().optional(),
      refundAmount: z.union([z.string(), z.number()]).optional(),
      completedTime: z.string().optional(),
    }),
  ).optional(),
  statusCode: z.coerce.string().optional(),
  statusMessage: z.string().optional(),
  externalCode: z.string().optional(),
  errorMessageEn: z.string().optional(),
}).transform((data) => {
  return {
    ...data,
    statusCode: data.statusCode ?? (data.originalTrxId ? "0000" : (data.externalCode ?? "9999")),
    statusMessage: data.statusMessage ?? data.errorMessageEn,
  };
});

export type BkashCreateResponse = z.infer<typeof createResponseSchema>;
export type BkashPaymentResponse = z.infer<typeof paymentResponseSchema>;
export type BkashSearchResponse = z.infer<typeof searchResponseSchema>;
export type BkashRefundResponse = z.infer<typeof refundResponseSchema>;
export type BkashRefundStatusResponse = z.infer<typeof refundStatusResponseSchema>;

type CachedToken = { idToken: string; refreshToken?: string; expiresAt: Date };
let tokenCache: CachedToken | null = null;
let tokenPromise: Promise<string> | null = null;

const REFRESH_SKEW_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;

// Rate limit protection: Max 2 Grant Token calls per 60 minutes
let grantTokenCallTimestamps: number[] = [];
const MAX_GRANT_CALLS_PER_HOUR = 2;
const ONE_HOUR_MS = 60 * 60 * 1000;

function canCallGrantToken(): boolean {
  const now = Date.now();
  grantTokenCallTimestamps = grantTokenCallTimestamps.filter((ts) => now - ts < ONE_HOUR_MS);
  return grantTokenCallTimestamps.length < MAX_GRANT_CALLS_PER_HOUR;
}

function recordGrantTokenCall(): void {
  const now = Date.now();
  grantTokenCallTimestamps = grantTokenCallTimestamps.filter((ts) => now - ts < ONE_HOUR_MS);
  grantTokenCallTimestamps.push(now);
}

function resolveEndpoint(baseUrl: string, relativePath: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const isV1 = cleanBase.includes("/v1");

  if (isV1) {
    // Legacy V1 mapping
    if (relativePath === "/tokenized-checkout/auth/grant-token") return `${cleanBase}/tokenized/checkout/token/grant`;
    if (relativePath === "/tokenized-checkout/auth/refresh-token") return `${cleanBase}/tokenized/checkout/token/refresh`;
    if (relativePath === "/tokenized-checkout/payment/create") return `${cleanBase}/tokenized/checkout/create`;
    if (relativePath === "/tokenized-checkout/payment/execute") return `${cleanBase}/tokenized/checkout/execute`;
    if (relativePath === "/tokenized-checkout/query/payment") return `${cleanBase}/tokenized/checkout/payment/status`;
    if (relativePath === "/tokenized-checkout/refund/payment/transaction") return `${cleanBase}/tokenized/checkout/payment/refund`;
    return `${cleanBase}${relativePath}`;
  }

  // Tokenized Checkout V2 mapping
  if (!cleanBase.endsWith("/v2")) {
    return `${cleanBase}/v2${relativePath}`;
  }
  return `${cleanBase}${relativePath}`;
}

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
  const isRefreshAttempt = Boolean(refreshToken);

  const tokenRequest = (path: string, token?: string) => {
    const fullUrl = resolveEndpoint(config.baseUrl, path);
    return fetch(fullUrl, {
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
  };

  const executeGrantToken = async (): Promise<z.infer<typeof tokenResponseSchema> & { id_token: string }> => {
    if (!canCallGrantToken()) {
      throw new AppError(
        "bKash Grant Token rate limit protection reached (max 2 requests per hour). Please retry in a few moments.",
        429,
      );
    }
    recordGrantTokenCall();
    const grantResponse = await tokenRequest("/tokenized-checkout/auth/grant-token");
    if (!grantResponse.ok) {
      throw new AppError("Unable to authenticate with bKash", 502);
    }
    const raw = await parseJson(grantResponse);
    const parsed = tokenResponseSchema.safeParse(raw);
    if (!parsed.success || (parsed.data.statusCode && parsed.data.statusCode !== "0000") || !parsed.data.id_token) {
      const errorMsg = (parsed.success && (parsed.data.statusMessage || parsed.data.errorMessageEn))
        || "bKash token response was incomplete";
      throw new AppError(errorMsg, 502);
    }
    return parsed.data as z.infer<typeof tokenResponseSchema> & { id_token: string };
  };

  const executeRefreshToken = async (token: string): Promise<(z.infer<typeof tokenResponseSchema> & { id_token: string }) | null> => {
    try {
      const refreshResponse = await tokenRequest("/tokenized-checkout/auth/refresh-token", token);
      if (refreshResponse.ok) {
        const raw = await parseJson(refreshResponse);
        const parsed = tokenResponseSchema.safeParse(raw);
        if (parsed.success && (!parsed.data.statusCode || parsed.data.statusCode === "0000") && parsed.data.id_token) {
          return parsed.data as z.infer<typeof tokenResponseSchema> & { id_token: string };
        }
      }
    } catch {
      // Refresh request timed out or errored; fallback to grant-token
    }
    return null;
  };

  const refreshedData = isRefreshAttempt && refreshToken
    ? await executeRefreshToken(refreshToken)
    : null;
  const tokenData = refreshedData ?? (await executeGrantToken());

  const expiresAt = new Date(now + (tokenData.expires_in ?? 3600) * 1000);
  const nextRefreshToken = tokenData.refresh_token ?? refreshToken;

  await BkashToken.findOneAndUpdate(
    { key: "checkout-url" },
    {
      $set: {
        id_token: tokenData.id_token,
        expires_at: expiresAt,
        ...(nextRefreshToken ? { refresh_token: nextRefreshToken } : {}),
      },
    },
    { upsert: true, new: true },
  );

  tokenCache = { idToken: tokenData.id_token, refreshToken: nextRefreshToken, expiresAt };
  return tokenData.id_token;
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
  const fullUrl = resolveEndpoint(config.baseUrl, path);
  let response: Response;

  try {
    response = await fetch(fullUrl, {
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
    // Expire token in DB so requestToken() uses refresh_token rather than immediately blowing away refresh capabilities
    await BkashToken.updateOne(
      { key: "checkout-url" },
      { $set: { expires_at: new Date(0) } },
    );
    return paymentRequest(path, body, false);
  }

  if (!response.ok) {
    throw new AppError("bKash request failed", 502);
  }

  return parseJson(response);
}

export async function createBkashPayment(input: {
  amount: string;
  payerReference: string;
  callbackURL: string;
  merchantInvoiceNumber: string;
}): Promise<BkashCreateResponse> {
  const result = createResponseSchema.safeParse(
    await paymentRequest("/tokenized-checkout/payment/create", {
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
    await paymentRequest("/tokenized-checkout/payment/execute", {
      paymentId: paymentID,
      paymentID,
    }),
  );
  if (!result.success) throw new AppError("bKash execute response was incomplete", 502);
  return result.data;
}

export async function queryBkashPayment(paymentID: string): Promise<BkashPaymentResponse> {
  const result = paymentResponseSchema.safeParse(
    await paymentRequest("/tokenized-checkout/query/payment", {
      paymentId: paymentID,
      paymentID,
    }),
  );
  if (!result.success) throw new AppError("bKash query response was incomplete", 502);
  return result.data;
}

export async function searchBkashTransaction(trxId: string): Promise<BkashSearchResponse> {
  const result = searchResponseSchema.safeParse(
    await paymentRequest("/tokenized-checkout/general/search-transaction", {
      trxId,
    }),
  );
  if (!result.success) throw new AppError("bKash search transaction response was incomplete", 502);
  return result.data;
}

export async function refundBkashTransaction(input: {
  paymentId: string;
  trxId: string;
  refundAmount: string;
  sku: string;
  reason: string;
}): Promise<BkashRefundResponse> {
  const result = refundResponseSchema.safeParse(
    await paymentRequest("/tokenized-checkout/refund/payment/transaction", {
      paymentId: input.paymentId,
      trxId: input.trxId,
      refundAmount: input.refundAmount,
      sku: input.sku,
      reason: input.reason,
    }),
  );
  if (!result.success) throw new AppError("bKash refund response was incomplete", 502);
  return result.data;
}

export async function refundStatusBkash(input: {
  paymentId: string;
  trxId: string;
}): Promise<BkashRefundStatusResponse> {
  const result = refundStatusResponseSchema.safeParse(
    await paymentRequest("/tokenized-checkout/refund/payment/status", {
      paymentId: input.paymentId,
      trxId: input.trxId,
    }),
  );
  if (!result.success) throw new AppError("bKash refund status response was incomplete", 502);
  return result.data;
}

export function clearBkashTokenCacheForTests(): void {
  tokenCache = null;
  tokenPromise = null;
  grantTokenCallTimestamps = [];
}

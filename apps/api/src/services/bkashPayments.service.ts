import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { Types } from "mongoose";

import { getBkashConfig } from "../config/bkash.js";
import { AppError } from "../lib/errors.js";
import { Lead, type LeadDocument } from "../models/Lead.js";
import {
  PaymentAttempt,
  type PaymentAttemptDocument,
  type PaymentAttemptStatus,
} from "../models/PaymentAttempt.js";
import type {
  BkashCallbackInput,
  PaymentCreateInput,
  PaymentRetryInput,
} from "../schemas/bkash.schemas.js";
import {
  createBkashPayment,
  executeBkashPayment,
  queryBkashPayment,
  type BkashPaymentResponse,
} from "./bkashClient.service.js";
import { buildVerifiedCartSnapshot } from "./checkoutCart.service.js";

const RESULT_TTL_MS = 30 * 60 * 1000;
const RETRY_TTL_MS = 30 * 60 * 1000;
const PAYMENT_EXPIRY_MS = 24 * 60 * 60 * 1000;
const CREATING_STALE_MS = 2 * 60 * 1000;
const TERMINAL_FAILURES: PaymentAttemptStatus[] = [
  "payment_create_failed",
  "failed",
  "cancelled",
  "expired",
];

type StartPaymentResponse =
  | { state: "redirect"; bkash_url: string }
  | { state: "processing" }
  | { state: "completed"; reference: string }
  | { state: "failed"; message: string; retry_token: string };

export type RetryPaymentResponse = StartPaymentResponse | {
  state: "price_changed";
  total: number;
  retry_token: string;
};

export type PaymentResult = {
  state: PaymentAttemptStatus | "unavailable";
  message: string;
  lead_id?: string;
  checkout_source?: "cart" | "buy_now";
  amount?: number;
  merchant_invoice_number?: string;
  bkash_trx_id?: string;
  retry_token?: string;
};

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function makeToken(): { raw: string; digest: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, digest: hash(raw) };
}

function canonicalAmount(value: number): string {
  return value.toFixed(2);
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function checkoutRequestMatchesLead(
  input: PaymentCreateInput,
  lead: LeadDocument,
): boolean {
  if (
    input.name !== lead.name ||
    input.phone_number !== lead.phone_number ||
    input.email !== lead.email ||
    input.address !== lead.address ||
    (input.notes ?? "") !== (lead.notes ?? "") ||
    input.checkout_source !== lead.checkout_source ||
    input.cart_snapshot.items.length !== lead.cart_snapshot.items.length
  ) {
    return false;
  }

  return input.cart_snapshot.items.every((item, index) => {
    const stored = lead.cart_snapshot.items[index];
    return (
      stored !== undefined &&
      item.product_id === stored.product_id &&
      item.size === stored.size &&
      item.color === stored.color &&
      item.quantity === stored.quantity
    );
  });
}

function safeHashMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash(received), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function signatureFrom(urlValue?: string): string | undefined {
  if (!urlValue) return undefined;
  try {
    return new URL(urlValue).searchParams.get("signature") ?? undefined;
  } catch {
    return undefined;
  }
}

async function mintResultReference(attempt: PaymentAttemptDocument): Promise<string> {
  const token = makeToken();
  attempt.result_token_hash = token.digest;
  attempt.result_token_expires_at = new Date(Date.now() + RESULT_TTL_MS);
  await attempt.save();
  return token.raw;
}

async function mintRetryToken(attempt: PaymentAttemptDocument): Promise<string> {
  const token = makeToken();
  attempt.retry_token_hash = token.digest;
  attempt.retry_token_expires_at = new Date(Date.now() + RETRY_TTL_MS);
  attempt.retry_token_consumed_at = undefined;
  await attempt.save();
  return token.raw;
}

async function loadLatestAttempt(leadId: Types.ObjectId): Promise<PaymentAttemptDocument | null> {
  return PaymentAttempt.findOne({ lead_id: leadId })
    .sort({ sequence: -1 })
    .select(
      "+success_signature_hash +failure_signature_hash +cancel_signature_hash " +
      "+result_token_hash +result_token_expires_at +retry_token_hash " +
      "+retry_token_expires_at +retry_token_consumed_at",
    );
}

async function responseForExisting(attempt: PaymentAttemptDocument): Promise<StartPaymentResponse> {
  if (attempt.status === "completed") {
    return { state: "completed", reference: await mintResultReference(attempt) };
  }
  if (attempt.status === "initiated" && attempt.bkash_url) {
    return { state: "redirect", bkash_url: attempt.bkash_url };
  }
  if (
    attempt.status === "creating" &&
    Date.now() - attempt.createdAt.getTime() > CREATING_STALE_MS
  ) {
    attempt.status = "payment_create_failed";
    attempt.provider_status_message = "Payment creation did not finish";
    await attempt.save();
  }
  if (TERMINAL_FAILURES.includes(attempt.status)) {
    return {
      state: "failed",
      message: attempt.provider_status_message ?? "Payment could not be started.",
      retry_token: await mintRetryToken(attempt),
    };
  }
  return { state: "processing" };
}

async function createAttempt(lead: LeadDocument, sequence: number): Promise<StartPaymentResponse> {
  const amount = canonicalAmount(lead.cart_snapshot.total);
  const invoice = `MINAN-${lead._id.toString()}-${sequence}`;
  let attempt: PaymentAttemptDocument;
  try {
    attempt = await PaymentAttempt.create({
      lead_id: lead._id,
      sequence,
      status: "creating",
      merchant_invoice_number: invoice,
      expected_amount: amount,
      currency: "BDT",
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const existing = await loadLatestAttempt(lead._id);
    if (!existing) throw error;
    return responseForExisting(existing);
  }

  try {
    const config = getBkashConfig();
    const response = await createBkashPayment({
      amount,
      payerReference: lead._id.toString(),
      callbackURL: `${config.apiPublicUrl}/api/bkash/callback`,
      merchantInvoiceNumber: invoice,
    });
    if (
      response.statusCode !== "0000" ||
      !response.paymentID ||
      !response.bkashURL
    ) {
      attempt.status = "payment_create_failed";
      attempt.provider_status_code = response.statusCode;
      attempt.provider_status_message = response.statusMessage ?? "bKash rejected payment creation";
      await attempt.save();
      return {
        state: "failed",
        message: attempt.provider_status_message,
        retry_token: await mintRetryToken(attempt),
      };
    }

    attempt.status = "initiated";
    attempt.payment_id = response.paymentID;
    attempt.bkash_url = response.bkashURL;
    attempt.provider_status_code = response.statusCode;
    attempt.provider_status_message = response.statusMessage;
    const successSignature = signatureFrom(response.successCallbackURL ?? response.callbackURL);
    const failureSignature = signatureFrom(response.failureCallbackURL);
    const cancelSignature = signatureFrom(response.cancelledCallbackURL);
    if (successSignature) attempt.success_signature_hash = hash(successSignature);
    if (failureSignature) attempt.failure_signature_hash = hash(failureSignature);
    if (cancelSignature) attempt.cancel_signature_hash = hash(cancelSignature);
    await attempt.save();
    return { state: "redirect", bkash_url: response.bkashURL };
  } catch (error) {
    attempt.status = "payment_create_failed";
    attempt.provider_status_message =
      error instanceof AppError ? error.message : "Payment creation failed";
    await attempt.save();
    return {
      state: "failed",
      message: attempt.provider_status_message,
      retry_token: await mintRetryToken(attempt),
    };
  }
}

export async function startBkashPayment(
  input: PaymentCreateInput,
  idempotencyKey: string,
): Promise<StartPaymentResponse> {
  const idempotencyHash = hash(idempotencyKey);
  let lead = await Lead.findOne({ checkout_idempotency_hash: idempotencyHash });
  if (!lead) {
    const cartSnapshot = await buildVerifiedCartSnapshot(input.cart_snapshot);
    try {
      lead = await Lead.create({
        name: input.name,
        phone_number: input.phone_number,
        email: input.email,
        address: input.address,
        notes: input.notes,
        cart_snapshot: cartSnapshot,
        checkout_source: input.checkout_source,
        delivery_status: "pending",
        checkout_idempotency_hash: idempotencyHash,
      });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error;
      lead = await Lead.findOne({ checkout_idempotency_hash: idempotencyHash });
      if (!lead) throw error;
    }
  }

  if (!checkoutRequestMatchesLead(input, lead)) {
    throw new AppError(
      "Idempotency-Key was already used for a different checkout",
      409,
    );
  }

  const existing = await loadLatestAttempt(lead._id);
  return existing ? responseForExisting(existing) : createAttempt(lead, 1);
}

function expectedSignature(attempt: PaymentAttemptDocument, status: BkashCallbackInput["status"]): string | undefined {
  if (status === "success") return attempt.success_signature_hash;
  if (status === "failure") return attempt.failure_signature_hash;
  return attempt.cancel_signature_hash;
}

export function paymentResponseIsCompleted(
  response: BkashPaymentResponse,
  attempt: PaymentAttemptDocument,
): boolean {
  const invoice = response.merchantInvoiceNumber ?? response.merchantInvoice;
  const amount = response.amount === undefined ? "" : canonicalAmount(Number(response.amount));
  return (
    response.statusCode === "0000" &&
    response.transactionStatus === "Completed" &&
    response.paymentID === attempt.payment_id &&
    amount === attempt.expected_amount &&
    response.currency === attempt.currency &&
    invoice === attempt.merchant_invoice_number &&
    Boolean(response.trxID)
  );
}

async function applyVerification(
  attempt: PaymentAttemptDocument,
  response: BkashPaymentResponse,
): Promise<void> {
  attempt.provider_status_code = response.statusCode;
  attempt.provider_status_message = response.statusMessage;
  if (paymentResponseIsCompleted(response, attempt)) {
    attempt.status = "completed";
    attempt.bkash_trx_id = response.trxID;
  } else if (response.statusCode !== "0000") {
    attempt.status = "failed";
  } else {
    const transactionStatus = response.transactionStatus?.toLowerCase();
    if (transactionStatus === "failed" || transactionStatus === "failure") {
      attempt.status = "failed";
    } else if (transactionStatus === "cancelled" || transactionStatus === "canceled") {
      attempt.status = "cancelled";
    } else {
      attempt.status = "verification_pending";
    }
  }
  await attempt.save();
}

async function executeOrQuery(attempt: PaymentAttemptDocument): Promise<void> {
  try {
    const response = await executeBkashPayment(attempt.payment_id!);
    if (paymentResponseIsCompleted(response, attempt)) {
      await applyVerification(attempt, response);
      return;
    }
  } catch {
    // Query below resolves timeouts and transport failures safely.
  }

  try {
    const response = await queryBkashPayment(attempt.payment_id!);
    attempt.last_query_at = new Date();
    await applyVerification(attempt, response);
  } catch {
    attempt.status = "verification_pending";
    attempt.provider_status_message = "Payment verification is pending";
    await attempt.save();
  }
}

export async function handleBkashCallback(input: BkashCallbackInput): Promise<string> {
  let attempt = await PaymentAttempt.findOne({ payment_id: input.paymentID }).select(
    "+success_signature_hash +failure_signature_hash +cancel_signature_hash",
  );
  if (!attempt) throw new AppError("Payment attempt not found", 404);

  const expected = expectedSignature(attempt, input.status);
  if (expected && (!input.signature || !safeHashMatch(expected, input.signature))) {
    attempt.provider_status_message = "Callback signature did not match";
    await attempt.save();
    return mintResultReference(attempt);
  }

  if (attempt.status !== "completed") {
    if (input.status === "failure" || input.status === "cancel") {
      attempt.status = input.status === "cancel" ? "cancelled" : "failed";
      attempt.provider_status_message =
        input.status === "cancel" ? "Payment was cancelled" : "Payment failed";
      await attempt.save();
    } else if (attempt.status === "initiated") {
      const claimed = await PaymentAttempt.findOneAndUpdate(
        { _id: attempt._id, status: "initiated", execute_started_at: { $exists: false } },
        {
          $set: {
            status: "verification_pending",
            execute_started_at: new Date(),
          },
        },
        { new: true },
      );
      if (claimed) {
        attempt = claimed;
        await executeOrQuery(attempt);
      } else {
        attempt = (await PaymentAttempt.findById(attempt._id)) ?? attempt;
      }
    }
  }
  return mintResultReference(attempt);
}

function resultMessage(status: PaymentAttemptStatus): string {
  if (status === "completed") return "Your payment was confirmed.";
  if (status === "cancelled") return "You cancelled the payment.";
  if (status === "verification_pending") return "Your payment is still being verified.";
  if (status === "initiated" || status === "creating") return "Your payment is still in progress.";
  if (status === "expired") return "This payment attempt expired.";
  return "The payment was not completed.";
}

export async function resolvePaymentResult(reference: string): Promise<PaymentResult> {
  const attempt = await PaymentAttempt.findOne({
    result_token_hash: hash(reference),
    result_token_expires_at: { $gt: new Date() },
  }).select("+result_token_hash +result_token_expires_at");
  if (!attempt) return { state: "unavailable", message: "This payment result is unavailable or expired." };

  if (
    attempt.status === "initiated" &&
    Date.now() - attempt.createdAt.getTime() > PAYMENT_EXPIRY_MS
  ) {
    attempt.status = "expired";
    await attempt.save();
  }
  const lead = await Lead.findById(attempt.lead_id);
  if (!lead) return { state: "unavailable", message: "The checkout could not be found." };

  const retryToken = TERMINAL_FAILURES.includes(attempt.status)
    ? await mintRetryToken(attempt)
    : undefined;
  return {
    state: attempt.status,
    message: resultMessage(attempt.status),
    lead_id: lead._id.toString(),
    checkout_source: lead.checkout_source,
    amount: Number(attempt.expected_amount),
    merchant_invoice_number: attempt.merchant_invoice_number,
    bkash_trx_id: attempt.bkash_trx_id,
    retry_token: retryToken,
  };
}

export async function retryBkashPayment(input: PaymentRetryInput): Promise<RetryPaymentResponse> {
  const attempt = await PaymentAttempt.findOneAndUpdate(
    {
      retry_token_hash: hash(input.retry_token),
      retry_token_expires_at: { $gt: new Date() },
      retry_token_consumed_at: { $exists: false },
      status: { $in: TERMINAL_FAILURES },
    },
    { $set: { retry_token_consumed_at: new Date() } },
    { new: true },
  );
  if (!attempt) throw new AppError("Retry link is invalid or expired", 400);

  const lead = await Lead.findById(attempt.lead_id);
  if (!lead) throw new AppError("Checkout not found", 404);
  const latest = await loadLatestAttempt(lead._id);
  if (!latest || latest._id.toString() !== attempt._id.toString()) {
    if (latest) return responseForExisting(latest);
    throw new AppError("Payment attempt is no longer retryable", 409);
  }

  const verified = await buildVerifiedCartSnapshot(lead.cart_snapshot);
  const verifiedAmount = canonicalAmount(verified.total);
  const storedAmount = canonicalAmount(lead.cart_snapshot.total);
  const acceptedAmount = input.accepted_total === undefined
    ? undefined
    : canonicalAmount(input.accepted_total);
  const priceChanged = verifiedAmount !== storedAmount;
  const confirmationRequired = priceChanged && acceptedAmount === undefined;
  const confirmationIsStale =
    acceptedAmount !== undefined && acceptedAmount !== verifiedAmount;

  if (priceChanged) {
    lead.cart_snapshot = verified;
    await lead.save();
  }
  if (confirmationRequired || confirmationIsStale) {
    return {
      state: "price_changed",
      total: verified.total,
      retry_token: await mintRetryToken(attempt),
    };
  }
  return createAttempt(lead, attempt.sequence + 1);
}

export async function recheckPendingPayment(leadId: string): Promise<void> {
  if (!Types.ObjectId.isValid(leadId)) throw new AppError("Invalid lead id", 400);
  const attempt = await loadLatestAttempt(new Types.ObjectId(leadId));
  if (!attempt) throw new AppError("Payment attempt not found", 404);
  if (attempt.status !== "verification_pending" || !attempt.payment_id) {
    throw new AppError("Only pending payment verification can be rechecked", 409);
  }
  await executeOrQuery(attempt);
}

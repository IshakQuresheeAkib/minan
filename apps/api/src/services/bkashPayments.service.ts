import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { Types } from "mongoose";

import { getBkashConfig } from "../config/bkash.js";
import { AppError } from "../lib/errors.js";
import { Lead } from "../models/Lead.js";
import { Order, type OrderDocument } from "../models/Order.js";
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
import {
  checkoutRequestMatchesOrder,
  createOrLoadCheckoutOrder,
} from "./orders.service.js";

const RESULT_TTL_MS = 30 * 60 * 1000;
const RETRY_TTL_MS = 30 * 60 * 1000;
const RETRY_CLAIM_LEASE_MS = 2 * 60 * 1000;
const PAYMENT_EXPIRY_MS = 24 * 60 * 60 * 1000;
const CREATING_STALE_MS = 2 * 60 * 1000;
const EXECUTION_LEASE_MS = 2 * 60 * 1000;
const PAYMENT_RECHECK_INTERVAL_MS = 15 * 1000;
const ACTIVE_STATUSES: PaymentAttemptStatus[] = ["initiated", "verification_pending"];
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

export type RetryPaymentResponse = StartPaymentResponse;

export type PaymentResult = {
  state: PaymentAttemptStatus | "unavailable";
  message: string;
  order_id?: string;
  /** @deprecated Present only for migrated compatibility Orders. */
  lead_id?: string;
  order_number?: string;
  checkout_source?: "cart" | "buy_now" | "exchange";
  fee_paid?: number;
  cod_due?: number;
  /** @deprecated Legacy full-order amount before Order migration. */
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
  const expiresAt = new Date(Date.now() + RETRY_TTL_MS);
  await PaymentAttempt.updateOne(
    { _id: attempt._id },
    {
      $set: {
        retry_token_hash: token.digest,
        retry_token_expires_at: expiresAt,
      },
      $unset: {
        retry_token_claimed_at: 1,
        retry_token_consumed_at: 1,
      },
    },
  );
  attempt.retry_token_hash = token.digest;
  attempt.retry_token_expires_at = expiresAt;
  attempt.retry_token_claimed_at = undefined;
  attempt.retry_token_consumed_at = undefined;
  return token.raw;
}

async function releaseRetryClaim(
  attemptId: Types.ObjectId,
  claimedAt: Date,
): Promise<void> {
  await PaymentAttempt.updateOne(
    {
      _id: attemptId,
      retry_token_claimed_at: claimedAt,
      retry_token_consumed_at: { $exists: false },
    },
    { $unset: { retry_token_claimed_at: 1 } },
  );
}

async function consumeRetryClaim(
  attemptId: Types.ObjectId,
  claimedAt: Date,
): Promise<void> {
  const result = await PaymentAttempt.updateOne(
    {
      _id: attemptId,
      retry_token_claimed_at: claimedAt,
      retry_token_consumed_at: { $exists: false },
    },
    {
      $set: { retry_token_consumed_at: new Date() },
      $unset: { retry_token_claimed_at: 1 },
    },
  );
  if (result.matchedCount !== 1) {
    throw new AppError("Retry link is already being used", 409);
  }
}

async function loadLatestAttempt(orderId: Types.ObjectId): Promise<PaymentAttemptDocument | null> {
  return PaymentAttempt.findOne({ order_id: orderId })
    .sort({ sequence: -1 })
    .select(
      "+success_signature_hash +failure_signature_hash +cancel_signature_hash " +
      "+result_token_hash +result_token_expires_at +retry_token_hash " +
      "+retry_token_expires_at +retry_token_consumed_at",
    );
}

async function loadCompletedDeliveryFeeAttempt(
  orderId: Types.ObjectId,
): Promise<PaymentAttemptDocument | null> {
  const attempt = await PaymentAttempt.findOne({
    order_id: orderId,
    payment_purpose: "delivery_fee",
    status: "completed",
  })
    .sort({ sequence: -1 })
    .select("+result_token_hash +result_token_expires_at");
  return attempt?.status === "completed" ? attempt : null;
}

function isActiveAttempt(attempt: PaymentAttemptDocument): boolean {
  return ACTIVE_STATUSES.includes(attempt.status);
}

async function expireIfAbandoned(attempt: PaymentAttemptDocument): Promise<void> {
  if (
    isActiveAttempt(attempt) &&
    Date.now() - attempt.createdAt.getTime() > PAYMENT_EXPIRY_MS
  ) {
    attempt.status = "expired";
    attempt.provider_status_message = "Payment attempt expired before completion";
    await attempt.save();
    await syncOrderFeeStatus(attempt);
  }
}

async function claimInitiatedExecution(
  attempt: PaymentAttemptDocument,
): Promise<PaymentAttemptDocument | null> {
  return PaymentAttempt.findOneAndUpdate(
    {
      _id: attempt._id,
      status: "initiated",
      $or: [
        { execute_started_at: { $exists: false } },
        { execute_started_at: { $lt: new Date(Date.now() - EXECUTION_LEASE_MS) } },
      ],
    },
    {
      $set: {
        status: "verification_pending",
        execute_started_at: new Date(),
      },
    },
    { new: true },
  );
}

async function responseForExisting(attempt: PaymentAttemptDocument): Promise<StartPaymentResponse> {
  await expireIfAbandoned(attempt);
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
    await syncOrderFeeStatus(attempt);
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

async function createAttempt(order: OrderDocument, sequence: number): Promise<StartPaymentResponse> {
  const amount = canonicalAmount(order.financials.delivery_fee);
  const invoice = `${order.order_number}-${String(sequence).padStart(2, "0")}`;
  let attempt: PaymentAttemptDocument;
  try {
    attempt = await PaymentAttempt.create({
      order_id: order._id,
      payment_purpose: "delivery_fee",
      sequence,
      status: "creating",
      merchant_invoice_number: invoice,
      expected_amount: amount,
      currency: "BDT",
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const existing = await loadLatestAttempt(order._id);
    if (!existing) throw error;
    return responseForExisting(existing);
  }

  try {
    const config = getBkashConfig();
    const response = await createBkashPayment({
      amount,
      payerReference: order.order_number,
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
      await syncOrderFeeStatus(attempt);
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
    await syncOrderFeeStatus(attempt);
    return { state: "redirect", bkash_url: response.bkashURL };
  } catch (error) {
    attempt.status = "payment_create_failed";
    attempt.provider_status_message =
      error instanceof AppError ? error.message : "Payment creation failed";
    await attempt.save();
    await syncOrderFeeStatus(attempt);
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
  if (process.env.CHECKOUT_MAINTENANCE_MODE === "true") {
    throw new AppError("Checkout payment is temporarily unavailable for maintenance", 503);
  }
  const idempotencyHash = hash(idempotencyKey);
  const order = await createOrLoadCheckoutOrder(input, idempotencyHash);

  if (!checkoutRequestMatchesOrder(input, order)) {
    throw new AppError(
      "Idempotency-Key was already used for a different checkout",
      409,
    );
  }

  const existing = await loadLatestAttempt(order._id);
  if (!existing) return createAttempt(order, 1);
  return responseForExisting(existing);
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

function feeStatusForAttempt(status: PaymentAttemptStatus) {
  if (status === "completed") return "paid" as const;
  if (status === "initiated" || status === "creating") return "processing" as const;
  if (status === "verification_pending") return "verification_pending" as const;
  if (status === "expired") return "expired" as const;
  return "failed" as const;
}

async function syncOrderFeeStatus(attempt: PaymentAttemptDocument): Promise<void> {
  if (!attempt.order_id) return;
  if (attempt.payment_purpose === "legacy_full_order") {
    if (attempt.status !== "completed") return;
    const paid = Number(attempt.expected_amount);
    const order = await Order.findById(attempt.order_id);
    if (!order || !Number.isSafeInteger(paid)) return;
    if (order.financials.merchandise_paid_online >= paid) return;
    order.financials.merchandise_paid_online = Math.min(paid, order.financials.merchandise_total);
    order.financials.cod_due = Math.max(
      order.financials.merchandise_total -
        order.financials.merchandise_paid_online -
        order.financials.exchange_credit_applied,
      0,
    );
    order.cod_status = order.financials.cod_due === 0 ? "not_required" : "due";
    order.revision += 1;
    order.activity.push({
      actor_type: "system",
      event: "legacy_payment_reconciled",
      metadata: { amount: paid, payment_attempt_id: attempt._id.toString() },
      created_at: new Date(),
    });
    await order.save();
    return;
  }

  let deliveryFeeStatus = feeStatusForAttempt(attempt.status);
  let sourceAttemptId = attempt._id;
  if (deliveryFeeStatus !== "paid") {
    const completedAttempt = await PaymentAttempt.exists({
      order_id: attempt.order_id,
      payment_purpose: "delivery_fee",
      status: "completed",
    });
    if (completedAttempt) {
      deliveryFeeStatus = "paid";
      sourceAttemptId = completedAttempt._id;
    }
  }

  const updated = await Order.updateOne(
    {
      _id: attempt.order_id,
      delivery_fee_status: deliveryFeeStatus === "paid"
        ? { $ne: "paid" }
        : { $nin: ["paid", deliveryFeeStatus] },
    },
    {
      $set: { delivery_fee_status: deliveryFeeStatus },
      $inc: { revision: 1 },
      $push: {
        activity: {
          actor_type: "system",
          event: `delivery_fee_${deliveryFeeStatus}`,
          metadata: { payment_attempt_id: sourceAttemptId.toString() },
          created_at: new Date(),
        },
      },
    },
  );
  if (updated.modifiedCount > 0 && deliveryFeeStatus === "paid") {
    await Order.updateOne(
      { _id: attempt.order_id, status: "new" },
      { $push: { activity: { actor_type: "system", event: "order_ready_for_confirmation", created_at: new Date() } } },
    );
  }
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
    } else if (transactionStatus === "declined") {
      attempt.status = "failed";
    } else if (transactionStatus === "cancelled" || transactionStatus === "canceled") {
      attempt.status = "cancelled";
    } else if (transactionStatus === "expired") {
      attempt.status = "expired";
    } else if (transactionStatus === "initiated") {
      attempt.status = "initiated";
    } else {
      attempt.status = "verification_pending";
    }
  }
  await attempt.save();
  await syncOrderFeeStatus(attempt);
}

async function queryAndApplyVerification(
  attempt: PaymentAttemptDocument,
): Promise<void> {
  attempt.last_query_at = new Date();
  try {
    const response = await queryBkashPayment(attempt.payment_id!);
    await applyVerification(attempt, response);
  } catch {
    attempt.status = "verification_pending";
    attempt.provider_status_message = "Payment verification is pending";
    await attempt.save();
    await syncOrderFeeStatus(attempt);
  }
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

  await queryAndApplyVerification(attempt);
}

export async function handleBkashCallback(input: BkashCallbackInput): Promise<string> {
  const attempt = await PaymentAttempt.findOne({ payment_id: input.paymentID }).select(
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
      if (!expected) {
        await queryAndApplyVerification(attempt);
      } else {
        attempt.status = input.status === "cancel" ? "cancelled" : "failed";
        attempt.provider_status_message =
          input.status === "cancel" ? "Payment was cancelled" : "Payment failed";
        await attempt.save();
        await syncOrderFeeStatus(attempt);
      }
    } else {
      if (attempt.status === "initiated") {
        const claimed = await claimInitiatedExecution(attempt);
        if (claimed) {
          await executeOrQuery(claimed);
          return mintResultReference(claimed);
        }
      } else if (attempt.payment_id) {
        // A verified provider completion wins even after a local failure/expiry.
        await queryAndApplyVerification(attempt);
      }
      const refreshed = await PaymentAttempt.findById(attempt._id);
      return mintResultReference(refreshed ?? attempt);
    }
  }
  return mintResultReference(attempt);
}

function resultMessage(status: PaymentAttemptStatus): string {
  if (status === "completed") return "Your delivery-fee payment was confirmed.";
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
    isActiveAttempt(attempt) &&
    attempt.payment_id &&
    (!attempt.last_query_at ||
      Date.now() - attempt.last_query_at.getTime() > PAYMENT_RECHECK_INTERVAL_MS)
  ) {
    await queryAndApplyVerification(attempt);
  }

  await expireIfAbandoned(attempt);
  const order = attempt.order_id ? await Order.findById(attempt.order_id) : null;
  if (!order && attempt.lead_id) {
    const lead = await Lead.findById(attempt.lead_id);
    if (lead) {
      return {
        state: attempt.status,
        message: attempt.status === "completed" ? "Your legacy payment was confirmed." : resultMessage(attempt.status),
        lead_id: lead._id.toString(),
        checkout_source: lead.checkout_source,
        amount: Number(attempt.expected_amount),
        merchant_invoice_number: attempt.merchant_invoice_number,
        bkash_trx_id: attempt.bkash_trx_id,
        retry_token: TERMINAL_FAILURES.includes(attempt.status) ? await mintRetryToken(attempt) : undefined,
      };
    }
  }
  if (!order) return { state: "unavailable", message: "The order could not be found." };

  const retryToken = TERMINAL_FAILURES.includes(attempt.status)
    ? await mintRetryToken(attempt)
    : undefined;
  return {
    state: attempt.status,
    message: resultMessage(attempt.status),
    order_id: order._id.toString(),
    lead_id: attempt.lead_id?.toString(),
    order_number: order.order_number,
    checkout_source: order.checkout_source,
    fee_paid: attempt.status === "completed" && attempt.payment_purpose === "delivery_fee"
      ? Number(attempt.expected_amount)
      : 0,
    cod_due: order.financials.cod_due,
    merchant_invoice_number: attempt.merchant_invoice_number,
    bkash_trx_id: attempt.bkash_trx_id,
    retry_token: retryToken,
  };
}

export async function retryBkashPayment(input: PaymentRetryInput): Promise<RetryPaymentResponse> {
  if (process.env.CHECKOUT_MAINTENANCE_MODE === "true") {
    throw new AppError("Checkout payment is temporarily unavailable for maintenance", 503);
  }
  const claimedAt = new Date();
  const attempt = await PaymentAttempt.findOneAndUpdate(
    {
      retry_token_hash: hash(input.retry_token),
      retry_token_expires_at: { $gt: new Date() },
      retry_token_consumed_at: { $exists: false },
      $or: [
        { retry_token_claimed_at: { $exists: false } },
        {
          retry_token_claimed_at: {
            $lt: new Date(claimedAt.getTime() - RETRY_CLAIM_LEASE_MS),
          },
        },
      ],
      status: { $in: TERMINAL_FAILURES },
    },
    { $set: { retry_token_claimed_at: claimedAt } },
    { new: true },
  );
  if (!attempt) throw new AppError("Retry link is invalid or expired", 400);

  try {
    if (!attempt.order_id) throw new AppError("Legacy payment attempts cannot use this retry link", 409);
    const order = await Order.findById(attempt.order_id);
    if (!order) throw new AppError("Order not found", 404);
    const completed = await loadCompletedDeliveryFeeAttempt(order._id);
    if (completed) {
      const response = await responseForExisting(completed);
      await consumeRetryClaim(attempt._id, claimedAt);
      return response;
    }
    const latest = await loadLatestAttempt(order._id);
    if (!latest || latest._id.toString() !== attempt._id.toString()) {
      if (latest) {
        const response = await responseForExisting(latest);
        await consumeRetryClaim(attempt._id, claimedAt);
        return response;
      }
      throw new AppError("Payment attempt is no longer retryable", 409);
    }

    const response = await createAttempt(order, attempt.sequence + 1);
    if (response.state === "redirect") {
      const completed = await loadCompletedDeliveryFeeAttempt(order._id);
      if (completed) {
        await PaymentAttempt.updateOne(
          {
            order_id: order._id,
            sequence: attempt.sequence + 1,
            status: { $in: ["creating", "initiated", "verification_pending"] },
          },
          {
            $set: {
              status: "cancelled",
              provider_status_message: "Payment was already confirmed by an earlier attempt",
            },
          },
        );
        const settled = await responseForExisting(completed);
        await consumeRetryClaim(attempt._id, claimedAt);
        return settled;
      }
    }
    await consumeRetryClaim(attempt._id, claimedAt);
    return response;
  } catch (error) {
    try {
      await releaseRetryClaim(attempt._id, claimedAt);
    } catch {
      // The lease expiry makes the token retryable if releasing the claim also fails.
    }
    throw error;
  }
}

export async function recheckPendingPayment(orderId: string): Promise<void> {
  if (!Types.ObjectId.isValid(orderId)) throw new AppError("Invalid order id", 400);
  const relationshipId = new Types.ObjectId(orderId);
  const attempt = await PaymentAttempt.findOne({
    $or: [{ order_id: relationshipId }, { lead_id: relationshipId }],
  })
    .sort({ sequence: -1 })
    .select(
      "+success_signature_hash +failure_signature_hash +cancel_signature_hash " +
      "+result_token_hash +result_token_expires_at +retry_token_hash " +
      "+retry_token_expires_at +retry_token_consumed_at",
    );
  if (!attempt) throw new AppError("Payment attempt not found", 404);
  if (
    (attempt.status !== "verification_pending" && attempt.status !== "initiated") ||
    !attempt.payment_id
  ) {
    throw new AppError("Only active payment verification can be rechecked", 409);
  }
  if (attempt.status === "initiated") {
    const claimed = await claimInitiatedExecution(attempt);
    if (claimed) {
      await executeOrQuery(claimed);
    } else {
      await queryAndApplyVerification(attempt);
    }
    return;
  }
  await executeOrQuery(attempt);
}

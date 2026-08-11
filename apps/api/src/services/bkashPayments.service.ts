import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { Types } from "mongoose";

import { getBkashConfig } from "../config/bkash.js";
import {
  CHECKOUT_PAYMENT_CONTRACT_VERSION,
  type PaymentMethod,
} from "../config/checkoutPayment.js";
import { AppError } from "../lib/errors.js";
import { Order, type OrderDocument } from "../models/Order.js";
import {
  PaymentAttempt,
  type PaymentAttemptDocument,
  type PaymentPurpose,
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

type PaymentResponseContract = {
  payment_contract_version: typeof CHECKOUT_PAYMENT_CONTRACT_VERSION;
  payment_method: PaymentMethod;
  pay_now_amount: number;
};

type BareStartPaymentResponse =
  | { state: "redirect"; bkash_url: string }
  | { state: "processing" }
  | { state: "completed"; reference: string }
  | { state: "failed"; message: string; retry_token: string };

type StartPaymentResponse = PaymentResponseContract & BareStartPaymentResponse;

export type RetryPaymentResponse = StartPaymentResponse;

export type PaymentResult = {
  state: PaymentAttemptStatus | "unavailable";
  message: string;
  order_id?: string;
  order_number?: string;
  checkout_source?: "cart" | "buy_now" | "exchange";
  payment_method?: PaymentMethod;
  payment_purpose?: PaymentPurpose;
  pay_now_amount?: number;
  fee_paid?: number;
  merchandise_paid_online?: number;
  cod_due?: number;
  financial_review_required?: boolean;
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

function paymentPurposeForMethod(method: PaymentMethod): PaymentPurpose {
  return method === "bkash_full" ? "order_total" : "delivery_fee";
}

function paymentMethodForPurpose(purpose: PaymentPurpose): PaymentMethod {
  return purpose === "delivery_fee" ? "cod" : "bkash_full";
}

async function markFinancialReviewRequired(
  orderId: Types.ObjectId,
  event: string,
  attempt: PaymentAttemptDocument,
): Promise<void> {
  await Order.updateOne(
    { _id: orderId, financial_review_required: { $ne: true } },
    {
      $set: { financial_review_required: true },
      $inc: { revision: 1 },
      $push: {
        activity: {
          actor_type: "system",
          event,
          metadata: { payment_attempt_id: attempt._id.toString() },
          created_at: new Date(),
        },
      },
    },
  );
}

function responseContract(attempt: PaymentAttemptDocument): PaymentResponseContract {
  return {
    payment_contract_version: CHECKOUT_PAYMENT_CONTRACT_VERSION,
    payment_method: paymentMethodForPurpose(attempt.payment_purpose),
    pay_now_amount: Number(attempt.expected_amount),
  };
}

function withResponseContract(
  attempt: PaymentAttemptDocument,
  response: BareStartPaymentResponse,
): StartPaymentResponse {
  return { ...responseContract(attempt), ...response };
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

async function loadInferredCompletedAttempt(
  orderId: Types.ObjectId,
): Promise<PaymentAttemptDocument | null> {
  const attempt = await PaymentAttempt.findOne({
    order_id: orderId,
    payment_purpose: { $in: ["delivery_fee", "order_total", "legacy_full_order"] },
    status: "completed",
  })
    .sort({ sequence: 1 })
    .select("+result_token_hash +result_token_expires_at");
  return attempt?.status === "completed" ? attempt : null;
}

async function loadCompletedAttemptForOrder(
  order: Pick<OrderDocument, "_id" | "settled_payment_attempt_id">,
): Promise<PaymentAttemptDocument | null> {
  if (order.settled_payment_attempt_id) {
    const attempt = await PaymentAttempt.findOne({
      _id: order.settled_payment_attempt_id,
      order_id: order._id,
      status: "completed",
    }).select("+result_token_hash +result_token_expires_at");
    return attempt?.status === "completed" ? attempt : null;
  }
  return loadInferredCompletedAttempt(order._id);
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

async function updateOrderPaymentMethod(
  order: OrderDocument,
  paymentMethod: PaymentMethod,
  orderRevision?: number,
): Promise<OrderDocument> {
  if (paymentMethod === "bkash_full") {
    if (orderRevision !== undefined) {
      if (order.full_payment_locked_revision !== orderRevision) {
        throw new AppError("Order total changed after this payment amount was prepared", 409);
      }
      return order;
    }
    const lockedRevision = order.revision + 1;
    const locked = await Order.findOneAndUpdate(
      {
        _id: order._id,
        revision: order.revision,
        settled_payment_attempt_id: { $exists: false },
        full_payment_locked_revision: { $exists: false },
      },
      {
        $set: {
          payment_method: paymentMethod,
          full_payment_locked_revision: lockedRevision,
        },
        $inc: { revision: 1 },
        $push: {
          activity: {
            actor_type: "system",
            event: "order_total_payment_locked",
            metadata: { amount: order.financials.overall_order_value },
            created_at: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );
    if (locked) return locked;
  } else if (order.payment_method === paymentMethod) {
    return order;
  } else {
    const updated = await Order.findOneAndUpdate(
      {
        _id: order._id,
        revision: order.revision,
        settled_payment_attempt_id: { $exists: false },
      },
      {
        $set: { payment_method: paymentMethod },
        $inc: { revision: 1 },
        $push: {
          activity: {
            actor_type: "system",
            event: "payment_method_updated",
            metadata: { payment_method: paymentMethod },
            created_at: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );
    if (updated) return updated;
  }

  const latest = await Order.findById(order._id).select("revision");
  if (!latest) throw new AppError("Order not found", 404);
  throw new AppError(`Order changed in another session. Latest revision is ${latest.revision}`, 409);
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
    await syncOrderFeeStatus(attempt);
    return withResponseContract(attempt, {
      state: "completed",
      reference: await mintResultReference(attempt),
    });
  }
  if (attempt.status === "initiated" && attempt.bkash_url) {
    return withResponseContract(attempt, {
      state: "redirect",
      bkash_url: attempt.bkash_url,
    });
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
    return withResponseContract(attempt, {
      state: "failed",
      message: attempt.provider_status_message ?? "Payment could not be started.",
      retry_token: await mintRetryToken(attempt),
    });
  }
  return withResponseContract(attempt, { state: "processing" });
}

async function createAttempt(
  order: OrderDocument,
  sequence: number,
  paymentMethod: PaymentMethod,
  frozenAmount?: string,
  frozenOrderRevision?: number,
): Promise<StartPaymentResponse> {
  const paymentPurpose = paymentPurposeForMethod(paymentMethod);
  const preparedOrder = await updateOrderPaymentMethod(
    order,
    paymentMethod,
    frozenOrderRevision,
  );
  const amount = frozenAmount ?? canonicalAmount(
    paymentMethod === "bkash_full"
      ? preparedOrder.financials.overall_order_value
      : preparedOrder.financials.delivery_fee,
  );
  const invoice = `${order.order_number}-${String(sequence).padStart(2, "0")}`;
  const orderRevision = paymentPurpose === "order_total"
    ? preparedOrder.full_payment_locked_revision
    : undefined;
  let attempt: PaymentAttemptDocument;
  try {
    attempt = await PaymentAttempt.create({
      order_id: order._id,
      payment_purpose: paymentPurpose,
      sequence,
      ...(orderRevision === undefined ? {} : { order_revision: orderRevision }),
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
    const alreadyCompleted = await loadCompletedAttemptForOrder(preparedOrder);
    if (alreadyCompleted) {
      attempt.status = "cancelled";
      attempt.provider_status_message = "Payment was already confirmed by an earlier attempt";
      await attempt.save();
      return responseForExisting(alreadyCompleted);
    }

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
      attempt.terminal_confirmed_at = new Date();
      attempt.provider_status_code = response.statusCode;
      attempt.provider_status_message = response.statusMessage ?? "bKash rejected payment creation";
      await attempt.save();
      await syncOrderFeeStatus(attempt);
      return withResponseContract(attempt, {
        state: "failed",
        message: attempt.provider_status_message,
        retry_token: await mintRetryToken(attempt),
      });
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
    const completedDuringCreation = await loadCompletedAttemptForOrder(preparedOrder);
    if (completedDuringCreation) {
      await PaymentAttempt.updateOne(
        { _id: attempt._id, status: { $in: ["creating", "initiated", "verification_pending"] } },
        {
          $set: {
            status: "cancelled",
            provider_status_message: "Payment was already confirmed by an earlier attempt",
          },
        },
      );
      return responseForExisting(completedDuringCreation);
    }
    return withResponseContract(attempt, {
      state: "redirect",
      bkash_url: response.bkashURL,
    });
  } catch (error) {
    attempt.status = "payment_create_failed";
    attempt.provider_status_message =
      error instanceof AppError ? error.message : "Payment creation failed";
    await attempt.save();
    await syncOrderFeeStatus(attempt);
    return withResponseContract(attempt, {
      state: "failed",
      message: attempt.provider_status_message,
      retry_token: await mintRetryToken(attempt),
    });
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

  const completed = await loadCompletedAttemptForOrder(order);
  if (completed) return responseForExisting(completed);

  const existing = await loadLatestAttempt(order._id);
  if (!existing) return createAttempt(order, 1, input.payment_method);

  const requestedPurpose = paymentPurposeForMethod(input.payment_method);
  if (existing.payment_purpose === requestedPurpose) {
    return responseForExisting(existing);
  }
  await expireIfAbandoned(existing);
  if (
    TERMINAL_FAILURES.includes(existing.status) &&
    !existing.terminal_confirmed_at &&
    existing.payment_id
  ) {
    await queryAndApplyVerification(existing);
  }
  if (existing.status === "completed") return responseForExisting(existing);
  if (
    !TERMINAL_FAILURES.includes(existing.status) ||
    !existing.terminal_confirmed_at
  ) {
    throw new AppError(
      "Your previous bKash payment is still active or not conclusively closed. Wait for verification before changing the payment method.",
      409,
    );
  }

  return createAttempt(order, existing.sequence + 1, input.payment_method);
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

  if (attempt.status === "completed") {
    const order = await Order.findById(attempt.order_id);
    if (!order) return;
    if (
      order.settled_payment_attempt_id &&
      order.settled_payment_attempt_id.toString() !== attempt._id.toString()
    ) {
      await markFinancialReviewRequired(
        order._id,
        "duplicate_payment_completion_detected",
        attempt,
      );
      return;
    }
    if (order.settled_payment_attempt_id) return;

    const paymentMethod = paymentMethodForPurpose(attempt.payment_purpose);
    const paid = Number(attempt.expected_amount);
    if (
      paymentMethod === "bkash_full" &&
      (
        attempt.order_revision === undefined ||
        order.full_payment_locked_revision !== attempt.order_revision ||
        paid !== order.financials.overall_order_value
      )
    ) {
      await markFinancialReviewRequired(
        order._id,
        "payment_order_version_mismatch",
        attempt,
      );
      return;
    }
    const merchandisePaidOnline = paymentMethod === "bkash_full"
      ? order.financials.merchandise_total
      : order.financials.merchandise_paid_online;
    const codDue = Math.max(
      order.financials.merchandise_total -
        merchandisePaidOnline -
        order.financials.exchange_credit_applied,
      0,
    );
    const updated = await Order.updateOne(
      {
        _id: attempt.order_id,
        settled_payment_attempt_id: { $exists: false },
        ...(paymentMethod === "bkash_full"
          ? {
              full_payment_locked_revision: attempt.order_revision,
              "financials.overall_order_value": paid,
            }
          : {}),
      },
      {
        $set: {
          payment_method: paymentMethod,
          settled_payment_attempt_id: attempt._id,
          delivery_fee_status: "paid",
          "financials.merchandise_paid_online": merchandisePaidOnline,
          "financials.cod_due": codDue,
          cod_status: codDue === 0 ? "not_required" : "due",
        },
        $inc: { revision: 1 },
        $push: {
          activity: {
            actor_type: "system",
            event: paymentMethod === "bkash_full"
              ? "order_total_paid_online"
              : "delivery_fee_paid",
            metadata: {
              payment_attempt_id: attempt._id.toString(),
              amount: Number(attempt.expected_amount),
            },
            created_at: new Date(),
          },
        },
      },
    );
    if (updated.modifiedCount > 0) {
      await PaymentAttempt.updateMany(
        { order_id: attempt.order_id, _id: { $ne: attempt._id } },
        {
          $unset: {
            retry_token_hash: 1,
            retry_token_expires_at: 1,
            retry_token_claimed_at: 1,
            retry_token_consumed_at: 1,
          },
        },
      );
      await Order.updateOne(
        { _id: attempt.order_id, status: "new" },
        {
          $push: {
            activity: {
              actor_type: "system",
              event: "order_ready_for_confirmation",
              created_at: new Date(),
            },
          },
        },
      );
    } else {
      const duplicate = await Order.exists({
        _id: attempt.order_id,
        settled_payment_attempt_id: { $exists: true, $ne: attempt._id },
      });
      await markFinancialReviewRequired(
        attempt.order_id,
        duplicate
          ? "duplicate_payment_completion_detected"
          : "payment_order_version_mismatch",
        attempt,
      );
    }
    return;
  }

  const completedAttempt = await loadInferredCompletedAttempt(attempt.order_id);
  if (completedAttempt) {
    await syncOrderFeeStatus(completedAttempt);
    return;
  }

  const deliveryFeeStatus = feeStatusForAttempt(attempt.status);

  await Order.updateOne(
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
          metadata: {
            payment_attempt_id: attempt._id.toString(),
            payment_method: paymentMethodForPurpose(attempt.payment_purpose),
          },
          created_at: new Date(),
        },
      },
    },
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
  } else {
    const transactionStatus = response.transactionStatus?.toLowerCase();
    if (transactionStatus === "failed" || transactionStatus === "failure") {
      attempt.status = "failed";
      attempt.terminal_confirmed_at = new Date();
    } else if (transactionStatus === "declined") {
      attempt.status = "failed";
      attempt.terminal_confirmed_at = new Date();
    } else if (transactionStatus === "cancelled" || transactionStatus === "canceled") {
      attempt.status = "cancelled";
      attempt.terminal_confirmed_at = new Date();
    } else if (transactionStatus === "expired") {
      attempt.status = "expired";
      attempt.terminal_confirmed_at = new Date();
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
        attempt.terminal_confirmed_at = new Date();
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

function resultMessage(
  status: PaymentAttemptStatus,
  purpose: PaymentPurpose,
): string {
  if (status === "completed") {
    return purpose === "delivery_fee"
      ? "Your advance delivery-fee payment was confirmed. Pay the merchandise balance on delivery."
      : "Your full bKash payment was confirmed. Nothing remains due on delivery.";
  }
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
  if (!order) return { state: "unavailable", message: "The order could not be found." };

  const completedAttempt = await loadCompletedAttemptForOrder(order);
  const retryToken = TERMINAL_FAILURES.includes(attempt.status) && !completedAttempt
    ? await mintRetryToken(attempt)
    : undefined;
  const isDuplicateCompletion = attempt.status === "completed" &&
    order.settled_payment_attempt_id !== undefined &&
    order.settled_payment_attempt_id.toString() !== attempt._id.toString();
  return {
    state: attempt.status,
    message: isDuplicateCompletion
      ? "A second payment completion was detected after this Order was already paid. The Order is under financial review; contact MINAN support before paying again."
      : resultMessage(attempt.status, attempt.payment_purpose),
    order_id: order._id.toString(),
    order_number: order.order_number,
    checkout_source: order.checkout_source,
    payment_method: paymentMethodForPurpose(attempt.payment_purpose),
    payment_purpose: attempt.payment_purpose,
    pay_now_amount: Number(attempt.expected_amount),
    fee_paid: attempt.status === "completed" ? order.financials.delivery_fee : 0,
    merchandise_paid_online: order.financials.merchandise_paid_online,
    cod_due: order.financials.cod_due,
    financial_review_required: order.financial_review_required,
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
    if (!attempt.order_id || attempt.payment_purpose === "legacy_full_order") {
      throw new AppError("Legacy payment attempts cannot use this retry link", 409);
    }
    const order = await Order.findById(attempt.order_id);
    if (!order) throw new AppError("Order not found", 404);
    const completed = await loadCompletedAttemptForOrder(order);
    if (completed) {
      await syncOrderFeeStatus(completed);
      await consumeRetryClaim(attempt._id, claimedAt);
      throw new AppError("This Order has already been paid", 409);
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

    const response = await createAttempt(
      order,
      attempt.sequence + 1,
      paymentMethodForPurpose(attempt.payment_purpose),
      attempt.expected_amount,
      attempt.order_revision,
    );
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
    order_id: relationshipId,
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

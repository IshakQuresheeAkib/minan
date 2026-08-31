import { randomInt } from "node:crypto";

import argon2 from "argon2";
import {
  getGuestOrderOtpSettings,
  type GuestOrderOtpSettings,
} from "../config/guestOrderAccess.js";
import { signGuestOrderAccessToken } from "../lib/guestOrderTokens.js";
import { normalizeEmail } from "../lib/normalizeEmail.js";
import { Order } from "../models/Order.js";
import { VerificationChallenge } from "../models/VerificationChallenge.js";
import type { GuestOrderJwtPayload } from "../types/auth.types.js";
import {
  serializeCustomerOrder,
  type CustomerOrderTrackingDTO,
} from "../utils/serializeCustomerOrder.js";
import type { TransactionalEmailAdapter } from "./transactionalEmail.service.js";

const GUEST_ORDER_ACCESS_PURPOSE = "guest_order_access" as const;

export type GuestOrderOtpRequest = {
  order_number: string;
  email: string;
};

export type GuestOrderOtpRequestResult = {
  accepted: true;
};

export type GuestOrderOtpVerification = GuestOrderOtpRequest & {
  otp: string;
};

export type GuestOrderOtpVerificationResult = {
  guest_access_token: string;
};

export class GuestOrderAccessError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "GuestOrderAccessError";
    this.status = status;
  }
}

export function generateGuestOrderOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function genericRequestResult(): GuestOrderOtpRequestResult {
  return { accepted: true };
}

function otpExpiry(now: Date, settings: GuestOrderOtpSettings): Date {
  return new Date(now.getTime() + settings.ttlSeconds * 1000);
}

function resendAvailability(now: Date, settings: GuestOrderOtpSettings): Date {
  return new Date(now.getTime() + settings.resendCooldownSeconds * 1000);
}

export async function requestGuestOrderOtp(
  input: GuestOrderOtpRequest,
  email: TransactionalEmailAdapter,
  now = new Date(),
): Promise<GuestOrderOtpRequestResult> {
  const normalizedEmail = normalizeEmail(input.email);
  const settings = getGuestOrderOtpSettings();
  const order = await Order.findOne({
    order_number: input.order_number,
    normalized_email: normalizedEmail,
  }).select("_id order_number normalized_email guest_access_version");

  if (!order) {
    return genericRequestResult();
  }

  const activeChallenge = await VerificationChallenge.findOne({
    order_id: order._id,
    normalized_email: normalizedEmail,
    purpose: GUEST_ORDER_ACCESS_PURPOSE,
    consumed_at: null,
    revoked_at: null,
    expires_at: { $gt: now },
  }).sort({ createdAt: -1 });

  if (activeChallenge && activeChallenge.resend_available_at > now) {
    return genericRequestResult();
  }

  if (activeChallenge) {
    await VerificationChallenge.updateOne(
      { _id: activeChallenge._id, consumed_at: null, revoked_at: null },
      { $set: { revoked_at: now } },
    );
  }

  const otp = generateGuestOrderOtp();
  const otpHash = await argon2.hash(otp);
  const challenge = await VerificationChallenge.create({
    order_id: order._id,
    normalized_email: normalizedEmail,
    purpose: GUEST_ORDER_ACCESS_PURPOSE,
    otp_hash: otpHash,
    attempt_count: 0,
    attempt_limit: settings.attemptLimit,
    expires_at: otpExpiry(now, settings),
    consumed_at: null,
    revoked_at: null,
    resend_available_at: resendAvailability(now, settings),
  });

  try {
    await email.send({
      to: normalizedEmail,
      subject: "Your MINAN order access code",
      html: `<p>Your MINAN order access code is <strong>${otp}</strong>.</p>`,
      text: `Your MINAN order access code is ${otp}.`,
    });
  } catch {
    await VerificationChallenge.updateOne(
      { _id: challenge._id, consumed_at: null, revoked_at: null },
      { $set: { revoked_at: now } },
    );
  }

  return genericRequestResult();
}

function invalidVerificationCode(): GuestOrderAccessError {
  return new GuestOrderAccessError("Invalid verification code");
}

function unauthorizedOrderAccess(): GuestOrderAccessError {
  return new GuestOrderAccessError("Unauthorized");
}

export async function verifyGuestOrderOtp(
  input: GuestOrderOtpVerification,
  now = new Date(),
): Promise<GuestOrderOtpVerificationResult> {
  const normalizedEmail = normalizeEmail(input.email);
  const order = await Order.findOne({
    order_number: input.order_number,
    normalized_email: normalizedEmail,
  }).select("_id order_number normalized_email guest_access_version");
  if (!order) {
    throw invalidVerificationCode();
  }

  const challenge = await VerificationChallenge.findOneAndUpdate(
    {
      order_id: order._id,
      normalized_email: normalizedEmail,
      purpose: GUEST_ORDER_ACCESS_PURPOSE,
      consumed_at: null,
      revoked_at: null,
      expires_at: { $gt: now },
      $expr: { $lt: ["$attempt_count", "$attempt_limit"] },
    },
    { $inc: { attempt_count: 1 } },
    { new: true },
  ).select("+otp_hash");

  if (!challenge?.otp_hash) {
    throw invalidVerificationCode();
  }

  const matches = await argon2.verify(challenge.otp_hash, input.otp);
  if (!matches) {
    if (challenge.attempt_count >= challenge.attempt_limit) {
      await VerificationChallenge.updateOne(
        { _id: challenge._id, consumed_at: null, revoked_at: null },
        { $set: { revoked_at: now } },
      );
    }
    throw invalidVerificationCode();
  }

  const consumed = await VerificationChallenge.findOneAndUpdate(
    {
      _id: challenge._id,
      consumed_at: null,
      revoked_at: null,
      expires_at: { $gt: now },
    },
    { $set: { consumed_at: now } },
    { new: true },
  );
  if (!consumed) {
    throw invalidVerificationCode();
  }

  return {
    guest_access_token: signGuestOrderAccessToken({
      order_id: String(order._id),
      order_number: order.order_number,
      normalized_email: order.normalized_email,
      guest_access_version: order.guest_access_version,
      challenge_id: String(challenge._id),
    }),
  };
}

function assertProofMatchesOrderNumber(
  orderNumber: string,
  proof: GuestOrderJwtPayload,
): void {
  if (proof.order_number !== orderNumber) {
    throw unauthorizedOrderAccess();
  }
}

export async function getGuestOrder(
  orderNumber: string,
  proof: GuestOrderJwtPayload,
): Promise<CustomerOrderTrackingDTO> {
  assertProofMatchesOrderNumber(orderNumber, proof);
  const order = await Order.findOne({
    _id: proof.order_id,
    order_number: proof.order_number,
    normalized_email: proof.normalized_email,
    guest_access_version: proof.guest_access_version,
  }).select("+customer_id");
  if (!order) {
    throw unauthorizedOrderAccess();
  }
  return serializeCustomerOrder(order);
}

export type ClaimGuestOrderResult = {
  claim_status: "claimed" | "already_claimed";
  order: CustomerOrderTrackingDTO;
};

export async function claimGuestOrder(
  orderNumber: string,
  customerId: string,
  proof: GuestOrderJwtPayload,
  now = new Date(),
): Promise<ClaimGuestOrderResult> {
  assertProofMatchesOrderNumber(orderNumber, proof);
  const claimed = await Order.findOneAndUpdate(
    {
      _id: proof.order_id,
      order_number: proof.order_number,
      normalized_email: proof.normalized_email,
      customer_id: null,
      guest_access_version: proof.guest_access_version,
    },
    {
      $set: { customer_id: customerId },
      $inc: { guest_access_version: 1 },
    },
    { new: true },
  );
  if (claimed) {
    await VerificationChallenge.updateOne(
      { _id: proof.challenge_id, revoked_at: null },
      { $set: { revoked_at: now } },
    );
    return {
      claim_status: "claimed",
      order: serializeCustomerOrder(claimed),
    };
  }

  const existing = await Order.findOne({
    _id: proof.order_id,
    order_number: proof.order_number,
    normalized_email: proof.normalized_email,
  }).select("customer_id");
  if (!existing) {
    throw unauthorizedOrderAccess();
  }
  if (existing.customer_id?.toString() === customerId) {
    return {
      claim_status: "already_claimed",
      order: serializeCustomerOrder(existing),
    };
  }
  if (existing.customer_id) {
    throw new GuestOrderAccessError("Order already claimed", 409);
  }
  throw unauthorizedOrderAccess();
}

export async function getCustomerOrder(
  customerId: string,
  orderNumber: string,
): Promise<CustomerOrderTrackingDTO> {
  const order = await Order.findOne({
    order_number: orderNumber,
    customer_id: customerId,
  });
  if (!order) {
    throw unauthorizedOrderAccess();
  }
  return serializeCustomerOrder(order);
}

import argon2 from "argon2";
import mongoose, { type ClientSession, Types } from "mongoose";

import { CUSTOMER_REFRESH_TOKEN_TTL_SECONDS } from "../config/customerAuth.js";
import {
  signCustomerAccessToken,
  signCustomerRefreshToken,
  verifyCustomerRefreshToken,
} from "../lib/customerTokens.js";
import { isDuplicateKeyError } from "../lib/mongoErrors.js";
import { normalizeEmail } from "../lib/normalizeEmail.js";
import {
  Customer,
  hashCustomerPassword,
  verifyCustomerPassword,
} from "../models/Customer.js";
import { CustomerSession } from "../models/CustomerSession.js";
import type { CustomerJwtPayload } from "../types/auth.types.js";

export class CustomerAuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "CustomerAuthError";
    this.status = status;
  }
}

export type SafeCustomer = {
  id: string;
  email: string;
  is_active: boolean;
};

export type CustomerAuthSession = {
  customer: SafeCustomer;
  accessToken: string;
  refreshToken: string;
};

type CustomerIdentity = {
  _id: Types.ObjectId;
  email: string;
  normalized_email: string;
  is_active: boolean;
  session_version: number;
};

function safeCustomer(customer: CustomerIdentity): SafeCustomer {
  return {
    id: customer._id.toString(),
    email: customer.email,
    is_active: customer.is_active,
  };
}

function tokenPayload(
  customer: CustomerIdentity,
  sessionId: string,
): CustomerJwtPayload {
  return {
    id: customer._id.toString(),
    email: customer.normalized_email,
    session_version: customer.session_version,
    session_id: sessionId,
  };
}

function sessionExpiry(now: Date): Date {
  return new Date(now.getTime() + CUSTOMER_REFRESH_TOKEN_TTL_SECONDS * 1000);
}

async function issueCustomerSession(
  customer: CustomerIdentity,
  now: Date,
  dbSession?: ClientSession,
): Promise<CustomerAuthSession> {
  const sessionId = new Types.ObjectId();
  const payload = tokenPayload(customer, sessionId.toString());
  const accessToken = signCustomerAccessToken(payload);
  const refreshToken = signCustomerRefreshToken(payload);
  const refreshTokenHash = await argon2.hash(refreshToken);

  const sessionData = {
    _id: sessionId,
    customer_id: customer._id,
    session_version: customer.session_version,
    refresh_token_hash: refreshTokenHash,
    previous_refresh_token_hash: null,
    expires_at: sessionExpiry(now),
    last_rotated_at: now,
    revoked_at: null,
  };

  if (dbSession) {
    await CustomerSession.create([sessionData], { session: dbSession });
  } else {
    await CustomerSession.create(sessionData);
  }

  return {
    customer: safeCustomer(customer),
    accessToken,
    refreshToken,
  };
}

export async function signupCustomer(
  email: string,
  password: string,
  now = new Date(),
): Promise<CustomerAuthSession> {
  const trimmedEmail = email.trim();
  const normalizedEmail = normalizeEmail(trimmedEmail);
  const passwordHash = await hashCustomerPassword(password);

  try {
    return await mongoose.connection.transaction(async (dbSession) => {
      const customers = await Customer.create([{
        email: trimmedEmail,
        normalized_email: normalizedEmail,
        password_hash: passwordHash,
      }], { session: dbSession });
      const customer = customers[0];
      if (!customer) {
        throw new Error("Customer creation returned no document");
      }
      return issueCustomerSession(customer, now, dbSession);
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new CustomerAuthError("Unable to create account", 409);
    }
    throw error;
  }
}

export async function loginCustomer(
  email: string,
  password: string,
  now = new Date(),
): Promise<CustomerAuthSession> {
  const customer = await Customer.findOne({
    normalized_email: normalizeEmail(email),
    is_active: true,
  }).select("+password_hash");

  if (!customer) {
    throw new CustomerAuthError("Invalid email or password");
  }

  const passwordMatches = await verifyCustomerPassword(
    customer.password_hash,
    password,
  );
  if (!passwordMatches) {
    throw new CustomerAuthError("Invalid email or password");
  }

  return issueCustomerSession(customer, now);
}

function invalidSession(): CustomerAuthError {
  return new CustomerAuthError("Invalid session");
}

async function revokeReplay(
  sessionId: Types.ObjectId,
  now: Date,
): Promise<void> {
  await CustomerSession.updateOne(
    { _id: sessionId, revoked_at: null },
    { $set: { revoked_at: now } },
  );
}

export async function rotateCustomerTokens(
  refreshToken: string,
  now = new Date(),
): Promise<CustomerAuthSession> {
  let payload: CustomerJwtPayload;
  try {
    payload = verifyCustomerRefreshToken(refreshToken);
  } catch {
    throw invalidSession();
  }

  const [customer, session] = await Promise.all([
    Customer.findOne({
      _id: payload.id,
      normalized_email: payload.email,
      is_active: true,
      session_version: payload.session_version,
    }).select("email normalized_email is_active session_version"),
    CustomerSession.findOne({
      _id: payload.session_id,
      customer_id: payload.id,
      session_version: payload.session_version,
      revoked_at: null,
      expires_at: { $gt: now },
    }).select("+refresh_token_hash +previous_refresh_token_hash"),
  ]);

  if (!customer || !session?.refresh_token_hash) {
    throw invalidSession();
  }

  const currentMatches = await argon2.verify(
    session.refresh_token_hash,
    refreshToken,
  );
  if (!currentMatches) {
    if (
      session.previous_refresh_token_hash &&
      await argon2.verify(session.previous_refresh_token_hash, refreshToken)
    ) {
      await revokeReplay(session._id, now);
    }
    throw invalidSession();
  }

  const nextPayload = tokenPayload(customer, payload.session_id);
  const accessToken = signCustomerAccessToken(nextPayload);
  const nextRefreshToken = signCustomerRefreshToken(nextPayload);
  const nextRefreshTokenHash = await argon2.hash(nextRefreshToken);
  const rotated = await CustomerSession.findOneAndUpdate(
    {
      _id: session._id,
      customer_id: payload.id,
      session_version: payload.session_version,
      refresh_token_hash: session.refresh_token_hash,
      revoked_at: null,
      expires_at: { $gt: now },
    },
    {
      $set: {
        refresh_token_hash: nextRefreshTokenHash,
        previous_refresh_token_hash: session.refresh_token_hash,
        expires_at: sessionExpiry(now),
        last_rotated_at: now,
      },
    },
  );

  if (!rotated) {
    const fresh = await CustomerSession.findOne({
      _id: payload.session_id,
      customer_id: payload.id,
      revoked_at: null,
      expires_at: { $gt: now },
    }).select("+previous_refresh_token_hash");
    if (
      fresh?.previous_refresh_token_hash &&
      await argon2.verify(fresh.previous_refresh_token_hash, refreshToken)
    ) {
      throw new CustomerAuthError("Concurrent token rotation", 409);
    }
    throw invalidSession();
  }

  return {
    customer: safeCustomer(customer),
    accessToken,
    refreshToken: nextRefreshToken,
  };
}

export async function logoutCustomer(
  refreshToken: string | undefined,
  now = new Date(),
): Promise<void> {
  if (!refreshToken) {
    return;
  }

  let payload: CustomerJwtPayload;
  try {
    payload = verifyCustomerRefreshToken(refreshToken);
  } catch {
    return;
  }

  const session = await CustomerSession.findOne({
    _id: payload.session_id,
    customer_id: payload.id,
    revoked_at: null,
    expires_at: { $gt: now },
  }).select("+refresh_token_hash");

  if (
    !session?.refresh_token_hash ||
    !await argon2.verify(session.refresh_token_hash, refreshToken)
  ) {
    return;
  }

  await CustomerSession.updateOne(
    {
      _id: session._id,
      refresh_token_hash: session.refresh_token_hash,
      revoked_at: null,
    },
    { $set: { revoked_at: now } },
  );
}

export async function getCurrentCustomer(
  customerId: string,
): Promise<SafeCustomer> {
  const customer = await Customer.findById(customerId);
  if (!customer?.is_active) {
    throw new CustomerAuthError("Unauthorized");
  }
  return safeCustomer(customer);
}

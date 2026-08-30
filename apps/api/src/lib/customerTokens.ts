import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

import {
  CUSTOMER_ACCESS_TOKEN_TTL_SECONDS,
  CUSTOMER_REFRESH_TOKEN_TTL_SECONDS,
} from "../config/customerAuth.js";
import type { CustomerJwtPayload } from "../types/auth.types.js";

export const CUSTOMER_TOKEN_AUDIENCE = "minan-customer";
const CUSTOMER_TOKEN_ACTOR = "customer";

function getCustomerAccessSecret(): string {
  const secret = process.env.CUSTOMER_JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_JWT_ACCESS_SECRET is not defined");
  }
  return secret;
}

function getCustomerRefreshSecret(): string {
  const secret = process.env.CUSTOMER_JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("CUSTOMER_JWT_REFRESH_SECRET is not defined");
  }
  return secret;
}

function parseCustomerPayload(decoded: jwt.JwtPayload): CustomerJwtPayload {
  const id = decoded.id;
  const email = decoded.email;
  const sessionVersion = decoded.session_version;
  const sessionId = decoded.session_id;

  if (
    decoded.actor !== CUSTOMER_TOKEN_ACTOR ||
    typeof id !== "string" ||
    typeof email !== "string" ||
    !Number.isSafeInteger(sessionVersion) ||
    sessionVersion < 0 ||
    typeof sessionId !== "string"
  ) {
    throw new Error("Invalid customer token payload");
  }

  return {
    id,
    email,
    session_version: sessionVersion,
    session_id: sessionId,
  };
}

function signCustomerToken(
  payload: CustomerJwtPayload,
  secret: string,
  expiresIn: number,
  jwtId?: string,
): string {
  return jwt.sign(
    { ...payload, actor: CUSTOMER_TOKEN_ACTOR },
    secret,
    {
      audience: CUSTOMER_TOKEN_AUDIENCE,
      expiresIn,
      ...(jwtId === undefined ? {} : { jwtid: jwtId }),
    },
  );
}

export function signCustomerAccessToken(payload: CustomerJwtPayload): string {
  return signCustomerToken(
    payload,
    getCustomerAccessSecret(),
    CUSTOMER_ACCESS_TOKEN_TTL_SECONDS,
  );
}

export function signCustomerRefreshToken(payload: CustomerJwtPayload): string {
  return signCustomerToken(
    payload,
    getCustomerRefreshSecret(),
    CUSTOMER_REFRESH_TOKEN_TTL_SECONDS,
    randomUUID(),
  );
}

function verifyCustomerToken(token: string, secret: string): CustomerJwtPayload {
  const decoded = jwt.verify(token, secret, {
    audience: CUSTOMER_TOKEN_AUDIENCE,
  });
  if (typeof decoded === "string") {
    throw new Error("Invalid customer token");
  }
  return parseCustomerPayload(decoded);
}

export function verifyCustomerAccessToken(token: string): CustomerJwtPayload {
  return verifyCustomerToken(token, getCustomerAccessSecret());
}

export function verifyCustomerRefreshToken(token: string): CustomerJwtPayload {
  return verifyCustomerToken(token, getCustomerRefreshSecret());
}

import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

import {
  CUSTOMER_ACCESS_TOKEN_TTL_SECONDS,
  CUSTOMER_REFRESH_TOKEN_TTL_SECONDS,
  getCustomerAccessTokenSecret,
  getCustomerRefreshTokenSecret,
} from "../config/customerAuth.js";
import type { CustomerJwtPayload } from "../types/auth.types.js";

export const CUSTOMER_TOKEN_AUDIENCE = "minan-customer";
const CUSTOMER_TOKEN_ACTOR = "customer";

const customerJwtPayloadSchema = z.object({
  id: z.string(),
  email: z.string(),
  session_version: z.number().int().nonnegative(),
  session_id: z.string(),
  actor: z.literal(CUSTOMER_TOKEN_ACTOR),
});

function getCustomerAccessSecret(): string {
  return getCustomerAccessTokenSecret();
}

function getCustomerRefreshSecret(): string {
  return getCustomerRefreshTokenSecret();
}

function parseCustomerPayload(decoded: jwt.JwtPayload): CustomerJwtPayload {
  const result = customerJwtPayloadSchema.safeParse(decoded);
  if (!result.success) {
    throw new Error("Invalid customer token payload");
  }

  return {
    id: result.data.id,
    email: result.data.email,
    session_version: result.data.session_version,
    session_id: result.data.session_id,
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

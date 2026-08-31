import jwt from "jsonwebtoken";
import { z } from "zod";

import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "../config/auth.js";
import type { AdminJwtPayload } from "../types/auth.types.js";

export const ADMIN_TOKEN_AUDIENCE = "minan-admin";
const ADMIN_TOKEN_ACTOR = "admin";

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }
  return secret;
}

function hasAdminAudience(audience: string | string[]): boolean {
  return Array.isArray(audience)
    ? audience.includes(ADMIN_TOKEN_AUDIENCE)
    : audience === ADMIN_TOKEN_AUDIENCE;
}

const adminJwtPayloadSchema = z.object({
  id: z.string(),
  email: z.string(),
  session_version: z.number().int().nonnegative(),
  actor: z.literal(ADMIN_TOKEN_ACTOR).optional(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
}).superRefine((payload, context) => {
  if (payload.aud !== undefined && !hasAdminAudience(payload.aud)) {
    context.addIssue({
      code: "custom",
      message: "Invalid admin token audience",
      path: ["aud"],
    });
  }
});

function parsePayload(
  decoded: jwt.JwtPayload,
  allowMissingSessionVersion: boolean,
): AdminJwtPayload {
  const sessionVersion =
    decoded.session_version === undefined && allowMissingSessionVersion
      ? 0
      : decoded.session_version;

  const result = adminJwtPayloadSchema.safeParse({
    ...decoded,
    session_version: sessionVersion,
  });
  if (!result.success) {
    throw new Error("Invalid token payload");
  }

  return {
    id: result.data.id,
    email: result.data.email,
    session_version: result.data.session_version,
  };
}

export function signAccessToken(payload: AdminJwtPayload): string {
  return jwt.sign({ ...payload, actor: ADMIN_TOKEN_ACTOR }, getAccessSecret(), {
    audience: ADMIN_TOKEN_AUDIENCE,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function signRefreshToken(payload: AdminJwtPayload): string {
  return jwt.sign({ ...payload, actor: ADMIN_TOKEN_ACTOR }, getRefreshSecret(), {
    audience: ADMIN_TOKEN_AUDIENCE,
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): AdminJwtPayload {
  const decoded = jwt.verify(token, getAccessSecret());
  if (typeof decoded === "string") {
    throw new Error("Invalid access token");
  }
  return parsePayload(decoded, true);
}

export function verifyRefreshToken(token: string): AdminJwtPayload {
  const decoded = jwt.verify(token, getRefreshSecret());
  if (typeof decoded === "string") {
    throw new Error("Invalid refresh token");
  }
  return parsePayload(decoded, false);
}

import jwt from "jsonwebtoken";

import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "../config/auth.js";
import type { AdminJwtPayload } from "../types/auth.types.js";

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

function parsePayload(
  decoded: jwt.JwtPayload,
  allowMissingSessionVersion: boolean,
): AdminJwtPayload {
  const id = decoded.id;
  const email = decoded.email;
  const sessionVersion =
    decoded.session_version === undefined && allowMissingSessionVersion
      ? 0
      : decoded.session_version;

  if (
    typeof id !== "string" ||
    typeof email !== "string" ||
    !Number.isSafeInteger(sessionVersion) ||
    sessionVersion < 0
  ) {
    throw new Error("Invalid token payload");
  }

  return { id, email, session_version: sessionVersion };
}

export function signAccessToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function signRefreshToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, getRefreshSecret(), {
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

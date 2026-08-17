import argon2 from "argon2";

import { AdminUser, verifyAdminPassword } from "../models/AdminUser.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import type { AdminJwtPayload } from "../types/auth.types.js";

export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

function toJwtPayload(admin: {
  _id: { toString(): string };
  email: string;
  session_version: number;
}): AdminJwtPayload {
  return {
    id: admin._id.toString(),
    email: admin.email,
    session_version: admin.session_version,
  };
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<{
  payload: AdminJwtPayload;
  accessToken: string;
  refreshToken: string;
}> {
  const admin = await AdminUser.findOne({
    email: email.toLowerCase().trim(),
    is_active: true,
  });

  if (!admin) {
    throw new AuthError("Invalid email or password");
  }

  const valid = await verifyAdminPassword(admin.password, password);
  if (!valid) {
    throw new AuthError("Invalid email or password");
  }

  const payload = toJwtPayload(admin);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  admin.refresh_token_hash = await argon2.hash(refreshToken);
  admin.previous_refresh_token_hash = null;
  await admin.save();

  return {
    payload,
    accessToken,
    refreshToken,
  };
}

export async function rotateTokens(refreshToken: string): Promise<{
  payload: AdminJwtPayload;
  accessToken: string;
  refreshToken: string;
}> {
  let payload: AdminJwtPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthError("Invalid refresh token");
  }

  const admin = await AdminUser.findOne({
    _id: payload.id,
    email: payload.email,
    is_active: true,
  }).select("+refresh_token_hash");

  if (!admin?.refresh_token_hash) {
    throw new AuthError("Invalid refresh token");
  }

  const refreshTokenMatches = await argon2.verify(
    admin.refresh_token_hash,
    refreshToken,
  );
  if (!refreshTokenMatches) {
    throw new AuthError("Invalid refresh token");
  }

  const nextPayload = toJwtPayload(admin);
  const accessToken = signAccessToken(nextPayload);
  const nextRefreshToken = signRefreshToken(nextPayload);
  const nextRefreshTokenHash = await argon2.hash(nextRefreshToken);
  const previousRefreshTokenHash = admin.refresh_token_hash;

  const rotated = await AdminUser.findOneAndUpdate(
    {
      _id: admin._id,
      refresh_token_hash: previousRefreshTokenHash,
    },
    {
      refresh_token_hash: nextRefreshTokenHash,
      previous_refresh_token_hash: previousRefreshTokenHash,
    },
  );

  if (!rotated) {
    const freshAdmin = await AdminUser.findById(admin._id).select(
      "+previous_refresh_token_hash",
    );

    if (freshAdmin?.previous_refresh_token_hash) {
      const matchesPrevious = await argon2.verify(
        freshAdmin.previous_refresh_token_hash,
        refreshToken,
      );

      if (matchesPrevious) {
        throw new AuthError("Concurrent token rotation", 409);
      }
    }

    throw new AuthError("Invalid refresh token");
  }

  return {
    payload: nextPayload,
    accessToken,
    refreshToken: nextRefreshToken,
  };
}

export async function logoutAdmin(
  refreshToken: string | undefined,
): Promise<void> {
  if (!refreshToken) {
    return;
  }

  let payload: AdminJwtPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  const admin = await AdminUser.findOne({
    _id: payload.id,
    email: payload.email,
  }).select("+refresh_token_hash");

  if (!admin?.refresh_token_hash) {
    return;
  }

  const refreshTokenMatches = await argon2.verify(
    admin.refresh_token_hash,
    refreshToken,
  );
  if (!refreshTokenMatches) {
    return;
  }

  await AdminUser.updateOne(
    { _id: admin._id, refresh_token_hash: admin.refresh_token_hash },
    { refresh_token_hash: null, previous_refresh_token_hash: null },
  );
}

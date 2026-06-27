import { AdminUser, verifyAdminPassword } from "../models/AdminUser.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import type { AdminJwtPayload, AdminRole } from "../types/auth.types.js";

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
  role: AdminRole;
}): AdminJwtPayload {
  return {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
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
  return {
    payload,
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
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
  });

  if (!admin) {
    throw new AuthError("Admin account is inactive or missing");
  }

  const nextPayload = toJwtPayload(admin);
  return {
    payload: nextPayload,
    accessToken: signAccessToken(nextPayload),
    refreshToken: signRefreshToken(nextPayload),
  };
}

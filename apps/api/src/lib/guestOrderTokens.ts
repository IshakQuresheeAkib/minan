import jwt from "jsonwebtoken";
import { z } from "zod";

import {
  GUEST_ORDER_ACCESS_TOKEN_TTL_SECONDS,
  getGuestOrderAccessTokenSecret,
} from "../config/guestOrderAccess.js";
import type { GuestOrderJwtPayload } from "../types/auth.types.js";

export const GUEST_ORDER_TOKEN_AUDIENCE = "minan-guest-order";
const GUEST_ORDER_TOKEN_ACTOR = "guest_order";

const guestOrderJwtPayloadSchema = z.object({
  order_id: z.string(),
  order_number: z.string(),
  normalized_email: z.string(),
  guest_access_version: z.number().int().positive(),
  challenge_id: z.string(),
  actor: z.literal(GUEST_ORDER_TOKEN_ACTOR),
});

function parseGuestOrderPayload(decoded: jwt.JwtPayload): GuestOrderJwtPayload {
  const result = guestOrderJwtPayloadSchema.safeParse(decoded);
  if (!result.success) {
    throw new Error("Invalid guest Order token payload");
  }

  return {
    order_id: result.data.order_id,
    order_number: result.data.order_number,
    normalized_email: result.data.normalized_email,
    guest_access_version: result.data.guest_access_version,
    challenge_id: result.data.challenge_id,
  };
}

export function signGuestOrderAccessToken(payload: GuestOrderJwtPayload): string {
  return jwt.sign(
    { ...payload, actor: GUEST_ORDER_TOKEN_ACTOR },
    getGuestOrderAccessTokenSecret(),
    {
      audience: GUEST_ORDER_TOKEN_AUDIENCE,
      expiresIn: GUEST_ORDER_ACCESS_TOKEN_TTL_SECONDS,
    },
  );
}

export function verifyGuestOrderAccessToken(token: string): GuestOrderJwtPayload {
  const decoded = jwt.verify(token, getGuestOrderAccessTokenSecret(), {
    audience: GUEST_ORDER_TOKEN_AUDIENCE,
  });
  if (typeof decoded === "string") {
    throw new Error("Invalid guest Order token");
  }
  return parseGuestOrderPayload(decoded);
}

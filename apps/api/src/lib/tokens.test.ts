import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";

import { verifyAccessToken, verifyRefreshToken } from "./tokens.js";

describe("access token payloads", () => {
  const previousAccessSecret = process.env.JWT_ACCESS_SECRET;
  const previousRefreshSecret = process.env.JWT_REFRESH_SECRET;

  afterEach(() => {
    if (previousAccessSecret === undefined) {
      delete process.env.JWT_ACCESS_SECRET;
    } else {
      process.env.JWT_ACCESS_SECRET = previousAccessSecret;
    }

    if (previousRefreshSecret === undefined) {
      delete process.env.JWT_REFRESH_SECRET;
    } else {
      process.env.JWT_REFRESH_SECRET = previousRefreshSecret;
    }
  });

  it("treats a legacy access token as session version zero", () => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    const legacyToken = jwt.sign(
      { id: "66f000000000000000000001", email: "admin@example.com" },
      process.env.JWT_ACCESS_SECRET,
    );

    expect(verifyAccessToken(legacyToken)).toEqual({
      id: "66f000000000000000000001",
      email: "admin@example.com",
      session_version: 0,
    });
  });

  it("rejects a legacy refresh token without a session version", () => {
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    const legacyToken = jwt.sign(
      { id: "66f000000000000000000001", email: "admin@example.com" },
      process.env.JWT_REFRESH_SECRET,
    );

    expect(() => verifyRefreshToken(legacyToken)).toThrow(
      "Invalid token payload",
    );
  });
});

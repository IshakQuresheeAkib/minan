import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { afterEach, describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("admin auth proxy", () => {
  afterEach(() => {
    delete process.env.JWT_ACCESS_SECRET;
  });

  it("keeps the login page open for an explicit reauthentication redirect", async () => {
    const secret = "test-secret";
    process.env.JWT_ACCESS_SECRET = secret;
    const token = await new SignJWT({ id: "admin-1", email: "admin@example.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("5m")
      .sign(new TextEncoder().encode(secret));
    const request = new NextRequest("http://localhost/admin/login?reauth=1", {
      headers: { cookie: `access_token=${token}` },
    });

    const response = await proxy(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });
});

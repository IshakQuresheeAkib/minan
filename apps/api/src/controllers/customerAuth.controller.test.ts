import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrent: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  signup: vi.fn(),
}));

vi.mock("../services/customerAuth.service.js", () => ({
  CustomerAuthError: class CustomerAuthError extends Error {
    status: number;
    constructor(message: string, status = 401) {
      super(message);
      this.status = status;
    }
  },
  getCurrentCustomer: mocks.getCurrent,
  loginCustomer: mocks.login,
  logoutCustomer: mocks.logout,
  rotateCustomerTokens: mocks.refresh,
  signupCustomer: mocks.signup,
}));

import {
  customerLoginHandler,
  customerLogoutHandler,
  customerMeHandler,
  customerRefreshHandler,
  customerSignupHandler,
} from "./customerAuth.controller.js";

const serviceResult = {
  customer: {
    id: "66f000000000000000000002",
    email: "Customer@Example.com",
    is_active: true,
    password_hash: "must-not-leak",
    normalized_email: "must-not-leak@example.com",
    session_version: 9,
  },
  accessToken: "customer-access-token",
  refreshToken: "customer-refresh-token",
  session: { refresh_token_hash: "must-not-leak" },
};

function response() {
  const res = {
    clearCookie: vi.fn(),
    cookie: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
    status: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

describe("customer auth controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signup.mockResolvedValue(serviceResult);
    mocks.login.mockResolvedValue(serviceResult);
    mocks.refresh.mockResolvedValue(serviceResult);
    mocks.logout.mockResolvedValue(undefined);
    mocks.getCurrent.mockResolvedValue(serviceResult.customer);
  });

  it.each([
    ["signup", customerSignupHandler, mocks.signup, 201],
    ["login", customerLoginHandler, mocks.login, 200],
  ] as const)("sets customer cookies and allowlists the %s response", async (
    _label,
    handler,
    service,
    status,
  ) => {
    const req = {
      body: { email: "Customer@Example.com", password: "password123" },
      cookies: {},
    } as unknown as Request;
    const res = response();

    await handler(req, res, vi.fn());

    expect(service).toHaveBeenCalledWith(
      "Customer@Example.com",
      "password123",
    );
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({
      customer: {
        id: serviceResult.customer.id,
        email: serviceResult.customer.email,
        is_active: true,
      },
      accessToken: "customer-access-token",
    });
  });

  it("rotates from the customer refresh cookie without exposing it", async () => {
    const req = {
      body: {},
      cookies: { customer_refresh_token: "current-refresh-token" },
    } as unknown as Request;
    const res = response();

    await customerRefreshHandler(req, res, vi.fn());

    expect(mocks.refresh).toHaveBeenCalledWith("current-refresh-token");
    expect(res.json).toHaveBeenCalledWith({
      customer: {
        id: serviceResult.customer.id,
        email: serviceResult.customer.email,
        is_active: true,
      },
      accessToken: "customer-access-token",
    });
  });

  it("clears only customer cookies on logout", async () => {
    const req = {
      cookies: { customer_refresh_token: "current-refresh-token" },
    } as unknown as Request;
    const res = response();

    await customerLogoutHandler(req, res, vi.fn());

    expect(mocks.logout).toHaveBeenCalledWith("current-refresh-token");
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.clearCookie).not.toHaveBeenCalledWith("access_token", expect.anything());
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("returns only allowlisted current-customer fields", async () => {
    const req = {
      customer: {
        id: serviceResult.customer.id,
        email: "customer@example.com",
        session_id: "66f000000000000000000003",
        session_version: 9,
      },
    } as unknown as Request;
    const res = response();

    await customerMeHandler(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      customer: {
        id: serviceResult.customer.id,
        email: serviceResult.customer.email,
        is_active: true,
      },
    });
  });
});

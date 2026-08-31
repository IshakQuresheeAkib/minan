import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose, { type ClientSession } from "mongoose";

const mocks = vi.hoisted(() => ({
  argonHash: vi.fn(),
  argonVerify: vi.fn(),
  customerCreate: vi.fn(),
  customerFindById: vi.fn(),
  customerFindOne: vi.fn(),
  hashCustomerPassword: vi.fn(),
  sessionCreate: vi.fn(),
  sessionFindOne: vi.fn(),
  sessionFindOneAndUpdate: vi.fn(),
  sessionUpdateOne: vi.fn(),
  signAccess: vi.fn(),
  signRefresh: vi.fn(),
  verifyPassword: vi.fn(),
  verifyRefresh: vi.fn(),
}));

vi.mock("argon2", () => ({
  default: {
    hash: mocks.argonHash,
    verify: mocks.argonVerify,
  },
}));

vi.mock("../models/Customer.js", () => ({
  Customer: {
    create: mocks.customerCreate,
    findById: mocks.customerFindById,
    findOne: mocks.customerFindOne,
  },
  hashCustomerPassword: mocks.hashCustomerPassword,
  verifyCustomerPassword: mocks.verifyPassword,
}));

vi.mock("../models/CustomerSession.js", () => ({
  CustomerSession: {
    create: mocks.sessionCreate,
    findOne: mocks.sessionFindOne,
    findOneAndUpdate: mocks.sessionFindOneAndUpdate,
    updateOne: mocks.sessionUpdateOne,
  },
}));

vi.mock("../lib/customerTokens.js", () => ({
  signCustomerAccessToken: mocks.signAccess,
  signCustomerRefreshToken: mocks.signRefresh,
  verifyCustomerRefreshToken: mocks.verifyRefresh,
}));

import {
  CustomerAuthError,
  getCurrentCustomer,
  loginCustomer,
  logoutCustomer,
  rotateCustomerTokens,
  signupCustomer,
} from "./customerAuth.service.js";

const CUSTOMER_ID = "66f000000000000000000002";
const SESSION_ID = "66f000000000000000000003";
const NOW = new Date("2026-08-30T00:00:00.000Z");
const DB_SESSION = {} as ClientSession;
const transactionSpy = vi.spyOn(mongoose.connection, "transaction");

const customer = {
  _id: { toString: () => CUSTOMER_ID },
  email: "Customer@Example.com",
  normalized_email: "customer@example.com",
  password_hash: "password-hash",
  is_active: true,
  session_version: 4,
};

const tokenPayload = {
  id: CUSTOMER_ID,
  email: "customer@example.com",
  session_version: 4,
  session_id: SESSION_ID,
};

function selectable(value: unknown) {
  return { select: vi.fn().mockResolvedValue(value) };
}

describe("customer auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mocks.hashCustomerPassword.mockResolvedValue("password-hash");
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.argonHash.mockResolvedValue("refresh-token-hash");
    mocks.signAccess.mockReturnValue("customer-access-token");
    mocks.signRefresh.mockReturnValue("customer-refresh-token");
    mocks.customerCreate.mockResolvedValue([customer]);
    mocks.sessionCreate.mockResolvedValue({});
    transactionSpy.mockImplementation(async (work) => work(DB_SESSION));
  });

  it("signs up one customer without querying or claiming Orders", async () => {
    const result = await signupCustomer(
      "  Customer@Example.com  ",
      "password123",
      NOW,
    );

    expect(mocks.customerCreate).toHaveBeenCalledWith([{
      email: "Customer@Example.com",
      normalized_email: "customer@example.com",
      password_hash: "password-hash",
    }], { session: DB_SESSION });
    expect(mocks.sessionCreate).toHaveBeenCalledWith(
      [expect.objectContaining({
        customer_id: customer._id,
        session_version: 4,
        refresh_token_hash: "refresh-token-hash",
        previous_refresh_token_hash: null,
        expires_at: new Date("2026-09-06T00:00:00.000Z"),
        last_rotated_at: NOW,
        revoked_at: null,
      })],
      { session: DB_SESSION },
    );
    expect(result).toEqual({
      customer: {
        id: CUSTOMER_ID,
        email: "Customer@Example.com",
        is_active: true,
      },
      accessToken: "customer-access-token",
      refreshToken: "customer-refresh-token",
    });
  });

  it("uses a generic conflict when normalized email uniqueness wins", async () => {
    mocks.customerCreate.mockRejectedValue({ code: 11000 });

    await expect(
      signupCustomer("customer@example.com", "password123", NOW),
    ).rejects.toMatchObject({
      name: "CustomerAuthError",
      message: "Unable to create account",
      status: 409,
    });
  });

  it("uses one database transaction for customer and initial session writes", async () => {
    const sessionWriteError = new Error("session write failed");
    mocks.customerCreate.mockImplementation(async (input: unknown) =>
      Array.isArray(input) ? [customer] : customer);
    mocks.sessionCreate.mockRejectedValueOnce(sessionWriteError);

    await expect(
      signupCustomer("customer@example.com", "password123", NOW),
    ).rejects.toBe(sessionWriteError);

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(mocks.customerCreate).toHaveBeenCalledWith(
      [{
        email: "customer@example.com",
        normalized_email: "customer@example.com",
        password_hash: "password-hash",
      }],
      { session: DB_SESSION },
    );
    expect(mocks.sessionCreate).toHaveBeenCalledWith(
      [expect.objectContaining({
        customer_id: customer._id,
        refresh_token_hash: "refresh-token-hash",
      })],
      { session: DB_SESSION },
    );
  });

  it("returns the same generic login failure for missing and wrong passwords", async () => {
    mocks.customerFindOne.mockReturnValueOnce(selectable(null));
    await expect(
      loginCustomer("missing@example.com", "password123", NOW),
    ).rejects.toMatchObject({ message: "Invalid email or password", status: 401 });

    mocks.customerFindOne.mockReturnValueOnce(selectable(customer));
    mocks.verifyPassword.mockResolvedValueOnce(false);
    await expect(
      loginCustomer("customer@example.com", "wrong-password", NOW),
    ).rejects.toMatchObject({ message: "Invalid email or password", status: 401 });
  });

  it("creates a separate session for a valid active login", async () => {
    mocks.customerFindOne.mockReturnValue(selectable(customer));

    const result = await loginCustomer(
      "CUSTOMER@example.com",
      "password123",
      NOW,
    );

    expect(mocks.customerFindOne).toHaveBeenCalledWith({
      normalized_email: "customer@example.com",
      is_active: true,
    });
    expect(result.customer).toEqual({
      id: CUSTOMER_ID,
      email: "Customer@Example.com",
      is_active: true,
    });
  });

  it("rotates the current refresh credential atomically", async () => {
    const session = {
      _id: SESSION_ID,
      refresh_token_hash: "current-hash",
      previous_refresh_token_hash: "previous-hash",
    };
    mocks.verifyRefresh.mockReturnValue(tokenPayload);
    mocks.customerFindOne.mockReturnValue(selectable(customer));
    mocks.sessionFindOne.mockReturnValue(selectable(session));
    mocks.argonVerify.mockResolvedValue(true);
    mocks.argonHash.mockResolvedValue("next-hash");
    mocks.signRefresh.mockReturnValue("next-refresh-token");
    mocks.sessionFindOneAndUpdate.mockResolvedValue(session);

    const result = await rotateCustomerTokens("current-refresh-token", NOW);

    expect(mocks.sessionFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: SESSION_ID,
        customer_id: CUSTOMER_ID,
        refresh_token_hash: "current-hash",
        revoked_at: null,
        expires_at: { $gt: NOW },
      }),
      {
        $set: {
          refresh_token_hash: "next-hash",
          previous_refresh_token_hash: "current-hash",
          expires_at: new Date("2026-09-06T00:00:00.000Z"),
          last_rotated_at: NOW,
        },
      },
    );
    expect(result.refreshToken).toBe("next-refresh-token");
  });

  it("returns a conflict without revoking when a concurrent rotation wins", async () => {
    const observedSession = {
      _id: SESSION_ID,
      refresh_token_hash: "current-hash",
      previous_refresh_token_hash: "older-hash",
    };
    const winningSession = {
      _id: SESSION_ID,
      previous_refresh_token_hash: "current-hash",
    };
    mocks.verifyRefresh.mockReturnValue(tokenPayload);
    mocks.customerFindOne.mockReturnValue(selectable(customer));
    mocks.sessionFindOne
      .mockReturnValueOnce(selectable(observedSession))
      .mockReturnValueOnce(selectable(winningSession));
    mocks.argonVerify.mockResolvedValue(true);
    mocks.argonHash.mockResolvedValue("losing-hash");
    mocks.sessionFindOneAndUpdate.mockResolvedValue(null);

    await expect(
      rotateCustomerTokens("current-refresh-token", NOW),
    ).rejects.toMatchObject({
      name: "CustomerAuthError",
      message: "Concurrent token rotation",
      status: 409,
    });
    expect(mocks.sessionUpdateOne).not.toHaveBeenCalled();
  });

  it("revokes the session when the immediately previous token is replayed", async () => {
    const session = {
      _id: SESSION_ID,
      refresh_token_hash: "current-hash",
      previous_refresh_token_hash: "replayed-hash",
    };
    mocks.verifyRefresh.mockReturnValue(tokenPayload);
    mocks.customerFindOne.mockReturnValue(selectable(customer));
    mocks.sessionFindOne.mockReturnValue(selectable(session));
    mocks.argonVerify.mockImplementation(async (hash: string) =>
      hash === "replayed-hash");
    mocks.sessionUpdateOne.mockResolvedValue({ modifiedCount: 1 });

    await expect(
      rotateCustomerTokens("replayed-token", NOW),
    ).rejects.toBeInstanceOf(CustomerAuthError);
    expect(mocks.sessionUpdateOne).toHaveBeenCalledWith(
      { _id: SESSION_ID, revoked_at: null },
      { $set: { revoked_at: NOW } },
    );
    expect(mocks.signAccess).not.toHaveBeenCalled();
  });

  it.each([
    ["inactive customer", null, selectable({ _id: SESSION_ID })],
    ["expired or revoked session", customer, selectable(null)],
  ])("rejects refresh for an %s", async (_label, foundCustomer, sessionQuery) => {
    mocks.verifyRefresh.mockReturnValue(tokenPayload);
    mocks.customerFindOne.mockReturnValue(selectable(foundCustomer));
    mocks.sessionFindOne.mockReturnValue(sessionQuery);

    await expect(
      rotateCustomerTokens("refresh-token", NOW),
    ).rejects.toMatchObject({ message: "Invalid session", status: 401 });
  });

  it("revokes only the matching live session on logout", async () => {
    const session = { _id: SESSION_ID, refresh_token_hash: "current-hash" };
    mocks.verifyRefresh.mockReturnValue(tokenPayload);
    mocks.sessionFindOne.mockReturnValue(selectable(session));
    mocks.argonVerify.mockResolvedValue(true);
    mocks.sessionUpdateOne.mockResolvedValue({ modifiedCount: 1 });

    await logoutCustomer("refresh-token", NOW);

    expect(mocks.sessionUpdateOne).toHaveBeenCalledWith(
      { _id: SESSION_ID, refresh_token_hash: "current-hash", revoked_at: null },
      { $set: { revoked_at: NOW } },
    );
  });

  it("returns an allowlisted current customer and rejects inactive accounts", async () => {
    mocks.customerFindById.mockResolvedValueOnce(customer).mockResolvedValueOnce(null);

    await expect(getCurrentCustomer(CUSTOMER_ID)).resolves.toEqual({
      id: CUSTOMER_ID,
      email: "Customer@Example.com",
      is_active: true,
    });
    await expect(getCurrentCustomer(CUSTOMER_ID)).rejects.toMatchObject({
      message: "Unauthorized",
      status: 401,
    });
  });
});

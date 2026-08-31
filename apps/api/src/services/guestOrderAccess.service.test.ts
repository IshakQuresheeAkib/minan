import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  argonHash: vi.fn(),
  argonVerify: vi.fn(),
  challengeCreate: vi.fn(),
  challengeFindOne: vi.fn(),
  challengeFindOneAndUpdate: vi.fn(),
  challengeUpdateOne: vi.fn(),
  orderFindOne: vi.fn(),
  orderFindOneAndUpdate: vi.fn(),
  signGuestAccess: vi.fn(),
  serializeCustomerOrder: vi.fn(),
}));

vi.mock("argon2", () => ({
  default: {
    hash: mocks.argonHash,
    verify: mocks.argonVerify,
  },
}));

vi.mock("../models/Order.js", () => ({
  Order: {
    findOne: mocks.orderFindOne,
    findOneAndUpdate: mocks.orderFindOneAndUpdate,
  },
}));

vi.mock("../models/VerificationChallenge.js", () => ({
  VerificationChallenge: {
    create: mocks.challengeCreate,
    findOne: mocks.challengeFindOne,
    findOneAndUpdate: mocks.challengeFindOneAndUpdate,
    updateOne: mocks.challengeUpdateOne,
  },
}));

vi.mock("../lib/guestOrderTokens.js", () => ({
  signGuestOrderAccessToken: mocks.signGuestAccess,
}));

vi.mock("../utils/serializeCustomerOrder.js", () => ({
  serializeCustomerOrder: mocks.serializeCustomerOrder,
}));

import {
  GuestOrderAccessError,
  claimGuestOrder,
  getCustomerOrder,
  getGuestOrder,
  generateGuestOrderOtp,
  requestGuestOrderOtp,
  verifyGuestOrderOtp,
} from "./guestOrderAccess.service.js";

const NOW = new Date("2026-08-31T10:00:00.000Z");
const order = {
  _id: "66f000000000000000000001",
  order_number: "MN-20260831-0001",
  normalized_email: "guest@example.com",
  guest_access_version: 1,
};

function selectable(value: unknown) {
  return {
    select: vi.fn().mockResolvedValue(value),
    then: <T>(resolve: (resolved: unknown) => T) => resolve(value),
  };
}

describe("guest Order OTP request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.argonHash.mockResolvedValue("argon2-hash");
    mocks.orderFindOne.mockReturnValue(selectable(null));
    mocks.challengeFindOne.mockReturnValue({ sort: vi.fn().mockResolvedValue(null) });
    mocks.challengeCreate.mockResolvedValue({ _id: "66f000000000000000000002" });
    mocks.signGuestAccess.mockReturnValue("guest-order-token");
    mocks.serializeCustomerOrder.mockReturnValue({ order_id: order.order_number });
  });

  it("generates a six-digit OTP without exposing a deterministic sequence", () => {
    expect(generateGuestOrderOtp()).toMatch(/^\d{6}$/);
  });

  it("returns the same generic result for a non-matching Order/email pair without delivery", async () => {
    const email = { send: vi.fn() };

    await expect(requestGuestOrderOtp(
      { order_number: order.order_number, email: "Wrong@Example.com" },
      email,
      NOW,
    )).resolves.toEqual({ accepted: true });

    expect(mocks.orderFindOne).toHaveBeenCalledWith({
      order_number: order.order_number,
      normalized_email: "wrong@example.com",
    });
    expect(mocks.challengeCreate).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it("stores only an OTP hash and delivers the code through the injected transport", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));
    const email = { send: vi.fn().mockResolvedValue({ id: "email_123" }) };

    await expect(requestGuestOrderOtp(
      { order_number: order.order_number, email: " Guest@Example.COM " },
      email,
      NOW,
    )).resolves.toEqual({ accepted: true });

    expect(mocks.challengeCreate).toHaveBeenCalledWith(expect.objectContaining({
      order_id: order._id,
      normalized_email: "guest@example.com",
      purpose: "guest_order_access",
      otp_hash: "argon2-hash",
      attempt_count: 0,
      consumed_at: null,
      revoked_at: null,
    }));
    expect(mocks.challengeCreate.mock.calls[0]?.[0]).not.toHaveProperty("otp");
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({
      to: "guest@example.com",
      text: expect.stringMatching(/\d{6}/),
    }));
  });

  it("does not replace an active challenge before its resend cooldown", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));
    mocks.challengeFindOne.mockReturnValue({
      sort: vi.fn().mockResolvedValue({
        _id: "66f000000000000000000002",
        resend_available_at: new Date("2026-08-31T10:01:00.000Z"),
      }),
    });
    const email = { send: vi.fn() };

    await expect(requestGuestOrderOtp(
      { order_number: order.order_number, email: order.normalized_email },
      email,
      NOW,
    )).resolves.toEqual({ accepted: true });

    expect(mocks.challengeCreate).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it("revokes a newly created challenge when the injected email delivery fails", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));
    const email = { send: vi.fn().mockRejectedValue(new Error("transport unavailable")) };

    await expect(requestGuestOrderOtp(
      { order_number: order.order_number, email: order.normalized_email },
      email,
      NOW,
    )).resolves.toEqual({ accepted: true });

    expect(mocks.challengeUpdateOne).toHaveBeenCalledWith(
      { _id: "66f000000000000000000002", consumed_at: null, revoked_at: null },
      { $set: { revoked_at: NOW } },
    );
  });

  it("atomically consumes a valid OTP before issuing its one-Order proof", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));
    mocks.challengeFindOneAndUpdate
      .mockReturnValueOnce(selectable({
        _id: "66f000000000000000000002",
        otp_hash: "argon2-hash",
        attempt_count: 1,
        attempt_limit: 5,
      }))
      .mockResolvedValueOnce({ _id: "66f000000000000000000002" });
    mocks.argonVerify.mockResolvedValue(true);

    await expect(verifyGuestOrderOtp({
      order_number: order.order_number,
      email: "Guest@Example.com",
      otp: "123456",
    }, NOW)).resolves.toEqual({ guest_access_token: "guest-order-token" });

    expect(mocks.argonVerify).toHaveBeenCalledWith("argon2-hash", "123456");
    expect(mocks.challengeFindOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        _id: "66f000000000000000000002",
        consumed_at: null,
        revoked_at: null,
      }),
      { $set: { consumed_at: NOW } },
      { new: true },
    );
  });

  it("rejects exhausted, invalid, or already-consumed OTP challenges generically", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));
    mocks.challengeFindOneAndUpdate.mockReturnValue(selectable(null));

    await expect(verifyGuestOrderOtp({
      order_number: order.order_number,
      email: order.normalized_email,
      otp: "123456",
    }, NOW)).rejects.toEqual(new GuestOrderAccessError("Invalid verification code"));
  });

  it("revokes an exhausted challenge after its final invalid OTP attempt", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));
    mocks.challengeFindOneAndUpdate.mockReturnValue(selectable({
      _id: "66f000000000000000000002",
      otp_hash: "argon2-hash",
      attempt_count: 5,
      attempt_limit: 5,
    }));
    mocks.argonVerify.mockResolvedValue(false);

    await expect(verifyGuestOrderOtp({
      order_number: order.order_number,
      email: order.normalized_email,
      otp: "123456",
    }, NOW)).rejects.toEqual(new GuestOrderAccessError("Invalid verification code"));

    expect(mocks.challengeUpdateOne).toHaveBeenCalledWith(
      { _id: "66f000000000000000000002", consumed_at: null, revoked_at: null },
      { $set: { revoked_at: NOW } },
    );
  });

  it("reads a guest Order only when the path matches the signed proof", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));

    await expect(getGuestOrder(order.order_number, {
      order_id: order._id,
      order_number: order.order_number,
      normalized_email: order.normalized_email,
      guest_access_version: 1,
      challenge_id: "66f000000000000000000002",
    })).resolves.toEqual({ order_id: order.order_number });

    expect(mocks.orderFindOne).toHaveBeenCalledWith({
      _id: order._id,
      order_number: order.order_number,
      normalized_email: order.normalized_email,
      guest_access_version: 1,
    });
  });

  it("claims exactly the proof-bound unowned Order atomically and invalidates guest access", async () => {
    const proof = {
      order_id: order._id,
      order_number: order.order_number,
      normalized_email: order.normalized_email,
      guest_access_version: 1,
      challenge_id: "66f000000000000000000002",
    };
    mocks.orderFindOneAndUpdate.mockResolvedValue({ ...order, customer_id: "66f000000000000000000003" });

    await expect(claimGuestOrder(
      order.order_number,
      "66f000000000000000000003",
      proof,
      NOW,
    )).resolves.toEqual({
      claim_status: "claimed",
      order: { order_id: order.order_number },
    });

    expect(mocks.orderFindOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: order._id,
        order_number: order.order_number,
        normalized_email: order.normalized_email,
        customer_id: null,
        guest_access_version: 1,
      },
      {
        $set: { customer_id: "66f000000000000000000003" },
        $inc: { guest_access_version: 1 },
      },
      { new: true },
    );
    expect(mocks.challengeUpdateOne).toHaveBeenCalledWith(
      { _id: proof.challenge_id, revoked_at: null },
      { $set: { revoked_at: NOW } },
    );
  });

  it("treats a same-customer retry as idempotent and rejects another owner", async () => {
    const proof = {
      order_id: order._id,
      order_number: order.order_number,
      normalized_email: order.normalized_email,
      guest_access_version: 1,
      challenge_id: "66f000000000000000000002",
    };
    mocks.orderFindOneAndUpdate.mockResolvedValue(null);
    mocks.orderFindOne.mockReturnValueOnce(selectable({
      ...order,
      customer_id: { toString: () => "66f000000000000000000003" },
    }));

    await expect(claimGuestOrder(order.order_number, "66f000000000000000000003", proof, NOW))
      .resolves.toEqual({ claim_status: "already_claimed", order: { order_id: order.order_number } });

    mocks.orderFindOne.mockReturnValueOnce(selectable({
      ...order,
      customer_id: { toString: () => "66f000000000000000000004" },
    }));

    await expect(claimGuestOrder(order.order_number, "66f000000000000000000003", proof, NOW))
      .rejects.toEqual(new GuestOrderAccessError("Order already claimed", 409));
  });

  it("makes concurrent proof-bound claims converge on one Order and one customer", async () => {
    const proof = {
      order_id: order._id,
      order_number: order.order_number,
      normalized_email: order.normalized_email,
      guest_access_version: 1,
      challenge_id: "66f000000000000000000002",
    };
    mocks.orderFindOneAndUpdate
      .mockResolvedValueOnce({ ...order, customer_id: "66f000000000000000000003" })
      .mockResolvedValueOnce(null);
    mocks.orderFindOne.mockReturnValue(selectable({
      ...order,
      customer_id: { toString: () => "66f000000000000000000003" },
    }));

    await expect(Promise.all([
      claimGuestOrder(order.order_number, "66f000000000000000000003", proof, NOW),
      claimGuestOrder(order.order_number, "66f000000000000000000003", proof, NOW),
    ])).resolves.toEqual([
      { claim_status: "claimed", order: { order_id: order.order_number } },
      { claim_status: "already_claimed", order: { order_id: order.order_number } },
    ]);

    expect(mocks.orderFindOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  it("reads customer Orders exclusively by authenticated customer ID", async () => {
    mocks.orderFindOne.mockReturnValue(selectable(order));

    await expect(getCustomerOrder("66f000000000000000000003", order.order_number))
      .resolves.toEqual({ order_id: order.order_number });

    expect(mocks.orderFindOne).toHaveBeenCalledWith({
      order_number: order.order_number,
      customer_id: "66f000000000000000000003",
    });
  });
});

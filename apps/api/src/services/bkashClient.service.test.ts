import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/bkash.js", () => ({
  getBkashConfig: () => ({
    baseUrl: "https://tokenized.sandbox.bka.sh/v2",
    appKey: "test-app-key",
    appSecret: "test-app-secret",
    username: "01770618567",
    password: "test-password",
    apiPublicUrl: "https://api.example.com",
    frontendUrl: "https://shop.example.com",
  }),
}));

const mockBkashToken = {
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
};

vi.mock("../models/BkashToken.js", () => ({
  BkashToken: {
    findOne: (...args: unknown[]) => mockBkashToken.findOne(...args),
    findOneAndUpdate: (...args: unknown[]) => mockBkashToken.findOneAndUpdate(...args),
    updateOne: (...args: unknown[]) => mockBkashToken.updateOne(...args),
    deleteOne: (...args: unknown[]) => mockBkashToken.deleteOne(...args),
  },
}));

import {
  clearBkashTokenCacheForTests,
  createBkashPayment,
  executeBkashPayment,
  queryBkashPayment,
  refundBkashTransaction,
  refundStatusBkash,
  searchBkashTransaction,
} from "./bkashClient.service.js";

describe("bkashClient.service (Tokenized V2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    clearBkashTokenCacheForTests();

    // Default mock: valid cached token in DB
    mockBkashToken.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        id_token: "mock-id-token-xyz",
        refresh_token: "mock-refresh-token-abc",
        expires_at: new Date(Date.now() + 3000 * 1000), // > 5 min ahead
      }),
    });
  });

  it("successfully parses a V2 Create Payment response with lowercase paymentId and no statusCode", async () => {
    const v2CreateResponse = {
      paymentId: "TR0011I9ihzy81791599219257",
      bkashURL: "https://sandbox.payment.bkash.com/?paymentId=TR0011I9ihzy81791599219257",
      callbackURL: "https://api.example.com/api/bkash/callback",
      successCallbackURL: "https://api.example.com/api/bkash/callback?paymentID=TR0011I9ihzy81791599219257&status=success",
      amount: "60.00",
      currency: "BDT",
      intent: "sale",
      transactionStatus: "Initiated",
      merchantInvoiceNumber: "INV-001",
      signature: "sig123",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(v2CreateResponse), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const result = await createBkashPayment({
      amount: "60.00",
      payerReference: "01770618575",
      callbackURL: "https://api.example.com/api/bkash/callback",
      merchantInvoiceNumber: "INV-001",
    });

    expect(result.paymentID).toBe("TR0011I9ihzy81791599219257");
    expect(result.paymentId).toBe("TR0011I9ihzy81791599219257");
    expect(result.statusCode).toBe("0000");
    expect(result.bkashURL).toBe(v2CreateResponse.bkashURL);

    // Verify correct V2 path was called
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/payment/create",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("successfully parses a V2 Execute Payment response with trxId and Completed status", async () => {
    const v2ExecuteResponse = {
      paymentId: "TR0011I9ihzy81791599219257",
      trxId: "DIK80PG0SO",
      transactionStatus: "Completed",
      amount: "60.00",
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: "INV-001",
      payerAccount: "01770618575",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(v2ExecuteResponse), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const result = await executeBkashPayment("TR0011I9ihzy81791599219257");

    expect(result.paymentID).toBe("TR0011I9ihzy81791599219257");
    expect(result.trxID).toBe("DIK80PG0SO");
    expect(result.transactionStatus).toBe("Completed");
    expect(result.statusCode).toBe("0000");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/payment/execute",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("successfully parses a V2 Query Payment response", async () => {
    const v2QueryResponse = {
      paymentId: "TR0011I9ihzy81791599219257",
      verificationStatus: "Incomplete",
      payerReference: "01770618575",
      amount: "60.00",
      currency: "BDT",
      intent: "sale",
      merchantInvoice: "INV-001",
      transactionStatus: "Initiated",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(v2QueryResponse), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const result = await queryBkashPayment("TR0011I9ihzy81791599219257");

    expect(result.paymentID).toBe("TR0011I9ihzy81791599219257");
    expect(result.merchantInvoiceNumber).toBe("INV-001");
    expect(result.transactionStatus).toBe("Initiated");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/query/payment",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("successfully queries Search Transaction by trxId", async () => {
    const searchResponse = {
      trxId: "DIK80PG0SO",
      transactionStatus: "Completed",
      amount: "60.00",
      currency: "BDT",
      payerAccount: "8801770618575",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(searchResponse), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const result = await searchBkashTransaction("DIK80PG0SO");

    expect(result.trxId).toBe("DIK80PG0SO");
    expect(result.transactionStatus).toBe("Completed");
    expect(result.statusCode).toBe("0000");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://tokenized.sandbox.bka.sh/v2/tokenized-checkout/general/search-transaction",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("successfully initiates a Refund and queries Refund Status", async () => {
    const refundResponse = {
      originalTrxId: "DIK80PG0SO",
      refundTrxId: "REFUND-123",
      refundTransactionStatus: "Completed",
      refundAmount: "60.00",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(refundResponse), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const refundResult = await refundBkashTransaction({
      paymentId: "TR001",
      trxId: "DIK80PG0SO",
      refundAmount: "60.00",
      sku: "PROD-1",
      reason: "Customer request",
    });

    expect(refundResult.refundTransactionStatus).toBe("Completed");
    expect(refundResult.statusCode).toBe("0000");

    const refundStatusResponse = {
      originalTrxId: "DIK80PG0SO",
      originalTrxAmount: "60.00",
      refundTransactions: [
        {
          refundTrxId: "REFUND-123",
          refundTransactionStatus: "Completed",
          refundAmount: "60.00",
        },
      ],
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(refundStatusResponse), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    const statusResult = await refundStatusBkash({
      paymentId: "TR001",
      trxId: "DIK80PG0SO",
    });

    expect(statusResult.originalTrxId).toBe("DIK80PG0SO");
    expect(statusResult.refundTransactions?.length).toBe(1);
    expect(statusResult.statusCode).toBe("0000");
  });

  it("recovers via Grant Token when Refresh Token returns HTTP 200 with error statusCode", async () => {
    mockBkashToken.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        id_token: "old-id-token",
        refresh_token: "stale-refresh-token",
        expires_at: new Date(Date.now() - 1000),
      }),
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // 1st call: refresh-token returns 200 with error
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: "9999", statusMessage: "System error" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    // 2nd call: grant-token returns 200 with new token
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: "0000",
          statusMessage: "Successful",
          id_token: "fresh-id-token-123",
          refresh_token: "fresh-refresh-token-456",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    // 3rd call: payment create
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          paymentId: "TR001",
          bkashURL: "https://sandbox.payment.bkash.com/pay",
          amount: "100.00",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await createBkashPayment({
      amount: "100.00",
      payerReference: "01770618575",
      callbackURL: "https://api.example.com/api/bkash/callback",
      merchantInvoiceNumber: "INV-002",
    });

    expect(result.paymentId).toBe("TR001");
    expect(mockBkashToken.findOneAndUpdate).toHaveBeenCalledWith(
      { key: "checkout-url" },
      expect.objectContaining({
        $set: expect.objectContaining({
          id_token: "fresh-id-token-123",
          refresh_token: "fresh-refresh-token-456",
        }),
      }),
      { upsert: true, new: true },
    );
  });

  it("propagates bKash statusMessage when Grant Token fails", async () => {
    mockBkashToken.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: "9999",
          statusMessage: "Invalid or unrecognized access credentials.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      createBkashPayment({
        amount: "100.00",
        payerReference: "01770618575",
        callbackURL: "https://api.example.com/api/bkash/callback",
        merchantInvoiceNumber: "INV-003",
      }),
    ).rejects.toThrow("Invalid or unrecognized access credentials.");
  });
});


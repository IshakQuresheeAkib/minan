import { describe, expect, it } from "vitest";

import {
  classifyExecuteResponse,
  queryConfirmsCompletion,
  sanitizeApiResponse,
  transactionId,
} from "./bkashValidationHarness.logic.js";

describe("bKash validation harness response handling", () => {
  it.each([
    [{ statusCode: "0000", trxId: "TX-1" }, "completed"],
    [{ transactionStatus: "Completed", trxID: "TX-1" }, "completed"],
    [{ statusCode: "0000", transactionStatus: "Initiated", trxID: "TX-1" }, "completed"],
    [{ statusCode: "2062" }, "query"],
    [{ statusCode: "2068" }, "query"],
    [{ statusCode: "2117" }, "query"],
    [{ statusCode: "2062", transactionStatus: "Completed" }, "query"],
    [{ statusCode: "2023" }, "failed"],
    [{ statusCode: "2029" }, "failed"],
    [{ statusCode: "2010" }, "failed"],
    [{ statusCode: "2023", transactionStatus: "Completed" }, "failed"],
  ] as const)("classifies Execute response %o", (response, expected) => {
    expect(classifyExecuteResponse(response)).toBe(expected);
  });

  it("searches only after a completed Query response with a transaction ID", () => {
    const completed = { statusCode: "0000", transactionStatus: "Completed", trxId: "TX-1" };
    expect(queryConfirmsCompletion(completed)).toBe(true);
    expect(transactionId(completed)).toBe("TX-1");
    expect(queryConfirmsCompletion({ statusCode: "0000", transactionStatus: "Initiated" })).toBe(false);
    expect(transactionId({ transactionStatus: "Completed" })).toBeUndefined();
  });

  it("redacts credentials and callback signatures from evidence", () => {
    expect(sanitizeApiResponse({
      id_token: "secret-token",
      app_secret: "secret-app",
      signature: "callback-secret",
      successCallbackURL: "https://merchant.test/callback?signature=callback-secret&status=success",
      transactionStatus: "Completed",
    })).toEqual({
      id_token: "[REDACTED]",
      app_secret: "[REDACTED]",
      signature: "[REDACTED]",
      successCallbackURL: "https://merchant.test/callback?signature=%5BREDACTED%5D&status=success",
      transactionStatus: "Completed",
    });
  });
});

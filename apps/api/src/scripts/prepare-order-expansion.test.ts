import { describe, expect, it } from "vitest";

import { hasCompatibleIndex } from "./prepare-order-expansion.js";

describe("payment attempt Order-index expansion", () => {
  it("accepts a compatible index even when MongoDB assigned a different name", () => {
    expect(hasCompatibleIndex(
      [{
        name: "order_id_1_sequence_1",
        key: { order_id: 1, sequence: 1 },
        unique: true,
        partialFilterExpression: { order_id: { $type: "objectId" } },
      }],
      {
        name: "order_sequence_partial_unique",
        key: { order_id: 1, sequence: 1 },
        unique: true,
        partialFilterExpression: { order_id: { $type: "objectId" } },
      },
    )).toBe(true);
  });

  it("rejects the legacy full unique lead index as a compatible replacement", () => {
    expect(hasCompatibleIndex(
      [{
        name: "lead_id_1_sequence_1",
        key: { lead_id: 1, sequence: 1 },
        unique: true,
      }],
      {
        name: "lead_sequence_partial_unique",
        key: { lead_id: 1, sequence: 1 },
        unique: true,
        partialFilterExpression: { lead_id: { $type: "objectId" } },
      },
    )).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { leadCheckoutMigrationOperations } from "./leadCheckoutMigration.js";

describe("lead checkout migration", () => {
  it("preserves legacy bKash transaction IDs under an explicit audit field", () => {
    const operations = leadCheckoutMigrationOperations();
    const serialized = JSON.stringify(operations);

    expect(serialized).toContain("legacy_bkash_txn_id");
    expect(serialized).toContain("$rename");
    expect(serialized).not.toContain('$unset":{"status":"","bkash_txn_id":""}');
  });
});

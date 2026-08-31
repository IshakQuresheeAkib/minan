import { beforeEach, describe, expect, it, vi } from "vitest";

const { bulkWriteMock, connectDBMock, findMock, toArrayMock } = vi.hoisted(() => ({
  bulkWriteMock: vi.fn(),
  connectDBMock: vi.fn(),
  findMock: vi.fn(),
  toArrayMock: vi.fn(),
}));

vi.mock("../config/db.js", () => ({
  connectDB: connectDBMock,
  disconnectDB: vi.fn(),
}));

vi.mock("../models/Order.js", () => ({
  Order: {
    collection: {
      bulkWrite: bulkWriteMock,
      find: findMock,
    },
  },
}));

import { migrateOrderTracking } from "./migrate-order-tracking.js";

describe("Order tracking migration runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectDBMock.mockResolvedValue(undefined);
    findMock.mockReturnValue({ toArray: toArrayMock });
    toArrayMock.mockResolvedValue([{
      _id: "order-1",
      email: "Customer@Example.COM",
    }]);
    bulkWriteMock.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  });

  it("is dry-run by default and performs no writes", async () => {
    const summary = await migrateOrderTracking(false);

    expect(summary).toEqual({ planned: 1, unresolved: 0, modified: 0 });
    expect(bulkWriteMock).not.toHaveBeenCalled();
  });

  it("uses compare-and-set filters when applying planned changes", async () => {
    const summary = await migrateOrderTracking(true);

    expect(bulkWriteMock).toHaveBeenCalledWith([{
      updateOne: {
        filter: {
          _id: "order-1",
          email: "Customer@Example.COM",
          normalized_email: { $exists: false },
          guest_access_version: { $exists: false },
        },
        update: {
          $set: {
            normalized_email: "customer@example.com",
            guest_access_version: 1,
          },
        },
      },
    }], { ordered: false });
    expect(summary).toEqual({ planned: 1, unresolved: 0, modified: 1 });
  });

  it("fails apply mode when a source Order changes after planning", async () => {
    bulkWriteMock.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

    await expect(migrateOrderTracking(true)).rejects.toThrow(
      "Order tracking migration detected 1 concurrent change; re-run the dry run",
    );
  });

  it("reports through an injected logger", async () => {
    const logger = { log: vi.fn(), error: vi.fn() };

    await migrateOrderTracking(false, logger);

    expect(logger.log).toHaveBeenCalledWith(
      "DRY RUN: 1 Orders to backfill, 0 unresolved.",
    );
  });
});

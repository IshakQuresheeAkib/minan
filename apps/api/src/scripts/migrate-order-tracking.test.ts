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
  });

  it("is dry-run by default and performs no writes", async () => {
    const summary = await migrateOrderTracking(false);

    expect(summary).toEqual({ planned: 1, unresolved: 0, modified: 0 });
    expect(bulkWriteMock).not.toHaveBeenCalled();
  });
});

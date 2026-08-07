import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  connectDBMock,
  createIndexMock,
  disconnectDBMock,
  dropIndexMock,
  indexesMock,
} = vi.hoisted(() => ({
  connectDBMock: vi.fn(),
  createIndexMock: vi.fn(),
  disconnectDBMock: vi.fn(),
  dropIndexMock: vi.fn(),
  indexesMock: vi.fn(),
}));

vi.mock("../config/db.js", () => ({
  connectDB: connectDBMock,
  disconnectDB: disconnectDBMock,
}));

vi.mock("../models/PaymentAttempt.js", () => ({
  PaymentAttempt: {
    collection: {
      createIndex: createIndexMock,
      dropIndex: dropIndexMock,
      indexes: indexesMock,
    },
  },
}));

import { hasCompatibleIndex, prepare } from "./prepare-order-expansion.js";

type TestIndex = {
  name?: string;
  key: Record<string, unknown>;
  unique?: boolean;
  partialFilterExpression?: Record<string, unknown>;
};

describe("payment attempt Order-index expansion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectDBMock.mockResolvedValue(undefined);
  });

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

  it("replaces the legacy full index with all required partial indexes", async () => {
    let currentIndexes: TestIndex[] = [{
      name: "lead_id_1_sequence_1",
      key: { lead_id: 1, sequence: 1 },
      unique: true,
    }];
    indexesMock.mockImplementation(async () => currentIndexes.map((index) => ({ ...index })));
    dropIndexMock.mockImplementation(async (name: string) => {
      currentIndexes = currentIndexes.filter((index) => index.name !== name);
    });
    createIndexMock.mockImplementation(async (
      key: Record<string, 1>,
      options: Omit<TestIndex, "key">,
    ) => {
      currentIndexes.push({ key, ...options });
      return options.name;
    });

    await prepare(true);

    expect(dropIndexMock).toHaveBeenCalledWith("lead_id_1_sequence_1");
    expect(createIndexMock).toHaveBeenCalledTimes(3);
    expect(currentIndexes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "lead_sequence_partial_unique" }),
      expect.objectContaining({ name: "order_sequence_partial_unique" }),
      expect.objectContaining({ name: "order_relationship_partial" }),
    ]));
  });
});

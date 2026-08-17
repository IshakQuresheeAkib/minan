import { beforeEach, describe, expect, it, vi } from "vitest";

const { connectDBMock, countDocumentsMock, updateManyMock } = vi.hoisted(() => ({
  connectDBMock: vi.fn(),
  countDocumentsMock: vi.fn(),
  updateManyMock: vi.fn(),
}));

vi.mock("../config/db.js", () => ({
  connectDB: connectDBMock,
  disconnectDB: vi.fn(),
}));

vi.mock("../models/AdminUser.js", () => ({
  AdminUser: {
    collection: {
      countDocuments: countDocumentsMock,
      updateMany: updateManyMock,
    },
  },
}));

import { cleanupInactiveAdminSessions } from "./cleanup-inactive-admin-sessions.js";

describe("inactive admin session cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    connectDBMock.mockResolvedValue(undefined);
    countDocumentsMock.mockResolvedValue(2);
    updateManyMock.mockResolvedValue({ modifiedCount: 2 });
  });

  it("increments the version and clears credentials for risky inactive admins", async () => {
    await cleanupInactiveAdminSessions(true);

    const filter = {
      is_active: false,
      $or: [
        { session_version: { $exists: false } },
        { session_version: 0 },
        { refresh_token_hash: { $type: "string" } },
        { previous_refresh_token_hash: { $type: "string" } },
      ],
    };
    expect(countDocumentsMock).toHaveBeenCalledWith(filter);
    expect(updateManyMock).toHaveBeenCalledWith(filter, {
      $set: {
        refresh_token_hash: null,
        previous_refresh_token_hash: null,
      },
      $inc: { session_version: 1 },
    });
  });

  it("leaves records unchanged during the default dry run", async () => {
    await cleanupInactiveAdminSessions(false);

    expect(countDocumentsMock).toHaveBeenCalledOnce();
    expect(updateManyMock).not.toHaveBeenCalled();
  });
});

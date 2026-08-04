import { beforeEach, describe, expect, it, vi } from "vitest";

import { Lead } from "../models/Lead.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import { listAdminLeads } from "./adminLeads.service.js";

describe("admin lead payment expiry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("expires both active payment states", async () => {
    const updateMany = vi.spyOn(PaymentAttempt, "updateMany").mockResolvedValue({} as never);
    vi.spyOn(Lead, "find").mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    } as never);
    vi.spyOn(Lead, "countDocuments").mockResolvedValue(0);
    vi.spyOn(PaymentAttempt, "find").mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    } as never);

    await listAdminLeads({ page: 1, limit: 20, skip: 0 });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: ["initiated", "verification_pending"] },
      }),
      expect.any(Object),
    );
  });
});

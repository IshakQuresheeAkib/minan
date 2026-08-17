import { describe, expect, it } from "vitest";

import {
  COD_STATUS_GUIDE,
  COD_STATUS_ORDER,
  FEE_STATUS_GUIDE,
  FEE_STATUS_ORDER,
  workflowStatusFilters,
  WORKFLOW_STATUS_GUIDE,
  WORKFLOW_STATUS_ORDER,
} from "./orderStatusGuide";

describe("order status guide", () => {
  it("covers every supported status in its intended order without Packing", () => {
    expect(WORKFLOW_STATUS_ORDER).toEqual(["new", "confirmed", "processing", "shipped", "delivered", "on_hold", "cancelled", "returned", "exchanged"]);
    expect(FEE_STATUS_ORDER).toEqual(["awaiting", "processing", "paid", "failed", "verification_pending", "expired", "not_required"]);
    expect(COD_STATUS_ORDER).toEqual(["due", "collected", "partially_refunded", "refunded", "not_required"]);
    expect(WORKFLOW_STATUS_ORDER).not.toContain("packing");
  });

  it("provides Bangla meaning and an admin action for every guide entry", () => {
    for (const guide of [WORKFLOW_STATUS_GUIDE, FEE_STATUS_GUIDE, COD_STATUS_GUIDE]) {
      for (const entry of Object.values(guide)) {
        expect(entry.label).not.toBe("");
        expect(entry.meaning).toMatch(/[\u0980-\u09FF]/);
        expect(entry.action).toMatch(/[\u0980-\u09FF]/);
      }
    }
  });

  it("keeps filter options derived from the workflow guide", () => {
    expect(workflowStatusFilters[0]).toEqual({ value: "", label: "All workflows" });
    expect(workflowStatusFilters.slice(1).map((option) => option.label)).toEqual(WORKFLOW_STATUS_ORDER.map((status) => WORKFLOW_STATUS_GUIDE[status].label));
  });
});

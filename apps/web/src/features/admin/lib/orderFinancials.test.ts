import { describe, expect, it } from "vitest";

import { getOutstandingCod } from "./orderFinancials";

describe("getOutstandingCod", () => {
  it("treats waived COD as zero while preserving ordinary outstanding balances", () => {
    expect(getOutstandingCod({ cod_due: 1_200, cod_collected: 0 }, "waived")).toBe(0);
    expect(getOutstandingCod({ cod_due: 1_200, cod_collected: 500 }, "due")).toBe(700);
  });
});

import { describe, expect, it } from "vitest";

import { getOutstandingCod } from "./orderFinancials";

describe("getOutstandingCod", () => {
  it("returns the uncollected COD balance without going below zero", () => {
    expect(getOutstandingCod({ cod_due: 1_200, cod_collected: 500 })).toBe(700);
    expect(getOutstandingCod({ cod_due: 1_200, cod_collected: 1_300 })).toBe(0);
  });
});

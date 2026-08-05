import { describe, expect, it } from "vitest";

import { escapeCsvCell } from "./adminOrders.service.js";

describe("Order CSV security", () => {
  it("quotes embedded delimiters and neutralizes spreadsheet formulas", () => {
    expect(escapeCsvCell('Shirt, "Black"')).toBe('"Shirt, ""Black"""');
    expect(escapeCsvCell("=HYPERLINK(\"https://bad.example\")")).toBe('"\'=HYPERLINK(""https://bad.example"")"');
    expect(escapeCsvCell("+8801700000000")).toBe('"\'+8801700000000"');
  });
});

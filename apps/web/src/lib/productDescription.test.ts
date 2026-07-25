import { describe, expect, it } from "vitest";

import { plainTextToRichDescription } from "./productDescription";

describe("plainTextToRichDescription", () => {
  it("keeps legacy text lines as separate blocks for list formatting", () => {
    expect(plainTextToRichDescription("First line\nSecond line")).toBe(
      "<p>First line</p><p>Second line</p>",
    );
  });

  it("preserves blank lines without creating an empty description", () => {
    expect(plainTextToRichDescription("First line\n\nThird line")).toBe(
      "<p>First line</p><p><br></p><p>Third line</p>",
    );
  });

  it("escapes HTML before creating paragraph blocks", () => {
    expect(plainTextToRichDescription("<strong>Safe</strong>")).toBe(
      "<p>&lt;strong&gt;Safe&lt;/strong&gt;</p>",
    );
  });
});

import { describe, expect, it } from "vitest";

import { AppError } from "../lib/errors.js";
import {
  normalizeProductDescription,
  richDescriptionToPlainText,
  sanitizeProductDescriptionHtml,
} from "./productDescription.js";

describe("product description normalization", () => {
  it("preserves the supported document structure", () => {
    const html = [
      "<p>Soft <strong>cotton</strong> with <em>fine stitching</em>.</p>",
      "<ul><li>Breathable</li><li>Easy care</li></ul>",
      "<ol><li>Choose a size</li><li>Add to cart</li></ol>",
    ].join("");

    expect(sanitizeProductDescriptionHtml(html)).toBe(html);
    expect(richDescriptionToPlainText(html)).toBe(
      "Soft cotton with fine stitching.\n\nBreathable\nEasy care\n\nChoose a size\nAdd to cart",
    );
  });

  it("decodes entities while preserving Unicode text", () => {
    const normalized = normalizeProductDescription({
      description_html:
        "<p>&lt;script&gt; &amp; বাংলা 👩‍👩‍👧‍👦</p>",
    });

    expect(normalized.description).toBe(
      "<script> & বাংলা 👩‍👩‍👧‍👦",
    );
    expect(normalized.description_html).toBe(
      "<p>&lt;script&gt; &amp; বাংলা 👩‍👩‍👧‍👦</p>",
    );
  });

  it("removes scripts, event attributes, links, and non-text containers", () => {
    const sanitized = sanitizeProductDescriptionHtml(
      '<script>alert(1)</script><p onclick="evil()">Safe <a href="javascript:evil()">link</a></p><textarea>hidden</textarea>',
    );

    expect(sanitized).toBe("<p>Safe link</p>");
  });

  it("treats empty editor documents and zero-width content as empty", () => {
    expect(sanitizeProductDescriptionHtml("<p><br></p>")).toBeNull();
    expect(sanitizeProductDescriptionHtml("<p>&nbsp;</p>")).toBeNull();
    expect(sanitizeProductDescriptionHtml("<p>\u200b\u200d</p>")).toBeNull();
  });

  it("uses rich HTML as the authority when both formats are supplied", () => {
    expect(
      normalizeProductDescription({
        description: "Stale text",
        description_html: "<p>Current <strong>text</strong></p>",
      }),
    ).toEqual({
      description: "Current text",
      description_html: "<p>Current <strong>text</strong></p>",
    });
  });

  it("keeps legacy plain text and clears rich HTML", () => {
    expect(
      normalizeProductDescription({
        description: "First line\r\nSecond line",
      }),
    ).toEqual({
      description: "First line\r\nSecond line",
      description_html: null,
    });
  });

  it("rejects rich content without visible text", () => {
    expect(() =>
      normalizeProductDescription({ description_html: "<p><br></p>" }),
    ).toThrow(AppError);
  });
});

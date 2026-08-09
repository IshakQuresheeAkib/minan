import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonLd } from "@/components/seo/JsonLd";

describe("JsonLd", () => {
  it("escapes markup that could terminate the JSON-LD script", () => {
    const markup = renderToStaticMarkup(
      <JsonLd
        data={{
          "@context": "https://schema.org",
          name: "</script><script>alert('xss')</script>",
        }}
      />,
    );

    expect(markup).not.toContain("</script><script>");
    expect(markup).toContain("\\u003c/script>\\u003cscript>");
  });
});

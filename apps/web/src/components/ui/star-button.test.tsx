import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StarButton } from "@/components/ui/star-button";

describe("StarButton", () => {
  it("renders the reference star mask and motion-path light layer", () => {
    const markup = renderToStaticMarkup(<StarButton>View product</StarButton>);

    expect(markup).toContain('data-slot="star-button-light"');
    expect(markup).toContain("offset-path:var(--path)");
    expect(markup).toContain("animate-star-btn");
    expect(markup).toContain('fill-rule="evenodd"');
    expect(markup).toContain("M56.1 3.96");
    expect(markup).not.toContain("<circle");
  });
});

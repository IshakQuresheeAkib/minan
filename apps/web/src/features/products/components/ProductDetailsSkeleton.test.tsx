import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductDetailsSkeleton } from "./ProductDetailsSkeleton";

describe("ProductDetailsSkeleton", () => {
  it("reserves the mobile breadcrumb height while product details load", () => {
    const markup = renderToStaticMarkup(<ProductDetailsSkeleton />);

    expect(markup).toMatch(
      /class="[^"]*\bmb-4\b[^"]*\bh-11\b[^"]*\bw-3\/4\b[^"]*\blg:h-4\b[^"]*\blg:w-56\b[^"]*"/,
    );
  });
});

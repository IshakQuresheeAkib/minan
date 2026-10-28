import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CurrentYear } from "./CurrentYear";

describe("CurrentYear", () => {
  it("renders the current full year dynamically", () => {
    const markup = renderToStaticMarkup(<CurrentYear />);
    expect(markup).toContain(String(new Date().getFullYear()));
  });
});

import { describe, expect, it } from "vitest";

import { getActivePrimaryNavItemId } from "@/constants/nav-items";

describe("getActivePrimaryNavItemId", () => {
  it.each([
    "/products",
    "/products/linen-shirt",
    "/collections/t-shirts",
  ])("keeps Explore active for %s", (pathname) => {
    expect(getActivePrimaryNavItemId(pathname)).toBe("products");
  });

  it("does not treat unrelated routes as Explore", () => {
    expect(getActivePrimaryNavItemId("/orders")).toBeUndefined();
  });
});

import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

import { NavPill } from "@/components/shared/NavPill";

describe("NavPill", () => {
  it("presents the active desktop route in the horizontal limelight navigation", () => {
    const markup = renderToStaticMarkup(<NavPill />);

    expect(markup).toContain('data-limelight-active-id="products"');
    expect(markup).toContain('href="/products"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("flex-row");
  });
});

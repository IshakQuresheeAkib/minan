import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/shared/NavPill", () => ({
  NavPill: () => <nav aria-label="Main navigation" />,
}));

vi.mock("@/components/shared/SearchBar", () => ({
  SearchBar: () => <div role="search" />,
}));

vi.mock("@/components/shared/NavbarActions", () => ({
  NavbarActions: () => <div>NavbarActions</div>,
}));

vi.mock("@/components/layouts/SpeculationRules", () => ({
  SpeculationRules: () => null,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

import { PublicChrome } from "@/components/layouts/PublicChrome";

describe("PublicChrome", () => {
  it("renders Navbar and Footer directly in the shell without deferring to null", () => {
    const markup = renderToStaticMarkup(
      <PublicChrome>
        <div id="page-skeleton">Loading skeleton...</div>
      </PublicChrome>,
    );

    expect(markup).toContain("<header");
    expect(markup).toContain("<footer");
    expect(markup).toContain('id="page-skeleton"');

    const headerIndex = markup.indexOf("<header");
    const mainIndex = markup.indexOf('id="main-content"');
    const skeletonIndex = markup.indexOf('id="page-skeleton"');
    const footerIndex = markup.indexOf("<footer");

    expect(headerIndex).toBeGreaterThanOrEqual(0);
    expect(mainIndex).toBeGreaterThan(headerIndex);
    expect(skeletonIndex).toBeGreaterThan(mainIndex);
    expect(footerIndex).toBeGreaterThan(skeletonIndex);
  });
});

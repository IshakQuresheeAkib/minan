import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: () => null,
}));

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

vi.mock("@/components/shared/NavPill", () => ({
  NavPill: () => <nav aria-label="Main navigation" />,
}));

vi.mock("@/features/home/components/SearchBar", () => ({
  SearchBar: () => <div role="search" />,
}));

import { Navbar } from "@/components/shared/navbar";

describe("Navbar", () => {
  it("aligns primary navigation with the lg bottom-navigation cutoff", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain("lg:grid-cols-[auto_minmax(360px,1fr)_300px_auto]");
    expect(markup).toContain("lg:flex");
    expect(markup).not.toContain("xl:grid-cols-");
  });

  it("places stores and profile actions after search in source order", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    const searchIndex = markup.indexOf('role="search"');
    const storesIndex = markup.indexOf('aria-label="Stores — coming soon"');
    const profileIndex = markup.indexOf('aria-label="Open profile menu"');

    expect(searchIndex).toBeGreaterThanOrEqual(0);
    expect(storesIndex).toBeGreaterThanOrEqual(0);
    expect(profileIndex).toBeGreaterThanOrEqual(0);
    expect(searchIndex).toBeLessThan(storesIndex);
    expect(storesIndex).toBeLessThan(profileIndex);
  });

  it("keeps unfinished stores and signup actions visibly unavailable", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('aria-label="Stores — coming soon"');
    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-label="Create account — coming soon"');
    expect(markup).toContain('aria-disabled="true"');
  });

  it("links the profile menu to customer login and order tracking", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('href="/account/login"');
    expect(markup).toContain('href="/orders"');
    expect(markup).not.toContain(">Track Orders</a>");
  });

  it("renders profile overlays above page-level search and hero content", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain('style="z-index:var(--z-dropdown, 200);');
  });

  it("keeps its mobile controls in one grid row", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain("grid-cols-[auto_minmax(0,1fr)_auto]");
    expect(markup).not.toContain("row-start-2");
  });
});

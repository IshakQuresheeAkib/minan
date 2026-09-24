import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...props
  }: React.PropsWithChildren<{ href: string; prefetch?: boolean }>) => (
    <a
      href={href}
      data-prefetch={prefetch === false ? "disabled" : "default"}
      {...props}
    >
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

    expect(markup).toContain("lg:grid-cols-[auto_1fr_auto_auto]");
    expect(markup).toContain("lg:flex");
    expect(markup).not.toContain("xl:grid-cols-");
  });

  it("places the store location and profile actions after search in source order", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    const searchIndex = markup.indexOf('role="search"');
    const storesIndex = markup.indexOf(
      'aria-label="Open MINAN location in Google Maps"',
    );
    const profileIndex = markup.indexOf('aria-label="Open profile menu"');

    expect(searchIndex).toBeGreaterThanOrEqual(0);
    expect(storesIndex).toBeGreaterThanOrEqual(0);
    expect(profileIndex).toBeGreaterThanOrEqual(0);
    expect(searchIndex).toBeLessThan(storesIndex);
    expect(storesIndex).toBeLessThan(profileIndex);
  });

  it("links the store location to Google Maps and keeps signup unavailable", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain(
      'href="https://maps.app.goo.gl/zDvr35GASHBCFAuQ9"',
    );
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
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

  it("does not prefetch the homepage from the persistent logo link", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain(
      '<a href="/" data-prefetch="disabled" aria-label="MINAN — go to homepage"',
    );
  });
});

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

  it("places search before Track Orders in desktop source order", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    const searchIndex = markup.indexOf('role="search"');
    const trackingIndex = markup.indexOf(">Track Orders</a>");

    expect(searchIndex).toBeGreaterThanOrEqual(0);
    expect(trackingIndex).toBeGreaterThanOrEqual(0);
    expect(searchIndex).toBeLessThan(trackingIndex);
  });

  it("keeps its mobile controls in one grid row", () => {
    const markup = renderToStaticMarkup(<Navbar />);

    expect(markup).toContain("grid-cols-[auto_minmax(0,1fr)_auto]");
    expect(markup).not.toContain("row-start-2");
  });
});

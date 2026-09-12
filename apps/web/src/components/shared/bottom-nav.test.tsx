import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

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

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

import { BottomNav } from "@/components/shared/bottom-nav";

describe("BottomNav", () => {
  it("anchors the limelight to the current route", () => {
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).toContain('data-limelight-active-id="products"');
    expect(markup).toContain('href="/products"');
    expect(markup).toContain('aria-current="page"');
  });

  it("does not translate the limelight after calculating its left edge", () => {
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).not.toContain("-translate-x-1/2 rounded-b-full bg-primary");
  });

  it("disables automatic prefetching for every fixed mobile navigation link", () => {
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup.match(/data-prefetch="disabled"/g)).toHaveLength(4);
    expect(markup).not.toContain('data-prefetch="default"');
  });
});

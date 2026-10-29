import { renderToStaticMarkup } from "react-dom/server";

import { describe, expect, it, vi } from "vitest";

const currentPathname = vi.hoisted(() => ({ value: "/products" }));

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
  usePathname: () => currentPathname.value,
}));

import { BottomNav } from "@/components/shared/bottom-nav";

describe("BottomNav", () => {
  it("anchors the limelight to the current route", () => {
    currentPathname.value = "/products";
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).toContain('data-limelight-active-id="products"');
    expect(markup).toContain('href="/products"');
    expect(markup).toContain('aria-current="page"');
  });

  it("does not translate the limelight after calculating its left edge", () => {
    currentPathname.value = "/products";
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).not.toContain("-translate-x-1/2 rounded-b-full bg-primary");
  });

  it("disables automatic prefetching for every fixed mobile navigation link", () => {
    currentPathname.value = "/products";
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup.match(/data-prefetch="disabled"/g)).toHaveLength(4);
    expect(markup).not.toContain('data-prefetch="default"');
  });

  it("hides itself on product detail routes to prevent collision with mobile sticky CTA", () => {
    currentPathname.value = "/products/mens-casual-shirt";
    const markup = renderToStaticMarkup(<BottomNav />);

    expect(markup).toBe("");
  });
});

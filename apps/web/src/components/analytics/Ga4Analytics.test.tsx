import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationState = vi.hoisted(() => ({
  pathname: "/",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

vi.mock("next/script", () => ({
  default: ({
    id,
    src,
    dangerouslySetInnerHTML,
  }: {
    id?: string;
    src?: string;
    dangerouslySetInnerHTML?: { __html: string };
  }) => (
    <script
      id={id}
      src={src}
      async
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    />
  ),
}));

import { env } from "@/config/env";
import { Ga4Analytics } from "./Ga4Analytics";

describe("Ga4Analytics", () => {
  const originalGa4Id = env.ga4Id;

  beforeEach(() => {
    Object.assign(env, { ga4Id: "G-VALIDTEST123" });
    navigationState.pathname = "/";
  });

  afterEach(() => {
    Object.assign(env, { ga4Id: originalGa4Id });
    vi.unstubAllGlobals();
  });

  it("configures one initial page view with a query-free location", () => {
    navigationState.pathname = "/products";
    const markup = renderToStaticMarkup(<Ga4Analytics />);

    expect(markup).toContain("googletagmanager.com/gtag/js?id=G-VALIDTEST123");
    expect(markup).toContain("page_location: window.location.origin + window.location.pathname");
    expect(markup).not.toContain("send_page_view: false");
    expect(markup).not.toContain("gtag('event', 'page_view'");
  });

  it.each([
    "/payment",
    "/payment/result",
    "/account",
    "/account/orders",
    "/account/orders/MN-1234",
    "/admin",
    "/admin/login",
    "/admin/orders",
  ])("renders nothing on excluded route: %s", (path) => {
    navigationState.pathname = path;
    const markup = renderToStaticMarkup(<Ga4Analytics />);

    expect(markup).toBe("");
  });

  it("renders nothing when GA4 ID is not configured or invalid", () => {
    Object.assign(env, { ga4Id: "" });
    navigationState.pathname = "/products";
    const markup = renderToStaticMarkup(<Ga4Analytics />);

    expect(markup).toBe("");
  });
});

import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("configures crawl rules, blocking private routes and enabling AI search bots", () => {
    const config = robots();

    expect(config.host).toBeDefined();
    expect(config.sitemap).toContain("/sitemap.xml");

    expect(Array.isArray(config.rules)).toBe(true);
    const rules = config.rules as Array<{
      userAgent: string | string[];
      allow?: string | string[];
      disallow?: string | string[];
    }>;

    // Default crawler rule
    const defaultRule = rules.find((r) => r.userAgent === "*");
    expect(defaultRule).toBeDefined();
    expect(defaultRule?.allow).toBe("/");
    expect(defaultRule?.disallow).toContain("/api/");
    expect(defaultRule?.disallow).toContain("/admin/");
    expect(defaultRule?.disallow).toContain("/checkout/");
    expect(defaultRule?.disallow).toContain("/payment/");
    expect(defaultRule?.disallow).toContain("/account/");
    expect(defaultRule?.disallow).toContain("/orders?*");

    // AI Bots rule (RFC 9309 §2.2.1: explicit groups do not fall back to `*`, so protected routes and order lookup queries must be explicitly disallowed)
    const aiRule = rules.find(
      (r) => Array.isArray(r.userAgent) && r.userAgent.includes("GPTBot"),
    );
    expect(aiRule).toBeDefined();
    expect(aiRule?.allow).toContain("/llms.txt");
    expect(aiRule?.disallow).toContain("/api/");
    expect(aiRule?.disallow).toContain("/admin/");
    expect(aiRule?.disallow).toContain("/checkout/");
    expect(aiRule?.disallow).toContain("/payment/");
    expect(aiRule?.disallow).toContain("/account/");
    expect(aiRule?.disallow).toContain("/orders?*");
  });
});

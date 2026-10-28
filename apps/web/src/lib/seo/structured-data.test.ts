import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site.config";
import {
  brandFaqs,
  getHomeStructuredData,
  serializeJsonLd,
} from "./structured-data";

describe("structured-data", () => {
  it("generates complete Schema.org knowledge graph for the homepage", () => {
    const data = getHomeStructuredData();
    expect(data["@context"]).toBe("https://schema.org");
    expect(Array.isArray(data["@graph"])).toBe(true);

    const graph = data["@graph"] as Array<Record<string, unknown>>;

    // Organization entity verification
    const org = graph.find((item) => item["@type"] === "Organization");
    expect(org).toBeDefined();
    expect(org?.name).toBe("MINAN");
    expect(org?.legalName).toBe("MINAN Clothing");
    expect(org?.telephone).toBe(siteConfig.contact.phone);
    expect(org?.sameAs).toContain(siteConfig.socials.facebook);
    expect(org?.sameAs).toContain(siteConfig.socials.instagram);
    expect(org?.sameAs).toContain(siteConfig.socials.tiktok);

    // Address verification
    const address = org?.address as Record<string, unknown>;
    expect(address?.addressLocality).toBe("Sylhet");
    expect(address?.postalCode).toBe("3100");
    expect(address?.addressCountry).toBe("BD");

    // Brand entity verification
    const brand = graph.find((item) => item["@type"] === "Brand");
    expect(brand).toBeDefined();
    expect(brand?.name).toBe("MINAN");

    // WebSite with SearchAction verification
    const website = graph.find((item) => item["@type"] === "WebSite");
    expect(website).toBeDefined();
    expect(website?.potentialAction).toHaveProperty("@type", "SearchAction");

    // FAQPage schema verification
    const faqPage = graph.find((item) => item["@type"] === "FAQPage");
    expect(faqPage).toBeDefined();
    const mainEntity = faqPage?.mainEntity as Array<Record<string, unknown>>;
    expect(mainEntity).toHaveLength(brandFaqs.length);
    expect(mainEntity[0]?.name).toBe("What is MINAN?");
  });

  it("escapes script injection attacks when serialized", () => {
    const serialized = serializeJsonLd({
      "@context": "https://schema.org",
      test: "</script><script>alert('xss')</script>",
    });

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
  });
});

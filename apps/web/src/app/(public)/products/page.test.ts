import { describe, expect, it } from "vitest";

import { generateMetadata } from "./page";

describe("products metadata", () => {
  it("defines route-specific Open Graph and Twitter sharing metadata", async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({}),
    });

    expect(metadata.openGraph).toMatchObject({
      url: "/products",
      images: [
        expect.objectContaining({
          url: "/hero/limited-offer.webp",
          alt: expect.stringContaining("MINAN"),
        }),
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/hero/limited-offer.webp"],
    });
  });
});

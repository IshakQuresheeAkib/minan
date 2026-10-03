import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ResponsiveBannerImage } from "./ResponsiveBannerImage";

describe("ResponsiveBannerImage", () => {
  it("renders the stored image description on the responsive image", () => {
    const markup = renderToStaticMarkup(
      <ResponsiveBannerImage
        alt="Two models wearing maroon embroidered MINAN panjabi"
        desktopSrc="/hero/desktop-fallback.webp"
        mobileSrc="/hero/mobile-fallback.webp"
      />,
    );

    expect(markup).toContain(
      'alt="Two models wearing maroon embroidered MINAN panjabi"',
    );
  });
});

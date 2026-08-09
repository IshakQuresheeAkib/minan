import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ResponsiveBannerImage } from "./ResponsiveBannerImage";

describe("ResponsiveBannerImage", () => {
  it("renders the stored image description on the responsive image", () => {
    const markup = renderToStaticMarkup(
      <ResponsiveBannerImage
        alt="Two models wearing maroon embroidered MINAN panjabi"
        desktopSrc="/hero/limited-offer.webp"
        mobileSrc="/hero/new-arrivals.jpg"
      />,
    );

    expect(markup).toContain(
      'alt="Two models wearing maroon embroidered MINAN panjabi"',
    );
  });
});

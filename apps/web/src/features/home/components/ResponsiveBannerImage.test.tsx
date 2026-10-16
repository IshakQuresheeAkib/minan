import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { preloadMock } = vi.hoisted(() => ({
  preloadMock: vi.fn(),
}));

vi.mock("react-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-dom")>()),
  preload: preloadMock,
}));

import {
  ResponsiveBannerImage,
  getResponsiveBannerImageProps,
  preloadResponsiveBannerImage,
} from "./ResponsiveBannerImage";

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

  it("generates consistent props and preloads both desktop and mobile image sources", () => {
    preloadMock.mockClear();

    const bannerSources = {
      alt: "Seasonal campaign banner",
      desktopSrc: "/hero/desktop-fallback.webp",
      mobileSrc: "/hero/mobile-fallback.webp",
    };

    const { desktop, mobile } = getResponsiveBannerImageProps(bannerSources);
    expect(desktop.props.src).toBeDefined();
    expect(mobile.props.src).toBeDefined();

    preloadResponsiveBannerImage(bannerSources);

    expect(preloadMock).toHaveBeenCalledTimes(2);
    expect(preloadMock).toHaveBeenCalledWith(
      desktop.props.src,
      expect.objectContaining({
        as: "image",
        fetchPriority: "high",
        imageSizes: "100vw",
        media: "(min-width: 768px)",
      }),
    );
    expect(preloadMock).toHaveBeenCalledWith(
      mobile.props.src,
      expect.objectContaining({
        as: "image",
        fetchPriority: "high",
        imageSizes: "100vw",
        media: "(max-width: 767px)",
      }),
    );
  });
});


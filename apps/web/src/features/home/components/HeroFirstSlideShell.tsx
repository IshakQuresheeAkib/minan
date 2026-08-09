import { Navbar } from "@/components/shared/navbar";
import { ResponsiveBannerImage } from "@/features/home/components/ResponsiveBannerImage";
import { fallbackHomeBanners } from "@/features/home/data/home-banners";
import { HERO_ACCESSIBLE_HEADING } from "@/features/home/hero-copy";

export function HeroFirstSlideShell() {
  const firstBanner = fallbackHomeBanners[0];

  if (!firstBanner) {
    return <Navbar />;
  }

  return (
    <section
      aria-busy="true"
      aria-label="Loading homepage promotions"
      className="relative overflow-hidden"
    >
      <Navbar />
      <div className="relative h-[min(600px,calc(100svh-5rem))] min-h-[540px] w-full overflow-hidden sm:min-h-[600px] lg:h-[90svh] lg:min-h-[640px]">
        <ResponsiveBannerImage
          alt={firstBanner.alt_text}
          desktopSrc={firstBanner.desktop_image_url}
          mobileSrc={firstBanner.mobile_image_url}
          eager
        />
        <h2 className="sr-only">{HERO_ACCESSIBLE_HEADING}</h2>
      </div>
    </section>
  );
}

import { getImageProps } from "next/image";
import Image from "next/image";

type ResponsiveBannerImageProps = {
  alt: string;
  desktopSrc: string;
  mobileSrc: string;
  eager?: boolean;
};

export function ResponsiveBannerImage({
  alt,
  desktopSrc,
  mobileSrc,
  eager = false,
}: ResponsiveBannerImageProps) {
  const desktop = getImageProps({
    src: desktopSrc,
    alt,
    width: 1920,
    height: 1080,
    sizes: "100vw",
  });

  return (
    <picture className="absolute inset-0 block">
      <source
        media="(min-width: 768px)"
        srcSet={desktop.props.srcSet}
        sizes="100vw"
      />
      <Image
        src={mobileSrc}
        alt={alt}
        fill
        sizes="100vw"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        className="object-cover"
        draggable={false}
      />
    </picture>
  );
}

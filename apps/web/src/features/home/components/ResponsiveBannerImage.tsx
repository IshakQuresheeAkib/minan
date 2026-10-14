import { getImageProps } from "next/image";
import Image from "next/image";
import { preload } from "react-dom";

export type ResponsiveBannerImageSourceProps = {
  alt: string;
  desktopSrc: string;
  mobileSrc: string;
};

export function getResponsiveBannerImageProps({
  alt,
  desktopSrc,
  mobileSrc,
}: ResponsiveBannerImageSourceProps) {
  const desktop = getImageProps({
    src: desktopSrc,
    alt,
    width: 1920,
    height: 1080,
    sizes: "100vw",
  });

  const mobile = getImageProps({
    src: mobileSrc,
    alt,
    fill: true,
    sizes: "100vw",
  });

  return { desktop, mobile };
}

export function preloadResponsiveBannerImage(
  sources: ResponsiveBannerImageSourceProps,
) {
  const { desktop, mobile } = getResponsiveBannerImageProps(sources);

  preload(desktop.props.src, {
    as: "image",
    fetchPriority: "high",
    imageSizes: desktop.props.sizes,
    imageSrcSet: desktop.props.srcSet,
    media: "(min-width: 768px)",
  });

  preload(mobile.props.src, {
    as: "image",
    fetchPriority: "high",
    imageSizes: mobile.props.sizes,
    imageSrcSet: mobile.props.srcSet,
    media: "(max-width: 767px)",
  });
}

type ResponsiveBannerImageProps = ResponsiveBannerImageSourceProps & {
  eager?: boolean;
};

export function ResponsiveBannerImage({
  alt,
  desktopSrc,
  mobileSrc,
  eager = false,
}: ResponsiveBannerImageProps) {
  const { desktop } = getResponsiveBannerImageProps({
    alt,
    desktopSrc,
    mobileSrc,
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


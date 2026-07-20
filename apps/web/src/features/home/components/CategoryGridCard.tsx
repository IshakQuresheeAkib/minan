import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { publicRoutes } from "@/constants/routes";
import { productCardShellClassName } from "@/features/products/components/ProductCard";

type CategoryGridCardProps = {
  imageUrl: string;
  name: string;
  slug: string;
};

export function CategoryGridCard({
  imageUrl,
  name,
  slug,
}: CategoryGridCardProps) {
  const href = `${publicRoutes.products}?category=${encodeURIComponent(slug)}`;

  return (
    <article className={productCardShellClassName}>
      <Link
        href={href}
        aria-label={`Browse ${name}`}
        className="group/category relative flex aspect-3/4 min-h-0 flex-1 cursor-pointer overflow-hidden focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-primary/60 focus-visible:outline-none"
      >
        <Image
          src={imageUrl}
          alt={`${name} category`}
          fill
          sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-500 ease-out motion-safe:group-hover/category:scale-[1.035]"
        />
        <span
          className="absolute inset-0 bg-linear-to-t from-foreground/90 via-foreground/10 to-transparent"
          aria-hidden="true"
        />
        <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-3 text-background sm:p-4">
          <span>
            <span className="mt-1 block text-lg font-bold leading-tight sm:text-xl">
              {name}
            </span>
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-foreground transition-colors duration-200 group-hover/category:bg-primary sm:size-10">
            <ArrowRight className="size-4 sm:size-5" aria-hidden="true" />
          </span>
        </span>
      </Link>
    </article>
  );
}

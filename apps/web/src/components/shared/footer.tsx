import { Suspense } from "react";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import { FacebookPagePlugin } from "@/components/shared/FacebookPagePlugin";
import { CurrentYear } from "@/components/shared/CurrentYear";
import { siteConfig } from "@/config/site.config";
import { publicRoutes } from "@/constants/routes";
import { env } from "@/config/env";

export function Footer() {
  const hasFacebookPage = Boolean(env.facebookPageUrl.trim());

  return (
    <footer className="border-t border-border/80 bg-background/95">
      <div className="mx-auto w-full max-w-7xl px-4 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] text-sm text-foreground/80 sm:px-6 lg:px-8 lg:pb-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Brand Info & Address */}
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <p className="text-xl font-bold tracking-tight text-foreground">
              {siteConfig.name}
            </p>
            <p className="text-xs leading-relaxed text-foreground/70 sm:text-sm">
              Contemporary Bangladeshi fashion house and clothing brand.
              Crafting premium everyday shirts, Panjabis, trousers, and lifestyle
              essentials.
            </p>
            <div className="space-y-1.5 pt-1 text-xs text-foreground/75">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                <span>{siteConfig.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="hover:text-primary transition-colors font-medium"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Shop &amp; Explore
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  href={publicRoutes.products}
                  className="transition-colors hover:text-primary"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href={publicRoutes.home}
                  className="transition-colors hover:text-primary"
                >
                  Featured Collections
                </Link>
              </li>
              <li>
                <Link
                  href={publicRoutes.orderTracking}
                  className="transition-colors hover:text-primary"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href={publicRoutes.cart}
                  className="transition-colors hover:text-primary"
                >
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Social */}
          <div className="space-y-3">
            <p className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Connect With Us
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href={siteConfig.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Facebook Page
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  Instagram (@minanf9)
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  TikTok (@minanclothing)
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.contact.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  WhatsApp: {siteConfig.contact.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>

          {/* Delivery & Assurance */}
          <div className="space-y-3">
            <p className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Nationwide Delivery
            </p>
            <p className="text-xs leading-relaxed text-foreground/70 sm:text-sm">
              We ship across all 64 districts in Bangladesh. Pay securely via
              bKash or choose Cash on Delivery (COD).
            </p>
            {hasFacebookPage ? (
              <div className="pt-2">
                <FacebookPagePlugin />
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-foreground/60 sm:flex sm:items-center sm:justify-between sm:text-left">
          <p>© <Suspense fallback={null}><CurrentYear /></Suspense> MINAN. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">
            Kumarpara Point, Sylhet, Bangladesh · minanclothing.com
          </p>
        </div>
      </div>
    </footer>
  );
}

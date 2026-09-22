"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { env } from "@/config/env";

declare global {
  interface Window {
    FB?: {
      XFBML?: {
        parse: (element?: Element) => void;
      };
    };
  }
}

const facebookSdkUrl =
  "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v24.0";
const minimumPluginWidth = 180;
const maximumPluginWidth = 500;

function getPluginWidth(width: number): number {
  return Math.min(
    maximumPluginWidth,
    Math.max(minimumPluginWidth, Math.floor(width)),
  );
}

export function FacebookPagePlugin() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pluginWidth, setPluginWidth] = useState<number | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const pageUrl = env.facebookPageUrl.trim();

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateWidth = (): void => {
      setPluginWidth(getPluginWidth(container.clientWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isSdkReady || !containerRef.current) {
      return;
    }

    window.FB?.XFBML?.parse(containerRef.current);
  }, [isSdkReady, pluginWidth]);

  if (!pageUrl) {
    return null;
  }

  return (
    <section
      aria-describedby="facebook-page-description"
      aria-labelledby="facebook-page-heading"
      className="grid w-full max-w-[560px] overflow-hidden rounded-xl border border-secondary/70 bg-foreground/[0.06] md:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)]"
    >
      <div className="flex min-w-0 items-center border-b border-secondary/70 px-4 py-4 sm:px-5 md:border-r md:border-b-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#0866ff] font-sans text-[2rem] leading-none font-bold text-white"
          >
            f
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="facebook-page-heading"
              className="truncate font-display text-lg font-bold tracking-[-0.03em] text-foreground"
            >
              MINAN
            </h2>
            <p
              id="facebook-page-description"
              className="mt-0.5 truncate text-sm text-foreground/60"
            >
              Fashion &amp; clothing · Sylhet
            </p>
          </div>
        </div>
        <a
          href={pageUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-3 inline-flex shrink-0 items-center justify-center rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
        >
          Follow
        </a>
      </div>

      <div className="bg-background p-2 sm:p-3 md:border-l md:border-secondary/70">
        <div ref={containerRef} className="min-h-[130px] w-full overflow-hidden rounded-md">
          <Script
            id="facebook-page-plugin-sdk"
            src={facebookSdkUrl}
            strategy="lazyOnload"
            onLoad={() => setIsSdkReady(true)}
          />
          {pluginWidth ? (
            <div
              className="fb-page"
              data-adapt-container-width="true"
              data-hide-cover="false"
              data-href={pageUrl}
              data-show-facepile="false"
              data-small-header="false"
              data-width={pluginWidth}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

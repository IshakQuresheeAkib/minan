"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const COLLAPSED_HEIGHT_REM = 10.5;

type ProductDescriptionProps = {
  description: string;
  descriptionHtml: string | null;
};

export function ProductDescription({
  description,
  descriptionHtml,
}: ProductDescriptionProps) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    let cancelled = false;

    const measure = () => {
      if (cancelled) {
        return;
      }

      const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      );
      const collapsedHeight = rootFontSize * COLLAPSED_HEIGHT_REM;
      const nextOverflows = content.scrollHeight > collapsedHeight + 1;

      setOverflows(nextOverflows);
      if (!nextOverflows) {
        setExpanded(false);
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(content);
    void document.fonts?.ready.then(measure);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [description, descriptionHtml]);

  const collapsed = overflows && !expanded;

  return (
    <div>
      <div
        id={contentId}
        className={cn("overflow-hidden", collapsed && "max-h-[10.5rem]")}
      >
        {descriptionHtml ? (
          <div
            ref={contentRef}
            className="minan-rich-text text-[15px] leading-relaxed text-foreground/80 lg:text-base"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        ) : (
          <div
            ref={contentRef}
            className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/80 [overflow-wrap:anywhere] lg:text-base"
          >
            {description}
          </div>
        )}
      </div>

      {overflows ? (
        <button
          type="button"
          aria-controls={contentId}
          aria-expanded={expanded}
          className="mt-3 cursor-pointer rounded-sm text-sm font-semibold text-foreground underline-offset-4 transition-colors duration-300 hover:text-foreground/75 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Read Less" : "Read More"}
        </button>
      ) : null}
    </div>
  );
}

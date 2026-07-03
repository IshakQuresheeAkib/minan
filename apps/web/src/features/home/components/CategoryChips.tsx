"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

import { productCategories } from "@/constants/categories";
import { cn } from "@/lib/utils";

const chips = ["All", ...productCategories] as const;

export type CategoryChip = (typeof chips)[number];

type CategoryChipsProps = {
  activeChip: CategoryChip;
  onChipChange: (chip: CategoryChip) => void;
};

export function CategoryChips({
  activeChip,
  onChipChange,
}: CategoryChipsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
    hasDragged: false,
    isDragging: false,
  });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      hasDragged: false,
      isDragging: true,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;

    if (
      !scroller ||
      !dragRef.current.isDragging ||
      dragRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    const distance = event.clientX - dragRef.current.startX;

    if (Math.abs(distance) > 4) {
      dragRef.current.hasDragged = true;
      event.preventDefault();
    }

    scroller.scrollLeft = dragRef.current.scrollLeft - distance;
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!dragRef.current.hasDragged) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragRef.current.hasDragged = false;
  }

  return (
    <section
      aria-label="Categories"
      className="mb-12 w-full min-w-0 max-w-full overflow-x-clip"
    >
      <div
        ref={scrollerRef}
        className="hide-scrollbar w-full min-w-0 max-w-full cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pb-2 touch-pan-x select-none active:cursor-grabbing [-webkit-overflow-scrolling:touch] lg:px-0"
        onClickCapture={handleClickCapture}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerEnd}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        <div className="inline-flex min-w-max gap-3">
          {chips.map((chip) => {
            const isActive = activeChip === chip;

            return (
              <button
                key={chip}
                type="button"
                onClick={() => onChipChange(chip)}
                className={cn(
                  "shrink-0 cursor-pointer whitespace-nowrap rounded-full px-6 py-2 text-sm font-semibold tracking-wide transition-colors duration-300",
                  isActive
                    ? "bg-foreground text-primary"
                    : "border border-primary text-foreground shadow-md shadow-primary/30 hover:bg-foreground hover:text-primary hover:shadow-primary/70",
                )}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

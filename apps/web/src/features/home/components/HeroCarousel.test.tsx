// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeroCarousel } from "./HeroCarousel";
import type { HomeBanner } from "@/features/home/schemas/home-banner.schema";

const mockBanners: HomeBanner[] = [
  {
    _id: "banner-1",
    desktop_image_url: "https://example.com/desktop1.jpg",
    mobile_image_url: "https://example.com/mobile1.jpg",
    alt_text: "Summer Collection",
  },
  {
    _id: "banner-2",
    desktop_image_url: "https://example.com/desktop2.jpg",
    mobile_image_url: "https://example.com/mobile2.jpg",
    alt_text: "Monsoon Panjabi",
  },
  {
    _id: "banner-3",
    desktop_image_url: "https://example.com/desktop3.jpg",
    mobile_image_url: "https://example.com/mobile3.jpg",
    alt_text: "Festive Exclusive",
  },
];

describe("HeroCarousel (Web Animations API)", () => {
  let animateMock: ReturnType<typeof vi.fn>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    animateMock = vi.fn().mockImplementation(() => {
      let resolveFinished: () => void = () => {};
      let rejectFinished: (reason?: unknown) => void = () => {};
      const finished = new Promise<void>((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });

      return {
        finished,
        cancel: vi.fn(),
        resolve: () => resolveFinished(),
        reject: (err: unknown) => rejectFinished(err),
      };
    });

    Element.prototype.animate = animateMock as unknown as typeof Element.prototype.animate;

    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders promotional section with first slide active and others inert", () => {
    render(<HeroCarousel banners={mockBanners} />);

    expect(screen.getByRole("region", { name: "Promotions" })).toBeDefined();

    const slide1Img = screen.getByAltText("Summer Collection");
    const slide2Img = screen.getByAltText("Monsoon Panjabi");

    const slide1Container = slide1Img.closest("[aria-hidden]");
    const slide2Container = slide2Img.closest("[aria-hidden]");

    expect(slide1Container?.getAttribute("aria-hidden")).toBe("false");
    expect(slide1Container?.hasAttribute("inert")).toBe(false);

    expect(slide2Container?.getAttribute("aria-hidden")).toBe("true");
    expect(slide2Container?.hasAttribute("inert")).toBe(true);

    const dots = screen.getAllByRole("button", { name: /Go to slide/i });
    expect(dots).toHaveLength(3);
    expect(dots[0]?.getAttribute("aria-current")).toBe("true");
    expect(dots[1]?.getAttribute("aria-current")).toBeNull();
  });

  it("triggers WAAPI animation with 650ms duration and forwards fill on Next click", async () => {
    render(<HeroCarousel banners={mockBanners} />);

    const nextBtn = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(nextBtn);

    expect(animateMock).toHaveBeenCalledTimes(2);

    const [outKeyframes, outOptions] = animateMock.mock.calls[0] as [
      Keyframe[],
      KeyframeAnimationOptions,
    ];
    const [inKeyframes, inOptions] = animateMock.mock.calls[1] as [
      Keyframe[],
      KeyframeAnimationOptions,
    ];

    expect(outOptions.duration).toBe(650);
    expect(outOptions.easing).toBe("cubic-bezier(0.45, 0, 0.55, 1)");
    expect(outOptions.fill).toBe("forwards");
    expect(outKeyframes).toEqual([
      { transform: "translate3d(0, 0, 0)", opacity: 1 },
      { transform: "translate3d(-70px, 0, 0)", opacity: 0 },
    ]);

    expect(inOptions.duration).toBe(650);
    expect(inOptions.easing).toBe("cubic-bezier(0.45, 0, 0.55, 1)");
    expect(inOptions.fill).toBe("forwards");
    expect(inKeyframes).toEqual([
      { transform: "translate3d(70px, 0, 0)", opacity: 0 },
      { transform: "translate3d(0, 0, 0)", opacity: 1 },
    ]);

    // Active slide state updates immediately so dot and accessibility update
    const dots = screen.getAllByRole("button", { name: /Go to slide/i });
    expect(dots[1]?.getAttribute("aria-current")).toBe("true");
  });

  it("prevents animation re-triggering while animation lock is active", () => {
    render(<HeroCarousel banners={mockBanners} />);

    const nextBtn = screen.getByRole("button", { name: "Next slide" });

    // First click starts animation
    fireEvent.click(nextBtn);
    expect(animateMock).toHaveBeenCalledTimes(2);

    // Rapid second click while in flight should be locked and ignored
    fireEvent.click(nextBtn);
    expect(animateMock).toHaveBeenCalledTimes(2);
  });

  it("unlocks animation lock when WAAPI animation resolves", async () => {
    let anim1Resolve: () => void = () => {};
    let anim2Resolve: () => void = () => {};

    animateMock.mockImplementationOnce(() => ({
      finished: new Promise<void>((r) => {
        anim1Resolve = r;
      }),
      cancel: vi.fn(),
    }));
    animateMock.mockImplementationOnce(() => ({
      finished: new Promise<void>((r) => {
        anim2Resolve = r;
      }),
      cancel: vi.fn(),
    }));

    render(<HeroCarousel banners={mockBanners} />);

    const nextBtn = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(nextBtn);
    expect(animateMock).toHaveBeenCalledTimes(2);

    // Resolve animations
    await act(async () => {
      anim1Resolve();
      anim2Resolve();
    });

    // Should now allow the next slide animation
    fireEvent.click(nextBtn);
    expect(animateMock).toHaveBeenCalledTimes(4);
  });

  it("unlocks animation lock when WAAPI animation rejects or is cancelled", async () => {
    let anim1Reject: (err?: unknown) => void = () => {};

    animateMock.mockImplementationOnce(() => ({
      finished: new Promise<void>((_, rej) => {
        anim1Reject = rej;
      }),
      cancel: vi.fn(),
    }));
    animateMock.mockImplementationOnce(() => ({
      finished: new Promise<void>(() => {}),
      cancel: vi.fn(),
    }));

    render(<HeroCarousel banners={mockBanners} />);

    const nextBtn = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(nextBtn);
    expect(animateMock).toHaveBeenCalledTimes(2);

    // Reject animation with AbortError
    await act(async () => {
      anim1Reject(new DOMException("The animation was aborted", "AbortError"));
    });

    // Should now allow new animation attempts
    fireEvent.click(nextBtn);
    expect(animateMock).toHaveBeenCalledTimes(4);
  });

  it("respects prefers-reduced-motion by updating slide instantly without calling WAAPI", () => {
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<HeroCarousel banners={mockBanners} />);

    const nextBtn = screen.getByRole("button", { name: "Next slide" });
    fireEvent.click(nextBtn);

    // Under reduced motion, no animation is spawned
    expect(animateMock).not.toHaveBeenCalled();

    // Slide advances immediately
    const dots = screen.getAllByRole("button", { name: /Go to slide/i });
    expect(dots[1]?.getAttribute("aria-current")).toBe("true");
  });

  it("navigates on Previous button click with reversed transforms", () => {
    render(<HeroCarousel banners={mockBanners} />);

    const prevBtn = screen.getByRole("button", { name: "Previous slide" });
    fireEvent.click(prevBtn);

    expect(animateMock).toHaveBeenCalledTimes(2);

    const [outKeyframes] = animateMock.mock.calls[0] as [Keyframe[]];
    const [inKeyframes] = animateMock.mock.calls[1] as [Keyframe[]];

    expect(outKeyframes).toEqual([
      { transform: "translate3d(0, 0, 0)", opacity: 1 },
      { transform: "translate3d(70px, 0, 0)", opacity: 0 },
    ]);

    expect(inKeyframes).toEqual([
      { transform: "translate3d(-70px, 0, 0)", opacity: 0 },
      { transform: "translate3d(0, 0, 0)", opacity: 1 },
    ]);
  });

  it("navigates directly on dot click", () => {
    render(<HeroCarousel banners={mockBanners} />);

    const dots = screen.getAllByRole("button", { name: /Go to slide/i });
    fireEvent.click(dots[2]!);

    expect(animateMock).toHaveBeenCalledTimes(2);
    expect(dots[2]?.getAttribute("aria-current")).toBe("true");
  });

  it("auto-rotates every 4000ms", () => {
    render(<HeroCarousel banners={mockBanners} />);

    expect(animateMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(animateMock).toHaveBeenCalledTimes(2);
    const dots = screen.getAllByRole("button", { name: /Go to slide/i });
    expect(dots[1]?.getAttribute("aria-current")).toBe("true");
  });

  it("handles swipe gestures beyond drag threshold (56px) and suppresses link click", () => {
    render(<HeroCarousel banners={mockBanners} />);

    const carouselArea = screen.getByRole("region", { name: "Promotions" }).querySelector("div.cursor-grab");
    expect(carouselArea).not.toBeNull();

    // Drag below threshold: 40px left
    fireEvent.pointerDown(carouselArea!, {
      pointerId: 1,
      clientX: 200,
      pointerType: "touch",
    });
    fireEvent.pointerMove(carouselArea!, {
      pointerId: 1,
      clientX: 160,
    });
    fireEvent.pointerUp(carouselArea!, {
      pointerId: 1,
      clientX: 160,
    });

    expect(animateMock).not.toHaveBeenCalled();

    // Drag beyond threshold: 80px left (next)
    fireEvent.pointerDown(carouselArea!, {
      pointerId: 2,
      clientX: 200,
      pointerType: "touch",
    });
    fireEvent.pointerMove(carouselArea!, {
      pointerId: 2,
      clientX: 120,
    });
    fireEvent.pointerUp(carouselArea!, {
      pointerId: 2,
      clientX: 120,
    });

    expect(animateMock).toHaveBeenCalledTimes(2);

    // Verify click suppression prevents link activation
    const activeLink = screen.getAllByRole("link", { name: /Shop the latest MINAN collection/i })[0];
    const clickEvent = new MouseEvent("click", { cancelable: true, bubbles: true });
    activeLink?.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
  });
});

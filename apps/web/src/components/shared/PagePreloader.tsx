import Image from "next/image";

export default function PagePreloader() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="fixed inset-0 z-500 flex min-h-dvh flex-col justify-between overflow-hidden bg-[#1b1c1c] px-6 py-7 text-[#f3f0f0] sm:px-10 sm:py-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_46%,rgba(151,72,34,0.22),transparent_58%)]"
      />

      <div className="relative flex items-center justify-between gap-4 text-[10px] font-semibold tracking-[0.22em] uppercase sm:text-xs">
        <span className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          MINAN
        </span>
        <span className="text-right text-foreground/70">Sylhet, Bangladesh</span>
      </div>

      <div className="relative flex flex-col items-center justify-center py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-32 w-56 rounded-full bg-primary/10 blur-3xl sm:h-44 sm:w-72"
        />
        <Image
          src="/logo.png"
          alt=""
          width={364}
          height={353}
          priority
          className="relative h-40 w-40 object-contain drop-shadow-[0_0_24px_rgba(245,184,54,0.16)] sm:h-52 sm:w-52"
        />
        <div className="mt-9 w-52 sm:w-64">
          <div className="h-px overflow-hidden bg-foreground/15" aria-hidden="true">
            <span className="block h-full w-1/3 bg-primary motion-safe:animate-[minan-preloader-progress_1.8s_ease-in-out_infinite]" />
          </div>
          <p className="mt-4 text-center text-[10px] font-medium tracking-[0.22em] text-foreground/70 uppercase sm:text-xs">
            Loading your page
          </p>
        </div>
      </div>

      <p className="relative text-[10px] font-medium tracking-[0.2em] text-foreground/70 uppercase sm:text-xs">
        MINAN Clothing
      </p>
    </section>
  );
}

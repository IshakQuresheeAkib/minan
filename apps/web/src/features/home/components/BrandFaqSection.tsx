import { ChevronDown, HelpCircle } from "lucide-react";

import { brandFaqs } from "@/lib/seo/structured-data";

export function BrandFaqSection() {
  return (
    <section
      aria-labelledby="brand-faq-heading"
      className="my-10 space-y-6 sm:my-14"
    >
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
          <HelpCircle className="size-3.5" aria-hidden="true" />
          Frequently Asked Questions
        </div>
        <h2
          id="brand-faq-heading"
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Everything You Need to Know About MINAN
        </h2>
        <p className="max-w-2xl text-sm text-foreground/70 sm:text-base">
          Find answers to common questions about our clothing collections,
          Sylhet store location, nationwide Bangladesh shipping, and secure
          payment options.
        </p>
      </div>

      <div className="space-y-3">
        {brandFaqs.map((faq, index) => (
          <details
            key={faq.question}
            open={index === 0}
            className="group rounded-xl border border-border/70 bg-card/40 p-4 transition-colors hover:border-primary/30 open:border-primary/40 open:bg-card/70 sm:p-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium text-foreground select-none">
              <span>{faq.question}</span>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/5 text-foreground/70 transition-transform duration-200 group-open:rotate-180 group-open:bg-primary/10 group-open:text-primary">
                <ChevronDown className="size-4" aria-hidden="true" />
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80 sm:text-base sm:leading-7">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

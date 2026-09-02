import { Banknote, CircleCheck, Smartphone } from "lucide-react";
import { forwardRef, type KeyboardEvent } from "react";

import type { PaymentMethod } from "@/features/checkout/types";
import { cn } from "@/lib/utils";

type PaymentMethodSelectorProps = {
  deliveryFee: number;
  disabled?: boolean;
  errorId?: string;
  errorMessage?: string;
  merchandiseTotal: number;
  name: string;
  onBlur: () => void;
  onChange: (method: PaymentMethod) => void;
  value?: PaymentMethod;
};

const options = [
  {
    id: "bkash_full" as const,
    title: "bKash",
    description: "Pay the complete order securely with bKash.",
    dueLabel: "Nothing due at delivery",
    Icon: Smartphone,
  },
  {
    id: "cod" as const,
    title: "Cash on Delivery (COD)",
    description: "Delivery fee should be paid now through bKash",
    dueLabel: "Pay merchandise in cash at delivery",
    Icon: Banknote,
  },
];

export const PaymentMethodSelector = forwardRef<
  HTMLInputElement,
  PaymentMethodSelectorProps
>(function PaymentMethodSelector(
  {
    deliveryFee,
    disabled = false,
    errorId,
    errorMessage,
    merchandiseTotal,
    name,
    onBlur,
    onChange,
    value,
  },
  ref,
) {
  function handleRadioKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ): void {
    if (event.key === " ") {
      event.preventDefault();
      const currentOption = options[index];
      if (currentOption) onChange(currentOption.id);
      return;
    }

    const direction =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;
    if (direction === 0) return;

    event.preventDefault();
    const nextIndex = (index + direction + options.length) % options.length;
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    onChange(nextOption.id);
    event.currentTarget
      .closest("fieldset")
      ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
      [nextIndex]?.focus();
  }

  return (
    <fieldset
      aria-describedby={errorMessage ? errorId : undefined}
      aria-invalid={Boolean(errorMessage)}
      className="grid gap-3"
      disabled={disabled}
    >
      <legend className="mb-2 text-sm font-medium">Payment method</legend>
      <div className="grid gap-2">
        {options.map((option, index) => {
          const selected = value === option.id;
          const payNow =
            option.id === "bkash_full"
              ? merchandiseTotal + deliveryFee
              : deliveryFee;
          return (
            <label
              key={option.id}
              className={cn(
                "grid min-h-24 cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border bg-background p-4 text-sm transition-colors duration-300",
                "hover:border-foreground/40 hover:bg-secondary/35 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/30",
                selected && "border-primary bg-primary/10",
                errorMessage && !selected && "border-destructive/60",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                ref={index === 0 ? ref : undefined}
                aria-describedby={errorMessage ? errorId : undefined}
                checked={selected}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
                name={name}
                onBlur={onBlur}
                onChange={() => onChange(option.id)}
                onKeyDown={(event) => handleRadioKeyDown(event, index)}
                type="radio"
                value={option.id}
              />
              <span className="grid min-w-0 gap-2">
                <span className="flex flex-col items-start justify-between gap-1 sm:flex-row sm:gap-3">
                  <span className="flex min-w-0 items-center gap-2 font-semibold leading-5">
                    <option.Icon
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {option.title}
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums sm:text-right">
                    Tk {payNow.toLocaleString("en-BD")} now
                  </span>
                </span>
                <span className="text-xs leading-5 text-foreground/70">
                  {option.description}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/80">
                  {selected ? (
                    <CircleCheck
                      className="size-3.5 text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                  {option.dueLabel}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {errorMessage ? (
        <span id={errorId} className="text-xs text-destructive" role="alert">
          {errorMessage}
        </span>
      ) : null}
    </fieldset>
  );
});

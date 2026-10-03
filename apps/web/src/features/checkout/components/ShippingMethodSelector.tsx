import { CircleCheck } from "lucide-react";
import { forwardRef } from "react";

import type { ShippingOption, ShippingZone } from "@/features/checkout/types";
import { cn } from "@/lib/utils";

type ShippingMethodSelectorProps = {
  disabled?: boolean;
  errorId?: string;
  errorMessage?: string;
  name: string;
  onBlur: () => void;
  onChange: (zone: ShippingZone) => void;
  options: readonly ShippingOption[];
  value?: ShippingZone;
};

export const ShippingMethodSelector = forwardRef<
  HTMLInputElement,
  ShippingMethodSelectorProps
>(function ShippingMethodSelector(
  {
    disabled = false,
    errorId,
    errorMessage,
    name,
    onBlur,
    onChange,
    options,
    value,
  },
  ref,
) {
  return (
    <fieldset
      aria-describedby={errorMessage ? errorId : undefined}
      aria-invalid={Boolean(errorMessage)}
      className="grid gap-3"
      disabled={disabled}
    >
      <legend className="text-sm font-medium mb-2">Shipping method</legend>
      <div className="grid gap-2">
        {options.map((option, index) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={cn(
                "grid min-h-14 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md border bg-background px-3.5 py-3 text-sm transition-colors duration-300",
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
                className="size-5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
                name={name}
                onBlur={onBlur}
                onChange={() => onChange(option.id)}
                type="radio"
                value={option.id}
              />
              <span className="min-w-0 font-medium leading-5">
                <span>{option.label}</span>
                {selected ? (
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-foreground/65">
                    <CircleCheck className="size-3.5" aria-hidden="true" />
                    Selected
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums">
                Tk {option.delivery_fee.toLocaleString("en-BD")}
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

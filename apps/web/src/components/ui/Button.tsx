import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import Link, { type LinkProps } from "next/link";
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "hero-reveal inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border border-primary text-sm font-bold tracking-wide disabled:pointer-events-none disabled:opacity-50 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-primary/50",
  {
    variants: {
      variant: {
        primary:
          "bg-foreground text-primary shadow-md shadow-primary/50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-foreground/90 hover:text-background hover:shadow-xl hover:shadow-primary/60",
        secondary:
          "text-foreground shadow-md shadow-primary/30 transition-colors duration-300 hover:bg-foreground hover:text-primary hover:shadow-primary/70",
      },
      size: {
        default: "px-7 py-3.5 md:px-8 md:py-4",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-4 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type IconPosition = "left" | "right";

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  iconPosition?: IconPosition;
  leftIcon?: ReactNode;
  loading?: boolean;
  loadingText?: ReactNode;
  rightIcon?: ReactNode;
  text?: ReactNode;
};

type NativeButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: undefined;
  };

type LinkButtonProps = ButtonBaseProps &
  Omit<ComponentProps<typeof Link>, keyof ButtonBaseProps | "href"> & {
    disabled?: boolean;
    href: LinkProps["href"];
  };

type SlotButtonProps = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<typeof Slot>, keyof ButtonBaseProps> & {
    asChild: true;
    disabled?: boolean;
    href?: undefined;
  };

type ButtonProps = NativeButtonProps | LinkButtonProps | SlotButtonProps;

function Button({
  asChild = false,
  children,
  className,
  disabled,
  href,
  icon,
  iconPosition = "right",
  leftIcon,
  loading = false,
  loadingText,
  rightIcon,
  size,
  text,
  variant,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const label = loading && loadingText ? loadingText : (text ?? children);
  const startIcon = loading ? (
    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
  ) : (
    (leftIcon ?? (iconPosition === "left" ? icon : null))
  );
  const endIcon = loading
    ? null
    : (rightIcon ?? (iconPosition === "right" ? icon : null));
  const buttonContent = (
    <>
      {startIcon}
      {label}
      {endIcon}
    </>
  );
  const buttonClassName = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    const slotProps = props as Omit<
      SlotButtonProps,
      keyof ButtonBaseProps | "asChild" | "disabled" | "href"
    >;

    return (
      <Slot
        {...slotProps}
        data-slot="button"
        aria-disabled={isDisabled || undefined}
        data-disabled={isDisabled || undefined}
        className={buttonClassName}
      >
        {children}
      </Slot>
    );
  }

  if (href) {
    const { onClick, ...linkProps } = props as Omit<
      LinkButtonProps,
      keyof ButtonBaseProps | "disabled" | "href"
    >;

    return (
      <Link
        {...linkProps}
        {...(onClick ? { onClick } : {})}
        data-slot="button"
        href={href}
        aria-disabled={isDisabled || undefined}
        data-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : linkProps.tabIndex}
        className={buttonClassName}
      >
        {buttonContent}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props as Omit<
    NativeButtonProps,
    keyof ButtonBaseProps | "href"
  >;

  return (
    <button
      data-slot="button"
      className={buttonClassName}
      disabled={isDisabled}
      type={type}
      {...buttonProps}
    >
      {buttonContent}
    </button>
  );
}

export { Button, buttonVariants };

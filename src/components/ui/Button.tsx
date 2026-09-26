import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "cta-gradient-slide text-white shadow-card active:opacity-95",
  secondary:
    "bg-surface-sunken text-text-primary hover:bg-border border border-border",
  outline:
    "bg-transparent text-text-primary border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-text-primary hover:bg-surface-muted",
  danger: "bg-error text-white hover:opacity-90",
};

/*
 * Only `sm` carries a touch-target floor.
 *
 * 44px is the smallest reliable touch target (WCAG 2.5.5 / Apple HIG).
 * Because the app sets a 110% root font size, `h-10` (2.5rem) already
 * measures 44px and `h-12` more — md, lg and icon are compliant as they
 * stand, and adding a floor there would only inflate them. `h-8` lands at
 * ~35px, so it gets a floor below `sm`, where taps replace clicks.
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 sm:min-h-0 h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0 justify-center",
};

/**
 * Base button primitive. Semi-rounded per the Purity style guide (not pill,
 * not sharp). Keep this free of business logic — compose it in feature
 * components instead of branching here.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center rounded-[var(--radius-lg)] font-medium transition-colors",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

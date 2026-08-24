import { type InputHTMLAttributes, type LabelHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  wrapperClassName?: string;
}

/** Text input with an always-present, properly associated label (visually hidden is fine, but never omitted). */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, label, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={hintId}
          className={cn(
            "h-10 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-secondary",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
            "disabled:opacity-50 disabled:pointer-events-none",
            className,
          )}
          {...props}
        />
        {hint && (
          <p id={hintId} className="text-xs text-text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export function VisuallyHiddenLabel(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="sr-only" {...props} />;
}

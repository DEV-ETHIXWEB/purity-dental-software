import { type InputHTMLAttributes, forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  hint?: string;
}

/**
 * Password field with a show/hide toggle. Not built on top of `Input` — the
 * toggle button needs to sit inside a wrapper around just the `<input>`
 * element, and `Input` bundles its label/hint into one non-decomposable
 * flex column.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            aria-describedby={hintId}
            className={cn(
              "h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 pr-10 text-sm text-text-primary placeholder:text-text-secondary",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
              "disabled:opacity-50 disabled:pointer-events-none",
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-1 flex items-center px-2 text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] rounded-[var(--radius-sm)]"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {hint && (
          <p id={hintId} className="text-xs text-text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

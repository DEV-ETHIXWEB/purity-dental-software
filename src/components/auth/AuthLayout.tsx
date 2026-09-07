import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarCheck2, Users, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const FEATURES = [
  { icon: CalendarCheck2, text: "Smart scheduling that catches double-bookings before they happen" },
  { icon: Users, text: "Every patient record, appointment, and invoice in one connected place" },
  { icon: ShieldCheck, text: "Role-based access keeps records secure across your whole team" },
];

/**
 * Shared split-screen shell for /login, /forgot-password, /reset-password.
 * The gradient panel carries brand identity in white text (the exported
 * Logo asset is a teal/blue gradient mark — too low-contrast to sit on a
 * teal/blue gradient background), and only reappears on the form side
 * where it's back on a white surface.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full w-full flex-1 lg:grid-cols-[5fr_7fr]">
      <div className="relative hidden overflow-hidden brand-gradient-bg lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />

        <p className="relative text-xl font-bold tracking-tight text-white">Purity</p>

        <div className="relative flex flex-col gap-8">
          <div>
            <h2 className="text-3xl font-semibold leading-tight text-white">
              Run your practice with confidence
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              Scheduling, billing, and patient care in one connected system built for modern dental
              practices.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/15">
                  <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-sm text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Purity. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 bg-surface px-4 py-12 sm:px-6 lg:px-12">
        <Link
          href="/login"
          className="lg:hidden rounded-[var(--radius-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
          aria-label="Purity home"
        >
          <Logo height={40} />
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

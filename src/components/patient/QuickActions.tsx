import type { ComponentType } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  CalendarIconFilled,
  DocumentIconFilled,
  DollarIconFilled,
  type PurityIconProps,
} from "@/components/ui/icons/purity-icons";

interface QuickAction {
  href: string;
  label: string;
  Icon: ComponentType<PurityIconProps>;
}

/**
 * The four things a patient actually opens the portal to do. Every tile is
 * a real route in the Patient nav — this is a shortcut layer over pages
 * that already exist, never a link to something unbuilt.
 */
const ACTIONS: QuickAction[] = [
  { href: "/patient/appointments", label: "Book appointment", Icon: CalendarIconFilled },
  { href: "/patient/care", label: "My records", Icon: DocumentIconFilled },
  { href: "/patient/billing", label: "Pay bills", Icon: DollarIconFilled },
];

/**
 * Kept deliberately compact — these are shortcuts, not the page's subject,
 * and every row of height they take pushes "How your treatment is going"
 * and "Need help?" further down the page.
 *
 * Motion follows the conventions already used on the Dentist dashboard: a
 * lift plus shadow on hover, a slight press on click, and the icon scaling
 * with its tile via `group-hover`. Only `transform` and `box-shadow`
 * animate (both compositor-friendly), and every step has a `motion-reduce`
 * opt-out.
 */
export function QuickActions() {
  return (
    <Card className="animate-rise-in stagger-2 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <ul className="grid grid-cols-3 gap-2.5">
          {ACTIONS.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full min-h-11 flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border border-border px-2 py-3 text-center transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-muted hover:shadow-card active:scale-[0.97] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]"
              >
                {/* No tile behind these: the Purity icon set paints its own
                    blue→teal gradient (never `currentColor`), so a tinted
                    blue chip only lowers its contrast. */}
                <Icon
                  className="h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:group-hover:scale-100"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium leading-snug text-text-primary">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

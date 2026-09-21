import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export interface NotificationPreferenceItem {
  id: string;
  label: string;
}

export interface NotificationPreferencesCardProps {
  items: NotificationPreferenceItem[];
  /** Card subtitle — staff portals phrase this differently from the Patient portal. */
  description: string;
  /**
   * "comfortable" enlarges the row and checkbox for the Patient portal,
   * which is the most touch-heavy surface. Defaults to the staff sizing.
   */
  size?: "default" | "comfortable";
}

/** Rows animate in just behind their card, so the group reads as one settling motion. */
const ROW_STAGGER = ["stagger-3", "stagger-4", "stagger-5", "stagger-6", "stagger-7", "stagger-8"];

/**
 * Shared "Notifications" preferences card for all four portals' Settings
 * pages, which previously carried four byte-identical copies of this markup
 * (bar the Patient portal's larger touch targets).
 *
 * The toggles are presentational for now — same as the markup this
 * replaces, they render `defaultChecked` and persist nothing. Hover/entry
 * motion is expressed purely with utility classes so this stays a Server
 * Component with no client-side JavaScript.
 */
export function NotificationPreferencesCard({ items, description, size = "default" }: NotificationPreferencesCardProps) {
  const comfortable = size === "comfortable";

  return (
    <Card className="animate-rise-in stagger-2 transition-shadow duration-300 ease-out hover:shadow-card-hover">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item, i) => (
          <label
            key={item.id}
            htmlFor={item.id}
            className={cn(
              "group/row animate-rise-in flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm",
              "transition-all duration-200 ease-out hover:border-border-strong hover:bg-surface-muted hover:shadow-card",
              comfortable && "min-h-11",
              ROW_STAGGER[i] ?? "stagger-8",
            )}
          >
            <span className="text-text-primary">{item.label}</span>
            <input
              id={item.id}
              type="checkbox"
              defaultChecked
              className={cn(
                "rounded border-border-strong accent-[var(--color-brand-blue)]",
                "transition-transform duration-200 ease-out group-hover/row:scale-110 motion-reduce:group-hover/row:scale-100",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                comfortable ? "h-5 w-5" : "h-4 w-4",
              )}
            />
          </label>
        ))}
        {/* Said plainly rather than left implicit: these toggles have no
            backing store yet, and a switch that silently forgets what you
            set it to is worse than one that tells you so. */}
        <p className="text-xs text-text-secondary">
          Delivery preferences aren&apos;t saved yet — everyone currently gets all of the above.
        </p>
      </CardContent>
    </Card>
  );
}

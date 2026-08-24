import { cn } from "@/lib/cn";

export interface MiniCalendarProps {
  /** Reference date (drives which month renders). */
  referenceDate: Date;
  /** ISO date strings (YYYY-MM-DD) that should render as "has appointments". */
  markedDates: Set<string>;
}

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Small read-only month calendar highlighting the current day and days with appointments. */
export function MiniCalendar({ referenceDate, markedDates }: MiniCalendarProps) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const todayIso = toIsoDate(referenceDate);

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = referenceDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-primary">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-text-secondary">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={`${d}-${i}`} className="py-1 font-medium">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`empty-${i}`} />;
          const iso = toIsoDate(new Date(year, month, day));
          const isToday = iso === todayIso;
          const hasAppt = markedDates.has(iso);
          return (
            <span
              key={iso}
              className={cn(
                "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs",
                isToday && "brand-gradient-bg font-semibold text-white",
                !isToday && hasAppt && "bg-info-bg font-medium text-[var(--color-brand-blue-text)]",
                !isToday && !hasAppt && "text-text-primary",
              )}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

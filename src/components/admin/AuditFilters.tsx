"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const FIELD_CLASSES =
  "h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)] sm:w-56";

/**
 * Search and actor filter for the activity log.
 *
 * Drives the URL rather than local state so a filtered view is linkable and
 * survives a refresh — the page reads `searchParams` and re-queries on the
 * server, which also keeps the whole log from being shipped to the client
 * just to filter it here.
 */
export function AuditFilters({
  actors,
  initialQuery,
  initialActor,
}: {
  actors: { id: string; name: string }[];
  initialQuery: string;
  initialActor: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [actor, setActor] = useState(initialActor);

  function apply(nextQuery: string, nextActor: string) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextActor) params.set("actor", nextActor);
    const qs = params.toString();
    router.push(qs ? `/admin/audit?${qs}` : "/admin/audit");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    apply(query, actor);
  }

  const hasFilters = Boolean(query.trim() || actor);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search actions, e.g. appointment or messaging…"
        aria-label="Search activity"
        className="sm:max-w-sm"
      />

      <select
        value={actor}
        onChange={(e) => {
          setActor(e.target.value);
          apply(query, e.target.value);
        }}
        aria-label="Filter by who made the change"
        className={FIELD_CLASSES}
      >
        <option value="">Anyone</option>
        {actors.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <Button type="submit" variant="secondary" className="shrink-0">
        Search
      </Button>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          className="shrink-0"
          onClick={() => {
            setQuery("");
            setActor("");
            router.push("/admin/audit");
          }}
        >
          Clear
        </Button>
      )}
    </form>
  );
}

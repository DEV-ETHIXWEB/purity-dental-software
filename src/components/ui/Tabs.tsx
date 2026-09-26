"use client";

import {
  type ReactNode,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  createContext,
} from "react";
import { cn } from "@/lib/cn";

interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  idPrefix: string;
  /** Lets `TabsList` register itself as the anchor the scroll fix measures against. */
  registerList: (node: HTMLDivElement | null) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Tabs>`);
  return ctx;
}

export interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

/** Nearest ancestor that actually scrolls — the app shell scrolls `<main>`, not the window. */
function scrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeValue, setActiveValue] = useState(defaultValue);
  const idPrefix = useId();
  const listRef = useRef<HTMLDivElement | null>(null);
  // Where the tab strip sat, in viewport coordinates, at the moment the tab
  // was clicked. Read back after the swap to undo any drift.
  const anchorTop = useRef<number | null>(null);

  const registerList = useCallback((node: HTMLDivElement | null) => {
    listRef.current = node;
  }, []);

  const selectValue = useCallback((value: string) => {
    anchorTop.current = listRef.current?.getBoundingClientRect().top ?? null;
    setActiveValue(value);
  }, []);

  /*
   * Switching tabs swaps one panel for another of a different height. When
   * the page gets shorter the browser clamps the scroll position, which threw
   * the reader back up to the patient header — they clicked a tab and lost
   * their place entirely.
   *
   * So: note where the tab strip was before the swap, and after the new panel
   * has laid out (layout effect, before paint — no visible jump) scroll by
   * whatever the difference is. The strip stays put and the new panel opens
   * exactly where the old one was.
   */
  useLayoutEffect(() => {
    const previousTop = anchorTop.current;
    anchorTop.current = null;
    const list = listRef.current;
    if (previousTop === null || !list) return;

    const drift = list.getBoundingClientRect().top - previousTop;
    if (Math.abs(drift) < 1) return;

    const scroller = scrollParent(list);
    if (scroller) {
      scroller.scrollTop += drift;
    } else {
      window.scrollBy(0, drift);
    }
  }, [activeValue]);

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue: selectValue, idPrefix, registerList }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const { registerList } = useTabsContext("TabsList");
  return (
    <div
      ref={registerList}
      role="tablist"
      className={cn(
        // Wraps on a phone rather than scrolling sideways.
        //
        // This was a `scrollbar-none` horizontal scroller, which meant 692px
        // of tabs inside a 303px strip with the scrollbar deliberately
        // hidden and no fade or arrow — so on a narrow screen the later tabs
        // existed but nothing on screen said so. Wrapping shows all of them;
        // from `sm` up they fit on one line anyway, where the scroller stays
        // as the fallback for an unusually long set.
        "flex flex-wrap items-center gap-1 rounded-[var(--radius-lg)] bg-surface-sunken p-1",
        "sm:scrollbar-none sm:flex-nowrap sm:overflow-x-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const { activeValue, setActiveValue, idPrefix } = useTabsContext("TabsTrigger");
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${idPrefix}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${idPrefix}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveValue(value)}
      className={cn(
        // `inline-flex` + `min-h-11` gives a 44px touch target on phones while
        // keeping the label centred; from `sm` up the padding sets the height
        // as before. See the note on Button's size classes.
        "inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-medium transition-colors",
        "min-h-11 sm:min-h-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
        isActive
          ? "bg-surface text-text-primary shadow-card"
          : "text-text-secondary hover:text-text-primary",
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { activeValue, idPrefix } = useTabsContext("TabsContent");
  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      tabIndex={0}
      className={cn("mt-4 focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}

/**
 * Jumps to another tab from inside tab content — e.g. an Overview summary
 * panel linking through to the full Perio Chart tab. A plain link can't do
 * this: the active tab is component state, not a route.
 */
export function TabLink({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { setActiveValue } = useTabsContext("TabLink");
  return (
    <button type="button" onClick={() => setActiveValue(value)} className={className}>
      {children}
    </button>
  );
}

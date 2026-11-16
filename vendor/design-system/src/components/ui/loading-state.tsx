// Waiting on a first read, drawn as the shape of what is coming. t3code's
// Skeleton (./skeleton.tsx, the stepped pulse) laid out the way Lanes' screens
// already laid it out by hand:
//
//   rows    Settings' SettingsLoading (screens/settings/layout.tsx): a group of
//           rows, each a title and a line, a pill where the control goes
//   stats   Overview's skeleton tiles (OverviewScreen.tsx `OverviewSkeleton`)
//   cards   Overview's skeleton campaign cards
//   lines   a drawer's history waiting (LeadDrawer.tsx)
//   agents  the Agents window's first read (AgentsScreen.tsx `GridSkeleton`):
//           a grid of tiles, each a 16:10 frame over two lines and a count
//   inline  a word and t3code's Spinner, for a small part of a panel
//
// Agent work is never a skeleton or a ring: that is the Radar (./radar.tsx).
//
// A read that takes longer than `slowAfterMs` (5 seconds) says so under the
// shape, quietly: "Still loading…" (./problem.tsx StatusNote), so a slow
// answer never looks like a frozen screen (docs/problems.md).

import { useEffect, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { cn } from "../../lib/utils";
import { cardVariants } from "./glass-panel";
import { ListGroup } from "./list";
import { Skeleton } from "./skeleton";
import { StatusNote } from "./problem";
import { Spinner } from "./spinner";

type LoadingStateProps = Omit<ComponentProps<"div">, "children"> & {
  variant?: "rows" | "stats" | "cards" | "lines" | "agents" | "inline";
  /** How many rows, tiles, cards or lines. */
  count?: number;
  /** `inline` only: the word beside the spinner. */
  label?: string;
  /** After this long, "Still loading…" under the shape; `false` never. */
  slowAfterMs?: number | false;
};

const LINE_WIDTHS = ["w-48", "w-64", "w-40", "w-56"] as const;

export const SLOW_LOAD_MS = 5000;
export const STILL_LOADING = "Still loading…";

// One "Still loading…" on the page however many shapes are waiting (a
// screen with three reads in flight says it once): the first that went slow
// says it, and the next takes over when it is done.
const slowOnes: number[] = [];
const slowListeners = new Set<() => void>();
let slowCount = 0;
const slowChanged = () => {
  for (const listener of [...slowListeners]) listener();
};

/** Whether `ms` has passed since this mounted, and this is the one that says so. */
function useSlow(ms: number | false): boolean {
  const [slow, setSlow] = useState(false);
  const [id] = useState(() => (slowCount += 1));
  useEffect(() => {
    if (ms === false) return;
    const timer = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  useEffect(() => {
    if (!slow) return;
    slowOnes.push(id);
    slowChanged();
    return () => {
      slowOnes.splice(slowOnes.indexOf(id), 1);
      slowChanged();
    };
  }, [slow, id]);
  const first = useSyncExternalStore(
    (listener) => {
      slowListeners.add(listener);
      return () => slowListeners.delete(listener);
    },
    () => slowOnes[0] === id,
    () => false,
  );
  return slow && first;
}

export function LoadingState({ slowAfterMs = SLOW_LOAD_MS, variant = "rows", ...props }: LoadingStateProps) {
  const slow = useSlow(variant === "inline" ? false : slowAfterMs);
  const shape: ReactNode = <LoadingShape variant={variant} {...props} />;
  if (!slow) return shape;
  return (
    <div className="flex flex-col gap-3" data-slot="loading-slow">
      {shape}
      <StatusNote tone="working" className="self-center">
        {STILL_LOADING}
      </StatusNote>
    </div>
  );
}

function LoadingShape({ variant = "rows", count, label = "Loading…", className, ...props }: Omit<LoadingStateProps, "slowAfterMs">) {
  if (variant === "rows") {
    return (
      <ListGroup aria-busy="true" data-slot="settings-loading" className={className} {...props}>
        {Array.from({ length: count ?? 3 }, (_, at) => (
          <div key={at} className="flex items-center justify-between gap-6 px-4 py-4">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
        ))}
      </ListGroup>
    );
  }
  if (variant === "stats") {
    return (
      <div aria-busy="true" data-slot="loading-stats" className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)} {...props}>
        {Array.from({ length: count ?? 4 }, (_, at) => (
          <div key={at} className={cn(cardVariants({ variant: "solid", padding: "md" }), "flex flex-col gap-2")}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "cards") {
    return (
      <div aria-busy="true" data-slot="loading-cards" className={cn("flex flex-col gap-6", className)} {...props}>
        {Array.from({ length: count ?? 2 }, (_, at) => (
          <div key={at} className={cn(cardVariants({ variant: "solid", padding: "lg" }), "flex flex-col gap-4")}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "agents") {
    return (
      <div
        aria-busy="true"
        data-slot="loading-agents"
        className={cn("grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] gap-3", className)}
        {...props}
      >
        {Array.from({ length: count ?? 8 }, (_, at) => (
          <div key={at} className={cn(cardVariants({ variant: "solid", padding: "none" }), "flex flex-col overflow-hidden")}>
            <Skeleton className="aspect-16/10 w-full rounded-none" />
            <div className="flex flex-col gap-2 p-2.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-1/4 self-end" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (variant === "lines") {
    return (
      <div aria-busy="true" data-slot="loading-lines" className={cn("space-y-3", className)} {...props}>
        {Array.from({ length: count ?? 2 }, (_, at) => (
          <Skeleton key={at} className={cn("h-4 rounded", LINE_WIDTHS[at % LINE_WIDTHS.length])} />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-busy="true"
      data-slot="loading-inline"
      className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}
      {...props}
    >
      <Spinner size="xs" />
      {label}
    </div>
  );
}

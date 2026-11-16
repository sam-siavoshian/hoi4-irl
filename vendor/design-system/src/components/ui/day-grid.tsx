// A calendar of days as a grid of small squares, a week to a column: how each day went, at a glance.
// New in ARTESH's vendored copy of the kit (not in Lanes): the squares are the page's fill, tinted by
// the tone's token at three strengths. Decoration with a spoken summary: give it a `label`.

import type { ComponentProps } from "react";

import { cn } from "../../lib/utils";

export type DayGridTone = "success" | "danger" | "neutral";

export interface DayGridCell {
  /** Nothing that day: the bare fill. */
  tone?: DayGridTone | null;
  /** How strongly, 1 to 3. */
  level?: 1 | 2 | 3;
  /** A day that has not come yet: fainter. */
  future?: boolean;
}

const TINT: Record<DayGridTone, readonly [string, string, string]> = {
  success: ["bg-success/45", "bg-success/70", "bg-success"],
  danger: ["bg-destructive/45", "bg-destructive/70", "bg-destructive"],
  neutral: ["bg-muted-foreground/45", "bg-muted-foreground/45", "bg-muted-foreground/45"],
};

export function DayGrid({
  cells,
  label,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  /** Oldest first; seven to a column. */
  cells: readonly DayGridCell[];
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      data-slot="day-grid"
      className={cn("grid grid-flow-col grid-rows-7 gap-1", className)}
      {...props}
    >
      {cells.map((cell, index) => (
        <span
          key={index}
          data-slot="day-grid-cell"
          className={cn(
            "aspect-square rounded-xs",
            cell.tone ? TINT[cell.tone][(cell.level ?? 1) - 1] : "bg-fill",
            cell.future && "opacity-40",
          )}
        />
      ))}
    </div>
  );
}

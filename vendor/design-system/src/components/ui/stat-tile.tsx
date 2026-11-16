// One number that matters, with its name and a word of context. The tile is
// Overview's (screens/overview/OverviewScreen.tsx `Stat`): Morrow's card
// surface (./glass-panel.tsx, `solid`), the number large and tight, rolling to
// each new value with opencode's odometer (./AnimatedNumber.tsx), the detail
// beside it in the muted ink, and room under it for a meter. Variants for the
// other places Lanes shows a big number: `plain` with no card (Plan & usage's
// credits left) and `sky`, standing on the sky with its veil (the Agents
// window's "Sent so far", components/agents/CampaignTotals.tsx `FleetHero`).
//
// The sky's veil is drawn inside the tile's own box (`sky-veil-glow-firm`,
// design/lanes.css), fading to nothing before any edge, and the tile's padding
// is the room it fades in. A veil that reached past the box was cut square by
// whatever scroller held it (the Agents window's totals scroll sideways, which
// clips both axes), and showed as a hard dark rectangle on the sky.

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { CountUp } from "./count-up";
import { cardVariants } from "./glass-panel";

export const statTileVariants = cva("flex min-w-0 flex-col", {
  variants: {
    variant: {
      /** Overview's tile: a raised card. */
      card: cn(cardVariants({ variant: "solid", padding: "md" }), "gap-1.5"),
      /** No card: the number on the page. */
      plain: "gap-1.5",
      /** On the sky, behind a soft veil so it reads over bright cloud. */
      sky: "relative isolate justify-end gap-1 px-5 py-4 text-sky-ink sky-veil-glow-firm",
    },
  },
  defaultVariants: { variant: "card" },
});

const VALUE = {
  md: "text-2xl leading-none font-semibold tracking-[-0.02em]",
  lg: "text-3xl leading-none font-semibold tracking-tight",
  hero: "text-figure font-semibold",
} as const;

export type StatTileProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof statTileVariants> & {
    label: ReactNode;
    /** A number rolls (opencode's odometer); anything else is shown as it is. */
    value: number | ReactNode;
    /** Beside the number: "of 5,000", "not confirmed yet". */
    detail?: ReactNode;
    /** The number's size: `md` (Overview), `lg` (Plan's credits), `hero` (on the sky). */
    size?: keyof typeof VALUE;
    /** On first show, count up from zero rather than appear. */
    countUp?: boolean;
    /** The detail on its own line under the number, not beside it (the Agents window's "Sent so far"). */
    detailBelow?: boolean;
    /** Under the number: a ProgressMeter. */
    children?: ReactNode;
  };

export function StatTile({
  label,
  value,
  detail,
  size = "md",
  countUp = false,
  detailBelow = false,
  variant,
  className,
  children,
  ...props
}: StatTileProps) {
  const sky = variant === "sky";
  const number =
    typeof value === "number" ? countUp ? <CountUp value={value} /> : <AnimatedNumber value={value} /> : value;
  return (
    <div data-slot="stat-tile" className={cn(statTileVariants({ variant }), className)} {...props}>
      <span className={cn("text-xs", sky ? "font-medium sky-text-firm" : "text-muted-foreground")}>{label}</span>
      <span className={cn("tabular-nums", detailBelow ? "flex flex-col gap-1" : "flex items-baseline gap-1.5")}>
        <span className={cn(VALUE[size], sky && "sky-text")} data-slot="stat-value">
          {number}
        </span>
        {detail ? (
          <span className={cn("truncate text-xs", sky ? "font-medium sky-text-firm" : "text-muted-foreground")}>{detail}</span>
        ) : null}
      </span>
      {children}
    </div>
  );
}

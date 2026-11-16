// "An agent is working": opencode's Soft Radar. The spinner itself is
// anomalyco/opencode packages/ui/src/components/spinner.tsx, ported in
// design/opencode/RadarSpinner.tsx (unchanged here); its states are
// design/opencode/micro.css. `Radar` names what every caller wrote by hand:
// its size (opencode draws it at 16px in a header, 12px on a chip), its ink,
// and whether it says anything. The pieces already built on it are re-exported
// here so a screen imports them from the kit:
//
//   RadarImage        components/agents/RadarImage.tsx, the radar as one shared <img> for grids
//   WorkingIndicator  design/opencode/WorkingIndicator.tsx, the radar in a header, collapsing out
//   ProgressIndicator design/opencode/WorkingIndicator.tsx, opencode's 16px activity spinner
//
// Non-agent waiting (saving, loading) is t3code's Spinner (./spinner.tsx), never the radar.

import { cva, type VariantProps } from "class-variance-authority";

import { RadarSpinner } from "../../design/opencode/RadarSpinner";
import { cn } from "../../lib/utils";

export const radarVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-3",
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
      xl: "size-6",
      /** On a plate: the style read's radar (components/style/StyleReading.tsx). */
      "2xl": "size-11",
      /** Drawn large in a dialog: the company read on the Company page. */
      "3xl": "size-22",
      /** Drawn large, the whole of a waiting scene: the company read's in first run (components/company/StudyParts.tsx). */
      hero: "size-28",
    },
    tone: {
      /** The text's own ink. */
      current: "",
      /** opencode's muted icon ink: the default beside words. */
      muted: "text-muted-foreground",
      /** Standing on the sky. */
      sky: "text-sky-ink",
      /** On a dark chip over a live frame. */
      inverse: "text-white/90",
      /** Lanes' live hue (a StatusDot's `live`). */
      live: "text-soft-sky",
    },
  },
  defaultVariants: { size: "md", tone: "muted" },
});

type RadarProps = VariantProps<typeof radarVariants> & {
  /** Spoken: "Working", "Finding people". Without it the radar is decoration beside words that say it. */
  label?: string;
  /** Stands on a raised plate, bigger than a spinner (the style read's). */
  plate?: boolean;
  className?: string;
};

/** opencode's Soft Radar, for agent work. */
export function Radar({ size, tone, label, plate = false, className }: RadarProps) {
  const radar = (
    <RadarSpinner
      // Not opencode's "spinner": its unlayered 18px width (micro.css) would beat the size here.
      // The dots keep their rules, which hang off data-slot="spinner-dots".
      data-component="radar"
      className={cn(radarVariants({ size, tone }), !plate && className)}
      {...(label && !plate ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
    />
  );
  if (!plate) return radar;
  return (
    <span
      data-slot="radar-plate"
      className={cn("relative grid size-19 shrink-0 place-items-center rounded-panel bg-card shadow-raised", className)}
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
    >
      {radar}
    </span>
  );
}

export { RadarSpinner };
export { RadarImage, radarUrl } from "../agents/RadarImage";
export { ProgressIndicator, WorkingIndicator, usePresence } from "../../design/opencode/WorkingIndicator";

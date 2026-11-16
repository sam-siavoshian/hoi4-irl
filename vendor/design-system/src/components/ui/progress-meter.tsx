// A measured amount against its whole, as a thin bar. From Morrow's pool meter
// segment (sam-siavoshian/morrow web/src/components/pool/pool-meter.tsx, the
// owner's own repo): a rounded track in a lighter step of the fill's hue, the
// fill easing its width. Lanes drew it three times: the campaign meter
// (components/agents/ProgressMeter.tsx: a second, lighter segment after the
// fill for what is in flight, 2px apart, and the fill turning to success when
// the target is met), Plan & usage's credits and Sending's per-account bar
// (both a fill on `bg-fill`, coloured by how close to the limit). Changes: one
// component with `value`/`max`, `tone` for the fill (`auto` is the campaign
// meter's sky-then-success), and `size` (`edge` is the 2px line along an
// agent's frame foot, components/agents/AgentTile.tsx, square-ended, on a dark
// wash so it reads over any page). The fill eases on Zephium's page motion,
// and an `auto` meter that is met turns success as a sweep along the fill
// (design/motion/README.md rule 17), not a flash.

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../../lib/utils";
import { useKnobTravel } from "./motion";

export type MeterTone = "auto" | "sky" | "primary" | "success" | "warning" | "danger";

const FILL: Record<Exclude<MeterTone, "auto">, string> = {
  sky: "bg-soft-sky",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

export const progressMeterVariants = cva("relative flex w-full items-center overflow-hidden rounded-full", {
  variants: {
    size: {
      sm: "h-1",
      md: "h-1.5",
      /** Along a frame's foot (an agent's tile): 2px, square-ended. */
      edge: "h-0.5 rounded-none",
    },
  },
  defaultVariants: { size: "md" },
});

export type ProgressMeterProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof progressMeterVariants> & {
    /**
     * Where the fill starts (ARTESH's vendored copy): `start` (the default), or `center` for a balance:
     * `value` runs from -max to max and fills from the middle, right when positive and left when
     * negative, with a tick at the middle.
     */
    origin?: "start" | "center";
    /** How much is done. */
    value: number;
    /** The whole (a target, a limit). */
    max: number;
    /** Sent but not confirmed yet: a lighter segment after the fill (the campaign meter). */
    inFlight?: number;
    /** What it measures, read out with its numbers. Without it the bar is decoration beside words that say it. */
    label?: string;
    /** Spoken numbers; "3 of 10" by default. */
    valueText?: string;
    /** The fill. `auto`: sky, then success when the whole is met (the campaign meter). */
    tone?: MeterTone;
  };

export function ProgressMeter({
  value,
  max,
  inFlight = 0,
  label,
  valueText,
  tone = "auto",
  size,
  origin = "start",
  className,
  ...props
}: ProgressMeterProps) {
  if (origin === "center") {
    const share = max > 0 ? Math.min(1, Math.max(-1, value / max)) * 50 : 0;
    const left = share < 0 ? 50 + share : 50;
    const right = share > 0 ? 50 - share : 50;
    return (
      <span
        data-slot="progress-meter"
        data-origin="center"
        data-tone={tone}
        className={cn(progressMeterVariants({ size }), "bg-fill", className)}
        {...(label
          ? {
              role: "meter" as const,
              "aria-label": label,
              "aria-valuemin": -max,
              "aria-valuemax": max,
              "aria-valuenow": Math.min(max, Math.max(-max, value)),
              "aria-valuetext": valueText ?? String(value),
            }
          : { "aria-hidden": true as const })}
        {...props}
      >
        <span
          data-slot="progress-meter-fill"
          className={cn(
            "absolute inset-0 transition-[clip-path] duration-(--motion-page) ease-out motion-reduce:transition-none",
            tone === "auto" ? FILL.sky : FILL[tone],
          )}
          style={{ clipPath: `inset(0 ${right}% 0 ${left}%)` }}
        />
        <span data-slot="progress-meter-middle" className="absolute inset-y-0 left-1/2 w-px bg-foreground/40" />
      </span>
    );
  }
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const flying = max > 0 ? Math.min(1 - ratio, inFlight / max) : 0;
  const met = max > 0 && value >= max;
  // `auto`: the sky stays under the success that sweeps over it when the whole is met.
  const fill = tone === "auto" ? FILL.sky : FILL[tone];
  const sweep = useKnobTravel(met);
  // The fill's rounded end (none on the square `edge` line).
  const round = size === "edge" ? "" : " round var(--radius-capsule)";
  const track =
    size === "edge" ? "bg-black/10" : tone === "auto" ? (met ? "bg-success/18" : "bg-soft-sky/16") : "bg-fill";
  const spoken = label
    ? {
        role: "meter" as const,
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-valuenow": Math.min(value, max),
        "aria-valuetext": valueText ?? `${value} of ${max}${inFlight ? `, ${inFlight} sending now` : ""}`,
      }
    : { "aria-hidden": true as const };
  return (
    <span
      data-slot="progress-meter"
      data-met={met || undefined}
      data-tone={tone}
      className={cn(progressMeterVariants({ size }), track, className)}
      {...spoken}
      {...props}
    >
      {/* The fill and the flight span the whole track and are clipped to
          their share, so they grow on clip-path (painted, never laid out
          again) rather than on width (design/motion/QA.md, M10). */}
      <span
        data-slot="progress-meter-fill"
        className={cn(
          "absolute inset-0 overflow-hidden transition-[clip-path] duration-(--motion-page) ease-out motion-reduce:transition-none",
          fill,
        )}
        style={{ clipPath: `inset(0 ${(1 - ratio) * 100}% 0 0${round})` }}
      >
        {tone === "auto" && met ? (
          <span
            data-slot="progress-meter-met"
            className={cn("motion-sweep absolute inset-0", FILL.success)}
            data-sweep={sweep}
          />
        ) : null}
      </span>
      {flying > 0 ? (
        <span
          data-slot="progress-meter-flight"
          className="absolute inset-0 bg-soft-sky/40 transition-[clip-path] duration-(--motion-page) ease-out motion-reduce:transition-none"
          style={{ clipPath: `inset(0 ${(1 - ratio - flying) * 100}% 0 calc(${ratio * 100}% + 2px)${round})` }}
        />
      ) : null}
    </span>
  );
}

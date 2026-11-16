// A state at a glance. The dot is opencode's 7px status dot as Morrow draws it
// (sam-siavoshian/morrow web/src/components/ui/status-dot.tsx, here
// design/morrow/StatusDot.tsx: `StatusDot`, and `StatusSlot`, opencode's tab
// trick where the status gives way to a close button on hover), re-exported
// unchanged. `StatusLabel` is the dot with its word, as the Agents window and
// Overview draw a state (components/agents/StateBadge.tsx `StateBadge`): live
// pulses, attention pings, and the colour never says it alone. Its `caption`
// variant is a screen header's status (Overview's "Live", Connections'
// "Email goes out from …"); `inline` is the same pair inside a line that
// already has its ink and size (Connections' account rows).

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { StatusDot, StatusSlot, type StatusTone } from "../../design/morrow/StatusDot";
import { cn } from "../../lib/utils";
import { Swap } from "./motion";

export const statusLabelVariants = cva("inline-flex items-center gap-1.5", {
  variants: {
    variant: {
      /** StateBadge: a small medium-weight word in the muted ink. */
      badge: "text-xs font-medium text-muted-foreground",
      /** A screen header's status beside its title ("Live", "Email goes out from …"): small, regular, muted. */
      caption: "text-xs text-muted-foreground",
      /** Inside a line that already sets the ink and size. */
      inline: "",
    },
  },
  defaultVariants: { variant: "badge" },
});

type StatusLabelProps = Omit<ComponentProps<"span">, "children"> &
  VariantProps<typeof statusLabelVariants> & {
    tone: StatusTone;
    /** The word that says it (colour never says it alone). */
    children: ReactNode;
    /** Pulse and ping follow the tone (live pulses, attention pings); `false` keeps the dot still. */
    animate?: boolean;
  };

/** A state in a word with its dot. A new state's word replaces the old one in place (Swap, design/motion/README.md rule 16). */
export function StatusLabel({ tone, variant, children, animate = true, className, ...props }: StatusLabelProps) {
  return (
    <span
      data-slot="status-label"
      data-tone={tone}
      className={cn(statusLabelVariants({ variant }), className)}
      {...props}
    >
      <StatusDot tone={tone} pulse={animate && tone === "live"} ping={animate && tone === "attention"} />
      <Swap value={tone ?? ""}>{children}</Swap>
    </span>
  );
}

export { StatusDot, StatusSlot, type StatusTone };

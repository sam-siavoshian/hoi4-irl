// Surfaces: a card on the page, glass over what is behind it, glass on the sky.
// From sam-siavoshian/morrow web/src/components/ui/card.tsx (the owner's own
// repo): `Card` with surface, radius and padding variants, `GlassPanel` (a
// Card that floats: glass, panel radius, room inside), the frost variant that
// lays the pre-blurred sky under the panel. The glass recipes are Zephium's
// (design/zephium/material.css, `sky-glass` in design/morrow/effects.css) and
// t3code's (`surface-glass`, design/t3code/theme.css).
// Changes: Morrow's token names become this app's (`text-text` is
// `text-foreground`, Morrow's `shadow-hairline` is the `hairline` utility,
// its `shadow-row-rim` inset is `bg-fill`); `solid` is the card Overview and the
// Agents window draw, `bg-card shadow-raised` (they wrote `hairline` beside it,
// which, emitted after, replaced the drop with a bare rim: Morrow never pairs
// them, docs/design-audit/morrow.md #5) and Morrow's own solid is `surface`;
// `raised` is Zephium's translucent card (the writing style's panel); `outline` is t3code's settings group; the padding steps are
// this app's (p-3, p-4, p-5, p-7), and `responsive` is Overview's (p-4, p-5
// from sm); `lift` is the Agents window's hover (raised to float on Zephium's
// fast curve); `ring="attention"` rims a card that needs the owner (Overview's
// "Needs you"); `as` picks the element. `CardButton` is a whole card that is
// one press (an agent's tile, the Agents window's campaign totals, a chat
// campaign card's body): the card's look on a <button>, with the focus ring.

import { cva, type VariantProps } from "class-variance-authority";
import { createElement, type ComponentProps, type ElementType } from "react";

import { Frost } from "../../design/morrow/Sky";
import { cn } from "../../lib/utils";

// The ink is inherited (Morrow sets `text-text`): a card reads in the page's own foreground.
export const cardVariants = cva("relative isolate", {
  variants: {
    variant: {
      /** The card on the page: raised; the raised shadow carries its own 0.5px rim (Overview, the Agents window's tiles). */
      solid: "bg-card shadow-raised",
      /** Zephium's card on a surface or on glass: its translucent card fill, raised (onboarding Models.svelte's option). */
      raised: "bg-(--color-card) shadow-raised",
      /** Morrow's plain raised surface. */
      surface: "bg-surface shadow-raised",
      /** Recessed into the page, for grouping. */
      inset: "bg-fill",
      /** t3code's settings group: a quiet bordered box. */
      outline: "border border-border/60 bg-card/40 shadow-xs/5",
      /** Translucent glass over whatever is behind (t3code's surface-glass). */
      glass: "surface-glass shadow-raised",
      /** Glass floating over the live sky (Zephium). */
      sky: "sky-glass text-foreground",
      /** The sky pre-blurred under a panel: glass with no runtime blur. */
      frost: "overflow-hidden hairline",
      /** Zephium's menu glass, for a floating card (the update banner). */
      menu: "glass-menu text-foreground",
      /** A warning that wants an answer (Overview's "Needs you"). */
      attention: "bg-warning/10",
      /** No surface of its own: a pressable region inside another card. */
      bare: "",
    },
    radius: {
      none: "rounded-none",
      row: "rounded-row",
      card: "rounded-card",
      panel: "rounded-panel",
      xl: "rounded-xl",
    },
    padding: {
      none: "",
      sm: "p-3",
      /** The Agents window's campaign totals: p-3.5. */
      snug: "p-3.5",
      md: "p-4",
      lg: "p-5",
      xl: "p-7",
      /** Overview's campaign card: p-4, p-5 from sm. */
      responsive: "p-4 sm:p-5",
    },
    /** A rim that says the card needs something (Overview's "Needs you"). */
    ring: {
      none: "",
      attention: "ring-1 ring-warning/40",
    },
    /** Lifts on hover, raised to float (the Agents window's tiles and totals). */
    lift: {
      false: "",
      true: "transition-[translate,box-shadow] duration-(--motion-fast) ease-out hover:-translate-y-px hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    },
  },
  defaultVariants: { variant: "solid", radius: "card", padding: "md", lift: false, ring: "none" },
});

export type CardProps = ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    /** The element: a `section`, an `article`, a `li`. */
    as?: ElementType;
  };

export function Card({ variant, radius, padding, lift, ring, as = "div", className, children, ...props }: CardProps) {
  return createElement(
    as,
    {
      "data-slot": "card",
      "data-variant": variant ?? "solid",
      className: cn(cardVariants({ variant, radius, padding, lift, ring }), className),
      ...props,
    },
    variant === "frost" ? <Frost /> : null,
    children,
  );
}

export type CardButtonProps = Omit<ComponentProps<"button">, "type"> & VariantProps<typeof cardVariants>;

/** A whole card that is one press: the card's look on a <button>, text from the start, the ring on focus. */
export function CardButton({ variant, radius, padding, lift, ring, className, children, ...props }: CardButtonProps) {
  return (
    <button
      type="button"
      data-slot="card"
      data-variant={variant ?? "solid"}
      className={cn(
        cardVariants({ variant, radius, padding, lift, ring }),
        // A whole card presses (design/motion/README.md rule 4); a bare press inside another card answers with
        // its fill, since the card around it stays still.
        variant !== "bare" && "pressable",
        "block w-full cursor-pointer text-start text-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {variant === "frost" ? <Frost /> : null}
      {children}
    </button>
  );
}

/** A Card that floats: glass by default, panel radius, room inside (Morrow). */
export function GlassPanel({ variant = "glass", radius = "panel", padding = "lg", ...props }: CardProps) {
  return <Card variant={variant} radius={radius} padding={padding} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold tracking-[-0.016em] text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mt-1 text-sm leading-normal text-pretty text-muted-foreground", className)} {...props} />;
}

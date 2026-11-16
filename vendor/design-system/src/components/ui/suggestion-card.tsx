// An idea on the sky: a card of liquid glass that is one press. The chat's
// main page shows what Lanes can do for the owner as a grid of these (an icon
// in a tinted well, the title, one line, the channel's mark), and a press
// starts it; one that needs something first says so at its foot ("Connect X
// first") and leads there instead.
//
// The glass is the sky's own sheet (Zephium's `--sky-card*` tokens, the
// `sky-glass` recipe in design/morrow/effects.css) made liquid: thinner, with
// the sky kept in colour behind it, a sheen falling from the top edge, a rim
// that catches the light at the top-left and the bottom-right, and a soft
// highlight that follows the pointer across it. It lifts under the pointer
// and presses in at 0.98 on Zephium's press curve (the kit's Button), and the
// cards arrive one after another as the writing style's sample cards do
// (./choice-cards.css). The rules are in ./suggestion-card.css.
//
//   SuggestionCard          the card: a <button>
//   SuggestionCardSkeleton  its shape while the ideas load
//   FeatureCard             the same glass, read rather than pressed: one
//                           thing Lanes does (first run's "Here's what Lanes
//                           does", Settings' help), an <article>
//   SuggestionGrid          the grid they stand in: one column on a phone,
//                           sideways cards; two, then three, as the column
//                           widens (two again for exactly 4)
//
// Ours (Lanes); nothing here is copied.

import { cva, type VariantProps } from "class-variance-authority";
import {
  Children,
  isValidElement,
  type ComponentProps,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useId,
} from "react";

import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

import "./suggestion-card.css";

export const suggestionWellVariants = cva("suggestion-card-well", {
  variants: {
    /**
     * The well's hue: Zephium's soft hues and their inks (design/zephium/tokens.css), the hue
     * laid over the glass rather than over the page (the `-wash` tokens mix it into the page's
     * surface, which at night is the glass's own navy and reads as grey).
     */
    tone: {
      sky: "bg-soft-sky/20 text-soft-sky-ink",
      lilac: "bg-soft-lilac/20 text-soft-lilac-ink",
      peach: "bg-soft-peach/20 text-soft-peach-ink",
      mint: "bg-soft-mint/20 text-soft-mint-ink",
      neutral: "bg-fill text-foreground",
    },
  },
  defaultVariants: { tone: "sky" },
});

export type SuggestionTone = NonNullable<VariantProps<typeof suggestionWellVariants>["tone"]>;

export type SuggestionCardProps = Omit<ComponentProps<"button">, "type" | "title"> &
  VariantProps<typeof suggestionWellVariants> & {
    /** A lucide icon element: what the idea is about. */
    icon: ReactNode;
    /** A few words, the number in them: "50 DMs to fintech founders". */
    title: ReactNode;
    /** One sentence on what happens. */
    line: ReactNode;
    /** The channel's mark, top right: a `LogoTile variant="mark"`. */
    mark?: ReactNode;
    /** The channel, said to a screen reader with the card ("On X."). */
    markLabel?: string;
    /** What comes first, at the foot, when the press leads there: "Connect X first". */
    note?: ReactNode;
    /** Its place in the grid, for the arrival's stagger. */
    index?: number;
  };

/** Where the pointer is, as the highlight's centre. */
function trackPointer(event: PointerEvent<HTMLButtonElement>) {
  const node = event.currentTarget;
  const box = node.getBoundingClientRect();
  if (!box.width || !box.height) return;
  node.style.setProperty("--spot-x", `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
  node.style.setProperty("--spot-y", `${(((event.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
}

/** One idea, one press: liquid glass on the sky. */
export function SuggestionCard({
  icon,
  title,
  line,
  mark,
  markLabel,
  note,
  tone,
  index = 0,
  className,
  style,
  onPointerMove,
  ...props
}: SuggestionCardProps) {
  const id = useId();
  const described = [markLabel ? `${id}-mark` : null, `${id}-line`, note ? `${id}-note` : null].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      data-slot="suggestion-card"
      data-needs={note ? "" : undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={described}
      className={cn("suggestion-card", className)}
      style={{ "--i": index, ...style } as CSSProperties}
      onPointerMove={(event) => {
        trackPointer(event);
        onPointerMove?.(event);
      }}
      {...props}
    >
      <span className="suggestion-card-head">
        <span aria-hidden className={suggestionWellVariants({ tone })}>
          {icon}
        </span>
        {mark ? (
          <span aria-hidden className="suggestion-card-mark">
            {mark}
          </span>
        ) : null}
      </span>
      <span className="suggestion-card-body">
        <span id={`${id}-title`} data-slot="suggestion-card-title" className="suggestion-card-title">
          {title}
        </span>
        <span id={`${id}-line`} data-slot="suggestion-card-line" className="suggestion-card-line">
          {line}
        </span>
        {markLabel ? (
          <span id={`${id}-mark`} className="sr-only">
            {`On ${markLabel}.`}
          </span>
        ) : null}
      </span>
      {note ? (
        <span id={`${id}-note`} data-slot="suggestion-card-note" className="suggestion-card-note">
          {note}
        </span>
      ) : null}
    </button>
  );
}

export type FeatureCardProps = Omit<ComponentProps<"article">, "title"> &
  VariantProps<typeof suggestionWellVariants> & {
    /** A lucide icon element. */
    icon: ReactNode;
    /** A few words: "Writes as you". */
    title: ReactNode;
    /** One sentence on what happens. */
    line: ReactNode;
    /** Its place in the grid, for the arrival's stagger. */
    index?: number;
    /** The title's heading level, so it sits in the page's outline. */
    level?: 2 | 3 | 4;
  };

/** One thing Lanes does, on the sky: an idea card's glass, with nothing to press. */
export function FeatureCard({ icon, title, line, tone, index = 0, level = 3, className, style, ...props }: FeatureCardProps) {
  const id = useId();
  const Heading = `h${level}` as const;
  return (
    <article
      data-slot="feature-card"
      data-static=""
      aria-labelledby={`${id}-title`}
      className={cn("suggestion-card", className)}
      style={{ "--i": index, ...style } as CSSProperties}
      {...props}
    >
      <span className="suggestion-card-head">
        <span aria-hidden className={suggestionWellVariants({ tone })}>
          {icon}
        </span>
      </span>
      <span className="suggestion-card-body">
        <Heading id={`${id}-title`} data-slot="feature-card-title" className="suggestion-card-title">
          {title}
        </Heading>
        <span data-slot="feature-card-line" className="suggestion-card-line">
          {line}
        </span>
      </span>
    </article>
  );
}

/** A card's shape while the ideas load. */
export function SuggestionCardSkeleton({ index = 0, className }: { index?: number; className?: string }) {
  return (
    <div
      aria-hidden
      data-slot="suggestion-card-skeleton"
      className={cn("suggestion-card", className)}
      data-skeleton=""
      style={{ "--i": index } as CSSProperties}
    >
      <span className="suggestion-card-head">
        <Skeleton className="suggestion-card-well" />
      </span>
      <span className="suggestion-card-body">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="mt-1 h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </span>
    </div>
  );
}

export type SuggestionGridProps = Omit<ComponentProps<"div">, "children"> & {
  /** One card each: SuggestionCard or SuggestionCardSkeleton. */
  children: ReactNode;
  /** The group's name, read before the cards. */
  label?: string;
  /** The heading over the grid, on the sky: "Ideas for Acme". */
  heading?: ReactNode;
  /** While skeletons stand in. */
  busy?: boolean;
};

/** The grid ideas stand in, sized by its own width (a container), not the window's. */
export function SuggestionGrid({ children, label, heading, busy = false, className, ...props }: SuggestionGridProps) {
  const id = useId();
  const items = Children.toArray(children);
  return (
    <div data-slot="suggestion-grid" className={cn("suggestion-grid", className)} {...props}>
      {heading ? (
        <div id={`${id}-heading`} data-slot="suggestion-grid-heading" className="suggestion-grid-heading">
          {heading}
        </div>
      ) : null}
      <ul
        className="suggestion-grid-track"
        data-count={items.length}
        aria-busy={busy || undefined}
        {...(heading ? { "aria-labelledby": `${id}-heading` } : label ? { "aria-label": label } : {})}
      >
        {items.map((item, at) => (
          <li key={isValidElement(item) && item.key !== null ? item.key : at} className="flex min-w-0">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

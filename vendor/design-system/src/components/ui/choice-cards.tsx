// A choice drawn as cards, each with a picture of what it does: a radiogroup
// whose options are tiles (Zephium's option cards, onboarding Models.svelte:
// the card is how it looks, the radio is the control). Moved here from
// Settings' Appearance (screens/settings/sections/AppearanceSettings.tsx
// `ThemeCards`, after the old window's theme cards), unchanged: a raised
// preview in a hairline frame, the label and a line under it, the chosen card
// on `bg-fill` with a 2px ring in the lit ink, arrow keys moving the choice.
// `ThemePreview` is that screen's picture of a page in one theme, drawn from
// Zephium's raw greys (design/zephium/primitive.css), since the semantic
// tokens are the window's current theme and cannot show the other one.
//
// Two more looks, moved here from the writing style (components/style/,
// StyleChooser.tsx and PresetPicker.tsx, and style.css):
//
//   sample  a card that plays what it chooses: its name and a tick, who it
//           suits, a quoted taste of it and a few tags. Raised, it lifts and
//           glows under the pointer, presses in, and rings and ticks when
//           chosen; five across where there is room, three in a narrower
//           column, and one and a bit at a time, sideways, on a phone.
//           `onPoint` hears the card pointed at (hover or focus), `onUse` an
//           Enter on one. `columns` sets 2 or 4 across instead, for a choice
//           of that many (how you sound on X: who's talking, the tone); four
//           go two across in a narrow column.
//   chips   a row of capsules, the chosen one lit (the style's "switch to"
//           row, the Gmail to read from). `size="lg"`: big capsules a thumb
//           finds.
//   tiles   a grid of small cards, an icon and a few words each, three
//           across and two on a phone, on the style cards' surface; the
//           chosen one tinted, ringed and ticked (About you). As on chips,
//           the arrows only move the focus: Space or Enter picks.
//
// And two for a look, after the theme cards' ring (Make your pal):
//
//   thumbs    small tiles in a row, a picture each and its name under it,
//             the chosen one raised and ringed (the pal's shape, eyes, face).
//   swatches  round paints in a row, the name under each, the chosen one
//             ringed (the pal's colour). `swatch` is the paint.
//
// `onClear` makes the choice optional: pressing the chosen option again
// clears it (About you, where every answer can be left out).
//
// `ChoiceToggles` is the chips' look (or the tiles', `variant="tiles"`) for
// picking several: a group of toggles, each pressed or not (`aria-pressed`),
// each its own tab stop.
//
// Every variant is a radio group: one tab stop (the chosen card, or the
// first), the arrow keys and Home and End move the choice, which follows
// focus (on chips, only the focus: Space or Enter picks).

import { CheckIcon } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, type ReactNode, useId, useRef } from "react";

import { cn } from "../../lib/utils";
import { SegmentThumb } from "./segmented";

import "./choice-cards.css";

export interface ChoiceCard<T extends string> {
  value: T;
  label: string;
  /** A line under the label (`sample`: who it suits, read as the card's description). */
  sub?: string;
  /** The picture: a ThemePreview, a screenshot (`preview`). */
  preview?: ReactNode;
  /** `sample`: a taste of it, quoted: the first line bold, the rest under it. */
  quote?: readonly string[];
  /** `sample`: a few words for what you'd notice, a tag each. */
  tags?: readonly string[];
  /** `chips`: an icon before the label. `tiles`: the icon in its well (a lucide icon). */
  icon?: ReactNode;
  /** `swatches`: the paint, a CSS colour from the design system (design/agents.ts FACE_PAINTS). */
  swatch?: string;
  /** Data attributes for the option's button (`{ "data-preset": "formal" }`). */
  data?: Record<`data-${string}`, string>;
}

const MOVES: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export function ChoiceCards<T extends string>({
  label,
  value,
  options,
  onChange,
  onPoint,
  onUse,
  variant = "preview",
  columns,
  size = "md",
  onClear,
  disabled = false,
  className,
  ...rest
}: {
  /** The group's spoken name. */
  label: string;
  /** The chosen one, or null while nothing is. */
  value: T | null;
  options: readonly ChoiceCard<T>[];
  onChange: (value: T) => void;
  /** The option pointed at (hovered or focused), or null when the pointer leaves. */
  onPoint?: (value: T | null) => void;
  /** Enter on an option: choose it and go on with it. */
  onUse?: (value: T) => void;
  /** `preview` (a picture per option), `sample` (a card that plays it), `chips` (capsules in a row),
   *  `tiles` (a grid of cards, an icon each), `thumbs` (small tiles, a picture each), `swatches` (round paints). */
  variant?: "preview" | "sample" | "chips" | "tiles" | "thumbs" | "swatches";
  /** `chips`: `md` (28px), `lg` (40px, a big target). `tiles`: `md` (40px), `lg` (44px, first run). */
  size?: "md" | "lg";
  /** Pressing the chosen option again clears the choice: an optional question. */
  onClear?: () => void;
  /** How many across: `preview` (3 when left out), `sample` (2 or 4; five, or three in a narrow column, when left out). */
  columns?: 2 | 3 | 4;
  disabled?: boolean;
  className?: string;
} & Record<`data-${string}`, string | undefined>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const group = useId();
  const chosen = options.findIndex((option) => option.value === value);
  // One tab stop: the chosen option, or the first.
  const stop = Math.max(0, chosen);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    // Chips switch something already on the page (the style), and tiles answer an optional question
    // whose answer a second press takes back, so the arrows only move between them; Space or Enter
    // picks. Elsewhere the choice follows focus, as a radio group's does.
    if (variant !== "chips" && variant !== "tiles") onChange(option.value);
    const button = buttons.current[index];
    button?.focus();
    button?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
  };

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const count = options.length;
    if (event.key in MOVES) {
      event.preventDefault();
      choose((index + MOVES[event.key]! + count) % count);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      choose(event.key === "Home" ? 0 : count - 1);
    } else if (event.key === "Enter" && onUse) {
      event.preventDefault();
      const option = options[index]!;
      onChange(option.value);
      onUse(option.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-slot="choice-cards"
      data-variant={variant}
      data-columns={variant === "sample" && columns ? columns : undefined}
      data-size={variant === "chips" || variant === "tiles" ? size : undefined}
      className={cn(
        variant === "preview" && "grid gap-3",
        variant === "preview" && (columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-4" : "grid-cols-3"),
        variant === "chips" && (size === "lg" ? "motion-segments flex flex-wrap gap-2" : "motion-segments flex flex-wrap gap-1.5"),
        (variant === "thumbs" || variant === "swatches") && "flex flex-wrap gap-1.5",
        className,
      )}
      onMouseLeave={onPoint ? () => onPoint(null) : undefined}
      {...rest}
    >
      {options.map((option, at) => {
        const on = option.value === value;
        const describedBy = variant === "sample" && option.sub ? `choice-${option.value}-sub` : undefined;
        return (
          <button
            key={option.value}
            ref={(node) => {
              buttons.current[at] = node;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={variant === "preview" || variant === "swatches" ? option.label : undefined}
            aria-describedby={describedBy}
            tabIndex={at === stop ? 0 : -1}
            disabled={disabled}
            data-choice={option.value}
            data-size={variant === "tiles" ? size : undefined}
            {...option.data}
            style={variant === "sample" || variant === "tiles" ? ({ "--i": at } as CSSProperties) : undefined}
            onClick={() => (on && onClear ? onClear() : onChange(option.value))}
            onMouseEnter={onPoint ? () => onPoint(option.value) : undefined}
            onFocus={onPoint ? () => onPoint(option.value) : undefined}
            onBlur={onPoint ? () => onPoint(null) : undefined}
            onKeyDown={onKeyDown(at)}
            className={cn(
              variant === "preview" &&
                "group flex cursor-pointer flex-col gap-2 rounded-card p-1.5 text-left outline-none transition-[box-shadow,background-color] duration-(--motion-fast) ease-out focus-visible:ring-2 focus-visible:ring-ring",
              variant === "preview" && (on ? "bg-fill shadow-[0_0_0_2px_var(--primary)]" : "hover:bg-fill"),
              variant === "sample" && "choice-sample",
              variant === "chips" &&
                "pressable relative isolate inline-flex max-w-full min-w-0 cursor-pointer items-center rounded-capsule font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
              variant === "chips" &&
                (size === "lg" ? "h-10 gap-2 px-4 text-body [&_svg]:size-4" : "h-7 gap-1.5 px-3 text-label [&_svg]:size-3.5"),
              variant === "tiles" && "choice-tile",
              variant === "thumbs" && "choice-thumb",
              variant === "swatches" && "choice-swatch",
              variant === "chips" &&
                (on ? "text-background" : "bg-fill text-foreground/85 hover:bg-fill-hover hover:text-foreground"),
            )}
          >
            {variant === "preview" ? (
              <>
                <span className="flex aspect-[16/10] w-full overflow-hidden rounded-[10px] border border-border/60 shadow-raised transition-transform duration-(--motion-press) ease-out group-active:scale-(--press-scale) group-active:duration-0">
                  {option.preview}
                </span>
                <span className="flex flex-col px-1 pb-0.5">
                  <span className="text-sm font-medium text-foreground">{option.label}</span>
                  {option.sub ? <span className="text-xs text-muted-foreground">{option.sub}</span> : null}
                </span>
              </>
            ) : variant === "sample" ? (
              <>
                <span className="flex items-start justify-between gap-2">
                  <span data-slot="choice-sample-title">{option.label}</span>
                  <span data-slot="choice-sample-radio" aria-hidden="true">
                    {on ? <CheckIcon className="motion-appear" strokeWidth={3.25} /> : null}
                  </span>
                </span>
                {option.sub ? (
                  <span id={describedBy} data-slot="choice-sample-sub">
                    {option.sub}
                  </span>
                ) : null}
                {option.quote?.length ? (
                  <span data-slot="choice-sample-quote" data-style-card-preview="">
                    {option.quote.map((line, index) => (
                      <span key={index}>{line}</span>
                    ))}
                  </span>
                ) : null}
                {option.tags?.length ? (
                  <span data-slot="choice-sample-tags">
                    {option.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </span>
                ) : null}
              </>
            ) : variant === "tiles" ? (
              <TileFace icon={option.icon} label={option.label} on={on} />
            ) : variant === "thumbs" ? (
              <>
                <span data-slot="choice-thumb-picture" aria-hidden="true">
                  {option.preview}
                </span>
                <span data-slot="choice-thumb-label">{option.label}</span>
              </>
            ) : variant === "swatches" ? (
              <>
                <span
                  data-slot="choice-swatch-paint"
                  aria-hidden="true"
                  style={option.swatch ? ({ "--swatch": option.swatch } as CSSProperties) : undefined}
                />
                <span data-slot="choice-swatch-label" aria-hidden="true">
                  {option.label}
                </span>
              </>
            ) : (
              <>
                {on ? <SegmentThumb group={group} tone="ink" /> : null}
                {option.icon}
                <span className="truncate">{option.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** A tile's insides: the icon in its well, the tick on the well's corner (shown once chosen), the words. */
function TileFace({ icon, label, on }: { icon: ReactNode; label: string; on: boolean }) {
  return (
    <>
      <span data-slot="choice-tile-icon" aria-hidden="true">
        {icon}
        {on ? (
          <span data-slot="choice-tile-tick" className="motion-appear">
            <CheckIcon strokeWidth={3.5} />
          </span>
        ) : null}
      </span>
      <span data-slot="choice-tile-label">{label}</span>
    </>
  );
}

/**
 * Several of a few short answers, as ChoiceCards' chips (or its tiles, `variant="tiles"`): each a toggle,
 * pressed or not, and its own tab stop (Space or Enter flips it). The chosen chips are lit, with a tick
 * before the words; the chosen tiles tinted, ringed and ticked. `size` as the chips' or the tiles'.
 */
export function ChoiceToggles<T extends string>({
  label,
  values,
  options,
  onChange,
  variant = "chips",
  size = "md",
  disabled = false,
  className,
  ...rest
}: {
  /** The group's spoken name. */
  label: string;
  /** `chips` (capsules in a row) or `tiles` (a grid of cards, an icon each). */
  variant?: "chips" | "tiles";
  /** The ones chosen, in any order. */
  values: readonly T[];
  options: readonly Pick<ChoiceCard<T>, "value" | "label" | "icon" | "data">[];
  /** Every value chosen after the press, in the options' order. */
  onChange: (values: T[]) => void;
  size?: "md" | "lg";
  disabled?: boolean;
  className?: string;
} & Record<`data-${string}`, string | undefined>) {
  const flip = (value: T) => {
    const next = values.includes(value) ? values.filter((one) => one !== value) : [...values, value];
    onChange(options.map((option) => option.value).filter((one) => next.includes(one)));
  };
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="choice-toggles"
      data-variant={variant}
      data-size={size}
      className={cn(variant === "chips" && "flex flex-wrap", variant === "chips" && (size === "lg" ? "gap-2" : "gap-1.5"), className)}
      {...rest}
    >
      {options.map((option, at) => {
        const on = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            data-choice={option.value}
            data-size={variant === "tiles" ? size : undefined}
            {...option.data}
            style={variant === "tiles" ? ({ "--i": at } as CSSProperties) : undefined}
            onClick={() => flip(option.value)}
            className={cn(
              variant === "tiles" && "choice-tile",
              variant === "chips" &&
                "pressable inline-flex max-w-full cursor-pointer items-center truncate rounded-capsule font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
              variant === "chips" &&
                (size === "lg" ? "h-10 gap-2 px-4 text-body [&_svg]:size-4" : "h-7 gap-1.5 px-3 text-label [&_svg]:size-3.5"),
              variant === "chips" &&
                (on ? "bg-foreground text-background" : "bg-fill text-foreground/85 hover:bg-fill-hover hover:text-foreground"),
            )}
          >
            {variant === "tiles" ? (
              <TileFace icon={option.icon} label={option.label} on={on} />
            ) : (
              <>
                {on ? <CheckIcon strokeWidth={3} aria-hidden="true" /> : option.icon}
                <span className="truncate">{option.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

const PAGE = {
  light: { page: "bg-(--gray-50)", rail: "bg-(--gray-150)", title: "bg-(--gray-700)", line: "bg-(--gray-300)" },
  dark: { page: "bg-(--gray-850)", rail: "bg-(--gray-750)", title: "bg-(--gray-100)", line: "bg-(--gray-600)" },
} as const;

/** A page in one theme: a rail and three lines (Appearance's theme cards). */
export function ThemePreview({ theme }: { theme: "light" | "dark" }) {
  const ink = PAGE[theme];
  return (
    <span aria-hidden data-preview={theme} className={cn("flex h-full min-w-0 flex-1 gap-1 p-1.5", ink.page)}>
      <span className={cn("w-3 shrink-0 rounded-[3px]", ink.rail)} />
      <span className="flex flex-1 flex-col gap-1 pt-0.5">
        <span className={cn("h-1.5 w-3/4 rounded-full", ink.title)} />
        <span className={cn("h-1 w-full rounded-full", ink.line)} />
        <span className={cn("h-1 w-2/3 rounded-full", ink.line)} />
      </span>
    </span>
  );
}

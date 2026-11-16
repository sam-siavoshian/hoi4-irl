// A small labelled thing that can be taken away: a filter in force, a piece
// of context on a message. After pingdotgg/t3code apps/web/src/components/
// ContextChip.tsx (MIT, Copyright (c) T3 Tools Inc.; full notice in
// app/ui/THIRD_PARTY_NOTICES.md): an inline pill, ink from its tone's accent,
// the label truncating, and a remove button at its end. Two looks Lanes drew
// by hand:
//
//   filter  Leads' filter chips (components/leads/LeadsToolbar.tsx): a quiet
//           bordered tile on `bg-fill`, arriving on Zephium's menu curve
//   soft    the chat's context chips (components/chat/ContextChip.tsx): a
//           capsule in one of Zephium's soft hues
//
// For a count or a state that cannot be removed, use Badge.

import { XIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";

export const chipVariants = cva("inline-flex h-6 items-center text-xs", {
  variants: {
    variant: {
      filter: "motion-enter gap-1 rounded-md border border-border/70 bg-fill/60 ps-1.5 text-foreground",
      soft: "max-w-56 gap-1 rounded-full ps-2 font-medium",
    },
    tone: {
      neutral: "",
      sky: "",
      mint: "",
      lilac: "",
    },
    removable: { true: "", false: "" },
    /** A whole sentence: it wraps onto more lines instead of being cut short. */
    wrap: { true: "h-auto min-h-6 py-0.5 leading-snug", false: "" },
  },
  compoundVariants: [
    { variant: "filter", removable: true, className: "pe-0.5" },
    { variant: "filter", removable: false, className: "pe-1.5" },
    { variant: "soft", removable: true, className: "pe-0.5" },
    { variant: "soft", removable: false, className: "pe-2" },
    { variant: "soft", tone: "neutral", className: "bg-fill" },
    { variant: "soft", tone: "sky", className: "bg-soft-sky-wash text-soft-sky-ink" },
    { variant: "soft", tone: "mint", className: "bg-soft-mint-wash text-soft-mint-ink" },
    { variant: "soft", tone: "lilac", className: "bg-soft-lilac-wash text-soft-lilac-ink" },
    { variant: "soft", wrap: true, className: "max-w-full rounded-2xl" },
  ],
  defaultVariants: { variant: "filter", tone: "neutral", removable: false, wrap: false },
});

const REMOVE = {
  filter:
    "pressable flex size-4.5 items-center justify-center rounded-sm text-muted-foreground hover:bg-fill-hover hover:text-foreground",
  soft: "pressable inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-70 overlay-hover hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring",
} as const;

export type ChipProps = Omit<ComponentProps<"span">, "children"> &
  Omit<VariantProps<typeof chipVariants>, "removable"> & {
    /** The words; they truncate, unless `wrap`. */
    children: ReactNode;
    /** Before the words: a lucide icon. */
    icon?: ReactNode;
    /** Shows the remove button, which calls this. */
    onRemove?: () => void;
    /** The remove button's spoken name: "Remove the Replied filter". */
    removeLabel?: string;
  };

export function Chip({ variant, tone, wrap, icon, onRemove, removeLabel, className, children, ...props }: ChipProps) {
  const look = variant ?? "filter";
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ variant, tone, wrap, removable: Boolean(onRemove) }), className)}
      {...props}
    >
      {icon}
      <span className={wrap ? "min-w-0" : "min-w-0 truncate"}>{children}</span>
      {onRemove ? (
        <button type="button" aria-label={removeLabel ?? "Remove"} onClick={onRemove} className={REMOVE[look]}>
          <XIcon className="size-3" />
        </button>
      ) : null}
    </span>
  );
}
